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
  updateComponent
} = require("../core/componentFilesOperator.js");
const { getParentDir } = require("../core/workflowUtil.js");
const { sendWorkflow, sendProjectJson, sendComponentTree } = require("./senders.js");
const { projectJsonFilename } = require("../db/db");
const { readJsonGreedy } = require("../core/fileUtils");
const { convertPathSep } = require("../core/pathUtils");

async function generalHandler(socket, func, funcname, projectRootDir, cb, ID) {
  try {
    await func();
  } catch (e) {
    //getLogger(projectRootDir).error(`${funcname} failed`, e);
    getLogger().error(`${funcname} failed`, e);
    cb(e);
    return;
  }
  const parentDir = ID ? await getParentDir(ID) : projectRootDir;
  await sendWorkflow(socket, cb, projectRootDir, parentDir);
}


async function onAddInputFile(socket, projectRootDir, ID, name, cb) {
  return generalHandler(socket, addInputFile.bind(null, projectRootDir, ID, name), "addInputFile", projectRootDir, cb, ID);
}

async function onAddOutputFile(socket, projectRootDir, ID, name, cb) {
  return generalHandler(socket, addOutputFile.bind(null, projectRootDir, ID, name), "addOutputFile", projectRootDir, cb, ID);
}

async function onRemoveInputFile(socket, projectRootDir, ID, name, cb) {
  return generalHandler(socket, removeInputFile.bind(null, projectRootDir, ID, name), "removeInputFile", projectRootDir, cb, ID);
}

async function onRemoveOutputFile(socket, projectRootDir, ID, name, cb) {
  return generalHandler(socket, removeOutputFile.bind(null, projectRootDir, ID, name), "removeOutputFile", projectRootDir, cb, ID);
}

async function onRenameInputFile(socket, projectRootDir, ID, index, newName, cb) {
  return generalHandler(socket, renameInputFile.bind(null, projectRootDir, ID, index, newName), "renameInputFile", projectRootDir, cb);
}

async function onRenameOutputFile(socket, projectRootDir, ID, index, newName, cb) {
  return generalHandler(socket, renameOutputFile.bind(null, projectRootDir, ID, index, newName), "renameOutputFile", projectRootDir, cb);
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

async function onCreateNode(socket, projectRootDir, request, cb) {
  await generalHandler(socket, createNewComponent.bind(null, projectRootDir, convertPathSep(request.path), request.type, request.pos), "createNewComponent", projectRootDir, cb);
  await sendProjectJson(socket, projectRootDir);
  return sendComponentTree(socket, projectRootDir, projectRootDir);
}

async function onRemoveNode(socket, projectRootDir, targetID, cb) {
  await generalHandler(socket, removeComponent.bind(null, projectRootDir, targetID), "removeComponent", projectRootDir, cb);
  await sendProjectJson(socket, projectRootDir);
  return sendComponentTree(socket, projectRootDir, projectRootDir);
}


async function onAddLink(socket, projectRootDir, msg, cb) {
  return generalHandler(socket, addLink.bind(null, projectRootDir, msg.src, msg.dst, msg.isElse), "addLink", projectRootDir, cb);
}

async function onRemoveLink(socket, projectRootDir, msg, cb) {
  return generalHandler(socket, removeLink.bind(null, projectRootDir, msg.src, msg.dst, msg.isElse), "removeLink", projectRootDir, cb);
}

async function onAddFileLink(socket, projectRootDir, srcNode, srcName, dstNode, dstName, cb) {
  return generalHandler(socket, addFileLink.bind(null, projectRootDir, srcNode, srcName, dstNode, dstName), "addFileLink", projectRootDir, cb);
}
async function onRemoveFileLink(socket, projectRootDir, srcNode, srcName, dstNode, dstName, cb) {
  return generalHandler(socket, removeFileLink.bind(null, projectRootDir, srcNode, srcName, dstNode, dstName), "removeFileLink", projectRootDir, cb);
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
  onRemoveFileLink
};
