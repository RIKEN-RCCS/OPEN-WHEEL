/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path = require("path");
const fs = require("fs-extra");
const isPathInside = require("is-path-inside");
const { diff } = require("just-diff");
const { diffApply } = require("just-diff-apply");
const { promisify } = require("util");
const glob = require("glob");
const { componentFactory } = require("./workflowComponent");
const { updateComponentPath, removeComponentPath, getComponentDir, getDescendantsIDs, getAllComponentIDs } = require("./projectFilesOperator");
const { projectJsonFilename, componentJsonFilename, remoteHost, jobScheduler, defaultPSconfigFilename } = require("../db/db");
const { readJsonGreedy } = require("./fileUtils");
const { gitAdd, gitRm, gitResetHEAD, gitClean } = require("./gitOperator2");
const { isValidName, isValidInputFilename, isValidOutputFilename } = require("../lib/utility");
const { hasChild, isInitialComponent } = require("./workflowComponent");
const { replacePathsep } = require("../core/pathUtils");

function isLocal(component) {
  return typeof component.host === "undefined" || component.host === "localhost";
}

/**
 * check if specified components are executed on same remote host
 * @param {string} projectRootDir - root directory path of project
 * @param {string} left -  first componentID
 * @param {string} right - second componentID
 * @returns {boolean} - on same remote or not
 */
async function isSameRemoteHost(projectRootDir, left, right) {
  if (left === right) {
    return null;
  }
  const leftComponent = await readComponentJsonByID(projectRootDir, left);
  const rightComponent = await readComponentJsonByID(projectRootDir, right);

  if (isLocal(leftComponent) || isLocal(rightComponent)) {
    return false;
  }

  if (leftComponent.host === rightComponent.host) {
    return true;
  }
  const leftHost = remoteHost.query("name", leftComponent.host);
  const rightHost = remoteHost.query("name", rightComponent.host);
  const leftSharedHost = remoteHost.query("sharedHost", leftHost.sharedHost);
  const rightSharedHost = remoteHost.query("sharedHost", rightHost.sharedHost);

  if (leftHost === rightSharedHost || rightHost === leftSharedHost || leftSharedHost === rightSharedHost) {
    return true;
  }
  return false;
}


/**
 * write component Json file and git add
 */
async function writeComponentJson(projectRootDir, componentDir, component) {
  const filename = path.join(componentDir, componentJsonFilename);
  await fs.writeJson(filename, component, { spaces: 4, replacer: componentJsonReplacer });
  return gitAdd(projectRootDir, filename);
}

/**
 * read component Json by directory
 */
async function readComponentJson(componentDir) {
  const filename = path.join(componentDir, componentJsonFilename);
  const componentJson = await readJsonGreedy(filename);
  return componentJson;
}

/**
 * write componentJson by ID
 */
async function writeComponentJsonByID(projectRootDir, ID, component) {
  const componentDir = await getComponentDir(projectRootDir, ID, true);
  return writeComponentJson(projectRootDir, componentDir, component);
}

/**
 * read componentJson by ID
 */
async function readComponentJsonByID(projectRootDir, ID) {
  const componentDir = await getComponentDir(projectRootDir, ID, true);
  return readComponentJson(componentDir);
}

/**
 * modify component json
 */
async function modifyComponentJson(projectRootDir, ID, modifier) {
  const componentDir = await getComponentDir(projectRootDir, ID, true);
  const componentJson = await readComponentJson(componentDir);
  await modifier(componentJson);
  await writeComponentJson(projectRootDir, componentDir, componentJson);
  return componentJson;
}


/**
 * check if given 2 id's has parent-child relationship
 */
async function isParent(projectRootDir, parentID, childID) {
  if (parentID === "parent") {
    return true;
  }
  if (childID === "parent") {
    return false;
  }
  const childJson = await readComponentJsonByID(projectRootDir, childID);
  if (childJson === null || typeof childID !== "string") {
    return false;
  }
  return childJson.parent === parentID;
}


async function removeAllLink(projectRootDir, ID) {
  const counterparts = new Map();
  const component = await readComponentJsonByID(projectRootDir, ID);

  if (Object.prototype.hasOwnProperty.call(component, "previous")) {
    for (const previousComponent of component.previous) {
      const counterpart = counterparts.get(previousComponent) || await readComponentJsonByID(projectRootDir, previousComponent);
      counterpart.next = counterpart.next.filter((e)=>{
        return e !== component.ID;
      });

      if (counterpart.else) {
        counterpart.else = counterpart.else.filter((e)=>{
          return e !== component.ID;
        });
      }
      counterparts.set(counterpart.ID, counterpart);
    }
  }

  if (Object.prototype.hasOwnProperty.call(component, "next")) {
    for (const nextComponent of component.next) {
      const counterpart = counterparts.get(nextComponent) || await readComponentJsonByID(projectRootDir, nextComponent);
      counterpart.previous = counterpart.previous.filter((e)=>{
        return e !== component.ID;
      });
      counterparts.set(counterpart.ID, counterpart);
    }
  }

  if (Object.prototype.hasOwnProperty.call(component, "else")) {
    for (const elseComponent of component.else) {
      const counterpart = counterparts.get(elseComponent) || await readComponentJsonByID(projectRootDir, elseComponent);
      counterpart.previous = counterpart.previous.filter((e)=>{
        return e !== component.ID;
      });
      counterparts.set(counterpart.ID, counterpart);
    }
  }

  if (Object.prototype.hasOwnProperty.call(component, "inputFiles")) {
    for (const inputFile of component.inputFiles) {
      for (const src of inputFile.src) {
        const srcComponent = src.srcNode;
        const counterpart = counterparts.get(srcComponent) || await readComponentJsonByID(projectRootDir, srcComponent);

        for (const outputFile of counterpart.outputFiles) {
          outputFile.dst = outputFile.dst.filter((e)=>{
            return e.dstNode !== component.ID;
          });
        }
        counterparts.set(counterpart.ID, counterpart);
      }
    }
  }

  if (Object.prototype.hasOwnProperty.call(component, "outputFiles")) {
    for (const outputFile of component.outputFiles) {
      for (const dst of outputFile.dst) {
        const dstComponent = dst.dstNode;
        const counterpart = counterparts.get(dstComponent) || await readComponentJsonByID(projectRootDir, dstComponent);

        for (const inputFile of counterpart.inputFiles) {
          inputFile.src = inputFile.src.filter((e)=>{
            return e.srcNode !== component.ID;
          });
        }
        counterparts.set(counterpart.ID, counterpart);
      }
    }
  }

  for (const [counterPartID, counterpart] of counterparts) {
    const componentDir = await getComponentDir(projectRootDir, counterPartID, true);
    await writeComponentJson(projectRootDir, componentDir, counterpart);
  }
}


