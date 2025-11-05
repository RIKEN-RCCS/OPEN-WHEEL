/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import fs from "fs-extra";
import { glob } from "glob";
import { getLogger } from "../logSettings.js";
import { isValidInputFilename, isValidOutputFilename } from "../lib/utility.js";
import { getComponentDir, writeComponentJson, readComponentJson } from "./componentJsonIO.js";
import { removeFileLink } from "./componentLinks.js";

const _internal = {
  fs,
  glob,
  getLogger,
  isValidInputFilename,
  isValidOutputFilename,
  getComponentDir,
  readComponentJson,
  writeComponentJson,
  removeFileLink,
  renameOutputFile,
  addOutputFile
};

/**
 * add inputFile to component
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - component ID
 * @param {string} name - inputfile's name
 * @returns {Promise} - resolved when update is done
 */
export async function addInputFile(projectRootDir, ID, name) {
  if (!_internal.isValidInputFilename(name)) {
    return Promise.reject(new Error(`${name} is not valid inputFile name`));
  }
  const componentDir = await _internal.getComponentDir(projectRootDir, ID, true);
  const componentJson = await _internal.readComponentJson(componentDir);
  if (!Object.prototype.hasOwnProperty.call(componentJson, "inputFiles")) {
    const err = new Error(`${componentJson.name} does not have inputFiles`);
    err.component = componentJson;
    return Promise.reject(err);
  }
  componentJson.inputFiles.push({ name, src: [] });
  return _internal.writeComponentJson(projectRootDir, componentDir, componentJson);
};

/**
 * add outputFile to component
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - component ID
 * @param {string} name - inputfile's name
 * @returns {Promise} - resolved when update is done
 */
export async function addOutputFile(projectRootDir, ID, name) {
  if (!_internal.isValidOutputFilename(name)) {
    return Promise.reject(new Error(`${name} is not valid outputFile name`));
  }
  const componentDir = await _internal.getComponentDir(projectRootDir, ID, true);
  const componentJson = await _internal.readComponentJson(componentDir);
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
  return _internal.writeComponentJson(projectRootDir, componentDir, componentJson);
};

/**
 * set on-demand uploaded filename to outputFile
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - component ID
 * @returns {Promise} - resolved when update is done
 */
export async function setUploadOndemandOutputFile(projectRootDir, ID) {
  const componentDir = await _internal.getComponentDir(projectRootDir, ID, true);
  const componentJson = await _internal.readComponentJson(componentDir);
  if (!Object.prototype.hasOwnProperty.call(componentJson, "outputFiles")) {
    const err = new Error(`${componentJson.name} does not have outputFiles`);
    err.component = componentJson;
    return Promise.reject(err);
  }
  if (componentJson.outputFiles.length === 0) {
    return _internal.addOutputFile(projectRootDir, ID, "UPLOAD_ONDEMAND");
  }
  if (componentJson.outputFiles.length > 1) {
    const p = [];
    for (let i = 1; i < componentJson.outputFiles.length; i++) {
      const counterparts = new Set();
      for (const dst of componentJson.outputFiles[i].dst) {
        counterparts.add(dst);
      }
      for (const counterPart of counterparts) {
        p.push(_internal.removeFileLink(projectRootDir, ID, componentJson.outputFiles[i].name, counterPart.dstNode, counterPart.dstName));
      }
    }
    await Promise.all(p);
    componentJson.outputFiles.splice(1, componentJson.outputFiles.length - 1);
  }

  return _internal.renameOutputFile(projectRootDir, ID, 0, "UPLOAD_ONDEMAND");
};

export async function removeInputFile(projectRootDir, ID, name) {
  const counterparts = new Set();
  const componentDir = await _internal.getComponentDir(projectRootDir, ID, true);
  const componentJson = await _internal.readComponentJson(componentDir);
  componentJson.inputFiles.forEach((inputFile)=>{
    if (name === inputFile.name) {
      for (const src of inputFile.src) {
        counterparts.add(src);
      }
    }
  });

  for (const counterPart of counterparts) {
    await _internal.removeFileLink(projectRootDir, counterPart.srcNode, counterPart.srcName, ID, name);
  }

  componentJson.inputFiles = componentJson.inputFiles.filter((inputFile)=>{
    return name !== inputFile.name;
  });
  return _internal.writeComponentJson(projectRootDir, componentDir, componentJson);
}

