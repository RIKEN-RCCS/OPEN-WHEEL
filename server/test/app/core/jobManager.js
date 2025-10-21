/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import { EventEmitter } from "events";
import { expect } from "chai";
import sinon from "sinon";
import { _internal, getFirstCapture, getBulkFirstCapture, isJobFailed, getStatusCode, createRequestForWebAPI, createRequest, registerJob } from "../../../app/core/jobManager.js";
describe("#getFirstCapture", ()=>{
  beforeEach(()=>{
    //getFirstCapture is now imported directly
  });

  it("should return null if there is no match (result === null)", ()=>{
    const outputText = "No matching pattern here";
    const reCode = "value: ([0-9]+)";
    const result = getFirstCapture(outputText, reCode);
    expect(result).to.be.null;
  });

  it("should return null if a match exists but capturing group is undefined", ()=>{
    const outputText = "pattern matched but no capturing group";
    const reCode = "pattern matched";
    const result = getFirstCapture(outputText, reCode);
    expect(result).to.be.null;
  });

  it("should return the captured group if match is found and capturing group is present", ()=>{
    const outputText = "ReturnCode: 12345 found here";
    const reCode = "ReturnCode:\\s+([0-9]+)";
    const result = getFirstCapture(outputText, reCode);
    expect(result).to.equal("12345");
  });

  it("should handle empty string capture correctly (still not null if matched)", ()=>{
    const outputText = "PrefixSuffix";
    const reCode = "Prefix()Suffix";
    const result = getFirstCapture(outputText, reCode);
    expect(result).to.equal("");
  });
});

describe("#getBulkFirstCapture", ()=>{
  beforeEach(()=>{
    //getBulkFirstCapture is now imported directly
  });

  it("should return [1, []] if no lines match the pattern", ()=>{
    const outputText = [
      "some line",
      "another line",
      "yet another line"
    ].join("\n");

    const reSubCode = /CODE=(d+)/;
    const result = getBulkFirstCapture(outputText, reSubCode);

    expect(result).to.deep.equal([1, []]);
  });

  it("should return [0, codeList] if some lines match and at least one capture is '0'", ()=>{
    const outputText = [
      "some line CODE=1",
      "some line CODE=0",
      "last line CODE=2"
    ].join("\n");

    const reSubCode = /CODE=(d+)/;
    const result = getBulkFirstCapture(outputText, reSubCode);

    expect(result).to.deep.equal([0, ["1", "0", "2"]]);
  });

  it("should return [1, codeList] if all captures are not '0'", ()=>{
    const outputText = [
      "some line CODE=5",
      "some line CODE=9"
    ].join("\n");

    const reSubCode = /CODE=(d+)/;
    const result = getBulkFirstCapture(outputText, reSubCode);

    expect(result).to.deep.equal([1, ["5", "9"]]);
  });

  it("should treat lines with undefined capture group as nonzero, returning [1, codeList]", ()=>{
    const outputText = [
      "line1 CODE=0",
      "line2 CODE=123"
    ].join("\n");

    const reSubCode = /CODE=d+/;

    const result = getBulkFirstCapture(outputText, reSubCode);

    expect(result).to.deep.equal([1, [undefined, undefined]]);
  });
});

