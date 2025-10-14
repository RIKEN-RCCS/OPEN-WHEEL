/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path = require("path");
const { addX, replaceCRLF } = require("./fileUtils.js");
const { setTaskState, needDownload, makeDownloadRecipe } = require("./execUtils");
const { getSshHostinfo, getSsh } = require("./sshManager.js");
const { getLogger } = require("../logSettings.js");
const { register } = require("./transferManager.js");

const _internal = {
  addX,
  replaceCRLF,
  setTaskState,
  needDownload,
  makeDownloadRecipe,
  getSshHostinfo,
  getSsh,
  getLogger,
  register
};

/**
 * prepare task component on remotehost
 * @param {object} task - component to be executed on remotehost
 * @returns {Promise} - resolved after preparation done
 */
async function stageIn(task) {
  await _internal.setTaskState(task, "stage-in");
  const hostinfo = _internal.getSshHostinfo(task.projectRootDir, task.remotehostID);

  //convert \r\n to \n
  const localScriptPath = path.resolve(task.workingDir, task.script);
  await _internal.replaceCRLF(localScriptPath);

  //add exec permission to script
  await _internal.addX(localScriptPath);

  //register send request
  return _internal.register(hostinfo, task, "send", [task.workingDir], `${path.posix.dirname(task.remoteWorkingDir)}/`);
}

/**
 * get needed files from remotehost
 * @param {object} task - component which have been executed on remotehost
 * @returns {Promise} - resolved after file transfer done
 */
async function stageOut(task) {
  const taskState = task.state;
  if (taskState !== "finished") {
    return;
  }
  await _internal.setTaskState(task, "stage-out");
  const hostinfo = _internal.getSshHostinfo(task.projectRootDir, task.remotehostID);

  _internal.getLogger(task.projectRootDir).debug("start to get files from remote server if specified");

  const downloadRecipe = [];
  for (const outputFile of task.outputFiles) {
    if (!await _internal.needDownload(task.projectRootDir, task.ID, outputFile)) {
      _internal.getLogger(task.projectRootDir).trace(`${outputFile.name} will NOT be downloaded`);
      continue;
    }
    downloadRecipe.push(_internal.makeDownloadRecipe(task.projectRootDir, outputFile.name, task.remoteWorkingDir, task.workingDir));
  }

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
    promises.push(_internal.register(hostinfo, task, "recv", srces, dst));
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
      return _internal.makeDownloadRecipe(task.projectRootDir, e, task.remoteWorkingDir, task.workingDir);
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
      promises.push(_internal.register(hostinfo, task, "recv", srces, dst, opt));
    }
  }

  await Promise.all(promises);
  //clean up remote working directory
  if (task.doCleanup && taskState === "finished") {
    _internal.getLogger(task.projectRootDir).debug("(remote) rm -fr", task.remoteWorkingDir);

    try {
      const ssh = _internal.getSsh(task.projectRootDir, task.remotehostID);
      await ssh.exec(`rm -fr ${task.remoteWorkingDir}`);
    } catch (e) {
      //just log and ignore error
      _internal.getLogger(task.projectRootDir).warn("remote cleanup failed but ignored", e);
    }
  }
  await _internal.setTaskState(task, taskState);
}

module.exports = {
  stageIn,
  stageOut
};

if (process.env.NODE_ENV === 'test') {
  module.exports._internal = _internal;
}