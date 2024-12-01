/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path = require("path");
const childProcess = require("child_process");
const axios = require("axios");
const { getAccessToken } = require("./webAPI.js");
const SBS = require("simple-batch-system");
const { remoteHost, jobScheduler, numJobOnLocal, defaultTaskRetryCount } = require("../db/db");
const { addX } = require("./fileUtils");
const { evalCondition } = require("./dispatchUtils");
const { getDateString } = require("../lib/utility");
const { getSsh, getSshHostinfo } = require("./sshManager.js");
const { setTaskState, createStatusFile } = require("./execUtils");
const { registerJob } = require("./jobManager");
const { getLogger } = require("../logSettings.js");

const executers = new Map();
function isExceededLimit(JS, rt, outputText) {
  if (Array.isArray(JS.exceededRtList) && JS.exceededRtList.includes(rt)) {
    return true;
  }
  if (JS.reExceededLimitError) {
    const re = new RegExp(JS.reExceededLimitError, "m");
    return re.test(outputText);
  }
  return false;
}
function makeEnv(task) {
  if (typeof task.env === "undefined" || Object.keys(task.env).length === 0) {
    return "";
  }
  return Object.entries(task.env)
    .reduce((a, [k, v])=>{
      return `${a} ${k}=${v}`;
    }, "env");
}

/**
 * make part of submit command line about queue argument
 * @param {Object} task - task component instance
 * @param {Object} JS - Jobscheduler.json's entry
 * @param {string} queues - comma separated queue name list
 */
function makeQueueOpt(task, JS, queues) {
  if (typeof queues !== "string") {
    return "";
  }
  const queueList = queues.split(",")
    .map((e)=>{ return e.trim(); });
  if (queueList.length === 0) {
    return "";
  }

  let queue = queueList.find((e)=>{
    return task.queue === e;
  });
  if (typeof queue === "undefined") {
    queue = queueList[0];
  }

  //queue can be empty string "", we do not use queue opt in such case
  return queue.length === 0 ? "" : ` ${JS.queueOpt}${queue}`;
}

/**
 * make stepjob option
 * @param {Task} task - task instance
 * @returns {*} - stepjob option
 */
function makeStepOpt(task) {
  if (task.type !== "stepjobTask") {
    return "";
  }
  const stepjob = "--step --sparam";
  const jobName = `jnam=${task.parentName}`;
  const stepNum = `sn=${task.stepnum}`;
  const dependencyForm = `${task.dependencyForm}`;
  return task.useDependency ? `${stepjob} "${jobName},${stepNum},${dependencyForm}"` : `${stepjob} "${jobName},${stepNum}"`;
}

/**
 * make bulkjob option
 * @param {Task} task - task instance
 * @returns {*} - bulkjob option
 */
function makeBulkOpt(task) {
  if (task.type !== "bulkjobTask") {
    return "";
  }
  const bulkjob = "--bulk --sparam";
  const startBulkNumber = task.startBulkNumber;
  const endBulkNumber = task.endBulkNumber;
  return `${bulkjob} "${startBulkNumber}-${endBulkNumber}"`;
}
async function decideFinishState(task) {
  let rt = false;
  try {
    rt = await evalCondition(task.projectRootDir, task.condition, task.workingDir, task.currentIndex);
  } catch (err) {
    getLogger(task.projectRootDir).info(`manualFinishCondition of ${task.name}(${task.ID}) is set but exception occurred while evaluting it.`);
    return false;
  }
  return rt;
}
async function needsRetry(task) {
  if ((typeof task.retry === "undefined" || task.retryCondition === null)
    && (typeof task.retryCondition === "undefined" || task.retryCondition === null)) {
    return false;
  }
  let rt = false;
  if (typeof task.retryCondition === "undefined" || task.retryCondition === null) {
    return Number.isInteger(task.retry) && task.retry > 0;
  }
  try {
    rt = await evalCondition(task.projectRootDir, task.retryCondition, task.workingDir, task.currentIndex);
  } catch (err) {
    getLogger(task.projectRootDir).info(`retryCondition of ${task.name}(${task.ID}) is set but exception occurred while evaluting it. so give up retring`);
    return false;
  }
  if (rt) {
    getLogger(task.projectRootDir).info(`${task.name}(${task.ID}) failed but retring`);
  }
  return rt;
}

