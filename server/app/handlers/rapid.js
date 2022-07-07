/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path = require("path");
const { getLogger } = require("../logSettings");
const { openFile, saveFile } = require("../core/fileUtils.js");
const { emitAll } = require("./commUtils.js");

const onOpenFile = async(clientID, projectRootDir, filename, forceNormal, cb)=>{
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

const onSaveFile = async(projectRootDir, filename, dirname, content, cb)=>{
  try {
    await saveFile(path.resolve(dirname, filename), content);
  } catch (err) {
    getLogger(projectRootDir).warn(projectRootDir, "saveFile event failed", err);
    return cb(err);
  }
  return cb(true);
};

module.exports = {
  onOpenFile,
  onSaveFile
};
