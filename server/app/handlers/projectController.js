/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path = require("path");
const { promisify } = require("util");
const EventEmitter = require("events");
const glob = require("glob");
const fs = require("fs-extra");
const { getLogger } = require("../logSettings");
const { filesJsonFilename, remoteHost, componentJsonFilename, projectJsonFilename } = require("../db/db");
const { deliverFile } = require("../core/fileUtils");
const { gitRm, gitAdd, gitCommit, gitResetHEAD, getUnsavedFiles } = require("../core/gitOperator2");
const { getHosts, validateComponents, getSourceComponents,getComponentDir, getProjectJson, getProjectState, setProjectState, updateProjectDescription } = require("../core/projectFilesOperator");
const { createSsh, removeSsh } = require("../core/sshManager");
const { runProject, cleanProject, pauseProject, stopProject } = require("../core/projectController.js");
const { isValidOutputFilename } = require("../lib/utility");
const { sendWorkflow, sendProjectJson, sendTaskStateList, sendResultsFileDir } = require("./senders.js");
const { parentDirs, eventEmitters } = require("../core/global.js");
const { emitAll, emitWithPromise } = require("./commUtils.js");
const { removeTempd, getTempd } = require("../core/tempd.js");


async function updateProjectState(projectRootDir, state) {
  const projectJson = await setProjectState(projectRootDir, state);
  if (projectJson) {
    await emitAll(projectRootDir, "projectState", projectJson.state);
  }
}

async function askUnsavedFiles(clientID, projectRootDir) {
  const logger = getLogger(projectRootDir);
  const unsavedFiles = await getUnsavedFiles(projectRootDir);
  const filterdUnsavedFiles = unsavedFiles.filter((e)=>{
    return !(e.name === componentJsonFilename || e.name === projectJsonFilename);
  });
  if (filterdUnsavedFiles.length > 0) {
    const [mode, toBeSaved] = await emitWithPromise(emitAll.bind(null, clientID), "unsavedFiles", filterdUnsavedFiles);
    if (mode === "cancel") {
      throw (new Error("canceled by user"));
    } else if (mode === "discard") {
      logger.info("discard unsaved files");
      logger.debug("discard unsaved files", filterdUnsavedFiles.map((unsaved)=>{
        return unsaved.name;
      }));
    } else if (mode === "save") {
      logger.info("save files and clean project", toBeSaved);
      await Promise.all(filterdUnsavedFiles.map((unsaved)=>{
        return unsaved.status === "deleted" ? gitRm(projectRootDir, unsaved.name) : gitAdd(projectRootDir, unsaved.name);
      }));
      await gitCommit(projectRootDir);
    }
  }
}

async function getSourceCandidates(projectRootDir, ID) {
  const componentDir = await getComponentDir(projectRootDir, ID);
  return promisify(glob)("*", { cwd: path.join(projectRootDir, componentDir), ignore: componentJsonFilename });
}

async function askSourceFilename(clientID, ID, name, description, candidates) {
  return new Promise((resolve, reject)=>{
    emitAll(clientID, "askSourceFilename", ID, name, description, candidates, (filename)=>{
      if (isValidOutputFilename(filename)) {
        resolve(filename);
      } else if (filename === null) {
        reject(new Error(`source file selection for ${name} canceled`));
      } else {
        reject(new Error(`invalid filename: ${filename}`));
      }
    });
  });
}

async function askUploadSourceFile(clientID, ID, name, description) {
  return new Promise((resolve, reject)=>{
    emitAll(clientID, "askUploadSourceFile", ID, name, description, (filename)=>{
      if (filename === null) {
        reject(new Error(`source file upload for ${name} canceled`));
      } else {
        resolve(filename);
      }
    });
  });
}

/**
 * ask user what file to be used
 */
