/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path = require("path");
const fs = require("fs-extra");
const { readComponentJsonByID } = require("../core/componentJsonIO.js");
const { remoteHost } = require("../db/db");
const { getLogger } = require("../logSettings");
const { createSsh, getSsh, askPassword } = require("../core/sshManager");
const { createTempd } = require("../core/tempd.js");
const { hasRemoteFileBrowser, hasGfarmTarBrowser } = require("../../../common/checkComponent.cjs");
const { checkJWTAgent, startJWTAgent, gfls, gfmkdir, gfrm, gfmv, gfptarList } = require("../core/gfarmOperator.js");
const {
  createNewRemoteFile,
  createNewRemoteDir,
  removeRemoteFileOrDirectory,
  renameRemoteFileOrDirectory
} = require("../core/remoteFileUtils.js");
const { setJWTServerPassphrase } = require("../core/jwtServerPassphraseManager.js");

async function onRequestRemoteConnection(socket, projectRootDir, componentID, cb) {
  const component = await readComponentJsonByID(projectRootDir, componentID);
  if (!hasRemoteFileBrowser(component) && !hasGfarmTarBrowser(component)) {
    getLogger(projectRootDir).warn(projectRootDir, `${component.name} does not have remote storage`);
    return;
  }
  try {
    const id = remoteHost.getID("name", component.host);
    const hostinfo = remoteHost.get(id);
    await createSsh(projectRootDir, component.host, hostinfo, socket.id, true);
    if (["hpciss", "hpcisstar"].includes(component.type)) {
      if (await checkJWTAgent(projectRootDir, hostinfo.id)) {
        getLogger(projectRootDir).debug(`jwt-agent is already running on ${hostinfo.name}`);
      } else {
        getLogger(projectRootDir).debug(`get jwt-server passphrase for ${hostinfo.name}`);
        const phGfarm = await askPassword(socket.id, hostinfo.name, "passphrase", hostinfo.JWTServerURL);
        getLogger(projectRootDir).debug(`start jwt-agent on ${hostinfo.name}`);
        await startJWTAgent(projectRootDir, hostinfo.id, phGfarm);
        const result = await checkJWTAgent(projectRootDir, hostinfo.id);
        if (!result) {
          const err = new Error(`start jwt-agent failed on ${hostinfo.name}`);
          err.hostinfo = hostinfo;
          throw err;
        }
        getLogger(projectRootDir).debug(`store jwt-server's passphrase ${hostinfo.name}`);
        setJWTServerPassphrase(projectRootDir, hostinfo.id, phGfarm);
      }
    }
  } catch (e) {
    cb(false);
    return;
  }
  cb(true);
}

function formatLsResults(lsResults, readlinkResults, target) {
  return lsResults.map((e)=>{
    if (e.endsWith("=") || e.endsWith("%") || e.endsWith("|")) {
      return null;
    }
    const islink = e.endsWith("@");
    const name = islink || e.endsWith("*") || e.endsWith("/") ? e.slice(0, e.length - 1) : e;
    let type = null;
    if (islink) {
      const index = readlinkResults.findIndex((result)=>{
        return result.split(",")[0] === name;
      });
      if (index + 1 < readlinkResults.length) {
        type = readlinkResults[index + 1] === "directory" ? "dir" : "file";
      }
    } else {
      type = e.endsWith("/") ? "dir" : "file";
    }
    return { path: target, name, type, islink };
  }).filter((e)=>{
    return e !== null;
  });
}

async function onGetRemoteGfarmFileList(projectRootDir, host, { path: target }, cb) {
  try {
    const id = remoteHost.getID("name", host);
    const lsResults = await gfls(projectRootDir, id, target, "-F");
    const content = formatLsResults(lsResults, [], target);
    return cb(content);
  } catch (e) {
    getLogger(projectRootDir).error(projectRootDir, "error occurred during reading gfarm directory", e);
    return cb(false);
  }
}

async function onGetRemoteGfarmTarFileList(projectRootDir, host, target, cb) {
  try {
    const id = remoteHost.getID("name", host);
    const filesInTar = await gfptarList(projectRootDir, id, target);
    if (Number.isInteger(filesInTar)) {
      return cb(false);
    }
    return cb(filesInTar);
  } catch (e) {
    getLogger(projectRootDir).error(projectRootDir, "error occurred during reading gfarm directory", e);
    return cb(false);
  }
}

