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

/**
 * check if specified path is exist or not
 * @param {string} target - path to be checked
 * @param {boolean} isFile - if true, check target path is file
 * @returns {boolean} -
 */
function isExists(target, isFile) {
  try {
    const stats = fs.statSync(target);
    return isFile ? stats.isFile() : stats.isDirectory();
  } catch (e) {
    if (e.code === "ENOENT") {
      return false;
    }
    throw e;
  }
}

/**
 * search specified file in order of WHEEL_CONFIG_DIR, ${HOME}/.wheel, WHEEL_INSTALL_PATH/app/config
 * @param {string} filename - target filename
 * @param {boolean} failIfNotFound - if true, throw exception when file is not found. make newfile if false
 * @returns {string} - config file's path
 */
function getConfigFile(filename, failIfNotFound) {
  const envFile = typeof process.env.WHEEL_CONFIG_DIR === "string"
    ? path.resolve(process.env.WHEEL_CONFIG_DIR, filename)
    : null;
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
    const err = new Error("file not found");
    err.filename = filename;
    throw err;
  }
  const envFileDir = typeof process.env.WHEEL_CONFIG_DIR === "string"
    ? path.resolve(process.env.WHEEL_CONFIG_DIR)
    : null;
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
  const err = new Error("file not found");
  err.filename = filename;
  throw err;
}

/**
 * return value or alternate value if it is nudefined
 * @param {*} target - variable to be checked
 * @param {*} alt - alternate value
 * @returns {*} -
 */
function getVar(target, alt) {
  return typeof target !== "undefined" ? target : alt;
}

/**
 * return integer value or alternate value if it is not integer
 * @param {*} target - variable to be checked
 * @param {number} alt - alternate value
 * @returns {number} -
 */
function getIntVar(target, alt) {
  return Number.isInteger(target) ? target : alt;
}

/**
 * return string value or alternate value if it is not string
 * @param {*} target - variable to be checked
 * @param {string} alt - alternate value
 * @returns {string} -
 */
function getStringVar(target, alt) {
  return typeof target === "string" ? target : alt;
}

/**
 * return the integer parsed from a WHEEL_* environment variable when it is set to a
 * non-blank string that parses to a number (0 included); otherwise return the fallback
 * taken from the merged config file / package default.
 * A blank or whitespace-only env var never overrides the config value, so the documented
 * priority "non-empty WHEEL_* env var > WHEEL_CONFIG_DIR/server.json > ~/.wheel/server.json
 * > packaged default" holds. Unlike `parseInt(env, 10) || fallback`, a valid `0` from the
 * env var is honoured instead of silently falling through to the config value.
 * @param {string|undefined} envValue - raw process.env.WHEEL_XXX value
 * @param {number} fallback - value from the merged config file / package default
 * @returns {number} -
 */
function envIntOr(envValue, fallback) {
  if (typeof envValue !== "string" || envValue.trim() === "") {
    return fallback;
  }
  const parsed = parseInt(envValue, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

/**
 * read default and userdefined config file and merge them
 * @param {string} filename - config file's name
 * @returns {object} -
 */
function readAndMergeConfigFile(filename) {
  let userConfigFilename;
  try {
    userConfigFilename = getConfigFile(filename, true);
  } catch (e) {
    if (e.message !== "file not found") {
      throw e;
    }
  }
  const defaultConfig = require(`./${filename}`);
  if (!userConfigFilename) {
    return defaultConfig;
  }
  const userConfig = require(userConfigFilename);
  return { ...defaultConfig, ...userConfig };
}

const config = readAndMergeConfigFile("server.json");
const jobScheduler = readAndMergeConfigFile("jobScheduler.json");
const remotehostFilename = getConfigFile(getStringVar(config.remotehostJsonFile, "remotehost.json"));
const jobScriptTemplateFilename = getConfigFile(getStringVar(config.jobScriptTemplateJsonFile, "jobScriptTemplate.json"));
const projectListFilename = getConfigFile(getStringVar(config.projectListJsonFile, "projectList.json"));
const logFilename = getConfigFile(getStringVar(config.logFilename, "wheel.log"));
const credentialFilename = getConfigFile(getStringVar(config.credentialFilename, "credentials.json"));

//export constants
module.exports.suffix = ".wheel";
module.exports.projectJsonFilename = "prj.wheel.json";
module.exports.componentJsonFilename = "cmp.wheel.json";
module.exports.statusFilename = "status.wheel.txt";
module.exports.jobManagerJsonFilename = "jm.wheel.json";
module.exports.filesJsonFilename = "files.wheel.json";
module.exports.defaultPSconfigFilename = "parameterSetting.json";
module.exports.userDBFilename = "user.db";
module.exports.userDBDir = process.env.WHEEL_USER_DB_DIR || __dirname;

if (!process.env.WHEEL_USE_HTTP) {
  module.exports.keyFilename = getConfigFile("server.key", true);
  module.exports.certFilename = getConfigFile("server.crt", true);
}
module.exports.logFilename = logFilename;
module.exports.credentialFilename = credentialFilename;

module.exports.rsyncExcludeOptionOfWheelSystemFiles = [
  `--exclude=**/${module.exports.projectJsonFilename}`,
  `--exclude=**/${module.exports.componentJsonFilename}`,
  `--exclude=**/${module.exports.statusFilename}`,
  `--exclude=**/${module.exports.jobManagerJsonFilename}`,
  `--exclude=**/${module.exports.filesJsonFilename}`,
  `--exclude=**/${module.exports.defaultPSconfigFilename}`,
  `--exclude=**/${module.exports.logFilename}`
];

//re-export server settings
//non-empty WHEEL_PORT wins over every config file (see envIntOr); app/index.js still
//falls back to a default port when the resolved value is <= 0.
module.exports.port = envIntOr(process.env.WHEEL_PORT, config.port);
module.exports.rootDir = getStringVar(config.rootDir, getStringVar(os.homedir(), "/"));
module.exports.defaultCleanupRemoteRoot = getVar(config.defaultCleanupRemoteRoot, true);
module.exports.numLogFiles = getIntVar(config.numLogFiles, 5);
module.exports.maxLogSize = getIntVar(config.maxLogSize, 8388608);
module.exports.compressLogFile = getVar(config.compressLogFile, true);
module.exports.numJobOnLocal = envIntOr(process.env.WHEEL_NUM_LOCAL_JOB, getIntVar(config.numJobOnLocal, 1));
module.exports.defaultTaskRetryCount = getIntVar(config.defaultTaskRetryCount, 1);
module.exports.gitLFSSize = getIntVar(config.gitLFSSize, 200);

//export setting files
module.exports.jobScheduler = jobScheduler;
module.exports.remoteHost = new JsonArrayManager(remotehostFilename);
module.exports.jobScriptTemplate = new JsonArrayManager(jobScriptTemplateFilename);
module.exports.projectList = new JsonArrayManager(projectListFilename);

/**@internal exported for unit testing only */
module.exports._internal = { envIntOr };
