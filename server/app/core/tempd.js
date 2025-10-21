/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs-extra";
import { createHash } from "crypto";
import { getLogger } from "../logSettings.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const _internal = {
  getLogger,
  tempdRoot: null
};

/**
 * determine tmp directory root
 * @returns {string} - absolute path of tmp directory root
 */
export function getTempdRoot() {
  const fallback = path.dirname(__dirname);
  const candidates = [];
  if (typeof process.env.WHEEL_TEMPD === "string") {
    candidates.push(path.resolve(process.env.WHEEL_TEMPD));
  }
  candidates.push("/tmp/wheel");

  for (const candidate of candidates) {
    try {
      const rt = fs.ensureDirSync(candidate);
      if (typeof rt === "undefined" || rt === candidate) {
        return candidate;
      }
    } catch (e) {
      if (e.code === "EEXIST") {
        return candidate;
      }
      _internal.getLogger().debug(`create ${candidate} failed due to ${e}`);
    }
  }
  return fallback;
}

_internal.tempdRoot = getTempdRoot(); //must be executed only when this file requred first time
export const tempdRoot = _internal.tempdRoot;

/**
 * create temporary directory
 * @param {string | null} projectRootDir - project's root path or null for untied temporary directory
 * @param {string} prefix - purpose for the temp dir (ex. viewer, download)
 * @returns {object} - dir: absolute path of temp dir, root: parent dir path of temp dir
 */
export async function createTempd(projectRootDir, prefix) {
  const root = path.resolve(_internal.tempdRoot, prefix);
  const hash = createHash("sha256");
  const ID = hash.update(projectRootDir || "wheel_tmp").digest("hex");
  const dir = path.join(root, ID);
  await fs.emptyDir(dir);
  _internal.getLogger(projectRootDir).debug(`create temporary directory ${dir}`);
  return { dir, root };
}

/**
 * remote temporary directory
 * @param {string | null} projectRootDir - project's root path or null for untied temporary directory
 * @param {string} prefix - purpose for the temp dir (ex. viewer, download)
 * @returns {Promise} - resolved after directory is removed
 */
export async function removeTempd(projectRootDir, prefix) {
  const hash = createHash("sha256");
  const ID = hash.update(projectRootDir || "wheel_tmp").digest("hex");
  const dir = path.resolve(_internal.tempdRoot, prefix, ID);
  _internal.getLogger(projectRootDir).debug(`remove temporary directory ${dir}`);
  return fs.remove(dir);
}

/**
 * re-calcurate existing temporaly directory path
 * @param {string | null} projectRootDir - project's root path or null for untied temporary directory
 * @param {string} prefix - purpose for the temp dir (ex. viewer, download)
 * @returns {string} - absolute path of temporary directory
 */
export async function getTempd(projectRootDir, prefix) {
  const hash = createHash("sha256");
  const ID = hash.update(projectRootDir || "wheel_tmp").digest("hex");
  return path.resolve(_internal.tempdRoot, prefix, ID);
}