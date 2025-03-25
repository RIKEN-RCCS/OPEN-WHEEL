/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const fs = require("fs-extra");
const path = require("path");
const { promisify } = require("util");
const { EventEmitter } = require("events");
const glob = require("glob");
const { debounce } = require("perfect-debounce");
const nunjucks = require("nunjucks");
nunjucks.configure({ autoescape: true });
const { remoteHost, componentJsonFilename, filesJsonFilename, statusFilename, rsyncExcludeOptionOfWheelSystemFiles } = require("../db/db.js");
const { getSsh, getSshHostinfo } = require("./sshManager.js");
const { exec } = require("./executer");
const { getDateString, writeJsonWrapper } = require("../lib/utility.js");
const { sanitizePath, convertPathSep, replacePathsep } = require("./pathUtils");
const { readJsonGreedy } = require("./fileUtils.js");
const { deliverFile, deliverFilesOnRemote, deliverFilesFromRemote, deliverFilesFromHPCISS } = require("./deliverFile.js");
const { paramVecGenerator, getParamSize, getFilenames, getParamSpacev2 } = require("./parameterParser.js");
const { getChildren, isLocal, isSameRemoteHost, setComponentStateR } = require("./projectFilesOperator.js");
const { writeComponentJson, readComponentJson, readComponentJsonByID } = require("./componentJsonIO.js");
const { isInitialComponent, removeDuplicatedComponent, hasStoragePath, isLocalComponent } = require("./workflowComponent.js");
const { evalCondition, getRemoteWorkingDir, isFinishedState, isSubComponent } = require("./dispatchUtils.js");
const { getLogger } = require("../logSettings.js");
const { cancelDispatchedTasks } = require("./taskUtil.js");
const { eventEmitters } = require("./global.js");
const { createTempd } = require("./tempd.js");
const { viewerSupportedTypes, getFiletype } = require("./viewerUtils.js");
const {
  loopInitialize,
  forGetNextIndex,
  getPrevIndex,
  getInstanceDirectoryName,
  keepLoopInstance,
  forIsFinished,
  forTripCount,
  whileGetNextIndex,
  whileIsFinished,
  foreachGetNextIndex,
  foreachGetPrevIndex,
  foreachIsFinished,
  foreachTripCount,
  foreachKeepLoopInstance,
  foreachSearchLatestFinishedIndex
} = require("./loopUtils.js");
const { makeCmd } = require("./psUtils.js");
const { overwriteByRsync } = require("./rsync.js");
const { gfcp, gfrm, gfpcopy, gfptarCreate } = require("./gfarmOperator.js");

const wheelSystemEnv = [
  "WHEEL_CURRENT_INDEX",
  "WHEEL_NEXT_INDEX",
  "WHEEL_PREV_INDEX",
  "WHEEL_FOR_START",
  "WHEEL_FOR_END",
  "WHEEL_FOR_STEP",
  "WHEEL_PS_PARAM",
  "WHEEL_FOREACH_LEN",
  "WHEEL_REMOTE_WORK"
];

const taskDB = new Map();
//private functions
/**
 * replace target files in bulkjob by nunjucks
 * @param {string} templateRoot - path of PS component's "template" directory
 * @param {string[]} targetFiles - filenames to be rewritten
 * @param {object} params - parameters for this instance directory
 * @param {number} bulkNumber - bulkjob id number
 */
async function replaceByNunjucksForBulkjob(templateRoot, targetFiles, params, bulkNumber) {
  return Promise.all(
    targetFiles.map(async (targetFile)=>{
      const template = (await fs.readFile(path.resolve(templateRoot, targetFile))).toString();
      const temp = replacePathsep(targetFile);
      const arrTargetPath = temp.split(path.posix.sep);
      const targetFileNewname = `${bulkNumber}.${arrTargetPath[arrTargetPath.length - 1]}`;
      arrTargetPath.splice(-1, 1, targetFileNewname);
      const targetFilePath = arrTargetPath.join(path.posix.sep);
      const result = nunjucks.renderString(template, params);
      return fs.outputFile(path.resolve(templateRoot, targetFilePath), result);
    })
  );
}

/**
 * write used parameter to file
 * @param {string} templateRoot - path of PS component's "template" directory
 * @param {string[]} targetFiles - filenames to be rewritten
 * @param {object} params - parameters for this instance directory
 * @param {number} bulkNumber - bulkjob id number
 */
async function writeParameterSetFile(templateRoot, targetFiles, params, bulkNumber) {
  const paramsKeys = Object.keys(params);
  let data = "";
  let targetNum = 0;
  targetFiles.forEach((targetFile, index)=>{
      const label = `BULKNUM_${bulkNumber}`;
      const target = replacePathsep(targetFile);
      const targetKey = paramsKeys[index];
      const targetVal = params[targetKey];
      data += `${label}_TARGETNUM_${targetNum}_FILE="./${target}"\n${label}_TARGETNUM_${targetNum}_KEY="${targetKey}"\n${label}_TARGETNUM_${targetNum}_VALUE="${targetVal}"\n`;
      targetNum++;
  })
  if(data !== ""){
  await fs.writeFile(path.resolve(templateRoot, "parameterSet.wheel.txt"), data);
  }
}

/**
 * parse workflow graph and dispatch ready tasks to executer
 * @param {string} projectRootDir - project's root path
 * @param {string} cwfID -          current dispatching workflow ID
 * @param {string} cwfDir -         current dispatching workflow directory (absolute path);
 * @param {string} startTime -      project start time
 * @param {object} componentPath -  componentPath in project Json
 * @param {object} env -             environment variables
 * @param {string } ancestorsType - comma separated ancestor components' type
 */
class Dispatcher extends EventEmitter {
  constructor(projectRootDir, cwfID, cwfDir, startTime, componentPath, env, ancestorsType) {
    super();
    this.projectRootDir = projectRootDir;
    this.cwfID = cwfID;
    this.cwfDir = cwfDir;
    this.projectStartTime = startTime;
    this.componentPath = componentPath;
    this.ancestorsType = ancestorsType;
    this.env = Object.assign({}, env);
    this.currentSearchList = [];
    this.pendingComponents = [];
    this.forceFinishedLoops = [];
    this.children = new Set(); //child dispatcher instance
    this.runningTasks = []; //store currently running tasks from this dispatcher object
    this.needToRerun = false;
    if (!taskDB.has(this.projectRootDir)) {
      taskDB.set(this.projectRootDir, new Set());
    }
    this.dispatchedTasks = taskDB.get(this.projectRootDir); //store all dipatched tasks in this project
    this.hasFailedComponent = false;
    this.hasUnknownComponent = false;
    this.firstCall = true;
    this.on("taskCompleted", (state)=>{
      this.setStateFlag(state);
      this._reserveDispatch();
    });
  }

  _reserveDispatch() {
    if (this.listenerCount("dispatch") === 0) {
      this.needToRerun = true;
    } else {
      setImmediate(()=>{
        this.emit("dispatch");
      });
    }
  }