describe("#isJobFailed", ()=>{
  beforeEach(()=>{
    //isJobFailed is now imported directly
  });

  it("should return true if acceptableJobStatus is undefined and code is '0'", ()=>{
    const JS = {};
    const code = "0";
    const result = isJobFailed(JS, code);
    expect(result).to.be.true;
  });

  it("should return false if acceptableJobStatus is undefined and code is not '0'", ()=>{
    const JS = {};
    const code = "1";
    const result = isJobFailed(JS, code);
    expect(result).to.be.false;
  });

  it("should return true if acceptableJobStatus is an array and code is included in the array", ()=>{
    const JS = {
      acceptableJobStatus: ["1", "99", "abc"]
    };
    const code = "99";
    const result = isJobFailed(JS, code);
    expect(result).to.be.true;
  });

  it("should return false if acceptableJobStatus is an array and code is not included in the array", ()=>{
    const JS = {
      acceptableJobStatus: ["1", "99", "abc"]
    };
    const code = "xyz";
    const result = isJobFailed(JS, code);
    expect(result).to.be.false;
  });

  it("should return true if acceptableJobStatus is an object that has toString() and code matches that string", ()=>{
    const JS = {
      acceptableJobStatus: {
        toString: ()=>{ return "ABC"; }
      }
    };
    const code = "ABC";
    const result = isJobFailed(JS, code);
    expect(result).to.be.true;
  });

  it("should return false if acceptableJobStatus is an object that has toString() but code does not match", ()=>{
    const JS = {
      acceptableJobStatus: {
        toString: ()=>{ return "ABC"; }
      }
    };
    const code = "DEF";
    const result = isJobFailed(JS, code);
    expect(result).to.be.false;
  });

  it("should return false if acceptableJobStatus has no valid toString() function", ()=>{
    const objNoToString = Object.create(null);
    expect(typeof objNoToString.toString).to.equal("undefined");

    const JS = {
      acceptableJobStatus: objNoToString
    };
    const code = "anything";
    const result = isJobFailed(JS, code);
    expect(result).to.be.false;
  });
});

