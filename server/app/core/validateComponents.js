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
import { validateConditionalCheck, validateKeepProp, validateInputFiles, validateOutputFiles } from "./componentResourceValidator.js";
import { validateForLoop, validateForeach, validateParameterStudy, validateStorage } from "./componentTypeValidator.js";
import { getCycleGraph, getNextComponents } from "./dependencyGraphValidator.js";

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
 * @returns {null|string} - return null if component is valid, or error messages
 *
 * please note, all functions which is called from validateComponent, must return Promise.reject
 * if validation error detected. Do NOT throw exception if error is not unexpected one.
 */
export async function validateComponent(projectRootDir, component) {
  const errorMessages = [];

  if (component.type === "task") {
    await validateTask(projectRootDir, component)
      .catch((err)=>{ errorMessages.push(err.message); });
  } else if (component.type === "stepjobTask") {
    await validateStepjobTask(projectRootDir, component)
      .catch((err)=>{ errorMessages.push(err.message); });
  } else if (component.type === "stepjob") {
    await validateStepjob(projectRootDir, component)
      .catch((err)=>{ errorMessages.push(err.message); });
  } else if (component.type === "bulkjobTask") {
    await validateBulkjobTask(projectRootDir, component)
      .catch((err)=>{ errorMessages.push(err.message); });
  } else if (component.type === "if") {
    await validateConditionalCheck(projectRootDir, component)
      .catch((err)=>{ errorMessages.push(err.message); });
  } else if (component.type === "while") {
    await validateConditionalCheck(projectRootDir, component)
      .catch((err)=>{ errorMessages.push(err.message); });
    await validateKeepProp(component)
      .catch((err)=>{ errorMessages.push(err.message); });
  } else if (component.type === "for") {
    await validateForLoop(component)
      .catch((err)=>{ errorMessages.push(err.message); });
    await validateKeepProp(component)
      .catch((err)=>{ errorMessages.push(err.message); });
  } else if (component.type === "parameterStudy") {
    await validateParameterStudy(projectRootDir, component)
      .catch((err)=>{ errorMessages.push(err.message); });
  } else if (component.type === "foreach") {
    await validateForeach(component)
      .catch((err)=>{ errorMessages.push(err.message); });
    await validateKeepProp(component)
      .catch((err)=>{ errorMessages.push(err.message); });
  } else if (component.type === "storage") {
    await validateStorage(component)
      .catch((err)=>{ errorMessages.push(err.message); });
  }
  //additional test for input and output files
  if (Object.prototype.hasOwnProperty.call(component, "inputFiles")) {
    await validateInputFiles(component)
      .catch((err)=>{ errorMessages.push(err.message); });
  }
  if (Object.prototype.hasOwnProperty.call(component, "outputFiles")) {
    await validateOutputFiles(component)
      .catch((err)=>{ errorMessages.push(err.message); });
  }

  return errorMessages.length === 0 ? null : errorMessages.join("\n");
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
 * @param {object[]} report - to be stored invalid component IDs
 * @returns {string []} - array of invalid component's ID
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
    const error = await _internal.validateComponent(projectRootDir, component);
    if (error !== null) {
      const name = await _internal.getComponentFullName(projectRootDir, component.ID);
      report.push({ ID: component.ID, name, error });
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
    report.push({ ID: parentID, name, error: "no initial component in children" });
  }
  const invalidComponentIDs = await checkComponentDependency(projectRootDir, parentID);

  if (invalidComponentIDs.length > 0) {
    const tmp = await Promise.all(
      invalidComponentIDs.map(async (ID)=>{
        const name = await _internal.getComponentFullName(projectRootDir, ID);
        return { ID, name, error: "cycle graph detected" };
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
 * @returns {object[]} - invalid component's ID, name and error message
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
    _internal.getLogger(projectRootDir).info("validation error detected\n", report);
  }
  return report;
}

export { _internal };