async function addFileLinkToParent(projectRootDir, srcNode, srcName, dstName) {
  const srcDir = await getComponentDir(projectRootDir, srcNode, true);
  const srcJson = await readComponentJson(srcDir);
  const parentDir = path.dirname(srcDir);
  const parentJson = await readComponentJson(parentDir);
  const parentID = parentJson.ID;

  const srcOutputFile = srcJson.outputFiles.find((e)=>{
    return e.name === srcName;
  });
  if (!srcOutputFile.dst.includes({ dstNode: parentID, dstName })) {
    srcOutputFile.dst.push({ dstNode: parentID, dstName });
  }
  const p = writeComponentJson(projectRootDir, srcDir, srcJson);

  const parentOutputFile = parentJson.outputFiles.find((e)=>{
    return e.name === dstName;
  });
  if (!Object.prototype.hasOwnProperty.call(parentOutputFile, "origin")) {
    parentOutputFile.origin = [];
  }
  if (!parentOutputFile.origin.includes({ srcNode, srcName })) {
    parentOutputFile.origin.push({ srcNode, srcName });
  }
  await p;
  return writeComponentJson(projectRootDir, parentDir, parentJson);
}
async function addFileLinkFromParent(projectRootDir, srcName, dstNode, dstName) {
  const dstDir = await getComponentDir(projectRootDir, dstNode, true);
  const dstJson = await readComponentJson(dstDir);
  const parentDir = path.dirname(dstDir);
  const parentJson = await readComponentJson(parentDir);
  const parentID = parentJson.ID;

  const parentInputFile = parentJson.inputFiles.find((e)=>{
    return e.name === srcName;
  });
  if (!Object.prototype.hasOwnProperty.call(parentInputFile, "forwardTo")) {
    parentInputFile.forwardTo = [];
  }
  if (!parentInputFile.forwardTo.includes({ dstNode, dstName })) {
    parentInputFile.forwardTo.push({ dstNode, dstName });
  }
  const p = writeComponentJson(projectRootDir, parentDir, parentJson);

  const dstInputFile = dstJson.inputFiles.find((e)=>{
    return e.name === dstName;
  });
  if (!dstInputFile.src.includes({ srcNode: parentID, srcName })) {
    dstInputFile.src.push({ srcNode: parentID, srcName });
  }
  await p;
  return writeComponentJson(projectRootDir, dstDir, dstJson);
}
async function addFileLinkBetweenSiblings(projectRootDir, srcNode, srcName, dstNode, dstName) {
  const srcDir = await getComponentDir(projectRootDir, srcNode, true);
  const srcJson = await readComponentJson(srcDir);
  const srcOutputFile = srcJson.outputFiles.find((e)=>{
    return e.name === srcName;
  });
  if (!srcOutputFile.dst.includes({ dstNode, dstName })) {
    srcOutputFile.dst.push({ dstNode, dstName });
  }
  const p1 = writeComponentJson(projectRootDir, srcDir, srcJson);

  const dstDir = await getComponentDir(projectRootDir, dstNode, true);
  const dstJson = await readComponentJson(dstDir);
  const dstInputFile = dstJson.inputFiles.find((e)=>{
    return e.name === dstName;
  });
  if (!dstInputFile.src.includes({ srcNode, srcName })) {
    dstInputFile.src.push({ srcNode, srcName });
  }
  await p1;
  return writeComponentJson(projectRootDir, dstDir, dstJson);
}

async function removeFileLinkToParent(projectRootDir, srcNode, srcName, dstName) {
  const srcDir = await getComponentDir(projectRootDir, srcNode, true);
  const srcJson = await readComponentJson(srcDir);
  const parentDir = path.dirname(srcDir);
  const parentJson = await readComponentJson(parentDir);

  const srcOutputFile = srcJson.outputFiles.find((e)=>{
    return e.name === srcName;
  });
  srcOutputFile.dst = srcOutputFile.dst.filter((e)=>{
    return e.dstNode !== parentJson.ID || e.dstName !== dstName;
  });
  const p = writeComponentJson(projectRootDir, srcDir, srcJson);

  const parentOutputFile = parentJson.outputFiles.find((e)=>{
    return e.name === dstName;
  });
  if (Object.prototype.hasOwnProperty.call(parentOutputFile, "origin")) {
    parentOutputFile.origin = parentOutputFile.origin.filter((e)=>{
      return e.srcNode !== srcNode || e.srcName !== srcName;
    });
  }

  await p;
  return writeComponentJson(projectRootDir, parentDir, parentJson);
}

async function removeFileLinkFromParent(projectRootDir, srcName, dstNode, dstName) {
  const dstDir = await getComponentDir(projectRootDir, dstNode, true);
  const dstJson = await readComponentJson(dstDir);
  const parentDir = path.dirname(dstDir);
  const parentJson = await readComponentJson(parentDir);
  const parentID = parentJson.ID;

  const parentInputFile = parentJson.inputFiles.find((e)=>{
    return e.name === srcName;
  });
  if (Object.prototype.hasOwnProperty.call(parentInputFile, "forwardTo")) {
    parentInputFile.forwardTo = parentInputFile.forwardTo.filter((e)=>{
      return e.dstNode !== dstNode || e.dstName !== dstName;
    });
  }
  const p = writeComponentJson(projectRootDir, parentDir, parentJson);

  const dstInputFile = dstJson.inputFiles.find((e)=>{
    return e.name === dstName;
  });
  dstInputFile.src = dstInputFile.src.filter((e)=>{
    return e.srcNode !== parentID || e.srcName !== srcName;
  });
  await p;
  return writeComponentJson(projectRootDir, dstDir, dstJson);
}

