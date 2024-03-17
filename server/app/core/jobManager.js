/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const {addRequest, getRequest} = require("rwatchd");
const { getLogger } = require("../logSettings");
const { jobScheduler } = require("../db/db");
const { createBulkStatusFile } = require("./execUtils");
const { getSsh } = require("./sshManager.js");
const pRetry = require("p-retry");

/**
 * parse output text from batch server and get return code or jobstatus code from it
 */
function getFirstCapture(outputText, reCode) {
  const re = new RegExp(reCode, "m");
  const result = re.exec(outputText);
  const rt = result === null || typeof (result[1]) === "undefined" ? null : result[1];
  return rt
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
 * check if Job status code means failed or not
 * @param {Object} JS - jobScheduler.json info
 * @param {String} code - job status code get from status check command
 * @returns {Boolean} -
 */
function isJobFailed(JS, code){
  const statusList = []
  if(typeof JS.acceptableJobStatus === "undefined"){
    statusList.push("0", 0);
  }else if (Array.isArray(JS.acceptableJobStatus)) {
    statusList.push(...JS.acceptableJobStatus)
  }else if(typeof JS.acceptableJobStatus.toString === "function"){
    statusList.push(JS.acceptableJobStatus.toString())
  }else{
    return false
  }
  return !statusList.includes(code) 
}

async function getStatusCode(JS, task, statCmdRt, outputText){
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
    if(!JS.acceptableRt.includes(statCmdRt)){
      getLogger(task.projectRootDir).warn(`status check command failed (${statCmdRt})`);
      return -2
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

function registerJob(hostinfo, task) {
  return new Promise((resolve, reject)=>{
    const JS = jobScheduler[hostinfo.jobScheduler];
    if(!JS){
      const err = new Error("jobscheduler setting not found!")
      err.hostinfo=hostinfo
      reject(err);
    }
    const request={
      cmd: task.type !== "bulkjobTask" ? JS.stat : JS.bulkstat,
      finishedHook:{
        cmd: task.type !== "bulkjobTask" ? JS.statAfter:JS.bulkstatAfter,
        withArgument: true
      },
      delimiter:JS.statDelimiter,
      re: JS.reRunning.replace("{{ JOBID }}", task.jobID),
      interval: hostinfo.statusCheckInterval *1000,
      argument: task.jobID,
      hostInfo: hostinfo,
      numAllowFirstFewEmptyOutput: 3,
      allowEmptyOutput: JS.allowEmptyOutput
    }

    const id = addRequest(request)
    const result=getRequest(id);
    const requestName = `${request.argument} on ${request.hostInfo.host}`
    let statusCheckErrorCount=0
    result.event.on("checked", (request)=>{
      getLogger(task.projectRootDir).debug(`${requestName} status checked ${request.checkCount}`);
      getLogger(task.projectRootDir).trace(`${requestName} status checked output:\n ${request.lastOutput}`);

      if(request.rt !== 0){
        statusCheckErrorCount++
      }
      if(JS.maxStatusCheckError < statusCheckErrorCount){
        const err=new Error("max status check error exceeded")
        err.numStatusCheckError =statusCheckErrorCount
        err.maxStatusCheckError =JS.maxStatusCheckError
        reject(err);
      }
    });
    result.event.on("finished", async (request)=>{
      getLogger(task.projectRootDir).debug(`${requestName} done`);
      getLogger(task.projectRootDir).trace(`${requestName} after cmd output:\n ${request.finishedHook.output}`)

      if(/^\s*$/.test(request.finishedHook.output)) {
        getLogger(task.projectRootDir).trace(`${requestName} after cmd output is empty retring`)

        await pRetry(async ()=>{
          let outputText = "";
          const ssh = getSsh(task.projectRootDir, task.remotehostID);
          await ssh.exec(request.finishedHook.cmd, 60, (data)=>{
            outputText += data;
          });

          if(/^\s*$/.test(outputText)){
            throw new Error("got empty output from status check command");
          }
          request.finishedHook.output = outputText
          return true
        },{
          onFailedAttempt: (error)=>{
            getLogger(task.projectRootDir).trace(`${requestName} after cmd output is empty retring ${error.attemptNumber}}`)
          },
          minTimeout: 1000,
          maxTimeout: 60000,
          retries: 12,
          factor: 2
        })
      }

      if(isJobFailed(JS, task.jobStatus)){
        reject(task.jobStatus)
      }
      const rt = await getStatusCode(JS, task, request.finishedHook.rt, request.finishedHook.output)
      if(rt === 0){
        resolve(rt)
      }else{
        reject(rt)
      }
    });
    //faild event does not mean job failure
    result.event.on("failed", (request, hookErr)=>{
      const err = new Error("fatal error occurred during job status check")
      err.request=request

      if(typeof hookErr !== "undefined"){
        err.hookErr=hookErr
      }
      reject(err);
    });
  });
}

module.exports = {
  registerJob,
};
