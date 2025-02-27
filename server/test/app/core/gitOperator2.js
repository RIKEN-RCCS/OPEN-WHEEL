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
  let gitPromiseMock;

  const rootDir = "/repo";
  const defaultMessage = "save project";

  beforeEach(()=>{
    gitOperator2 = rewire("../../../app/core/gitOperator2.js");
    gitCommit = gitOperator2.__get__("gitCommit");
    gitPromiseMock = sinon.stub();
    gitOperator2.__set__("gitPromise", gitPromiseMock);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should call gitPromise with correct arguments when message and additionalOption are provided", async ()=>{
    gitPromiseMock.resolves();
    const message = "Initial commit";
    const additionalOption = ["--signoff"];

    await gitCommit(rootDir, message, additionalOption);

    sinon.assert.calledWith(
      gitPromiseMock,
      rootDir,
      ["commit", "-m", `"${message}"`, "--signoff"],
      rootDir
    );
  });

  it("should call gitPromise with default message when no message is provided", async ()=>{
    gitPromiseMock.resolves();

    await gitCommit(rootDir);

    sinon.assert.calledWith(
      gitPromiseMock,
      rootDir,
      ["commit", "-m", `"${defaultMessage}"`],
      rootDir
    );
  });

  it("should handle 'no changes to commit' error and not throw", async ()=>{
    const error = new Error("nothing to commit, working tree clean");
    gitPromiseMock.rejects(error);

    await expect(gitCommit(rootDir)).to.be.fulfilled;
  });

  it("should throw error if gitPromise fails with another error", async ()=>{
    const errorMessage = "some other error";
    gitPromiseMock.rejects(new Error(errorMessage));

    await expect(gitCommit(rootDir)).to.be.rejectedWith(Error, errorMessage);
  });

  it("should handle 'no changes added to commit' error and not throw", async ()=>{
    const error = new Error("no changes added to commit");
    gitPromiseMock.rejects(error);

    await expect(gitCommit(rootDir)).to.be.fulfilled;
  });

  it("should handle 'nothing to commit' error and not throw", async ()=>{
    const error = new Error("nothing to commit");
    gitPromiseMock.rejects(error);

    await expect(gitCommit(rootDir)).to.be.fulfilled;
  });
});

describe("gitAdd", ()=>{
  let gitOperator2;
  let gitAdd;
  let gitPromiseMock;

  const rootDir = "/repo";
  const filename = "file.txt";

  beforeEach(()=>{
    gitOperator2 = rewire("../../../app/core/gitOperator2.js");
    gitAdd = gitOperator2.__get__("gitAdd");
    gitPromiseMock = sinon.stub();
    gitOperator2.__set__("gitPromise", gitPromiseMock);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should call gitPromise with correct arguments (without -u)", async ()=>{
    gitPromiseMock.resolves();

    await gitAdd(rootDir, filename, false);

    sinon.assert.calledWith(
      gitPromiseMock,
      rootDir,
      ["add", "--", filename],
      rootDir
    );
  });

  it("should call gitPromise with correct arguments (with -u)", async ()=>{
    gitPromiseMock.resolves();

    await gitAdd(rootDir, filename, true);

    sinon.assert.calledWith(
      gitPromiseMock,
      rootDir,
      ["add", "-u", "--", filename],
      rootDir
    );
  });

  it("should handle index.lock error and not throw", async ()=>{
    const error = new Error(
      "fatal: Unable to create '/repo/.git/index.lock': File exists"
    );
    gitPromiseMock.rejects(error);

    await expect(gitAdd(rootDir, filename, false)).to.be.fulfilled;
  });

  it("should throw error if gitPromise fails with another error", async ()=>{
    const error = new Error("some other error");
    gitPromiseMock.rejects(error);

    await expect(gitAdd(rootDir, filename, false)).to.be.rejectedWith(
      Error,
      "some other error"
    );
  });
});

describe("gitRm", ()=>{
  let gitOperator2;
  let gitRm;
  let gitPromiseMock;

  const rootDir = "/repo";
  const filename = "file.txt";

  beforeEach(()=>{
    gitOperator2 = rewire("../../../app/core/gitOperator2.js");
    gitRm = gitOperator2.__get__("gitRm");
    gitPromiseMock = sinon.stub();
    gitOperator2.__set__("gitPromise", gitPromiseMock);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should call gitPromise with correct arguments", async ()=>{
    gitPromiseMock.resolves();
    await gitRm(rootDir, filename);

    sinon.assert.calledWith(
      gitPromiseMock,
      rootDir,
      ["rm", "-r", "--cached", "--", filename],
      rootDir
    );
  });

  it("should not throw error if gitPromise fails with fatal error related to pathspec", async ()=>{
    const error = new Error(
      "fatal: pathspec 'file.txt' did not match any files"
    );
    gitPromiseMock.rejects(error);

    await expect(gitRm(rootDir, filename)).to.be.fulfilled;
  });

  it("should throw error if gitPromise fails with another error", async ()=>{
    const error = new Error("some other error");
    gitPromiseMock.rejects(error);

    await expect(gitRm(rootDir, filename)).to.be.rejectedWith(
      Error,
      "some other error"
    );
  });
});

