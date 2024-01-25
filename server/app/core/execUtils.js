/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path = require("path");
const fs = require("fs-extra");
const { statusFilename } = require("../db/db");
const { replacePathsep } = require("./pathUtils");
const { writeComponentJson, isSameRemoteHost } = require("./projectFilesOperator.js");
const { getSsh } = require("./sshManager");
const { getLogger } = require("../logSettings");
const { eventEmitters } = require("./global.js");

/**
 * set task component's status and notice it's changed
 */
async function setTaskState(task, state) {
  task.state = state;
  getLogger(task.projectRootDir).trace(`TaskStateList: ${task.ID}'s state is changed to ${state}`);
  await writeComponentJson(task.projectRootDir, task.workingDir, task, true);
  const ee = eventEmitters.get(task.projectRootDir);
  ee.emit("taskStateChanged", task);
  ee.emit("componentStateChanged", task);
}
async function needDownload(projectRootDir, componentID, outputFile) {
  const rt = await Promise.all(outputFile.dst.map(({ dstNode })=>{
    return isSameRemoteHost(projectRootDir, componentID, dstNode);
  }));
  return rt.some((isSame)=>{
    return !isSame;
  });
}
function formatSrcFilename(remoteWorkingDir, filename) {
  if (filename.endsWith("/") || filename.endsWith("\\")) {
    const dirname = replacePathsep(filename);
    return path.posix.join(remoteWorkingDir, `${dirname}/*`);
  }
  return path.posix.join(remoteWorkingDir, filename);
}
function makeDownloadRecipe(projectRootDir, filename, remoteWorkingDir, workingDir) {
  const reRemoteWorkingDir = new RegExp(remoteWorkingDir);
  const src = formatSrcFilename(remoteWorkingDir, filename);
  if (filename.slice(0, -1).includes("/")) {
    const dst = src.replace(reRemoteWorkingDir, workingDir);
    getLogger(projectRootDir).trace(`${filename} will be downloaded to ${dst}`);
    return { src, dst };
  }
  getLogger(projectRootDir).trace(`${filename} will be downloaded to component root directory`);
  return { src, dst: workingDir };
}
async function gatherFiles(task) {
  await setTaskState(task, "stage-out");
  getLogger(task.projectRootDir).debug("start to get files from remote server if specified");

  const downloadRecipe = [];
  for (const outputFile of task.outputFiles) {
    if (!await needDownload(task.projectRootDir, task.ID, outputFile)) {
      getLogger(task.projectRootDir).trace(`${outputFile.name} will NOT be downloaded`);
      continue;
    }
    downloadRecipe.push(makeDownloadRecipe(task.projectRootDir, outputFile.name, task.remoteWorkingDir, task.workingDir));
  }

  const ssh = getSsh(task.projectRootDir, task.remotehostID);
  const promises = [];

  const dsts = Array.from(new Set(downloadRecipe.map((e)=>{
    return e.dst;
  })));
  for (const dst of dsts) {
    const srces = downloadRecipe.filter((e)=>{
      return e.dst === dst;
    }).map((e)=>{
      return e.src;
    });
    promises.push(ssh.recv(srces, dst));
  }

  let opt;
  if (Array.isArray(task.exclude)) {
    opt = task.exclude.map((e)=>{
      return `--exclude=${e}`;
    });
  }
  //get files which match include filter
  if (Array.isArray(task.include) && task.include.length > 0) {
    const downloadRecipe2 = task.include.map((e)=>{
      return makeDownloadRecipe(task.projectRootDir, e, task.remoteWorkingDir, task.workingDir);
    });
    const dsts2 = Array.from(new Set(downloadRecipe2.map((e)=>{
      return e.dst;
    })));
    for (const dst of dsts2) {
      const srces = downloadRecipe2.filter((e)=>{
        return e.dst === dst;
      }).map((e)=>{
        return e.src;
      });
      promises.push(ssh.recv(srces, dst, opt));
    }
  }

  await Promise.all(promises);
  //clean up remote working directory
  if (task.doCleanup) {
    getLogger(task.projectRootDir).debug("(remote) rm -fr", task.remoteWorkingDir);

    try {
      await ssh.exec(`rm -fr ${task.remoteWorkingDir}`);
    } catch (e) {
      //just log and ignore error
      getLogger(task.projectRootDir).warn("remote cleanup failed but ignored", e);
    }
  }
}
async function createStatusFile(task) {
  const filename = path.resolve(task.workingDir, statusFilename);
  const statusFile = `${task.state}\n${task.rt}\n${task.jobStatus}`;
  return fs.writeFile(filename, statusFile);
}
async function createBulkStatusFile(task, rtList, jobStatusList) {
  const filename = path.resolve(task.workingDir, `subjob_${statusFilename}`);
  let statusFile = "";
  for (let bulkNum = task.startBulkNumber; bulkNum <= task.endBulkNumber; bulkNum++) {
    statusFile += `RT_${bulkNum}=${rtList[bulkNum]}\nJOBSTATUS_${bulkNum}=${jobStatusList[bulkNum]}\n`;
  }
  return fs.writeFile(filename, statusFile);
}

module.exports = {
  setTaskState,
  gatherFiles,
  needDownload,
  makeDownloadRecipe,
  createStatusFile,
  createBulkStatusFile
};
