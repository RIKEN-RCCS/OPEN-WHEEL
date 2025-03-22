/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const fs = require("fs-extra");
const path = require("path");
const { promisify } = require("util");
const { execFile } = require("child_process");
const asyncExecFile = promisify(execFile);

//setup test framework
const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-fs"));
chai.use(require("chai-as-promised"));

//helper function
async function checkLFSenabled(repoDir) {
  const { stdout } = await asyncExecFile("git", ["config", "-l"], { cwd: repoDir }).catch((e)=>{
    console.log("ERROR:\n", e);
  });
  expect(stdout).to.match(/^filter.lfs.clean=git-lfs clean -- %f$/m);
  expect(stdout).to.match(/^filter.lfs.smudge=git-lfs smudge -- %f$/m);
  expect(stdout).to.match(/^filter.lfs.process=git-lfs filter-process$/m);
  expect(stdout).to.match(/^filter.lfs.required=true$/m);
  expect(path.resolve(repoDir, ".git", "hooks", "post-checkout")).to.be.a.file();
  expect(path.resolve(repoDir, ".git", "hooks", "post-commit")).to.be.a.file();
  expect(path.resolve(repoDir, ".git", "hooks", "post-merge")).to.be.a.file();
  expect(path.resolve(repoDir, ".git", "hooks", "pre-push")).to.be.a.file();
}

//testee
const {
  gitInit,
  gitAdd,
  gitRm,
  gitStatus,
  gitCommit,
  gitClean,
  gitResetHEAD,
  gitLFSTrack,
  gitLFSUntrack,
  isLFS
} = require("../../../app/core/gitOperator2.js");

//test data
const testDirRoot = path.resolve("./", "WHEEL_TEST_TMP");
const initialCommitResponse = /\[(master|main) \(root-commit\) .*\] initial commit\n/;

