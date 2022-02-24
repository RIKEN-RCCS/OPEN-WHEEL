/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License.txt in the project root for the license information.
 */
"use strict";
const path = require("path");
const express = require("express");
const cookie = require("cookie");
const fileManager = require("./fileManager");
const projectController = require("./projectController");
const { jobScheduler, remoteHost, projectJsonFilename, componentJsonFilename, shutdownDelay, jobScript } = require("../db/db");
const { getComponent } = require("../core/workflowUtil");
const { openProject, setSio, getLogger } = require("../core/projectResource");
const { importProject, getProjectState, checkRunningJobs } = require("../core/projectFilesOperator");
const { createSsh } = require("../core/sshManager");
const { registerJob } = require("../core/jobManager");

module.exports = function(io) {
  let projectRootDir = null;
  const sio = io.of("/workflow");
  sio.on("connect", (socket)=>{
    if (projectRootDir === null) {
      socket.emit("showMessage", "please reload browser");
      return;
    }
    const { rootDir } = cookie.parse(socket.handshake.headers.cookie);
    getLogger(projectRootDir).debug("projectRootDir from cookie=", rootDir);

    setSio(projectRootDir, socket);
    socket.on("getJobScriptList", ()=>{
      socket.emit("jobScriptList", jobScript.getAll());
    });
    socket.on("getSelectedJobScheduler", (selectHost)=>{
      for (const host of remoteHost.getAll()) {
        if (host.name === selectHost) {
          socket.emit("selectedJobScheduler", jobScheduler[host.jobScheduler]);
        }
      }
      if (selectHost === "localhost") {
        const localhost = { submit: "" };
        socket.emit("selectedJobScheduler", localhost);
      }
    });

    //event listeners for project operation
    projectController(socket, projectRootDir);

    //event listeners for file operation
    fileManager(socket, projectRootDir);

    //redirect error to logger
    socket.on("error", (err)=>{
      getLogger(projectRootDir).debug("socketIO errror occurred:\n", err);
    });
    //kill itself 10 minuets later after when the last client disconnected
    socket.on("disconnect", ()=>{
      if (io.engine.clientsCount === 0 && shutdownDelay > 0) {
        getLogger(projectRootDir).debug(`the last client disconnected wheel will be shutdown after ${shutdownDelay / 1000} sec`);
        const timeout = setTimeout(async()=>{
          const projectStatus = await getProjectState(projectRootDir);
          if (io.engine.clientsCount > 0) {
            getLogger(projectRootDir).debug(`shutdown canceled because we have ${io.engine.clientsCount} client now`);
            clearTimeout(timeout);
          } else if (["running", "prepareing"].includes(projectStatus)) {
            getLogger(projectRootDir).debug(`shutdown canceled because project status is ${projectStatus}`);
            clearTimeout(timeout);
          } else {
            getLogger(projectRootDir).info("this process will be shutdown");
            process.exit(0); //eslint-disable-line no-process-exit
          }
        }, shutdownDelay);
      }
    });

    //remaining job detected
    (async()=>{
      const projectState = await getProjectState(projectRootDir);
      if (projectState !== "running" && projectState !== "holding") {
        return;
      }
      const { tasks } = await checkRunningJobs(projectRootDir);
      if (tasks.length > 0) {
        getLogger(projectRootDir).info(`${tasks.length} jobs remaining. job check restarted`);
        const p = [];
        for (const task of tasks) {
          const { remotehostID, name } = task;
          const hostinfo = remoteHost.get(remotehostID);
          await createSsh(projectRootDir, name, hostinfo, socket);
          p.push(registerJob(hostinfo, task));
        }
        await Promise.all(p);
      }
    })().catch((e)=>{
      getLogger(projectRootDir).error("restart job check process failed", e);
    });
  });

  //eslint-disable-next-line new-cap
  const router = express.Router();
  //accept GET method only for reload case
  router.get("/", async(req, res)=>{
    if (!req.cookies || !req.cookies.rootDir) {
      return;
    }
    projectRootDir = req.cookies.rootDir;
    res.sendFile(path.resolve(__dirname, "../public/workflow.html"));
  });
  router.post("/", async(req, res)=>{
    projectRootDir = req.body.project;
    await importProject(projectRootDir);
    await openProject(projectRootDir);
    const { ID } = await getComponent(projectRootDir, path.resolve(projectRootDir, componentJsonFilename));
    res.cookie("root", ID);
    res.cookie("rootDir", projectRootDir);
    res.cookie("project", path.resolve(projectRootDir, projectJsonFilename));
    res.sendFile(path.resolve(__dirname, "../public/workflow.html"));
  });
  return router;
};
