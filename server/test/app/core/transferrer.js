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

describe("#stageIn", ()=>{
  let rewireTransferrer;
  let stageIn;

  let setTaskStateMock;
  let getSshHostinfoMock;
  let replaceCRLFMock;
  let addXMock;
  let registerMock;

  beforeEach(()=>{
    //transferrer.js を rewire でインポート
    rewireTransferrer = rewire("../../../app/core/transferrer.js");

    //テスト対象の関数を取得
    stageIn = rewireTransferrer.__get__("stageIn");

    //依存する関数をすべてスタブ化
    setTaskStateMock = sinon.stub().resolves();
    getSshHostinfoMock = sinon.stub().returns({ host: "mock-host" });
    replaceCRLFMock = sinon.stub().resolves();
    addXMock = sinon.stub().resolves();
    registerMock = sinon.stub().resolves("register-result");

    //rewire で差し替え
    rewireTransferrer.__set__({
      setTaskState: setTaskStateMock,
      getSshHostinfo: getSshHostinfoMock,
      replaceCRLF: replaceCRLFMock,
      addX: addXMock,
      register: registerMock
    });
  });

  afterEach(()=>{
    //テスト終了後にstubを元に戻す
    sinon.restore();
  });

  it("should set stage-in state, convert CRLF, add exec permission, and register file transfer", async ()=>{
    //テスト対象に渡す task オブジェクト
    const task = {
      projectRootDir: "/dummy/project",
      remotehostID: "host-123",
      workingDir: "/local/work/dir",
      script: "execute.sh",
      remoteWorkingDir: "/remote/work/dir/sub"
    };

    //実行
    const result = await stageIn(task);

    //アサーション
    expect(setTaskStateMock.calledOnceWithExactly(task, "stage-in")).to.be.true;
    expect(getSshHostinfoMock.calledOnceWithExactly("/dummy/project", "host-123")).to.be.true;
    expect(replaceCRLFMock.calledOnceWithExactly("/local/work/dir/execute.sh")).to.be.true;
    expect(addXMock.calledOnceWithExactly("/local/work/dir/execute.sh")).to.be.true;

    //path.posix.dirname("/remote/work/dir/sub") => "/remote/work/dir"
    //最後に "/" を付加して呼び出される => "/remote/work/dir/"
    expect(registerMock.calledOnceWithExactly(
      { host: "mock-host" },
      task,
      "send",
      ["/local/work/dir"],
      "/remote/work/dir/"
    )).to.be.true;

    //stageIn が register の戻り値を返しているか
    expect(result).to.equal("register-result");
  });
});
