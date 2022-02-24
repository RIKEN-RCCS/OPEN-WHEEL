/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License.txt in the project root for the license information.
 */
"use strict";
const path = require("path");
const os = require("os");
const fs = require("fs-extra");
const Siofu = require("socketio-file-upload");
const minimatch = require("minimatch");
const klaw = require("klaw");
const fileBrowser = require("../core/fileBrowser");
const { gitAdd, gitRm, gitLFSTrack, gitLFSUntrack, isLFS } = require("../core/gitOperator2");
const { getSystemFiles } = require("./utility");
const { jobScript } = require("../db/db");
const { convertPathSep } = require("../core/pathUtils");
const { getLogger } = require("../core/projectResource");
const { saveFile } = require("../core/fileUtils");
const { isComponentDir } = require("../core/componentFilesOperator");
const { gitLFSSize } = require("../db/db");

/**
 * return component dir names under target directory
 * @param {string} target
 * @returns {string[]} - array of component dir names
 */
async function getComponentDirs(target) {
  const contents = await fs.readdir(target);
  const flags = await Promise.all(contents.map((e)=>{
    return isComponentDir(path.resolve(target, e));
  }));
  return contents.filter((e, i)=>{
    return flags[i];
  });
}

async function sendDirectoryContents(target, request, withSND = true, sendDir = true, sendFile = true, allFilter = /.*/) {
  const modifiedRequestDir = request ? path.normalize(convertPathSep(request)) : target;
  const componentDirs = await getComponentDirs(modifiedRequestDir);
  const regexComponentDirs = componentDirs.length > 0 ? new RegExp(`^(?!.*(${componentDirs.join("|")})).+$`) : null;
  const result = await fileBrowser(target, {
    request,
    SND: withSND,
    sendDirname: sendDir,
    sendFilename: sendFile,
    filter: {
      all: allFilter,
      file: getSystemFiles(),
      dir: regexComponentDirs
    }
  });
  return result;
}

async function onGetFileList(uploader, projectRootDir, requestDir, cb) {
  const modifiedRequestDir = path.normalize(convertPathSep(requestDir));
  getLogger(projectRootDir).debug(`current dir = ${modifiedRequestDir}`);

  try {
    const stats = await fs.stat(modifiedRequestDir);
    const targetDir = stats.isDirectory() ? modifiedRequestDir : path.dirname(modifiedRequestDir);

    if (targetDir !== modifiedRequestDir) {
      getLogger(projectRootDir).debug("requested directory is not directory, show parent of reqested:", targetDir);
    }
    uploader.dir = targetDir;
    const directoryContents = await sendDirectoryContents(targetDir, requestDir);
    return cb(directoryContents);
  } catch (e) {
    getLogger(projectRootDir).error(requestDir, "read failed", e);
  }
}

async function onGetSNDContents(projectRootDir, requestDir, glob, isDir, cb) {
  const modifiedRequestDir = path.normalize(convertPathSep(requestDir));
  getLogger(projectRootDir).debug("getSNDContents event recieved:", modifiedRequestDir, glob, isDir);

  const sendDir = isDir;
  const sendFile = !isDir;

  try {
    const directoryContents = await sendDirectoryContents(modifiedRequestDir, requestDir, false, sendDir, sendFile, minimatch.makeRe(glob));
    return cb(directoryContents);
  } catch (e) {
    getLogger(projectRootDir).error(requestDir, "read failed", e);
  }
}

async function onRemoveFile(emit, projectRootDir, target, cb) {
  getLogger(projectRootDir).debug(`removeFile event recieved: ${target}`);

  try {
    await gitRm(projectRootDir, target);
    await fs.remove(target, { force: true });
  } catch (err) {
    getLogger(projectRootDir).warn(`removeFile failed: ${err}`);
    cb(false);
    return;
  }
  cb(true);
}

