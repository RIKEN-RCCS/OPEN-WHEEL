/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
import { getLogger } from "../logSettings.js";
import { exportComponent } from "../core/exportComponent.js";
import { importComponent } from "../core/importComponent.js";

/**
 * handle exportComponent request
 * @param {string} projectRootDir - project's root path
 * @param {string} componentID - component ID to export
 * @param {Function} cb - callback function
 */
async function onExportComponent(projectRootDir, componentID, cb) {
  try {
    const url = await exportComponent(projectRootDir, componentID);
    cb(url);
  } catch (e) {
    getLogger(projectRootDir).error("export component failed", e);
    cb(e);
  }
}

/**
 * handle importComponent request
 * @param {string} archiveFile - path to uploaded archive file
 * @param {string} projectRootDir - project's root path
 * @param {string} targetParentID - parent component ID where to import
 * @param {Function} cb - callback function
 */
async function onImportComponent(archiveFile, projectRootDir, targetParentID, cb) {
  try {
    const newComponentID = await importComponent(projectRootDir, archiveFile, targetParentID);
    cb(newComponentID);
  } catch (e) {
    getLogger(projectRootDir).error("import component failed", e);
    cb(e);
  }
}

export {
  onExportComponent,
  onImportComponent
};
