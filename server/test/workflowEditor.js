/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path = require("path");
const fs = require("fs-extra");
const { projectJsonFilename, componentJsonFilename } = require("../app/db/db");
const { getComponentDir } = require("../app/core/workflowUtil");
const getSchema = require("../app/db/jsonSchemas");

//setup test framework
const chai = require("chai");
const expect = chai.expect;
chai.use(require("sinon-chai"));
chai.use(require("chai-fs"));
chai.use(require("chai-json-schema"));
chai.use(require("deep-equal-in-any-order"));

//testee
const { createNewProject,
  createNewComponent,
  updateComponent,
  addInputFile,
  addOutputFile,
  removeInputFile,
  removeOutputFile,
  renameInputFile,
  renameOutputFile,
  addLink,
  addFileLink,
  removeLink,
  removeFileLink,
  removeComponent,
  getComponentTree
} = require("../app/core/projectFilesOperator");


//test data
const testDirRoot = "WHEEL_TEST_TMP";

//helper functions
//async function outputJson(filename) {
//const tmp = await fs.readJson(filename);
//console.log(tmp);
//}

describe("workflow editor UT", function() {
  this.timeout(0);
  let components;
  let wf1Schema;
  let wf2Schema;
  let task0Schema;
  let task1Schema;
  let task2Schema;
  let foreach0Schema;
  let rootSchema;
  let projectJsonSchema;
  let viewer0Schema;
  let source0Schema;
  const projectRootDir = path.resolve(testDirRoot, "testProject.wheel");
  beforeEach(async ()=>{
    await fs.remove(testDirRoot);

    /*
     * create dummy project
     *
     * hierarchy:
     * root--+--task0
     *       +--wf1----+---task1
     *       |         +---wf2------task2
     *       +--foreach0 <-- no children !!
     *       +---source0
     *       +---viewer0
     *
     * outputFile:
     *   task0    "foo"
     *   wf1      "hoge"
     *   task1    "a"
     *   wf2      "e"
     *   task2    "d"
     *   source0  "source"
     *
     * inputFile:
     *   wf1      "bar"
     *   foreach0 "hoge"
     *   task1    "f"
     *   wf2      "b"
     *   task2    "c"
     *   viewer0  "viewer"
     *
     *
     * dependency:
     *  - task0 -> wf1
     *  - wf1 -> foreach0
     *
     * file dependency:
     *  - task0(foo) -> wf1(bar)
     *  - wf1(hoge) -> foreach0(hoge)
     */

    try {
      await createNewProject(projectRootDir, "test project", null, "test", "test@example.com");
    } catch (e) {
      console.log(e);
      throw e;
    }
    const rootWf = await fs.readJson(path.join(projectRootDir, componentJsonFilename));

    const task0 = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 0, y: 0 });
    const wf1 = await createNewComponent(projectRootDir, projectRootDir, "workflow", { x: 1, y: 1 });
    const foreach0 = await createNewComponent(projectRootDir, projectRootDir, "foreach", { x: 1, y: 1 });
    const task1 = await createNewComponent(projectRootDir, path.resolve(projectRootDir, "workflow0"), "task", { x: 2, y: 2 });
    const wf2 = await createNewComponent(projectRootDir, path.join(projectRootDir, "workflow0"), "workflow", { x: 3, y: 3 });
    const task2 = await createNewComponent(projectRootDir, path.join(projectRootDir, "workflow0", "workflow0"), "task", { x: 4, y: 4 });
    const viewer0 = await createNewComponent(projectRootDir, path.join(projectRootDir), "viewer", { x: 5, y: 5 });
    const source0 = await createNewComponent(projectRootDir, path.join(projectRootDir), "source", { x: 6, y: 6 });

    await updateComponent(projectRootDir, task0.ID, "name", "task0");
    task0.name = "task0";
    await updateComponent(projectRootDir, wf1.ID, "name", "wf1");
    wf1.name = "wf1";
    await updateComponent(projectRootDir, task1.ID, "name", "task1");
    task1.name = "task1";
    await updateComponent(projectRootDir, wf2.ID, "name", "wf2");
    wf2.name = "wf2";
    await updateComponent(projectRootDir, task2.ID, "name", "task2");
    task2.name = "task2";
    await updateComponent(projectRootDir, foreach0.ID, "name", "foreach0");
    foreach0.name = "foreach0";

    await addLink(projectRootDir, task0.ID, wf1.ID, false);
    task0.next.push(wf1.ID);
    wf1.previous.push(task0.ID);
    await addLink(projectRootDir, wf1.ID, foreach0.ID, false);
    wf1.next.push(foreach0.ID);
    foreach0.previous.push(wf1.ID);

    await addOutputFile(projectRootDir, task0.ID, "foo");
    task0.outputFiles.push({ name: "foo", dst: [] });
    await addOutputFile(projectRootDir, wf1.ID, "hoge");
    wf1.outputFiles.push({ name: "hoge", dst: [] });
    await addOutputFile(projectRootDir, task1.ID, "a");
    task1.outputFiles.push({ name: "a", dst: [] });
    await addOutputFile(projectRootDir, wf2.ID, "e");
    wf2.outputFiles.push({ name: "e", dst: [] });
    await addOutputFile(projectRootDir, task2.ID, "d");
    task2.outputFiles.push({ name: "d", dst: [] });
    await renameOutputFile(projectRootDir, source0.ID, 0, "source");
    source0.outputFiles[0].name = "source";

    await addInputFile(projectRootDir, wf1.ID, "bar");
    wf1.inputFiles.push({ name: "bar", src: [] });
    await addInputFile(projectRootDir, foreach0.ID, "hoge");
    foreach0.inputFiles.push({ name: "hoge", src: [] });
    await addInputFile(projectRootDir, task1.ID, "f");
    task1.inputFiles.push({ name: "f", src: [] });
    await addInputFile(projectRootDir, wf2.ID, "b");
    wf2.inputFiles.push({ name: "b", src: [] });
    await addInputFile(projectRootDir, task2.ID, "c");
    task2.inputFiles.push({ name: "c", src: [] });
    await addInputFile(projectRootDir, viewer0.ID, "viewer");
    viewer0.inputFiles.push({ name: "viewer", src: [] });

    await addFileLink(projectRootDir, task0.ID, "foo", wf1.ID, "bar");
    task0.outputFiles[0].dst.push({ dstName: "bar", dstNode: wf1.ID });
    wf1.inputFiles[0].src.push({ srcName: "foo", srcNode: task0.ID });
    await addFileLink(projectRootDir, wf1.ID, "hoge", foreach0.ID, "hoge");
    wf1.outputFiles[0].dst.push({ dstName: "hoge", dstNode: foreach0.ID });
    foreach0.inputFiles[0].src.push({ srcName: "hoge", srcNode: wf1.ID });


    components = {
      root: rootWf,
      wf1,
      wf2,
      foreach0,
      task0,
      task1,
      task2,
      viewer0,
      source0
    };

    wf1Schema = getSchema("workflow", "wf1", wf1.ID, rootWf.ID);
    wf1Schema.addValue("next", components.foreach0.ID);
    wf1Schema.addValue("previous", components.task0.ID);
    wf1Schema.addInputFile("bar", components.task0.ID, "foo");
    wf1Schema.addOutputFile("hoge", components.foreach0.ID, "hoge");

    wf2Schema = getSchema("workflow", "wf2", wf2.ID, wf1.ID);
    wf2Schema.addInputFile("b");
    wf2Schema.addOutputFile("e");

    task0Schema = getSchema("task", "task0", task0.ID, rootWf.ID);
    task0Schema.addValue("next", components.wf1.ID);
    task0Schema.addOutputFile("foo", components.wf1.ID, "bar");

    task1Schema = getSchema("task", "task1", task1.ID, wf1.ID);
    task1Schema.addOutputFile("a");
    task1Schema.addInputFile("f");

    task2Schema = getSchema("task", "task2", task2.ID, wf2.ID);
    task2Schema.addOutputFile("d");
    task2Schema.addInputFile("c");

    foreach0Schema = getSchema("foreach", "foreach0", foreach0.ID, rootWf.ID);
    foreach0Schema.addValue("previous", components.wf1.ID);
    foreach0Schema.addInputFile("hoge", components.wf1.ID, "hoge");

    rootSchema = getSchema("workflow", "testProject", rootWf.ID);

    viewer0Schema = getSchema("viewer", "viewer0", viewer0.ID, rootWf.ID);
    viewer0Schema.addInputFile("viewer");

    source0Schema = getSchema("source", "source0", source0.ID, rootWf.ID);
    source0Schema.renameOutputFile("source");

    projectJsonSchema = {
      properties: {
        required: ["componentPath"],
        componentPath: {
          required: [rootWf.ID, wf1.ID, wf2.ID, task0.ID, task1.ID, task2.ID, foreach0.ID, viewer0.ID, source0.ID],
          properties: {},
          minProperties: 9,
          maxProperties: 9
        },
        additionalProperties: false
      }
    };
    projectJsonSchema.properties.componentPath.properties[rootWf.ID] = { enum: ["./"] };
    projectJsonSchema.properties.componentPath.properties[task0.ID] = { enum: ["./task0"] };
    projectJsonSchema.properties.componentPath.properties[foreach0.ID] = { enum: ["./foreach0"] };
    projectJsonSchema.properties.componentPath.properties[wf1.ID] = { enum: ["./wf1"] };
    projectJsonSchema.properties.componentPath.properties[task1.ID] = { enum: ["./wf1/task1"] };
    projectJsonSchema.properties.componentPath.properties[wf2.ID] = { enum: ["./wf1/wf2"] };
    projectJsonSchema.properties.componentPath.properties[task2.ID] = { enum: ["./wf1/wf2/task2"] };
  });
  after(async ()=>{
    await fs.remove(testDirRoot);
  });

  describe("#createNewComponent", ()=>{
    it("should create new task wf1", async ()=>{
      const newTask0 = await createNewComponent(projectRootDir, path.join(projectRootDir, "wf1"), "task", { x: 10, y: 10 });
      expect(path.join(projectRootDir, "wf1", "task0", componentJsonFilename)).to.be.a.file().with.json.using.schema(getSchema("task", "task0", newTask0.ID, components.wf1.ID));
    });
    it("should create new source under wf1", async ()=>{
      const newSource = await createNewComponent(projectRootDir, path.join(projectRootDir, "wf1"), "source", { x: 10, y: 10 });
      expect(path.join(projectRootDir, "wf1", "source0", componentJsonFilename)).to.be.a.file().with.json.using.schema(getSchema("source", "source0", newSource.ID, components.wf1.ID));
    });
    it("should create new viewer under wf1", async ()=>{
      const newViewer = await createNewComponent(projectRootDir, path.join(projectRootDir, "wf1"), "viewer", { x: 10, y: 10 });
      expect(path.join(projectRootDir, "wf1", "viewer0", componentJsonFilename)).to.be.a.file().with.json.using.schema(getSchema("viewer", "viewer0", newViewer.ID, components.wf1.ID));
    });
  });
  describe("#updateComponent", ()=>{
    it("can update even if component json has null value", async ()=>{
      await updateComponent(projectRootDir, components.wf1.ID, "script", null);
      await updateComponent(projectRootDir, components.wf1.ID, "name", "wf4");
      wf1Schema.properties.name = { enum: ["wf4"] };
      expect(path.join(projectRootDir, "wf1")).not.to.be.path();
      expect(path.join(projectRootDir, "wf4")).to.be.directory().with.contents(["wf2", "task1", componentJsonFilename]);
      expect(path.join(projectRootDir, "wf4", componentJsonFilename)).to.be.file().with.json.using.schema(wf1Schema);
      expect(await getComponentDir(projectRootDir, components.wf1.ID)).to.equal(path.resolve(projectRootDir, "wf4"));
      projectJsonSchema.properties.componentPath.properties[components.wf1.ID] = { enum: ["./wf4"] };
      projectJsonSchema.properties.componentPath.properties[components.task1.ID] = { enum: ["./wf4/task1"] };
      projectJsonSchema.properties.componentPath.properties[components.wf2.ID] = { enum: ["./wf4/wf2"] };
      projectJsonSchema.properties.componentPath.properties[components.task2.ID] = { enum: ["./wf4/wf2/task2"] };
      expect(path.join(projectRootDir, projectJsonFilename)).to.be.a.file().with.json.using.schema(projectJsonSchema);
    });
    it("should rename component which has child", async ()=>{
      await updateComponent(projectRootDir, components.wf1.ID, "name", "wf4");
      wf1Schema.properties.name = { enum: ["wf4"] };
      expect(path.join(projectRootDir, "wf1")).not.to.be.path();
      expect(path.join(projectRootDir, "wf4")).to.be.directory().with.contents(["wf2", "task1", componentJsonFilename]);
      expect(path.join(projectRootDir, "wf4", componentJsonFilename)).to.be.file().with.json.using.schema(wf1Schema);
      expect(await getComponentDir(projectRootDir, components.wf1.ID)).to.equal(path.resolve(projectRootDir, "wf4"));
      projectJsonSchema.properties.componentPath.properties[components.wf1.ID] = { enum: ["./wf4"] };
      projectJsonSchema.properties.componentPath.properties[components.task1.ID] = { enum: ["./wf4/task1"] };
      projectJsonSchema.properties.componentPath.properties[components.wf2.ID] = { enum: ["./wf4/wf2"] };
      projectJsonSchema.properties.componentPath.properties[components.task2.ID] = { enum: ["./wf4/wf2/task2"] };
      expect(path.join(projectRootDir, projectJsonFilename)).to.be.a.file().with.json.using.schema(projectJsonSchema);
    });
    it("should rename component after its component is renamed", async ()=>{
      await updateComponent(projectRootDir, components.task1.ID, "name", "hoge");
      await updateComponent(projectRootDir, components.wf1.ID, "name", "wf4");
      wf1Schema.properties.name = { enum: ["wf4"] };
      expect(path.join(projectRootDir, "wf1")).not.to.be.path();
      expect(path.join(projectRootDir, "wf4")).to.be.directory().with.contents(["wf2", "hoge", componentJsonFilename]);
      expect(path.join(projectRootDir, "wf4", componentJsonFilename)).to.be.file().with.json.using.schema(wf1Schema);
      expect(await getComponentDir(projectRootDir, components.wf1.ID)).to.equal(path.resolve(projectRootDir, "wf4"));
      projectJsonSchema.properties.componentPath.properties[components.wf1.ID] = { enum: ["./wf4"] };
      projectJsonSchema.properties.componentPath.properties[components.task1.ID] = { enum: ["./wf4/hoge"] };
      projectJsonSchema.properties.componentPath.properties[components.wf2.ID] = { enum: ["./wf4/wf2"] };
      projectJsonSchema.properties.componentPath.properties[components.task2.ID] = { enum: ["./wf4/wf2/task2"] };
      expect(path.join(projectRootDir, projectJsonFilename)).to.be.a.file().with.json.using.schema(projectJsonSchema);
    });
    it("should update task0's script property", async ()=>{
      await updateComponent(projectRootDir, components.task0.ID, "script", "run.sh");
      task0Schema.properties.script = { enum: ["run.sh"] };
      expect(path.join(projectRootDir, "task0", componentJsonFilename)).to.be.a.file().with.json.using.schema(task0Schema);
    });
    it("should update foreach's indexList property", async ()=>{
      await updateComponent(projectRootDir, components.foreach0.ID, "indexList", ["foo", "bar", "baz"]);
      foreach0Schema.properties.indexList.items = [
        { enum: ["foo"] },
        { enum: ["bar"] },
        { enum: ["baz"] }
      ];
      foreach0Schema.properties.indexList.minItems = 3;
      foreach0Schema.properties.indexList.maxItems = 3;
      foreach0Schema.properties.indexList.additionalItems = false;

      expect(path.join(projectRootDir, "foreach0", componentJsonFilename)).to.be.a.file().with.json.using.schema(foreach0Schema);
    });
    it("should be rejected while attempting to rename root workflow", ()=>{
      return expect(updateComponent(projectRootDir, components.root.ID, "name", "hoge")).to.be.eventually.rejected;
    });
    it("should not rename root workflow", async ()=>{
      await updateComponent(projectRootDir, components.root.ID, "name", "hoge").catch(()=>{});
      expect(path.join(projectRootDir, componentJsonFilename)).to.be.a.file().with.json.using.schema(rootSchema);
    });
    it("should be rejected while attempting to update inputFiles property", ()=>{
      return expect(updateComponent(projectRootDir, components.task0.ID, "inputFiles", "hoge")).to.be.eventually.rejected;
    });
    it("should not update inputFiles", async ()=>{
      await updateComponent(projectRootDir, components.task0.ID, "inputFiles", "hoge").catch(()=>{});
      expect(path.join(projectRootDir, "task0", componentJsonFilename)).to.be.a.file().with.json.using.schema(task0Schema);
    });
    it("should be rejected while attempting to update outputFiles property", ()=>{
      return expect(updateComponent(projectRootDir, components.task0.ID, "outputFiles", "hoge")).to.be.eventually.rejected;
    });
    it("should not update outputFiles", async ()=>{
      await updateComponent(projectRootDir, components.task0.ID, "outputFiles", "hoge").catch(()=>{});
      expect(path.join(projectRootDir, "task0", componentJsonFilename)).to.be.a.file().with.json.using.schema(task0Schema);
    });
  });
  describe("#removeComponent", ()=>{
    it("should remove wf1 and its descendants", async ()=>{
      await removeComponent(projectRootDir, components.wf1.ID);

      //wf1's entry in task0 and foreac0 should be removed
      task0Schema.properties.outputFiles.items[0].properties.dst = getSchema("emptyArray");
      task0Schema.properties.next = getSchema("emptyArray");
      expect(path.join(projectRootDir, "task0", componentJsonFilename)).to.be.a.file().with.json.using.schema(task0Schema);

      foreach0Schema.properties.inputFiles.items[0].properties.src = getSchema("emptyArray");
      foreach0Schema.properties.previous = getSchema("emptyArray");
      expect(path.join(projectRootDir, "foreach0", componentJsonFilename)).to.be.a.file().with.json.using.schema(foreach0Schema);
      expect(path.join(projectRootDir, "wf1")).not.to.be.path();

      //check componentPath in projectJson
      expect(path.join(projectRootDir, projectJsonFilename)).to.be.a.file().with.json.using.schema({
        properties: {
          componentPath: {
            patternProperties: {
              "^.*$": { type: "string", pattern: "^(?!.*wf1).*$" }
            },
            minProperties: 5,
            maxProperties: 5
          }
        },
        required: ["componentPath"]
      });
    });
  });
  describe("#addInputFile", ()=>{
    it("should add not connected inputFile entry to wf1", async ()=>{
      await addInputFile(projectRootDir, components.wf1.ID, "piyo");
      wf1Schema.addInputFile("piyo");
      expect(path.join(projectRootDir, "wf1", componentJsonFilename)).to.be.a.file().with.json.using.schema(wf1Schema);
    });
    it("should be rejected while attempting to add inputFile to source", ()=>{
      return expect(addInputFile(projectRootDir, components.source0.ID, "piyo")).to.be.eventually.rejected;
    });
    it("should not add inputFile entry to source component", async ()=>{
      const filename = path.join(projectRootDir, "source0", componentJsonFilename);
      await addInputFile(projectRootDir, components.source0.ID, "piyo").catch(()=>{});
      expect(filename).to.be.a.file().with.json.using.schema(source0Schema);
    });
  });
  describe("#addOutputFile", ()=>{
    it("should add not connected outputFile entry to wf1", async ()=>{
      await addOutputFile(projectRootDir, components.wf1.ID, "piyo");
      wf1Schema.addOutputFile("piyo");
      expect(path.join(projectRootDir, "wf1", componentJsonFilename)).to.be.a.file().with.json.using.schema(wf1Schema);
    });
    it("should be rejected while attempting to add outputFile entry to viewer component", ()=>{
      return expect(addOutputFile(projectRootDir, components.viewer0.ID, "piyo")).to.be.eventually.rejected;
    });
    it("should not affect viewer component", async ()=>{
      const filename = path.join(projectRootDir, "viewer0", componentJsonFilename);
      await addOutputFile(projectRootDir, components.viewer0.ID, "piyo").catch(()=>{});
      expect(filename).to.be.a.file().with.json.using.schema(viewer0Schema);
    });
    it("should work with source component", async ()=>{
      const filename = path.join(projectRootDir, "source0", componentJsonFilename);
      await addOutputFile(projectRootDir, components.source0.ID, "piyo").catch(()=>{});
      source0Schema.addOutputFile("piyo");
      expect(filename).to.be.a.file().with.json.using.schema(source0Schema);
    });
  });
  describe("#removeInputFile", ()=>{
    it("should remove inputfile entry from wf1", async ()=>{
      await removeInputFile(projectRootDir, components.wf1.ID, "bar");
      wf1Schema.properties.inputFiles = getSchema("emptyArray");
      expect(path.join(projectRootDir, "wf1", componentJsonFilename)).to.be.a.file().with.json.using.schema(wf1Schema);
      task0Schema.properties.outputFiles.items[0].properties.dst = getSchema("emptyArray");
      expect(path.join(projectRootDir, "task0", componentJsonFilename)).to.be.a.file().with.json.using.schema(task0Schema);
    });
    it("should remove inputFile entry from child component and modify linked parent component", async ()=>{
      await addFileLink(projectRootDir, components.task1.ID, "a", components.task2.ID, "c");

      await removeInputFile(projectRootDir, components.task2.ID, "c");
      task2Schema.properties.inputFiles = getSchema("emptyArray");
      expect(path.join(projectRootDir, "wf1", "wf2", "task2", componentJsonFilename)).to.be.a.file().with.json.using.schema(task2Schema);
      wf2Schema.properties.inputFiles.items[0].properties.forwardTo = getSchema("emptyArray");
      expect(path.join(projectRootDir, "wf1", "wf2", componentJsonFilename)).to.be.a.file().with.json.using.schema(wf2Schema);
    });
    it("should be rejected while attempting to remove inputFile from source component", ()=>{
      return expect(removeInputFile(projectRootDir, components.source0.ID, "piyo")).to.be.eventually.rejected;
    });
    it("should not affect source component", async ()=>{
      const filename = path.join(projectRootDir, "source0", componentJsonFilename);
      await removeInputFile(projectRootDir, components.source0.ID, "piyo").catch(()=>{});
      expect(filename).to.be.a.file().with.json.using.schema(source0Schema);
    });
  });
  describe("#removeOutputFile", ()=>{
    it("should remove outputfile entry from wf1", async ()=>{
      await removeOutputFile(projectRootDir, components.wf1.ID, "hoge");
      wf1Schema.properties.outputFiles = getSchema("emptyArray");
      expect(path.join(projectRootDir, "wf1", componentJsonFilename)).to.be.a.file().with.json.using.schema(wf1Schema);
      foreach0Schema.properties.inputFiles.items[0].properties.src = getSchema("emptyArray");
      expect(path.join(projectRootDir, "foreach0", componentJsonFilename)).to.be.a.file().with.json.using.schema(foreach0Schema);
    });
    it("should remove outputFile entry from child component and modify linked parent component", async ()=>{
      await addFileLink(projectRootDir, components.task2.ID, "d", components.task1.ID, "f");

      await removeOutputFile(projectRootDir, components.task2.ID, "d");
      task2Schema.properties.outputFiles = getSchema("emptyArray");
      expect(path.join(projectRootDir, "wf1", "wf2", "task2", componentJsonFilename)).to.be.a.file().with.json.using.schema(task2Schema);
      wf2Schema.properties.outputFiles.items[0].properties.origin = getSchema("emptyArray");
      expect(path.join(projectRootDir, "wf1", "wf2", componentJsonFilename)).to.be.a.file().with.json.using.schema(wf2Schema);
    });
    it("should be rejected while attempting to remove outputFile from viewer component", ()=>{
      return expect(removeOutputFile(projectRootDir, components.viewer0.ID, "piyo")).to.be.eventually.rejected;
    });
    it("should not affect viewer component", async ()=>{
      const filename = path.join(projectRootDir, "viewer0", componentJsonFilename);
      await removeOutputFile(projectRootDir, components.viewer0.ID, "piyo").catch(()=>{});
      expect(filename).to.be.a.file().with.json.using.schema(viewer0Schema);
    });
  });
  describe("#renameInputFile", ()=>{
    it("should rename inputFile entry of wf1", async ()=>{
      await renameInputFile(projectRootDir, components.wf1.ID, 0, "barbar");
      wf1Schema.properties.inputFiles.items[0].properties.name = { enum: ["barbar"] };
      task0Schema.properties.outputFiles.items[0].properties.dst.items[0].properties.dstName = { enum: ["barbar"] };
      expect(path.join(projectRootDir, "wf1", componentJsonFilename)).to.be.a.file().with.json.using.schema(wf1Schema);
      expect(path.join(projectRootDir, "task0", componentJsonFilename)).to.be.a.file().with.json.using.schema(task0Schema);
    });
    it("should rename inputFile entry of wf1", async ()=>{
      return expect(renameInputFile(projectRootDir, components.wf1.ID, 0, "bar=bar")).to.be.rejectedWith("bar=bar is not valid inputFile name");
    });
  });
  describe("#renameOutputFile", ()=>{
    it("should rename outputFile entry of wf1", async ()=>{
      await renameOutputFile(projectRootDir, components.wf1.ID, 0, "hogehoge");
      wf1Schema.properties.outputFiles.items[0].properties.name = { enum: ["hogehoge"] };
      foreach0Schema.properties.inputFiles.items[0].properties.src.items[0].properties.srcName = { enum: ["hogehoge"] };
      expect(path.join(projectRootDir, "wf1", componentJsonFilename)).to.be.a.file().with.json.using.schema(wf1Schema);
      expect(path.join(projectRootDir, "foreach0", componentJsonFilename)).to.be.a.file().with.json.using.schema(foreach0Schema);
    });
    it("should rename outputFile entry of wf1", async ()=>{
      return expect(renameOutputFile(projectRootDir, components.wf1.ID, 0, "hoge=hoge")).to.be.rejectedWith("hoge=hoge is not valid outputFile name");
    });
  });
  describe("#addLink", ()=>{
    it("should add new link from task0 to foreach0", async ()=>{
      await addLink(projectRootDir, components.task0.ID, components.foreach0.ID, false);
      task0Schema.addValue("next", components.foreach0.ID);
      foreach0Schema.addValue("previous", components.task0.ID);
      expect(path.join(projectRootDir, "task0", componentJsonFilename)).to.be.a.file().with.json.using.schema(task0Schema);
      expect(path.join(projectRootDir, "foreach0", componentJsonFilename)).to.be.a.file().with.json.using.schema(foreach0Schema);
    });
    it("should be rejected when attemting to make link from source", ()=>{
      return expect(addLink(projectRootDir, components.source0.ID, components.wf1.ID, false)).to.be.eventually.rejectedWith(Error, "can not have link");
    });
    it("should be rejected when attemting to make link to source", ()=>{
      return expect(addLink(projectRootDir, components.wf1.ID, components.source0.ID, false)).to.be.eventually.rejectedWith(Error, "can not have link");
    });
    it("should be rejected when attemting to make link from viewer", ()=>{
      return expect(addLink(projectRootDir, components.viewer0.ID, components.wf1.ID, false)).to.be.eventually.rejectedWith(Error, "can not have link");
    });
    it("should be rejected when attemting to make link to viewer", ()=>{
      return expect(addLink(projectRootDir, components.wf1.ID, components.viewer0.ID, false)).to.be.eventually.rejectedWith(Error, "can not have link");
    });
  });
  describe("#removeLink", ()=>{
    it("should remove link from task0 to wf1", async ()=>{
      await removeLink(projectRootDir, components.task0.ID, components.wf1.ID, false);
      task0Schema.properties.next = getSchema("emptyArray");
      wf1Schema.properties.previous = getSchema("emptyArray");
      expect(path.join(projectRootDir, "task0", componentJsonFilename)).to.be.a.file().with.json.using.schema(task0Schema);
      expect(path.join(projectRootDir, "wf1", componentJsonFilename)).to.be.a.file().with.json.using.schema(wf1Schema);
    });
  });
  describe("#addFileLink", ()=>{
    it("should add new file link from source0 to wf1", async ()=>{
      await addFileLink(projectRootDir, components.source0.ID, "source", components.wf1.ID, "bar");
      source0Schema.addOutputFileLink(components.wf1.ID, "bar");
      wf1Schema.addInputFileLink(0, components.source0.ID, "source");
      expect(path.join(projectRootDir, "wf1", componentJsonFilename)).to.be.a.file().with.json.using.schema(wf1Schema);
      expect(path.join(projectRootDir, "source0", componentJsonFilename)).to.be.a.file().with.json.using.schema(source0Schema);
    });
    it("should add new file link from source0 to task1", async ()=>{
      await addFileLink(projectRootDir, components.source0.ID, "source", components.task1.ID, "f");
      source0Schema.addOutputFileLink(components.task1.ID, "f");
      task1Schema.addInputFileLink(0, components.source0.ID, "source");
      expect(path.join(projectRootDir, "wf1", "task1", componentJsonFilename)).to.be.a.file().with.json.using.schema(task1Schema);
      expect(path.join(projectRootDir, "source0", componentJsonFilename)).to.be.a.file().with.json.using.schema(source0Schema);
    });
    it("should add new file link from wf1 to viewer0", async ()=>{
      await addFileLink(projectRootDir, components.wf1.ID, "hoge", components.viewer0.ID, "viewer");
      viewer0Schema.addInputFileLink(0, components.wf1.ID, "hoge");
      wf1Schema.addOutputFileLink(0, components.viewer0.ID, "viewer");
      expect(path.join(projectRootDir, "wf1", componentJsonFilename)).to.be.a.file().with.json.using.schema(wf1Schema);
      expect(path.join(projectRootDir, "viewer0", componentJsonFilename)).to.be.a.file().with.json.using.schema(viewer0Schema);
    });
    it("should add new file link from task1 to viewer0", async ()=>{
      await addFileLink(projectRootDir, components.task1.ID, "a", components.viewer0.ID, "viewer");
      viewer0Schema.addInputFileLink(0, components.task1.ID, "a");
      task1Schema.addOutputFileLink(0, components.viewer0.ID, "viewer");
      expect(path.join(projectRootDir, "wf1", "task1", componentJsonFilename)).to.be.a.file().with.json.using.schema(task1Schema);
      expect(path.join(projectRootDir, "viewer0", componentJsonFilename)).to.be.a.file().with.json.using.schema(viewer0Schema);
    });
    it("should add new file link from task0 to foreach0", async ()=>{
      await addFileLink(projectRootDir, components.task0.ID, "foo", components.foreach0.ID, "hoge");
      task0Schema.addOutputFileLink(0, components.foreach0.ID, "hoge");
      foreach0Schema.addInputFileLink(0, components.task0.ID, "foo");
      expect(path.join(projectRootDir, "task0", componentJsonFilename)).to.be.a.file().with.json.using.schema(task0Schema);
      expect(path.join(projectRootDir, "foreach0", componentJsonFilename)).to.be.a.file().with.json.using.schema(foreach0Schema);
    });
    it("should add new file link from upper level to task2 via wf2 with 'parent' keyword", async ()=>{
      await addFileLink(projectRootDir, "parent", "b", components.task2.ID, "c");
      wf2Schema.addInputFileLink(0, components.task2.ID, "c", true);
      task2Schema.addInputFileLink(0, components.wf2.ID, "b");
      expect(path.join(projectRootDir, "wf1", "wf2", componentJsonFilename)).to.be.a.file().with.json.using.schema(wf2Schema);
      expect(path.join(projectRootDir, "wf1", "wf2", "task2", componentJsonFilename)).to.be.a.file().with.json.using.schema(task2Schema);
    });
    it("should add new file link from upper level to task2 via wf2 with wf2's ID", async ()=>{
      await addFileLink(projectRootDir, components.wf2.ID, "b", components.task2.ID, "c");
      wf2Schema.addInputFileLink(0, components.task2.ID, "c", true);
      task2Schema.addInputFileLink(0, components.wf2.ID, "b");
      expect(path.join(projectRootDir, "wf1", "wf2", componentJsonFilename)).to.be.a.file().with.json.using.schema(wf2Schema);
      expect(path.join(projectRootDir, "wf1", "wf2", "task2", componentJsonFilename)).to.be.a.file().with.json.using.schema(task2Schema);
    });
    it("should add new file link from task2 to upper level via wf2 with 'parent' keyword", async ()=>{
      await addFileLink(projectRootDir, components.task2.ID, "d", "parent", "e");
      wf2Schema.addOutputFileLink(0, components.task2.ID, "d", true);
      task2Schema.addOutputFileLink(0, components.wf2.ID, "e");
      expect(path.join(projectRootDir, "wf1", "wf2", componentJsonFilename)).to.be.a.file().with.json.using.schema(wf2Schema);
      expect(path.join(projectRootDir, "wf1", "wf2", "task2", componentJsonFilename)).to.be.a.file().with.json.using.schema(task2Schema);
    });
    it("should add new file link from task2 to upper level via wf2 with wf2's ID", async ()=>{
      await addFileLink(projectRootDir, components.task2.ID, "d", components.wf2.ID, "e");
      wf2Schema.addOutputFileLink(0, components.task2.ID, "d", true);
      task2Schema.addOutputFileLink(0, components.wf2.ID, "e");
      expect(path.join(projectRootDir, "wf1", "wf2", componentJsonFilename)).to.be.a.file().with.json.using.schema(wf2Schema);
      expect(path.join(projectRootDir, "wf1", "wf2", "task2", componentJsonFilename)).to.be.a.file().with.json.using.schema(task2Schema);
    });
  });
  describe("#removeFileLink", ()=>{
    it("should remove file link from source0 to viewer0", async ()=>{
      await addFileLink(projectRootDir, components.source0.ID, "source", components.viewer0.ID, "viewer");
      await removeFileLink(projectRootDir, components.source0.ID, "source", components.viewer0.ID, "viewer");
      expect(path.join(projectRootDir, "source0", componentJsonFilename)).to.be.a.file().with.json.using.schema(source0Schema);
      expect(path.join(projectRootDir, "viewer0", componentJsonFilename)).to.be.a.file().with.json.using.schema(viewer0Schema);
    });
    it("should remove file link from source0 to task1", async ()=>{
      await addFileLink(projectRootDir, components.source0.ID, "source", components.task1.ID, "f");
      await removeFileLink(projectRootDir, components.source0.ID, "source", components.task1.ID, "f");
      expect(path.join(projectRootDir, "wf1", "task1", componentJsonFilename)).to.be.a.file().with.json.using.schema(task1Schema);
      expect(path.join(projectRootDir, "source0", componentJsonFilename)).to.be.a.file().with.json.using.schema(source0Schema);
    });
    it("should remove file link from task1 to viewer0", async ()=>{
      await addFileLink(projectRootDir, components.task1.ID, "a", components.viewer0.ID, "viewer");
      await removeFileLink(projectRootDir, components.task1.ID, "a", components.viewer0.ID, "viewer");
      expect(path.join(projectRootDir, "wf1", "task1", componentJsonFilename)).to.be.a.file().with.json.using.schema(task1Schema);
      expect(path.join(projectRootDir, "viewer0", componentJsonFilename)).to.be.a.file().with.json.using.schema(viewer0Schema);
    });
    it("should remove file link from task0 to wf1", async ()=>{
      await removeFileLink(projectRootDir, components.task0.ID, "foo", components.wf1.ID, "bar");
      task0Schema.properties.outputFiles.items[0].properties.dst = getSchema("emptyArray");
      wf1Schema.properties.inputFiles.items[0].properties.src = getSchema("emptyArray");
      expect(path.join(projectRootDir, "task0", componentJsonFilename)).to.be.a.file().with.json.using.schema(task0Schema);
      expect(path.join(projectRootDir, "wf1", componentJsonFilename)).to.be.a.file().with.json.using.schema(wf1Schema);
    });
    it("should remove file link from upper level to task2 via wf2 by 'parent' keyword", async ()=>{
      await addFileLink(projectRootDir, "parent", "b", components.task2.ID, "c");

      //actual test start here
      await removeFileLink(projectRootDir, "parent", "b", components.task2.ID, "c");
      wf2Schema.properties.inputFiles.items[0].properties.forwardTo = getSchema("emptyArray");
      task2Schema.properties.inputFiles.items[0].properties.src = getSchema("emptyArray");
      expect(path.join(projectRootDir, "wf1", "wf2", componentJsonFilename)).to.be.a.file().with.json.using.schema(wf2Schema);
      expect(path.join(projectRootDir, "wf1", "wf2", "task2", componentJsonFilename)).to.be.a.file().with.json.using.schema(task2Schema);
    });
    it("should remove file link from upper level to task2 via wf2 by ID", async ()=>{
      await addFileLink(projectRootDir, components.wf2.ID, "b", components.task2.ID, "c");

      //actual test start here
      await removeFileLink(projectRootDir, "parent", "b", components.task2.ID, "c");
      wf2Schema.properties.inputFiles.items[0].properties.forwardTo = getSchema("emptyArray");
      task2Schema.properties.inputFiles.items[0].properties.src.items = getSchema("emptyArray");
      expect(path.join(projectRootDir, "wf1", "wf2", componentJsonFilename)).to.be.a.file().with.json.using.schema(wf2Schema);
      expect(path.join(projectRootDir, "wf1", "wf2", "task2", componentJsonFilename)).to.be.a.file().with.json.using.schema(task2Schema);
    });
    it("should remove file link from task2 to upper level via wf2 by 'parent' keyword", async ()=>{
      await addFileLink(projectRootDir, components.task2.ID, "d", "parent", "e");

      //actual test start here
      await removeFileLink(projectRootDir, components.task2.ID, "d", "parent", "e");
      wf2Schema.properties.inputFiles.items[0].properties.forwardTo = getSchema("emptyArray");
      task2Schema.properties.inputFiles.items[0].properties.src.items = getSchema("emptyArray");
      expect(path.join(projectRootDir, "wf1", "wf2", componentJsonFilename)).to.be.a.file().with.json.using.schema(wf2Schema);
      expect(path.join(projectRootDir, "wf1", "wf2", "task2", componentJsonFilename)).to.be.a.file().with.json.using.schema(task2Schema);
    });
    it("should remove file link from task2 to upper level via wf2 by ID", async ()=>{
      await addFileLink(projectRootDir, components.task2.ID, "d", "parent", "e");

      //actual test start here
      await removeFileLink(projectRootDir, components.task2.ID, "d", components.wf2.ID, "e");
      wf2Schema.properties.inputFiles.items[0].properties.forwardTo = getSchema("emptyArray");
      task2Schema.properties.inputFiles.items[0].properties.src.items = getSchema("emptyArray");
      expect(path.join(projectRootDir, "wf1", "wf2", componentJsonFilename)).to.be.a.file().with.json.using.schema(wf2Schema);
      expect(path.join(projectRootDir, "wf1", "wf2", "task2", componentJsonFilename)).to.be.a.file().with.json.using.schema(task2Schema);
    });
  });
  describe("#getComponentTree", ()=>{
    beforeEach(()=>{
      components.root.children = [components.task0, components.wf1, components.foreach0, components.viewer0, components.source0];
      components.wf1.children = [components.task1, components.wf2];
      components.wf2.children = [components.task2];
    });
    it("should get all componentJson from root", async ()=>{
      const expectedResult = JSON.parse(JSON.stringify(components.root));
      expect(await getComponentTree(projectRootDir, projectRootDir)).to.deep.equalInAnyOrder(expectedResult);
    });
    it("should get all componentJson from specified component", async ()=>{
      const expectedResult = JSON.parse(JSON.stringify(components.wf1));
      expect(await getComponentTree(projectRootDir, path.join(projectRootDir, "wf1"))).to.deep.equalInAnyOrder(expectedResult);
    });
    it("should get just leaf component", async ()=>{
      expect(await getComponentTree(projectRootDir, path.join(projectRootDir, "foreach0"))).to.eql(components.foreach0);
    });
  });
});
