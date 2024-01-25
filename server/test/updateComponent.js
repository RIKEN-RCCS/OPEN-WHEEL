/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path = require("path");
const fs = require("fs-extra");
const { componentJsonFilename } = require("../app/db/db");

//setup test framework
const chai = require("chai");
const expect = chai.expect;
chai.use(require("sinon-chai"));
chai.use(require("chai-fs"));
chai.use(require("chai-json-schema"));
chai.use(require("deep-equal-in-any-order"));
const { createNewProject, createNewComponent, writeComponentJson } = require("../app/core/projectFilesOperator");

//testee
const { updateComponent } = require("../app/core/updateComponent.js");

//test data
const testDirRoot = "WHEEL_TEST_TMP";

describe("updateComponent UT", function () {
  const projectRootDir = path.resolve(testDirRoot, "testProject.wheel");
  let task0;
  let task1;
  beforeEach(async function () {
    this.timeout(5000);
    await fs.remove(testDirRoot);

    try {
      await createNewProject(projectRootDir, "test project", null, "test", "test@example.com");
    } catch (e) {
      console.log(e);
      throw e;
    }
  });
  after(async ()=>{
    if (!process.env.WHEEL_KEEP_FILES_AFTER_LAST_TEST) {
      await fs.remove(testDirRoot);
    }
  });
  describe("updateComponent() test on task component", async ()=>{
    beforeEach(async ()=>{
      task0 = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 0, y: 0 });
      task1 = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 0, y: 0 });
      task0.outputFiles.push({ name: "foo", dst: [{ dstNode: task1.ID, dstName: "bar" }] });
      task1.inputFiles.push({ name: "bar", src: [{ srcNode: task0.ID, srcName: "foo" }] });
      task0.next.push(task1.ID);
      task1.previous.push(task0.ID);
      await writeComponentJson(projectRootDir, path.join(projectRootDir, task0.name), task0);
      await writeComponentJson(projectRootDir, path.join(projectRootDir, task1.name), task1);
    });
    it("should change multiple value", async ()=>{
      const updated = structuredClone(task0);
      updated.description = "hoge";
      updated.script = "run.sh";
      await updateComponent(projectRootDir, task0.ID, updated);
      const readFromFile = await fs.readJson(path.join(projectRootDir, task0.name, componentJsonFilename));
      expect(readFromFile).not.to.equal(task0);
      expect(readFromFile).to.deep.equal(updated);
      expect(readFromFile.description).to.equal("hoge");
      expect(readFromFile.script).to.equal("run.sh");
    });
    it("should change to default value if some property is dropped", async ()=>{
      const updated = structuredClone(task0);
      updated.description = "hoge";
      delete updated.script;
      await updateComponent(projectRootDir, task0.ID, updated);
      const readFromFile = await fs.readJson(path.join(projectRootDir, task0.name, componentJsonFilename));
      expect(readFromFile).not.to.deep.equal(task0);
      expect(readFromFile).to.deep.equal(updated); //readFromFile.script seems not to be checked here
      expect(readFromFile.description).to.equal(updated.description);
      expect(readFromFile.script).to.equal(null);
    });
    it("should change name and directory", async ()=>{
      const updated = structuredClone(task0);
      updated.name = "hoge";
      await updateComponent(projectRootDir, task0.ID, updated);
      const readFromFile = await fs.readJson(path.join(projectRootDir, updated.name, componentJsonFilename));
      expect(readFromFile).not.to.equal(task0);
      expect(readFromFile).to.deep.equal(updated);
      expect(readFromFile.name).to.equal(updated.name);
    });
    it("should not change if updated JSON is not valid component", async ()=>{
      const updated = structuredClone(task0);
      updated.description = ["hoge"];

      //check if updateComponent throw error for invalid JSON data
      try {
        await updateComponent(projectRootDir, task0.ID, updated);
      } catch (e) {
        expect(e.message).to.equal("invalid JSON specified");
      }
      const readFromFile = await fs.readJson(path.join(projectRootDir, task0.name, componentJsonFilename));
      expect(readFromFile).to.deep.equal(task0);
      expect(readFromFile).not.to.deep.equal(updated);
      expect(readFromFile.description).to.equal(null);
    });

    it("should not change type", async ()=>{
      const updated = structuredClone(task0);
      updated.type = "workflow";

      try {
        await updateComponent(projectRootDir, task0.ID, updated);
      } catch (e) {
        expect(e.message).to.equal("updateComponent can not change component's type");
      }
      const readFromFile = await fs.readJson(path.join(projectRootDir, task0.name, componentJsonFilename));
      expect(readFromFile).to.deep.equal(task0);
      expect(readFromFile).not.to.deep.equal(updated);
      expect(readFromFile.type).to.equal("task");
    });
    it("should add inputFile", async ()=>{
      const updated = structuredClone(task0);
      updated.inputFiles.push({ name: "hoge", src: [] });
      await updateComponent(projectRootDir, task0.ID, updated);
      const readFromFile = await fs.readJson(path.join(projectRootDir, task0.name, componentJsonFilename));
      expect(readFromFile).to.deep.equal(updated);
      expect(readFromFile).not.to.deep.equal(task0);
      expect(readFromFile.inputFiles).to.have.lengthOf(1);
      expect(readFromFile.inputFiles[0].name).to.equal("hoge");
      expect(readFromFile.inputFiles[0].src).to.be.an("array").that.is.empty;
    });
    it("should remove inputFile", async ()=>{
      const updated = structuredClone(task1);
      updated.inputFiles = [];
      await updateComponent(projectRootDir, task1.ID, updated);
      const readFromFile = await fs.readJson(path.join(projectRootDir, task1.name, componentJsonFilename));
      expect(readFromFile).to.deep.equal(updated);
      expect(readFromFile).not.to.deep.equal(task1);
      expect(readFromFile.inputFiles).to.be.an("array").that.is.empty;
      const task0FromFile = await fs.readJson(path.join(projectRootDir, task0.name, componentJsonFilename));
      expect(task0FromFile.outputFiles[0].dst).to.be.an("array").that.is.empty;
    });
    it("should change inputFiles' name", async ()=>{
      const updated = structuredClone(task1);
      updated.inputFiles[0].name = "hoge";
      await updateComponent(projectRootDir, task1.ID, updated);
      const readFromFile = await fs.readJson(path.join(projectRootDir, task1.name, componentJsonFilename));
      expect(readFromFile).to.deep.equal(updated);
      expect(readFromFile).not.to.deep.equal(task1);
      expect(readFromFile.inputFiles[0].name).to.be.equal("hoge");
      const task0FromFile = await fs.readJson(path.join(projectRootDir, task0.name, componentJsonFilename));
      expect(task0FromFile.outputFiles[0].dst[0].dstName).to.be.equal("hoge");
    });
    it("should not change inputFiles/srcNode", async ()=>{
      const updated = structuredClone(task1);
      updated.inputFiles[0].src[0].srcNode = "hoge";

      try {
        await updateComponent(projectRootDir, task1.ID, updated);
      } catch (e) {
        console.log("updateComponent throw error", e);
        throw e;
      }
      const readFromFile = await fs.readJson(path.join(projectRootDir, task1.name, componentJsonFilename));
      expect(readFromFile).to.deep.equal(task1);
    });
    it("should not change inputFiles/srcName", async ()=>{
      const updated = structuredClone(task1);
      updated.inputFiles[0].src[0].srcName = "hoge";

      try {
        await updateComponent(projectRootDir, task1.ID, updated);
      } catch (e) {
        console.log("updateComponent throw error", e);
        throw e;
      }
      const readFromFile = await fs.readJson(path.join(projectRootDir, task1.name, componentJsonFilename));
      expect(readFromFile).to.deep.equal(task1);
    });
    it("should add outputFile", async ()=>{
      const updated = structuredClone(task1);
      updated.outputFiles.push({ name: "hoge", dst: [] });
      await updateComponent(projectRootDir, task1.ID, updated);
      const readFromFile = await fs.readJson(path.join(projectRootDir, task1.name, componentJsonFilename));
      expect(readFromFile).to.deep.equal(updated);
      expect(readFromFile).not.to.deep.equal(task1);
      expect(readFromFile.outputFiles).to.have.lengthOf(1);
      expect(readFromFile.outputFiles[0].name).to.equal("hoge");
      expect(readFromFile.outputFiles[0].dst).to.be.an("array").that.is.empty;
    });
    it("should remove outputFile", async ()=>{
      const updated = structuredClone(task0);
      updated.outputFiles = [];
      await updateComponent(projectRootDir, task0.ID, updated);
      const readFromFile = await fs.readJson(path.join(projectRootDir, task0.name, componentJsonFilename));
      expect(readFromFile).to.deep.equal(updated);
      expect(readFromFile).not.to.deep.equal(task0);
      expect(readFromFile.outputFiles).to.be.an("array").that.is.empty;
      const task1FromFile = await fs.readJson(path.join(projectRootDir, task1.name, componentJsonFilename));
      expect(task1FromFile.inputFiles[0].src).to.be.an("array").that.is.empty;
    });
    it("should change outputFiles' name", async ()=>{
      const updated = structuredClone(task0);
      updated.outputFiles[0].name = "hoge";
      await updateComponent(projectRootDir, task0.ID, updated);
      const readFromFile = await fs.readJson(path.join(projectRootDir, task0.name, componentJsonFilename));
      expect(readFromFile).to.deep.equal(updated);
      expect(readFromFile).not.to.deep.equal(task0);
      expect(readFromFile.outputFiles[0].name).to.be.equal("hoge");
      const task1FromFile = await fs.readJson(path.join(projectRootDir, task1.name, componentJsonFilename));
      expect(task1FromFile.inputFiles[0].src[0].srcName).to.be.equal("hoge");
    });
    it("should not change outputFiles/dstNode", async ()=>{
      const updated = structuredClone(task0);
      updated.outputFiles[0].dst[0].dstNode = "hoge";

      try {
        await updateComponent(projectRootDir, task0.ID, updated);
      } catch (e) {
        console.log("updateComponent throw error", e);
        throw e;
      }
      const readFromFile = await fs.readJson(path.join(projectRootDir, task0.name, componentJsonFilename));
      expect(readFromFile).to.deep.equal(task0);
    });
    it("should not change outputFiles/dstName", async ()=>{
      const updated = structuredClone(task0);
      updated.outputFiles[0].dst[0].dstName = "hoge";

      try {
        await updateComponent(projectRootDir, task0.ID, updated);
      } catch (e) {
        console.log("updateComponent throw error", e);
        throw e;
      }
      const readFromFile = await fs.readJson(path.join(projectRootDir, task0.name, componentJsonFilename));
      expect(readFromFile).to.deep.equal(task0);
    });
    it("should not change next' member", async ()=>{
      const updated = structuredClone(task1);
      updated.next.push(task0.ID);
      await updateComponent(projectRootDir, task1.ID, updated);
      const readFromFile = await fs.readJson(path.join(projectRootDir, task1.name, componentJsonFilename));
      expect(readFromFile).to.deep.equal(task1);
      expect(readFromFile).not.to.deep.equal(updated);
      expect(readFromFile.next).to.be.an("array").that.is.empty;
    });
    it("should not change previous' member", async ()=>{
      const updated = structuredClone(task0);
      updated.previous.push(task1.ID);
      await updateComponent(projectRootDir, task0.ID, updated);
      const readFromFile = await fs.readJson(path.join(projectRootDir, task0.name, componentJsonFilename));
      expect(readFromFile).to.deep.equal(task0);
      expect(readFromFile).not.to.deep.equal(updated);
      expect(readFromFile.previous).to.be.an("array").that.is.empty;
    });
  });
  describe("updateComponent() test on various component", ()=>{
    let targetComponent;
    ["task", "workflow", "PS", "if", "for", "while", "foreach", "storage", "source", "viewer", "stepjob", "stepjobTask", "bulkjobTask"]
      .forEach((type)=>{
        it(`should do nothing if file and specified ${type} component is not differ`, async ()=>{
          targetComponent = await createNewComponent(projectRootDir, projectRootDir, type, { x: 0, y: 0 });
          const updated = structuredClone(targetComponent);
          try {
            await updateComponent(projectRootDir, targetComponent.ID, updated);
          } catch (e) {
            console.log("updateComponent throw error", type, e);
            throw e;
          }
          const readFromFile = await fs.readJson(path.join(projectRootDir, targetComponent.name, componentJsonFilename));
          expect(readFromFile).to.deep.equal(targetComponent);
        });
        it(`should change description of ${type} component`, async ()=>{
          targetComponent = await createNewComponent(projectRootDir, projectRootDir, type, { x: 0, y: 0 });
          const updated = structuredClone(targetComponent);
          updated.description = "hoge";

          try {
            await updateComponent(projectRootDir, targetComponent.ID, updated);
          } catch (e) {
            console.log("updateComponent throw error", type, e);
            throw e;
          }
          const readFromFile = await fs.readJson(path.join(projectRootDir, targetComponent.name, componentJsonFilename));
          expect(readFromFile).not.to.equal(targetComponent);
          expect(readFromFile).to.deep.equal(updated);
          expect(readFromFile.description).to.equal("hoge");
        });
      });
  });
  describe("updateComponent() test on source component", ()=>{
    let source;
    beforeEach(async ()=>{
      source = await createNewComponent(projectRootDir, projectRootDir, "source", { x: 0, y: 0 });
    });
    it("should set uploadOnDemand true and add outputFiles if not exists", async ()=>{
      const updated = structuredClone(source);
      updated.uploadOnDemand = true;

      try {
        await updateComponent(projectRootDir, source.ID, updated);
      } catch (e) {
        console.log("updateComponent throw error", e);
        throw e;
      }
      const readFromFile = await fs.readJson(path.join(projectRootDir, source.name, componentJsonFilename));
      expect(readFromFile).not.to.equal(source);
      expect(readFromFile).not.to.equal(updated);
      expect(readFromFile.uploadOnDemand).to.be.true;
      expect(readFromFile.outputFiles).to.have.lengthOf(1);
      expect(readFromFile.outputFiles[0].name).to.be.equal("UPLOAD_ONDEMAND");
    });
    it("should set uploadOnDemand false and change outputFiles", async ()=>{
      const updated = structuredClone(source);
      updated.uploadOnDemand = false;

      try {
        await updateComponent(projectRootDir, source.ID, updated);
      } catch (e) {
        console.log("updateComponent throw error", e);
        throw e;
      }
      const readFromFile = await fs.readJson(path.join(projectRootDir, source.name, componentJsonFilename));
      expect(readFromFile).not.to.equal(source);
      expect(readFromFile).not.to.equal(updated);
      expect(readFromFile.uploadOnDemand).to.be.false;
      expect(readFromFile.outputFiles).to.have.lengthOf(1);
      expect(readFromFile.outputFiles[0].name).to.be.equal("");
    });
    it("should set outputFiles name and set uploadOnDemand to false", async ()=>{
      const updated = structuredClone(source);
      updated.outputFiles[0].name = "hoge";

      source.uploadOnDemand = true;
      await writeComponentJson(projectRootDir, path.join(projectRootDir, source.name), source);

      try {
        await updateComponent(projectRootDir, source.ID, updated);
      } catch (e) {
        console.log("updateComponent throw error", e);
        throw e;
      }
      const readFromFile = await fs.readJson(path.join(projectRootDir, source.name, componentJsonFilename));
      expect(readFromFile).not.to.equal(source);
      expect(readFromFile).not.to.equal(updated);
      expect(readFromFile.uploadOnDemand).to.be.false;
      expect(readFromFile.outputFiles).to.have.lengthOf(1);
      expect(readFromFile.outputFiles[0].name).to.be.equal("hoge");
    });
  });
});
