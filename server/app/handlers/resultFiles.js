/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
import path from "path";
import fs from "fs";
import { filesJsonFilename } from "../db/db.js";
import { readJsonGreedy } from "../core/fileUtils.js";
import { watchers } from "../core/global.js";
import { emitAll } from "./commUtils.js";

const onGetResultFiles = async (clientID, projectRootDir, dir, cb)=>{
  try {
    const filename = path.resolve(dir, filesJsonFilename);
    const fileJson = await readJsonGreedy(filename);
    emitAll(clientID, "resultFiles", fileJson);
    const watcher = fs.watch(filename, { persistent: false, signal: "TERM" }, async (event)=>{
      if (event !== "change") {
        return;
      }
      const fileJson2 = await readJsonGreedy(filename);
      emitAll(clientID, "resultFiles", fileJson2);
    });
    watchers.set(projectRootDir, watcher);
  } catch (e) {
    return cb(e);
  }
  return cb(true);
};

export {
  onGetResultFiles
};
