const rewire = require("rewire");
const sinon = require("sinon");
const fs = require("fs-extra");
const path = require("path");

const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-fs"));
chai.use(require("chai-as-promised"));

describe("gitInit", ()=>{
  let gitOperator2;
  let gitInit;
  let gitAddStub;
  let gitCommitStub;
  let gitPromiseStub;
  let outputFileStub;

  const rootDir = "/repo";
  const user = "testuser";
  const mail = "testuser@example.com";

  beforeEach(()=>{
    gitOperator2 = rewire("../../../app/core/gitOperator2.js");
    gitInit = gitOperator2.__get__("gitInit");
    gitAddStub = sinon.stub();
    gitCommitStub = sinon.stub();
    gitPromiseStub = sinon.stub();
    gitOperator2.__set__("gitAdd", gitAddStub);
    gitOperator2.__set__("gitCommit", gitCommitStub);
    gitOperator2.__set__("gitPromise", gitPromiseStub);
    sinon.stub(fs, "ensureDir").resolves();
    outputFileStub = sinon.stub(fs, "outputFile").resolves();
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
    sinon.assert.calledWith(
      gitPromiseStub,
      rootDir,
      ["config", "user.name", user],
      rootDir
    );
    sinon.assert.calledWith(
      gitPromiseStub,
      rootDir,
      ["config", "user.email", mail],
      rootDir
    );
    sinon.assert.calledWith(
      gitPromiseStub,
      rootDir,
      ["lfs", "install"],
      rootDir
    );
    sinon.assert.calledWith(
      outputFileStub,
      path.join(rootDir, ".gitignore"),
      "wheel.log"
    );
    sinon.assert.calledWith(gitAddStub, rootDir, ".gitignore");
    sinon.assert.calledWith(gitCommitStub, rootDir, "initial commit");
  });
});

describe("gitCommit", ()=>{
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

describe("gitAdd", ()=>{
  let gitOperator2;
  let gitAdd;
  let gitPromiseStub;

  const rootDir = "/repo";
  const filename = "file.txt";

  beforeEach(()=>{
    gitOperator2 = rewire("../../../app/core/gitOperator2.js");
    gitAdd = gitOperator2.__get__("gitAdd");
    gitPromiseStub = sinon.stub();
    gitOperator2.__set__("gitPromise", gitPromiseStub);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should call gitPromise with correct arguments (without -u)", async ()=>{
    gitPromiseStub.resolves();

    await gitAdd(rootDir, filename, false);

    sinon.assert.calledWith(
      gitPromiseStub,
      rootDir,
      ["add", "--", filename],
      rootDir
    );
  });

  it("should call gitPromise with correct arguments (with -u)", async ()=>{
    gitPromiseStub.resolves();

    await gitAdd(rootDir, filename, true);

    sinon.assert.calledWith(
      gitPromiseStub,
      rootDir,
      ["add", "-u", "--", filename],
      rootDir
    );
  });

  it("should handle index.lock error and not throw", async ()=>{
    const error = new Error(
      "fatal: Unable to create '/repo/.git/index.lock': File exists"
    );
    gitPromiseStub.rejects(error);

    await expect(gitAdd(rootDir, filename, false)).to.be.fulfilled;
  });

  it("should throw error if gitPromise fails with another error", async ()=>{
    const error = new Error("some other error");
    gitPromiseStub.rejects(error);

    await expect(gitAdd(rootDir, filename, false)).to.be.rejectedWith(
      Error,
      "some other error"
    );
  });
});

describe("gitRm", ()=>{
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

describe("gitResetHEAD", ()=>{
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

describe("gitStatus", ()=>{
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

  it("should call gitStatus with correct arguments", async ()=>{
    gitPromiseStub.resolves("");
    await gitStatus(rootDir);

    sinon.assert.calledWith(
      gitPromiseStub,
      rootDir,
      ["status", "--short"],
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

describe("gitClean", ()=>{
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
      ["clean", "-df", "-e wheel.log", "--", ""],
      rootDir
    );
  });

  it("should throw an error if gitPromise fails", async ()=>{
    const errorMessage = "git clean failed";
    gitPromiseStub.rejects(new Error(errorMessage));

    await expect(gitClean(rootDir)).to.be.rejectedWith(Error, errorMessage);
  });
});

describe("getRelativeFilename", ()=>{
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

describe("getUnsavedFiles", ()=>{
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
