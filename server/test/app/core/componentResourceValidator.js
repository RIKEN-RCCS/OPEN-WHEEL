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
