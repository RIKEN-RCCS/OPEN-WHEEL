/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path = require("path");
const { remoteHost } = require("../db/db");
const { getLogger } = require("../logSettings");
const { getSsh } = require("../core/sshManager");

/**
 * execute cmd on remotehost
 * @param {string} projectRootDir - project's root path"
 * @param {string} host - target host label
 * @param {string} cmd - commandline to be executed
 * @returns {number} - return value of cmd on remote host
 */
async function execRemote(projectRootDir, host, cmd) {
  const id = remoteHost.getID("name", host);
  const ssh = await getSsh(projectRootDir, id);
  return ssh.exec(cmd);
}

/**
 * create new file on remotehost
 * @param {string} projectRootDir - project's root path"
 * @param {string} filename - new file's name
 * @param {string} host - target host label
 * @returns {number} - return value of touch on remote host
 */
async function createNewRemoteFile(projectRootDir, filename, host) {
  getLogger(projectRootDir).debug(`create file ${filename} on ${host}`);
  return execRemote(projectRootDir, host, `touch ${filename}`);
}

/**
 * create new directory on remotehost
 * @param {string} projectRootDir - project's root path"
 * @param {string} dirname - new directory 's name
 * @param {string} host - target host label
 * @returns {number} - return value of mkdir on remote host
 */
async function createNewRemoteDir(projectRootDir, dirname, host) {
  getLogger(projectRootDir).debug(`create directory ${dirname} on ${host}`);
  return execRemote(projectRootDir, host, `mkdir ${dirname}`);
}

/**
 * remove file or directory on remotehost
 * @param {string} projectRootDir - project's root path"
 * @param {string} target - file or directory to be removed
 * @param {string} host - target host label
 * @returns {number} - return value of rm on remote host
 */
async function removeRemoteFileOrDirectory(projectRootDir, target, host) {
  getLogger(projectRootDir).debug(`remove ${target} on ${host}`);
  return execRemote(projectRootDir, host, `rm -fr ${target}`);
}

/**
 * rename file or directory on remotehost
 * @param {string} projectRootDir - project's root path"
 * @param {string} parentDir - file or directory to be removed
 * @param {string} argOldName - file or directory name to be changed
 * @param {string} argNewName - new file or directory name
 * @param {string} host - target host label
 * @returns {number} - return value of rm on remote host
 */
async function renameRemoteFileOrDirectory(projectRootDir, parentDir, argOldName, argNewName, host) {
  getLogger(projectRootDir).debug(`rename ${argOldName} to ${argNewName} in ${parentDir} on ${host}`);
  const oldName = path.join(parentDir, argOldName);
  const newName = path.join(parentDir, argNewName);
  return execRemote(projectRootDir, host, `mv ${oldName} ${newName}`);
}

module.exports = {
  createNewRemoteFile,
  createNewRemoteDir,
  removeRemoteFileOrDirectory,
  renameRemoteFileOrDirectory
};
