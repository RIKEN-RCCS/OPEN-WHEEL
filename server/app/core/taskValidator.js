/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */

import { isInitialComponent, isLocal } from "./workflowComponent.js";
import { remoteHost } from "../db/db.js";
import { jobScheduler } from "../db/db.js";
import { checkScript, checkChecker } from "./fileValidator.js";
import { validateConditionalCheck } from "./componentResourceValidator.js";

const _internal = {
  isInitialComponent,
  jobScheduler,
  remoteHost
};

/**
 * check if task component has valid values
 * @param {string} projectRootDir - project's root path
 * @param {object} component - component which will be tested
 */
export async function validateTask(projectRootDir, component) {
  if (component.name === null) {
    return Promise.reject(new Error(`illegal path`));
  }
  //if (typeof component.host === "string" && component.host !== "localhost") {
  if (!isLocal(component)) {
    const hostinfo = _internal.remoteHost.query("name", component.host);
    if (typeof hostinfo === "undefined") {
      //local job is not implemented
      return Promise.reject(new Error(`remote host setting for ${component.host} not found`));
    }
    if (component.useJobScheduler) {
      if (!Object.keys(_internal.jobScheduler).includes(hostinfo.jobScheduler)) {
        return Promise.reject(new Error(`job scheduler for ${hostinfo.name} (${hostinfo.jobScheduler}) is not supported`));
      }
      if (component.submitOption) {
        const optList = String(_internal.jobScheduler[hostinfo.jobScheduler].queueOpt).split(" ");
        if (optList.map((opt)=>{
          return component.submitOption.indexOf(opt);
        }).every((i)=>{
          return i >= 0;
        })) {
          return Promise.reject(new Error(`submit option duplicate queue option : ${_internal.jobScheduler[hostinfo.jobScheduler].queueOpt}`));
        }
      }
    }
  }
  await checkScript(projectRootDir, component);
  if (component.checker) {
    await checkChecker(projectRootDir, component);
  }
  return true;
}

/**
 * check if stepjobTask component has valid values
 * @param {string} projectRootDir - project's root path
 * @param {object} component - component which will be tested
 */
export async function validateStepjobTask(projectRootDir, component) {
  const isInitial = await _internal.isInitialComponent(projectRootDir, component);
  if (component.name === null) {
    return Promise.reject(new Error(`illegal path`));
  }
  if (component.useDependency && isInitial) {
    return Promise.reject(new Error("initial stepjobTask cannot specified the Dependency form"));
  }
  return checkScript(projectRootDir, component);
}

/**
 * check if stepjob component has valid values
 * @param {string} projectRootDir - project's root path
 * @param {object} component - component which will be tested
 */
export async function validateStepjob(projectRootDir, component) {
  if (!component.useJobScheduler) {
    return Promise.reject(new Error(`useJobScheduler must be set`));
  }
  if (isLocal(component)) {
    return Promise.reject(new Error("stepjob is only supported on remotehost"));
  }

  const hostinfo = _internal.remoteHost.query("name", component.host);
  if (typeof hostinfo === "undefined") {
    //local job is not implemented
    return Promise.reject(new Error(`remote host setting for ${component.host} not found`));
  }
  if (!Object.keys(_internal.jobScheduler).includes(hostinfo.jobScheduler)) {
    return Promise.reject(new Error(`job scheduler for ${hostinfo.name} (${hostinfo.jobScheduler}) is not supported`));
  }
  const setJobScheduler = _internal.jobScheduler[hostinfo.jobScheduler];
  if (!setJobScheduler.supportStepjob) {
    return Promise.reject(new Error(`job scheduler (${hostinfo.jobScheduler}) does not support stepjob`));
  }
  if (!hostinfo.useStepjob) {
    return Promise.reject(new Error(`${hostinfo.name} does not set to use stepjob`));
  }
  return true;
}

/**
 * check if bulkjobTask component has valid values
 * @param {string} projectRootDir - project's root path
 * @param {object} component - component which will be tested
 */
export async function validateBulkjobTask(projectRootDir, component) {
  if (component.name === null) {
    return Promise.reject(new Error(`illegal path`));
  }
  if (!component.useJobScheduler) {
    return Promise.reject(new Error(`useJobScheduler must be set`));
  }
  if (isLocal(component)) {
    return Promise.reject(new Error("bulkjobTask is only supported on remotehost"));
  }
  const hostinfo = _internal.remoteHost.query("name", component.host);
  if (typeof hostinfo === "undefined") {
    //local job is not implemented
    return Promise.reject(new Error(`remote host setting for ${component.host} not found`));
  }
  if (!Object.keys(_internal.jobScheduler).includes(hostinfo.jobScheduler)) {
    return Promise.reject(new Error(`job scheduler for ${hostinfo.name} (${hostinfo.jobScheduler}) is not supported`));
  }
  const setJobScheduler = _internal.jobScheduler[hostinfo.jobScheduler];
  if (!setJobScheduler.supportBulkjob) {
    return Promise.reject(new Error(`job scheduler (${hostinfo.jobScheduler}) does not support bulkjob`));
  }
  if (!hostinfo.useBulkjob) {
    return Promise.reject(new Error(`${hostinfo.name} does not set to use bulkjob`));
  }

  if (component.usePSSettingFile === true) {
    if (typeof component.parameterFile !== "string") {
      return Promise.reject(new Error(`usePSSettingFile is set but parameter setting file is not specified`));
    }
  } else {
    if (typeof component.startBulkNumber !== "number") {
      return Promise.reject(new Error(`startBulkNumber must be specified`));
    }
    if (!(Number.isInteger(component.startBulkNumber) && component.startBulkNumber >= 0)) {
      return Promise.reject(new Error(`startBulkNumber must be integer and 0 or more`));
    }

    if (typeof component.endBulkNumber !== "number") {
      return Promise.reject(new Error(`endBulkNumber must be specified`));
    }
    if (!(Number.isInteger(component.endBulkNumber) && component.endBulkNumber > component.startBulkNumber)) {
      return Promise.reject(new Error(`endBulkNumber must be integer and greater than startBulkNumber`));
    }
  }

  if (component.manualFinishCondition) {
    await validateConditionalCheck(projectRootDir, component);
  }
  return checkScript(projectRootDir, component);
}

export { _internal };
