/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const { getSsh, getSshHostinfo } = require("./sshManager");
const { cancel } = require("./executerManager.js");
const { jobScheduler } = require("../db/db");
const { getLogger } = require("../logSettings.js");

const _internal = {
  getSsh,
  getSshHostinfo,
  cancel,
  getLogger,
  killTask,
  killLocalProcess,
  cancelRemoteJob,
  cancelLocalJob
};

/**
 * cancel job on remotehost
 * @param {object} task - task component
 */
async function cancelRemoteJob(task) {
  if (!task.jobID) {
    _internal.getLogger(task.projectRootDir).debug(`try to cancel ${task.name} but it have not been submitted.`);
    return;
  }
  const ssh = _internal.getSsh(task.projectRootDir, task.remotehostID);
  const hostinfo = _internal.getSshHostinfo(task.projectRootDir, task.remotehostID);
  const JS = jobScheduler[hostinfo.jobScheduler];
  const cancelCmd = `${JS.del} ${task.jobID}`;
  _internal.getLogger(task.projectRootDir).debug(`cancel job: ${cancelCmd}`);
  const output = [];
  await ssh.exec(cancelCmd, 60, (data)=>{
    output.push(data);
  });
  _internal.getLogger(task.projectRootDir).debug("cacnel done", output.join());
}
_internal.cancelRemoteJob = cancelRemoteJob;

/**
 * cancel job on localhost but not implemented
 */
async function cancelLocalJob() {
  console.log("not implimented yet!!");
}
_internal.cancelLocalJob = cancelLocalJob;

/**
 * kill process which was invoked from specified task
 * @param {object} task - task component
 */
async function killLocalProcess(task) {
  if (task.handler && task.handler.killed === false) {
    task.handler.kill();
  }
}
_internal.killLocalProcess = killLocalProcess;

/**
 * cancel dispatched task
 * @param {object} task - task component
 */
async function killTask(task) {
  if (task.remotehostID !== "localhost") {
    if (task.useJobScheduler) {
      await _internal.cancelRemoteJob(task);
    } else {

      //do nothing for remoteExec at this time
    }
  } else {
    if (task.useJobScheduler) {
      await _internal.cancelLocalJob(task);
    } else {
      await _internal.killLocalProcess(task);
    }
  }
}
_internal.killTask = killTask;

/**
 * cancel dispatched tasks
 * @param {object[]} tasks - array of task components
 * @returns {Promise} - resolved when all tasks are canceled
 */
async function cancelDispatchedTasks(tasks) {
  const p = [];
  for (const task of tasks) {
    if (task.state === "finished" || task.state === "failed") {
      continue;
    }
    const canceled = _internal.cancel(task);
    if (!canceled) {
      p.push(_internal.killTask(task));
    }
    task.state = "not-started";
  }
  return Promise.all(p);
}

/**
 * filter function which keep only usefull properties on client side
 * @param {object} task - task component
 * @returns {object} - reduced task component
 */
function taskStateFilter(task) {
  return {
    name: task.name,
    ID: task.ID,
    workingDir: task.workingDir,
    description: task.description ? task.description : "",
    state: task.state,
    parent: task.parent,
    parentType: task.parentType,
    ancestorsName: task.ancestorsName,
    ancestorsType: task.ancestorsType,
    dispatchedTime: task.dispatchedTime,
    startTime: task.startTime,
    endTime: task.endTime,
    preparedTime: task.preparedTime,
    jobSubmittedTime: task.jobSubmittedTime,
    jobStartTime: task.jobStartTime,
    jobEndTime: task.jobEndTime
  };
}

module.exports = {
  cancelDispatchedTasks,
  taskStateFilter,
  killTask,
  killLocalProcess,
  cancelRemoteJob,
  cancelLocalJob
};

if (process.env.NODE_ENV === "test") {
  module.exports._internal = _internal;
}
