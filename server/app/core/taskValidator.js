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
import { ValidationError } from "../lib/validationError.js";

const _internal = {
  isInitialComponent,
  jobScheduler,
  remoteHost
};

/**
 * check if task component has valid values
 * @param {string} projectRootDir - project's root path
 * @param {object} component - component which will be tested
 * @returns {ValidationError[]} - array of validation errors; empty array means valid
 */
export async function validateTask(projectRootDir, component) {
  const errors = [];
  if (component.name === null) {
    errors.push(new ValidationError(`illegal path`));
    return errors;
  }
  if (!isLocal(component)) {
    const hostinfo = _internal.remoteHost.query("name", component.host);
    if (typeof hostinfo === "undefined") {
      errors.push(new ValidationError(`remote host setting for ${component.host} not found`));
    } else if (component.useJobScheduler) {
      if (!Object.keys(_internal.jobScheduler).includes(hostinfo.jobScheduler)) {
        errors.push(new ValidationError(`job scheduler for ${hostinfo.name} (${hostinfo.jobScheduler}) is not supported`));
      } else if (component.submitOption) {
        const optList = String(_internal.jobScheduler[hostinfo.jobScheduler].queueOpt).split(" ");
        if (optList.map((opt)=>{
          return component.submitOption.indexOf(opt);
        }).every((i)=>{
          return i >= 0;
        })) {
          errors.push(new ValidationError(`submit option duplicate queue option : ${_internal.jobScheduler[hostinfo.jobScheduler].queueOpt}`));
        }
      }
    }
  }
  try {
    await checkScript(projectRootDir, component);
  } catch (err) {
    errors.push(new ValidationError(err.message));
  }
  if (component.checker) {
    try {
      await checkChecker(projectRootDir, component);
    } catch (err) {
      errors.push(new ValidationError(err.message));
    }
  }
  return errors;
}

/**
 * check if stepjobTask component has valid values
 * @param {string} projectRootDir - project's root path
 * @param {object} component - component which will be tested
 * @returns {ValidationError[]} - array of validation errors; empty array means valid
 */
export async function validateStepjobTask(projectRootDir, component) {
  const errors = [];
  const isInitial = await _internal.isInitialComponent(projectRootDir, component);
  if (component.name === null) {
    errors.push(new ValidationError(`illegal path`));
  }
  if (component.useDependency && isInitial) {
    errors.push(new ValidationError("initial stepjobTask cannot specified the Dependency form"));
  }
  if (errors.length > 0) {
    return errors;
  }
  try {
    await checkScript(projectRootDir, component);
  } catch (err) {
    errors.push(new ValidationError(err.message));
  }
  return errors;
}

/**
 * check if stepjob component has valid values
 * @param {string} projectRootDir - project's root path
 * @param {object} component - component which will be tested
 * @returns {ValidationError[]} - array of validation errors; empty array means valid
 */
export async function validateStepjob(projectRootDir, component) {
  const errors = [];
  if (!component.useJobScheduler) {
    errors.push(new ValidationError(`useJobScheduler must be set`));
  }
  if (isLocal(component)) {
    errors.push(new ValidationError("stepjob is only supported on remotehost"));
    return errors;
  }

  const hostinfo = _internal.remoteHost.query("name", component.host);
  if (typeof hostinfo === "undefined") {
    errors.push(new ValidationError(`remote host setting for ${component.host} not found`));
    return errors;
  }
  if (!Object.keys(_internal.jobScheduler).includes(hostinfo.jobScheduler)) {
    errors.push(new ValidationError(`job scheduler for ${hostinfo.name} (${hostinfo.jobScheduler}) is not supported`));
    return errors;
  }
  const setJobScheduler = _internal.jobScheduler[hostinfo.jobScheduler];
  if (!setJobScheduler.supportStepjob) {
    errors.push(new ValidationError(`job scheduler (${hostinfo.jobScheduler}) does not support stepjob`));
  }
  if (!hostinfo.useStepjob) {
    errors.push(new ValidationError(`${hostinfo.name} does not set to use stepjob`));
  }
  return errors;
}

/**
 * check if bulkjobTask component has valid values
 * @param {string} projectRootDir - project's root path
 * @param {object} component - component which will be tested
 * @returns {ValidationError[]} - array of validation errors; empty array means valid
 */
export async function validateBulkjobTask(projectRootDir, component) {
  const errors = [];
  if (component.name === null) {
    errors.push(new ValidationError(`illegal path`));
    return errors;
  }
  if (!component.useJobScheduler) {
    errors.push(new ValidationError(`useJobScheduler must be set`));
  }
  if (isLocal(component)) {
    errors.push(new ValidationError("bulkjobTask is only supported on remotehost"));
    return errors;
  }
  const hostinfo = _internal.remoteHost.query("name", component.host);
  if (typeof hostinfo === "undefined") {
    errors.push(new ValidationError(`remote host setting for ${component.host} not found`));
    return errors;
  }
  if (!Object.keys(_internal.jobScheduler).includes(hostinfo.jobScheduler)) {
    errors.push(new ValidationError(`job scheduler for ${hostinfo.name} (${hostinfo.jobScheduler}) is not supported`));
    return errors;
  }
  const setJobScheduler = _internal.jobScheduler[hostinfo.jobScheduler];
  if (!setJobScheduler.supportBulkjob) {
    errors.push(new ValidationError(`job scheduler (${hostinfo.jobScheduler}) does not support bulkjob`));
  }
  if (!hostinfo.useBulkjob) {
    errors.push(new ValidationError(`${hostinfo.name} does not set to use bulkjob`));
  }

  if (component.usePSSettingFile === true) {
    if (typeof component.parameterFile !== "string") {
      errors.push(new ValidationError(`usePSSettingFile is set but parameter setting file is not specified`));
    }
  } else {
    if (typeof component.startBulkNumber !== "number") {
      errors.push(new ValidationError(`startBulkNumber must be specified`));
    } else if (!(Number.isInteger(component.startBulkNumber) && component.startBulkNumber >= 0)) {
      errors.push(new ValidationError(`startBulkNumber must be integer and 0 or more`));
    }

    if (typeof component.endBulkNumber !== "number") {
      errors.push(new ValidationError(`endBulkNumber must be specified`));
    } else if (!(Number.isInteger(component.endBulkNumber) && component.endBulkNumber > component.startBulkNumber)) {
      errors.push(new ValidationError(`endBulkNumber must be integer and greater than startBulkNumber`));
    }
  }

  if (component.manualFinishCondition) {
    const conditionalErrors = await validateConditionalCheck(projectRootDir, component);
    errors.push(...conditionalErrors);
  }
  try {
    await checkScript(projectRootDir, component);
  } catch (err) {
    errors.push(new ValidationError(err.message));
  }
  return errors;
}

export { _internal };
