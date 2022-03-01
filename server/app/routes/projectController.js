/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License.txt in the project root for the license information.
 */
"use strict";
const { promisify } = require("util");
const fs = require("fs-extra");
const path = require("path");
const klaw = require("klaw");
const ARsshClient = require("arssh2-client");
const glob = require("glob");
const { create } = require("abc4");
const { emitLongArray } = require("./utility");
const { convertPathSep } = require("../core/pathUtils");
const { readJsonGreedy } = require("../core/fileUtils");
const { getDateString } = require("../lib/utility");
const { interval, projectJsonFilename, componentJsonFilename } = require("../db/db");
const { getChildren, getComponentDir, getComponent } = require("../core/workflowUtil");
const { hasChild } = require("../core/workflowComponent");
const {
  setCwd,
  getCwd,
  addCluster,
  getLogger
} = require("../core/projectResource");
const { gitAdd } = require("../core/gitOperator2");
const { addSsh, askPassword } = require("../core/sshManager");
const {
  addInputFile,
  addOutputFile,
  removeInputFile,
  removeOutputFile,
  renameInputFile,
  renameOutputFile,
  addLink,
  addFileLink,
  removeLink,
  removeFileLink,
  cleanComponent,
  removeComponent,
  createNewComponent,
  updateComponent,
  updateStepNumber,
  getComponentTree
} = require("../core/componentFilesOperator");
const { getProjectState } = require("../core/projectFilesOperator");
const { taskStateFilter } = require("../core/taskUtil");
const blockSize = 100; //max number of elements which will be sent via taskStateList at one time


//read and send current workflow and its child and grandson
async function sendWorkflow(emit, projectRootDir, cwd) {
  const componentDir = cwd ? cwd : getCwd(projectRootDir);
  const wf = await getComponent(projectRootDir, path.resolve(componentDir, componentJsonFilename));
  const rt = Object.assign({}, wf);
  rt.descendants = await getChildren(projectRootDir, wf.ID);

  for (const child of rt.descendants) {
    if (child.handler) {
      delete child.handler;
    }

    if (hasChild(child)) {
      const grandson = await getChildren(projectRootDir, child.ID);
      child.descendants = grandson.map((e)=>{
        if (e.type === "task") {
          return { type: e.type, pos: e.pos, host: e.host, useJobScheduler: e.useJobScheduler };
        }
        return { type: e.type, pos: e.pos };
      });
    }
  }
  emit("workflow", rt);
}

async function sendComponentTree(emit, projectRootDir, rootDir) {
  const targetDir = path.isAbsolute(rootDir) ? rootDir : path.resolve(projectRootDir, rootDir);
  const rt = await getComponentTree(projectRootDir, targetDir);
  emit("componentTree", rt);
}

//read and send projectJson
async function sendProjectJson(emit, projectRootDir) {
  getLogger(projectRootDir).trace("projectState: sendProjectJson", projectRootDir);
  const filename = path.resolve(projectRootDir, projectJsonFilename);
  const projectJson = await readJsonGreedy(filename);
  getLogger(projectRootDir).trace("projectState: stat=", projectJson.state);
  emit("projectJson", projectJson);
}

async function sendTaskStateList(emit, projectRootDir) {
  console.log("======= DEBUG ======== sendTaskStateList in route/projectController.js is called ");
  const p = [];
  klaw(projectRootDir)
    .on("data", (item)=>{
      if (!item.path.endsWith(componentJsonFilename)) {
        return;
      }
      p.push(readJsonGreedy(item.path));
    })
    .on("end", async()=>{
      const jsonFiles = await Promise.all(p);
      const data = jsonFiles
        .filter((e)=>{
          return e.type === "task" && e.hasOwnProperty("ancestorsName");
        })
        .map(taskStateFilter);
      await emitLongArray(emit, "taskStateList", data, blockSize);
    });
}

async function getState(projectRootDir) {
  const componentJsonFiles = await promisify(glob)(path.join("**", componentJsonFilename), { cwd: projectRootDir });
  const states = await Promise.all(componentJsonFiles.map(async(jsonFile)=>{
    const component = await readJsonGreedy(path.resolve(projectRootDir, jsonFile));
    return component.state;
  }));
  let projectState = "finished";
  for (const state of states) {
    if (state === "unknown") {
      return "unknown";
    }
    if (state === "failed") {
      projectState = "failed";
    }
  }
  return projectState;
}

