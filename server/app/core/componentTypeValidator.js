/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import fs from "fs-extra";
import { remoteHost } from "../db/db.js";
import { isLocalComponent } from "./workflowComponent.js";
import { checkPSSettingFile } from "./fileValidator.js";

const _internal = {
  remoteHost
};

/**
 * check if for component has valid values
 * @param {object} component - component which will be tested
 */
export async function validateForLoop(component) {
  if (typeof component.start !== "number") {
    return Promise.reject(new Error(`start must be number`));
  }
  if (typeof component.step !== "number") {
    return Promise.reject(new Error(`step must be number`));
  }
  if (typeof component.end !== "number") {
    return Promise.reject(new Error(`end must be number`));
  }
  if (component.step === 0 || (component.end - component.start) * component.step < 0) {
    return Promise.reject(new Error(`infinite loop`));
  }
  return true;
}

/**
 * check if foreach component has valid values
 * @param {object} component - component which will be tested
 */
export async function validateForeach(component) {
  if (!Array.isArray(component.indexList)) {
    return Promise.reject(new Error(`index list is broken`));
  }
  if (component.indexList.length <= 0) {
    return Promise.reject(new Error(`index list is empty`));
  }
  return true;
}

/**
 * check if storage component has valid values
 * @param {object} component - component which will be tested
 */
export async function validateStorage(component) {
  if (typeof component.storagePath !== "string") {
    return Promise.reject(new Error("storagePath is not set"));
  }
  if (isLocalComponent(component)) {
    try {
      const stats = await fs.stat(component.storagePath);
      if (!stats.isDirectory()) {
        return Promise.reject(new Error("specified path is not directory"));
      }
    } catch (e) {
      if (e.code === "ENOENT") {
        return Promise.reject(new Error("specified path does not exist on localhost"));
      }
    }
  } else {
    const hostinfo = _internal.remoteHost.query("name", component.host);
    if (typeof hostinfo === "undefined") {
      //local job is not implemented
      return Promise.reject(new Error(`remote host setting for ${component.host} not found`));
    }
  }
  return true;
}

export const validateParameterStudy = checkPSSettingFile;

export { _internal };
