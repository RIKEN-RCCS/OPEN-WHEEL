/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path = require("path");
const fs = require("fs-extra");
const { createHash } = require("crypto");
const { getLogger } = require("../logSettings.js");

/**
 * determine tmp directory root
 * @returns {string} - absolute path of tmp directory root
 */
function getTempdRoot() {
  if (typeof process.env.WHEEL_TEMPD === "string") {
    try {
      const rt = fs.ensureDirSync(process.env.WHEEL_TEMPD);
      if (typeof rt === "undefined") {
        return path.resolve(process.env.WHEEL_TEMPD);
      }
    } catch (e) {
      if (e.code === "EEXIST") {
        return path.resolve(process.env.WHEEL_TEMPD);
      }
    }
  }
  const stats = fs.statSync("/tmp");
  if (stats.isDirectory()) {
    return "/tmp";
  }
  return path.dirname(__dirname);
}

const tempdRoot = getTempdRoot(); //must be executed only when this file requred first time

/**
 * create temporary directory
 * @param {string | null} projectRootDir - project's root path or null for untied temporary directory
 * @param {string} prefix - purpose for the temp dir (ex. viewer, download)
 * @returns {object} - dir: absolute path of temp dir, root: parent dir path of temp dir
 */
async function createTempd(projectRootDir, prefix) {
  const root = path.resolve(tempdRoot, prefix);
  const hash = createHash("sha256");
  const ID = hash.update(projectRootDir || "wheel_tmp").digest("hex");
  const dir = path.join(root, ID);
  await fs.emptyDir(dir);
  getLogger(projectRootDir).debug(`create temporary directory ${dir}`);
  return { dir, root };
}

/**
 * remote temporary directory
 * @param {string | null} projectRootDir - project's root path or null for untied temporary directory
 * @param {string} prefix - purpose for the temp dir (ex. viewer, download)
 * @returns {Promise} - resolved after directory is removed
 */
async function removeTempd(projectRootDir, prefix) {
  const hash = createHash("sha256");
  const ID = hash.update(projectRootDir || "wheel_tmp").digest("hex");
  const dir = path.resolve(tempdRoot, prefix, ID);
  getLogger(projectRootDir).debug(`remove temporary directory ${dir}`);
  return fs.remove(dir);
}

/**
 * re-calcurate existing temporaly directory path
 * @param {string | null} projectRootDir - project's root path or null for untied temporary directory
 * @param {string} prefix - purpose for the temp dir (ex. viewer, download)
 * @returns {string} - absolute path of temporary directory
 */
async function getTempd(projectRootDir, prefix) {
  const hash = createHash("sha256");
  const ID = hash.update(projectRootDir || "wheel_tmp").digest("hex");
  return path.resolve(tempdRoot, prefix, ID);
}

module.exports = {
  tempdRoot,
  createTempd,
  removeTempd,
  getTempd
};
