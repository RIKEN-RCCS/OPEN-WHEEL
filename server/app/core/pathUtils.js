/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path = require("path");
const { pathseps, reWin32ReservedNames, metaCharactors, escapeRegExp } = require("../lib/utility");


/**
 * replace path separator by native path separator
 */
function convertPathSep(pathString) {
  if (path.sep === path.posix.sep) {
    return pathString.replace(new RegExp(`\\${path.win32.sep}`, "g"), path.sep);
  }
  return pathString.replace(new RegExp(path.posix.sep, "g"), path.sep);
}

/**
 * replace path.win32.sep by path.posix.sep
 */
function replacePathsep(pathString) {
  return pathString.replace(new RegExp(`\\${path.win32.sep}`, "g"), path.posix.sep);
}

/**
 * replace illegal chars as path string
 * @param {string} target - string which should be sanitized
 * @returns {string} - sanitized path
 */
function sanitizePath(target, replacer = "_") {
  //replace danger chars
  let sanitized = target.toString().replace(new RegExp(`[${escapeRegExp(`${pathseps + metaCharactors}~.=`)}]`, "g"), replacer);

  //replace win32 reserved names
  sanitized = sanitized.replace(new RegExp(reWin32ReservedNames, "gi"), replacer);

  //remove trailing replacer
  sanitized = sanitized.endsWith(replacer) ? sanitized.slice(0, -1) : sanitized;

  return sanitized;
}

module.exports = {
  convertPathSep,
  replacePathsep,
  sanitizePath
};
