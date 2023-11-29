/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const SshClientWrapper = require("ssh-client-wrapper");
const { getLogger } = require("../logSettings");
const logger = getLogger();
const { remoteHost } = require("../db/db");
const { askPassword } = require("../core/sshManager.js");

/**
 * try to connect remote host via ssh
 * @param {string} clientID - socketIO client's ID string
 * @param {Hostinfo} hostInfo - target host
 * @param {Function} cb - call back function called with string "success" or "error"
 */
async function tryToConnect(clientID, hostInfo, cb) {
  hostInfo.password = askPassword.bind(null, clientID, `${hostInfo.name} - password`);
  hostInfo.passphrase = askPassword.bind(null, clientID, `${hostInfo.name} - passpharse`);

  if (process.env.WHEEL_VERBOSE_SSH) {
    hostInfo.sshOpt = ["-vvv"];
  }
  const ssh = new SshClientWrapper(hostInfo);
  logger.debug(`try to connect ${hostInfo.username}@${hostInfo.host}:${hostInfo.port}`);

  try {
    await ssh.canConnect(120);
  } catch (err) {
    if(err.reason === "CANCELED"){
      logger.info("tryToConnect canceled by user");
      return cb("canceled")
    }
    logger.error("tryToConnect failed with", err);
    return cb("error");
  }
  ssh.disconnect();
  return cb("success");
}

async function onTryToConnectById(clientID, id, cb) {
  const hostInfo = remoteHost.get(id);
  await tryToConnect(clientID, hostInfo, cb);
}

module.exports = {
  onTryToConnectById,
  onTryToConnect: tryToConnect
};
