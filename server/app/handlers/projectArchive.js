/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const { exportProject } = require("../core/exportProject.js");
const { importProject } = require("../core/importProject.js");

async function onImportProject(clientID, archiveFile, parentDir, isURL, cb) {
  if (isURL) {
    console.log("not implemented now");
  }
  try {
    const projectRootDir = await importProject(clientID, archiveFile, parentDir);
    cb(projectRootDir);
  } catch (e) {
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
