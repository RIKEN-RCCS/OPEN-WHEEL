/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import { diff } from "just-diff";
import { diffApply } from "just-diff-apply";
import { readComponentJsonByID, writeComponentJsonByID } from "./componentJsonIO.js";

const _internal = {
  diff,
  diffApply,
  readComponentJsonByID,
  writeComponentJsonByID
};

/**
 * get env setting on component
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - component ID
 * @returns {object} - environment variables
 */
export async function getEnv(projectRootDir, ID) {
  const componentJson = await _internal.readComponentJsonByID(projectRootDir, ID);
  const env = componentJson.env || {};
  return env;
}

/**
 * replace env setting on component
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - component ID
 * @param {object} newEnv - new environment variables
 * @returns {object} - updated component JSON
 */
export async function replaceEnv(projectRootDir, ID, newEnv) {
  const componentJson = await _internal.readComponentJsonByID(projectRootDir, ID);
  const env = componentJson.env || {};
  const patch = _internal.diff(env, newEnv);
  _internal.diffApply(env, patch);
  componentJson.env = env;
  await _internal.writeComponentJsonByID(projectRootDir, ID, componentJson);
  return componentJson;
}

export { _internal };
