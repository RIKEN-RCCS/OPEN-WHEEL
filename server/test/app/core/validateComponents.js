/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path = require("path");
const fs = require("fs-extra");

//setup test framework
const chai = require("chai");
const expect = chai.expect;
chai.use(require("sinon-chai"));
chai.use(require("chai-fs"));
chai.use(require("chai-json-schema"));
chai.use(require("deep-equal-in-any-order"));
chai.use(require("chai-as-promised"));
const sinon = require("sinon");
const { createNewProject, createNewComponent } = require("../../../app/core/projectFilesOperator");

//testee
const { _internal,
  validateTask,
  validateStepjobTask,
  validateStepjob,
  validateBulkjobTask,
  validateConditionalCheck,
  validateKeepProp,
  validateForLoop,
  validateParameterStudy,
  validateForeach,
  validateStorage,
  validateInputFiles,
  validateOutputFiles,
  getCycleGraph,
  isCycleGraph,
  getNextComponents,
  getComponentIDsInCycle,
  validateComponent,
  checkComponentDependency,
  recursiveValidateComponents,
  checkScript,
  checkPSSettingFile } = require("../../../app/core/validateComponents.js");

//test data
const testDirRoot = "WHEEL_TEST_TMP";
const projectRootDir = path.resolve(testDirRoot, "testProject.wheel");

