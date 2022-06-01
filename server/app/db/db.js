/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License.txt in the project root for the license information.
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
module.exports.interval = config.interval;
module.exports.port = config.port;
module.exports.rootDir = config.rootDir || os.homedir() || "/";
module.exports.defaultCleanupRemoteRoot = config.defaultCleanupRemoteRoot;
module.exports.numLogFiles = config.numLogFiles;
module.exports.maxLogSize = config.maxLogSize;
module.exports.compressLogFile = config.compressLogFile;
module.exports.numJobOnLocal = config.numJobOnLocal;
module.exports.defaultTaskRetryCount = config.defaultTaskRetryCount;
module.exports.shutdownDelay = config.shutdownDelay;
module.exports.gitLFSSize = config.gitLFSSize;

//export setting files
module.exports.jobScheduler = jobScheduler;
module.exports.remoteHost = new JsonArrayManager(remotehostFilename);
module.exports.jobScript = new JsonArrayManager(jobScriptFilename);
module.exports.projectList = new JsonArrayManager(projectListFilename);
