/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */

"use strict";
const path = require("node:path");
const fs = require("fs-extra");

//setup test framework
const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-fs"));
chai.use(require("chai-as-promised"));
const rewire = require("rewire");
const sinon = require("sinon");

//testee
const IP = rewire("../app/core/importProject.js");
const isEmptyDir = IP.__get__("isEmptyDir");
const readArchiveMetadata = IP.__get__("readArchiveMetadata");
const importProject = IP.__get__("importProject");
const moveAndRegisterProject = IP.__get__("moveAndRegisterProject");

const dummyProjectList = [];
IP.__set__("projectList", dummyProjectList);

//test data
const testDirRoot = "WHEEL_TEST_TMP";
const testArchiveFile = path.resolve(__dirname, "testFiles/WHEEL_project_test_project.tgz");

describe("import project UT", function () {
  this.timeout(10000);
  beforeEach(async ()=>{
    await fs.remove(testDirRoot);
  });
  after(async ()=>{
    if (!process.env.WHEEL_KEEP_FILES_AFTER_LAST_TEST) {
      await fs.remove(testDirRoot);
    }
  });
  describe("#isEmptyDir", ()=>{
    beforeEach(async ()=>{
      await fs.ensureDir(path.resolve(testDirRoot, "empty"));
      await fs.ensureDir(path.resolve(testDirRoot, "withDot"));
      await fs.outputFile(path.resolve(testDirRoot, "withDot", ".hoge"), "hoge");
      await fs.ensureDir(path.resolve(testDirRoot, "withFile"));
      await fs.outputFile(path.resolve(testDirRoot, "withFile", "hoge"), "hoge");
    });
    it("should be return true for empty dir", async ()=>{
      expect(await isEmptyDir(path.resolve(testDirRoot, "empty"))).to.be.true;
    });
    it("should be return false if directory contains file", async ()=>{
      expect(await isEmptyDir(path.resolve(testDirRoot, "withFile"))).to.be.false;
    });
    it("should be return false if directory contains dot file", async ()=>{
      expect(await isEmptyDir(path.resolve(testDirRoot, "withDot"))).to.be.false;
    });
  });
  describe("#moveAndRegisterProject", ()=>{
    beforeEach(async ()=>{
      await fs.ensureDir(path.resolve(testDirRoot, "src", "foo", "bar"));
      await fs.outputFile(path.resolve(testDirRoot, "src", "foo", "baz"), "baz");
      await fs.remove(path.resolve(testDirRoot, "dst"));
    });
    it("should move dir and add entry to projectList", async ()=>{
      await moveAndRegisterProject(path.resolve(testDirRoot, "src"), path.resolve(testDirRoot, "dst"));
      expect(path.resolve(testDirRoot, "src")).not.to.be.a.path();
      expect(path.resolve(testDirRoot, "dst")).to.be.a.directory().with.contents(["foo"]);
      expect(path.resolve(testDirRoot, "dst", "foo")).to.be.a.directory().with.contents(["bar", "baz"]);
      expect(path.resolve(testDirRoot, "dst", "foo", "bar")).to.be.a.directory().and.empty;
      expect(path.resolve(testDirRoot, "dst", "foo", "baz")).to.be.a.file().with.content("baz");
      expect(dummyProjectList).to.be.a("array").and.has.lengthOf(1);
      expect(dummyProjectList[0]).to.be.a("object");
      expect(dummyProjectList[0].path).to.equal(path.resolve(testDirRoot, "dst"));
    });
  });
  describe("#readArchiveMetadata", ()=>{
    it("should read projectJson metadata in archive", async ()=>{
      const result = await readArchiveMetadata(testArchiveFile);
      expect(result.name).to.equal("test_project");
      expect(result.exportDate).to.match(/\d\d\d\d\/\d\d\/\d\d \d\d:\d\d:\d\d JST/);
      expect(result.exporter).to.be.a("object").and.empty;
    });
  });
  describe("#importProject", ()=>{
    const getHosts = sinon.stub();
    const askHostMap = sinon.stub();
    const rewriteHosts = sinon.stub();
    IP.__set__("getHosts", getHosts);
    IP.__set__("askHostMap", askHostMap);
    IP.__set__("rewriteHosts", rewriteHosts);
    beforeEach(()=>{
      getHosts.resetHistory();
      askHostMap.resetHistory();
      rewriteHosts.resetHistory();
    });
    it("should import project and add it to projectList", async ()=>{
      getHosts.onCall(0).returns([]);
      expect(await importProject("dummyClientID", testArchiveFile, testDirRoot)).to.be.undefined;
      expect(getHosts).to.be.calledOnce;
      expect(askHostMap).not.to.be.called;
      expect(rewriteHosts).not.to.be.called;
    });
    it("should import project and add it to projectList with host modification", async ()=>{
      const hosts = ["hoge"];
      const hostMap = { hoge: "huga" };
      getHosts.onCall(0).returns(hosts);
      askHostMap.onCall(0).returns(hostMap);
      expect(await importProject("dummyClientID", testArchiveFile, testDirRoot)).to.be.undefined;
      expect(getHosts).to.be.calledOnce;
      expect(askHostMap).to.be.calledWith("dummyClientID", hosts);
      expect(rewriteHosts).to.be.calledOnce;
      expect(rewriteHosts.getCall(0).args[1]).to.deep.equal(hostMap);
    });
  });
});
