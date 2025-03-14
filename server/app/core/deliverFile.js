/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const fs = require("fs-extra");
const path = require("path");
const { getLogger } = require("../logSettings.js");
const { rsyncExcludeOptionOfWheelSystemFiles } = require("../db/db");
const { getSsh, getSshHostinfo } = require("./sshManager.js");
const { gfpcopy, gfptarExtract } = require("./gfarmOperator.js");

/**
 * deliver src to dst
 * @param {string} src - absolute path of src path
 * @param {string} dst - absolute path of dst path
 * @param {boolean} forceCopy - use copy instead of symlink
 */
async function deliverFile(src, dst, forceCopy = false) {
  const stats = await fs.lstat(src);
  const type = stats.isDirectory() ? "dir" : "file";
  try {
    if (forceCopy) {
      await fs.copy(src, dst, { overwrite: true });
      return { type: "copy", src, dst };
    }
    await fs.remove(dst);
    await fs.ensureSymlink(src, dst, type);

    return { type: `link-${type}`, src, dst };
  } catch (e) {
    if (e.code === "EPERM") {
      await fs.copy(src, dst, { overwrite: false });
      return { type: "copy", src, dst };
    }
    return Promise.reject(e);
  }
}

/**
 * execut ln -s or cp -r command on remotehost to make shallow symlink
 * @param {object} recipe - deliver recipe which has src, dstination and more information
 * @returns {object} - result object
 */
async function deliverFilesOnRemote(recipe) {
  console.log("DEBUG: *****  deliverFilesOnRemote called with ", recipe);
  const logger = getLogger(recipe.projectRootDir);
  if (!recipe.onSameRemote) {
    logger.warn("deliverFilesOnRemote must be called with onSameRemote flag");
    return null;
  }
  if (recipe.dstName.endsWith("/")) {
    recipe.dstRoot = path.join(recipe.dstRoot, recipe.dstName);
    recipe.dstName = "./";
  }
  const ssh = getSsh(recipe.projectRootDir, recipe.srcRemotehostID);
  const cmd = recipe.forceCopy ? "cp -r " : "ln -sf";
  const sshCmd = `bash -O failglob -c 'mkdir -p ${recipe.dstRoot} 2>/dev/null; (cd ${recipe.dstRoot} && for i in ${path.join(recipe.srcRoot, recipe.srcName)}; do ${cmd} \${i} ${recipe.dstName} ;done)'`;
  logger.debug("execute on remote", sshCmd);
  const rt = await ssh.exec(sshCmd, 0, logger.debug.bind(logger));
  if (rt !== 0) {
    logger.warn("deliver file on remote failed", rt);
    const err = new Error("deliver file on remote failed");
    err.rt = rt;
    return Promise.reject(err);
  }
  return { type: "copy", src: path.join(recipe.srcRoot, recipe.srcName), dst: path.join(recipe.dstRoot, recipe.dstName) };
}

/**
 * deliver file from remotehost to localhost
 * @param {object} recipe - deliver recipe which has src, dstination and more information
 * @returns {object} - result object
 */
async function deliverFilesFromRemote(recipe) {
  const logger = getLogger(recipe.projectRootDir);
  if (!recipe.remoteToLocal) {
    logger.warn("deliverFilesFromRemote must be called with remoteToLocal flag");
    return null;
  }
  const ssh = getSsh(recipe.projectRootDir, recipe.srcRemotehostID);

  await ssh.recv([`${recipe.srcRoot}/${recipe.srcName}`], `${recipe.dstRoot}/${recipe.dstName}`, ["-vv", ...rsyncExcludeOptionOfWheelSystemFiles]);
  return { type: "copy", src: `${recipe.srcRoot}/${recipe.srcName}`, dst: `${recipe.dstRoot}/${recipe.dstName}` };
}

/**
 * deliver file from gfarm to the other component's dir
 * @param {object} recipe - deliver recipe which has src, dstination and more information
 * @returns {object} - result object
 */
async function deliverFilesFromHPCISS(recipe) {
  console.log("DEBUG: deliverFilesFromHPCISS", recipe);
  const withTar = recipe.fromHPCISStar;
  const ssh = getSsh(recipe.projectRootDir, recipe.srcRemotehostID);
  const hostinfo = getSshHostinfo(recipe.projectRootDir, recipe.srcRemotehostID);

  const prefix = hostinfo.path ? `-p ${hostinfo.path}` : "";
  const { output, rt } = await ssh.execAndGetOutput(`mktemp -d ${prefix} WHEEL_TMP_XXXXXXXX`);
  if (rt !== 0) {
    throw new Error("create temporary directory on CSGW failed");
  }
  const remoteTempDir = output[0];

  const orgSrcRoot = recipe.srcRoot;
  if (withTar) {
    const extractTargetName = path.join(remoteTempDir, "WHEEL_EXTRACT_DIR");
    const target = recipe.srcRoot;
    await gfptarExtract(recipe.projectRootDir, recipe.srcRemotehostID, target, extractTargetName);
    recipe.srcRoot = extractTargetName;
  } else {
    await gfpcopy(recipe.projectRootDir, recipe.srcRemotehostID, recipe.srcRoot, remoteTempDir);
    recipe.srcRoot = path.join(remoteTempDir, path.basename(orgSrcRoot));
  }
  recipe.remoteToLocal = !recipe.onSameRemote;

  const result = recipe.onSameRemote ? await deliverFilesOnRemote(recipe) : await deliverFilesFromRemote(recipe);
  result.src = `${orgSrcRoot}/${recipe.srcName}`;
  getLogger(recipe.projectRootDir).debug(`remove remote temp dir ${remoteTempDir}`);
  await ssh.exec(`rm -fr ${remoteTempDir}`);
  return result;
}

module.exports = {
  deliverFile,
  deliverFilesOnRemote,
  deliverFilesFromRemote,
  deliverFilesFromHPCISS
};
