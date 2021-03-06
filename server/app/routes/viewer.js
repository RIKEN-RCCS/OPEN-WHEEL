/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path = require("path");
const express = require("express");
const fs = require("fs-extra");

//eslint-disable-next-line new-cap
const router = express.Router();

//accept GET method only for reload case
router.get("/", async(req, res)=>{
  if (!req.dir) {
    return;
  }
  res.sendFile(path.resolve(__dirname, "../public/viewer.html"));
});
router.post("/", async(req, res)=>{
  const projectRootDir = req.body.rootDir;
  const dir = req.body.dir;
  if (!await fs.pathExists(dir)) {
    return;
  }
  res.cookie("dir", dir);
  res.cookie("rootDir", projectRootDir);
  res.sendFile(path.resolve(__dirname, "../public/viewer.html"));
});
module.exports = router;