class Executer {
  constructor(hostinfo, isJob) {
    this.hostinfo = hostinfo;
    const maxNumJob = getMaxNumJob(hostinfo);
    const hostname = hostinfo != null ? hostinfo.host : null;
    const execInterval = isJob ? 5 : 1;
    this.batch = new SBS({
      exec: async (task)=>{
        task.startTime = getDateString(true, true);

        try {
          task.rt = await this.exec(task);
        } catch (e) {
          if (e.jobStatusCheckFaild) {
            await setTaskState(task, "unknown");
          } else {
            await setTaskState(task, "failed");
          }
          return Promise.reject(e);
        }
        //prevent to overwrite killed task's property
        if (task.state === "not-started") {
          return Promise.resolve();
        }

        //record job finished time
        task.endTime = getDateString(true, true);

        //update task status
        let state;
        if (task.manualFinishCondition) {
          state = await decideFinishState(task) ? "finished" : "failed";
        } else {
          state = task.rt === 0 ? "finished" : "failed";
        }
        await setTaskState(task, state);
        //exec useualy returns task.state but to use it in retry function
        //to use task in retry function, exec() will be rejected with task object if failed
        if (state === "failed" && await needsRetry(task)) {
          return Promise.reject(task);
        }
        return state;
      },
      maxConcurrent: maxNumJob,
      interval: execInterval * 1000,
      name: `executer-${hostname ? hostname : "localhost"}-${this.JS === null ? "task" : "Job"}`
    });

    this.stop = this.batch.stop;
    this.start = this.batch.start;
  }

  async submit(task) {
    const job = {
      args: task,
      maxRetry: task.retry || defaultTaskRetryCount,
      retry: false
    };

    job.retry = needsRetry.bind(null, task);
    task.sbsID = this.batch.qsub(job);
    if (task.sbsID !== null) {
      await setTaskState(task, "waiting");
    }
    const tmp = async ()=>{
      try {
        await this.batch.qwait(task.sbsID);
      } finally {
        await createStatusFile(task);
        getLogger(task.projectRootDir).trace(`${task.name} is ${task.state}`);
      }
    };
    return tmp();
  }

  cancel(task) {
    return this.batch.qdel(task.sbsID);
  }

  setMaxNumJob(v) {
    this.batch.maxConcurrent = v;
  }

  setExecInterval(v) {
    this.batch.interval = v * 1000;
  }
}

class RemoteJobExecuter extends Executer {
  constructor(hostinfo, isJob) {
    super(hostinfo, isJob);
    this.queues = hostinfo != null ? hostinfo.queue : null;
    this.JS = hostinfo != null ? jobScheduler[hostinfo.jobScheduler] : null;
    this.grpName = hostinfo != null ? hostinfo.grpName : null;
  }

  setJS(v) {
    this.JS = v;
  }

  setQueues(v) {
    this.queues = v;
  }

  setGrpName(v) {
    this.grpName = v;
  }

  async exec(task) {
    const hostinfo = getSshHostinfo(task.projectRootDir, task.remotehostID);
    const submitOpt = task.submitOption ? task.submitOption : "";
    const submitCmd = `cd ${task.remoteWorkingDir} && ${makeEnv(task)} ${this.JS.submit} ${makeQueueOpt(task, this.JS, this.queues)} ${makeStepOpt(task)} ${makeBulkOpt(task)} ${submitOpt} ./${task.script}`;
    getLogger(task.projectRootDir).debug("submitting job (remote):", submitCmd);
    await setTaskState(task, "running");
    const ssh = getSsh(task.projectRootDir, task.remotehostID);

    let outputText = "";
    const rt = await ssh.exec(submitCmd, 60, (data)=>{
      outputText += data;
    });
    if (isExceededLimit(this.JS, rt, outputText)) {
      this.batch.originalMaxConcurrent = this.batch.maxConcurrent;
      this.batch.maxConcurrent = this.batch.maxConcurrent - 1;
      getLogger(task.projectRootDir).debug(`max numJob is reduced to ${this.batch.maxConcurrent}`);
      getLogger(task.projectRootDir).trace(`exceed job submit limit ${outputText}`);
      task.forceRetry = true;
      return Promise.reject(task);
    }
    if ([255].includes(rt)) {
      getLogger(task.projectRootDir).debug(`recoverable error occurred (${rt})`);
      task.forceRetry = true;
      return Promise.reject(task);
    }
    if (rt !== 0) {
      const err = new Error("submit command failed");
      err.cmd = submitCmd;
      err.rt = rt;
      err.outputText = outputText;
      return Promise.reject(err);
    }
    if (this.batch.originalMaxConcurrent && this.batch.originalMaxConcurrent > this.batch.maxConcurrent) {
      this.batch.maxConcurrent = this.batch.maxConcurrent + 1;
    }
    if (this.batch.originalMaxConcurrent && this.batch.originalMaxConcurrent === this.batch.maxConcurrent) {
      delete this.batch.originalMaxConcurrent;
    }
    const re = new RegExp(this.JS.reJobID, "m");
    const result = re.exec(outputText);
    if (result === null || result[1] === null) {
      const err = new Error("get jobID failed");
      err.cmd = submitCmd;
      err.outputText = outputText;
      return Promise.reject(err);
    }
    const jobID = result[1];
    task.jobID = jobID;
    getLogger(task.projectRootDir).info("submit success:", submitCmd, jobID);
    task.jobSubmittedTime = getDateString(true, true);
    return registerJob(hostinfo, task);
  }
}

