/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import path from "path";
import fs from "fs-extra";

//setup test framework
import * as chai from "chai";
const expect = chai.expect;
import sinonChai from "sinon-chai";
chai.use(sinonChai);
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
import sinon from "sinon";
import { createNewProject } from "../../../app/core/projectOperations.js";
import { createNewComponent } from "../../../app/core/componentOperations.js";
import { setupTestDir } from "../../testUtil.js";

//testee
import { _internal, validateComponent, checkComponentDependency, recursiveValidateComponents } from "../../../app/core/validateComponents.js";
import { validateBulkjobTask, _internal as taskValidatorInternal } from "../../../app/core/taskValidator.js";
import { getCycleGraph } from "../../../app/core/dependencyGraphValidator.js";
import { _internal as fileValidatorInternal } from "../../../app/core/fileValidator.js";
import { createValidationError } from "../../../app/lib/validationError.js";

//test data
const testDirRoot = "WHEEL_TEST_TMP";
const projectRootDir = path.resolve(testDirRoot, "testProject.wheel");

describe("validateComponents function", function () {
  this.timeout(10000);
  let remoteHostQueryStub;
  beforeEach(async function () {
    await setupTestDir(testDirRoot);

    try {
      await createNewProject(projectRootDir, "test project", null, "test", "test@example.com");
    } catch (e) {
      console.log(e);
      throw e;
    }

    const getComponentDirStub = sinon.stub(fileValidatorInternal, "getComponentDir");
    getComponentDirStub.callThrough();
    getComponentDirStub
      .withArgs(sinon.match.any, "test-ps", sinon.match.any)
      .resolves(path.resolve(projectRootDir, "test-ps"));
    remoteHostQueryStub = sinon.stub(taskValidatorInternal.remoteHost, "query");
    remoteHostQueryStub.callsFake((name, hostname)=>{
      if (hostname === "OK") {
        return { name: "dummy" };
      } else if (hostname === "jobOK") {
        return { name: "dummy", jobScheduler: "hoge" };
      } else if (hostname === "stepjobNG") {
        return { name: "dummy", jobScheduler: "huga" };
      } else if (hostname === "stepjobOK") {
        return { name: "dummy", jobScheduler: "huga", useStepjob: true };
      } else if (hostname === "bulkjobNG") {
        return { name: "dummy", jobScheduler: "hige" };
      } else if (hostname === "bulkjobOK") {
        return { name: "dummy", jobScheduler: "hige", useBulkjob: true };
      }
      return undefined;
    });
    sinon.stub(taskValidatorInternal, "jobScheduler").value({
      hoge: { queueOpt: "-q" },
      huga: { queueOpt: "-q", supportStepjob: true },
      hige: { queueOpt: "-q", supportBulkjob: true }
    });
  });
  afterEach(()=>{
    sinon.restore();
  });
  after(async function () {
    if (!process.env.WHEEL_KEEP_FILES_AFTER_LAST_TEST) {
      await fs.remove(testDirRoot);
    }
  });

  it("should validate if component with else branch", async function () {
    const ifComponent = await createNewComponent(projectRootDir, projectRootDir, "if", { x: 0, y: 0 });
    ifComponent.condition = "condition.js";
    ifComponent.else = ["else-branch-id"];

    const conditionPath = path.resolve(projectRootDir, ifComponent.name, "condition.js");
    await fs.writeFile(conditionPath, "module.exports = function() { return true; }");

    const getNextComponentsStub = sinon.stub(_internal, "getNextComponents").callsFake((components, component)=>{
      const nextComponentIDs = [];
      if (component.next) {
        nextComponentIDs.push(...component.next);
      }
      if (component.else) {
        nextComponentIDs.push(...component.else);
      }
      return components.filter((c)=>{
        return nextComponentIDs.includes(c.ID);
      });
    });

    const errors = await validateComponent(projectRootDir, ifComponent);

    expect(errors).to.be.empty;
    getNextComponentsStub.restore();
  });

  it("should validate bulkjobTask with manualFinishCondition", async function () {
    const bulkjobTask = await createNewComponent(projectRootDir, projectRootDir, "bulkjobTask", { x: 0, y: 0 });
    bulkjobTask.host = "bulkjobOK";
    bulkjobTask.usePSSettingFile = false;
    bulkjobTask.startBulkNumber = 1;
    bulkjobTask.endBulkNumber = 5;
    bulkjobTask.script = "script.sh";
    bulkjobTask.manualFinishCondition = true;
    bulkjobTask.condition = "condition.js";

    const scriptPath = path.resolve(projectRootDir, bulkjobTask.name, "script.sh");
    await fs.writeFile(scriptPath, "#!/bin/bash\necho 'Hello'");

    const conditionPath = path.resolve(projectRootDir, bulkjobTask.name, "condition.js");
    await fs.writeFile(conditionPath, "module.exports = function() { return true; }");

    const result = await validateBulkjobTask(projectRootDir, bulkjobTask);

    expect(result).to.be.empty;
  });

  it("should validate component with outputFiles having multiple destinations", async function () {
    const task = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 0, y: 0 });
    task.script = "script.sh";
    task.outputFiles = [
      {
        name: "output.txt",
        dst: [
          { dstNode: "comp1" },
          { dstNode: "comp2" },
          { origin: "some-origin", dstNode: "comp3" }
        ]
      }
    ];

    const scriptPath = path.resolve(projectRootDir, task.name, "script.sh");
    await fs.writeFile(scriptPath, "#!/bin/bash\necho 'Hello'");

    const getNextComponentsStub = sinon.stub(_internal, "getNextComponents").callsFake((components, component)=>{
      const nextComponentIDs = [];
      if (component.outputFiles) {
        component.outputFiles.forEach((outputFile)=>{
          outputFile.dst.forEach((dst)=>{
            if (!dst.origin) {
              nextComponentIDs.push(dst.dstNode);
            }
          });
        });
      }
      return components.filter((c)=>{
        return nextComponentIDs.includes(c.ID);
      });
    });

    const errors = await validateComponent(projectRootDir, task);

    expect(errors).to.be.empty;
    getNextComponentsStub.restore();
  });

  it("should handle complex component hierarchy in recursiveValidateComponents", async function () {
    sinon.stub(_internal, "getChildren").callsFake(async (projectRootDir, parentID)=>{
      if (parentID === "root") {
        return [
          { ID: "parent1", name: "parent1", type: "task", script: "script.sh" },
          { ID: "parent2", name: "parent2", type: "task", script: "script.sh" }
        ];
      } else if (parentID === "parent1") {
        return [
          { ID: "child1", name: "child1", type: "task", script: "script.sh" },
          { ID: "child2", name: "child2", type: "task", script: "script.sh" }
        ];
      } else if (parentID === "parent2") {
        return [
          { ID: "child3", name: "child3", type: "task", script: "script.sh", disable: true },
          { ID: "child4", name: "child4", type: "task", script: undefined }
        ];
      }
      return [];
    });

    sinon.stub(_internal, "hasChild").callsFake((component)=>{
      return component.ID === "parent1" || component.ID === "parent2";
    });

    sinon.stub(_internal, "isInitialComponent").resolves(true);

    const report = [];

    await recursiveValidateComponents(projectRootDir, "root", report);

    expect(report).to.be.an("array");
    expect(report.some((item)=>{
      return item.ID === "child4";
    })).to.be.true;
    expect(report.some((item)=>{
      return item.ID === "child3";
    })).to.be.false;
  });
  it("should validate component correctly", async function () {
    const task = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 0, y: 0 });
    task.script = "script.sh";
    fs.writeFileSync(path.resolve(projectRootDir, task.name, "script.sh"), "#!/bin/bash\necho 'Hello'");
    const errors = await validateComponent(projectRootDir, task);
    expect(errors).to.be.empty;
  });
  it("should detect invalid component", async function () {
    const task = {
      type: "task",
      ID: "test-task",
      name: "test-task"
    };
    const errors = await validateComponent(projectRootDir, task);
    expect(errors).to.not.be.empty;
    expect(errors[0].message).to.include("script is not specified");
  });
  it("should detect cycle graph", async function () {
    const cycleComponents = [
      { ID: "comp1", name: "comp1", parent: "root", next: ["comp2"] },
      { ID: "comp2", name: "comp2", parent: "root", next: ["comp3"] },
      { ID: "comp3", name: "comp3", parent: "root", next: ["comp1"] }
    ];
    const result = await getCycleGraph("dummy", cycleComponents);
    expect(result).to.be.an("array").that.is.not.empty;
    expect(result).to.include("comp1");
    expect(result).to.include("comp2");
    expect(result).to.include("comp3");
  });

  it("should validate parameterStudy component correctly", async function () {
    const ps = {
      type: "parameterStudy",
      ID: "test-ps",
      name: "test-ps",
      parameterFile: "params.json"
    };

    await fs.ensureDir(path.resolve(projectRootDir, ps.name));

    const params = {
      version: 2,
      targetFiles: [
        { targetName: "foo" }
      ],
      params: [
        { keyword: "foo", type: "min-max-step", min: 0, max: 4, step: 1 }
      ]
    };
    await fs.writeJson(path.resolve(projectRootDir, ps.name, "params.json"), params);

    const errors = await validateComponent(projectRootDir, ps);
    expect(errors).to.be.empty;
  });

  it("should validate component with inputFiles and outputFiles", async function () {
    const task = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 0, y: 0 });
    task.script = "script.sh";
    fs.writeFileSync(path.resolve(projectRootDir, task.name, "script.sh"), "#!/bin/bash\necho 'Hello'");

    task.inputFiles = [
      { name: "input.txt", src: [] },
      { name: "data/", src: [{ srcNode: "other" }] }
    ];
    task.outputFiles = [
      { name: "output.txt", dst: [] },
      { name: "results/", dst: [] }
    ];

    const errors = await validateComponent(projectRootDir, task);
    expect(errors).to.be.empty;
  });

  it("should call validateComponents with startComponentID", async function () {
    const task = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 0, y: 0 });
    task.script = "script.sh";
    fs.writeFileSync(path.resolve(projectRootDir, task.name, "script.sh"), "#!/bin/bash\necho 'Hello'");

    const { validateComponents: validateComponentsFunc } = await import("../../../app/core/validateComponents.js");
    const report = await validateComponentsFunc(projectRootDir, task.ID);
    expect(report).to.be.an("array");
  });

  it("should call validateComponents without startComponentID", async function () {
    const { validateComponents: validateComponentsFunc } = await import("../../../app/core/validateComponents.js");
    const report = await validateComponentsFunc(projectRootDir);
    expect(report).to.be.an("array");
  });

  //reproduction test for issue #977
  //continue/break components with no condition configured (the default state right after
  //being created from the palette) must be reported as invalid by validateComponent, just like
  //"if"/"while" components are via validateConditionalCheck. Currently, validateComponent's
  //type switch has no branch for "continue"/"break", so they are silently treated as always-valid.
  it("should detect underconfigured continue component (no condition set) - issue #977", async function () {
    const forComponent = await createNewComponent(projectRootDir, projectRootDir, "for", { x: 0, y: 0 });
    forComponent.start = 0;
    forComponent.end = 10;
    forComponent.step = 1;

    const continueComponent = await createNewComponent(projectRootDir, path.resolve(projectRootDir, forComponent.name), "continue", { x: 0, y: 0 });

    //condition must default to null right after creation (nothing configured by the user yet)
    expect(continueComponent.condition).to.be.null;

    const errors = await validateComponent(projectRootDir, continueComponent);
    expect(errors).to.not.be.empty;
  });

  it("should detect underconfigured break component (no condition set) - issue #977", async function () {
    const forComponent = await createNewComponent(projectRootDir, projectRootDir, "for", { x: 0, y: 0 });
    forComponent.start = 0;
    forComponent.end = 10;
    forComponent.step = 1;

    const breakComponent = await createNewComponent(projectRootDir, path.resolve(projectRootDir, forComponent.name), "break", { x: 0, y: 0 });

    //condition must default to null right after creation (nothing configured by the user yet)
    expect(breakComponent.condition).to.be.null;

    const errors = await validateComponent(projectRootDir, breakComponent);
    expect(errors).to.not.be.empty;
  });
});

