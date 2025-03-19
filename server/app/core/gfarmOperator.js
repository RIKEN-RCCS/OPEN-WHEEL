/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path = require("path");
const { getLogger } = require("../logSettings");
const { getSsh, getSshHostinfo } = require("./sshManager.js");
const { getJWTServerPassphrase } = require("../core/jwtServerPassphraseManager.js");

async function execOnCSGW(projectRootDir, hostID, timeout, cmd, ...args) {
  const ssh = await getSsh(projectRootDir, hostID);
  const cmdline = args.reduce((a, c)=>{
    return `${a} ${c}`;
  }, cmd);

  const { rt, output } = await ssh.execAndGetOutput(cmdline, timeout);
  if (rt !== 0) {
    const err = new Error(`${cmd} failed: ${output}`);
    err.cmd = cmd;
    err.args = args;
    err.cmdline = cmdline;
    err.timeout = timeout;
    err.output = output;
    err.rt = rt;
    throw err;
  }
  return output;
}

function formatGfarmURL(target) {
  if (target.startsWith("gfarm:///")) {
    return target;
  }
  if (target.startsWith("./") || target.startsWith("../")) {
    const err = new Error("gfarm path must be absolute path");
    err.path = target;
    throw err;
  }
  return `gfarm://${path.resolve(target)}`;
}

async function checkJWTAgent(projectRootDir, hostID) {
  const ssh = await getSsh(projectRootDir, hostID);
  let result = false;
  await ssh.exec("jwt-agent --status", 60, (data)=>{
    if (/^jwt-agent.* is running/.exec(data)) {
      getLogger(projectRootDir).debug(data);
      result = true;
    } else {
      getLogger(projectRootDir).warn(data);
    }
  });
  return result;
}

async function startJWTAgent(projectRootDir, hostID, passphrase) {
  if (await checkJWTAgent(projectRootDir, hostID)) {
    return false;
  }
  const ssh = await getSsh(projectRootDir, hostID);
  const { JWTServerUser, JWTServerURL } = await getSshHostinfo(projectRootDir, hostID);
  const JWTServerPassphrase = passphrase || await getJWTServerPassphrase(projectRootDir, hostID);
  return ssh.expect(`jwt-agent -s ${JWTServerURL} -l ${JWTServerUser}`, [
    { expect: "Passphrase", send: JWTServerPassphrase }
  ], null, 60);
}

async function stopJWTAgent(projectRootDir, hostID, timeout = 60) {
  if (!await checkJWTAgent(projectRootDir, hostID)) {
    return false;
  }
  return execOnCSGW(projectRootDir, hostID, timeout, "jwt-agent", "--stop");
}

/**
 * copy single file to gfarm or vice versa
 * @param {string} projectRootDir - project's root path
 * @param {string} hostID - ID of hostinfo which serve gfarm service
 * @param {string} src - path to be copied
 * @param {string} dst - destination path
 * @param {boolean} toGfarm - dst path treat as gfarm URI
 * @param {number} timeout - timeout in secconds must be positive number
 * @returns {string} - output from gfcp command
 */
async function gfcp(projectRootDir, hostID, src, dst, toGfarm, timeout = 600) {
  await startJWTAgent(projectRootDir, hostID);
  let srcPath = src;
  let dstPath = dst;
  if (toGfarm) {
    dstPath = formatGfarmURL(dst);
  } else {
    srcPath = formatGfarmURL(src);
  }
  return execOnCSGW(projectRootDir, hostID, timeout, "gfcp -p -f", srcPath, dstPath);
}

/**
 * copy directory to gfarm or vice versa
 * @param {string} projectRootDir - project's root path
 * @param {string} hostID - ID of hostinfo which serve gfarm service
 * @param {string} src - directory path to be copied
 * @param {string} dst - destination path
 * @param {boolean} toGfarm - dst path treat as gfarm URI
 * @param {number} timeout - timeout in secconds must be positive number
 * @returns {string} - output from gfpcopy command
 */
async function gfpcopy(projectRootDir, hostID, src, dst, toGfarm, timeout = 60) {
  await startJWTAgent(projectRootDir, hostID);
  const srcPath = toGfarm ? src : formatGfarmURL(src); ;
  const dstPath = toGfarm ? formatGfarmURL(dst) : dst;
  return execOnCSGW(projectRootDir, hostID, timeout, "gfpcopy -p -v -f", srcPath, dstPath);
}

/**
 * create new gfarm-tar archive
 * @param {string} projectRootDir - project's root path
 * @param {string} hostID - ID of hostinfo which serve gfarm service
 * @param {string} src - directory containing the contents to be stored in the tar archive
 * @param {string} target - archive directory name it should not exists
 * @param {number} timeout - timeout in secconds must be positive number
 * @returns {string} - output from gfptar command
 */