class RemoteJobWebAPIExecuter extends Executer {
  constructor(hostinfo, isJob) {
    super(hostinfo, isJob);
    this.queues = hostinfo != null ? hostinfo.queue : null;
    this.JS = hostinfo != null ? jobScheduler[hostinfo.jobScheduler] : null;
    this.grpName = hostinfo != null ? hostinfo.grpName : null;
  }

  setJS(v) {
    this.JS = v;
  }

  setQueues(v) {
    this.queues = v;
  }

  setGrpName(v) {
    this.grpName = v;
  }

  async exec(task) {
    const hostinfo = getSshHostinfo(task.projectRootDir, task.remotehostID);
    const queueURL = "https://api.fugaku.r-ccs.riken.jp/queue/computer/";
    const accessToken = getAccessToken(task.remotehostID);
    if (accessToken === null) {
      const err = new Error("accessToken not found");
      return Promise.reject(err);
    }

    //const submitOpt = task.submitOption ? task.submitOption : "";
    //const submitCmd = `cd ${task.remoteWorkingDir} && ${makeEnv(task)} ${this.JS.submit} ${makeQueueOpt(task, this.JS, this.queues)} ${makeStepOpt(task)} ${makeBulkOpt(task)} ${submitOpt} ./${task.script}`;
    //
    const request = {
      jobfile: `${task.remoteWorkingDir}/${task.script}`,
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    };
    const response = await axios.post(queueURL, request);

    const outputText = response.data.output;
    if (response.status !== 200) {
      const err = new Error("submit command failed");
      err.jobfile = request.jobfile;
      err.status = response.status;
      err.outputText = outputText;
      return Promise.reject(err);
    }

    getLogger(task.projectRootDir).debug("submitting job (by webAPI):");
    await setTaskState(task, "running");
    if (isExceededLimit(this.JS, null, outputText)) {
      this.batch.originalMaxConcurrent = this.batch.maxConcurrent;
      this.batch.maxConcurrent = this.batch.maxConcurrent - 1;
      getLogger(task.projectRootDir).debug(`max numJob is reduced to ${this.batch.maxConcurrent}`);
      getLogger(task.projectRootDir).trace(`exceed job submit limit ${outputText}`);
      task.forceRetry = true;
      return Promise.reject(task);
    }
    if (this.batch.originalMaxConcurrent && this.batch.originalMaxConcurrent > this.batch.maxConcurrent) {
      this.batch.maxConcurrent = this.batch.maxConcurrent + 1;
    }
    if (this.batch.originalMaxConcurrent && this.batch.originalMaxConcurrent === this.batch.maxConcurrent) {
      delete this.batch.originalMaxConcurrent;
    }
    const re = new RegExp(this.JS.reJobID, "m");
    const result = re.exec(outputText);
    if (result === null || result[1] === null) {
      const err = new Error("get jobID failed");
      err.jobfile = request.jobfile;
      err.outputText = outputText;
      return Promise.reject(err);
    }
    const jobID = result[1];
    task.jobID = jobID;
    getLogger(task.projectRootDir).info("submit success:", request.jobfile, jobID);
    task.jobSubmittedTime = getDateString(true, true);
    return registerJob(hostinfo, task);
  }
}

class RemoteTaskExecuter extends Executer {
  constructor(hostinfo, isJob) {
    super(hostinfo, isJob);
  }

  async exec(task) {
    getLogger(task.projectRootDir).debug("prepare done");
    await setTaskState(task, "running");
    const cmd = `cd ${task.remoteWorkingDir} && ${makeEnv(task)} ./${task.script}`;
    getLogger(task.projectRootDir).debug("exec (remote)", cmd);

    //if exception occurred in ssh.exec, it will be catched in caller
    const ssh = getSsh(task.projectRootDir, task.remotehostID);
    const rt = await ssh.exec(cmd, 0, (data)=>{
      getLogger(task.projectRootDir).sshout(data);
    });
    getLogger(task.projectRootDir).debug(task.name, "(remote) done. rt =", rt);
    return rt;
  }
}

function promisifiedSpawn(task, script, options) {
  return new Promise((resolve, reject)=>{
    const cp = childProcess.spawn(script, options, (err)=>{
      if (err) {
        reject(err);
      }
    });
    cp.stdout.on("data", (data)=>{
      getLogger(task.projectRootDir).stdout(data.toString());
    });
    cp.stderr.on("data", (data)=>{
      getLogger(task.projectRootDir).stderr(data.toString());
    });
    cp.on("error", (err)=>{
      cp.removeAlllisteners("exit");
      reject(err);
    });
    cp.on("exit", (rt)=>{
      getLogger(task.projectRootDir).debug(task.name, "done. rt =", rt);
      resolve(rt);
    });
    task.handler = cp;
  });
}

