/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
import debugLib from "debug";
const debug = debugLib("wheel");
export { baseURL } from "../db/db.js";
//workflow paths which are displayed on graphview
//projectRootDir -> Map(clientID -> displayed component dir)
//each client may display a different level of the same project at the same time
const parentDirs = new Map();
const eventEmitters = new Map(); //event emitter object which is used to communicate while running project
const watchers = new Map(); //result file watcher
const checkWritePermissions = new Map(); //remotehosts to be checked whthere user has write permission or not
let sio = null; //Singleton SocketIO instance

/**
 * store SocketIO instance
 * @param {object} io - SocketIO instance
 */
function setSio(io) {
  if (sio !== null) {
    debug("SocketIO instance duplicated!!");
  }
  sio = io;
}

/**
 * get SocketIO instance
 * @returns {object} - stored SocketIO instance or null if not yet stored
 */
function getSio() {
  return sio;
}

/**
 * record the component dir which is displayed by the client
 * @param {string} projectRootDir - project's root path
 * @param {string} clientID - socket.io client ID
 * @param {string} dir - displayed component dir
 */
function setParentDir(projectRootDir, clientID, dir) {
  if (!parentDirs.has(projectRootDir)) {
    parentDirs.set(projectRootDir, new Map());
  }
  parentDirs.get(projectRootDir).set(clientID, dir);
}

/**
 * get all component dirs which are displayed by any client
 * @param {string} projectRootDir - project's root path
 * @returns {string[]} - displayed component dirs without duplication
 */
function getParentDirs(projectRootDir) {
  const dirs = parentDirs.get(projectRootDir);
  return dirs ? Array.from(new Set(dirs.values())) : [];
}

/**
 * forget the displayed component dirs of the client (e.g. on disconnect)
 * @param {string} clientID - socket.io client ID
 */
function removeParentDirsOfClient(clientID) {
  for (const [projectRootDir, dirs] of parentDirs) {
    dirs.delete(clientID);
    if (dirs.size === 0) {
      parentDirs.delete(projectRootDir);
    }
  }
}

export {
  parentDirs,
  setParentDir,
  getParentDirs,
  removeParentDirsOfClient,
  eventEmitters,
  watchers,
  checkWritePermissions,
  setSio,
  getSio
};
