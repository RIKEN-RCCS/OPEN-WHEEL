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
