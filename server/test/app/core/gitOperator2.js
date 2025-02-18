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

  it("sample test", ()=>{
    gitPromiseMock.resolves("ok!");
    gitAdd();
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
