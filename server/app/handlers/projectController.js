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
const ARsshClient = require("arssh2-client");
const { create } = require("abc4");
const { getLogger } = require("../logSettings");
const { remoteHost, componentJsonFilename, projectJsonFilename } = require("../db/db");
const { deliverFile } = require("../core/fileUtils");
const { gitRm, gitAdd, gitCommit, gitResetHEAD, getUnsavedFiles } = require("../core/gitOperator2");
const { getHosts, validateComponents, getSourceComponents } = require("../core/componentFilesOperator");
const { getComponentDir, getProjectJson, getProjectState, setProjectState, updateProjectDescription } = require("../core/projectFilesOperator");
const { createSsh, removeSsh, askPassword } = require("../core/sshManager");
const { runProject, cleanProject, pauseProject, stopProject } = require("../core/projectController.js");
const { addCluster, removeCluster } = require("../core/clusterManager.js");
const { addSsh } = require("../core/sshManager.js");
const { isValidOutputFilename } = require("../lib/utility");
const { sendWorkflow, sendProjectJson, sendTaskStateList, sendResultsFileDir } = require("./senders.js");
const { parentDirs, eventEmitters } = require("../core/global.js");
const { emitAll, emitWithPromise } = require("./commUtils.js");
const { removeTempd } = require("../core/tempd.js");


async function createCloudInstance(projectRootDir, hostinfo, clientID) {
  const order = hostinfo.additionalParams || {};
  order.headOnlyParam = hostinfo.additionalParamsForHead || {};
  order.provider = hostinfo.type;
  order.os = hostinfo.os;
  order.region = hostinfo.region;
  order.numNodes = hostinfo.numNodes;
  order.InstanceType = hostinfo.InstanceType;
  order.rootVolume = hostinfo.rootVolume;
  order.shareStorage = hostinfo.shareStorage;
  order.playbook = hostinfo.playbook;
  //order.mpi = hostinfo.mpi;
  //order.compiler = hostinfo.compiler;
  order.batch = hostinfo.jobScheduler;
  order.id = order.id || await askPassword(clientID, "input access key for AWS");
  order.pw = order.pw || await askPassword(clientID, "input secret access key for AWS");
  const logger = getLogger(projectRootDir);
  order.info = logger.debug.bind(logger);
  order.debug = logger.trace.bind(logger);

  const cluster = await create(order);
  addCluster(projectRootDir, hostinfo, cluster);
  const config = {
    host: cluster.headNodes[0].publicNetwork.hostname,
    port: hostinfo.port,
    username: cluster.user,
    privateKey: cluster.privateKey,
    passphrase: "",
    password: null
  };

  const arssh = new ARsshClient(config, { connectionRetryDelay: 1000, verbose: true });
  if (hostinfo.type === "aws") {
    logger.debug("wait for cloud-init");
    await arssh.watch("tail /var/log/cloud-init-output.log >&2 && cloud-init status", { out: /done|error|disabled/ }, 30000, 60, {}, logger.debug.bind(logger), logger.debug.bind(logger));
    logger.debug("cloud-init done");
  }
  if (hostinfo.renewInterval) {
    arssh.renewInterval = hostinfo.renewInterval * 60 * 1000;
  }

  if (hostinfo.renewDelay) {
    arssh.renewDelay = hostinfo.renewDelay * 1000;
  }

  hostinfo.host = config.host;
  addSsh(projectRootDir, hostinfo, arssh);
}


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
  return promisify(glob)("*", { cwd: componentDir, ignore: componentJsonFilename });
}

//memo askSourceFilename event???????????????????????????????????????????????????????????????
async function askSourceFilename(clientID, ID, name, description, candidates) {
  return new Promise((resolve, reject)=>{
    emitAll(clientID, "askSourceFilename", ID, name, description, candidates, (filename)=>{
      if (isValidOutputFilename(filename)) {
        //??????????????????????????????????????????????????????????????????????????????????????????????????????????????????
        //?????????????????????????????????????????????????????????????????????????????????????????????
        resolve(filename);
      } else {
        reject(new Error(`invalid filename: ${filename}`));
      }
    });
  });
}

/**
 * ask user what file to be used
 */
