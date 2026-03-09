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
import { _internal, checkScript, checkPSSettingFile, checkSourceScript } from "../../../app/core/fileValidator.js";

//test data
const testDirRoot = "WHEEL_TEST_TMP";
const projectRootDir = path.resolve(testDirRoot, "testProject.wheel");

describe("fileValidator UT", function () {
  beforeEach(async function () {
    this.timeout(10000);
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

  describe("checkSourceScript", ()=>{
    let component;
    let mockSsh;
    beforeEach(async ()=>{
      component = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 0, y: 0 });
      component.host = "remoteHost";
      component.useJobScheduler = true;
      mockSsh = { exec: sinon.stub() };
      sinon.stub(_internal.remoteHost, "getID").callsFake((key, value)=>{
        return value === "remoteHost" ? "mock-host-id" : undefined;
      });
      sinon.stub(_internal, "hasEntry").returns(false);
      sinon.stub(_internal, "getSsh").returns(mockSsh);
    });

    it("should return without error if sourceScript is not set", async ()=>{
      await expect(checkSourceScript(projectRootDir, component)).to.be.fulfilled;
    });

    it("should return without error if sourceScript is empty string", async ()=>{
      component.sourceScript = "";
      await expect(checkSourceScript(projectRootDir, component)).to.be.fulfilled;
    });

    it("should be rejected if remote host is not found", async ()=>{
      component.host = "unknownHost";
      component.sourceScript = "/path/to/setup.sh";
      await expect(checkSourceScript(projectRootDir, component)).to.be.rejectedWith(/remote host unknownHost not found/);
    });

    it("should return without error if SSH is not connected (skips check)", async ()=>{
      component.sourceScript = "/path/to/setup.sh";
      _internal.hasEntry.returns(false);
      await expect(checkSourceScript(projectRootDir, component)).to.be.fulfilled;
    });

    it("should be rejected if sourceScript does not exist on remote host", async ()=>{
      component.sourceScript = "/path/to/nonexistent.sh";
      _internal.hasEntry.returns(true);
      mockSsh.exec.resolves(1);
      await expect(checkSourceScript(projectRootDir, component))
        .to.be.rejectedWith(/sourceScript.*does not exist on remoteHost/);
    });

    it("should return without error if sourceScript exists on remote host", async ()=>{
      component.sourceScript = "/path/to/setup.sh";
      _internal.hasEntry.returns(true);
      mockSsh.exec.resolves(0);
      await expect(checkSourceScript(projectRootDir, component)).to.be.fulfilled;
    });
  });

  describe("checkPSSettingFile", function () {
    beforeEach(async function () {
      sinon.stub(_internal, "getComponentDir").resolves(path.resolve(projectRootDir, "test-ps"));
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

  describe("checkPSSettingFile with invalid JSON", function () {
    beforeEach(async function () {
      this.timeout(10000);
      await setupTestDir(testDirRoot);

      try {
        await createNewProject(projectRootDir, "test project", null, "test", "test@example.com");
      } catch (e) {
        console.log(e);
        throw e;
      }

      sinon.stub(_internal, "getComponentDir").resolves(path.resolve(projectRootDir, "test-ps"));
    });

    afterEach(function () {
      sinon.restore();
    });

    after(async function () {
      if (!process.env.WHEEL_KEEP_FILES_AFTER_LAST_TEST) {
        await fs.remove(testDirRoot);
      }
    });

    it("should be rejected if JSON has syntax error", async function () {
      const ps = {
        type: "parameterStudy",
        ID: "test-ps",
        name: "test-ps",
        parameterFile: "syntax_error.json"
      };

      await fs.ensureDir(path.resolve(projectRootDir, ps.name));

      await fs.writeFile(path.resolve(projectRootDir, ps.name, "syntax_error.json"), "{\"incomplete\": ");

      await expect(checkPSSettingFile(projectRootDir, ps)).to.be.rejectedWith(/parameter setting file is not JSON file/);
    });
  });
});
