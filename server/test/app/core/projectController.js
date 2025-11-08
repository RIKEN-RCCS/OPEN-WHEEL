/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import path from "path";
import fs from "fs-extra";
import os from "os";
import sinon from "sinon";

//setup test framework

import * as chai from "chai";
const expect = chai.expect;
import sinonChai from "sinon-chai";
chai.use(sinonChai);
import Ajv from "ajv";
const ajv = new Ajv({ strict: false });
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);

import { _internal, runProject, stopProject, cleanProject, updateProjectState } from "../../../app/core/projectController.js";

//test data
const testDirRoot = "WHEEL_TEST_TMP";
const projectRootDir = path.resolve(testDirRoot, "testProject.wheel");

//helper functions
import { projectJsonFilename, componentJsonFilename, statusFilename } from "../../../app/db/db.js";
import { renameOutputFile } from "../../../app/core/componentFiles.js";
import { updateComponentProperty } from "../../testUtil.js";
import { createNewComponent, renameComponentDir } from "../../../app/core/componentOperations.js";
import { addInputFile, addOutputFile } from "../../../app/core/componentFiles.js";
import { addLink, addFileLink } from "../../../app/core/componentLinks.js";
import { createNewProject } from "../../../app/core/projectOperations.js";
import { gitAdd, gitCommit } from "../../../app/core/gitOperator2.js";
import { eventEmitters as globalEventEmitters } from "../../../app/core/global.js";

import { scriptName, pwdCmd, scriptHeader, referenceEnv, exit } from "../../testScript.js";
import { sleep } from "../../testUtil.js";
const scriptPwd = `${scriptHeader}\n${pwdCmd}`;

