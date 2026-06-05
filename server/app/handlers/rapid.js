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
    content,
    callbacks: saveFileTimers.has(fileKey) ? [...saveFileTimers.get(fileKey).callbacks, cb] : [cb],
    timer: null
  };

  //Set new timer
  pendingSave.timer = setTimeout(async ()=>{
    try {
      await saveFile(absPath, pendingSave.content);
      //Call all pending callbacks with success
      pendingSave.callbacks.forEach((callback)=>{
        return callback(true);
      });
    } catch (err) {
      getLogger(projectRootDir).warn(projectRootDir, "saveFile event failed", err);
      //Call all pending callbacks with error
      pendingSave.callbacks.forEach((callback)=>{
        return callback(err);
      });
    } finally {
      saveFileTimers.delete(fileKey);
    }
  }, SAVE_FILE_DEBOUNCE_MS);

  saveFileTimers.set(fileKey, pendingSave);
};
