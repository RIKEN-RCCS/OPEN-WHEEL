/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import path from "path";
import klaw from "klaw";

import { getThreeGenerationFamily } from "../core/workflowUtil.js";
import { getLogger } from "../logSettings.js";
import { getComponentTree } from "../core/componentOperations.js";
import { projectJsonFilename, componentJsonFilename } from "../db/db.js";
import { readJsonGreedy } from "../core/fileUtils.js";
import { taskStateFilter } from "../core/taskUtil.js";
import { setParentDir, getParentDirs } from "../core/global.js";
import { emitAll } from "./commUtils.js";
export const _internal = {
  getThreeGenerationFamily,
  emitAll
};

/**
 * read and send workflow (component and its child and grandson)
 *
 * if clientID is specified, send parentComponentDir only to the client and record it as the
 * client's displayed dir. Otherwise, send every dir displayed by any client of the project
 * (plus parentComponentDir if specified) to all clients of the project. Each client
 * displays only the workflow it is showing, so clients can show different levels at once.
 * @param {((result: (boolean|Error)) => void)|null} cb - called with true on success or with the error
 * @param {string} projectRootDir - project's root path
 * @param {string} parentComponentDir - component dir to be sent ("" means not specified)
 * @param {string|null} clientID - socket.io client ID of the requester
 */
export async function sendWorkflow(cb, projectRootDir, parentComponentDir = "", clientID = null) {
  if (typeof projectRootDir !== "string") {
    getLogger(projectRootDir).error("sendWorkflow called without projectRootDir!!");
  }
  const target = parentComponentDir
    ? path.isAbsolute(parentComponentDir) ? parentComponentDir : path.resolve(projectRootDir, parentComponentDir)
    : null;
  try {
    if (clientID) {
      const dir = target || projectRootDir;
      const wf = await _internal.getThreeGenerationFamily(projectRootDir, dir);
      if (wf) {
        setParentDir(projectRootDir, clientID, dir);
        await _internal.emitAll(clientID, "workflow", wf);
      }
    } else {
      if (target) {
        const wf = await _internal.getThreeGenerationFamily(projectRootDir, target);
        if (wf) {
          await _internal.emitAll(projectRootDir, "workflow", wf);
        }
      }
      const displayed = getParentDirs(projectRootDir).filter((dir)=>{
        return dir !== target;
      });
      if (!target && displayed.length === 0) {
        displayed.push(projectRootDir);
      }
      for (const dir of displayed) {
        try {
          const wf = await _internal.getThreeGenerationFamily(projectRootDir, dir);
          if (wf) {
            await _internal.emitAll(projectRootDir, "workflow", wf);
          }
        } catch (e) {
          //displayed dir may be already removed or renamed by other client
          getLogger(projectRootDir).debug("send workflow failed", dir, e);
        }
      }
    }
  } catch (e) {
    if (typeof cb !== "function") {
      throw e;
    }
    cb(e);
    return;
  }
  if (typeof cb === "function") {
    cb(true);
  }
}
export async function sendComponentTree(projectRootDir, rootDir) {
  try {
    const targetDir = path.isAbsolute(rootDir) ? rootDir : path.resolve(projectRootDir, rootDir);
    const rt = await getComponentTree(projectRootDir, targetDir);
    await emitAll(projectRootDir, "componentTree", rt);
  } catch (err) {
    if (err.code === "ENOENT") {
      getLogger(projectRootDir).error(err);
    }
  }
}
//read and send projectJson
export async function sendProjectJson(projectRootDir, argProjectJson) {
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
export async function sendTaskStateList(projectRootDir) {
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
export async function sendResultsFileDir(projectRootDir, dir) {
  await emitAll(projectRootDir, "resultFilesReady", dir);
}
