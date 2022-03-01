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
  cleanComponent,
  removeComponent,
  createNewComponent,
  updateComponent,
  updateStepNumber,
  getComponentTree
} = require("../core/componentFilesOperator.js");
const { getChildren, getParentDir, getComponent } = require("../core/workflowUtil.js");
const { hasChild } = require("../core/workflowComponent.js");
const { componentJsonFilename } = require("../db/db.js");

/**
 * send workflow data to client
 * @param {Object} socket - socket instance
 * @param {string} projectRootDir -
 * @param {string} ID - component's ID which to must be included as child
 */
async function sendWorkflow(socket, projectRootDir, ID) {
  const parentDir = ID ? getParentDir(ID) : projectRootDir;
  const wf = await getComponent(projectRootDir, path.resolve(parentDir, componentJsonFilename));
  const rt = Object.assign({}, wf);
  rt.descendants = await getChildren(projectRootDir, wf.ID);

  for (const child of rt.descendants) {
    if (child.handler) {
      delete child.handler;
    }

    if (hasChild(child)) {
      const grandson = await getChildren(projectRootDir, child.ID);
      child.descendants = grandson.map((e)=>{
        if (e.type === "task") {
          return { type: e.type, pos: e.pos, host: e.host, useJobScheduler: e.useJobScheduler };
        }
        return { type: e.type, pos: e.pos };
      });
    }
  }
  socket.emit("workflow", rt);
}

async function generalHandler(socket, func, funcname, projectRootDir, cb) {
  try {
    await func();
    await sendWorkflow(socket, projectRootDir);
  } catch (e) {
    getLogger(projectRootDir).error(`${funcname} failed`, e);
    cb(false);
    return;
  }
  cb(true);
}

async function onAddInputFile(socket, projectRootDir, ID, name, cb) {
  return generalHandler(socket, addInputFile.bind(null, projectRootDir, ID, name), "addInputFile", projectRootDir, cb);
}

async function onAddOutputFile(socket, projectRootDir, ID, name, cb) {
  return generalHandler(socket, addOutputFile.bind(null, projectRootDir, ID, name), "addOutputFile", projectRootDir, cb);
}

async function onRemoveInputFile(socket, projectRootDir, ID, name, cb) {
  return generalHandler(socket, removeInputFile.bind(null, projectRootDir, ID, name), "removeInputFile", projectRootDir, cb);
}

async function onRemoveOutputFile(socket, projectRootDir, ID, name, cb) {
  return generalHandler(socket, removeOutputFile.bind(null, projectRootDir, ID, name), "removeOutputFile", projectRootDir, cb);
}

async function onRenameInputFile(socket, projectRootDir, ID, index, newName, cb) {
  return generalHandler(socket, renameInputFile.bind(null, projectRootDir, ID, index, newName), "renameInputFile", projectRootDir, cb);
}

async function onRenameOutputFile(socket, projectRootDir, ID, index, newName, cb) {
  return generalHandler(socket, renameOutputFile.bind(null, projectRootDir, ID, index, newName), "renameOutputFile", projectRootDir, cb);
}


module.exports = {
  onAddInputFile,
  onAddOutputFile,
  onRenameInputFile,
  onRenameOutputFile,
  onRemoveInputFile,
  onRemoveOutputFile
};
