/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path = require("path");
const { projectJsonFilename, componentJsonFilename } = require("../db/db");
const { getComponent } = require("../core/workflowUtil");
const { importProject } = require("../core/projectFilesOperator");

module.exports = {
  get: async (req, res)=>{
    //accept GET method only for reload case
    if (!req.cookies || !req.cookies.rootDir) {
      return;
    }
    const baseURL = process.env.WHEEL_BASE_URL || "/";
    res.cookie("socketIOPath", baseURL);
    res.sendFile(path.resolve(__dirname, "../public/workflow.html"));
  },
  post: async (req, res)=>{
    const projectRootDir = req.body.project;
    const newProjectRootDir = await importProject(projectRootDir);
    if (!newProjectRootDir) {
      return;
    }
    const { ID } = await getComponent(newProjectRootDir, path.resolve(newProjectRootDir, componentJsonFilename));
    res.cookie("root", ID);
    res.cookie("rootDir", newProjectRootDir);
    res.cookie("project", path.resolve(newProjectRootDir, projectJsonFilename));
    const baseURL = process.env.WHEEL_BASE_URL || "/";
    res.cookie("socketIOPath", baseURL);
    res.sendFile(path.resolve(__dirname, "../public/workflow.html"));
  }
};