async function removeFileLinkBetweenSiblings(projectRootDir, srcNode, srcName, dstNode, dstName) {
  const srcDir = await getComponentDir(projectRootDir, srcNode, true);
  const srcJson = await readComponentJson(srcDir);
  const srcOutputFile = srcJson.outputFiles.find((e)=>{
    return e.name === srcName;
  });
  srcOutputFile.dst = srcOutputFile.dst.filter((e)=>{
    return !(e.dstNode === dstNode && e.dstName === dstName);
  });
  const p = writeComponentJson(projectRootDir, srcDir, srcJson);

  const dstDir = await getComponentDir(projectRootDir, dstNode, true);
  const dstJson = await readComponentJson(dstDir);
  const dstInputFile = dstJson.inputFiles.find((e)=>{
    return e.name === dstName;
  });
  dstInputFile.src = dstInputFile.src.filter((e)=>{
    return !(e.srcNode === srcNode && e.srcName === srcName);
  });
  await p;
  return writeComponentJson(projectRootDir, dstDir, dstJson);
}


/**
 * add suffix to dirname and make directory
 * @param {string} basename - dirname
 * @param {string} argSuffix -   number
 * @returns {string} - actual directory name
 *
 * makeDir create "basenme+suffix" direcotry. suffix is increased until the dirname is no longer duplicated.
 */
async function makeDir(basename, argSuffix) {
  let suffix = argSuffix;

  while (await fs.pathExists(basename + suffix)) {
    ++suffix;
  }

  const dirname = basename + suffix;
  await fs.mkdir(dirname);
  return dirname;
}

async function getChildren(projectRootDir, parentID) {
  const dir = parentID === null ? projectRootDir : await getComponentDir(projectRootDir, parentID, true);

  if (!dir) {
    return [];
  }

  const children = await promisify(glob)(path.join(dir, "*", componentJsonFilename));
  if (children.length === 0) {
    return [];
  }

  const rt = await Promise.all(children.map((e)=>{
    return readJsonGreedy(e);
  }));

  return rt.filter((e)=>{
    return !e.subComponent;
  });
}

async function validateTask(projectRootDir, component) {
  if (component.name === null) {
    return Promise.reject(new Error(`illegal path ${component.name}`));
  }

  if (component.useJobScheduler) {
    const hostinfo = remoteHost.query("name", component.host);
    if (typeof hostinfo === "undefined") {
      //local job is not implemented
    } else if (!Object.keys(jobScheduler).includes(hostinfo.jobScheduler)) {
      return Promise.reject(new Error(`job scheduler for ${hostinfo.name} (${hostinfo.jobScheduler}) is not supported`));
    }
    if (component.submitOption) {
      const optList = String(jobScheduler[hostinfo.jobScheduler].queueOpt).split(" ");
      if (optList.map((opt)=>{
        return component.submitOption.indexOf(opt);
      }).every((i)=>{
        return i >= 0;
      })) {
        return Promise.reject(new Error(`submit option duplicate queue option : ${jobScheduler[hostinfo.jobScheduler].queueOpt}`));
      }
    }
  }

  if (!(Object.prototype.hasOwnProperty.call(component, "script") && typeof component.script === "string")) {
    return Promise.reject(new Error(`script is not specified ${component.name}`));
  }
  const componentDir = await getComponentDir(projectRootDir, component.ID, true);
  const filename = path.resolve(componentDir, component.script);
  if (!(await fs.stat(filename)).isFile()) {
    return Promise.reject(new Error(`script is not existing file ${filename}`));
  }
  return true;
}

async function validateStepjobTask(projectRootDir, component) {
  const isInitial = isInitialComponent(component);
  if (component.name === null) {
    return Promise.reject(new Error(`illegal path ${component.name}`));
  }

  if (component.useDependency && isInitial) {
    return Promise.reject(new Error("initial stepjobTask cannot specified the Dependency form"));
  }

  if (!(Object.prototype.hasOwnProperty.call(component, "script") && typeof component.script === "string")) {
    return Promise.reject(new Error(`script is not specified ${component.name}`));
  }
  const componentDir = await getComponentDir(projectRootDir, component.ID, true);
  const filename = path.resolve(componentDir, component.script);
  if (!(await fs.stat(filename)).isFile()) {
    return Promise.reject(new Error(`script is not existing file ${filename}`));
  }
  return true;
}

async function validateStepjob(projectRootDir, component) {
  if (component.useJobScheduler) {
    const hostinfo = remoteHost.query("name", component.host);
    if (typeof hostinfo === "undefined") {
      //assume local job
    } else if (!Object.keys(jobScheduler).includes(hostinfo.jobScheduler)) {
      return Promise.reject(new Error(`job scheduler for ${hostinfo.name} (${hostinfo.jobScheduler}) is not supported`));
    }
    const setJobScheduler = jobScheduler[hostinfo.jobScheduler];
    if (!(Object.prototype.hasOwnProperty.call(setJobScheduler, "stepjob") && setJobScheduler.stepjob === true)) {
      return Promise.reject(new Error(`${hostinfo.jobScheduler} jobSheduler does not support stepjob`));
    }
    if (!(Object.prototype.hasOwnProperty.call(hostinfo, "useStepjob") && hostinfo.useStepjob === true)) {
      return Promise.reject(new Error(`${hostinfo.name} does not support stepjob`));
    }
  }
  return true;
}

