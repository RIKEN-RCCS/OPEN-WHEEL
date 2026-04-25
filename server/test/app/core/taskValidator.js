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
import { _internal, validateTask, validateStepjobTask, validateStepjob, validateBulkjobTask } from "../../../app/core/taskValidator.js";
import { _internal as fileValidatorInternal } from "../../../app/core/fileValidator.js";

//test data
const testDirRoot = "WHEEL_TEST_TMP";
const projectRootDir = path.resolve(testDirRoot, "testProject.wheel");

describe("taskValidator UT", function () {
  let remoteHostQueryStub;
  beforeEach(async function () {
    this.timeout(10000);
    await setupTestDir(testDirRoot);

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
    it("should be rejected with 'no script' error for default component", async ()=>{
      const errors = await validateTask(projectRootDir, task);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("script is not specified");
    });
    it("should be rejected if name is not defined", async ()=>{
      task.name = null;
      const errors = await validateTask(projectRootDir, task);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("illegal path");
    });
    it("should be rejected if not existing remote host is set", async ()=>{
      task.useJobScheduler = true;
      task.host = "hoge";
      const errors = await validateTask(projectRootDir, task);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.match(/remote host setting for .* not found/);
    });
    it("should be rejected if not existing jobScheduler is set", async ()=>{
      task.useJobScheduler = true;
      task.host = "OK";
      const errors = await validateTask(projectRootDir, task);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.match(/job scheduler for .* is not supported/);
    });
    it("should be rejected if not existing jobScheduler is set", async ()=>{
      task.useJobScheduler = true;
      task.host = "jobOK";
      task.submitOption = "-q foo bar -i hoge";
      const errors = await validateTask(projectRootDir, task);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("submit option duplicate queue option");
    });
    it("should be rejected if script is not existing", async ()=>{
      task.script = "hoge";
      const errors = await validateTask(projectRootDir, task);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("script is not existing file");
    });
    it("should be rejected if script is not file", async ()=>{
      task.script = "hoge";
      fs.mkdirSync(path.resolve(projectRootDir, task.name, "hoge"));
      const errors = await validateTask(projectRootDir, task);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("script is not file");
    });
    it("should be resolved with empty array if required prop is set", async ()=>{
      task.script = "hoge";
      fs.writeFileSync(path.resolve(projectRootDir, task.name, "hoge"), "hoge");
      expect(await validateTask(projectRootDir, task)).to.be.empty;
    });

    it("should be resolved with empty array for local job (no host set)", async function () {
      const testTask = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 0, y: 0 });
      testTask.script = "local_script.sh";
      const scriptPath = path.resolve(projectRootDir, testTask.name, "local_script.sh");
      await fs.writeFile(scriptPath, "#!/bin/bash\necho 'Hello'");
      testTask.useJobScheduler = false;
      expect(await validateTask(projectRootDir, testTask)).to.be.empty;
    });

    it("should be resolved with empty array if remote host and job scheduler are correctly set", async function () {
      const testTask = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 0, y: 0 });
      testTask.script = "remote_script.sh";
      const scriptPath = path.resolve(projectRootDir, testTask.name, "remote_script.sh");
      await fs.writeFile(scriptPath, "#!/bin/bash\necho 'Hello'");
      testTask.useJobScheduler = true;
      testTask.host = "jobOK";
      expect(await validateTask(projectRootDir, testTask)).to.be.empty;
    });

    it("should be resolved with empty array if submit option is set and does not duplicate queue option", async function () {
      const testTask = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 0, y: 0 });
      testTask.script = "submit_script.sh";
      const scriptPath = path.resolve(projectRootDir, testTask.name, "submit_script.sh");
      await fs.writeFile(scriptPath, "#!/bin/bash\necho 'Hello'");
      testTask.useJobScheduler = true;
      testTask.host = "jobOK";
      testTask.submitOption = "-p high -t 10:00";
      expect(await validateTask(projectRootDir, testTask)).to.be.empty;
    });

    it("should be rejected if checker is specified but does not exist", async function () {
      const testTask = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 0, y: 0 });
      testTask.script = "script.sh";
      const scriptPath = path.resolve(projectRootDir, testTask.name, "script.sh");
      await fs.writeFile(scriptPath, "#!/bin/bash\necho 'Hello'");
      testTask.checker = "nonexistent_checker.sh";
      const errors = await validateTask(projectRootDir, testTask);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.match(/checker is not existing file/);
    });

    it("should be rejected if checker is not a file", async function () {
      const testTask = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 0, y: 0 });
      testTask.script = "script.sh";
      const scriptPath = path.resolve(projectRootDir, testTask.name, "script.sh");
      await fs.writeFile(scriptPath, "#!/bin/bash\necho 'Hello'");
      testTask.checker = "checker_dir";
      const checkerDirPath = path.resolve(projectRootDir, testTask.name, "checker_dir");
      await fs.mkdir(checkerDirPath);
      const errors = await validateTask(projectRootDir, testTask);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.match(/checker is not file/);
    });

    it("should be resolved with empty array if checker is specified and exists", async function () {
      const testTask = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 0, y: 0 });
      testTask.script = "script.sh";
      const scriptPath = path.resolve(projectRootDir, testTask.name, "script.sh");
      await fs.writeFile(scriptPath, "#!/bin/bash\necho 'Hello'");
      testTask.checker = "checker.sh";
      const checkerPath = path.resolve(projectRootDir, testTask.name, "checker.sh");
      await fs.writeFile(checkerPath, "#!/bin/bash\nexit 0");
      expect(await validateTask(projectRootDir, testTask)).to.be.empty;
    });

    it("should be rejected if checker is an absolute path", async function () {
      const testTask = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 0, y: 0 });
      testTask.script = "script.sh";
      const scriptPath = path.resolve(projectRootDir, testTask.name, "script.sh");
      await fs.writeFile(scriptPath, "#!/bin/bash\necho 'Hello'");
      testTask.checker = "/usr/local/bin/checker.sh";
      const errors = await validateTask(projectRootDir, testTask);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.match(/checker must be a filename under component directory/);
    });

    it("should be rejected if checker is an absolute path on remote host", async function () {
      const testTask = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 0, y: 0 });
      testTask.script = "script.sh";
      const scriptPath = path.resolve(projectRootDir, testTask.name, "script.sh");
      await fs.writeFile(scriptPath, "#!/bin/bash\necho 'Hello'");
      testTask.checker = "/home/user/checker.sh";
      const errors = await validateTask(projectRootDir, testTask);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.match(/checker must be a filename under component directory/);
    });

    describe("sourceScript validation", ()=>{
      let mockSsh;
      beforeEach(()=>{
        mockSsh = { exec: sinon.stub() };
        sinon.stub(fileValidatorInternal.remoteHost, "getID").callsFake((key, value)=>{
          return value === "jobOK" ? "mock-host-id" : undefined;
        });
        sinon.stub(fileValidatorInternal, "hasEntry").returns(false);
        sinon.stub(fileValidatorInternal, "getSsh").returns(mockSsh);
      });

      it("should be resolved with empty array if useJobScheduler is false and sourceScript is set", async ()=>{
        const testTask = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 0, y: 0 });
        testTask.script = "script.sh";
        await fs.writeFile(path.resolve(projectRootDir, testTask.name, "script.sh"), "#!/bin/bash");
        testTask.useJobScheduler = false;
        testTask.sourceScript = "/home/user/setup.sh";
        expect(await validateTask(projectRootDir, testTask)).to.be.empty;
      });

      it("should be resolved with empty array if useJobScheduler is true but sourceScript is not set", async ()=>{
        const testTask = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 0, y: 0 });
        testTask.script = "script.sh";
        await fs.writeFile(path.resolve(projectRootDir, testTask.name, "script.sh"), "#!/bin/bash");
        testTask.useJobScheduler = true;
        testTask.host = "jobOK";
        expect(await validateTask(projectRootDir, testTask)).to.be.empty;
      });

      it("should be resolved with empty array if sourceScript is set but SSH is not connected", async ()=>{
        const testTask = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 0, y: 0 });
        testTask.script = "script.sh";
        await fs.writeFile(path.resolve(projectRootDir, testTask.name, "script.sh"), "#!/bin/bash");
        testTask.useJobScheduler = true;
        testTask.host = "jobOK";
        testTask.sourceScript = "/home/user/setup.sh";
        fileValidatorInternal.hasEntry.returns(false);
        expect(await validateTask(projectRootDir, testTask)).to.be.empty;
      });

      it("should be rejected if sourceScript does not exist on remote host", async ()=>{
        const testTask = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 0, y: 0 });
        testTask.script = "script.sh";
        await fs.writeFile(path.resolve(projectRootDir, testTask.name, "script.sh"), "#!/bin/bash");
        testTask.useJobScheduler = true;
        testTask.host = "jobOK";
        testTask.sourceScript = "/home/user/nonexistent.sh";
        fileValidatorInternal.hasEntry.returns(true);
        mockSsh.exec.resolves(1);
        const errors = await validateTask(projectRootDir, testTask);
        expect(errors).to.not.be.empty;
        expect(errors[0].message).to.be.a("string");
        expect(errors[0].message).to.match(/sourceScript.*does not exist on jobOK/);
      });

      it("should be resolved with empty array if sourceScript exists on remote host", async ()=>{
        const testTask = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 0, y: 0 });
        testTask.script = "script.sh";
        await fs.writeFile(path.resolve(projectRootDir, testTask.name, "script.sh"), "#!/bin/bash");
        testTask.useJobScheduler = true;
        testTask.host = "jobOK";
        testTask.sourceScript = "/home/user/setup.sh";
        fileValidatorInternal.hasEntry.returns(true);
        mockSsh.exec.resolves(0);
        expect(await validateTask(projectRootDir, testTask)).to.be.empty;
      });
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
    it("should be rejected with 'no script' error for default component", async ()=>{
      isInitialComponentStub.resolves(true);
      const errors = await validateStepjobTask(projectRootDir, stepjobTask);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("script is not specified");
    });
    it("should be rejected with 'initial stepjobTask cannot specified the Dependency form' if initial stepjob task has dependency form", async ()=>{
      isInitialComponentStub.resolves(true);
      stepjobTask.useDependency = "hoge";
      const errors = await validateStepjobTask(projectRootDir, stepjobTask);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("initial stepjobTask cannot specified the Dependency form");
    });
    it("should be rejected if script file is not existing", async ()=>{
      isInitialComponentStub.resolves(true);
      stepjobTask.script = "hoge";
      const errors = await validateStepjobTask(projectRootDir, stepjobTask);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("script is not existing file");
    });
    it("should be rejected if script is not file", async ()=>{
      isInitialComponentStub.resolves(true);
      stepjobTask.script = "hoge";
      fs.mkdirSync(path.resolve(projectRootDir, stepjobTask.name, "hoge"));
      const errors = await validateStepjobTask(projectRootDir, stepjobTask);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("script is not file");
    });
    it("should be resolved with empty array if required prop is set", async ()=>{
      isInitialComponentStub.resolves(true);
      stepjobTask.script = "hoge";
      fs.writeFileSync(path.resolve(projectRootDir, stepjobTask.name, "hoge"), "hoge");
      expect(await validateStepjobTask(projectRootDir, stepjobTask)).to.be.empty;
    });

    it("should allow useDependency for non-initial stepjobTask", async function () {
      const testStepjobTask = await createNewComponent(projectRootDir, projectRootDir, "stepjobTask", { x: 0, y: 0 });
      testStepjobTask.script = "script.sh";
      const scriptPath = path.resolve(projectRootDir, testStepjobTask.name, "script.sh");
      await fs.writeFile(scriptPath, "#!/bin/bash\necho 'Hello'");
      isInitialComponentStub.resolves(false);
      testStepjobTask.useDependency = "afterok";
      expect(await validateStepjobTask(projectRootDir, testStepjobTask)).to.be.empty;
    });

    it("should be resolved with empty array if script is executable", async function () {
      const testStepjobTask = await createNewComponent(projectRootDir, projectRootDir, "stepjobTask", { x: 0, y: 0 });
      testStepjobTask.script = "executable.sh";
      const scriptPath = path.resolve(projectRootDir, testStepjobTask.name, "executable.sh");
      await fs.writeFile(scriptPath, "#!/bin/bash\necho 'Hello'");
      const stats = await fs.stat(scriptPath);
      expect(stats.isFile()).to.be.true;
      isInitialComponentStub.resolves(true);
      expect(await validateStepjobTask(projectRootDir, testStepjobTask)).to.be.empty;
    });
  });

  describe("validateStepjob", ()=>{
    let stepjob;
    beforeEach(async ()=>{
      stepjob = await createNewComponent(projectRootDir, projectRootDir, "stepjob", { x: 0, y: 0 });
    });
    it("should be rejected if useJobScheduler is not set", async ()=>{
      stepjob.useJobScheduler = false;
      const errors = await validateStepjob(projectRootDir, stepjob);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("useJobScheduler must be set");
    });
    it("should be rejected if host is not set", async ()=>{
      const errors = await validateStepjob(projectRootDir, stepjob);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("stepjob is only supported on remotehost");
    });
    it("should be rejected if host not found", async ()=>{
      stepjob.host = "hoge";
      const errors = await validateStepjob(projectRootDir, stepjob);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.match(/remote host setting for .* not found/);
    });
    it("should be rejected if host is not support job", async ()=>{
      stepjob.host = "OK";
      const errors = await validateStepjob(projectRootDir, stepjob);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.match(/job scheduler for .* is not supported/);
    });
    it("should be rejected if jobscheduler is not support stepjob", async ()=>{
      stepjob.host = "jobOK";
      const errors = await validateStepjob(projectRootDir, stepjob);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.match(/job scheduler .* does not support stepjob/);
    });
    it("should be rejected if host is not set to use stepjob", async ()=>{
      stepjob.host = "stepjobNG";
      const errors = await validateStepjob(projectRootDir, stepjob);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.match(/.* does not set to use stepjob/);
    });
    it("should be rejected if host supports stepjob but useStepjob is false", async function () {
      const testStepjob = await createNewComponent(projectRootDir, projectRootDir, "stepjob", { x: 0, y: 0 });
      testStepjob.useJobScheduler = true;
      testStepjob.host = "stepjobNG";
      const errors = await validateStepjob(projectRootDir, testStepjob);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.match(/.* does not set to use stepjob/);
    });

    it("should be resolved with empty array if all requirements are met", async ()=>{
      stepjob.host = "stepjobOK";
      expect(await validateStepjob(projectRootDir, stepjob)).to.be.empty;
    });

    it("should be resolved with empty array if host is set to use stepjob and jobscheduler supports stepjob", async function () {
      const testStepjob = await createNewComponent(projectRootDir, projectRootDir, "stepjob", { x: 0, y: 0 });
      testStepjob.useJobScheduler = true;
      testStepjob.host = "stepjobOK";
      expect(await validateStepjob(projectRootDir, testStepjob)).to.be.empty;
    });
  });

  describe("validateBulkjobTask", ()=>{
    let bulkjobTask;
    beforeEach(async ()=>{
      bulkjobTask = await createNewComponent(projectRootDir, projectRootDir, "bulkjobTask", { x: 0, y: 0 });
    });
    it("should be rejected if name is not defined", async ()=>{
      bulkjobTask.name = null;
      const errors = await validateBulkjobTask(projectRootDir, bulkjobTask);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("illegal path");
    });
    it("should be rejected if useJobScheduler is not set", async ()=>{
      bulkjobTask.useJobScheduler = false;
      const errors = await validateBulkjobTask(projectRootDir, bulkjobTask);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("useJobScheduler must be set");
    });
    it("should be rejected if host is not set", async ()=>{
      const errors = await validateBulkjobTask(projectRootDir, bulkjobTask);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("bulkjobTask is only supported on remotehost");
    });
    it("should be rejected if host not found", async ()=>{
      bulkjobTask.host = "hoge";
      const errors = await validateBulkjobTask(projectRootDir, bulkjobTask);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.match(/remote host setting for .* not found/);
    });
    it("should be rejected if host is not support job", async ()=>{
      bulkjobTask.host = "OK";
      const errors = await validateBulkjobTask(projectRootDir, bulkjobTask);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.match(/job scheduler for .* is not supported/);
    });
    it("should be rejected if jobscheduler is not support bulkjobTask", async ()=>{
      bulkjobTask.host = "jobOK";
      const errors = await validateBulkjobTask(projectRootDir, bulkjobTask);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.match(/job scheduler .* does not support bulkjob/);
    });
    it("should be rejected if host is not set to use bulkjob", async ()=>{
      bulkjobTask.host = "bulkjobNG";
      const errors = await validateBulkjobTask(projectRootDir, bulkjobTask);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.match(/.* does not set to use bulkjob/);
    });
    it("should be rejected if usePSSettingFile is set but parameterFile is not set", async ()=>{
      bulkjobTask.host = "bulkjobOK";
      const errors = await validateBulkjobTask(projectRootDir, bulkjobTask);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("usePSSettingFile is set but parameter setting file is not specified");
    });

    it("should be rejected if script is not specified for usePSSettingFile=true case", async function () {
      const testBulkjobTask = await createNewComponent(projectRootDir, projectRootDir, "bulkjobTask", { x: 0, y: 0 });
      testBulkjobTask.host = "bulkjobOK";
      testBulkjobTask.usePSSettingFile = true;
      testBulkjobTask.parameterFile = "nonexistent.json";
      const errors = await validateBulkjobTask(projectRootDir, testBulkjobTask);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.match(/script is not specified/);
    });

    it("should be rejected if script does not exist for usePSSettingFile=true case", async function () {
      const testBulkjobTask = await createNewComponent(projectRootDir, projectRootDir, "bulkjobTask", { x: 0, y: 0 });
      testBulkjobTask.host = "bulkjobOK";
      testBulkjobTask.usePSSettingFile = true;
      testBulkjobTask.parameterFile = "paramFile.json";
      testBulkjobTask.script = "nonexistent.sh";
      const errors = await validateBulkjobTask(projectRootDir, testBulkjobTask);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.match(/script is not existing file/);
    });

    it("should be rejected if script is not a file for usePSSettingFile=true case", async function () {
      const testBulkjobTask = await createNewComponent(projectRootDir, projectRootDir, "bulkjobTask", { x: 0, y: 0 });
      testBulkjobTask.host = "bulkjobOK";
      testBulkjobTask.usePSSettingFile = true;
      testBulkjobTask.parameterFile = "paramFile.json";
      testBulkjobTask.script = "scriptDir";
      const scriptDirPath = path.resolve(projectRootDir, testBulkjobTask.name, "scriptDir");
      await fs.mkdir(scriptDirPath);
      const errors = await validateBulkjobTask(projectRootDir, testBulkjobTask);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.match(/script is not file/);
    });

    it("should be rejected if usePSSettingFile is not set and startBulkNumber is not set", async ()=>{
      bulkjobTask.host = "bulkjobOK";
      bulkjobTask.usePSSettingFile = false;
      const errors = await validateBulkjobTask(projectRootDir, bulkjobTask);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("startBulkNumber must be specified");
    });
    it("should be rejected if usePSSettingFile is not set and startBulkNumber is negative value", async ()=>{
      bulkjobTask.host = "bulkjobOK";
      bulkjobTask.usePSSettingFile = false;
      bulkjobTask.startBulkNumber = -1;
      const errors = await validateBulkjobTask(projectRootDir, bulkjobTask);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("startBulkNumber must be integer and 0 or more");
    });
    it("should be rejected if usePSSettingFile is not set and endBulkNumber is not set", async ()=>{
      bulkjobTask.host = "bulkjobOK";
      bulkjobTask.usePSSettingFile = false;
      bulkjobTask.startBulkNumber = 1;
      const errors = await validateBulkjobTask(projectRootDir, bulkjobTask);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("endBulkNumber must be specified");
    });
    it("should be rejected if endBulkNumber is less or equal startBulkNumber", async ()=>{
      bulkjobTask.host = "bulkjobOK";
      bulkjobTask.usePSSettingFile = false;
      bulkjobTask.startBulkNumber = 1;
      bulkjobTask.endBulkNumber = 1;
      const errors = await validateBulkjobTask(projectRootDir, bulkjobTask);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("endBulkNumber must be integer and greater than startBulkNumber");
    });
    it("should be rejected if manualFinishCondition is set but condition is not specidied", async ()=>{
      bulkjobTask.host = "bulkjobOK";
      bulkjobTask.usePSSettingFile = false;
      bulkjobTask.startBulkNumber = 1;
      bulkjobTask.endBulkNumber = 2;
      bulkjobTask.manualFinishCondition = true;
      const errors = await validateBulkjobTask(projectRootDir, bulkjobTask);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("condition is not specified");
    });

    it("should be rejected if script is not set", async ()=>{
      bulkjobTask.host = "bulkjobOK";
      bulkjobTask.usePSSettingFile = false;
      bulkjobTask.startBulkNumber = 1;
      bulkjobTask.endBulkNumber = 2;
      const errors = await validateBulkjobTask(projectRootDir, bulkjobTask);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("script is not specified");
    });
    it("should be rejected if script is not existing", async ()=>{
      bulkjobTask.host = "bulkjobOK";
      bulkjobTask.usePSSettingFile = false;
      bulkjobTask.startBulkNumber = 1;
      bulkjobTask.endBulkNumber = 2;
      bulkjobTask.script = "hoge";
      const errors = await validateBulkjobTask(projectRootDir, bulkjobTask);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("script is not exist");
    });
    it("should be rejected if script is not file", async ()=>{
      bulkjobTask.host = "bulkjobOK";
      bulkjobTask.usePSSettingFile = false;
      bulkjobTask.startBulkNumber = 1;
      bulkjobTask.endBulkNumber = 2;
      bulkjobTask.script = "hoge";
      fs.mkdirSync(path.resolve(projectRootDir, bulkjobTask.name, "hoge"));
      const errors = await validateBulkjobTask(projectRootDir, bulkjobTask);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("script is not file");
    });
    it("should be resolved with empty array", async ()=>{
      bulkjobTask.host = "bulkjobOK";
      bulkjobTask.usePSSettingFile = false;
      bulkjobTask.startBulkNumber = 1;
      bulkjobTask.endBulkNumber = 2;
      bulkjobTask.script = "hoge";
      fs.writeFileSync(path.resolve(projectRootDir, bulkjobTask.name, "hoge"), "hoge");
      expect(await validateBulkjobTask(projectRootDir, bulkjobTask)).to.be.empty;
    });
  });
});
