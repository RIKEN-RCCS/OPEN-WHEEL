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
import { validateConditionalCheck, validateKeepProp, validateInputFiles, validateOutputFiles } from "../../../app/core/componentResourceValidator.js";
import { ValidationError } from "../../../app/lib/validationError.js";

//test data
const testDirRoot = "WHEEL_TEST_TMP";
const projectRootDir = path.resolve(testDirRoot, "testProject.wheel");

describe("componentResourceValidator UT", function () {
  beforeEach(async function () {
    this.timeout(10000);
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
  after(async ()=>{
    if (!process.env.WHEEL_KEEP_FILES_AFTER_LAST_TEST) {
      await fs.remove(testDirRoot);
    }
  });

  describe("validateConditionalCheck", ()=>{
    let ifComponent;
    let whileComponent;
    beforeEach(async ()=>{
      ifComponent = await createNewComponent(projectRootDir, projectRootDir, "if", { x: 0, y: 0 });
      whileComponent = await createNewComponent(projectRootDir, projectRootDir, "while", { x: 0, y: 0 });
    });
    it("should reject if condition is not specified", async ()=>{
      const ifErrors = await validateConditionalCheck(projectRootDir, ifComponent);
      expect(ifErrors).to.have.lengthOf(1);
      expect(ifErrors[0]).to.be.instanceof(ValidationError);
      expect(ifErrors[0].message).to.include("condition is not specified");
      const whileErrors = await validateConditionalCheck(projectRootDir, whileComponent);
      expect(whileErrors).to.have.lengthOf(1);
      expect(whileErrors[0]).to.be.instanceof(ValidationError);
      expect(whileErrors[0].message).to.include("condition is not specified");
    });
    it("should reject if condition exists but it is not file", async ()=>{
      ifComponent.condition = "hoge";
      fs.mkdirSync(path.resolve(projectRootDir, ifComponent.name, "hoge"));
      whileComponent.condition = "hoge";
      fs.mkdirSync(path.resolve(projectRootDir, whileComponent.name, "hoge"));
      const ifErrors = await validateConditionalCheck(projectRootDir, ifComponent);
      expect(ifErrors).to.have.lengthOf(1);
      expect(ifErrors[0]).to.be.instanceof(ValidationError);
      expect(ifErrors[0].message).to.match(/condition is exist but it is not file .*/);
      const whileErrors = await validateConditionalCheck(projectRootDir, whileComponent);
      expect(whileErrors).to.have.lengthOf(1);
      expect(whileErrors[0]).to.be.instanceof(ValidationError);
      expect(whileErrors[0].message).to.match(/condition is exist but it is not file .*/);
    });

    it("should be resolved with empty array if condition is a valid file", async function () {
      const testIfComponent = await createNewComponent(projectRootDir, projectRootDir, "if", { x: 0, y: 0 });
      const testWhileComponent = await createNewComponent(projectRootDir, projectRootDir, "while", { x: 0, y: 0 });
      testIfComponent.condition = "valid_condition.js";
      testWhileComponent.condition = "valid_condition.js";
      const ifConditionPath = path.resolve(projectRootDir, testIfComponent.name, "valid_condition.js");
      const whileConditionPath = path.resolve(projectRootDir, testWhileComponent.name, "valid_condition.js");
      await fs.writeFile(ifConditionPath, "module.exports = function() { return true; }");
      await fs.writeFile(whileConditionPath, "module.exports = function() { return true; }");
      expect(await validateConditionalCheck(projectRootDir, testIfComponent)).to.be.empty;
      expect(await validateConditionalCheck(projectRootDir, testWhileComponent)).to.be.empty;
    });

    it("should be resolved with empty array if condition is a JavaScript expression", async function () {
      const testIfComponent = await createNewComponent(projectRootDir, projectRootDir, "if", { x: 0, y: 0 });
      const testWhileComponent = await createNewComponent(projectRootDir, projectRootDir, "while", { x: 0, y: 0 });
      testIfComponent.condition = "js_expression.js";
      testWhileComponent.condition = "js_expression.js";
      const ifConditionPath = path.resolve(projectRootDir, testIfComponent.name, "js_expression.js");
      const whileConditionPath = path.resolve(projectRootDir, testWhileComponent.name, "js_expression.js");
      await fs.writeFile(ifConditionPath, "module.exports = function() { return true; }");
      await fs.writeFile(whileConditionPath, "module.exports = function() { return 1 < 2; }");
      expect(await validateConditionalCheck(projectRootDir, testIfComponent)).to.be.empty;
      expect(await validateConditionalCheck(projectRootDir, testWhileComponent)).to.be.empty;
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
    it("should be rejected if keep is non-empty string", async ()=>{
      whileComponent.keep = "hoge";
      forComponent.keep = "hoge";
      foreachComponent.keep = "hoge";
      const whileErrors = await validateKeepProp(whileComponent);
      expect(whileErrors).to.have.lengthOf(1);
      expect(whileErrors[0]).to.be.instanceof(ValidationError);
      expect(whileErrors[0].message).to.include("keep must be positive integer");
      const forErrors = await validateKeepProp(forComponent);
      expect(forErrors).to.have.lengthOf(1);
      expect(forErrors[0].message).to.include("keep must be positive integer");
      const foreachErrors = await validateKeepProp(foreachComponent);
      expect(foreachErrors).to.have.lengthOf(1);
      expect(foreachErrors[0].message).to.include("keep must be positive integer");
    });
    it("should be rejected if keep is a string that looks like a number", async ()=>{
      whileComponent.keep = "5";
      forComponent.keep = "5";
      foreachComponent.keep = "5";
      const whileErrors = await validateKeepProp(whileComponent);
      expect(whileErrors).to.have.lengthOf(1);
      expect(whileErrors[0].message).to.include("keep must be positive integer");
      const forErrors = await validateKeepProp(forComponent);
      expect(forErrors).to.have.lengthOf(1);
      expect(forErrors[0].message).to.include("keep must be positive integer");
      const foreachErrors = await validateKeepProp(foreachComponent);
      expect(foreachErrors).to.have.lengthOf(1);
      expect(foreachErrors[0].message).to.include("keep must be positive integer");
    });
    it("should be rejected if keep is real number", async ()=>{
      whileComponent.keep = 3.1;
      forComponent.keep = 3.1;
      foreachComponent.keep = 3.1;
      const whileErrors = await validateKeepProp(whileComponent);
      expect(whileErrors).to.have.lengthOf(1);
      expect(whileErrors[0].message).to.include("keep must be positive integer");
      const forErrors = await validateKeepProp(forComponent);
      expect(forErrors).to.have.lengthOf(1);
      expect(forErrors[0].message).to.include("keep must be positive integer");
      const foreachErrors = await validateKeepProp(foreachComponent);
      expect(foreachErrors).to.have.lengthOf(1);
      expect(foreachErrors[0].message).to.include("keep must be positive integer");
    });
    it("should be rejected if keep is negative integer", async ()=>{
      whileComponent.keep = -1;
      forComponent.keep = -1;
      foreachComponent.keep = -1;
      const whileErrors = await validateKeepProp(whileComponent);
      expect(whileErrors).to.have.lengthOf(1);
      expect(whileErrors[0].message).to.include("keep must be positive integer");
      const forErrors = await validateKeepProp(forComponent);
      expect(forErrors).to.have.lengthOf(1);
      expect(forErrors[0].message).to.include("keep must be positive integer");
      const foreachErrors = await validateKeepProp(foreachComponent);
      expect(foreachErrors).to.have.lengthOf(1);
      expect(foreachErrors[0].message).to.include("keep must be positive integer");
    });
    it("should be rejected if keep is boolean", async ()=>{
      whileComponent.keep = true;
      forComponent.keep = true;
      foreachComponent.keep = true;
      const whileErrors = await validateKeepProp(whileComponent);
      expect(whileErrors).to.have.lengthOf(1);
      expect(whileErrors[0].message).to.include("keep must be positive integer");
      const forErrors = await validateKeepProp(forComponent);
      expect(forErrors).to.have.lengthOf(1);
      expect(forErrors[0].message).to.include("keep must be positive integer");
      const foreachErrors = await validateKeepProp(foreachComponent);
      expect(foreachErrors).to.have.lengthOf(1);
      expect(foreachErrors[0].message).to.include("keep must be positive integer");
    });
    it("should be resolved with empty array if keep is empty string", async ()=>{
      whileComponent.keep = "";
      forComponent.keep = "";
      foreachComponent.keep = "";
      expect(await validateKeepProp(whileComponent)).to.be.empty;
      expect(await validateKeepProp(forComponent)).to.be.empty;
      expect(await validateKeepProp(foreachComponent)).to.be.empty;
    });
    it("should be resolved with empty array if keep is null", async ()=>{
      whileComponent.keep = null;
      forComponent.keep = null;
      foreachComponent.keep = null;
      expect(await validateKeepProp(whileComponent)).to.be.empty;
      expect(await validateKeepProp(forComponent)).to.be.empty;
      expect(await validateKeepProp(foreachComponent)).to.be.empty;
    });
    it("should be rejected if keep is undefined", async ()=>{
      whileComponent.keep = undefined;
      forComponent.keep = undefined;
      foreachComponent.keep = undefined;
      const whileErrors = await validateKeepProp(whileComponent);
      expect(whileErrors).to.have.lengthOf(1);
      expect(whileErrors[0].message).to.include("keep must be positive integer");
      const forErrors = await validateKeepProp(forComponent);
      expect(forErrors).to.have.lengthOf(1);
      expect(forErrors[0].message).to.include("keep must be positive integer");
      const foreachErrors = await validateKeepProp(foreachComponent);
      expect(foreachErrors).to.have.lengthOf(1);
      expect(foreachErrors[0].message).to.include("keep must be positive integer");
    });
    it("should be resolved with empty array if keep is 0", async ()=>{
      whileComponent.keep = 0;
      forComponent.keep = 0;
      foreachComponent.keep = 0;
      expect(await validateKeepProp(whileComponent)).to.be.empty;
      expect(await validateKeepProp(forComponent)).to.be.empty;
      expect(await validateKeepProp(foreachComponent)).to.be.empty;
    });
    it("should be resolved with empty array if keep is positive integer", async ()=>{
      whileComponent.keep = 5;
      forComponent.keep = 5;
      foreachComponent.keep = 5;
      expect(await validateKeepProp(whileComponent)).to.be.empty;
      expect(await validateKeepProp(forComponent)).to.be.empty;
      expect(await validateKeepProp(foreachComponent)).to.be.empty;
    });
    it("should be resolved with empty array if keep is large positive integer", async ()=>{
      whileComponent.keep = 1000000;
      forComponent.keep = 1000000;
      foreachComponent.keep = 1000000;
      expect(await validateKeepProp(whileComponent)).to.be.empty;
      expect(await validateKeepProp(forComponent)).to.be.empty;
      expect(await validateKeepProp(foreachComponent)).to.be.empty;
    });
  });

  describe("validateInputFiles", ()=>{
    let component;
    beforeEach(()=>{
      component = { inputFiles: [] };
    });
    it("should be rejected if one of input filename is invalid", async ()=>{
      component.inputFiles.push({ name: "hoge", src: [] });
      component.inputFiles.push({ name: "h*ge", src: [] });
      const errors = await validateInputFiles(component);
      expect(errors.length).to.be.greaterThan(0);
      expect(errors[0]).to.be.instanceof(ValidationError);
      expect(errors[0].message).to.match(/.* is not allowed as input file./);
    });
    it("should be rejected if input filename is null", async ()=>{
      component.inputFiles.push({ name: null, src: [] });
      const errors = await validateInputFiles(component);
      expect(errors).to.not.be.empty;
      expect(errors[0]).to.be.instanceof(ValidationError);
      expect(errors[0].message).to.match(/.* is not allowed as input file./);
    });
    it("should be rejected if input filename is empty string", async ()=>{
      component.inputFiles.push({ name: "", src: [] });
      const errors = await validateInputFiles(component);
      expect(errors).to.not.be.empty;
      expect(errors[0]).to.be.instanceof(ValidationError);
      expect(errors[0].message).to.match(/.* is not allowed as input file./);
    });
    it("should be rejected if input filename is blank", async ()=>{
      component.inputFiles.push({ name: "   ", src: [] });
      const errors = await validateInputFiles(component);
      expect(errors).to.not.be.empty;
      expect(errors[0]).to.be.instanceof(ValidationError);
      expect(errors[0].message).to.match(/.* is not allowed as input file./);
    });
    it("should be rejected if inputFile is file and has 2 or more connection", async ()=>{
      component.inputFiles.push({ name: "hoge", src: [{}, {}] });
      const errors = await validateInputFiles(component);
      expect(errors).to.not.be.empty;
      expect(errors[0]).to.be.instanceof(ValidationError);
      expect(errors[0].message).to.match(/inputFile .* data type is 'file' but it has two or more outputFiles./);
    });
    it("should be resolved with empty array if inputFile is file and is not connected", async ()=>{
      component.inputFiles.push({ name: "hoge", src: [] });
      expect(await validateInputFiles(component)).to.be.empty;
    });
    it("should be resolved with empty array if inputFile is file and has only 1 connection", async ()=>{
      component.inputFiles.push({ name: "hoge", src: [{}] });
      expect(await validateInputFiles(component)).to.be.empty;
    });
    it("should be resolved with empty array if inputFile is directory and has 2 or more connection", async ()=>{
      component.inputFiles.push({ name: "hoge/", src: [{}, {}] });
      expect(await validateInputFiles(component)).to.be.empty;
    });
    it("should be resolved with empty array if multiple valid inputFiles", async ()=>{
      component.inputFiles.push({ name: "file1.txt", src: [] });
      component.inputFiles.push({ name: "file2.txt", src: [] });
      component.inputFiles.push({ name: "directory/", src: [] });
      expect(await validateInputFiles(component)).to.be.empty;
    });
    it("should be resolved with empty array if no inputFiles", async ()=>{
      expect(await validateInputFiles(component)).to.be.empty;
    });
    it("should be resolved with empty array if inputFile has valid path format", async ()=>{
      component.inputFiles.push({ name: "path/to/file.txt", src: [] });
      expect(await validateInputFiles(component)).to.be.empty;
    });
    it("should be rejected if mandatory inputFile has no connection (src is empty)", async ()=>{
      component.inputFiles.push({ name: "hoge", src: [], mandatory: true });
      const errors = await validateInputFiles(component);
      expect(errors).to.not.be.empty;
      expect(errors[0]).to.be.instanceof(ValidationError);
      expect(errors[0].message).to.match(/mandatory inputFile .* is not connected/);
    });
    it("should be resolved with empty array if mandatory inputFile is connected", async ()=>{
      component.inputFiles.push({ name: "hoge", src: [{ srcNode: "node1", srcName: "out.txt" }], mandatory: true });
      expect(await validateInputFiles(component)).to.be.empty;
    });
    it("should be resolved with empty array if non-mandatory inputFile has no connection", async ()=>{
      component.inputFiles.push({ name: "hoge", src: [], mandatory: false });
      expect(await validateInputFiles(component)).to.be.empty;
    });
    it("should be resolved with empty array if inputFile without mandatory flag has no connection", async ()=>{
      component.inputFiles.push({ name: "hoge", src: [] });
      expect(await validateInputFiles(component)).to.be.empty;
    });
  });

  describe("validateOutputFiles", ()=>{
    let component;
    beforeEach(()=>{
      component = { outputFiles: [] };
    });
    it("should be rejected if output filename is blank", async ()=>{
      component.outputFiles.push({ name: "   ", dst: [] });
      const errors = await validateOutputFiles(component);
      expect(errors).to.not.be.empty;
      expect(errors[0]).to.be.instanceof(ValidationError);
      expect(errors[0].message).to.match(/.* is not allowed as output filename./);
    });
    it("should be resolved with empty array if output filename contains special characters", async ()=>{
      component.outputFiles.push({ name: "file*name", dst: [] });
      expect(await validateOutputFiles(component)).to.be.empty;
    });
    it("should be rejected if output filename is null", async ()=>{
      component.outputFiles.push({ name: null, dst: [] });
      const errors = await validateOutputFiles(component);
      expect(errors).to.not.be.empty;
      expect(errors[0]).to.be.instanceof(ValidationError);
      expect(errors[0].message).to.match(/.* is not allowed as output filename./);
    });
    it("should be rejected if output filename is empty string", async ()=>{
      component.outputFiles.push({ name: "", dst: [] });
      const errors = await validateOutputFiles(component);
      expect(errors).to.not.be.empty;
      expect(errors[0]).to.be.instanceof(ValidationError);
      expect(errors[0].message).to.match(/.* is not allowed as output filename./);
    });
    it("should be resolved with empty array if output filename is valid", async ()=>{
      component.outputFiles.push({ name: "validfile.txt", dst: [] });
      expect(await validateOutputFiles(component)).to.be.empty;
    });
    it("should be resolved with empty array if multiple output files with valid names", async ()=>{
      component.outputFiles.push({ name: "file1.txt", dst: [] });
      component.outputFiles.push({ name: "file2.txt", dst: [] });
      component.outputFiles.push({ name: "file3.txt", dst: [] });
      expect(await validateOutputFiles(component)).to.be.empty;
    });
    it("should be resolved with empty array if no output files", async ()=>{
      expect(await validateOutputFiles(component)).to.be.empty;
    });
    it("should be resolved with empty array if output filename is a directory path", async ()=>{
      component.outputFiles.push({ name: "directory/", dst: [] });
      expect(await validateOutputFiles(component)).to.be.empty;
    });
  });
});
