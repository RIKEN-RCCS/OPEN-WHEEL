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

const _internal = {
  fs,
  gitRm,
  updateComponentPath,
  getComponentDir,
  readComponentJson,
  writeComponentJson,
  getLogger,
  removeInputFileLinkFromParent,
  removeInputFileLinkFromSiblings,
  removeOutputFileLinkToParent,
  removeOutputFileLinkToSiblings
};

/**
 * remove input file link from parent
 * @param {string} projectRootDir - project's root path
 * @param {string} srcName - outputFile name on parent
 * @param {string} dstNode - component ID which have link to be removed
 * @param {string} dstName - inputFile name on the child component
 */
async function removeInputFileLinkFromParent(projectRootDir, srcName, dstNode, dstName) {
  const dstDir = await _internal.getComponentDir(projectRootDir, dstNode, true);
  const parentDir = path.dirname(dstDir);
  const parentJson = await _internal.readComponentJson(parentDir);

  const parentInputFile = parentJson.inputFiles.find((e)=>{
    return e.name === srcName;
  });
  if (Object.prototype.hasOwnProperty.call(parentInputFile, "forwardTo")) {
    parentInputFile.forwardTo = parentInputFile.forwardTo.filter((e)=>{
      return e.dstNode !== dstNode || e.dstName !== dstName;
    });
  }
  return _internal.writeComponentJson(projectRootDir, parentDir, parentJson);
}
_internal.removeInputFileLinkFromParent = removeInputFileLinkFromParent;

/**
 * remove output file link to parent
 * @param {string} projectRootDir - project's root path
 * @param {string} srcNode - component ID which have link to be removed
 * @param {string} srcName - outputFile name on the child component
 * @param {string} dstName - inputFile name on the parent
 */
async function removeOutputFileLinkToParent(projectRootDir, srcNode, srcName, dstName) {
  const srcDir = await _internal.getComponentDir(projectRootDir, srcNode, true);
  const parentDir = path.dirname(srcDir);
  const parentJson = await _internal.readComponentJson(parentDir);
  const parentOutputFile = parentJson.outputFiles.find((e)=>{
    return e.name === dstName;
  });
  if (Object.prototype.hasOwnProperty.call(parentOutputFile, "origin")) {
    parentOutputFile.origin = parentOutputFile.origin.filter((e)=>{
      return e.srcNode !== srcNode || e.srcName !== srcName;
    });
  }
  return _internal.writeComponentJson(projectRootDir, parentDir, parentJson);
}
_internal.removeOutputFileLinkToParent = removeOutputFileLinkToParent;

/**
 * remove input file link from siblings
 * @param {string} projectRootDir - project's root path
 * @param {string} srcNode - src component ID which have link to be removed
 * @param {string} srcName - outputFile name on parent
 * @param {string} dstNode - dst component ID which have link to be removed
 * @param {string} dstName - inputFile name on the other side
 */
async function removeInputFileLinkFromSiblings(projectRootDir, srcNode, srcName, dstNode, dstName) {
  const srcDir = await _internal.getComponentDir(projectRootDir, srcNode, true);
  const srcJson = await _internal.readComponentJson(srcDir);
  const srcOutputFile = srcJson.outputFiles.find((e)=>{
    return e.name === srcName;
  });
  srcOutputFile.dst = srcOutputFile.dst.filter((e)=>{
    return !(e.dstNode === dstNode && e.dstName === dstName);
  });
  return _internal.writeComponentJson(projectRootDir, srcDir, srcJson);
}
_internal.removeInputFileLinkFromSiblings = removeInputFileLinkFromSiblings;

/**
 * remove output file link to siblings
 * @param {string} projectRootDir - project's root path
 * @param {string} srcNode - src component ID which have link to be removed
 * @param {string} srcName - outputFile name on parent
 * @param {string} dstNode - dst component ID which have link to be removed
 * @param {string} dstName - inputFile name on the other side
 */
async function removeOutputFileLinkToSiblings(projectRootDir, srcNode, srcName, dstNode, dstName) {
  const dstDir = await _internal.getComponentDir(projectRootDir, dstNode, true);
  const dstJson = await _internal.readComponentJson(dstDir);
  const dstInputFile = dstJson.inputFiles.find((e)=>{
    return e.name === dstName;
  });
  dstInputFile.src = dstInputFile.src.filter((e)=>{
    return !(e.srcNode === srcNode && e.srcName === srcName);
  });
  return _internal.writeComponentJson(projectRootDir, dstDir, dstJson);
}
_internal.removeOutputFileLinkToSiblings = removeOutputFileLinkToSiblings;

