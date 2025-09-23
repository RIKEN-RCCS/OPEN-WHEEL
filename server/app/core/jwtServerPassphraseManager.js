/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";

const jwtdb = new Map();

/**
 * set JWT-agent passphrase
 * @param {string} projectRootDir - project's root path
 * @param {string} URL - JWT server's URL
 * @param {string} user - username on JWT server
 * @param {string} JWTServerPassphrase - passphrase for JWT server
 */
function setJWTServerPassphrase(projectRootDir, URL, user, JWTServerPassphrase) {
  const id = `${URL}_${user}`;
  if (!jwtdb.has(projectRootDir)) {
    jwtdb.set(projectRootDir, new Map());
  }
  jwtdb.get(projectRootDir).set(id, JWTServerPassphrase);
}

/**
 * get JWTServer passphrase
 * @param {string} projectRootDir - project's root path
 * @param {string} URL - JWT server's URL
 * @param {string} user - username on JWT server
 * @returns {string } - passphrase
 */
function getJWTServerPassphrase(projectRootDir, URL, user) {
  const id = `${URL}_${user}`;
  if (!jwtdb.has(projectRootDir) || !jwtdb.get(projectRootDir).has(id)) {
    const err = new Error("hostinfo is not registerd for the project");
    err.projectRootDir = projectRootDir;
    err.id = id;
    throw err;
  }

  return jwtdb.get(projectRootDir).get(id);
}

/**
 * remove all entry linked project
 * @param {string} projectRootDir - project's root path
 */
function removeAllJWTServerPassphrase(projectRootDir) {
  const target = jwtdb.get(projectRootDir);
  if (typeof target === "undefined") {
    //if jwt-agent is already running on csgw before project started
    //jwtdb does not have password map for this project
    //so, just return in such case
    return;
  }
  target.clear();
}

module.exports = {
  setJWTServerPassphrase,
  getJWTServerPassphrase,
  removeAllJWTServerPassphrase
};