describe("#getStatusCode", ()=>{
  //eslint-disable-next-line no-unused-vars
  let getLoggerStub;
  let loggerDebugStub;
  let loggerWarnStub;
  let getFirstCaptureStub;
  let getBulkFirstCaptureStub;
  let createBulkStatusFileStub;

  beforeEach(()=>{
    //getStatusCode is now imported directly
    loggerDebugStub = sinon.stub();
    loggerWarnStub = sinon.stub();
    getLoggerStub = sinon.stub(_internal, "getLogger").returns({ debug: loggerDebugStub, warn: loggerWarnStub });
    getFirstCaptureStub = sinon.stub(_internal, "getFirstCapture");
    getBulkFirstCaptureStub = sinon.stub(_internal, "getBulkFirstCapture");
    createBulkStatusFileStub = sinon.stub(_internal, "createBulkStatusFile").resolves();
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return parsed int when (task.type !== 'bulkjobTask') and everything is normal", async ()=>{
    const JS = {
      reJobStatusCode: "RE_JOB_STATUSCODE_{{ JOBID }}=" + "(d+)",
      reReturnCode: "RE_RETURNCODE_{{ JOBID }}=" + "(d+)",
      acceptableRt: [0, 1]
    };
    const task = {
      type: "normalTask",
      jobID: "123",
      projectRootDir: "/dummy/dir"
    };
    const statCmdRt = 0;
    const outputText = "RE_JOB_STATUSCODE_123=0\nRE_RETURNCODE_123=5";

    getFirstCaptureStub.onFirstCall().returns("0");
    getFirstCaptureStub.onSecondCall().returns("5");

    const result = await getStatusCode(JS, task, statCmdRt, outputText);

    expect(result).to.equal(5);
    expect(task.jobStatus).to.equal("0");
    expect(task.rt).to.equal(5);
    expect(loggerDebugStub.called).to.be.false;
    expect(loggerWarnStub.called).to.be.false;
  });

  it("should use JS.reJobStatus instead of JS.reJobStatusCode if the latter is undefined", async ()=>{
    const JS = {
      reJobStatus: "FALLBACK_{{ JOBID }}=" + "(d+)",
      reReturnCode: "FALLBACK_RET_{{ JOBID }}=" + "(d+)",
      acceptableRt: [0]
    };
    const task = {
      type: "normalTask",
      jobID: "999",
      projectRootDir: "/dummy/fallback"
    };
    const statCmdRt = 0;
    const outputText = "FALLBACK_999=2\nFALLBACK_RET_999=4";

    getFirstCaptureStub.onFirstCall().returns("2");
    getFirstCaptureStub.onSecondCall().returns("4");

    const result = await getStatusCode(JS, task, statCmdRt, outputText);

    expect(result).to.equal(4);
    expect(task.jobStatus).to.equal("2");
    expect(loggerWarnStub.called).to.be.false;
  });

  it("should set jobStatus to -2 when jobStatus is not found (null)", async ()=>{
    const JS = {
      reJobStatusCode: "NO_MATCH_{{ JOBID }}=" + "(d+)",
      reReturnCode: "ANY_RET_{{ JOBID }}=" + "(d+)",
      acceptableRt: [0]
    };
    const task = {
      type: "normalTask",
      jobID: "111",
      projectRootDir: "/dummy/null"
    };
    const statCmdRt = 0;
    const outputText = "SOME_OTHER_TEXT";

    getFirstCaptureStub.onFirstCall().returns(null);
    getFirstCaptureStub.onSecondCall().returns("5");

    const result = await getStatusCode(JS, task, statCmdRt, outputText);

    expect(result).to.equal(5);
    expect(task.jobStatus).to.equal(-2);
    expect(loggerWarnStub.called).to.be.true;
  });

  it("should return -2 immediately if statCmdRt is not acceptable", async ()=>{
    const JS = {
      reJobStatusCode: "ANY_{{ JOBID }}=" + "(d+)",
      reReturnCode: "ANY_RET_{{ JOBID }}=" + "(d+)",
      acceptableRt: [0, 5]
    };
    const task = {
      type: "normalTask",
      jobID: "222",
      projectRootDir: "/dummy/stat"
    };
    const statCmdRt = 3;
    const outputText = "";

    const result = await getStatusCode(JS, task, statCmdRt, outputText);
    expect(result).to.equal(-2);
    expect(loggerWarnStub.calledWithMatch("status check command failed (3)")).to.be.true;
  });

  it("should return 0 if statCmdRt is acceptable but not zero", async ()=>{
    const JS = {
      reJobStatusCode: "ANY_{{ JOBID }}=" + "(d+)",
      reReturnCode: "ANY_RET_{{ JOBID }}=" + "(d+)",
      acceptableRt: [0, 8]
    };
    const task = {
      type: "normalTask",
      jobID: "333",
      projectRootDir: "/dummy/stat"
    };
    const statCmdRt = 8;
    const outputText = "";

    const result = await getStatusCode(JS, task, statCmdRt, outputText);
    expect(result).to.equal(0);
    expect(loggerWarnStub.calledWithMatch("it may fail to get job script's return code. so it is overwirted by 0")).to.be.true;
  });

  it("should return -2 when strRt is null", async ()=>{
    const JS = {
      reJobStatusCode: "JS_{{ JOBID }}=" + "(d+)",
      reReturnCode: "RET_{{ JOBID }}=" + "(d+)",
      acceptableRt: [0]
    };
    const task = {
      type: "normalTask",
      jobID: "444",
      projectRootDir: "/dummy/nullret"
    };
    const statCmdRt = 0;
    const outputText = "JS_444=0";

    getFirstCaptureStub.onFirstCall().returns("0");
    getFirstCaptureStub.onSecondCall().returns(null);

    const result = await getStatusCode(JS, task, statCmdRt, outputText);
    expect(result).to.equal(-2);
    expect(loggerWarnStub.calledWithMatch("get return code failed")).to.be.true;
  });

  it("should return 0 when strRt is '6'", async ()=>{
    const JS = {
      reJobStatusCode: "JS_{{ JOBID }}=" + "(d+)",
      reReturnCode: "RET_{{ JOBID }}=" + "(d+)",
      acceptableRt: [0]
    };
    const task = {
      type: "normalTask",
      jobID: "555",
      projectRootDir: "/dummy/cancel"
    };
    const statCmdRt = 0;
    const outputText = "JS_555=3\nRET_555=6";

    getFirstCaptureStub.onFirstCall().returns("3");
    getFirstCaptureStub.onSecondCall().returns("6");

    const result = await getStatusCode(JS, task, statCmdRt, outputText);
    expect(result).to.equal(0);
    expect(loggerWarnStub.calledWithMatch("this job was canceled by stepjob dependency")).to.be.true;
  });

  it("should handle bulkjobTask by calling createBulkStatusFile", async ()=>{
    const JS = {
      reJobStatusCode: "NO_USE",
      reSubJobStatusCode: "SUBSTATUS_{{ JOBID }}=" + "(d+)",
      reReturnCode: "NO_USE",
      reSubReturnCode: "SUBRET_{{ JOBID }}=" + "(d+)",
      acceptableRt: [0]
    };
    const task = {
      type: "bulkjobTask",
      jobID: "666",
      projectRootDir: "/dummy/bulk"
    };
    const statCmdRt = 0;
    const outputText = "SUBSTATUS_666=0\nSUBRET_666=1\nSUBSTATUS_666=0\nSUBRET_666=0";

    getBulkFirstCaptureStub.onFirstCall().returns([0, ["0", "0"]]);
    getBulkFirstCaptureStub.onSecondCall().returns([1, ["1", "0"]]);

    const result = await getStatusCode(JS, task, statCmdRt, outputText);

    expect(result).to.equal(1);
    expect(task.jobStatus).to.equal(0);
    expect(task.rt).to.equal(1);
    expect(createBulkStatusFileStub.calledOnce).to.be.true;
    expect(loggerDebugStub.calledWithMatch("JobStatus: 0 ,jobStatusList: 0,0")).to.be.true;
    expect(loggerDebugStub.calledWithMatch("rt: 1 ,rtCodeList: 1,0")).to.be.true;
  });
});