async function validateBulkjobTask(projectRootDir, component) {
  if (component.name === null) {
    return Promise.reject(new Error(`illegal path ${component.name}`));
  }

  if (!(Object.prototype.hasOwnProperty.call(component, "script") && typeof component.script === "string")) {
    return Promise.reject(new Error(`script is not specified ${component.name}`));
  }
  const componentDir = await getComponentDir(projectRootDir, component.ID, true);
  const filename = path.resolve(componentDir, component.script);
  if (!(await fs.stat(filename)).isFile()) {
    return Promise.reject(new Error(`script is not existing file ${filename}`));
  }

  if (component.host === "localhost") {
    return Promise.reject(new Error("localhost does not support bulkjob`"));
  }

  if (component.useJobScheduler) {
    const hostinfo = remoteHost.query("name", component.host);
    if (typeof hostinfo === "undefined") {
      //assume local job
    } else if (!Object.keys(jobScheduler).includes(hostinfo.jobScheduler)) {
      return Promise.reject(new Error(`job scheduler for ${hostinfo.name} (${hostinfo.jobScheduler}) is not supported`));
    }
    const setJobScheduler = jobScheduler[hostinfo.jobScheduler];
    if (!(Object.prototype.hasOwnProperty.call(setJobScheduler, "bulkjob") && setJobScheduler.bulkjob === true)) {
      return Promise.reject(new Error(`${hostinfo.jobScheduler} jobSheduler does not support bulkjob`));
    }
    if (!(Object.prototype.hasOwnProperty.call(hostinfo, "useBulkjob") && hostinfo.useBulkjob === true)) {
      return Promise.reject(new Error(`${hostinfo.name} does not support bulkjob`));
    }
  }

  if (component.usePSSettingFile === false) {
    if (!(Object.prototype.hasOwnProperty.call(component, "startBulkNumber") && typeof component.startBulkNumber === "number")) {
      return Promise.reject(new Error(`startBulkNumber is not specified ${component.name}`));
    }
    if (!(component.startBulkNumber >= 0)) {
      return Promise.reject(new Error(`${component.name} startBulkNumber is integer of 0 or more`));
    }
    if (!(Object.prototype.hasOwnProperty.call(component, "endBulkNumber") && typeof component.endBulkNumber === "number" && component.startBulkNumber >= 0)) {
      return Promise.reject(new Error(`endBulkNumber is not specified ${component.name}`));
    }
    if (!(component.endBulkNumber > component.startBulkNumber)) {
      return Promise.reject(new Error(`${component.name} endBulkNumber is greater than startBulkNumber`));
    }
  } else {
    if (!(Object.prototype.hasOwnProperty.call(component, "parameterFile") && typeof component.parameterFile === "string")) {
      return Promise.reject(new Error(`parameter setting file is not specified ${component.name}`));
    }
  }

  if (component.manualFinishCondition) {
    if (!(Object.prototype.hasOwnProperty.call(component, "condition") && typeof component.condition === "string")) {
      return Promise.reject(new Error(`condition is not specified ${component.name}`));
    }
  }
  return true;
}

async function validateConditionalCheck(component) {
  if (!(Object.prototype.hasOwnProperty.call(component, "condition") && typeof component.condition === "string")) {
    return Promise.reject(new Error(`condition is not specified ${component.name}`));
  }
  if (!(Object.prototype.hasOwnProperty.call(component, "keep") && typeof component.keep === "number" && component.keep >= 0)) {
    if (component.keep != null) {
      return Promise.reject(new Error(`keep is not specified ${component.name}`));
    }
  }
  return Promise.resolve();
}

async function validateForLoop(component) {
  if (!(Object.prototype.hasOwnProperty.call(component, "start") && typeof component.start === "number")) {
    return Promise.reject(new Error(`start is not specified ${component.name}`));
  }

  if (!(Object.prototype.hasOwnProperty.call(component, "step") && typeof component.step === "number")) {
    return Promise.reject(new Error(`step is not specified ${component.name}`));
  }

  if (!(Object.prototype.hasOwnProperty.call(component, "end") && typeof component.end === "number")) {
    return Promise.reject(new Error(`end is not specified ${component.name}`));
  }

  if (!(Object.prototype.hasOwnProperty.call(component, "keep") && typeof component.keep === "number" && component.keep >= 0)) {
    if (component.keep != null) {
      return Promise.reject(new Error(`keep is not specified ${component.name}`));
    }
  }

  if (component.step === 0 || (component.end - component.start) * component.step < 0) {
    return Promise.reject(new Error(`inifinite loop ${component.name}`));
  }
  return Promise.resolve();
}

async function validateParameterStudy(projectRootDir, component) {
  if (!(Object.prototype.hasOwnProperty.call(component, "parameterFile") && typeof component.parameterFile === "string")) {
    return Promise.reject(new Error(`parameter setting file is not specified ${component.name}`));
  }
  const componentDir = await getComponentDir(projectRootDir, component.ID, true);
  const filename = path.resolve(componentDir, component.parameterFile);
  await fs.access(filename);

  try {
    await readJsonGreedy(filename);
  } catch (err) {
    err.orgMessage = err.message;
    err.message = "parameter file parse error";
    err.parameterFile = component.parameterFile;
    throw err;
  }
  //validation check by JSON-schema will be done
  return true;
}

async function validateForeach(component) {
  if (!Array.isArray(component.indexList)) {
    return Promise.reject(new Error(`index list is broken ${component.name}`));
  }
  if (component.indexList.length <= 0) {
    return Promise.reject(new Error(`index list is empty ${component.name}`));
  }
  if (!(Object.prototype.hasOwnProperty.call(component, "keep") && typeof component.keep === "number" && component.keep >= 0)) {
    if (component.keep != null) {
      return Promise.reject(new Error(`keep is not specified ${component.name}`));
    }
  }
  return Promise.resolve();
}

async function validateStorage(component) {
  if (typeof component.storagePath !== "string") {
    return Promise.reject(new Error("storagePath is not set"));
  }
  if (isLocal(component) && !fs.pathExists(component.storagePath)) {
    return Promise.reject(new Error("specified path is not exist on localhost"));
  }
  return Promise.resolve();
}

/**
 * validate inputFiles
 * @param {Object} component - any component object which has inputFiles prop
 * @returns {true|Error} - inputFile is valid or not
 */
async function validateInputFiles(component) {
  for (const inputFile of component.inputFiles) {
    const filename = inputFile.name;
    if (inputFile.src.length > 1 && !(filename[filename.length - 1] === "/" || filename[filename.length - 1] === "\\")) {
      return Promise.reject(new Error(`${component.name} inputFile '${inputFile.name}' data type is 'file' but it has two or more outputFiles.`));
    }
  }
  return true;
}