  async _asyncInit() {
    this.cwfJson = await readJsonGreedy(path.resolve(this.cwfDir, componentJsonFilename));
    //overwrite doCleanup if parent's cleanupFlag is not "2"
    if (this.cwfJson.cleanupFlag !== "2") {
      this.doCleanup = this.cwfJson.cleanupFlag === "0";
    }
    //overwrite environment variables
    return true;
  }

  setStateFlag(state) {
    if (state === "unknown") {
      this.hasUnknownComponent = true;
    } else if (state === "failed") {
      this.hasFailedComponent = true;
    }
  }

  async _dispatchOneComponent(target) {
    try {
      if (target.state === "finished") {
        getLogger(this.projectRootDir).info(`finished component don't re-run at this time: ${target.name}(${target.ID})`);
      } else {
        await this._cmdFactory(target.type).call(this, target);
      }
    } catch (err) {
      await this._setComponentState(target, "failed");
      this.hasFailedComponent = true;
      throw err;
    } finally {
      this.setStateFlag(target.state);
      if (isFinishedState(target.state)) {
        getLogger(this.projectRootDir).info(`finished component: ${target.name}(${target.ID})`);
      }
      this._reserveDispatch();
    }
    return true;
  }

  async _dispatch() {
    try {
      getLogger(this.projectRootDir).trace("_dispatch called", this.cwfDir);
      if (this.firstCall) {
        await this._asyncInit();
        const childComponents = await getChildren(this.projectRootDir, this.cwfDir, true);
        const initialComponents = await Promise.all(
          childComponents.map(async (component)=>{
            if (await isInitialComponent(this.projectRootDir, component)) {
              return component;
            }
            return null;
          })
        );

        this.currentSearchList = initialComponents.filter((e)=>{
          return e !== null;
        });
        getLogger(this.projectRootDir).debug("initial components: ", this.currentSearchList.map((e)=>{
          return e.name;
        }));
        this.firstCall = false;
      }
      getLogger(this.projectRootDir).trace("currentList:", this.currentSearchList.map((e)=>{
        return e.name;
      }));

      const promises = [];
      for (const target of this.currentSearchList) {
        if (target.disable) {
          getLogger(this.projectRootDir).info(`disabled component: ${target.name}(${target.ID})`);
          continue;
        }
        if (!await this._isReady(target)) {
          this.pendingComponents.push(target);
          continue;
        }
        await this._getInputFiles(target);
        promises.push(this._dispatchOneComponent(target));
      }
      if (promises.length > 0) {
        await Promise.all(promises);
      }
      getLogger(this.projectRootDir).debug("search next components");

      //remove duplicated entry
      this.currentSearchList = removeDuplicatedComponent(this.pendingComponents);
      this.currentSearchList = await this._removeComponentsWhichHasDisabledDependency(this.currentSearchList);
      this.pendingComponents = [];
      this.runningTasks = this.runningTasks.filter((task)=>{
        return !isFinishedState(task.state);
      });
      if (this._isFinished()) {
        const state = this._getState();
        this.emit("done", state);
      } else {
        getLogger(this.projectRootDir).trace("waiting component", this.currentSearchList.map((e)=>{
          return e.name;
        }));

        this.once("dispatch", this._dispatch);
      }
      if (this.needToRerun) {
        this.needToRerun = false;
        getLogger(this.projectRootDir).debug("revoke _dispatch()");
        return this._reserveDispatch();
      }
      return true;
    } catch (e) {
      this.emit("error", e);
      return false;
    }
  }

  async _hasDisabledDependency(component) {
    if ((!component.previous || component.previous.length === 0)
      && (!component.inputFiles || component.inputFiles.length === 0)) {
      return false;
    }
    if (component.previous) {
      for (const ID of component.previous) {
        const previous = await this._getComponent(ID);
        if (!previous.disable) {
          return false;
        }
        const rt = await this._hasDisabledDependency(previous);
        if (!rt) {
          return false;
        }
      }
    }
    if (component.inputFiles) {
      for (const inputFile of component.inputFiles) {
        for (const src of inputFile.src) {
          if (src.srcNode === component.parent) {
            continue;
          }
          const previousF = await this._getComponent(src.srcNode);
          if (!previousF.disable) {
            return false;
          }
          const rtF = await this._hasDisabledDependency(previousF);
          if (!rtF) {
            return false;
          }
        }
      }
    }
    return true;
  }

  /**
   * search disabled component recursively in upward direction
   * @param {object[]} components - start point components for searching
   * @returns {object[]} - component list which do not have disabled dependency
   */
  async _removeComponentsWhichHasDisabledDependency(components) {
    const shouldBeRemoved = await Promise.all(components.map(async (component)=>{
      return this._hasDisabledDependency(component);
    }));
    return components.filter((v, index)=>{
      return !shouldBeRemoved[index];
    });
  }

  _getState() {
    let state = "finished";
    if (this.hasUnknownComponent) {
      state = "unknown";
    } else if (this.hasFailedComponent) {
      state = "failed";
    }
    return state;
  }

  _isFinished() {
    getLogger(this.projectRootDir).trace(`${this.cwfDir} number of running task, waiting component = ${this.runningTasks.length}, ${this.currentSearchList.length}`);
    return this.runningTasks.length === 0 && this.currentSearchList.length === 0;
  }

  async start() {
    if (this.listenerCount("dispatch") === 0) {
      this.once("dispatch", this._dispatch);
    }
    return new Promise((resolve, reject)=>{
      for (const child of this.children) {
        child.start()
          .then(()=>{
            this.children.forEach((e)=>{
              if (e.done) {
                this.children.delete(e);
              }
            });
          })
          .catch((e)=>{ this.onError(e); });
      }
      const onStop = ()=>{
        this.removeListener("dispatch", this._dispatch);
        /*eslint-disable no-use-before-define */
        this.removeListener("error", onError);
        this.removeListener("done", this.onDone);
        /*eslint-enable no-use-before-define */
        this.removeListener("stop", onStop);
      };
      //never call this.onDone directly except for _jumpHandler
      this.onDone = (state)=>{
        getLogger(this.projectRootDir).trace(`dispatcher finished ${this.cwfDir} with ${state}`);
        onStop();
        resolve(state);
      };
      const onError = (err)=>{
        getLogger(this.projectRootDir).trace(`dispatcher terminated ${this.cwfDir} with ${err}`);
        onStop();
        reject(err);
      };
      this.once("done", this.onDone);
      this.once("error", onError);
      this.once("stop", onStop);

      setImmediate(()=>{
        this.emit("dispatch");
      });
    });
  }

  async pause() {
    const p = [];
    p.push(cancelDispatchedTasks(this.runningTasks));
    this.emit("stop");
    this.removeListener("dispatch", this._dispatch);

    for (const child of this.children) {
      p.push(child.pause());
    }
    return Promise.all(p);
  }

  async remove() {
    await this.pause();
    const p = [];
    for (const child of this.children) {
      p.push(child.remove());
    }
    await Promise.all(p);
    this.children.clear();
    this.currentSearchList = [];
    this.pendingComponents = [];
  }

