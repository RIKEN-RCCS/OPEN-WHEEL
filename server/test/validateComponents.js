/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path = require("path");
const fs = require("fs-extra");

//setup test framework
const rewire = require("rewire");
const chai = require("chai");
const expect = chai.expect;
chai.use(require("sinon-chai"));
chai.use(require("chai-fs"));
chai.use(require("chai-json-schema"));
chai.use(require("deep-equal-in-any-order"));
chai.use(require("chai-as-promised"));
const { createNewProject, createNewComponent } = require("../app/core/projectFilesOperator");

//testee
const validateComponents = rewire("../app/core/validateComponents.js");
const validateTask = validateComponents.__get__("validateTask");
const validateStepjobTask = validateComponents.__get__("validateStepjobTask");
const validateStepjob = validateComponents.__get__("validateStepjob");
const validateBulkjobTask = validateComponents.__get__("validateBulkjobTask");
const validateConditionalCheck = validateComponents.__get__("validateConditionalCheck");
const validateKeepProp = validateComponents.__get__("validateKeepProp");
const validateForLoop = validateComponents.__get__("validateForLoop");
const validateParameterStudy = validateComponents.__get__("validateParameterStudy");
const validateForeach = validateComponents.__get__("validateForeach");
const validateStorage = validateComponents.__get__("validateStorage");
const validateInputFiles = validateComponents.__get__("validateInputFiles");
const validateOutputFiles = validateComponents.__get__("validateOutputFiles");
const getCycleGraph = validateComponents.__get__("getCycleGraph");

//test data
const testDirRoot = "WHEEL_TEST_TMP";
validateComponents.__set__("remoteHost", {
  query: (name, hostname)=>{
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
  }
});

validateComponents.__set__("jobScheduler", {
  hoge: { queueOpt: "-q" },
  huga: { queueOpt: "-q", supportStepjob: true },
  hige: { queueOpt: "-q", supportBulkjob: true }
});

