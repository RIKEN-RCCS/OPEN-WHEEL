/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import { readComponentJsonByID } from "./componentJsonIO.js";

const _internal = {
  readComponentJsonByID
};

/**
 * check if component is parent of another component
 * @param {string} projectRootDir - project's root path
 * @param {string} parentID - parent component ID
 * @param {string} childID - child component ID
 * @returns {Promise<boolean>} - true if parent, false otherwise
 */
export async function isParent(projectRootDir, parentID, childID) {
  if (parentID === "parent") {
    return true;
  }
  if (childID === "parent") {
    return false;
  }
  const childJson = await _internal.readComponentJsonByID(projectRootDir, childID);
  if (childJson === null || typeof childID !== "string") {
    return false;
  }
  return childJson.parent === parentID;
}

export { _internal };