/**
 * validate outputFiles
 * @param {Object} component - any component object which has putFiles prop
 * @returns {true|Error} - outputFile is valid or not
 */
async function validateOutputFiles(component) {
  for (const outputFile of component.outputFiles) {
    const filename = outputFile.name;
    if (!isValidOutputFilename(filename)) {
      return Promise.reject(new Error(`${component.name} '${outputFile.name}' is not allowed.`));
    }
  }
  return true;
}

async function recursiveGetHosts(projectRootDir, parentID, hosts) {
  const promises = [];
  const children = await getChildren(projectRootDir, parentID);

  for (const component of children) {
    if (component.disable) {
      continue;
    }
    if (component.type === "task" && component.host !== "localhost" || component.type === "stepjob") {
      hosts.push(component.host);
    }
    if (hasChild(component)) {
      promises.push(recursiveGetHosts(projectRootDir, component.ID, hosts));
    }
  }
  return Promise.all(promises);
}


/*
 * public functions
 */

/**
 * read component Json recursively and pick up remote hosts used in task component
 */
async function getHosts(projectRootDir, rootID) {
  const hosts = [];
  await recursiveGetHosts(projectRootDir, rootID, hosts);
  return Array.from(new Set(hosts)); //remove duplicate
}

/**
 * validate all components in workflow
 */
async function validateComponents(projectRootDir, argParentID) {
  let parentID;
  if (typeof argParentID !== "string") {
    const rootWF = await readComponentJson(projectRootDir);
    parentID = rootWF.ID;
  } else {
    parentID = argParentID;
  }

  const children = await getChildren(projectRootDir, parentID);
  const promises = [];

  for (const component of children) {
    if (component.disable) {
      continue;
    }
    if (component.type === "task") {
      promises.push(validateTask(projectRootDir, component));
    } else if (component.type === "stepjobTask") {
      promises.push(validateStepjobTask(projectRootDir, component));
    } else if (component.type === "stepjob") {
      promises.push(validateStepjob(projectRootDir, component));
    } else if (component.type === "bulkjobTask") {
      promises.push(validateBulkjobTask(projectRootDir, component));
    } else if (component.type === "if" || component.type === "while") {
      promises.push(validateConditionalCheck(component));
    } else if (component.type === "for") {
      promises.push(validateForLoop(component));
    } else if (component.type === "parameterStudy") {
      promises.push(validateParameterStudy(projectRootDir, component));
    } else if (component.type === "foreach") {
      promises.push(validateForeach(component));
    } else if (component.type === "storage") {
      promises.push(validateStorage(component));
    }
    if (Object.prototype.hasOwnProperty.call(component, "inputFiles")) {
      promises.push(validateInputFiles(component));
    }
    if (Object.prototype.hasOwnProperty.call(component, "outputFiles")) {
      promises.push(validateOutputFiles(component));
    }
    if (hasChild(component)) {
      promises.push(validateComponents(projectRootDir, component.ID));
    }
  }

  const hasInitialNode = children.some((component)=>{
    return isInitialComponent(component);
  });

  if (!hasInitialNode) {
    promises.push(Promise.reject(new Error("no component can be run")));
  }

  return Promise.all(promises);
}


function componentJsonReplacer(key, value) {
  if (["handler", "doCleanup", "sbsID", "childLoopRunning"].includes(key)) {
    //eslint-disable-next-line no-undefined
    return undefined;
  }
  return value;
}

/**
 * create new component in parentDir
 * @param {string} projectRootDir - project root directory path
 * @param {string} parentDir - parent component's directory path
 * @param {string} type - component type
 * @param {Object} pos - component's cordinate in browser
 * @returns {Object} component
 */
async function createNewComponent(projectRootDir, parentDir, type, pos) {
  const parentJson = await readJsonGreedy(path.resolve(parentDir, componentJsonFilename));
  const parentID = parentJson.ID;

  //create component directory and Json file
  const absDirName = await makeDir(path.resolve(parentDir, type), 0);
  const newComponent = componentFactory(type, pos, parentID);
  newComponent.name = path.basename(absDirName);
  await writeComponentJson(projectRootDir, absDirName, newComponent);
  await updateComponentPath(projectRootDir, newComponent.ID, absDirName);

  if (type === "PS") {
    await fs.writeJson(path.resolve(absDirName, defaultPSconfigFilename), { version: 2, targetFiles: [], params: [], scatter: [], gather: [] }, { spaces: 4 });
  }
  return newComponent;
}

/**
 * perform git mv and update component path in projectJson file
 */
async function renameComponentDir(projectRootDir, ID, newName) {
  if (!isValidName(newName)) {
    return Promise.reject(new Error(`${newName} is not valid component name`));
  }
  const oldDir = await getComponentDir(projectRootDir, ID, true);
  if (oldDir === projectRootDir) {
    return Promise.reject(new Error("updateNode can not rename root workflow"));
  }
  if (path.basename(oldDir) === newName) {
    //nothing to be done when you attempt to rename to the same name
    return true;
  }
  const newDir = path.resolve(path.dirname(oldDir), newName);
  await gitRm(projectRootDir, oldDir);
  await fs.move(oldDir, newDir);
  await gitAdd(projectRootDir, newDir);
  return updateComponentPath(projectRootDir, ID, newDir);
}

async function replaceEnv(projectRootDir, ID, newEnv) {
  const componentJson = await readComponentJsonByID(projectRootDir, ID);
  const env = componentJson.env || {};
  const patch = diff(env, newEnv);
  diffApply(env, patch);
  componentJson.env = env;
  await writeComponentJsonByID(projectRootDir, ID, componentJson);
  return componentJson;
}

async function getEnv(projectRootDir, ID) {
  const componentJson = await readComponentJsonByID(projectRootDir, ID);
  const env = componentJson.env;
  return env;
}

