/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import { expect } from "chai";
import sinon from "sinon";
import path from "path";
import fs from "fs-extra";
import os from "os";
import { rsyncExcludeOptionOfWheelSystemFiles } from "../../../app/db/db.js";
import { deliverFile, deliverFilesOnRemote, deliverFilesFromRemote, deliverFilesLocalToRemoteShared, deliverFilesRemoteToLocalShared, deliverFilesBetweenRemotes, _internal } from "../../../app/core/deliverFile.js";
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

describe("#deliverFilesLocalToRemoteShared", ()=>{
  //eslint-disable-next-line no-unused-vars
  let getLoggerStub;
  let loggerWarnStub;
  let loggerDebugStub;

  let getSshStub;
  let sshExecStub;

  beforeEach(()=>{
    loggerWarnStub = sinon.stub();
    loggerDebugStub = sinon.stub();
    getLoggerStub = sinon.stub(_internal, "getLogger").returns({
      warn: loggerWarnStub,
      debug: loggerDebugStub
    });
    sshExecStub = sinon.stub();
    getSshStub = sinon.stub(_internal, "getSsh").returns({ exec: sshExecStub });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return null and warn if localToRemoteShared flag is not set", async ()=>{
    const recipe = {
      localToRemoteShared: false,
      projectRootDir: "/dummy/dir",
      dstRemotehostID: "hostID"
    };
    const result = await deliverFilesLocalToRemoteShared(recipe);

    expect(result).to.be.null;
    expect(loggerWarnStub.calledOnceWithExactly("deliverFilesLocalToRemoteShared must be called with localToRemoteShared flag")).to.be.true;
    expect(getSshStub.notCalled).to.be.true;
  });

  it("should execute ln -sf command on remote and return success", async ()=>{
    const recipe = {
      localToRemoteShared: true,
      projectRootDir: "/dummy/project",
      dstRemotehostID: "hostID",
      srcRoot: "/mnt/shared/project",
      srcName: "output.txt",
      dstRoot: "/work/20240224-1234/taskB",
      dstName: "input.txt",
      forceCopy: false
    };
    sshExecStub.resolves(0);

    const result = await deliverFilesLocalToRemoteShared(recipe);

    expect(sshExecStub.callCount).to.equal(1);
    const calledCmd = sshExecStub.getCall(0).args[0];
    expect(calledCmd).to.include("ln -sf");
    expect(result).to.deep.equal({
      type: "link-via-shared",
      src: "/mnt/shared/project/output.txt",
      dst: "/work/20240224-1234/taskB/input.txt"
    });
  });

  it("should reject if ssh.exec returns non-zero", async ()=>{
    const recipe = {
      localToRemoteShared: true,
      projectRootDir: "/dummy/project",
      dstRemotehostID: "hostID",
      srcRoot: "/mnt/shared/project",
      srcName: "output.txt",
      dstRoot: "/work/taskB",
      dstName: "input.txt",
      forceCopy: false
    };
    sshExecStub.resolves(1);

    try {
      await deliverFilesLocalToRemoteShared(recipe);
      expect.fail("Expected deliverFilesLocalToRemoteShared to throw");
    } catch (err) {
      expect(err).to.be.instanceOf(Error);
      expect(err.message).to.equal("deliver file from localhost to remote via shared storage failed");
      expect(err.rt).to.equal(1);
    }
  });
});

