/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path = require("path");
const fs = require("fs");
const { filesJsonFilename } = require("../db/db");
const { readJsonGreedy } = require("../core/fileUtils");
const { watchers } = require("../core/global.js");
const { emitAll } = require("./commUtils.js");
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

module.exports = {
  onGetResultFiles
};