export async function removeOutputFile(projectRootDir, ID, name) {
  const counterparts = new Set();
  const componentDir = await _internal.getComponentDir(projectRootDir, ID, true);
  const componentJson = await _internal.readComponentJson(componentDir);

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
    await _internal.removeFileLink(projectRootDir, ID, name, counterPart.dstNode, counterPart.dstName);
  }
  return _internal.writeComponentJson(projectRootDir, componentDir, componentJson);
}

export async function renameInputFile(projectRootDir, ID, index, newName) {
  if (!_internal.isValidInputFilename(newName)) {
    return Promise.reject(new Error(`${newName} is not valid inputFile name`));
  }
  const componentDir = await _internal.getComponentDir(projectRootDir, ID, true);
  const componentJson = await _internal.readComponentJson(componentDir);
  if (index < 0 || componentJson.inputFiles.length - 1 < index) {
    return Promise.reject(new Error(`invalid index ${index}`));
  }

  const counterparts = new Set();
  const oldName = componentJson.inputFiles[index].name;
  componentJson.inputFiles[index].name = newName;
  componentJson.inputFiles[index].src.forEach((e)=>{
    counterparts.add(e.srcNode);
  });
  await _internal.writeComponentJson(projectRootDir, componentDir, componentJson);

  const p = [];
  for (const counterPartID of counterparts) {
    const counterpartDir = await _internal.getComponentDir(projectRootDir, counterPartID, true);
    const counterpartJson = await _internal.readComponentJson(counterpartDir);
    for (const outputFile of counterpartJson.outputFiles) {
      for (const dst of outputFile.dst) {
        if (dst.dstNode === ID && dst.dstName === oldName) {
          dst.dstName = newName;
        }
      }
    }
    if (Array.isArray(counterpartJson.inputFiles)) {
      for (const inputFile of counterpartJson.inputFiles) {
        if (Object.prototype.hasOwnProperty.call(inputFile, "forwardTo")) {
          for (const dst of inputFile.forwardTo) {
            if (dst.dstNode === ID && dst.dstName === oldName) {
              dst.dstName = newName;
            }
          }
        }
      }
    }
    p.push(_internal.writeComponentJson(projectRootDir, counterpartDir, counterpartJson));
  }
  return Promise.all(p);
}

/**
 * rename outputFile
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - component ID
 * @param {number} index - index number of outputFile to be renamed
 * @param {string} newName - new outputFile name
 * @returns {Promise} - resolved when update is done
 */
export async function renameOutputFile(projectRootDir, ID, index, newName) {
  if (!_internal.isValidOutputFilename(newName)) {
    return Promise.reject(new Error(`${newName} is not valid outputFile name`));
  }
  const componentDir = await _internal.getComponentDir(projectRootDir, ID, true);
  const componentJson = await _internal.readComponentJson(componentDir);
  if (index < 0 || componentJson.outputFiles.length - 1 < index) {
    return Promise.reject(new Error(`invalid index ${index}`));
  }

  const counterparts = new Set();
  const oldName = componentJson.outputFiles[index].name;
  componentJson.outputFiles[index].name = newName;
  componentJson.outputFiles[index].dst.forEach((e)=>{
    counterparts.add(e.dstNode);
  });
  await _internal.writeComponentJson(projectRootDir, componentDir, componentJson);

  const promises = [];
  for (const counterPartID of counterparts) {
    const counterpartDir = await _internal.getComponentDir(projectRootDir, counterPartID, true);
    const counterpartJson = await _internal.readComponentJson(counterpartDir);
    for (const inputFile of counterpartJson.inputFiles) {
      for (const src of inputFile.src) {
        if (src.srcNode === ID && src.srcName === oldName) {
          src.srcName = newName;
        }
      }
    }
    if (Array.isArray(counterpartJson.outputFiles)) {
      for (const outputFile of counterpartJson.outputFiles) {
        if (Object.prototype.hasOwnProperty.call(outputFile, "origin")) {
          for (const src of outputFile.origin) {
            if (src.srcNode === ID && src.srcName === oldName) {
              src.srcName = newName;
            }
          }
        }
      }
    }
    promises.push(_internal.writeComponentJson(projectRootDir, counterpartDir, counterpartJson));
  }
  return Promise.all(promises);
};

export { _internal };
