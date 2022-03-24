/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License.txt in the project root for the license information.
 */
"use strict";
const path = require("path");
const klaw = require("klaw");

const { getThreeGenerationFamily } = require("../core/workflowUtil.js");
const { getLogger } = require("../logSettings");
const { getComponentTree } = require("../core/componentFilesOperator");
const { projectJsonFilename, componentJsonFilename } = require("../db/db");
const { readJsonGreedy } = require("../core/fileUtils");
const { taskStateFilter } = require("../core/taskUtil");

//read and send current workflow and its child and grandson
async function sendWorkflow(socket, cb, projectRootDir, parentComponentDir = "") {
  if (typeof projectRootDir !== "string") {
    getLogger(projectRootDir).error("sendWorkflow called without projectRootDir!!");
  }
  const target = path.isAbsolute(parentComponentDir) ? parentComponentDir : path.resolve(projectRootDir, parentComponentDir);

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

//recursive read component meta data and send task state tree data as list
async function sendTaskStateList(socket, projectRootDir) {
  const p = [];
  klaw(projectRootDir)
    .on("data", (item)=>{
      if (!item.path.endsWith(componentJsonFilename)) {
        return;
      }
      p.push(readJsonGreedy(item.path));
    })
    .on("end", async()=>{
      const jsonFiles = await Promise.all(p);
      const data = jsonFiles
        .filter((e)=>{
          return e.type === "task" && Object.prototype.hasOwnProperty.call(e, "ancestorsName");
        })
        .map(taskStateFilter);
      await socket.emit("taskStatelist", data);
    });
}

module.exports = {
  sendWorkflow,
  sendComponentTree,
  sendProjectJson,
  sendTaskStateList
};
