/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path = require("path");
const { promisify } = require("util");
const EventEmitter = require("events");
const axios = require("axios");
const glob = require("glob");
const fs = require("fs-extra");
const SBS = require("simple-batch-system");
const { getLogger } = require("../logSettings");
const { filesJsonFilename, remoteHost, componentJsonFilename, projectJsonFilename } = require("../db/db");
const { deliverFile } = require("../core/fileUtils");
const { gitAdd, gitCommit, gitResetHEAD, getUnsavedFiles } = require("../core/gitOperator2");
const { getComponentDir } = require("../core/componentJsonIO.js");
const { getHosts, checkRemoteStoragePathWritePermission, getSourceComponents, getProjectJson, getProjectState, setProjectState, updateProjectDescription, updateProjectROStatus, setComponentStateR } = require("../core/projectFilesOperator");
const { createSsh, removeSsh, askPassword } = require("../core/sshManager");
const { setJWTServerPassphrase, removeAllJWTServerPassphrase } = require("../core/jwtServerPassphraseManager.js");
const { runProject, cleanProject, stopProject } = require("../core/projectController.js");
const { isValidOutputFilename } = require("../lib/utility");
const { checkWritePermissions, parentDirs, eventEmitters } = require("../core/global.js");
const { sendWorkflow, sendProjectJson, sendTaskStateList, sendResultsFileDir, sendComponentTree } = require("./senders.js");
const { emitAll, emitWithPromise } = require("./commUtils.js");
const { removeTempd, getTempd } = require("../core/tempd.js");
const { validateComponents } = require("../core/validateComponents.js");
const { writeJsonWrapper } = require("../lib/utility");
const { checkJWTAgent, startJWTAgent } = require("../core/gfarmOperator.js");
const allowedOperations = require("../../../common/allowedOperations.cjs");

