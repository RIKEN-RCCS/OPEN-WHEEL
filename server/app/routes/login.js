/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path = require("path");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const {isValidUser} = require("../core/auth.js");
const { baseURL } = require("../core/global.js");

passport.use(new LocalStrategy(
  async function verify(username, password, cb){
    const userData=await isValidUser(username, password);
    if(userData){
      return cb(null, userData);
    }
    return cb(null, false, {message: "Incorrect username or password"})
  })
);

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

module.exports = {
  get: (req, res)=>{
    return res.sendFile(path.resolve(__dirname, "../public/login.html"));
  },
  post: passport.authenticate("local", {
    successReturnToOrRedirect: baseURL,
    failureRedirect: `${baseURL}/login`,
    keepSessionInfo: true
  })
}
