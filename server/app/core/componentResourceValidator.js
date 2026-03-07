/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import fs from "fs-extra";
import path from "path";
import { isValidInputFilename, isValidOutputFilename } from "../lib/utility.js";
import { getComponentDir } from "./componentJsonIO.js";
import { ValidationError } from "../lib/validationError.js";

const _internal = {
  getComponentDir
};

/**
 * validate inputFiles
 * @param {object} component - any component object which has inputFiles prop
 * @returns {ValidationError[]} - array of validation errors; empty array means valid
 */
export async function validateInputFiles(component) {
  const errors = [];
  for (const inputFile of component.inputFiles) {
    const filename = inputFile.name;
    if (!isValidInputFilename(filename)) {
      errors.push(new ValidationError(`'${filename}' is not allowed as input file.`));
    } else if (inputFile.src.length > 1 && !(filename[filename.length - 1] === "/" || filename[filename.length - 1] === "\\")) {
      errors.push(new ValidationError(`inputFile '${inputFile.name}' data type is 'file' but it has two or more outputFiles.`));
    }
    if (inputFile.mandatory === true && inputFile.src.length === 0) {
      errors.push(new ValidationError(`mandatory inputFile '${inputFile.name}' is not connected`));
    }
  }
  return errors;
}

/**
 * validate outputFiles
 * @param {object} component - any component object which has outputFiles prop
 * @returns {ValidationError[]} - array of validation errors; empty array means valid
 */
export async function validateOutputFiles(component) {
  const errors = [];
  for (const outputFile of component.outputFiles) {
    const filename = outputFile.name;
    if (!isValidOutputFilename(filename)) {
      errors.push(new ValidationError(`'${filename}' is not allowed as output filename.`));
    }
  }
  return errors;
}

/**
 * check if keep property has valid value
 * @param {object} component - component which will be tested
 * @returns {ValidationError[]} - array of validation errors; empty array means valid
 */
export async function validateKeepProp(component) {
  if (Object.prototype.hasOwnProperty.call(component, "keep")) {
    if (component.keep === null || component.keep === "") {
      return [];
    }
    if (!(Number.isInteger(component.keep) && component.keep >= 0)) {
      return [new ValidationError(`keep must be positive integer`)];
    }
  }
  return [];
}

/**
 * check if condition property has valid value
 * @param {string} projectRootDir - project's root path
 * @param {object} component - component which will be tested
 * @returns {ValidationError[]} - array of validation errors; empty array means valid
 */
export async function validateConditionalCheck(projectRootDir, component) {
  if (typeof component.condition !== "string") {
    return [new ValidationError(`condition is not specified`)];
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
  if (stat && !stat.isFile()) {
    const filename = path.resolve(componentDir, component.condition);
    return [new ValidationError(`condition is exist but it is not file ${filename}`)];
  }
  //if the file which name is component.condition does not exists
  //component.condition will be eval as expression of javascript
  //so, we can not test the value any more here

  return [];
}
export { _internal };
