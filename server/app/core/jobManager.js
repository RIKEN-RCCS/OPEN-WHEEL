/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const { EventEmitter } = require("events");
const path = require("path");
const fs = require("fs-extra");
const SBS = require("simple-batch-system");
const { getSsh } = require("./sshManager");
const { getLogger } = require("../logSettings");
const { getDateString, writeJsonWrapper } = require("../lib/utility");
const { gatherFiles } = require("./execUtils");
const { jobScheduler, jobManagerJsonFilename } = require("../db/db");
const { createStatusFile, createBulkStatusFile } = require("./execUtils");
const { eventEmitters } = require("./global.js");
const { formatSshOutput } = require("../lib/utility.js");

const jobManagers = new Map();

/**
 * parse output text from batch server and get return code or jobstatus code from it
 */
function getFirstCapture(outputText, reCode) {
  const re = new RegExp(reCode, "m");
  const result = re.exec(outputText);
  return result === null || typeof (result[1]) === "undefined" ? null : result[1];
}

function getStatCommand(JS, jobID, type) {
  let rt = "";
  const stat = type !== "bulkjobTask" ? JS.stat : JS.bulkstat;
  if (typeof (stat) === "string") {
    rt = `${stat} ${jobID}`;
  } else if (Array.isArray(stat)) {
    rt = stat.reduce((a, cmd)=>{
      return `${a} ; ${cmd} ${jobID}`;
    }, "");
    rt = rt.replace(/^ +; +/, "");
  }
  return `. /etc/profile;${rt}`;
}

async function issueStatCmd(statCmd, task, output) {
  if (task.remotehostID === "localhost") {
    getLogger(task.projectRootDir).error("local submit is not supported yet!!");
    return Promise.reject(new Error("local submit is not supported"));
  }
  const ssh = getSsh(task.projectRootDir, task.remotehostID);
  return ssh.exec(statCmd, 30, (data)=>{
    output.push(data);
  });
}

function getBulkFirstCapture(outputText, reSubCode) {
  const outputs = outputText.split("\n");
  const codeRegex = new RegExp(reSubCode, "m");
  const subJobOutputs = outputs.filter((text)=>{
    return codeRegex.test(text);
  }).map((text)=>{
    return codeRegex.exec(text);
  });
  const bulkjobFailed = subJobOutputs.every((arrText)=>{
    return arrText[1] !== "0";
  });
  const result = bulkjobFailed ? 1 : 0;
  const codeList = subJobOutputs.map((arrText)=>{
    return arrText[1];
  });

  return [result, codeList];
}

/**
 * check if job is finished or not on remote server
 * @param {Object} JS - jobScheduler.json info
 * @param {Task} task - task instance
 * @returns {number | null} - return code
 */
async function isFinished(JS, task) {
  const statCmd = getStatCommand(JS, task.jobID, task.type);

  const output = [];
  getLogger(task.projectRootDir).trace(task.jobID, "issue stat cmd");
  const statCmdRt = await issueStatCmd(statCmd, task, output);
  getLogger(task.projectRootDir).trace(task.jobID, "stat cmd rt =", statCmdRt);
  const outputText = formatSshOutput(output).join("\n");

  const rtList = Array.isArray(JS.acceptableRt) ? [0, ...JS.acceptableRt] : [0, JS.acceptableRt];
  if (!rtList.includes(statCmdRt)) {
    const error = new Error("job stat command failed!");
    error.cmd = statCmd;
    error.rt = statCmdRt;
    error.output = outputText;
    return Promise.reject(error);
  }

  const reFinishedState = new RegExp(JS.reFinishedState, "m");

  const finished = reFinishedState.test(outputText);
  if (!finished) {
    getLogger(task.projectRootDir).debug(`JobStatusCheck: ${task.jobID} is not yet completed\n${outputText}`);
    return null;
  }

  getLogger(task.projectRootDir).debug(`JobStatusCheck: ${task.jobID} is finished\n${outputText}`);

  //for backward compatibility use reJobStatus if JS does not have reJobStatusCode
  const reJobStatusCode = JS.reJobStatusCode || JS.reJobStatus;
  let [jobStatus, jobStatusList] = [0, []];

  if (task.type !== "bulkjobTask") {
    task.jobStatus = getFirstCapture(outputText, reJobStatusCode);
  } else {
    [jobStatus, jobStatusList] = getBulkFirstCapture(outputText, JS.reSubJobStatusCode);
    getLogger(task.projectRootDir).debug(`JobStatus: ${jobStatus} ,jobStatusList: ${jobStatusList}`);
    task.jobStatus = jobStatus;
  }

  //status.wheel.txtの出力方法を検討する
  if (task.jobStatus === null) {
    getLogger(task.projectRootDir).warn("get job status code failed, code is overwrited by -2");
    task.jobStatus = -2;
  }
  if (statCmdRt !== 0) {
    getLogger(task.projectRootDir).warn(`status check command returns ${statCmdRt} and it is in acceptableRt: ${JS.acceptableRt}`);
    getLogger(task.projectRootDir).warn("it may fail to get job script's return code. so it is overwirted by 0");
    return 0;
  }
  let strRt = 0;
  let [rt, rtCodeList] = [0, []];

  if (task.type !== "bulkjobTask") {
    strRt = getFirstCapture(outputText, JS.reReturnCode);
  } else {
    [rt, rtCodeList] = getBulkFirstCapture(outputText, JS.reSubReturnCode);
    getLogger(task.projectRootDir).debug(`rt: ${rt} ,rtCodeList: ${rtCodeList}`);
    strRt = rt;
  }

  if (strRt === null) {
    getLogger(task.projectRootDir).warn("get return code failed, code is overwrited by -2");
    return -2;
  }
  if (strRt === "6") {
    getLogger(task.projectRootDir).warn("get return code 6, this job was canceled by stepjob dependency");
    return 0;
  }

  if (task.type === "bulkjobTask") {
    await createBulkStatusFile(task, rtCodeList, jobStatusList);
  }
  return parseInt(strRt, 10);
}

