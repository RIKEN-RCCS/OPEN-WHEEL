/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License.txt in the project root for the license information.
 */
"use strict";
const path = require("path");
const { promisify } = require("util");
const glob = require("glob");
const ARsshClient = require("arssh2-client");
const { create } = require("abc4");
const { getLogger } = require("../logSettings");
const logger = getLogger();
const { remoteHost, componentJsonFilename, projectJsonFilename } = require("../db/db");
const { deliverFile } = require("../core/fileUtils");
const { gitAdd, gitCommit, gitResetHEAD, getUnsavedFiles } = require("../core/gitOperator2");
const { getHosts, validateComponents, getSourceComponents } = require("../core/componentFilesOperator");
const { getComponentDir, getProjectJson, getProjectState, setProjectState, updateProjectDescription } = require("../core/projectFilesOperator");
const { createSsh, removeSsh, askPassword } = require("../core/sshManager");
const { runProject, cleanProject, pauseProject, stopProject } = require("../core/projectController.js");
const { sendWorkflow } = require("./senders.js");
const { addCluster, removeCluster } = require("../core/clusterManager.js");
const { addSsh } = require("../core/sshManager.js");
const { isValidOutputFilename } = require("../lib/utility");


async function createCloudInstance(projectRootDir, hostinfo, sio) {
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
  order.id = order.id || await askPassword(sio, "input access key for AWS");
  order.pw = order.pw || await askPassword(sio, "input secret access key for AWS");
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


async function updateProjectState(socket, projectRootDir, state) {
  const projectJson = await setProjectState(projectRootDir, state);
  if (projectJson) {
    socket.emit("projectState", projectJson.state);
  }
}

/**
 * promised version of socketIO.emit()
 * @param {Function} emit - socketIO's emit()
 * this function is resolved when ack is called on opposite side
 */
async function emitWithPromise(emit, ...args) {
  return new Promise((resolve)=>{
    emit(...args, resolve);
  });
}

async function askUnsavedFiles(emit, projectRootDir) {
  const unsavedFiles = await getUnsavedFiles(projectRootDir)
    .filter((e)=>{
      return !(e.name === componentJsonFilename || e.name === projectJsonFilename);
    });
  if (unsavedFiles.length > 0) {
    const toBeSaved = await emitWithPromise(emit, "unsavedFiles", unsavedFiles);
    if (toBeSaved) {
      await Promise.all(unsavedFiles.map((unsaved)=>{
        return gitAdd(projectRootDir, unsaved.name);
      }));
      await gitCommit(projectRootDir);
    }
  }
}

async function getSourceCandidates(projectRootDir, ID) {
  const componentDir = await getComponentDir(projectRootDir, ID);
  return promisify(glob)("*", { cwd: componentDir, ignore: componentJsonFilename });
}

//memo askSourceFilename eventのクライアント側ハンドラが無いかもしれない
async function askSourceFilename(socket, ID, name, description, candidates) {
  return new Promise((resolve, reject)=>{
    socket.emit("askSourceFilename", ID, name, description, candidates, (filename)=>{
      if (isValidOutputFilename(filename)) {
        //ここでファイルが存在するか確認する。ファイルがアップロードされるパターンでは
        //アップロード完了を待ちたいがそんなイベントは無い気がする・・・
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
async function getSourceFilename(projectRootDir, component, sio) {
  const filelist = await getSourceCandidates(projectRootDir, component.ID);
  getLogger(projectRootDir).trace("sourceFile: candidates=", filelist);

  if (filelist.length === 1) {
    return (filelist[0]);
  }
  return askSourceFilename(sio, component.ID, component.name, component.description, filelist);
}

async function onRunProject(socket, projectRootDir, ack) {
  const projectState = await getProjectState(projectRootDir);
  if (projectState !== "paused") {
  //validation check
    try {
      await validateComponents(projectRootDir);
      await gitCommit(projectRootDir, "wheel", "wheel@example.com");
    } catch (err) {
      logger.error("fatal error occurred while validation phase:", err);
      ack(err);
      return false;
    }

    //interactive phase
    try {
      await updateProjectState(socket, projectRootDir, "prepareing");

      //resolve source files
      const sourceComponents = await getSourceComponents(projectRootDir);

      for (const component of sourceComponents) {
        if (component.disable) {
          logger.debug(`disabled component: ${component.name}(${component.ID})`);
          continue;
        }
        //ask to user if needed
        const filename = await getSourceFilename(projectRootDir, component, socket);

        const componentDir = await getComponentDir(projectRootDir, component.ID);
        const outputFilenames = component.outputFiles.map((e)=>{
          return e.name;
        });
        logger.trace("sourceFile:", filename, "will be used as", outputFilenames);

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
          await createCloudInstance(projectRootDir, hostInfo, socket);
        } else {
          await createSsh(projectRootDir, remoteHostName, hostInfo, socket);
        }
      }
    } catch (err) {
      if (err.reason === "CANCELED") {
        logger.debug(err.message);
      } else {
        logger.error("fatal error occurred while prepareing phase:", err);
      }
      removeSsh(projectRootDir);
      removeCluster(projectRootDir);
      await updateProjectState(socket, projectRootDir, "not-started");
      socket.emit("projectJson", await getProjectJson(projectRootDir));
      ack(err);
      return false;
    }
  }

  //actual run
  try {
    await runProject(projectRootDir);
  } catch (err) {
    logger.error("fatal error occurred while parsing workflow:", err);
    await updateProjectState(socket, projectRootDir, "failed");
    ack(err);
  } finally {
    socket.emit("projectJson", await getProjectJson(projectRootDir));
    await sendWorkflow(socket, ack, projectRootDir);
    removeSsh(projectRootDir);
    removeCluster(projectRootDir);
  }
  return ack(true);
}

async function onPauseProject(socket, projectRootDir, ack) {
  try {
    await pauseProject(projectRootDir);
    await updateProjectState(socket, projectRootDir, "paused");
    socket.emit("projectJson", await getProjectJson(projectRootDir));
    await sendWorkflow(socket, ack, projectRootDir);
  } catch (e) {
    ack(e);
    return;
  }
  logger.debug("pause project done");
  ack(true);
}

async function onStopProject(socket, projectRootDir, ack) {
  try {
    await askUnsavedFiles(socket.emit, projectRootDir);
  } catch (e) {
    logger.info("stop project canceled");
    return;
  }
  try {
    await stopProject(projectRootDir);
    await updateProjectState(socket, projectRootDir, "paused");
    socket.emit("projectJson", await getProjectJson(projectRootDir));
    await sendWorkflow(socket, ack, projectRootDir);
  } catch (e) {
    ack(e);
    return;
  }
  logger.debug("stop project done");
  ack(true);
}

async function onCleanProject(socket, projectRootDir, ack) {
  try {
    await askUnsavedFiles(socket.emit, projectRootDir);
  } catch (e) {
    logger.info("clean project canceled");
    return;
  }

  try {
    await cleanProject(projectRootDir);
    await sendWorkflow(socket, ack, projectRootDir, projectRootDir);
  } catch (e) {
    ack(e);
  } finally {
    await sendWorkflow(socket, ack, projectRootDir);
    socket.emit("taskStateList", []);
    socket.emit("projectJson", await getProjectJson(projectRootDir));
    removeSsh(projectRootDir);
    removeCluster(projectRootDir);
  }
  logger.debug("clean project done");
  ack(true);
}
async function onSaveProject(socket, projectRootDir, cb) {
  const projectState = await getProjectState(projectRootDir);
  if (projectState === "not-started") {
    await setProjectState(projectRootDir, "not-started", true);
    await gitCommit(projectRootDir, "wheel", "wheel@example.com");
  } else {
    logger.error(projectState, "project can not be saved");
    return cb(null);
  }
  logger.debug("save project done");
  const projectJson = await getProjectJson(projectRootDir);
  return cb(projectJson);
}
async function onRevertProject(socket, projectRootDir, cb) {
  await askUnsavedFiles(socket.emit, projectRootDir);
  await gitResetHEAD(projectRootDir);
  await sendWorkflow(socket, cb, projectRootDir);
  logger.debug("revert project done");
  const projectJson = await getProjectJson(projectRootDir);
  cb(projectJson);
}

async function onGetProjectJson(socket, projectRootDir, cb) {
  try {
    const projectJson = await getProjectJson(projectRootDir);
    socket.emit("projectJson", projectJson);
  } catch (e) {
    return cb(false);
  }
  return cb(true);
}
async function onGetWorkflow(socket, projectRootDir, componentID, cb) {
  const requestedComponentDir = await getComponentDir(projectRootDir, componentID);
  return sendWorkflow(socket, cb, projectRootDir, requestedComponentDir);
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
