/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";

const path = require("path");
const sinon = require("sinon");
const fs = require("fs-extra");
const { expect } = require("chai");
const rewire = require("rewire");

const executerManager = rewire("../../app/core/executerManager");
const executers = executerManager.__get__("executers");
const removeExecuters = executerManager.__get__("removeExecuters");
const isExceededLimit = executerManager.__get__("isExceededLimit");
const makeQueueOpt = executerManager.__get__("makeQueueOpt");
const makeEnv = executerManager.__get__("makeEnv");
const makeStepOpt = executerManager.__get__("makeStepOpt");
const makeBulkOpt = executerManager.__get__("makeBulkOpt");
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
});
