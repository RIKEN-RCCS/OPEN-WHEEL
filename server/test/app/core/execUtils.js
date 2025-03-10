/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";

const { expect } = require("chai");
const { describe, it } = require("mocha");
const sinon = require("sinon");
const rewire = require("rewire");

describe("#setTaskState", ()=>{
  let rewireExecUtils;
  let setTaskState;
  let getLoggerMock;
  let writeComponentJsonMock;
  let eventEmittersMock;
  let eeMock;

  beforeEach(()=>{
    //execUtils.js を rewireで読み込み
    rewireExecUtils = rewire("../../../app/core/execUtils.js");

    //テスト対象関数の取得
    setTaskState = rewireExecUtils.__get__("setTaskState");

    //getLogger のモック。trace メソッドを持つオブジェクトを返すようにする
    getLoggerMock = sinon.stub().returns({
      trace: sinon.stub()
    });

    //writeComponentJson は非同期関数なので .resolves() をつける
    writeComponentJsonMock = sinon.stub().resolves();

    //eventEmitters から取得される emitter オブジェクトのモック
    eeMock = {
      emit: sinon.stub()
    };

    //実際に eventEmitters は Map風に get(projectRootDir) される想定なので、Mapを模擬
    eventEmittersMock = new Map();
    //テスト用に "testProjectRootDir" をキーに eeMock をセット
    eventEmittersMock.set("testProjectRootDir", eeMock);

    //rewire で依存を差し替える
    rewireExecUtils.__set__("getLogger", getLoggerMock);
    rewireExecUtils.__set__("writeComponentJson", writeComponentJsonMock);

    //eventEmitters は 直接 Map ではなく { get: function } の形を取る
    rewireExecUtils.__set__("eventEmitters", {
      get: sinon.stub().callsFake((key)=>eventEmittersMock.get(key))
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should set the task state, write component json, and emit events", async ()=>{
    //テスト用のダミー task オブジェクト
    const task = {
      projectRootDir: "testProjectRootDir",
      workingDir: "/dummy/working/dir",
      ID: "task123",
      state: "oldState"
    };
    const newState = "newState";

    //実行
    await setTaskState(task, newState);

    //検証: task.state が更新される
    expect(task.state).to.equal(newState);

    //検証: getLogger が正しい引数で呼ばれ、trace が実行される
    expect(getLoggerMock.calledOnceWithExactly("testProjectRootDir")).to.be.true;
    expect(getLoggerMock().trace.calledWithMatch("TaskStateList: task123's state is changed to newState")).to.be.true;

    //検証: writeComponentJson が呼ばれている
    expect(writeComponentJsonMock.calledOnceWithExactly(
      "testProjectRootDir",
      "/dummy/working/dir",
      task,
      true
    )).to.be.true;

    //検証: eventEmitters から取得した eeMock で2回 emit が呼ばれる
    expect(eeMock.emit.callCount).to.equal(2);
    //1回目は taskStateChanged イベント
    expect(eeMock.emit.firstCall.args).to.deep.equal(["taskStateChanged", task]);
    //2回目は componentStateChanged イベント
    expect(eeMock.emit.secondCall.args).to.deep.equal(["componentStateChanged", task]);
  });
});

describe("#needDownload", ()=>{
  let rewireExecUtils;
  let needDownload;
  let isSameRemoteHostMock;

  beforeEach(()=>{
    //execUtils.js を rewireで読み込む
    rewireExecUtils = rewire("../../../app/core/execUtils.js");

    //テスト対象関数を __get__ で取得
    needDownload = rewireExecUtils.__get__("needDownload");

    //isSameRemoteHost を sinon.stub() でモック化
    isSameRemoteHostMock = sinon.stub();

    //rewireでオリジナルの isSameRemoteHost を差し替える
    rewireExecUtils.__set__("isSameRemoteHost", isSameRemoteHostMock);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return false if outputFile.dst is empty", async ()=>{
    //dstが空配列の場合
    const outputFile = { dst: [] };

    //実行
    const result = await needDownload("/dummy/project", "dummyComponent", outputFile);

    //検証: some() に何も引っかからないので false
    expect(result).to.be.false;
    //isSameRemoteHost は呼ばれない
    expect(isSameRemoteHostMock.notCalled).to.be.true;
  });

  it("should return false if all destinations are the same remote host", async ()=>{
    //dst配列に複数のdstNodeがあるケース
    const outputFile = {
      dst: [
        { dstNode: "hostA" },
        { dstNode: "hostB" }
      ]
    };

    //すべて同じホスト扱い (true) を返すモック
    isSameRemoteHostMock.resolves(true);

    const result = await needDownload("/dummy/project", "dummyComponent", outputFile);
    expect(result).to.be.false; //全部true → some(!true)=false
    //呼び出し回数を確認
    expect(isSameRemoteHostMock.callCount).to.equal(2);
  });

  it("should return true if at least one destination is different remote host", async ()=>{
    const outputFile = {
      dst: [
        { dstNode: "hostA" },
        { dstNode: "hostB" }
      ]
    };

    //1つ目はtrue、2つ目はfalseを返す
    //→ どれか1つでもfalseがあればneedDownloadはtrueになる
    isSameRemoteHostMock.onCall(0).resolves(true);
    isSameRemoteHostMock.onCall(1).resolves(false);

    const result = await needDownload("/dummy/project", "dummyComponent", outputFile);
    expect(result).to.be.true;
    expect(isSameRemoteHostMock.callCount).to.equal(2);
  });

  it("should reject if isSameRemoteHost rejects", async ()=>{
    //途中でエラーを投げるケース
    const outputFile = {
      dst: [
        { dstNode: "hostA" }
      ]
    };
    isSameRemoteHostMock.rejects(new Error("some error"));

    //needDownload 自体がthrowすることを確認
    try {
      await needDownload("/dummy/project", "dummyComponent", outputFile);
      //rejectされなければ失敗とみなす
      expect.fail("Expected needDownload to reject, but it did not");
    } catch (err) {
      //エラーメッセージを確認する
      expect(err).to.be.an("Error");
      expect(err.message).to.equal("some error");
    }
    expect(isSameRemoteHostMock.calledOnce).to.be.true;
  });
});

describe("#formatSrcFilename", ()=>{
  let rewireExecUtils; //rewireで読み込んだexecUtils
  let formatSrcFilename; //テスト対象の関数
  let replacePathsepMock; //replacePathsepをStub化する

  beforeEach(()=>{
    //execUtils.js を再取得
    rewireExecUtils = rewire("../../../app/core/execUtils.js");

    //テスト対象関数を取得
    formatSrcFilename = rewireExecUtils.__get__("formatSrcFilename");

    //replacePathsep をsinon.stub()でモック化し、execUtils内部のreplacePathsepを差し替える
    replacePathsepMock = sinon.stub();
    rewireExecUtils.__set__("replacePathsep", replacePathsepMock);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return joined path with '/*' if filename ends with '/'", ()=>{
    //replacePathsep が返す値をダミー設定
    replacePathsepMock.returns("convertedDir");
    //テスト実行
    const result = formatSrcFilename("/home/user", "mydata/");

    //期待値を検証
    expect(replacePathsepMock.calledOnceWithExactly("mydata/")).to.be.true;
    //path.posix.join("/home/user", "convertedDir/*") => "/home/user/convertedDir/*" と等しいか
    expect(result).to.equal("/home/user/convertedDir/*");
  });

  it("should return joined path with '/*' if filename ends with backslash '\\'", ()=>{
    replacePathsepMock.returns("convertedBackslash");
    const result = formatSrcFilename("/home/user", "mydata\\");

    //replacePathsepが呼ばれていることと、返り値を確認
    expect(replacePathsepMock.calledOnceWithExactly("mydata\\")).to.be.true;
    expect(result).to.equal("/home/user/convertedBackslash/*");
  });

  it("should return joined path without '/*' if filename does not end with slash/backslash", ()=>{
    const result = formatSrcFilename("/home/user", "file.txt");

    //この場合は replacePathsep を呼ばない分岐
    expect(replacePathsepMock.notCalled).to.be.true;
    expect(result).to.equal("/home/user/file.txt");
  });
});

describe("#createStatusFile", ()=>{
  let rewireExecUtils;
  let createStatusFile;
  let fsMock; //fs.writeFileをstub化

  beforeEach(()=>{
    //execUtils.js を rewire で読み込み
    rewireExecUtils = rewire("../../../app/core/execUtils.js");
    //テスト対象の関数を取得
    createStatusFile = rewireExecUtils.__get__("createStatusFile");

    //fs.writeFile を stub 化して置き換え
    fsMock = {
      writeFile: sinon.stub().resolves()
    };
    rewireExecUtils.__set__("fs", fsMock);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should create a status file with correct content", async ()=>{
    //準備：taskオブジェクト
    const task = {
      workingDir: "/test/workingDir",
      state: "RUNNING",
      rt: 0,
      jobStatus: "SUBMITTED"
    };

    await createStatusFile(task);

    //実際に fs.writeFile が呼ばれた時の引数を取得
    expect(fsMock.writeFile.calledOnce).to.be.true;
    const [actualPath, actualContent] = fsMock.writeFile.firstCall.args;

    expect(actualPath).to.equal("/test/workingDir/status.wheel.txt");

    //書き込まれる内容の検証
    expect(actualContent).to.equal("RUNNING\n0\nSUBMITTED");
  });

  it("should throw an error if fs.writeFile fails", async ()=>{
    //fs.writeFile をエラーを投げる挙動にする
    fsMock.writeFile.rejects(new Error("Write failed"));

    const task = {
      workingDir: "/error/workingDir",
      state: "FAILED",
      rt: 1,
      jobStatus: "ERROR"
    };

    try {
      await createStatusFile(task);
      //エラーが出ない場合はテスト失敗
      expect.fail("Expected createStatusFile to reject, but it resolved");
    } catch (err) {
      expect(err.message).to.equal("Write failed");
    }
  });
});

describe("#createBulkStatusFile", ()=>{
  let rewireExecUtils;
  let createBulkStatusFile;
  let fsMock;
  let pathMock;

  beforeEach(()=>{
    //execUtils.js を rewire で読み込み
    rewireExecUtils = rewire("../../../app/core/execUtils.js");
    //テスト対象関数を取得
    createBulkStatusFile = rewireExecUtils.__get__("createBulkStatusFile");

    //fs, path を Stub 化
    fsMock = {
      writeFile: sinon.stub().resolves()
    };
    pathMock = {
      resolve: sinon.stub()
    };

    //rewire を使って execUtils.js 内の fs と path を Stub に差し替え
    rewireExecUtils.__set__("fs", fsMock);
    rewireExecUtils.__set__("path", pathMock);
  });

  afterEach(()=>{
    //毎テスト後に sinon をリセット
    sinon.restore();
  });

  it("should write correct content for multiple bulk iterations", async ()=>{
    pathMock.resolve.returns("/fake/dir/subjob_status.txt");

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

    expect(pathMock.resolve.calledOnceWithExactly(
      "/fake/dir",
      "subjob_status.wheel.txt" //subjob_ + statusFilename
    )).to.be.true;

    const expectedContent
      = "RT_2=RTValue2\nJOBSTATUS_2=JOBSTATUS2\n"
      + "RT_3=RTValue3\nJOBSTATUS_3=JOBSTATUS3\n";

    expect(fsMock.writeFile.calledOnceWithExactly(
      "/fake/dir/subjob_status.txt",
      expectedContent
    )).to.be.true;
  });

  it("should write empty content if startBulkNumber > endBulkNumber", async ()=>{
    //ループが一度も回らないケース
    pathMock.resolve.returns("/fake/dir/subjob_status.txt");

    const task = {
      workingDir: "/fake/dir",
      startBulkNumber: 5,
      endBulkNumber: 3
    };
    const rtList = {};
    const jobStatusList = {};

    await createBulkStatusFile(task, rtList, jobStatusList);

    //内容は空文字列で書き込まれる
    expect(fsMock.writeFile.calledOnceWithExactly("/fake/dir/subjob_status.txt", "")).to.be.true;
  });
});
