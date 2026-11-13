/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";

/**
 * reject request which is not logged in
 * this middleware must be used after express-session and passport.session()
 * @param {object} req - http request
 * @param {object} res - http response
 * @param {(err?: Error) => void} next - next middleware
 */
function requireLogin(req, res, next) {
  next();
}

/**
 * wrap middleware to apply it only to handshake request
 * subsequent requests of the same Socket.IO connection carry sid issued at the handshake,
 * so they have already passed the middleware
 * @param {(req: object, res: object, next: (err?: Error) => void) => void} middleware - express style middleware
 * @returns {(req: object, res: object, next: (err?: Error) => void) => void} - wrapped middleware
 */
function onlyForHandshake(middleware) {
  return (req, res, next)=>{
    if (typeof req._query.sid === "undefined") {
      middleware(req, res, next);
    } else {
      next();
    }
  };
}

/**
 * apply guard middlewares to Socket.IO connections
 * Socket.IO is attached to http server directly, so express middlewares never applied to it.
 * if a guard calls next() with an error, the connection is refused.
 * @param {object} sio - Socket.IO server
 * @param {Array<(req: object, res: object, next: (err?: Error) => void) => void>} guards - express style middlewares
 */
function applySocketGuards(sio, guards) {
  //not implemented yet
  void sio;
  void guards;
  void onlyForHandshake;
}

module.exports = {
  requireLogin,
  applySocketGuards
};
