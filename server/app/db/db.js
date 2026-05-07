/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import os from "os";
import path from "path";
import fs from "fs-extra";
import { loadConfig } from "c12";
import JsonArrayManager from "./jsonArrayManager.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
 * load a WHEEL config file using c12.
 * Priority (highest to lowest):
 *   1. WHEEL_CONFIG_DIR/{filename}  (env-based override)
 *   2. ~/.wheel/{filename}          (user home directory)
 *   3. server/app/db/{filename}     (package defaults)
 * @param {string} filename - config file's name (e.g. "server.json")
 * @returns {Promise<object>} merged config
 */
async function loadWheelConfig(filename) {
  const packageDefaults = JSON.parse(await fs.readFile(path.resolve(__dirname, filename), "utf-8"));

  //load ~/.wheel/{filename} as user defaults
  const dotWheelConfigPath = path.resolve(os.homedir(), ".wheel", filename);
  let dotWheelConfig = {};
  try {
    dotWheelConfig = JSON.parse(await fs.readFile(dotWheelConfigPath, "utf-8"));
  } catch (e) {
    if (e.code !== "ENOENT") {
      throw e;
    }
  }

  //load WHEEL_CONFIG_DIR/{filename} as highest-priority overrides
  let envDirConfig = {};
  if (typeof process.env.WHEEL_CONFIG_DIR === "string") {
    const envConfigPath = path.resolve(process.env.WHEEL_CONFIG_DIR, filename);
    try {
      envDirConfig = JSON.parse(await fs.readFile(envConfigPath, "utf-8"));
    } catch (e) {
      if (e.code !== "ENOENT") {
        throw e;
      }
    }
  }

  const { config } = await loadConfig({
    name: "wheel",
    rcFile: false,
    globalRc: false,
    defaults: { ...packageDefaults, ...dotWheelConfig },
    overrides: envDirConfig
  });
  return config;
}

const config = await loadWheelConfig("server.json");
const jobScheduler = await loadWheelConfig("jobScheduler.json");
const remotehostFilename = getConfigFile(getStringVar(config.remotehostJsonFile, "remotehost.json"));
const jobScriptTemplateFilename = getConfigFile(getStringVar(config.jobScriptTemplateJsonFile, "jobScriptTemplate.json"));
const projectListFilename = getConfigFile(getStringVar(config.projectListJsonFile, "projectList.json"));
const logFilename = getConfigFile(getStringVar(config.logFilename, "wheel.log"));
const credentialFilename = getConfigFile(getStringVar(config.credentialFilename, "credentials.json"));

//export constants
export const suffix = ".wheel";
export const projectJsonFilename = "prj.wheel.json";
export const componentJsonFilename = "cmp.wheel.json";
export const statusFilename = "status.wheel.txt";
export const jobManagerJsonFilename = "jm.wheel.json";
export const filesJsonFilename = "files.wheel.json";
export const defaultPSconfigFilename = "parameterSetting.json";
export const userDBFilename = "user.db";
export const userDBDir = process.env.WHEEL_USER_DB_DIR || __dirname;

export const keyFilename = !process.env.WHEEL_USE_HTTP ? getConfigFile("server.key", true) : undefined;
export const certFilename = !process.env.WHEEL_USE_HTTP ? getConfigFile("server.crt", true) : undefined;

export { logFilename };
export { credentialFilename };

export const rsyncExcludeOptionOfWheelSystemFiles = [
  `--exclude=**/${projectJsonFilename}`,
  `--exclude=**/${componentJsonFilename}`,
  `--exclude=**/${statusFilename}`,
  `--exclude=**/${jobManagerJsonFilename}`,
  `--exclude=**/${filesJsonFilename}`,
  `--exclude=**/${defaultPSconfigFilename}`,
  `--exclude=**/${logFilename}`
];

//re-export server settings
export const port = parseInt(process.env.WHEEL_PORT, 10) || config.port; //default var will be calcurated in app/index.js
export const rootDir = getStringVar(config.rootDir, getStringVar(os.homedir(), "/"));
export const defaultCleanupRemoteRoot = getVar(config.defaultCleanupRemoteRoot, true);
export const numLogFiles = getIntVar(config.numLogFiles, 5);
export const maxLogSize = getIntVar(config.maxLogSize, 8388608);
export const compressLogFile = getVar(config.compressLogFile, true);
export const numJobOnLocal = parseInt(process.env.WHEEL_NUM_LOCAL_JOB, 10) || getIntVar(config.numJobOnLocal, 1);
export const defaultTaskRetryCount = getIntVar(config.defaultTaskRetryCount, 1);
export const gitLFSSize = getIntVar(config.gitLFSSize, 200);

//export setting files
export { jobScheduler };
export const remoteHost = new JsonArrayManager(remotehostFilename);

//Migrate old string queue format to array
for (const host of remoteHost.data) {
  if (typeof host.queue === "string") {
    host.queue = host.queue.split(",").map((e)=>{ return e.trim(); })
      .filter((e)=>{ return e.length > 0; });
  }
}
await remoteHost.write();

export const jobScriptTemplate = new JsonArrayManager(jobScriptTemplateFilename);
export const projectList = new JsonArrayManager(projectListFilename);

/**@internal exported for unit testing only */
export const _internal = { loadWheelConfig };
