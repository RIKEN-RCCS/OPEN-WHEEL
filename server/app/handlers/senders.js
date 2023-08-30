/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
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
const { parentDirs } = require("../core/global.js");
const { emitAll } = require("./commUtils.js");

//read and send current workflow and its child and grandson
async function sendWorkflow(cb, projectRootDir, parentComponentDir = "", clientID = null) {
  if (typeof projectRootDir !== "string") {
    getLogger(projectRootDir).error("sendWorkflow called without projectRootDir!!");
  }
  const target = path.isAbsolute(parentComponentDir) ? parentComponentDir : path.resolve(projectRootDir, parentComponentDir);

  try {
    const wf = await getThreeGenerationFamily(projectRootDir, target);

    if (wf) {
      parentDirs.set(projectRootDir, target);
      await emitAll(clientID ? clientID : projectRootDir, "workflow", wf);
    }
  } catch (e) {
    cb(e);
    return;
  }
  cb(true);
}

async function sendComponentTree(projectRootDir, rootDir) {
  const targetDir = path.isAbsolute(rootDir) ? rootDir : path.resolve(projectRootDir, rootDir);
  const rt = await getComponentTree(projectRootDir, targetDir);
  await emitAll(projectRootDir, "componentTree", rt);
}

//read and send projectJson
async function sendProjectJson(projectRootDir, argProjectJson) {
  getLogger(projectRootDir).trace("projectState: sendProjectJson", projectRootDir, argProjectJson);
  let projectJson = argProjectJson;
  if (!argProjectJson) {
    const filename = path.resolve(projectRootDir, projectJsonFilename);
    projectJson = await readJsonGreedy(filename);
  }
  getLogger(projectRootDir).trace("projectState: stat=", projectJson.state);
  await emitAll(projectRootDir, "projectJson", projectJson);
}

//recursive read component meta data and send task state tree data as list
async function sendTaskStateList(projectRootDir) {
  const p = [];
  klaw(projectRootDir)
    .on("data", (item)=>{
      if (!item.path.endsWith(componentJsonFilename)) {
        return;
      }
      p.push(readJsonGreedy(item.path));
    })
    .on("end", async ()=>{
      const jsonFiles = await Promise.all(p);
      const data = jsonFiles
        .filter((e)=>{
          return e.type === "task" && Object.prototype.hasOwnProperty.call(e, "ancestorsName");
        })
        .map(taskStateFilter);
      await emitAll(projectRootDir, "taskStateList", data);
    });
}

async function sendResultsFileDir(projectRootDir, dir) {
  await emitAll(projectRootDir, "resultFilesReady", dir);
}

module.exports = {
  sendWorkflow,
  sendComponentTree,
  sendProjectJson,
  sendTaskStateList,
  sendResultsFileDir
};
