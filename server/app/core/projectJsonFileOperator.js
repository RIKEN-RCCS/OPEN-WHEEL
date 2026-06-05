/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */

import path from "path";
import { gitAdd } from "./gitOperator2.js";
import { projectJsonFilename } from "../db/db.js";
import { readJsonGreedy } from "./fileUtils.js";
import { getDateString, writeJsonWrapper } from "../lib/utility.js";
const _internal = {
  readJsonGreedy, gitAdd, writeJsonWrapper, getDateString
};

/**
 * get project JSON
 * @param {string} projectRootDir - project's root path
 * @returns {object} - project JSON data
 */
export async function getProjectJson(projectRootDir) {
  return _internal.readJsonGreedy(path.resolve(projectRootDir, projectJsonFilename));
};

/**
 * write project Json
 * @param {string} projectRootDir - project's root path
 * @param {object} projectJson - project JSON data
 * @param {boolean} dontGitAdd - if true, git add will not be performed
 * @returns {Promise} - resolved when write JSON file and git add performed
 */
export async function writeProjectJson(projectRootDir, projectJson, dontGitAdd = false) {
  const filename = path.resolve(projectRootDir, projectJsonFilename);
  await _internal.writeJsonWrapper(filename, projectJson);
  if (!dontGitAdd) {
    await _internal.gitAdd(projectRootDir, filename);
  }
  return true;
};

/**
 * read project JSON and update given property
 * @param {string} projectRootDir - project's root path
 * @param {object} propValuePairs - property name and new value pairs
 * @param {boolean} dontGitAdd - if true, git add will not be performed
 */
export async function updateProjectJsonProperty(projectRootDir, propValuePairs, dontGitAdd = false) {
  const projectJson = await getProjectJson(projectRootDir);
  Object.entries(propValuePairs).forEach(([property, value])=>{
    projectJson[property] = value;
  });
  await writeProjectJson(projectRootDir, projectJson, dontGitAdd);
}

/**
 * read project JSON file and return all component ID in project
 * @param {string} projectRootDir - project's root path
 * @returns {string[]} - array of id string
 */
export async function getAllComponentIDs(projectRootDir) {
  const projectJson = await getProjectJson(projectRootDir);
  return Object.keys(projectJson.componentPath);
};

/**
 * set or remove read-only status
 * @param {string} projectRootDir - project's root path
 * @param {boolean} readOnly - read only status
 */
export async function updateProjectROStatus(projectRootDir, readOnly) {
  await updateProjectJsonProperty(projectRootDir, { readOnly }, true);
}

/**
 * update project description
 * @param {string} projectRootDir - project's root path
 * @param {string} description - new project description
 */
export async function updateProjectDescription(projectRootDir, description) {
  await updateProjectJsonProperty(projectRootDir, { description });
}

/**
 * get project's status string
 * @param {string} projectRootDir - project's root path
 * @returns {string} -
 */
export async function getProjectState(projectRootDir) {
  const projectJson = await _internal.readJsonGreedy(path.resolve(projectRootDir, projectJsonFilename));
  return projectJson.state;
}

/**
 * set project status and write project metat data file
 * @param {string} projectRootDir - project's root path
 * @param {string} state - state to be set
 * @param {boolean} force - force update if already set given state
 * @returns {object|false} - new Project JSON meta data. false means meta data does not updated
 */
export async function setProjectState(projectRootDir, state, force) {
  const currentState = await getProjectState(projectRootDir);
  if (currentState === state && !force) {
    return false;
  }
  const mtime = _internal.getDateString(true);
  await updateProjectJsonProperty(projectRootDir, { state, mtime });
  return await getProjectJson(projectRootDir);
}

export { _internal };
