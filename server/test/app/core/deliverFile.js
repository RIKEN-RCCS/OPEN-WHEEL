/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import { expect } from "chai";
import sinon from "sinon";
import { rsyncExcludeOptionOfWheelSystemFiles } from "../../../app/db/db.js";
import { deliverFile, deliverFilesOnRemote, deliverFilesFromRemote, _internal } from "../../../app/core/deliverFile.js";
describe("#deliverFile", ()=>{
  let lstatStub, copyStub, removeStub, ensureSymlinkStub, statsMock;

  beforeEach(()=>{
    lstatStub = sinon.stub(_internal.fs, "lstat");
    copyStub = sinon.stub(_internal.fs, "copy");
    removeStub = sinon.stub(_internal.fs, "remove");
    ensureSymlinkStub = sinon.stub(_internal.fs, "ensureSymlink");
    statsMock = { isDirectory: sinon.stub() };
  });
  afterEach(()=>{
    sinon.restore();
  });

  it("should deliver directory with symlink if not forced to copy", async ()=>{
    statsMock.isDirectory.returns(true);
    lstatStub.resolves(statsMock);
    removeStub.resolves();
    ensureSymlinkStub.resolves();

    const src = "/path/to/srcDir";
    const dst = "/path/to/dstDir";

    const result = await deliverFile(src, dst, false);

    expect(lstatStub.calledOnceWithExactly(src)).to.be.true;
    expect(removeStub.calledOnceWithExactly(dst)).to.be.true;
    expect(ensureSymlinkStub.calledOnceWithExactly(src, dst, "dir")).to.be.true;
    expect(result).to.deep.equal({
      type: "link-dir",
      src,
      dst
    });
  });

  it("should deliver file with symlink if not forced to copy", async ()=>{
    statsMock.isDirectory.returns(false);
    lstatStub.resolves(statsMock);
    removeStub.resolves();
    ensureSymlinkStub.resolves();

    const src = "/path/to/srcFile";
    const dst = "/path/to/dstFile";

    const result = await deliverFile(src, dst, false);

    expect(lstatStub.calledOnceWithExactly(src)).to.be.true;
    expect(removeStub.calledOnceWithExactly(dst)).to.be.true;
    expect(ensureSymlinkStub.calledOnceWithExactly(src, dst, "file")).to.be.true;
    expect(result).to.deep.equal({
      type: "link-file",
      src,
      dst
    });
  });

  it("should deliver by copying if forceCopy is true", async ()=>{
    statsMock.isDirectory.returns(true);
    lstatStub.resolves(statsMock);
    copyStub.resolves();

    const src = "/path/to/srcAny";
    const dst = "/path/to/dstAny";

    const result = await deliverFile(src, dst, true);

    expect(removeStub.notCalled).to.be.true;
    expect(ensureSymlinkStub.notCalled).to.be.true;
    expect(copyStub.calledOnceWithExactly(src, dst, { overwrite: true })).to.be.true;
    expect(result).to.deep.equal({
      type: "copy",
      src,
      dst
    });
  });

  it("should fallback to copy when ensureSymlink throws EPERM error", async ()=>{
    statsMock.isDirectory.returns(false);
    lstatStub.resolves(statsMock);
    removeStub.resolves();
    const epermError = new Error("EPERM error");
    epermError.code = "EPERM";
    ensureSymlinkStub.rejects(epermError);
    copyStub.resolves();

    const src = "/dir/src";
    const dst = "/dir/dst";

    const result = await deliverFile(src, dst, false);

    expect(removeStub.calledOnceWithExactly(dst)).to.be.true;
    expect(ensureSymlinkStub.calledOnce).to.be.true;
    expect(copyStub.calledOnceWithExactly(src, dst, { overwrite: false })).to.be.true;
    expect(result).to.deep.equal({
      type: "copy",
      src,
      dst
    });
  });

  it("should reject promise if ensureSymlink throws error with non-EPERM code", async ()=>{
    statsMock.isDirectory.returns(false);
    lstatStub.resolves(statsMock);
    removeStub.resolves();
    const otherError = new Error("Some other error");
    otherError.code = "EACCES";
    ensureSymlinkStub.rejects(otherError);
    copyStub.resolves();

    const src = "/some/src";
    const dst = "/some/dst";

    try {
      await deliverFile(src, dst, false);
      expect.fail("Expected deliverFile to reject, but it resolved");
    } catch (err) {
      expect(err).to.equal(otherError);
    }

    expect(removeStub.calledOnceWithExactly(dst)).to.be.true;
    expect(ensureSymlinkStub.calledOnce).to.be.true;
    expect(copyStub.notCalled).to.be.true;
  });
});

