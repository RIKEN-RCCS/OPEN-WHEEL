/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const os = require("os");
const path = require("path");
const fs = require("fs-extra");
const JsonArrayManager = require("./jsonArrayManager");

function isExists(target, file) {
  try {
    const stats = fs.statSync(target);
    return file ? stats.isFile() : stats.isDirectory();
  } catch (e) {
    if (e.code === "ENOENT") {
      return false;
    }
    throw e;
  }
}

/**
 * search specified file in order of WHEEL_CONFIG_DIR, ${HOME}/.wheel, WHEEL_INSTALL_PATH/app/config
 */
function getConfigFile(filename, failIfNotFound) {
  const envFile = typeof process.env.WHEEL_CONFIG_DIR === "string"
    ? path.resolve(process.env.WHEEL_CONFIG_DIR, filename) : null;
  if (envFile !== null && isExists(envFile, true)) {
    return envFile;
  }
  const dotFile = path.resolve(os.homedir(), ".wheel", filename);
  if (isExists(dotFile, true)) {
    return dotFile;
  }
  const defaultPath = path.resolve(__dirname, "../config", filename);
  if (isExists(defaultPath, true)) {
    return defaultPath;
  }
  if (failIfNotFound) {
    throw new Error(filename, "not found");
  }
  const envFileDir = typeof process.env.WHEEL_CONFIG_DIR === "string"
    ? path.resolve(process.env.WHEEL_CONFIG_DIR) : null;
  if (envFileDir !== null && isExists(envFileDir, false)) {
    return path.resolve(envFileDir, filename);
  }
  const dotFileDir = path.resolve(os.homedir(), ".wheel");
  if (isExists(dotFileDir, false)) {
    return path.resolve(dotFileDir, filename);
  }
  const defaultDir = path.resolve(__dirname, "../config");
  if (isExists(defaultDir, false)) {
    return path.resolve(defaultDir, filename);
  }
  throw new Error(filename, "not found");
}

function getVar(target, alt) {
  return typeof target !== "undefined" ? target : alt;
}
function getIntVar(target, alt) {
  return Number.isInteger(target) ? target : alt;
}
function getStringVar(target, alt) {
  return typeof target === "string" ? target : alt;
}

const config = require(getConfigFile("server.json", true));
const jobScheduler = require(getConfigFile("jobScheduler.json", true));
const remotehostFilename = getConfigFile(config.remotehostJsonFile);
const jobScriptFilename = getConfigFile(config.jobScriptJsonFile);
const projectListFilename = getConfigFile(config.projectListJsonFile);
const keyFilename = getConfigFile("server.key", true);
const certFilename = getConfigFile("server.crt", true);
const logFilename = getConfigFile(config.logFilename);

//export constants
module.exports.suffix = ".wheel";
module.exports.projectJsonFilename = "prj.wheel.json";
module.exports.componentJsonFilename = "cmp.wheel.json";
module.exports.statusFilename = "status.wheel.txt";
module.exports.jobManagerJsonFilename = "jm.wheel.json";
module.exports.filesJsonFilename = "files.wheel.json";
module.exports.defaultPSconfigFilename = "parameterSetting.json";
module.exports.keyFilename = keyFilename;
module.exports.certFilename = certFilename;
module.exports.logFilename = logFilename;

//re-export server settings
module.exports.interval = getIntVar(config.interval, 1000);
module.exports.port = parseInt(process.env.WHEEL_PORT, 10) || config.port; //default var will be calcurated in app/index.js
module.exports.rootDir = getStringVar(config.rootDir, getStringVar(os.homedir(), "/"));
module.exports.defaultCleanupRemoteRoot = getVar(config.defaultCleanupRemoteRoot, true);
module.exports.numLogFiles = getIntVar(config.numLogFiles, 5);
module.exports.maxLogSize = getIntVar(config.maxLogSize, 8388608);
module.exports.compressLogFile = getVar(config.compressLogFile, true);
module.exports.numJobOnLocal = getIntVar(config.numJobOnLocal, 1);
module.exports.defaultTaskRetryCount = getIntVar(config.defaultTaskRetryCount, 1);
module.exports.shutdownDelay = getIntVar(config.shutdownDelay, 0);
module.exports.gitLFSSize = getIntVar(config.gitLFSSize, 200);

//export setting files
module.exports.jobScheduler = jobScheduler;
module.exports.remoteHost = new JsonArrayManager(remotehostFilename);
module.exports.jobScript = new JsonArrayManager(jobScriptFilename);
module.exports.projectList = new JsonArrayManager(projectListFilename);
