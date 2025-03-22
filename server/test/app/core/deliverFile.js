/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const { expect } = require("chai");
const { describe, it, beforeEach, afterEach } = require("mocha");
const sinon = require("sinon");
const rewire = require("rewire");
const { rsyncExcludeOptionOfWheelSystemFiles } = require("../../../app/db/db");

describe("#deliverFile", ()=>{
  let rewireDeliverFile;
  let deliverFile;
  let fsMock; //fsモジュールをstub化
  let statsMock; //fs.lstatで返されるstatオブジェクトをstub化

  beforeEach(()=>{
    //rewireでdeliverFile.jsを読み込み
    rewireDeliverFile = rewire("../../../app/core/deliverFile.js");

    //テスト対象関数deliverFileを取得
    deliverFile = rewireDeliverFile.__get__("deliverFile");

    //fsモックを用意し、呼び出しをすべてsinon.stub()化
    fsMock = {
      lstat: sinon.stub(),
      copy: sinon.stub(),
      remove: sinon.stub(),
      ensureSymlink: sinon.stub()
    };

    //deliverFile.js内部のfsをモックに差し替え
    rewireDeliverFile.__set__("fs", fsMock);

    //isDirectory()の結果を切り替えるためのstatsオブジェクトMock
    statsMock = {
      isDirectory: sinon.stub()
    };
  });

  it("should deliver directory with symlink if not forced to copy", async ()=>{
    //isDirectory() => true
    statsMock.isDirectory.returns(true);
    fsMock.lstat.resolves(statsMock);

    //remove/ensureSymlink成功を想定
    fsMock.remove.resolves();
    fsMock.ensureSymlink.resolves();

    const src = "/path/to/srcDir";
    const dst = "/path/to/dstDir";

    const result = await deliverFile(src, dst, false);

    expect(fsMock.lstat.calledOnceWithExactly(src)).to.be.true;
    expect(fsMock.remove.calledOnceWithExactly(dst)).to.be.true;
    expect(fsMock.ensureSymlink.calledOnceWithExactly(src, dst, "dir")).to.be.true;
    expect(result).to.deep.equal({
      type: "link-dir",
      src,
      dst
    });
  });

  it("should deliver file with symlink if not forced to copy", async ()=>{
    //isDirectory() => false
    statsMock.isDirectory.returns(false);
    fsMock.lstat.resolves(statsMock);

    fsMock.remove.resolves();
    fsMock.ensureSymlink.resolves();

    const src = "/path/to/srcFile";
    const dst = "/path/to/dstFile";

    const result = await deliverFile(src, dst, false);

    expect(fsMock.lstat.calledOnceWithExactly(src)).to.be.true;
    expect(fsMock.remove.calledOnceWithExactly(dst)).to.be.true;
    expect(fsMock.ensureSymlink.calledOnceWithExactly(src, dst, "file")).to.be.true;
    expect(result).to.deep.equal({
      type: "link-file",
      src,
      dst
    });
  });

  it("should deliver by copying if forceCopy is true", async ()=>{
    statsMock.isDirectory.returns(true); //dir/file どちらでも可
    fsMock.lstat.resolves(statsMock);

    fsMock.copy.resolves();

    const src = "/path/to/srcAny";
    const dst = "/path/to/dstAny";

    const result = await deliverFile(src, dst, true);

    //remove()やensureSymlink()は呼ばれない
    expect(fsMock.remove.notCalled).to.be.true;
    expect(fsMock.ensureSymlink.notCalled).to.be.true;

    expect(fsMock.copy.calledOnceWithExactly(src, dst, { overwrite: true })).to.be.true;
    expect(result).to.deep.equal({
      type: "copy",
      src,
      dst
    });
  });

  it("should fallback to copy when ensureSymlink throws EPERM error", async ()=>{
    //symlink作成時にEPERMエラーを投げる
    statsMock.isDirectory.returns(false);
    fsMock.lstat.resolves(statsMock);
    fsMock.remove.resolves();

    const epermError = new Error("EPERM error");
    epermError.code = "EPERM";
    fsMock.ensureSymlink.rejects(epermError);

    //fallbackのcopy
    fsMock.copy.resolves();

    const src = "/dir/src";
    const dst = "/dir/dst";

    const result = await deliverFile(src, dst, false);

    //remove -> ensureSymlink(EPERM) -> copy(overwrite: false)
    expect(fsMock.remove.calledOnceWithExactly(dst)).to.be.true;
    expect(fsMock.ensureSymlink.calledOnce).to.be.true;
    expect(fsMock.copy.calledOnceWithExactly(src, dst, { overwrite: false })).to.be.true;

    expect(result).to.deep.equal({
      type: "copy",
      src,
      dst
    });
  });

  it("should reject promise if ensureSymlink throws error with non-EPERM code", async ()=>{
    statsMock.isDirectory.returns(false);
    fsMock.lstat.resolves(statsMock);
    fsMock.remove.resolves();

    const otherError = new Error("Some other error");
    otherError.code = "EACCES"; //例: EPERM以外のコード
    fsMock.ensureSymlink.rejects(otherError);

    //copyは呼ばれない
    fsMock.copy.resolves();

    const src = "/some/src";
    const dst = "/some/dst";

    try {
      await deliverFile(src, dst, false);
      expect.fail("Expected deliverFile to reject, but it resolved");
    } catch (err) {
      expect(err).to.equal(otherError);
    }

    expect(fsMock.remove.calledOnceWithExactly(dst)).to.be.true;
    expect(fsMock.ensureSymlink.calledOnce).to.be.true;
    //EPERMでないのでコピーも行われない
    expect(fsMock.copy.notCalled).to.be.true;
  });
});

