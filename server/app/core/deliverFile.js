/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import fs from "fs-extra";
import path from "path";
import { getLogger } from "../logSettings.js";
import { rsyncExcludeOptionOfWheelSystemFiles } from "../db/db.js";
import { getSsh, getSshHostinfo } from "./sshManager.js";
import { gfpcopy, gfptarExtract } from "./gfarmOperator.js";

const _internal = {
  fs,
  getLogger,
  getSsh,
  getSshHostinfo
};

/**
 * deliver src to dst
 * @param {string} src - absolute path of src path
 * @param {string} dst - absolute path of dst path
 * @param {boolean} forceCopy - use copy instead of symlink
 */
async function deliverFile(src, dst, forceCopy = false) {
  const stats = await _internal.fs.lstat(src);
  const type = stats.isDirectory() ? "dir" : "file";
  try {
    if (forceCopy) {
      await _internal.fs.copy(src, dst, { overwrite: true });
      return { type: "copy", src, dst };
    }
    await _internal.fs.remove(dst);
    await _internal.fs.ensureSymlink(src, dst, type);

    return { type: `link-${type}`, src, dst };
  } catch (e) {
    if (e.code === "EPERM") {
      await _internal.fs.copy(src, dst, { overwrite: false });
      return { type: "copy", src, dst };
    }
    return Promise.reject(e);
  }
}

/**
 * build ssh command string which delivers file(s) entirely on one remote host via ln -sf or cp -r
 * srcName is glob-expanded inside srcRoot and each match is converted to an absolute path before
 * being handed to ln/cp, so the result is correct regardless of how deep dstRoot is relative to
 * srcRoot (a relative symlink target is resolved against the symlink's own directory, not srcRoot,
 * so a naive relative target breaks as soon as srcRoot and dstRoot differ in depth).
 * @param {object} recipe - deliver recipe which has srcRoot, srcName, dstRoot and dstName
 * @param {string} cmd - "ln -sf" or "cp -r "
 * @returns {string} - shell command to run via ssh.exec
 */
function _buildDeliverOnRemoteCmd(recipe, cmd) {
  return `bash -O failglob -c 'BASE="$PWD"; mkdir -p ${recipe.dstRoot} 2>/dev/null; cd ${recipe.srcRoot} || exit 1; ABS_LIST=(); for i in ${recipe.srcName}; do ABS_LIST+=("$PWD/$i"); done; cd "$BASE" && cd ${recipe.dstRoot} || exit 1; RC=0; for a in "\${ABS_LIST[@]}"; do ${cmd} "$a" ${recipe.dstName} || RC=1; done; exit $RC'`;
}

/**
 * execut ln -s or cp -r command on remotehost to make shallow symlink
 * @param {object} recipe - deliver recipe which has src, dstination and more information
 * @returns {object} - result object
 */
async function deliverFilesOnRemote(recipe) {
  const logger = _internal.getLogger(recipe.projectRootDir);
  if (!recipe.onSameRemote) {
    logger.warn("deliverFilesOnRemote must be called with onSameRemote flag");
    return null;
  }
  if (recipe.dstName.endsWith("/")) {
    recipe.dstRoot = path.join(recipe.dstRoot, recipe.dstName);
    recipe.dstName = "./";
  }
  const ssh = _internal.getSsh(recipe.projectRootDir, recipe.srcRemotehostID);
  const cmd = recipe.forceCopy ? "cp -r " : "ln -sf";
  const sshCmd = _buildDeliverOnRemoteCmd(recipe, cmd);
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
  const logger = _internal.getLogger(recipe.projectRootDir);
  if (!recipe.remoteToLocal) {
    logger.warn("deliverFilesFromRemote must be called with remoteToLocal flag");
    return null;
  }
  const ssh = _internal.getSsh(recipe.projectRootDir, recipe.srcRemotehostID);

  await ssh.recv([`${recipe.srcRoot}/${recipe.srcName}`], `${recipe.dstRoot}/${recipe.dstName}`, ["-vv", ...rsyncExcludeOptionOfWheelSystemFiles]);
  return { type: "copy", src: `${recipe.srcRoot}/${recipe.srcName}`, dst: `${recipe.dstRoot}/${recipe.dstName}` };
}

/**
 * deliver file from gfarm to the other component's dir
 * @param {object} recipe - deliver recipe which has src, dstination and more information
 * @returns {object} - result object
 */
