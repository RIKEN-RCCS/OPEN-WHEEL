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

async function pspawn(projectRootDir, script, options) {
  return new Promise((resolve, reject)=>{
    const cp = childProcess.spawn(script, options, (err)=>{
      if (err) {
        reject(err);
      }
    });
    cp.on("error", reject);
    cp.on("close", (code)=>{
      getLogger(projectRootDir).debug("return value of conditional expression = ", code);
      resolve(code === 0);
    });
    cp.stdout.on("data", (data)=>{
      getLogger(projectRootDir).trace(data.toString());
    });
    cp.stderr.on("data", (data)=>{
      getLogger(projectRootDir).trace(data.toString());
    });
  });
}

/**
 * evalute condition by executing external command or evalute JS expression
 * @param {string} projectRootDir - root directory path of project
 * @param {string} condition - command name or javascript expression
 * @param {string} cwd - task component's directory
 * @param {number} currentIndex - innermost loop index (WHEEL_CURRENT_INDEX)
 * @returns {Promise} *
 */
async function evalCondition(projectRootDir, condition, cwd, currentIndex) {
  //condition is always string for now. but keep following just in case
  if (typeof condition === "boolean") {
    return condition;
  }
  if (typeof condition !== "string") {
    getLogger(projectRootDir).warn("condition must be string or boolean");
    return new Error(`illegal condition specified ${typeof condition} \n${condition}`);
  }
  const script = path.resolve(cwd, condition);
  if (await fs.pathExists(script)) {
    getLogger(projectRootDir).debug("execute ", script);
    await addX(script);
    const dir = path.dirname(script);
    const options = {
      env: process.env,
      cwd: dir,
      shell: "bash"
    };

    if (typeof currentIndex === "number") {
      options.env.WHEEL_CURRENT_INDEX = currentIndex.toString();
    }
    return pspawn(projectRootDir, script, options);
  }
  getLogger(projectRootDir).debug("evalute ", condition);
  let conditionExpression = "";

  if (typeof currentIndex === "number") {
    conditionExpression += `var WHEEL_CURRENT_INDEX=${currentIndex};`;
  }
  conditionExpression += condition;
   
  return eval(conditionExpression);
}
function getRemoteRootWorkingDir(projectRootDir, projectStartTime, component) {
  const remotehostID = remoteHost.getID("name", component.host);
  if (typeof remotehostID === "undefined") {
    return null;
  }
  const hostinfo = getSshHostinfo(projectRootDir, remotehostID);
  const remoteRoot = typeof hostinfo.path === "string" ? hostinfo.path : "";
  return replacePathsep(path.posix.join(remoteRoot, projectStartTime));
}
function getRemoteWorkingDir(projectRootDir, projectStartTime, workingDir, component) {
  const remoteRootWorkingDir = getRemoteRootWorkingDir(projectRootDir, projectStartTime, component);
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
  try{
    const stats = await fs.stat(target);
    if (!stats.isDirectory()) {
      return false;
    }
  }catch(err){
    //just in case, for race condition of reading and removing
    if(err.code === "ENOENT"){
      return false
    }
    throw err
  }

  let rt=false
  try{
    const componentJson = await readJsonGreedy(path.resolve(target, componentJsonFilename));
    rt = componentJson.subComponent === true;
  }catch(e){
    if(e.code === "ENOENT"){
      return false
    }
    throw e
  }
  return rt
}


module.exports = {
  evalCondition,
  getRemoteWorkingDir,
  getRemoteRootWorkingDir,
  isFinishedState,
  isSubComponent
};
