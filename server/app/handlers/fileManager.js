/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path = require("path");
const fs = require("fs-extra");
const glob = require("glob");
const minimatch = require("minimatch");
const klaw = require("klaw");
const { zip } = require("zip-a-folder");
const isPathInside = require("is-path-inside");
const { gitAdd, gitRm, gitLFSTrack, gitLFSUntrack, isLFS } = require("../core/gitOperator2");
const { convertPathSep } = require("../core/pathUtils");
const { getUnusedPath, deliverFile } = require("../core/fileUtils.js");
const { escapeRegExp } = require("../lib/utility");
const fileBrowser = require("../core/fileBrowser");
const { getLogger } = require("../logSettings");
const { gitLFSSize, projectJsonFilename, componentJsonFilename, rootDir, remoteHost } = require("../db/db");
const { emitAll } = require("./commUtils.js");
const { getTempd, createTempd } = require("../core/tempd.js");
const {getSsh} = require("../core/sshManager.js");

const oldProjectJsonFilename = "swf.prj.json";
const noDotFiles = /^[^.].*$/;
const allFiles = /.*/;
const exceptSystemFiles = new RegExp(`^(?!^.*(${escapeRegExp(projectJsonFilename)}|${escapeRegExp(componentJsonFilename)}|.git.*)$).*$`);
const projectJsonFileOnly = new RegExp(`^.*(?:${escapeRegExp(projectJsonFilename)}|${escapeRegExp(oldProjectJsonFilename)})$`);

/**
 * getFileList event handler
 * @param {string} projectRootDir - project root dir path for logger
 * @param {Object} msg - option parameters
 * @param {string} msg.path - directory path to be read
 * @param {string} msg.mode - mode flag. it must be one of dir, dirWithProjectJson, underComponent, SND
 * @param {Function} cb - call back function
 */
const onGetFileList = async (projectRootDir, msg, cb)=>{
  const target = msg.path ? path.normalize(convertPathSep(msg.path)) : rootDir;
  const request = target;

  const sendFilename = msg.mode !== "dir";
  const SND = msg.mode === "underComponent"; //send serial numberd content as SND or not
  const allFilter = msg.mode === "dir" || msg.mode === "dirWithProjectJson" ? noDotFiles : allFiles;
  const filterTable = {
    dirWithProjectJson: projectJsonFileOnly,
    underComponent: exceptSystemFiles,
    sourceComponent: exceptSystemFiles,
    SND: exceptSystemFiles
  };
  const fileFilter = filterTable[msg.mode] || null;
  try {
    const result = await fileBrowser(target, {
      request,
      sendFilename,
      SND,
      filter: {
        all: allFilter,
        file: fileFilter,
        dir: null
      },
      withParentDir: false
    });
    return cb(result);
  } catch (e) {
    getLogger(projectRootDir).error(projectRootDir, "error occurred during reading directory", e);
    return cb(null);
  }
};

const onGetSNDContents = async (projectRootDir, requestDir, pattern, isDir, cb)=>{
  const modifiedRequestDir = path.normalize(convertPathSep(requestDir));
  getLogger(projectRootDir).debug(projectRootDir, "getSNDContents in", modifiedRequestDir);

  try {
    const result = await fileBrowser(modifiedRequestDir, {
      request: requestDir,
      SND: false,
      sendDirname: isDir,
      sendFilename: !isDir,
      filter: {
        all: minimatch.makeRe(pattern),
        file: exceptSystemFiles,
        dir: null
      }
    });
    return cb(result);
  } catch (e) {
    getLogger(projectRootDir).error(requestDir, "read failed", e);
    return cb(null);
  }
};

async function onCreateNewFile(projectRootDir, argFilename, cb) {
  const filename = convertPathSep(argFilename);

  try {
    await fs.writeFile(filename, "");

    if(isPathInside(filename, projectRootDir)){
      await gitAdd(projectRootDir, filename);
    }
  } catch (e) {
    getLogger(projectRootDir).error(projectRootDir, "create new file failed", e);
    cb(null);
    return;
  }
  cb({filename, parent:path.dirname(filename)});
}

async function onCreateNewDir(projectRootDir, argDirname, cb) {
  const dirname = convertPathSep(argDirname);

  try {
    await fs.mkdir(dirname);

    if(isPathInside(dirname, projectRootDir)){
      await fs.writeFile(path.resolve(dirname, ".gitkeep"), "");
      await gitAdd(projectRootDir, path.resolve(dirname, ".gitkeep"));
    }
  } catch (e) {
    getLogger(projectRootDir).error(projectRootDir, "create new directory failed", e);
    cb(null);
    return;
  }
  cb({dirname, parent: path.dirname(dirname)});
}

