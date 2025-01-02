/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";

//NG
const reWin32ReservedNames = /^(CON|PRN|AUX|NUL|CLOCK$|COM[0-9]|LPT[0-9])\..*$/i;
const reOnlyWhilteSpace = /^\s*$/;
//OK
const alphanumeric = "a-zA-Z0-9";
//due to escapeRegExp's spec, bars must be added separately any other regexp strings
const bars = "_\\-";
const pathseps = "/\\";
const metaCharactors = "*?[]{}()!?+@.";

/**
 * escape meta character of regex (from MDN)
 * please note that this function can not treat '-' in the '[]'
 * @param {string} target - target string which will be escaped
 * @returns {string} escaped regex string
 */
function escapeRegExp(target) {
  //eslint-disable-next-line no-useless-escape
  return target.replace(/([.*+?^=!:${}()|[\]\/\\])/g, "\\$1");
}

/**
 * check if specified name is generally valid for filename
 * @param {string} name - string to be checked
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
 * remove one entry from array
 * @param {object[] | string[]} array - target array
 * @param {object | string} target - element to be removed
 * @param {string[]} prop - element's property which to be used at compare
 * @returns {number} - removed element's index
 */
export function removeFromArray(array, target, prop) {
  const targetIndex = array.findIndex((e)=>{
    if (typeof prop === "string") {
      return e[prop] === target[prop];
    }
    return e === target;
  });
  if (targetIndex !== -1) {
    array.splice(targetIndex, 1);
  }
  return targetIndex;
}

/**
 * check feather given token is surrounded by { and }
 * @param {string} token - string to be checked
 * @returns {boolean} -
 */
export function isSurrounded(token) {
  return token.startsWith("{") && token.endsWith("}");
}

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
}

/**
 * transform grob string to array
 * @param {string} token - grob pattern
 */
export function glob2Array(token) {
  return trimSurrounded(token).split(",");
}

/**
 * construct glob pattern from array of glob patterns
 * @param {string []} tokens - array of grlob patterns
 * @returns {string} - glob pattern
 */
export function array2Glob(tokens) {
  const concatenatedString = tokens.reduce((a, c)=>{
    return `${a},${c}`;
  });
  return `{${concatenatedString}}`;
}

/**
 * add glob pattern to existing glob
 * @param {string} old - glob pattern
 * @param {string} added - new glob pattern to be added
 * @returns {string} - combined glob pattern
 */
export function addGlobPattern(old, added) {
  //for the first time
  if (typeof old !== "string" || old === "") {
    return added;
  }
  //only one entry in include
  if (!isSurrounded(old)) {
    return `{${old},${added}}`;
  }

  //more than one entry in include
  const tmp = glob2Array(old);
  tmp.push(added);
  return array2Glob(tmp);
}

/**
 * remove part of globpattern
 * @param {string} glob  - glob pattern to be modified
 * @param {string} token - part of glob pattern to be removed
 * @param {number} index - position of glob pattern to be removed
 * @returns {string} - new glob pattern
 */
export function removeGlobPattern(glob, token, index) {
  const globArray = glob2Array(glob);
  if (globArray.length <= 1) {
    return null;
  }
  globArray.splice(index, 1);
  return globArray.length === 1 ? globArray[0] : array2Glob(globArray);
}

/**
 * update part of glob
 * @param {string} glob  - glob pattern to be modified
 * @param {string} token - new part of glob
 * @param {number} index - position of glob pattern to be replaced
 * @returns {string} - new glob pattern
 */
export function updateGlobPattern(glob, token, index) {
  const globArray = glob2Array(glob);
  if (globArray.length <= 1) {
    return null;
  }
  globArray[index] = token;
  return globArray.length === 1 ? globArray[0] : array2Glob(globArray);
}
