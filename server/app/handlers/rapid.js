/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
import path from "path";
import { getLogger } from "../logSettings.js";
import { openFile, saveFile } from "../core/fileUtils.js";
import { emitAll } from "./commUtils.js";

//Server-side debounce for file write + git add operations
const saveFileTimers = new Map();
const SAVE_FILE_DEBOUNCE_MS = 10000; //10 seconds

export async function onOpenFile(clientID, projectRootDir, filename, forceNormal, cb) {
  try {
    const files = await openFile(projectRootDir, filename, forceNormal);
    const promise = [];
    for (const file of files) {
      if (file.isParameterSettingFile) {
        promise.push(emitAll(clientID, "parameterSettingFile", file));
      } else {
        promise.push(emitAll(clientID, "file", file));
      }
    }
    await Promise.all(promise);
  } catch (err) {
    getLogger(projectRootDir).warn(projectRootDir, "openFile event failed", err);
    return cb(err);
  }
  return cb(true);
};

export async function onSaveFile(projectRootDir, filename, dirname, content, cb) {
  const absPath = path.resolve(dirname, filename);
  const fileKey = `${projectRootDir}:${absPath}`;

  //Clear existing timer for this file
  if (saveFileTimers.has(fileKey)) {
    clearTimeout(saveFileTimers.get(fileKey).timer);
  }

  //Store pending save info
  const pendingSave = {
    projectRootDir,
    absPath,
    content,
    callbacks: saveFileTimers.has(fileKey) ? [...saveFileTimers.get(fileKey).callbacks, cb] : [cb],
    timer: null
  };

  //Set new timer
  pendingSave.timer = setTimeout(()=>{
    flushPendingSave(fileKey, pendingSave);
  }, SAVE_FILE_DEBOUNCE_MS);

  saveFileTimers.set(fileKey, pendingSave);
};

async function flushPendingSave(fileKey, pendingSave) {
  try {
    await saveFile(pendingSave.absPath, pendingSave.content);
    //Call all pending callbacks with success
    pendingSave.callbacks.forEach((callback)=>{
      return callback(true);
    });
  } catch (err) {
    getLogger(pendingSave.projectRootDir).warn(pendingSave.projectRootDir, "saveFile event failed", err);
    //Call all pending callbacks with error
    pendingSave.callbacks.forEach((callback)=>{
      return callback(err);
    });
  } finally {
    //only delete if this is still the pending save registered under fileKey
    //(a newer onSaveFile call may already have replaced it)
    if (saveFileTimers.get(fileKey) === pendingSave) {
      saveFileTimers.delete(fileKey);
    }
  }
}

/**
 * Immediately flush (write + git add) any debounced text-editor saves still pending
 * for the given project, instead of waiting for their debounce timer to fire.
 * Intended to be called before the pre-run auto-commit so recently-edited files are
 * not missed by the "auto saved: project starting/continuing" commit.
 * @param {string} projectRootDir - project's root path
 * @returns {Promise<void>} resolves once all pending saves for this project are flushed
 */
export async function flushPendingSaves(projectRootDir) {
  const prefix = `${projectRootDir}:`;
  const targets = [...saveFileTimers.entries()].filter(([fileKey])=>{
    return fileKey.startsWith(prefix);
  });
  await Promise.all(targets.map(([fileKey, pendingSave])=>{
    clearTimeout(pendingSave.timer);
    return flushPendingSave(fileKey, pendingSave);
  }));
}
