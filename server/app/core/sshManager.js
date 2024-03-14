/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const SshClientWrapper = require("ssh-client-wrapper");
const { emitAll } = require("../handlers/commUtils.js");

const db = new Map();

function hasEntry(projectRootDir, id) {
  if (db.has(projectRootDir)) {
    return db.get(projectRootDir).has(id);
  }
  return false;
}

/**
 * keep ssh instance and its setting at the time the connection was wstablished
 * @param {string} projectRootDir -  full path of project root directory it is used as key index of each map
 * @param {Object} hostinfo - one of the ssh connection setting in remotehost json
 * @param {Object} ssh -  ssh connection instance
 * @param {string} pw - password
 * @param {string} ph - passphrase
 * @param {boolean} isStorage - whether this host is used for remote storage component or not
 */
function addSsh(projectRootDir, hostinfo, ssh, pw, ph, isStorage) {
  if (!db.has(projectRootDir)) {
    db.set(projectRootDir, new Map());
  }
  db.get(projectRootDir).set(hostinfo.id, { ssh, hostinfo, pw, ph, isStorage });
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
 * get password
 * @param {string} projectRootDir -  full path of project root directory it is used as key index of each map
 * @param {string} id - id value of hostinfo
 */
function getSshPW(projectRootDir, id) {
  if (!hasEntry(projectRootDir, id)) {
    const err = new Error("hostinfo is not registerd for the project");
    err.projectRootDir = projectRootDir;
    err.id = id;
    throw err;
  }
  return db.get(projectRootDir).get(id).pw;
}

/**
 * get passphrase
 * @param {string} projectRootDir -  full path of project root directory it is used as key index of each map
 * @param {string} id - id value of hostinfo
 */
function getSshPH(projectRootDir, id) {
  if (!hasEntry(projectRootDir, id)) {
    const err = new Error("hostinfo is not registerd for the project");
    err.projectRootDir = projectRootDir;
    err.id = id;
    throw err;
  }
  return db.get(projectRootDir).get(id).ph;
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
  let clearDB = true;
  for (const e of target.values()) {
    if (e.isStorage) {
      clearDB = false;
      continue;
    }
    e.ssh.disconnect();
  }
  if (clearDB) {
    db.get(projectRootDir).clear();
  }
}

/**
 * ask password to client
 * @param {string} clientID - socket's ID
 * @param {string} message - text to be shown on dialog screen at client side
 */
function askPassword(clientID, message) {
  return new Promise((resolve, reject)=>{
    emitAll(clientID, "askPassword", message, (data)=>{
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
 * @param {boolean} isStorage - whether this host is used for remote storage component or not
 */
async function createSsh(projectRootDir, remoteHostName, hostinfo, clientID, isStorage) {
  if (hasEntry(projectRootDir, hostinfo.id)) {
    return getSsh(projectRootDir, hostinfo.id);
  }

  let pw;
  hostinfo.password = async ()=>{
    if (hasEntry(projectRootDir, hostinfo.id)) {
      pw = getSshPW(projectRootDir, hostinfo.id);

      if (typeof pw === "string") {
        return pw;
      }
    }
    //pw will be used after canConnect
    pw = await askPassword(clientID, `${remoteHostName} - password`);
    return pw;
  };

  let ph;
  hostinfo.passphrase = async ()=>{
    if (hasEntry(projectRootDir, hostinfo.id)) {
      ph = getSshPH(projectRootDir, hostinfo.id);

      if (typeof ph === "string") {
        return ph;
      }
    }
    ph = await askPassword(clientID, `${remoteHostName} - passpharse`);
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
  if(hostinfo.username){
    if( !hostinfo.user){
      hostinfo.user = hostinfo.username
    }
    delete hostinfo.username
  }

  const ssh = new SshClientWrapper(hostinfo);
  const timeout = hostinfo.ConnectTimeout > 120 ? hostinfo.ConnectTimeout : 120;
  try{
    const success = await ssh.canConnect(timeout);

    if (success) {
      addSsh(projectRootDir, hostinfo, ssh, pw, ph, isStorage);
    }
  }catch(e){
    if(e.message === "Control socket creation failed"){
      e.message +="you can avoid this error by using SSH_CONTROL_PERSIST_DIR environment variable\n"
      e.message +="please refer to https://riken-rccs.github.io/OPEN-WHEEL/attention"

      throw e
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
  createSsh
};
