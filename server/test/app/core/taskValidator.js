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

//testee
import { _internal, validateTask, validateStepjobTask, validateStepjob, validateBulkjobTask } from "../../../app/core/taskValidator.js";

//test data
const testDirRoot = "WHEEL_TEST_TMP";
const projectRootDir = path.resolve(testDirRoot, "testProject.wheel");

describe("taskValidator UT", function () {
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

    it("should be rejected if checker is specified but does not exist", async function () {
      const testTask = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 0, y: 0 });
      testTask.script = "script.sh";
      const scriptPath = path.resolve(projectRootDir, testTask.name, "script.sh");
      await fs.writeFile(scriptPath, "#!/bin/bash\necho 'Hello'");
      testTask.checker = "nonexistent_checker.sh";
      await expect(validateTask(projectRootDir, testTask)).to.be.rejectedWith(/checker is not existing file/);
    });

    it("should be rejected if checker is not a file", async function () {
      const testTask = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 0, y: 0 });
      testTask.script = "script.sh";
      const scriptPath = path.resolve(projectRootDir, testTask.name, "script.sh");
      await fs.writeFile(scriptPath, "#!/bin/bash\necho 'Hello'");
      testTask.checker = "checker_dir";
      const checkerDirPath = path.resolve(projectRootDir, testTask.name, "checker_dir");
      await fs.mkdir(checkerDirPath);
      await expect(validateTask(projectRootDir, testTask)).to.be.rejectedWith(/checker is not file/);
    });

    it("should be resolved with true if checker is specified and exists", async function () {
      const testTask = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 0, y: 0 });
      testTask.script = "script.sh";
      const scriptPath = path.resolve(projectRootDir, testTask.name, "script.sh");
      await fs.writeFile(scriptPath, "#!/bin/bash\necho 'Hello'");
      testTask.checker = "checker.sh";
      const checkerPath = path.resolve(projectRootDir, testTask.name, "checker.sh");
      await fs.writeFile(checkerPath, "#!/bin/bash\nexit 0");
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
});
