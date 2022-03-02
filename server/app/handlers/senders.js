/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License.txt in the project root for the license information.
 */
"use strict";
const path = require("path");
const { getThreeGenerationFamily } = require("../core/workflowUtil.js");
const { getLogger } = require("../logSettings");
const { getComponentTree } = require("../core/componentFilesOperator");
const { projectJsonFilename } = require("../db/db");
const { readJsonGreedy } = require("../core/fileUtils");

//read and send current workflow and its child and grandson
async function sendWorkflow(socket, cb, projectRootDir, parentComponentDir = "") {
//const logger = getLogger(projectRootDir);
  const logger = getLogger();

  if (typeof projectRootDir !== "string") {
    logger.error("sendWorkflow called without projectRootDir!!");
  }
  const target = !path.isAbsolute(parentComponentDir) ? path.resolve(projectRootDir, parentComponentDir) : parentComponentDir;


  try {
    const wf = await getThreeGenerationFamily(projectRootDir, target);

    if (wf) {
      socket.emit("workflow", wf);
    }
  } catch (e) {
    cb(e);
    return;
  }
  cb(true);
}

async function sendComponentTree(socket, projectRootDir, rootDir) {
  const targetDir = path.isAbsolute(rootDir) ? rootDir : path.resolve(projectRootDir, rootDir);
  const rt = await getComponentTree(projectRootDir, targetDir);
  socket.emit("componentTree", rt);
}

//read and send projectJson
async function sendProjectJson(socket, projectRootDir) {
  getLogger(projectRootDir).trace("projectState: sendProjectJson", projectRootDir);
  const filename = path.resolve(projectRootDir, projectJsonFilename);
  const projectJson = await readJsonGreedy(filename);
  getLogger(projectRootDir).trace("projectState: stat=", projectJson.state);
  socket.emit("projectJson", projectJson);
}

module.exports = {
  sendWorkflow,
  sendComponentTree,
  sendProjectJson
};