class LocalTaskExecuter extends Executer {
  constructor(hostinfo, isJob) {
    super(hostinfo, isJob);
  }

  async exec(task) {
    await setTaskState(task, "running");
    const script = path.resolve(task.workingDir, task.script);
    await addX(script);

    const options = {
      cwd: task.workingDir,
      env: Object.assign({}, process.env, task.env),
      shell: true
    };
    return promisifiedSpawn(task, script, options);
  }
}

function getExecutersKey(task) {
  return `${task.projectRootDir}-${task.remotehostID}-${task.useJobScheduler}`;
}
function getMaxNumJob(hostinfo) {
  if (hostinfo === null) {
    return numJobOnLocal;
  }
  if (!Number.isNaN(parseInt(hostinfo.numJob, 10))) {
    return Math.max(parseInt(hostinfo.numJob, 10), 1);
  }
  return 1;
}
function createExecuter(task, hostinfo) {
  getLogger(task.projectRootDir).debug("createExecuter called");
  const onRemote = task.remotehostID !== "localhost";
  if (task.useJobScheduler && typeof jobScheduler[hostinfo.jobScheduler] === "undefined") {
    const err = new Error("illegal job Scheduler specifies");
    err.task = task.name;
    err.useJobScheduler = task.useJobScheduler;
    err.hostinfo = hostinfo;
    getLogger(task.projectRootDir).error(err);
    throw err;
  }
  if (onRemote) {
    if (hostinfo.useWebAPI) {
      getLogger(task.projectRootDir).debug(`create new executer for ${task.host} with web API`);
      return new RemoteJobWebAPIExecuter(hostinfo, true);
    }
    if (task.useJobScheduler) {
      getLogger(task.projectRootDir).debug(`create new executer for ${task.host} with job scheduler`);
      return new RemoteJobExecuter(hostinfo, true);
    }
    getLogger(task.projectRootDir).debug(`create new executer for ${task.host} without job scheduler`);
    return new RemoteTaskExecuter(hostinfo, false);
  }
  getLogger(task.projectRootDir).debug("create new executer for localhost");
  return new LocalTaskExecuter(hostinfo, false);
}
async function register(task) {
  const onRemote = task.remotehostID !== "localhost";
  const hostinfo = onRemote ? getSshHostinfo(task.projectRootDir, task.remotehostID) : null;

  let executer;
  if (executers.has(getExecutersKey(task))) {
    getLogger(task.projectRootDir).debug(`reuse existing executer for ${task.host} ${task.useJobScheduler ? "with" : "without"} job scheduler`);
    executer = executers.get(getExecutersKey(task));
    const maxNumJob = getMaxNumJob(hostinfo);
    executer.setMaxNumJob(maxNumJob);
    if (task.useJobScheduler) {
      const JS = Object.keys(jobScheduler).includes(hostinfo.jobScheduler) ? jobScheduler[hostinfo.jobScheduler] : null;
      if (JS === null) {
        const err = new Error("illegal job scheduler");
        err.task = task;
        err.JS = hostinfo.jobScheduler;
        throw err;
      }
      executer.setJS(JS);
      const queues = hostinfo != null ? hostinfo.queue : null;
      executer.setQueues(queues);
      const grpName = hostinfo != null ? hostinfo.grpName : null;
      executer.setGrpName(grpName);
    }
  } else {
    executer = createExecuter(task, hostinfo);
    executers.set(getExecutersKey(task), executer);
  }
  return executer.submit(task);
}

/**
 * cancel running or waiting tasks
 * @param {Task} task - task component object
 * task component is defined in workflowComponent.js
 */
function cancel(task) {
  if (!Object.prototype.hasOwnProperty.call(task, "sbsID")) {
    return false;
  }
  task.remotehostID = remoteHost.getID("name", task.host) || "localhost";
  const executer = executers.get(getExecutersKey(task));
  if (typeof executer === "undefined") {
    getLogger(task.projectRootDir).warn("executer for", task.remotehostID, " with job scheduler", task.useJobScheduler, "is not found");
    return false;
  }
  return executer.cancel(task);
}

/**
 * remove all executer class instance from DB
 * @param {string} projectRootDir - project projectRootDir's absolute path
 */
function removeExecuters(projectRootDir) {
  const keysToRemove = Array.from(executers.keys()).filter((key)=>{
    return key.startsWith(projectRootDir);
  });
  keysToRemove.forEach((key)=>{
    executers.delete(key);
  });
}

module.exports = {
  register,
  cancel,
  removeExecuters
};
