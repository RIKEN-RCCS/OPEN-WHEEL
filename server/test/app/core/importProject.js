/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
//eslint-disable-next-line camelcase
import { exec as exec_cb } from "node:child_process";
const exec = promisify(exec_cb);
import fs from "fs-extra";

//setup test framework
import * as chai from "chai";
const expect = chai.expect;
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
import sinonChai from "sinon-chai";
chai.use(sinonChai);
import sinon from "sinon";

//testee
import { isEmptyDir, extractAndReadArchiveMetadata, importProject, _internal } from "../../../app/core/importProject.js";

//test data
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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
    let getHostsStub;
    let askHostMapStub;
    let rewriteHostsStub;
    beforeEach(async ()=>{
      getHostsStub = sinon.stub(_internal, "getHosts");
      askHostMapStub = sinon.stub(_internal, "askHostMap");
      rewriteHostsStub = sinon.stub(_internal, "rewriteHosts");
      await exec(`cp ${testArchiveFile} ${testArchiveFile}.bak`);
    });
    afterEach(async ()=>{
      sinon.restore();
      await exec(`mv ${testArchiveFile}.bak ${testArchiveFile}`);
    });
    it("should import project and add it to projectList", async ()=>{
      getHostsStub.onCall(0).returns([]);
      expect(await importProject("dummyClientID", testArchiveFile, testDirRoot)).to.be.a("string");
      expect(getHostsStub).to.be.calledOnce;
      expect(askHostMapStub).not.to.be.called;
      expect(rewriteHostsStub).not.to.be.called;
      expect(_internal.projectList.data[0].path).to.equal(path.resolve(testDirRoot, "new_project.wheel"));
    });
    it("should import project and add it to projectList with host modification", async ()=>{
      const hosts = ["hoge"];
      const hostMap = { hoge: "huga" };
      getHostsStub.onCall(0).returns(hosts);
      askHostMapStub.onCall(0).returns(hostMap);
      expect(await importProject("dummyClientID", testArchiveFile, testDirRoot)).to.be.a("string");
      expect(getHostsStub).to.be.calledOnce;
      expect(askHostMapStub).to.be.calledWith("dummyClientID", hosts);
      expect(rewriteHostsStub).to.be.calledOnce;
      expect(rewriteHostsStub.getCall(0).args[1]).to.deep.equal(hostMap);
      expect(_internal.projectList.data[0].path).to.equal(path.resolve(testDirRoot, "new_project.wheel"));
    });
  });
});