describe("#createRequestForWebAPI", ()=>{
  let createRequestForWebAPIFunc;
  let originalCertFilename;
  let originalCertPassphrase;
  let hostinfo;
  let task;
  let JS;

  beforeEach(()=>{
    createRequestForWebAPIFunc = createRequestForWebAPI;
    originalCertFilename = process.env.WHEEL_CERT_FILENAME;
    originalCertPassphrase = process.env.WHEEL_CERT_PASSPHRASE;
    process.env.WHEEL_CERT_FILENAME = "testCertFile.p12";
    process.env.WHEEL_CERT_PASSPHRASE = "testCertPass";

    hostinfo = {
      statusCheckInterval: 5
    };
    task = {
      jobID: "12345"
    };
    JS = {
      statDelimiter: "\n",
      reRunning: "RUNNING_{{ JOBID }}",
      allowEmptyOutput: false
    };
  });

  afterEach(()=>{
    process.env.WHEEL_CERT_FILENAME = originalCertFilename;
    process.env.WHEEL_CERT_PASSPHRASE = originalCertPassphrase;
    sinon.restore();
  });

  it("should return a valid request object for Fugaku webAPI", ()=>{
    const result = createRequestForWebAPIFunc(hostinfo, task, JS);
    expect(result).to.be.an("object");
    expect(result.cmd).to.be.a("string");
    expect(result.cmd).to.include("curl");
    expect(result.cmd).to.include("testCertFile.p12");
    expect(result.cmd).to.include("testCertPass");
    expect(result.withoutArgument).to.be.true;
    expect(result.finishedLocalHook).to.be.an("object");
    expect(result.finishedLocalHook.cmd).to.include("12345");
    expect(result.delimiter).to.equal("\n");
    expect(result.re).to.equal("RUNNING_12345");
    expect(result.interval).to.equal(5 * 1000);
    expect(result.argument).to.equal("12345");
    expect(result.hostInfo).to.deep.equal({ host: "localhost" });
    expect(result.numAllowFirstFewEmptyOutput).to.equal(3);
    expect(result.allowEmptyOutput).to.be.false;
  });
});

