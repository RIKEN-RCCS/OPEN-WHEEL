/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import path from "path";
import fs from "fs-extra";

//DO NOT require any other WHEEL modules in this file

//NG
export const reWin32ReservedNames = /^(CON|PRN|AUX|NUL|CLOCK$|COM[0-9]|LPT[0-9])\..*$/i;
const reOnlyWhilteSpace = /^\s*$/;
//OK
const alphanumeric = "a-zA-Z0-9";
//due to escapeRegExp's spec, bars must be added separately any other regexp strings
const bars = "_\\-";
export const pathseps = "/\\";
export const metaCharactors = "*?[]{}()!?+@.";

const reMustBeEscapedChars = /([.*+?^=!:${}()|[\]/\\])/g;

/**
 * escape meta character of regex (from MDN)
 * please note that this function can not treat '-' in the '[]'
 * @param {string} target - target string which will be escaped
 * @returns {string} escaped regex string
 */
export function escapeRegExp(target) {
  return target.replace(reMustBeEscapedChars, "\\$1");
}

/**
 * check if specified name is sane
 * @param {string} name - name to be checked
 * @returns {boolean} -
 */
function isSane(name) {
  if (typeof name !== "string") {
    return false;
  }
  if (reOnlyWhilteSpace.test(name)) {
    return false;
  }
  if (reWin32ReservedNames.test(name)) {
    return false;
  }
  return true;
}

/**
 * determin specified name is valid file or directory name or not
 * @param {string} name - name to be checked
 * @returns {boolean} - return true if it is ok
 */
export function isValidName(name) {
  if (!isSane(name)) {
    return false;
  }

  const forbidonChars = new RegExp(`[^${escapeRegExp(alphanumeric) + bars}]`);
  if (forbidonChars.test(name)) {
    return false;
  }
  return true;
}

/**
 * determin specified name is valid for inputFilename
 * @param {string} name - name to be checked
 * @returns {boolean} - return true if it is ok
 */
export function isValidInputFilename(name) {
  if (!isSane(name)) {
    return false;
  }

  const forbidonChars = new RegExp(`[^${escapeRegExp(`${alphanumeric + pathseps}.`) + bars + "{}"}]`);

  //ignore white space between {{ and }}
  const modifiedName = name.replace(/\{\{.*?\}\}/g, "");
  if (forbidonChars.test(modifiedName)) {
    return false;
  }
  return true;
}

/**
 * determin specified name is valid for outputputFilename
 * @param {string} name - name to be checked
 * @returns {boolean} - return true if it is ok
 */
export function isValidOutputFilename(name) {
  if (!isSane(name)) {
    return false;
  }
  const forbidonChars = new RegExp(`[^${escapeRegExp(alphanumeric + pathseps + metaCharactors) + bars + "{}"}]`);

  //ignore white space between {{ and }}
  const modifiedName = name.replace(/\{\{.*?\}\}/g, "");
  if (forbidonChars.test(modifiedName)) {
    return false;
  }
  return true;
}

/**
 * get date as string
 * @param {boolean} humanReadable - option flag for using delimiters(/and:) or not
 * @param {boolean} withMilliseconds - option flag for time resolution
 * @returns {string} - string form of the date
 */
export function getDateString(humanReadable = false, withMilliseconds = false) {
  const now = new Date();
  const yyyy = `0000${now.getFullYear()}`.slice(-4);
  const month = now.getMonth() + 1;
  const mm = `00${month}`.slice(-2);
  const dd = `00${now.getDate()}`.slice(-2);
  const HH = `00${now.getHours()}`.slice(-2);
  const MM = `00${now.getMinutes()}`.slice(-2);
  const ss = `00${now.getSeconds()}`.slice(-2);
  const ms = `000${now.getMilliseconds()}`.slice(-3);
  if (humanReadable) {
    return withMilliseconds ? `${yyyy}/${mm}/${dd}-${HH}:${MM}:${ss}.${ms}` : `${yyyy}/${mm}/${dd}-${HH}:${MM}:${ss}`;
  }
  return withMilliseconds ? `${yyyy}${mm}${dd}-${HH}${MM}${ss}${ms}` : `${yyyy}${mm}${dd}-${HH}${MM}${ss}`;
}

/**
 * split each element of array of string by '\n' and flatten
 * @param {string[]} outputArray - array of string which can have multiline in one elemetnt
 * @returns {string[]} -
 */
export function formatSshOutput(outputArray) {
  const rt = [];
  for (const e of outputArray) {
    rt.push(...e.split("\n"));
  }
  return rt.filter((e)=>{
    return e !== "";
  });
}

/**
 * write JSON data to file with 4 space indent
 * @param {filename} filename - filename
 * @param {object} data - JSON data to be written
 * @returns {Promise} - resolved when writing is done
 */
export function writeJsonWrapper(filename, data) {
  return fs.writeJson(filename, data, { spaces: 4 });
}

/**
 * check feather given token is surrounded by { and }
 * @param {string} token - string to be checked
 * @returns {boolean} - true if token is surrounded by {}
 */
export function isSurrounded(token) {
  return token.startsWith("{") && token.endsWith("}");
};

/**
 * remove heading '{' and trailing '}'
 * @param {string} token - string to be checked
 * @returns {string} - trimed token
 */
export function trimSurrounded(token) {
  if (!isSurrounded(token)) {
    return token;
  }
  const rt = /{+(.*)}+/.exec(token);
  return (Array.isArray(rt) && typeof rt[1] === "string") ? rt[1] : token;
};

/**
 * transform grob string to array
 * @param {string} token - grob pattern
 * @returns {string[]} -
 */
export function glob2Array(token) {
  return trimSurrounded(token).split(",");
}

/**
 * remove trailing path sep from string
 * @param {string} filename - string possibly with trailing path sep
 * @returns {string} - string without trailing path sep
 */
export function removeTrailingPathSep(filename) {
  if (filename.endsWith(path.sep)) {
    return removeTrailingPathSep(filename.slice(0, -1));
  }
  return filename;
};

/**
 * determine if port number setting means default ssh port
 * @param {*} port - port number
 * @returns {boolean} -
 */
export function isDefaultPort(port) {
  return typeof port === "undefined" || port === 22 || port === "22" || port === "";
}

/**
 * make directory with non-duplicated name
 * @param {string} basename - dirname
 * @param {string} argSuffix -   number
 * @returns {string} - actual directory name
 *
 * makeDir create "basenme+suffix" direcotry. suffix is increased until the dirname is no longer duplicated.
 */
export async function makeDir(basename, argSuffix) {
  let suffix = argSuffix;
  while (await fs.pathExists(basename + suffix)) {
    ++suffix;
  }

  const dirname = basename + suffix;
  await fs.mkdir(dirname);
  return dirname;
}
