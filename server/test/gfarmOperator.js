/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const SshClientWrapper = require("ssh-client-wrapper");
const path = require("path");

//setup test framework
const chai = require("chai");
const expect = chai.expect;
const sinon = require("sinon");
chai.use(require("sinon-chai"));
chai.use(require("chai-fs"));
chai.use(require("chai-json-schema"));
chai.use(require("chai-as-promised"));

const rewire = require("rewire");
const GFO = rewire("../app/core/gfarmOperator.js");

//testee
const checkJWTAgent = GFO.__get__("checkJWTAgent");
const startJWTAgent = GFO.__get__("startJWTAgent");
const stopJWTAgent = GFO.__get__("stopJWTAgent");
const gfcp = GFO.__get__("gfcp");
const gfpcopy = GFO.__get__("gfpcopy");
const gfptarCreate = GFO.__get__("gfptarCreate ");
const gfptarExtract = GFO.__get__("gfptarExtract ");
const gfptarList = GFO.__get__("gfptarList ");
const gfls = GFO.__get__("gfls");
const gfrm = GFO.__get__("gfrm");
const gfmkdir = GFO.__get__("gfmkdir");

function checkEnv() {
  ["WHEEL_GFARMTEST_HOST",
    "WHEEL_GFARMTEST_PASSPHRASE",
    "WHEEL_GFARMTEST_USER",
    "WHEEL_GFARMTEST_ROOT",
    "WHEEL_GFARMTEST_CSGW_ROOT"
  ].some((e)=>{
    if (typeof process.env[e] !== "string" || process.env[e] === "") {
      console.log(`environment variable ${e} must be set`);
      return false;
    }
    return true;
  });
}

