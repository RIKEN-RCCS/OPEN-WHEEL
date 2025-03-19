/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const fs = require("fs-extra");
const path = require("path");
const { diff } = require("just-diff");
const { diffApply } = require("just-diff-apply");
const Ajv = require("ajv");

const { gitRm } = require("./gitOperator2");
const { isValidName, isValidInputFilename, isValidOutputFilename } = require("../lib/utility");
const { updateComponentPath } = require("./projectFilesOperator.js");
const { getComponentDir, readComponentJson, writeComponentJson, writeComponentJsonByID } = require("./componentJsonIO.js");
const getSchema = require("../db/jsonSchemas.js");
const { getLogger } = require("../logSettings.js");

/**
 * remove input file link from parent
 * @param {string} projectRootDir - project's root path
 * @param {string} srcName - outputFile name on parent
 * @param {string} dstNode - component ID which have link to be removed
 * @param {string} dstName - inputFile name on the child component
 */
async function removeInputFileLinkFromParent(projectRootDir, srcName, dstNode, dstName) {
  const dstDir = await getComponentDir(projectRootDir, dstNode, true);
  const parentDir = path.dirname(dstDir);
  const parentJson = await readComponentJson(parentDir);

  const parentInputFile = parentJson.inputFiles.find((e)=>{
    return e.name === srcName;
  });
  if (Object.prototype.hasOwnProperty.call(parentInputFile, "forwardTo")) {
    parentInputFile.forwardTo = parentInputFile.forwardTo.filter((e)=>{
      return e.dstNode !== dstNode || e.dstName !== dstName;
    });
  }
  return writeComponentJson(projectRootDir, parentDir, parentJson);
}

/**
 * remove output file link to parent
 * @param {string} projectRootDir - project's root path
 * @param {string} srcNode - component ID which have link to be removed
 * @param {string} srcName - outputFile name on the child component
 * @param {string} dstName - inputFile name on the parent
 */
async function removeOutputFileLinkToParent(projectRootDir, srcNode, srcName, dstName) {
  const srcDir = await getComponentDir(projectRootDir, srcNode, true);
  const parentDir = path.dirname(srcDir);
  const parentJson = await readComponentJson(parentDir);
  const parentOutputFile = parentJson.outputFiles.find((e)=>{
    return e.name === dstName;
  });
  if (Object.prototype.hasOwnProperty.call(parentOutputFile, "origin")) {
    parentOutputFile.origin = parentOutputFile.origin.filter((e)=>{
      return e.srcNode !== srcNode || e.srcName !== srcName;
    });
  }
  return writeComponentJson(projectRootDir, parentDir, parentJson);
}

/**
 * remove input file link from siblings
 * @param {string} projectRootDir - project's root path
 * @param {string} srcNode - src component ID which have link to be removed
 * @param {string} srcName - outputFile name on parent
 * @param {string} dstNode - dst component ID which have link to be removed
 * @param {string} dstName - inputFile name on the other side
 */
async function removeInputFileLinkFromSiblings(projectRootDir, srcNode, srcName, dstNode, dstName) {
  const srcDir = await getComponentDir(projectRootDir, srcNode, true);
  const srcJson = await readComponentJson(srcDir);
  const srcOutputFile = srcJson.outputFiles.find((e)=>{
    return e.name === srcName;
  });
  srcOutputFile.dst = srcOutputFile.dst.filter((e)=>{
    return !(e.dstNode === dstNode && e.dstName === dstName);
  });
  return writeComponentJson(projectRootDir, srcDir, srcJson);
}

/**
 * remove output file link to siblings
 * @param {string} projectRootDir - project's root path
 * @param {string} srcNode - src component ID which have link to be removed
 * @param {string} srcName - outputFile name on parent
 * @param {string} dstNode - dst component ID which have link to be removed
 * @param {string} dstName - inputFile name on the other side
 */
async function removeOutputFileLinkToSiblings(projectRootDir, srcNode, srcName, dstNode, dstName) {
  const dstDir = await getComponentDir(projectRootDir, dstNode, true);
  const dstJson = await readComponentJson(dstDir);
  const dstInputFile = dstJson.inputFiles.find((e)=>{
    return e.name === dstName;
  });
  dstInputFile.src = dstInputFile.src.filter((e)=>{
    return !(e.srcNode === srcNode && e.srcName === srcName);
  });
  return writeComponentJson(projectRootDir, dstDir, dstJson);
}

/**
 * remove input file link from counter part to specified component
 * @param {string} projectRootDir - project's root path
 * @param {object} componentJson -  component JSON data about to be renamed
 * @param {string} name - inputFile name to be removed
 * @param index
 */
async function removeInputFileCounterpart(projectRootDir, componentJson, index) {
  const name = componentJson.inputFiles[index].name;
  const promises = [];
  for (const counterPart of componentJson.inputFiles[index].src) {
    if (counterPart.srcNode === "parent" || counterPart.srcNode === componentJson.parent) {
      promises.push(removeInputFileLinkFromParent(projectRootDir, counterPart.srcName, componentJson.ID, name));
    } else {
      promises.push(removeInputFileLinkFromSiblings(projectRootDir, counterPart.srcNode, counterPart.srcName, componentJson.ID, name));
    }
  }
  return Promise.all(promises);
}

