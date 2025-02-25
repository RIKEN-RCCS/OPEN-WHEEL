/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";

//setup test framework
const sinon = require("sinon");
const chai = require("chai");
const rewire = require("rewire");
const expect = chai.expect;
chai.use(require("chai-fs"));

//testee
const rewTaskUtil = rewire("../../app/core/taskUtil.js");
const cancelDispatchedTasks = rewTaskUtil.__get__("cancelDispatchedTasks");
const killTask = rewTaskUtil.__get__("killTask");

describe("UT for taskUtil class", function () {
  describe("#cancelDispatchedTasks", ()=>{
    let cancelStub, killTaskStub;
    beforeEach(()=>{
      sinon.restore();
      cancelStub = sinon.stub();
      killTaskStub = sinon.stub();
      rewTaskUtil.__set__("cancel", cancelStub);
      rewTaskUtil.__set__("killTask", killTaskStub);
    });
    afterEach(()=>{
      sinon.restore();
    });
    it("should not cancel tasks that are finished or failed", async ()=>{
      const tasks = [
        { state: "finished" },
        { state: "failed" }
      ];
      await cancelDispatchedTasks(tasks);
      sinon.assert.notCalled(cancelStub);
      sinon.assert.notCalled(killTaskStub);
      expect(tasks[0].state).to.equal("finished");
      expect(tasks[1].state).to.equal("failed");
    });
    it("should cancel tasks that are not finished or failed", async ()=>{
      const tasks = [
        { state: "running", projectRootDir: "/test/project", remotehostID: "localhost" },
        { state: "queued", projectRootDir: "/test/project", remotehostID: "localhost" }
      ];
      cancelStub.returns(true);
      await cancelDispatchedTasks(tasks);
      sinon.assert.calledTwice(cancelStub);
      sinon.assert.notCalled(killTaskStub);
      expect(tasks[0].state).to.equal("not-started");
      expect(tasks[1].state).to.equal("not-started");
    });
    it("should call killTask if cancel returns false", async ()=>{
      const tasks = [
        { state: "running", projectRootDir: "/test/project", remotehostID: "localhost" },
        { state: "queued", projectRootDir: "/test/project", remotehostID: "localhost" }
      ];
      cancelStub.returns(false);
      killTaskStub.resolves();
      await cancelDispatchedTasks(tasks);
      sinon.assert.calledTwice(cancelStub);
      sinon.assert.calledTwice(killTaskStub);
      expect(tasks[0].state).to.equal("not-started");
      expect(tasks[1].state).to.equal("not-started");
    });
    it("should handle a mix of cancel returning true and false", async ()=>{
      const tasks = [
        { state: "running", projectRootDir: "/test/project", remotehostID: "localhost" },
        { state: "queued", projectRootDir: "/test/project", remotehostID: "localhost" }
      ];
      cancelStub.onFirstCall().returns(true);
      cancelStub.onSecondCall().returns(false);
      killTaskStub.resolves();
      await cancelDispatchedTasks(tasks);
      sinon.assert.calledTwice(cancelStub);
      sinon.assert.calledOnce(killTaskStub);
      expect(tasks[0].state).to.equal("not-started");
      expect(tasks[1].state).to.equal("not-started");
    });
  });
  describe("#killTask", ()=>{
    let cancelLocalJobStub, killLocalProcessStub, cancelRemoteJobStub;
    beforeEach(()=>{
      cancelLocalJobStub = sinon.stub();
      killLocalProcessStub = sinon.stub();
      cancelRemoteJobStub = sinon.stub();
      rewTaskUtil.__set__("cancelLocalJob", cancelLocalJobStub);
      rewTaskUtil.__set__("killLocalProcess", killLocalProcessStub);
      rewTaskUtil.__set__("cancelRemoteJob", cancelRemoteJobStub);
    });
    afterEach(()=>{
      sinon.restore();
    });
    it("should call cancelLocalJob for local job scheduler tasks", async ()=>{
      const task = { remotehostID: "localhost", useJobScheduler: true };
      await killTask(task);
      sinon.assert.calledOnce(cancelLocalJobStub);
      sinon.assert.notCalled(killLocalProcessStub);
      sinon.assert.notCalled(cancelRemoteJobStub);
    });
    it("should call killLocalProcess for local tasks without job scheduler", async ()=>{
      const task = { remotehostID: "localhost", useJobScheduler: false };
      await killTask(task);
      sinon.assert.notCalled(cancelLocalJobStub);
      sinon.assert.calledOnce(killLocalProcessStub);
      sinon.assert.notCalled(cancelRemoteJobStub);
    });
    it("should call cancelRemoteJob for remote tasks using job scheduler", async ()=>{
      const task = { remotehostID: "remote1", useJobScheduler: true };
      await killTask(task);
      sinon.assert.notCalled(cancelLocalJobStub);
      sinon.assert.notCalled(killLocalProcessStub);
      sinon.assert.calledOnce(cancelRemoteJobStub);
    });
    it("should do nothing for remote tasks using remote execution", async ()=>{
      const task = { remotehostID: "remote1", useJobScheduler: false };
      await killTask(task);
      sinon.assert.notCalled(cancelLocalJobStub);
      sinon.assert.notCalled(killLocalProcessStub);
      sinon.assert.notCalled(cancelRemoteJobStub);
    });
  });
});
