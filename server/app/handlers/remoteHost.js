/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import { getLogger } from "../logSettings.js";
const logger = getLogger();

import { remotehostJsonSchema } from "../db/remotehostJsonSchema.js";
import { remoteHost } from "../db/db.js";
import Ajv from "ajv";
import addFormats from "ajv-formats";

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

addFormats(ajv, ["uri"]);

const validate = ajv.compile(remotehostJsonSchema);

async function validateHostSetting(newHost) {
  Object.keys(newHost).forEach((prop)=>{
    if (newHost[prop] === null) {
      delete newHost[prop];
    }
  });
  validate(newHost);
  if (validate !== null && Array.isArray(validate.errors)) {
    const missingRequiredKey = validate.errors.includes((e)=>{
      return e.keyword === "required";
    });
    if (missingRequiredKey) {
      logger.warn("addHost failed due to validation error");
      return false;
    }
  }
  if (newHost.useGfarm) {
    if (typeof newHost.JWTServerUser !== "string" || newHost.JWTServerUser === "") {
      logger.warn("addHost failed because JWTServerUser is not set even though useGfarm is set");
      return false;
    }
    if (typeof newHost.JWTServerURL !== "string" || newHost.JWTServerURL === "") {
      logger.warn("addHost failed because JWTServerURL is not set even though useGfarm is set");
      return false;
    }
  }
  return true;
}

export async function onAddHost(socket, newHost, cb) {
  if (!await validateHostSetting(newHost)) {
    cb(false);
  }
  const id = await remoteHost.unshift(newHost);
  socket.emit("hostList", remoteHost.getAll());//for workflow screen's handler
  return cb(id);
}
export async function onCopyHost(socket, id, cb) {
  await remoteHost.copy(id);
  socket.emit("hostList", remoteHost.getAll());//for workflow screen's handler
  cb(remoteHost.get(id));
}
export async function onGetHostList(cb) {
  const hostList = remoteHost.getAll();
  hostList.forEach((hostInfo)=>{
    if (hostInfo.username) {
      if (!hostInfo.user) {
        hostInfo.user = hostInfo.username;
      }
      delete hostInfo.username;
    }
  });
  cb(hostList);
}
export async function onUpdateHost(socket, updatedHost, cb) {
  if (updatedHost.username) {
    if (!updatedHost.user) {
      updatedHost.user = updatedHost.username;
    }
    delete updatedHost.username;
  }
  if (!await validateHostSetting(updatedHost)) {
    cb(false);
  }

  await remoteHost.update(updatedHost, true);
  socket.emit("hostList", remoteHost.getAll());//for workflow screen's handler
  return cb(updatedHost.id);
}

export async function onRemoveHost(socket, id, cb) {
  await remoteHost.remove(id);
  socket.emit("hostList", remoteHost.getAll());//for workflow screen's handler
  cb(true);
}
