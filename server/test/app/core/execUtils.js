/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */

import { expect } from "chai";
import sinon from "sinon";
import { setTaskState, needDownload, formatSrcFilename, makeDownloadRecipe, createStatusFile, createBulkStatusFile, _internal } from "../../../app/core/execUtils.js";
describe("#setTaskState", ()=>{
  let getLoggerStub;
  let writeComponentJsonStub;
  let eventEmitters;
  let ee;

  beforeEach(()=>{
    getLoggerStub = sinon.stub(_internal, "getLogger").returns({ trace: sinon.stub() });
    writeComponentJsonStub = sinon.stub(_internal, "writeComponentJson").resolves();
    ee = { emit: sinon.stub() };
    eventEmitters = new Map();
    eventEmitters.set("testProjectRootDir", ee);
    sinon.stub(_internal, "eventEmitters").value(eventEmitters);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should set the task state, write component json, and emit events", async ()=>{
    const task = {
      projectRootDir: "testProjectRootDir",
      workingDir: "/dummy/working/dir",
      ID: "task123",
      state: "oldState"
    };
    const newState = "newState";

    await setTaskState(task, newState);

    expect(task.state).to.equal(newState);
    expect(getLoggerStub.calledOnceWithExactly("testProjectRootDir")).to.be.true;
    expect(getLoggerStub().trace.calledWithMatch("TaskStateList: task123's state is changed to newState")).to.be.true;
    expect(writeComponentJsonStub.calledOnceWithExactly("testProjectRootDir", "/dummy/working/dir", task, true)).to.be.true;
    expect(ee.emit.callCount).to.equal(2);
    expect(ee.emit.firstCall.args).to.deep.equal(["taskStateChanged", task]);
    expect(ee.emit.secondCall.args).to.deep.equal(["componentStateChanged", task]);
  });
});

describe("#needDownload", ()=>{
  let isSameRemoteHostStub;

  beforeEach(()=>{
    isSameRemoteHostStub = sinon.stub(_internal, "isSameRemoteHost");
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return false if outputFile.dst is empty", async ()=>{
    const outputFile = { dst: [] };
    const result = await needDownload("/dummy/project", "dummyComponent", outputFile);
    expect(result).to.be.false;
    expect(isSameRemoteHostStub.notCalled).to.be.true;
  });

  it("should return false if all destinations are the same remote host", async ()=>{
    const outputFile = {
      dst: [
        { dstNode: "hostA" },
        { dstNode: "hostB" }
      ]
    };
    isSameRemoteHostStub.resolves(true);

    const result = await needDownload("/dummy/project", "dummyComponent", outputFile);
    expect(result).to.be.false;
    expect(isSameRemoteHostStub.callCount).to.equal(2);
  });

  it("should return true if at least one destination is different remote host", async ()=>{
    const outputFile = {
      dst: [
        { dstNode: "hostA" },
        { dstNode: "hostB" }
      ]
    };
    isSameRemoteHostStub.onCall(0).resolves(true);
    isSameRemoteHostStub.onCall(1).resolves(false);

    const result = await needDownload("/dummy/project", "dummyComponent", outputFile);
    expect(result).to.be.true;
    expect(isSameRemoteHostStub.callCount).to.equal(2);
  });

  it("should reject if isSameRemoteHost rejects", async ()=>{
    const outputFile = {
      dst: [
        { dstNode: "hostA" }
      ]
    };
    isSameRemoteHostStub.rejects(new Error("some error"));

    try {
      await needDownload("/dummy/project", "dummyComponent", outputFile);
      expect.fail("Expected needDownload to reject, but it did not");
    } catch (err) {
      expect(err).to.be.an("Error");
      expect(err.message).to.equal("some error");
    }
    expect(isSameRemoteHostStub.calledOnce).to.be.true;
  });
});

describe("#formatSrcFilename", ()=>{
  let replacePathsepStub;

  beforeEach(()=>{
    replacePathsepStub = sinon.stub(_internal, "replacePathsep");
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return joined path with '/*' if filename ends with '/", ()=>{
    replacePathsepStub.returns("convertedDir");
    const result = formatSrcFilename("/home/user", "mydata/");
    expect(replacePathsepStub.calledOnceWithExactly("mydata/")).to.be.true;
    expect(result).to.equal("/home/user/convertedDir/*");
  });

  it("should return joined path with '/*' if filename ends with backslash '\\", ()=>{
    replacePathsepStub.returns("convertedBackslash");
    const result = formatSrcFilename("/home/user", "mydata\\");
    expect(replacePathsepStub.calledOnceWithExactly("mydata\\")).to.be.true;
    expect(result).to.equal("/home/user/convertedBackslash/*");
  });

  it("should return joined path without '/*' if filename does not end with slash/backslash", ()=>{
    const result = formatSrcFilename("/home/user", "file.txt");
    expect(replacePathsepStub.notCalled).to.be.true;
    expect(result).to.equal("/home/user/file.txt");
  });
});