describe("recursiveValidateComponents", function () {
  this.timeout(10000);
  beforeEach(async function () {
    await setupTestDir(testDirRoot);

    try {
      await createNewProject(projectRootDir, "test project", null, "test", "test@example.com");
    } catch (e) {
      console.log(e);
      throw e;
    }
  });
  afterEach(()=>{
    sinon.restore();
  });
  after(async function () {
    if (!process.env.WHEEL_KEEP_FILES_AFTER_LAST_TEST) {
      await fs.remove(testDirRoot);
    }
  });

  it("should return empty report when no components exist", async function () {
    const report = [];
    await recursiveValidateComponents(projectRootDir, projectRootDir, report);
    expect(report).to.be.an("array").that.is.empty;
  });
  it("should detect invalid component", async function () {
    sinon.stub(_internal, "getChildren").resolves([
      {
        type: "task",
        ID: "invalid-task",
        name: "invalid-task"
      }
    ]);

    sinon.stub(_internal, "isInitialComponent").resolves(true);

    const report = [];
    await recursiveValidateComponents(projectRootDir, "root", report);
    expect(report).to.be.an("array").that.is.not.empty;
    expect(report[0]).to.have.property("errors");
    expect(report[0].errors[0].message).to.include("script is not specified");
  });
  it("should detect missing initial component", async function () {
    sinon.stub(_internal, "getChildren").resolves([
      {
        type: "task",
        ID: "task1",
        name: "task1",
        script: "script.sh"
      }
    ]);

    sinon.stub(_internal, "getComponentFullName").callsFake(async (projectRootDir, ID)=>{
      return `Component ${ID}`;
    });

    sinon.stub(_internal, "isInitialComponent").resolves(false);

    const report = [];
    await recursiveValidateComponents(projectRootDir, "parent", report);
    expect(report).to.be.an("array").that.is.not.empty;
    expect(report.some((item)=>{
      return item.ID === "parent" && item.errors[0].message.includes("no initial component in children");
    })).to.be.true;
  });
  it("should validate components recursively", async function () {
    const getChildrenStub = sinon.stub(_internal, "getChildren").resolves([
      {
        type: "task",
        ID: "valid-task",
        name: "valid-task",
        script: "script.sh"
      }
    ]);

    const getComponentFullNameStub = sinon.stub(_internal, "getComponentFullName").callsFake(async (projectRootDir, ID)=>{
      return `Component ${ID}`;
    });
    const isInitialComponentStub = sinon.stub(_internal, "isInitialComponent").resolves(true);

    const validateComponentStub = sinon.stub(_internal, "validateComponent").resolves([]);

    const report = [];
    await recursiveValidateComponents(projectRootDir, "root", report);
    expect(report).to.be.an("array").that.is.empty;
    getChildrenStub.restore();
    getComponentFullNameStub.restore();
    isInitialComponentStub.restore();
    validateComponentStub.restore();
  });
  it("should detect cycle graph", async function () {
    const getChildrenStub = sinon.stub(_internal, "getChildren").resolves([
      { ID: "comp1", name: "comp1", parent: "root", next: ["comp2"] },
      { ID: "comp2", name: "comp2", parent: "root", next: ["comp3"] },
      { ID: "comp3", name: "comp3", parent: "root", next: ["comp1"] }
    ]);
    const getComponentFullNameStub = sinon.stub(_internal, "getComponentFullName").callsFake(async (projectRootDir, ID)=>{
      return `Component ${ID}`;
    });
    const isInitialComponentStub = sinon.stub(_internal, "isInitialComponent").resolves(true);

    const report = [];
    await recursiveValidateComponents(projectRootDir, "root", report);
    expect(report).to.be.an("array").that.is.not.empty;
    expect(report.some((item)=>{
      return item.errors[0].message.includes("cycle graph detected");
    })).to.be.true;
    getChildrenStub.restore();
    getComponentFullNameStub.restore();
    isInitialComponentStub.restore();
  });
});

