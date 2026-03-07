/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import fs from "fs-extra";
import { remoteHost } from "../db/db.js";
import { isLocal } from "../../../common/checkComponent.js";
import { checkPSSettingFile } from "./fileValidator.js";
import { ValidationError } from "../lib/validationError.js";

const _internal = {
  remoteHost
};

/**
 * check if for component has valid values
 * @param {object} component - component which will be tested
 * @returns {ValidationError[]} - array of validation errors; empty array means valid
 */
export async function validateForLoop(component) {
  const errors = [];
  if (typeof component.start !== "number") {
    errors.push(new ValidationError(`start must be number`));
  }
  if (typeof component.step !== "number") {
    errors.push(new ValidationError(`step must be number`));
  }
  if (typeof component.end !== "number") {
    errors.push(new ValidationError(`end must be number`));
  }
  if (errors.length === 0 && (component.step === 0 || (component.end - component.start) * component.step < 0)) {
    errors.push(new ValidationError(`infinite loop`));
  }
  return errors;
}

/**
 * check if foreach component has valid values
 * @param {object} component - component which will be tested
 * @returns {ValidationError[]} - array of validation errors; empty array means valid
 */
export async function validateForeach(component) {
  if (!Array.isArray(component.indexList)) {
    return [new ValidationError(`index list is broken`)];
  }
  if (component.indexList.length <= 0) {
    return [new ValidationError(`index list is empty`)];
  }
  return [];
}

/**
 * check if storage component has valid values
 * @param {object} component - component which will be tested
 * @returns {ValidationError[]} - array of validation errors; empty array means valid
 */
export async function validateStorage(component) {
  if (typeof component.storagePath !== "string") {
    return [new ValidationError("storagePath is not set")];
  }
  if (isLocal(component)) {
    try {
      const stats = await fs.stat(component.storagePath);
      if (!stats.isDirectory()) {
        return [new ValidationError("specified path is not directory")];
      }
    } catch (e) {
      if (e.code === "ENOENT") {
        return [new ValidationError("specified path does not exist on localhost")];
      }
    }
  } else {
    const hostinfo = _internal.remoteHost.query("name", component.host);
    if (typeof hostinfo === "undefined") {
      return [new ValidationError(`remote host setting for ${component.host} not found`)];
    }
  }
  return [];
}

/**
 * check if parameterStudy component has valid values
 * @param {string} projectRootDir - project's root path
 * @param {object} component - component which will be tested
 * @returns {ValidationError[]} - array of validation errors; empty array means valid
 */
export async function validateParameterStudy(projectRootDir, component) {
  try {
    await checkPSSettingFile(projectRootDir, component);
    return [];
  } catch (err) {
    return [new ValidationError(err.message)];
  }
}

export { _internal };
