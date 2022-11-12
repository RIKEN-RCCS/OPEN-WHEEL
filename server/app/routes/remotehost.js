/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path = require("path");

module.exports = (req, res)=>{
  const baseURL = process.env.WHEEL_BASE_URL || "/";
  res.cookie("socketIOPath", baseURL);
  res.sendFile(path.resolve(__dirname, "../public/remotehost.html"));
};
