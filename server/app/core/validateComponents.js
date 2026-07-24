/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import { getLogger } from "../logSettings.js";
import { hasChild, isInitialComponent } from "./workflowComponent.js";
import { getComponentFullName } from "./componentOperations.js";
import { readComponentJson, getComponentDir } from "./componentJsonIO.js";
import { getChildren } from "./workflowUtil.js";
import { validateTask, validateStepjobTask, validateStepjob, validateBulkjobTask, _internal as taskValidatorInternal } from "./taskValidator.js";
import { validateConditionalCheck, validateKeepProp, validateInputFiles, validateOutputFiles, validateInputFileOverwrite, validateInputFileRaceCondition } from "./componentResourceValidator.js";
import { validateForLoop, validateForeach, validateParameterStudy, validateStorage } from "./componentTypeValidator.js";
import { getCycleGraph, getNextComponents } from "./dependencyGraphValidator.js";
import { createValidationError } from "../lib/validationError.js";

const _internal = {
  getLogger,
  hasChild,
  isInitialComponent,
  getComponentFullName,
  readComponentJson,
  getChildren,
  validateComponent,
  getComponentDir,
  getNextComponents,
  get remoteHost() {
    return taskValidatorInternal.remoteHost;
  },
  get jobScheduler() {
    return taskValidatorInternal.jobScheduler;
  }
};

/**
 * validate component which can be run or not
 * @param {string} projectRootDir - project's root path
 * @param {object} component - target component
 * @returns {{ message: string, ignoreable: boolean }[]} - array of validation errors; empty array means the component is valid
 *
 * please note, all functions which is called from validateComponent, must return { message, ignoreable }[]
 * (resolving with an array). Do NOT reject for validation errors - only for unexpected errors.
 */
export async function validateComponent(projectRootDir, component) {
  let errors = [];

  if (component.type === "task") {
    errors.push(...await validateTask(projectRootDir, component));
  } else if (component.type === "stepjobTask") {
    errors.push(...await validateStepjobTask(projectRootDir, component));
  } else if (component.type === "stepjob") {
    errors.push(...await validateStepjob(projectRootDir, component));
  } else if (component.type === "bulkjobTask") {
    errors.push(...await validateBulkjobTask(projectRootDir, component));
  } else if (component.type === "if") {
    errors.push(...await validateConditionalCheck(projectRootDir, component));
  } else if (component.type === "continue" || component.type === "break") {
    errors.push(...await validateConditionalCheck(projectRootDir, component));
  } else if (component.type === "while") {
    errors.push(...await validateConditionalCheck(projectRootDir, component));
    errors.push(...await validateKeepProp(component));
  } else if (component.type === "for") {
    errors.push(...await validateForLoop(component));
    errors.push(...await validateKeepProp(component));
  } else if (component.type === "parameterStudy") {
    errors.push(...await validateParameterStudy(projectRootDir, component));
  } else if (component.type === "foreach") {
    errors.push(...await validateForeach(component));
    errors.push(...await validateKeepProp(component));
  } else if (component.type === "storage") {
    errors.push(...await validateStorage(component));
  }
  //additional test for input and output files
  if (Object.prototype.hasOwnProperty.call(component, "inputFiles")) {
    errors.push(...await validateInputFiles(component));
    errors.push(...await validateInputFileOverwrite(projectRootDir, component));
    errors.push(...await validateInputFileRaceCondition(component));
  }
  if (Object.prototype.hasOwnProperty.call(component, "outputFiles")) {
    errors.push(...await validateOutputFiles(component));
  }

  return errors;
}
_internal.validateComponent = validateComponent;

/**
 * check specified component's children has circuler dependency or not
 * @param {string} projectRootDir - project's root path
 * @param {object} parentComponentID - target component's ID
 * @returns {object[]} - array of components in cycle graph
 */
export async function checkComponentDependency(projectRootDir, parentComponentID) {
  const children = await _internal.getChildren(projectRootDir, parentComponentID);
  const rt = getCycleGraph(projectRootDir, children);
  if (rt.length > 0) {
    const cycleComponents = await Promise.all(rt.map(_internal.getComponentFullName.bind(null, projectRootDir)));
    _internal.getLogger(projectRootDir).debug("cycle graph found \n", cycleComponents);
  }
  return rt;
}

/**
 * validate components under specified component
 * @param {string} projectRootDir - project's root path
 * @param {string} parentID - parent component's ID string
 * @param {object[]} report - to be stored invalid component report entries
 * @returns {Promise<void>}
 */
export async function recursiveValidateComponents(projectRootDir, parentID, report) {
  const children = await _internal.getChildren(projectRootDir, parentID);
  if (children.length === 0) {
    return;
  }
  const promises = [];
  for (const component of children) {
    if (component.disable) {
      continue;
    }
    const errors = await _internal.validateComponent(projectRootDir, component);
    if (errors.length > 0) {
      const name = await _internal.getComponentFullName(projectRootDir, component.ID);
      report.push({ ID: component.ID, name, errors });
    }
    if (_internal.hasChild(component)) {
      promises.push(recursiveValidateComponents(projectRootDir, component.ID, report));
    }
  }

  let hasInitialNode = false;
  for (const component of children) {
    const rt = await _internal.isInitialComponent(projectRootDir, component);
    if (rt) {
      hasInitialNode = true;
      break;
    }
  }

  if (!hasInitialNode) {
    const name = await _internal.getComponentFullName(projectRootDir, parentID);
    report.push({ ID: parentID, name, errors: [createValidationError("no initial component in children")] });
  }
  const invalidComponentIDs = await checkComponentDependency(projectRootDir, parentID);

  if (invalidComponentIDs.length > 0) {
    const tmp = await Promise.all(
      invalidComponentIDs.map(async (ID)=>{
        const name = await _internal.getComponentFullName(projectRootDir, ID);
        return { ID, name, errors: [createValidationError("cycle graph detected")] };
      })
    );
    report.push(...tmp);
  }

  return Promise.all(promises);
}

/**
 * validate components under start component
 * @param {string} projectRootDir - project's root path
 * @param {string} startComponentID - ID of start component for recursive search point
 * @returns {object[]} - array of { ID, name, errors: Array<{message: string, ignoreable: boolean}> } for each invalid component
 */
export async function validateComponents(projectRootDir, startComponentID) {
  let parentID;
  if (typeof startComponentID !== "string") {
    const rootWF = await _internal.readComponentJson(projectRootDir);
    parentID = rootWF.ID;
  } else {
    parentID = startComponentID;
  }

  const report = [];
  await recursiveValidateComponents(projectRootDir, parentID, report);
  if (report.length > 0) {
    _internal.getLogger(projectRootDir).info(`validation error detected\n${JSON.stringify(report, null, 2)}`);
  }
  return report;
}

export { _internal };