const projectRootDir = path.resolve(testDirRoot, "testProject.wheel");
describe("validation component UT", function () {
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
  describe("validateTask", ()=>{
    let task;
    beforeEach(async ()=>{
      task = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 0, y: 0 });
    });
    it("should be rejected with 'no script' error for default component", ()=>{
      expect(validateTask(projectRootDir, task)).to.be.rejectedWith("script is not specified");
    });
    it("should be rejected if name is not defined", ()=>{
      task.name = null;
      expect(validateTask(projectRootDir, task)).to.be.rejectedWith("illegal path");
    });
    it("should be rejected if not existing remote host is set", ()=>{
      task.useJobScheduler = true;
      task.host = "hoge";
      expect(validateTask(projectRootDir, task)).to.be.rejectedWith(/remote host setting for .* not found/);
    });
    it("should be rejected if not existing jobScheduler is set", ()=>{
      task.useJobScheduler = true;
      task.host = "OK";
      expect(validateTask(projectRootDir, task)).to.be.rejectedWith(/job scheduler for .* is not supported/);
    });
    it("should be rejected if not existing jobScheduler is set", ()=>{
      task.useJobScheduler = true;
      task.host = "jobOK";
      task.submitOption = "-q foo bar -i hoge";
      expect(validateTask(projectRootDir, task)).to.be.rejectedWith("submit option duplicate queue option");
    });
    it("should be rejected if script is not existing", ()=>{
      task.script = "hoge";
      expect(validateTask(projectRootDir, task)).to.be.rejectedWith("script is not existing file");
    });
    it("should be rejected if script is not file", ()=>{
      task.script = "hoge";
      fs.mkdirSync(path.resolve(projectRootDir, task.name, "hoge"));
      expect(validateTask(projectRootDir, task)).to.be.rejectedWith("script is not file");
    });
    it("should be resolved with true if required prop is set", async ()=>{
      task.script = "hoge";
      fs.writeFileSync(path.resolve(projectRootDir, task.name, "hoge"), "hoge");
      expect(await validateTask(projectRootDir, task)).to.be.true;
    });
  });
  describe("validateStepjobTask", ()=>{
    let stepjobTask;
    beforeEach(async ()=>{
      stepjobTask = await createNewComponent(projectRootDir, projectRootDir, "stepjobTask", { x: 0, y: 0 });
    });
    it("should be rejected with 'no script' error for default component", ()=>{
      expect(validateStepjobTask(projectRootDir, stepjobTask)).to.be.rejectedWith("script is not specified");
    });
    it ("should be rejected with 'initial stepjobTask cannot specified the Dependency form' if initial stepjob task has dependency form", ()=>{
      stepjobTask.useDependency = "hoge";
      expect(validateStepjobTask(projectRootDir, stepjobTask)).to.be.rejectedWith("initial stepjobTask cannot specified the Dependency form");
    });
    it("should be rejected if script file is not existing", ()=>{
      stepjobTask.script = "hoge";
      expect(validateStepjobTask(projectRootDir, stepjobTask)).to.be.rejectedWith("script is not existing file");
    });
    it("should be rejected if script is not file", ()=>{
      stepjobTask.script = "hoge";
      fs.mkdirSync(path.resolve(projectRootDir, stepjobTask.name, "hoge"));
      expect(validateStepjobTask(projectRootDir, stepjobTask)).to.be.rejectedWith("script is not file");
    });
    it("should be resolved with true if required prop is set", async ()=>{
      stepjobTask.script = "hoge";
      fs.writeFileSync(path.resolve(projectRootDir, stepjobTask.name, "hoge"), "hoge");
      expect(await validateStepjobTask(projectRootDir, stepjobTask)).to.be.true;
    });
  });
  describe("validateStepjob", ()=>{
    let stepjob;
    beforeEach(async ()=>{
      stepjob = await createNewComponent(projectRootDir, projectRootDir, "stepjob", { x: 0, y: 0 });
    });
    it("should be rejected if useJobScheduler is not set", ()=>{
      stepjob.useJobScheduler = false;
      expect(validateStepjob(projectRootDir, stepjob)).to.be.rejectedWith("useJobScheduler must be set");
    });
    it("should be rejected if host is not set", ()=>{
      expect(validateStepjob(projectRootDir, stepjob)).to.be.rejectedWith("stepjob is only supported on remotehost");
    });
    it("should be rejected if host not found", ()=>{
      stepjob.host = "hoge";
      expect(validateStepjob(projectRootDir, stepjob)).to.be.rejectedWith(/remote host setting for .* not found/);
    });
    it("should be rejected if host is not support job", ()=>{
      stepjob.host = "OK";
      expect(validateStepjob(projectRootDir, stepjob)).to.be.rejectedWith(/job scheduler for .* is not supported/);
    });
    it("should be rejected if jobscheduler is not support stepjob", ()=>{
      stepjob.host = "jobOK";
      expect(validateStepjob(projectRootDir, stepjob)).to.be.rejectedWith(/job scheduler .* does not support stepjob/);
    });
    it("should be rejected if host is not set to use stepjob", ()=>{
      stepjob.host = "stepjobNG";
      expect(validateStepjob(projectRootDir, stepjob)).to.be.rejectedWith(/.* does not set to use stepjob/);
    });
    it("should be resolved with true", async ()=>{
      stepjob.host = "stepjobOK";
      expect(await validateStepjob(projectRootDir, stepjob)).to.be.true;
    });
  });
  describe("validateBulkjobTask", ()=>{
    let bulkjobTask;
    beforeEach(async ()=>{
      bulkjobTask = await createNewComponent(projectRootDir, projectRootDir, "bulkjobTask", { x: 0, y: 0 });
    });
    it("should be rejected if name is not defined", ()=>{
      bulkjobTask.name = null;
      expect(validateBulkjobTask(projectRootDir, bulkjobTask)).to.be.rejectedWith("illegal path");
    });
    it("should be rejected if useJobScheduler is not set", ()=>{
      bulkjobTask.useJobScheduler = false;
      expect(validateBulkjobTask(projectRootDir, bulkjobTask)).to.be.rejectedWith("useJobScheduler must be set");
    });
    it("should be rejected if host is not set", ()=>{
      expect(validateBulkjobTask(projectRootDir, bulkjobTask)).to.be.rejectedWith("bulkjobTask is only supported on remotehost");
    });
    it("should be rejected if host not found", ()=>{
      bulkjobTask.host = "hoge";
      expect(validateBulkjobTask(projectRootDir, bulkjobTask)).to.be.rejectedWith(/remote host setting for .* not found/);
    });
    it("should be rejected if host is not support job", ()=>{
      bulkjobTask.host = "OK";
      expect(validateBulkjobTask(projectRootDir, bulkjobTask)).to.be.rejectedWith(/job scheduler for .* is not supported/);
    });
    it("should be rejected if jobscheduler is not support bulkjobTask", ()=>{
      bulkjobTask.host = "jobOK";
      expect(validateBulkjobTask(projectRootDir, bulkjobTask)).to.be.rejectedWith(/job scheduler .* does not support bulkjob/);
    });
    it("should be rejected if host is not set to use bulkjob", ()=>{
      bulkjobTask.host = "bulkjobNG";
      expect(validateBulkjobTask(projectRootDir, bulkjobTask)).to.be.rejectedWith(/.* does not set to use bulkjob/);
    });
    it("should be rejected if usePSSettingFile is set but parameterFile is not set", async ()=>{
      bulkjobTask.host = "bulkjobOK";
      //bulkjobTask.usePSSettingFile is true by default, so we do not set it here
      expect(validateBulkjobTask(projectRootDir, bulkjobTask)).to.be.rejectedWith("usePSSettingFile is set but parameter setting file is not specified");
    });
    it.skip("should be rejected if usePSSettingFile and parameterFile is set but parameterFile does not exist", ()=>{
    });
    it.skip("should be rejected if parameterFile is not file", ()=>{
    });
    it.skip("should be rejected if parameterFile is not valid parameterFile", ()=>{
    });

    it("should be rejected if usePSSettingFile is not set and startBulkNumber is not set", async ()=>{
      bulkjobTask.host = "bulkjobOK";
      bulkjobTask.usePSSettingFile = false;
      expect(validateBulkjobTask(projectRootDir, bulkjobTask)).to.be.rejectedWith("startBulkNumber must be specified");
    });
    it("should be rejected if usePSSettingFile is not set and startBulkNumber is negative value", async ()=>{
      bulkjobTask.host = "bulkjobOK";
      bulkjobTask.usePSSettingFile = false;
      bulkjobTask.startBulkNumber = -1;
      expect(validateBulkjobTask(projectRootDir, bulkjobTask)).to.be.rejectedWith("startBulkNumber must be integer and 0 or more");
    });
    it("should be rejected if usePSSettingFile is not set and endBulkNumber is not set", async ()=>{
      bulkjobTask.host = "bulkjobOK";
      bulkjobTask.usePSSettingFile = false;
      bulkjobTask.startBulkNumber = 1;
      expect(validateBulkjobTask(projectRootDir, bulkjobTask)).to.be.rejectedWith("endBulkNumber must be specified");
    });
    it("should be rejected if endBulkNumber is less or equal startBulkNumber", async ()=>{
      bulkjobTask.host = "bulkjobOK";
      bulkjobTask.usePSSettingFile = false;
      bulkjobTask.startBulkNumber = 1;
      bulkjobTask.endBulkNumber = 1;
      expect(validateBulkjobTask(projectRootDir, bulkjobTask)).to.be.rejectedWith("endBulkNumber must be integer and greater than startBulkNumber");
    });
    it("should be rejected if manualFinishCondition is set but condition is not specidied", async ()=>{
      bulkjobTask.host = "bulkjobOK";
      bulkjobTask.usePSSettingFile = false;
      bulkjobTask.startBulkNumber = 1;
      bulkjobTask.endBulkNumber = 2;
      bulkjobTask.manualFinishCondition = true;
      expect(validateBulkjobTask(projectRootDir, bulkjobTask)).to.be.rejectedWith("condition is not specified");
    });
    //TODO conditionを実際に指定したケースの確認

    it("should be rejected if script is not set", async ()=>{
      bulkjobTask.host = "bulkjobOK";
      bulkjobTask.usePSSettingFile = false;
      bulkjobTask.startBulkNumber = 1;
      bulkjobTask.endBulkNumber = 2;
      expect(validateBulkjobTask(projectRootDir, bulkjobTask)).to.be.rejectedWith("script is not specified");
    });
    it("should be rejected if script is not existing", ()=>{
      bulkjobTask.host = "bulkjobOK";
      bulkjobTask.usePSSettingFile = false;
      bulkjobTask.startBulkNumber = 1;
      bulkjobTask.endBulkNumber = 2;
      bulkjobTask.script = "hoge";
      expect(validateBulkjobTask(projectRootDir, bulkjobTask)).to.be.rejectedWith("script is not exist");
    });
    it("should be rejected if script is not file", ()=>{
      bulkjobTask.host = "bulkjobOK";
      bulkjobTask.usePSSettingFile = false;
      bulkjobTask.startBulkNumber = 1;
      bulkjobTask.endBulkNumber = 2;
      bulkjobTask.script = "hoge";
      fs.mkdirSync(path.resolve(projectRootDir, bulkjobTask.name, "hoge"));
      expect(validateBulkjobTask(projectRootDir, bulkjobTask)).to.be.rejectedWith("script is not file");
    });
    it("should be resolved with true", async ()=>{
      bulkjobTask.host = "bulkjobOK";
      bulkjobTask.usePSSettingFile = false;
      bulkjobTask.startBulkNumber = 1;
      bulkjobTask.endBulkNumber = 2;
      bulkjobTask.script = "hoge";
      fs.writeFileSync(path.resolve(projectRootDir, bulkjobTask.name, "hoge"), "hoge");
      expect(await validateBulkjobTask(projectRootDir, bulkjobTask)).to.be.true;
    });
  });
  describe("validateConditionalCheck", ()=>{
    let ifComponent;
    let whileComponent;
    beforeEach(async ()=>{
      ifComponent = await createNewComponent(projectRootDir, projectRootDir, "if", { x: 0, y: 0 });
      whileComponent = await createNewComponent(projectRootDir, projectRootDir, "while", { x: 0, y: 0 });
    });
    it("should reject if condition is not specified", ()=>{
      expect(validateConditionalCheck(projectRootDir, ifComponent)).to.be.rejectedWith("condition is not specified");
      expect(validateConditionalCheck(projectRootDir, whileComponent)).to.be.rejectedWith("condition is not specified");
    });
    it("should reject if condition exists but it is not file", ()=>{
      ifComponent.condition = "hoge";
      fs.mkdirSync(path.resolve(projectRootDir, ifComponent.name, "hoge"));
      whileComponent.condition = "hoge";
      fs.mkdirSync(path.resolve(projectRootDir, whileComponent.name, "hoge"));
      expect(validateConditionalCheck(projectRootDir, ifComponent)).to.be.rejectedWith(/condition is exist but it is not file .*/);
      expect(validateConditionalCheck(projectRootDir, whileComponent)).to.be.rejectedWith(/condition is exist but it is not file .*/);
    });
  });
  describe("validateKeepProp", ()=>{
    let whileComponent;
    let forComponent;
    let foreachComponent;
    beforeEach(async ()=>{
      forComponent = await createNewComponent(projectRootDir, projectRootDir, "for", { x: 0, y: 0 });
      foreachComponent = await createNewComponent(projectRootDir, projectRootDir, "foreach", { x: 0, y: 0 });
      whileComponent = await createNewComponent(projectRootDir, projectRootDir, "while", { x: 0, y: 0 });
    });
    it("should be rejected if keep is non-empty string", ()=>{
      whileComponent.keep = "hoge";
      forComponent.keep = "hoge";
      foreachComponent.keep = "hoge";
      expect(validateKeepProp(whileComponent)).to.be.rejectedWith("keep must be positive integer");
      expect(validateKeepProp(forComponent)).to.be.rejectedWith("keep must be positive integer");
      expect(validateKeepProp(foreachComponent)).to.be.rejectedWith("keep must be positive integer");
    });
    it("should be rejected if keep is real number", ()=>{
      whileComponent.keep = 3.1;
      forComponent.keep = 3.1;
      foreachComponent.keep = 3.1;
      expect(validateKeepProp(whileComponent)).to.be.rejectedWith("keep must be positive integer");
      expect(validateKeepProp(forComponent)).to.be.rejectedWith("keep must be positive integer");
      expect(validateKeepProp(foreachComponent)).to.be.rejectedWith("keep must be positive integer");
    });
    it("should be rejected if keep is negative integer", ()=>{
      whileComponent.keep = -1;
      forComponent.keep = -1;
      foreachComponent.keep = -1;
      expect(validateKeepProp(whileComponent)).to.be.rejectedWith("keep must be positive integer");
      expect(validateKeepProp(forComponent)).to.be.rejectedWith("keep must be positive integer");
      expect(validateKeepProp(foreachComponent)).to.be.rejectedWith("keep must be positive integer");
    });
    it("should be resolved with true if keep is empty string", async ()=>{
      whileComponent.keep = "";
      forComponent.keep = "";
      foreachComponent.keep = "";
      expect(await validateKeepProp(whileComponent)).to.be.true;
      expect(await validateKeepProp(forComponent)).to.be.true;
      expect(await validateKeepProp(foreachComponent)).to.be.true;
    });
    it("should be resolved with true if keep is null", async ()=>{
      whileComponent.keep = null;
      forComponent.keep = null;
      foreachComponent.keep = null;
      expect(await validateKeepProp(whileComponent)).to.be.true;
      expect(await validateKeepProp(forComponent)).to.be.true;
      expect(await validateKeepProp(foreachComponent)).to.be.true;
    });
    it("should be resolved with true if keep is positive integer", async ()=>{
      whileComponent.keep = 5;
      forComponent.keep = 5;
      foreachComponent.keep = 5;
      expect(await validateKeepProp(whileComponent)).to.be.true;
      expect(await validateKeepProp(forComponent)).to.be.true;
      expect(await validateKeepProp(foreachComponent)).to.be.true;
    });
  });
  describe("validateForLoop", ()=>{
    let forComponent;
    beforeEach(async ()=>{
      forComponent = await createNewComponent(projectRootDir, projectRootDir, "foreach", { x: 0, y: 0 });
    });
    it("should be rejected if start is not number", ()=>{
      forComponent.start = "hoge";
      expect(validateForLoop(forComponent)).to.be.rejectedWith("start must be number");
    });
    it("should be rejected if step is not number", ()=>{
      forComponent.start = 1;
      forComponent.step = "hoge";
      expect(validateForLoop(forComponent)).to.be.rejectedWith("step must be number");
    });
    it("should be rejected if end is not number", ()=>{
      forComponent.start = 1;
      forComponent.step = 2;
      forComponent.end = "hoge";
      expect(validateForLoop(forComponent)).to.be.rejectedWith("end must be number");
    });
    it("should be rejected if step is 0", ()=>{
      forComponent.start = 1;
      forComponent.step = 0;
      forComponent.end = 3;
      expect(validateForLoop(forComponent)).to.be.rejectedWith("infinite loop");
    });
    it("should be rejected if step is wrong direction", ()=>{
      forComponent.start = 1;
      forComponent.step = -1;
      forComponent.end = 3;
      expect(validateForLoop(forComponent)).to.be.rejectedWith("infinite loop");
    });
    it("should be resolved with true", async ()=>{
      forComponent.start = 1;
      forComponent.step = 2;
      forComponent.end = 3;
      expect(await validateForLoop(forComponent)).to.be.true;
    });
  });
  describe("validateForeach", ()=>{
    let foreachComponent;
    beforeEach(async ()=>{
      foreachComponent = await createNewComponent(projectRootDir, projectRootDir, "foreach", { x: 0, y: 0 });
    });
    it("should be rejected if indexList is not array", ()=>{
      foreachComponent.indexList = "hoge";
      expect(validateForeach(foreachComponent)).to.be.rejectedWith("index list is broken");
    });
    it("should be rejected if indexList is empty array", ()=>{
      expect(validateForeach(foreachComponent)).to.be.rejectedWith("index list is empty");
    });
    it("should be resolved with true", async ()=>{
      foreachComponent.indexList.push("hoge");
      expect(await validateForeach(foreachComponent)).to.be.true;
    });
  });
  describe("validateParameterStudy", ()=>{
    let ps;
    beforeEach(async ()=>{
      ps = await createNewComponent(projectRootDir, projectRootDir, "PS", { x: 0, y: 0 });
    });
    it("should be rejected if parameterFile is not set", ()=>{
      ps.parameterFile = null;
      expect(validateParameterStudy(projectRootDir, ps)).to.be.rejectedWith("parameter setting file is not specified");
    });
    it("should be rejected if parameterFile is not file", ()=>{
      ps.parameterFile = "hoge";
      fs.mkdirSync(path.resolve(projectRootDir, ps.name, "hoge"));
      expect(validateParameterStudy(projectRootDir, ps)).to.be.rejectedWith("parameter setting file is not file");
    });
    it("should be rejected if parameterFile is not valid JSON file", ()=>{
      ps.parameterFile = "hoge";
      fs.writeFileSync(path.resolve(projectRootDir, ps.name, "hoge"), "hoge");
      expect(validateParameterStudy(projectRootDir, ps)).to.be.rejectedWith("parameter setting file is not JSON file");
    });
    it("should be resolved with true if required prop is set", async ()=>{
      ps.parameterFile = "hoge";
      const params = {
        version: 2,
        targetFiles: [
          { targetName: "foo" }
        ],
        params: [
          { keyword: "foo", type: "min-max-step", min: 0, max: 4, step: 1 }
        ]
      };

      fs.writeJsonSync(path.resolve(projectRootDir, ps.name, "hoge"), params);
      expect(await validateParameterStudy(projectRootDir, ps)).to.be.true;
    });
  });
  describe("validateStorage", ()=>{
    let storage;
    beforeEach(async ()=>{
      storage = await createNewComponent(projectRootDir, projectRootDir, "storage", { x: 0, y: 0 });
    });
    it("should be rejected if storagePath is not set", ()=>{
      storage.storagePath = null;
      expect(validateStorage(storage)).to.be.rejectedWith("storagePath is not set");
    });
    it("should be rejected if storagePath is not existing path", ()=>{
      storage.storagePath = path.resolve(projectRootDir, "hoge");
      expect(validateStorage(storage)).to.be.rejectedWith("specified path does not exist on localhost");
    });
    it("should be rejected if storagePath is existing file", ()=>{
      fs.writeFileSync(path.resolve(projectRootDir, "hoge"), "hoge");
      storage.storagePath = path.resolve(projectRootDir, "hoge");
      expect(validateStorage(storage)).to.be.rejectedWith("specified path is not directory");
    });
    it("should be rejected if invalid host is set", ()=>{
      storage.host = "hoge";
      storage.storagePath = "hoge";
      expect(validateStorage(storage)).to.be.rejectedWith(/remote host setting for .* not found/);
    });
    it("should be resolved with true if storagePath is not existing path but host is set", async ()=>{
      storage.storagePath = path.resolve(projectRootDir, "hoge");
      storage.host = "OK";
      expect(await validateStorage(storage)).to.be.true;
    });
    it("should be resolved with true if storagePath is existing file but host is set", async ()=>{
      fs.writeFileSync(path.resolve(projectRootDir, "hoge"), "hoge");
      storage.storagePath = path.resolve(projectRootDir, "hoge");
      storage.host = "OK";
      expect(await validateStorage(storage)).to.be.true;
    });
  });
  describe("validateInputFiles", ()=>{
    let component;
    beforeEach(()=>{
      component = { inputFiles: [] };
    });
    it("should be rejected if one of input filename is invalid", ()=>{
      component.inputFiles.push({ name: "hoge", src: [] });
      component.inputFiles.push({ name: "h*ge", src: [] });
      expect(validateInputFiles(component)).to.be.rejectedWith(/.* is not allowed as input file./);
    });
    it("should be rejected if inputFile is file and has 2 or more connection", ()=>{
      component.inputFiles.push({ name: "hoge", src: [{}, {}] });
      expect(validateInputFiles(component)).to.be.rejectedWith(/inputFile .* data type is 'file' but it has two or more outputFiles./);
    });
    it("should be resolved with true if inputFile is file and is not connected", async ()=>{
      component.inputFiles.push({ name: "hoge", src: [] });
      expect(await validateInputFiles(component)).to.be.true;
    });
    it("should be resolved with true if inputFile is file and has only 1 connection", async ()=>{
      component.inputFiles.push({ name: "hoge", src: [{}] });
      expect(await validateInputFiles(component)).to.be.true;
    });
    it("should be resolved with true if inputFile is directory and has 2 or more connection", async ()=>{
      component.inputFiles.push({ name: "hoge/", src: [{}, {}] });
      expect(await validateInputFiles(component)).to.be.true;
    });
  });
  describe("validateOutputFiles", ()=>{
    let component;
    beforeEach(()=>{
      component = { outputFiles: [] };
    });
    it("should be rejected if one of output filename is invalid", ()=>{
      component.outputFiles.push({ name: "   ", dst: [] });
      expect(validateOutputFiles(component)).to.be.rejectedWith(/.* is not allowed as output filename./);
    });
    it("should be resolved with true if one of output filename is invalid", async ()=>{
      component.outputFiles.push({ name: "hoge", dst: [] });
      expect(await validateOutputFiles(component)).to.be.true;
    });
  });
});

