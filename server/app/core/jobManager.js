/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const { addRequest, getRequest, delRequest } = require("rwatchd");
const { getLogger } = require("../logSettings");
const { jobScheduler } = require("../db/db");
const { createBulkStatusFile } = require("./execUtils");

/**
 * parse output text from batch server and get return code or jobstatus code from it
 * @param {string} outputText - output from batch server
 * @param {RegExp} reCode - regexp to extract value from outputText
 */
function getFirstCapture(outputText, reCode) {
  const re = new RegExp(reCode, "m");
  const result = re.exec(outputText);
  const rt = result === null || typeof (result[1]) === "undefined" ? null : result[1];
  return rt;
}

/**
 * parse output text from batch server and get bulkjob's status code from it
 * @param {string} outputText - output from batch server
 * @param {RegExp} reSubCode - regexp to extract value from outputText
 */
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
 * check if Job status code means failed or not
 * @param {object} JS - jobScheduler.json info
 * @param {string} code - job status code get from status check command
 * @returns {boolean} - true means job is failed.
 */
function isJobFailed(JS, code) {
  const statusList = [];
  if (typeof JS.acceptableJobStatus === "undefined") {
    statusList.push("0", 0);
  } else if (Array.isArray(JS.acceptableJobStatus)) {
    statusList.push(...JS.acceptableJobStatus);
  } else if (typeof JS.acceptableJobStatus.toString === "function") {
    statusList.push(JS.acceptableJobStatus.toString());
  } else {
    return false;
  }
  return statusList.includes(code);
}

/**
 * get status code from job status command's output
 * @param {object} JS - jobScheduler.json info
 * @param {object} task - task component instance
 * @param {number} statCmdRt  - status check command's return code
 * @param {string} outputText - output from status check command
 * @returns {number} - return code of job
 */
