/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path = require("path");
const fs = require("fs-extra");
const SshClientWrapper = require("ssh-client-wrapper");
const { convertPathSep } = require("./pathUtils");
const { emitAll } = require("../handlers/commUtils.js");

const db = new Map();

function hasEntry(projectRootDir, id) {
  if (db.has(projectRootDir)) {
    return db.get(projectRootDir).has(id);
  }
  return false;
}

/**
 * parse hostinfo and create config object of arssh2
 * @param {Object} hostInfo - one of remotehost.json's entry
 * @param {string} password - password or passphrase for private key
 */
async function createSshConfig(hostInfo, password) {
  const config = {
    host: hostInfo.host,
    port: hostInfo.port,
    keepaliveInterval: hostInfo.keepaliveInterval || 30000,
    readyTimeout: hostInfo.readyTimeout || 1000,
    username: hostInfo.username
  };

  if (hostInfo.keyFile) {
    const tmp = await fs.readFile(path.normalize(convertPathSep(hostInfo.keyFile)));
    config.privateKey = tmp.toString();

    if (password) {
      config.passphrase = password;
      config.password = null;
    }
  } else {
    config.privateKey = null;

    if (password) {
      config.passphrase = null;
      config.password = password;
    }
  }
  return config;
}

/**
 * keep ssh instance and its setting at the time the connection was wstablished
 * @param {string} projectRootDir -  full path of project root directory it is used as key index of each map
 * @param {Object} hostinfo - one of the ssh connection setting in remotehost json
 * @param {Object} ssh -  ssh connection instance
 */
function addSsh(projectRootDir, hostinfo, ssh) {
  if (!db.has(projectRootDir)) {
    db.set(projectRootDir, new Map());
  }
  db.get(projectRootDir).set(hostinfo.id, { ssh, hostinfo });
}

/**
 * get ssh instance from pool
 * @param {string} projectRootDir -  full path of project root directory it is used as key index of each map
 * @param {string} id - id value of hostinfo
 */
function getSsh(projectRootDir, id) {
  if (!hasEntry(projectRootDir, id)) {
    const err = new Error("ssh instance is not registerd for the project");
    err.projectRootDir = projectRootDir;
    err.id = id;
    throw err;
  }
  return db.get(projectRootDir).get(id).ssh;
}

/**
 * get ssh setting
 * @param {string} projectRootDir -  full path of project root directory it is used as key index of each map
 * @param {string} id - id value of hostinfo
 */
function getSshHostinfo(projectRootDir, id) {
  if (!hasEntry(projectRootDir, id)) {
    const err = new Error("hostinfo is not registerd for the project");
    err.projectRootDir = projectRootDir;
    err.id = id;
    throw err;
  }
  return db.get(projectRootDir).get(id).hostinfo;
}

/**
 * disconnect ssh and remove existing entry
 * @param {string} projectRootDir -  full path of project root directory it is used as key index of each map
 */
function removeSsh(projectRootDir) {
  const target = db.get(projectRootDir);
  if (!target) {
    return;
  }
  for (const e of target.values()) {
    e.ssh.disconnect();
  }
  db.get(projectRootDir).clear();
}

/**
 * ask password to client
 * @param {string} clientID - socket's ID
 * @param {string} hostname - name or kind of label for the host
 */
function askPassword(clientID, hostname) {
  return new Promise((resolve, reject)=>{
    emitAll(clientID, "askPassword", hostname, (data)=>{
      if (data === null) {
        const err = new Error("user canceled ssh password prompt");
        err.reason = "CANCELED";
        reject(err);
      }
      resolve(data);
    });
  });
}

/**
 * create necessary ssh instance
 * @param {string} projectRootDir -  full path of project root directory it is used as key index of each map
 * @param {string} remoteHostName - name property in hostInfo object
 * @param {Object} hostinfo - one of the ssh connection setting in remotehost json
 * @param {string} clientID - socket's ID
 */
async function createSsh(projectRootDir, remoteHostName, hostinfo, clientID) {
  if (hasEntry(projectRootDir, hostinfo.id)) {
    return getSsh(projectRootDir, hostinfo.id);
  }
  hostinfo.password = askPassword.bind(null, clientID, remoteHostName);
  const arssh = new SshClientWrapper(hostinfo);

  if (hostinfo.renewInterval) {
    arssh.renewInterval = hostinfo.renewInterval * 60 * 1000;
  }

  if (hostinfo.renewDelay) {
    arssh.renewDelay = hostinfo.renewDelay * 1000;
  }

  //remoteHostName is name property of remote host entry
  //hostinfo.host is hostname or IP address of remote host
  let failCount = 0;
  let done = false;
  while (!done) {
    try {
      done = await arssh.canConnect(2);
    } catch (e) {
      if (e.reason !== "invalid passphrase" && e.reason !== "authentication failure" && e.reason !== "invalid private key") {
        return Promise.reject(e);
      }
      ++failCount;

      if (failCount >= 3) {
        return Promise.reject(new Error(`wrong password for ${failCount} times`));
      }
      const newPassword = await askPassword(clientID, remoteHostName);

      if (config.passphrase) {
        config.passphrase = newPassword;
      }

      if (config.password) {
        config.password = newPassword;
      }
      arssh.overwriteConfig(config);
    }
  }
  addSsh(projectRootDir, hostinfo, arssh);
  return arssh;
}


module.exports = {
  addSsh,
  getSsh,
  getSshHostinfo,
  removeSsh,
  createSshConfig,
  askPassword,
  createSsh
};
