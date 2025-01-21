/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const { getLogger } = require("../logSettings");
const { exportProject } = require("../core/exportProject.js");
const { importProject, importProjectFromGitRepository } = require("../core/importProject.js");

async function onImportProject(clientID, target, parentDir, isURL, cb) {
  const importProjectFunc = isURL ? importProjectFromGitRepository : importProject;
  try {
    const projectRootDir = await importProjectFunc(clientID, target, parentDir);
    cb(projectRootDir);
  } catch (e) {
    if (e.reason !== "CANCELED") {
      getLogger("default").error(`${e.message}`);
    } else {
      getLogger("default").debug("user canceled importing project:", target);
    }
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