describe("checkComponentDependency", function () {
  this.timeout(10000);
  beforeEach(async function () {
    await setupTestDir(testDirRoot);

    try {
      await createNewProject(projectRootDir, "test project", null, "test", "test@example.com");
    } catch (e) {
      console.log(e);
      throw e;
    }
  });
  afterEach(()=>{
    sinon.restore();
  });
  after(async function () {
    if (!process.env.WHEEL_KEEP_FILES_AFTER_LAST_TEST) {
      await fs.remove(testDirRoot);
    }
  });

  it("should return empty array when no dependencies exist", async function () {
    sinon.stub(_internal, "getChildren").resolves([
      { ID: "comp1", name: "comp1", parent: "root", next: [] },
      { ID: "comp2", name: "comp2", parent: "root", next: [] }
    ]);

    const result = await checkComponentDependency(projectRootDir, "root");
    expect(result).to.be.an("array").that.is.empty;
  });

  it("should return empty array for valid dependencies", async function () {
    sinon.stub(_internal, "getChildren").resolves([
      { ID: "comp1", name: "comp1", parent: "root", next: ["comp2"] },
      { ID: "comp2", name: "comp2", parent: "root", next: ["comp3"] },
      { ID: "comp3", name: "comp3", parent: "root", next: [] }
    ]);

    const result = await checkComponentDependency(projectRootDir, "root");
    expect(result).to.be.an("array").that.is.empty;
  });

  it("should detect cycle dependencies", async function () {
    sinon.stub(_internal, "getChildren").resolves([
      { ID: "comp1", name: "comp1", parent: "root", next: ["comp2"] },
      { ID: "comp2", name: "comp2", parent: "root", next: ["comp3"] },
      { ID: "comp3", name: "comp3", parent: "root", next: ["comp1"] }
    ]);

    const result = await checkComponentDependency(projectRootDir, "root");
    expect(result).to.be.an("array").that.is.not.empty;
    expect(result).to.include("comp1");
    expect(result).to.include("comp2");
    expect(result).to.include("comp3");
  });

  it("should handle complex dependencies", async function () {
    sinon.stub(_internal, "getChildren").resolves([
      { ID: "comp1", name: "comp1", parent: "root", next: ["comp2", "comp3"] },
      { ID: "comp2", name: "comp2", parent: "root", next: ["comp4"] },
      { ID: "comp3", name: "comp3", parent: "root", next: ["comp5"] },
      { ID: "comp4", name: "comp4", parent: "root", next: [] },
      { ID: "comp5", name: "comp5", parent: "root", next: [] }
    ]);

    const result = await checkComponentDependency(projectRootDir, "root");
    expect(result).to.be.an("array").that.is.empty;
  });

  it("should detect cycle in complex dependencies", async function () {
    sinon.stub(_internal, "getChildren").resolves([
      { ID: "comp1", name: "comp1", parent: "root", next: ["comp2", "comp3"] },
      { ID: "comp2", name: "comp2", parent: "root", next: ["comp4"] },
      { ID: "comp3", name: "comp3", parent: "root", next: ["comp5"] },
      { ID: "comp4", name: "comp4", parent: "root", next: ["comp6"] },
      { ID: "comp5", name: "comp5", parent: "root", next: [] },
      { ID: "comp6", name: "comp6", parent: "root", next: ["comp2"] }
    ]);

    const result = await checkComponentDependency(projectRootDir, "root");
    expect(result).to.be.an("array").that.is.not.empty;
    expect(result).to.include("comp2");
    expect(result).to.include("comp4");
    expect(result).to.include("comp6");
  });
});

