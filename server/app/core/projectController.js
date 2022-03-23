/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License.txt in the project root for the license information.
 */
"use strict";
const path = require("path");
const fs = require("fs-extra");
const EventEmitter = require("events");
const { readJsonGreedy } = require("../core/fileUtils");
const { gitResetHEAD, gitClean } = require("../core/gitOperator2");
const { removeSsh } = require("./sshManager");
const { defaultCleanupRemoteRoot, projectJsonFilename, componentJsonFilename } = require("../db/db");
const { componentJsonReplacer } = require("./componentFilesOperator");
const Dispatcher = require("./dispatcher");
const { getDateString } = require("../lib/utility");

const rootDispatchers = new Map();
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


async function updateProjectState(projectRootDir, state, projectJson) {
  projectJson.state = state;
  projectJson.mtime = getDateString(true);
  const ee = eventEmitters.get(projectRootDir);
  ee.emit("projectStateChanged", projectJson);
  return fs.writeJson(path.resolve(projectRootDir, projectJsonFilename), projectJson, { spaces: 4 });
}


const cleanProject = async(projectRootDir)=>{
  const rootDispatcher = rootDispatchers.get(projectRootDir);
  if (rootDispatcher) {
    await rootDispatcher.remove();
    rootDispatchers.delete(projectRootDir);
  }
  removeSsh(projectRootDir);

  await gitResetHEAD(projectRootDir);
  await gitClean(projectRootDir);
  const projectJson = await readJsonGreedy(path.resolve(projectRootDir, projectJsonFilename));
  await updateProjectState(projectRootDir, projectJson);
};

async function pauseProject(projectRootDir) {
  const rootDispatcher = rootDispatchers.get(projectRootDir);
  if (rootDispatcher) {
    await rootDispatcher.pause();
  }

  const projectJson = await readJsonGreedy(path.resolve(projectRootDir, projectJsonFilename));
  await updateProjectState("paused", projectJson);
}

async function stopProject(projectRootDir) {
  const rootDispatcher = rootDispatchers.get(projectRootDir);
  if (rootDispatcher) {
    await rootDispatcher.stop();
  }

  const projectJson = await readJsonGreedy(path.resolve(projectRootDir, projectJsonFilename));
  await updateProjectState("not-started", projectJson);
}

async function runProject(projectRootDir) {
  if (rootDispatchers.has(projectRootDir)) {
    return new Error(`project is already running ${projectRootDir}`);
  }

  const projectJson = await readJsonGreedy(path.resolve(projectRootDir, projectJsonFilename));
  const rootWF = await readJsonGreedy(path.resolve(projectRootDir, componentJsonFilename));

  const ee = new EventEmitter();
  eventEmitters.set(projectRootDir, ee);

  const rootDispatcher = new Dispatcher(projectRootDir,
    rootWF.ID,
    projectRootDir,
    getDateString(),
    projectJson.componentPath,
    ee.emit.bind(ee));

  if (rootWF.cleanupFlag === "2") {
    rootDispatcher.doCleanup = defaultCleanupRemoteRoot;
  }
  rootDispatchers.set(projectRootDir, rootDispatcher);

  await updateProjectState(projectRootDir, "running", projectJson);
  rootWF.state = await rootDispatcher.start();
  await updateProjectState(projectRootDir, rootWF.state, projectJson);

  await fs.writeJson(path.resolve(projectRootDir, componentJsonFilename), rootWF, { spaces: 4, replacer: componentJsonReplacer });

  eventEmitters.delete(projectRootDir);
  rootDispatchers.delete(projectRootDir);
  removeSsh(projectRootDir);
  return rootWF.state;
}


module.exports = {
  cleanProject,
  runProject,
  pauseProject,
  stopProject
};
