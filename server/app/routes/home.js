/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path = require("path");
const { rootDir } = require("../db/db");
const express = require("express");

//eslint-disable-next-line new-cap
const router = express.Router();

router.get("/", (req, res)=>{
  res.cookie("home", rootDir);
  res.cookie("pathSep", path.sep);

  res.sendFile(path.join(__dirname, "../public/home.html"));
});
module.exports = router;