async function gfptarCreate(projectRootDir, hostID, src, target, timeout = 60) {
  await startJWTAgent(projectRootDir, hostID, timeout);
  const archivePath = formatGfarmURL(target);
  return execOnCSGW(projectRootDir, hostID, timeout, `cd ${src} && shopt -s dotglob nullglob && gfptar -v -c ${archivePath} *`);
}

/**
 * extract gfarm-tar archive
 * @param {string} projectRootDir - project's root path
 * @param {string} hostID - ID of hostinfo which serve gfarm service
 * @param {string} target - archive directory
 * @param {string} dst - directory to which tar archive to be extracted
 * @param {number} timeout - timeout in secconds must be positive number
 * @returns {string} - output from gfptar command
 */
async function gfptarExtract(projectRootDir, hostID, target, dst, timeout = 60) {
  await startJWTAgent(projectRootDir, hostID);
  const archivePath = formatGfarmURL(target);
  return execOnCSGW(projectRootDir, hostID, timeout, "gfptar -v -x", dst, archivePath);
}

async function gfptarList(projectRootDir, hostID, target, timeout = 60) {
  await startJWTAgent(projectRootDir, hostID);
  const archivePath = formatGfarmURL(target);
  const result = await execOnCSGW(projectRootDir, hostID, timeout, "gfptar -t", archivePath);
  const formatedResult = result.filter((line)=>{
    return line.startsWith("F");
  }).map((line)=>{
    return line.split(" ")[1];
  });
  return formatedResult;
}

/**
 * list contents under gfarm
 * @param {string} projectRootDir - project's root path
 * @param {string} hostID - ID of hostinfo which serve gfarm service
 * @param {string} target - parent dir path
 * @param {string} opt - optional arguments of gfls
 * @param {number} timeout - timeout in secconds must be positive number
 * @returns {string[]} - output from gfls command
 */
async function gfls(projectRootDir, hostID, target, opt = "-l", timeout = 60) {
  await startJWTAgent(projectRootDir, hostID);
  const pathOnGfarm = formatGfarmURL(target);
  try {
    return await execOnCSGW(projectRootDir, hostID, timeout, "gfls", opt, pathOnGfarm);
  } catch (e) {
    if (!e.output[0].endsWith("no such file or directory\n")) {
      throw e;
    };
  }
}

/**
 * remove contents under gfarm
 * @param {string} projectRootDir - project's root path
 * @param {string} hostID - ID of hostinfo which serve gfarm service
 * @param {string} target - parent dir path
 * @param {number} timeout - timeout in secconds must be positive number
 */
async function gfrm(projectRootDir, hostID, target, timeout = 60) {
  await startJWTAgent(projectRootDir, hostID);
  const pathOnGfarm = formatGfarmURL(target);
  try {
    await execOnCSGW(projectRootDir, hostID, timeout, "gfrm -fr", pathOnGfarm);
  } catch (e) {
    if (!e.output[0].endsWith("no such file or directory\n")) {
      throw e;
    };
  }
}

/**
 * make directory under gfarm
 * @param {string} projectRootDir - project's root path
 * @param {string} hostID - ID of hostinfo which serve gfarm service
 * @param {string} target - parent dir path
 * @param {number} timeout - timeout in secconds must be positive number
 * @returns {string} - output from gfmkdir command
 */
async function gfmkdir(projectRootDir, hostID, target, timeout = 60) {
  await startJWTAgent(projectRootDir, hostID);
  const pathOnGfarm = formatGfarmURL(target);
  return execOnCSGW(projectRootDir, hostID, timeout, "gfmkdir -p", pathOnGfarm);
}

/**
 * rename file or directory under gfarm
 * @param {string} projectRootDir - project's root path
 * @param {string} hostID - ID of hostinfo which serve gfarm service
 * @param {string} target - parent dir path
 * @param {string} newName - new absolute path of file or directory
 * @param {number} timeout - timeout in secconds must be positive number
 * @returns {string} - output from gfmkdir command
 */
async function gfmv(projectRootDir, hostID, target, newName, timeout = 60) {
  await startJWTAgent(projectRootDir, hostID);
  const src = formatGfarmURL(target);
  const dst = formatGfarmURL(newName);
  return execOnCSGW(projectRootDir, hostID, timeout, "gfmv -f", src, dst);
}

module.exports = {
  checkJWTAgent,
  startJWTAgent,
  stopJWTAgent,
  gfcp,
  gfpcopy,
  gfptarCreate,
  gfptarExtract,
  gfptarList,
  gfls,
  gfrm,
  gfmkdir,
  gfmv
};