describe("#deliverFilesRemoteToLocalShared", ()=>{
  //eslint-disable-next-line no-unused-vars
  let getLoggerStub;
  let loggerWarnStub;
  let loggerDebugStub;

  beforeEach(()=>{
    loggerWarnStub = sinon.stub();
    loggerDebugStub = sinon.stub();
    getLoggerStub = sinon.stub(_internal, "getLogger").returns({
      warn: loggerWarnStub,
      debug: loggerDebugStub
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return null and warn if remoteToLocalShared flag is not set", async ()=>{
    const recipe = {
      remoteToLocalShared: false,
      projectRootDir: "/dummy/dir"
    };
    const result = await deliverFilesRemoteToLocalShared(recipe);

    expect(result).to.be.null;
    expect(loggerWarnStub.calledOnceWithExactly("deliverFilesRemoteToLocalShared must be called with remoteToLocalShared flag")).to.be.true;
  });
});

describe("#deliverFilesLocalToRemoteShared (with real symlink)", ()=>{
  let tempDir;
  let sharedDir;
  let remoteWorkDir;
  let srcFile;

  //eslint-disable-next-line no-unused-vars
  let getLoggerStub;
  let loggerDebugStub;

  beforeEach(async ()=>{
    loggerDebugStub = sinon.stub();
    getLoggerStub = sinon.stub(_internal, "getLogger").returns({
      warn: sinon.stub(),
      debug: loggerDebugStub
    });

    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "wheel-test-"));
    sharedDir = path.join(tempDir, "shared");
    remoteWorkDir = path.join(tempDir, "remote-work");

    await fs.ensureDir(sharedDir);
    await fs.ensureDir(remoteWorkDir);

    srcFile = path.join(sharedDir, "source.txt");
    await fs.writeFile(srcFile, "test content for local to remote");
  });

  afterEach(async ()=>{
    sinon.restore();
    if (tempDir) {
      await fs.remove(tempDir);
    }
  });

  it("should create symlink on remote via SSH and verify contents", async ()=>{
    const sshExecStub = sinon.stub().resolves(0);
    const getSshStub = sinon.stub(_internal, "getSsh").returns({ exec: sshExecStub });

    const recipe = {
      localToRemoteShared: true,
      projectRootDir: "/dummy/project",
      dstRemotehostID: "testHost",
      srcRoot: sharedDir,
      srcName: "source.txt",
      dstRoot: remoteWorkDir,
      dstName: "destination.txt",
      forceCopy: false
    };

    const result = await deliverFilesLocalToRemoteShared(recipe);

    expect(getSshStub.calledOnce).to.be.true;
    expect(sshExecStub.calledOnce).to.be.true;
    const calledCmd = sshExecStub.getCall(0).args[0];
    expect(calledCmd).to.include("ln -sf");
    expect(calledCmd).to.include(sharedDir);
    expect(result).to.deep.equal({
      type: "link-via-shared",
      src: srcFile,
      dst: path.join(remoteWorkDir, "destination.txt")
    });

    await sshExecStub.getCall(0).args[0];
    const dstLink = path.join(remoteWorkDir, "destination.txt");
    await fs.ensureSymlink(srcFile, dstLink, "file");

    const linkStats = await fs.lstat(dstLink);
    expect(linkStats.isSymbolicLink()).to.be.true;

    const linkTarget = await fs.readlink(dstLink);
    expect(linkTarget).to.equal(srcFile);

    const content = await fs.readFile(dstLink, "utf8");
    expect(content).to.equal("test content for local to remote");
  });

  it("should copy file when forceCopy is true", async ()=>{
    const sshExecStub = sinon.stub().resolves(0);
    sinon.stub(_internal, "getSsh").returns({ exec: sshExecStub });

    const recipe = {
      localToRemoteShared: true,
      projectRootDir: "/dummy/project",
      dstRemotehostID: "testHost",
      srcRoot: sharedDir,
      srcName: "source.txt",
      dstRoot: remoteWorkDir,
      dstName: "copied.txt",
      forceCopy: true
    };

    const result = await deliverFilesLocalToRemoteShared(recipe);

    expect(sshExecStub.calledOnce).to.be.true;
    const calledCmd = sshExecStub.getCall(0).args[0];
    expect(calledCmd).to.include("cp -r");
    expect(result).to.deep.equal({
      type: "link-via-shared",
      src: srcFile,
      dst: path.join(remoteWorkDir, "copied.txt")
    });
  });
});

