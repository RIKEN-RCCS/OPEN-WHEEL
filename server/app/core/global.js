/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const debug = require("debug")("wheel");
const baseURL = process.env.WHEEL_BASE_URL || "/";
const parentDirs = new Map();
const eventEmitters = new Map();
const watchers = new Map();
const checkWritePermissions = new Map();
let sio = null;

function setSio(io) {
  if (sio !== null) {
    debug("SocketIO instance duplicated!!");
  }
  sio = io;
}
function getSio() {
  return sio;
}

module.exports = {
  parentDirs,
  eventEmitters,
  watchers,
  checkWritePermissions,
  setSio,
  getSio,
  baseURL
};
