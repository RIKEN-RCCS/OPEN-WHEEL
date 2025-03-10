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
