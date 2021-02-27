"use strict";
const path = require("path");
const fs = require("fs-extra");
const os = require("os");

//setup test framework
const chai = require("chai");
const expect = chai.expect;
const sinon = require("sinon");
chai.use(require("sinon-chai"));
chai.use(require("chai-fs"));
chai.use(require("chai-json-schema"));

//testee
const Dispatcher = require("../../../app/core/dispatcher");

//test data
const testDirRoot = "WHEEL_TEST_TMP";
const projectRootDir = path.resolve(testDirRoot, "testProject.wheel");

//helper functions
const { projectJsonFilename, componentJsonFilename, statusFilename } = require("../../../app/db/db");
const { createNewProject } = require("../../../app/core/projectFilesOperator");
const { updateComponent, createNewComponent, addInputFile, addOutputFile, addLink, addFileLink } = require("../../../app/core/componentFilesOperator");

const { scriptName, pwdCmd, scriptHeader, referenceEnv, exit } = require("./testScript");
const scriptPwd = `${scriptHeader}\n${pwdCmd}`;
const { escapeRegExp } = require("../../../app/lib/utility");

const stub = sinon.stub();
const debugLogger = {
  error: sinon.stub(),
  warn: sinon.stub(),
  info: sinon.stub(),
  debug: sinon.stub(),
  trace: sinon.stub()
};

const wait = (sec)=>{
  return new Promise((resolve)=>{
    setTimeout(resolve, sec * 1000);
    //setTimeout(() => {reject(new Error("エラー！"))}, sec*1000);
  });
};

