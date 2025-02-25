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
});
