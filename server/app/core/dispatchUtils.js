/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path = require("path");
const childProcess = require("child_process");
const fs = require("fs-extra");
const { addX, readJsonGreedy } = require("./fileUtils");
const { getLogger } = require("../logSettings.js");
const { replacePathsep } = require("./pathUtils");
const { remoteHost, componentJsonFilename } = require("../db/db");
const { getSshHostinfo } = require("./sshManager.js");

const _internal = {
  childProcess,
  getLogger,
  fs,
  addX,
  remoteHost,
  getSshHostinfo,
  replacePathsep,
  readJsonGreedy,
  process
};

/**
 * run script with options via child_process.spawn
 * @param {string} projectRootDir - project's root path
 * @param {string} script - script file name
 * @param {object} options - option object for child_process.spawn
 * @returns {Promise} - resolved with return value of script if normaly finished. rejected if abnormal termination occurred
 */
_internal.pspawn = async function (projectRootDir, script, args, options) {
  return new Promise((resolve, reject)=>{
    const cp = _internal.childProcess.spawn(script, args, options);
    cp.on("error", reject);
    cp.on("close", (code)=>{
      _internal.getLogger(projectRootDir).debug("return value of conditional expression = ", code);
      resolve(code === 0);
    });
    cp.stdout.on("data", (data)=>{
      _internal.getLogger(projectRootDir).trace(data.toString());
    });
    cp.stderr.on("data", (data)=>{
      _internal.getLogger(projectRootDir).trace(data.toString());
    });
  });
};

/**
 * evalute condition by executing external command or evalute JS expression
 * @param {string} projectRootDir - project's root path
 * @param {string | boolean} condition - command name or javascript expression
 * @param {string} cwd - task component's directory
 * @param {object} env - environment variables
 * @returns {Promise | boolean} -
 */
async function evalCondition(projectRootDir, condition, cwd, env) {
  //condition is always string for now. but keep following just in case
  if (typeof condition === "boolean") {
    return condition;
  }
  if (typeof condition !== "string") {
    _internal.getLogger(projectRootDir).warn("condition must be string or boolean");
    return new Error(`illegal condition specified ${typeof condition} \n${condition}`);
  }
  const script = path.resolve(cwd, condition);
  if (await _internal.fs.pathExists(script)) {
    _internal.getLogger(projectRootDir).debug("execute ", script);
    await _internal.addX(script);
    const dir = path.dirname(script);
    const options = {
      env: Object.assign({}, _internal.process.env, env),
      cwd: dir,
      shell: "bash"
    };

    return _internal.pspawn(projectRootDir, script, [], options);
  }
  _internal.getLogger(projectRootDir).debug("evalute ", condition);
  let conditionExpression = "";

  for (const [key, value] of Object.entries(env)) {
    conditionExpression += `let ${key}="${value}";\n`;
  }
  conditionExpression += condition;
  return eval?.(conditionExpression);
}

/**
 * return top working directory on remotehost
 * @param {string} projectRootDir - project's root path
 * @param {string} projectStartTime - YYYYMMDD-HHSS style string which is used as top directory name on remotehost
 * @param {object} component - component object
 * @param {boolean} isSharedHost - return as sharedHost path or ordinary remote path
 */
_internal.getRemoteRootWorkingDir = function (projectRootDir, projectStartTime, component, isSharedHost) {
  const remotehostID = _internal.remoteHost.getID("name", component.host);
  if (typeof remotehostID === "undefined") {
    return null;
  }
  const hostinfo = _internal.getSshHostinfo(projectRootDir, remotehostID);
  let remoteRoot = isSharedHost ? hostinfo.sharedPath : hostinfo.path;
  if (typeof remoteRoot !== "string") {
    remoteRoot = "";
  }
  return _internal.replacePathsep(path.posix.join(remoteRoot, projectStartTime));
};

/**
 * return comoponent's working directory on remoteshot
 * @param {string} projectRootDir - project's root path
 * @param {string} projectStartTime - YYYYMMDD-HHSS style string which is used as top directory name on remotehost
 * @param {string} workingDir - component's working directory on localhost
 * @param {object} component - component object
 * @param {boolean} isSharedHost - return as sharedHost path or ordinary remote path
 */
function getRemoteWorkingDir(projectRootDir, projectStartTime, workingDir, component, isSharedHost) {
  const remoteRootWorkingDir = _internal.getRemoteRootWorkingDir(projectRootDir, projectStartTime, component, isSharedHost);
  if (remoteRootWorkingDir === null) {
    return null;
  }
  const localWorkingDir = replacePathsep(path.relative(projectRootDir, workingDir));
  return replacePathsep(path.posix.join(remoteRootWorkingDir, localWorkingDir));
}

/**
 * check state is finished or not
 * @param {string} state - state string
 * @returns {boolean} is finished or not?
 */
function isFinishedState(state) {
  return state === "finished" || state === "failed" || state === "unknown";
}

/**
 * check if given path is wheel generated component of not
 * @param {string} target - path to be investigated
 * @returns {Promise} true if give path is subComponent dir
 */
async function isSubComponent(target) {
  try {
    const stats = await _internal.fs.stat(target);
    if (!stats.isDirectory()) {
      return false;
    }
  } catch (err) {
    //just in case, for race condition of reading and removing
    if (err.code === "ENOENT") {
      return false;
    }
    throw err;
  }

  let rt = false;
  try {
    const componentJson = await _internal.readJsonGreedy(path.resolve(target, componentJsonFilename));
    rt = componentJson.subComponent === true;
  } catch (e) {
    if (e.code === "ENOENT") {
      return false;
    }
    throw e;
  }
  return rt;
}

module.exports = {
  pspawn: _internal.pspawn,
  evalCondition,
  getRemoteWorkingDir,
  getRemoteRootWorkingDir: _internal.getRemoteRootWorkingDir,
  isFinishedState,
  isSubComponent
};

if (process.env.NODE_ENV === "test") {
  module.exports._internal = _internal;
}