async function updateComponent(projectRootDir, ID, prop, value) {
  if (prop === "path") {
    return Promise.reject(new Error("path property is deprecated. please use 'name' instead."));
  }
  if (prop === "inputFiles" || prop === "outputFiles") {
    return Promise.reject(new Error(`updateNode does not support ${prop}. please use renameInputFile or renameOutputFile`));
  }
  if (prop === "env") {
    return Promise.reject(new Error("updateNode does not support env. please use updateEnv"));
  }
  if (prop === "uploadOnDemand" && value === true) {
    await setUploadOndemandOutputFile(projectRootDir, ID);
  }
  if (prop === "name") {
    await renameComponentDir(projectRootDir, ID, value);
  }
  return modifyComponentJson(projectRootDir, ID, (componentJson)=>{
    componentJson[prop] = value;
  });
}

async function updateStepNumber(projectRootDir) {
  const componentIDs = await getAllComponentIDs(projectRootDir);
  const stepjobTaskComponentJson = [];
  const stepjobComponentIDs = [];
  const stepjobGroup = [];
  //get stepjob, stepjobTask
  for (const id of componentIDs) {
    const componentDir = await getComponentDir(projectRootDir, id, true);
    const componentJson = await readComponentJson(componentDir);
    if (componentJson.type === "stepjobTask") {
      stepjobTaskComponentJson.push(componentJson);
    }
    if (componentJson.type === "stepjob") {
      stepjobComponentIDs.push(componentJson.ID);
    }
  }

  for (const id of stepjobComponentIDs) {
    const stepjobTaskIDs = stepjobTaskComponentJson.filter((component)=>{
      return component.parent === id;
    });
    stepjobGroup.push(stepjobTaskIDs);
  }

  //arrange stepjobTask in consideration of connect relation
  const arrangedComponents = await arrangeComponent(stepjobGroup);
  let stepnum = 0;
  const prop = "stepnum";
  const p = [];
  for (const componentJson of arrangedComponents) {
    componentJson[prop] = stepnum;
    const componentDir = await getComponentDir(projectRootDir, componentJson.ID, true);
    p.push(writeComponentJson(projectRootDir, componentDir, componentJson));
    stepnum++;
  }
  await Promise.all(p);
}

async function arrangeComponent(stepjobGroupArray) {
  const arrangedArray = [];
  for (const stepjobTaskComponents of stepjobGroupArray) {
    let arrangeArraytemp = [];
    let notConnectTasks = [];

    for (let i = 0; i < stepjobTaskComponents.length; i++) {
      if (i === 0) {
        arrangeArraytemp = stepjobTaskComponents.filter((stepjobTask)=>{
          return stepjobTask.previous.length === 0 && stepjobTask.next.length !== 0;
        });

        if (arrangeArraytemp.length === 0) {
          arrangeArraytemp = stepjobTaskComponents;
          break;
        }
        continue;
      }

      let nextComponent = [];
      /*eslint-disable-next-line no-loop-func*/
      nextComponent = stepjobTaskComponents.filter((stepjobTask)=>{
        return stepjobTask.ID === arrangeArraytemp[i - 1].next[0];
      });

      if (nextComponent.length !== 0) {
        arrangeArraytemp.push(nextComponent[0]);
      }

      notConnectTasks = stepjobTaskComponents.filter((stepjobTask)=>{
        return stepjobTask.previous.length === 0 && stepjobTask.next.length === 0;
      });
    }

    for (const stepJobTask of notConnectTasks) {
      arrangeArraytemp.push(stepJobTask);
    }
    arrangedArray.push(arrangeArraytemp);
  }

  //flat single
  const arrayList = [];
  for (const stepJobList of arrangedArray) {
    for (const stepJobTask of stepJobList) {
      arrayList.push(stepJobTask);
    }
  }
  return arrayList;
}

async function addInputFile(projectRootDir, ID, name) {
  if (!isValidInputFilename(name)) {
    return Promise.reject(new Error(`${name} is not valid inputFile name`));
  }
  const componentDir = await getComponentDir(projectRootDir, ID, true);
  const componentJson = await readComponentJson(componentDir);
  if (!Object.prototype.hasOwnProperty.call(componentJson, "inputFiles")) {
    const err = new Error(`${componentJson.name} does not have inputFiles`);
    err.component = componentJson;
    return Promise.reject(err);
  }
  componentJson.inputFiles.push({ name, src: [] });
  return writeComponentJson(projectRootDir, componentDir, componentJson);
}
async function addOutputFile(projectRootDir, ID, name) {
  if (!isValidOutputFilename(name)) {
    return Promise.reject(new Error(`${name} is not valid outputFile name`));
  }
  const componentDir = await getComponentDir(projectRootDir, ID, true);
  const componentJson = await readComponentJson(componentDir);
  if (!Object.prototype.hasOwnProperty.call(componentJson, "outputFiles")) {
    const err = new Error(`${componentJson.name} does not have outputFiles`);
    err.component = componentJson;
    return Promise.reject(err);
  }
  if (componentJson.outputFiles.find((outputFile)=>{
    return outputFile.name === name;
  })) {
    return Promise.reject(new Error(`${name} is already exists`));
  }
  componentJson.outputFiles.push({ name, dst: [] });
  return writeComponentJson(projectRootDir, componentDir, componentJson);
}
async function setUploadOndemandOutputFile(projectRootDir, ID) {
  const componentDir = await getComponentDir(projectRootDir, ID, true);
  const componentJson = await readComponentJson(componentDir);
  if (!Object.prototype.hasOwnProperty.call(componentJson, "outputFiles")) {
    const err = new Error(`${componentJson.name} does not have outputFiles`);
    err.component = componentJson;
    return Promise.reject(err);
  }
  if (componentJson.outputFiles.length === 0) {
    return addOutputFile(projectRootDir, ID, "UPLOAD_ONDEMAND");
  }
  if (componentJson.outputFiles.length > 1) {
    const p = [];

    for (let i = 1; i < componentJson.outputFiles.length; i++) {
      const counterparts = new Set();

      for (const dst of componentJson.outputFiles[i].dst) {
        counterparts.add(dst);
      }
      for (const counterPart of counterparts) {
        p.push(removeFileLink(projectRootDir, ID, componentJson.outputFiles[i].name, counterPart.dstNode, counterPart.dstName));
      }
    }
    await Promise.all(p);
    componentJson.outputFiles.splice(1, componentJson.outputFiles.length - 1);
  }

  componentJson.outputFiles[0].name = "UPLOAD_ONDEMAND";
  return writeComponentJson(projectRootDir, componentDir, componentJson);
}
async function removeInputFile(projectRootDir, ID, name) {
  const counterparts = new Set();
  const componentDir = await getComponentDir(projectRootDir, ID, true);
  const componentJson = await readComponentJson(componentDir);
  componentJson.inputFiles.forEach((inputFile)=>{
    if (name === inputFile.name) {
      for (const src of inputFile.src) {
        counterparts.add(src);
      }
    }
  });

  for (const counterPart of counterparts) {
    await removeFileLink(projectRootDir, counterPart.srcNode, counterPart.srcName, ID, name);
  }

  componentJson.inputFiles = componentJson.inputFiles.filter((inputFile)=>{
    return name !== inputFile.name;
  });
  return writeComponentJson(projectRootDir, componentDir, componentJson);
}
async function removeOutputFile(projectRootDir, ID, name) {
  const counterparts = new Set();
  const componentDir = await getComponentDir(projectRootDir, ID, true);
  const componentJson = await readComponentJson(componentDir);

  componentJson.outputFiles = componentJson.outputFiles.filter((outputFile)=>{
    if (name !== outputFile.name) {
      return true;
    }
    for (const dst of outputFile.dst) {
      counterparts.add(dst);
    }
    return false;
  });

  for (const counterPart of counterparts) {
    await removeFileLink(projectRootDir, ID, name, counterPart.dstNode, counterPart.dstName);
  }
  return writeComponentJson(projectRootDir, componentDir, componentJson);
}