  async _addNextComponent(component, useElse = false) {
    let nextComponentIDs = [];
    const componentsWithoutNextProp = ["source", "viewer", "storage", "hpciss", "hpcisstar"];
    if (!componentsWithoutNextProp.includes(component.type)) {
      nextComponentIDs = useElse ? Array.from(component.else) : Array.from(component.next);
    }
    if (Object.prototype.hasOwnProperty.call(component, "outputFiles")) {
      const behindIfComponentList = await this._getBehindIfComponentList(component);
      component.outputFiles.forEach((outputFile)=>{
        const tmp = outputFile.dst.map((e)=>{
          if (behindIfComponentList.indexOf(e.dstNode) >= 0) {
            return null;
          }
          if (Object.prototype.hasOwnProperty.call(e, "origin")) {
            return null;
          }
          if (e.dstNode !== component.parent) {
            return e.dstNode;
          }
          return null;
        }).filter((e)=>{
          return e !== null;
        });
        Array.prototype.push.apply(nextComponentIDs, tmp);
      });
    }
    nextComponentIDs = Array.from(new Set(nextComponentIDs))
      .filter((id)=>{
        return !this.currentSearchList.some((e)=>{
          return e.ID === id;
        });
      });
    const nextComponents = await Promise.all(nextComponentIDs.map(async (id)=>{
      const tmp = await this._getComponent(id);
      return tmp;
    }));

    Array.prototype.push.apply(this.pendingComponents, nextComponents);
  }

  //remove WHEEL system env and merge component native env and parent component env
  setEnv(component) {
    if (component.env) {
      wheelSystemEnv.forEach((envname)=>{
        if (Object.prototype.hasOwnProperty.call(component.env, envname)) {
          delete component.env[envname];
        }
      });
    }
    component.env = Object.assign({}, this.env, component.env);
  }

  //pick up components which is in downstream of file-flow and behind if component
  async _getBehindIfComponentList(component) {
    const behindIfComponetList = [];
    for (const outputFile of component.outputFiles) {
      for (const e of outputFile.dst) {
        const dstComponent = await this._getComponent(e.dstNode);
        if (dstComponent.type === "viewer" || dstComponent.type === "storage") {
          continue;
        }
        if (Array.isArray(dstComponent.previous)) {
          const prviousCmp = await Promise.all(dstComponent.previous.map((id)=>{
            return this._getComponent(id);
          }));
          prviousCmp.forEach((cmp)=>{
            if (cmp.type === "if") {
              behindIfComponetList.push(e.dstNode);
            }
          });
        }
      }
    }
    return behindIfComponetList;
  }

  async _dispatchTask(component) {
    getLogger(this.projectRootDir).trace("_dispatchTask called", component.name);
    await this._setComponentState(component, "running");
    component.dispatchedTime = getDateString(true, true);
    component.startTime = "not started"; //to be assigned in executer
    component.endTime = "not finished"; //to be assigned in executer
    component.preparedTime = null; //to be assigned in executer
    component.jobSubmittedTime = null; //to be assigned in executer
    component.jobStartTime = null; //to be assigned in executer
    component.jobEndTime = null; //to be assigned in executer
    component.projectStartTime = this.projectStartTime;
    component.projectRootDir = this.projectRootDir;
    component.workingDir = path.resolve(this.cwfDir, component.name);
    component.emitForDispatcher = this.emit.bind(this);
    if (component.type === "stepjobTask") {
      const parentComponent = await readComponentJsonByID(this.projectRootDir, component.parent);
      component.host = parentComponent.host;
      component.queue = parentComponent.queue;
      component.parentName = parentComponent.name;
    }

    component.ancestorsName = replacePathsep(path.relative(component.projectRootDir, path.dirname(component.workingDir)));
    component.ancestorsType = this.ancestorsType;
    if (component.cleanupFlag === 2) {
      component.doCleanup = this.doCleanup;
    } else {
      component.doCleanup = component.cleanupFlag === 0;
    }
    if (component.usePSSettingFile === true) {
      await this._bulkjobHandler(component);
    }
    this.setEnv(component);
    component.parentType = this.cwfJson.type;

    exec(component).catch((e)=>{
      getLogger(this.projectRootDir).warn(`${component.name} failed. rt=${component.rt}`);
      getLogger(this.projectRootDir).trace(component.workingDir, "failed due to", e);
    });
    //exec is async function but dispatcher never wait end of task execution
    //it cause error if cancel taskJobs which is waiting for job submittion limit
    this.runningTasks.push(component);
    this.dispatchedTasks.add(component);
    const ee = eventEmitters.get(this.projectRootDir);
    ee.emit("taskDispatched", component);
    await writeComponentJson(this.projectRootDir, component.workingDir, component, true);
    await this._addNextComponent(component);
  }

  async _checkIf(component) {
    getLogger(this.projectRootDir).debug("_checkIf called", component.name);
    await this._setComponentState(component, "running");
    const childDir = path.resolve(this.cwfDir, component.name);
    this.setEnv(component);
    const condition = await evalCondition(this.projectRootDir, component.condition, childDir, component.env);
    getLogger(this.projectRootDir).debug("condition check result=", condition);
    await this._addNextComponent(component, !condition);
    await this._setComponentState(component, "finished");
  }

  async _delegate(component, needEventHandler, templateComponent) {
    getLogger(this.projectRootDir).debug("_delegate called", component.name);
    const childDir = path.resolve(this.cwfDir, component.name);
    //PS instance component is called in template component's dispatcher.
    //_setComponentState should not be called for PS because it write template component's component JSON file
    if (component.type !== "parameterStudy") {
      await this._setComponentState(component, "running");
    } else {
      component.state = "running";
      await fs.writeJson(path.resolve(childDir, componentJsonFilename), component);
      const ee = eventEmitters.get(this.projectRootDir);
      ee.emit("componentStateChanged", component);
    }
    const ancestorsType = typeof this.ancestorsType === "string" ? `${this.ancestorsType}/${component.type}` : component.type;
    const childEnv = Object.assign({}, this.env, component.env);
    const child = new Dispatcher(this.projectRootDir, component.ID, childDir, this.projectStartTime,
      this.componentPath, childEnv, ancestorsType);
    if (needEventHandler) {
      child.on("break", async ()=>{
        getLogger(this.projectRootDir).debug("break event recieved from", child.cwfDir);
        this.forceFinishedLoops.push(templateComponent.ID);
      });
    }
    this.children.add(child);

    //exception should be catched in caller
    try {
      component.state = await child.start();
      await writeComponentJson(this.projectRootDir, childDir, component, true);
      //if component type is not workflow, it must be copied component of PS, for, while or foreach
      //so, it is no need to emit "componentStateChanged" here.
      if (component.type === "workflow" || component.type === "stepjob") {
        const ee = eventEmitters.get(this.projectRootDir);
        ee.emit("componentStateChanged", component);
      }
    } finally {
      await this._addNextComponent(component);
      setImmediate(()=>{
        this.emit("dispatch");
      });
    }
  }

