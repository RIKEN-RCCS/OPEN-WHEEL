/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";

const allowedOperations={
  "not-started":["runProject", "revertProject", "saveProject"],
  preparing:[],
  running:["stopProject"],
  stopped:["cleanProject", "saveProject"],
  finished:["cleanProject", "saveProject"],
  failed:["cleanProject",  "saveProject"],
  holding:[],
  unknown:["cleanProject",  "saveProject"]
}

module.exports=allowedOperations