describe("#deliverFilesOnRemote", ()=>{
  //eslint-disable-next-line no-unused-vars
  let getLoggerStub;
  let loggerWarnStub;
  let loggerDebugStub;
  let getSshStub;
  let sshExecStub;

  beforeEach(()=>{
    loggerWarnStub = sinon.stub();
    loggerDebugStub = sinon.stub();
    getLoggerStub = sinon.stub(_internal, "getLogger").returns({ warn: loggerWarnStub, debug: loggerDebugStub });
    sshExecStub = sinon.stub();
    getSshStub = sinon.stub(_internal, "getSsh").returns({ exec: sshExecStub });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return null and log a warning if recipe.onSameRemote is false", async ()=>{
    const recipe = {
      onSameRemote: false,
      projectRootDir: "/dummy/dir",
      remotehostID: "hostID"
    };
    const result = await deliverFilesOnRemote(recipe);

    expect(result).to.be.null;
    expect(loggerWarnStub.calledOnceWithExactly("deliverFilesOnRemote must be called with onSameRemote flag")).to.be.true;
    expect(getSshStub.notCalled).to.be.true;
  });

  it("should execute ln -sf if forceCopy is false and ssh.exec returns 0 (success)", async ()=>{
    const recipe = {
      onSameRemote: true,
      forceCopy: false,
      projectRootDir: "/project/test",
      remotehostID: "testHostID",
      srcRoot: "/remote/src",
      srcName: "fileA",
      dstRoot: "/remote/dest",
      dstName: "fileB"
    };
    sshExecStub.resolves(0);

    const result = await deliverFilesOnRemote(recipe);

    const expectedCmdPart = "ln -sf";
    expect(sshExecStub.callCount).to.equal(1);
    const calledCmd = sshExecStub.getCall(0).args[0];
    expect(calledCmd).to.include(expectedCmdPart);
    expect(loggerDebugStub.calledWithExactly("execute on remote", sinon.match.string)).to.be.true;
    expect(result).to.deep.equal({
      type: "copy",
      src: "/remote/src/fileA",
      dst: "/remote/dest/fileB"
    });
  });

  it("should execute cp -r if forceCopy is true and ssh.exec returns 0 (success)", async ()=>{
    const recipe = {
      onSameRemote: true,
      forceCopy: true,
      projectRootDir: "/project/copy",
      remotehostID: "copyHostID",
      srcRoot: "/remote/src2",
      srcName: "folderA",
      dstRoot: "/remote/dest2",
      dstName: "folderB"
    };
    sshExecStub.resolves(0);

    const result = await deliverFilesOnRemote(recipe);

    const expectedCmdPart = "cp -r";
    expect(sshExecStub.callCount).to.equal(1);
    const calledCmd = sshExecStub.getCall(0).args[0];
    expect(calledCmd).to.include(expectedCmdPart);
    expect(result).to.deep.equal({
      type: "copy",
      src: "/remote/src2/folderA",
      dst: "/remote/dest2/folderB"
    });
  });

  it("should throw an error if ssh.exec returns a non-zero code", async ()=>{
    const recipe = {
      onSameRemote: true,
      forceCopy: false,
      projectRootDir: "/project/fail",
      remotehostID: "failHostID",
      srcRoot: "/remote/srcX",
      srcName: "badfile",
      dstRoot: "/remote/destX",
      dstName: "destfile"
    };
    sshExecStub.resolves(1);

    try {
      await deliverFilesOnRemote(recipe);
      expect.fail("Expected deliverFilesOnRemote to throw, but it did not");
    } catch (err) {
      expect(err).to.be.instanceOf(Error);
      expect(err.message).to.equal("deliver file on remote failed");
      expect(loggerWarnStub.calledWithExactly("deliver file on remote failed", 1)).to.be.true;
      expect(err).to.have.property("rt", 1);
    }
  });
});

describe("#deliverFilesFromRemote", ()=>{
  //eslint-disable-next-line no-unused-vars
  let getLoggerStub;
  let loggerWarnStub;
  //eslint-disable-next-line no-unused-vars
  let getSshStub;
  let sshRecvStub;

  beforeEach(()=>{
    loggerWarnStub = sinon.stub();
    getLoggerStub = sinon.stub(_internal, "getLogger").returns({ warn: loggerWarnStub });
    sshRecvStub = sinon.stub();
    getSshStub = sinon.stub(_internal, "getSsh").returns({ recv: sshRecvStub });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return null and log a warning if recipe.remoteToLocal is false", async ()=>{
    const recipe = {
      projectRootDir: "/dummy/project",
      remoteToLocal: false
    };

    const result = await deliverFilesFromRemote(recipe);

    expect(result).to.be.null;
    expect(loggerWarnStub.calledOnceWithExactly("deliverFilesFromRemote must be called with remoteToLocal flag")).to.be.true;
  });

  it("should reject with an error if ssh.recv throws an error", async ()=>{
    const recipe = {
      projectRootDir: "/dummy/project",
      remoteToLocal: true,
      remotehostID: "host-001",
      srcRoot: "/remote/src",
      srcName: "fileA.txt",
      dstRoot: "/local/dst",
      dstName: "fileA.txt"
    };
    const fakeError = new Error("recv failed");
    sshRecvStub.rejects(fakeError);

    try {
      await deliverFilesFromRemote(recipe);
      expect.fail("Expected deliverFilesFromRemote to reject, but it resolved");
    } catch (err) {
      expect(err).to.equal(fakeError);
    }
  });

  it("should call ssh.recv and return an object if successful", async ()=>{
    const recipe = {
      projectRootDir: "/dummy/project",
      remoteToLocal: true,
      remotehostID: "host-002",
      srcRoot: "/remote/src",
      srcName: "fileB.dat",
      dstRoot: "/local/dst",
      dstName: "fileB.dat"
    };
    sshRecvStub.resolves();

    const result = await deliverFilesFromRemote(recipe);

    expect(result).to.deep.equal({
      type: "copy",
      src: "/remote/src/fileB.dat",
      dst: "/local/dst/fileB.dat"
    });
    expect(sshRecvStub.calledOnceWithExactly(
      ["/remote/src/fileB.dat"],
      "/local/dst/fileB.dat",
      ["-vv", ...rsyncExcludeOptionOfWheelSystemFiles]
    )).to.be.true;
  });
});
