/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import path from "path";
import passport from "passport";
import { Strategy } from "passport-local";
import { isValidUser } from "../core/auth.js";
import { baseURL } from "../core/global.js";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

passport.use(new Strategy(
  async function verify(username, password, cb) {
    const userData = await isValidUser(username, password);
    if (userData) {
      return cb(null, userData);
    }
    return cb(null, false, { message: "Incorrect username or password" });
  })
);

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    cb(null, { id: user.id, username: user.username });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

export function get(req, res) {
  return res.sendFile(path.resolve(__dirname, "../public/login.html"));
}
export const post = passport.authenticate("local", {
  successReturnToOrRedirect: baseURL,
  failureRedirect: `${baseURL}login`,
  keepSessionInfo: true
});