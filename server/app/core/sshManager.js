/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const SshClientWrapper = require("ssh-client-wrapper");
const { emitAll } = require("../handlers/commUtils.js");

const _internal = {
  db: new Map(),
  SshClientWrapper,
  addSsh,
  getSsh,
  hasEntry,
  askPassword,
  emitAll
};

/**
 * check if db contains ssh object for the project
 * @param {string} projectRootDir - project's root path
 * @param {string} id - key string
 * @returns {boolean} - 
 */
function hasEntry(projectRootDir, id) {
  if (_internal.db.has(projectRootDir)) {
    return _internal.db.get(projectRootDir).has(id);
  }
  return false;
}
_internal.hasEntry = hasEntry;

/**
 * keep ssh instance and its setting at the time the connection was wstablished
 * @param {string} projectRootDir - project's root path
 * @param {object} hostinfo - one of the ssh connection setting in remotehost json
 * @param {object} ssh -  ssh connection instance
 * @param {string} pw - password
 * @param {string} ph - passphrase
 * @param {boolean} isStorage - whether this host is also used for remote storage component or not
 */
function addSsh(projectRootDir, hostinfo, ssh, pw, ph, isStorage) {
  if (!_internal.db.has(projectRootDir)) {
    _internal.db.set(projectRootDir, new Map());
  }
  _internal.db.get(projectRootDir).set(hostinfo.id, { ssh, hostinfo, pw, ph, isStorage });
}
_internal.addSsh = addSsh;

/**
 * get ssh instance from pool
 * @param {string} projectRootDir - project's root path
 * @param {string} id - id value of hostinfo
 * @returns {object} - ssh instance
 */
function getSsh(projectRootDir, id) {
  if (!_internal.hasEntry(projectRootDir, id)) {
    const err = new Error("ssh instance is not registerd for the project");
    err.projectRootDir = projectRootDir;
    err.id = id;
    throw err;
  }
  return _internal.db.get(projectRootDir).get(id).ssh;
}
_internal.getSsh = getSsh;

/**
 * get ssh setting
 * @param {string} projectRootDir - project's root path
 * @param {string} id - id value of hostinfo
 * @returns {object} - hostinfo object for specified ssh connection
 */
function getSshHostinfo(projectRootDir, id) {
  if (!_internal.hasEntry(projectRootDir, id)) {
    const err = new Error("hostinfo is not registerd for the project");
    err.projectRootDir = projectRootDir;
    err.id = id;
    throw err;
  }
  return _internal.db.get(projectRootDir).get(id).hostinfo;
}

/**
 * get password
 * @param {string} projectRootDir - project's root path
 * @param {string} id - id value of hostinfo
 * @returns {string | Function} - password or password handler
 */
function getSshPW(projectRootDir, id) {
  if (!_internal.hasEntry(projectRootDir, id)) {
    const err = new Error("hostinfo is not registerd for the project");
    err.projectRootDir = projectRootDir;
    err.id = id;
    throw err;
  }
  return _internal.db.get(projectRootDir).get(id).pw;
}

/**
 * get passphrase
 * @param {string} projectRootDir - project's root path
 * @param {string} id - id value of hostinfo
 * @returns {string | Function} - passphrase or passphrase handler
 */
function getSshPH(projectRootDir, id) {
  if (!_internal.hasEntry(projectRootDir, id)) {
    const err = new Error("hostinfo is not registerd for the project");
    err.projectRootDir = projectRootDir;
    err.id = id;
    throw err;
  }
  return _internal.db.get(projectRootDir).get(id).ph;
}

/**
 * disconnect ssh and remove existing entry
 * @param {string} projectRootDir - project's root path
 */
function removeSsh(projectRootDir) {
  const target = _internal.db.get(projectRootDir);
  if (!target) {
    return;
  }
  let clearDB = true;
  for (const e of target.values()) {
    if (e.isStorage || e.isGfarm) {
      clearDB = false;
      continue;
    }
    e.ssh.disconnect();
  }
  if (clearDB) {
    _internal.db.get(projectRootDir).clear();
  }
}