async function deliverFilesFromHPCISS(recipe) {
  const withTar = recipe.fromHPCISStar;
  const ssh = _internal.getSsh(recipe.projectRootDir, recipe.srcRemotehostID);
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
  _internal.getLogger(recipe.projectRootDir).debug(`remove remote temp dir ${remoteTempDir}`);
  await ssh.exec(`rm -fr ${remoteTempDir}`);
  return result;
}

/**
 * deliver file from localhost to remotehost via shared storage
 * @param {object} recipe - deliver recipe which has src, dstination and more information
 * @returns {object} - result object
 */
async function deliverFilesLocalToRemoteShared(recipe) {
  const logger = _internal.getLogger(recipe.projectRootDir);
  if (!recipe.localToRemoteShared) {
    logger.warn("deliverFilesLocalToRemoteShared must be called with localToRemoteShared flag");
    return null;
  }
  if (recipe.dstName.endsWith("/")) {
    recipe.dstRoot = path.join(recipe.dstRoot, recipe.dstName);
    recipe.dstName = "./";
  }
  const ssh = _internal.getSsh(recipe.projectRootDir, recipe.dstRemotehostID);
  const cmd = recipe.forceCopy ? "cp -r " : "ln -sf";
  const sshCmd = _buildDeliverOnRemoteCmd(recipe, cmd);
  logger.debug("execute on remote (localhost to remote via shared storage)", sshCmd);
  const rt = await ssh.exec(sshCmd, 0, logger.debug.bind(logger));
  if (rt !== 0) {
    logger.warn("deliver file from localhost to remote via shared storage failed", rt);
    const err = new Error("deliver file from localhost to remote via shared storage failed");
    err.rt = rt;
    return Promise.reject(err);
  }
  return { type: "link-via-shared", src: path.join(recipe.srcRoot, recipe.srcName), dst: path.join(recipe.dstRoot, recipe.dstName) };
}

/**
 * deliver file from remotehost to localhost via shared storage
 * @param {object} recipe - deliver recipe which has src, dstination and more information
 * @returns {object} - result object
 */
async function deliverFilesRemoteToLocalShared(recipe) {
  const logger = _internal.getLogger(recipe.projectRootDir);
  if (!recipe.remoteToLocalShared) {
    logger.warn("deliverFilesRemoteToLocalShared must be called with remoteToLocalShared flag");
    return null;
  }
  const srcPath = path.join(recipe.srcRoot, recipe.srcName);
  const dstPath = path.join(recipe.dstRoot, recipe.dstName);
  logger.debug("create symlink on localhost (remote to localhost via shared storage)", srcPath, "->", dstPath);
  return deliverFile(srcPath, dstPath, recipe.forceCopy);
}

/**
 * deliver file directly between different remote hosts using SSH agent forwarding
 * @param {object} recipe - deliver recipe which has src, destination and more information
 * @returns {object} - result object
 */
async function deliverFilesBetweenRemotes(recipe) {
  const logger = _internal.getLogger(recipe.projectRootDir);
  if (!recipe.betweenRemotes) {
    logger.warn("deliverFilesBetweenRemotes must be called with betweenRemotes flag");
    return null;
  }
  const srcSsh = _internal.getSsh(recipe.projectRootDir, recipe.srcRemotehostID);
  const dstHostinfo = _internal.getSshHostinfo(recipe.projectRootDir, recipe.dstRemotehostID);

  logger.debug("direct remote to remote copy from", recipe.srcRemotehostID, "to", recipe.dstRemotehostID);

  const rt = await srcSsh.remoteToRemoteCopy(
    [`${recipe.srcRoot}/${recipe.srcName}`],
    dstHostinfo,
    `${recipe.dstRoot}/${recipe.dstName}`,
    ["-vv", ...rsyncExcludeOptionOfWheelSystemFiles]
  );
  if (rt !== 0) {
    const err = new Error(`direct remote to remote copy failed with exit code ${rt}`);
    err.rt = rt;
    return Promise.reject(err);
  }

  return { type: "direct-remote-copy", src: `${recipe.srcRoot}/${recipe.srcName}`, dst: `${recipe.dstRoot}/${recipe.dstName}` };
}

export {
  deliverFile,
  deliverFilesOnRemote,
  deliverFilesFromRemote,
  deliverFilesFromHPCISS,
  deliverFilesLocalToRemoteShared,
  deliverFilesRemoteToLocalShared,
  deliverFilesBetweenRemotes,
  _internal
};