async function onGetRemoteFileList(projectRootDir, host, { path: target }, cb) {
  try {
    const id = remoteHost.getID("name", host);
    const ssh = await getSsh(projectRootDir, id);
    const lsResults = await ssh.ls(target, ["-F"]);
    if (!Array.isArray(lsResults)) {
      getLogger(projectRootDir).error(projectRootDir, "ls on remotehost failed", lsResults);
      return cb(null);
    }
    const links = lsResults.filter((e)=>{
      return e.endsWith("@");
    }).map((e)=>{
      return e.slice(0, e.length - 1);
    });
    const readlinkResults = [];
    if (links.length > 0) {
      const { output, rt } = await ssh.execAndGetOutput(` cd ${target};for i in ${links.join(" ")};do echo $i; stat -c %F $(readlink -f $i);done`, 0);

      if (rt !== 0) {
        getLogger(projectRootDir).error(projectRootDir, "readlink on remotehost failed", rt);
        return cb(null);
      }
      readlinkResults.push(...output);
    }

    const content = formatLsResults(lsResults, readlinkResults, target);
    return cb(content);
  } catch (e) {
    getLogger(projectRootDir).error(projectRootDir, "error occurred during reading remotedirectory", e);
    return cb(null);
  }
}

async function onGetRemoteSNDContents(projectRootDir) {
  getLogger(projectRootDir).error(projectRootDir, "onGetRemoteSNDContents should not be called any more");
}
async function onRemoteDownload(projectRootDir, target, host, cb) {
  const { zip } = await import("zip-a-folder");
  try {
    const { dir, root: downloadRootDir } = await createTempd(projectRootDir, "download");
    const tmpDir = await fs.mkdtemp(`${dir}/`);
    const downloadContentName = path.basename(target);

    const id = remoteHost.getID("name", host);
    const ssh = await getSsh(projectRootDir, id);
    await ssh.recv([target], `${tmpDir}/`);
    const stats = await fs.stat(path.resolve(tmpDir, downloadContentName));
    if (stats.isDirectory()) {
      zip(path.resolve(tmpDir, downloadContentName), `${path.resolve(tmpDir, downloadContentName)}.zip`);
    }
    const url = `/${path.join(path.relative(downloadRootDir, tmpDir), downloadContentName)}${stats.isDirectory() ? ".zip" : ""}`;
    getLogger(projectRootDir).debug("Download url is ready", url);
    return cb(url);
  } catch (e) {
    getLogger(projectRootDir).error("fetch download file failed", e);
    return cb(null);
  }
}

/**
 * exec func and call cb function
 * @param {Function} func - function to be executed
 * @param {Array} args - args of func. last element must be callback function
 */
async function remoteFileUtilWrapper(func, ...args) {
  const cb = args.pop();
  try {
    const rt = await func(...args);
    cb(rt === 0);
  } catch (e) {
    cb(false);
  }
}

/**
 * exec gfarmOperator function and call cb function
 * @param {Function} func - function in gfarmOperator
 * @param {string} projectRootDir - project's root path
 * @param {Array} args - rest args of func. last element must be callback function
 */
async function gfarmFileUtilWrapper(func, projectRootDir, ...args) {
  const cb = args.pop();
  const host = args.pop();
  const hostID = remoteHost.getID("name", host);
  if (!hostID) {
    getLogger(projectRootDir).error(`${host} not found in remotehost settings`);
    cb(false);
  }
  try {
    const output = await func(projectRootDir, hostID, ...args);
    cb(!(Number.isInteger(output) && output !== 0));
  } catch (e) {
    cb(false);
  }
}

const onCreateNewRemoteFile = remoteFileUtilWrapper.bind(null, createNewRemoteFile);
const onCreateNewRemoteDir = remoteFileUtilWrapper.bind(null, createNewRemoteDir);
const onRemoveRemoteFile = remoteFileUtilWrapper.bind(null, removeRemoteFileOrDirectory);
const onRenameRemoteFile = remoteFileUtilWrapper.bind(null, renameRemoteFileOrDirectory);

const onCreateNewGfarmDir = gfarmFileUtilWrapper.bind(null, gfmkdir);
const onRemoveGfarmFile = gfarmFileUtilWrapper.bind(null, gfrm);
const onRenameGfarmFile = gfarmFileUtilWrapper.bind(null, gfmv);

module.exports = {
  onRequestRemoteConnection,
  onGetRemoteGfarmFileList,
  onGetRemoteGfarmTarFileList,
  onGetRemoteFileList,
  onGetRemoteSNDContents,
  onRemoteDownload,
  onCreateNewRemoteFile,
  onCreateNewRemoteDir,
  onRemoveRemoteFile,
  onRenameRemoteFile,
  onCreateNewGfarmDir,
  onRemoveGfarmFile,
  onRenameGfarmFile
};