async function onRemoveFile(projectRootDir, target, cb) {
  try {
    if(isPathInside(target, projectRootDir)){
      await gitRm(projectRootDir, target);
    }
    await fs.remove(target);
  } catch (err) {
    getLogger(projectRootDir).warn(`removeFile failed: ${err}`);
    cb(false);
    return;
  }
  cb(true);
}
async function onRenameFile(projectRootDir, parentDir, argOldName, argNewName, cb) {
  const oldName = path.resolve(parentDir, argOldName);
  const newName = path.resolve(parentDir, argNewName);

  if (oldName === newName) {
    getLogger(projectRootDir).warn("rename to same file or directory name requested");
    cb(false);
    return;
  }

  if (await fs.pathExists(newName)) {
    getLogger(projectRootDir).error(newName, "is already exists");
    cb(false);
    return;
  }


  try {
    if(isPathInside(oldName, projectRootDir)){
      await gitRm(projectRootDir, oldName);
      const stats = await fs.stat(oldName);

      if (stats.isFile() && await isLFS(projectRootDir, oldName)) {
        await gitLFSUntrack(projectRootDir, oldName);
        await gitLFSTrack(projectRootDir, newName);
      } else {
        for await (const file of klaw(oldName)) {
          if (file.stats.isFile() && await isLFS(projectRootDir, file.path)) {
            await gitLFSUntrack(projectRootDir, file.path);
            const newAbsFilename = file.path.replace(oldName, newName);
            await gitLFSTrack(projectRootDir, newAbsFilename);
          }
        }
      }
    }
    await fs.move(oldName, newName);

    if(isPathInside(newName, projectRootDir)){
      await gitAdd(projectRootDir, newName);
    }
  } catch (e) {
    const err = typeof e === "string" ? new Error(e) : e;
    err.path = parentDir;
    err.oldName = oldName;
    err.newName = newName;
    getLogger(projectRootDir).error("rename failed", err);
    cb(false);
    return;
  }
  cb(true);
}

const onUploadFileSaved = async (event)=>{
  const projectRootDir = event.file.meta.projectRootDir;
  if (!event.file.success) {
    getLogger(projectRootDir).error("file upload failed", event.file.name);
    return;
  }
  const uploadDir = path.resolve(projectRootDir, event.file.meta.currentDir);
  const uploadClient = event.file.meta.clientID;
  const absFilename = event.file.meta.overwrite ? path.resolve(uploadDir, event.file.meta.orgName)
    : await getUnusedPath(uploadDir, event.file.meta.orgName);
  if (event.file.meta.overwrite) {
    await fs.remove(absFilename);
  }
  await fs.move(event.file.pathName, absFilename);
  const fileSizeMB = parseInt(event.file.size / 1024 / 1024, 10);
  getLogger(projectRootDir).info(`upload completed ${absFilename} [${fileSizeMB > 1 ? `${fileSizeMB} MB` : `${event.file.size} Byte`}]`);

  if (event.file.meta.skipGit || !isPathInside(absFilename, projectRootDir)) {
    getLogger(projectRootDir).debug("git add skipped", event.file.name);
  } else {
    if (fileSizeMB > gitLFSSize) {
      await gitLFSTrack(projectRootDir, absFilename);
    }
    await gitAdd(projectRootDir, absFilename);
  }
  if(event.file.meta.remotehost &&event.file.meta.remoteUploadPath){
    getLogger(projectRootDir).debug(`upload ${absFilename} to ${event.file.meta.remotehost}`);
    const id = remoteHost.getID("name", event.file.meta.remotehost );
    const ssh = await getSsh(projectRootDir, id);
    await ssh.send([absFilename], event.file.meta.remoteUploadPath, ["--remove-source-files"])
  }
  const result = await fileBrowser(path.dirname(absFilename), {
    request: path.dirname(absFilename),
    sendFilename: true,
    SND: true,
    filter: {
      all: noDotFiles,
      file: exceptSystemFiles,
      dir: null
    },
    withParentDir: false
  });
  emitAll(uploadClient, "fileList", result);
};

const onDownload = async (projectRootDir, target, cb)=>{
  const { dir, root: downloadRootDir } = await createTempd(projectRootDir, "download");
  const tmpDir = await fs.mkdtemp(`${dir}/`);

  let downloadZip = false;
  let targetBasename = "";
  if (glob.hasMagic(target)) {
    targetBasename = path.basename("SND_CONTENT");
    await zip(target, `${path.join(tmpDir, targetBasename)}.zip`);
    downloadZip = true;
  } else {
    const stats = await fs.stat(target);
    targetBasename = path.basename(target);

    if (stats.isDirectory()) {
      await zip(target, `${path.join(tmpDir, targetBasename)}.zip`);
      downloadZip = true;
    } else {
      await deliverFile(target, `${tmpDir}/${targetBasename}`);
    }
  }

  const ext = downloadZip ? ".zip" : "";
  const baseURL = process.env.WHEEL_BASE_URL || "";
  const url = `${baseURL}/${path.join(path.relative(downloadRootDir, tmpDir), targetBasename)}${ext}`;
  getLogger(projectRootDir).debug("Download url is ready", url);
  cb(url);
};

const onRemoveDownloadFile = async (projectRootDir, URL, cb)=>{
  const dir = await getTempd(projectRootDir, "download");
  const target = path.join(dir, path.basename(path.dirname(URL)));
  getLogger(projectRootDir).debug(`remove ${target}`);
  await fs.remove(target);
  cb(true);
};


module.exports = {
  onGetFileList,
  onGetSNDContents,
  onCreateNewFile,
  onCreateNewDir,
  onRemoveFile,
  onRenameFile,
  onUploadFileSaved,
  onDownload,
  onRemoveDownloadFile
};