describe("#createRequest", ()=>{
  let createRequestFunc;
  let hostinfo;
  let task;
  let JS;

  beforeEach(()=>{
    createRequestFunc = createRequest;
    hostinfo = {
      statusCheckInterval: 10,
      someOtherProperty: "dummy"
    };
    task = {
      jobID: "9999"
    };
    JS = {
      stat: "qstat",
      statAfter: "qstat -f",
      bulkstat: "qstat-bulk",
      bulkstatAfter: "qstat-bulk -f",
      statDelimiter: "\n",
      reRunning: "RUNNING_{{ JOBID }}",
      allowEmptyOutput: true
    };
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return correct object when task.type is not 'bulkjobTask'", ()=>{
    task.type = "normalTask";

    const result = createRequestFunc(hostinfo, task, JS);
    expect(result).to.be.an("object");
    expect(result.cmd).to.equal("qstat");
    expect(result.finishedHook).to.deep.equal({
      cmd: "qstat -f",
      withArgument: true
    });
    expect(result.delimiter).to.equal("\n");
    expect(result.re).to.equal("RUNNING_9999");
    expect(result.interval).to.equal(10 * 1000);
    expect(result.argument).to.equal("9999");
    expect(result.hostInfo).to.equal(hostinfo);
    expect(result.numAllowFirstFewEmptyOutput).to.equal(3);
    expect(result.allowEmptyOutput).to.be.true;
  });

  it("should return correct object when task.type is 'bulkjobTask'", ()=>{
    task.type = "bulkjobTask";

    const result = createRequestFunc(hostinfo, task, JS);
    expect(result).to.be.an("object");
    expect(result.cmd).to.equal("qstat-bulk");
    expect(result.finishedHook).to.deep.equal({
      cmd: "qstat-bulk -f",
      withArgument: true
    });
    expect(result.delimiter).to.equal("\n");
    expect(result.re).to.equal("RUNNING_9999");
    expect(result.interval).to.equal(10 * 1000);
    expect(result.argument).to.equal("9999");
    expect(result.hostInfo).to.equal(hostinfo);
    expect(result.numAllowFirstFewEmptyOutput).to.equal(3);
    expect(result.allowEmptyOutput).to.be.true;
  });
});