describe("#deliverFilesOnRemote", ()=>{
  let rewireDeliverFile;
  let deliverFilesOnRemote;
  let getLoggerMock;
  let loggerMock;
  let getSshMock;
  let sshMock;

  beforeEach(()=>{
    //rewire で deliverFile.js を読み込む
    rewireDeliverFile = rewire("../../../app/core/deliverFile.js");

    //テスト対象関数の取得
    deliverFilesOnRemote = rewireDeliverFile.__get__("deliverFilesOnRemote");

    //logger のモックを準備
    loggerMock = {
      warn: sinon.stub(),
      debug: sinon.stub()
    };
    getLoggerMock = sinon.stub().returns(loggerMock);

    //getSsh のモックを準備
    sshMock = {
      exec: sinon.stub()
    };
    getSshMock = sinon.stub().returns(sshMock);

    //rewire で deliverFile.js 内部の依存を差し替え
    rewireDeliverFile.__set__("getLogger", getLoggerMock);
    rewireDeliverFile.__set__("getSsh", getSshMock);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return null and log a warning if recipe.onSameRemote is false", async ()=>{
    const recipe = {
      onSameRemote: false, //onSameRemoteがfalseの場合のテスト
      projectRootDir: "/dummy/dir",
      remotehostID: "hostID"
    };
    const result = await deliverFilesOnRemote(recipe);

    expect(result).to.be.null;
    expect(loggerMock.warn.calledOnceWithExactly("deliverFilesOnRemote must be called with onSameRemote flag")).to.be.true;
    //getSsh は呼ばれない
    expect(getSshMock.notCalled).to.be.true;
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
    //exec結果が成功(0)を返すようにする
    sshMock.exec.resolves(0);

    const result = await deliverFilesOnRemote(recipe);

    //cmd: ln -sf
    const expectedCmdPart = "ln -sf";
    expect(sshMock.exec.callCount).to.equal(1);
    const calledCmd = sshMock.exec.getCall(0).args[0];
    expect(calledCmd).to.include(expectedCmdPart);

    //logger.debug が実行されているか
    expect(loggerMock.debug.calledWithExactly("execute on remote", sinon.match.string)).to.be.true;

    //正常完了の場合はオブジェクトを返す
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
    sshMock.exec.resolves(0);

    const result = await deliverFilesOnRemote(recipe);

    //forceCopy=true => cmd: cp -r
    const expectedCmdPart = "cp -r";
    expect(sshMock.exec.callCount).to.equal(1);
    const calledCmd = sshMock.exec.getCall(0).args[0];
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
    //exec結果が失敗(非0)を返すようにする
    sshMock.exec.resolves(1);

    try {
      await deliverFilesOnRemote(recipe);
      expect.fail("Expected deliverFilesOnRemote to throw, but it did not");
    } catch (err) {
      expect(err).to.be.instanceOf(Error);
      expect(err.message).to.equal("deliver file on remote failed");
      //logger.warn にも記録されているか
      expect(loggerMock.warn.calledWithExactly("deliver file on remote failed", 1)).to.be.true;
      //付与される err.rt が 1 になっているか
      expect(err).to.have.property("rt", 1);
    }
  });
});

