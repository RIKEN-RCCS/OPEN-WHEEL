/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const { getLogger } = require("../logSettings");
const { exportProject } = require("../core/exportProject.js");
const { importProject } = require("../core/importProject.js");

async function onImportProject(clientID, target, parentDir, isURL, cb) {
  if (isURL) {
    console.log("not implemented now", target);
    return cb("DEBUG 1");
  }
  try {
    const projectRootDir = await importProject(clientID, target, parentDir);
    cb(projectRootDir);
  } catch (e) {
    getLogger("default").error(`${e.message} : ${parentDir}`);
    cb(e);
  }
}

async function onExportProject(projectRootDir, name, mail, memo, cb) {
  const url = await exportProject(projectRootDir, name, mail, memo);
  cb(url);
}

module.exports = {
  onImportProject,
  onExportProject
};