describe("#deliverFilesRemoteToLocalShared (with real symlink)", ()=>{
  let tempDir;
  let sharedDir;
  let localWorkDir;
  let srcFile;

  //eslint-disable-next-line no-unused-vars
  let getLoggerStub;
  let loggerDebugStub;

  beforeEach(async ()=>{
    loggerDebugStub = sinon.stub();
    getLoggerStub = sinon.stub(_internal, "getLogger").returns({
      warn: sinon.stub(),
      debug: loggerDebugStub
    });

    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "wheel-test-"));
    sharedDir = path.join(tempDir, "shared");
    localWorkDir = path.join(tempDir, "local-work");

    await fs.ensureDir(sharedDir);
    await fs.ensureDir(localWorkDir);

    srcFile = path.join(sharedDir, "remote-source.txt");
    await fs.writeFile(srcFile, "test content from remote");
  });

  afterEach(async ()=>{
    sinon.restore();
    if (tempDir) {
      await fs.remove(tempDir);
    }
  });

  it("should create symlink on localhost and verify contents", async ()=>{
    const recipe = {
      remoteToLocalShared: true,
      projectRootDir: "/dummy/project",
      srcRoot: sharedDir,
      srcName: "remote-source.txt",
      dstRoot: localWorkDir,
      dstName: "local-destination.txt",
      forceCopy: false
    };

    const result = await deliverFilesRemoteToLocalShared(recipe);

    expect(result.type).to.equal("link-file");
    expect(result.src).to.equal(srcFile);
    expect(result.dst).to.equal(path.join(localWorkDir, "local-destination.txt"));

    const dstLink = path.join(localWorkDir, "local-destination.txt");
    const linkStats = await fs.lstat(dstLink);
    expect(linkStats.isSymbolicLink()).to.be.true;

    const linkTarget = await fs.readlink(dstLink);
    expect(linkTarget).to.equal(srcFile);

    const content = await fs.readFile(dstLink, "utf8");
    expect(content).to.equal("test content from remote");
  });

  it("should create symlink for directory and verify contents", async ()=>{
    const srcDir = path.join(sharedDir, "remote-dir");
    await fs.ensureDir(srcDir);
    await fs.writeFile(path.join(srcDir, "file1.txt"), "file1 content");
    await fs.writeFile(path.join(srcDir, "file2.txt"), "file2 content");

    const recipe = {
      remoteToLocalShared: true,
      projectRootDir: "/dummy/project",
      srcRoot: sharedDir,
      srcName: "remote-dir",
      dstRoot: localWorkDir,
      dstName: "local-dir",
      forceCopy: false
    };

    const result = await deliverFilesRemoteToLocalShared(recipe);

    expect(result.type).to.equal("link-dir");
    expect(result.src).to.equal(srcDir);
    expect(result.dst).to.equal(path.join(localWorkDir, "local-dir"));

    const dstLink = path.join(localWorkDir, "local-dir");
    const linkStats = await fs.lstat(dstLink);
    expect(linkStats.isSymbolicLink()).to.be.true;

    const linkTarget = await fs.readlink(dstLink);
    expect(linkTarget).to.equal(srcDir);

    const file1Content = await fs.readFile(path.join(dstLink, "file1.txt"), "utf8");
    expect(file1Content).to.equal("file1 content");

    const file2Content = await fs.readFile(path.join(dstLink, "file2.txt"), "utf8");
    expect(file2Content).to.equal("file2 content");
  });

  it("should copy file when forceCopy is true and verify contents", async ()=>{
    const recipe = {
      remoteToLocalShared: true,
      projectRootDir: "/dummy/project",
      srcRoot: sharedDir,
      srcName: "remote-source.txt",
      dstRoot: localWorkDir,
      dstName: "copied.txt",
      forceCopy: true
    };

    const result = await deliverFilesRemoteToLocalShared(recipe);

    expect(result.type).to.equal("copy");
    expect(result.src).to.equal(srcFile);
    expect(result.dst).to.equal(path.join(localWorkDir, "copied.txt"));

    const dstFile = path.join(localWorkDir, "copied.txt");
    const fileStats = await fs.lstat(dstFile);
    expect(fileStats.isSymbolicLink()).to.be.false;
    expect(fileStats.isFile()).to.be.true;

    const content = await fs.readFile(dstFile, "utf8");
    expect(content).to.equal("test content from remote");
  });
});

