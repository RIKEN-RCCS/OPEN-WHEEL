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
  getEnv,
  replaceEnv
} = require("../core/projectFilesOperator.js");
const { getComponentDir } = require("../core/projectFilesOperator.js");
const { sendWorkflow, sendProjectJson, sendComponentTree } = require("./senders.js");
const { projectJsonFilename } = require("../db/db");
const { readJsonGreedy } = require("../core/fileUtils");
const { convertPathSep } = require("../core/pathUtils");
const { updateComponent, updateComponentPos} = require("../core/updateComponent.js");


async function generalHandler(func, funcname, projectRootDir, parentID, needSendProjectJson, cb) {
  try {
    const rt = await func();
    const parentDir = await getComponentDir(projectRootDir, parentID, true);
    await sendWorkflow(cb, projectRootDir, parentDir);

    if(rt === true || needSendProjectJson){
      await sendProjectJson(projectRootDir);
      await sendComponentTree(projectRootDir, projectRootDir);
    }
  } catch (e) {
    getLogger(projectRootDir).error(`${funcname} failed`, e);
    cb(e);
    return;
  }
}


async function onAddInputFile(projectRootDir, ID, name, parentID, cb) {
  return generalHandler(addInputFile.bind(null, projectRootDir, ID, name), "addInputFile", projectRootDir, parentID, false, cb);
}

async function onAddOutputFile(projectRootDir, ID, name, parentID, cb) {
  return generalHandler(addOutputFile.bind(null, projectRootDir, ID, name), "addOutputFile", projectRootDir, parentID, false, cb);
}

async function onRemoveInputFile(projectRootDir, ID, name, parentID, cb) {
  return generalHandler(removeInputFile.bind(null, projectRootDir, ID, name), "removeInputFile", projectRootDir, parentID, false, cb);
}

async function onRemoveOutputFile(projectRootDir, ID, name, parentID, cb) {
  return generalHandler(removeOutputFile.bind(null, projectRootDir, ID, name), "removeOutputFile", projectRootDir, parentID, false, cb);
}

async function onRenameInputFile(projectRootDir, ID, index, newName, parentID, cb) {
  return generalHandler(renameInputFile.bind(null, projectRootDir, ID, index, newName), "renameInputFile", projectRootDir, parentID, false, cb);
}

async function onRenameOutputFile(projectRootDir, ID, index, newName, parentID, cb) {
  return generalHandler(renameOutputFile.bind(null, projectRootDir, ID, index, newName), "renameOutputFile", projectRootDir, parentID, false, cb);
}

async function onUpdateComponent(projectRootDir, ID, updated, parentID, cb){
  return generalHandler(updateComponent.bind(null, projectRootDir, ID, updated), "updateComponent", projectRootDir, parentID, false, cb);
}

async function onUpdatePos(projectRootDir, ID, pos, parentID, cb){
  return generalHandler(updateComponentPos.bind(null, projectRootDir, ID, pos ), "updateComponent", projectRootDir, parentID, false, cb);
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
  return generalHandler(createNewComponent.bind(null, projectRootDir, convertPathSep(request.path), request.type, request.pos), "createNewComponent", projectRootDir, parentID, true, cb);
}

async function onRemoveNode(projectRootDir, ID, parentID, cb) {
  return generalHandler(removeComponent.bind(null, projectRootDir, ID), "removeComponent", projectRootDir, parentID, true, cb);
}


async function onAddLink(projectRootDir, src, dst, isElse, parentID, cb) {
  return generalHandler(addLink.bind(null, projectRootDir, src, dst, isElse), "addLink", projectRootDir, parentID, false, cb);
}

async function onRemoveLink(projectRootDir, src, dst, isElse, parentID, cb) {
  return generalHandler(removeLink.bind(null, projectRootDir, src, dst, isElse), "removeLink", projectRootDir, parentID, false, cb);
}

async function onRemoveAllLink(projectRootDir, componentID, parentID, cb) {
  return generalHandler(removeAllLink.bind(null, projectRootDir, componentID), "removeAllLink", projectRootDir, parentID, false, cb);
}

async function onAddFileLink(projectRootDir, srcNode, srcName, dstNode, dstName, parentID, cb) {
  return generalHandler(addFileLink.bind(null, projectRootDir, srcNode, srcName, dstNode, dstName), "addFileLink", projectRootDir, parentID, false, cb);
}
async function onRemoveFileLink(projectRootDir, srcNode, srcName, dstNode, dstName, parentID, cb) {
  return generalHandler(removeFileLink.bind(null, projectRootDir, srcNode, srcName, dstNode, dstName), "removeFileLink", projectRootDir, parentID, false, cb);
}

async function onRemoveAllFileLink(projectRootDir, componentID, inputFileName, fromChildren, parentID, cb) {
  return generalHandler(removeAllFileLink.bind(null, projectRootDir, componentID, inputFileName, fromChildren), "removeFileLink", projectRootDir, parentID, false, cb);
}

async function onUpdateEnv(projectRootDir, ID, newEnv, parentID, cb) {
  return generalHandler(replaceEnv.bind(null, projectRootDir, ID, newEnv), "updateEnv", projectRootDir, true, cb);
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
  onUpdateComponent,
  onUpdatePos,
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
