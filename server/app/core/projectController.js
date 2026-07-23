/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import path from "path";
import { readJsonGreedy } from "../core/fileUtils.js";
import { gitResetHEAD, gitClean } from "../core/gitOperator2.js";
import { removeSsh } from "./sshManager.js";
import { removeExecuters } from "./executerManager.js";
import { removeTransferrers } from "./transferManager.js";
import { runDeferredCleanups, clearDeferredCleanups } from "./transferrer.js";
import { defaultCleanupRemoteRoot, projectJsonFilename, componentJsonFilename } from "../db/db.js";
import { setProjectState } from "../core/projectJsonFileOperator.js";
import { writeComponentJson } from "./componentJsonIO.js";
import Dispatcher from "./dispatcher.js";
import { getDateString } from "../lib/utility.js";
import { getLogger } from "../logSettings.js";
import { eventEmitters } from "./global.js";

const _internal = {
  rootDispatchers: new Map(),
  eventEmitters,
  gitClean,
  gitResetHEAD,
  setProjectState
};

/**
 * @event projectStateChanged
 * @type {object} - updated projectJson
 * @event taskStateChanged
 * @type {object} - updated task object
 * @event componentStateChanged
 * @type {object} - updated component Json
 * @event resultFilesReady
 * @type {object[]} - array of result file's url
 * @property {string} componentID - component.ID
 * @property {string} filename    - relative path from projectRoot
 * @property {string} url         - URL to view result file
 */

/**
 * update project status
 * @param {string} projectRootDir - project's root path
 * @param {string} state - status
 */
async function updateProjectState(projectRootDir, state) {
  const projectJson = await _internal.setProjectState(projectRootDir, state);
  if (projectJson) {
    const ee = _internal.eventEmitters.get(projectRootDir);
    if (ee) {
      ee.emit("projectStateChanged", projectJson);
    }
  }
}

/**
 * clean up project
 * @param {string} projectRootDir - project's root path
 * @param {string} targetDir - If this argument is specified, limit git clean operations to under this directory
 */
async function cleanProject(projectRootDir, targetDir) {
  await _internal.gitResetHEAD(projectRootDir, targetDir);
  await _internal.gitClean(projectRootDir, targetDir);
  //project state must be updated by onCleanProject()
  //temp dirs also removed by onCleanProject()
};

/**
 * stop project run
 * @param {string} projectRootDir - project's root path
 * @param {string} reasonState - state of the component which caused this stop ("failed" or
 * "unknown"), if any. when given, it is recorded on the root dispatcher before it is torn
 * down so that the outcome it hands back to runProject() correctly reflects why the project
 * was stopped, instead of racing against the (asynchronously, sometimes later-arriving)
 * "taskCompleted" event that would normally record it.
 */
async function stopProject(projectRootDir, reasonState) {
  const rootDispatcher = _internal.rootDispatchers.get(projectRootDir);
  if (rootDispatcher) {
    if (reasonState) {
      rootDispatcher.setStateFlag(reasonState);
    }
    await rootDispatcher.remove();
    _internal.rootDispatchers.delete(projectRootDir);
  }
  clearDeferredCleanups(projectRootDir);
  removeExecuters(projectRootDir);
  removeTransferrers(projectRootDir);
  removeSsh(projectRootDir);
  //project state must be updated by onStopProject()
}

/**
 * run project
 * @param {string} projectRootDir - project's root path
 * @returns {string} - project status after run
 */
async function runProject(projectRootDir) {
  if (_internal.rootDispatchers.has(projectRootDir)) {
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
  _internal.rootDispatchers.set(projectRootDir, rootDispatcher);

  await updateProjectState(projectRootDir, "running", projectJson);
  getLogger(projectRootDir).info("project start");
  rootWF.state = await rootDispatcher.start();
  getLogger(projectRootDir).info(`project ${rootWF.state}`);
  await updateProjectState(projectRootDir, rootWF.state, projectJson);
  await writeComponentJson(projectRootDir, projectRootDir, rootWF, true);
  _internal.rootDispatchers.delete(projectRootDir);
  await runDeferredCleanups(projectRootDir);
  removeExecuters(projectRootDir);
  removeTransferrers(projectRootDir);
  removeSsh(projectRootDir);
  return rootWF.state;
}

export { cleanProject, runProject, stopProject, updateProjectState, _internal };
