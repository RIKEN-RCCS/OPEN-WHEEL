/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import fs from "fs-extra";
import path from "path";

//setup test framework
import * as chai from "chai";
const expect = chai.expect;
import sinon from "sinon";
import sinonChai from "sinon-chai";
chai.use(sinonChai);

import { createNewProject } from "../../../app/core/projectFilesOperator.js";
//testee
import { onProjectOperation, _internal } from "../../../app/handlers/projectController.js";

const onRunProject = sinon.stub();
const onStopProject = sinon.stub();
const onCleanProject = sinon.stub();
const onRevertProject = sinon.stub();
const onSaveProject = sinon.stub();

const sendWorkflow = sinon.stub();
const sendTaskStateList = sinon.stub();
const sendProjectJson = sinon.stub();
const sendComponentTree = sinon.stub();

const ack = sinon.stub();
async function sleep(time) {
  return new Promise((resolve)=>{
    setTimeout(resolve, time);
  });
}

//test data
const testDirRoot = "WHEEL_TEST_TMP";
const projectRootDir = path.resolve(testDirRoot, "testProject.wheel");

describe("UT for projectOperation callback function", function () {
  this.timeout(10000);
  beforeEach(async ()=>{
    await fs.remove(testDirRoot);
    await createNewProject(projectRootDir, "test project", null, "test", "test@example.com");
    const sbs = _internal.projectOperationQueues.get(projectRootDir);
    if (sbs) {
      sbs.clear();
    }
    _internal.projectOperationQueues.clear();
    sinon.stub(_internal, "onRunProject").value(onRunProject);
    sinon.stub(_internal, "onStopProject").value(onStopProject);
    sinon.stub(_internal, "onCleanProject").value(onCleanProject);
    sinon.stub(_internal, "onRevertProject").value(onRevertProject);
    sinon.stub(_internal, "onSaveProject").value(onSaveProject);
    sinon.stub(_internal, "sendWorkflow").value(sendWorkflow);
    sinon.stub(_internal, "sendTaskStateList").value(sendTaskStateList);
    sinon.stub(_internal, "sendProjectJson").value(sendProjectJson);
    sinon.stub(_internal, "sendComponentTree").value(sendComponentTree);
    onRunProject.reset();
    onStopProject.reset();
    onCleanProject.reset();
    onRevertProject.reset();
    onSaveProject.reset();
  });
  afterEach(()=>{
    sinon.restore();
  });
  after(async ()=>{
    if (!process.env.WHEEL_KEEP_FILES_AFTER_LAST_TEST) {
      await fs.remove(testDirRoot);
    }
  });
  describe("test with not-started project", ()=>{
    it("should call onRunProject", async ()=>{
      await onProjectOperation("dummy", projectRootDir, "runProject", ack);
      await sleep(2000);
      expect(onRunProject).to.be.calledOnce;
    });
    it("should not call onStopProject", async ()=>{
      await onProjectOperation("dummy", projectRootDir, "stopProject", ack);
      expect(onStopProject).not.to.be.called;
    });
    it("should not call onCleanProject", async ()=>{
      await onProjectOperation("dummy", projectRootDir, "cleanProject", ack);
      expect(onCleanProject).not.to.be.called;
    });
    it("should call onRevertProject", async ()=>{
      await onProjectOperation("dummy", projectRootDir, "revertProject", ack);
      await sleep(2000);
      expect(onRevertProject).to.be.calledOnce;
    });
    it("should call onSaveProject", async ()=>{
      await onProjectOperation("dummy", projectRootDir, "saveProject", ack);
      await sleep(2000);
      expect(onSaveProject).to.be.calledOnce;
    });
  });
  describe("queue operation", ()=>{
    it("should not call all handler before submit cleanProject", async ()=>{
      onProjectOperation("dummy", projectRootDir, "runProject", ack);
      onProjectOperation("dummy", projectRootDir, "stopProject", ack);
      onProjectOperation("dummy", projectRootDir, "runProject", ack);
      onProjectOperation("dummy", projectRootDir, "stopProject", ack);
      onProjectOperation("dummy", projectRootDir, "runProject", ack);
      onProjectOperation("dummy", projectRootDir, "stopProject", ack);
      onProjectOperation("dummy", projectRootDir, "runProject", ack);
      onProjectOperation("dummy", projectRootDir, "stopProject", ack);
      onProjectOperation("dummy", projectRootDir, "runProject", ack);
      onProjectOperation("dummy", projectRootDir, "stopProject", ack);
      onProjectOperation("dummy", projectRootDir, "runProject", ack);
      onProjectOperation("dummy", projectRootDir, "stopProject", ack);
      onProjectOperation("dummy", projectRootDir, "runProject", ack);
      onProjectOperation("dummy", projectRootDir, "stopProject", ack);
      onProjectOperation("dummy", projectRootDir, "runProject", ack);
      onProjectOperation("dummy", projectRootDir, "stopProject", ack);
      await onProjectOperation("dummy", projectRootDir, "cleanProject", ack);
      const numberOfRunProjectCalled = onRunProject.getCalls().length;
      const numberOfStopProjectCalled = onStopProject.getCalls().length;

      expect(numberOfRunProjectCalled).to.be.below(8);
      expect(numberOfStopProjectCalled).to.be.below(8);
    });
    it("should call onece if 2 consecutive API called", async ()=>{
      await onProjectOperation("dummy", projectRootDir, "revertProject", ack);
      await onProjectOperation("dummy", projectRootDir, "revertProject", ack);
      await sleep(2000);
      expect(onRevertProject).to.be.calledOnce;
    });
  });
});