describe("UT for gfarmOperator", function () {
  this.timeout(0);
  const host = process.env.WHEEL_GFARMTEST_HOST;
  let JWTServerPassphrase = process.env.WHEEL_GFARMTEST_PASSPHRASE;
  const JWTServerUser = process.env.WHEEL_GFARMTEST_USER;
  const gfarmRoot = process.env.WHEEL_GFARMTEST_ROOT;
  const csgwRoot = process.env.WHEEL_GFARMTEST_CSGW_ROOT;
  let ssh;
  let getSsh;
  const getSshHostinfo = sinon.spy(()=>{
    return {
      JWTServerUser,
      JWTServerURL: "https://elpis.hpci.nii.ac.jp/"
    };
  });
  GFO.__set__("getSshHostinfo", getSshHostinfo);
  const getJWTServerPassphrase = sinon.spy(()=>{
    return JWTServerPassphrase;
  });
  GFO.__set__("getJWTServerPassphrase", getJWTServerPassphrase);
  before(function () {
    if (checkEnv()) {
      this.skip();
    }
    ssh = new SshClientWrapper({ host });
    getSsh = sinon.spy(()=>{
      return ssh;
    });
    GFO.__set__("getSsh", getSsh);
  });
  after(()=>{
    ssh.disconnect();
  });
  beforeEach(async ()=>{
    getSsh.resetHistory();
  });
  describe("checkJWTAgent, startJWTAgent, and stopJWTAgent test are depends on each other, so if one test failes then all three are not success", ()=>{
    describe("#checkJWTAgent", async ()=>{
      it("should return false if jwt-agent is not running", async ()=>{
        await stopJWTAgent(null, "dummyHostID");
        expect(await checkJWTAgent(null, "dummyHostID")).to.be.false;
        expect(getSsh).always.to.be.calledWithMatch(null, "dummyHostID");
      });
      it("should return true if jwt-agent is running", async ()=>{
        await startJWTAgent(null, "dummyHostID");
        expect(await checkJWTAgent(null, "dummyHostID")).to.be.true;
        expect(getSsh).always.to.be.calledWithMatch(null, "dummyHostID");
      });
    });
    describe("#startJWTAgent", async ()=>{
      beforeEach(async ()=>{
        await stopJWTAgent(null, "dummyHostID");
      });
      it("sholud start jwt-agent", async ()=>{
        expect(await checkJWTAgent(null, "dummyHostID")).to.be.false;
        expect(await startJWTAgent(null, "dummyHostID")).to.equal(0);
        expect(await checkJWTAgent(null, "dummyHostID")).to.be.true;
        expect(getSsh).always.to.be.calledWithMatch(null, "dummyHostID");
      });
      it("sholud not start jwt-agent with wrong passphrase", async ()=>{
        const originalJWTPassphrase = JWTServerPassphrase;
        JWTServerPassphrase = "hoge";
        expect(await checkJWTAgent(null, "dummyHostID")).to.be.false;
        expect(await startJWTAgent(null, "dummyHostID")).to.equal(1);
        expect(await checkJWTAgent(null, "dummyHostID")).to.be.false;
        expect(getSsh).always.to.be.calledWithMatch(null, "dummyHostID");
        JWTServerPassphrase = originalJWTPassphrase;
      });
      it("should return false if jwt-agent is already started", async ()=>{
        await startJWTAgent(null, "dummyHostID");
        expect(await startJWTAgent(null, "dummyHostID")).to.be.false;
      });
    });
    describe("#stopJWTAgent", async ()=>{
      before(async ()=>{
        await startJWTAgent(null, "dummyHostID");
      });
      it("should stop jwt-agent and get output", async ()=>{
        const output = await stopJWTAgent(null, "dummyHostID");
        expect(output[output.length - 1]).to.match(/jwt-agent \(pid .*\) stopped/);
      });
      it("should return false if jwt-agent is already stopped", async ()=>{
        await stopJWTAgent(null, "dummyHostID");
        expect(await stopJWTAgent(null, "dummyHostID")).to.be.false;
      });
    });
  });
  describe("actual gfarm file opration test", async ()=>{
    const target = path.join(gfarmRoot, "GFARM_TEST_DIR");
    before(async ()=>{
      if (!await checkJWTAgent(null, "dummyHostID")) {
        await startJWTAgent(null, "dummyHostID");
      }
    });
    beforeEach(async ()=>{
      await gfrm (null, "dummyHostID", target);
      await gfmkdir(null, "dummyHostID", target);
    });
    after(async ()=>{
      await gfrm(null, "dummyHostID", target);
      await stopJWTAgent(null, "dummyHostID");
    });
    describe("gfls, gfrm, and gfmkdir test are depends on each other, so if one test failes then all three are not success", ()=>{
      describe("#gfls", ()=>{
        it("should list gfarm directory contents", async ()=>{
          expect(await gfls(null, "dummyHostID", target)).to.be.an("array").and.empty;
        });
        it("should list gfarm directory contents", async ()=>{
          await gfmkdir(null, "dummyHostID", path.join(target, "foo"));
          const result = await gfls(null, "dummyHostID", target);
          expect(result).to.be.an("array").and.has.lengthOf(1);
          expect(result[0]).to.match(/^drwxr-xr-x .* foo$/);
        });
      });
      describe("#gfmkdir", ()=>{
        it("should create directory", async ()=>{
          await gfmkdir(null, "dummyHostID", path.join(target, "foo"));
          const result = await gfls(null, "dummyHostID", target);
          expect(result).to.be.an("array").and.has.lengthOf(1);
          expect(result[0]).to.match(/^drwxr-xr-x .* foo$/);
        });
        it("should create directory if it already exists", async ()=>{
          await gfmkdir(null, "dummyHostID", path.join(target, "foo"));
          await gfmkdir(null, "dummyHostID", path.join(target, "foo"));
          const result = await gfls(null, "dummyHostID", target);
          expect(result).to.be.an("array").and.has.lengthOf(1);
          expect(result[0]).to.match(/^drwxr-xr-x .* foo$/);
        });
        it("should create directory if parent directory does not exist", async ()=>{
          await gfmkdir(null, "dummyHostID", path.join(target, "foo", "bar", "baz"));
          const result = await gfls(null, "dummyHostID", target);
          expect(result).to.be.an("array").and.has.lengthOf(1);
          expect(result[0]).to.match(/^drwxr-xr-x .* foo$/);
          const result2 = await gfls(null, "dummyHostID", path.join(target, "foo"));
          expect(result2).to.be.an("array").and.has.lengthOf(1);
          expect(result2[0]).to.match(/^drwxr-xr-x .* bar$/);
          const result3 = await gfls(null, "dummyHostID", path.join(target, "foo", "bar"));
          expect(result3).to.be.an("array").and.has.lengthOf(1);
          expect(result3[0]).to.match(/^drwxr-xr-x .* baz$/);
        });
      });
      describe("#gfrm", ()=>{
        beforeEach(async ()=>{
          await gfmkdir(null, "dummyHostID", path.join(target, "foo"));
          const result = await gfls(null, "dummyHostID", target);
          expect(result).to.be.an("array").and.has.lengthOf(1);
          expect(result[0]).to.match(/^drwxr-xr-x .* foo$/);
        });
        it("should remove existing directory", async ()=>{
          await gfrm (null, "dummyHostID", path.join(target, "foo"));
          const result = await gfls(null, "dummyHostID", target);
          expect(result).to.be.an("array").and.empty;
        });
        it("should remove directory recursively", async ()=>{
          await gfmkdir(null, "dummyHostID", path.join(target, "foo", "bar", "baz", "qux"));
          await gfrm (null, "dummyHostID", path.join(target, "foo"));
          const result = await gfls(null, "dummyHostID", target);
          expect(result).to.be.an("array").and.empty;
        });
      });
    });
    describe("copy to or from gfarm storage to csgw", ()=>{
      after(async ()=>{
        await ssh.exec(`rm -fr ${csgwRoot}`);
      });
      describe("#gfcp to gfarm", ()=>{
        beforeEach(async ()=>{
          await ssh.exec(`rm -fr ${csgwRoot};mkdir ${csgwRoot}; cd ${csgwRoot};mkdir -p dir1/dir2/dir3;echo hoge > hoge; echo foo>dir1/foo`);
        });
        it("should copy single file to gfarm", async ()=>{
          expect(await gfcp(null, "dummyHostID", path.join(csgwRoot, "hoge"), path.join(target, "hoge"), true)).to.be.an("array").and.has.lengthOf(3); ;

          const result = await gfls(null, "dummyHostID", path.join(target, "hoge"));
          expect(result).to.be.an("array").and.has.lengthOf(1);
          expect(result[0]).to.match(/^-rw-r--r-- .*hoge$/);
        });
        it("should copy single file to gfarm with renaming", async ()=>{
          expect(await gfcp(null, "dummyHostID", path.join(csgwRoot, "hoge"), path.join(target, "huga"), true)).to.be.an("array").and.has.lengthOf(3);

          const result = await gfls(null, "dummyHostID", path.join(target, "huga"));
          expect(result).to.be.an("array").and.has.lengthOf(1);
          expect(result[0]).to.match(/^-rw-r--r-- .*huga$/);
        });
        it("should copy single file to gfarm even if dstination path exists", async ()=>{
          await gfcp(null, "dummyHostID", path.join(csgwRoot, "hoge"), path.join(target, "hoge"), true);
          expect(await gfcp(null, "dummyHostID", path.join(csgwRoot, "hoge"), path.join(target, "hoge"), true)).to.be.an("array").and.has.lengthOf(3);

          const result = await gfls(null, "dummyHostID", path.join(target, "hoge"));
          expect(result).to.be.an("array").and.has.lengthOf(1);
          expect(result[0]).to.match(/^-rw-r--r-- .*hoge$/);
        });
        it("should throw error while atempting to copy file to existing path on gfarm", ()=>{
          return expect(gfcp(null, "dummyHostID", path.join(csgwRoot, "hoge"), target, true)).to.be.rejectedWith("gfcp -p -f failed");
        });
        it("should throw error while atempting to copy directory to gfarm", ()=>{
          return expect(gfcp(null, "dummyHostID", path.join(csgwRoot, "dir1"), path.join(target, "dir1"), true)).to.be.rejectedWith("gfcp -p -f failed");
        });
      });
      describe("#gfcp from gfarm", ()=>{
        beforeEach(async ()=>{
          await ssh.exec(`rm -fr ${csgwRoot};mkdir ${csgwRoot}; cd ${csgwRoot};mkdir -p dir1/dir2/dir3;echo hoge > hoge; echo foo>dir1/foo`);
          await gfcp(null, "dummHostID", path.join(csgwRoot, "hoge"), path.join(target, "hoge"), true);
          await ssh.exec(`rm -fr ${csgwRoot};mkdir ${csgwRoot}; cd ${csgwRoot};echo hoge > hoge;`);
        });
        it("should copy single file from gfarm", async ()=>{
          expect(await gfcp(null, "dummyHostID", path.join(target, "hoge"), path.join(csgwRoot, "hoge"), false)).to.be.an("array").and.has.lengthOf(3); ;

          const result = await ssh.ls(path.join(csgwRoot, "hoge"), ["-l"]);
          expect(result).to.be.an("array").and.has.lengthOf(1);
          expect(result[0]).to.match(/^-rw-r--r-- .*hoge$/);
        });
        it("should copy single file from gfarm with renaming", async ()=>{
          expect(await gfcp(null, "dummyHostID", path.join(target, "hoge"), path.join(csgwRoot, "huga"), false)).to.be.an("array").and.has.lengthOf(3);

          const result = await ssh.ls(path.join(csgwRoot, "huga"), ["-l"]);
          expect(result).to.be.an("array").and.has.lengthOf(1);
          expect(result[0]).to.match(/^-rw-r--r-- .*huga$/);
        });
        it("should copy single file from gfarm if distination path is existing file", async ()=>{
          await ssh.exec(`touch path.join(csgwRoot, "hoge")`);
          expect(await gfcp(null, "dummyHostID", path.join(target, "hoge"), path.join(csgwRoot, "hoge"), false)).to.be.an("array").and.has.lengthOf(3);

          const result = await ssh.ls(path.join(csgwRoot, "hoge"), ["-l"]);
          expect(result).to.be.an("array").and.has.lengthOf(1);
          expect(result[0]).to.match(/^-rw-r--r-- .*hoge$/);
        });
        it("should throw error while atempting to copy file to existing directory", async ()=>{
          await ssh.exec(`mkdir ${path.join(csgwRoot, "dir1")}`);
          return expect(gfcp(null, "dummyHostID", path.join(target, "hoge"), path.join(csgwRoot, "dir1"), false)).to.be.rejectedWith("gfcp -p -f failed");
        });
        it("should throw error while atempting to copy directory from gfarm", ()=>{
          return expect(gfcp(null, "dummyHostID", path.join(target, "dir1"), path.join(csgwRoot, "dir1"), false)).to.be.rejectedWith("gfcp -p -f failed");
        });
      });
      describe("#gfpcopy to gfarm", ()=>{
        beforeEach(async ()=>{
          await ssh.exec(`rm -fr ${csgwRoot};mkdir ${csgwRoot}; cd ${csgwRoot};mkdir -p dir1/dir2/dir3;echo hoge > hoge; echo foo>dir1/foo`);
        });
        it("should throw while attempting to copy single file to gfarm", async ()=>{
          return expect(gfpcopy(null, "dummyHostID", path.join(csgwRoot, "hoge"), target, true)).to.be.rejectedWith(/cd .*gfpcopy -p -v -f.*: Not a directory/);
        });
        it("should copy directory tree to gfarm", async ()=>{
          const result = await gfpcopy(null, "dummyHostID", path.join(csgwRoot, "dir1"), target, true);
          expect(result).to.be.an("array").and.has.lengthOf(14); ;
          expect(result).to.include("all_entries_num: 3");
          expect(result).to.include("copied_file_num: 1");
        });
        it("should copy diretory even if destination path is not exist", async ()=>{
          const result = await gfpcopy(null, "dummyHostID", path.join(csgwRoot, "dir1"), path.join(target, "hoge"), true);
          expect(result).to.be.an("array").and.has.lengthOf(14); ;
          expect(result).to.include("all_entries_num: 3");
          expect(result).to.include("copied_file_num: 1");
        });
        it("should throw error if destination path is existing file", async ()=>{
          expect(await gfcp(null, "dummyHostID", path.join(csgwRoot, "hoge"), path.join(target, "hoge"), true)).to.be.an("array").and.has.lengthOf(3);

          const result = await gfls(null, "dummyHostID", path.join(target, "hoge"));
          expect(result).to.be.an("array").and.has.lengthOf(1);
          expect(result[0]).to.match(/^-rw-r--r-- .*hoge$/);
          return expect(gfpcopy(null, "dummyHostID", path.join(csgwRoot, "hoge"), path.join(target, "hoge"), true)).to.be.rejectedWith(/cd .* gfpcopy -p -v -f.*: Not a directory/);
        });
      });
      describe("#gfpcopy from gfarm", ()=>{
        beforeEach(async ()=>{
          await ssh.exec(`rm -fr ${csgwRoot};mkdir ${csgwRoot}; cd ${csgwRoot};mkdir -p dir1/dir2/dir3;echo hoge > hoge; echo foo>dir1/foo`);
          await gfpcopy(null, "dummHostID", path.join(csgwRoot, "dir1"), target, true);
          await gfcp(null, "dummHostID", path.join(csgwRoot, "hoge"), path.join(target, "hoge"), true);
          await ssh.exec(`rm -fr ${csgwRoot};mkdir ${csgwRoot}; cd ${csgwRoot};echo hoge > hoge;`);
        });
        it("should copy single file from gfarm", async ()=>{
          const output = await gfpcopy(null, "dummHostID", path.join(target, "hoge"), path.join(csgwRoot), false);
          expect(output).to.be.an("array").and.has.lengthOf(8);
          expect(output).to.include("copied_file_num: 1");

          const result = await ssh.ls(path.join(csgwRoot, "hoge"), ["-l"]);
          expect(result).to.be.an("array").and.has.lengthOf(1);
          expect(result[0]).to.match(/^-rw-r--r-- .*hoge$/);
        });
        it("should copy directory tree from gfarm", async ()=>{
          const output = await gfpcopy(null, "dummyHostID", path.join(target, "dir1"), csgwRoot, false);
          expect(output).to.be.an("array").and.has.lengthOf(14); ;
          expect(output).to.include("all_entries_num: 3");
          expect(output).to.include("copied_file_num: 1");

          const result = await ssh.ls(path.join(csgwRoot, "hoge"), ["-l"]);
          expect(result).to.be.an("array").and.has.lengthOf(1);
          expect(result[0]).to.match(/^-rw-r--r-- .*hoge$/);
        });
        it("should throw error if destination path is not exist", ()=>{
          return expect(gfpcopy(null, "dummHostID", path.join(target, "hoge"), path.join(csgwRoot, "huga"), false)).to.be.rejectedWith(/gfpcopy -p -v -f failed: ERROR: file:.*: no such file or directory/);
        });
        it("should throw error if destination path is existing file", async ()=>{
          await ssh.exec("cd ${csgwRoot};echo hoge > hoge ");
          return expect(gfpcopy(null, "dummHostID", path.join(target, "hoge"), path.join(csgwRoot, "hoge"), false)).to.be.rejectedWith(/gfpcopy -p -v -f failed: ERROR: file:.*: not a directory/);
        });
      });
      describe("#gfptarCreate", ()=>{
        beforeEach(async ()=>{
          await ssh.exec(`rm -fr ${csgwRoot};mkdir ${csgwRoot}; cd ${csgwRoot};mkdir -p dir1/dir2/dir3;echo hoge > hoge; echo foo>dir1/foo`);
        });
        it("should create archive files on gfarm", async ()=>{
          const output = await gfptarCreate(null, "dummHostID", csgwRoot, path.join(target, "hoge"));
          expect(output).to.be.an("array").and.has.lengthOf(12);
        });
      });
      describe("#gfptarExtract", ()=>{
        beforeEach(async ()=>{
          await ssh.exec(`rm -fr ${csgwRoot};mkdir ${csgwRoot}; cd ${csgwRoot};mkdir -p dir1/dir2/dir3;echo hoge > hoge; echo foo>dir1/foo`);
          await gfptarCreate(null, "dummHostID", csgwRoot, path.join(target, "hoge"));
          await ssh.exec(`rm -fr ${csgwRoot}`);
        });
        it("should extract archive file on gfarm", async ()=>{
          const output = await gfptarExtract(null, "dummHostID", path.join(target, "hoge"), csgwRoot);
          expect(output).to.be.an("array").and.has.length(13);
          expect(output.join("\n")).to.match(/^DONE:.*\.tar\.gz/m);
          const result = await ssh.ls(path.join(csgwRoot), ["-l"]);
          expect(result).to.be.an("array").and.has.length(3);
        });
      });
      describe("#gfptarList", ()=>{
        beforeEach(async ()=>{
          await ssh.exec(`rm -fr ${csgwRoot};mkdir ${csgwRoot}; cd ${csgwRoot};mkdir -p dir1/dir2/dir3;echo hoge > hoge; echo foo>dir1/foo`);
          await gfptarCreate(null, "dummHostID", csgwRoot, path.join(target, "hoge"));
          await ssh.exec(`rm -fr ${csgwRoot}`);
        });
        it("should show contents in archive", async ()=>{
          const output = await gfptarList(null, "dummHostID", path.join(target, "hoge"));
          expect(output).to.be.an("array").and.has.length(5);
        });
      });
    });
  });
});
