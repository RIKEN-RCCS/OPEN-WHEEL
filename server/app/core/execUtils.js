/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License.txt in the project root for the license information.
 */
"use strict";
const path = require("path");
const fs = require("fs-extra");
const { componentJsonFilename, statusFilename } = require("../db/db");
const { replacePathsep } = require("./pathUtils");
const { componentJsonReplacer } = require("./componentFilesOperator");
const { getSsh } = require("./sshManager");
const { getLogger } = require("../logSettings");

/**
 * parse filter string from client and return validate glob pattern
 */
function parseFilter(pattern) {
  if ((pattern.startsWith("{") && pattern.endsWith("}")) || !pattern.includes(",")) {
    return pattern;
  }
  return `{${pattern}}`;
}


/**
 * set task component's status and notice it's changed
 */
async function setTaskState(task, state) {
  task.state = state;
  getLogger(task.proejctRootDir).trace(`TaskStateList: ${task.ID}'s state is changed to ${state}`);
  //to avoid git add when task state is changed, we do NOT use updateComponentJson(in workflowUtil) here
  await fs.writeJson(path.resolve(task.workingDir, componentJsonFilename), task, { spaces: 4, replacer: componentJsonReplacer });
  task.emitEvent("taskStateChanged", task);
  task.emitEvent("componentStateChanged", task);
}

async function gatherFiles(task) {
  await setTaskState(task, "stage-out");
  getLogger(task.proejctRootDir).debug("start to get files from remote server if specified");
  const ssh = getSsh(task.projectRootDir, task.remotehostID);

  //get outputFiles from remote server
  const outputFiles = task.outputFiles
    .map((e)=>{
      if (e.name.endsWith("/") || e.name.endsWith("\\")) {
        const dirname = replacePathsep(e.name);
        return `${dirname}/*`;
      }
      return `${e.name}`;
    });

  for (const outputFile of outputFiles) {
    const dst = `${path.join(task.workingDir, path.dirname(outputFile))}/`;
    getLogger(task.proejctRootDir).debug("try to get outputFiles", outputFile, "\n  from:", task.remoteWorkingDir, "\n  to:", dst);

    try {
      await ssh.recv(path.posix.join(task.remoteWorkingDir, outputFile), dst, null, null);
    } catch (e) {
      //ignore if src file is not exists
      if (e.message !== "src must be existing file or directory") {
        throw e;
      } else {
        getLogger(task.projectRootDir).debug("src file not found but ignored", outputFile);
      }
    }
  }


  //get files which match include filter
  if (typeof task.include === "string") {
    const include = `${task.remoteWorkingDir}/${parseFilter(task.include)}`;
    const exclude = task.exclude ? `${task.remoteWorkingDir}/${parseFilter(task.exclude)}` : null;
    getLogger(task.projectRootDir).debug("try to get ", include, "\n  from:", task.remoteWorkingDir, "\n  to:", task.workingDir, "\n  exclude filter:", exclude);

    try {
      await ssh.recv(include, task.workingDir, null, exclude);
    } catch (e) {
      //ignore if src file is not exists
      if (e.message !== "src must be existing file or directory") {
        throw e;
      } else {
        getLogger(task.projectRootDir).debug("file not found but ignored", e);
      }
    }
  }

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
  createStatusFile,
  createBulkStatusFile
};
