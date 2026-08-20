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
import { _internal, validateForLoop, validateForeach, validateParameterStudy, validateStorage, validateHPCISS } from "../../../app/core/componentTypeValidator.js";
import { _internal as fileValidatorInternal } from "../../../app/core/fileValidator.js";

//test data
const testDirRoot = "WHEEL_TEST_TMP";
const projectRootDir = path.resolve(testDirRoot, "testProject.wheel");

describe("componentTypeValidator UT", function () {
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
      }
      return undefined;
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

  describe("validateForLoop", ()=>{
    let forComponent;
    beforeEach(async ()=>{
      forComponent = await createNewComponent(projectRootDir, projectRootDir, "foreach", { x: 0, y: 0 });
    });
    it("should be rejected if start is not number", async ()=>{
      forComponent.start = "hoge";
      const errors = await validateForLoop(forComponent);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("start must be number");
    });
    it("should be rejected if start is null", async ()=>{
      forComponent.start = null;
      const errors = await validateForLoop(forComponent);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("start must be number");
    });
    it("should be rejected if start is undefined", async ()=>{
      forComponent.start = undefined;
      const errors = await validateForLoop(forComponent);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("start must be number");
    });
    it("should be rejected if step is not number", async ()=>{
      forComponent.start = 1;
      forComponent.step = "hoge";
      const errors = await validateForLoop(forComponent);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("step must be number");
    });
    it("should be rejected if step is null", async ()=>{
      forComponent.start = 1;
      forComponent.step = null;
      const errors = await validateForLoop(forComponent);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("step must be number");
    });
    it("should be rejected if step is undefined", async ()=>{
      forComponent.start = 1;
      forComponent.step = undefined;
      const errors = await validateForLoop(forComponent);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("step must be number");
    });
    it("should be rejected if end is not number", async ()=>{
      forComponent.start = 1;
      forComponent.step = 2;
      forComponent.end = "hoge";
      const errors = await validateForLoop(forComponent);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("end must be number");
    });
    it("should be rejected if end is null", async ()=>{
      forComponent.start = 1;
      forComponent.step = 2;
      forComponent.end = null;
      const errors = await validateForLoop(forComponent);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("end must be number");
    });
    it("should be rejected if end is undefined", async ()=>{
      forComponent.start = 1;
      forComponent.step = 2;
      forComponent.end = undefined;
      const errors = await validateForLoop(forComponent);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("end must be number");
    });
    it("should be rejected if step is 0", async ()=>{
      forComponent.start = 1;
      forComponent.step = 0;
      forComponent.end = 3;
      const errors = await validateForLoop(forComponent);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("infinite loop");
    });
    it("should be rejected if step is wrong direction (positive step with start > end)", async ()=>{
      forComponent.start = 5;
      forComponent.step = 1;
      forComponent.end = 3;
      const errors = await validateForLoop(forComponent);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("infinite loop");
    });
    it("should be rejected if step is wrong direction (negative step with start < end)", async ()=>{
      forComponent.start = 1;
      forComponent.step = -1;
      forComponent.end = 3;
      const errors = await validateForLoop(forComponent);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("infinite loop");
    });
    it("should be resolved with empty array for positive step with start < end", async ()=>{
      forComponent.start = 1;
      forComponent.step = 2;
      forComponent.end = 10;
      expect(await validateForLoop(forComponent)).to.be.empty;
    });
    it("should be resolved with empty array for negative step with start > end", async ()=>{
      forComponent.start = 10;
      forComponent.step = -2;
      forComponent.end = 1;
      expect(await validateForLoop(forComponent)).to.be.empty;
    });
    it("should be resolved with empty array for decimal values", async ()=>{
      forComponent.start = 1.5;
      forComponent.step = 0.5;
      forComponent.end = 3.5;
      expect(await validateForLoop(forComponent)).to.be.empty;
    });
    it("should be resolved with empty array for negative values", async ()=>{
      forComponent.start = -10;
      forComponent.step = 2;
      forComponent.end = -2;
      expect(await validateForLoop(forComponent)).to.be.empty;
    });
    it("should be resolved with empty array if start and end are equal", async ()=>{
      forComponent.start = 5;
      forComponent.step = 1;
      forComponent.end = 5;
      expect(await validateForLoop(forComponent)).to.be.empty;
    });
  });

  describe("validateForeach", ()=>{
    let foreachComponent;
    beforeEach(async ()=>{
      foreachComponent = await createNewComponent(projectRootDir, projectRootDir, "foreach", { x: 0, y: 0 });
    });
    it("should be rejected if indexList is not array", async ()=>{
      foreachComponent.indexList = "hoge";
      const errors = await validateForeach(foreachComponent);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("index list is broken");
    });
    it("should be rejected if indexList is null", async ()=>{
      foreachComponent.indexList = null;
      const errors = await validateForeach(foreachComponent);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("index list is broken");
    });
    it("should be rejected if indexList is undefined", async ()=>{
      foreachComponent.indexList = undefined;
      const errors = await validateForeach(foreachComponent);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("index list is broken");
    });
    it("should be rejected if indexList is empty array", async ()=>{
      const errors = await validateForeach(foreachComponent);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("index list is empty");
    });
    it("should be resolved with empty array if indexList has one string element", async ()=>{
      foreachComponent.indexList.push("hoge");
      expect(await validateForeach(foreachComponent)).to.be.empty;
    });
    it("should be resolved with empty array if indexList has multiple string elements", async ()=>{
      foreachComponent.indexList.push("item1");
      foreachComponent.indexList.push("item2");
      foreachComponent.indexList.push("item3");
      expect(await validateForeach(foreachComponent)).to.be.empty;
    });
    it("should be resolved with empty array if indexList has number elements", async ()=>{
      foreachComponent.indexList.push(1);
      foreachComponent.indexList.push(2);
      foreachComponent.indexList.push(3);
      expect(await validateForeach(foreachComponent)).to.be.empty;
    });
    it("should be resolved with empty array if indexList has mixed type elements", async ()=>{
      foreachComponent.indexList.push("item1");
      foreachComponent.indexList.push(2);
      foreachComponent.indexList.push(true);
      expect(await validateForeach(foreachComponent)).to.be.empty;
    });
    it("should be resolved with empty array if indexList has empty string", async ()=>{
      foreachComponent.indexList.push("");
      expect(await validateForeach(foreachComponent)).to.be.empty;
    });
  });

  describe("validateParameterStudy", ()=>{
    let ps;
    beforeEach(async ()=>{
      ps = await createNewComponent(projectRootDir, projectRootDir, "PS", { x: 0, y: 0 });
    });
    it("should be rejected if parameterFile is not set", async ()=>{
      ps.parameterFile = null;
      const errors = await validateParameterStudy(projectRootDir, ps);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("parameter setting file is not specified");
    });
    it("should be rejected if parameterFile is not file", async ()=>{
      ps.parameterFile = "hoge";
      fs.mkdirSync(path.resolve(projectRootDir, ps.name, "hoge"));
      const errors = await validateParameterStudy(projectRootDir, ps);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("parameter setting file is not file");
    });
    it("should be rejected if parameterFile is not valid JSON file", async ()=>{
      ps.parameterFile = "hoge";
      fs.writeFileSync(path.resolve(projectRootDir, ps.name, "hoge"), "hoge");
      const errors = await validateParameterStudy(projectRootDir, ps);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("parameter setting file is not JSON file");
    });
    it("should be resolved with empty array if required prop is set", async ()=>{
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
      expect(await validateParameterStudy(projectRootDir, ps)).to.be.empty;
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
      const validateStub = sinon.stub(fileValidatorInternal, "validate").returns(false);
      validateStub.errors = [{ message: "should have required property 'targetFiles'" }];

      const errors = await validateParameterStudy(projectRootDir, testPS);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("parameter setting file does not have valid JSON data");
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
      const validateStub = sinon.stub(fileValidatorInternal, "validate").returns(false);
      validateStub.errors = [{ message: "should be number" }];
      const errors = await validateParameterStudy(projectRootDir, testPS);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("parameter setting file does not have valid JSON data");
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
      const validateStub = sinon.stub(fileValidatorInternal, "validate").returns(false);
      validateStub.errors = [{ message: "should be equal to constant" }];
      const errors = await validateParameterStudy(projectRootDir, testPS);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("parameter setting file does not have valid JSON data");
    });
  });

  describe("validateStorage", ()=>{
    let storage;
    beforeEach(async ()=>{
      storage = await createNewComponent(projectRootDir, projectRootDir, "storage", { x: 0, y: 0 });
    });
    it("should be rejected if storagePath is not set", async ()=>{
      storage.storagePath = null;
      const errors = await validateStorage(storage);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("storagePath is not set");
    });
    it("should be rejected if storagePath is empty string", async ()=>{
      storage.storagePath = "";
      const errors = await validateStorage(storage);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("specified path does not exist on localhost");
    });
    it("should be rejected if storagePath is blank", async ()=>{
      storage.storagePath = "   ";
      const errors = await validateStorage(storage);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("specified path does not exist on localhost");
    });
    it("should be rejected if storagePath is not existing path", async ()=>{
      storage.storagePath = path.resolve(projectRootDir, "hoge");
      const errors = await validateStorage(storage);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("specified path does not exist on localhost");
    });
    it("should be rejected if storagePath is existing file", async ()=>{
      fs.writeFileSync(path.resolve(projectRootDir, "hoge"), "hoge");
      storage.storagePath = path.resolve(projectRootDir, "hoge");
      const errors = await validateStorage(storage);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("specified path is not directory");
    });
    it("should be rejected if invalid host is set", async ()=>{
      storage.host = "hoge";
      storage.storagePath = "hoge";
      const errors = await validateStorage(storage);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.match(/remote host setting for .* not found/);
    });
    //unlike the local branch (caught indirectly via fs.stat ENOENT, tested above),
    //the remote branch has nothing to fs.stat - it must check storagePath itself.
    it("should be rejected if storagePath is empty string and host is set", async ()=>{
      storage.storagePath = "";
      storage.host = "OK";
      const errors = await validateStorage(storage);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("storagePath is not set");
    });
    it("should be rejected if storagePath is blank and host is set", async ()=>{
      storage.storagePath = "   ";
      storage.host = "OK";
      const errors = await validateStorage(storage);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("storagePath is not set");
    });
    it("should be resolved with empty array if storagePath is not existing path but host is set", async ()=>{
      storage.storagePath = path.resolve(projectRootDir, "hoge");
      storage.host = "OK";
      expect(await validateStorage(storage)).to.be.empty;
    });
    it("should be resolved with empty array if storagePath is existing file but host is set", async ()=>{
      fs.writeFileSync(path.resolve(projectRootDir, "hoge"), "hoge");
      storage.storagePath = path.resolve(projectRootDir, "hoge");
      storage.host = "OK";
      expect(await validateStorage(storage)).to.be.empty;
    });
    it("should be resolved with empty array if storagePath is existing directory", async ()=>{
      storage.storagePath = projectRootDir;
      expect(await validateStorage(storage)).to.be.empty;
    });
    it("should be resolved with empty array if storagePath is existing directory and host is set", async ()=>{
      storage.storagePath = projectRootDir;
      storage.host = "OK";
      expect(await validateStorage(storage)).to.be.empty;
    });
    it("should be resolved with empty array if storagePath is relative path and host is set", async ()=>{
      storage.storagePath = "./relative/path";
      storage.host = "OK";
      expect(await validateStorage(storage)).to.be.empty;
    });
    it("should be resolved with empty array if storagePath is absolute path and host is set", async ()=>{
      storage.storagePath = "/absolute/path";
      storage.host = "OK";
      expect(await validateStorage(storage)).to.be.empty;
    });
  });

  describe("validateHPCISS", ()=>{
    let hpciss;
    beforeEach(async ()=>{
      hpciss = await createNewComponent(projectRootDir, projectRootDir, "hpciss", { x: 0, y: 0 });
    });
    it("should be rejected if host is not set", async ()=>{
      hpciss.host = null;
      hpciss.storagePath = "/some/gfarm/path";
      const errors = await validateHPCISS(hpciss);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("host is required");
    });
    it("should be rejected if host is empty string", async ()=>{
      hpciss.host = "";
      hpciss.storagePath = "/some/gfarm/path";
      const errors = await validateHPCISS(hpciss);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("host is required");
    });
    it("should be rejected if host is blank", async ()=>{
      hpciss.host = "   ";
      hpciss.storagePath = "/some/gfarm/path";
      const errors = await validateHPCISS(hpciss);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("host is required");
    });
    it("should be rejected if host is localhost", async ()=>{
      hpciss.host = "localhost";
      hpciss.storagePath = "/some/gfarm/path";
      const errors = await validateHPCISS(hpciss);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("must not be localhost");
    });
    it("should be resolved with empty array if host is a valid remote host and storagePath is set", async ()=>{
      hpciss.host = "OK";
      hpciss.storagePath = "/some/gfarm/path";
      expect(await validateHPCISS(hpciss)).to.be.empty;
    });
    it("should be rejected if host is valid but storagePath is empty (delegates to validateStorage)", async ()=>{
      hpciss.host = "OK";
      hpciss.storagePath = "";
      const errors = await validateHPCISS(hpciss);
      expect(errors).to.not.be.empty;
      expect(errors[0].message).to.be.a("string");
      expect(errors[0].message).to.include("storagePath is not set");
    });
  });
});
