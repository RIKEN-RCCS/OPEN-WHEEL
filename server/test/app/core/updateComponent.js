/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";

const path = require("path");
const fs = require("fs-extra");
const { componentJsonFilename } = require("../../../app/db/db.js");

//setup test framework
const chai = require("chai");
const expect = chai.expect;
chai.use(require("sinon-chai"));
chai.use(require("chai-fs"));
chai.use(require("chai-json-schema"));
chai.use(require("deep-equal-in-any-order"));
chai.use(require("chai-as-promised"));
const sinon = require("sinon");
const rewire = require("rewire");
const { createNewProject, createNewComponent } = require("../../../app/core/projectFilesOperator.js");
const { writeComponentJson } = require("../../../app/core/componentJsonIO.js");

//testee
const { updateComponent } = require("../../../app/core/updateComponent.js");

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

describe("updateComponent", ()=>{
  describe("#removeInputFileLinkFromParent", ()=>{
    let removeInputFileLinkFromParent;
    let getComponentDirStub;
    let readComponentJsonStub;
    let writeComponentJsonStub;

    beforeEach(()=>{
      const updateComponent = rewire("../../../app/core/updateComponent.js");
      removeInputFileLinkFromParent = updateComponent.__get__("removeInputFileLinkFromParent");
      getComponentDirStub = sinon.stub();
      readComponentJsonStub = sinon.stub();
      writeComponentJsonStub = sinon.stub();
      updateComponent.__set__({
        getComponentDir: getComponentDirStub,
        readComponentJson: readComponentJsonStub,
        writeComponentJson: writeComponentJsonStub
      });
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should remove input file link from parent component", async ()=>{
      getComponentDirStub.withArgs("/projectRootDir", "dstNode", true).returns("/projectRootDir/dstNode");
      const parentJson = {
        inputFiles: [{
          name: "srcName",
          forwardTo: [{
            dstNode: "otherDstNode",
            dstName: "otherDstName"
          }]
        }]
      };
      readComponentJsonStub.withArgs("/projectRootDir").resolves(parentJson);
      await removeInputFileLinkFromParent("/projectRootDir", "srcName", "dstNode", "dstName");
      expect(writeComponentJsonStub.calledWith("/projectRootDir", "/projectRootDir", sinon.match(parentJson))).to.be.true;
    });

    it("should filter parentInputFiles", async ()=>{
      getComponentDirStub.withArgs("/projectRootDir", "dstNode", true).returns("/projectRootDir/dstNode");
      const otherInputFile = {
        name: "otherSrcName",
        forwardTo: [{
          dstNode: "dstNode",
          dstName: "dstName"
        }]
      };
      const parentJson = {
        inputFiles: [otherInputFile,
          {
            name: "srcName",
            forwardTo: [{
              dstNode: "otherDstNode",
              dstName: "otherDstName"
            }]
          }]
      };
      readComponentJsonStub.withArgs("/projectRootDir").resolves(parentJson);
      await removeInputFileLinkFromParent("/projectRootDir", "srcName", "dstNode", "dstName");
      expect(otherInputFile.forwardTo).to.have.lengthOf(1);
    });

    it("should filter forwardTo", async ()=>{
      getComponentDirStub.withArgs("/projectRootDir", "dstNode", true).returns("/projectRootDir/dstNode");
      const parentJson = {
        inputFiles: [{
          name: "srcName",
          forwardTo: [{
            dstNode: "otherDstNode",
            dstName: "otherDstName"
          },
          {
            dstNode: "dstNode",
            dstName: "dstName"
          }]
        }]
      };
      readComponentJsonStub.withArgs("/projectRootDir").resolves(parentJson);
      await removeInputFileLinkFromParent("/projectRootDir", "srcName", "dstNode", "dstName");
      expect(parentJson.inputFiles[0].forwardTo).to.have.lengthOf(1);
    });
  });

  describe("#removeOutputFileLinkFromParent", ()=>{
    let removeOutputFileLinkToParent;
    let getComponentDirStub;
    let readComponentJsonStub;
    let writeComponentJsonStub;

    beforeEach(()=>{
      const updateComponent = rewire("../../../app/core/updateComponent.js");
      removeOutputFileLinkToParent = updateComponent.__get__("removeOutputFileLinkToParent");
      getComponentDirStub = sinon.stub();
      readComponentJsonStub = sinon.stub();
      writeComponentJsonStub = sinon.stub();
      updateComponent.__set__({
        getComponentDir: getComponentDirStub,
        readComponentJson: readComponentJsonStub,
        writeComponentJson: writeComponentJsonStub
      });
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should remove output file link from parent component", async ()=>{
      getComponentDirStub.withArgs("/projectRootDir", "srcNode", true).returns("/projectRootDir/srcNode");
      const parentJson = {
        outputFiles: [{
          name: "dstName",
          origin: [{
            srcNode: "otherSrcNode",
            srcName: "otherSrcName"
          }]
        }]
      };
      readComponentJsonStub.withArgs("/projectRootDir").resolves(parentJson);
      await removeOutputFileLinkToParent("/projectRootDir", "srcNode", "srcName", "dstName");
      expect(writeComponentJsonStub.calledWith("/projectRootDir", "/projectRootDir", sinon.match(parentJson))).to.be.true;
    });

    it("should filter parentOutputFiles", async ()=>{
      getComponentDirStub.withArgs("/projectRootDir", "srcNode", true).returns("/projectRootDir/srcNode");
      const otherOutputFile = {
        name: "otherDstName",
        origin: [{
          srcNode: "srcNode",
          srcName: "srcName"
        }]
      };
      const parentJson = {
        outputFiles: [otherOutputFile,
          {
            name: "dstName",
            origin: [{
              srcNode: "otherSrcNode",
              srcName: "otherSrcName"
            }]
          }]
      };
      readComponentJsonStub.withArgs("/projectRootDir").resolves(parentJson);
      await removeOutputFileLinkToParent("/projectRootDir", "srcNode", "srcName", "dstName");
      expect(otherOutputFile.origin).to.have.lengthOf(1);
    });

    it("should filter origin", async ()=>{
      getComponentDirStub.withArgs("/projectRootDir", "srcNode", true).returns("/projectRootDir/srcNode");
      const parentJson = {
        outputFiles: [{
          name: "dstName",
          origin: [{
            srcNode: "otherSrcNode",
            srcName: "otherSrcName"
          },
          {
            srcNode: "srcNode",
            srcName: "srcName"
          }]
        }]
      };
      readComponentJsonStub.withArgs("/projectRootDir").resolves(parentJson);
      await removeOutputFileLinkToParent("/projectRootDir", "srcNode", "srcName", "dstName");
      expect(parentJson.outputFiles[0].origin).to.have.lengthOf(1);
    });
  });

  describe("#removeInputFileLinkFromSiblings", ()=>{
    let removeInputFileLinkFromSiblings;
    let getComponentDirStub;
    let readComponentJsonStub;
    let writeComponentJsonStub;

    beforeEach(()=>{
      const updateComponent = rewire("../../../app/core/updateComponent.js");
      removeInputFileLinkFromSiblings = updateComponent.__get__("removeInputFileLinkFromSiblings");
      getComponentDirStub = sinon.stub();
      readComponentJsonStub = sinon.stub();
      writeComponentJsonStub = sinon.stub();
      updateComponent.__set__({
        getComponentDir: getComponentDirStub,
        readComponentJson: readComponentJsonStub,
        writeComponentJson: writeComponentJsonStub
      });
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should remove input file link from siblings", async ()=>{
      getComponentDirStub.withArgs("/projectRootDir", "srcNode", true).returns("/projectRootDir/srcNode");
      const srcJson = {
        outputFiles: [{
          name: "srcName",
          dst: [{
            dstNode: "dstNode",
            dstName: "dstName"
          }]
        }]
      };
      readComponentJsonStub.withArgs("/projectRootDir/srcNode").resolves(srcJson);
      await removeInputFileLinkFromSiblings("/projectRootDir", "srcNode", "srcName", "dstNode", "dstName");
      expect(writeComponentJsonStub.calledWith("/projectRootDir", "/projectRootDir/srcNode", sinon.match(srcJson))).to.be.true;
    });

    it("should filter outputFiles", async ()=>{
      getComponentDirStub.withArgs("/projectRootDir", "srcNode", true).returns("/projectRootDir/srcNode");
      const otherOutputFile = {
        name: "otherSrcNode",
        dst: [{
          dstNode: "dstNode",
          dstName: "dstName"
        }]
      };
      const srcJson = {
        outputFiles: [otherOutputFile, {
          name: "srcName",
          dst: [{
            dstNode: "otherDstNode",
            dstName: "otherDstName"
          }]
        }]
      };
      readComponentJsonStub.withArgs("/projectRootDir/srcNode").resolves(srcJson);
      await removeInputFileLinkFromSiblings("/projectRootDir", "srcNode", "srcName", "dstNode", "dstName");
      expect(otherOutputFile.dst).to.have.lengthOf(1);
    });

    it("should filter dst", async ()=>{
      getComponentDirStub.withArgs("/projectRootDir", "srcNode", true).returns("/projectRootDir/srcNode");
      const dstJson = {
        outputFiles: [{
          name: "srcName",
          dst: [{
            dstNode: "otherDstNode",
            dstName: "otherDstName"
          },
          {
            dstNode: "dstNode",
            dstName: "dstName"
          }]
        }]
      };
      readComponentJsonStub.withArgs("/projectRootDir/srcNode").resolves(dstJson);
      await removeInputFileLinkFromSiblings("/projectRootDir", "srcNode", "srcName", "dstNode", "dstName");
      expect(dstJson.outputFiles[0].dst).to.have.lengthOf(1);
    });
  });

  describe("#removeOutputFileLinkToSiblings", ()=>{
    let removeOutputFileLinkToSiblings;
    let getComponentDirStub;
    let readComponentJsonStub;
    let writeComponentJsonStub;

    beforeEach(()=>{
      const updateComponent = rewire("../../../app/core/updateComponent.js");
      removeOutputFileLinkToSiblings = updateComponent.__get__("removeOutputFileLinkToSiblings");
      getComponentDirStub = sinon.stub();
      readComponentJsonStub = sinon.stub();
      writeComponentJsonStub = sinon.stub();
      updateComponent.__set__({
        getComponentDir: getComponentDirStub,
        readComponentJson: readComponentJsonStub,
        writeComponentJson: writeComponentJsonStub
      });
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should remove output file link to siblings", async ()=>{
      getComponentDirStub.withArgs("/projectRootDir", "dstNode", true).returns("/projectRootDir/dstNode");
      const dstJson = {
        inputFiles: [{
          name: "dstName",
          src: [{
            srcNode: "srcNode",
            srcName: "srcName"
          }]
        }]
      };
      readComponentJsonStub.withArgs("/projectRootDir/dstNode").resolves(dstJson);
      await removeOutputFileLinkToSiblings("/projectRootDir", "srcNode", "srcName", "dstNode", "dstName");
      expect(writeComponentJsonStub.calledWith("/projectRootDir", "/projectRootDir/dstNode", sinon.match(dstJson))).to.be.true;
    });

    it("should filter inputFiles", async ()=>{
      getComponentDirStub.withArgs("/projectRootDir", "dstNode", true).returns("/projectRootDir/dstNode");
      const otherInputFile = {
        name: "otherDstName",
        src: [{
          srcNode: "srcNode",
          srcName: "srcName"
        }]
      };
      const dstJson = {
        inputFiles: [otherInputFile, {
          name: "dstName",
          src: [{
            srcNode: "otherSrcNode",
            srcName: "otherSrcName"
          }]
        }]
      };
      readComponentJsonStub.withArgs("/projectRootDir/dstNode").resolves(dstJson);
      await removeOutputFileLinkToSiblings("/projectRootDir", "srcNode", "srcName", "dstNode", "dstName");
      expect(otherInputFile.src).to.have.lengthOf(1);
    });

    it("should filter src", async ()=>{
      getComponentDirStub.withArgs("/projectRootDir", "dstNode", true).returns("/projectRootDir/dstNode");
      const dstJson = {
        inputFiles: [{
          name: "dstName",
          src: [{
            srcNode: "otherSrcNode",
            srcName: "otherSrcName"
          },
          {
            srcNode: "srcNode",
            srcName: "srcName"
          }]
        }]
      };
      readComponentJsonStub.withArgs("/projectRootDir/dstNode").resolves(dstJson);
      await removeOutputFileLinkToSiblings("/projectRootDir", "srcNode", "srcName", "dstNode", "dstName");
      expect(dstJson.inputFiles[0].src).to.have.lengthOf(1);
    });
  });

  describe("#removeInputFileCounterpart", ()=>{
    let removeInputFileCounterpart;
    let removeInputFileLinkFromParentStub;
    let removeInputFileLinkFromSiblingsStub;

    beforeEach(()=>{
      const updateComponent = rewire("../../../app/core/updateComponent.js");
      removeInputFileCounterpart = updateComponent.__get__("removeInputFileCounterpart");
      removeInputFileLinkFromParentStub = sinon.stub();
      removeInputFileLinkFromSiblingsStub = sinon.stub();
      updateComponent.__set__({
        removeInputFileLinkFromParent: removeInputFileLinkFromParentStub,
        removeInputFileLinkFromSiblings: removeInputFileLinkFromSiblingsStub
      });
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should remove input file link from counterpart", async ()=>{
      const componentJson = {
        ID: "id",
        parent: "parentName",
        inputFiles: [{},
          {
            name: "srcName",
            src: [{
              srcNode: "parent",
              srcName: "srcName1"
            },
            {
              srcNode: "parentName",
              srcName: "srcName2"
            },
            {
              srcNode: "siblings",
              srcName: "srcName3"
            }]
          }]
      };
      await removeInputFileCounterpart("/projectRootDir", componentJson, 1);
      expect(removeInputFileLinkFromParentStub.calledTwice).to.be.true;
      expect(removeInputFileLinkFromParentStub.calledWith("/projectRootDir", "srcName1", "id", "srcName")).to.be.true;
      expect(removeInputFileLinkFromParentStub.calledWith("/projectRootDir", "srcName2", "id", "srcName")).to.be.true;
      expect(removeInputFileLinkFromSiblingsStub.calledOnce).to.be.true;
      expect(removeInputFileLinkFromSiblingsStub.calledWith("/projectRootDir", "siblings", "srcName3", "id", "srcName")).to.be.true;
    });

    it("should resolve if the all removing operation is successful", async ()=>{
      removeInputFileLinkFromParentStub.resolves();
      removeInputFileLinkFromSiblingsStub.resolves();
      const componentJson = {
        ID: "id",
        parent: "parentName",
        inputFiles: [{},
          {
            name: "srcName",
            src: [{
              srcNode: "parent",
              srcName: "srcName1"
            },
            {
              srcNode: "siblings",
              srcName: "srcName3"
            }]
          }]
      };
      const ret = removeInputFileCounterpart("/projectRootDir", componentJson, 1);
      await expect(ret).to.be.fulfilled;
    });

    it("should reject if one or more delete operations is failed", async ()=>{
      removeInputFileLinkFromParentStub.resolves();
      removeInputFileLinkFromSiblingsStub.rejects();
      const componentJson = {
        ID: "id",
        parent: "parentName",
        inputFiles: [{},
          {
            name: "srcName",
            src: [{
              srcNode: "parent",
              srcName: "srcName1"
            },
            {
              srcNode: "siblings",
              srcName: "srcName3"
            }]
          }]
      };
      const ret = removeInputFileCounterpart("/projectRootDir", componentJson, 1);
      await expect(ret).to.be.rejected;
    });

    it("should resolve if there is no counterpart", async ()=>{
      const componentJson = {
        ID: "id",
        parent: "parentName",
        inputFiles: [{},
          {
            name: "srcName",
            src: []
          }]
      };
      const ret = removeInputFileCounterpart("/projectRootDir", componentJson, 1);
      await expect(ret).to.be.fulfilled;
    });
  });

  describe("#removeOutputFileCounterpart", ()=>{
    let removeOutputFileCounterpart;
    let removeOutputFileLinkToParentStub;
    let removeOutputFileLinkToSiblingsStub;

    beforeEach(()=>{
      const updateComponent = rewire("../../../app/core/updateComponent.js");
      removeOutputFileCounterpart = updateComponent.__get__("removeOutputFileCounterpart");
      removeOutputFileLinkToParentStub = sinon.stub();
      removeOutputFileLinkToSiblingsStub = sinon.stub();
      updateComponent.__set__({
        removeOutputFileLinkToParent: removeOutputFileLinkToParentStub,
        removeOutputFileLinkToSiblings: removeOutputFileLinkToSiblingsStub
      });
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should remove output file link from counterpart", async ()=>{
      const componentJson = {
        ID: "id",
        parent: "parentName",
        outputFiles: [{},
          {
            name: "dstName",
            dst: [{
              dstNode: "parent",
              dstName: "dstName1"
            },
            {
              dstNode: "parentName",
              dstName: "dstName2"
            },
            {
              dstNode: "siblings",
              dstName: "dstName3"
            }]
          }]
      };
      await removeOutputFileCounterpart("/projectRootDir", componentJson, 1);
      expect(removeOutputFileLinkToParentStub.calledTwice).to.be.true;
      expect(removeOutputFileLinkToParentStub.calledWith("/projectRootDir", "id", "dstName", "dstName1")).to.be.true;
      expect(removeOutputFileLinkToParentStub.calledWith("/projectRootDir", "id", "dstName", "dstName2")).to.be.true;
      expect(removeOutputFileLinkToSiblingsStub.calledOnce).to.be.true;
      expect(removeOutputFileLinkToSiblingsStub.calledWith("/projectRootDir", "id", "dstName", "siblings", "dstName3")).to.be.true;
    });

    it("should resolve if the all removing operation is successful", async ()=>{
      removeOutputFileLinkToParentStub.resolves();
      removeOutputFileLinkToSiblingsStub.resolves();
      const componentJson = {
        ID: "id",
        parent: "parentName",
        outputFiles: [{},
          {
            name: "dstName",
            dst: [{
              dstNode: "parent",
              dstName: "dstName1"
            },
            {
              dstNode: "siblings",
              dstName: "dstName3"
            }]
          }]
      };
      const ret = removeOutputFileCounterpart("/projectRootDir", componentJson, 1);
      await expect(ret).to.be.fulfilled;
    });

    it("should reject if one or more delete operations is failed", async ()=>{
      removeOutputFileLinkToParentStub.resolves();
      removeOutputFileLinkToSiblingsStub.rejects();
      const componentJson = {
        ID: "id",
        parent: "parentName",
        outputFiles: [{},
          {
            name: "dstName",
            dst: [{
              dstNode: "parent",
              dstName: "dstName1"
            },
            {
              dstNode: "siblings",
              dstName: "dstName3"
            }]
          }]
      };
      const ret = removeOutputFileCounterpart("/projectRootDir", componentJson, 1);
      await expect(ret).to.be.rejected;
    });

    it("should resolve if there is no counterpart", async ()=>{
      const componentJson = {
        ID: "id",
        parent: "parentName",
        outputFiles: [{},
          {
            name: "dstName",
            dst: []
          }]
      };
      const ret = removeOutputFileCounterpart("/projectRootDir", componentJson, 1);
      await expect(ret).to.be.fulfilled;
    });
  });

  describe("#renameComponentDir", ()=>{
    let renameComponentDir;
    let getComponentDirStub;
    let gitRmStub;
    let moveStub;
    let updateComponentPathStub;

    beforeEach(()=>{
      const updateComponent = rewire("../../../app/core/updateComponent.js");
      renameComponentDir = updateComponent.__get__("renameComponentDir");
      getComponentDirStub = sinon.stub();
      gitRmStub = sinon.stub();
      moveStub = sinon.stub();
      updateComponentPathStub = sinon.stub();
      updateComponent.__set__({
        getComponentDir: getComponentDirStub,
        gitRm: gitRmStub,
        updateComponentPath: updateComponentPathStub,
        fs: {
          move: moveStub
        }
      });
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should rename component directory", async ()=>{
      getComponentDirStub.withArgs("/projectRootDir", "id", true).returns("/projectRootDir/id/oldName");
      gitRmStub.withArgs("/projectRootDir", "/projectRootDir/id/oldName").resolves();
      moveStub.withArgs("/projectRootDir/id/oldName", "/projectRootDir/id/newName").resolves();
      updateComponentPathStub.withArgs("/projectRootDir", "id", "newName").resolves();
      await expect(renameComponentDir("/projectRootDir", "id", "/projectRootDir/id/newName")).to.be.fulfilled;
      expect(gitRmStub.calledWith("/projectRootDir", "/projectRootDir/id/oldName")).to.be.true;
      expect(moveStub.calledWith("/projectRootDir/id/oldName", "/projectRootDir/id/newName")).to.be.true;
      expect(updateComponentPathStub.calledWith("/projectRootDir", "id", "/projectRootDir/id/newName")).to.be.true;
    });

    it("should reject if the project root dir is same as the component dir", async ()=>{
      getComponentDirStub.withArgs("/projectRootDir", "id", true).returns("/projectRootDir");
      await expect(renameComponentDir("/projectRootDir", "id", "newName")).to.be.rejected;
    });
  });

  describe("#updateComponentPos", ()=>{
    let updateComponentPos;
    let getLoggerStub;
    let debugStub;
    let warnStub;
    let getComponentDirStub;
    let readComponentJsonStub;
    let writeComponentJsonStub;

    beforeEach(()=>{
      const updateComponent = rewire("../../../app/core/updateComponent.js");
      updateComponentPos = updateComponent.__get__("updateComponentPos");
      getLoggerStub = sinon.stub();
      debugStub = sinon.stub();
      warnStub = sinon.stub();
      getComponentDirStub = sinon.stub();
      readComponentJsonStub = sinon.stub();
      writeComponentJsonStub = sinon.stub();

      updateComponent.__set__({
        getLogger: getLoggerStub,
        getComponentDir: getComponentDirStub,
        readComponentJson: readComponentJsonStub,
        writeComponentJson: writeComponentJsonStub
      });
      getLoggerStub.returns({
        debug: debugStub,
        warn: warnStub
      });
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should update component position", async ()=>{
      getComponentDirStub.withArgs("/projectRootDir", "id", true).returns("/projectRootDir/id");
      const componentJson = {
        pos: {
          x: 0,
          y: 0
        }
      };
      readComponentJsonStub.withArgs("/projectRootDir/id").resolves(componentJson);
      await updateComponentPos("/projectRootDir", "id", { x: 1, y: 2 });
      expect(writeComponentJsonStub.calledWith("/projectRootDir", "/projectRootDir/id", sinon.match({ pos: { x: 1, y: 2 } }))).to.be.true;
    });
  });
});
