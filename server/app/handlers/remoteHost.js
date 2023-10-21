/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const { getLogger } = require("../logSettings.js");
const logger = getLogger();

const { remoteHost } = require("../db/db.js");
const Ajv = require("ajv");
const ajv = new Ajv({
  allErrors: true,
  removeAdditional: "all",
  useDefaults: true,
  coerceTypes: true,
  logger: {
    log: logger.debug.bind(logger),
    warn: logger.warn.bind(logger),
    error: logger.warn.bind(logger)
  }
});

const schema = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    host: { type: "string" },
    username: { type: "string" },
    port: {
      type: "number",
      minimum: 0,
      maximum: 65535
    },
    keyFile: { type: "string" },
    path: { type: "string" },
    jobScheduler: { type: "string" },
    numJob: { type: "number", default: 5, minimum: 0 },
    queue: { type: "string", default: "" },
    useBulkjob: { type: "boolean", default: false },
    useStepjob: { type: "boolean", default: false },
    sharedHost: { type: "string", default: "" },
    sharedPath: { type: "string", default: "" },
    renewInterval: { type: "number", default: 0, minimum: 0 },
    statusCheckInterval: { type: "number", default: 60, minimum: 0 },
    maxStatusCheckError: { type: "number", default: 10, minimum: 0 },
    execInterval: { type: "number", minimum: 0 },
    readyTimeout: { type: "number", minimum: 0 }
  },
  required: ["name", "host", "username"]
};
//username is not required parameter for ssh-client-wrapper
//but its default value is owner of WHEEL process on localhost
//so, it is practically required value

const validate = ajv.compile(schema);

async function onAddHost(socket, newHost, cb) {
  validate(newHost);

  if(Array.isArray(validate.errors)){
    const missingRequiredKey = validate.errors.includes((e)=>{
      return e.keyword === "required";
    });
    if (missingRequiredKey) {
      logger.warn("addHost failed due to validation error");
      return cb(false);
    }
  }
  const id = await remoteHost.unshift(newHost);
  socket.emit("hostList", remoteHost.getAll());//for workflow screen's handler
  return cb(id);
}

async function onCopyHost(socket, id, cb) {
  await remoteHost.copy(id);
  socket.emit("hostList", remoteHost.getAll());//for workflow screen's handler
  cb(remoteHost.get(id));
}

async function onGetHostList(cb) {
  cb(remoteHost.getAll());
}

async function onUpdateHost(socket, updatedHost, cb) {
  validate(updatedHost);

  if(Array.isArray(validate.errors)){
    const missingRequiredKey = validate.errors.includes((e)=>{
      return e.keyword === "required";
    });

    if (missingRequiredKey) {
      logger.warn("updateHost failed due to validation error");
      return cb(false);
    }
  }
  await remoteHost.update(updatedHost, true);
  socket.emit("hostList", remoteHost.getAll());//for workflow screen's handler
  return cb(updatedHost.id);
}

async function onRemoveHost(socket, id, cb) {
  await remoteHost.remove(id);
  socket.emit("hostList", remoteHost.getAll());//for workflow screen's handler
  cb(true);
}

module.exports = {
  onAddHost,
  onCopyHost,
  onGetHostList,
  onUpdateHost,
  onRemoveHost
};