async function getStatusCode(JS, task, statCmdRt, outputText) {
  //for backward compatibility use reJobStatus if JS does not have reJobStatusCode
  const reJobStatusCode = JS.reJobStatusCode || JS.reJobStatus;
  let [jobStatus, jobStatusList] = [0, []];
  if (task.type !== "bulkjobTask") {
    task.jobStatus = getFirstCapture(outputText, reJobStatusCode.replace("{{ JOBID }}", task.jobID));
  } else {
    [jobStatus, jobStatusList] = getBulkFirstCapture(outputText, JS.reSubJobStatusCode.replace("{{ JOBID }}", task.jobID));
    getLogger(task.projectRootDir).debug(`JobStatus: ${jobStatus} ,jobStatusList: ${jobStatusList}`);
    task.jobStatus = jobStatus;
  }
  if (task.jobStatus === null) {
    getLogger(task.projectRootDir).warn("get job status code failed, code is overwrited by -2");
    task.jobStatus = -2;
  }
  if (statCmdRt !== 0) {
    if (!JS.acceptableRt.includes(statCmdRt)) {
      getLogger(task.projectRootDir).warn(`status check command failed (${statCmdRt})`);
      return -2;
    }
    getLogger(task.projectRootDir).warn(`status check command returns ${statCmdRt} and it is in acceptableRt: ${JS.acceptableRt}`);
    getLogger(task.projectRootDir).warn("it may fail to get job script's return code. so it is overwirted by 0");
    return 0;
  }

  let strRt = 0;
  let [rt, rtCodeList] = [0, []];
  if (task.type !== "bulkjobTask") {
    strRt = getFirstCapture(outputText, JS.reReturnCode.replace("{{ JOBID }}", task.jobID));
  } else {
    [rt, rtCodeList] = getBulkFirstCapture(outputText, JS.reSubReturnCode.replace("{{ JOBID }}", task.jobID));
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
  task.rt = parseInt(strRt, 10);
  return task.rt;
}

/**
 * create request object to check job status by webAPI on fugaku
 * @param {object} hostinfo - target host information object
 * @param {object} task - task component instance
 * @param {object} JS - jobScheduler.json info
 */
function createRequestForWebAPI(hostinfo, task, JS) {
  const baseURL = "https://api.fugaku.r-ccs.riken.jp/queue/computer";
  //TODO curlのオプションをaccessTokenを使うものに変更
  return {
    cmd: `curl --cert-type P12 -X POST  --cert ${process.env.WHEEL_CERT_FILENAME}:${process.env.WHEEL_CERT_PASSPHRASE} ${baseURL}/`,
    withoutArgument: true,
    finishedLocalHook: {
      cmd: `curl --cert-type P12 -X POST --cert ${process.env.WHEEL_CERT_FILENAME}:${process.env.WHEEL_CERT_PASSPHRASE} ${baseURL}/${task.jobID}`
    },
    delimiter: JS.statDelimiter,
    re: JS.reRunning.replace("{{ JOBID }}", task.jobID),
    interval: hostinfo.statusCheckInterval * 1000,
    argument: task.jobID,
    hostInfo: { host: "localhost" },
    numAllowFirstFewEmptyOutput: 3,
    allowEmptyOutput: JS.allowEmptyOutput
  };
}

/**
 * create request object to check job status
 * @param {object} hostinfo - target host information object
 * @param {object} task - task component instance
 * @param {object} JS - jobScheduler.json info
 */
function createRequest(hostinfo, task, JS) {
  return {
    cmd: task.type !== "bulkjobTask" ? JS.stat : JS.bulkstat,
    finishedHook: {
      cmd: task.type !== "bulkjobTask" ? JS.statAfter : JS.bulkstatAfter,
      withArgument: true
    },
    delimiter: JS.statDelimiter,
    re: JS.reRunning.replace("{{ JOBID }}", task.jobID),
    interval: hostinfo.statusCheckInterval * 1000,
    argument: task.jobID,
    hostInfo: hostinfo,
    numAllowFirstFewEmptyOutput: 3,
    allowEmptyOutput: JS.allowEmptyOutput
  };
}

/**
 * register job to job manager
 * @param {object} hostinfo - target host information object
 * @param {object} task - task component instance
 */
function registerJob(hostinfo, task) {
  return new Promise((resolve, reject)=>{
    const JS = jobScheduler[hostinfo.jobScheduler];
    if (!JS) {
      const err = new Error("jobscheduler setting not found!");
      err.hostinfo = hostinfo;
      reject(err);
    }
    const request = hostinfo.useWebAPI ? createRequestForWebAPI(hostinfo, task, JS) : createRequest(hostinfo, task, JS);
    const id = addRequest(request);
    const result = getRequest(id);
    const requestName = `${request.argument} on ${request.hostInfo.host}`;
    let statusCheckErrorCount = 0;
    result.event.on("checked", (request)=>{
      getLogger(task.projectRootDir).debug(`${requestName} status checked ${request.checkCount}`);
      getLogger(task.projectRootDir).trace(`${requestName} status checked output:\n ${request.lastOutput}`);
      //TODO accessTokenの更新が必要ならここに入れる
      if (request.rt !== 0) {
        statusCheckErrorCount++;
      }
      if (JS.maxStatusCheckError < statusCheckErrorCount) {
        const err = new Error("max status check error exceeded");
        err.numStatusCheckError = statusCheckErrorCount;
        err.maxStatusCheckError = JS.maxStatusCheckError;
        delRequest(id);
        reject(err);
      }
    });
    result.event.on("finished", async (request)=>{
      const hook = hostinfo.useWebAPI ? request.finishedLocalHook : request.finishedHook;
      getLogger(task.projectRootDir).debug(`${requestName} done`);
      getLogger(task.projectRootDir).trace(`${requestName} after cmd output:\n ${hook.output}`);
      const reEmpty = /^\s*$/;
      if (reEmpty.test(hook.output)) {
        getLogger(task.projectRootDir).trace(`${requestName} after cmd output is empty retring`);

        const request2 = structuredClone(request);
        request2.cmd = hook.cmd;
        request2.re = reEmpty.toString();
        delete request2.finishedHook;
        delete request2.finishedLocalHook;

        const id2 = addRequest(request2);
        const result2 = getRequest(id2);
        await new Promise((resolve, reject)=>{
          result2.event.on("finished", ()=>{
            hook.rt = result2.rt;
            hook.output = result2.lastOutput;
            resolve();
          });
          result2.event.on("failed", (args)=>{
            reject(args);
          });
        });
      }
      const rt = await getStatusCode(JS, task, hook.rt, hook.output);
      if (isJobFailed(JS, task.jobStatus)) {
        return reject(task.jobStatus);
      }
      return resolve(rt);
    });
    //faild event does not mean job failure
    result.event.on("failed", (request, hookErr)=>{
      const err = new Error("fatal error occurred during job status check");
      err.request = request;
      if (typeof hookErr !== "undefined") {
        err.hookErr = hookErr;
      }
      reject(err);
    });
  });
}

module.exports = {
  registerJob
};