describe("#deliverFilesBetweenRemotes", ()=>{
  let getSshStub, mockSsh, mockDstHostinfo, getSshHostinfoStub, getLoggerStub, mockLogger;

  beforeEach(()=>{
    getSshStub = sinon.stub(_internal, "getSsh");
    getSshHostinfoStub = sinon.stub(_internal, "getSshHostinfo");
    getLoggerStub = sinon.stub(_internal, "getLogger");

    mockLogger = {
      debug: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub()
    };
    mockSsh = {
      remoteToRemoteCopy: sinon.stub().resolves(0)
    };
    mockDstHostinfo = {
      host: "remote-dst.example.com",
      user: "dstuser",
      port: 22
    };
    getSshStub.returns(mockSsh);
    getSshHostinfoStub.returns(mockDstHostinfo);
    getLoggerStub.returns(mockLogger);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return null if betweenRemotes flag is not set", async ()=>{
    const recipe = {
      betweenRemotes: false,
      projectRootDir: "/dummy/project"
    };

    const result = await deliverFilesBetweenRemotes(recipe);
    expect(result).to.be.null;
  });

  it("should call remoteToRemoteCopy with correct parameters", async ()=>{
    const recipe = {
      betweenRemotes: true,
      projectRootDir: "/dummy/project",
      srcRemotehostID: "srchost-id",
      dstRemotehostID: "dsthost-id",
      srcRoot: "/remote/src/path",
      srcName: "file.txt",
      dstRoot: "/remote/dst/path",
      dstName: "file.txt"
    };

    const result = await deliverFilesBetweenRemotes(recipe);

    expect(getSshStub.calledOnceWithExactly(recipe.projectRootDir, recipe.srcRemotehostID)).to.be.true;
    expect(getSshHostinfoStub.calledOnceWithExactly(recipe.projectRootDir, recipe.dstRemotehostID)).to.be.true;
    expect(mockSsh.remoteToRemoteCopy.calledOnce).to.be.true;

    const callArgs = mockSsh.remoteToRemoteCopy.getCall(0).args;
    expect(callArgs[0]).to.deep.equal(["/remote/src/path/file.txt"]);
    expect(callArgs[1]).to.equal(mockDstHostinfo);
    expect(callArgs[2]).to.equal("/remote/dst/path/file.txt");
    expect(callArgs[3]).to.include("-vv");
    expect(callArgs[3]).to.include.members(rsyncExcludeOptionOfWheelSystemFiles);

    expect(result).to.deep.equal({
      type: "direct-remote-copy",
      src: "/remote/src/path/file.txt",
      dst: "/remote/dst/path/file.txt"
    });
  });

  it("should reject if remoteToRemoteCopy returns non-zero exit code", async ()=>{
    mockSsh.remoteToRemoteCopy = sinon.stub().resolves(1);
    const recipe = {
      betweenRemotes: true,
      projectRootDir: "/dummy/project",
      srcRemotehostID: "srchost-id",
      dstRemotehostID: "dsthost-id",
      srcRoot: "/remote/src/path",
      srcName: "file.txt",
      dstRoot: "/remote/dst/path",
      dstName: "file.txt"
    };

    try {
      await deliverFilesBetweenRemotes(recipe);
      expect.fail("Expected deliverFilesBetweenRemotes to reject, but it resolved");
    } catch (err) {
      expect(err.message).to.match(/exit code 1/);
      expect(err.rt).to.equal(1);
    }
  });
});
