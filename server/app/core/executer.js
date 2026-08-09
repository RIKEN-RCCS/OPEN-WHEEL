/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
import { remoteHost } from "../db/db.js";
import { getRemoteRootWorkingDir, getRemoteWorkingDir } from "./dispatchUtils.js";
import { stageIn, stageOut } from "./transferrer.js";
import { register } from "./executerManager.js";

/**
 * transfer files from remote host when task is already in stage-out phase
 * @param {object} task - task component object that is already in stage-out state
 * @returns {Promise} - resolved after file transfer done
 */
async function execStageOut(task) {
  task.remotehostID = remoteHost.getID("name", task.host) || "localhost";
  const onRemote = task.remotehostID !== "localhost";
  if (onRemote) {
    task.remoteWorkingDir = getRemoteWorkingDir(task.projectRootDir, task.projectStartTime, task.workingDir, task);
    task.remoteRootWorkingDir = getRemoteRootWorkingDir(task.projectRootDir, task.projectStartTime, task);
  }
  //stageOut() requires state to be "finished" to proceed
  task.state = "finished";

  try {
    if (onRemote) {
      await stageOut(task);
    }
  } finally {
    task.emitForDispatcher("taskCompleted", task.state, task);
  }
}

/**
 * enqueue task
 * @param {object} task - task component object
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
  try {
    if (onRemote) {
      await stageIn(task);
    }
    await register(task);
    if (onRemote) {
      await stageOut(task);
    }
  } finally {
    task.emitForDispatcher("taskCompleted", task.state, task);
  }
}

export {
  exec,
  execStageOut
};
