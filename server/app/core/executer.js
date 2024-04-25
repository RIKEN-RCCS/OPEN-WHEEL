/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const { remoteHost } = require("../db/db");
const { getRemoteRootWorkingDir, getRemoteWorkingDir } = require("./dispatchUtils");
const {stageIn, stageOut} = require("./transferrer.js");
const {register} = require("./executerManager.js");

/**
 * enqueue task
 * @param {Task} task - task component object
 * task component is defined in workflowComponent.js
 */
async function exec(task) {
  //following process should be done in Dispatcher
  task.remotehostID = remoteHost.getID("name", task.host) || "localhost";

  const onRemote = task.remotehostID !== "localhost";
  if (onRemote) {
    task.remoteWorkingDir = getRemoteWorkingDir(task.projectRootDir, task.projectStartTime, task.workingDir, task);
    task.remoteRootWorkingDir = getRemoteRootWorkingDir(task.projectRootDir, task.projectStartTime, task);
  }

  if(onRemote){
    await stageIn(task);
  }
  await register(task)

  if(onRemote){
    await stageOut(task);
  }
}


module.exports = {
  exec
}
