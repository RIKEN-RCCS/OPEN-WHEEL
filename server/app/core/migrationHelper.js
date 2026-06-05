/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import os from "os";
import path from "path";
import fs from "fs-extra";

/**
 * Map of old server.json property names to their new names.
 * Used by migrateConfigFile to rewrite user config files at startup.
 */
const PROP_RENAMES = {
  numJobOnLocal: "numLocalJob"
};

/**
 * Map of deprecated environment variable names to their replacements.
 * Used by warnDeprecatedEnvVars to alert users at startup.
 * These variables no longer map to any config property and have no effect.
 */
const DEPRECATED_ENV_VARS = {
  WHEEL_LOGLEVEL: "WHEEL_LOG_LEVEL"
};

/**
 * Migrate old property names in a JSON config file to new names.
 * Skips silently if the file does not exist (ENOENT).
 * If both the old and new property are present, keeps the new value and removes the old.
 * @param {string} filePath - absolute path to the JSON config file
 * @returns {Promise<void>}
 */
async function migrateConfigFile(filePath) {
  let raw;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch (e) {
    if (e.code === "ENOENT") {
      return;
    }
    throw e;
  }

  let obj;
  try {
    obj = JSON.parse(raw);
  } catch (e) {
    console.warn(`[WHEEL migration] Warning: could not parse ${filePath} — skipping migration: ${e.message}`);
    return;
  }

  let changed = false;
  for (const [oldProp, newProp] of Object.entries(PROP_RENAMES)) {
    if (Object.prototype.hasOwnProperty.call(obj, oldProp)) {
      if (Object.prototype.hasOwnProperty.call(obj, newProp)) {
        console.warn(`[WHEEL migration] ${filePath}: both "${oldProp}" and "${newProp}" found. Keeping "${newProp}" and removing "${oldProp}".`);
      } else {
        console.warn(`[WHEEL migration] ${filePath}: renamed property "${oldProp}" → "${newProp}".`);
        obj[newProp] = obj[oldProp];
      }
      delete obj[oldProp];
      changed = true;
    }
  }

  if (changed) {
    await fs.writeFile(filePath, `${JSON.stringify(obj, null, 2)}\n`, "utf8");
  }
}

/**
 * Check environment variables for deprecated WHEEL_ names and warn via console.warn.
 * These variables are no longer recognized by the auto-mapper and have no effect.
 * @returns {void}
 */
function warnDeprecatedEnvVars() {
  for (const [oldVar, newVar] of Object.entries(DEPRECATED_ENV_VARS)) {
    if (Object.prototype.hasOwnProperty.call(process.env, oldVar)) {
      console.warn(`[WHEEL migration] Deprecated environment variable "${oldVar}" is set but has no effect. Use "${newVar}" instead.`);
    }
  }
}

/**
 * Run all startup migrations:
 * 1. Migrate server.json property names in user config directories.
 * 2. Warn about deprecated environment variables.
 * Looks for server.json in WHEEL_CONFIG_DIR (if set) and ~/.wheel/.
 * @returns {Promise<void>}
 */
async function runMigrations() {
  const configDirs = [
    path.resolve(os.homedir(), ".wheel")
  ];
  if (typeof process.env.WHEEL_CONFIG_DIR === "string") {
    configDirs.push(path.resolve(process.env.WHEEL_CONFIG_DIR));
  }

  for (const dir of configDirs) {
    await migrateConfigFile(path.join(dir, "server.json"));
  }

  warnDeprecatedEnvVars();
}

export { migrateConfigFile, warnDeprecatedEnvVars, runMigrations, PROP_RENAMES, DEPRECATED_ENV_VARS };