  async _loopFinalize(component, lastDir) {
    const dstDir = path.resolve(this.cwfDir, component.originalName);
    if (lastDir !== dstDir) {
      getLogger(this.projectRootDir).debug("copy ", lastDir, "to", dstDir);
      await fs.copy(lastDir, dstDir, { overwrite: true, dereference: true }); //dst will be overwrite always
    }
    if (component.keep === 0) {
      getLogger(this.projectRootDir).debug("remove last instance dir because keep is set to 0");
      await fs.remove(lastDir);
    }

    getLogger(this.projectRootDir).debug("loop finished", component.name);
    delete component.initialized;
    delete component.currentIndex;
    delete component.prevIndex;
    delete component.subComponent;
    component.name = component.originalName;
    await this._addNextComponent(component);
    component.state = component.hasFaild ? "failed" : "finished";
    const componentDir = this._getComponentDir(component.ID);
    await writeComponentJson(this.projectRootDir, componentDir, component, true);
  }

  async _loopHandler(getNextIndex, getPrevIndex, isFinished, getTripCount, keepLoopInstance, component) {
    getLogger(this.projectRootDir).debug("_loopHandler called", component.name);

    if (component.initialized && component.currentIndex !== null && component.state === "not-started") {
      getLogger(this.projectRootDir).debug(`${component.name} is restarting from ${component.currentIndex}`);
      component.restarting = true;
    }
    if (!component.restarting && component.childLoopRunning) {
      //send back itself to searchList for next loop trip
      this.pendingComponents.push(component);
      return Promise.resolve();
    }

    //set current loop index
    if (!component.initialized) {
      loopInitialize(component, getTripCount);
    } else if (component.restarting) {
      let done = false;
      const currentInstanceDir = path.resolve(this.cwfDir, getInstanceDirectoryName(component, component.prevIndex, component.name));
      if (await fs.pathExists(currentInstanceDir)) {
        const { state } = await readComponentJson(currentInstanceDir);
        if (state === "finished") {
          component.prevIndex = component.currentIndex;
          component.currentIndex = getNextIndex(component);
          done = true;
        }
      }
      if (!done) {
        const prevIndex = getPrevIndex(component, true);
        if (component.type === "foreach" && prevIndex === null) {
          const index = await foreachSearchLatestFinishedIndex(component, this.cwfDir);
          component.currentIndex = index;
          component.currentIndex = getNextIndex(component);
          component.prevIndex = index;
        } else {
          component.currentIndex = prevIndex;
          component.currentIndex = getNextIndex(component);
          component.prevIndex = prevIndex;
        }
      }
    } else {
      component.prevIndex = component.currentIndex;
      component.currentIndex = getNextIndex(component);
    }
    await this._setComponentState(component, "running");
    component.childLoopRunning = true;

    //update env
    component.env.WHEEL_CURRENT_INDEX = component.currentIndex;
    component.env.WHEEL_PREV_INDEX = getPrevIndex(component);
    const nextIndex = getNextIndex(component);
    component.env.WHEEL_NEXT_INDEX = nextIndex !== null ? nextIndex : "";

    let srcDirName = component.name;
    if (getPrevIndex(component) !== null) {
      srcDirName = `${component.originalName}_${sanitizePath(component.prevIndex)}`;
    }
    const srcDir = path.resolve(this.cwfDir, srcDirName);

    //end determination
    const envForWhileIsFinished = Object.assign({}, this.env, component.env);
    if (this.forceFinishedLoops.includes(component.ID) || await isFinished(component, envForWhileIsFinished)) {
      await this._loopFinalize(component, srcDir);
      return Promise.resolve();
    }

    //send back itself to searchList for next loop trip
    this.pendingComponents.push(component);

    const newComponent = structuredClone(component);
    newComponent.name = `${component.originalName}_${sanitizePath(component.currentIndex)}`;
    newComponent.subComponent = true;
    newComponent.env = Object.assign({}, this.env, component.env);
    if (!newComponent.env) {
      newComponent.env = {};
    }

    const dstDir = path.resolve(this.cwfDir, newComponent.name);

    try {
      getLogger(this.projectRootDir).debug(`copy from ${srcDir} to ${dstDir}`);
      await fs.copy(srcDir, dstDir, {
        dereference: true,
        filter: async (target)=>{
          getLogger(this.projectRootDir).trace("[loopHandler] copy filter on :", target);
          if (srcDir === target) {
            return true;
          }
          if (path.basename(target) === statusFilename) {
            return false;
          }
          const subComponent = await isSubComponent(target);
          return !subComponent;
        }
      });
      //overwrited only newer files in template component
      if (component.restarting) {
        getLogger(this.projectRootDir).trace("[loopHandler] overwrite by rsync");
        const { stdout, stderr } = await overwriteByRsync(path.resolve(this.cwfDir, component.name), dstDir);
        getLogger(this.projectRootDir).trace("output from rsync");
        getLogger(this.projectRootDir).trace(stdout);
        getLogger(this.projectRootDir).trace(stderr);
        delete component.restarting;
      }
      await setComponentStateR(this.projectRootDir, dstDir, "not-started", true);
      await writeComponentJson(this.projectRootDir, dstDir, newComponent, true);
      await this._delegate(newComponent, true, component);

      //remove old instance
      if (Number.isInteger(component.keep) && component.keep > 0) {
        await keepLoopInstance(component, this.cwfDir);
      } else if (component.keep === 0 && srcDirName !== component.name) {
        await fs.remove(srcDir);
      }

      if (newComponent.state === "failed") {
        component.hasFaild = true;
        ++component.numFailed;
      } else {
        ++component.numFinished;
      }
    } catch (e) {
      if (typeof e !== "string") {
        e.index = component.currentIndex;
      }
      getLogger(this.projectRootDir).warn("fatal error occurred during loop child dispatching.", e);
      throw e;
    }
    if (component.childLoopRunning) {
      getLogger(this.projectRootDir).debug("finished for index =", component.currentIndex);
      component.childLoopRunning = false;
    }
    return Promise.resolve();
  }

  async _getTargetFile(component) {
    const templateRoot = path.resolve(this.cwfDir, component.name);
    const paramSettingsFilename = path.resolve(templateRoot, component.parameterFile);
    const paramSettings = await readJsonGreedy(paramSettingsFilename).catch((err)=>{
      getLogger(this.projectRootDir).warn("parameter file read failed", err);
      throw err;
    });
    getLogger(this.projectRootDir).debug(`read prameter setting done. version = ${paramSettings.version}`);
    //treat single value as array contains single element
    if (Object.prototype.hasOwnProperty.call(paramSettings, "targetFiles") && typeof paramSettings.targetFiles === "string") {
      paramSettings.targetFiles = [paramSettings.targetFiles];
    }
    if (Object.prototype.hasOwnProperty.call(paramSettings, "target_file") && typeof paramSettings.target_file === "string") {
      paramSettings.target_file = [paramSettings.target_file];
    }
    if (!Object.prototype.hasOwnProperty.call(paramSettings, "targetFiles") && Object.prototype.hasOwnProperty.call(paramSettings, "target_file")) {
      paramSettings.targetFiles = paramSettings.target_file;
    }

    //convert id to relative path from PS component
    const targetFiles = Object.prototype.hasOwnProperty.call(paramSettings, "targetFiles")
      ? paramSettings.targetFiles.map((e)=>{
        if (Object.prototype.hasOwnProperty.call(e, "targetName")) {
          const targetDir = Object.prototype.hasOwnProperty.call(e, "targetNode") ? path.relative(templateRoot, this._getComponentDir(e.targetNode)) : "";
          return path.join(targetDir, e.targetName);
        }
        return e;
      })
      : [];

    return { templateRoot, paramSettingsFilename, paramSettings, targetFiles };
  }

