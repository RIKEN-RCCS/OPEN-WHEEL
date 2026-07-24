/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import SBS from "simple-batch-system";
import { getLogger } from "../logSettings.js";
import {
  addInputFile,
  addOutputFile,
  removeInputFile,
  removeOutputFile,
  renameInputFile,
  renameOutputFile,
  toggleInputFileMandatory,
  toggleOutputFileForceCopy
} from "../core/componentFiles.js";
import {
  addLink,
  addFileLink,
  removeLink,
  removeAllLink,
  removeFileLink,
  removeAllFileLink
} from "../core/componentLinks.js";
import {
  removeComponent,
  createNewComponent,
  pasteComponent
} from "../core/componentOperations.js";
import {
  getEnv,
  replaceEnv
} from "../core/environmentVariables.js";
import { replaceWebhook } from "../core/webhook.js";
import { getProjectJson } from "../core/projectJsonFileOperator.js";
import { getComponentDir } from "../core/componentJsonIO.js";
import { sendWorkflow, sendProjectJson, sendComponentTree } from "./senders.js";
import { convertPathSep } from "../core/pathUtils.js";
import { updateComponent, updateComponentPos } from "../core/updateComponent.js";
import { flushPendingSaves } from "./rapid.js";

/**@type {Map<string, SBS>} */
const projectEditQueues = new Map();

/**
 * Get or create the SBS edit queue for a project.
 * @param {string} projectRootDir - unique key identifying the project
 * @returns {SBS} the SBS instance for this project
 */
function getProjectEditQueue(projectRootDir) {
  if (!projectEditQueues.has(projectRootDir)) {
    projectEditQueues.set(projectRootDir, new SBS({ maxConcurrent: 1, name: `projectEdit:${projectRootDir}` }));
  }
  return projectEditQueues.get(projectRootDir);
}

/**
 * Enqueue an async operation for a project, ensuring serial execution per project.
 * This prevents concurrent read-modify-write races on component JSON files.
 * @param {string} projectRootDir - unique key identifying the project
 * @param {function(): Promise<void>} fn - async function to execute in the queue
 * @returns {Promise} resolves or rejects with the result of fn
 */
function enqueueProjectOperation(projectRootDir, fn) {
  return getProjectEditQueue(projectRootDir).qsubAndWait({ exec: fn });
}
export { enqueueProjectOperation };

/**
 * Stop accepting new edit operations and wait for any in-flight operation to
 * complete.  Call startProjectEdits() when done to re-enable edits.
 * Intended for the validation phase of runProject so that validateComponents
 * reads component JSON only after all pending writes are flushed to disk.
 * @param {string} projectRootDir - project's root directory
 * @returns {Promise<void>} resolves once all in-flight operations have finished
 */
export async function stopProjectEdits(projectRootDir) {
  const queue = getProjectEditQueue(projectRootDir);
  //Submit a no-op sentinel to the END of the serial queue (maxConcurrent:1).
  //It can only run after ALL preceding edit ops complete, so awaiting it
  //guarantees all pending writes are flushed before validateComponents reads them.
  await queue.qsubAndWait({ exec: async ()=>{} }).catch(()=>{});
  queue.stop();
  //the in-app text editor's saveFile is debounced independently of this queue (see
  //rapid.js#onSaveFile), so a save that is still pending when the project starts would
  //otherwise be missed by the auto-commit taken right after this call returns
  await flushPendingSaves(projectRootDir);
}

/**
 * Re-enable edit operations after a stopProjectEdits() call.
 * @param {string} projectRootDir - project's root directory
 */
export function startProjectEdits(projectRootDir) {
  getProjectEditQueue(projectRootDir).start();
}

/**
 * Remove all waiting edit operations and wait for any in-flight operation to
 * complete.  Intended for cleanProject, which resets files to git HEAD — any
 * stale writes queued before the clean must not execute afterwards.
 * Call startProjectEdits() afterwards to re-enable edits.
 * @param {string} projectRootDir - project's root directory
 * @returns {Promise<void>} resolves once all in-flight operations have finished
 */
export async function clearProjectEdits(projectRootDir) {
  const queue = getProjectEditQueue(projectRootDir);
  queue.stop();
  const runningIds = queue.getRunning();
  queue.clear();
  await Promise.all(runningIds.map((id)=>{
    return queue.qwait(id).catch(()=>{});
  }));
}

async function generalHandler(func, funcname, projectRootDir, parentID, needSendProjectJson, cb) {
  return enqueueProjectOperation(projectRootDir, async ()=>{
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
    }
  });
}
export async function onAddInputFile(projectRootDir, ID, name, parentID, cb) {
  return generalHandler(addInputFile.bind(null, projectRootDir, ID, name), "addInputFile", projectRootDir, parentID, cb);
}

export async function onAddOutputFile(projectRootDir, ID, name, parentID, cb) {
  return generalHandler(addOutputFile.bind(null, projectRootDir, ID, name), "addOutputFile", projectRootDir, parentID, cb);
}

export async function onRemoveInputFile(projectRootDir, ID, name, parentID, cb) {
  return generalHandler(removeInputFile.bind(null, projectRootDir, ID, name), "removeInputFile", projectRootDir, parentID, cb);
}

