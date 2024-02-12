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

const reMustBeEscapedChars=/([.*+?^=!:${}()|[\]/\\])/g

/**
 * escape meta character of regex (from MDN)
 * please note that this function can not treat '-' in the '[]'
 * @param {string} target - target string which will be escaped
 * @returns {string} escaped regex string
 */
function escapeRegExp(target) {
  return target.replace(reMustBeEscapedChars, "\\$1");
}


function isSane (name) {
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
 * @param {strint} name - name to be checked
 * @returns {boolean} - return true if it is ok
 */
function isValidName(name) {
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
 * @param {strint} name - name to be checked
 * @returns {boolean} - return true if it is ok
 */
function isValidInputFilename(name) {
  if (!isSane(name)) {
    return false;
  }

  const forbidonChars = new RegExp(`[^${escapeRegExp(`${alphanumeric + pathseps}.`) + bars + "{}"}]`);

  //ignore white space between {{ and }}
  const modifiedName = name.replace(/\{\{.*?\}\}/g,"")
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
function isValidOutputFilename(name) {
  if (!isSane(name)) {
    return false;
  }
  const forbidonChars = new RegExp(`[^${escapeRegExp(alphanumeric + pathseps + metaCharactors) + bars + "{}"}]`);

  //ignore white space between {{ and }}
  const modifiedName = name.replace(/\{\{.*?\}\}/g,"")
  if (forbidonChars.test(modifiedName)) {
    return false;
  }
  return true;
}


module.exports = {
  escapeRegExp,
  isValidName,
  isValidInputFilename,
  isValidOutputFilename,
  reWin32ReservedNames,
  pathseps,
  metaCharactors
};
