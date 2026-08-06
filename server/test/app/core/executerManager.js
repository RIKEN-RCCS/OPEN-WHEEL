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
import { eventEmitters } from "../../../app/core/global.js";

import { _internal, removeExecuters, isExceededLimit, makeQueueOpt, makeEnv, makeStepOpt, makeBulkOpt, decideFinishState, needsRetry, promisifiedSpawn, getExecutersKey, getMaxNumJob, createExecuter, register, cancel, RemoteJobExecuter, RemoteTaskExecuter, RemoteJobWebAPIExecuter, LocalTaskExecuter, StepjobTaskExecuter } from "../../../app/core/executerManager.js";
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
    it("a stepjobTask head (previous.length===0) produces the same key as an ordinary task (issue #764 follow-up)", function () {
      const task = {
        projectRootDir: "/mock/project",
        remotehostID: "remoteHost",
        useJobScheduler: true,
        previous: []
      };
      const stepjobHead = { ...task, type: "stepjobTask" };
      expect(getExecutersKey(stepjobHead)).to.equal(getExecutersKey(task));
    });
    it("a stepjobTask child (previous.length>0) produces a different key than an otherwise-identical task (issue #764)", function () {
      const task = {
        projectRootDir: "/mock/project",
        remotehostID: "remoteHost",
        useJobScheduler: true,
        previous: []
      };
      const stepjobChild = { ...task, type: "stepjobTask", previous: ["headID"] };
      expect(getExecutersKey(stepjobChild)).to.not.equal(getExecutersKey(task));
    });
    it("two stepjobTask children differing only in parentName/stepnum collide into the same key (issue #764)", function () {
      const task0 = {
        projectRootDir: "/mock/project",
        remotehostID: "remoteHost",
        useJobScheduler: true,
        type: "stepjobTask",
        previous: ["headID"],
        parentName: "sj0",
        stepnum: 1
      };
      const task1 = {
        projectRootDir: "/mock/project",
        remotehostID: "remoteHost",
        useJobScheduler: true,
        type: "stepjobTask",
        previous: ["headID"],
        parentName: "sj1",
        stepnum: 1
      };
      expect(getExecutersKey(task0)).to.equal(getExecutersKey(task1));
    });
  });
  describe("getMaxNumJob", function () {
    //eslint-disable-next-line no-unused-vars
    let numLocalJobStub;
    beforeEach(()=>{
      numLocalJobStub = sinon.stub(_internal, "numLocalJob").value(5);
    });
    afterEach(()=>{
      sinon.restore();
    });
    it("should return numLocalJob if hostinfo is null", function () {
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
    it("should create a StepjobTaskExecuter for a stepjobTask child (previous.length>0) (issue #764)", function () {
      const task = { projectRootDir: "/test/project", remotehostID: "remoteHost", useJobScheduler: true, type: "stepjobTask", previous: ["headID"], host: "remoteHost" };
      const hostinfo = { host: "remoteHost", jobScheduler: "validScheduler" };
      const executer = createExecuter(task, hostinfo);
      expect(executer).to.be.an.instanceof(StepjobTaskExecuter);
      expect(executer).to.be.an.instanceof(RemoteJobExecuter);
    });
    it("should create a plain RemoteJobExecuter (not StepjobTaskExecuter) for a stepjobTask head (previous.length===0) (issue #764 follow-up)", function () {
      const task = { projectRootDir: "/test/project", remotehostID: "remoteHost", useJobScheduler: true, type: "stepjobTask", previous: [], host: "remoteHost" };
      const hostinfo = { host: "remoteHost", jobScheduler: "validScheduler" };
      const executer = createExecuter(task, hostinfo);
      expect(executer).to.be.an.instanceof(RemoteJobExecuter);
      expect(executer).to.not.be.an.instanceof(StepjobTaskExecuter);
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
  describe("StepjobTaskExecuter (issue #764)", function () {
    afterEach(()=>{
      sinon.restore();
    });
    it("should have unbounded maxConcurrent regardless of hostinfo.numJob", function () {
      sinon.stub(_internal, "jobScheduler").value({ Fugaku: {} });
      const hostinfo = { host: "fugakuHost", jobScheduler: "Fugaku", numJob: "1" };
      const executer = new StepjobTaskExecuter(hostinfo);
      expect(executer.batch.maxConcurrent).to.equal(Number.MAX_SAFE_INTEGER);
    });
    it("setMaxNumJob() should be a no-op, so register()'s reuse path can't clobber it back down", function () {
      sinon.stub(_internal, "jobScheduler").value({ Fugaku: {} });
      const hostinfo = { host: "fugakuHost", jobScheduler: "Fugaku", numJob: "1" };
      const executer = new StepjobTaskExecuter(hostinfo);
      executer.setMaxNumJob(1);
      expect(executer.batch.maxConcurrent).to.equal(Number.MAX_SAFE_INTEGER);
    });
  });
  describe("stepjobTask head/child concurrency & gating (issue #764 follow-up)", function () {
    this.timeout(5000);
    const testDir = path.resolve(testDirRoot, "stepjobConcurrency");

    beforeEach(async ()=>{
      await fs.ensureDir(testDir);
      eventEmitters.set(testDir, new EventEmitter());
      sinon.stub(_internal, "getSshHostinfo").returns({ host: "fugakuHost", jobScheduler: "Fugaku", numJob: "1" });
      sinon.stub(_internal, "jobScheduler").value({ Fugaku: {} });
    });
    afterEach(async ()=>{
      sinon.restore();
      _internal.executers.clear();
      _internal.stepjobHeadDeferreds.clear();
      eventEmitters.delete(testDir);
      await fs.remove(testDir);
    });

    it("dispatches a stepjobTask child without waiting for a sibling stepjobTask child sharing the same host to finish, even when hostinfo.numJob=1", async function () {
      let resolveFirst;
      const firstStarted = sinon.stub();
      const secondStarted = sinon.stub();
      //the head's job ID is already confirmed so both children pass the wait immediately -
      //this test is about the SBS queue's own concurrency, not the head-gating itself
      _internal.getStepjobHeadDeferred(`${testDir}-containerID`).resolve("headJobID");
      //NOTE: exec() is stubbed at the class level (not createExecuter/submit) so this test
      //exercises the real StepjobTaskExecuter/SBS queue - the actual layer issue #764's bug
      //lived in - rather than mocking that behavior away like the "register" tests above do
      sinon.stub(RemoteJobExecuter.prototype, "exec").callsFake(async (task)=>{
        if (task.name === "step1") {
          firstStarted();
          return new Promise((resolve)=>{
            resolveFirst = resolve;
          });
        }
        secondStarted();
        return 0;
      });

      const task0 = { projectRootDir: testDir, workingDir: testDir, remotehostID: "fugakuHost", useJobScheduler: true, type: "stepjobTask", previous: ["headID"], parent: "containerID", name: "step1", host: "fugakuHost", jobStatus: null };
      const task1 = { projectRootDir: testDir, workingDir: testDir, remotehostID: "fugakuHost", useJobScheduler: true, type: "stepjobTask", previous: ["headID"], parent: "containerID", name: "step2", host: "fugakuHost", jobStatus: null };

      const p0 = register(task0);
      //speed up SBS's dispatch interval for this test instead of waiting out the real
      //multi-second job-submission interval
      const executer = _internal.executers.get(getExecutersKey(task0));
      executer.batch.interval = 10;

      const p1 = register(task1);
      await p1;

      expect(firstStarted).to.have.been.calledOnce;
      expect(secondStarted).to.have.been.calledOnce;

      resolveFirst(0);
      await p0;
    });

    it("throttles two stepjobTask heads sharing a host by hostinfo.numJob, same as ordinary job-scheduler tasks", async function () {
      let resolveFirst;
      const firstStarted = sinon.stub();
      const secondStarted = sinon.stub();
      sinon.stub(RemoteJobExecuter.prototype, "exec").callsFake(async (task)=>{
        if (task.name === "head0") {
          firstStarted();
          return new Promise((resolve)=>{
            resolveFirst = resolve;
          });
        }
        secondStarted();
        return 0;
      });

      const task0 = { projectRootDir: testDir, workingDir: testDir, remotehostID: "fugakuHost", useJobScheduler: true, type: "stepjobTask", previous: [], parent: "containerA", name: "head0", host: "fugakuHost", jobStatus: null };
      const task1 = { projectRootDir: testDir, workingDir: testDir, remotehostID: "fugakuHost", useJobScheduler: true, type: "stepjobTask", previous: [], parent: "containerB", name: "head1", host: "fugakuHost", jobStatus: null };

      const p0 = register(task0);
      const executer = _internal.executers.get(getExecutersKey(task0));
      executer.batch.interval = 10;
      const p1 = register(task1);

      //give the (speeded-up) SBS queue a moment to attempt dispatching task1 - it must
      //NOT have started yet, since task0 still holds the only hostinfo.numJob=1 slot
      await new Promise((resolve)=>{
        setTimeout(resolve, 50);
      });
      expect(firstStarted).to.have.been.calledOnce;
      expect(secondStarted).to.not.have.been.called;

      resolveFirst(0);
      await p0;
      await p1;
      expect(secondStarted).to.have.been.calledOnce;
    });

    it("does not submit a child until its head task's job ID is confirmed, then proceeds (issue #764 follow-up, upgraded after real-Fugaku testing showed the weaker \"running\" signal still races)", async function () {
      const started = sinon.stub();
      sinon.stub(RemoteJobExecuter.prototype, "exec").callsFake(async ()=>{
        started();
        return 0;
      });

      const task = { projectRootDir: testDir, workingDir: testDir, remotehostID: "fugakuHost", useJobScheduler: true, type: "stepjobTask", previous: ["headID"], parent: "containerID", name: "step1", host: "fugakuHost", jobStatus: null };

      //pre-create the executer with a fast dispatch interval and register it under this
      //task's key *before* calling register() - SBS's qsub() reads the interval at call
      //time, and register()'s own qsub() call happens synchronously, so overriding the
      //interval only after calling register() (as the multi-task tests above do, riding
      //on a second task's fresh qsub()) is too late for a single-task test like this one
      const executer = new StepjobTaskExecuter({ host: "fugakuHost", jobScheduler: "Fugaku", numJob: "1" });
      executer.batch.interval = 10;
      _internal.executers.set(getExecutersKey(task), executer);

      const p = register(task);

      await new Promise((resolve)=>{
        setTimeout(resolve, 50);
      });
      expect(started).to.not.have.been.called;

      _internal.getStepjobHeadDeferred(`${testDir}-containerID`).resolve("headJobID");

      await p;
      expect(started).to.have.been.calledOnce;
    });

    it("does not hang if the head's job ID is already confirmed before the child starts waiting (race safety)", async function () {
      sinon.stub(RemoteJobExecuter.prototype, "exec").resolves(0);
      _internal.getStepjobHeadDeferred(`${testDir}-containerID`).resolve("headJobID");

      const task = { projectRootDir: testDir, workingDir: testDir, remotehostID: "fugakuHost", useJobScheduler: true, type: "stepjobTask", previous: ["headID"], parent: "containerID", name: "step1", host: "fugakuHost", jobStatus: null };

      const executer = new StepjobTaskExecuter({ host: "fugakuHost", jobScheduler: "Fugaku", numJob: "1" });
      executer.batch.interval = 10;
      _internal.executers.set(getExecutersKey(task), executer);

      const p = register(task);

      await expect(p).to.eventually.be.fulfilled;
    });

    it("keys the head-wait deferred per stepjob container instance, so resolving one chain's head does not unblock another chain's child", async function () {
      const startedA = sinon.stub();
      const startedB = sinon.stub();
      sinon.stub(RemoteJobExecuter.prototype, "exec").callsFake(async (task)=>{
        if (task.parent === "containerA") {
          startedA();
        } else {
          startedB();
        }
        return 0;
      });
      _internal.getStepjobHeadDeferred(`${testDir}-containerB`).resolve("headJobIDB");

      const taskA = { projectRootDir: testDir, workingDir: testDir, remotehostID: "fugakuHost", useJobScheduler: true, type: "stepjobTask", previous: ["headA"], parent: "containerA", name: "a-step1", host: "fugakuHost", jobStatus: null };
      const taskB = { projectRootDir: testDir, workingDir: testDir, remotehostID: "fugakuHost", useJobScheduler: true, type: "stepjobTask", previous: ["headB"], parent: "containerB", name: "b-step1", host: "fugakuHost", jobStatus: null };

      //taskA and taskB share the same executer key (same host, both stepjobTask children) -
      //registering one fast executer under that shared key covers both
      const executer = new StepjobTaskExecuter({ host: "fugakuHost", jobScheduler: "Fugaku", numJob: "1" });
      executer.batch.interval = 10;
      _internal.executers.set(getExecutersKey(taskA), executer);

      const pB = register(taskB);
      await pB;
      expect(startedB).to.have.been.calledOnce;

      const pA = register(taskA);
      await new Promise((resolve)=>{
        setTimeout(resolve, 50);
      });
      expect(startedA).to.not.have.been.called;

      _internal.getStepjobHeadDeferred(`${testDir}-containerA`).resolve("headJobIDA");
      await pA;
      expect(startedA).to.have.been.calledOnce;
    });

    it("releases a child parked waiting for its head's job ID when it is canceled, instead of hanging forever", async function () {
      //head's job ID is never confirmed in this test - the child must be released via cancel()
      sinon.stub(RemoteJobExecuter.prototype, "exec").resolves(0);
      sinon.stub(_internal.remoteHost, "getID").returns("fugakuHost");

      const task = { projectRootDir: testDir, workingDir: testDir, remotehostID: "fugakuHost", useJobScheduler: true, type: "stepjobTask", previous: ["headID"], parent: "containerID", name: "step1", host: "fugakuHost", jobStatus: null };

      const executer = new StepjobTaskExecuter({ host: "fugakuHost", jobScheduler: "Fugaku", numJob: "1" });
      executer.batch.interval = 10;
      _internal.executers.set(getExecutersKey(task), executer);

      const p = register(task);

      //let SBS actually dispatch into exec() so it reaches the wait point and registers
      //its cancel signal, before we try to cancel it
      await new Promise((resolve)=>{
        setTimeout(resolve, 50);
      });

      cancel(task);

      await expect(p).to.be.rejected;
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