async function getSourceFilename(projectRootDir, component, clientID) {
  if (component.uploadOnDemand) {
    return askUploadSourceFile(clientID, component.ID, component.name, component.description);
  }
  const filelist = await getSourceCandidates(projectRootDir, component.ID);
  getLogger(projectRootDir).trace("sourceFile: candidates=", filelist);

  if (component.outputFiles && component.outputFiles[0] && component.outputFiles[0].name) {
    const rt = filelist.find((e)=>{
      return e === component.outputFiles[0].name;
    });
    if (rt) {
      getLogger(projectRootDir).info(`sourceFile: ${rt} is used as outputFile.`);
      return rt;
    }
    getLogger(projectRootDir).info(`sourceFile: outputFile was set to ${component.outputFiles[0].name} but it was not found.`);
  }
  if (filelist.length === 1) {
    getLogger(projectRootDir).debug(`sourceFile: ${filelist[0]} is the only candidate. use it as outputFile`);
    return (filelist[0]);
  }
  return askSourceFilename(clientID, component.ID, component.name, component.description, filelist);
}

async function onRunProject(clientID, projectRootDir, ack) {
  const projectState = await getProjectState(projectRootDir);
  if (projectState !== "paused") {
  //validation check
    try {
      await validateComponents(projectRootDir);
      await gitCommit(projectRootDir, "auto saved: project starting");
    } catch (err) {
      getLogger(projectRootDir).error("fatal error occurred while validation phase:", err);
      ack(err);
      return false;
    }

    //interactive phase
    try {
      await updateProjectState(projectRootDir, "prepareing");

      //resolve source files
      const sourceComponents = await getSourceComponents(projectRootDir);

      for (const component of sourceComponents) {
        if (component.disable) {
          getLogger(projectRootDir).debug(`disabled component: ${component.name}(${component.ID})`);
          continue;
        }
        //ask to user if needed
        const filename = await getSourceFilename(projectRootDir, component, clientID);
        const componentDir = await getComponentDir(projectRootDir, component.ID);
        const outputFilenames = component.outputFiles.map((e)=>{
          return e.name;
        });
        getLogger(projectRootDir).trace("sourceFile:", filename, "will be used as", outputFilenames);

        await Promise.all(
          outputFilenames.map((outputFile)=>{
            if (filename !== outputFile) {
              return deliverFile(path.resolve(projectRootDir, componentDir, filename), path.resolve(projectRootDir, componentDir, outputFile));
            }
            return Promise.resolve(true);
          })
        );
      }

      //create remotehost connection
      const hosts = await getHosts(projectRootDir, null);
      for (const host of hosts) {
        const id = remoteHost.getID("name", host.hostname);
        const hostInfo = remoteHost.get(id);
        if (!hostInfo) {
          throw new Error(`illegal remote host specified ${hostInfo.name}`);
        }
        if (hostInfo.type === "aws") {
          throw new Error(`aws type remotehost is no longer supported ${hostInfo.name}`);
        }
        await createSsh(projectRootDir, hostInfo.name, hostInfo, clientID, host.isStorage);
      }
    } catch (err) {
      await updateProjectState(projectRootDir, "not-started");

      if (err.reason === "CANCELED") {
        getLogger(projectRootDir).debug(err.message);
      } else {
        getLogger(projectRootDir).error("fatal error occurred while prepareing phase:", err);
      }
      removeSsh(projectRootDir);
      ack(err);
      return false;
    }
  }

  //actual run
  try {
    const ee = new EventEmitter();
    eventEmitters.set(projectRootDir, ee);
    ee.on("componentStateChanged", ()=>{
      const parentDir = parentDirs.get(projectRootDir);
      sendWorkflow(()=>{}, projectRootDir, parentDir);
    });
    ee.on("projectStateChanged", sendProjectJson.bind(null, projectRootDir));
    ee.on("taskDispatched", sendTaskStateList.bind(null, projectRootDir));
    ee.on("taskCompleted", sendTaskStateList.bind(null, projectRootDir));
    ee.on("taskStateChanged", sendTaskStateList.bind(null, projectRootDir));
    ee.on("resultFilesReady", sendResultsFileDir.bind(null, projectRootDir));

    await runProject(projectRootDir);
  } catch (err) {
    getLogger(projectRootDir).error("fatal error occurred while parsing workflow:", err);
    await updateProjectState(projectRootDir, "failed");
    ack(err);
  } finally {
    emitAll(projectRootDir, "projectJson", await getProjectJson(projectRootDir));
    await sendWorkflow(ack, projectRootDir);
    eventEmitters.delete(projectRootDir);
    removeSsh(projectRootDir);
  }
  return ack(true);
}