  async _PSHandler(component) {
    getLogger(this.projectRootDir).debug("_PSHandler called", component.name);
    if (component.initialized && component.state === "not-started") {
      component.restarting = true;
    }
    await this._setComponentState(component, "running");
    component.initialized = true;
    const { templateRoot, paramSettingsFilename, paramSettings, targetFiles } = await this._getTargetFile(component);

    const scatterRecipe = Object.prototype.hasOwnProperty.call(paramSettings, "scatter")
      ? paramSettings.scatter
        .map((e)=>{
          return {
            srcName: e.srcName,
            dstNode: path.relative(templateRoot, this._getComponentDir(e.dstNode)),
            dstName: e.dstName
          };
        })
      : [];
    const gatherRecipe = Object.prototype.hasOwnProperty.call(paramSettings, "gather")
      ? paramSettings.gather.map((e)=>{
        return {
          srcName: e.srcName,
          srcNode: path.relative(templateRoot, this._getComponentDir(e.srcNode)),
          dstName: e.dstName
        };
      })
      : [];

    const [getParamSpace, getScatterFiles, scatterFiles, gatherFiles, rewriteTargetFile] = makeCmd(paramSettings);
    const paramSpace = await getParamSpace(templateRoot);

    //ignore all filenames in file type parameter space and parameter study setting file
    const ignoreFiles = [componentJsonFilename, paramSettingsFilename]
      .concat(
        getFilenames(paramSpace),
        targetFiles,
        await getScatterFiles(templateRoot, paramSettings)
      ).map((e)=>{
        return path.resolve(templateRoot, e);
      });

    const promises = [];
    component.numTotal = getParamSize(paramSpace);
    //reset counter
    component.numFailed = 0;
    component.numFinished = 0;

    getLogger(this.projectRootDir).debug("start paramSpace loop");

    const updateComponentJson = debounce(async ()=>{
      const ee = eventEmitters.get(this.projectRootDir);
      ee.emit("componentStateChanged", component);
      return writeComponentJson(this.projectRootDir, templateRoot, component, true);
    });
    for (const paramVec of paramVecGenerator(paramSpace)) {
      const params = paramVec.reduce((p, c)=>{
        p[c.key] = c.value;
        return p;
      }, {});
      const newName = sanitizePath(paramVec.reduce((p, e)=>{
        return `${p}_${e.key}_${e.value}`;
      }, component.name));
      const instanceRoot = path.resolve(this.cwfDir, newName);
      //skip finished component while restarting
      if (component.restarting) {
        const instanceComponentJson = await readJsonGreedy(path.resolve(instanceRoot, componentJsonFilename));
        if (isFinishedState(instanceComponentJson.state)) {
          continue;
        }
      }

      const options = { overwrite: component.forceOverwrite };
      options.filter = function (filename) {
        return !ignoreFiles.includes(filename);
      };
      getLogger(this.projectRootDir).debug("copy from", templateRoot, "to ", instanceRoot);
      if (!component.restarting) {
        await fs.copy(templateRoot, instanceRoot, options);
      } else {
        const { stdout, stderr } = await overwriteByRsync(templateRoot, instanceRoot, ignoreFiles);
        getLogger(this.projectRootDir).trace("output from rsync");
        getLogger(this.projectRootDir).trace(stdout);
        getLogger(this.projectRootDir).trace(stderr);
      }

      getLogger(this.projectRootDir).debug("copy files which is used as parameter");
      await Promise.all(paramVec.filter((e)=>{
        return e.type === "file";
      }).map((e)=>{
        return e.value;
      })
        .map((e)=>{
          const src = path.resolve(templateRoot, e);
          const dst = path.resolve(instanceRoot, e);
          getLogger(this.projectRootDir).debug("parameter: copy from", src, "to ", dst);
          return fs.copy(src, dst, { overwrite: component.forceOverwrite });
        }));

      getLogger(this.projectRootDir).debug("scatter files");
      await scatterFiles(templateRoot, instanceRoot, scatterRecipe, params, getLogger(this.projectRootDir), component.restarting);
      getLogger(this.projectRootDir).debug("rewrite target files");
      await rewriteTargetFile(templateRoot, instanceRoot, targetFiles, params);

      const newComponent = structuredClone(component);
      newComponent.name = newName;
      newComponent.subComponent = true;
      const newComponentFilename = path.join(instanceRoot, componentJsonFilename);
      if (!await fs.pathExists(newComponentFilename)) {
        await writeComponentJson(this.projectRootDir, instanceRoot, newComponent, true);
      }
      if (!newComponent.env) {
        newComponent.env = {};
      }

      for (const key in params) {
        const value = params[key];
        newComponent.env[`WHEEL_PS_PARAM_${key}`] = value;
      }
      const p = this._delegate(newComponent)
        .then(()=>{
          if (newComponent.state === "finished") {
            ++(component.numFinished);
          } else if (newComponent.state === "failed") {
            ++(component.numFailed);
          } else {
            getLogger(this.projectRootDir).warn("child state is illegal", newComponent.state);
          }
        })
        .then(updateComponentJson);
      promises.push(p);
    }
    await Promise.all(promises);
    getLogger(this.projectRootDir).debug("gather files");

    //gather from all instance dirs even restarting.
    //this process will be done for first time for all instance
    const promiseGather = [];
    for (const paramVec of paramVecGenerator(paramSpace)) {
      const params = paramVec.reduce((p, c)=>{
        p[c.key] = c.value;
        return p;
      }, {});
      const newName = sanitizePath(paramVec.reduce((p, e)=>{
        return `${p}_${e.key}_${e.value}`;
      }, component.name));
      const instanceRoot = path.resolve(this.cwfDir, newName);
      promiseGather.push(gatherFiles(templateRoot, instanceRoot, gatherRecipe, params, getLogger(this.projectRootDir)));
    }
    await Promise.all(promiseGather);
    getLogger(this.projectRootDir).trace("gather files done");
    await this._addNextComponent(component);
    getLogger(this.projectRootDir).trace("add next component done");
    const state = component.numFailed > 0 ? "failed" : "finished";
    delete component.initialized;
    delete component.restarting;
    await this._setComponentState(component, state);
    getLogger(this.projectRootDir).trace("set component state done");
    if (component.deleteLoopInstance) {
      getLogger(this.projectRootDir).debug("remove instance directories");
      const promiseDelete = [];
      for (const paramVec of paramVecGenerator(paramSpace)) {
        const deleteComponentName = sanitizePath(paramVec.reduce((p, e)=>{
          return `${p}_${e.key}_${e.value}`;
        }, component.name));
        const deleteDir = path.resolve(this.cwfDir, deleteComponentName);
        getLogger(this.projectRootDir).trace(`remove ${deleteDir}`);
        promiseDelete.push(fs.remove(deleteDir));
      }
      await Promise.all(promiseDelete);
    }
  }

