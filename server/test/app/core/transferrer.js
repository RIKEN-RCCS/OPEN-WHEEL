/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */

import { expect } from "chai";
import sinon from "sinon";
import { stageIn, stageOut, _internal } from "../../../app/core/transferrer.js";
describe("#stageIn", ()=>{
  let setTaskStateStub;
  let getSshHostinfoStub;
  let replaceCRLFStub;
  let addXStub;
  let registerStub;

  beforeEach(()=>{
    setTaskStateStub = sinon.stub(_internal, "setTaskState").resolves();
    getSshHostinfoStub = sinon.stub(_internal, "getSshHostinfo").returns({ host: "mock-host" });
    replaceCRLFStub = sinon.stub(_internal, "replaceCRLF").resolves();
    addXStub = sinon.stub(_internal, "addX").resolves();
    registerStub = sinon.stub(_internal, "register").resolves("register-result");
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should set stage-in state, convert CRLF, add exec permission, and register file transfer", async ()=>{
    const task = {
      projectRootDir: "/dummy/project",
      remotehostID: "host-123",
      workingDir: "/local/work/dir",
      script: "execute.sh",
      remoteWorkingDir: "/remote/work/dir/sub"
    };

    const result = await stageIn(task);

    expect(setTaskStateStub.calledOnceWithExactly(task, "stage-in")).to.be.true;
    expect(getSshHostinfoStub.calledOnceWithExactly("/dummy/project", "host-123")).to.be.true;
    expect(replaceCRLFStub.calledOnceWithExactly("/local/work/dir/execute.sh")).to.be.true;
    expect(addXStub.calledOnceWithExactly("/local/work/dir/execute.sh")).to.be.true;
    expect(registerStub.calledOnceWithExactly(
      { host: "mock-host" },
      task,
      "send",
      ["/local/work/dir"],
      "/remote/work/dir/"
    )).to.be.true;
    expect(result).to.equal("register-result");
  });
});