async function getSourceCandidates(projectRootDir, ID) {
  const componentDir = await getComponentDir(projectRootDir, ID);
  return promisify(glob)("*", { cwd: componentDir, ignore: componentJsonFilename });
}

/**
 * ask user what file to be used
 */
async function getSourceFilename(projectRootDir, component, sio) {
  return new Promise(async(resolve)=>{
    sio.on("sourceFile", (id, filename)=>{
      resolve(filename);
    });

    if (component.uploadOnDemand) {
      sio.emit("requestSourceFile", component.ID, component.name, component.description);
    } else {
      const filelist = await getSourceCandidates(projectRootDir, component.ID);
      getLogger(projectRootDir).trace("sourceFile: candidates=", filelist);

      if (filelist.length === 1) {
        resolve(filelist[0]);
      } else if (filelist.length === 0) {
        getLogger(projectRootDir).warn("no files found in source component");
        sio.emit("requestSourceFile", component.ID, component.name, component.description);
      } else {
        sio.emit("askSourceFilename", component.ID, component.name, component.description, filelist);
      }
    }
  });
}


async function createCloudInstance(projectRootDir, hostInfo, sio) {
  const order = hostInfo.additionalParams || {};
  order.headOnlyParam = hostInfo.additionalParamsForHead || {};
  order.provider = hostInfo.type;
  order.os = hostInfo.os;
  order.region = hostInfo.region;
  order.numNodes = hostInfo.numNodes;
  order.InstanceType = hostInfo.InstanceType;
  order.rootVolume = hostInfo.rootVolume;
  order.shareStorage = hostInfo.shareStorage;
  order.playbook = hostInfo.playbook;
  //order.mpi = hostInfo.mpi;
  //order.compiler = hostInfo.compiler;
  order.batch = hostInfo.jobScheduler;
  order.id = order.hasOwnProperty("id") ? order.id : await askPassword(sio, "input access key for AWS");
  order.pw = order.hasOwnProperty("pw") ? order.pw : await askPassword(sio, "input secret access key for AWS");
  const logger = getLogger(projectRootDir);
  order.info = logger.debug.bind(logger);
  order.debug = logger.trace.bind(logger);

  const cluster = await create(order);
  addCluster(projectRootDir, cluster);
  const config = {
    host: cluster.headNodes[0].publicNetwork.hostname,
    port: hostInfo.port,
    username: cluster.user,
    privateKey: cluster.privateKey,
    passphrase: "",
    password: null
  };

  const arssh = new ARsshClient(config, { connectionRetryDelay: 1000, verbose: true });
  if (hostInfo.type === "aws") {
    logger.debug("wait for cloud-init");
    await arssh.watch("tail /var/log/cloud-init-output.log >&2 && cloud-init status", { out: /done|error|disabled/ }, 30000, 60, {}, logger.debug.bind(logger), logger.debug.bind(logger));
    logger.debug("cloud-init done");
  }
  if (hostInfo.renewInterval) {
    arssh.renewInterval = hostInfo.renewInterval * 60 * 1000;
  }

  if (hostInfo.renewDelay) {
    arssh.renewDelay = hostInfo.renewDelay * 1000;
  }

  hostInfo.host = config.host;
  addSsh(projectRootDir, hostInfo, arssh);
}