  async _viewerHandler(component) {
    getLogger(this.projectRootDir).debug("_viewerHandler called", component.name);
    await this._setComponentState(component, "running");
    const { dir, root: viewerURLRoot } = await createTempd(this.projectRootDir, "viewer");
    const files = await Promise.all(component.files.map((e)=>{
      return getFiletype(e.dst);
    }));
    delete component.files; //component.files is stored in Dispatcher._getInputFiles()
    const rt = await Promise.all(
      files
        .filter((e)=>{
          if (typeof e === "undefined") {
            return false;
          }
          if (viewerSupportedTypes.includes(e.ext)) {
            return e.name;
          }
          getLogger(this.projectRootDir).warn("unsupported type for viewer", path.basename(e.name));
          return false;
        })
        .map((e)=>{
          return deliverFile(e.name, path.resolve(dir, path.relative(this.projectRootDir, e.name).replace(path.sep, "_")));
        })
    );

    getLogger(this.projectRootDir).info("result files are ready in", dir);
    const filename = path.join(dir, filesJsonFilename);
    let filesJson = [];
    try {
      filesJson = await readJsonGreedy(filename);
    } catch (e) {
      if (e.code !== "ENOENT") {
        throw e;
      }
    }
    rt.map((e)=>{
      return {
        componentID: component.ID,
        filename: path.relative(this.projectRootDir, e.src),
        url: path.relative(viewerURLRoot, e.dst)
      };
    }).forEach((e)=>{
      if (!filesJson.includes(e)) {
        filesJson.push(e);
      }
    });
    await writeJsonWrapper(filename, filesJson);
    const ee = eventEmitters.get(this.projectRootDir);
    ee.emit("resultFilesReady", dir);
    await this._setComponentState(component, "finished");
  }

  async _bulkjobHandler(component) {
    getLogger(this.projectRootDir).debug("_bulkjobHandler called", component.name);
    const { templateRoot, paramSettings, targetFiles } = await this._getTargetFile(component);
    const paramSpace = await getParamSpacev2(paramSettings.params, templateRoot);

    const bulkNumTotal = getParamSize(paramSpace);
    component.endBulkNumber = bulkNumTotal - 1;
    component.startBulkNumber = 0;
    let countBulkNum = 0;

    getLogger(this.projectRootDir).debug("start paramSpace loop");

    for (const paramVec of paramVecGenerator(paramSpace)) {
      const params = paramVec.reduce((p, c)=>{
        p[c.key] = c.value;
        return p;
      }, {});

      await Promise.all(paramVec.filter((e)=>{
        return e.type === "file";
      }).map((e)=>{
        return e.value;
      })
        .map((e)=>{
          //I dont know it's OK or harmful to disable no-loop-func here
          const src = path.resolve(templateRoot, e);
          const dst = path.resolve(templateRoot, `${countBulkNum}.${e}`);
          getLogger(this.projectRootDir).debug("parameter: copy from", src, "to ", dst);
          return fs.copy(src, dst);
        }));

      getLogger(this.projectRootDir).debug("rewrite target files");
      await replaceByNunjucksForBulkjob(templateRoot, targetFiles, params, countBulkNum);
      await writeParameterSetFile(templateRoot, targetFiles, params, countBulkNum);
      countBulkNum++;
    }
    return writeComponentJson(this.projectRootDir, templateRoot, component, true);
  }

  async _storageHandler(component) {
    getLogger(this.projectRootDir).debug("_storageHandler called", component.name);
    await this._setComponentState(component, "running");
    const storagePath = component.storagePath;
    const currentDir = this._getComponentDir(component.ID);
    //copy inputFiles from currentDir to storagePath as regular file
    if (component.inputFiles.length > 0) {
      if (isLocal(component)) {
        if (currentDir !== storagePath) {
          await fs.mkdir(storagePath);
          await Promise.all(
            component.inputFiles
              .filter((e)=>{
                return !e.name.endsWith(componentJsonFilename);
              }).map((e)=>{
                return fs.copy(path.join(currentDir, e.name), path.join(storagePath, e.name), {
                  dereference: true
                });
              })
          );
        }
      } else {
        const targetsToCopy = component.inputFiles.map((e)=>{
          return path.join(currentDir, e.name);
        });
        const remotehostID = remoteHost.getID("name", component.host);
        const ssh = getSsh(this.projectRootDir, remotehostID);
        await ssh.send(targetsToCopy, `${storagePath}/`, ["-vv", ...rsyncExcludeOptionOfWheelSystemFiles]);
      }
    }
    //clean up curentDir
    const contents = await fs.readdir(currentDir);
    const removeTargets = contents.filter((name)=>{
      return !name.endsWith(componentJsonFilename);
    });
    await Promise.all(removeTargets.map((name)=>{
      return fs.remove(path.resolve(currentDir, name));
    }));
    await this._addNextComponent(component);
    await this._setComponentState(component, "finished");
  }

  async _isDisabledSrcComponent(componentID) {
    const srcComponent = await this._getComponent(componentID);
    return srcComponent.disable;
  }

  async _isDisabledSrc(src) {
    const tmp = await Promise.any(src.map(async (e)=>{
      return this._isDisabledSrcComponent(e.srcNode);
    }));
    return tmp;
  }

  async _disabledInputFilesFilter(inputFiles) {
    return Promise.all(inputFiles.map(async (inputFile)=>{
      const result = await this._isDisabledSrc(inputFile.src);
      return !result;
    }));
  }

