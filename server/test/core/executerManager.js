/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";

const chai = require("chai");
chai.use(require("sinon-chai"));
chai.use(require("chai-as-promised"));
const path = require("path");
const sinon = require("sinon");
const fs = require("fs-extra");
const { expect } = require("chai");
const rewire = require("rewire");
const { EventEmitter } = require("events");

const executerManager = rewire("../../app/core/executerManager");
const executers = executerManager.__get__("executers");
const removeExecuters = executerManager.__get__("removeExecuters");
const isExceededLimit = executerManager.__get__("isExceededLimit");
const makeQueueOpt = executerManager.__get__("makeQueueOpt");
const makeEnv = executerManager.__get__("makeEnv");
const makeStepOpt = executerManager.__get__("makeStepOpt");
const makeBulkOpt = executerManager.__get__("makeBulkOpt");
const decideFinishState = executerManager.__get__("decideFinishState");
const needsRetry = executerManager.__get__("needsRetry");
const promisifiedSpawn = executerManager.__get__("promisifiedSpawn");
const getExecutersKey = executerManager.__get__("getExecutersKey");
const getMaxNumJob = executerManager.__get__("getMaxNumJob");
const createExecuter = executerManager.__get__("createExecuter");
const register = executerManager.__get__("register");
const testDirRoot = "WHEEL_TEST_TMP";
let evalConditionMock;
let loggerMock;

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
      executers.set(`${mockProjectRootDir}-localhost-false`, executerMock);
      executers.set(`${mockProjectRootDir}-remoteHost-true`, executerMock);
      executers.set(`${otherProjectRootDir}-localhost-false`, executerMock);

      expect(executers.size).to.be.greaterThan(0); //事前確認
    });
    after(async ()=>{
      if (!process.env.WHEEL_KEEP_FILES_AFTER_LAST_TEST) {
        await fs.remove(testDirRoot);
      }
    });

    it("should remove all executers associated with a given projectRootDir", async function () {
      removeExecuters(mockProjectRootDir);
      expect(executers.has(`${mockProjectRootDir}-localhost-false`)).to.be.false;
      expect(executers.has(`${mockProjectRootDir}-remoteHost-true`)).to.be.false;
      expect(executers.size).to.equal(1);
    });

    it("should not remove executers from other projects", function () {
      removeExecuters(mockProjectRootDir);
      expect(executers.has(`${otherProjectRootDir}-localhost-false`)).to.be.true;
    });

    it("should not throw an error if no matching executers exist", function () {
      executers.clear();

      expect(()=>removeExecuters(mockProjectRootDir)).to.not.throw();
      expect(executers.size).to.equal(0);
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
      expect(result).to.satisfy((str)=>str === "env KEY1=value1 KEY2=value2" || str === "env KEY2=value2 KEY1=value1"
      );
    });
    it("should handle environment variables with special characters", function () {
      const task = { env: { SPECIAL: "value with spaces" } };
      expect(makeEnv(task)).to.equal("env SPECIAL=value with spaces");
    });
  });
  describe("makeQueueOpt", function () {
    const JS = { queueOpt: "-q " };
    it("should return an empty string if queues is not a string", function () {
      const task = { queue: "default" };
      expect(makeQueueOpt(task, JS, undefined)).to.equal("");
      expect(makeQueueOpt(task, JS, null)).to.equal("");
      expect(makeQueueOpt(task, JS, 123)).to.equal("");
    });
    it("should return an empty string if queues is an empty string", function () {
      const task = { queue: "default" };
      expect(makeQueueOpt(task, JS, "")).to.equal("");
    });
    it("should return the correct queue option if task.queue matches a queue in the list", function () {
      const task = { queue: "high" };
      expect(makeQueueOpt(task, JS, "low,high,medium")).to.equal(" -q high");
    });
    it("should use the first queue in the list if task.queue does not match any queue", function () {
      const task = { queue: "nonexistent" };
      expect(makeQueueOpt(task, JS, "low,high,medium")).to.equal(" -q low");
    });
    it("should trim spaces in the queue list", function () {
      const task = { queue: "high" };
      expect(makeQueueOpt(task, JS, "  low ,  high , medium ")).to.equal(" -q high");
    });
    it("should return an empty string if the selected queue is an empty string", function () {
      const task = { queue: "" };
      expect(makeQueueOpt(task, JS, " , , ,")).to.equal("");
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
    beforeEach(()=>{
      //`evalCondition` モックを設定
      evalConditionMock = async ()=>true;
      executerManager.__set__("evalCondition", evalConditionMock);
      //`getLogger` モックを設定
      loggerMock = {
        info: ()=>{}
      };
      executerManager.__set__("getLogger", ()=>loggerMock);
    });
    it("should return true if evalCondition returns true", async function () {
      evalConditionMock = async ()=>true; //evalCondition が true を返す
      executerManager.__set__("evalCondition", evalConditionMock);
      const result = await decideFinishState(mockTask);
      expect(result).to.be.true;
    });
    it("should return false if evalCondition returns false", async function () {
      evalConditionMock = async ()=>false; //evalCondition が false を返す
      executerManager.__set__("evalCondition", evalConditionMock);
      const result = await decideFinishState(mockTask);
      expect(result).to.be.false;
    });
    it("should return false if evalCondition throws an error", async function () {
      let logCalled = false;
      //evalCondition がエラーをスロー
      evalConditionMock = async ()=>{
        throw new Error("Mock error");
      };
      executerManager.__set__("evalCondition", evalConditionMock);
      //loggerMock の info メソッドを監視
      loggerMock.info = (message)=>{
        logCalled = true;
        expect(message).to.include(`manualFinishCondition of ${mockTask.name}(${mockTask.ID}) is set but exception occurred while evaluting it.`);
      };
      executerManager.__set__("getLogger", ()=>loggerMock);
      const result = await decideFinishState(mockTask);
      expect(result).to.be.false;
      expect(logCalled).to.be.true;
    });
    it("should handle missing task properties gracefully", async function () {
      const incompleteTask = { projectRootDir: "/mock/project" }; //必須プロパティ不足
      evalConditionMock = async ()=>{
        throw new Error("Mock error");
      };
      executerManager.__set__("evalCondition", evalConditionMock);
      let logCalled = false;
      loggerMock.info = ()=>{
        logCalled = true;
      };
      executerManager.__set__("getLogger", ()=>loggerMock);
      const result = await decideFinishState(incompleteTask);
      expect(result).to.be.false;
      expect(logCalled).to.be.true;
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
    beforeEach(()=>{
      //`evalCondition` と `getLogger` のモックを初期化
      evalConditionMock = async ()=>false;
      executerManager.__set__("evalCondition", evalConditionMock);
      loggerMock = {
        info: ()=>{}
      };
      executerManager.__set__("getLogger", ()=>loggerMock);
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
      evalConditionMock = async ()=>true;
      executerManager.__set__("evalCondition", evalConditionMock);
      const taskWithCondition = { ...mockTask, retryCondition: "mock condition" };
      const result = await needsRetry(taskWithCondition);
      expect(result).to.be.true;
    });
    it("should return false if retryCondition is defined and evalCondition returns false", async function () {
      evalConditionMock = async ()=>false;
      executerManager.__set__("evalCondition", evalConditionMock);
      const taskWithCondition = { ...mockTask, retryCondition: "mock condition" };
      const result = await needsRetry(taskWithCondition);
      expect(result).to.be.false;
    });
    it("should return false and log an error if evalCondition throws an error", async function () {
      let logCalled = false;
      evalConditionMock = async ()=>{
        throw new Error("Mock error");
      };
      executerManager.__set__("evalCondition", evalConditionMock);
      loggerMock.info = (message)=>{
        logCalled = true;
        expect(message).to.include(`retryCondition of ${mockTask.name}(${mockTask.ID}) is set but exception occurred while evaluting it. so give up retring`);
      };
      executerManager.__set__("getLogger", ()=>loggerMock);
      const taskWithCondition = { ...mockTask, retryCondition: "mock condition" };
      const result = await needsRetry(taskWithCondition);
      expect(result).to.be.false;
      expect(logCalled).to.be.true;
    });
    it("should log a message if evalCondition returns true and task is retried", async function () {
      let logCalled = false;
      evalConditionMock = async ()=>true;
      executerManager.__set__("evalCondition", evalConditionMock);
      loggerMock.info = (message)=>{
        logCalled = true;
        expect(message).to.include(`${mockTask.name}(${mockTask.ID}) failed but retring`);
      };
      executerManager.__set__("getLogger", ()=>loggerMock);
      const taskWithCondition = { ...mockTask, retryCondition: "mock condition" };
      const result = await needsRetry(taskWithCondition);
      expect(result).to.be.true;
      expect(logCalled).to.be.true;
    });
  });
  describe("promisifiedSpawn", function () {
    let spawnMock;
    let loggerMock;
    beforeEach(()=>{
      spawnMock = new EventEmitter();
      spawnMock.stdout = new EventEmitter();
      spawnMock.stderr = new EventEmitter();

      executerManager.__set__("childProcess", {
        spawn: ()=>spawnMock
      });
      loggerMock = {
        stdout: ()=>{},
        stderr: ()=>{},
        debug: ()=>{}
      };
      executerManager.__set__("getLogger", ()=>loggerMock);
    });
    it("should resolve with the exit code when the script finishes successfully", async function () {
      const task = { projectRootDir: "/mock/project", name: "mockTask" };
      setTimeout(()=>{
        spawnMock.emit("exit", 0);
      }, 100);
      const result = await promisifiedSpawn(task, "mockScript.sh", {});
      expect(result).to.equal(0);
    });
    it("should log stdout data", function (done) {
      loggerMock.stdout = (data)=>{
        expect(data).to.equal("mock stdout data\n");
        done();
      };
      executerManager.__set__("getLogger", ()=>loggerMock);
      promisifiedSpawn({ projectRootDir: "/mock/project" }, "mockScript.sh", {});
      spawnMock.stdout.emit("data", "mock stdout data\n");
    });
    it("should log stderr data", function (done) {
      loggerMock.stderr = (data)=>{
        expect(data).to.equal("mock stderr data\n");
        done();
      };
      executerManager.__set__("getLogger", ()=>loggerMock);
      promisifiedSpawn({ projectRootDir: "/mock/project" }, "mockScript.sh", {});
      spawnMock.stderr.emit("data", "mock stderr data\n");
    });
    it("should reject the promise if an error occurs", async function () {
      const promisifiedSpawn = executerManager.__get__("promisifiedSpawn");
      setTimeout(()=>{
        spawnMock.emit("error", new Error("Mock error"));
      }, 100);

      try {
        await promisifiedSpawn({ projectRootDir: "/mock/project" }, "mockScript.sh", {});
        throw new Error("Expected promise to be rejected");
      } catch (err) {
        expect(err.message).to.equal("Mock error");
      }
    });
    it("should reject the promise if the process emits an error event", async function () {
      const promisifiedSpawn = executerManager.__get__("promisifiedSpawn");
      setTimeout(()=>{
        spawnMock.emit("error", new Error("Mock error"));
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
    let originalNumJobOnLocal;
    beforeEach(()=>{
      originalNumJobOnLocal = executerManager.__get__("numJobOnLocal");
      executerManager.__set__("numJobOnLocal", 5);
    });
    afterEach(()=>{
      executerManager.__set__("numJobOnLocal", originalNumJobOnLocal);
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
    let RemoteJobExecuter, RemoteTaskExecuter, RemoteJobWebAPIExecuter, LocalTaskExecuter;
    let mockLogger;
    let jobSchedulerMock;
    beforeEach(()=>{
      mockLogger = {
        debug: sinon.stub(),
        error: sinon.stub()
      };
      executerManager.__set__("getLogger", ()=>mockLogger);
      jobSchedulerMock = {
        validScheduler: {
          submit: "mockSubmitCommand",
          queueOpt: "--queue=",
          reJobID: "mockJobIDPattern"
        }
      };
      executerManager.__set__("jobScheduler", jobSchedulerMock);
      RemoteJobExecuter = executerManager.__get__("RemoteJobExecuter");
      RemoteTaskExecuter = executerManager.__get__("RemoteTaskExecuter");
      RemoteJobWebAPIExecuter = executerManager.__get__("RemoteJobWebAPIExecuter");
      LocalTaskExecuter = executerManager.__get__("LocalTaskExecuter");
    });
    after(()=>{
      jobSchedulerMock = {
      };
      executerManager.__set__("jobScheduler", jobSchedulerMock);
    });
    it("should create a LocalTaskExecuter for a local task", function () {
      const task = { projectRootDir: "/test/project", remotehostID: "localhost", useJobScheduler: false };
      const hostinfo = null;
      const executer = createExecuter(task, hostinfo);
      expect(executer).to.be.an.instanceof(LocalTaskExecuter);
      expect(mockLogger.debug).to.have.been.calledWith("create new executer for localhost");
    });
    it("should create a RemoteTaskExecuter for a remote task without job scheduler", function () {
      const task = { projectRootDir: "/test/project", remotehostID: "remoteHost", useJobScheduler: false, host: "remoteHost" };
      const hostinfo = { host: "remoteHost", jobScheduler: null };
      const executer = createExecuter(task, hostinfo);
      expect(executer).to.be.an.instanceof(RemoteTaskExecuter);
      expect(mockLogger.debug).to.have.been.calledWith("create new executer for remoteHost without job scheduler");
    });
    it("should create a RemoteJobExecuter for a remote task using a job scheduler", function () {
      const task = { projectRootDir: "/test/project", remotehostID: "remoteHost", useJobScheduler: true, host: "remoteHost" };
      const hostinfo = { host: "remoteHost", jobScheduler: "validScheduler" };
      const executer = createExecuter(task, hostinfo);
      expect(executer).to.be.an.instanceof(RemoteJobExecuter);
      expect(mockLogger.debug).to.have.been.calledWith("create new executer for remoteHost with job scheduler");
    });
    it("should create a RemoteJobWebAPIExecuter for a remote task using web API", function () {
      const task = { projectRootDir: "/test/project", remotehostID: "remoteHost", useJobScheduler: true, host: "remoteHost" };
      const hostinfo = { host: "remoteHost", jobScheduler: "validScheduler", useWebAPI: true };
      const executer = createExecuter(task, hostinfo);
      expect(executer).to.be.an.instanceof(RemoteJobWebAPIExecuter);
      expect(mockLogger.debug).to.have.been.calledWith("create new executer for remoteHost with web API");
    });
    it("should throw an error if an invalid job scheduler is specified", function () {
      const task = { projectRootDir: "/test/project", remotehostID: "remoteHost", useJobScheduler: true };
      const hostinfo = { host: "remoteHost", jobScheduler: "invalidScheduler" };
      expect(()=>createExecuter(task, hostinfo)).to.throw("illegal job Scheduler specifies");
      expect(mockLogger.error).to.have.been.calledOnce;
    });
  });
  describe("register", function () {
    let mockExecuter, mockTask, mockHostInfo, jobSchedulerMock, mockExecuters, mockLogger;
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
      mockLogger = {
        debug: sinon.stub(),
        error: sinon.stub()
      };
      jobSchedulerMock = {
        validScheduler: {
          submit: "mockSubmitCommand",
          queueOpt: "--queue=",
          reJobID: "mockJobIDPattern"
        }
      };
      mockExecuters = new Map();
      executerManager.__set__("executers", mockExecuters);
      executerManager.__set__("jobScheduler", jobSchedulerMock);
      executerManager.__set__("getSshHostinfo", sinon.stub().returns(mockHostInfo));
      executerManager.__set__("getLogger", sinon.stub().returns(mockLogger));
      executerManager.__set__("createExecuter", sinon.stub().returns(mockExecuter));
    });
    it("should create a new executer and submit the task", async function () {
      const result = await register(mockTask);
      expect(result).to.equal("submitted");
      expect(mockExecuters.size).to.equal(1);
      expect(mockExecuters.get(`${mockTask.projectRootDir}-${mockTask.remotehostID}-${mockTask.useJobScheduler}`)).to.equal(mockExecuter);
      expect(mockExecuter.submit).to.have.been.calledOnceWith(mockTask);
    });
    it("should reuse existing executer and submit the task", async function () {
      mockExecuters.set(`${mockTask.projectRootDir}-${mockTask.remotehostID}-${mockTask.useJobScheduler}`, mockExecuter);
      const result = await register(mockTask);
      expect(result).to.equal("submitted");
      expect(mockExecuter.submit).to.have.been.calledOnceWith(mockTask);
      expect(mockExecuter.setMaxNumJob).to.have.been.calledOnce;
      expect(mockExecuter.setJS).to.have.been.calledOnce;
      expect(mockExecuter.setQueues).to.have.been.calledOnceWith(mockHostInfo.queue);
      expect(mockExecuter.setGrpName).to.have.been.calledOnceWith(mockHostInfo.grpName);
    });
    it("should throw an error if an invalid job scheduler is specified", async function () {
      mockExecuters.set(`${mockTask.projectRootDir}-${mockTask.remotehostID}-${mockTask.useJobScheduler}`, mockExecuter);
      executerManager.__set__("getSshHostinfo", ()=>({ jobScheduler: "invalidScheduler" }));
      await expect(register(mockTask)).to.be.rejectedWith(Error, "illegal job scheduler");
    });
  });
});