async function onPauseProject(projectRootDir, ack) {
  try {
    await pauseProject(projectRootDir);
    await updateProjectState(projectRootDir, "paused");
    await sendWorkflow(ack, projectRootDir);
  } catch (e) {
    getLogger(projectRootDir).error("fatal error occurred while pausing project", e);
    ack(e);
    return;
  }
  getLogger(projectRootDir).debug("pause project done");
  ack(true);
}

async function onStopProject(projectRootDir, ack) {
  try {
    await stopProject(projectRootDir);
    await updateProjectState(projectRootDir, "stopped");
    await sendWorkflow(ack, projectRootDir);
  } catch (e) {
    getLogger(projectRootDir).error("fatal error occurred while stopping project", e);
    ack(e);
    return;
  }
  getLogger(projectRootDir).debug("stop project done");
  ack(true);
}

async function onCleanProject(clientID, projectRootDir, ack) {
  try {
    await askUnsavedFiles(clientID, projectRootDir);
  } catch (e) {
    getLogger(projectRootDir).info("clean project canceled due to", e.message);
    getLogger(projectRootDir).debug(e);
    ack(e);
    return;
  }

  try {
    await Promise.all([
      cleanProject(projectRootDir),
      removeTempd(projectRootDir, "viewer"),
      removeTempd(projectRootDir, "download")
    ]);
  } catch (e) {
    getLogger(projectRootDir).error("clean project failed", e);
    ack(e);
  } finally {
    await Promise.all([
      sendWorkflow(ack, projectRootDir),
      emitAll(projectRootDir, "taskStateList", []),
      emitAll(projectRootDir, "projectJson", await getProjectJson(projectRootDir))
    ]);
    removeSsh(projectRootDir);
  }
  getLogger(projectRootDir).debug("clean project done");
}

async function onSaveProject(projectRootDir, ack) {
  const projectState = await getProjectState(projectRootDir);
  if (projectState === "not-started") {
    await setProjectState(projectRootDir, "not-started", true);
    await gitCommit(projectRootDir);
  } else {
    getLogger(projectRootDir).error(projectState, "project can not be saved");
    return ack(null);
  }
  getLogger(projectRootDir).debug("save project done");
  const projectJson = await getProjectJson(projectRootDir);
  return ack(projectJson);
}

async function onRevertProject(clientID, projectRootDir, ack) {
  await askUnsavedFiles(clientID, projectRootDir);

  try {
    await Promise.all([
      gitResetHEAD(projectRootDir),
      removeTempd(projectRootDir, "viewer"),
      removeTempd(projectRootDir, "download")
    ]);
  } catch (e) {
    getLogger(projectRootDir).error("revert project failed", e);
    ack(e);
  } finally {
    await Promise.all([
      sendWorkflow(ack, projectRootDir),
      emitAll(projectRootDir, "taskStateList", []),
      emitAll(projectRootDir, "projectJson", await getProjectJson(projectRootDir))
    ]);
  }
  getLogger(projectRootDir).debug("revert project done");
  const projectJson = await getProjectJson(projectRootDir);
  ack(projectJson);
}

async function onGetProjectJson(projectRootDir, ack) {
  try {
    const projectJson = await getProjectJson(projectRootDir);
    emitAll(projectRootDir, "projectJson", projectJson);
    const resultDir = await getTempd(projectRootDir, "viewer");
    const filename = path.resolve(resultDir, filesJsonFilename);

    if (await fs.pathExists(filename)) {
      sendResultsFileDir(projectRootDir, resultDir);
    }
  } catch (e) {
    getLogger(projectRootDir).warn("getProjectJson failed", e);
    return ack(false);
  }
  return ack(true);
}
async function onGetWorkflow(clientID, projectRootDir, componentID, ack) {
  const requestedComponentDir = await getComponentDir(projectRootDir, componentID);
  return sendWorkflow(ack, projectRootDir, requestedComponentDir, clientID);
}

async function onUpdateProjectDescription(projectRootDir, description, ack) {
  await updateProjectDescription(projectRootDir, description);
  onGetProjectJson(projectRootDir, ack);
}


module.exports = {
  onRunProject,
  onPauseProject,
  onStopProject,
  onCleanProject,
  onSaveProject,
  onRevertProject,
  onGetWorkflow,
  onGetProjectJson,
  onUpdateProjectDescription
};
