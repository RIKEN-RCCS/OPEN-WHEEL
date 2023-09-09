/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const { getSsh, getSshHostinfo } = require("./sshManager");
const { cancel } = require("./executer");
const { jobScheduler } = require("../db/db");
const { getLogger } = require("../logSettings.js");

async function cancelRemoteJob(task) {
  const ssh = getSsh(task.projectRootDir, task.remotehostID);
  const hostinfo = getSshHostinfo(task.projectRootDir, task.remotehostID);
  const JS = jobScheduler[hostinfo.jobScheduler];
  const cancelCmd = `${JS.del} ${task.jobID}`;
  getLogger(task.projectRootDir).debug(`cancel job: ${cancelCmd}`);
  const output = [];
  await ssh.exec(cancelCmd, (data)=>{
    output.push(data);
  });
  getLogger(task.projectRootDir).debug("cacnel done", output.join());
}

async function cancelLocalJob() {
  console.log("not implimented yet!!");
}

async function killLocalProcess(task) {
  if (task.handler && task.handler.killed === false) {
    task.handler.kill();
  }
}

async function killTask(task) {
  if (task.remotehostID !== "localhost") {
    if (task.useJobScheduler) {
      await cancelRemoteJob(task);
    } else {

      //do nothing for remoteExec at this time
    }
  } else {
    if (task.useJobScheduler) {
      await cancelLocalJob(task);
    } else {
      await killLocalProcess(task);
    }
  }
}

async function cancelDispatchedTasks(tasks) {
  const p = [];
  for (const task of tasks) {
    if (task.state === "finished" || task.state === "failed") {
      continue;
    }
    const canceled = cancel(task);

    if (!canceled) {
      p.push(killTask(task));
    }
    task.state = "not-started";
  }
  return Promise.all(p);
}

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
  killTask,
  cancelDispatchedTasks,
  taskStateFilter
};
