/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import fs from "fs-extra";
import path from "path";
import Ajv from "ajv";
import { getLogger } from "../logSettings.js";
import getSchema from "../db/jsonSchemas.js";
import { getComponentDir } from "./componentJsonIO.js";
import { readJsonGreedy } from "./fileUtils.js";
import { remoteHost } from "../db/db.js";
import { getSsh, hasEntry } from "./sshManager.js";
import { getChildren } from "./workflowUtil.js";

const _internal = {
  getLogger,
  getComponentDir,
  readJsonGreedy,
  remoteHost,
  getSsh,
  hasEntry,
  getChildren
};
const logger = _internal.getLogger();

const ajv = new Ajv({
  allErrors: true,
  removeAdditional: false,
  useDefaults: false,
  coerceTypes: false,
  logger: {
    log: logger.debug.bind(logger),
    warn: logger.warn.bind(logger),
    error: logger.warn.bind(logger)
  }
});
const schema = getSchema("psSettingFile");
_internal.validate = ajv.compile(schema);

/**
 * check if script property has valid value
 * @param {string} projectRootDir - project's root path
 * @param {object} component - component which will be tested
 */
export async function checkScript(projectRootDir, component) {
  if (typeof component.script !== "string") {
    return Promise.reject(new Error("script is not specified"));
  }
  const componentDir = await _internal.getComponentDir(projectRootDir, component.ID, true);
  const filename = path.resolve(componentDir, component.script);

  let stat;
  try {
    stat = await fs.stat(filename);
  } catch (e) {
    if (e.code !== "ENOENT") {
      throw e;
    }
    return Promise.reject(new Error(`script is not existing file ${filename}`));
  }
  if (!stat.isFile()) {
    return Promise.reject(new Error(`script is not file ${filename}`));
  }
  return true;
}

/**
 * check if checker property has valid value
 * @param {string} projectRootDir - project's root path
 * @param {object} component - component which will be tested
 */
export async function checkChecker(projectRootDir, component) {
  if (typeof component.checker !== "string") {
    return Promise.reject(new Error("checker is not specified"));
  }

  //Checker must be a filename (not absolute path) under component directory
  if (path.isAbsolute(component.checker)) {
    return Promise.reject(new Error("checker must be a filename under component directory, not an absolute path"));
  }

  //Check if file exists in component directory
  const componentDir = await _internal.getComponentDir(projectRootDir, component.ID, true);
  const filename = path.resolve(componentDir, component.checker);

  let stat;
  try {
    stat = await fs.stat(filename);
  } catch (e) {
    if (e.code !== "ENOENT") {
      throw e;
    }
    return Promise.reject(new Error(`checker is not existing file ${filename}`));
  }
  if (!stat.isFile()) {
    return Promise.reject(new Error(`checker is not file ${filename}`));
  }
  return true;
}

/**
 * check if parameterFile property has valid value
 * @param {string} projectRootDir - project's root path
 * @param {object} component - component which will be tested
 */
export async function checkPSSettingFile(projectRootDir, component) {
  if (typeof component.parameterFile !== "string") {
    return Promise.reject(new Error("parameter setting file is not specified"));
  }
  const componentDir = await _internal.getComponentDir(projectRootDir, component.ID, true);
  const filename = path.resolve(componentDir, component.parameterFile);
  let stat;
  try {
    stat = await fs.stat(filename);
  } catch (e) {
    if (e.code !== "ENOENT") {
      throw e;
    }
    return Promise.reject(new Error(`parameter setting file is not existing ${filename}`));
  }
  if (!stat.isFile()) {
    return Promise.reject(new Error(`parameter setting file is not file ${filename}`));
  }
  try {
    const retry = process.env.NODE_ENV === "test" ? 0 : undefined;
    const PSSetting = await _internal.readJsonGreedy(filename, retry);
    _internal.validate(PSSetting);
  } catch (e) {
    if (e instanceof SyntaxError) {
      return Promise.reject(new Error(`parameter setting file is not JSON file ${filename}`));
    }
  }
  if (_internal.validate !== null && Array.isArray(_internal.validate.errors)) {
    const err = new Error("parameter setting file does not have valid JSON data");
    logger.debug(`validation error for ${component.name} (${component.ID}) :\n`, _internal.validate.errors);
    err.errors = _internal.validate.errors;
    return Promise.reject(err);
  }
  return true;
}

/**
 * check if scatter/gather recipes in PS setting file reference existing child components
 * @param {string} projectRootDir - project's root path
 * @param {object} component - PS component which will be tested
 * @returns {Promise<{ message: string, ignoreable: boolean }[]>} - array of validation errors; empty array means valid
 */
export async function checkPSNodeReferences(projectRootDir, component) {
  const componentDir = await _internal.getComponentDir(projectRootDir, component.ID, true);
  const filename = path.resolve(componentDir, component.parameterFile);
  const psSettings = await _internal.readJsonGreedy(filename, 0);

  const children = await _internal.getChildren(projectRootDir, component.ID, false);
  const childIDs = new Set(children.map((c)=>{ return c.ID; }));

  const errors = [];
  for (const recipe of (psSettings.scatter || [])) {
    if (recipe.dstNode && !childIDs.has(recipe.dstNode)) {
      errors.push({ message: `scatter dstNode '${recipe.dstNode}' is not a child component of ${component.name}`, ignoreable: false });
    }
  }
  for (const recipe of (psSettings.gather || [])) {
    if (recipe.srcNode && !childIDs.has(recipe.srcNode)) {
      errors.push({ message: `gather srcNode '${recipe.srcNode}' is not a child component of ${component.name}`, ignoreable: false });
    }
  }
  return errors;
}

/**
 * check if sourceScript exists on the remote host
 * @param {string} projectRootDir - project's root path
 * @param {object} component - component which will be tested
 * @returns {Promise<void>} - resolves if valid or SSH not connected (cannot verify), rejects with Error if file not found
 */
export async function checkSourceScript(projectRootDir, component) {
  if (!component.sourceScript || component.sourceScript.length === 0) {
    return;
  }
  const id = _internal.remoteHost.getID("name", component.host);
  if (!id) {
    return Promise.reject(new Error(`remote host ${component.host} not found`));
  }
  if (!_internal.hasEntry(projectRootDir, id)) {
    return;
  }
  const ssh = _internal.getSsh(projectRootDir, id);
  const rt = await ssh.exec(`test -f ${component.sourceScript}`, 0);
  if (rt !== 0) {
    return Promise.reject(new Error(`sourceScript '${component.sourceScript}' does not exist on ${component.host}`));
  }
}

export { _internal };