describe("project Controller UT", function () {
  this.timeout(0);

  beforeEach(async ()=>{
    await fs.remove(testDirRoot);
    await createNewProject(projectRootDir, "test project", null, "test", "test@example.com");

    //Setup mock event emitter for the project directly on the global map
    const ee = { emit: sinon.stub() };
    globalEventEmitters.set(projectRootDir, ee);

    //Clear any existing dispatchers
    _internal.rootDispatchers.clear();
  });
  afterEach(()=>{
    //Restore stubs
    sinon.restore();
    //Clear event emitters
    globalEventEmitters.delete(projectRootDir);
    //Clear dispatchers
    _internal.rootDispatchers.clear();
  });
  after(async ()=>{
    if (!process.env.WHEEL_KEEP_FILES_AFTER_LAST_TEST) {
      await fs.remove(testDirRoot);
    }
  });
  describe("#runProject", ()=>{
    describe("one local task", ()=>{
      let task0;
      beforeEach(async ()=>{
        task0 = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 10, y: 10 });
        await updateComponentProperty(projectRootDir, task0.ID, "script", scriptName);
      });
      it("should retry 2 times and fail", async ()=>{
        await updateComponentProperty(projectRootDir, task0.ID, "retryTimes", 2);
        await updateComponentProperty(projectRootDir, task0.ID, "retryCondition", true);
        await fs.outputFile(path.join(projectRootDir, "task0", scriptName), `${scriptPwd}\n${exit(10)}`);
        await runProject(projectRootDir);

        const projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
        const projectJsonSchema = { required: ["state"], properties: { state: { enum: ["failed"] } } };
        expect(ajv.validate(projectJsonSchema, projectJson)).to.be.true;
        const rootWFJson = await fs.readJson(path.resolve(projectRootDir, componentJsonFilename));
        const rootWFJsonSchema = { required: ["state"], properties: { state: { enum: ["failed"] } } };
        expect(ajv.validate(rootWFJsonSchema, rootWFJson)).to.be.true;
        const task0Json = await fs.readJson(path.resolve(projectRootDir, "task0", componentJsonFilename));
        const task0JsonSchema = { required: ["state", "ancestorsName"], properties: { state: { enum: ["failed"] }, ancestorsName: { enum: [""] } } };
        expect(ajv.validate(task0JsonSchema, task0Json)).to.be.true;
        expect(fs.readFileSync(path.resolve(projectRootDir, "task0", statusFilename), "utf-8")).to.equal("failed\n10\nundefined");
      });
      it("should run project and fail", async ()=>{
        await fs.outputFile(path.join(projectRootDir, "task0", scriptName), `${scriptPwd}\n${exit(10)}`);
        await runProject(projectRootDir);

        const projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
        const projectJsonSchema = { required: ["state"], properties: { state: { enum: ["failed"] } } };
        expect(ajv.validate(projectJsonSchema, projectJson)).to.be.true;
        const rootWFJson = await fs.readJson(path.resolve(projectRootDir, componentJsonFilename));
        const rootWFJsonSchema = { required: ["state"], properties: { state: { enum: ["failed"] } } };
        expect(ajv.validate(rootWFJsonSchema, rootWFJson)).to.be.true;
        const task0Json = await fs.readJson(path.resolve(projectRootDir, "task0", componentJsonFilename));
        const task0JsonSchema = { required: ["state", "ancestorsName"], properties: { state: { enum: ["failed"] }, ancestorsName: { enum: [""] } } };
        expect(ajv.validate(task0JsonSchema, task0Json)).to.be.true;
        expect(fs.readFileSync(path.resolve(projectRootDir, "task0", statusFilename), "utf-8")).to.equal("failed\n10\nundefined");
      });
      it("should run project and successfully finish", async ()=>{
        await fs.outputFile(path.join(projectRootDir, "task0", scriptName), scriptPwd);
        await runProject(projectRootDir);
        const projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
        const projectJsonSchema = { required: ["state"], properties: { state: { enum: ["finished"] } } };
        expect(ajv.validate(projectJsonSchema, projectJson)).to.be.true;
        const rootWFJson = await fs.readJson(path.resolve(projectRootDir, componentJsonFilename));
        const rootWFJsonSchema = { required: ["state"], properties: { state: { enum: ["finished"] } } };
        expect(ajv.validate(rootWFJsonSchema, rootWFJson)).to.be.true;
        const task0Json = await fs.readJson(path.resolve(projectRootDir, "task0", componentJsonFilename));
        const task0JsonSchema = { required: ["state", "ancestorsName"], properties: { state: { enum: ["finished"] }, ancestorsName: { enum: [""] } } };
        expect(ajv.validate(task0JsonSchema, task0Json)).to.be.true;
        expect(fs.readFileSync(path.resolve(projectRootDir, "task0", statusFilename), "utf-8")).to.equal("finished\n0\nundefined");
      });
    });
    describe("3 local tasks with execution order dependency", ()=>{
      let task0 = null;
      let task1 = null;
      let task2 = null;
      beforeEach(async ()=>{
        task0 = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 10, y: 10 });
        task1 = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 10, y: 10 });
        task2 = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 10, y: 10 });
        await updateComponentProperty(projectRootDir, task0.ID, "script", scriptName);
        await updateComponentProperty(projectRootDir, task1.ID, "script", scriptName);
        await updateComponentProperty(projectRootDir, task2.ID, "script", scriptName);
        await fs.outputFile(path.join(projectRootDir, "task0", scriptName), scriptPwd);
        await fs.outputFile(path.join(projectRootDir, "task1", scriptName), scriptPwd);
        await fs.outputFile(path.join(projectRootDir, "task2", scriptName), scriptPwd);
        await addLink(projectRootDir, task0.ID, task1.ID);
        await addLink(projectRootDir, task1.ID, task2.ID);
      });
      it("should not run disable task and its dependent task but project should be successfully finished", async ()=>{
        await updateComponentProperty(projectRootDir, task1.ID, "disable", true);

        await runProject(projectRootDir);

        const projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
        const rootWF = await fs.readJson(path.resolve(projectRootDir, componentJsonFilename));
        const task0Json = await fs.readJson(path.resolve(projectRootDir, "task0", componentJsonFilename));
        const task1Json = await fs.readJson(path.resolve(projectRootDir, "task1", componentJsonFilename));
        const task2Json = await fs.readJson(path.resolve(projectRootDir, "task2", componentJsonFilename));

        const finishedSchema = { required: ["state"], properties: { state: { enum: ["finished"] } } };
        const notStartedSchema = { required: ["state"], properties: { state: { enum: ["not-started"] } } };
        const validateFinished = ajv.compile(finishedSchema);
        const validateNotStarted = ajv.compile(notStartedSchema);

        expect(validateFinished(projectJson)).to.be.true;
        expect(validateFinished(rootWF)).to.be.true;
        expect(validateFinished(task0Json)).to.be.true;
        expect(validateNotStarted(task1Json)).to.be.true;
        expect(validateNotStarted(task2Json)).to.be.true;
      });
      it("should run project and successfully finish", async ()=>{
        await runProject(projectRootDir);
        const projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
        const rootWF = await fs.readJson(path.resolve(projectRootDir, componentJsonFilename));
        const task0Json = await fs.readJson(path.resolve(projectRootDir, "task0", componentJsonFilename));
        const task1Json = await fs.readJson(path.resolve(projectRootDir, "task1", componentJsonFilename));
        const task2Json = await fs.readJson(path.resolve(projectRootDir, "task2", componentJsonFilename));

        const finishedSchema = { required: ["state"], properties: { state: { enum: ["finished"] } } };
        const validateFinished = ajv.compile(finishedSchema);

        expect(validateFinished(projectJson)).to.be.true;
        expect(validateFinished(rootWF)).to.be.true;
        expect(validateFinished(task0Json)).to.be.true;
        expect(validateFinished(task1Json)).to.be.true;
        expect(validateFinished(task2Json)).to.be.true;
      });
    });
    describe("3 local tasks with file dependency", ()=>{
      let task0 = null;
      let task1 = null;
      let task2 = null;
      beforeEach(async ()=>{
        task0 = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 10, y: 10 });
        task1 = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 10, y: 10 });
        task2 = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 10, y: 10 });
        await updateComponentProperty(projectRootDir, task0.ID, "script", scriptName);
        await updateComponentProperty(projectRootDir, task1.ID, "script", scriptName);
        await updateComponentProperty(projectRootDir, task2.ID, "script", scriptName);
        await fs.outputFile(path.join(projectRootDir, "task0", scriptName), scriptPwd);
        await fs.outputFile(path.join(projectRootDir, "task0", "a"), "a");
        await fs.outputFile(path.join(projectRootDir, "task1", scriptName), scriptPwd);
        await fs.outputFile(path.join(projectRootDir, "task2", scriptName), scriptPwd);

        await addOutputFile(projectRootDir, task0.ID, "a");
        await addInputFile(projectRootDir, task1.ID, "b");

        await addOutputFile(projectRootDir, task1.ID, "b");
        await addInputFile(projectRootDir, task2.ID, "c");

        await addFileLink(projectRootDir, task0.ID, "a", task1.ID, "b");
        await addFileLink(projectRootDir, task1.ID, "b", task2.ID, "c");
      });
      it("should not run disable task and its dependent task but project should be successfully finished", async ()=>{
        await updateComponentProperty(projectRootDir, task1.ID, "disable", true);

        await runProject(projectRootDir);

        const projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
        const rootWF = await fs.readJson(path.resolve(projectRootDir, componentJsonFilename));
        const task0Json = await fs.readJson(path.resolve(projectRootDir, "task0", componentJsonFilename));
        const task1Json = await fs.readJson(path.resolve(projectRootDir, "task1", componentJsonFilename));
        const task2Json = await fs.readJson(path.resolve(projectRootDir, "task2", componentJsonFilename));

        const finishedSchema = { required: ["state"], properties: { state: { enum: ["finished"] } } };
        const notStartedSchema = { required: ["state"], properties: { state: { enum: ["not-started"] } } };
        const validateFinished = ajv.compile(finishedSchema);
        const validateNotStarted = ajv.compile(notStartedSchema);

        expect(validateFinished(projectJson)).to.be.true;
        expect(validateFinished(rootWF)).to.be.true;
        expect(validateFinished(task0Json)).to.be.true;
        expect(validateNotStarted(task1Json)).to.be.true;
        expect(validateNotStarted(task2Json)).to.be.true;

        expect(fs.readFileSync(path.resolve(projectRootDir, "task0", "a"), "utf-8")).to.equal("a");
        expect(fs.existsSync(path.resolve(projectRootDir, "task1", "b"))).to.be.false;
        expect(fs.existsSync(path.resolve(projectRootDir, "task2", "c"))).to.be.false;
      });
      it("should run project and successfully finish", async ()=>{
        await runProject(projectRootDir);
        const projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
        const rootWF = await fs.readJson(path.resolve(projectRootDir, componentJsonFilename));
        const task0Json = await fs.readJson(path.resolve(projectRootDir, "task0", componentJsonFilename));
        const task1Json = await fs.readJson(path.resolve(projectRootDir, "task1", componentJsonFilename));
        const task2Json = await fs.readJson(path.resolve(projectRootDir, "task2", componentJsonFilename));

        const finishedSchema = { required: ["state"], properties: { state: { enum: ["finished"] } } };
        const validateFinished = ajv.compile(finishedSchema);

        expect(validateFinished(projectJson)).to.be.true;
        expect(validateFinished(rootWF)).to.be.true;
        expect(validateFinished(task0Json)).to.be.true;
        expect(validateFinished(task1Json)).to.be.true;
        expect(validateFinished(task2Json)).to.be.true;

        expect(fs.readFileSync(path.resolve(projectRootDir, "task0", "a"), "utf-8")).to.equal("a");
        expect(fs.readFileSync(path.resolve(projectRootDir, "task1", "b"), "utf-8")).to.equal("a");
        expect(fs.readFileSync(path.resolve(projectRootDir, "task2", "c"), "utf-8")).to.equal("a");
      });
    });
    describe("task in the sub workflow", ()=>{
      let task0 = null;
      let wf0 = null;
      beforeEach(async ()=>{
        wf0 = await createNewComponent(projectRootDir, projectRootDir, "workflow", { x: 10, y: 10 });
        task0 = await createNewComponent(projectRootDir, path.join(projectRootDir, "workflow0"), "task", { x: 10, y: 10 });
        await updateComponentProperty(projectRootDir, task0.ID, "script", scriptName);
        await fs.outputFile(path.join(projectRootDir, "workflow0", "task0", scriptName), scriptPwd);
      });
      it("should not run disable workflow and its sub-component but successfully finished project", async ()=>{
        await updateComponentProperty(projectRootDir, wf0.ID, "disable", true);

        await runProject(projectRootDir);
        const projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
        const rootWF = await fs.readJson(path.resolve(projectRootDir, componentJsonFilename));
        const wf0Json = await fs.readJson(path.resolve(projectRootDir, "workflow0", componentJsonFilename));
        const task0Json = await fs.readJson(path.resolve(projectRootDir, "workflow0", "task0", componentJsonFilename));

        const finishedSchema = { required: ["state"], properties: { state: { enum: ["finished"] } } };
        const notStartedSchema = { required: ["state"], properties: { state: { enum: ["not-started"] } } };
        const validateFinished = ajv.compile(finishedSchema);
        const validateNotStarted = ajv.compile(notStartedSchema);

        expect(validateFinished(projectJson)).to.be.true;
        expect(validateFinished(rootWF)).to.be.true;
        expect(validateNotStarted(wf0Json)).to.be.true;
        expect(validateNotStarted(task0Json)).to.be.true;
      });
      it("should not run disable task and successfully finished parent sub-workflow", async ()=>{
        await updateComponentProperty(projectRootDir, task0.ID, "disable", true);

        await runProject(projectRootDir);
        const projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
        const rootWF = await fs.readJson(path.resolve(projectRootDir, componentJsonFilename));
        const wf0Json = await fs.readJson(path.resolve(projectRootDir, "workflow0", componentJsonFilename));
        const task0Json = await fs.readJson(path.resolve(projectRootDir, "workflow0", "task0", componentJsonFilename));

        const finishedSchema = { required: ["state"], properties: { state: { enum: ["finished"] } } };
        const notStartedSchema = { required: ["state"], properties: { state: { enum: ["not-started"] } } };
        const validateFinished = ajv.compile(finishedSchema);
        const validateNotStarted = ajv.compile(notStartedSchema);

        expect(validateFinished(projectJson)).to.be.true;
        expect(validateFinished(rootWF)).to.be.true;
        expect(validateFinished(wf0Json)).to.be.true;
        expect(validateNotStarted(task0Json)).to.be.true;
      });
      it("should run project and successfully finish", async ()=>{
        await runProject(projectRootDir);
        const projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
        const rootWF = await fs.readJson(path.resolve(projectRootDir, componentJsonFilename));
        const task0Json = await fs.readJson(path.resolve(projectRootDir, "workflow0", "task0", componentJsonFilename));

        const finishedSchema = { required: ["state"], properties: { state: { enum: ["finished"] } } };
        const validateFinished = ajv.compile(finishedSchema);

        expect(validateFinished(projectJson)).to.be.true;
        expect(validateFinished(rootWF)).to.be.true;
        expect(validateFinished(task0Json)).to.be.true;
      });
    });
    describe("file dependency between parent and child", ()=>{
      beforeEach(async ()=>{
        const wf0 = await createNewComponent(projectRootDir, projectRootDir, "workflow", { x: 10, y: 10 });
        await renameComponentDir(projectRootDir, wf0.ID, "wf0");
        const parentTask0 = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 10, y: 10 });
        const parentTask1 = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 10, y: 10 });
        await renameComponentDir(projectRootDir, parentTask0.ID, "parentTask0");
        await updateComponentProperty(projectRootDir, parentTask0.ID, "script", scriptName);
        await renameComponentDir(projectRootDir, parentTask1.ID, "parentTask1");
        await updateComponentProperty(projectRootDir, parentTask1.ID, "script", scriptName);

        const childTask0 = await createNewComponent(projectRootDir, path.join(projectRootDir, "wf0"), "task", { x: 10, y: 10 });
        const childTask1 = await createNewComponent(projectRootDir, path.join(projectRootDir, "wf0"), "task", { x: 10, y: 10 });
        await renameComponentDir(projectRootDir, childTask0.ID, "childTask0");
        await updateComponentProperty(projectRootDir, childTask0.ID, "script", scriptName);
        await renameComponentDir(projectRootDir, childTask1.ID, "childTask1");
        await updateComponentProperty(projectRootDir, childTask1.ID, "script", scriptName);

        //add file dependency
        await fs.outputFile(path.join(projectRootDir, "parentTask0", "a"), "a");
        await addOutputFile(projectRootDir, parentTask0.ID, "a");
        await addInputFile(projectRootDir, wf0.ID, "b");
        await addInputFile(projectRootDir, childTask0.ID, "c");
        await addOutputFile(projectRootDir, childTask0.ID, "c");
        await addInputFile(projectRootDir, childTask1.ID, "d");
        await addOutputFile(projectRootDir, childTask1.ID, "d");
        await addOutputFile(projectRootDir, wf0.ID, "e");
        await addInputFile(projectRootDir, parentTask1.ID, "f");

        await addFileLink(projectRootDir, parentTask0.ID, "a", wf0.ID, "b");
        await addFileLink(projectRootDir, "parent", "b", childTask0.ID, "c");
        await addFileLink(projectRootDir, childTask0.ID, "c", childTask1.ID, "d");
        await addFileLink(projectRootDir, childTask1.ID, "d", "parent", "e");
        await addFileLink(projectRootDir, wf0.ID, "e", parentTask1.ID, "f");

        //create script
        await fs.outputFile(path.join(projectRootDir, "parentTask0", scriptName), scriptPwd);
        await fs.outputFile(path.join(projectRootDir, "parentTask1", scriptName), scriptPwd);
        await fs.outputFile(path.join(projectRootDir, "wf0", "childTask0", scriptName), scriptPwd);
        await fs.outputFile(path.join(projectRootDir, "wf0", "childTask1", scriptName), scriptPwd);
      });
      it("should run project and successfully finish", async ()=>{
        await runProject(projectRootDir);
        const projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
        const rootWF = await fs.readJson(path.resolve(projectRootDir, componentJsonFilename));
        const parentTask0Json = await fs.readJson(path.resolve(projectRootDir, "parentTask0", componentJsonFilename));
        const parentTask1Json = await fs.readJson(path.resolve(projectRootDir, "parentTask1", componentJsonFilename));
        const wf0Json = await fs.readJson(path.resolve(projectRootDir, "wf0", componentJsonFilename));
        const childTask0Json = await fs.readJson(path.resolve(projectRootDir, "wf0", "childTask0", componentJsonFilename));
        const childTask1Json = await fs.readJson(path.resolve(projectRootDir, "wf0", "childTask1", componentJsonFilename));

        const finishedSchema = { required: ["state"], properties: { state: { enum: ["finished"] } } };
        const validateFinished = ajv.compile(finishedSchema);

        expect(validateFinished(projectJson)).to.be.true;
        expect(validateFinished(rootWF)).to.be.true;
        expect(validateFinished(parentTask0Json)).to.be.true;
        expect(validateFinished(parentTask1Json)).to.be.true;
        expect(validateFinished(wf0Json)).to.be.true;
        expect(validateFinished(childTask0Json)).to.be.true;
        expect(validateFinished(childTask1Json)).to.be.true;

        expect(fs.readFileSync(path.resolve(projectRootDir, "parentTask0", "a"), "utf-8")).to.equal("a");
        expect(fs.readFileSync(path.resolve(projectRootDir, "wf0", "b"), "utf-8")).to.equal("a");
        expect(fs.readFileSync(path.resolve(projectRootDir, "wf0", "childTask0", "c"), "utf-8")).to.equal("a");
        expect(fs.readFileSync(path.resolve(projectRootDir, "wf0", "childTask1", "d"), "utf-8")).to.equal("a");
        expect(fs.existsSync(path.resolve(projectRootDir, "wf0", "e"))).to.be.false;
        expect(fs.readFileSync(path.resolve(projectRootDir, "parentTask1", "f"), "utf-8")).to.equal("a");
      });
    });
    describe("If component", ()=>{
      beforeEach(async ()=>{
        const if0 = await createNewComponent(projectRootDir, projectRootDir, "if", { x: 10, y: 10 });
        const if1 = await createNewComponent(projectRootDir, projectRootDir, "if", { x: 10, y: 10 });
        const if2 = await createNewComponent(projectRootDir, projectRootDir, "if", { x: 10, y: 10 });
        const if3 = await createNewComponent(projectRootDir, projectRootDir, "if", { x: 10, y: 10 });
        const task0 = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 10, y: 10 });
        const task1 = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 10, y: 10 });
        await updateComponentProperty(projectRootDir, if0.ID, "condition", scriptName);
        await updateComponentProperty(projectRootDir, if1.ID, "condition", scriptName);
        await updateComponentProperty(projectRootDir, if2.ID, "condition", "true");
        await updateComponentProperty(projectRootDir, if3.ID, "condition", "(()=>{return false})()");
        await updateComponentProperty(projectRootDir, task0.ID, "script", scriptName);
        await updateComponentProperty(projectRootDir, task1.ID, "script", scriptName);
        await addLink(projectRootDir, if0.ID, task0.ID);
        await addLink(projectRootDir, if0.ID, task1.ID, true);
        await addLink(projectRootDir, if1.ID, task1.ID);
        await addLink(projectRootDir, if1.ID, task0.ID, true);
        await addLink(projectRootDir, if2.ID, task0.ID);
        await addLink(projectRootDir, if2.ID, task1.ID, true);
        await addLink(projectRootDir, if3.ID, task1.ID);
        await addLink(projectRootDir, if3.ID, task0.ID, true);
        await fs.outputFile(path.join(projectRootDir, "if0", scriptName), "#!/bin/bash\nexit 0\n");
        await fs.outputFile(path.join(projectRootDir, "if1", scriptName), "#!/bin/bash\nexit 1\n");
        await fs.outputFile(path.join(projectRootDir, "task0", scriptName), scriptPwd);
        await fs.outputFile(path.join(projectRootDir, "task1", scriptName), scriptPwd);
      });
      it("should run project and successfully finish", async ()=>{
        await runProject(projectRootDir);
        const projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
        const rootWF = await fs.readJson(path.resolve(projectRootDir, componentJsonFilename));
        const task0Json = await fs.readJson(path.resolve(projectRootDir, "task0", componentJsonFilename));
        const task1Json = await fs.readJson(path.resolve(projectRootDir, "task1", componentJsonFilename));
        const if0Json = await fs.readJson(path.resolve(projectRootDir, "if0", componentJsonFilename));
        const if1Json = await fs.readJson(path.resolve(projectRootDir, "if1", componentJsonFilename));
        const if2Json = await fs.readJson(path.resolve(projectRootDir, "if2", componentJsonFilename));
        const if3Json = await fs.readJson(path.resolve(projectRootDir, "if3", componentJsonFilename));

        const finishedSchema = { required: ["state"], properties: { state: { enum: ["finished"] } } };
        const notStartedSchema = { required: ["state"], properties: { state: { enum: ["not-started"] } } };
        const validateFinished = ajv.compile(finishedSchema);
        const validateNotStarted = ajv.compile(notStartedSchema);

        expect(validateFinished(projectJson)).to.be.true;
        expect(validateFinished(rootWF)).to.be.true;
        expect(validateFinished(task0Json)).to.be.true;
        expect(validateNotStarted(task1Json)).to.be.true;
        expect(validateFinished(if0Json)).to.be.true;
        expect(validateFinished(if1Json)).to.be.true;
        expect(validateFinished(if2Json)).to.be.true;
        expect(validateFinished(if3Json)).to.be.true;
      });
    });
    describe("If component", ()=>{
      beforeEach(async ()=>{
        const if0 = await createNewComponent(projectRootDir, projectRootDir, "if", { x: 10, y: 10 });
        const task0 = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 10, y: 10 });
        const task1 = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 10, y: 10 });
        const task2 = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 10, y: 10 });
        await updateComponentProperty(projectRootDir, if0.ID, "condition", scriptName);
        await updateComponentProperty(projectRootDir, task0.ID, "script", scriptName);
        await updateComponentProperty(projectRootDir, task1.ID, "script", scriptName);
        await updateComponentProperty(projectRootDir, task2.ID, "script", scriptName);
        await fs.outputFile(path.join(projectRootDir, "task0", "a"), "a");
        await addOutputFile(projectRootDir, task0.ID, "a");
        await addInputFile(projectRootDir, if0.ID, "b");
        await addInputFile(projectRootDir, task2.ID, "c");
        await addFileLink(projectRootDir, task0.ID, "a", if0.ID, "b");
        await addFileLink(projectRootDir, task0.ID, "a", task2.ID, "c");
        await addLink(projectRootDir, if0.ID, task1.ID);
        await addLink(projectRootDir, if0.ID, task2.ID, true);
        await fs.outputFile(path.join(projectRootDir, "if0", scriptName), "#!/bin/bash\nexit 0\n");
        await fs.outputFile(path.join(projectRootDir, "task0", scriptName), scriptPwd);
        await fs.outputFile(path.join(projectRootDir, "task1", scriptName), scriptPwd);
        await fs.outputFile(path.join(projectRootDir, "task2", scriptName), scriptPwd);
      });
      it("should not make link from outputFile to inputFile behind If Component", async ()=>{
        await runProject(projectRootDir);
        const projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
        const rootWF = await fs.readJson(path.resolve(projectRootDir, componentJsonFilename));
        const task0Json = await fs.readJson(path.resolve(projectRootDir, "task0", componentJsonFilename));
        const task1Json = await fs.readJson(path.resolve(projectRootDir, "task1", componentJsonFilename));
        const task2Json = await fs.readJson(path.resolve(projectRootDir, "task2", componentJsonFilename));
        const if0Json = await fs.readJson(path.resolve(projectRootDir, "if0", componentJsonFilename));

        const finishedSchema = { required: ["state"], properties: { state: { enum: ["finished"] } } };
        const notStartedSchema = { required: ["state"], properties: { state: { enum: ["not-started"] } } };
        const validateFinished = ajv.compile(finishedSchema);
        const validateNotStarted = ajv.compile(notStartedSchema);

        expect(validateFinished(projectJson)).to.be.true;
        expect(validateFinished(rootWF)).to.be.true;
        expect(validateFinished(task0Json)).to.be.true;
        expect(validateFinished(task1Json)).to.be.true;
        expect(validateNotStarted(task2Json)).to.be.true;
        expect(validateFinished(if0Json)).to.be.true;
      });
    });
    describe("task in a For component", ()=>{
      beforeEach(async ()=>{
        const for0 = await createNewComponent(projectRootDir, projectRootDir, "for", { x: 10, y: 10 });
        await updateComponentProperty(projectRootDir, for0.ID, "start", 0);
        await updateComponentProperty(projectRootDir, for0.ID, "end", 2);
        await updateComponentProperty(projectRootDir, for0.ID, "step", 1);
        const task0 = await createNewComponent(projectRootDir, path.join(projectRootDir, "for0"), "task", { x: 10, y: 10 });
        await updateComponentProperty(projectRootDir, task0.ID, "script", scriptName);
        await fs.outputFile(path.join(projectRootDir, "for0", "task0", scriptName), scriptPwd);
      });
      it("should run project and successfully finish", async ()=>{
        await runProject(projectRootDir);
        const projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
        const rootWF = await fs.readJson(path.resolve(projectRootDir, componentJsonFilename));
        const for0Json = await fs.readJson(path.resolve(projectRootDir, "for0", componentJsonFilename));
        const for0Task0Json = await fs.readJson(path.resolve(projectRootDir, "for0_0", "task0", componentJsonFilename));
        const for1Task0Json = await fs.readJson(path.resolve(projectRootDir, "for0_1", "task0", componentJsonFilename));
        const for2Task0Json = await fs.readJson(path.resolve(projectRootDir, "for0_2", "task0", componentJsonFilename));
        const forTask0Json = await fs.readJson(path.resolve(projectRootDir, "for0", "task0", componentJsonFilename));
        const finishedSchema = { required: ["state"], properties: { state: { enum: ["finished"] } } };
        const validateFinished = ajv.compile(finishedSchema);

        expect(validateFinished(projectJson)).to.be.true;
        expect(validateFinished(rootWF)).to.be.true;
        expect(validateFinished(for0Json)).to.be.true;
        expect(validateFinished(for0Task0Json)).to.be.true;
        expect(validateFinished(for1Task0Json)).to.be.true;
        expect(validateFinished(for2Task0Json)).to.be.true;
        expect(validateFinished(forTask0Json)).to.be.true;
      });
    });
    describe("task in a While component", ()=>{
      beforeEach(async ()=>{
        const while0 = await createNewComponent(projectRootDir, projectRootDir, "while", { x: 10, y: 10 });
        await updateComponentProperty(projectRootDir, while0.ID, "condition", "WHEEL_CURRENT_INDEX < 2");
        const task0 = await createNewComponent(projectRootDir, path.join(projectRootDir, "while0"), "task", { x: 10, y: 10 });
        await updateComponentProperty(projectRootDir, task0.ID, "script", scriptName);
        await fs.outputFile(path.join(projectRootDir, "while0", "task0", scriptName), scriptPwd);
      });
      it("should run project and successfully finish", async ()=>{
        await runProject(projectRootDir);
        const projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
        const rootWF = await fs.readJson(path.resolve(projectRootDir, componentJsonFilename));
        const while0Json = await fs.readJson(path.resolve(projectRootDir, "while0", componentJsonFilename));
        const while0Task0Json = await fs.readJson(path.resolve(projectRootDir, "while0", "task0", componentJsonFilename));
        //eslint-disable-next-line camelcase
        const while0_0Task0Json = await fs.readJson(path.resolve(projectRootDir, "while0_0", "task0", componentJsonFilename));
        //eslint-disable-next-line camelcase
        const while0_1Task0Json = await fs.readJson(path.resolve(projectRootDir, "while0_1", "task0", componentJsonFilename));
        const finishedSchema = { required: ["state"], properties: { state: { enum: ["finished"] } } };
        const validateFinished = ajv.compile(finishedSchema);

        expect(validateFinished(projectJson)).to.be.true;
        expect(validateFinished(rootWF)).to.be.true;
        expect(validateFinished(while0Json)).to.be.true;
        expect(validateFinished(while0Task0Json)).to.be.true;
        expect(validateFinished(while0_0Task0Json)).to.be.true;
        expect(validateFinished(while0_1Task0Json)).to.be.true;
      });
    });
    describe("task in a Foreach component", ()=>{
      beforeEach(async ()=>{
        const foreach0 = await createNewComponent(projectRootDir, projectRootDir, "foreach", { x: 10, y: 10 });
        await updateComponentProperty(projectRootDir, foreach0.ID, "indexList", ["foo", "bar", "baz", "fizz"]);
        const task0 = await createNewComponent(projectRootDir, path.join(projectRootDir, "foreach0"), "task", { x: 10, y: 10 });
        await updateComponentProperty(projectRootDir, task0.ID, "script", scriptName);
        await fs.outputFile(path.join(projectRootDir, "foreach0", "task0", scriptName), scriptPwd);
      });
      it("should run project and successfully finish", async ()=>{
        await runProject(projectRootDir);
        const projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
        const rootWF = await fs.readJson(path.resolve(projectRootDir, componentJsonFilename));
        const foreach0Json = await fs.readJson(path.resolve(projectRootDir, "foreach0", componentJsonFilename));
        const foreach0Task0Json = await fs.readJson(path.resolve(projectRootDir, "foreach0", "task0", componentJsonFilename));
        //eslint-disable-next-line camelcase
        const foreach0_fooTask0Json = await fs.readJson(path.resolve(projectRootDir, "foreach0_foo", "task0", componentJsonFilename));
        //eslint-disable-next-line camelcase
        const foreach0_barTask0Json = await fs.readJson(path.resolve(projectRootDir, "foreach0_bar", "task0", componentJsonFilename));
        //eslint-disable-next-line camelcase
        const foreach0_bazTask0Json = await fs.readJson(path.resolve(projectRootDir, "foreach0_baz", "task0", componentJsonFilename));
        //eslint-disable-next-line camelcase
        const foreach0_fizzTask0Json = await fs.readJson(path.resolve(projectRootDir, "foreach0_fizz", "task0", componentJsonFilename));

        const finishedSchema = { required: ["state"], properties: { state: { enum: ["finished"] } } };
        const validateFinished = ajv.compile(finishedSchema);

        expect(validateFinished(projectJson)).to.be.true;
        expect(validateFinished(rootWF)).to.be.true;
        expect(validateFinished(foreach0Json)).to.be.true;
        expect(validateFinished(foreach0Task0Json)).to.be.true;
        expect(validateFinished(foreach0_fooTask0Json)).to.be.true;
        expect(validateFinished(foreach0_barTask0Json)).to.be.true;
        expect(validateFinished(foreach0_bazTask0Json)).to.be.true;
        expect(validateFinished(foreach0_fizzTask0Json)).to.be.true;
      });
    });
    describe("file dependency between task in the For component", ()=>{
      beforeEach(async ()=>{
        const for0 = await createNewComponent(projectRootDir, projectRootDir, "for", { x: 10, y: 10 });
        const parentTask0 = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 10, y: 10 });
        const parentTask1 = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 10, y: 10 });
        await updateComponentProperty(projectRootDir, for0.ID, "start", 0);
        await updateComponentProperty(projectRootDir, for0.ID, "end", 2);
        await updateComponentProperty(projectRootDir, for0.ID, "step", 1);
        await renameComponentDir(projectRootDir, parentTask0.ID, "parentTask0");
        await renameComponentDir(projectRootDir, parentTask1.ID, "parentTask1");
        await updateComponentProperty(projectRootDir, parentTask0.ID, "script", scriptName);
        await updateComponentProperty(projectRootDir, parentTask1.ID, "script", scriptName);

        await addOutputFile(projectRootDir, parentTask0.ID, "a");
        await addInputFile(projectRootDir, for0.ID, "b");
        await addOutputFile(projectRootDir, for0.ID, "e");
        await addInputFile(projectRootDir, parentTask1.ID, "f");
        await addFileLink(projectRootDir, parentTask0.ID, "a", for0.ID, "b");
        await addFileLink(projectRootDir, for0.ID, "e", parentTask1.ID, "f");

        const task0 = await createNewComponent(projectRootDir, path.join(projectRootDir, "for0"), "task", { x: 10, y: 10 });
        await updateComponentProperty(projectRootDir, task0.ID, "script", scriptName);
        await addInputFile(projectRootDir, task0.ID, "c");
        await addOutputFile(projectRootDir, task0.ID, "d");
        await addFileLink(projectRootDir, for0.ID, "b", task0.ID, "c");
        await addFileLink(projectRootDir, task0.ID, "d", for0.ID, "e");

        await fs.outputFile(path.join(projectRootDir, "parentTask0", "a"), "a");
        await fs.outputFile(path.join(projectRootDir, "parentTask0", scriptName), scriptPwd);
        await fs.outputFile(path.join(projectRootDir, "parentTask1", scriptName), scriptPwd);
        await fs.outputFile(path.join(projectRootDir, "for0", "task0", scriptName), `${scriptPwd}\necho ${referenceEnv("WHEEL_CURRENT_INDEX")} > d\n`);
      });
      it("should run project and successfully finish", async ()=>{
        await runProject(projectRootDir);
        expect(fs.readFileSync(path.resolve(projectRootDir, "parentTask0", "a"), "utf-8")).to.equal("a");
        expect(fs.readFileSync(path.resolve(projectRootDir, "for0", "b"), "utf-8")).to.equal("a");
        expect(fs.readFileSync(path.resolve(projectRootDir, "for0", "task0", "c"), "utf-8")).to.equal("a");
        expect(fs.readFileSync(path.resolve(projectRootDir, "for0", "task0", "d"), "utf-8")).to.equal(`2${os.EOL}`);
        expect(fs.readFileSync(path.resolve(projectRootDir, "for0_0", "task0", "c"), "utf-8")).to.equal("a");
        expect(fs.readFileSync(path.resolve(projectRootDir, "for0_0", "task0", "d"), "utf-8")).to.equal(`0${os.EOL}`);
        expect(fs.readFileSync(path.resolve(projectRootDir, "for0_1", "task0", "c"), "utf-8")).to.equal("a");
        expect(fs.readFileSync(path.resolve(projectRootDir, "for0_1", "task0", "d"), "utf-8")).to.equal(`1${os.EOL}`);
        expect(fs.readFileSync(path.resolve(projectRootDir, "for0_2", "task0", "c"), "utf-8")).to.equal("a");
        expect(fs.readFileSync(path.resolve(projectRootDir, "for0_2", "task0", "d"), "utf-8")).to.equal(`2${os.EOL}`);
        expect(fs.existsSync(path.resolve(projectRootDir, "for0", "e"))).to.be.false;
        expect(fs.readFileSync(path.resolve(projectRootDir, "parentTask1", "f"), "utf-8")).to.equal(`2${os.EOL}`);

        const projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
        const rootWF = await fs.readJson(path.resolve(projectRootDir, componentJsonFilename));
        const for0Json = await fs.readJson(path.resolve(projectRootDir, "for0", componentJsonFilename));
        const for0Task0Json = await fs.readJson(path.resolve(projectRootDir, "for0_0", "task0", componentJsonFilename));
        const for1Task0Json = await fs.readJson(path.resolve(projectRootDir, "for0_1", "task0", componentJsonFilename));
        const for2Task0Json = await fs.readJson(path.resolve(projectRootDir, "for0_2", "task0", componentJsonFilename));
        const forTask0Json = await fs.readJson(path.resolve(projectRootDir, "for0", "task0", componentJsonFilename));
        const parentTask0Json = await fs.readJson(path.resolve(projectRootDir, "parentTask0", componentJsonFilename));
        const parentTask1Json = await fs.readJson(path.resolve(projectRootDir, "parentTask1", componentJsonFilename));

        const finishedSchema = { required: ["state"], properties: { state: { enum: ["finished"] } } };
        const validateFinished = ajv.compile(finishedSchema);

        expect(validateFinished(projectJson)).to.be.true;
        expect(validateFinished(rootWF)).to.be.true;
        expect(validateFinished(for0Json)).to.be.true;
        expect(validateFinished(for0Task0Json)).to.be.true;
        expect(validateFinished(for1Task0Json)).to.be.true;
        expect(validateFinished(for2Task0Json)).to.be.true;
        expect(validateFinished(forTask0Json)).to.be.true;
        expect(validateFinished(parentTask0Json)).to.be.true;
        expect(validateFinished(parentTask1Json)).to.be.true;
      });
    });
    describe("task in PS", ()=>{
      beforeEach(async ()=>{
        const ps0 = await createNewComponent(projectRootDir, projectRootDir, "PS", { x: 10, y: 10 });
        await updateComponentProperty(projectRootDir, ps0.ID, "parameterFile", "input.txt.json");
        await fs.outputFile(path.join(projectRootDir, "PS0", "input.txt"), "%%KEYWORD1%%");
        const parameterSetting = {
          version: 2,
          target_file: "input.txt",
          target_param: [
            {
              target: "hoge",
              keyword: "KEYWORD1",
              type: "integer",
              min: 1,
              max: 3,
              step: 1,
              list: ""
            }
          ]
        };
        await fs.writeJson(path.join(projectRootDir, "PS0", "input.txt.json"), parameterSetting, { spaces: 4 });

        const task0 = await createNewComponent(projectRootDir, path.join(projectRootDir, "PS0"), "task", { x: 10, y: 10 });
        await updateComponentProperty(projectRootDir, task0.ID, "script", scriptName);
        await fs.outputFile(path.join(projectRootDir, "PS0", "task0", scriptName), scriptPwd);
      });
      it("should run project and successfully finish", async ()=>{
        await runProject(projectRootDir);
        await sleep(1000);
        const projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
        const rootWF = await fs.readJson(path.resolve(projectRootDir, componentJsonFilename));
        const ps0Json = await fs.readJson(path.resolve(projectRootDir, "PS0", componentJsonFilename));
        //eslint-disable-next-line camelcase
        const ps0_1Json = await fs.readJson(path.resolve(projectRootDir, "PS0_KEYWORD1_1", "task0", componentJsonFilename));
        //eslint-disable-next-line camelcase
        const ps0_2Json = await fs.readJson(path.resolve(projectRootDir, "PS0_KEYWORD1_2", "task0", componentJsonFilename));
        //eslint-disable-next-line camelcase
        const ps0_3Json = await fs.readJson(path.resolve(projectRootDir, "PS0_KEYWORD1_3", "task0", componentJsonFilename));

        const finishedSchema = { required: ["state"], properties: { state: { enum: ["finished"] } } };
        const validateFinished = ajv.compile(finishedSchema);

        expect(validateFinished(projectJson)).to.be.true;
        expect(validateFinished(rootWF)).to.be.true;
        expect(validateFinished(ps0Json)).to.be.true;
        expect(validateFinished(ps0_1Json)).to.be.true;
        expect(validateFinished(ps0_2Json)).to.be.true;
        expect(validateFinished(ps0_3Json)).to.be.true;

        expect(fs.statSync(path.resolve(projectRootDir, "PS0_KEYWORD1_1")).isDirectory()).to.be.true;
        expect(fs.statSync(path.resolve(projectRootDir, "PS0_KEYWORD1_2")).isDirectory()).to.be.true;
        expect(fs.statSync(path.resolve(projectRootDir, "PS0_KEYWORD1_3")).isDirectory()).to.be.true;
      });
    });
    describe("task in PS ver.2", ()=>{
      beforeEach(async ()=>{
        const ps0 = await createNewComponent(projectRootDir, projectRootDir, "PS", { x: 10, y: 10 });
        await updateComponentProperty(projectRootDir, ps0.ID, "parameterFile", "input.txt.json");
        const task0 = await createNewComponent(projectRootDir, path.join(projectRootDir, "PS0"), "task", { x: 10, y: 10 });
        await updateComponentProperty(projectRootDir, task0.ID, "script", scriptName);

        await fs.outputFile(path.join(projectRootDir, "PS0", "input1.txt"), "{{ KEYWORD1 }} {{ KEYWORD3 }}");
        await fs.outputFile(path.join(projectRootDir, "PS0", "non-targetFile.txt"), "{{ filename }} {{ KEYWORD2 }}");
        await fs.outputFile(path.join(projectRootDir, "PS0", "task0", "input2.txt"), "{{ KEYWORD1 }}{{ KEYWORD2 }}");
        await fs.outputFile(path.join(projectRootDir, "PS0", "input3.txt"), "{{ KEYWORD1 }}{{ KEYWORD2 }}");
        await fs.outputFile(path.join(projectRootDir, "PS0", "testData"), "hoge");
        await fs.outputFile(path.join(projectRootDir, "PS0", "testData_foo"), "foo");
        await fs.outputFile(path.join(projectRootDir, "PS0", "testData_bar"), "bar");
        await fs.outputFile(path.join(projectRootDir, "PS0", "data_1"), "data_1");
        await fs.outputFile(path.join(projectRootDir, "PS0", "data_2"), "data_2");
        await fs.outputFile(path.join(projectRootDir, "PS0", "data_3"), "data_3");
        const parameterSetting = {
          version: 2,
          targetFiles: ["input1.txt", { targetNode: task0.ID, targetName: "input2.txt" }, { targetName: "input3.txt" }],
          target_param: [
            {
              keyword: "KEYWORD1",
              min: 1,
              max: 3,
              step: 1
            },
            {
              keyword: "KEYWORD3",
              list: ["foo", "bar"]
            },
            {
              keyword: "filename",
              files: ["data_*"]
            }
          ],
          scatter: [
            { srcName: "testData", dstNode: task0.ID, dstName: "hoge{{ KEYWORD1 }}" },
            { srcName: "testData_{{ KEYWORD3 }}", dstNode: task0.ID, dstName: "foobar" }
          ],
          gather: [
            { srcName: "hoge{{ KEYWORD1 }}", srcNode: task0.ID, dstName: "results/{{ KEYWORD1 }}/{{ KEYWORD3 }}_{{ filename }}/" },
            { srcName: "input2.txt", srcNode: task0.ID, dstName: "results/{{ KEYWORD1 }}/{{ KEYWORD3 }}_{{ filename }}/input2.txt" }
          ]
        };
        await fs.writeJson(path.join(projectRootDir, "PS0", "input.txt.json"), parameterSetting, { spaces: 4 });
        await fs.outputFile(path.join(projectRootDir, "PS0", "task0", scriptName), `${scriptPwd}|tee output.log\n`);
      });
      it("should run project and successfully finish", async ()=>{
        await runProject(projectRootDir);

        for (const filename of ["data_1", "data_2", "data_3"]) {
          for (const KEYWORD1 of [1, 2, 3]) {
            for (const KEYWORD3 of ["foo", "bar"]) {
              //check parameter expansion for input file
              expect(fs.readFileSync(path.resolve(projectRootDir, `PS0_KEYWORD1_${KEYWORD1}_KEYWORD3_${KEYWORD3}_filename_${filename}`, "input1.txt"), "utf-8")).to.equal(`${KEYWORD1} ${KEYWORD3}`);
              //check parameter expansion for input file with targetName and targetNode option and not-defiend parameter
              expect(fs.readFileSync(path.resolve(projectRootDir, `PS0_KEYWORD1_${KEYWORD1}_KEYWORD3_${KEYWORD3}_filename_${filename}`, "task0", "input2.txt"), "utf-8")).to.equal(`${KEYWORD1}`);
              //check parameter expansion for input file only with targetName
              expect(fs.readFileSync(path.resolve(projectRootDir, `PS0_KEYWORD1_${KEYWORD1}_KEYWORD3_${KEYWORD3}_filename_${filename}`, "input3.txt"), "utf-8")).to.equal(`${KEYWORD1}`);
              //check parameter expansion is not performed on non-target file
              expect(fs.readFileSync(path.resolve(projectRootDir, `PS0_KEYWORD1_${KEYWORD1}_KEYWORD3_${KEYWORD3}_filename_${filename}`, "non-targetFile.txt"), "utf-8")).to.equal("{{ filename }} {{ KEYWORD2 }}");
              //check scatter 1 (testData)
              expect(fs.readFileSync(path.resolve(projectRootDir, `PS0_KEYWORD1_${KEYWORD1}_KEYWORD3_${KEYWORD3}_filename_${filename}`, "task0", `hoge${KEYWORD1}`), "utf-8")).to.equal("hoge");
              //check scatter 2 (testData_{foo|bar})
              expect(fs.readFileSync(path.resolve(projectRootDir, `PS0_KEYWORD1_${KEYWORD1}_KEYWORD3_${KEYWORD3}_filename_${filename}`, "task0", "foobar"), "utf-8")).to.equal(KEYWORD3);
              //check gather 1 (hoge_*)
              expect(fs.readFileSync(path.resolve(projectRootDir, "PS0", "results", `${KEYWORD1}`, `${KEYWORD3}_${filename}`, `hoge${KEYWORD1}`), "utf-8")).to.equal("hoge");
              //check gather 2 (input2.txt)
              expect(fs.readFileSync(path.resolve(projectRootDir, "PS0", "results", `${KEYWORD1}`, `${KEYWORD3}_${filename}`, "input2.txt"), "utf-8")).to.equal(`${KEYWORD1}`);

              //check task status
              const taskJson = await fs.readJson(path.resolve(projectRootDir, `PS0_KEYWORD1_${KEYWORD1}_KEYWORD3_${KEYWORD3}_filename_${filename}`, "task0", componentJsonFilename));
              const taskSchema = { required: ["state"], properties: { state: { enum: ["finished"] } } };
              const validateTask = ajv.compile(taskSchema);
              expect(validateTask(taskJson)).to.be.true;
            }
          }
        }
        const projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
        const rootWF = await fs.readJson(path.resolve(projectRootDir, componentJsonFilename));
        const ps0Json = await fs.readJson(path.resolve(projectRootDir, "PS0", componentJsonFilename));
        const finishedSchema = { required: ["state"], properties: { state: { enum: ["finished"] } } };
        const validateFinished = ajv.compile(finishedSchema);
        expect(validateFinished(projectJson)).to.be.true;
        expect(validateFinished(rootWF)).to.be.true;
        expect(validateFinished(ps0Json)).to.be.true;
      });
    });
    describe.skip("task in nested PS(does not work for now)", ()=>{
      beforeEach(async ()=>{
        const ps0 = await createNewComponent(projectRootDir, projectRootDir, "PS", { x: 10, y: 10 });
        await updateComponentProperty(projectRootDir, ps0.ID, "parameterFile", "input.txt.json");

        const ps1 = await createNewComponent(projectRootDir, path.join(projectRootDir, "PS0"), "PS", { x: 10, y: 10 });
        await renameComponentDir(projectRootDir, ps1.ID, "PS1");
        await updateComponentProperty(projectRootDir, ps1.ID, "parameterFile", "input.txt.json");

        const task0 = await createNewComponent(projectRootDir, path.join(projectRootDir, "PS0", "PS1"), "task", { x: 10, y: 10 });
        await updateComponentProperty(projectRootDir, task0.ID, "script", scriptName);
        await fs.outputFile(path.join(projectRootDir, "PS0", "PS1", "task0", scriptName), scriptPwd);

        await fs.outputFile(path.join(projectRootDir, "PS0", "input.txt"), "%%KEYWORD1%%");
        await fs.outputFile(path.join(projectRootDir, "PS0", "PS1", "input.txt"), "%%KEYWORD1%%");
        const parameterSetting = {
          version: 2,
          target_file: "input.txt",
          target_param: [
            {
              target: "hoge",
              keyword: "KEYWORD1",
              type: "integer",
              min: 1,
              max: 3,
              step: 1,
              list: ""
            }
          ]
        };
        await fs.writeJson(path.join(projectRootDir, "PS0", "input.txt.json"), parameterSetting, { spaces: 4 });
        await fs.writeJson(path.join(projectRootDir, "PS0", "PS1", "input.txt.json"), parameterSetting, { spaces: 4 });
      });
      it("should run project and successfully finish", async ()=>{
        await runProject(projectRootDir);
        const projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
        const rootWF = await fs.readJson(path.resolve(projectRootDir, componentJsonFilename));
        const ps0Json = await fs.readJson(path.resolve(projectRootDir, "PS0", componentJsonFilename));
        const ps1Json = await fs.readJson(path.resolve(projectRootDir, "PS0", "PS1", componentJsonFilename));
        const finishedSchema = { required: ["state"], properties: { state: { enum: ["finished"] } } };
        const validateFinished = ajv.compile(finishedSchema);

        expect(validateFinished(projectJson)).to.be.true;
        expect(validateFinished(rootWF)).to.be.true;
        expect(validateFinished(ps0Json)).to.be.true;
        expect(validateFinished(ps1Json)).to.be.true;

        for (let i = 1; i <= 3; i++) {
          for (let j = 1; j <= 3; j++) {
            const taskJson = await fs.readJson(path.resolve(projectRootDir, `PS0_KEYWORD1_${i}`, `PS1_KEYWORD1_${j}`, "task0", componentJsonFilename));
            expect(validateFinished(taskJson)).to.be.true;
          }
        }
      });
    });
    describe("task in nested loop", ()=>{
      beforeEach(async ()=>{
        const for0 = await createNewComponent(projectRootDir, projectRootDir, "for", { x: 10, y: 10 });
        await updateComponentProperty(projectRootDir, for0.ID, "start", 0);
        await updateComponentProperty(projectRootDir, for0.ID, "end", 1);
        await updateComponentProperty(projectRootDir, for0.ID, "step", 1);

        const for1 = await createNewComponent(projectRootDir, path.join(projectRootDir, "for0"), "for", { x: 10, y: 10 });
        await renameComponentDir(projectRootDir, for1.ID, "for1");
        await updateComponentProperty(projectRootDir, for1.ID, "start", 0);
        await updateComponentProperty(projectRootDir, for1.ID, "end", 1);
        await updateComponentProperty(projectRootDir, for1.ID, "step", 1);

        const task0 = await createNewComponent(projectRootDir, path.join(projectRootDir, "for0", "for1"), "task", { x: 10, y: 10 });
        await updateComponentProperty(projectRootDir, task0.ID, "script", scriptName);
        await fs.outputFile(path.join(projectRootDir, "for0", "for1", "task0", scriptName), scriptPwd);
      });
      it("should run project and successfully finish", async ()=>{
        await runProject(projectRootDir);
        const projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
        const rootWF = await fs.readJson(path.resolve(projectRootDir, componentJsonFilename));
        const for0Json = await fs.readJson(path.resolve(projectRootDir, "for0", componentJsonFilename));
        const for0for1Task0Json = await fs.readJson(path.resolve(projectRootDir, "for0", "for1", "task0", componentJsonFilename));
        //eslint-disable-next-line camelcase
        const for0_0For1Task0Json = await fs.readJson(path.resolve(projectRootDir, "for0_0", "for1", "task0", componentJsonFilename));
        //eslint-disable-next-line camelcase
        const for0_0For1_0Task0Json = await fs.readJson(path.resolve(projectRootDir, "for0_0", "for1_0", "task0", componentJsonFilename));
        //eslint-disable-next-line camelcase
        const for0_0For1_1Task0Json = await fs.readJson(path.resolve(projectRootDir, "for0_0", "for1_1", "task0", componentJsonFilename));
        //eslint-disable-next-line camelcase
        const for0_1For1_0Task0Json = await fs.readJson(path.resolve(projectRootDir, "for0_1", "for1_0", "task0", componentJsonFilename));
        //eslint-disable-next-line camelcase
        const for0_1For1_1Task0Json = await fs.readJson(path.resolve(projectRootDir, "for0_1", "for1_1", "task0", componentJsonFilename));

        const finishedSchema = { required: ["state"], properties: { state: { enum: ["finished"] } } };
        const validateFinished = ajv.compile(finishedSchema);

        expect(validateFinished(projectJson)).to.be.true;
        expect(validateFinished(rootWF)).to.be.true;
        expect(validateFinished(for0Json)).to.be.true;
        expect(validateFinished(for0for1Task0Json)).to.be.true;
        expect(validateFinished(for0_0For1Task0Json)).to.be.true;
        expect(validateFinished(for0_0For1_0Task0Json)).to.be.true;
        expect(validateFinished(for0_0For1_1Task0Json)).to.be.true;
        expect(validateFinished(for0_1For1_0Task0Json)).to.be.true;
        expect(validateFinished(for0_1For1_1Task0Json)).to.be.true;
      });
    });
    describe("check ancestors prop in task component", ()=>{
      beforeEach(async ()=>{
        const for0 = await createNewComponent(projectRootDir, projectRootDir, "for", { x: 10, y: 10 });
        await updateComponentProperty(projectRootDir, for0.ID, "start", 0);
        await updateComponentProperty(projectRootDir, for0.ID, "end", 1);
        await updateComponentProperty(projectRootDir, for0.ID, "step", 1);

        const while0 = await createNewComponent(projectRootDir, path.join(projectRootDir, "for0"), "while", { x: 10, y: 10 });
        await updateComponentProperty(projectRootDir, while0.ID, "condition", "WHEEL_CURRENT_INDEX < 2");
        await createNewComponent(projectRootDir, path.join(projectRootDir, "for0", "while0"), "workflow", { x: 10, y: 10 });
        const ps0 = await createNewComponent(projectRootDir, path.join(projectRootDir, "for0", "while0", "workflow0"), "PS", { x: 10, y: 10 });
        await updateComponentProperty(projectRootDir, ps0.ID, "parameterFile", "input.txt.json");
        await fs.outputFile(path.join(projectRootDir, "for0", "while0", "workflow0", "PS0", "input.txt"), "%%KEYWORD1%%");
        const parameterSetting = {
          version: 2,
          target_file: "input.txt",
          target_param: [
            {
              target: "hoge",
              keyword: "KEYWORD1",
              type: "integer",
              min: 1,
              max: 2,
              step: 1,
              list: ""
            }
          ]
        };
        await fs.writeJson(path.join(projectRootDir, "for0", "while0", "workflow0", "PS0", "input.txt.json"), parameterSetting, { spaces: 4 });

        const foreach0 = await createNewComponent(projectRootDir, path.join(projectRootDir, "for0", "while0", "workflow0", "PS0"), "foreach", { x: 10, y: 10 });
        await updateComponentProperty(projectRootDir, foreach0.ID, "indexList", ["foo", "bar"]);

        const task0 = await createNewComponent(projectRootDir, path.join(projectRootDir, "for0", "while0", "workflow0", "PS0", "foreach0"), "task", { x: 10, y: 10 });
        await updateComponentProperty(projectRootDir, task0.ID, "script", scriptName);
        await fs.outputFile(path.join(projectRootDir, "for0", "while0", "workflow0", "PS0", "foreach0", "task0", scriptName), scriptPwd);
      });
      it("should have acestors name and type in task object", async ()=>{
        await runProject(projectRootDir);

        for (const i1 of ["for0_0", "for0_1"]) {
          for (const i2 of ["while0_0", "while0_1"]) {
            for (const i3 of ["PS0_KEYWORD1_1", "PS0_KEYWORD1_2"]) {
              for (const i4 of ["foreach0_foo", "foreach0_bar"]) {
                const taskJson = await fs.readJson(path.resolve(projectRootDir, i1, i2, "workflow0", i3, i4, "task0", componentJsonFilename));
                const schema = {
                  required: ["state", "ancestorsName", "ancestorsType"],
                  properties: {
                    state: { enum: ["finished"] },
                    ancestorsName: { type: "string", enum: [`${i1}/${i2}/workflow0/${i3}/${i4}`] },
                    ancestorsType: { type: "string", enum: ["for/while/workflow/parameterStudy/foreach"] }
                  }
                };
                const validate = ajv.compile(schema);
                expect(validate(taskJson)).to.be.true;
              }
            }
          }
        }
      });
    });
    describe("force overwrite flag in PS", ()=>{
      beforeEach(async ()=>{
        const ps0 = await createNewComponent(projectRootDir, projectRootDir, "PS", { x: 10, y: 10 });
        await updateComponentProperty(projectRootDir, ps0.ID, "parameterFile", "input.txt.json");
        await fs.outputFile(path.join(projectRootDir, "PS0", "input.txt"), "%%KEYWORD1%%");
        const parameterSetting = {
          version: 2,
          target_file: "input.txt",
          target_param: [
            {
              target: "hoge",
              keyword: "KEYWORD1",
              type: "integer",
              min: 1,
              max: 3,
              step: 1,
              list: ""
            }
          ]
        };
        await fs.writeJson(path.join(projectRootDir, "PS0", "input.txt.json"), parameterSetting, { spaces: 4 });

        const task0 = await createNewComponent(projectRootDir, path.join(projectRootDir, "PS0"), "task", { x: 10, y: 10 });
        await updateComponentProperty(projectRootDir, task0.ID, "script", scriptName);
        await fs.outputFile(path.join(projectRootDir, "PS0", "task0", scriptName), `${scriptPwd}\nexit 1\n`);

        //1st run
        await runProject(projectRootDir);
        //modify run.sh
        await fs.outputFile(path.join(projectRootDir, "PS0", "task0", scriptName), `${scriptPwd}|tee result.log\n`);
      });
      it("should not overwrite files and run project ", async ()=>{
        await runProject(projectRootDir);
        const projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
        const rootWF = await fs.readJson(path.resolve(projectRootDir, componentJsonFilename));
        const ps0Json = await fs.readJson(path.resolve(projectRootDir, "PS0", componentJsonFilename));
        const failedSchema = { required: ["state"], properties: { state: { enum: ["failed"] } } };
        const validateFailed = ajv.compile(failedSchema);

        expect(validateFailed(projectJson)).to.be.true;
        expect(validateFailed(rootWF)).to.be.true;
        expect(validateFailed(ps0Json)).to.be.true;

        expect(fs.existsSync(path.resolve(projectRootDir, "PS0_KEYWORD1_1", "result.log"))).to.be.false;
        expect(fs.existsSync(path.resolve(projectRootDir, "PS0_KEYWORD1_2", "result.log"))).to.be.false;
        expect(fs.existsSync(path.resolve(projectRootDir, "PS0_KEYWORD1_3", "result.log"))).to.be.false;
        //eslint-disable-next-line camelcase
        const ps0_1Json = await fs.readJson(path.resolve(projectRootDir, "PS0_KEYWORD1_1", "task0", componentJsonFilename));
        //eslint-disable-next-line camelcase
        const ps0_2Json = await fs.readJson(path.resolve(projectRootDir, "PS0_KEYWORD1_2", "task0", componentJsonFilename));
        //eslint-disable-next-line camelcase
        const ps0_3Json = await fs.readJson(path.resolve(projectRootDir, "PS0_KEYWORD1_3", "task0", componentJsonFilename));
        expect(validateFailed(ps0_1Json)).to.be.true;
        expect(validateFailed(ps0_2Json)).to.be.true;
        expect(validateFailed(ps0_3Json)).to.be.true;
      });
      it("should overwrite files and run project ", async ()=>{
        const ps0 = await fs.readJson(path.join(projectRootDir, "PS0", componentJsonFilename));
        await updateComponentProperty(projectRootDir, ps0.ID, "forceOverwrite", true);
        await runProject(projectRootDir);
        const projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
        const rootWF = await fs.readJson(path.resolve(projectRootDir, componentJsonFilename));
        const ps0Json = await fs.readJson(path.resolve(projectRootDir, "PS0", componentJsonFilename));
        const finishedSchema = { required: ["state"], properties: { state: { enum: ["finished"] } } };
        const validateFinished = ajv.compile(finishedSchema);

        expect(validateFinished(projectJson)).to.be.true;
        expect(validateFinished(rootWF)).to.be.true;
        expect(validateFinished(ps0Json)).to.be.true;

        //eslint-disable-next-line camelcase
        const ps0_1Json = await fs.readJson(path.resolve(projectRootDir, "PS0_KEYWORD1_1", "task0", componentJsonFilename));
        //eslint-disable-next-line camelcase
        const ps0_2Json = await fs.readJson(path.resolve(projectRootDir, "PS0_KEYWORD1_2", "task0", componentJsonFilename));
        //eslint-disable-next-line camelcase
        const ps0_3Json = await fs.readJson(path.resolve(projectRootDir, "PS0_KEYWORD1_3", "task0", componentJsonFilename));
        expect(validateFinished(ps0_1Json)).to.be.true;
        expect(validateFinished(ps0_2Json)).to.be.true;
        expect(validateFinished(ps0_3Json)).to.be.true;

        expect(fs.readFileSync(path.resolve(projectRootDir, "PS0_KEYWORD1_1", "task0", "result.log"), "utf-8")).to.equal(`${path.resolve(projectRootDir, "PS0_KEYWORD1_1", "task0")}${os.EOL}`);
        expect(fs.readFileSync(path.resolve(projectRootDir, "PS0_KEYWORD1_2", "task0", "result.log"), "utf-8")).to.equal(`${path.resolve(projectRootDir, "PS0_KEYWORD1_2", "task0")}${os.EOL}`);
        expect(fs.readFileSync(path.resolve(projectRootDir, "PS0_KEYWORD1_3", "task0", "result.log"), "utf-8")).to.equal(`${path.resolve(projectRootDir, "PS0_KEYWORD1_3", "task0")}${os.EOL}`);
      });
    });
    describe("[reproduction test] root workflow has only source and connected for loop", ()=>{
      let task0;
      let for0;
      let source0;
      beforeEach(async ()=>{
        source0 = await createNewComponent(projectRootDir, projectRootDir, "source", { x: 10, y: 10 });
        await renameOutputFile(projectRootDir, source0.ID, 0, "foo");

        for0 = await createNewComponent(projectRootDir, projectRootDir, "for", { x: 10, y: 10 });
        await updateComponentProperty(projectRootDir, for0.ID, "start", 0);
        await updateComponentProperty(projectRootDir, for0.ID, "end", 2);
        await updateComponentProperty(projectRootDir, for0.ID, "step", 1);
        await addInputFile(projectRootDir, for0.ID, "foo");

        task0 = await createNewComponent(projectRootDir, path.join(projectRootDir, for0.name), "task", { x: 10, y: 10 });
        await updateComponentProperty(projectRootDir, task0.ID, "script", scriptName);
        await addInputFile(projectRootDir, task0.ID, "foo");
        await fs.outputFile(path.join(projectRootDir, for0.name, task0.name, scriptName), "echo hoge ${WHEEL_CURRENT_INDEX} > hoge");
        await gitAdd(projectRootDir, path.join(projectRootDir, for0.name, task0.name, scriptName));

        await addFileLink(projectRootDir, source0.ID, "foo", for0.ID, "foo");
        await addFileLink(projectRootDir, for0.ID, "foo", task0.ID, "foo");
        await gitCommit(projectRootDir);
      });
      it("should run project and clean and run again", async ()=>{
        await runProject(projectRootDir);
        const finishedSchema = { required: ["state"], properties: { state: { enum: ["finished"] } } };
        const validateFinished = ajv.compile(finishedSchema);
        let projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
        expect(validateFinished(projectJson)).to.be.true;
        let rootWF = await fs.readJson(path.resolve(projectRootDir, componentJsonFilename));
        expect(validateFinished(rootWF)).to.be.true;
        let for0Json = await fs.readJson(path.resolve(projectRootDir, "for0", componentJsonFilename));
        expect(validateFinished(for0Json)).to.be.true;
        let task0Json = await fs.readJson(path.resolve(projectRootDir, "for0", "task0", componentJsonFilename));
        expect(validateFinished(task0Json)).to.be.true;

        await cleanProject(projectRootDir);
        const notStartedSchema = { required: ["state"], properties: { state: { enum: ["not-started"] } } };
        const validateNotStarted = ajv.compile(notStartedSchema);
        projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
        expect(validateNotStarted(projectJson)).to.be.true;
        rootWF = await fs.readJson(path.resolve(projectRootDir, componentJsonFilename));
        expect(validateNotStarted(rootWF)).to.be.true;
        for0Json = await fs.readJson(path.resolve(projectRootDir, "for0", componentJsonFilename));
        expect(validateNotStarted(for0Json)).to.be.true;
        task0Json = await fs.readJson(path.resolve(projectRootDir, "for0", "task0", componentJsonFilename));
        expect(validateNotStarted(task0Json)).to.be.true;

        await runProject(projectRootDir);
        projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
        expect(validateFinished(projectJson)).to.be.true;
        rootWF = await fs.readJson(path.resolve(projectRootDir, componentJsonFilename));
        expect(validateFinished(rootWF)).to.be.true;
        for0Json = await fs.readJson(path.resolve(projectRootDir, "for0", componentJsonFilename));
        expect(validateFinished(for0Json)).to.be.true;
        task0Json = await fs.readJson(path.resolve(projectRootDir, "for0", "task0", componentJsonFilename));
        expect(validateFinished(task0Json)).to.be.true;
      });
    });
    it("returns an error if the project is already running", async ()=>{
      _internal.rootDispatchers.set(projectRootDir, "dummy");
      const result = await runProject(projectRootDir);
      expect(result).to.be.an("error");
      expect(result.message).to.include("project is already running");
    });
  });
  describe("#stopProject", ()=>{
    const projectRootDir = "/test/project";
    let mockDispatcher;
    beforeEach(()=>{
      mockDispatcher = { remove: sinon.stub().resolves() };
      _internal.rootDispatchers.set(projectRootDir, mockDispatcher);
    });
    afterEach(()=>{
      sinon.restore();
      _internal.rootDispatchers.clear();
    });
    it("should remove the dispatcher, executers, transferrers, and SSH", async ()=>{
      await stopProject(projectRootDir);
      sinon.assert.calledOnce(mockDispatcher.remove);
      expect(_internal.rootDispatchers.has(projectRootDir)).to.be.false;
    });
    it("should handle the case where the dispatcher does not exist", async ()=>{
      _internal.rootDispatchers.delete(projectRootDir);
      await stopProject(projectRootDir);
      sinon.assert.notCalled(mockDispatcher.remove);
    });
  });
  describe("#cleanProject", ()=>{
    let gitResetHEADStub, gitCleanStub;
    beforeEach(()=>{
      gitResetHEADStub = sinon.stub(_internal, "gitResetHEAD");
      gitCleanStub = sinon.stub(_internal, "gitClean");
    });
    afterEach(()=>{
      sinon.restore();
    });
    it("should call gitResetHEAD and gitClean", async ()=>{
      gitResetHEADStub.resolves();
      gitCleanStub.resolves();
      await cleanProject("/test/project");
      sinon.assert.calledOnceWithExactly(gitResetHEADStub, "/test/project", undefined);
      sinon.assert.calledOnceWithExactly(gitCleanStub, "/test/project", undefined);
    });
  });
  describe("#updateProjectState", ()=>{
    let setProjectStateStub;
    beforeEach(()=>{
      setProjectStateStub = sinon.stub(_internal, "setProjectState");
    });
    afterEach(()=>{
      setProjectStateStub.restore();
    });
    it("should update project state and emit projectStateChanged event", async ()=>{
      const projectRootDir = "/test/project";
      const state = "running";
      const mockProjectJson = { state: "running" };
      setProjectStateStub.resolves(mockProjectJson);

      //Set up event emitter for this specific test project path
      const testEe = { emit: sinon.stub() };
      globalEventEmitters.set(projectRootDir, testEe);

      await updateProjectState(projectRootDir, state);
      sinon.assert.calledOnceWithExactly(setProjectStateStub, projectRootDir, state);
      sinon.assert.calledWith(testEe.emit, "projectStateChanged", mockProjectJson);

      //Clean up
      globalEventEmitters.delete(projectRootDir);
    });
    it("should update project state but not emit event if no emitter exists", async ()=>{
      const projectRootDir = "/test/project/noEmitter";
      const state = "stopped";
      const mockProjectJson = { state: "stopped" };
      setProjectStateStub.resolves(mockProjectJson);
      //Use a project path that doesn't have an emitter set up
      await updateProjectState(projectRootDir, state);
      sinon.assert.calledOnceWithExactly(setProjectStateStub, projectRootDir, state);
      //The emitter should not be called for this project path
    });
    it("should handle errors if setProjectState fails", async ()=>{
      const projectRootDir = "/test/project";
      const state = "failed";
      setProjectStateStub.rejects(new Error("Failed to update project state"));
      await expect(updateProjectState(projectRootDir, state)).to.be.rejectedWith("Failed to update project state");
      sinon.assert.calledOnceWithExactly(setProjectStateStub, projectRootDir, state);
    });
  });
});
