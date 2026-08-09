/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import fs from "fs-extra";
import path from "path";
import { glob } from "glob";
import { jobManagerJsonFilename } from "../db/db.js";
import { getLogger } from "../logSettings.js";

const _internal = {
  fs,
  glob,
  getLogger
};

/**
 * check running jobs in project
 * @param {string} projectRootDir - project's root path
 * @returns {Promise<{tasks: Array, jmFiles: Array}>} - tasks and job manager files
 */
export async function checkRunningJobs(projectRootDir) {
  const tasks = [];
  const jmFiles = [];

  const candidates = await _internal.glob(`*.${jobManagerJsonFilename}`, { cwd: projectRootDir });
  for (const jmFile of candidates) {
    try {
      const taskInJmFile = await _internal.fs.readJson(path.resolve(projectRootDir, jmFile));
      if (Array.isArray(taskInJmFile) && taskInJmFile.length > 0) {
        jmFiles.push(jmFile);
        tasks.push(...taskInJmFile);
      }
    } catch (e) {
      _internal.getLogger(projectRootDir).warn("read job manager file failed", e);
    }
  }
  return { tasks, jmFiles };
}

export { _internal };
