/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path = require("path");
const fs = require("fs-extra");
const { readJsonGreedy } = require("../core/fileUtils");
const { gitResetHEAD, gitClean } = require("../core/gitOperator2");
const { removeSsh } = require("./sshManager");
const { defaultCleanupRemoteRoot, projectJsonFilename, componentJsonFilename } = require("../db/db");
const { setProjectState } = require("../core/projectFilesOperator");
const { writeComponentJson, readComponentJson } = require("./componentJsonIO.js");
const Dispatcher = require("./dispatcher");
const { getDateString } = require("../lib/utility");
const { getLogger } = require("../logSettings.js");
const { eventEmitters } = require("./global.js");
const rootDispatchers = new Map();

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

async function updateProjectState(projectRootDir, state) {
  const projectJson = await setProjectState(projectRootDir, state);
  if (projectJson) {
    const ee = eventEmitters.get(projectRootDir);
    if (ee) {
      ee.emit("projectStateChanged", projectJson);
    }
  }
}
const cleanProject = async (projectRootDir)=>{
  const { ID } = await readComponentJson(projectRootDir);
  const viewerURLRoot = path.resolve(path.dirname(__dirname), "viewer");
  const viewerDir = path.join(viewerURLRoot, ID);
  if (fs.pathExists(viewerDir)) {
    fs.remove(viewerDir);
  }

  await gitResetHEAD(projectRootDir);
  await gitClean(projectRootDir);
  //project state must be updated by onCleanProject()
};
async function pauseProject(projectRootDir) {
  const rootDispatcher = rootDispatchers.get(projectRootDir);
  if (rootDispatcher) {
    await rootDispatcher.pause();
  }
  //project state must be updated by onPauseProject()
}
async function stopProject(projectRootDir) {
  const rootDispatcher = rootDispatchers.get(projectRootDir);
  if (rootDispatcher) {
    await rootDispatcher.remove();
    rootDispatchers.delete(projectRootDir);
  }
  removeSsh(projectRootDir);
  //project state must be updated by onStopProject()
}
async function runProject(projectRootDir) {
  if (rootDispatchers.has(projectRootDir)) {
    return new Error(`project is already running ${projectRootDir}`);
  }

  const projectJson = await readJsonGreedy(path.resolve(projectRootDir, projectJsonFilename));
  const rootWF = await readJsonGreedy(path.resolve(projectRootDir, componentJsonFilename));

  const rootDispatcher = new Dispatcher(projectRootDir,
    rootWF.ID,
    projectRootDir,
    getDateString(),
    projectJson.componentPath,
    rootWF.env);
  if (rootWF.cleanupFlag === "2") {
    rootDispatcher.doCleanup = defaultCleanupRemoteRoot;
  }
  rootDispatchers.set(projectRootDir, rootDispatcher);

  await updateProjectState(projectRootDir, "running", projectJson);
  getLogger(projectRootDir).info("project start");
  rootWF.state = await rootDispatcher.start();
  getLogger(projectRootDir).info("project finished");
  await updateProjectState(projectRootDir, rootWF.state, projectJson);
  await writeComponentJson(projectRootDir, projectRootDir, rootWF, true);
  rootDispatchers.delete(projectRootDir);
  return rootWF.state;
}

module.exports = {
  cleanProject,
  runProject,
  pauseProject,
  stopProject
};