class JobManager extends EventEmitter {
  constructor(projectRootDir, hostinfo) {
    super();

    this.taskListFilename = path.resolve(projectRootDir, `${hostinfo.id}.${jobManagerJsonFilename}`);

    try {
      const taskStateList = fs.readJsonSync(this.taskListFilename);
      this.tasks = Array.isArray(taskStateList) ? taskStateList : [];
    } catch (e) {
      if (e.code !== "ENOENT") {
        throw e;
      }
      this.tasks = [];
    }
    const hostname = hostinfo != null ? hostinfo.host : null;
    const statusCheckInterval = hostinfo != null ? hostinfo.statusCheckInterval : 5;
    const maxStatusCheckError = hostinfo != null ? hostinfo.maxStatusCheckError : 10;
    let statusCheckFailedCount = 0;
    let statusCheckCount = 0;
    this.hostinfo = hostinfo;
    const JS = jobScheduler[hostinfo.jobScheduler];

    if (typeof JS === "undefined") {
      const err = new Error("invalid job scheduler");
      err.hostinfo = hostinfo;
      throw err;
    }
    this.batch = new SBS({
      exec: async (task)=>{
        if (task.state !== "running") {
          getLogger(task.projectRootDir).trace(`${task.jobID} status check will not start due to task state is ${task.state}`);
          return 0;
        }
        getLogger(task.projectRootDir).trace(task.jobID, "status check start count=", statusCheckCount);
        task.jobStartTime = task.jobStartTime || getDateString(true, true);
        ++statusCheckCount;

        try {
          task.rt = await isFinished(JS, task);

          if (task.rt === null) {
            getLogger(task.projectRootDir).trace(task.jobID, "is not finished");
            return Promise.reject(new Error("not finished"));
          }
          getLogger(task.projectRootDir).info(task.jobID, "is finished (remote). rt =", task.rt);
          task.jobEndTime = task.jobEndTime || getDateString(true, true);

          if (task.rt === 0) {
            await gatherFiles(task);
          }
          await createStatusFile(task);
          return task.jobStatus !== 0 ? task.jobStatus : task.rt;
        } catch (err) {
          ++statusCheckFailedCount;
          err.jobID = task.jobID;
          err.JS = JS;
          getLogger(task.projectRootDir).warn("status check failed", err);

          if (statusCheckFailedCount > maxStatusCheckError) {
            getLogger(task.projectRootDir).warn("max status check error count exceeded");
            err.jobStatusCheckFaild = true;
            err.statusCheckFailedCount = statusCheckFailedCount;
            err.statusCheckCount = statusCheckCount;
            err.maxStatusCheckError = maxStatusCheckError;
            return Promise.reject(err);
          }
          getLogger(task.projectRootDir).trace(task.jobID, "is not finished");
          return Promise.reject(new Error("not finished"));
        }
      },
      retry: (e)=>{
        return e.message === "not finished";
      },
      retryLater: true,
      maxConcurrent: 1,
      interval: statusCheckInterval * 1000,
      name: `statusChecker ${hostname}`
    });
    this.once("taskListUpdated", this.onTaskListUpdated);
  }

  async onTaskListUpdated() {
    getLogger(this.projectRootDir).trace("taskListUpdated");

    if (this.tasks.length > 0) {
      await writeJsonWrapper(this.taskListFilename, this.tasks);
    } else {
      await fs.remove(this.taskListFilename);
    }
    this.once("taskListUpdated", this.onTaskListUpdated);
  }

  addTaskList(task) {
    this.tasks.push(task);
    this.emit("taskListUpdated");
  }

  dropFromTaskList(task) {
    this.tasks = this.tasks.filter((e)=>{
      return !e.ID === task.ID && e.sbsID === task.sbsID;
    });
    this.emit("taskListUpdated");
  }

  async register(task) {
    getLogger(task.projectRootDir).trace("register task", task);

    if (this.tasks.some((e)=>{
      //task.sbsID is set by executer class
      return e.sbsID === task.sbsID;
    })) {
      getLogger(task.projectRootDir).debug("this task is already registerd", task);
      return null;
    }
    this.addTaskList(task);
    const rt = await this.batch.qsubAndWait(task);
    this.dropFromTaskList(task);
    const ee = eventEmitters.get(task.projectRootDir);
    ee.emit(task.projetRootDir, "taskStateChanged", task);
    return rt;
  }
}

/**
 * register job status check and resolve when the job is finished
 */
async function registerJob(hostinfo, task) {
  if (!jobManagers.has(hostinfo.id)) {
    const JM = new JobManager(task.projectRootDir, hostinfo);
    jobManagers.set(hostinfo.id, JM);
  }
  const JM = jobManagers.get(hostinfo.id);
  return JM.register(task);
}

module.exports = {
  registerJob
};
