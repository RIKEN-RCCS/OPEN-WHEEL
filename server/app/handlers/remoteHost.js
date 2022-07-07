/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const { remoteHost } = require("../db/db");

async function onAddHost(socket, newHost, cb) {
  const id = await remoteHost.unshift(newHost);
  socket.emit("hostList", remoteHost.getAll());//for workflow screen's handler
  cb(id);
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
  await remoteHost.update(updatedHost);
  socket.emit("hostList", remoteHost.getAll());//for workflow screen's handler
  cb(updatedHost.id);
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
