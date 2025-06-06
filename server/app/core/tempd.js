/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path = require("path");
const fs = require("fs-extra");
const { createHash } = require("crypto");
const tempdRoot = process.env.WHEEL_TEMPD || path.dirname(__dirname);
const { getLogger } = require("../logSettings.js");

/**
 * create temporary directory
 * @param {string} projectRootDir - project's root path
 * @param {string} prefix - purpose for the temp dir (ex. viewer, download)
 * @returns {object} - dir: absolute path of temp dir, root: parent dir path of temp dir
 */
async function createTempd(projectRootDir, prefix) {
  const root = path.resolve(tempdRoot, prefix);
  const hash = createHash("sha256");
  const ID = hash.update(projectRootDir).digest("hex");
  const dir = path.join(root, ID);
  await fs.emptyDir(dir);
  getLogger(projectRootDir).debug(`create temporary directory ${dir}`);
  return { dir, root };
}

/**
 * remote temporary directory
 * @param {string} projectRootDir - project's root path
 * @param {string} prefix - purpose for the temp dir (ex. viewer, download)
 * @returns {Promise} - resolved after directory is removed
 */
async function removeTempd(projectRootDir, prefix) {
  const hash = createHash("sha256");
  const ID = hash.update(projectRootDir).digest("hex");
  const dir = path.resolve(tempdRoot, prefix, ID);
  getLogger(projectRootDir).debug(`remove temporary directory ${dir}`);
  return fs.remove(dir);
}

/**
 * re-calcurate existing temporaly directory path
 * @param {string} projectRootDir - project's root path
 * @param {string} prefix - purpose for the temp dir (ex. viewer, download)
 * @returns {string} - absolute path of temporary directory
 */
async function getTempd(projectRootDir, prefix) {
  const hash = createHash("sha256");
  const ID = hash.update(projectRootDir).digest("hex");
  return path.resolve(tempdRoot, prefix, ID);
}

module.exports = {
  tempdRoot,
  createTempd,
  removeTempd,
  getTempd
};