describe("#stageOut", ()=>{
  let setTaskStateStub;
  let getSshHostinfoStub;
  let needDownloadStub;
  let makeDownloadRecipeStub;
  let registerStub;
  let getSshStub;
  let sshExecStub;
  let getLoggerStub;
  let loggerDebugStub;
  let loggerTraceStub;
  let loggerWarnStub;

  beforeEach(()=>{
    setTaskStateStub = sinon.stub(_internal, "setTaskState");
    getSshHostinfoStub = sinon.stub(_internal, "getSshHostinfo");
    needDownloadStub = sinon.stub(_internal, "needDownload");
    makeDownloadRecipeStub = sinon.stub(_internal, "makeDownloadRecipe");
    registerStub = sinon.stub(_internal, "register");
    sshExecStub = sinon.stub();
    getSshStub = sinon.stub(_internal, "getSsh").returns({ exec: sshExecStub });
    loggerDebugStub = sinon.stub();
    loggerTraceStub = sinon.stub();
    loggerWarnStub = sinon.stub();
    getLoggerStub = sinon.stub(_internal, "getLogger").returns({ debug: loggerDebugStub, trace: loggerTraceStub, warn: loggerWarnStub });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return immediately if task.state is not 'finished'", async ()=>{
    const task = {
      state: "running",
      projectRootDir: "/path/to/project",
      remotehostID: "hostID"
    };

    await stageOut(task);

    expect(setTaskStateStub.called).to.be.false;
    expect(getSshHostinfoStub.called).to.be.false;
    expect(registerStub.called).to.be.false;
  });

  it("should set task state to 'stage-out' and then restore it, if state is 'finished'", async ()=>{
    const task = {
      state: "finished",
      projectRootDir: "/project",
      remotehostID: "hostA",
      outputFiles: [],
      ID: "someTaskID"
    };
    getSshHostinfoStub.returns({ host: "dummyHost" });

    await stageOut(task);

    expect(setTaskStateStub.callCount).to.equal(2);
    expect(setTaskStateStub.firstCall.args).to.deep.equal([task, "stage-out"]);
    expect(setTaskStateStub.secondCall.args).to.deep.equal([task, "finished"]);
  });

  it("should skip download if outputFiles is empty", async ()=>{
    const task = {
      state: "finished",
      projectRootDir: "/project",
      remotehostID: "hostA",
      outputFiles: [],
      ID: "someTaskID"
    };
    getSshHostinfoStub.returns({ host: "dummyHost" });

    await stageOut(task);

    expect(needDownloadStub.called).to.be.false;
    expect(makeDownloadRecipeStub.called).to.be.false;
    expect(registerStub.called).to.be.false;
  });

  it("should download files only if needDownload() returns true", async ()=>{
    const task = {
      state: "finished",
      projectRootDir: "/project",
      remotehostID: "hostA",
      workingDir: "/local/workingDir",
      remoteWorkingDir: "/remote/workingDir",
      outputFiles: [
        { name: "file1.txt" },
        { name: "file2.txt" }
      ],
      ID: "taskID"
    };
    getSshHostinfoStub.returns({ host: "dummyHost" });
    needDownloadStub.onFirstCall().resolves(true);
    needDownloadStub.onSecondCall().resolves(false);
    makeDownloadRecipeStub.returns({ src: "/remote/workingDir/file1.txt", dst: "/local/workingDir" });

    await stageOut(task);

    expect(makeDownloadRecipeStub.calledOnce).to.be.true;
    expect(registerStub.calledOnce).to.be.true;
    const registerArgs = registerStub.firstCall.args;
    expect(registerArgs[0]).to.deep.equal({ host: "dummyHost" });
    expect(registerArgs[1]).to.equal(task);
    expect(registerArgs[2]).to.equal("recv");
    expect(registerArgs[3]).to.deep.equal(["/remote/workingDir/file1.txt"]);
    expect(registerArgs[4]).to.equal("/local/workingDir");
  });

  it("should handle multiple files with the same dst as one register call", async ()=>{
    const task = {
      state: "finished",
      projectRootDir: "/project",
      remotehostID: "hostA",
      workingDir: "/local/dir",
      remoteWorkingDir: "/remote/dir",
      outputFiles: [
        { name: "a.bin" },
        { name: "b.bin" }
      ],
      ID: "taskID"
    };
    getSshHostinfoStub.returns({ host: "dummyHost" });
    needDownloadStub.resolves(true);
    makeDownloadRecipeStub.onFirstCall().returns({ src: "/remote/dir/a.bin", dst: "/local/dir" });
    makeDownloadRecipeStub.onSecondCall().returns({ src: "/remote/dir/b.bin", dst: "/local/dir" });

    await stageOut(task);

    expect(registerStub.calledOnce).to.be.true;
    const args = registerStub.firstCall.args;
    expect(args[3]).to.deep.equal(["/remote/dir/a.bin", "/remote/dir/b.bin"]);
  });

  it("should pass exclude options to register only for the included files", async ()=>{
    const task = {
      state: "finished",
      projectRootDir: "/project",
      remotehostID: "hostA",
      workingDir: "/local/dir",
      remoteWorkingDir: "/remote/dir",
      outputFiles: [
        { name: "main.out" }
      ],
      exclude: ["*.tmp", "*.log"],
      include: ["extra.dat", "data/another.out"],
      ID: "taskID"
    };
    getSshHostinfoStub.returns({ host: "dummyHost" });
    needDownloadStub.resolves(true);
    makeDownloadRecipeStub.onFirstCall().returns({ src: "/remote/dir/main.out", dst: "/local/dir" });
    makeDownloadRecipeStub.onSecondCall().returns({ src: "/remote/dir/extra.dat", dst: "/local/dir" });
    makeDownloadRecipeStub.onThirdCall().returns({ src: "/remote/dir/data/another.out", dst: "/local/dir" });

    await stageOut(task);

    expect(registerStub.callCount).to.equal(2);
    const call1 = registerStub.getCall(0).args;
    expect(call1[5]).to.be.undefined;
    const call2 = registerStub.getCall(1).args;
    expect(call2[5]).to.deep.equal(["--exclude=*.tmp", "--exclude=*.log"]);
  });

  it("should do remote cleanup if doCleanup is true, ignoring any errors", async ()=>{
    const task = {
      state: "finished",
      projectRootDir: "/proj",
      remotehostID: "hostB",
      workingDir: "/local",
      remoteWorkingDir: "/remote",
      outputFiles: [],
      doCleanup: true,
      ID: "X000"
    };
    getSshHostinfoStub.returns({ host: "dummyHost" });
    sshExecStub.rejects(new Error("Some SSH error"));

    await stageOut(task);

    expect(getSshStub.calledOnceWithExactly("/proj", "hostB")).to.be.true;
    expect(sshExecStub.calledOnceWithExactly("rm -fr /remote")).to.be.true;
    expect(setTaskStateStub.secondCall.args).to.deep.equal([task, "finished"]);
  });

  it("should skip remote cleanup if doCleanup is false", async ()=>{
    const task = {
      state: "finished",
      projectRootDir: "/proj",
      remotehostID: "hostB",
      workingDir: "/local",
      remoteWorkingDir: "/remote",
      outputFiles: [],
      doCleanup: false,
      ID: "X001"
    };
    getSshHostinfoStub.returns({ host: "dummyHost" });

    await stageOut(task);

    expect(getSshStub.called).to.be.false;
    expect(sshExecStub.called).to.be.false;
  });
});
