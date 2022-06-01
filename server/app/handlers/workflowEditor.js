/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License.txt in the project root for the license information.
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
  removeFileLink,
  removeComponent,
  createNewComponent,
  updateComponent,
  getEnv,
  updateStepNumber,
  replaceEnv
} = require("../core/componentFilesOperator.js");
const { getComponentDir } = require("../core/projectFilesOperator.js");
const { sendWorkflow, sendProjectJson, sendComponentTree } = require("./senders.js");
const { projectJsonFilename } = require("../db/db");
const { readJsonGreedy } = require("../core/fileUtils");
const { convertPathSep } = require("../core/pathUtils");


async function generalHandler(socket, func, funcname, projectRootDir, parentID, cb) {
  try {
    await func();
  } catch (e) {
    getLogger(projectRootDir).error(`${funcname} failed`, e);
    cb(e);
    return;
  }
  const parentDir = await getComponentDir(projectRootDir, parentID, true);
  await sendWorkflow(socket, cb, projectRootDir, parentDir);
}


async function onAddInputFile(socket, projectRootDir, ID, name, parentID, cb) {
  return generalHandler(socket, addInputFile.bind(null, projectRootDir, ID, name), "addInputFile", projectRootDir, parentID, cb);
}

async function onAddOutputFile(socket, projectRootDir, ID, name, parentID, cb) {
  return generalHandler(socket, addOutputFile.bind(null, projectRootDir, ID, name), "addOutputFile", projectRootDir, parentID, cb);
}

async function onRemoveInputFile(socket, projectRootDir, ID, name, parentID, cb) {
  return generalHandler(socket, removeInputFile.bind(null, projectRootDir, ID, name), "removeInputFile", projectRootDir, parentID, cb);
}

async function onRemoveOutputFile(socket, projectRootDir, ID, name, parentID, cb) {
  return generalHandler(socket, removeOutputFile.bind(null, projectRootDir, ID, name), "removeOutputFile", projectRootDir, parentID, cb);
}

async function onRenameInputFile(socket, projectRootDir, ID, index, newName, parentID, cb) {
  return generalHandler(socket, renameInputFile.bind(null, projectRootDir, ID, index, newName), "renameInputFile", projectRootDir, parentID, cb);
}

async function onRenameOutputFile(socket, projectRootDir, ID, index, newName, parentID, cb) {
  return generalHandler(socket, renameOutputFile.bind(null, projectRootDir, ID, index, newName), "renameOutputFile", projectRootDir, parentID, cb);
}

async function onUpdateNode(socket, projectRootDir, ID, prop, value, cb) {
  try {
    await updateComponent(projectRootDir, ID, prop, value);
    const filename = path.resolve(projectRootDir, projectJsonFilename);
    const projectJson = await readJsonGreedy(filename);
    const cwd = path.dirname(projectJson.componentPath[ID]);
    await sendWorkflow(socket, cb, projectRootDir, cwd);

    if (prop === "name") {
      await sendProjectJson(socket, projectRootDir); //to update componentPath
      await sendComponentTree(socket, projectRootDir, projectRootDir);
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

async function onCreateNode(socket, projectRootDir, request, parentID, cb) {
  await generalHandler(socket, createNewComponent.bind(null, projectRootDir, convertPathSep(request.path), request.type, request.pos), "createNewComponent", projectRootDir, parentID, cb);
  await sendProjectJson(socket, projectRootDir);
  return sendComponentTree(socket, projectRootDir, projectRootDir);
}

async function onRemoveNode(socket, projectRootDir, ID, parentID, cb) {
  await generalHandler(socket, removeComponent.bind(null, projectRootDir, ID), "removeComponent", projectRootDir, parentID, cb);
  await sendProjectJson(socket, projectRootDir);
  return sendComponentTree(socket, projectRootDir, projectRootDir);
}


async function onAddLink(socket, projectRootDir, msg, parentID, cb) {
  return generalHandler(socket, addLink.bind(null, projectRootDir, msg.src, msg.dst, msg.isElse), "addLink", projectRootDir, parentID, cb);
}

async function onRemoveLink(socket, projectRootDir, msg, parentID, cb) {
  return generalHandler(socket, removeLink.bind(null, projectRootDir, msg.src, msg.dst, msg.isElse), "removeLink", projectRootDir, parentID, cb);
}

async function onAddFileLink(socket, projectRootDir, srcNode, srcName, dstNode, dstName, parentID, cb) {
  return generalHandler(socket, addFileLink.bind(null, projectRootDir, srcNode, srcName, dstNode, dstName), "addFileLink", projectRootDir, parentID, cb);
}
async function onRemoveFileLink(socket, projectRootDir, srcNode, srcName, dstNode, dstName, parentID, cb) {
  return generalHandler(socket, removeFileLink.bind(null, projectRootDir, srcNode, srcName, dstNode, dstName), "removeFileLink", projectRootDir, parentID, cb);
}

async function onUpdateEnv(socket, projectRootDir, ID, newEnv, parentID, cb) {
  return generalHandler(socket, replaceEnv.bind(null, projectRootDir, ID, newEnv), "updateEnv", projectRootDir, parentID, cb);
}
async function onUpdateStepNumber(socket, projectRootDir, cb) {
  return generalHandler(socket, updateStepNumber.bind(null, projectRootDir), "updateStepNumber", projectRootDir, cb);
}


async function onGetEnv(socket, projectRootDir, ID, cb) {
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
  onRemoveFileLink,
  onUpdateEnv,
  onUpdateStepNumber,
  onGetEnv
};