async function onRenameFile(emit, projectRootDir, msg, cb) {
  getLogger(projectRootDir).debug(`renameFile event recieved: ${msg}`);

  if (!(msg.hasOwnProperty("oldName") && msg.hasOwnProperty("newName") && msg.hasOwnProperty("path"))) {
    getLogger(projectRootDir).warn(`illegal request ${msg}`);
    cb(false);
    return;
  }

  const oldName = path.resolve(msg.path, msg.oldName);
  const newName = path.resolve(msg.path, msg.newName);

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
    await fs.move(oldName, newName);
    await gitAdd(projectRootDir, newName);
  } catch (e) {
    const err = typeof e === "string" ? new Error(e) : e;
    err.path = msg.path;
    err.oldName = msg.oldName;
    err.newName = msg.newName;
    getLogger(projectRootDir).error("rename failed", err);
    cb(false);
    return;
  }
  cb(true);
}

async function onDownloadFile(emit, projectRootDir, msg, cb) {
  getLogger(projectRootDir).debug("downloadFile event recieved: ", msg);

  if (typeof cb !== "function") {
    cb = ()=>{};
  }
  const filename = path.resolve(msg.path, msg.name);

  try {
    const file = await fs.readFile(filename);
    emit("downloadData", file);
  } catch (e) {
    if (e.code === "EISDIR") {
      getLogger(projectRootDir).error("download directory is not supported for now");
    } else {
      getLogger(projectRootDir).error("file download failed", e);
    }
    cb(false);
    return;
  }
  cb(true);
}

async function onCreateNewFile(emit, projectRootDir, filename, cb) {
  getLogger(projectRootDir).debug("createNewFile event recieved: ", filename);
  filename = convertPathSep(filename);

  try {
    await fs.writeFile(filename, "");
    await gitAdd(projectRootDir, filename);
  } catch (e) {
    getLogger(projectRootDir).error("create new file failed", e);
    cb(false);
    return;
  }
  cb(true);
}

async function onCreateNewDir(emit, projectRootDir, dirname, cb) {
  getLogger(projectRootDir).debug("createNewDir event recieved: ", dirname);
  dirname = convertPathSep(dirname);

  try {
    await fs.mkdir(dirname);
    await fs.writeFile(path.resolve(dirname, ".gitkeep"), "");
    await gitAdd(projectRootDir, path.resolve(dirname, ".gitkeep"));
  } catch (e) {
    getLogger(projectRootDir).error("create new directory failed", e);
    cb(false);
    return;
  }
  cb(true);
}


function registerListeners(socket, projectRootDir) {
  const uploader = new Siofu();
  uploader.listen(socket);
  uploader.dir = os.homedir();
  uploader.on("start", (event)=>{
    getLogger(projectRootDir).debug("upload request recieved", event.file);
  });
  uploader.on("saved", async(event)=>{
    const absFilename = event.file.meta.componentDir ? path.resolve(convertPathSep(event.file.meta.componentDir), path.basename(event.file.pathName)) : event.file.pathName;
    if (event.file.pathName !== absFilename) {
      await fs.move(event.file.pathName, absFilename);
    }
    const fileSizeMB = parseInt(event.file.size / 1024 / 1024, 10);
    getLogger(projectRootDir).info(`upload completed ${absFilename} [${fileSizeMB > 1 ? `${fileSizeMB} MB` : `${event.file.size} Byte`}]`);

    if (fileSizeMB > gitLFSSize) {
      await gitLFSTrack(projectRootDir, absFilename);
    }
    await gitAdd(projectRootDir, absFilename);
    const rt = await sendDirectoryContents(path.dirname(absFilename));
    socket.emit("fileList", rt);
  });
  uploader.on("error", (event)=>{
    getLogger(projectRootDir).error("file upload failed", event.file, event.error);
  });

  socket.on("getFileList", onGetFileList.bind(null, uploader, projectRootDir));
  socket.on("getSNDContents", onGetSNDContents.bind(null, projectRootDir));
  socket.on("removeFile", onRemoveFile.bind(null, socket.emit.bind(socket), projectRootDir));
  socket.on("renameFile", onRenameFile.bind(null, socket.emit.bind(socket), projectRootDir));
  socket.on("downloadFile", onDownloadFile.bind(null, socket.emit.bind(socket), projectRootDir));
  socket.on("createNewFile", onCreateNewFile.bind(null, socket.emit.bind(socket), projectRootDir));
  socket.on("createNewDir", onCreateNewDir.bind(null, socket.emit.bind(socket), projectRootDir));
}

module.exports = registerListeners;
