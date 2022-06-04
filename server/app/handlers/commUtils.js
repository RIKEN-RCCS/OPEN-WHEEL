/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License.txt in the project root for the license information.
 */
"use strict";
const { getSio } = require("../core/global.js");


/**
 * promised version of socketIO.emit()
 * @param {Function} emit - socketIO's emit()
 * this function is resolved when ack is called on opposite side
 */
async function emitWithPromise(emit, ...args) {
  return new Promise((resolve)=>{
    emit(...args, resolve);
  });
}

/**
 * emit something to all client in the room
 * @param {string} room - room ID
 *
 * memo room should be projectRootDir or individual client ID
 */
async function emitAll(room, eventName, ...args) {
  const sio = getSio();
  const sockets = await sio.in(room).fetchSockets();
  for (const socket of sockets) {
    socket.emit(eventName, ...args);
  }
}

module.exports = {
  emitWithPromise,
  emitAll
};
