/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */

import * as chai from "chai";
import sinonChai from "sinon-chai";
chai.use(sinonChai);
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
import path from "path";
import sinon from "sinon";
import fs from "fs-extra";
const { expect } = chai;
import { EventEmitter } from "events";

import { _internal, removeExecuters, isExceededLimit, makeQueueOpt, makeEnv, makeStepOpt, makeBulkOpt, decideFinishState, needsRetry, promisifiedSpawn, getExecutersKey, getMaxNumJob, createExecuter, register, cancel, RemoteJobExecuter, RemoteTaskExecuter, RemoteJobWebAPIExecuter, LocalTaskExecuter } from "../../../app/core/executerManager.js";
import { loggerWrapper } from "../../../app/logSettings.js";
const testDirRoot = "WHEEL_TEST_TMP";

describe("UT for executerManager class", function () {
  describe("removeExecuters", async ()=>{
    const mockProjectRootDir = path.resolve("WHEEL_TEST_TMP", "testProject.wheel");
    const otherProjectRootDir = path.resolve("WHEEL_TEST_TMP", "otherProject.wheel");
    let executerMock;

    beforeEach(function () {
      executerMock = {
        stop: sinon.stub(),
        start: sinon.stub()
      };
      _internal.executers.set(`${mockProjectRootDir}-localhost-false`, executerMock);
      _internal.executers.set(`${mockProjectRootDir}-remoteHost-true`, executerMock);
      _internal.executers.set(`${otherProjectRootDir}-localhost-false`, executerMock);

      expect(_internal.executers.size).to.be.greaterThan(0); //事前確認
    });
    afterEach(()=>{
      _internal.executers.clear();
      sinon.restore();
    });
    after(async ()=>{
      if (!process.env.WHEEL_KEEP_FILES_AFTER_LAST_TEST) {
        await fs.remove(testDirRoot);
      }
    });

    it("should remove all executers associated with a given projectRootDir", async function () {
      removeExecuters(mockProjectRootDir);
      expect(_internal.executers.has(`${mockProjectRootDir}-localhost-false`)).to.be.false;
      expect(_internal.executers.has(`${mockProjectRootDir}-remoteHost-true`)).to.be.false;
      expect(_internal.executers.size).to.equal(1);
    });

    it("should not remove executers from other projects", function () {
      removeExecuters(mockProjectRootDir);
      expect(_internal.executers.has(`${otherProjectRootDir}-localhost-false`)).to.be.true;
    });

    it("should not throw an error if no matching executers exist", function () {
      _internal.executers.clear();

      //eslint-disable-next-line @stylistic/max-statements-per-line
      expect(()=>{ return removeExecuters(mockProjectRootDir); }).to.not.throw();
      expect(_internal.executers.size).to.equal(0);
    });
  });
  describe("isExceededLimit", function () {
    it("should return true if rt is in exceededRtList", function () {
      const JS = { exceededRtList: [1, 2, 3] };
      const rt = 2;
      const outputText = "No errors";

      expect(isExceededLimit(JS, rt, outputText)).to.be.true;
    });

    it("should return false if rt is not in exceededRtList", function () {
      const JS = { exceededRtList: [1, 2, 3] };
      const rt = 4;
      const outputText = "No errors";

      expect(isExceededLimit(JS, rt, outputText)).to.be.false;
    });

    it("should return true if reExceededLimitError matches outputText", function () {
      const JS = { reExceededLimitError: "Limit exceeded" };
      const rt = 0;
      const outputText = "Error: Limit exceeded in queue";

      expect(isExceededLimit(JS, rt, outputText)).to.be.true;
    });

    it("should return false if reExceededLimitError does not match outputText", function () {
      const JS = { reExceededLimitError: "Limit exceeded" };
      const rt = 0;
      const outputText = "No errors";

      expect(isExceededLimit(JS, rt, outputText)).to.be.false;
    });

    it("should return false if neither exceededRtList nor reExceededLimitError matches", function () {
      const JS = { exceededRtList: [1, 2, 3], reExceededLimitError: "Limit exceeded" };
      const rt = 4;
      const outputText = "No errors";

      expect(isExceededLimit(JS, rt, outputText)).to.be.false;
    });
  });
  describe("makeEnv", function () {
    it("should return an empty string if task.env is undefined", function () {
      const task = {};
      expect(makeEnv(task)).to.equal("");
    });
    it("should return an empty string if task.env is an empty object", function () {
      const task = { env: {} };
      expect(makeEnv(task)).to.equal("");
    });
    it("should return a string with a single environment variable", function () {
      const task = { env: { KEY: "value" } };
      expect(makeEnv(task)).to.equal("env KEY=value");
    });
    it("should return a string with multiple environment variables", function () {
      const task = { env: { KEY1: "value1", KEY2: "value2" } };
      const result = makeEnv(task);
      //`result` 内の変数順序が一定でない可能性があるため、複数のパターンを考慮
      //eslint-disable-next-line @stylistic/max-statements-per-line
      expect(result).to.satisfy((str)=>{ return str === "env KEY1=value1 KEY2=value2" || str === "env KEY2=value2 KEY1=value1"; }
      );
    });
    it("should handle environment variables with special characters", function () {
      const task = { env: { SPECIAL: "value with spaces" } };
      expect(makeEnv(task)).to.equal("env SPECIAL=value with spaces");
    });
  });
  describe("makeQueueOpt", function () {
    const JS = { queueOpt: "-q " };
    it("should return an empty string if queues is not an array", function () {
      const task = { queue: "default" };
      expect(makeQueueOpt(task, JS, undefined)).to.equal("");
      expect(makeQueueOpt(task, JS, null)).to.equal("");
      expect(makeQueueOpt(task, JS, "low,high,medium")).to.equal("");
    });
    it("should return an empty string if queues is an empty array", function () {
      const task = { queue: "default" };
      expect(makeQueueOpt(task, JS, [])).to.equal("");
    });
    it("should return the correct queue option if task.queue matches a queue in the list", function () {
      const task = { queue: "high" };
      expect(makeQueueOpt(task, JS, ["low", "high", "medium"])).to.equal(" -q high");
    });
    it("should use the first queue in the list if task.queue does not match any queue", function () {
      const task = { queue: "nonexistent" };
      expect(makeQueueOpt(task, JS, ["low", "high", "medium"])).to.equal(" -q low");
    });
    it("should return an empty string if the selected queue is an empty string", function () {
      const task = { queue: "" };
      expect(makeQueueOpt(task, JS, ["", "", ""])).to.equal("");
    });
  });
  describe("makeStepOpt", function () {
    it("should return an empty string if task.type is not 'stepjobTask'", function () {
      const task = { type: "regularTask" };
      expect(makeStepOpt(task)).to.equal("");
    });
    it("should return stepjob option without dependency if useDependency is false", function () {
      const task = {
        type: "stepjobTask",
        parentName: "testJob",
        stepnum: 1,
        useDependency: false
      };
      expect(makeStepOpt(task)).to.equal("--step --sparam \"jnam=testJob,sn=1\"");
    });
    it("should return stepjob option with dependency if useDependency is true", function () {
      const task = {
        type: "stepjobTask",
        parentName: "testJob",
        stepnum: 1,
        dependencyForm: "afterok",
        useDependency: true
      };
      expect(makeStepOpt(task)).to.equal("--step --sparam \"jnam=testJob,sn=1,afterok\"");
    });
    it("should handle missing or empty parentName and stepnum gracefully", function () {
      const task = {
        type: "stepjobTask",
        parentName: "",
        stepnum: "",
        useDependency: false
      };
      expect(makeStepOpt(task)).to.equal("--step --sparam \"jnam=,sn=\"");
    });
    it("should exclude dependency form if it is not provided", function () {
      const task = {
        type: "stepjobTask",
        parentName: "testJob",
        stepnum: 1,
        useDependency: true,
        dependencyForm: ""
      };
      expect(makeStepOpt(task)).to.equal("--step --sparam \"jnam=testJob,sn=1,\"");
    });
  });
  describe("makeBulkOpt", function () {
    it("should return an empty string if task.type is not 'bulkjobTask'", function () {
      const task = { type: "regularTask" };
      expect(makeBulkOpt(task)).to.equal("");
    });
    it("should return the correct bulkjob option if task.type is 'bulkjobTask'", function () {
      const task = {
        type: "bulkjobTask",
        startBulkNumber: 1,
        endBulkNumber: 10
      };
      expect(makeBulkOpt(task)).to.equal("--bulk --sparam \"1-10\"");
    });
    it("should return the range even if startBulkNumber and endBulkNumber are the same", function () {
      const task = {
        type: "bulkjobTask",
        startBulkNumber: 5,
        endBulkNumber: 5
      };
      expect(makeBulkOpt(task)).to.equal("--bulk --sparam \"5-5\"");
    });
    it("should handle missing startBulkNumber or endBulkNumber", function () {
      const taskWithMissingStart = {
        type: "bulkjobTask",
        endBulkNumber: 10
      };
      expect(makeBulkOpt(taskWithMissingStart)).to.equal("--bulk --sparam \"undefined-10\"");
      const taskWithMissingEnd = {
        type: "bulkjobTask",
        startBulkNumber: 1
      };
      expect(makeBulkOpt(taskWithMissingEnd)).to.equal("--bulk --sparam \"1-undefined\"");
    });
    it("should handle negative or special values", function () {
      const task = {
        type: "bulkjobTask",
        startBulkNumber: -1,
        endBulkNumber: 0
      };
      expect(makeBulkOpt(task)).to.equal("--bulk --sparam \"-1-0\"");
    });
  });
  describe("decideFinishState", function () {
    const mockTask = {
      projectRootDir: "/mock/project",
      condition: "mock condition",
      workingDir: "/mock/workingDir",
      currentIndex: 0,
      name: "mockTask",
      ID: "mockID"
    };
    let evalConditionStub;
    let loggerInfoStub;

    beforeEach(()=>{
      evalConditionStub = sinon.stub(_internal, "evalCondition");
      loggerInfoStub = sinon.stub(loggerWrapper, "logInfo");
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should return true if evalCondition returns true", async function () {
      evalConditionStub.resolves(true);
      const result = await decideFinishState(mockTask);
      expect(result).to.be.true;
    });
    it("should return false if evalCondition returns false", async function () {
      evalConditionStub.resolves(false);
      const result = await decideFinishState(mockTask);
      expect(result).to.be.false;
    });
    it("should return false if evalCondition throws an error", async function () {
      evalConditionStub.rejects(new Error("Mock error"));
      const result = await decideFinishState(mockTask);
      expect(result).to.be.false;
      expect(loggerInfoStub).to.have.been.calledWith(mockTask.projectRootDir, mockTask.workingDir, "manualFinishCondition is set but exception occurred while evaluting it.");
    });
    it("should handle missing task properties gracefully", async function () {
      const incompleteTask = { projectRootDir: "/mock/project" }; //必須プロパティ不足
      evalConditionStub.rejects(new Error("Mock error"));
      const result = await decideFinishState(incompleteTask);
      expect(result).to.be.false;
      expect(loggerInfoStub).to.have.been.called;
    });
    it("should pass WHEEL_TASK_RT and wheelTaskRT in env to evalCondition", async function () {
      evalConditionStub.resolves(true);
      const taskWithRt = { ...mockTask, rt: 42, env: { EXISTING: "value" } };
      await decideFinishState(taskWithRt);
      expect(evalConditionStub).to.have.been.calledWith(
        mockTask.projectRootDir,
        "mock condition",
        mockTask.workingDir,
        sinon.match({ WHEEL_TASK_RT: 42, wheelTaskRT: 42, EXISTING: "value" })
      );
    });
  });
  describe("needsRetry", function () {
    const mockTask = {
      projectRootDir: "/mock/project",
      workingDir: "/mock/workingDir",
      currentIndex: 0,
      name: "mockTask",
      ID: "mockID"
    };

    let evalConditionStub;
    let loggerInfoStub;

    beforeEach(()=>{
      evalConditionStub = sinon.stub(_internal, "evalCondition");
      loggerInfoStub = sinon.stub(loggerWrapper, "logInfo");
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should return false if neither retry nor retryCondition is defined", async function () {
      const result = await needsRetry(mockTask);
      expect(result).to.be.false;
    });
    it("should return true if retry is a positive integer", async function () {
      const taskWithRetry = { ...mockTask, retry: 2 };
      const result = await needsRetry(taskWithRetry);
      expect(result).to.be.true;
    });
    it("should return false if retry is not a positive integer", async function () {
      const taskWithInvalidRetry = { ...mockTask, retry: -1 };
      const result = await needsRetry(taskWithInvalidRetry);
      expect(result).to.be.false;
    });
    it("should return true if retryCondition is defined and evalCondition returns true", async function () {
      evalConditionStub.resolves(true);
      const taskWithCondition = { ...mockTask, retryCondition: "mock condition" };
      const result = await needsRetry(taskWithCondition);
      expect(result).to.be.true;
    });
    it("should return false if retryCondition is defined and evalCondition returns false", async function () {
      evalConditionStub.resolves(false);
      const taskWithCondition = { ...mockTask, retryCondition: "mock condition" };
      const result = await needsRetry(taskWithCondition);
      expect(result).to.be.false;
    });
    it("should return false and log an error if evalCondition throws an error", async function () {
      evalConditionStub.rejects(new Error("Mock error"));
      const taskWithCondition = { ...mockTask, retryCondition: "mock condition" };
      const result = await needsRetry(taskWithCondition);
      expect(result).to.be.false;
      expect(loggerInfoStub).to.have.been.calledWith(mockTask.projectRootDir, mockTask.workingDir, "retryCondition is set but exception occurred while evaluting it. so give up retring");
    });
    it("should log a message if evalCondition returns true and task is retried", async function () {
      evalConditionStub.resolves(true);
      const taskWithCondition = { ...mockTask, retryCondition: "mock condition" };
      const result = await needsRetry(taskWithCondition);
      expect(result).to.be.true;
      expect(loggerInfoStub).to.have.been.calledWith(mockTask.projectRootDir, mockTask.workingDir, "failed but retring");
    });
    it("should pass WHEEL_TASK_RT and wheelTaskRT in env to evalCondition", async function () {
      evalConditionStub.resolves(true);
      const taskWithCondition = { ...mockTask, retryCondition: "mock condition", rt: 42, env: { EXISTING: "value" } };
      await needsRetry(taskWithCondition);
      expect(evalConditionStub).to.have.been.calledWith(
        mockTask.projectRootDir,
        "mock condition",
        mockTask.workingDir,
        sinon.match({ WHEEL_TASK_RT: 42, wheelTaskRT: 42, EXISTING: "value" })
      );
    });
    it("should use checker return value as WHEEL_TASK_RT when checkerRt is provided", async function () {
      evalConditionStub.resolves(true);
      const taskWithCondition = { ...mockTask, retryCondition: "mock condition", rt: 42 };
      await needsRetry(taskWithCondition, 10);
      expect(evalConditionStub).to.have.been.calledWith(
        mockTask.projectRootDir,
        "mock condition",
        mockTask.workingDir,
        sinon.match({ WHEEL_TASK_RT: 10, wheelTaskRT: 10 })
      );
    });
    it("should use task.checkerRt as WHEEL_TASK_RT if checkerRt parameter is undefined", async function () {
      evalConditionStub.resolves(true);
      const taskWithCondition = { ...mockTask, retryCondition: "mock condition", rt: 42, checkerRt: 20 };
      await needsRetry(taskWithCondition);
      expect(evalConditionStub).to.have.been.calledWith(
        mockTask.projectRootDir,
        "mock condition",
        mockTask.workingDir,
        sinon.match({ WHEEL_TASK_RT: 20, wheelTaskRT: 20 })
      );
    });
  });

  describe("promisifiedSpawn", function () {
    let spawnStub;
    let loggerStdoutStub;
    let loggerStderrStub;

    beforeEach(()=>{
      spawnStub = new EventEmitter();
      spawnStub.stdout = new EventEmitter();
      spawnStub.stderr = new EventEmitter();
      sinon.stub(_internal.childProcess, "spawn").returns(spawnStub);

      loggerStdoutStub = sinon.stub(loggerWrapper, "logStdout");
      loggerStderrStub = sinon.stub(loggerWrapper, "logStderr");
      sinon.stub(loggerWrapper, "logDebug");
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should resolve with the exit code when the script finishes successfully", async function () {
      const task = { projectRootDir: "/mock/project", name: "mockTask", workingDir: "/mock/workingDir" };
      setTimeout(()=>{
        spawnStub.emit("exit", 0);
      }, 100);
      const result = await promisifiedSpawn(task, "mockScript.sh", {});
      expect(result).to.equal(0);
    });
    it("should log stdout data", function (done) {
      const task = { projectRootDir: "/mock/project", workingDir: "/mock/workingDir" };
      loggerStdoutStub.callsFake((proj, dir, msg)=>{
        expect(proj).to.equal(task.projectRootDir);
        expect(dir).to.equal(task.workingDir);
        expect(msg).to.equal("mock stdout data\n");
        done();
      });
      promisifiedSpawn(task, "mockScript.sh", {});
      spawnStub.stdout.emit("data", "mock stdout data\n");
    });
    it("should log stderr data", function (done) {
      const task = { projectRootDir: "/mock/project", workingDir: "/mock/workingDir" };
      loggerStderrStub.callsFake((proj, dir, msg)=>{
        expect(proj).to.equal(task.projectRootDir);
        expect(dir).to.equal(task.workingDir);
        expect(msg).to.equal("mock stderr data\n");
        done();
      });
      promisifiedSpawn(task, "mockScript.sh", {});
      spawnStub.stderr.emit("data", "mock stderr data\n");
    });
    it("should reject the promise if an error occurs", async function () {
      setTimeout(()=>{
        spawnStub.emit("error", new Error("Mock error"));
      }, 100);

      try {
        await promisifiedSpawn({ projectRootDir: "/mock/project" }, "mockScript.sh", {});
        throw new Error("Expected promise to be rejected");
      } catch (err) {
        expect(err.message).to.equal("Mock error");
      }
    });
  });
  describe("getExecutersKey", function () {
    it("full task properties", function () {
      const task = {
        projectRootDir: "/mock/project",
        remotehostID: "remoteHost",
        useJobScheduler: true
      };
      const result = getExecutersKey(task);
      expect(result).to.equal("/mock/project-remoteHost-true");
    });
    it("missing remotehostID", function () {
      const task = {
        projectRootDir: "/mock/project",
        useJobScheduler: false
      };
      const result = getExecutersKey(task);
      expect(result).to.equal("/mock/project-undefined-false");
    });
    it("missing projectRootDir", function () {
      const task = {
        remotehostID: "remoteHost",
        useJobScheduler: false
      };
      const result = getExecutersKey(task);
      expect(result).to.equal("undefined-remoteHost-false");
    });
  });
  describe("getMaxNumJob", function () {
    //eslint-disable-next-line no-unused-vars
    let numJobOnLocalStub;
    beforeEach(()=>{
      numJobOnLocalStub = sinon.stub(_internal, "numJobOnLocal").value(5);
    });
    afterEach(()=>{
      sinon.restore();
    });
    it("should return numJobOnLocal if hostinfo is null", function () {
      const result = getMaxNumJob(null);
      expect(result).to.equal(5);
    });
    it("should return the parsed numJob if it is a valid number", function () {
      const hostinfo = { numJob: "10" };
      const result = getMaxNumJob(hostinfo);
      expect(result).to.equal(10);
    });
    it("should return 1 if numJob is not a valid number", function () {
      const hostinfo = { numJob: "invalid" };
      const result = getMaxNumJob(hostinfo);
      expect(result).to.equal(1);
    });
    it("should return at least 1 even if numJob is 0 or negative", function () {
      const hostinfo = { numJob: "0" };
      const result = getMaxNumJob(hostinfo);
      expect(result).to.equal(1);
      const negativeHostinfo = { numJob: "-5" };
      const negativeResult = getMaxNumJob(negativeHostinfo);

      expect(negativeResult).to.equal(1);
    });
  });
  describe("createExecuter", function () {
    let loggerDebugStub;
    let loggerErrorStub;
    //eslint-disable-next-line no-unused-vars
    let jobSchedulerStub;
    beforeEach(()=>{
      loggerDebugStub = sinon.stub(loggerWrapper, "logDebug");
      loggerErrorStub = sinon.stub(loggerWrapper, "logError");
      jobSchedulerStub = sinon.stub(_internal, "jobScheduler").value({ validScheduler: { submit: "mockSubmitCommand", queueOpt: "--queue=", reJobID: "mockJobIDPattern" } });
    });
    afterEach(()=>{
      sinon.restore();
    });
    it("should create a LocalTaskExecuter for a local task", function () {
      const task = { projectRootDir: "/test/project", remotehostID: "localhost", useJobScheduler: false };
      const hostinfo = null;
      const executer = createExecuter(task, hostinfo);
      expect(executer).to.be.an.instanceof(LocalTaskExecuter);
      expect(loggerDebugStub).to.have.been.calledWith(task.projectRootDir, task.workingDir, "create new executer for localhost");
    });
    it("should create a RemoteTaskExecuter for a remote task without job scheduler", function () {
      const task = { projectRootDir: "/test/project", remotehostID: "remoteHost", useJobScheduler: false, host: "remoteHost" };
      const hostinfo = { host: "remoteHost", jobScheduler: null };
      const executer = createExecuter(task, hostinfo);
      expect(executer).to.be.an.instanceof(RemoteTaskExecuter);
      expect(loggerDebugStub).to.have.been.calledWith(task.projectRootDir, task.workingDir, `create new executer for ${task.host} without job scheduler`);
    });
    it("should create a RemoteJobExecuter for a remote task using a job scheduler", function () {
      const task = { projectRootDir: "/test/project", remotehostID: "remoteHost", useJobScheduler: true, host: "remoteHost" };
      const hostinfo = { host: "remoteHost", jobScheduler: "validScheduler" };
      const executer = createExecuter(task, hostinfo);
      expect(executer).to.be.an.instanceof(RemoteJobExecuter);
      expect(loggerDebugStub).to.have.been.calledWith(task.projectRootDir, task.workingDir, `create new executer for ${task.host} with job scheduler`);
    });
    it("should create a RemoteJobWebAPIExecuter for a remote task using web API", function () {
      const task = { projectRootDir: "/test/project", remotehostID: "remoteHost", useJobScheduler: true, host: "remoteHost" };
      const hostinfo = { host: "remoteHost", jobScheduler: "validScheduler", useWebAPI: true };
      const executer = createExecuter(task, hostinfo);
      expect(executer).to.be.an.instanceof(RemoteJobWebAPIExecuter);
      expect(loggerDebugStub).to.have.been.calledWith(task.projectRootDir, task.workingDir, `create new executer for ${task.host} with web API`);
    });
    it("should throw an error if an invalid job scheduler is specified", function () {
      const task = { projectRootDir: "/test/project", remotehostID: "remoteHost", useJobScheduler: true };

      const hostinfo = { host: "remoteHost", jobScheduler: "invalidScheduler" };
      //eslint-disable-next-line @stylistic/max-statements-per-line
      expect(()=>{ return createExecuter(task, hostinfo); }).to.throw("illegal job Scheduler specifies");
      expect(loggerErrorStub).to.have.been.calledWith(task.projectRootDir, task.workingDir, sinon.match.instanceOf(Error));
    });
  });
  describe("register", function () {
    //eslint-disable-next-line no-unused-vars
    let mockExecuter, mockTask, mockHostInfo, getSshHostinfoStub, createExecuterStub;
    beforeEach(()=>{
      mockExecuter = {
        submit: sinon.stub().resolves("submitted"),
        setMaxNumJob: sinon.stub(),
        setJS: sinon.stub(),
        setQueues: sinon.stub(),
        setGrpName: sinon.stub()
      };
      mockTask = {
        projectRootDir: "/test/project",
        remotehostID: "remoteHost",
        useJobScheduler: true,
        host: "remoteHost",
        queue: "default"
      };
      mockHostInfo = {
        host: "remoteHost",
        jobScheduler: "validScheduler",
        queue: "default",
        grpName: "testGroup"
      };
      getSshHostinfoStub = sinon.stub(_internal, "getSshHostinfo").returns(mockHostInfo);
      sinon.stub(loggerWrapper, "logDebug");
      sinon.stub(loggerWrapper, "logError");
      createExecuterStub = sinon.stub(_internal, "createExecuter").returns(mockExecuter);
      sinon.stub(_internal, "jobScheduler").value({ validScheduler: {} });
    });
    afterEach(()=>{
      sinon.restore();
      _internal.executers.clear();
    });
    it("should create a new executer and submit the task", async function () {
      const result = await register(mockTask);
      expect(result).to.equal("submitted");
      expect(_internal.executers.size).to.equal(1);
      expect(_internal.executers.get(`${mockTask.projectRootDir}-${mockTask.remotehostID}-${mockTask.useJobScheduler}`)).to.equal(mockExecuter);
      expect(mockExecuter.submit).to.have.been.calledOnceWith(mockTask);
    });
    it("should reuse existing executer and submit the task", async function () {
      _internal.executers.set(`${mockTask.projectRootDir}-${mockTask.remotehostID}-${mockTask.useJobScheduler}`, mockExecuter);
      const result = await register(mockTask);
      expect(result).to.equal("submitted");
      expect(mockExecuter.submit).to.have.been.calledOnceWith(mockTask);
      expect(mockExecuter.setMaxNumJob).to.have.been.calledOnce;
      expect(mockExecuter.setJS).to.have.been.calledOnce;
      expect(mockExecuter.setQueues).to.have.been.calledOnceWith(mockHostInfo.queue);
      expect(mockExecuter.setGrpName).to.have.been.calledOnceWith(mockHostInfo.grpName);
    });

    it("should throw an error if an invalid job scheduler is specified", async function () {
      _internal.executers.set(`${mockTask.projectRootDir}-${mockTask.remotehostID}-${mockTask.useJobScheduler}`, mockExecuter);
      getSshHostinfoStub.returns({ jobScheduler: "invalidScheduler" });
      await expect(register(mockTask)).to.be.rejectedWith(Error, "illegal job scheduler");
    });
  });
  describe("cancel", function () {
    let loggerWarnStub;
    //eslint-disable-next-line no-unused-vars
    let remoteHostGetIDStub;
    beforeEach(()=>{
      loggerWarnStub = sinon.stub(loggerWrapper, "logWarn");
      remoteHostGetIDStub = sinon.stub(_internal.remoteHost, "getID").returns("localhost");
    });
    afterEach(()=>{
      sinon.restore();
      _internal.executers.clear();
    });
    it("should return false if task does not have sbsID", function () {
      const task = {
        projectRootDir: "/test/project",
        remotehostID: "localhost",
        useJobScheduler: false
      };
      const result = cancel(task);
      expect(result).to.be.false;
    });
    it("should return false if executer is not found", function () {
      const task = {
        projectRootDir: "/test/project",
        remotehostID: "remoteHost",
        useJobScheduler: true,
        sbsID: "12345",
        host: "nonexistent"
      };
      const result = cancel(task);
      expect(result).to.be.false;
      expect(loggerWarnStub).to.have.been.calledWith(
        task.projectRootDir,
        task.workingDir,
        "executer for localhost with job scheduler is not found"
      );
    });
  });

  describe("runChecker", ()=>{
    it("should return null if checker is not specified", async function () {
      const { runChecker } = await import("../../../app/core/executerManager.js");
      const task = {
        checker: null,
        remotehostID: "localhost",
        projectRootDir: "/tmp/test",
        workingDir: "/tmp/test/task"
      };
      const result = await runChecker(task);
      expect(result).to.be.null;
    });

    it("should execute local checker and return exit code", async function () {
      const { runChecker } = await import("../../../app/core/executerManager.js");
      const testDir = path.resolve(testDirRoot, "checkerTest");
      await fs.ensureDir(testDir);
      const checkerScript = path.resolve(testDir, "checker.sh");
      await fs.writeFile(checkerScript, "#!/bin/bash\nexit 0");
      await fs.chmod(checkerScript, 0o755);

      const task = {
        checker: "checker.sh",
        remotehostID: "localhost",
        projectRootDir: testDir,
        workingDir: testDir,
        env: {}
      };

      const result = await runChecker(task);
      expect(result).to.equal(0);

      await fs.remove(testDir);
    });

    it("should execute local checker and return non-zero exit code on failure", async function () {
      const { runChecker } = await import("../../../app/core/executerManager.js");
      const testDir = path.resolve(testDirRoot, "checkerTestFail");
      await fs.ensureDir(testDir);
      const checkerScript = path.resolve(testDir, "checker.sh");
      await fs.writeFile(checkerScript, "#!/bin/bash\nexit 1");
      await fs.chmod(checkerScript, 0o755);

      const task = {
        checker: "checker.sh",
        remotehostID: "localhost",
        projectRootDir: testDir,
        workingDir: testDir,
        env: {}
      };

      const result = await runChecker(task);
      expect(result).to.equal(1);

      await fs.remove(testDir);
    });
  });
});