  async _hpcissHandler(withTar, component) {
    getLogger(this.projectRootDir).debug(`_hpcissHandler called with ${component.name} tar=${withTar}`);
    await this._setComponentState(component, "running");
    const currentDir = this._getComponentDir(component.ID);

    const targetFilter = await this._disabledInputFilesFilter(component.inputFiles);

    const targetsToCopy = component.inputFiles
      .filter((e, i)=>{
        return targetFilter[i];
      })
      .map((e)=>{
        return path.join(currentDir, e.name);
      });

    if (targetsToCopy.length > 0) {
      const remotehostID = remoteHost.getID("name", component.host);
      const ssh = getSsh(this.projectRootDir, remotehostID);
      const hostinfo = getSshHostinfo(this.projectRootDir, remotehostID);
      const prefix = hostinfo.path ? `-p ${hostinfo.path}` : "";

      const { output, rt } = await ssh.execAndGetOutput(`mktemp -d ${prefix} WHEEL_TMP_XXXXXXXX`);
      if (rt !== 0) {
        throw new Error("create temporary directory on CSGW failed");
      }
      component.remoteTempDir = output[0];
      await ssh.send(targetsToCopy, `${component.remoteTempDir}/`, ["-vv", ...rsyncExcludeOptionOfWheelSystemFiles]);

      const storagePath = component.storagePath;
      if (withTar) {
        await gfrm(this.projectRootDir, remotehostID, storagePath);
        await gfptarCreate(this.projectRootDir, remotehostID, component.remoteTempDir, storagePath);
      } else {
        const lsResults = await ssh.ls(component.remoteTempDir, ["-l"]);
        if (lsResults.length === 1 && lsResults[0].startsWith("-")) {
          const tokens = lsResults[0].split(" ");
          const filename = tokens[tokens.length - 1];
          await gfcp(this.projectRootDir, remotehostID, path.join(component.remoteTempDir, filename), path.join(storagePath, filename), true);
        } else {
          await gfpcopy(this.projectRootDir, remotehostID, component.remoteTempDir, storagePath, true);
        }
      }
      getLogger(this.projectRootDir).debug(`remove remote temp dir ${component.remoteTempDir}`);
      await ssh.exec(`rm -fr ${component.remoteTempDir}`);
    }

    await this._addNextComponent(component);
    await this._setComponentState(component, "finished");
  }

  async _sourceHandler(component) {
    getLogger(this.projectRootDir).debug("_sourceHandler called", component.name);
    await this._setComponentState(component, "running");
    await this._addNextComponent(component);
    await this._setComponentState(component, "finished");
  }

  async _jumpHandler(label, component) {
    getLogger(this.projectRootDir).debug("_jumpHandler called with", label, component.name);
    await this._setComponentState(component, "running");
    const childDir = path.resolve(this.cwfDir, component.name);
    this.setEnv(component);
    const condition = await evalCondition(this.projectRootDir, component.condition, childDir, component.env);
    getLogger(this.projectRootDir).debug("condition check result=", condition);
    await this._setComponentState(component, "finished");
    if (!condition) {
      await this._addNextComponent(component);
      return;
    }

    this.pendingComponents = [];
    this.currentSearchList = [];
    if (label === "break") {
      await this.pause();
      const state = this._getState();
      this.onDone(state);
      this.emit("break");
    }
    return;
  }

  async _isReady(component) {
    if (component.type === "source") {
      return true;
    }
    if (component.previous) {
      for (const ID of component.previous) {
        const previous = await this._getComponent(ID);
        if (previous.disable) {
          continue;
        }
        getLogger(this.projectRootDir).trace(`previous component name = ${previous.type}(state:${previous.state})`);
        if (!isFinishedState(previous.state) && previous.type !== "stepjobTask") {
          getLogger(this.projectRootDir).trace(`${component.name}(${component.ID}) is not ready because ${previous.name}(${previous.ID}) is not finished`);
          return false;
        }
      }
    }
    if (component.inputFiles) {
      for (const inputFile of component.inputFiles) {
        for (const src of inputFile.src) {
          if (src.srcNode === component.parent) {
            continue;
          }
          const previous = await this._getComponent(src.srcNode);
          if (previous.disable) {
            continue;
          }
          if (!isFinishedState(previous.state) && previous.type !== "stepjobTask") {
            getLogger(this.projectRootDir).trace(`${component.name}(${component.ID}) is not ready because ${inputFile} from ${previous.name}(${previous.ID}) is not arrived`);
            return false;
          }
        }
      }
    }
    return true;
  }

  _getComponentDir(id) {
    //TODO replace by getRelativeComponentDir(id) which is not yet implemented
    const originalCwfDir = convertPathSep(this.componentPath[this.cwfID]);
    const originalDir = convertPathSep(this.componentPath[id]);
    const relativePath = path.relative(originalCwfDir, originalDir);

    return path.resolve(this.cwfDir, relativePath);
  }

  async _getComponent(id) {
    const componentDir = this._getComponentDir(id);
    const filename = path.resolve(this.cwfDir, componentDir, componentJsonFilename);
    return readJsonGreedy(filename);
  }

  async _setComponentState(component, state) {
    if (component.state === state) {
      return;
    }
    component.state = state; //update in memory
    const componentDir = this._getComponentDir(component.ID);
    await writeComponentJson(this.projectRootDir, componentDir, component, true);
    const ee = eventEmitters.get(this.projectRootDir);
    ee.emit("componentStateChanged", component);
  }