describe("gitStatus", ()=>{
  let gitOperator2;
  let gitStatus;
  let gitPromiseMock;

  const rootDir = "/repo";

  beforeEach(()=>{
    gitOperator2 = rewire("../../../app/core/gitOperator2.js");
    gitStatus = gitOperator2.__get__("gitStatus");
    gitPromiseMock = sinon.stub();
    gitOperator2.__set__("gitPromise", gitPromiseMock);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should call gitStatus with correct arguments", async ()=>{
    gitPromiseMock.resolves("");
    await gitStatus(rootDir);

    sinon.assert.calledWith(
      gitPromiseMock,
      rootDir,
      ["status", "--short"],
      rootDir
    );
  });

  it("should correctly parse added files", async function () {
    gitPromiseMock.resolves("A  addedFile.txt");
    const result = await gitStatus(rootDir);
    expect(result.added).to.deep.equal(["addedFile.txt"]);
  });

  it("should correctly parse modified files", async function () {
    gitPromiseMock.resolves("M  modifiedFile.txt");
    const result = await gitStatus(rootDir);
    expect(result.modified).to.deep.equal(["modifiedFile.txt"]);
  });

  it("should correctly parse deleted files", async function () {
    gitPromiseMock.resolves("D  deletedFile.txt");
    const result = await gitStatus(rootDir);
    expect(result.deleted).to.deep.equal(["deletedFile.txt"]);
  });

  it("should correctly parse renamed files", async function () {
    gitPromiseMock.resolves("R  oldName.txt -> newName.txt");
    const result = await gitStatus(rootDir);
    expect(result.renamed).to.deep.equal(["newName.txt"]);
  });

  it("should correctly parse untracked files", async function () {
    gitPromiseMock.resolves("?? untrackedFile.txt");
    const result = await gitStatus(rootDir);
    expect(result.untracked).to.deep.equal(["untrackedFile.txt"]);
  });

  it("should return empty arrays for clean status", async function () {
    gitPromiseMock.resolves("");
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
    gitPromiseMock.resolves("X  unknownFile.txt");
    await expect(gitStatus(rootDir)).to.be.rejectedWith(
      "unkonw output from git status --short"
    );
  });
});

describe("gitClean", ()=>{
  let gitOperator2;
  let gitClean;
  let gitPromiseMock;

  const rootDir = "/repo";

  beforeEach(()=>{
    gitOperator2 = rewire("../../../app/core/gitOperator2.js");
    gitClean = gitOperator2.__get__("gitClean");
    gitPromiseMock = sinon.stub();
    gitOperator2.__set__("gitPromise", gitPromiseMock);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should call gitPromise with correct arguments when filePatterns is provided", async ()=>{
    gitPromiseMock.resolves();
    const filePatterns = "*.log";

    await gitClean(rootDir, filePatterns);

    sinon.assert.calledWith(
      gitPromiseMock,
      rootDir,
      ["clean", "-df", "-e wheel.log", "--", filePatterns],
      rootDir
    );
  });

  it("should call gitPromise with correct arguments when filePatterns is empty", async ()=>{
    gitPromiseMock.resolves();

    await gitClean(rootDir);

    sinon.assert.calledWith(
      gitPromiseMock,
      rootDir,
      ["clean", "-df", "-e wheel.log", "--", ""],
      rootDir
    );
  });

  it("should throw an error if gitPromise fails", async ()=>{
    const errorMessage = "git clean failed";
    gitPromiseMock.rejects(new Error(errorMessage));

    await expect(gitClean(rootDir)).to.be.rejectedWith(Error, errorMessage);
  });
});

describe("getUnsavedFiles", ()=>{
  let gitOperator2;
  let getUnsavedFiles;
  let gitStatusMock;

  const rootDir = "/repo";

  beforeEach(()=>{
    gitOperator2 = rewire("../../../app/core/gitOperator2.js");
    getUnsavedFiles = gitOperator2.__get__("getUnsavedFiles");
    gitStatusMock = sinon.stub();
    gitOperator2.__set__("gitStatus", gitStatusMock);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return unsaved files correctly", async function () {
    gitStatusMock.resolves({
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
    gitStatusMock.resolves({
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
    gitStatusMock.resolves({
      added: [],
      modified: [],
      deleted: [],
      renamed: [],
      untracked: []
    });

    await getUnsavedFiles(rootDir);

    sinon.assert.calledWith(gitStatusMock, rootDir);
  });
});
