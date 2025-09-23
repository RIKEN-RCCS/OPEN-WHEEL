/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const rewire = require("rewire");
const sinon = require("sinon");
const fs = require("fs-extra");
const path = require("path");

const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-fs"));
chai.use(require("chai-as-promised"));

describe("gitOperator2", ()=>{
  describe("#gitPromise", ()=>{
    let gitPromise;
    let spawnStub;
    let getLoggerStub;
    let traceStub;

    beforeEach(()=>{
      const gitOperator2 = rewire("../../../app/core/gitOperator2.js");
      gitPromise = gitOperator2.__get__("gitPromise");
      spawnStub = sinon.stub();
      getLoggerStub = sinon.stub();
      traceStub = sinon.stub();
      getLoggerStub.returns({ trace: traceStub });
      gitOperator2.__set__({
        spawn: spawnStub,
        getLogger: getLoggerStub
      });
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should cal git command", async ()=>{
      const cwd = "/repo/src";
      const args = ["diff"];
      const rootDir = "/repo";
      const cp = { stdout: { on: (event, handler)=>{
        handler("stdout");
      } }, stderr: { on: (event, handler)=>{
        handler("stderr");
      } }, on: (event, handler)=>{
        if (event === "exit") {
          handler(0);
        }
      } };
      spawnStub.returns(cp);
      await gitPromise(cwd, args, rootDir);
      expect(spawnStub.calledOnce).to.be.true;
      expect(spawnStub.calledWith("git", args, sinon.match({ cwd: cwd, env: process.env, shell: true }))).to.be.true;
    });

    it("should log stdout and stderr", async ()=>{
      const cwd = "/repo/src";
      const args = ["diff"];
      const rootDir = "/repo";
      const cp = { stdout: { on: (event, handler)=>{
        handler("stdout");
      } }, stderr: { on: (event, handler)=>{
        handler("stderr");
      } }, on: (event, handler)=>{
        if (event === "exit") {
          handler(0);
        }
      } };
      spawnStub.returns(cp);
      await gitPromise(cwd, args, rootDir);
      expect(traceStub.calledWith("stdout")).to.be.true;
      expect(traceStub.calledWith("stderr")).to.be.true;
    });

    it("should reject with an error if spawn fails", async ()=>{
      const cwd = "/repo/src";
      const args = ["diff"];
      const rootDir = "/repo";
      const cp = { stdout: { on: (event, handler)=>{
        handler("stdout");
      } }, stderr: { on: (event, handler)=>{
        handler("stderr");
      } }, on: (event, handler)=>{
        if (event === "error") {
          handler("error");
        }
      } };
      spawnStub.returns(cp);
      const promise = gitPromise(cwd, args, rootDir);
      await promise.then(()=>{
        expect.fail();
      }).catch((err)=>{
        expect(err).to.be.an("error");
        expect(err.message).to.equal("error");
        expect(err.output).to.equal("stdoutstderr");
        expect(err.cwd).to.equal(cwd);
        expect(err.abs_cwd).to.equal(path.resolve(cwd));
        expect(err.args).to.deep.equal(args);
      });
    });

    it("should reject with an error if return code is not 0", async ()=>{
      const cwd = "/repo/src";
      const args = ["diff"];
      const rootDir = "/repo";
      const cp = { stdout: { on: (event, handler)=>{
        handler("stdout");
      } }, stderr: { on: (event, handler)=>{
        handler("stderr");
      } }, on: (event, handler)=>{
        if (event === "exit") {
          handler(1);
        }
      } };
      spawnStub.returns(cp);
      const promise = gitPromise(cwd, args, rootDir);
      await promise.then(()=>{
        expect.fail();
      }).catch((err)=>{
        expect(err).to.be.an("error");
        expect(err.message).to.equal("stdoutstderr");
        expect(err.cwd).to.equal(cwd);
        expect(err.abs_cwd).to.equal(path.resolve(cwd));
        expect(err.args).to.deep.equal(args);
      });
    });

    it("should resolve with output if return code is 0", async ()=>{
      const cwd = "/repo/src";
      const args = ["diff"];
      const rootDir = "/repo";
      const cp = { stdout: { on: (event, handler)=>{
        handler("stdout");
      } }, stderr: { on: (event, handler)=>{
        handler("stderr");
      } }, on: (event, handler)=>{
        if (event === "exit") {
          handler(0);
        }
      } };
      spawnStub.returns(cp);
      const result = await gitPromise(cwd, args, rootDir);
      expect(result).to.equal("stdoutstderr");
    });
  });

  describe("#gitSetup", ()=>{
    let gitOperator2;
    let gitSetup;
    const rootDir = "/repo";
    const user = "testuser";
    const mail = "testuser@example.com";
    let outputFileStub;
    let appendFileStub;
    let gitAddStub;
    let gitCommitStub;
    let gitPromiseStub;
    let readFileStub;

    beforeEach(()=>{
      gitOperator2 = rewire("../../../app/core/gitOperator2.js");
      gitSetup = gitOperator2.__get__("gitSetup");
      outputFileStub = sinon.stub(fs, "outputFile").resolves();
      appendFileStub = sinon.stub(fs, "appendFile").resolves();
      gitPromiseStub = sinon.stub();
      readFileStub = sinon.stub();
      gitAddStub = sinon.stub();
      gitCommitStub = sinon.stub();
      gitOperator2.__set__("gitAdd", gitAddStub);
      gitOperator2.__set__("gitCommit", gitCommitStub);
      gitOperator2.__set__("gitPromise", gitPromiseStub);
      gitOperator2.__set__("readFile", readFileStub);
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should set commiter name, email and setup lfs, create .gitignore", async ()=>{
      const err = new Error("dummy error object");
      err.rt = 1;
      err.code = "ENOENT";
      gitPromiseStub.onCall(0).rejects(err);
      gitPromiseStub.onCall(2).rejects(err);
      readFileStub.rejects(err);

      await gitSetup(rootDir, user, mail);
      expect(gitPromiseStub).to.have.callCount(5);
      expect(gitPromiseStub.getCall(0)).to.be.calledWithExactly(rootDir, ["config", "--get", "user.name"], rootDir);
      expect(gitPromiseStub.getCall(1)).to.be.calledWithExactly(rootDir, ["config", "user.name", user], rootDir);
      expect(gitPromiseStub.getCall(2)).to.be.calledWithExactly(rootDir, ["config", "--get", "user.email"], rootDir);
      expect(gitPromiseStub.getCall(3)).to.be.calledWithExactly(rootDir, ["config", "user.email", mail], rootDir);
      expect(gitPromiseStub.getCall(4)).to.be.calledWithExactly(rootDir, ["lfs", "install"], rootDir);

      expect(outputFileStub).to.be.calledOnceWithExactly(path.join(rootDir, ".gitignore"), "\nwheel.log\n");
      expect(appendFileStub).not.to.be.called;

      expect(gitAddStub).calledOnceWithExactly(rootDir, ".gitignore");
      expect(gitCommitStub).calledOnceWithExactly(rootDir, "initial commit");
    });
    it("should setup lfs and create .gitignore", async ()=>{
      const err = new Error("dummy error object");
      err.code = "ENOENT";
      readFileStub.rejects(err);
      await gitSetup(rootDir, user, mail);
      expect(gitPromiseStub).to.have.callCount(3);
      expect(gitPromiseStub.getCall(0)).to.be.calledWithExactly(rootDir, ["config", "--get", "user.name"], rootDir);
      expect(gitPromiseStub.getCall(1)).to.be.calledWithExactly(rootDir, ["config", "--get", "user.email"], rootDir);
      expect(gitPromiseStub.getCall(2)).to.be.calledWithExactly(rootDir, ["lfs", "install"], rootDir);

      expect(outputFileStub).to.be.calledOnceWithExactly(path.join(rootDir, ".gitignore"), "\nwheel.log\n");
      expect(appendFileStub).not.to.be.called;

      expect(gitAddStub).calledOnceWithExactly(rootDir, ".gitignore");
      expect(gitCommitStub).calledOnceWithExactly(rootDir, "initial commit");
    });
    it("should use appendFile if .gitignore already exists and do not have .wheel", async ()=>{
      readFileStub.resolves("hoge");
      await gitSetup(rootDir, user, mail);
      expect(gitPromiseStub).to.have.callCount(3);
      expect(gitPromiseStub.getCall(0)).to.be.calledWithExactly(rootDir, ["config", "--get", "user.name"], rootDir);
      expect(gitPromiseStub.getCall(1)).to.be.calledWithExactly(rootDir, ["config", "--get", "user.email"], rootDir);
      expect(gitPromiseStub.getCall(2)).to.be.calledWithExactly(rootDir, ["lfs", "install"], rootDir);

      expect(appendFileStub).to.be.calledOnceWithExactly(path.join(rootDir, ".gitignore"), "\nwheel.log\n");
      expect(outputFileStub).not.to.be.called;

      expect(gitAddStub).calledOnceWithExactly(rootDir, ".gitignore");
      expect(gitCommitStub).calledOnceWithExactly(rootDir, "initial commit");
    });
    it("should not commit if the repo is already set up", async ()=>{
      readFileStub.resolves("wheel.log");
      await gitSetup(rootDir, user, mail);
      expect(gitPromiseStub).to.have.callCount(3);
      expect(gitPromiseStub.getCall(0)).to.be.calledWithExactly(rootDir, ["config", "--get", "user.name"], rootDir);
      expect(gitPromiseStub.getCall(1)).to.be.calledWithExactly(rootDir, ["config", "--get", "user.email"], rootDir);
      expect(gitPromiseStub.getCall(2)).to.be.calledWithExactly(rootDir, ["lfs", "install"], rootDir);

      expect(appendFileStub).not.to.be.called;
      expect(outputFileStub).not.to.be.called;

      expect(gitAddStub).not.to.be.called;
      expect(gitCommitStub).not.to.be.called;
    });
  });

  describe("#gitInit", ()=>{
    let gitOperator2;
    let gitInit;
    let gitPromiseStub;
    let gitSetupStub;

    const rootDir = "/repo";
    const user = "testuser";
    const mail = "testuser@example.com";

    beforeEach(()=>{
      gitOperator2 = rewire("../../../app/core/gitOperator2.js");
      gitInit = gitOperator2.__get__("gitInit");
      gitPromiseStub = sinon.stub();
      gitSetupStub = sinon.stub();
      gitOperator2.__set__("gitPromise", gitPromiseStub);
      gitOperator2.__set__("gitSetup", gitSetupStub);
      sinon.stub(fs, "ensureDir").resolves();
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should return an error if user is not a string", async ()=>{
      const result = await gitInit(rootDir, 123, mail);
      expect(result).to.be.an("error");
      expect(result.user).to.equal(123);
      expect(result.type).to.equal("number");
      expect(result.message).to.equal("user must be a string");
    });

    it("should return an error if mail is not a string", async ()=>{
      const result = await gitInit(rootDir, user, 123);
      expect(result).to.be.an("error");
      expect(result.mail).to.equal(123);
      expect(result.type).to.equal("number");
      expect(result.message).to.equal("mail must be a string");
    });

    it("should initialize git repository and set user config", async ()=>{
      gitPromiseStub.resolves();

      await gitInit(rootDir, user, mail);
      sinon.assert.calledWith(
        gitPromiseStub,
        sinon.match.string,
        ["init", "--", sinon.match.string],
        rootDir
      );
      expect(gitSetupStub).to.be.calledWith(rootDir, user, mail);
    });
  });

  describe("#gitCommit", ()=>{
    let gitOperator2;
    let gitCommit;
    let gitPromiseStub;

    const rootDir = "/repo";
    const defaultMessage = "save project";

    beforeEach(()=>{
      gitOperator2 = rewire("../../../app/core/gitOperator2.js");
      gitCommit = gitOperator2.__get__("gitCommit");
      gitPromiseStub = sinon.stub();
      gitOperator2.__set__("gitPromise", gitPromiseStub);
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should call gitPromise with correct arguments when message and additionalOption are provided", async ()=>{
      gitPromiseStub.resolves();
      const message = "Initial commit";
      const additionalOption = ["--signoff"];

      await gitCommit(rootDir, message, additionalOption);

      sinon.assert.calledWith(
        gitPromiseStub,
        rootDir,
        ["commit", "-m", `"${message}"`, "--signoff"],
        rootDir
      );
    });

    it("should call gitPromise with default message when no message is provided", async ()=>{
      gitPromiseStub.resolves();

      await gitCommit(rootDir);

      sinon.assert.calledWith(
        gitPromiseStub,
        rootDir,
        ["commit", "-m", `"${defaultMessage}"`],
        rootDir
      );
    });

    it("should handle 'no changes to commit' error and not throw", async ()=>{
      const error = new Error("nothing to commit, working tree clean");
      gitPromiseStub.rejects(error);

      await expect(gitCommit(rootDir)).to.be.fulfilled;
    });

    it("should throw error if gitPromise fails with another error", async ()=>{
      const errorMessage = "some other error";
      gitPromiseStub.rejects(new Error(errorMessage));

      await expect(gitCommit(rootDir)).to.be.rejectedWith(Error, errorMessage);
    });

    it("should handle 'no changes added to commit' error and not throw", async ()=>{
      const error = new Error("no changes added to commit");
      gitPromiseStub.rejects(error);

      await expect(gitCommit(rootDir)).to.be.fulfilled;
    });

    it("should handle 'nothing to commit' error and not throw", async ()=>{
      const error = new Error("nothing to commit");
      gitPromiseStub.rejects(error);

      await expect(gitCommit(rootDir)).to.be.fulfilled;
    });
  });

  describe("#gitAdd", ()=>{
    let gitOperator2;
    let gitAdd;
    let promisifiedGitStub;

    const rootDir = "/repo";
    const filename = "file.txt";

    beforeEach(()=>{
      gitOperator2 = rewire("../../../app/core/gitOperator2.js");
      gitAdd = gitOperator2.__get__("gitAdd");
      promisifiedGitStub = sinon.stub();
      gitOperator2.__set__("promisifiedGit", promisifiedGitStub);
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should call gitPromise with correct arguments (without -u)", async ()=>{
      promisifiedGitStub.resolves();

      await gitAdd(rootDir, filename, false);

      sinon.assert.calledWith(
        promisifiedGitStub,
        rootDir,
        ["add", "--", filename],
        rootDir
      );
    });

    it("should call gitPromise with correct arguments (with -u)", async ()=>{
      promisifiedGitStub.resolves();

      await gitAdd(rootDir, filename, true);

      sinon.assert.calledWith(
        promisifiedGitStub,
        rootDir,
        ["add", "-u", "--", filename],
        rootDir
      );
    });

    it("should handle index.lock error and not throw", async function () {
      this.timeout(5000);
      const error = new Error(
        "fatal: Unable to create '/repo/.git/index.lock': File exists"
      );
      promisifiedGitStub.onCall(0).rejects(error);
      promisifiedGitStub.onCall(1).rejects(error);
      promisifiedGitStub.onCall(2).rejects(error);
      promisifiedGitStub.onCall(3).rejects(error);
      promisifiedGitStub.onCall(4).rejects(error);
      promisifiedGitStub.onCall(5).resolves(undefined);

      await expect(gitAdd(rootDir, filename, false)).to.be.fulfilled;
    });
    it("should handle index.lock error but throw after 6th fail", async function () {
      this.timeout(5000);
      const error = new Error(
        "fatal: Unable to create '/repo/.git/index.lock': File exists"
      );
      promisifiedGitStub.onCall(0).rejects(error);
      promisifiedGitStub.onCall(1).rejects(error);
      promisifiedGitStub.onCall(2).rejects(error);
      promisifiedGitStub.onCall(3).rejects(error);
      promisifiedGitStub.onCall(4).rejects(error);
      promisifiedGitStub.onCall(5).rejects(error);

      return expect(gitAdd(rootDir, filename, false)).to.be.rejected;
    });

    it("should throw error if gitPromise fails with another error", async ()=>{
      const error = new Error("some other error");
      promisifiedGitStub.rejects(error);

      await expect(gitAdd(rootDir, filename, false)).to.be.rejectedWith(
        Error,
        "some other error"
      );
    });
  });

  describe("#gitRm", ()=>{
    let gitOperator2;
    let gitRm;
    let gitPromiseStub;

    const rootDir = "/repo";
    const filename = "file.txt";

    beforeEach(()=>{
      gitOperator2 = rewire("../../../app/core/gitOperator2.js");
      gitRm = gitOperator2.__get__("gitRm");
      gitPromiseStub = sinon.stub();
      gitOperator2.__set__("gitPromise", gitPromiseStub);
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should call gitPromise with correct arguments", async ()=>{
      gitPromiseStub.resolves();
      await gitRm(rootDir, filename);

      sinon.assert.calledWith(
        gitPromiseStub,
        rootDir,
        ["rm", "-r", "--cached", "--", filename],
        rootDir
      );
    });

    it("should not throw error if gitPromise fails with fatal error related to pathspec", async ()=>{
      const error = new Error(
        "fatal: pathspec 'file.txt' did not match any files"
      );
      gitPromiseStub.rejects(error);

      await expect(gitRm(rootDir, filename)).to.be.fulfilled;
    });

    it("should throw error if gitPromise fails with another error", async ()=>{
      const error = new Error("some other error");
      gitPromiseStub.rejects(error);

      await expect(gitRm(rootDir, filename)).to.be.rejectedWith(
        Error,
        "some other error"
      );
    });
  });

  describe("#gitResetHEAD", ()=>{
    let gitOperator2;
    let gitResetHEAD;
    let gitPromiseStub;

    const rootDir = "/repo";

    beforeEach(()=>{
      gitOperator2 = rewire("../../../app/core/gitOperator2.js");
      gitResetHEAD = gitOperator2.__get__("gitResetHEAD");
      gitPromiseStub = sinon.stub();
      gitOperator2.__set__("gitPromise", gitPromiseStub);
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should call gitPromise with reset HEAD --hard when filePatterns is empty", async ()=>{
      gitPromiseStub.resolves();

      await gitResetHEAD(rootDir, "");

      sinon.assert.calledWith(
        gitPromiseStub,
        rootDir,
        ["reset", "HEAD", "--hard"],
        rootDir
      );
    });

    it("should call gitPromise with reset HEAD -- <filePatterns> and then checkout HEAD -- <filePatterns>", async ()=>{
      gitPromiseStub.resolves();
      const filePatterns = "test.txt";

      await gitResetHEAD(rootDir, filePatterns);

      sinon.assert.calledWith(
        gitPromiseStub,
        rootDir,
        ["reset", "HEAD", "--", filePatterns],
        rootDir
      );
      sinon.assert.calledWith(
        gitPromiseStub,
        rootDir,
        ["checkout", "HEAD", "--", filePatterns],
        rootDir
      );
    });

    it("should throw an error if gitPromise fails", async ()=>{
      const errorMessage = "reset error";
      gitPromiseStub.rejects(new Error(errorMessage));

      await expect(gitResetHEAD(rootDir, "test.txt")).to.be.rejectedWith(
        Error,
        errorMessage
      );
    });
  });

  describe("#gitStatus", ()=>{
    let gitOperator2;
    let gitStatus;
    let gitPromiseStub;

    const rootDir = "/repo";

    beforeEach(()=>{
      gitOperator2 = rewire("../../../app/core/gitOperator2.js");
      gitStatus = gitOperator2.__get__("gitStatus");
      gitPromiseStub = sinon.stub();
      gitOperator2.__set__("gitPromise", gitPromiseStub);
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should call gitStatus with correct arguments without pathspec", async ()=>{
      gitPromiseStub.resolves("");
      await gitStatus(rootDir);

      sinon.assert.calledWith(
        gitPromiseStub,
        rootDir,
        ["status", "--short"],
        rootDir
      );
    });
    it("should call gitStatus with correct arguments with pathspec", async ()=>{
      gitPromiseStub.resolves("");
      await gitStatus(rootDir, "/tmp");

      sinon.assert.calledWith(
        gitPromiseStub,
        rootDir,
        ["status", "--short", "/tmp"],
        rootDir
      );
    });

    it("should correctly parse added files", async function () {
      gitPromiseStub.resolves("A  addedFile.txt");
      const result = await gitStatus(rootDir);
      expect(result.added).to.deep.equal(["addedFile.txt"]);
    });

    it("should correctly parse modified files", async function () {
      gitPromiseStub.resolves("M  modifiedFile.txt");
      const result = await gitStatus(rootDir);
      expect(result.modified).to.deep.equal(["modifiedFile.txt"]);
    });

    it("should correctly parse deleted files", async function () {
      gitPromiseStub.resolves("D  deletedFile.txt");
      const result = await gitStatus(rootDir);
      expect(result.deleted).to.deep.equal(["deletedFile.txt"]);
    });

    it("should correctly parse renamed files", async function () {
      gitPromiseStub.resolves("R  oldName.txt -> newName.txt");
      const result = await gitStatus(rootDir);
      expect(result.renamed).to.deep.equal(["newName.txt"]);
    });

    it("should correctly parse untracked files", async function () {
      gitPromiseStub.resolves("?? untrackedFile.txt");
      const result = await gitStatus(rootDir);
      expect(result.untracked).to.deep.equal(["untrackedFile.txt"]);
    });

    it("should return empty arrays for clean status", async function () {
      gitPromiseStub.resolves("");
      const result = await gitStatus(rootDir);
      expect(result).to.deep.equal({
        added: [],
        modified: [],
        deleted: [],
        renamed: [],
        untracked: []
      });
    });

    it("should throw an error for unknown git status output", async function () {
      gitPromiseStub.resolves("X  unknownFile.txt");
      await expect(gitStatus(rootDir)).to.be.rejectedWith(
        "unkonw output from git status --short"
      );
    });
  });

  describe("#gitClean", ()=>{
    let gitOperator2;
    let gitClean;
    let gitPromiseStub;

    const rootDir = "/repo";

    beforeEach(()=>{
      gitOperator2 = rewire("../../../app/core/gitOperator2.js");
      gitClean = gitOperator2.__get__("gitClean");
      gitPromiseStub = sinon.stub();
      gitOperator2.__set__("gitPromise", gitPromiseStub);
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should call gitPromise with correct arguments when filePatterns is provided", async ()=>{
      gitPromiseStub.resolves();
      const filePatterns = "*.log";

      await gitClean(rootDir, filePatterns);

      sinon.assert.calledWith(
        gitPromiseStub,
        rootDir,
        ["clean", "-df", "-e wheel.log", "--", filePatterns],
        rootDir
      );
    });

    it("should call gitPromise with correct arguments when filePatterns is empty", async ()=>{
      gitPromiseStub.resolves();

      await gitClean(rootDir);

      sinon.assert.calledWith(
        gitPromiseStub,
        rootDir,
        ["clean", "-df", "-e wheel.log"],
        rootDir
      );
    });

    it("should throw an error if gitPromise fails", async ()=>{
      const errorMessage = "git clean failed";
      gitPromiseStub.rejects(new Error(errorMessage));

      await expect(gitClean(rootDir)).to.be.rejectedWith(Error, errorMessage);
    });
  });

  describe("#getRelativeFilename", ()=>{
    let gitOperator2;
    let getRelativeFilename;

    const rootDir = "/repo";

    beforeEach(()=>{
      gitOperator2 = rewire("../../../app/core/gitOperator2.js");
      getRelativeFilename = gitOperator2.__get__("getRelativeFilename");
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should return the relative path of a file inside the repo", ()=>{
      const filename = "src/index.js";
      const result = getRelativeFilename(rootDir, filename);
      expect(result).to.equal("src/index.js");
    });

    it("should resolve an absolute path to a relative path", ()=>{
      const filename = "/repo/src/index.js";
      const result = getRelativeFilename(rootDir, filename);
      expect(result).to.equal("src/index.js");
    });

    it("should return an empty string if the file is at repository root", ()=>{
      const filename = "/repo";
      const result = getRelativeFilename(rootDir, filename);
      expect(result).to.equal("");
    });

    it("should handle files outside of the repo", ()=>{
      const filename = "/other_dir/file.js";
      const result = getRelativeFilename(rootDir, filename);
      expect(result).to.equal("../other_dir/file.js");
    });
  });

  describe("#getUnsavedFiles", ()=>{
    let gitOperator2;
    let getUnsavedFiles;
    let gitStatusStub;

    const rootDir = "/repo";

    beforeEach(()=>{
      gitOperator2 = rewire("../../../app/core/gitOperator2.js");
      getUnsavedFiles = gitOperator2.__get__("getUnsavedFiles");
      gitStatusStub = sinon.stub();
      gitOperator2.__set__("gitStatus", gitStatusStub);
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should return unsaved files correctly", async function () {
      gitStatusStub.resolves({
        added: ["newFile.txt"],
        modified: ["modifiedFile.txt"],
        deleted: ["deletedFile.txt"],
        renamed: ["renamedFile.txt"],
        untracked: []
      });
      const result = await getUnsavedFiles(rootDir);
      expect(result).to.deep.equal([
        { status: "new", name: "newFile.txt" },
        { status: "modified", name: "modifiedFile.txt" },
        { status: "deleted", name: "deletedFile.txt" },
        { status: "renamed", name: "renamedFile.txt" }
      ]);
    });

    it("should return an empty array when no unsaved files exist", async function () {
      gitStatusStub.resolves({
        added: [],
        modified: [],
        deleted: [],
        renamed: [],
        untracked: []
      });
      const result = await getUnsavedFiles(rootDir);
      expect(result).to.deep.equal([]);
    });

    it("should call gitStatus with correct arguments", async ()=>{
      gitStatusStub.resolves({
        added: [],
        modified: [],
        deleted: [],
        renamed: [],
        untracked: []
      });

      await getUnsavedFiles(rootDir);

      sinon.assert.calledWith(gitStatusStub, rootDir);
    });
  });

  describe("#makeLFSPattern", ()=>{
    let gitOperator2;
    let makeLFSPattern;
    let getRelativeFilenameStub;

    const rootDir = "/repo";

    beforeEach(()=>{
      gitOperator2 = rewire("../../../app/core/gitOperator2.js");
      makeLFSPattern = gitOperator2.__get__("makeLFSPattern");
      getRelativeFilenameStub = sinon.stub();
      gitOperator2.__set__("getRelativeFilename", getRelativeFilenameStub);
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should return a valid LFS pattern for a given file", ()=>{
      const filename = "src/index.js";
      getRelativeFilenameStub.withArgs(rootDir, filename).returns("src/index.js");

      const result = makeLFSPattern(rootDir, filename);
      expect(result).to.equal("/src/index.js");
    });

    it("should return a valid LFS pattern for a file at the root", ()=>{
      const filename = "index.js";
      getRelativeFilenameStub.withArgs(rootDir, filename).returns("index.js");

      const result = makeLFSPattern(rootDir, filename);
      expect(result).to.equal("/index.js");
    });

    it("should return a valid LFS pattern for a file outside the repo", ()=>{
      const filename = "/other_dir/file.js";
      getRelativeFilenameStub
        .withArgs(rootDir, filename)
        .returns("../other_dir/file.js");

      const result = makeLFSPattern(rootDir, filename);
      expect(result).to.equal("/../other_dir/file.js");
    });
  });

  describe("#isLFS", ()=>{
    let gitOperator2;
    let isLFS;
    let getRelativeFilenameStub;
    let gitPromiseStub;

    const rootDir = "/repo";

    beforeEach(()=>{
      gitOperator2 = rewire("../../../app/core/gitOperator2.js");
      isLFS = gitOperator2.__get__("isLFS");
      getRelativeFilenameStub = sinon.stub();
      gitOperator2.__set__("getRelativeFilename", getRelativeFilenameStub);
      gitPromiseStub = sinon.stub();
      gitOperator2.__set__("gitPromise", gitPromiseStub);
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should return true if the file is tracked by LFS", async ()=>{
      const filename = "src/image.png";
      getRelativeFilenameStub
        .withArgs(rootDir, filename)
        .returns("src/image.png");
      gitPromiseStub.resolves(
        "Listing tracked patterns\nsrc/image.png (.gitattributes)\nListing excluded patterns"
      );

      const result = await isLFS(rootDir, filename);
      expect(result).to.be.true;
    });

    it("should return false if the file is not tracked by LFS", async ()=>{
      const filename = "src/text.txt";
      getRelativeFilenameStub.withArgs(rootDir, filename).returns("src/text.txt");
      gitPromiseStub.resolves("*.png (filter=lfs diff=lfs merge=lfs -text)");

      const result = await isLFS(rootDir, filename);
      expect(result).to.be.false;
    });

    it("should handle an empty LFS track list and return false", async ()=>{
      const filename = "src/unknown.dat";
      getRelativeFilenameStub
        .withArgs(rootDir, filename)
        .returns("src/unknown.dat");
      gitPromiseStub.resolves("");

      const result = await isLFS(rootDir, filename);
      expect(result).to.be.false;
    });

    it("should throw an error if gitPromise fails", async ()=>{
      const filename = "src/error.png";
      getRelativeFilenameStub
        .withArgs(rootDir, filename)
        .returns("src/error.png");
      gitPromiseStub.rejects(new Error("Git command failed"));

      await expect(isLFS(rootDir, filename)).to.be.rejectedWith(
        "Git command failed"
      );
    });
  });

  describe("#gitLFSTrack", ()=>{
    let gitOperator2;
    let gitLFSTrack;
    let gitPromiseStub;
    let getLoggerStub;
    let traceStub;
    let gitAddStub;

    const rootDir = "/repo";
    const filename = "src/image.png";

    beforeEach(()=>{
      gitPromiseStub = sinon.stub();
      getLoggerStub = sinon.stub();
      traceStub = sinon.stub();
      gitAddStub = sinon.stub();
      getLoggerStub.returns({ trace: traceStub });
      gitOperator2 = rewire("../../../app/core/gitOperator2.js");
      gitOperator2.__set__({
        gitPromise: gitPromiseStub,
        getLogger: getLoggerStub,
        gitAdd: gitAddStub
      });
      gitLFSTrack = gitOperator2.__get__("gitLFSTrack");
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should track a file from LFS and log the action", async ()=>{
      gitPromiseStub.resolves();

      await gitLFSTrack(rootDir, filename);

      sinon.assert.calledWith(
        gitPromiseStub,
        rootDir,
        ["lfs", "track", "--", "/src/image.png"],
        rootDir
      );
      sinon.assert.calledWith(
        traceStub,
        "src/image.png is treated as large file"
      );
    });

    it("should add .gitattributes to git", async ()=>{
      gitPromiseStub.resolves();

      await gitLFSTrack(rootDir, filename);

      sinon.assert.calledWith(gitAddStub, rootDir, ".gitattributes");
    });
  });

  describe("#gitLFSUntrack", ()=>{
    let gitOperator2;
    let gitLFSUntrack;
    let gitPromiseStub;
    let getLoggerStub;
    let traceStub;
    let pathExistsStub;
    let gitAddStub;

    const rootDir = "/repo";
    const filename = "src/image.png";

    beforeEach(()=>{
      gitPromiseStub = sinon.stub();
      getLoggerStub = sinon.stub();
      traceStub = sinon.stub();
      pathExistsStub = sinon.stub();
      gitAddStub = sinon.stub();
      getLoggerStub.returns({ trace: traceStub });
      gitOperator2 = rewire("../../../app/core/gitOperator2.js");
      gitOperator2.__set__({
        gitPromise: gitPromiseStub,
        getLogger: getLoggerStub,
        fs: { pathExists: pathExistsStub },
        gitAdd: gitAddStub
      });
      gitLFSUntrack = gitOperator2.__get__("gitLFSUntrack");
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should untrack a file from LFS and log the action", async ()=>{
      pathExistsStub.resolves(false);
      gitPromiseStub.resolves();

      await gitLFSUntrack(rootDir, filename);

      sinon.assert.calledWith(
        gitPromiseStub,
        rootDir,
        ["lfs", "untrack", "--", "/src/image.png"],
        rootDir
      );
      sinon.assert.calledWith(
        traceStub,
        "src/image.png never treated as large file"
      );
    });

    it("should add .gitattributes to git if it exists", async ()=>{
      pathExistsStub.resolves(true);
      gitPromiseStub.resolves();

      await gitLFSUntrack(rootDir, filename);

      sinon.assert.calledWith(gitAddStub, rootDir, ".gitattributes");
    });
  });
});