describe("#deliverFilesFromRemote", ()=>{
  let rewireDeliverFile;
  let deliverFilesFromRemote;
  let getLoggerMock;
  let loggerMock;
  let getSshMock;
  let sshMock;

  beforeEach(()=>{
    //deliverFile.js を rewireで読み込む
    rewireDeliverFile = rewire("../../../app/core/deliverFile.js");

    //テスト対象関数を取得
    deliverFilesFromRemote = rewireDeliverFile.__get__("deliverFilesFromRemote");

    //getLoggerをスタブ化
    getLoggerMock = sinon.stub();
    //loggerとして warnやdebugをモック化
    loggerMock = {
      warn: sinon.stub(),
      debug: sinon.stub()
    };
    getLoggerMock.returns(loggerMock);

    //getSshをスタブ化
    getSshMock = sinon.stub();
    //sshオブジェクトのrecvメソッドをモック化
    sshMock = {
      recv: sinon.stub()
    };

    //rewireで差し替え
    rewireDeliverFile.__set__({
      getLogger: getLoggerMock,
      getSsh: getSshMock
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return null and log a warning if recipe.remoteToLocal is false", async ()=>{
    //準備
    const recipe = {
      projectRootDir: "/dummy/project",
      remoteToLocal: false
    };

    //実行
    const result = await deliverFilesFromRemote(recipe);

    //検証
    expect(result).to.be.null;
    expect(loggerMock.warn.calledOnceWithExactly("deliverFilesFromRemote must be called with remoteToLocal flag")).to.be.true;
  });

  it("should reject with an error if ssh.recv throws an error", async ()=>{
    //準備
    const recipe = {
      projectRootDir: "/dummy/project",
      remoteToLocal: true,
      remotehostID: "host-001",
      srcRoot: "/remote/src",
      srcName: "fileA.txt",
      dstRoot: "/local/dst",
      dstName: "fileA.txt"
    };
    getSshMock.returns(sshMock);

    const fakeError = new Error("recv failed");
    sshMock.recv.rejects(fakeError);

    //実行 & 検証
    try {
      await deliverFilesFromRemote(recipe);
      expect.fail("Expected deliverFilesFromRemote to reject, but it resolved");
    } catch (err) {
      expect(err).to.equal(fakeError);
    }
  });

  it("should call ssh.recv and return an object if successful", async ()=>{
    //準備
    const recipe = {
      projectRootDir: "/dummy/project",
      remoteToLocal: true,
      remotehostID: "host-002",
      srcRoot: "/remote/src",
      srcName: "fileB.dat",
      dstRoot: "/local/dst",
      dstName: "fileB.dat"
    };
    getSshMock.returns(sshMock);

    //recvが正常終了するようにする
    sshMock.recv.resolves();

    //実行
    const result = await deliverFilesFromRemote(recipe);

    //検証
    expect(result).to.deep.equal({
      type: "copy",
      src: "/remote/src/fileB.dat",
      dst: "/local/dst/fileB.dat"
    });
    expect(sshMock.recv.calledOnceWithExactly(
      ["/remote/src/fileB.dat"],
      "/local/dst/fileB.dat",
      ["-vv", ...rsyncExcludeOptionOfWheelSystemFiles]
    )).to.be.true;
  });
});