async function getSourceFilename(projectRootDir, component, clientID) {
  const filelist = await getSourceCandidates(projectRootDir, component.ID);
  getLogger(projectRootDir).trace("sourceFile: candidates=", filelist);

  if (filelist.length === 1) {
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
      await gitCommit(projectRootDir, "wheel", "wheel@example.com");
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
              return deliverFile(path.resolve(componentDir, filename), path.resolve(componentDir, outputFile));
            }
            return Promise.resolve(true);
          })
        );
      }

      //create remotehost connection
      const hosts = await getHosts(projectRootDir, null);
      for (const remoteHostName of hosts) {
        const id = remoteHost.getID("name", remoteHostName);
        const hostInfo = remoteHost.get(id);
        if (!hostInfo) {
          return Promise.reject(new Error(`illegal remote host specified ${remoteHostName}`));
        }
        if (hostInfo.type === "aws") {
          await createCloudInstance(projectRootDir, hostInfo, clientID);
        } else {
          await createSsh(projectRootDir, remoteHostName, hostInfo, clientID);
        }
      }
    } catch (err) {
      if (err.reason === "CANCELED") {
        getLogger(projectRootDir).debug(err.message);
      } else {
        getLogger(projectRootDir).error("fatal error occurred while prepareing phase:", err);
      }
      removeSsh(projectRootDir);
      removeCluster(projectRootDir);
      await updateProjectState(projectRootDir, "not-started");
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
    removeCluster(projectRootDir);
  }
  return ack(true);
}

async function onPauseProject(projectRootDir, ack) {
  try {
    await pauseProject(projectRootDir);
    await updateProjectState(projectRootDir, "paused");
    await sendWorkflow(ack, projectRootDir);
  } catch (e) {
    ack(e);
    return;
  }
  getLogger(projectRootDir).debug("pause project done");
  ack(true);
}

async function onStopProject(projectRootDir, ack) {
  try {
    await stopProject(projectRootDir);
    await updateProjectState(projectRootDir, "paused");
    await sendWorkflow(ack, projectRootDir);
  } catch (e) {
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
    await cleanProject(projectRootDir);
    await sendWorkflow(ack, projectRootDir, projectRootDir);
    await Promise.all([removeTempd(projectRootDir, "viewer"), removeTempd(projectRootDir, "download")]);
  } catch (e) {
    ack(e);
  } finally {
    await Promise.all([
      sendWorkflow(ack, projectRootDir),
      emitAll(projectRootDir, "taskStateList", []),
      emitAll(projectRootDir, "projectJson", await getProjectJson(projectRootDir))
    ]);
    removeSsh(projectRootDir);
    removeCluster(projectRootDir);
  }
  getLogger(projectRootDir).debug("clean project done");
  ack(true);
}
async function onSaveProject(projectRootDir, cb) {
  const projectState = await getProjectState(projectRootDir);
  if (projectState === "not-started") {
    await setProjectState(projectRootDir, "not-started", true);
    await gitCommit(projectRootDir, "wheel", "wheel@example.com");
  } else {
    getLogger(projectRootDir).error(projectState, "project can not be saved");
    return cb(null);
  }
  getLogger(projectRootDir).debug("save project done");
  const projectJson = await getProjectJson(projectRootDir);
  return cb(projectJson);
}
async function onRevertProject(clientID, projectRootDir, cb) {
  await askUnsavedFiles(clientID, projectRootDir);
  await gitResetHEAD(projectRootDir);
  await sendWorkflow(cb, projectRootDir);
  await Promise.all([removeTempd(projectRootDir, "viewer"), removeTempd(projectRootDir, "download")]);
  getLogger(projectRootDir).debug("revert project done");
  const projectJson = await getProjectJson(projectRootDir);
  cb(projectJson);
}

async function onGetProjectJson(projectRootDir, cb) {
  try {
    const projectJson = await getProjectJson(projectRootDir);
    emitAll(projectRootDir, "projectJson", projectJson);
  } catch (e) {
    return cb(false);
  }
  return cb(true);
}
async function onGetWorkflow(clientID, projectRootDir, componentID, cb) {
  const requestedComponentDir = await getComponentDir(projectRootDir, componentID);
  return sendWorkflow(cb, projectRootDir, requestedComponentDir, clientID);
}

async function onUpdateProjectDescription(projectRootDir, description, cb) {
  await updateProjectDescription(projectRootDir, description);
  cb(true);
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
