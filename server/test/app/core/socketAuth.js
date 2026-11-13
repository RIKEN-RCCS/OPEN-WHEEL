/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */

import { expect } from "chai";
import { createServer } from "http";
import express from "express";
import session from "express-session";
import { Passport } from "passport";
import { IpFilter } from "express-ipfilter";
import { Server as SocketIOServer } from "socket.io";
import { io as ioc } from "socket.io-client";
import { applySocketGuards, requireLogin } from "../../../app/core/socketAuth.js";

/**
 * start http + Socket.IO server with given guard middlewares
 * @param {(sessionMiddleware: object, passport: object) => Array<object>} buildGuards - callback which returns guard middlewares for the session middleware and passport instance
 * @returns {Promise<object>} - server, sio and base URL
 */
async function startServer(buildGuards) {
  const app = express();
  const server = createServer(app);
  const sio = new SocketIOServer(server);
  const passport = new Passport();
  passport.serializeUser((user, cb)=>{
    cb(null, user);
  });
  passport.deserializeUser((user, cb)=>{
    cb(null, user);
  });
  const sessionMiddleware = session({ secret: "test", resave: false, saveUninitialized: false });
  app.use(sessionMiddleware);
  app.use(passport.initialize());
  app.use(passport.session());
  app.get("/testlogin", (req, res, next)=>{
    req.login({ id: "1", username: "anonymous" }, (err)=>{
      if (err) {
        next(err);
        return;
      }
      res.send("ok");
    });
  });
  applySocketGuards(sio, buildGuards(sessionMiddleware, passport));
  sio.on("connection", (socket)=>{
    socket.on("ping", (cb)=>{
      cb("pong");
    });
  });
  await new Promise((resolve)=>{
    server.listen(0, "127.0.0.1", resolve);
  });
  return { server, sio, url: `http://127.0.0.1:${server.address().port}` };
}

/**
 * try to call API via Socket.IO
 * @param {string} url - server URL
 * @param {string} transport - "websocket" or "polling"
 * @param {string} [cookie] - cookie header to be sent
 * @returns {Promise<string>} - "pong" if API call succeeded, "rejected" if connection was refused
 */
async function tryAPI(url, transport, cookie) {
  const socket = ioc(url, {
    transports: [transport],
    reconnection: false,
    forceNew: true,
    extraHeaders: cookie ? { cookie } : {}
  });
  try {
    return await new Promise((resolve)=>{
      socket.on("connect_error", ()=>{
        resolve("rejected");
      });
      socket.on("connect", ()=>{
        socket.timeout(2000).emit("ping", (err, rt)=>{
          resolve(err ? "timeout" : rt);
        });
      });
    });
  } finally {
    socket.close();
  }
}

/**
 * login and get session cookie
 * @param {string} url - server URL
 * @returns {Promise<string>} - cookie header value
 */
async function login(url) {
  const res = await fetch(`${url}/testlogin`);
  return res.headers.get("set-cookie").split(";")[0];
}

describe("socketAuth UT", function () {
  this.timeout(10000);
  let target;
  afterEach(async ()=>{
    if (target) {
      target.sio.close();
      target = null;
    }
  });

  describe("#applySocketGuards with login", ()=>{
    beforeEach(async ()=>{
      target = await startServer((sessionMiddleware, passport)=>{
        return [sessionMiddleware, passport.initialize(), passport.session(), requireLogin];
      });
    });

    for (const transport of ["websocket", "polling"]) {
      it(`should reject API call via ${transport} without login`, async ()=>{
        expect(await tryAPI(target.url, transport)).to.equal("rejected");
      });
      it(`should reject API call via ${transport} with unknown session cookie`, async ()=>{
        expect(await tryAPI(target.url, transport, "connect.sid=s%3Afoo.bar")).to.equal("rejected");
      });
      it(`should accept API call via ${transport} after login`, async ()=>{
        const cookie = await login(target.url);
        expect(await tryAPI(target.url, transport, cookie)).to.equal("pong");
      });
    }
  });
  describe("#applySocketGuards with IP filter", ()=>{
    for (const transport of ["websocket", "polling"]) {
      it(`should reject API call via ${transport} from not allowed address`, async ()=>{
        target = await startServer(()=>{
          return [IpFilter(["10.4.128.68"], { mode: "allow", log: false })];
        });
        expect(await tryAPI(target.url, transport)).to.equal("rejected");
      });
      it(`should accept API call via ${transport} from allowed address`, async ()=>{
        target = await startServer(()=>{
          return [IpFilter(["127.0.0.1"], { mode: "allow", log: false })];
        });
        expect(await tryAPI(target.url, transport)).to.equal("pong");
      });
    }
  });
  describe("#applySocketGuards without guards", ()=>{
    it("should accept API call when no guard is given", async ()=>{
      target = await startServer(()=>{
        return [];
      });
      expect(await tryAPI(target.url, "websocket")).to.equal("pong");
    });
  });
});