/**
 * remove output file link from counter part to specified component
 * @param {string} projectRootDir - project's root path
 * @param {object} componentJson -  component JSON data about to be renamed
 * @param {string} name - inputFile name to be removed
 * @param index
 */
async function removeOutputFileCounterpart(projectRootDir, componentJson, index) {
  const promises = [];
  const name = componentJson.outputFiles[index].name;
  for (const counterPart of componentJson.outputFiles[index].dst) {
    if (counterPart.dstNode === "parent" || counterPart.dstNode === componentJson.parent) {
      promises.push(removeOutputFileLinkToParent(projectRootDir, componentJson.ID, name, counterPart.dstName));
    } else {
      promises.push(removeOutputFileLinkToSiblings(projectRootDir, componentJson.ID, name, counterPart.dstNode, counterPart.dstName));
    }
  }
  return Promise.all(promises);
}

/**
 * rename inputFile name and its counterparts' dstName
 * @param {string} projectRootDir - project's root path
 * @param {object} componentJson -  component JSON data about to be renamed
 * @param {number} index - index number to be renamed
 * @param {string} oldName - old inputFile name
 * @param {string} newName - new inputFile name
 */
async function renameInputFileCounterpart(projectRootDir, componentJson, index, oldName, newName) {
  if (index < 0 || componentJson.inputFiles.length - 1 < index) {
    return Promise.reject(new Error(`invalid index ${index}`));
  }

  const counterparts = new Set();
  componentJson.inputFiles[index].src.forEach((e)=>{
    counterparts.add(e.srcNode);
  });

  const promises = [];
  for (const counterPartID of counterparts) {
    const counterpartDir = await getComponentDir(projectRootDir, counterPartID, true);
    const counterpartJson = await readComponentJson(counterpartDir);
    for (const outputFile of counterpartJson.outputFiles) {
      for (const dst of outputFile.dst) {
        if (dst.dstNode === componentJson.ID && dst.dstName === oldName) {
          dst.dstName = newName;
        }
      }
    }
    for (const inputFile of counterpartJson.inputFiles) {
      if (Object.prototype.hasOwnProperty.call(inputFile, "forwardTo")) {
        for (const dst of inputFile.forwardTo) {
          if (dst.dstNode === componentJson.ID && dst.dstName === oldName) {
            dst.dstName = newName;
          }
        }
      }
    }
    promises.push(writeComponentJson(projectRootDir, counterpartDir, counterpartJson));
  }
  return Promise.all(promises);
}

/**
 * rename outputFile name and its counterparts' srcName
 * @param {string} projectRootDir - project's root path
 * @param {object} componentJson -  component JSON data about to be renamed
 * @param {number} index - index number to be renamed
 * @param {string} oldName - old outputFile name
 * @param {string} newName - new outputFile name
 */
async function renameOutputFileCounterpart(projectRootDir, componentJson, index, oldName, newName) {
  if (index < 0 || componentJson.outputFiles.length - 1 < index) {
    return Promise.reject(new Error(`invalid index ${index}`));
  }

  const counterparts = new Set();
  componentJson.outputFiles[index].dst.forEach((e)=>{
    counterparts.add(e.dstNode);
  });

  const promises = [];
  for (const counterPartID of counterparts) {
    const counterpartDir = await getComponentDir(projectRootDir, counterPartID, true);
    const counterpartJson = await readComponentJson(counterpartDir);
    for (const inputFile of counterpartJson.inputFiles) {
      for (const src of inputFile.src) {
        if (src.srcNode === componentJson.ID && src.srcName === oldName) {
          src.srcName = newName;
        }
      }
    }
    for (const outputFile of counterpartJson.outputFiles) {
      if (Object.prototype.hasOwnProperty.call(outputFile, "origin")) {
        for (const src of outputFile.origin) {
          if (src.srcNode === componentJson.ID && src.srcName === oldName) {
            src.srcName = newName;
          }
        }
      }
    }
    promises.push(writeComponentJson(projectRootDir, counterpartDir, counterpartJson));
  }
  return Promise.all(promises);
}

/**
 * rename component directory and update componentJsonPath
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - component ID
 * @param newName
 */
async function renameComponentDir(projectRootDir, ID, newName) {
  const oldDir = await getComponentDir(projectRootDir, ID, true);
  if (oldDir === projectRootDir) {
    return Promise.reject(new Error("updateNode can not rename root workflow"));
  }
  const newDir = path.resolve(path.dirname(oldDir), newName);

  await gitRm(projectRootDir, oldDir);
  await fs.move(oldDir, newDir);
  //git add will be issued in updateComponent()
  return updateComponentPath(projectRootDir, ID, newDir);
}

/**
 * update component
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - component ID
 * @param {object} updated - new component JSON data
 * @returns {boolean} - component is renamed or not
 */