/**
 * remove input file link from counter part to specified component
 * @param {string} projectRootDir - project's root path
 * @param {object} componentJson -  component JSON data about to be renamed
 * @param {number} index - index number of input file which to be removed
 */
async function removeInputFileCounterpart(projectRootDir, componentJson, index) {
  const name = componentJson.inputFiles[index].name;
  const promises = [];
  for (const counterPart of componentJson.inputFiles[index].src) {
    if (counterPart.srcNode === "parent" || counterPart.srcNode === componentJson.parent) {
      promises.push(_internal.removeInputFileLinkFromParent(projectRootDir, counterPart.srcName, componentJson.ID, name));
    } else {
      promises.push(_internal.removeInputFileLinkFromSiblings(projectRootDir, counterPart.srcNode, counterPart.srcName, componentJson.ID, name));
    }
  }
  return Promise.all(promises);
}

/**
 * remove output file link from counter part to specified component
 * @param {string} projectRootDir - project's root path
 * @param {object} componentJson -  component JSON data about to be renamed
 * @param {number} index - index number of input file which to be removed
 */
async function removeOutputFileCounterpart(projectRootDir, componentJson, index) {
  const promises = [];
  const name = componentJson.outputFiles[index].name;
  for (const counterPart of componentJson.outputFiles[index].dst) {
    if (counterPart.dstNode === "parent" || counterPart.dstNode === componentJson.parent) {
      promises.push(_internal.removeOutputFileLinkToParent(projectRootDir, componentJson.ID, name, counterPart.dstName));
    } else {
      promises.push(_internal.removeOutputFileLinkToSiblings(projectRootDir, componentJson.ID, name, counterPart.dstNode, counterPart.dstName));
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
    const counterpartDir = await _internal.getComponentDir(projectRootDir, counterPartID, true);
    const counterpartJson = await _internal.readComponentJson(counterpartDir);
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
    promises.push(_internal.writeComponentJson(projectRootDir, counterpartDir, counterpartJson));
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
    const counterpartDir = await _internal.getComponentDir(projectRootDir, counterPartID, true);
    const counterpartJson = await _internal.readComponentJson(counterpartDir);
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
    promises.push(_internal.writeComponentJson(projectRootDir, counterpartDir, counterpartJson));
  }
  return Promise.all(promises);
}

/**
 * rename component directory and update componentJsonPath
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - component ID
 * @param {string} newName - component's new name
 */
async function renameComponentDir(projectRootDir, ID, newName) {
  const oldDir = await _internal.getComponentDir(projectRootDir, ID, true);
  if (oldDir === projectRootDir) {
    return Promise.reject(new Error("updateNode can not rename root workflow"));
  }
  const newDir = path.resolve(path.dirname(oldDir), newName);

  await _internal.gitRm(projectRootDir, oldDir);
  await _internal.fs.move(oldDir, newDir);
  //git add will be issued in updateComponent()
  return _internal.updateComponentPath(projectRootDir, ID, newDir);
}

/**
 * update component
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - component ID
 * @param {object} updated - new component JSON data
 * @returns {boolean} - component is renamed or not
 */
async function updateComponent(projectRootDir, ID, updated) {
  const logger = _internal.getLogger(projectRootDir);

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

  const targetComponentDir = await _internal.getComponentDir(projectRootDir, ID, true);
  const targetComponent = await _internal.readComponentJson(targetComponentDir);
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
  const logger = _internal.getLogger(projectRootDir);
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
  const componentDir = await _internal.getComponentDir(projectRootDir, ID, true);
  const componentJson = await _internal.readComponentJson(componentDir);
  componentJson.pos.x = pos.x;
  componentJson.pos.y = pos.y;
  await _internal.writeComponentJson(projectRootDir, componentDir, componentJson);
};

module.exports = {
  updateComponent,
  updateComponentPos,
  removeInputFileLinkFromParent,
  removeOutputFileLinkToParent,
  removeInputFileLinkFromSiblings,
  removeOutputFileLinkToSiblings,
  removeInputFileCounterpart,
  removeOutputFileCounterpart,
  renameInputFileCounterpart,
  renameOutputFileCounterpart,
  renameComponentDir
};

if (process.env.NODE_ENV === "test") {
  module.exports._internal = _internal;
}
