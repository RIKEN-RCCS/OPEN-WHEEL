/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path = require("path");
const fs = require("fs-extra");
const { componentJsonFilename, projectJsonFilename } = require("../db/db");
const { gitAdd } = require("./gitOperator2");
const { readJsonGreedy } = require("./fileUtils");

/**
 * remove temporaly props from component
 * memo: this function should be used with JSON.stringify
 * @param {string} key -
 * @param {string} value -
 * @returns {string | undefined} -
 */
function componentJsonReplacer(key, value) {
  if (["handler", "doCleanup", "sbsID", "childLoopRunning"].includes(key)) {
    return undefined;
  }
  return value;
}

/**
 * return component's absolute or relative path
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - id string for the component
 * @param {boolean} isAbsolute - return absolute path if true
 * @returns {string} - path of component dir
 */
async function getComponentDir(projectRootDir, ID, isAbsolute) {
  const projectJson = await readJsonGreedy(path.resolve(projectRootDir, projectJsonFilename));
  const relativePath = projectJson.componentPath[ID];
  if (relativePath) {
    return isAbsolute ? path.resolve(projectRootDir, relativePath) : relativePath;
  }
  return null;
}

/**
 * get relative path from srcComponent to targetComponent
 * @param {string} projectRootDir - project's root path
 * @param {string} srcComponentID - id of the component which will be starting point to calc relative path
 * @param {string} targetComponentID - id string of target component
 * @returns { string} - relative path from srcComponent to targetComponent
 */
async function getComponentRelativePathFromAnotherComponent(projectRootDir, srcComponentID, targetComponentID) {
  const projectJson = await readJsonGreedy(path.resolve(projectRootDir, projectJsonFilename));
  const srcRelativePath = projectJson.componentPath[srcComponentID];
  const targetRelativePath = projectJson.componentPath[targetComponentID];
  return path.relative(srcRelativePath, targetRelativePath);
}

/**
 * write component JSON file and git add
 * @param {string} projectRootDir - project's root path
 * @param {string} componentDir - absolute or relative path to component directory
 * @param {object} component - component JSON data
 * @param {boolean} doNotAdd - call gitAdd if false
 */
async function writeComponentJson(projectRootDir, componentDir, component, doNotAdd = false) {
  const filename = path.join(componentDir, componentJsonFilename);
  await fs.writeJson(filename, component, { spaces: 4, replacer: componentJsonReplacer });

  if (doNotAdd) {
    return;
  }
  return gitAdd(projectRootDir, filename);
}

/**
 * read component Json by directory
 * @param {string} componentDir - absolute or relative path to component directory
 * @returns {object} - component JSON data
 */
async function readComponentJson(componentDir) {
  const filename = path.join(componentDir, componentJsonFilename);
  const componentJson = await readJsonGreedy(filename);
  return componentJson;
}

/**
 * write componentJson by ID
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - component's ID string
 * @param {object} component - component JSON data
 * @param {boolean} doNotAdd - call gitAdd if false
 */
async function writeComponentJsonByID(projectRootDir, ID, component, doNotAdd) {
  const componentDir = await getComponentDir(projectRootDir, ID, true);
  return writeComponentJson(projectRootDir, componentDir, component, doNotAdd);
}

/**
 * read componentJson by ID
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - component's ID string
 * @returns {object} - component JSON data
 */
async function readComponentJsonByID(projectRootDir, ID) {
  const componentDir = await getComponentDir(projectRootDir, ID, true);
  return readComponentJson(componentDir);
}

module.exports = {
  getComponentDir,
  getComponentRelativePathFromAnotherComponent,
  writeComponentJson,
  writeComponentJsonByID,
  readComponentJson,
  readComponentJsonByID
};