export async function onRemoveOutputFile(projectRootDir, ID, name, parentID, cb) {
  return generalHandler(removeOutputFile.bind(null, projectRootDir, ID, name), "removeOutputFile", projectRootDir, parentID, cb);
}

export async function onRenameInputFile(projectRootDir, ID, index, newName, parentID, cb) {
  return generalHandler(renameInputFile.bind(null, projectRootDir, ID, index, newName), "renameInputFile", projectRootDir, parentID, cb);
}

export async function onToggleInputFileMandatory(projectRootDir, ID, index, mandatory, parentID, cb) {
  return generalHandler(toggleInputFileMandatory.bind(null, projectRootDir, ID, index, mandatory), "toggleInputFileMandatory", projectRootDir, parentID, cb);
}

export async function onToggleOutputFileForceCopy(projectRootDir, ID, srcName, dstNode, dstName, forceCopy, parentID, cb) {
  return generalHandler(toggleOutputFileForceCopy.bind(null, projectRootDir, ID, srcName, dstNode, dstName, forceCopy), "toggleOutputFileForceCopy", projectRootDir, parentID, cb);
}

export async function onRenameOutputFile(projectRootDir, ID, index, newName, parentID, cb) {
  return generalHandler(renameOutputFile.bind(null, projectRootDir, ID, index, newName), "renameOutputFile", projectRootDir, parentID, cb);
}
export async function onUpdateComponent(projectRootDir, ID, updated, parentID, cb) {
  return generalHandler(updateComponent.bind(null, projectRootDir, ID, updated), "updateComponent", projectRootDir, parentID, false, cb);
}
export async function onUpdateComponentPos(projectRootDir, ID, pos, parentID, cb) {
  return generalHandler(updateComponentPos.bind(null, projectRootDir, ID, pos), "updateComponentPos", projectRootDir, parentID, false, cb);
}
export async function onCreateNode(projectRootDir, request, parentID, cb) {
  return generalHandler(createNewComponent.bind(null, projectRootDir, convertPathSep(request.path), request.type, request.pos), "createNewComponent", projectRootDir, parentID, true, cb);
}
export async function onRemoveNode(projectRootDir, ID, parentID, cb) {
  return generalHandler(removeComponent.bind(null, projectRootDir, ID), "removeComponent", projectRootDir, parentID, true, cb);
}
export async function onAddLink(projectRootDir, src, dst, isElse, parentID, cb) {
  return generalHandler(addLink.bind(null, projectRootDir, src, dst, isElse), "addLink", projectRootDir, parentID, false, cb);
}
export async function onRemoveLink(projectRootDir, src, dst, isElse, parentID, cb) {
  return generalHandler(removeLink.bind(null, projectRootDir, src, dst, isElse), "removeLink", projectRootDir, parentID, false, cb);
}
export async function onRemoveAllLink(projectRootDir, componentID, parentID, cb) {
  return generalHandler(removeAllLink.bind(null, projectRootDir, componentID), "removeAllLink", projectRootDir, parentID, false, cb);
}
export async function onAddFileLink(projectRootDir, srcNode, srcName, dstNode, dstName, parentID, cb) {
  return generalHandler(addFileLink.bind(null, projectRootDir, srcNode, srcName, dstNode, dstName), "addFileLink", projectRootDir, parentID, false, cb);
}
export async function onRemoveFileLink(projectRootDir, srcNode, srcName, dstNode, dstName, parentID, cb) {
  return generalHandler(removeFileLink.bind(null, projectRootDir, srcNode, srcName, dstNode, dstName), "removeFileLink", projectRootDir, parentID, false, cb);
}
export async function onRemoveAllFileLink(projectRootDir, componentID, inputFileName, fromChildren, parentID, cb) {
  return generalHandler(removeAllFileLink.bind(null, projectRootDir, componentID, inputFileName, fromChildren), "removeFileLink", projectRootDir, parentID, false, cb);
}
export async function onUpdateEnv(projectRootDir, ID, newEnv, parentID, cb) {
  return generalHandler(replaceEnv.bind(null, projectRootDir, ID, newEnv), "updateEnv", projectRootDir, parentID, true, cb);
}
export async function onGetEnv(projectRootDir, ID, cb) {
  try {
    const env = await getEnv(projectRootDir, ID);
    return cb(env);
  } catch (e) {
    getLogger(projectRootDir).error("getEnv failed", e);
    return cb(e);
  }
}

export async function onUpdateWebhook(projectRootDir, webhook, parentID, cb) {
  return generalHandler(replaceWebhook.bind(null, projectRootDir, webhook), "updateWebhook", projectRootDir, parentID, true, cb);
}
export async function onGetWebhook(projectRootDir, ID, cb) {
  try {
    const { webhook } = await getProjectJson(projectRootDir);
    return cb(webhook);
  } catch (e) {
    getLogger(projectRootDir).error("get webhook failed", e);
    return cb(e);
  }
}

export async function onPasteComponent(projectRootDir, copyInfo, targetParentID, pos, cb) {
  return generalHandler(pasteComponent.bind(null, projectRootDir, copyInfo, targetParentID, pos), "pasteComponent", projectRootDir, targetParentID, true, cb);
}
