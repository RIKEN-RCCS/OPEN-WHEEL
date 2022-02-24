/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License.txt in the project root for the license information.
 */
"use strict";
const path = require("path");
const { readJsonGreedy } = require("../core/fileUtils");
const { gitAdd, gitResetHEAD, gitClean } = require("../core/gitOperator2");
const { removeSsh } = require("./sshManager");
const { taskStateFilter, cancelDispatchedTasks } = require("./taskUtil");
const { defaultCleanupRemoteRoot, projectJsonFilename, componentJsonFilename } = require("../db/db");


const EventEmitter = require("events");
const rootDispatchers = new Map();
const tasks = new Map();
const eventEmitters = new Map();

/**
 * @event projectStateChanged
 * @type {Object} - updated projectJson
 *
 * @event taskStateChanged
 * @type {Object} - updated task object
 *
 * @event componentStateChanged
 * @type {Object} - updated component Json
 *
 * @event resultFilesReady
 * @type {Object[]] - array of result file's url
 * @property {string} componentID - component.ID
 * @property {string} filename    - relative path from projectRoot
 * @property {string} url         - URL to view result file
 *
 */

const cleanProject = async(projectRootDir)=>{
  const rootDispatcher = rootDispatchers.get(projectRootDir);
  if (rootDispatcher) {
    rootDispatchers.delete(projectRootDir);
  }
  const dispatchedTasks = tasks.get(projectRootDir);
  await cancelDispatchedTasks(projectRootDir, dispatchedTasks);
  dispatchedTasks.clear();
  removeSsh(projectRootDir);


  await gitResetHEAD(projectRootDir);
  await gitClean(projectRootDir);
  const projectJson = await readJsonGreedy(path.resolve(projectRootDir, projectJsonFilename));

  const ee = eventEmitters.get(projectRootDir);
  if (ee) {
    ee.emit("projectStateChanged", projectJson);
  }
};

/*
 *
  runProject,
  stopProject,
  pauseProject,
  saveProject,
  revertProject
  */

module.exports = {
  cleanProject
};