/**
 * ask password to client
 * @param {string} clientID - socket's ID
 * @param {string} hostname - hostname which request password
 * @param {string} mode - password or passphrase
 * @param {string | null} JWTServerURL - URL of JWT server if requesting JWT-server passphrase this arg must be specified
 * @returns {Promise} - resolve when get password from browser, rejected if user cancel password input
 */
function askPassword(clientID, hostname, mode, JWTServerURL = null) {
  return new Promise((resolve, reject)=>{
    _internal.emitAll(clientID, "askPassword", hostname, mode, JWTServerURL, (data)=>{
      if (data === null) {
        const err = new Error("user canceled ssh password prompt");
        err.reason = "CANCELED";
        reject(err);
      }
      resolve(data);
    });
  });
}
_internal.askPassword = askPassword;

/**
 * create necessary ssh instance
 * @param {string} projectRootDir - project's root path
 * @param {string} remoteHostName - name property in hostInfo object
 * @param {object} hostinfo - one of the ssh connection setting in remotehost json
 * @param {string} clientID - socket's ID
 * @param {boolean} isStorage - whether this host is used for remote storage component or not
 * @returns {object} - ssh instance
 */
async function createSsh(projectRootDir, remoteHostName, hostinfo, clientID, isStorage) {
  if (_internal.hasEntry(projectRootDir, hostinfo.id)) {
    return _internal.getSsh(projectRootDir, hostinfo.id);
  }

  let pw;
  if (typeof hostinfo.password !== "string") {
    hostinfo.password = async ()=>{
      if (_internal.hasEntry(projectRootDir, hostinfo.id)) {
        pw = getSshPW(projectRootDir, hostinfo.id);
        if (typeof pw === "string") {
          return pw;
        }
      }
      //pw will be used after canConnect
      pw = await _internal.askPassword(clientID, remoteHostName, "password", null);
      return pw;
    };
  } else {
    pw = hostinfo.password;
  }

  let ph;
  hostinfo.passphrase = async ()=>{
    if (_internal.hasEntry(projectRootDir, hostinfo.id)) {
      ph = getSshPH(projectRootDir, hostinfo.id);
      if (typeof ph === "string") {
        return ph;
      }
    }
    ph = await _internal.askPassword(clientID, remoteHostName, "passphrase ", null);
    return ph;
  };
  if (hostinfo.renewInterval) {
    hostinfo.ControlPersist = hostinfo.renewInterval * 60;
  }
  if (hostinfo.readyTimeout) {
    hostinfo.ConnectTimeout = Math.floor(hostinfo.readyTimeout / 1000);
  }
  if (process.env.WHEEL_VERBOSE_SSH) {
    hostinfo.sshOpt = ["-vvv"];
  }
  if (hostinfo.username) {
    if (!hostinfo.user) {
      hostinfo.user = hostinfo.username;
    }
    delete hostinfo.username;
  }
  if (!hostinfo.rcfile) {
    hostinfo.rcfile = "/etc/profile";
  }

  const ssh = new _internal.SshClientWrapper(hostinfo);
  const timeout = hostinfo.ConnectTimeout > 120 ? hostinfo.ConnectTimeout : 120;
  try {
    const success = await ssh.canConnect(timeout);
    if (success) {
      _internal.addSsh(projectRootDir, hostinfo, ssh, pw, ph, isStorage);
    }
  } catch (e) {
    if (e.reason === "CANCELED") {
      throw e;
    }
    if (e.message === "Control socket creation failed") {
      e.message += "you can avoid this error by using SSH_CONTROL_PERSIST_DIR environment variable\n";
      e.message += "please refer to https://riken-rccs.github.io/OPEN-WHEEL/attention";

      throw e;
    }
    throw new Error("ssh connection failed due to unknown reason");
  }
  return ssh;
}

module.exports = {
  addSsh,
  getSsh,
  getSshHostinfo,
  removeSsh,
  askPassword,
  createSsh,
  hasEntry,
  getSshPW,
  getSshPH
};

if (process.env.NODE_ENV === 'test') {
  module.exports._internal = _internal;
}