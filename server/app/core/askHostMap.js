/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const { emitAll } = require("../handlers/commUtils.js");
const { remoteHost } = require("../db/db.js");

/**
 * determine hostMap is valid
 * @param {object} hostMap - old and new remotehost label map
 * @param {string[]} hosts - array of old remoteshot labels
 * @returns {boolean} -
 */
function isValidHostMap(hostMap, hosts) {
  const remotehostLabels = remoteHost.getAll().map((host)=>{
    return host.name;
  });
  const oldRemotehostLabels = hosts.map((host)=>{
    return host.hostname;
  });
  return Object.entries(hostMap).some(([oldHost, newHost])=>{
    if (typeof newHost !== "string") {
      return false;
    }
    if (!oldRemotehostLabels.includes(oldHost)) {
      return false;
    }
    if (!remotehostLabels.includes(newHost)) {
      return false;
    }
    return true;
  });
}

/**
 * ask how to map host settings to user
 * @param {string} clientID - socket's ID
 * @param {string[]} hosts - array of remotehost label
 * @returns {Promise} - resolve with hostMap. reject if user cancelled
 */
async function askHostMap(clientID, hosts) {
  return new Promise((resolve, reject)=>{
    emitAll(clientID, "askHostMap", hosts, (hostMap)=>{
      if (hostMap === null) {
        const err = new Error("user canceled host map input");
        err.reason = "CANCELED";
        reject(err);
        return;
      }
      if (!isValidHostMap(hostMap, hosts)) {
        const err = new Error("invalid host map");
        err.reason = "INVALID";
        reject(err);
        return;
      }
      //hostMap is flat object. which keys are old host label, value is new host label
      resolve(hostMap);
    });
  });
}

module.exports = {
  askHostMap
};
