/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-as-promised"));
const { describe, it } = require("mocha");
const sinon = require("sinon");
const rewire = require("rewire");
const { isFinishedState } = require("../../../app/core/dispatchUtils");

describe("#getRemoteRootWorkingDir", ()=>{
  let getRemoteRootWorkingDir;
  let getIDStub;
  let getSshHostinfoStub;
  let replacePathsepStub;

  beforeEach(()=>{
    const dispatchUtils = rewire("../../../app/core/dispatchUtils.js");
    getRemoteRootWorkingDir = dispatchUtils.__get__("getRemoteRootWorkingDir");
    getIDStub = sinon.stub();
    getSshHostinfoStub = sinon.stub();
    replacePathsepStub = sinon.stub();
    dispatchUtils.__set__({
      remoteHost: { getID: getIDStub },
      getSshHostinfo: getSshHostinfoStub,
      replacePathsep: replacePathsepStub
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return the correct remote root working directory path", ()=>{
    getIDStub.withArgs("name", "example.com").returns("hostID");
    getSshHostinfoStub.withArgs("projectRootDir", "hostID").returns({
      sharedPath: "/remote/shared",
      path: "/remote/root"
    });
    replacePathsepStub
      .withArgs("/remote/root/20230101-1231")
      .returns("/remote/root/20230101-1231");
    const result = getRemoteRootWorkingDir(
      "projectRootDir",
      "20230101-1231",
      {
        host: "example.com"
      },
      false
    );
    expect(result).to.equal("/remote/root/20230101-1231");
  });

  it("should return null if the remotehostID is undefined", ()=>{
    getIDStub.withArgs("name", "example.com").returns(undefined);
    getSshHostinfoStub.withArgs("projectRootDir", "hostID").returns({
      sharedPath: "/remote/shared",
      path: "/remote/root"
    });
    replacePathsepStub
      .withArgs("/remote/root/20230101-1231")
      .returns("/remote/root/20230101-1231");
    const result = getRemoteRootWorkingDir(
      "projectRootDir",
      "20230101-1231",
      {
        host: "example.com"
      },
      false
    );
    expect(result).to.be.null;
  });

  it("should use sharedPath if the isSharedHost is true", ()=>{
    getIDStub.withArgs("name", "example.com").returns("hostID");
    getSshHostinfoStub.withArgs("projectRootDir", "hostID").returns({
      sharedPath: "/remote/shared",
      path: "/remote/root"
    });
    replacePathsepStub
      .withArgs("/remote/shared/20230101-1231")
      .returns("/remote/shared/20230101-1231");
    const result = getRemoteRootWorkingDir(
      "projectRootDir",
      "20230101-1231",
      {
        host: "example.com"
      },
      true
    );
    expect(result).to.equal("/remote/shared/20230101-1231");
  });

  it("should use remoteRoot as empty if the remoteHost is not string", ()=>{
    getIDStub.withArgs("name", "example.com").returns("hostID");
    getSshHostinfoStub.withArgs("projectRootDir", "hostID").returns({
      sharedPath: 123,
      path: 456
    });
    replacePathsepStub.withArgs("20230101-1231").returns("20230101-1231");
    const result = getRemoteRootWorkingDir(
      "projectRootDir",
      "20230101-1231",
      {
        host: "example.com"
      },
      false
    );
    expect(result).to.equal("20230101-1231");
  });
});

describe("#getRemoteWorkingDir", ()=>{
  let getRemoteWorkingDir;
  let getRemoteRootWorkingDirStub;
  let replacePathsepStub;

  beforeEach(()=>{
    const dispatchUtils = rewire("../../../app/core/dispatchUtils.js");
    getRemoteWorkingDir = dispatchUtils.__get__("getRemoteWorkingDir");
    getRemoteRootWorkingDirStub = sinon.stub();
    replacePathsepStub = sinon.stub();
    dispatchUtils.__set__({
      getRemoteRootWorkingDir: getRemoteRootWorkingDirStub,
      replacePathsep: replacePathsepStub
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return the correct remote working directory path", ()=>{
    getRemoteRootWorkingDirStub
      .withArgs("/project/root", "20230101-1231", {}, false)
      .returns("/remote/root/20230101-1231");
    replacePathsepStub.withArgs("workingDir").returns("workingDir");
    replacePathsepStub
      .withArgs("/remote/root/20230101-1231/workingDir")
      .returns("/remote/root/20230101-1231/workingDir");

    const result = getRemoteWorkingDir(
      "/project/root",
      "20230101-1231",
      "/project/root/workingDir",
      {},
      false
    );
    expect(result).to.equal("/remote/root/20230101-1231/workingDir");
  });

  it("should return null if getRemoteRootWorkingDir returns null", ()=>{
    getRemoteRootWorkingDirStub.returns(null);

    const result = getRemoteWorkingDir(
      "/project/root",
      "20230101-1234",
      "/project/root/workingDir",
      {},
      false
    );
    expect(result).to.be.null;
  });
});

describe("#isFinishedState", ()=>{
  it("should return true if the status is finished", ()=>{
    expect(isFinishedState("finished")).to.be.true;
  });

  it("should return true if the status is failed", ()=>{
    expect(isFinishedState("failed")).to.be.true;
  });

  it("should return true if the status is unknown", ()=>{
    expect(isFinishedState("unknown")).to.be.true;
  });

  it("should return false if the status is not finished, failed or unkown", ()=>{
    expect(isFinishedState("processing")).to.be.false;
  });

  it("judgement of the status should be case-sensitive", ()=>{
    expect(isFinishedState("Finished")).to.be.false;
  });

  it("should return false if the status is empty", ()=>{
    expect(isFinishedState("")).to.be.false;
  });

  it("should return false if the status is null", ()=>{
    expect(isFinishedState(null)).to.be.false;
  });

  it("should return false if the status is undefined", ()=>{
    expect(isFinishedState(undefined)).to.be.false;
  });
});

describe("#isSubComponent", ()=>{
  let isSubComponent;
  let statStub;
  let isDirectoryStub;
  let readJsonGreedyStub;

  beforeEach(()=>{
    const dispatchUtils = rewire("../../../app/core/dispatchUtils.js");
    isSubComponent = dispatchUtils.__get__("isSubComponent");
    statStub = sinon.stub();
    isDirectoryStub = sinon.stub();
    readJsonGreedyStub = sinon.stub();
    dispatchUtils.__set__({
      fs: {
        stat: statStub
      },
      readJsonGreedy: readJsonGreedyStub
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return true if the component is a subcomponent", async ()=>{
    statStub
      .withArgs("/componentDir")
      .resolves({ isDirectory: isDirectoryStub });
    isDirectoryStub.returns(true);
    readJsonGreedyStub
      .withArgs("/componentDir/cmp.wheel.json")
      .resolves({ subComponent: true });
    const result = await isSubComponent("/componentDir");
    expect(result).to.be.true;
  });

  it("should return false if the component is not a subcomponent", async ()=>{
    statStub
      .withArgs("/componentDir")
      .resolves({ isDirectory: isDirectoryStub });
    isDirectoryStub.returns(true);
    readJsonGreedyStub
      .withArgs("/componentDir/cmp.wheel.json")
      .resolves({ subComponent: false });
    const result = await isSubComponent("/componentDir");
    expect(result).to.be.false;
  });

  it("should return false if the target is not directory", async ()=>{
    statStub
      .withArgs("/componentDir")
      .resolves({ isDirectory: isDirectoryStub });
    isDirectoryStub.returns(false);
    readJsonGreedyStub
      .withArgs("/componentDir/cmp.wheel.json")
      .resolves({ subComponent: true });
    const result = await isSubComponent("/componentDir");
    expect(result).to.be.false;
  });

  it("should return false if the ENOENT error is occurred when trying to read the target", async ()=>{
    const error = new Error();
    error.code = "ENOENT";
    statStub.withArgs("/invalidDir").throws(error);
    isDirectoryStub.returns(true);
    readJsonGreedyStub
      .withArgs("/invalidDir/cmp.wheel.json")
      .resolves({ subComponent: true });
    const result = await isSubComponent("/invalidDir");
    expect(result).to.be.false;
  });

  it("should throw error if another error is occurred when trying to read the target", async ()=>{
    const error = new Error();
    error.code = "EACCES";
    statStub.withArgs("/componentDir").throws(error);
    isDirectoryStub.returns(true);
    readJsonGreedyStub
      .withArgs("/componentDir/cmp.wheel.json")
      .resolves({ subComponent: true });
    await expect(isSubComponent("/componentDir"))
      .to.be.rejectedWith(Error)
      .and.eventually.satisfy((err)=>err.code === "EACCES");
  });

  it("should return false if the ENOENT error is occurred when trying to read json of subcompoment", async ()=>{
    statStub
      .withArgs("/componentDir")
      .resolves({ isDirectory: isDirectoryStub });
    isDirectoryStub.returns(true);
    const error = new Error();
    error.code = "ENOENT";
    readJsonGreedyStub.withArgs("/componentDir/cmp.wheel.json").throws(error);
    const result = await isSubComponent("/componentDir");
    expect(result).to.be.false;
  });

  it("should throw error if another error is occurred when trying to read json of subcompoment", async ()=>{
    statStub
      .withArgs("/componentDir")
      .resolves({ isDirectory: isDirectoryStub });
    isDirectoryStub.returns(true);
    const error = new Error();
    error.code = "EACCES";
    readJsonGreedyStub.withArgs("/componentDir/cmp.wheel.json").throws(error);
    await expect(isSubComponent("/componentDir"))
      .to.be.rejectedWith(Error)
      .and.eventually.satisfy((err)=>err.code === "EACCES");
  });
});
