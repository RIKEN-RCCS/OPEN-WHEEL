/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import fs from "fs-extra";
import path from "path";
import isPathInside from "is-path-inside";
import { projectJsonFilename } from "../db/db.js";
import { readJsonGreedy } from "./fileUtils.js";
import { writeJsonWrapper } from "../lib/utility.js";
import { gitAdd } from "./gitOperator2.js";
import { replacePathsep, convertPathSep } from "./pathUtils.js";

const _internal = {
  fs,
  readJsonGreedy,
  writeJsonWrapper,
  gitAdd
};

/**
 * remove component path from project JSON
 * @param {string} projectRootDir - project's root path
 * @param {string[]} IDs - component IDs to remove
 * @param {boolean} force - force removal even if path exists
 * @returns {Promise} - git add promise
 */
export async function removeComponentPath(projectRootDir, IDs, force = false) {
  const filename = path.resolve(projectRootDir, projectJsonFilename);
  const projectJson = await _internal.readJsonGreedy(filename);
  for (const [id, componentPath] of Object.entries(projectJson.componentPath)) {
    if (IDs.includes(id)) {
      if (force || !await _internal.fs.pathExists(path.join(projectRootDir, componentPath))) {
        delete projectJson.componentPath[id];
      }
    }
  }

  await _internal.writeJsonWrapper(filename, projectJson);
  return _internal.gitAdd(projectRootDir, filename);
}

/**
 * update component path-id map
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - component ID
 * @param {string} absPath - component's absolute path
 * @returns {object} - component path map
 */
export async function updateComponentPath(projectRootDir, ID, absPath) {
  const filename = path.resolve(projectRootDir, projectJsonFilename);
  const projectJson = await _internal.readJsonGreedy(filename);

  let newRelativePath = replacePathsep(path.relative(projectRootDir, absPath));
  if (!newRelativePath.startsWith(".")) {
    newRelativePath = `./${newRelativePath}`;
  }

  const oldRelativePath = projectJson.componentPath[ID];
  if (typeof oldRelativePath !== "undefined") {
    for (const [k, v] of Object.entries(projectJson.componentPath)) {
      if (isPathInside(convertPathSep(v), convertPathSep(oldRelativePath)) || v === oldRelativePath) {
        projectJson.componentPath[k] = v.replace(oldRelativePath, newRelativePath);
      }
    }
  }

  projectJson.componentPath[ID] = newRelativePath;

  await _internal.writeJsonWrapper(filename, projectJson);
  await _internal.gitAdd(projectRootDir, filename);
  return projectJson.componentPath;
}

// Add exported functions to _internal for testing purposes
_internal.updateComponentPath = updateComponentPath;

export { _internal };
