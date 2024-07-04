/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const { getLogger } = require("../logSettings");
const {
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
const { convertPathSep } = require("../core/pathUtils");
const { updateComponent, updateComponentPos } = require("../core/updateComponent.js");
async function generalHandler(func, funcname, projectRootDir, parentID, needSendProjectJson, cb) {
  try {
    const rt = await func();
    const parentDir = await getComponentDir(projectRootDir, parentID, true);
    await sendWorkflow(cb, projectRootDir, parentDir);
    if (rt === true || needSendProjectJson) {
      await sendProjectJson(projectRootDir);
      await sendComponentTree(projectRootDir, projectRootDir);
    }
  } catch (e) {
    getLogger(projectRootDir).error(`${funcname} failed`, e);
    cb(e);
    return;
  }
}
async function onUpdateComponent(projectRootDir, ID, updated, parentID, cb) {
  return generalHandler(updateComponent.bind(null, projectRootDir, ID, updated), "updateComponent", projectRootDir, parentID, false, cb);
}
async function onUpdateComponentPos(projectRootDir, ID, pos, parentID, cb) {
  console.log("DEBUG: ", projectRootDir, parentID);
  return generalHandler(updateComponentPos.bind(null, projectRootDir, ID, pos), "updateComponentPos", projectRootDir, parentID, false, cb);
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
  onUpdateComponent,
  onUpdateComponentPos,
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
