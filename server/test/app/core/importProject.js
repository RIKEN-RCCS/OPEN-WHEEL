/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */

"use strict";
const path = require("node:path");
const util = require("node:util");
const exec = util.promisify(require("node:child_process").exec);
const fs = require("fs-extra");

//setup test framework
const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-fs"));
chai.use(require("chai-as-promised"));
const rewire = require("rewire");
const sinon = require("sinon");

//testee
const IP = rewire("../../../app/core/importProject.js");
const isEmptyDir = IP.__get__("isEmptyDir");
const extractAndReadArchiveMetadata = IP.__get__("extractAndReadArchiveMetadata");
const importProject = IP.__get__("importProject");

const dummyProjectList = [];
IP.__set__("projectList", dummyProjectList);

//test data
const testDirRoot = "WHEEL_TEST_TMP";
const testArchiveFile = path.resolve(__dirname, "../../testFiles/WHEEL_project_test_project.tgz");

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
  describe("#extractAndReadArchiveMetadata", ()=>{
    it("should read projectJson metadata in archive", async ()=>{
      const result = await extractAndReadArchiveMetadata(testArchiveFile);
      expect(result.name).to.equal("new_project");
    });
  });
  describe("#importProject", ()=>{
    const getHosts = sinon.stub();
    const askHostMap = sinon.stub();
    const rewriteHosts = sinon.stub();
    IP.__set__("getHosts", getHosts);
    IP.__set__("askHostMap", askHostMap);
    IP.__set__("rewriteHosts", rewriteHosts);
    beforeEach(async ()=>{
      getHosts.resetHistory();
      askHostMap.resetHistory();
      rewriteHosts.resetHistory();
      await exec(`cp ${testArchiveFile} ${testArchiveFile}.bak`);
    });
    afterEach(async ()=>{
      await exec(`cp ${testArchiveFile}.bak ${testArchiveFile}`);
    });
    after(async ()=>{
      await exec(`rm ${testArchiveFile}.bak`);
    });
    it("should import project and add it to projectList", async ()=>{
      getHosts.onCall(0).returns([]);
      expect(await importProject("dummyClientID", testArchiveFile, testDirRoot)).to.be.a("string");
      expect(getHosts).to.be.calledOnce;
      expect(askHostMap).not.to.be.called;
      expect(rewriteHosts).not.to.be.called;
      expect(dummyProjectList[0].path).to.equal(path.resolve(testDirRoot, "new_project.wheel"));
    });
    it("should import project and add it to projectList with host modification", async ()=>{
      const hosts = ["hoge"];
      const hostMap = { hoge: "huga" };
      getHosts.onCall(0).returns(hosts);
      askHostMap.onCall(0).returns(hostMap);
      expect(await importProject("dummyClientID", testArchiveFile, testDirRoot)).to.be.a("string");
      expect(getHosts).to.be.calledOnce;
      expect(askHostMap).to.be.calledWith("dummyClientID", hosts);
      expect(rewriteHosts).to.be.calledOnce;
      expect(rewriteHosts.getCall(0).args[1]).to.deep.equal(hostMap);
      expect(dummyProjectList[0].path).to.equal(path.resolve(testDirRoot, "new_project.wheel"));
    });
  });
});
