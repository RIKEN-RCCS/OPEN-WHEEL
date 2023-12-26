/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path = require("path");
const { getLogger } = require("../logSettings");
const {
  addInputFile,
  addOutputFile,
  removeInputFile,
  removeOutputFile,
  renameInputFile,
  renameOutputFile,
  addLink,
  addFileLink,
  removeLink,
  removeAllLink,
  removeFileLink,
  removeAllFileLink,
  removeComponent,
  createNewComponent,
  updateComponent,
  getEnv,
  replaceEnv
} = require("../core/projectFilesOperator.js");
const { getComponentDir } = require("../core/projectFilesOperator.js");
const { sendWorkflow, sendProjectJson, sendComponentTree } = require("./senders.js");
const { projectJsonFilename } = require("../db/db");
const { readJsonGreedy } = require("../core/fileUtils");
const { convertPathSep } = require("../core/pathUtils");


async function generalHandler(func, funcname, projectRootDir, parentID, cb) {
  try {
    await func();
  } catch (e) {
    getLogger(projectRootDir).error(`${funcname} failed`, e);
    cb(e);
    return;
  }
  const parentDir = await getComponentDir(projectRootDir, parentID, true);
  await sendWorkflow(cb, projectRootDir, parentDir);
}


async function onAddInputFile(projectRootDir, ID, name, parentID, cb) {
  return generalHandler(addInputFile.bind(null, projectRootDir, ID, name), "addInputFile", projectRootDir, parentID, cb);
}

async function onAddOutputFile(projectRootDir, ID, name, parentID, cb) {
  return generalHandler(addOutputFile.bind(null, projectRootDir, ID, name), "addOutputFile", projectRootDir, parentID, cb);
}

async function onRemoveInputFile(projectRootDir, ID, name, parentID, cb) {
  return generalHandler(removeInputFile.bind(null, projectRootDir, ID, name), "removeInputFile", projectRootDir, parentID, cb);
}

async function onRemoveOutputFile(projectRootDir, ID, name, parentID, cb) {
  return generalHandler(removeOutputFile.bind(null, projectRootDir, ID, name), "removeOutputFile", projectRootDir, parentID, cb);
}

async function onRenameInputFile(projectRootDir, ID, index, newName, parentID, cb) {
  return generalHandler(renameInputFile.bind(null, projectRootDir, ID, index, newName), "renameInputFile", projectRootDir, parentID, cb);
}

async function onRenameOutputFile(projectRootDir, ID, index, newName, parentID, cb) {
  return generalHandler(renameOutputFile.bind(null, projectRootDir, ID, index, newName), "renameOutputFile", projectRootDir, parentID, cb);
}

async function onUpdateNode(projectRootDir, ID, prop, value, cb) {
  try {
    await updateComponent(projectRootDir, ID, prop, value);
    const filename = path.resolve(projectRootDir, projectJsonFilename);
    const projectJson = await readJsonGreedy(filename);
    const cwd = path.dirname(projectJson.componentPath[ID]);
    await sendWorkflow(cb, projectRootDir, cwd);

    if (prop === "name") {
      await sendProjectJson(projectRootDir); //to update componentPath
      await sendComponentTree(projectRootDir, projectRootDir);
    }
  } catch (e) {
    e.projectRootDir = projectRootDir;
    e.ID = ID;
    e.prop = prop;
    e.value = value;
    getLogger(projectRootDir).error("update node failed", e);
    cb(false);
    return;
  }
  cb(true);
}

async function onCreateNode(projectRootDir, request, parentID, cb) {
  await generalHandler(createNewComponent.bind(null, projectRootDir, convertPathSep(request.path), request.type, request.pos), "createNewComponent", projectRootDir, parentID, cb);
  await sendProjectJson(projectRootDir);
  return sendComponentTree(projectRootDir, projectRootDir);
}

async function onRemoveNode(projectRootDir, ID, parentID, cb) {
  await generalHandler(removeComponent.bind(null, projectRootDir, ID), "removeComponent", projectRootDir, parentID, cb);
  await sendProjectJson(projectRootDir);
  return sendComponentTree(projectRootDir, projectRootDir);
}


async function onAddLink(projectRootDir, msg, parentID, cb) {
  return generalHandler(addLink.bind(null, projectRootDir, msg.src, msg.dst, msg.isElse), "addLink", projectRootDir, parentID, cb);
}

async function onRemoveLink(projectRootDir, msg, parentID, cb) {
  return generalHandler(removeLink.bind(null, projectRootDir, msg.src, msg.dst, msg.isElse), "removeLink", projectRootDir, parentID, cb);
}

async function onRemoveAllLink(projectRootDir, componentID, parentID, cb) {
  return generalHandler(removeAllLink.bind(null, projectRootDir, componentID), "removeAllLink", projectRootDir, parentID, cb);
}

async function onAddFileLink(projectRootDir, srcNode, srcName, dstNode, dstName, parentID, cb) {
  return generalHandler(addFileLink.bind(null, projectRootDir, srcNode, srcName, dstNode, dstName), "addFileLink", projectRootDir, parentID, cb);
}
async function onRemoveFileLink(projectRootDir, srcNode, srcName, dstNode, dstName, parentID, cb) {
  return generalHandler(removeFileLink.bind(null, projectRootDir, srcNode, srcName, dstNode, dstName), "removeFileLink", projectRootDir, parentID, cb);
}

async function onRemoveAllFileLink(projectRootDir, componentID, inputFileName, fromChildren, parentID, cb) {
  return generalHandler(removeAllFileLink.bind(null, projectRootDir, componentID, inputFileName, fromChildren), "removeFileLink", projectRootDir, parentID, cb);
}

async function onUpdateEnv(projectRootDir, ID, newEnv, parentID, cb) {
  return generalHandler(replaceEnv.bind(null, projectRootDir, ID, newEnv), "updateEnv", projectRootDir, parentID, cb);
}

async function onGetEnv(projectRootDir, ID, cb) {
  try {
    const env = await getEnv(projectRootDir, ID);
    return cb(env);
  } catch (e) {
    getLogger(projectRootDir).error("getEnv failed", e);
    return cb(e);
  }
}

module.exports = {
  onAddInputFile,
  onAddOutputFile,
  onRenameInputFile,
  onRenameOutputFile,
  onRemoveInputFile,
  onRemoveOutputFile,
  onUpdateNode,
  onCreateNode,
  onRemoveNode,
  onAddLink,
  onAddFileLink,
  onRemoveLink,
  onRemoveAllLink,
  onRemoveFileLink,
  onRemoveAllFileLink,
  onUpdateEnv,
  onGetEnv
};