async function renameInputFile(projectRootDir, ID, index, newName) {
  if (!isValidInputFilename(newName)) {
    return Promise.reject(new Error(`${newName} is not valid inputFile name`));
  }
  const componentDir = await getComponentDir(projectRootDir, ID, true);
  const componentJson = await readComponentJson(componentDir);
  if (index < 0 || componentJson.inputFiles.length - 1 < index) {
    return Promise.reject(new Error(`invalid index ${index}`));
  }

  const counterparts = new Set();
  const oldName = componentJson.inputFiles[index].name;
  componentJson.inputFiles[index].name = newName;
  componentJson.inputFiles[index].src.forEach((e)=>{
    counterparts.add(e.srcNode);
  });
  const p = [writeComponentJson(projectRootDir, componentDir, componentJson)];

  for (const counterPartID of counterparts) {
    const counterpartDir = await getComponentDir(projectRootDir, counterPartID, true);
    const counterpartJson = await readComponentJson(counterpartDir);
    for (const outputFile of counterpartJson.outputFiles) {
      for (const dst of outputFile.dst) {
        if (dst.dstNode === ID && dst.dstName === oldName) {
          dst.dstName = newName;
        }
      }
    }
    for (const inputFile of counterpartJson.inputFiles) {
      if (!Object.prototype.hasOwnProperty.call(inputFile, "forwardTo")) {
        for (const dst of inputFile.forwardTo) {
          if (dst.dstNode === ID && dst.dstName === oldName) {
            dst.dstName = newName;
          }
        }
      }
    }
    p.push(writeComponentJson(projectRootDir, counterpartDir, counterpartJson));
  }
  return Promise.all(p);
}
async function renameOutputFile(projectRootDir, ID, index, newName) {
  if (!isValidOutputFilename(newName)) {
    return Promise.reject(new Error(`${newName} is not valid outputFile name`));
  }
  const componentDir = await getComponentDir(projectRootDir, ID, true);
  const componentJson = await readComponentJson(componentDir);
  if (index < 0 || componentJson.outputFiles.length - 1 < index) {
    return Promise.reject(new Error(`invalid index ${index}`));
  }

  const counterparts = new Set();
  const oldName = componentJson.outputFiles[index].name;
  componentJson.outputFiles[index].name = newName;
  componentJson.outputFiles[index].dst.forEach((e)=>{
    counterparts.add(e.dstNode);
  });
  await writeComponentJson(projectRootDir, componentDir, componentJson);

  const promises = [];
  for (const counterPartID of counterparts) {
    const counterpartDir = await getComponentDir(projectRootDir, counterPartID, true);
    const counterpartJson = await readComponentJson(counterpartDir);
    for (const inputFile of counterpartJson.inputFiles) {
      for (const src of inputFile.src) {
        if (src.srcNode === ID && src.srcName === oldName) {
          src.srcName = newName;
        }
      }
    }
    for (const outputFile of counterpartJson.outputFiles) {
      if (!Object.prototype.hasOwnProperty.call(outputFile, "origin")) {
        for (const src of outputFile.origin) {
          if (src.srcNode === ID && src.srcName === oldName) {
            src.srcName = newName;
          }
        }
      }
    }
    promises.push(writeComponentJson(projectRootDir, counterpartDir, counterpartJson));
  }
  return Promise.all(promises);
}
async function addLink(projectRootDir, src, dst, isElse = false) {
  if (src === dst) {
    return Promise.reject(new Error("cyclic link is not allowed"));
  }
  const srcDir = await getComponentDir(projectRootDir, src, true);
  const srcJson = await readComponentJson(srcDir);
  const dstDir = await getComponentDir(projectRootDir, dst, true);
  const dstJson = await readComponentJson(dstDir);

  for (const type of ["viewer", "source"]) {
    if (srcJson.type !== type && dstJson.type !== type) {
      continue;
    }
    const err = new Error(`${type} can not have link`);
    err.src = src;
    err.srcName = srcJson.name;
    err.dst = dst;
    err.dstName = dstJson.name;
    err.isElse = isElse;
    err.code = "ELINK";
    return Promise.reject(err);
  }

  if (isElse && !srcJson.else.includes(dst)) {
    srcJson.else.push(dst);
  } else if (!srcJson.next.includes(dst)) {
    srcJson.next.push(dst);
  }
  await writeComponentJson(projectRootDir, srcDir, srcJson);

  if (!dstJson.previous.includes(src)) {
    dstJson.previous.push(src);
  }
  return writeComponentJson(projectRootDir, dstDir, dstJson);
}

