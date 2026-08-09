/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import util from "node:util";
import fs from "fs-extra";
import { exec as execCallback } from "node:child_process";

const exec = util.promisify(execCallback);

/**
 * copy directory by rsync and overwrite existing files
 * @param {string} src - src directory
 * @param {string} dst - dst directory
 * @param {string[]} ignoreFiles - glob pattern which should not be coppied
 * @returns {Promise} - resolved when copy is done
 */
async function overwriteByRsync(src, dst, ignoreFiles = []) {
  const exclude = ignoreFiles.reduce((a, c)=>{
    if (typeof c !== "string") {
      return a;
    }
    return `${a} --exclude=${c} `;
  }, "");
  const stats = await fs.stat(src);

  return exec(`rsync -av ${exclude} ${src}${stats.isDirectory() ? "/" : ""} ${dst}`);
}

export { overwriteByRsync };
