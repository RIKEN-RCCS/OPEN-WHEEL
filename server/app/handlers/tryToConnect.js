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

//渡されてきたパスワードは無視してaskPassword()を呼び出す
//クライアント側も修正の必要あり

/**
 * try to connect remote host via ssh
 * @param {Hostinfo} hostInfo - target host
 * @param {Function} cb - call back function called with string "success" or "error"
 */
async function tryToConnect(clientID, hostInfo, cb) {
  //hostInfo.password = password;
  hostInfo.password = askPassword.bind(null, clientID, `${hostInfo.host} - password`);
  hostInfo.passphrase = askPassword.bind(null, clientID, `${hostInfo.host} - passpharse`);
  const ssh = new SshClientWrapper(hostInfo);
  logger.debug("try to connect", hostInfo.host, ":", hostInfo.port);
  ssh.canConnect(120)
    .then(()=>{
      cb("success");
    })
    .catch((err)=>{
      logger.error("tryToConnect failed with", err);
      cb("error");
    });
}

async function onTryToConnectById(clientID, id, cb) {
  const hostInfo = remoteHost.get(id);
  await tryToConnect(clientID, hostInfo, password, cb);
}

module.exports = {
  onTryToConnectById,
  onTryToConnect: tryToConnect
};