describe("git operator UT", function () {
  this.timeout(10000);
  after(async ()=>{
    if (!process.env.WHEEL_KEEP_FILES_AFTER_LAST_TEST) {
      await fs.remove(testDirRoot);
    }
  });
  describe("#gitInit", ()=>{
    beforeEach(async ()=>{
      await fs.remove(testDirRoot);
      await asyncExecFile("git", ["init", testDirRoot]);
    });
    it("should re-initialize repo and return undefined when attempting to init again", async ()=>{
      expect(await gitInit(testDirRoot, "testUser", "testUser@example.com")).to.match(initialCommitResponse);
      await checkLFSenabled(testDirRoot);
    });
    it("should initialize git repo on nonExisting directory", async ()=>{
      const newRepoDir = path.resolve(testDirRoot, "hoge");
      expect(await gitInit(newRepoDir, "testUser", "testUser@example.com")).to.match(initialCommitResponse);
      expect(newRepoDir).to.be.a.directory().with.contents([".git", ".gitignore"]);
      await checkLFSenabled(newRepoDir);
    });
    it("should initialize git repo on nonExisting directory in nonExisting directory", async ()=>{
      const newRepoDir = path.resolve(testDirRoot, "hoge", "huga");
      expect(await gitInit(newRepoDir, "testUser", "testUser@example.com")).to.match(initialCommitResponse);
      expect(newRepoDir).to.be.a.directory().with.contents([".git", ".gitignore"]);
      await checkLFSenabled(newRepoDir);
    });
    it("should initialize git repo on existing directory", async ()=>{
      const newRepoDir = path.resolve(testDirRoot, "hoge");
      await fs.mkdir(newRepoDir);
      expect(newRepoDir).to.be.a.directory().and.empty;
      expect(await gitInit(newRepoDir, "testUser", "testUser@example.com")).to.match(initialCommitResponse);
      expect(newRepoDir).to.be.a.directory().with.contents([".git", ".gitignore"]);
      await checkLFSenabled(newRepoDir);
    });
    it("should reject while attempting to initialize on existing file", async ()=>{
      const newRepoDir = path.resolve(testDirRoot, "hoge");
      await fs.ensureFile(newRepoDir);
      expect(newRepoDir).to.be.a.file().and.empty;
      return expect(gitInit(newRepoDir, "testUser", "testUser@example.com")).to.be.rejected;
    });
  });
  describe("tests depends on gitInit", ()=>{
    beforeEach(async ()=>{
      await fs.remove(testDirRoot);
      await gitInit(testDirRoot, "testUser", "testUser@example.com");
    });
    describe("#gitAdd", ()=>{
      beforeEach(async ()=>{
        await Promise.all([
          fs.outputFile(path.resolve(testDirRoot, "hoge", "huga", "hige"), "hige"),
          fs.outputFile(path.resolve(testDirRoot, "foo"), "foo"),
          fs.outputFile(path.resolve(testDirRoot, "bar"), "bar"),
          fs.outputFile(path.resolve(testDirRoot, "baz"), "baz")
        ]);
      });
      it("should add one file to index", async ()=>{
        await gitAdd(testDirRoot, "foo");
        const { stdout } = await asyncExecFile("git", ["status", "--short"], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        expect(stdout).to.match(/^A {2}foo$/m);
        expect(stdout).to.match(/^\?\? bar$/m);
        expect(stdout).to.match(/^\?\? baz$/m);
        expect(stdout).to.match(/^\?\? hoge\/$/m);
      });
      it("should add directory and its component to index", async ()=>{
        await gitAdd(testDirRoot, "hoge");
        const { stdout } = await asyncExecFile("git", ["status", "--short"], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        expect(stdout).to.match(/^\?\? foo$/m);
        expect(stdout).to.match(/^\?\? bar$/m);
        expect(stdout).to.match(/^\?\? baz$/m);
        expect(stdout).to.match(/^A {2}hoge\/huga\/hige$/m);
      });
      it("should add one file to index even called multi times", async ()=>{
        await gitAdd(testDirRoot, "foo");
        await gitAdd(testDirRoot, "foo");
        await gitAdd(testDirRoot, "foo");
        const { stdout } = await asyncExecFile("git", ["status", "--short"], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        expect(stdout).to.match(/^A {2}foo$/m);
        expect(stdout).to.match(/^\?\? bar$/m);
        expect(stdout).to.match(/^\?\? baz$/m);
        expect(stdout).to.match(/^\?\? hoge\/$/m);
      });
      it("should be rejected while attempting to add nonExisting file", async ()=>{
        const target = path.resolve(testDirRoot, "hoge");
        await fs.remove(target);
        return expect(gitAdd(testDirRoot, target)).to.be.rejected;
      });
      it("should add already commited file if modified", async ()=>{
        await asyncExecFile("git", ["add", "foo"], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        await asyncExecFile("git", ["commit", "-m", "test commit"], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        await fs.outputFile(path.resolve(testDirRoot, "foo"), "hoge");
        await gitAdd(testDirRoot, "foo");
        const { stdout } = await asyncExecFile("git", ["status", "--short"], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        expect(stdout).to.match(/^M {2}foo$/m);
        expect(stdout).to.match(/^\?\? bar$/m);
        expect(stdout).to.match(/^\?\? baz$/m);
        expect(stdout).to.match(/^\?\? hoge\/$/m);
      });
      it("should not add already commited file if not modified", async ()=>{
        await asyncExecFile("git", ["add", "foo"], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        await asyncExecFile("git", ["commit", "-m", "test commit"], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        await gitAdd(testDirRoot, "foo");
        const { stdout } = await asyncExecFile("git", ["status", "--short"], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        expect(stdout).to.match(/^\?\? bar$/m);
        expect(stdout).to.match(/^\?\? baz$/m);
        expect(stdout).to.match(/^\?\? hoge\/$/m);
        expect(stdout).not.to.match(/foo/);
      });
      it("should add and rm directory contents at the same time", async ()=>{
        await asyncExecFile("git", ["add", "foo", "bar", "baz"], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        await asyncExecFile("git", ["commit", "-m", "test commit"], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        await fs.remove(path.resolve(testDirRoot, "foo"));
        await fs.outputFile(path.resolve(testDirRoot, "bar"), "hoge");

        await gitAdd(testDirRoot, ".");
        const { stdout } = await asyncExecFile("git", ["status", "--short"], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        expect(stdout).to.match(/^D {2}foo$/m);
        expect(stdout).to.match(/^M {2}bar$/m);
        expect(stdout).to.match(/^A {2}hoge\/huga\/hige$/m);
        expect(stdout).not.to.match(/baz/);
      });
      it("should do nothing if directory contents is not changed", async ()=>{
        await asyncExecFile("git", ["add", "."], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        await asyncExecFile("git", ["commit", "-m", "test commit"], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });

        await gitAdd(testDirRoot, ".");
        const { stdout } = await asyncExecFile("git", ["status", "--short"], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        expect(stdout).to.be.empty;
      });
    });
    describe("#gitRm", ()=>{
      beforeEach(async ()=>{
        await fs.outputFile(path.resolve(testDirRoot, "foo"), "foo");
        await asyncExecFile("git", ["add", "foo"], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        await asyncExecFile("git", ["commit", "-m", "test commit"], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        await fs.outputFile(path.resolve(testDirRoot, "bar"), "bar");
        await asyncExecFile("git", ["add", "bar"], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        await fs.outputFile(path.resolve(testDirRoot, "baz"), "baz");
      });
      it("should remove file from repo but the file is not removed", async ()=>{
        await gitRm(testDirRoot, "foo");
        const { stdout } = await asyncExecFile("git", ["status", "--short"], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        expect(stdout).to.match(/^\?{2} foo$/m);
        expect(stdout).to.match(/^A {2}bar$/m);
        expect(stdout).to.match(/^\?{2} baz$/m);
      });
      it("should remove file from repo if indexed but not commited file is specified", async ()=>{
        await gitRm(testDirRoot, "bar");
        const { stdout } = await asyncExecFile("git", ["status", "--short"], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        expect(stdout).not.to.match(/foo/);
        expect(stdout).to.match(/^\?{2} bar$/m);
        expect(stdout).to.match(/^\?{2} baz$/m);
      });
      it("should remove file from repo if indexed and already commited file is specified", async ()=>{
        await fs.outputFile(path.resolve(testDirRoot, "foo"), "foo2");
        await asyncExecFile("git", ["add", "foo"], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        await gitRm(testDirRoot, "foo");
        const { stdout } = await asyncExecFile("git", ["status", "--short"], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        expect(stdout).to.match(/^D {2}foo$/m);
        expect(stdout).to.match(/^\?{2} foo$/m);
        expect(stdout).to.match(/^A {2}bar$/m);
        expect(stdout).to.match(/^\?{2} baz$/m);
      });
      it("should just fulfilled if untracked file is specified", ()=>{
        return expect(gitRm(testDirRoot, "baz")).to.be.fulfilled;
      });
    });
    describe("#gitStatus", ()=>{
      beforeEach(async ()=>{
        await fs.outputFile(path.resolve(testDirRoot, "foo"), "foo");
        await fs.outputFile(path.resolve(testDirRoot, "bar"), "bar");
        await fs.outputFile(path.resolve(testDirRoot, "baz"), "baz");
        await fs.outputFile(path.resolve(testDirRoot, "hoge"), "hoge");
        await fs.outputFile(path.resolve(testDirRoot, "huga"), "huga");
        await fs.outputFile(path.resolve(testDirRoot, "hige"), "hige");
        await fs.outputFile(path.resolve(testDirRoot, "piyo"), "piyo");
        await fs.outputFile(path.resolve(testDirRoot, "puyo"), "puyo");
        await asyncExecFile("git", ["add", "."], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        await asyncExecFile("git", ["commit", "-m", "test commit"], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        //modified
        await fs.outputFile(path.resolve(testDirRoot, "foo"), "foo2");
        await fs.outputFile(path.resolve(testDirRoot, "bar"), "bar2");
        //deleted
        await fs.remove(path.resolve(testDirRoot, "baz"));
        await fs.remove(path.resolve(testDirRoot, "hoge"));
        //renamed
        await fs.move(path.resolve(testDirRoot, "huga"), path.resolve(testDirRoot, "huga2"));
        await fs.move(path.resolve(testDirRoot, "hige"), path.resolve(testDirRoot, "hige2"));
        //added
        await fs.outputFile(path.resolve(testDirRoot, "new1"), "new1");
        await fs.outputFile(path.resolve(testDirRoot, "new2"), "new2");

        await asyncExecFile("git", ["add", "."], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });

        //untracked
        await fs.outputFile(path.resolve(testDirRoot, "poyo"), "poyo");
        await fs.outputFile(path.resolve(testDirRoot, "punyu"), "punyu");
      });
      it("should return git status results", async ()=>{
        const { added, modified, deleted, renamed, untracked } = await gitStatus(testDirRoot);
        expect(added).to.have.members(["new1", "new2"]);
        expect(modified).to.have.members(["bar", "foo"]);
        expect(deleted).to.have.members(["baz", "hoge"]);
        expect(renamed).to.have.members(["hige2", "huga2"]);
        expect(untracked).to.have.members(["poyo", "punyu"]);

        expect(modified).not.to.have.members(["new1", "new2", "baz", "hoge", "huga", "hige", "piyo", "puyo", "poyo", "punyu", "huga2", "hige2"]);
        expect(deleted).not.to.have.members(["new1", "new2", "foo", "bar", "huga", "hige", "piyo", "puyo", "poyo", "punyu", "huga2", "hige2"]);
        expect(renamed).not.to.have.members(["new1", "new2", "foo", "bar", "baz", "hoge", "huga", "hige", "piyo", "puyo", "poyo", "punyu"]);
        expect(untracked).not.to.have.members(["new1", "new2", "foo", "bar", "baz", "hoge", "huga", "hige", "piyo", "puyo", "huga2", "hige2"]);
      });
      it("should be rejected if specified path does not exist", ()=>{
        return expect(gitStatus(path.resolve(testDirRoot, "ponyo"))).to.be.rejected;
      });
      it("should be rejected if specified path is not git repo", ()=>{
        return expect(gitStatus("/tmp")).to.be.rejected;
      });
    });
    describe("#gitCommit", ()=>{
      beforeEach(async ()=>{
        await fs.outputFile(path.resolve(testDirRoot, "foo"), "foo");
        await fs.outputFile(path.resolve(testDirRoot, "bar"), "bar");
        await fs.outputFile(path.resolve(testDirRoot, "baz"), "baz");
      });
      it("should do nothing if no files are indexed", async ()=>{
        await gitCommit(testDirRoot);
        const { stdout } = await asyncExecFile("git", ["ls-files"], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        expect(stdout).to.be.equal(".gitignore\n");
      });
      it("should commit all files if directory is indexed", async ()=>{
        await asyncExecFile("git", ["add", "."], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        await gitCommit(testDirRoot);
        await gitCommit(testDirRoot);
        const { stdout } = await asyncExecFile("git", ["ls-files"], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        expect(stdout).to.match(/^.gitignore$/m);
        expect(stdout).to.match(/^foo$/m);
        expect(stdout).to.match(/^bar$/m);
        expect(stdout).to.match(/^baz$/m);
      });
      it("should commit indexed files", async ()=>{
        await asyncExecFile("git", ["add", "foo"], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        await gitCommit(testDirRoot);
        const { stdout } = await asyncExecFile("git", ["ls-files"], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        expect(stdout).to.match(/^foo$/m);
      });
      it("should commit specified indexed files", async ()=>{
        await asyncExecFile("git", ["add", "foo", "bar", "baz"], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        await gitCommit(testDirRoot, undefined, ["foo", "bar"]);
        const { stdout } = await asyncExecFile("git", ["ls-files"], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        expect(stdout).to.match(/^foo$/m);
        expect(stdout).to.match(/^bar$/m);
        expect(stdout).to.match(/^baz$/m);
        const { stdout: stdout2 } = await asyncExecFile("git", ["status", "--short"], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        expect(stdout2).not.to.match(/foo/);
        expect(stdout2).not.to.match(/bar/);
        expect(stdout2).to.match(/^A {2}baz$/m);
      });
    });
    describe("#gitClean", ()=>{
      beforeEach(async ()=>{
        await fs.outputFile(path.resolve(testDirRoot, "foo"), "foo");
        await fs.outputFile(path.resolve(testDirRoot, "dir", "bar"), "bar");
        await asyncExecFile("git", ["add", "."], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        await asyncExecFile("git", ["commit", "-m", "test commit"], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
      });
      it("should do nothing if untracked files does not exist", async ()=>{
        await gitClean(testDirRoot);
        const { stdout } = await asyncExecFile("git", ["ls-files"], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        expect(stdout).to.match(/^foo$/m);
        expect(stdout).to.match(/^dir\/bar$/m);
        expect(path.resolve(testDirRoot, "foo")).to.be.a.file().with.content("foo");
        expect(path.resolve(testDirRoot, "dir", "bar")).to.be.a.file().with.content("bar");
      });
      it("should remove untracked files and directories", async ()=>{
        await fs.outputFile(path.resolve(testDirRoot, "foo2"), "foo2");
        await fs.outputFile(path.resolve(testDirRoot, "dir2", "bar2"), "bar2");
        await fs.mkdir(path.resolve(testDirRoot, "dir3"));
        await gitClean(testDirRoot);

        //git clean does not change any commited files
        const { stdout } = await asyncExecFile("git", ["ls-files"], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        expect(stdout).to.match(/^foo$/m);
        expect(stdout).to.match(/^dir\/bar$/m);
        expect(path.resolve(testDirRoot, "foo")).to.be.a.file().with.content("foo");
        expect(path.resolve(testDirRoot, "dir", "bar")).to.be.a.file().with.content("bar");
        //git clean remove untracked files
        expect(path.resolve(testDirRoot, "foo2")).not.to.be.a.path();
        expect(path.resolve(testDirRoot, "dir2")).not.to.be.a.path();
        expect(path.resolve(testDirRoot, "dir3")).not.to.be.a.path();
        expect(path.resolve(testDirRoot, "dir2", "bar2")).not.to.be.a.path();
      });
      it("should remove specified file", async ()=>{
        await fs.outputFile(path.resolve(testDirRoot, "foo2"), "foo2");
        await fs.outputFile(path.resolve(testDirRoot, "dir2", "bar2"), "bar2");
        await fs.mkdir(path.resolve(testDirRoot, "dir3"));

        await gitClean(testDirRoot, "foo2");

        //git clean does not change any commited files
        const { stdout } = await asyncExecFile("git", ["ls-files"], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        expect(stdout).to.match(/^foo$/m);
        expect(stdout).to.match(/^dir\/bar$/m);
        expect(path.resolve(testDirRoot, "foo")).to.be.a.file().with.content("foo");
        expect(path.resolve(testDirRoot, "dir", "bar")).to.be.a.file().with.content("bar");
        //git clean remove untracked files
        expect(path.resolve(testDirRoot, "foo2")).not.to.be.a.path();
        expect(path.resolve(testDirRoot, "dir2")).to.be.a.directory().with.files(["bar2"]);
        expect(path.resolve(testDirRoot, "dir2", "bar2")).to.be.a.file().with.content("bar2");
        expect(path.resolve(testDirRoot, "dir3")).to.be.a.directory().and.empty;
      });
      it("should remove untracked file under specified directoriy", async ()=>{
        await fs.outputFile(path.resolve(testDirRoot, "foo2"), "foo2");
        await fs.outputFile(path.resolve(testDirRoot, "dir2", "bar2"), "bar2");
        await fs.outputFile(path.resolve(testDirRoot, "dir2", "baz2"), "baz2");
        await fs.mkdir(path.resolve(testDirRoot, "dir3"));
        await asyncExecFile("git", ["add", "dir2/baz2"], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        await asyncExecFile("git", ["commit", "-m", "add baz2"], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });

        await gitClean(testDirRoot, "dir2");

        //git clean does not change any commited files
        const { stdout } = await asyncExecFile("git", ["ls-files"], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        expect(stdout).to.match(/^foo$/m);
        expect(stdout).to.match(/^dir\/bar$/m);
        expect(path.resolve(testDirRoot, "foo")).to.be.a.file().with.content("foo");
        expect(path.resolve(testDirRoot, "dir", "bar")).to.be.a.file().with.content("bar");
        //git clean remove untracked files
        expect(path.resolve(testDirRoot, "foo2")).to.be.a.file().with.content("foo2");
        expect(path.resolve(testDirRoot, "dir2", "bar2")).not.to.be.a.path();
        expect(path.resolve(testDirRoot, "dir2")).to.be.a.directory().with.files(["baz2"]);
        expect(path.resolve(testDirRoot, "dir2", "baz2")).to.be.a.file().with.content("baz2");
        expect(path.resolve(testDirRoot, "dir3")).to.be.a.directory().and.empty;
      });
    });
    describe("#gitResetHEAD", ()=>{
      beforeEach(async ()=>{
        await fs.outputFile(path.resolve(testDirRoot, "foo"), "foo");
        await fs.outputFile(path.resolve(testDirRoot, "bar"), "bar");
        await fs.outputFile(path.resolve(testDirRoot, "baz"), "baz");
        await fs.outputFile(path.resolve(testDirRoot, "hoge"), "hoge");
        await fs.outputFile(path.resolve(testDirRoot, "huga"), "huga");
        await fs.outputFile(path.resolve(testDirRoot, "hige"), "hige");
        await fs.outputFile(path.resolve(testDirRoot, "piyo"), "piyo");
        await fs.outputFile(path.resolve(testDirRoot, "puyo"), "puyo");
        await asyncExecFile("git", ["add", "."], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        await asyncExecFile("git", ["commit", "-m", "test commit"], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        //modified
        await fs.outputFile(path.resolve(testDirRoot, "foo"), "foo2");
        await fs.outputFile(path.resolve(testDirRoot, "bar"), "bar2");
        //deleted
        await fs.remove(path.resolve(testDirRoot, "baz"));
        await fs.remove(path.resolve(testDirRoot, "hoge"));
        //renamed
        await fs.move(path.resolve(testDirRoot, "huga"), path.resolve(testDirRoot, "huga2"));
        await fs.move(path.resolve(testDirRoot, "hige"), path.resolve(testDirRoot, "hige2"));

        await asyncExecFile("git", ["add", "."], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });

        //untracked
        await fs.outputFile(path.resolve(testDirRoot, "poyo"), "poyo");
        await fs.outputFile(path.resolve(testDirRoot, "punyu"), "punyu");
      });
      it("should perform reset HEAD --hard", async ()=>{
        await gitResetHEAD(testDirRoot);

        //check commited files
        const { stdout } = await asyncExecFile("git", ["ls-files"], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        expect(stdout).to.match(/^foo$/m);
        expect(stdout).to.match(/^bar$/m);
        expect(stdout).to.match(/^baz$/m);
        expect(stdout).to.match(/^hoge$/m);
        expect(stdout).to.match(/^huga$/m);
        expect(stdout).to.match(/^hige$/m);
        expect(stdout).to.match(/^piyo$/m);
        expect(stdout).to.match(/^puyo$/m);

        //check untracked files
        const rt = await asyncExecFile("git", ["status", "--short"], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        const stdout2 = rt.stdout;
        expect(stdout2).to.match(/^\?{2} poyo$/m);
        expect(stdout2).to.match(/^\?{2} punyu$/m);
        expect(stdout2).not.to.match(/^ *foo$/m);
        expect(stdout2).not.to.match(/^ *bar$/m);
        expect(stdout2).not.to.match(/^ *baz$/m);
        expect(stdout2).not.to.match(/^ *hoge$/m);
        expect(stdout2).not.to.match(/^ *huga$/m);
        expect(stdout2).not.to.match(/^ *hige$/m);
        expect(stdout2).not.to.match(/^ *piyo$/m);
        expect(stdout2).not.to.match(/^ *puyo$/m);

        //check files
        expect(path.resolve(testDirRoot, "foo")).to.be.a.file().with.content("foo");
        expect(path.resolve(testDirRoot, "bar")).to.be.a.file().with.content("bar");
        expect(path.resolve(testDirRoot, "baz")).to.be.a.file().with.content("baz");
        expect(path.resolve(testDirRoot, "hoge")).to.be.a.file().with.content("hoge");
        expect(path.resolve(testDirRoot, "huga")).to.be.a.file().with.content("huga");
        expect(path.resolve(testDirRoot, "hige")).to.be.a.file().with.content("hige");
        expect(path.resolve(testDirRoot, "piyo")).to.be.a.file().with.content("piyo");
        expect(path.resolve(testDirRoot, "puyo")).to.be.a.file().with.content("puyo");
        expect(path.resolve(testDirRoot, "poyo")).to.be.a.file().with.content("poyo");
        expect(path.resolve(testDirRoot, "punyu")).to.be.a.file().with.content("punyu");
        expect(path.resolve(testDirRoot, "huga2")).not.to.be.a.path();
        expect(path.resolve(testDirRoot, "hige2")).not.to.be.a.path();
      });
      it("should perform reset HEAD --mixed and checkout", async ()=>{
        await gitResetHEAD(testDirRoot, ".");

        //check commited files
        const { stdout } = await asyncExecFile("git", ["ls-files"], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        expect(stdout).to.match(/^foo$/m);
        expect(stdout).to.match(/^bar$/m);
        expect(stdout).to.match(/^baz$/m);
        expect(stdout).to.match(/^hoge$/m);
        expect(stdout).to.match(/^huga$/m);
        expect(stdout).to.match(/^hige$/m);
        expect(stdout).to.match(/^piyo$/m);
        expect(stdout).to.match(/^puyo$/m);

        //check untracked files
        const rt = await asyncExecFile("git", ["status", "--short"], { cwd: testDirRoot }).catch((e)=>{
          console.log("ERROR:\n", e);
        });
        const stdout2 = rt.stdout;
        expect(stdout2).to.match(/^\?{2} huga2$/m);
        expect(stdout2).to.match(/^\?{2} hige2$/m);
        expect(stdout2).to.match(/^\?{2} poyo$/m);
        expect(stdout2).to.match(/^\?{2} punyu$/m);
        expect(stdout2).not.to.match(/^ *foo$/m);
        expect(stdout2).not.to.match(/^ *bar$/m);
        expect(stdout2).not.to.match(/^ *baz$/m);
        expect(stdout2).not.to.match(/^ *hoge$/m);
        expect(stdout2).not.to.match(/^ *huga$/m);
        expect(stdout2).not.to.match(/^ *hige$/m);
        expect(stdout2).not.to.match(/^ *piyo$/m);
        expect(stdout2).not.to.match(/^ *puyo$/m);

        //check files
        expect(path.resolve(testDirRoot, "foo")).to.be.a.file().with.content("foo");
        expect(path.resolve(testDirRoot, "bar")).to.be.a.file().with.content("bar");
        expect(path.resolve(testDirRoot, "baz")).to.be.a.file().with.content("baz");
        expect(path.resolve(testDirRoot, "hoge")).to.be.a.file().with.content("hoge");
        expect(path.resolve(testDirRoot, "huga")).to.be.a.file().with.content("huga");
        expect(path.resolve(testDirRoot, "hige")).to.be.a.file().with.content("hige");
        expect(path.resolve(testDirRoot, "piyo")).to.be.a.file().with.content("piyo");
        expect(path.resolve(testDirRoot, "puyo")).to.be.a.file().with.content("puyo");
        expect(path.resolve(testDirRoot, "poyo")).to.be.a.file().with.content("poyo");
        expect(path.resolve(testDirRoot, "punyu")).to.be.a.file().with.content("punyu");
        expect(path.resolve(testDirRoot, "huga2")).to.be.a.file().with.content("huga");
        expect(path.resolve(testDirRoot, "hige2")).to.be.a.file().with.content("hige");
      });
    });
    describe("#gitLFSTrack", ()=>{
      const attributeFile = path.resolve(testDirRoot, ".gitattributes");
      it("should add entry to .gitattribute with relative path ", async ()=>{
        await gitLFSTrack(testDirRoot, "foo");
        expect(attributeFile).to.be.a.file().with.contents.that.match(/^\/foo filter=lfs diff=lfs merge=lfs -text$/m);
      });
      it("should add entry to .gitattribute with absolute path ", async ()=>{
        await gitLFSTrack(testDirRoot, path.resolve(testDirRoot, "foo"));
        expect(attributeFile).to.be.a.file().with.contents.that.match(/^\/foo filter=lfs diff=lfs merge=lfs -text$/m);
      });
      it("should do nothing if target is already in .gitattribute", async ()=>{
        await gitLFSTrack(testDirRoot, "foo");
        expect(attributeFile).to.be.a.file().with.contents.that.match(/^\/foo filter=lfs diff=lfs merge=lfs -text$/m);
        const attributes = (await fs.readFile(attributeFile)).toString();
        await gitLFSTrack(testDirRoot, "foo");
        expect(attributeFile).to.be.a.file().with.content(attributes);
      });
    });
    describe("#gitLFSUntrack", ()=>{
      const attributeFile = path.resolve(testDirRoot, ".gitattributes");
      beforeEach(async ()=>{
        await gitLFSTrack(testDirRoot, "foo");
        expect(attributeFile).to.be.a.file().with.contents.that.match(/^\/foo filter=lfs diff=lfs merge=lfs -text$/m);
      });
      it("should remove entry from .gitattribute with relative path", async ()=>{
        await gitLFSUntrack(testDirRoot, "foo");
        expect(attributeFile).to.be.a.file().with.contents.that.not.match(/^\/foo filter=lfs diff=lfs merge=lfs -text$/m);
      });
      it("should remove entry from .gitattribute with absolute path", async ()=>{
        await gitLFSUntrack(testDirRoot, path.resolve(testDirRoot, "foo"));
        expect(attributeFile).to.be.a.file().with.contents.that.not.match(/^\/foo filter=lfs diff=lfs merge=lfs -text$/m);
      });
      it("should do nothing if target is not in .gitattribute", async ()=>{
        const attributes = (await fs.readFile(attributeFile)).toString().replace("\r\n", "\n");
        await gitLFSUntrack(testDirRoot, "hoge");
        expect(attributeFile).to.be.a.file().with.content(attributes);
      });
      it("should do nothing if .gitattribute does not exist", async ()=>{
        await fs.remove(attributeFile);
        return expect(gitLFSUntrack(testDirRoot, "hoge")).to.be.fulfilled;
      });
    });
    describe("#isLFS", async ()=>{
      it("should return true if specified file is large file", async ()=>{
        await gitLFSTrack(testDirRoot, "foo");
        expect(await isLFS(testDirRoot, "foo")).to.be.true;
      });
      it("should return false if specified file is not large file", async ()=>{
        await gitLFSUntrack(testDirRoot, "foo");
        expect(await isLFS(testDirRoot, "foo")).to.be.false;
      });
    });
  });
});