const projectOperationQueues = new Map();
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
  if (filterdUnsavedFiles.length === 0) {
    return emitWithPromise(emitAll.bind(null, clientID), "unsavedFiles", []);
  }
  const [mode] = await emitWithPromise(emitAll.bind(null, clientID), "unsavedFiles", filterdUnsavedFiles);
  if (mode === "cancel") {
    throw (new Error("canceled by user"));
  } else if (mode === "discard") {
    logger.info("discard unsaved files");
    logger.debug("discard unsaved files", filterdUnsavedFiles.map((unsaved)=>{
      return unsaved.name;
    }));
  } else if (mode === "update") {
    return askUnsavedFiles(clientID, projectRootDir);
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

async function makeOIDCAuth(clientID, remotehostID) {
  return new Promise((resolve)=>{
    emitAll(clientID, "requestOIDCAuth", remotehostID, ()=>{
      //一回目はここで証明書の確認とかをユーザがやっている間にresolveされてしまって
      //access tokenを取得する前にrunProjectが呼ばれてfailする
      console.log("DEBUG: requestOIDCAuth done");
      resolve();
    });
  });
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
async function onUpdateProjectROStatus(projectRootDir, isRO, ack) {
  await updateProjectROStatus(projectRootDir, isRO);
  onGetProjectJson(projectRootDir, ack);
}

async function onRunProject(clientID, projectRootDir, ack) {
  const logger = getLogger(projectRootDir);
  const projectState = await getProjectState(projectRootDir);
  if (projectState !== "paused") {
  //validation check
    try {
      const report = await validateComponents(projectRootDir);
      if (report.length > 0) {
        getLogger(projectRootDir).error("invalid component found:");
        ack(report);
        return false;
      }

      await gitCommit(projectRootDir, "auto saved: project starting");
    } catch (err) {
      getLogger(projectRootDir).error("fatal error occurred while validation phase:", err);
      ack(err);
      return false;
    }
    //interactive phase
    try {
      await updateProjectState(projectRootDir, "preparing");

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
        const hostinfo = remoteHost.get(id);
        if (!hostinfo) {
          throw new Error(`illegal remote host specified ${hostinfo.name}`);
        }
        if (hostinfo.type === "aws") {
          throw new Error(`aws type remotehost is no longer supported ${hostinfo.name}`);
        }
        getLogger(projectRootDir).debug(`make ssh connection to ${hostinfo.name}`);
        await createSsh(projectRootDir, hostinfo.name, hostinfo, clientID, host.isStorage);
        if (hostinfo.useWebAPI) {
          getLogger(projectRootDir).debug(`start OIDC authorization for ${hostinfo.name}`);
          await makeOIDCAuth(clientID, id);
        }
        if (hostinfo.useGfarm && host.isGfarm) {
          if (await checkJWTAgent(projectRootDir, hostinfo.id)) {
            getLogger(projectRootDir).debug(`jwt-agent is already running on ${hostinfo.name}`);
          } else {
            getLogger(projectRootDir).debug(`get jwt-server passphrase for ${hostinfo.name}`);
            const phGfarm = await askPassword(clientID, hostinfo.name, "passphrase", hostinfo.JWTServerURL);
            getLogger(projectRootDir).debug(`start jwt-agent on ${hostinfo.name}`);
            await startJWTAgent(projectRootDir, hostinfo.id, phGfarm);
            const result = await checkJWTAgent(projectRootDir, hostinfo.id);
            if (!result) {
              const err = new Error(`start jwt-agent failed on ${hostinfo.name}`);
              err.hostinfo = hostinfo;
              throw err;
            }
            getLogger(projectRootDir).debug(`store jwt-server's passphrase ${hostinfo.name}`);
            setJWTServerPassphrase(projectRootDir, hostinfo.id, phGfarm);
          }
        }
        if (!checkWritePermissions.has(projectRootDir)) {
          checkWritePermissions.set(projectRootDir, []);
        }
        const checkWritePermission = checkWritePermissions.get(projectRootDir);

        if (checkWritePermission.length > 0) {
          await Promise.all(checkWritePermission.map((e)=>{
            return checkRemoteStoragePathWritePermission(projectRootDir, e);
          }));
          checkWritePermission.splice(0);
        }
      }
    } catch (err) {
      await updateProjectState(projectRootDir, "not-started");
      if (err.reason === "CANCELED") {
        getLogger(projectRootDir).debug(err.message);
      } else if (err.reason === "invalidRemoteStorage") {
        getLogger(projectRootDir).error(`you do not have write permission to ${err.storagePath} on ${err.host}`);
      } else {
        getLogger(projectRootDir).error("fatal error occurred while preparing phase:", err);
      }
      removeSsh(projectRootDir);
      removeAllJWTServerPassphrase(projectRootDir);
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

    const { webhook } = await getProjectJson(projectRootDir);
    logger.trace(`webhook setting for ${projectRootDir} \n`, webhook);
    if (typeof webhook !== "undefined" && typeof webhook.URL === "string") {
      if (webhook.project) {
        ee.on("projectStateChanged", async (projectJson)=>{
          const response = await axios.post(webhook.URL, projectJson);
          logger.debug("webhook called on projectStateChanged:", response.status, response.statusText);
          logger.trace(response);
        });
      }
      if (webhook.component) {
        ee.on("componentStateChanged", async (component)=>{
          const response = await axios.post(webhook.URL, component);
          logger.debug("webhook called componentStateChanged:", response.status, response.statusText);
          logger.trace(response);
        });
      }
    }

    await updateProjectROStatus(projectRootDir, true);
    await runProject(projectRootDir);
    await updateProjectROStatus(projectRootDir, false);
  } catch (err) {
    getLogger(projectRootDir).error("fatal error occurred while parsing workflow:", err);
    await updateProjectState(projectRootDir, "failed");
    ack(err);
  } finally {
    emitAll(projectRootDir, "projectJson", await getProjectJson(projectRootDir));
    await sendWorkflow(ack, projectRootDir);
    eventEmitters.delete(projectRootDir);
    removeSsh(projectRootDir);
    removeAllJWTServerPassphrase(projectRootDir);
  }
  return;
}
async function onStopProject(projectRootDir) {
  await stopProject(projectRootDir);
  await updateProjectState(projectRootDir, "stopped");
}
async function onCleanProject(clientID, projectRootDir) {
  try {
    await askUnsavedFiles(clientID, projectRootDir);
  } catch (err) {
    if (err.message === "canceled by user") {
      return;
    }
    throw err;
  }
  await Promise.all([
    cleanProject(projectRootDir),
    removeTempd(projectRootDir, "viewer"),
    removeTempd(projectRootDir, "download")
  ]);
}
async function onRevertProject(clientID, projectRootDir) {
  try {
    await askUnsavedFiles(clientID, projectRootDir);
  } catch (err) {
    if (err.message === "canceled by user") {
      return;
    }
    throw err;
  }
  await Promise.all([
    gitResetHEAD(projectRootDir),
    removeTempd(projectRootDir, "viewer"),
    removeTempd(projectRootDir, "download")
  ]);
}
async function onSaveProject(projectRootDir, ack) {
  const projectJson = await getProjectJson(projectRootDir);
  const { readOnly, state: projectState } = projectJson;
  if (readOnly) {
    getLogger(projectRootDir).error("readOnly project can not be saved", projectRootDir);
    return ack(new Error("project is read-only"));
  }
  if (!allowedOperations[projectState].includes("saveProject")) {
    getLogger(projectRootDir).error(projectState, "project can not be saved", projectRootDir);
    return ack(new Error(`${projectState} project is not allowed to save`));
  }
  if (projectJson.exportInfo && projectJson.exportInfo.notChanged) {
    projectJson.exportInfo.notChanged = false;
  }

  projectJson.state = "not-started";
  const filename = path.resolve(projectRootDir, projectJsonFilename);
  await writeJsonWrapper(filename, projectJson);
  await gitAdd(projectRootDir, filename);
  await setComponentStateR(projectRootDir, projectRootDir, "not-started", false, ["finished"]);
  await gitCommit(projectRootDir);
}

async function projectOperator({ clientID, projectRootDir, ack, operation }) {
  const projectState = await getProjectState(projectRootDir);
  //ignore disallowd operation for this state
  if (!allowedOperations[projectState].includes(operation)) {
    getLogger(projectRootDir).debug(`${operation} is not allowed at ${projectState} state`);
    return false;
  }
  try {
    switch (operation) {
      case "runProject":
        //do not wait onRunProject
        onRunProject(clientID, projectRootDir, ack);
        break;
      case "stopProject":
        await onStopProject(projectRootDir, ack);
        break;
      case "cleanProject":
        await onCleanProject(clientID, projectRootDir, ack);
        break;
      case "revertProject":
        await onRevertProject(clientID, projectRootDir, ack);
        break;
      case "saveProject":
        await onSaveProject(projectRootDir, ack);
        break;
    }
  } catch (e) {
    getLogger(projectRootDir).error(`${operation} failed`, e);
    ack(e);
  } finally {
    if (operation !== "runProject") {
      await Promise.all([
        sendWorkflow(null, projectRootDir),
        sendTaskStateList(projectRootDir),
        sendProjectJson(projectRootDir),
        sendComponentTree(projectRootDir)
      ]);
    }
  }
  getLogger(projectRootDir).debug(`${operation} handler finished`);
  return ack(true);
}
function getProjectOperationQueue(projectRootDir) {
  if (!projectOperationQueues.has(projectRootDir)) {
    const tmp = new SBS({
      name: "projectOperator",
      exec: projectOperator,
      submitHook: async (queue, { operation })=>{
        const last = queue.getLastEntry();
        if (last !== null && last.args.operation === operation) {
          getLogger(projectRootDir).debug("duplicated operation is ignored", operation);
          return false;
        }
        //flush operation queue if cleanProject is called
        if (operation === "cleanProject") {
          queue.clear();
        }
        return true;
      }
    });
    projectOperationQueues.set(projectRootDir, tmp);
  }
  return projectOperationQueues.get(projectRootDir);
}
async function onProjectOperation(clientID, projectRootDir, operation, ack) {
  const queue = getProjectOperationQueue(projectRootDir);
  const rt = await queue.qsub({ operation, clientID, projectRootDir, ack });
  return rt;
}

module.exports = {
  onGetProjectJson,
  onGetWorkflow,
  onUpdateProjectDescription,
  onUpdateProjectROStatus,
  onProjectOperation
};
