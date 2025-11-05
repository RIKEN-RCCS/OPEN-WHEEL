/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import fs from "fs-extra";
import path from "path";
import { isValidInputFilename, isValidOutputFilename } from "../lib/utility.js";
import { getComponentDir } from "./componentJsonIO.js";

const _internal = {
  getComponentDir
};

/**
 * validate inputFiles
 * @param {object} component - any component object which has inputFiles prop
 * @returns {true|Error} - inputFile is valid or not
 */
export async function validateInputFiles(component) {
  for (const inputFile of component.inputFiles) {
    const filename = inputFile.name;
    if (!isValidInputFilename(filename)) {
      return Promise.reject(new Error(`'${filename}' is not allowed as input file.`));
    }
    if (inputFile.src.length > 1 && !(filename[filename.length - 1] === "/" || filename[filename.length - 1] === "\\")) {
      return Promise.reject(new Error(`inputFile '${inputFile.name}' data type is 'file' but it has two or more outputFiles.`));
    }
  }
  return true;
}

/**
 * validate outputFiles
 * @param {object} component - any component object which has putFiles prop
 * @returns {true|Error} - outputFile is valid or not
 */
export async function validateOutputFiles(component) {
  for (const outputFile of component.outputFiles) {
    const filename = outputFile.name;
    if (!isValidOutputFilename(filename)) {
      return Promise.reject(new Error(`'${filename}' is not allowed as output filename.`));
    }
  }
  return true;
}

/**
 * check if keep property has valid value
 * @param {object} component - component which will be tested
 */
export async function validateKeepProp(component) {
  if (Object.prototype.hasOwnProperty.call(component, "keep")) {
    if (component.keep === null || component.keep === "") {
      return true;
    }
    if (!(Number.isInteger(component.keep) && component.keep >= 0)) {
      return Promise.reject(new Error(`keep must be positive integer`));
    }
  }
  return true;
}

/**
 * check if condition property has valid value
 * @param {string} projectRootDir - project's root path
 * @param {object} component - component which will be tested
 */
export async function validateConditionalCheck(projectRootDir, component) {
  if (typeof component.condition !== "string") {
    return Promise.reject(new Error(`condition is not specified`));
  }
  const componentDir = await _internal.getComponentDir(projectRootDir, component.ID, true);
  let stat;
  try {
    const filename = path.resolve(componentDir, component.condition);
    stat = await fs.stat(filename);
  } catch (e) {
    if (e.code !== "ENOENT") {
      throw e;
    }
  }
  if (!stat.isFile()) {
    const filename = path.resolve(componentDir, component.condition);
    return Promise.reject(new Error(`condition is exist but it is not file ${filename}`));
  }
  //if the file which name is component.condition does not exists
  //component.condition will be eval as expression of javascript
  //so, we can not test the value any more here

  return true;
}
export { _internal };