async function onRunProject(sio, projectRootDir, cb) {
  getLogger(projectRootDir).debug("run event recieved");
  const emit = sio.emit.bind(sio);

  if (typeof cb !== "function") {
    cb = ()=>{};
  }
  try {
    const projectJson = await readJsonGreedy(path.resolve(projectRootDir, projectJsonFilename));
    const rootWF = await readJsonGreedy(path.resolve(projectRootDir, componentJsonFilename));
    await validateComponents(projectRootDir, rootWF.ID);
    await gitCommit(projectRootDir, "wheel", "wheel@example.com");//TODO replace name and mail
  } catch (err) {
    getLogger(projectRootDir).error("fatal error occurred while validation phase:", err);
    await updateProjectState(projectRootDir, "not-started");
    await sendProjectJson(emit, projectRootDir);
    cb(false);
    return false;
  }

  //actual project run start from here
  try {
    await updateProjectState(projectRootDir, "prepareing");
    const sourceComponents = await getSourceComponents(projectRootDir);

    for (const component of sourceComponents) {
      if (component.disable) {
        getLogger(projectRootDir).debug(`disabled component: ${component.name}(${component.ID})`);
        continue;
      }
      const filename = await getSourceFilename(projectRootDir, component, sio);
      const componentDir = await getComponentDir(projectRootDir, component.ID);
      const outputFile = component.outputFiles[0].name;
      getLogger(projectRootDir).trace("sourceFile:", filename, "will be used as", outputFile);

      if (!isValidOutputFilename(outputFile)) {
        getLogger(projectRootDir).trace("sourceFile: invalid outputFilename", outputFile);
        continue;
      }
      if (filename !== outputFile) {
        await deliverFile(path.resolve(componentDir, filename), path.resolve(componentDir, outputFile));
      }
    }

    const hosts = await getHosts(projectRootDir, null);
    for (const remoteHostName of hosts) {
      const id = remoteHost.getID("name", remoteHostName);
      const hostInfo = remoteHost.get(id);
      if (!hostInfo) {
        return Promise.reject(new Error(`illegal remote host specified ${remoteHostName}`));
      }
      if (hostInfo.type === "aws") {
        await createCloudInstance(projectRootDir, hostInfo, sio);
      } else {
        await createSsh(projectRootDir, remoteHostName, hostInfo, sio);
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
    await sendProjectJson(emit, projectRootDir);
    cb(false);
    return false;
  }

  try {
    await runProject(projectRootDir);
  } catch (err) {
    getLogger(projectRootDir).error("fatal error occurred while parsing workflow:", err);
    await updateProjectState(projectRootDir, "failed");
    await sendProjectJson(emit, projectRootDir);
    cb(false);
    return false;
  } finally {
    removeSsh(projectRootDir);
    removeCluster(projectRootDir);
  }

  try {
    //directly send last status just in case
    await sendProjectJson(emit, projectRootDir);
    await sendWorkflow(emit, projectRootDir);
    await sendTaskStateList(emit, projectRootDir);
  } catch (e) {
    getLogger(projectRootDir).warn("project execution is successfully finished but error occurred in cleanup process", e);
    cb(false);
    return false;
  }

  cb(true);
}

async function onPauseProject(emit, projectRootDir, cb) {
  if (typeof cb !== "function") {
    cb = ()=>{};
  }
  getLogger(projectRootDir).debug("pause event recieved");

  try {
    await pauseProject(projectRootDir);
    await sendProjectJson(emit, projectRootDir);
    await sendWorkflow(emit, projectRootDir);
    await sendTaskStateList(emit, projectRootDir);
  } catch (e) {
    cb(false);
    return;
  }
  getLogger(projectRootDir).debug("pause project done");
  cb(true);
}

async function askUnsavedFiles(emit, projectRootDir) {
  const { added, modified, deleted, renamed } = await gitStatus(projectRootDir);
  const unsavedFiles = [];
  for (const e of added) {
    unsavedFiles.push({ status: "new", name: e });
  }
  for (const e of modified) {
    unsavedFiles.push({ status: "modified", name: e });
  }
  for (const e of deleted) {
    unsavedFiles.push({ status: "deleted", name: e });
  }
  for (const e of renamed) {
    unsavedFiles.push({ status: "renamed", name: e });
  }
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

async function onCleanProject(emit, projectRootDir, withPause, cb) {
  if (typeof cb !== "function") {
    cb = ()=>{};
  }
  getLogger(projectRootDir).debug("clean event recieved");
  await askUnsavedFiles(emit, projectRootDir);

  try {
    if (withPause) {
      await pauseProject(projectRootDir);
    }
    await cleanProject(projectRootDir);
    await sendProjectJson(emit, projectRootDir);
    await sendWorkflow(emit, projectRootDir, projectRootDir);
    await sendTaskStateList(emit, projectRootDir);
  } catch (e) {
    cb(false);
    return;
  }
  getLogger(projectRootDir).debug("clean project done");
  cb(true);
}

async function onSaveProject(emit, projectRootDir, cb) {
  if (typeof cb !== "function") {
    cb = ()=>{};
  }
  getLogger(projectRootDir).debug("saveProject event recieved");

  const projectState = await getProjectState(projectRootDir);
  if (projectState === "not-started") {
    await setProjectState(projectRootDir, "not-started", true);
    await gitCommit(projectRootDir, "wheel", "wheel@example.com");//TODO replace name and mail
    await sendProjectJson(emit, projectRootDir);
  } else {
    getLogger(projectRootDir).error(projectState, "project can not be saved");
  }
  getLogger(projectRootDir).debug("save project done");
  cb();
}

async function onRevertProject(emit, projectRootDir, cb) {
  if (typeof cb !== "function") {
    cb = ()=>{};
  }
  getLogger(projectRootDir).debug("revertProject event recieved");
  await askUnsavedFiles(emit, projectRootDir);
  await gitResetHEAD(projectRootDir);
  await sendProjectJson(emit, projectRootDir, "not-started");
  await sendWorkflow(emit, projectRootDir);
  getLogger(projectRootDir).debug("revert project done");
  cb();
}

async function onUpdateProjectJson(emit, projectRootDir, prop, value, cb) {
  if (typeof cb !== "function") {
    cb = ()=>{};
  }
  getLogger(projectRootDir).debug("updateProjectJson event recieved:", prop, value);
  const filename = path.resolve(projectRootDir, projectJsonFilename);

  try {
    const projectJson = await readJsonGreedy(filename);
    projectJson[prop] = value;
    projectJson.mtime = getDateString(true);
    await fs.writeJson(filename, projectJson, { spaces: 4 });
    await gitAdd(projectRootDir, filename);
  } catch (e) {
    getLogger(projectRootDir).error("update project Json failed", e);
    cb(false);
    return;
  }
  getLogger(projectRootDir).debug("updateProjectJson done");
  cb(true);
}

async function onGetProjectState(emit, projectRootDir, cb) {
  if (typeof cb !== "function") {
    cb = ()=>{};
  }

  try {
    const state = await getProjectState(projectRootDir);
    emit("projectState", state);
  } catch (e) {
    getLogger(projectRootDir).error("send project state failed", e);
    cb(false);
    return;
  }
  getLogger(projectRootDir).debug("send project state done");
  cb(true);
}

async function onGetProjectJson(emit, projectRootDir, cb) {
  if (typeof cb !== "function") {
    cb = ()=>{};
  }

  try {
    await sendProjectJson(emit, projectRootDir);
  } catch (e) {
    getLogger(projectRootDir).error("send project state failed", e);
    cb(false);
    return;
  }
  getLogger(projectRootDir).debug("send task state list done");
  cb(true);
}

async function onTaskStateListRequest(emit, projectRootDir, cb) {
  if (typeof cb !== "function") {
    cb = ()=>{};
  }
  getLogger(projectRootDir).debug("getTaskStateList event recieved:");

  try {
    await sendTaskStateList(emit, projectRootDir);
  } catch (e) {
    getLogger(projectRootDir).error("send task state list failed", e);
    cb(false);
    return;
  }
  getLogger(projectRootDir).debug("send task state list done");
  cb(true);
}


async function onWorkflowRequest(emit, projectRootDir, ID, cb) {
  if (typeof cb !== "function") {
    cb = ()=>{};
  }
  getLogger(projectRootDir).debug("Workflow Request event recieved:", projectRootDir, ID);
  const componentDir = await getComponentDir(projectRootDir, ID);
  getLogger(projectRootDir).info("open workflow:", componentDir);

  try {
    await setCwd(projectRootDir, componentDir);
    await sendWorkflow(emit, projectRootDir);
  } catch (e) {
    getLogger(projectRootDir).error("read workflow failed", e);
    cb(false);
    return;
  }
  cb(true);
}

async function onCreateNode(emit, projectRootDir, request, cb) {
  if (typeof cb !== "function") {
    cb = ()=>{};
  }
  getLogger(projectRootDir).debug("createNode event recieved:", request);
  let rt = null;

  try {
    const parentDir = convertPathSep(request.path);
    rt = await createNewComponent(projectRootDir, parentDir, request.type, request.pos);
    await sendWorkflow(emit, projectRootDir, parentDir);
  } catch (e) {
    e.projectRootDir = projectRootDir;
    e.request = request;
    getLogger(projectRootDir).error("create node failed", e);
    cb(false);
    return false;
  }
  cb(true);
  return rt;
}

async function onUpdateNode(emit, projectRootDir, ID, prop, value, cb) {
  if (typeof cb !== "function") {
    cb = ()=>{};
  }
  getLogger(projectRootDir).debug("updateNode event recieved:", projectRootDir, ID, prop, value);

  try {
    await updateComponent(projectRootDir, ID, prop, value);
    const filename = path.resolve(projectRootDir, projectJsonFilename);
    const projectJson = await readJsonGreedy(filename);
    const cwd = projectJson.componentPath[ID];
    console.log(cwd);
    await sendWorkflow(emit, projectRootDir, cwd);

    if (prop === "name") {
      await sendProjectJson(emit, projectRootDir); //to update componentPath
      await sendComponentTree(emit, projectRootDir, projectRootDir);
    }
  } catch (e) {
    e.projectRootDir = projectRootDir;
    e.ID = ID;
    e.prop = prop;
    e.value = value;
    getLogger(projectRootDir).error("update node failed", e);
    cb(false);
    return;
  }
  cb(true);
}

/**
 * @param {*} emit - instance of SocketIO.socket emit
 * @param {*} projectRootDir - project root directory
 * @param {*} rootID - project root component ID
 * @param {*} cb - callback function
 * @returns {*} -
 */
async function onUpdateStepNumber(emit, projectRootDir, cb) {
  if (typeof cb !== "function") {
    cb = ()=>{};
  }
  getLogger(projectRootDir).debug("updateStepNumber event recieved:", projectRootDir);

  try {
    await updateStepNumber(projectRootDir);
    await sendWorkflow(emit, projectRootDir);
  } catch (e) {
    e.projectRootDir = projectRootDir;
    getLogger(projectRootDir).error("update node failed", e);
    cb(false);
    return;
  }
  cb(true);
}

async function onRemoveNode(emit, projectRootDir, targetID, cb) {
  if (typeof cb !== "function") {
    cb = ()=>{};
  }
  getLogger(projectRootDir).debug("removeNode event recieved:", projectRootDir, targetID);

  try {
    await removeComponent(projectRootDir, targetID);
    await sendWorkflow(emit, projectRootDir);
  } catch (e) {
    getLogger(projectRootDir).error("remove node failed:", e);
    cb(false);
    return;
  }
  cb(true);
}


/**
 * @param {Object}  msg
 * @param {string}  msg.src - リンク元ID
 * @param {string}  msg.dst - リンク先ID
 * @param {boolean} msg.isElse - elseからのリンクかどうかのフラグ
 */
async function onAddLink(emit, projectRootDir, msg, cb) {
  if (typeof cb !== "function") {
    cb = ()=>{};
  }
  getLogger(projectRootDir).debug("addLink event recieved:", msg.src, msg.dst, msg.isElse);


  try {
    await addLink(projectRootDir, msg.src, msg.dst, msg.isElse);
    await sendWorkflow(emit, projectRootDir);
  } catch (e) {
    getLogger(projectRootDir).error("addLink failed", e);
    cb(false);
    return;
  }
  cb(true);
}

async function onRemoveLink(emit, projectRootDir, msg, cb) {
  if (typeof cb !== "function") {
    cb = ()=>{};
  }
  getLogger(projectRootDir).debug("removeLink event recieved:", msg.src, msg.dst);

  try {
    await removeLink(projectRootDir, msg.src, msg.dst, msg.isElse);
    await sendWorkflow(emit, projectRootDir);
  } catch (e) {
    getLogger(projectRootDir).error("removeLink failed", e);
    cb(false);
    return;
  }
  cb(true);
}


async function onAddFileLink(emit, projectRootDir, srcNode, srcName, dstNode, dstName, cb) {
  if (typeof cb !== "function") {
    cb = ()=>{};
  }
  getLogger(projectRootDir).debug("addFileLink event recieved:", srcNode, srcName, dstNode, dstName);

  try {
    await addFileLink(projectRootDir, srcNode, srcName, dstNode, dstName);
    await sendWorkflow(emit, projectRootDir);
  } catch (e) {
    getLogger(projectRootDir).error("add file link failed", e);
    cb(false);
    return;
  }
  cb(true);
}

async function onRemoveFileLink(emit, projectRootDir, srcNode, srcName, dstNode, dstName, cb) {
  if (typeof cb !== "function") {
    cb = ()=>{};
  }
  getLogger(projectRootDir).debug("removeFileLink event recieved:", srcNode, srcName, dstNode, dstName);

  try {
    await removeFileLink(projectRootDir, srcNode, srcName, dstNode, dstName);
    await sendWorkflow(emit, projectRootDir);
  } catch (e) {
    getLogger(projectRootDir).error("remove file link failed", e);
    cb(false);
    return;
  }
  cb(true);
}

async function onCleanComponent(emit, projectRootDir, targetID, cb) {
  if (typeof cb !== "function") {
    cb = ()=>{};
  }
  getLogger(projectRootDir).debug("cleanComponent event recieved:", targetID);

  try {
    await cleanComponent(projectRootDir, targetID);
    await sendWorkflow(emit, projectRootDir);
  } catch (e) {
    getLogger(projectRootDir).error("reset component failed:", e);
    cb(false);
    return;
  }
  cb(true);
}

async function onGetComponentTree(projectRootDir, rootDir, cb) {
  if (typeof cb !== "function") {
    getLogger(projectRootDir).error("getComponentTree must be called with call back function");
  }
  getLogger(projectRootDir).debug("getComponentTree event recieved:", rootDir);
  const targetDir = path.isAbsolute(rootDir) ? rootDir : path.resolve(projectRootDir, rootDir);

  try {
    const rt = await getComponentTree(projectRootDir, targetDir);
    return cb(rt);
  } catch (e) {
    getLogger(projectRootDir).error("getComponentTree failed:", e);
    return cb(false);
  }
}


function registerListeners(socket, projectRootDir) {
  const emit = socket.emit.bind(socket);

  /*
  async function onProjectStateChange(projectJson) {
    getLogger(projectRootDir).trace("projectState: onProjectStateChanged", projectJson.state);
    emit("projectJson", projectJson);
    emit("projectState", projectJson.state);
  }

  //event listener for task state changed
  async function onTaskStateChanged(task) {
    await sendTaskStateList(emit, projectRootDir);
    setTimeout(()=>{
      once(projectRootDir, "taskStateChanged", onTaskStateChanged);
    }, interval);
  }

  //event listener for component state changed
  function onComponentStateChanged(component) {
    sendWorkflow(emit, projectRootDir)
      .then(()=>{
        setTimeout(()=>{
          once(projectRootDir, "componentStateChanged", onComponentStateChanged);
        }, interval);
      });
  }

  //event listener for result files ready
  function onResultFilesReady(results) {
    emitLongArray(emit, "results", results);
  }
  */

  /*
  on(projectRootDir, "projectStateChanged", onProjectStateChange);
  once(projectRootDir, "taskStateChanged", onTaskStateChanged);
  once(projectRootDir, "componentStateChanged", onComponentStateChanged);
  on(projectRootDir, "resultFilesReady", onResultFilesReady);

  socket.on("disconnecting", ()=>{
    off(projectRootDir, "projectStateChanged", onProjectStateChange);
    off(projectRootDir, "taskStateChanged", onTaskStateChanged);
    off(projectRootDir, "componentStateChanged", onComponentStateChanged);
    off(projectRootDir, "resultFilesReady", onResultFilesReady);
  });
  */

  socket.on("updateProjectJson", onUpdateProjectJson.bind(null, emit, projectRootDir));
  socket.on("getProjectState", onGetProjectState.bind(null, emit, projectRootDir));
  socket.on("getProjectJson", onGetProjectJson.bind(null, emit, projectRootDir));
  socket.on("getTaskStateList", onTaskStateListRequest.bind(null, emit, projectRootDir));
  socket.on("getWorkflow", onWorkflowRequest.bind(null, emit, projectRootDir));
  socket.on("createNode", onCreateNode.bind(null, emit, projectRootDir));
  socket.on("updateNode", onUpdateNode.bind(null, emit, projectRootDir));
  socket.on("removeNode", onRemoveNode.bind(null, emit, projectRootDir));
  //socket.on("addInputFile", onAddInputFile.bind(null, emit, projectRootDir));
  //socket.on("addOutputFile", onAddOutputFile.bind(null, emit, projectRootDir));
  //socket.on("removeInputFile", onRemoveInputFile.bind(null, emit, projectRootDir));
  //socket.on("removeOutputFile", onRemoveOutputFile.bind(null, emit, projectRootDir));
  //socket.on("renameInputFile", onRenameInputFile.bind(null, emit, projectRootDir));
  //socket.on("renameOutputFile", onRenameOutputFile.bind(null, emit, projectRootDir));
  socket.on("addLink", onAddLink.bind(null, emit, projectRootDir));
  socket.on("removeLink", onRemoveLink.bind(null, emit, projectRootDir));
  socket.on("addFileLink", onAddFileLink.bind(null, emit, projectRootDir));
  socket.on("removeFileLink", onRemoveFileLink.bind(null, emit, projectRootDir));
  socket.on("cleanComponent", onCleanComponent.bind(null, emit, projectRootDir));
  socket.on("updateStepNumber", onUpdateStepNumber.bind(null, emit, projectRootDir));
  socket.on("getComponentTree", onGetComponentTree.bind(null, projectRootDir));
}

module.exports = registerListeners;
