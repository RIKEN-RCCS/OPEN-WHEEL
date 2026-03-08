/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import fs from "fs-extra";
import path from "path";
import { minimatch } from "minimatch";
import { isValidInputFilename, isValidOutputFilename } from "../lib/utility.js";
import { getComponentDir } from "./componentJsonIO.js";
import { createValidationError } from "../lib/validationError.js";

const _internal = {
  getComponentDir,
  fs
};

/**
 * validate inputFiles
 * @param {object} component - any component object which has inputFiles prop
 * @returns {{ message: string, ignoreable: boolean }[]} - array of validation errors; empty array means valid
 */
export async function validateInputFiles(component) {
  const errors = [];
  for (const inputFile of component.inputFiles) {
    const filename = inputFile.name;
    if (!isValidInputFilename(filename)) {
      errors.push(createValidationError(`'${filename}' is not allowed as input file.`));
    } else if (inputFile.src.length > 1 && !(filename[filename.length - 1] === "/" || filename[filename.length - 1] === "\\")) {
      errors.push(createValidationError(`inputFile '${inputFile.name}' data type is 'file' but it has two or more outputFiles.`));
    }
    if (inputFile.mandatory === true && inputFile.src.length === 0) {
      errors.push(createValidationError(`mandatory inputFile '${inputFile.name}' is not connected`));
    }
  }
  return errors;
}

/**
 * validate outputFiles
 * @param {object} component - any component object which has outputFiles prop
 * @returns {{ message: string, ignoreable: boolean }[]} - array of validation errors; empty array means valid
 */
export async function validateOutputFiles(component) {
  const errors = [];
  for (const outputFile of component.outputFiles) {
    const filename = outputFile.name;
    if (!isValidOutputFilename(filename)) {
      errors.push(createValidationError(`'${filename}' is not allowed as output filename.`));
    }
  }
  return errors;
}

/**
 * check if keep property has valid value
 * @param {object} component - component which will be tested
 * @returns {{ message: string, ignoreable: boolean }[]} - array of validation errors; empty array means valid
 */
export async function validateKeepProp(component) {
  if (Object.prototype.hasOwnProperty.call(component, "keep")) {
    if (component.keep === null || component.keep === "") {
      return [];
    }
    if (!(Number.isInteger(component.keep) && component.keep >= 0)) {
      return [createValidationError(`keep must be positive integer`)];
    }
  }
  return [];
}

/**
 * check if condition property has valid value
 * @param {string} projectRootDir - project's root path
 * @param {object} component - component which will be tested
 * @returns {{ message: string, ignoreable: boolean }[]} - array of validation errors; empty array means valid
 */
export async function validateConditionalCheck(projectRootDir, component) {
  if (typeof component.condition !== "string") {
    return [createValidationError(`condition is not specified`)];
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
    return [createValidationError(`condition is exist but it is not file ${filename}`)];
  }
  //if the file which name is component.condition does not exists
  //component.condition will be eval as expression of javascript
  //so, we can not test the value any more here

  return [];
}

/**
 * check if any connected inputFile would overwrite an existing local file in the component directory.
 * This is an ignoreable warning — the user may intentionally want the incoming file to replace a local one.
 * @param {string} projectRootDir - project's root path
 * @param {object} component - component which will be tested
 * @returns {{ message: string, ignoreable: boolean }[]} - array of ignoreable validation errors; empty array means no conflict
 */
export async function validateInputFileOverwrite(projectRootDir, component) {
  const errors = [];
  const componentDir = await _internal.getComponentDir(projectRootDir, component.ID, true);
  for (const inputFile of component.inputFiles) {
    if (inputFile.src.length === 0) {
      continue;
    }
    const localPath = path.resolve(componentDir, inputFile.name);
    let stat;
    try {
      stat = await _internal.fs.stat(localPath);
    } catch (e) {
      if (e.code !== "ENOENT") {
        throw e;
      }
    }
    if (stat) {
      errors.push(createValidationError(
        `inputFile '${inputFile.name}' will overwrite an existing local file`,
        { ignoreable: true }
      ));
    }
  }
  return errors;
}

/**
 * check whether two destination paths could conflict at runtime.
 * Handles exact strings and glob patterns on either side.
 * @param {string} destA - first destination path (may contain glob characters)
 * @param {string} destB - second destination path (may contain glob characters)
 * @returns {boolean} - true if the two destinations could refer to the same file
 */
function couldConflict(destA, destB) {
  if (destA === destB) {
    return true;
  }
  return minimatch(destB, destA) || minimatch(destA, destB);
}

/**
 * check if any two incoming files to one component could land at the same destination path,
 * causing a race condition (one overwriting the other).
 * Checks across all inputFiles, not just within a single inputFile's src array.
 * For directory-type inputFiles the effective destination is inputFile.name joined with srcName.
 * For file-type inputFiles the effective destination is inputFile.name.
 * Glob patterns in srcName are compared using minimatch so that e.g. "*.txt" and "result.txt" are
 * detected as potentially conflicting.
 * This is an ignoreable warning — the user may intentionally accept the last-write-wins behaviour.
 * @param {object} component - component which will be tested
 * @returns {{ message: string, ignoreable: boolean }[]} - array of ignoreable validation errors; empty array means no conflict
 */
export async function validateInputFileRaceCondition(component) {
  const errors = [];

  //Build a flat list of all incoming file routes: { dest, label }
  const routes = [];
  for (const inputFile of component.inputFiles) {
    const filename = inputFile.name;
    const isDir = filename[filename.length - 1] === "/" || filename[filename.length - 1] === "\\";
    for (const src of inputFile.src) {
      const dest = isDir ? path.join(filename, src.srcName || "") : filename;
      routes.push({ dest, label: `${inputFile.name}(srcName:${src.srcName})` });
    }
  }

  //Check every pair of routes for conflicts
  const reported = new Set();
  for (let i = 0; i < routes.length; i++) {
    for (let j = i + 1; j < routes.length; j++) {
      const a = routes[i];
      const b = routes[j];
      if (couldConflict(a.dest, b.dest)) {
        const key = `${a.label}|${b.label}`;
        if (!reported.has(key)) {
          reported.add(key);
          errors.push(createValidationError(
            `incoming file '${a.dest}' from '${a.label}' and '${b.dest}' from '${b.label}' may conflict — race condition possible`,
            { ignoreable: true }
          ));
        }
      }
    }
  }
  return errors;
}

export { _internal };