async function updateComponent(projectRootDir, ID, updated) {
  const logger = getLogger(projectRootDir);

  const ajv = new Ajv({
    allErrors: true,
    removeAdditional: "all",
    useDefaults: true,
    coerceTypes: true,
    logger: {
      log: logger.debug.bind(logger),
      warn: logger.warn.bind(logger),
      error: logger.warn.bind(logger)
    }
  });
  const schema = getSchema(updated.type);
  if (schema === null) {
    throw new Error(`JSON schema for ${updated.type} is not available`);
  }
  const validate = ajv.compile(schema);
  validate(updated);
  if (validate !== null && Array.isArray(validate.errors)) {
    const err = new Error("invalid JSON specified");
    err.errors = validate.errors;
    throw err;
  }

  const targetComponentDir = await getComponentDir(projectRootDir, ID, true);
  const targetComponent = await readComponentJson(targetComponentDir);
  if (updated.type !== targetComponent.type) {
    throw new Error("updateComponent can not change component's type");
  }

  const patch = diff(targetComponent, updated);
  let newName = null;
  const changeInputFileNames = [];
  const changeOutputFileNames = [];
  const removeInputFiles = [];
  const removeOutputFiles = [];

  //remove next, previous, else, inputFiles, and outputFiles from patch
  //because these props must be changed by dedicated API (ex. addLink)
  const sanitizedPatch = patch.filter((e)=>{
    if (e.path[0] === "name") {
      if (!isValidName(e.value)) {
        return false;
      }
      newName = e.value;
    }
    if (e.path[0] === "inputFiles") {
      if (e.path[2] === "name") {
        if (!isValidInputFilename(e.value)) {
          return false;
        }
        e.oldName = targetComponent.inputFiles[e.path[1]].name;
        changeInputFileNames.push(e);
        return true;
      }
      if (e.op === "remove" && e.path[2] !== "src") {
        removeInputFiles.push(e);
      }
      return e.path[2] !== "src";
    }
    if (e.path[0] === "outputFiles") {
      if (e.path[2] === "name") {
        if (!isValidOutputFilename(e.value)) {
          return false;
        }
        e.oldName = targetComponent.outputFiles[e.path[1]].name;
        changeOutputFileNames.push(e);
        return true;
      }
      if (e.op === "remove" && e.path[2] !== "dst") {
        removeOutputFiles.push(e);
      }
      return e.path[2] !== "dst";
    }
    return !["next", "previous", "else"].includes(e.path[0]);
  });

  await Promise.all(changeInputFileNames.map((e)=>{
    const oldName = e.oldName;
    delete e.oldName;
    return renameInputFileCounterpart(projectRootDir, targetComponent, e.path[1], oldName, e.value);
  }));
  await Promise.all(changeOutputFileNames.map((e)=>{
    const oldName = e.oldName;
    delete e.oldName;
    return renameOutputFileCounterpart(projectRootDir, targetComponent, e.path[1], oldName, e.value);
  }));
  await Promise.all(removeInputFiles.map((e)=>{
    return removeInputFileCounterpart(projectRootDir, targetComponent, e.path[1]);
  }));
  await Promise.all(removeOutputFiles.map((e)=>{
    return removeOutputFileCounterpart(projectRootDir, targetComponent, e.path[1]);
  }));
  if (newName !== null) {
    await renameComponentDir(projectRootDir, ID, newName);
  }

  diffApply(targetComponent, sanitizedPatch);
  if (targetComponent.type === "source" && targetComponent.uploadOnDemand === true) {
    const oldName = targetComponent.outputFiles[0].name;
    targetComponent.outputFiles[0].name = "UPLOAD_ONDEMAND";
    await renameOutputFileCounterpart(projectRootDir, targetComponent, 0, oldName, "UPLOAD_ONDEMAND");
  }
  if (targetComponent.type === "source" && targetComponent.outputFiles[0].name !== "UPLOAD_ONDEMAND") {
    targetComponent.uploadOnDemand = false;
  }

  await writeComponentJsonByID(projectRootDir, ID, targetComponent);
  return newName !== null;
};

/**
 * update component's position
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - component ID
 * @param {object} pos - new position of component
 */
async function updateComponentPos(projectRootDir, ID, pos) {
  const logger = getLogger(projectRootDir);
  const ajv = new Ajv({
    allErrors: true,
    removeAdditional: "all",
    useDefaults: true,
    coerceTypes: true,
    logger: {
      log: logger.debug.bind(logger),
      warn: logger.warn.bind(logger),
      error: logger.warn.bind(logger)
    }
  });
  const schema = getSchema("pos");
  const validate = ajv.compile(schema);
  validate(pos);
  if (validate !== null && Array.isArray(validate.errors)) {
    const err = new Error("invalid JSON specified");
    err.errors = validate.errors;
    throw err;
  }
  const componentDir = await getComponentDir(projectRootDir, ID, true);
  const componentJson = await readComponentJson(componentDir);
  componentJson.pos.x = pos.x;
  componentJson.pos.y = pos.y;
  await writeComponentJson(projectRootDir, componentDir, componentJson);
};

module.exports = {
  updateComponent,
  updateComponentPos
};
