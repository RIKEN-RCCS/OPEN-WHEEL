/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path = require("path");
const fs = require("fs-extra");

module.exports = {
  get: async (req, res)=>{
    //accept GET method only for reload case
    if (!req.dir) {
      return;
    }
    res.sendFile(path.resolve(__dirname, "../public/viewer.html"));
  },
  post: async (req, res)=>{
    const projectRootDir = req.body.rootDir;
    const dir = req.body.dir;
    if (!await fs.pathExists(dir)) {
      return;
    }
    const baseURL = process.env.WHEEL_BASE_URL || "/";
    res.cookie("socketIOPath", baseURL);
    res.cookie("dir", dir);
    res.cookie("rootDir", projectRootDir);
    res.sendFile(path.resolve(__dirname, "../public/viewer.html"));
  }
};