describe("#makeDownloadRecipe", ()=>{
  let getLoggerStub;
  let traceStub;

  beforeEach(()=>{
    traceStub = sinon.stub();
    getLoggerStub = sinon.stub(_internal, "getLogger").returns({ trace: traceStub });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return { src, dst: workingDir } if the filename has no slash", ()=>{
    const projectRootDir = "/example/project";
    const filename = "file.txt";
    const remoteWorkingDir = "/remote/workdir";
    const workingDir = "/local/workdir";

    const result = makeDownloadRecipe(projectRootDir, filename, remoteWorkingDir, workingDir);

    expect(result.src).to.equal("/remote/workdir/file.txt");
    expect(result.dst).to.equal("/local/workdir");
    expect(getLoggerStub.calledOnceWithExactly(projectRootDir)).to.be.true;
    expect(traceStub.calledOnce).to.be.true;
    expect(traceStub.args[0][0]).to.include(
      "file.txt will be downloaded to component root directory"
    );
  });

  it("should return { src, dst } with subdirectory if the filename contains slash", ()=>{
    const projectRootDir = "/example/project";
    const filename = "some/dir/file.txt";
    const remoteWorkingDir = "/remote/workdir";
    const workingDir = "/local/workdir";

    const result = makeDownloadRecipe(projectRootDir, filename, remoteWorkingDir, workingDir);

    expect(result.src).to.equal("/remote/workdir/some/dir/file.txt");
    expect(result.dst).to.equal("/local/workdir/some/dir/file.txt");
    expect(getLoggerStub.calledOnceWithExactly(projectRootDir)).to.be.true;
    expect(traceStub.calledOnce).to.be.true;
    expect(traceStub.args[0][0]).to.include(
      "some/dir/file.txt will be downloaded to /local/workdir/some/dir/file.txt"
    );
  });

  it("should handle trailing slash in the filename and append wildcard", ()=>{
    const projectRootDir = "/example/project";
    const filename = "some/dir/";
    const remoteWorkingDir = "/remote/workdir";
    const workingDir = "/local/workdir";

    const result = makeDownloadRecipe(projectRootDir, filename, remoteWorkingDir, workingDir);

    expect(result.src).to.equal("/remote/workdir/some/dir/*");
    expect(result.dst).to.equal("/local/workdir/some/dir/*");
    expect(getLoggerStub.calledOnceWithExactly(projectRootDir)).to.be.true;
    expect(traceStub.calledOnce).to.be.true;
    expect(traceStub.args[0][0]).to.include(
      "some/dir/ will be downloaded to /local/workdir/some/dir/*"
    );
  });
});

describe("#createStatusFile", ()=>{
  let writeFileStub;

  beforeEach(()=>{
    writeFileStub = sinon.stub(_internal.fs, "writeFile").resolves();
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should create a status file with correct content", async ()=>{
    const task = {
      workingDir: "/test/workingDir",
      state: "RUNNING",
      rt: 0,
      jobStatus: "SUBMITTED"
    };

    await createStatusFile(task);

    expect(writeFileStub.calledOnce).to.be.true;
    const [actualPath, actualContent] = writeFileStub.firstCall.args;
    expect(actualPath).to.equal("/test/workingDir/status.wheel.txt");
    expect(actualContent).to.equal("RUNNING\n0\nSUBMITTED");
  });

  it("should throw an error if fs.writeFile fails", async ()=>{
    writeFileStub.rejects(new Error("Write failed"));

    const task = {
      workingDir: "/error/workingDir",
      state: "FAILED",
      rt: 1,
      jobStatus: "ERROR"
    };

    try {
      await createStatusFile(task);
      expect.fail("Expected createStatusFile to reject, but it resolved");
    } catch (err) {
      expect(err.message).to.equal("Write failed");
    }
  });
});

describe("#createBulkStatusFile", ()=>{
  let writeFileStub;
  let pathResolveStub;

  beforeEach(()=>{
    writeFileStub = sinon.stub(_internal.fs, "writeFile").resolves();
    pathResolveStub = sinon.stub(_internal.path, "resolve");
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should write correct content for multiple bulk iterations", async ()=>{
    pathResolveStub.returns("/fake/dir/subjob_status.txt");

    const task = {
      workingDir: "/fake/dir",
      startBulkNumber: 2,
      endBulkNumber: 3
    };
    const rtList = {
      2: "RTValue2",
      3: "RTValue3"
    };
    const jobStatusList = {
      2: "JOBSTATUS2",
      3: "JOBSTATUS3"
    };

    await createBulkStatusFile(task, rtList, jobStatusList);

    expect(pathResolveStub.calledOnceWithExactly("/fake/dir", "subjob_status.wheel.txt")).to.be.true;
    const expectedContent
      = "RT_2=RTValue2\nJOBSTATUS_2=JOBSTATUS2\n"
        + "RT_3=RTValue3\nJOBSTATUS_3=JOBSTATUS3\n";
    expect(writeFileStub.calledOnceWithExactly("/fake/dir/subjob_status.txt", expectedContent)).to.be.true;
  });

  it("should write empty content if startBulkNumber > endBulkNumber", async ()=>{
    pathResolveStub.returns("/fake/dir/subjob_status.txt");

    const task = {
      workingDir: "/fake/dir",
      startBulkNumber: 5,
      endBulkNumber: 3
    };
    const rtList = {};
    const jobStatusList = {};

    await createBulkStatusFile(task, rtList, jobStatusList);

    expect(writeFileStub.calledOnceWithExactly("/fake/dir/subjob_status.txt", "")).to.be.true;
  });
});