describe("#registerJob", ()=>{
  //eslint-disable-next-line no-unused-vars
  let jobSchedulerStub;
  let addRequestStub;
  let getRequestStub;
  let delRequestStub;
  //eslint-disable-next-line no-unused-vars
  let getLoggerStub;
  let createRequestForWebAPIStub;
  let createRequestStub;
  let getStatusCodeStub;
  let isJobFailedStub;
  let hostinfo;
  let task;

  beforeEach(()=>{
    //registerJob is now imported directly
    jobSchedulerStub = sinon.stub(_internal, "jobScheduler").value({
      dummyJS: {
        maxStatusCheckError: 2,
        stat: "dummyStatCommand",
        bulkstat: "dummyBulkStatCommand",
        statAfter: "dummyAfterCommand",
        bulkstatAfter: "dummyBulkAfterCommand",
        statDelimiter: "\n",
        reRunning: "RUNNING",
        allowEmptyOutput: false,
        acceptableRt: [0]
      }
    });
    addRequestStub = sinon.stub(_internal, "addRequest");
    getRequestStub = sinon.stub(_internal, "getRequest");
    delRequestStub = sinon.stub(_internal, "delRequest");
    getLoggerStub = sinon.stub(_internal, "getLogger").returns({ debug: sinon.stub(), trace: sinon.stub(), warn: sinon.stub() });
    createRequestForWebAPIStub = sinon.stub(_internal, "createRequestForWebAPI");
    createRequestStub = sinon.stub(_internal, "createRequest");
    getStatusCodeStub = sinon.stub(_internal, "getStatusCode");
    isJobFailedStub = sinon.stub(_internal, "isJobFailed");

    hostinfo = {
      jobScheduler: "dummyJS",
      useWebAPI: false,
      statusCheckInterval: 1
    };
    task = {
      projectRootDir: "/some/project",
      jobID: "12345",
      type: "normalTask"
    };
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should reject if jobScheduler setting not found", async ()=>{
    hostinfo.jobScheduler = "notFoundScheduler";

    try {
      await registerJob(hostinfo, task);
      expect.fail("Expected registerJob to throw, but it did not");
    } catch (err) {
      expect(err.message).to.equal("jobscheduler setting not found!");
      expect(err.hostinfo).to.deep.equal(hostinfo);
    }
  });

  it("should use createRequestForWebAPI if useWebAPI=true", async ()=>{
    hostinfo.useWebAPI = true;
    const eventEmitter = new EventEmitter();
    const requestObj = {
      argument: "12345",
      hostInfo: { host: "localhost" },
      event: eventEmitter
    };
    createRequestForWebAPIStub.returns(requestObj);
    addRequestStub.returns("req-999");
    getRequestStub.returns(requestObj);

    const p = registerJob(hostinfo, task);

    expect(createRequestForWebAPIStub.calledOnce).to.be.true;
    expect(createRequestStub.notCalled).to.be.true;

    getStatusCodeStub.resolves(0);
    isJobFailedStub.returns(false);

    eventEmitter.emit("finished", {
      argument: "12345",
      hostInfo: { host: "localhost" },
      finishedLocalHook: {
        rt: 0,
        output: "some dummy output"
      }
    });

    const result = await p;
    expect(result).to.equal(0);
  });

  it("should re-check output if after cmd output is empty, then continue", async ()=>{
    const firstEmitter = new EventEmitter();
    const firstRequestObj = {
      argument: "12345",
      hostInfo: { host: "dummyHost" },
      event: firstEmitter
    };
    createRequestStub.returns(firstRequestObj);

    let addRequestCallCount = 0;
    addRequestStub.callsFake(()=>{
      if (addRequestCallCount === 0) {
        addRequestCallCount++;
        return "req-987";
      } else if (addRequestCallCount === 1) {
        addRequestCallCount++;
        return "req-recheck";
      } else {
        addRequestCallCount++;
        return "req-other";
      }
    });

    const secondEmitter = new EventEmitter();
    const secondRequestObj = {
      argument: "12345",
      hostInfo: { host: "dummyHost" },
      event: secondEmitter
    };
    getRequestStub.callsFake((id)=>{
      if (id === "req-987") {
        return firstRequestObj;
      } else if (id === "req-recheck") {
        return secondRequestObj;
      }
      return undefined;
    });

    const p = registerJob(hostinfo, task);

    firstEmitter.emit("finished", {
      argument: "12345",
      hostInfo: { host: "dummyHost" },
      finishedHook: { rt: 0, output: "" }
    });

    getStatusCodeStub.resolves(0);
    isJobFailedStub.returns(false);

    secondEmitter.emit("finished", {
      argument: "12345",
      hostInfo: { host: "dummyHost" },
      finishedHook: { rt: 0, output: "recheck success" }
    });

    const result = await p;
    expect(result).to.equal(0);
    expect(addRequestStub.callCount).to.equal(2);
  });

  it("should use createRequest if useWebAPI=false", async ()=>{
    const eventEmitter = new EventEmitter();
    const requestObj = {
      argument: "12345",
      hostInfo: { host: "dummyHost" },
      event: eventEmitter
    };
    createRequestStub.returns(requestObj);
    addRequestStub.returns("req-123");
    getRequestStub.returns(requestObj);

    const p = registerJob(hostinfo, task);

    expect(createRequestForWebAPIStub.notCalled).to.be.true;
    expect(createRequestStub.calledOnce).to.be.true;

    getStatusCodeStub.resolves(0);
    isJobFailedStub.returns(false);

    eventEmitter.emit("finished", {
      argument: "12345",
      hostInfo: { host: "dummyHost" },
      finishedHook: {
        rt: 0,
        output: "some normal output"
      }
    });

    const result = await p;
    expect(result).to.equal(0);
  });

  it("should increment error count on 'checked' if request.rt != 0 and reject when it exceeds max", async ()=>{
    const eventEmitter = new EventEmitter();
    const requestObj = {
      argument: "12345",
      hostInfo: { host: "dummyHost" },
      event: eventEmitter
    };
    createRequestStub.returns(requestObj);
    addRequestStub.returns("req-abc");
    getRequestStub.returns(requestObj);

    const p = registerJob(hostinfo, task);

    eventEmitter.emit("checked", {
      argument: "12345",
      hostInfo: { host: "dummyHost" },
      rt: 999,
      checkCount: 1,
      lastOutput: "some output"
    });
    eventEmitter.emit("checked", {
      argument: "12345",
      hostInfo: { host: "dummyHost" },
      rt: 999,
      checkCount: 2,
      lastOutput: "some output"
    });

    try {
      eventEmitter.emit("checked", {
        argument: "12345",
        hostInfo: { host: "dummyHost" },
        rt: 999,
        checkCount: 3,
        lastOutput: "some output"
      });
      await p;
      expect.fail("Expected to reject, but resolved");
    } catch (err) {
      expect(err.message).to.equal("max status check error exceeded");
      expect(delRequestStub.calledOnceWithExactly("req-abc")).to.be.true;
    }
  });

  it("should reject if isJobFailed returns true", async ()=>{
    task.jobStatus = -999;

    const eventEmitter = new EventEmitter();
    const requestObj = {
      argument: "12345",
      hostInfo: { host: "dummyHost" },
      event: eventEmitter
    };
    createRequestStub.returns(requestObj);
    addRequestStub.returns("req-555");
    getRequestStub.returns(requestObj);

    const p = registerJob(hostinfo, task);

    getStatusCodeStub.resolves(123);
    isJobFailedStub.returns(true);

    eventEmitter.emit("finished", {
      argument: "12345",
      hostInfo: { host: "dummyHost" },
      finishedHook: {
        rt: 0,
        output: "some output"
      }
    });

    try {
      await p;
      expect.fail("Expected to reject, but it resolved");
    } catch (err) {
      expect(err).to.equal(task.jobStatus);
    }
  });

  it("should resolve if isJobFailed is false", async ()=>{
    const eventEmitter = new EventEmitter();
    const requestObj = {
      argument: "12345",
      hostInfo: { host: "dummyHost" },
      event: eventEmitter
    };
    createRequestStub.returns(requestObj);
    addRequestStub.returns("req-666");
    getRequestStub.returns(requestObj);

    const p = registerJob(hostinfo, task);

    getStatusCodeStub.resolves(0);
    isJobFailedStub.returns(false);

    eventEmitter.emit("finished", {
      argument: "12345",
      hostInfo: { host: "dummyHost" },
      finishedHook: {
        rt: 0,
        output: "normal output"
      }
    });

    const result = await p;
    expect(result).to.equal(0);
  });

  it("should reject on 'failed' event", async ()=>{
    const eventEmitter = new EventEmitter();
    const requestObj = {
      argument: "12345",
      hostInfo: { host: "dummyHost" },
      event: eventEmitter
    };
    createRequestStub.returns(requestObj);
    addRequestStub.returns("req-failTest");
    getRequestStub.returns(requestObj);

    const p = registerJob(hostinfo, task);

    const hookErr = new Error("some hook error");
    eventEmitter.emit("failed", {
      argument: "12345",
      hostInfo: { host: "dummyHost" },
      rt: 1,
      lastOutput: "failed..."
    }, hookErr);

    try {
      await p;
      expect.fail("Expected to reject, but resolved");
    } catch (err) {
      expect(err.message).to.equal("fatal error occurred during job status check");
      expect(err.request.argument).to.equal("12345");
      expect(err.hookErr).to.equal(hookErr);
    }
  });
});
