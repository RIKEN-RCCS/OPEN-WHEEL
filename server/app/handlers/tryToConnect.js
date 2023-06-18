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

/**
 * try to connect remote host via ssh
 * @param {Hostinfo} hostInfo - target host
 * @param {string} password - password or passphrase for private key
 * @param {Function} cb - call back function called with string "success" or "error"
 */
async function tryToConnect(hostInfo, password, cb) {
  hostInfo.password = password;
  const arssh = new SshClientWrapper(hostInfo);
  logger.debug("try to connect", hostInfo.host, ":", hostInfo.port);
  arssh.canConnect(2)
    .then(()=>{
      cb("success");
    })
    .catch((err)=>{
      logger.error("tryToConnect failed with", err);
      cb("error");
    });
}

async function onTryToConnectById(id, password, cb) {
  const hostInfo = remoteHost.get(id);
  await tryToConnect(hostInfo, password, cb);
}

module.exports = {
  onTryToConnectById,
  onTryToConnect: tryToConnect
};