describe("validateComponent with disabled component", function () {
  this.timeout(10000);
  beforeEach(async function () {
    await setupTestDir(testDirRoot);

    try {
      await createNewProject(projectRootDir, "test project", null, "test", "test@example.com");
    } catch (e) {
      console.log(e);
      throw e;
    }
  });
  after(async function () {
    if (!process.env.WHEEL_KEEP_FILES_AFTER_LAST_TEST) {
      await fs.remove(testDirRoot);
    }
  });

  it("should skip disabled components during validation", async function () {
    const getChildrenStub = sinon.stub(_internal, "getChildren").resolves([
      {
        type: "task",
        ID: "disabled-task",
        name: "disabled-task",
        disable: true,
        script: undefined
      }
    ]);
    const getComponentFullNameStub = sinon.stub(_internal, "getComponentFullName").callsFake(async (projectRootDir, ID)=>{
      return `Component ${ID}`;
    });
    const isInitialComponentStub = sinon.stub(_internal, "isInitialComponent").resolves(true);

    const report = [];
    await recursiveValidateComponents(projectRootDir, "root", report);
    expect(report).to.be.an("array").that.is.empty;

    getChildrenStub.restore();
    getComponentFullNameStub.restore();
    isInitialComponentStub.restore();
  });
});

describe("validateComponent with component having children", function () {
  this.timeout(10000);
  beforeEach(async function () {
    await setupTestDir(testDirRoot);

    try {
      await createNewProject(projectRootDir, "test project", null, "test", "test@example.com");
    } catch (e) {
      console.log(e);
      throw e;
    }
  });
  after(async function () {
    if (!process.env.WHEEL_KEEP_FILES_AFTER_LAST_TEST) {
      await fs.remove(testDirRoot);
    }
  });

  it("should recursively validate components with children", async function () {
    const getChildrenStub = sinon.stub(_internal, "getChildren").callsFake(async (projectRootDir, parentID)=>{
      if (parentID === "root") {
        return [
          {
            type: "task",
            ID: "parent-task",
            name: "parent-task",
            script: "script.sh"
          }
        ];
      } else if (parentID === "parent-task") {
        return [
          {
            type: "task",
            ID: "child-task",
            name: "child-task",
            script: undefined
          }
        ];
      }
      return [];
    });

    const getComponentFullNameStub = sinon.stub(_internal, "getComponentFullName").callsFake(async (projectRootDir, ID)=>{
      return `Component ${ID}`;
    });

    const isInitialComponentStub = sinon.stub(_internal, "isInitialComponent").resolves(true);

    const hasChildStub = sinon.stub(_internal, "hasChild").callsFake((component)=>{
      return component.ID === "parent-task";
    });

    const validateComponentStub = sinon.stub(_internal, "validateComponent").callsFake(async (projectRootDir, component)=>{
      if (component.ID === "child-task") {
        return [createValidationError("script is not specified")];
      }
      return [];
    });

    const report = [];
    await recursiveValidateComponents(projectRootDir, "root", report);

    getChildrenStub.restore();
    getComponentFullNameStub.restore();
    isInitialComponentStub.restore();
    hasChildStub.restore();
    validateComponentStub.restore();

    expect(report).to.be.an("array").that.is.not.empty;
    expect(report[0]).to.have.property("ID", "child-task");
    expect(report[0]).to.have.property("errors");
    expect(report[0].errors[0].message).to.include("script is not specified");
  });
});
