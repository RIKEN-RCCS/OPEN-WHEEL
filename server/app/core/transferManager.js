/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const SBS = require("simple-batch-system");
const { getLogger } = require("../logSettings.js");
const { getDateString } = require("../lib/utility");
const { getSsh } = require("./sshManager.js");
const transferrers = new Map();
function getKey(task) {
  return `${task.projectRootDir}-${task.remotehostID}`;
}

/**
 * submit send or recv request to SBS and wait until transfer is done
 * @param {Object} hostinfo - target host information object
 * @param {Object} task - task component
 * @param {string} direction - transfer mode "send" and "recv" are acceptable
 * @param {string[]} src - file or directories to be transferd
 * @param {string} dst - destination path
 * @param {string[]} opt - option object for ssh.send or ssh.recv
 */
async function register(hostinfo, task, direction, src, dst, opt) {
  if (!transferrers.has(getKey(task))) {
    const transferrer = new SBS({
      exec: async ({ direction, src, dst, task })=>{
        const ssh = getSsh(task.projectRootDir, task.remotehostID);
        if (direction === "send") {
          getLogger(task.projectRootDir).debug(`send ${task.workingDir} to ${task.remoteWorkingDir} start`);
          await ssh.send(src, dst, opt);
          task.preparedTime = getDateString(true, true);
          getLogger(task.projectRootDir).debug(`send ${task.workingDir} to ${task.remoteWorkingDir} finished`);
        } else if (direction === "recv") {
          await ssh.recv(src, dst, opt);
        } else {
          const err = new Error("invalid direction");
          err.direction = direction;
          throw err;
        }
      },
      maxConcurrent: hostinfo.maxNumParallelTransfer || 1,
      name: `transfer-${hostinfo.user || process.env.USER}@${hostinfo.name}:${hostinfo.port || 22}`
    });
    transferrers.set(getKey(task), transferrer);
  }
  const transferrer = transferrers.get(getKey(task));
  return transferrer.qsubAndWait({ direction, src, dst, task });
}

/**
 * remove all transfer class instance from DB
 * @param {string} projectRootDir - project projectRootDir's absolute path
 */
function removeAll(projectRootDir) {
  const keysToRemove = Array.from(transferrers.keys()).filter((key)=>{
    return key.startsWith(projectRootDir);
  });
  keysToRemove.forEach((key)=>{
    transferrers.delete(key);
  });
}

module.exports = {
  register,
  removeAll
};
