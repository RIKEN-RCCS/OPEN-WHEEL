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

//properties which must exist and have non-empty value
const requiredProps = remotehostJsonSchema.required;

//properties which have no default value in schema
//client can not remove these properties, so empty string is treated as a request to unset them
const unsettableProps = Object.entries(remotehostJsonSchema.properties)
  .filter(([prop, definition])=>{
    return !requiredProps.includes(prop) && !Object.hasOwn(definition, "default");
  })
  .map(([prop])=>{
    return prop;
  });

export async function validateHostSetting(newHost) {
  Object.keys(newHost).forEach((prop)=>{
    if (newHost[prop] === null) {
      delete newHost[prop];
    }
  });

  for (const prop of unsettableProps) {
    if (newHost[prop] === "") {
      delete newHost[prop];
    }
  }
  const invalidRequiredProps = requiredProps.filter((prop)=>{
    return newHost[prop] === "";
  });
  validate(newHost);
  if (Array.isArray(validate.errors)) {
    for (const e of validate.errors) {
      if (e.keyword === "required") {
        invalidRequiredProps.push(e.params.missingProperty);
      }
    }
  }
  if (invalidRequiredProps.length > 0) {
    logger.warn(`host setting rejected because required properties are missing or empty: ${invalidRequiredProps.join(", ")}`);
    return false;
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
    return cb(false);
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
    return cb(false);
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