describe("test cycle graph checker", ()=>{
  const testFileDir = path.resolve("./test/testFiles");
  const {
    ok,
    notConnected,
    previousNext,
    inputOutput,
    both,
    withTail,
    branched,
    double,
    noComponents
  } = require(path.resolve(testFileDir, "cycleTestData.js"));
  it("should return empty array if no cycle graph detected", async ()=>{
    expect(await getCycleGraph("dummy", ok)).to.be.empty;
  });
  it("should return empty array if no cycle graph detected (not-connected)", async ()=>{
    expect(await getCycleGraph("dummy", notConnected)).to.be.empty;
  });
  it("should return array of component IDs in cycle graph (previous-next)", async ()=>{
    expect(await getCycleGraph("dummy", previousNext)).to.be.deep.equalInAnyOrder([
      "4fa023a0-239c-11ef-8cf7-6705d44703e7",
      "50a389e0-239c-11ef-8cf7-6705d44703e7",
      "5558ad80-239c-11ef-8cf7-6705d44703e7"
    ]);
  });
  it("should return array of component IDs in cycle graph (inputFile-outputFile)", async ()=>{
    expect(await getCycleGraph("dummy", inputOutput)).to.be.deep.equalInAnyOrder([
      "d8f85b40-239c-11ef-8cf7-6705d44703e7",
      "c0b173a0-239c-11ef-8cf7-6705d44703e7",
      "c1fc6a30-239c-11ef-8cf7-6705d44703e7"
    ]);
  });
  it("should return array of component IDs in cycle graph (both)", async ()=>{
    expect(await getCycleGraph("dummy", both)).to.be.deep.equalInAnyOrder([
      "264ca6d0-239d-11ef-8cf7-6705d44703e7",
      "2b0c2ab0-239d-11ef-8cf7-6705d44703e7",
      "2928ebc0-239d-11ef-8cf7-6705d44703e7",
      "27316180-239d-11ef-8cf7-6705d44703e7"
    ]);
  });
  it("should return array of component IDs in cycle graph (withTail)", async ()=>{
    expect(await getCycleGraph("dummy", withTail)).to.be.deep.equalInAnyOrder([
      "759cf950-26e6-11ef-8b70-5bf5636e4460",
      "7414f9c0-26e6-11ef-8b70-5bf5636e4460",
      "72a1bab0-26e6-11ef-8b70-5bf5636e4460"
    ]);
  });
  it("should return array of component IDs in cycle graph (branched)", async ()=>{
    expect(await getCycleGraph("dummy", branched)).to.be.deep.equalInAnyOrder([
      "a2093120-2790-11ef-a6ac-2f44b3871473",
      "a0b8e360-2790-11ef-a6ac-2f44b3871473",
      "9f7da440-2790-11ef-a6ac-2f44b3871473"
    ]);
  });
  it("should return array of component IDs in cycle graph (double)", async ()=>{
    expect(await getCycleGraph("dummy", double)).to.be.deep.equalInAnyOrder([
      "e70f86b0-26e7-11ef-8c4b-f7f88efdd21e",
      "e859e100-26e7-11ef-8c4b-f7f88efdd21e",
      "e97c40f0-26e7-11ef-8c4b-f7f88efdd21e",
      "f5f0baf0-26e7-11ef-8c4b-f7f88efdd21e",
      "f772ee20-26e7-11ef-8c4b-f7f88efdd21e"
    ]);
  });
  it("should return empty array if no components are given", async ()=>{
    expect(await getCycleGraph("dummy", noComponents)).to.be.empty;
  });
});