  async _getInputFiles(component) {
    if (component.type === "source") {
      return;
    }
    getLogger(this.projectRootDir).debug(`getInputFiles for ${component.name}`);
    const promises = [];
    const tmpDeliverRecipes = [];
    for (const inputFile of component.inputFiles) {
      const dstName = nunjucks.renderString(inputFile.name, this.env);
      //resolve real src
      for (const src of inputFile.src) {
        const srcComponent = await this._getComponent(src.srcNode);
        if (srcComponent.disable) {
          continue;
        }
        const fromHPCISS = srcComponent.type === "hpciss";
        const fromHPCISStar = srcComponent.type === "hpcisstar";
        const srcRemotehostID = remoteHost.getID("name", srcComponent.host);
        const onSameRemote = await isSameRemoteHost(this.projectRootDir, src.srcNode, component.ID);

        //get files from upper level
        if (src.srcNode === component.parent) {
          const dstRoot = this._getComponentDir(component.ID);
          const srcEntry = srcComponent.inputFiles.find((i)=>{
            if (!(i.name === src.srcName && Object.prototype.hasOwnProperty.call(i, "forwardTo"))) {
              return false;
            }
            const result = i.forwardTo.findIndex((e)=>{
              return e.dstNode === component.ID && e.dstName === inputFile.name;
            });
            return result !== -1;
          });
          if (typeof srcEntry === "undefined") {
            continue;
          }
          for (const e of srcEntry.src) {
            const originalSrcRoot = this._getComponentDir(e.srcNode);
            const srcName = nunjucks.renderString(e.srcName, this.env);
            tmpDeliverRecipes.push({
              dstRoot,
              dstName,
              srcRoot: originalSrcRoot,
              srcName,
              onSameRemote,
              forceCopy: false,
              projectRootDir: this.projectRootDir,
              srcRemotehostID,
              fromHPCISS,
              fromHPCISStar
            });
          }
        } else if (onSameRemote) {
          const remotehostID = remoteHost.getID("name", component.host);

          const srcRoot = hasStoragePath(srcComponent) ? srcComponent.storagePath : getRemoteWorkingDir(this.projectRootDir, this.projectStartTime, path.resolve(this.cwfDir, srcComponent.name), component, srcRemotehostID !== remotehostID);
          const dstRoot = hasStoragePath(component) ? component.storagePath : getRemoteWorkingDir(this.projectRootDir, this.projectStartTime, path.resolve(this.cwfDir, component.name), component);
          const srcName = nunjucks.renderString(src.srcName, this.env);
          const forceCopy = hasStoragePath(srcComponent);
          tmpDeliverRecipes.push({
            dstRoot,
            dstName,
            srcRoot,
            srcName,
            onSameRemote,
            forceCopy,
            projectRootDir: this.projectRootDir,
            srcRemotehostID,
            fromHPCISS,
            fromHPCISStar
          });
        } else if (!isLocalComponent(srcComponent) && !["task", "stepjobTask", "bulkjobtask", "hpciss", "hpcisstar"].includes(srcComponent.type)) {
          //memo1: taskコンポーネントのoutputFileは一旦ダウンロードされるためlocal to localでsymlinkを貼るだけでよいので除外している
          //memo2: この方法だと、接続先が複数あるエントリは複数回rsyncを実行することになるため将来的には全てtaskコンポーネントと同じ方式にする必要がある

          const srcRoot = hasStoragePath(srcComponent) ? srcComponent.storagePath : getRemoteWorkingDir(this.projectRootDir, this.projectStartTime, path.resolve(this.cwfDir, srcComponent.name), component);
          const dstRoot = hasStoragePath(component) ? component.storagePath : this._getComponentDir(component.ID);
          const srcName = nunjucks.renderString(src.srcName, this.env);
          tmpDeliverRecipes.push({
            dstRoot,
            dstName,
            srcRoot,
            srcName,
            remoteToLocal: true,
            projectRootDir: this.projectRootDir,
            srcRemotehostID,
            fromHPCISS,
            fromHPCISStar
          });
        } else {
          //deliver files under component directory even if destination component is storage
          //in storageHandler, files under component directory will be copied to storagePath (avoid to store symlink in storagePath)
          //HPCISS and HPCISStar component are treated as same way
          const dstRoot = this._getComponentDir(component.ID);
          promises.push(
            this._getComponent(src.srcNode)
              .then((srcComponent)=>{
                const srcEntry = srcComponent.outputFiles.find((outputFile)=>{
                  return outputFile.name === src.srcName;
                });
                if (typeof srcEntry === "undefined") {
                  return;
                }
                //get files from lower level component
                if (Object.prototype.hasOwnProperty.call(srcEntry, "origin")) {
                  for (const e of srcEntry.origin) {
                    const srcName = nunjucks.renderString(e.srcName, this.env);
                    const originalSrcRoot = this._getComponentDir(e.srcNode);
                    tmpDeliverRecipes.push({
                      dstRoot,
                      dstName,
                      srcRoot: originalSrcRoot,
                      srcName,
                      forceCopy: false,
                      onSameRemote,
                      projectRootDir: this.projectRootDir,
                      srcRemotehostID,
                      fromHPCISS,
                      fromHPCISStar
                    });
                  }
                } else {
                  const srcName = nunjucks.renderString(src.srcName, this.env);
                  const forceCopy = hasStoragePath(srcComponent);
                  const srcRoot = hasStoragePath(srcComponent) ? srcComponent.storagePath : this._getComponentDir(src.srcNode);
                  tmpDeliverRecipes.push({
                    dstRoot,
                    dstName,
                    srcRoot,
                    srcName,
                    forceCopy,
                    onSameRemote,
                    projectRootDir: this.projectRootDir,
                    srcRemotehostID,
                    fromHPCISS,
                    fromHPCISStar
                  });
                }
              })
          );
        }
      }
    }
    await Promise.all(promises);
    const deliverRecipes = [];
    for (const recipe of tmpDeliverRecipes) {
      if (!deliverRecipes.some((e)=>{
        return e.dstRoot === recipe.dstRoot
          && e.dstName === recipe.dstName
          && e.srcRoot === recipe.srcRoot
          && e.srcName === recipe.srcName;
      })) {
        deliverRecipes.push(recipe);
      }
    }

    //actual deliver file process
    const p2 = [];
    for (const recipe of deliverRecipes) {
      if (recipe.fromHPCISS || recipe.fromHPCISStar) {
        p2.push(deliverFilesFromHPCISS(recipe, this.projectRootDir));
      } else if (recipe.onSameRemote) {
        p2.push(deliverFilesOnRemote(recipe));
      } else if (recipe.remoteToLocal) {
        p2.push(deliverFilesFromRemote(recipe));
      } else {
        const srces = await promisify(glob)(recipe.srcName, { cwd: recipe.srcRoot });
        const hasGlob = glob.hasMagic(recipe.srcName);
        for (const srcFile of srces) {
          if (srcFile === "cmp.wheel.json") {
            continue;
          }
          const oldPath = path.resolve(recipe.srcRoot, srcFile);
          let newPath = path.resolve(recipe.dstRoot, recipe.dstName);
          //dst is regard as directory if srcName has glob pattern or dstName ends with path separator
          //if newPath is existing Directory, src will also be copied under newPath directory
          if (hasGlob || recipe.dstName.endsWith(path.posix.sep) || recipe.dstName.endsWith(path.win32.sep)) {
            newPath = path.resolve(newPath, srcFile);
          }
          p2.push(deliverFile(oldPath, newPath, recipe.forceCopy));
        }
      }
    }
    const results = await Promise.all(p2);
    for (const result of results) {
      getLogger(this.projectRootDir).trace(`make ${result.type} from  ${result.src} to ${result.dst}`);
    }
    if (component.type === "viewer") {
      component.files = results;
    }
    return results;
  }

  _cmdFactory(type) {
    let cmd = ()=>{};
    switch (type.toLowerCase()) {
      case "task":
        cmd = this._dispatchTask;
        break;
      case "stepjobtask":
        cmd = this._dispatchTask;
        break;
      case "bulkjobtask":
        cmd = this._dispatchTask;
        break;
      case "if":
        cmd = this._checkIf;
        break;
      case "for":
        cmd = this._loopHandler.bind(this, forGetNextIndex, getPrevIndex, forIsFinished, forTripCount, keepLoopInstance);
        break;
      case "while":
        cmd = this._loopHandler.bind(this, whileGetNextIndex, getPrevIndex, whileIsFinished.bind(null, this.cwfDir, this.projectRootDir), null, keepLoopInstance);
        break;
      case "foreach":
        cmd = this._loopHandler.bind(this, foreachGetNextIndex, foreachGetPrevIndex, foreachIsFinished, foreachTripCount, foreachKeepLoopInstance);
        break;
      case "workflow":
        cmd = this._delegate;
        break;
      case "stepjob":
        cmd = this._delegate;
        break;
      case "parameterstudy":
        cmd = this._PSHandler;
        break;
      case "viewer":
        cmd = this._viewerHandler;
        break;
      case "storage":
        cmd = this._storageHandler;
        break;
      case "source":
        cmd = this._sourceHandler;
        break;
      case "break":
        cmd = this._jumpHandler.bind(this, "break");
        break;
      case "continue":
        cmd = this._jumpHandler.bind(this, "continue");
        break;
      case "hpciss":
        cmd = this._hpcissHandler.bind(this, false);
        break;
      case "hpcisstar":
        cmd = this._hpcissHandler.bind(this, true);
        break;
      default:
        getLogger(this.projectRootDir).error("illegal type specified", type);
    }
    return cmd;
  }
}
module.exports = Dispatcher;