describe("UT for Dispatcher class", function() {
  this.timeout(0);
  let rootWF;
  let projectJson;
  beforeEach(async()=>{
    await fs.remove(testDirRoot);
    await createNewProject(projectRootDir, "test project", null, "test", "test@example.com");
    rootWF = await fs.readJson(path.resolve(projectRootDir, componentJsonFilename));
  });
  after(async()=>{
    await fs.remove(testDirRoot);
  });

  describe("#outputFile delivery functionality", async()=>{
    let previous;
    let next;
    beforeEach(async()=>{
      previous = await createNewComponent(projectRootDir, projectRootDir, "workflow", { x: 10, y: 10 });
      next = await createNewComponent(projectRootDir, projectRootDir, "workflow", { x: 10, y: 10 });
      projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
    });
    it("should make link from outputFile to inputFile", async()=>{
      await addOutputFile(projectRootDir, previous.ID, "a");
      await addInputFile(projectRootDir, next.ID, "b");
      await addFileLink(projectRootDir, previous.ID, "a", next.ID, "b");
      await fs.outputFile(path.resolve(projectRootDir, previous.name, "a"), "hoge");
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", debugLogger, projectJson.componentPath, stub);
      expect(await DP.start()).to.be.equal("finished");
      expect(path.resolve(projectRootDir, next.name, "a")).not.to.be.a.path();
      expect(path.resolve(projectRootDir, next.name, "b")).to.be.a.file().and.equal(path.resolve(projectRootDir, previous.name, "a"));
    });
    it("should nothing if outputFile has glob which match nothing", async()=>{
      await addOutputFile(projectRootDir, previous.ID, "a*");
      await addInputFile(projectRootDir, next.ID, "b");
      await addFileLink(projectRootDir, previous.ID, "a*", next.ID, "b");
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", debugLogger, projectJson.componentPath, stub);
      expect(await DP.start()).to.be.equal("finished");
      wait(10);
      expect(path.resolve(projectRootDir, next.name, "b")).not.to.be.a.path();
      expect(path.resolve(projectRootDir, next.name, "a*")).not.to.be.a.path();
    });
  });
  describe("#For component", ()=>{
    let for0;
    beforeEach(async()=>{
      for0 = await createNewComponent(projectRootDir, projectRootDir, "for", { x: 10, y: 10 });
      projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
    });
    //Fugaku2021
    it.only("should copy 3 times and delete all component", async()=>{
      await updateComponent(projectRootDir, for0.ID, "start", 0);
      await updateComponent(projectRootDir, for0.ID, "end", 2);
      await updateComponent(projectRootDir, for0.ID, "step", 1);
      await updateComponent(projectRootDir, for0.ID, "keep", 0);
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", debugLogger, projectJson.componentPath, stub);
      expect(await DP.start()).to.be.equal("finished");
      await wait(5);
      expect(path.resolve(projectRootDir, `${for0.name}_0`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, `${for0.name}_1`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, `${for0.name}_2`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, `${for0.name}_3`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, for0.name, componentJsonFilename)).to.be.a.file().with.json.using.schema({
        properties: {
          numFinishd: {
            type: "integer",
            minimum: 3,
            maximum: 3

          },
          numTotal: {
            type: "integer",
            minimum: 3,
            maximum: 3
          }
        }
      });
    });

    it("should work with negative step number", async()=>{
      await updateComponent(projectRootDir, for0.ID, "end", 0);
      await updateComponent(projectRootDir, for0.ID, "start", 2);
      await updateComponent(projectRootDir, for0.ID, "step", -1);
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", debugLogger, projectJson.componentPath, stub);
      expect(await DP.start()).to.be.equal("finished");
      expect(path.resolve(projectRootDir, `${for0.name}_0`)).to.be.a.directory();
      expect(path.resolve(projectRootDir, `${for0.name}_1`)).to.be.a.directory();
      expect(path.resolve(projectRootDir, `${for0.name}_2`)).to.be.a.directory();
      expect(path.resolve(projectRootDir, `${for0.name}_3`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, for0.name, componentJsonFilename)).to.be.a.file().with.json.using.schema({
        properties: {
          numFinishd: {
            type: "integer",
            minimum: 3,
            maximum: 3

          },
          numTotal: {
            type: "integer",
            minimum: 3,
            maximum: 3
          }
        }
      });
    });
    it("should work with step number which is greater than 1", async()=>{
      await updateComponent(projectRootDir, for0.ID, "start", 1);
      await updateComponent(projectRootDir, for0.ID, "end", 3);
      await updateComponent(projectRootDir, for0.ID, "step", 2);
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", debugLogger, projectJson.componentPath, stub);
      expect(await DP.start()).to.be.equal("finished");
      expect(path.resolve(projectRootDir, `${for0.name}_1`)).to.be.a.directory();
      expect(path.resolve(projectRootDir, `${for0.name}_2`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, `${for0.name}_3`)).to.be.a.directory();
      expect(path.resolve(projectRootDir, `${for0.name}_4`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, `${for0.name}_5`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, for0.name, componentJsonFilename)).to.be.a.file().with.json.using.schema({
        properties: {
          numFinishd: {
            type: "integer",
            minimum: 2,
            maximum: 2

          },
          numTotal: {
            type: "integer",
            minimum: 2,
            maximum: 2
          }
        }
      });
    });
    it("should work beyond 0", async()=>{
      await updateComponent(projectRootDir, for0.ID, "start", -1);
      await updateComponent(projectRootDir, for0.ID, "end", 1);
      await updateComponent(projectRootDir, for0.ID, "step", 1);
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", debugLogger, projectJson.componentPath, stub);
      expect(await DP.start()).to.be.equal("finished");
      expect(path.resolve(projectRootDir, `${for0.name}_-1`)).to.be.a.directory();
      expect(path.resolve(projectRootDir, `${for0.name}_0`)).to.be.a.directory();
      expect(path.resolve(projectRootDir, `${for0.name}_1`)).to.be.a.directory();
      expect(path.resolve(projectRootDir, `${for0.name}_2`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, for0.name, componentJsonFilename)).to.be.a.file().with.json.using.schema({
        properties: {
          numFinishd: {
            type: "integer",
            minimum: 3,
            maximum: 3

          },
          numTotal: {
            type: "integer",
            minimum: 3,
            maximum: 3
          }
        }
      });
    });
    it("should copy 3 times and back to original component", async()=>{
      await updateComponent(projectRootDir, for0.ID, "start", 0);
      await updateComponent(projectRootDir, for0.ID, "end", 2);
      await updateComponent(projectRootDir, for0.ID, "step", 1);
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", debugLogger, projectJson.componentPath, stub);
      expect(await DP.start()).to.be.equal("finished");
      expect(path.resolve(projectRootDir, `${for0.name}_0`)).to.be.a.directory();
      expect(path.resolve(projectRootDir, `${for0.name}_1`)).to.be.a.directory();
      expect(path.resolve(projectRootDir, `${for0.name}_2`)).to.be.a.directory();
      expect(path.resolve(projectRootDir, `${for0.name}_3`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, for0.name, componentJsonFilename)).to.be.a.file().with.json.using.schema({
        properties: {
          numFinishd: {
            type: "integer",
            minimum: 3,
            maximum: 3

          },
          numTotal: {
            type: "integer",
            minimum: 3,
            maximum: 3
          }
        }
      });
    });
  });

  //Fugaku2021
  describe.only("#Parameter Study", ()=>{
    let PS0;
    beforeEach(async()=>{
      PS0 = await createNewComponent(projectRootDir, projectRootDir, "PS", { x: 10, y: 10 });
      await updateComponent(projectRootDir, PS0.ID, "parameterFile", "input.txt.json");
      projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
      await fs.outputFile(path.join(projectRootDir, "PS0", "input.txt"), "%%KEYWORD1%%");
      const parameterSetting = {
        target_file: "input.txt",
        target_param: [
          {
            target: "hoge",
            keyword: "KEYWORD1",
            type: "integer",
            min: "1",
            max: "3",
            step: "1",
            list: ""
          }
        ]
      };
      await fs.writeJson(path.join(projectRootDir, "PS0", "input.txt.json"), parameterSetting, { spaces: 4 });
      await updateComponent(projectRootDir, PS0.ID, "deleteLoopInstance", true);
    });
    it("should delete all loop instance", async()=>{
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", debugLogger, projectJson.componentPath, stub);
      expect(await DP.start()).to.be.equal("finished");
      expect(path.resolve(projectRootDir, `${PS0.name}_KEYWORD1_1`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, `${PS0.name}_KEYWORD1_2`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, `${PS0.name}_KEYWORD1_3`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, PS0.name, componentJsonFilename)).to.be.a.file().with.json.using.schema({
        properties: {
          numFinishd: {
            type: "integer",
            minimum: 3,
            maximum: 3

          },
          numTotal: {
            type: "integer",
            minimum: 3,
            maximum: 3
          }
        }
      });
    });
  });

  //Fugaku2021
  describe.only("#Foreach component", ()=>{
    let foreach0;
    beforeEach(async()=>{
      foreach0 = await createNewComponent(projectRootDir, projectRootDir, "foreach", { x: 10, y: 10 });
      projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
      await updateComponent(projectRootDir, foreach0.ID, "indexList", ["foo", "bar", "baz", "fizz"]);
      await updateComponent(projectRootDir, foreach0.ID, "keep", 0);
    });
    it("should copy 3 times and delete all component", async()=>{
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", debugLogger, projectJson.componentPath, stub);
      expect(await DP.start()).to.be.equal("finished");
      await wait(5);
      expect(path.resolve(projectRootDir, `${foreach0.name}_foo`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, `${foreach0.name}_bar`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, `${foreach0.name}_baz`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, `${foreach0.name}_fizz`)).not.to.be.a.path();
    });
  });

  //Fugaku2021
  describe.only("#While component", ()=>{
    let while0;
    beforeEach(async()=>{
      while0 = await createNewComponent(projectRootDir, projectRootDir, "while", { x: 10, y: 10 });
      projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
      await updateComponent(projectRootDir, while0.ID, "condition", "WHEEL_CURRENT_INDEX < 2");
      await updateComponent(projectRootDir, while0.ID, "keep", 0);
    });
    it("should copy 3 times and delete all component", async()=>{
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", debugLogger, projectJson.componentPath, stub);
      expect(await DP.start()).to.be.equal("finished");
      await wait(5);
      expect(path.resolve(projectRootDir, `${while0.name}_0`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, `${while0.name}_1`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, `${while0.name}_2`)).not.to.be.a.path();
    });
  });

  //Fugaku2021
  describe("#If Component", async()=>{
    let task0;
    let if0;
    let task1;
    let task2;
    beforeEach(async()=>{
      task0 = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 10, y: 20 });
      if0 = await createNewComponent(projectRootDir, projectRootDir, "if", { x: 20, y: 20 });
      await updateComponent(projectRootDir, if0.ID, "condition", "false");
      task1 = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 15, y: 10 });
      task2 = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 25, y: 10 });
      projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
    });
    it("should not make link from outputFile to inputFile behind If Component", async()=>{
      await addOutputFile(projectRootDir, task0.ID, "a");
      await addInputFile(projectRootDir, if0.ID, "b");
      await addInputFile(projectRootDir, task2.ID, "c");
      await addFileLink(projectRootDir, task0.ID, "a", if0.ID, "b");
      await addFileLink(projectRootDir, task0.ID, "a", task2.ID, "c");
      await addLink(projectRootDir, if0.ID, task1.ID);
      await addLink(projectRootDir, if0.ID, task2.ID, true);
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", debugLogger, projectJson.componentPath, stub);
      expect(await DP.start()).to.be.equal("finished");
      expect(path.resolve(projectRootDir, "task0", componentJsonFilename)).to.be.a.file().with.json.using.schema({
        required: ["state"],
        properties: {
          state: { enum: ["finished"] }
        }
      });
      expect(path.resolve(projectRootDir, "if0", componentJsonFilename)).to.be.a.file().with.json.using.schema({
        required: ["state"],
        properties: {
          state: { enum: ["finished"] }
        }
      });
      expect(path.resolve(projectRootDir, "task1", componentJsonFilename)).to.be.a.file().with.json.using.schema({
        required: ["state"],
        properties: {
          state: { enum: ["finished"] }
        }
      });
      expect(path.resolve(projectRootDir, "task2", componentJsonFilename)).to.be.a.file().with.json.using.schema({
        required: ["state"],
        properties: {
          state: { enum: ["non-started"] }
        }
      });
    });
  });
});
