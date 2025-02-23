const rewire = require("rewire");
const sinon = require("sinon");

const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-fs"));
chai.use(require("chai-as-promised"));

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