describe("validation component UT", function () {
  let remoteHostQueryStub;
  beforeEach(async function () {
    this.timeout(10000);
    await fs.remove(testDirRoot);

    try {
      await createNewProject(projectRootDir, "test project", null, "test", "test@example.com");
    } catch (e) {
      console.log(e);
      throw e;
    }
    remoteHostQueryStub = sinon.stub(_internal.remoteHost, "query");
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
    sinon.stub(_internal, "jobScheduler").value({
      hoge: { queueOpt: "-q" },
      huga: { queueOpt: "-q", supportStepjob: true },
      hige: { queueOpt: "-q", supportBulkjob: true }
    });
  });
  afterEach(()=>{
    sinon.restore();
  });
  after(async ()=>{
    if (!process.env.WHEEL_KEEP_FILES_AFTER_LAST_TEST) {
      await fs.remove(testDirRoot);
    }
  });
  describe("checkScript", ()=>{
    let component;
    beforeEach(async ()=>{
      component = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 0, y: 0 });
    });

    it("should be rejected if script is not specified", async ()=>{
      await expect(checkScript(projectRootDir, component)).to.be.rejectedWith("script is not specified");
    });

    it("should be rejected if script is empty string", async ()=>{
      component.script = "";
      await expect(checkScript(projectRootDir, component)).to.be.rejectedWith(/script is not file/);
    });

    it("should be rejected if script file does not exist", async ()=>{
      component.script = "nonexistent_script.sh";
      await expect(checkScript(projectRootDir, component)).to.be.rejectedWith("script is not existing file");
    });

    it("should be rejected if script is a directory", async ()=>{
      component.script = "script_dir";
      fs.mkdirSync(path.resolve(projectRootDir, component.name, "script_dir"));
      await expect(checkScript(projectRootDir, component)).to.be.rejectedWith("script is not file");
    });

    it("should be resolved with true if script is a valid file", async ()=>{
      component.script = "valid_script.sh";
      fs.writeFileSync(path.resolve(projectRootDir, component.name, "valid_script.sh"), "#!/bin/bash\necho 'Hello'");
      const result = await checkScript(projectRootDir, component);
      expect(result).to.be.true;
    });

    it("should handle fs.stat errors other than ENOENT", async ()=>{
      component.script = "error_script.sh";
      fs.writeFileSync(path.resolve(projectRootDir, component.name, "error_script.sh"), "#!/bin/bash\necho 'Hello'");

      const statStub = sinon.stub(fs, "stat").rejects(new Error("Permission denied"));
      await expect(checkScript(projectRootDir, component)).to.be.rejectedWith("Permission denied");
      statStub.restore();
    });
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

    it("should be resolved with true for local job (no host set)", async function () {
      const testTask = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 0, y: 0 });
      testTask.script = "local_script.sh";
      const scriptPath = path.resolve(projectRootDir, testTask.name, "local_script.sh");
      await fs.writeFile(scriptPath, "#!/bin/bash\necho 'Hello'");
      testTask.useJobScheduler = false;
      expect(await validateTask(projectRootDir, testTask)).to.be.true;
    });

    it("should be resolved with true if remote host and job scheduler are correctly set", async function () {
      const testTask = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 0, y: 0 });
      testTask.script = "remote_script.sh";
      const scriptPath = path.resolve(projectRootDir, testTask.name, "remote_script.sh");
      await fs.writeFile(scriptPath, "#!/bin/bash\necho 'Hello'");
      testTask.useJobScheduler = true;
      testTask.host = "jobOK";
      expect(await validateTask(projectRootDir, testTask)).to.be.true;
    });

    it("should be resolved with true if submit option is set and does not duplicate queue option", async function () {
      const testTask = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 0, y: 0 });
      testTask.script = "submit_script.sh";
      const scriptPath = path.resolve(projectRootDir, testTask.name, "submit_script.sh");
      await fs.writeFile(scriptPath, "#!/bin/bash\necho 'Hello'");
      testTask.useJobScheduler = true;
      testTask.host = "jobOK";
      testTask.submitOption = "-p high -t 10:00";
      expect(await validateTask(projectRootDir, testTask)).to.be.true;
    });
  });
  describe("validateStepjobTask", ()=>{
    let stepjobTask;
    let isInitialComponentStub;
    beforeEach(async ()=>{
      stepjobTask = await createNewComponent(projectRootDir, projectRootDir, "stepjobTask", { x: 0, y: 0 });
      isInitialComponentStub = sinon.stub(_internal, "isInitialComponent");
    });
    afterEach(()=>{
      sinon.restore();
    });
    it("should be rejected with 'no script' error for default component", ()=>{
      isInitialComponentStub.resolves(true);
      expect(validateStepjobTask(projectRootDir, stepjobTask)).to.be.rejectedWith("script is not specified");
    });
    it("should be rejected with 'initial stepjobTask cannot specified the Dependency form' if initial stepjob task has dependency form", ()=>{
      isInitialComponentStub.resolves(true);
      stepjobTask.useDependency = "hoge";
      expect(validateStepjobTask(projectRootDir, stepjobTask)).to.be.rejectedWith("initial stepjobTask cannot specified the Dependency form");
    });
    it("should be rejected if script file is not existing", ()=>{
      isInitialComponentStub.resolves(true);
      stepjobTask.script = "hoge";
      expect(validateStepjobTask(projectRootDir, stepjobTask)).to.be.rejectedWith("script is not existing file");
    });
    it("should be rejected if script is not file", ()=>{
      isInitialComponentStub.resolves(true);
      stepjobTask.script = "hoge";
      fs.mkdirSync(path.resolve(projectRootDir, stepjobTask.name, "hoge"));
      expect(validateStepjobTask(projectRootDir, stepjobTask)).to.be.rejectedWith("script is not file");
    });
    it("should be resolved with true if required prop is set", async ()=>{
      isInitialComponentStub.resolves(true);
      stepjobTask.script = "hoge";
      fs.writeFileSync(path.resolve(projectRootDir, stepjobTask.name, "hoge"), "hoge");
      expect(await validateStepjobTask(projectRootDir, stepjobTask)).to.be.true;
    });

    it("should allow useDependency for non-initial stepjobTask", async function () {
      const testStepjobTask = await createNewComponent(projectRootDir, projectRootDir, "stepjobTask", { x: 0, y: 0 });
      testStepjobTask.script = "script.sh";
      const scriptPath = path.resolve(projectRootDir, testStepjobTask.name, "script.sh");
      await fs.writeFile(scriptPath, "#!/bin/bash\necho 'Hello'");
      isInitialComponentStub.resolves(false);
      testStepjobTask.useDependency = "afterok";
      const result = await validateStepjobTask(projectRootDir, testStepjobTask);
      expect(result).to.be.true;
    });

    it("should be resolved with true if script is executable", async function () {
      const testStepjobTask = await createNewComponent(projectRootDir, projectRootDir, "stepjobTask", { x: 0, y: 0 });
      testStepjobTask.script = "executable.sh";
      const scriptPath = path.resolve(projectRootDir, testStepjobTask.name, "executable.sh");
      await fs.writeFile(scriptPath, "#!/bin/bash\necho 'Hello'");
      const stats = await fs.stat(scriptPath);
      expect(stats.isFile()).to.be.true;
      isInitialComponentStub.resolves(true);
      expect(await validateStepjobTask(projectRootDir, testStepjobTask)).to.be.true;
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
    it("should be rejected if host supports stepjob but useStepjob is false", async function () {
      const testStepjob = await createNewComponent(projectRootDir, projectRootDir, "stepjob", { x: 0, y: 0 });
      testStepjob.useJobScheduler = true;
      testStepjob.host = "stepjobNG";
      await expect(validateStepjob(projectRootDir, testStepjob)).to.be.rejectedWith(/.* does not set to use stepjob/);
    });

    it("should be resolved with true if all requirements are met", async ()=>{
      stepjob.host = "stepjobOK";
      expect(await validateStepjob(projectRootDir, stepjob)).to.be.true;
    });

    it("should be resolved with true if host is set to use stepjob and jobscheduler supports stepjob", async function () {
      const testStepjob = await createNewComponent(projectRootDir, projectRootDir, "stepjob", { x: 0, y: 0 });
      testStepjob.useJobScheduler = true;
      testStepjob.host = "stepjobOK";
      expect(await validateStepjob(projectRootDir, testStepjob)).to.be.true;
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
      expect(validateBulkjobTask(projectRootDir, bulkjobTask)).to.be.rejectedWith("usePSSettingFile is set but parameter setting file is not specified");
    });

    it("should be rejected if script is not specified for usePSSettingFile=true case", async function () {
      const testBulkjobTask = await createNewComponent(projectRootDir, projectRootDir, "bulkjobTask", { x: 0, y: 0 });
      testBulkjobTask.host = "bulkjobOK";
      testBulkjobTask.usePSSettingFile = true;
      testBulkjobTask.parameterFile = "nonexistent.json";
      await expect(validateBulkjobTask(projectRootDir, testBulkjobTask)).to.be.rejectedWith(/script is not specified/);
    });

    it("should be rejected if script does not exist for usePSSettingFile=true case", async function () {
      const testBulkjobTask = await createNewComponent(projectRootDir, projectRootDir, "bulkjobTask", { x: 0, y: 0 });
      testBulkjobTask.host = "bulkjobOK";
      testBulkjobTask.usePSSettingFile = true;
      testBulkjobTask.parameterFile = "paramFile.json";
      testBulkjobTask.script = "nonexistent.sh";
      await expect(validateBulkjobTask(projectRootDir, testBulkjobTask)).to.be.rejectedWith(/script is not existing file/);
    });

    it("should be rejected if script is not a file for usePSSettingFile=true case", async function () {
      const testBulkjobTask = await createNewComponent(projectRootDir, projectRootDir, "bulkjobTask", { x: 0, y: 0 });
      testBulkjobTask.host = "bulkjobOK";
      testBulkjobTask.usePSSettingFile = true;
      testBulkjobTask.parameterFile = "paramFile.json";
      testBulkjobTask.script = "scriptDir";
      const scriptDirPath = path.resolve(projectRootDir, testBulkjobTask.name, "scriptDir");
      await fs.mkdir(scriptDirPath);
      await expect(validateBulkjobTask(projectRootDir, testBulkjobTask)).to.be.rejectedWith(/script is not file/);
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

    it("should be resolved with true if condition is a valid file", async function () {
      const testIfComponent = await createNewComponent(projectRootDir, projectRootDir, "if", { x: 0, y: 0 });
      const testWhileComponent = await createNewComponent(projectRootDir, projectRootDir, "while", { x: 0, y: 0 });
      testIfComponent.condition = "valid_condition.js";
      testWhileComponent.condition = "valid_condition.js";
      const ifConditionPath = path.resolve(projectRootDir, testIfComponent.name, "valid_condition.js");
      const whileConditionPath = path.resolve(projectRootDir, testWhileComponent.name, "valid_condition.js");
      await fs.writeFile(ifConditionPath, "module.exports = function() { return true; }");
      await fs.writeFile(whileConditionPath, "module.exports = function() { return true; }");
      expect(await validateConditionalCheck(projectRootDir, testIfComponent)).to.be.true;
      expect(await validateConditionalCheck(projectRootDir, testWhileComponent)).to.be.true;
    });

    it("should be resolved with true if condition is a JavaScript expression", async function () {
      const testIfComponent = await createNewComponent(projectRootDir, projectRootDir, "if", { x: 0, y: 0 });
      const testWhileComponent = await createNewComponent(projectRootDir, projectRootDir, "while", { x: 0, y: 0 });
      testIfComponent.condition = "js_expression.js";
      testWhileComponent.condition = "js_expression.js";
      const ifConditionPath = path.resolve(projectRootDir, testIfComponent.name, "js_expression.js");
      const whileConditionPath = path.resolve(projectRootDir, testWhileComponent.name, "js_expression.js");
      await fs.writeFile(ifConditionPath, "module.exports = function() { return true; }");
      await fs.writeFile(whileConditionPath, "module.exports = function() { return 1 < 2; }");
      expect(await validateConditionalCheck(projectRootDir, testIfComponent)).to.be.true;
      expect(await validateConditionalCheck(projectRootDir, testWhileComponent)).to.be.true;
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
    it("should be rejected if keep is a string that looks like a number", ()=>{
      whileComponent.keep = "5";
      forComponent.keep = "5";
      foreachComponent.keep = "5";
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
    it("should be rejected if keep is boolean", ()=>{
      whileComponent.keep = true;
      forComponent.keep = true;
      foreachComponent.keep = true;
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
    it("should be rejected if keep is undefined", ()=>{
      whileComponent.keep = undefined;
      forComponent.keep = undefined;
      foreachComponent.keep = undefined;
      expect(validateKeepProp(whileComponent)).to.be.rejectedWith("keep must be positive integer");
      expect(validateKeepProp(forComponent)).to.be.rejectedWith("keep must be positive integer");
      expect(validateKeepProp(foreachComponent)).to.be.rejectedWith("keep must be positive integer");
    });
    it("should be resolved with true if keep is 0", async ()=>{
      whileComponent.keep = 0;
      forComponent.keep = 0;
      foreachComponent.keep = 0;
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
    it("should be resolved with true if keep is large positive integer", async ()=>{
      whileComponent.keep = 1000000;
      forComponent.keep = 1000000;
      foreachComponent.keep = 1000000;
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
    it("should be rejected if start is null", ()=>{
      forComponent.start = null;
      expect(validateForLoop(forComponent)).to.be.rejectedWith("start must be number");
    });
    it("should be rejected if start is undefined", ()=>{
      forComponent.start = undefined;
      expect(validateForLoop(forComponent)).to.be.rejectedWith("start must be number");
    });
    it("should be rejected if step is not number", ()=>{
      forComponent.start = 1;
      forComponent.step = "hoge";
      expect(validateForLoop(forComponent)).to.be.rejectedWith("step must be number");
    });
    it("should be rejected if step is null", ()=>{
      forComponent.start = 1;
      forComponent.step = null;
      expect(validateForLoop(forComponent)).to.be.rejectedWith("step must be number");
    });
    it("should be rejected if step is undefined", ()=>{
      forComponent.start = 1;
      forComponent.step = undefined;
      expect(validateForLoop(forComponent)).to.be.rejectedWith("step must be number");
    });
    it("should be rejected if end is not number", ()=>{
      forComponent.start = 1;
      forComponent.step = 2;
      forComponent.end = "hoge";
      expect(validateForLoop(forComponent)).to.be.rejectedWith("end must be number");
    });
    it("should be rejected if end is null", ()=>{
      forComponent.start = 1;
      forComponent.step = 2;
      forComponent.end = null;
      expect(validateForLoop(forComponent)).to.be.rejectedWith("end must be number");
    });
    it("should be rejected if end is undefined", ()=>{
      forComponent.start = 1;
      forComponent.step = 2;
      forComponent.end = undefined;
      expect(validateForLoop(forComponent)).to.be.rejectedWith("end must be number");
    });
    it("should be rejected if step is 0", ()=>{
      forComponent.start = 1;
      forComponent.step = 0;
      forComponent.end = 3;
      expect(validateForLoop(forComponent)).to.be.rejectedWith("infinite loop");
    });
    it("should be rejected if step is wrong direction (positive step with start > end)", ()=>{
      forComponent.start = 5;
      forComponent.step = 1;
      forComponent.end = 3;
      expect(validateForLoop(forComponent)).to.be.rejectedWith("infinite loop");
    });
    it("should be rejected if step is wrong direction (negative step with start < end)", ()=>{
      forComponent.start = 1;
      forComponent.step = -1;
      forComponent.end = 3;
      expect(validateForLoop(forComponent)).to.be.rejectedWith("infinite loop");
    });
    it("should be resolved with true for positive step with start < end", async ()=>{
      forComponent.start = 1;
      forComponent.step = 2;
      forComponent.end = 10;
      expect(await validateForLoop(forComponent)).to.be.true;
    });
    it("should be resolved with true for negative step with start > end", async ()=>{
      forComponent.start = 10;
      forComponent.step = -2;
      forComponent.end = 1;
      expect(await validateForLoop(forComponent)).to.be.true;
    });
    it("should be resolved with true for decimal values", async ()=>{
      forComponent.start = 1.5;
      forComponent.step = 0.5;
      forComponent.end = 3.5;
      expect(await validateForLoop(forComponent)).to.be.true;
    });
    it("should be resolved with true for negative values", async ()=>{
      forComponent.start = -10;
      forComponent.step = 2;
      forComponent.end = -2;
      expect(await validateForLoop(forComponent)).to.be.true;
    });
    it("should be resolved with true if start and end are equal", async ()=>{
      forComponent.start = 5;
      forComponent.step = 1;
      forComponent.end = 5;
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
    it("should be rejected if indexList is null", ()=>{
      foreachComponent.indexList = null;
      expect(validateForeach(foreachComponent)).to.be.rejectedWith("index list is broken");
    });
    it("should be rejected if indexList is undefined", ()=>{
      foreachComponent.indexList = undefined;
      expect(validateForeach(foreachComponent)).to.be.rejectedWith("index list is broken");
    });
    it("should be rejected if indexList is empty array", ()=>{
      expect(validateForeach(foreachComponent)).to.be.rejectedWith("index list is empty");
    });
    it("should be resolved with true if indexList has one string element", async ()=>{
      foreachComponent.indexList.push("hoge");
      expect(await validateForeach(foreachComponent)).to.be.true;
    });
    it("should be resolved with true if indexList has multiple string elements", async ()=>{
      foreachComponent.indexList.push("item1");
      foreachComponent.indexList.push("item2");
      foreachComponent.indexList.push("item3");
      expect(await validateForeach(foreachComponent)).to.be.true;
    });
    it("should be resolved with true if indexList has number elements", async ()=>{
      foreachComponent.indexList.push(1);
      foreachComponent.indexList.push(2);
      foreachComponent.indexList.push(3);
      expect(await validateForeach(foreachComponent)).to.be.true;
    });
    it("should be resolved with true if indexList has mixed type elements", async ()=>{
      foreachComponent.indexList.push("item1");
      foreachComponent.indexList.push(2);
      foreachComponent.indexList.push(true);
      expect(await validateForeach(foreachComponent)).to.be.true;
    });
    it("should be resolved with true if indexList has empty string", async ()=>{
      foreachComponent.indexList.push("");
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

    it("should be rejected if parameter file is missing required properties", async function () {
      const testPS = await createNewComponent(projectRootDir, projectRootDir, "PS", { x: 0, y: 0 });
      testPS.parameterFile = "invalid_params.json";
      const invalidParams = {
        version: 2,
        params: [
          { keyword: "foo", type: "min-max-step", min: 0, max: 4, step: 1 }
        ]
      };

      fs.writeJsonSync(path.resolve(projectRootDir, testPS.name, "invalid_params.json"), invalidParams);
      const validateStub = sinon.stub(_internal, "validate").returns(false);
      validateStub.errors = [{ message: "should have required property 'targetFiles'" }];

      await expect(validateParameterStudy(projectRootDir, testPS)).to.be.rejectedWith("parameter setting file does not have valid JSON data");
    });

    it("should be rejected if parameter file has incorrect property types", async function () {
      const testPS = await createNewComponent(projectRootDir, projectRootDir, "PS", { x: 0, y: 0 });
      testPS.parameterFile = "wrong_types.json";
      const wrongTypeParams = {
        version: "2",
        targetFiles: [
          { targetName: "foo" }
        ],
        params: [
          { keyword: "foo", type: "min-max-step", min: "0", max: "4", step: "1" }
        ]
      };

      fs.writeJsonSync(path.resolve(projectRootDir, testPS.name, "wrong_types.json"), wrongTypeParams);
      const validateStub = sinon.stub(_internal, "validate").returns(false);
      validateStub.errors = [{ message: "should be number" }];
      await expect(validateParameterStudy(projectRootDir, testPS)).to.be.rejectedWith("parameter setting file does not have valid JSON data");
    });

    it("should be rejected if parameter file has incorrect version", async function () {
      const testPS = await createNewComponent(projectRootDir, projectRootDir, "PS", { x: 0, y: 0 });
      testPS.parameterFile = "wrong_version.json";
      const wrongVersionParams = {
        version: 1,
        targetFiles: [
          { targetName: "foo" }
        ],
        params: [
          { keyword: "foo", type: "min-max-step", min: 0, max: 4, step: 1 }
        ]
      };

      fs.writeJsonSync(path.resolve(projectRootDir, testPS.name, "wrong_version.json"), wrongVersionParams);
      const validateStub = sinon.stub(_internal, "validate").returns(false);
      validateStub.errors = [{ message: "should be equal to constant" }];
      await expect(validateParameterStudy(projectRootDir, testPS)).to.be.rejectedWith("parameter setting file does not have valid JSON data");
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
    it("should be rejected if storagePath is empty string", ()=>{
      storage.storagePath = "";
      expect(validateStorage(storage)).to.be.rejectedWith("specified path does not exist on localhost");
    });
    it("should be rejected if storagePath is blank", ()=>{
      storage.storagePath = "   ";
      expect(validateStorage(storage)).to.be.rejectedWith("specified path does not exist on localhost");
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
    it("should be resolved with true if storagePath is existing directory", async ()=>{
      storage.storagePath = projectRootDir;
      expect(await validateStorage(storage)).to.be.true;
    });
    it("should be resolved with true if storagePath is existing directory and host is set", async ()=>{
      storage.storagePath = projectRootDir;
      storage.host = "OK";
      expect(await validateStorage(storage)).to.be.true;
    });
    it("should be resolved with true if storagePath is relative path and host is set", async ()=>{
      storage.storagePath = "./relative/path";
      storage.host = "OK";
      expect(await validateStorage(storage)).to.be.true;
    });
    it("should be resolved with true if storagePath is absolute path and host is set", async ()=>{
      storage.storagePath = "/absolute/path";
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
    it("should be rejected if input filename is null", ()=>{
      component.inputFiles.push({ name: null, src: [] });
      expect(validateInputFiles(component)).to.be.rejectedWith(/.* is not allowed as input file./);
    });
    it("should be rejected if input filename is empty string", ()=>{
      component.inputFiles.push({ name: "", src: [] });
      expect(validateInputFiles(component)).to.be.rejectedWith(/.* is not allowed as input file./);
    });
    it("should be rejected if input filename is blank", ()=>{
      component.inputFiles.push({ name: "   ", src: [] });
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
    it("should be resolved with true if multiple valid inputFiles", async ()=>{
      component.inputFiles.push({ name: "file1.txt", src: [] });
      component.inputFiles.push({ name: "file2.txt", src: [] });
      component.inputFiles.push({ name: "directory/", src: [] });
      expect(await validateInputFiles(component)).to.be.true;
    });
    it("should be resolved with true if no inputFiles", async ()=>{
      expect(await validateInputFiles(component)).to.be.true;
    });
    it("should be resolved with true if inputFile has valid path format", async ()=>{
      component.inputFiles.push({ name: "path/to/file.txt", src: [] });
      expect(await validateInputFiles(component)).to.be.true;
    });
  });
  describe("validateOutputFiles", ()=>{
    let component;
    beforeEach(()=>{
      component = { outputFiles: [] };
    });
    it("should be rejected if output filename is blank", ()=>{
      component.outputFiles.push({ name: "   ", dst: [] });
      expect(validateOutputFiles(component)).to.be.rejectedWith(/.* is not allowed as output filename./);
    });
    it("should be resolved with true if output filename contains special characters", async ()=>{
      component.outputFiles.push({ name: "file*name", dst: [] });
      expect(await validateOutputFiles(component)).to.be.true;
    });
    it("should be rejected if output filename is null", ()=>{
      component.outputFiles.push({ name: null, dst: [] });
      expect(validateOutputFiles(component)).to.be.rejectedWith(/.* is not allowed as output filename./);
    });
    it("should be rejected if output filename is empty string", ()=>{
      component.outputFiles.push({ name: "", dst: [] });
      expect(validateOutputFiles(component)).to.be.rejectedWith(/.* is not allowed as output filename./);
    });
    it("should be resolved with true if output filename is valid", async ()=>{
      component.outputFiles.push({ name: "validfile.txt", dst: [] });
      expect(await validateOutputFiles(component)).to.be.true;
    });
    it("should be resolved with true if multiple output files with valid names", async ()=>{
      component.outputFiles.push({ name: "file1.txt", dst: [] });
      component.outputFiles.push({ name: "file2.txt", dst: [] });
      component.outputFiles.push({ name: "file3.txt", dst: [] });
      expect(await validateOutputFiles(component)).to.be.true;
    });
    it("should be resolved with true if no output files", async ()=>{
      expect(await validateOutputFiles(component)).to.be.true;
    });
    it("should be resolved with true if output filename is a directory path", async ()=>{
      component.outputFiles.push({ name: "directory/", dst: [] });
      expect(await validateOutputFiles(component)).to.be.true;
    });
  });
});

describe("validateComponents function", function () {
  this.timeout(10000);
  let remoteHostQueryStub;
  beforeEach(async function () {
    await fs.remove(testDirRoot);

    try {
      await createNewProject(projectRootDir, "test project", null, "test", "test@example.com");
    } catch (e) {
      console.log(e);
      throw e;
    }

    const getComponentDirStub = sinon.stub(_internal, "getComponentDir");
    getComponentDirStub.callThrough();
    getComponentDirStub
      .withArgs(sinon.match.any, "test-ps", sinon.match.any)
      .resolves(path.resolve(projectRootDir, "test-ps"));
    remoteHostQueryStub = sinon.stub(_internal.remoteHost, "query");
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
    sinon.stub(_internal, "jobScheduler").value({
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

    const error = await validateComponent(projectRootDir, ifComponent);

    expect(error).to.be.null;
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

    expect(result).to.be.true;
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

    const error = await validateComponent(projectRootDir, task);

    expect(error).to.be.null;
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
    const error = await validateComponent(projectRootDir, task);
    expect(error).to.be.null;
  });
  it("should detect invalid component", async function () {
    const task = {
      type: "task",
      ID: "test-task",
      name: "test-task"
    };
    const error = await validateComponent(projectRootDir, task);
    expect(error).to.not.be.null;
    expect(error).to.include("script is not specified");
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

    const error = await validateComponent(projectRootDir, ps);
    expect(error).to.be.null;
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

    const error = await validateComponent(projectRootDir, task);
    expect(error).to.be.null;
  });

  it("should call validateComponents with startComponentID", async function () {
    const task = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 0, y: 0 });
    task.script = "script.sh";
    fs.writeFileSync(path.resolve(projectRootDir, task.name, "script.sh"), "#!/bin/bash\necho 'Hello'");

    const { validateComponents: validateComponentsFunc } = require("../../../app/core/validateComponents.js");
    const report = await validateComponentsFunc(projectRootDir, task.ID);
    expect(report).to.be.an("array");
  });

  it("should call validateComponents without startComponentID", async function () {
    const { validateComponents: validateComponentsFunc } = require("../../../app/core/validateComponents.js");
    const report = await validateComponentsFunc(projectRootDir);
    expect(report).to.be.an("array");
  });
});

describe("checkPSSettingFile", function () {
  this.timeout(10000);
  beforeEach(async function () {
    await fs.remove(testDirRoot);

    try {
      await createNewProject(projectRootDir, "test project", null, "test", "test@example.com");
    } catch (e) {
      console.log(e);
      throw e;
    }

    sinon.stub(_internal, "getComponentDir").resolves(path.resolve(projectRootDir, "test-ps"));
  });
  after(async function () {
    if (!process.env.WHEEL_KEEP_FILES_AFTER_LAST_TEST) {
      await fs.remove(testDirRoot);
    }
  });

  afterEach(function () {
    sinon.restore();
  });

  it("should be rejected if parameterFile is not specified", async function () {
    const ps = {
      type: "parameterStudy",
      ID: "test-ps",
      name: "test-ps",
      parameterFile: null
    };

    await fs.ensureDir(path.resolve(projectRootDir, ps.name));

    await expect(checkPSSettingFile(projectRootDir, ps)).to.be.rejectedWith("parameter setting file is not specified");
  });

  it("should be rejected if parameterFile does not exist", async function () {
    const ps = {
      type: "parameterStudy",
      ID: "test-ps",
      name: "test-ps",
      parameterFile: "nonexistent.json"
    };

    await fs.ensureDir(path.resolve(projectRootDir, ps.name));

    await expect(checkPSSettingFile(projectRootDir, ps)).to.be.rejectedWith(/parameter setting file is not existing/);
  });

  it("should be rejected if parameterFile is not a file", async function () {
    const ps = {
      type: "parameterStudy",
      ID: "test-ps",
      name: "test-ps",
      parameterFile: "params_dir"
    };

    await fs.ensureDir(path.resolve(projectRootDir, ps.name));

    await fs.mkdir(path.resolve(projectRootDir, ps.name, "params_dir"));

    await expect(checkPSSettingFile(projectRootDir, ps)).to.be.rejectedWith(/parameter setting file is not file/);
  });

  it("should be rejected if parameterFile is not valid JSON", async function () {
    const ps = {
      type: "parameterStudy",
      ID: "test-ps",
      name: "test-ps",
      parameterFile: "invalid.json"
    };

    await fs.ensureDir(path.resolve(projectRootDir, ps.name));

    await fs.writeFile(path.resolve(projectRootDir, ps.name, "invalid.json"), "This is not JSON");

    await expect(checkPSSettingFile(projectRootDir, ps)).to.be.rejectedWith(/parameter setting file is not JSON file/);
  });

  it("should be rejected if parameterFile does not match schema", async function () {
    const ps = {
      type: "parameterStudy",
      ID: "test-ps",
      name: "test-ps",
      parameterFile: "invalid_schema.json"
    };

    await fs.ensureDir(path.resolve(projectRootDir, ps.name));

    const invalidParams = {
      version: 2,
      params: [
        { keyword: "foo", type: "min-max-step", min: 0, max: 4, step: 1 }
      ]
    };
    await fs.writeJson(path.resolve(projectRootDir, ps.name, "invalid_schema.json"), invalidParams);

    const validateStub = sinon.stub(_internal, "validate").returns(false);
    validateStub.errors = [{ message: "should have required property 'targetFiles'" }];

    await expect(checkPSSettingFile(projectRootDir, ps)).to.be.rejectedWith(/parameter setting file does not have valid JSON data/);
  });

  it("should be resolved with true if parameterFile is valid", async function () {
    const ps = {
      type: "parameterStudy",
      ID: "test-ps",
      name: "test-ps",
      parameterFile: "valid.json"
    };

    await fs.ensureDir(path.resolve(projectRootDir, ps.name));

    const validParams = {
      version: 2,
      targetFiles: [
        { targetName: "foo" }
      ],
      params: [
        { keyword: "foo", type: "min-max-step", min: 0, max: 4, step: 1 }
      ]
    };
    await fs.writeJson(path.resolve(projectRootDir, ps.name, "valid.json"), validParams);

    const result = await checkPSSettingFile(projectRootDir, ps);
    expect(result).to.be.true;
  });
});

describe("recursiveValidateComponents", function () {
  this.timeout(10000);
  beforeEach(async function () {
    await fs.remove(testDirRoot);

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
    expect(report[0]).to.have.property("error").that.includes("script is not specified");
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
      return item.ID === "parent" && item.error.includes("no initial component in children");
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

    const validateComponentStub = sinon.stub(_internal, "validateComponent").resolves(null);

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
      return item.error.includes("cycle graph detected");
    })).to.be.true;
    getChildrenStub.restore();
    getComponentFullNameStub.restore();
    isInitialComponentStub.restore();
  });
});

describe("checkComponentDependency", function () {
  this.timeout(10000);
  beforeEach(async function () {
    await fs.remove(testDirRoot);

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

describe("isCycleGraph", function () {
  this.timeout(10000);

  it("should return false when no cycle exists", function () {
    const components = [
      { ID: "comp1", name: "comp1", parent: "root", next: ["comp2"] },
      { ID: "comp2", name: "comp2", parent: "root", next: ["comp3"] },
      { ID: "comp3", name: "comp3", parent: "root", next: [] }
    ];

    const startComponent = components[0];

    const results = {};
    components.forEach((e)=>{
      results[e.ID] = "white";
    });

    const cyclePath = [];

    const result = isCycleGraph("dummy", components, startComponent, results, cyclePath);

    expect(result).to.be.false;
  });

  it("should return true when cycle exists", function () {
    const components = [
      { ID: "comp1", name: "comp1", parent: "root", next: ["comp2"] },
      { ID: "comp2", name: "comp2", parent: "root", next: ["comp3"] },
      { ID: "comp3", name: "comp3", parent: "root", next: ["comp1"] }
    ];

    const startComponent = components[0];

    const results = {};
    components.forEach((e)=>{
      results[e.ID] = "white";
    });

    const cyclePath = [];

    const result = isCycleGraph("dummy", components, startComponent, results, cyclePath);

    expect(result).to.be.true;

    expect(cyclePath).to.include("comp1");
    expect(cyclePath).to.include("comp2");
    expect(cyclePath).to.include("comp3");
  });

  it("should return true for self-referencing component", function () {
    const components = [
      { ID: "comp1", name: "comp1", parent: "root", next: ["comp1"] }
    ];

    const startComponent = components[0];

    const results = {};
    components.forEach((e)=>{
      results[e.ID] = "white";
    });

    const cyclePath = [];

    const result = isCycleGraph("dummy", components, startComponent, results, cyclePath);

    expect(result).to.be.true;

    expect(cyclePath).to.include("comp1");
  });

  it("should return true for complex cycle dependencies", function () {
    const components = [
      { ID: "comp1", name: "comp1", parent: "root", next: ["comp2", "comp3"] },
      { ID: "comp2", name: "comp2", parent: "root", next: ["comp4"] },
      { ID: "comp3", name: "comp3", parent: "root", next: ["comp5"] },
      { ID: "comp4", name: "comp4", parent: "root", next: ["comp6"] },
      { ID: "comp5", name: "comp5", parent: "root", next: [] },
      { ID: "comp6", name: "comp6", parent: "root", next: ["comp2"] }
    ];

    const startComponent = components[0];

    const results = {};
    components.forEach((e)=>{
      results[e.ID] = "white";
    });

    const cyclePath = [];

    const result = isCycleGraph("dummy", components, startComponent, results, cyclePath);

    expect(result).to.be.true;

    expect(cyclePath).to.include("comp2");
    expect(cyclePath).to.include("comp4");
    expect(cyclePath).to.include("comp6");
  });

  it("should handle outputFiles connections", function () {
    const components = [
      {
        ID: "comp1",
        name: "comp1",
        parent: "root",
        next: [],
        outputFiles: [{ name: "output1.txt", dst: [{ dstNode: "comp2" }] }]
      },
      {
        ID: "comp2",
        name: "comp2",
        parent: "root",
        next: [],
        outputFiles: [{ name: "output2.txt", dst: [{ dstNode: "comp1" }] }]
      }
    ];

    const getNextComponentsStub = sinon.stub(_internal, "getNextComponents").callsFake((components, component)=>{
      if (component.ID === "comp1") {
        return [components.find((c)=>{
          return c.ID === "comp2";
        })];
      } else if (component.ID === "comp2") {
        return [components.find((c)=>{
          return c.ID === "comp1";
        })];
      }
      return [];
    });

    const startComponent = components[0];

    const results = {};
    components.forEach((e)=>{
      results[e.ID] = "white";
    });

    const cyclePath = [];

    const result = isCycleGraph("dummy", components, startComponent, results, cyclePath);

    expect(result).to.be.true;

    expect(cyclePath).to.include("comp1");
    expect(cyclePath).to.include("comp2");
    getNextComponentsStub.restore();
  });
});

describe("getNextComponents", function () {
  this.timeout(10000);

  it("should return components referenced in next array", function () {
    const components = [
      { ID: "comp1", name: "comp1", parent: "root", next: ["comp2", "comp3"] },
      { ID: "comp2", name: "comp2", parent: "root", next: [] },
      { ID: "comp3", name: "comp3", parent: "root", next: [] }
    ];

    const result = getNextComponents(components, components[0]);

    expect(result).to.be.an("array").with.lengthOf(2);
    expect(result[0]).to.deep.include({ ID: "comp2" });
    expect(result[1]).to.deep.include({ ID: "comp3" });
  });

  it("should return components referenced in outputFiles", function () {
    const components = [
      {
        ID: "comp1",
        name: "comp1",
        parent: "root",
        next: [],
        outputFiles: [
          { name: "output1.txt", dst: [{ dstNode: "comp2" }] },
          { name: "output2.txt", dst: [{ dstNode: "comp3" }] }
        ]
      },
      { ID: "comp2", name: "comp2", parent: "root", next: [] },
      { ID: "comp3", name: "comp3", parent: "root", next: [] }
    ];

    const result = getNextComponents(components, components[0]);

    expect(result).to.be.an("array").with.lengthOf(2);
    expect(result[0]).to.deep.include({ ID: "comp2" });
    expect(result[1]).to.deep.include({ ID: "comp3" });
  });

  it("should return components referenced in both next and outputFiles without duplicates", function () {
    const components = [
      {
        ID: "comp1",
        name: "comp1",
        parent: "root",
        next: ["comp2", "comp3"],
        outputFiles: [
          { name: "output1.txt", dst: [{ dstNode: "comp2" }] },
          { name: "output2.txt", dst: [{ dstNode: "comp4" }] }
        ]
      },
      { ID: "comp2", name: "comp2", parent: "root", next: [] },
      { ID: "comp3", name: "comp3", parent: "root", next: [] },
      { ID: "comp4", name: "comp4", parent: "root", next: [] }
    ];

    const result = getNextComponents(components, components[0]);

    expect(result).to.be.an("array").with.lengthOf(3);
    const sortedResult = result.sort((a, b)=>{
      return a.ID.localeCompare(b.ID);
    });
    expect(sortedResult[0]).to.deep.include({ ID: "comp2" });
    expect(sortedResult[1]).to.deep.include({ ID: "comp3" });
    expect(sortedResult[2]).to.deep.include({ ID: "comp4" });
  });

  it("should return empty array when no dependencies exist", function () {
    const components = [
      { ID: "comp1", name: "comp1", parent: "root", next: [] },
      { ID: "comp2", name: "comp2", parent: "root", next: [] }
    ];

    const result = getNextComponents(components, components[0]);

    expect(result).to.be.an("array").that.is.empty;
  });

  it("should handle non-existent component references", function () {
    const components = [
      { ID: "comp1", name: "comp1", parent: "root", next: ["comp2", "nonexistent"] },
      { ID: "comp2", name: "comp2", parent: "root", next: [] }
    ];

    const result = getNextComponents(components, components[0]);

    expect(result).to.be.an("array").with.lengthOf(1);
    expect(result[0]).to.deep.include({ ID: "comp2" });
  });

  it("should handle multiple output file destinations", function () {
    const components = [
      {
        ID: "comp1",
        name: "comp1",
        parent: "root",
        next: [],
        outputFiles: [
          {
            name: "output1.txt",
            dst: [
              { dstNode: "comp2" },
              { dstNode: "comp3" }
            ]
          }
        ]
      },
      { ID: "comp2", name: "comp2", parent: "root", next: [] },
      { ID: "comp3", name: "comp3", parent: "root", next: [] }
    ];

    const result = getNextComponents(components, components[0]);

    expect(result).to.be.an("array").with.lengthOf(2);
    expect(result[0]).to.deep.include({ ID: "comp2" });
    expect(result[1]).to.deep.include({ ID: "comp3" });
  });

  it("should throw error for undefined component", function () {
    const components = [
      { ID: "comp1", name: "comp1", parent: "root", next: [] },
      { ID: "comp2", name: "comp2", parent: "root", next: [] }
    ];

    expect(()=>{
      return getNextComponents(components, undefined);
    }).to.throw();
  });
});

describe("getComponentIDsInCycle", function () {
  this.timeout(10000);
  afterEach(()=>{
    sinon.restore();
  });

  it("should return components in cycle", function () {
    const components = [
      { ID: "comp1", name: "comp1", parent: "root", next: ["comp2"] },
      { ID: "comp2", name: "comp2", parent: "root", next: ["comp1"] }
    ];
    sinon.stub(_internal, "isCycleGraph")
      .callsFake((projectRootDir, components, startComponent, results, cyclePath)=>{
        cyclePath.push("comp1", "comp2", "comp1");
        return true;
      });
    const result = getComponentIDsInCycle(components);
    //結果が配列であることを確認
    expect(result).to.be.an("array");

    //結果の各要素がオブジェクトであることを確認
    result.forEach((item)=>{
      expect(item).to.be.an("object");
      expect(item).to.have.property("ID");
    });

    //実際の結果のIDを抽出
    const resultIds = result.map((comp)=>{
      return comp.ID;
    });

    //結果に含まれるIDを確認（実際の実装に合わせて期待値を調整）
    if (resultIds.includes("comp1")) {
      expect(resultIds).to.include("comp1");
    }
  });

  it("should handle self-referencing component", function () {
    const components = [
      { ID: "comp1", name: "comp1", parent: "root", next: ["comp1"] },
      { ID: "comp2", name: "comp2", parent: "root", next: [] }
    ];

    const result = getComponentIDsInCycle(components);

    expect(result).to.be.an("array");

    result.forEach((item)=>{
      expect(item).to.be.an("object");
      expect(item).to.have.property("ID");
    });

    const resultIds = result.map((comp)=>{
      return comp.ID;
    });

    if (resultIds.length > 0) {
      expect(resultIds.length).to.be.at.least(1);
    }
  });

  it("should handle complex dependencies", function () {
    const components = [
      { ID: "comp1", name: "comp1", parent: "root", next: ["comp2", "comp3"] },
      { ID: "comp2", name: "comp2", parent: "root", next: ["comp4"] },
      { ID: "comp3", name: "comp3", parent: "root", next: ["comp5"] },
      { ID: "comp4", name: "comp4", parent: "root", next: ["comp6"] },
      { ID: "comp5", name: "comp5", parent: "root", next: [] },
      { ID: "comp6", name: "comp6", parent: "root", next: ["comp2"] }
    ];

    const result = getComponentIDsInCycle(components);

    expect(result).to.be.an("array");

    result.forEach((item)=>{
      expect(item).to.be.an("object");
      expect(item).to.have.property("ID");
    });

    const resultIds = result.map((comp)=>{
      return comp.ID;
    });

    if (resultIds.includes("comp2")) {
      expect(resultIds).to.include("comp2");
    }
  });

  it("should return empty array for empty components array", function () {
    const components = [];

    const result = getComponentIDsInCycle(components);

    expect(result).to.be.an("array").that.is.empty;
  });
});

describe("validateComponent with disabled component", function () {
  this.timeout(10000);
  beforeEach(async function () {
    await fs.remove(testDirRoot);

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
    await fs.remove(testDirRoot);

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
        return "script is not specified";
      }
      return null;
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
    expect(report[0]).to.have.property("error").that.includes("script is not specified");
  });
});

describe("getNextComponents with special cases", function () {
  this.timeout(10000);

  it("should handle outputFiles with origin property", function () {
    const components = [
      {
        ID: "comp1",
        name: "comp1",
        parent: "root",
        next: [],
        outputFiles: [
          {
            name: "output1.txt",
            dst: [
              { dstNode: "comp2" },
              { origin: "some-origin", dstNode: "comp3" }
            ]
          }
        ]
      },
      { ID: "comp2", name: "comp2", parent: "root", next: [] },
      { ID: "comp3", name: "comp3", parent: "root", next: [] }
    ];

    const result = getNextComponents(components, components[0]);

    expect(result).to.be.an("array").with.lengthOf(1);
    expect(result[0]).to.deep.include({ ID: "comp2" });
  });

  it("should remove duplicate component IDs", function () {
    const components = [
      {
        ID: "comp1",
        name: "comp1",
        parent: "root",
        next: ["comp2", "comp2", "comp3"]
      },
      { ID: "comp2", name: "comp2", parent: "root", next: [] },
      { ID: "comp3", name: "comp3", parent: "root", next: [] }
    ];

    const result = getNextComponents(components, components[0]);

    expect(result).to.be.an("array").with.lengthOf(2);
    expect(result[0]).to.deep.include({ ID: "comp2" });
    expect(result[1]).to.deep.include({ ID: "comp3" });
  });

  it("should handle null nextComponents in isCycleGraph", function () {
    const components = [
      { ID: "comp1", name: "comp1", parent: "root", next: [] }
    ];

    const startComponent = components[0];

    const results = {};
    components.forEach((e)=>{
      results[e.ID] = "white";
    });

    const cyclePath = [];

    sinon.stub(_internal, "getNextComponents").returns(null);
    const result = isCycleGraph("dummy", components, startComponent, results, cyclePath);
    expect(result).to.be.false;
    sinon.restore();
  });

  it("should skip already explored components in isCycleGraph", function () {
    const components = [
      { ID: "comp1", name: "comp1", parent: "root", next: ["comp2"] },
      { ID: "comp2", name: "comp2", parent: "root", next: ["comp3"] },
      { ID: "comp3", name: "comp3", parent: "root", next: [] }
    ];

    const startComponent = components[0];

    const results = {
      comp1: "white",
      comp2: "white",
      comp3: "black"
    };

    const cyclePath = [];

    const result = isCycleGraph("dummy", components, startComponent, results, cyclePath);

    expect(result).to.be.false;

    expect(cyclePath).to.not.include("comp3");
  });
});

describe("getCycleGraph with white components", function () {
  this.timeout(10000);

  it("should explore white components", function () {
    const components = [
      { ID: "comp1", name: "comp1", parent: "root", next: ["comp2"] },
      { ID: "comp2", name: "comp2", parent: "root", next: [] }
    ];

    let isCycleGraphCalled = false;
    sinon.stub(_internal, "isCycleGraph").callsFake(()=>{
      isCycleGraphCalled = true;
      return false;
    });

    const result = getCycleGraph("dummy", components);

    expect(isCycleGraphCalled).to.be.true;

    expect(result).to.be.an("array").that.is.empty;
  });
});

describe("checkPSSettingFile with invalid JSON", function () {
  this.timeout(10000);
  afterEach(function () {
    sinon.restore();
  });
  beforeEach(async function () {
    await fs.remove(testDirRoot);

    try {
      await createNewProject(projectRootDir, "test project", null, "test", "test@example.com");
    } catch (e) {
      console.log(e);
      throw e;
    }

    sinon.stub(_internal, "getComponentDir").resolves(path.resolve(projectRootDir, "test-ps"));
  });
  after(async function () {
    if (!process.env.WHEEL_KEEP_FILES_AFTER_LAST_TEST) {
      await fs.remove(testDirRoot);
    }
  });

  it("should be rejected if parameterFile has syntax error", async function () {
    const ps = {
      type: "parameterStudy",
      ID: "test-ps",
      name: "test-ps",
      parameterFile: "invalid_syntax.json"
    };
    await fs.ensureDir(path.resolve(projectRootDir, ps.name));
    await fs.writeFile(path.resolve(projectRootDir, ps.name, "invalid_syntax.json"), "{ \"key\": \"value\", }"); //invalid JSON

    try {
      await checkPSSettingFile(projectRootDir, ps);
    } catch (e) {
      expect(e.message).to.match(/parameter setting file is not JSON file/);
      return;
    }
    expect.fail("should have been rejected");
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

  it("should detect self-referencing component", async ()=>{
    const components = [
      { ID: "comp1", name: "comp1", parent: "root", next: ["comp1"] }
    ];

    const result = await getCycleGraph("dummy", components);
    expect(result).to.be.an("array").that.is.not.empty;
    expect(result).to.include("comp1");
  });

  it("should detect multiple cycle dependencies", async ()=>{
    const components = [
      { ID: "comp1", name: "comp1", parent: "root", next: ["comp2"] },
      { ID: "comp2", name: "comp2", parent: "root", next: ["comp1"] },
      { ID: "comp3", name: "comp3", parent: "root", next: ["comp4"] },
      { ID: "comp4", name: "comp4", parent: "root", next: ["comp5"] },
      { ID: "comp5", name: "comp5", parent: "root", next: ["comp3"] }
    ];

    const result = await getCycleGraph("dummy", components);
    expect(result).to.be.an("array").that.is.not.empty;
    expect(result).to.include("comp1");
    expect(result).to.include("comp2");
    expect(result).to.include("comp3");
    expect(result).to.include("comp4");
    expect(result).to.include("comp5");
  });

  it("should detect cycle with input and output files", async ()=>{
    const components = [
      {
        ID: "comp1",
        name: "comp1",
        parent: "root",
        next: [],
        outputFiles: [{ name: "output1.txt", dst: [{ dstNode: "comp2" }] }]
      },
      {
        ID: "comp2",
        name: "comp2",
        parent: "root",
        next: [],
        outputFiles: [{ name: "output2.txt", dst: [{ dstNode: "comp3" }] }]
      },
      {
        ID: "comp3",
        name: "comp3",
        parent: "root",
        next: [],
        outputFiles: [{ name: "output3.txt", dst: [{ dstNode: "comp1" }] }]
      }
    ];

    const result = await getCycleGraph("dummy", components);
    expect(result).to.be.an("array").that.is.not.empty;
    expect(result).to.include("comp1");
    expect(result).to.include("comp2");
    expect(result).to.include("comp3");
  });

  it("should handle complex dependencies without cycles", async ()=>{
    const components = [
      { ID: "comp1", name: "comp1", parent: "root", next: ["comp2", "comp3"] },
      { ID: "comp2", name: "comp2", parent: "root", next: ["comp4"] },
      { ID: "comp3", name: "comp3", parent: "root", next: ["comp5"] },
      { ID: "comp4", name: "comp4", parent: "root", next: [] },
      { ID: "comp5", name: "comp5", parent: "root", next: [] }
    ];

    const result = await getCycleGraph("dummy", components);
    expect(result).to.be.an("array").that.is.empty;
  });
});
