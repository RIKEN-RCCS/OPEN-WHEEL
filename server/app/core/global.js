/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const debug = require("debug")("wheel");
const baseURL = process.env.WHEEL_BASE_URL || "/";
const parentDirs = new Map(); //workflow path which is displayed on graphview
const eventEmitters = new Map(); //event emitter object which is used to communicate while running project
const watchers = new Map(); //result file watcher
const checkWritePermissions = new Map(); //remotehosts to be checked whthere user has write permission or not
let sio = null; //Singleton SocketIO instance

/**
 * store SocketIO instance
 * @param {Object} io - SocketIO instance
 */
function setSio(io) {
  if (sio !== null) {
    debug("SocketIO instance duplicated!!");
  }
  sio = io;
}

/**
 * get SocketIO instance
 * @return {Object} - stored SocketIO instance or null if not yet stored
 */
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