async function removeLink(projectRootDir, src, dst, isElse) {
  const srcDir = await getComponentDir(projectRootDir, src, true);
  const srcJson = await readComponentJson(srcDir);
  if (isElse) {
    srcJson.else = srcJson.else.filter((e)=>{
      return e !== dst;
    });
  } else {
    srcJson.next = srcJson.next.filter((e)=>{
      return e !== dst;
    });
  }
  await writeComponentJson(projectRootDir, srcDir, srcJson);

  const dstDir = await getComponentDir(projectRootDir, dst, true);
  const dstJson = await readComponentJson(dstDir);
  dstJson.previous = dstJson.previous.filter((e)=>{
    return e !== src;
  });
  await writeComponentJson(projectRootDir, dstDir, dstJson);
}

async function addFileLink(projectRootDir, srcNode, srcName, dstNode, dstName) {
  if (srcNode === dstNode) {
    return Promise.reject(new Error("cyclic link is not allowed"));
  }
  if (await isParent(projectRootDir, dstNode, srcNode)) {
    return addFileLinkToParent(projectRootDir, srcNode, srcName, dstName);
  }
  if (await isParent(projectRootDir, srcNode, dstNode)) {
    return addFileLinkFromParent(projectRootDir, srcName, dstNode, dstName);
  }
  return addFileLinkBetweenSiblings(projectRootDir, srcNode, srcName, dstNode, dstName);
}

async function removeFileLink(projectRootDir, srcNode, srcName, dstNode, dstName) {
  if (await isParent(projectRootDir, dstNode, srcNode)) {
    return removeFileLinkToParent(projectRootDir, srcNode, srcName, dstName);
  }
  if (await isParent(projectRootDir, srcNode, dstNode)) {
    return removeFileLinkFromParent(projectRootDir, srcName, dstNode, dstName);
  }
  return removeFileLinkBetweenSiblings(projectRootDir, srcNode, srcName, dstNode, dstName);
}


async function cleanComponent(projectRootDir, ID) {
  const targetDir = await getComponentDir(projectRootDir, ID, true);

  const pathSpec = `${replacePathsep(path.relative(projectRootDir, targetDir))}/*`;
  await gitResetHEAD(projectRootDir, pathSpec);
  await gitClean(projectRootDir, pathSpec);

  const descendantsDirs = await getDescendantsIDs(projectRootDir, ID);
  return removeComponentPath(projectRootDir, descendantsDirs);
}

async function removeComponent(projectRootDir, ID) {
  const targetDir = await getComponentDir(projectRootDir, ID, true);
  const descendantsIDs = await getDescendantsIDs(projectRootDir, ID);

  //remove all link/filelink to or from components to be removed
  for (const descendantID of descendantsIDs) {
    await removeAllLink(projectRootDir, descendantID);
  }
  //gitOperator.rm() only remove existing files from git repo if directory is passed
  //so, gitRm and fs.remove must be called in this order
  await gitRm(projectRootDir, targetDir);
  await fs.remove(targetDir);
  return removeComponentPath(projectRootDir, descendantsIDs);
}

async function getSourceComponents(projectRootDir) {
  const componentJsonFiles = await promisify(glob)(path.join(projectRootDir, "**", componentJsonFilename));
  const components = await Promise.all(componentJsonFiles
    .map((componentJsonFile)=>{
      return readJsonGreedy(componentJsonFile);
    }));

  return components.filter((componentJson)=>{
    return componentJson.type === "source" && !componentJson.subComponent && !componentJson.disable;
  });
}

/**
 * determin specified path is componennt dir or not
 * @param {string} target - directory path
 * @returns {boolean} - whether given path is component directory or not
 */
async function isComponentDir(target) {
  const stats = await fs.lstat(path.resolve(target));
  if (!stats.isDirectory()) {
    return false;
  }
  return fs.pathExists(path.resolve(target, componentJsonFilename));
}

/**
 * read all component json file under specified directory
 * @param {string} projectRootDir - root directory path of project
 * @param {strint} rootDir - start point of directory search
 * @returns {Object} - integrated component json data
 */
async function getComponentTree(projectRootDir, rootDir) {
  const projectJson = await readJsonGreedy(path.resolve(projectRootDir, projectJsonFilename));
  const start = path.isAbsolute(rootDir) ? path.relative(projectRootDir, rootDir) || "./" : rootDir;
  const componentJsonFileList = Object.values(projectJson.componentPath)
    .filter((dirname)=>{
      return isPathInside(dirname, start) || path.normalize(dirname) === path.normalize(start);
    })
    .map((dirname)=>{
      return path.join(dirname, componentJsonFilename);
    });
  const componentJsonList = await Promise.all(componentJsonFileList.map((target)=>{
    return readJsonGreedy(path.resolve(projectRootDir, target));
  }));

  //Naive implementation
  const startStriped = start.endsWith("/") ? start.slice(0, -1) : start;
  const rootIndex = componentJsonFileList.findIndex((e)=>{
    return path.dirname(e) === startStriped;
  });
  if (rootIndex === -1) {
    throw Promise.reject(new Error("root component not found"));
  }

  const root = componentJsonList.splice(rootIndex, 1)[0];

  for (const target of componentJsonList) {
    const parentComponent = componentJsonList.find((e)=>{
      return e.ID === target.parent;
    }) || root;
    if (Array.isArray(parentComponent.children)) {
      parentComponent.children.push(target);
    } else {
      parentComponent.children = [target];
    }
  }

  return root;
}


module.exports = {
  getHosts,
  getSourceComponents,
  getChildren,
  readComponentJsonByID,
  validateComponents,
  componentJsonReplacer,
  createNewComponent,
  renameComponentDir,
  updateComponent,
  updateStepNumber,
  addInputFile,
  addOutputFile,
  removeInputFile,
  removeOutputFile,
  renameInputFile,
  renameOutputFile,
  addLink,
  addFileLink,
  removeLink,
  removeFileLink,
  getEnv,
  replaceEnv,
  cleanComponent,
  removeComponent,
  isComponentDir,
  getComponentTree,
  readComponentJson,
  isLocal,
  isSameRemoteHost
};
