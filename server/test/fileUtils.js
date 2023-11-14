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
chai.use(require("chai-fs"));
chai.use(require("chai-as-promised"));

//helper functions
const { gitAdd, gitCommit, gitStatus } = require("../app/core/gitOperator2");

//testee
const {
  openFile,
  saveFile
} = require("../app/core/fileUtils");


//test data
const testDirRoot = "WHEEL_TEST_TMP";

const psJson = {
  "version": 2,
  targetFiles: ["foo", "bar"],
  hoge: "hoge",
  nested: {
    nest1: {
      nest2: {
        nest3: {
          nest4: "hogehoge"
        }
      }
    }
  }
};

const projectRootDir = path.resolve(testDirRoot, "testProject.wheel");
const notExisting = path.resolve(projectRootDir, "notExisting");
const { createNewComponent, createNewProject } = require("../app/core/projectFilesOperator");

//helper functions
describe("file utility functions", function() {
  let ps0;
  beforeEach(async function(){
    this.timeout(20000);
    await fs.remove(testDirRoot);
    await createNewProject(projectRootDir, "test project", null, "test", "test@example.com");
    ps0 = await createNewComponent(projectRootDir, projectRootDir, "PS", { x: 10, y: 10 });
    await fs.outputFile(path.resolve(projectRootDir, ps0.name, "foo"), "foo");
    await fs.outputFile(path.resolve(projectRootDir, ps0.name, "bar"), "bar");
    await fs.outputFile(path.resolve(projectRootDir, ps0.name, "baz"), "baz");
    await fs.outputJson(path.resolve(projectRootDir, ps0.name, "parameterSetting.json"), psJson);
    await fs.remove(notExisting);
    await gitAdd(projectRootDir, "./");
    await gitCommit(projectRootDir);
  });
  after(async()=>{
    if (!process.env.WHEEL_KEEP_FILES_AFTER_LAST_TEST) {
      await fs.remove(testDirRoot);
    }
  });

  describe("#openFile", ()=>{
    it("should create empty file if not existing filename is specified", async()=>{
      const rt = await openFile(testDirRoot, notExisting);
      expect(notExisting).to.be.a.file().and.empty;
      expect(rt).to.be.an("array").that.have.lengthOf(1);
      expect(rt[0]).to.deep.equal({ content: "", filename: path.basename(notExisting), dirname: path.dirname(notExisting) });
      const { untracked } = await gitStatus(projectRootDir);
      expect(untracked).to.have.members([path.basename(notExisting)]);
    });
    it("should return existing file", async()=>{
      const rt = await openFile(projectRootDir, path.resolve(projectRootDir, ps0.name, "foo"));
      expect(rt).to.be.an("array").that.have.lengthOf(1);
      const dirname=path.resolve(projectRootDir, ps0.name)
      expect(rt[0]).to.deep.equal({ content: "foo", filename: "foo", dirname });
    });
    it("should return json file and targetFiles in the json", async()=>{
      const rt = await openFile(projectRootDir, path.resolve(projectRootDir, ps0.name, "parameterSetting.json"));
      expect(rt).to.be.an("array").that.have.lengthOf(3);
      const dirname=path.resolve(projectRootDir, ps0.name)
      expect(rt[0].filename).to.equal("parameterSetting.json");
      expect(rt[0].dirname).to.equal(dirname);
      expect(rt[0].isParameterSettingFile).to.be.true;
      expect(JSON.parse(rt[0].content)).to.deep.equal(psJson);
      expect(rt.slice(1)).to.have.deep.members([
        { content: "foo", filename: "foo", dirname },
        { content: "bar", filename: "bar", dirname }
      ]);
    });
    it("should return only json file if forceNormal==true", async()=>{
      const rt = await openFile(projectRootDir, path.resolve(projectRootDir, ps0.name, "parameterSetting.json"), true);
      expect(rt).to.be.an("array").that.have.lengthOf(1);
      expect(rt[0].filename).to.equal("parameterSetting.json");
      const dirname=path.resolve(projectRootDir, ps0.name)
      expect(rt[0].dirname).to.equal(dirname);
      expect(JSON.parse(rt[0].content)).to.deep.equal(psJson);
    });
    it("should throw error while attempting to open directory", async()=>{
      return expect(openFile(projectRootDir, path.resolve(projectRootDir, ps0.name))).to.be.rejectedWith("EISDIR");
    });
  });
  describe("#saveFile", ()=>{
    it("should overwrite existing file", async()=>{
      await saveFile(path.resolve(projectRootDir, ps0.name, "foo"), "bar");
      expect(path.resolve(projectRootDir, ps0.name, "foo")).to.be.a.file().with.content("bar");
      const { modified } = await gitStatus(projectRootDir);
      expect(modified).to.have.members(["PS0/foo"]);
    });
    it("should write new file", async()=>{
      await saveFile(path.resolve(projectRootDir, ps0.name, "huga"), "huga");
      expect(path.resolve(projectRootDir, ps0.name, "huga")).to.be.a.file().with.content("huga");
      const { added } = await gitStatus(projectRootDir);
      expect(added).to.have.members(["PS0/huga"]);
    });
    it("should throw error while attempting to write directory", async()=>{
      return expect(saveFile(path.resolve(projectRootDir, ps0.name), "hoge")).to.be.rejectedWith("EISDIR");
    });
  });
});
