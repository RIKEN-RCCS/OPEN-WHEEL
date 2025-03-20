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

describe("#stageOut", ()=>{
  let rewireTransferrer;
  let stageOut;
  let setTaskStateMock;
  let getSshHostinfoMock;
  let needDownloadMock;
  let makeDownloadRecipeMock;
  let registerMock;
  let getSshMock;
  let sshMock;

  beforeEach(()=>{
    //transferrer.jsをrewireで読み込む
    rewireTransferrer = rewire("../../../app/core/transferrer.js");
    //テスト対象関数を__get__で取得
    stageOut = rewireTransferrer.__get__("stageOut");

    //sinon.stub() でMock(テストダブル)を作成
    setTaskStateMock = sinon.stub();
    getSshHostinfoMock = sinon.stub();
    needDownloadMock = sinon.stub();
    makeDownloadRecipeMock = sinon.stub();
    registerMock = sinon.stub();
    getSshMock = sinon.stub();

    //ssh の execをモック化
    sshMock = {
      exec: sinon.stub()
    };

    //loggerモック（debug, trace, warn などをstubに）
    const loggerStub = {
      debug: sinon.stub(),
      trace: sinon.stub(),
      warn: sinon.stub()
    };

    //rewireを使ってtransferrer.js内部の依存を差し替え
    rewireTransferrer.__set__({
      setTaskState: setTaskStateMock,
      getSshHostinfo: getSshHostinfoMock,
      getLogger: ()=>loggerStub, //getLoggerMockを使わなくても良いが、必要なら差し替え
      needDownload: needDownloadMock,
      makeDownloadRecipe: makeDownloadRecipeMock,
      register: registerMock,
      getSsh: getSshMock
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return immediately if task.state is not 'finished'", async ()=>{
    const task = {
      state: "running", //"finished" 以外
      projectRootDir: "/path/to/project",
      remotehostID: "hostID"
    };

    await stageOut(task);

    //即returnのため、下記は呼ばれない
    expect(setTaskStateMock.called).to.be.false;
    expect(getSshHostinfoMock.called).to.be.false;
    expect(registerMock.called).to.be.false;
  });

  it("should set task state to 'stage-out' and then restore it, if state is 'finished'", async ()=>{
    const task = {
      state: "finished",
      projectRootDir: "/project",
      remotehostID: "hostA",
      outputFiles: [],
      ID: "someTaskID"
    };
    getSshHostinfoMock.returns({ host: "dummyHost" });

    await stageOut(task);

    //最初に"stage-out" → 最後に"finished" となる
    expect(setTaskStateMock.callCount).to.equal(2);
    expect(setTaskStateMock.firstCall.args).to.deep.equal([task, "stage-out"]);
    expect(setTaskStateMock.secondCall.args).to.deep.equal([task, "finished"]);
  });

  it("should skip download if outputFiles is empty", async ()=>{
    const task = {
      state: "finished",
      projectRootDir: "/project",
      remotehostID: "hostA",
      outputFiles: [], //空
      ID: "someTaskID"
    };
    getSshHostinfoMock.returns({ host: "dummyHost" });

    await stageOut(task);

    //outputFilesが空なので needDownload も makeDownloadRecipe も呼ばれない
    expect(needDownloadMock.called).to.be.false;
    expect(makeDownloadRecipeMock.called).to.be.false;
    //registerも呼ばれない
    expect(registerMock.called).to.be.false;
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
    getSshHostinfoMock.returns({ host: "dummyHost" });

    //file1 はダウンロードが必要、file2 は不要 というケース
    needDownloadMock.onFirstCall().resolves(true);
    needDownloadMock.onSecondCall().resolves(false);

    //makeDownloadRecipeMock は file1 を処理するなら { src, dst } のような値を返す
    makeDownloadRecipeMock.returns({ src: "/remote/workingDir/file1.txt", dst: "/local/workingDir" });

    await stageOut(task);

    //file1.txt のみダウンロードレシピが生成される
    expect(makeDownloadRecipeMock.calledOnce).to.be.true;
    expect(registerMock.calledOnce).to.be.true;

    //register の呼び出し引数を確認
    const registerArgs = registerMock.firstCall.args;
    expect(registerArgs[0]).to.deep.equal({ host: "dummyHost" }); //hostinfo
    expect(registerArgs[1]).to.equal(task); //task
    expect(registerArgs[2]).to.equal("recv"); //mode
    expect(registerArgs[3]).to.deep.equal(["/remote/workingDir/file1.txt"]); //srces
    expect(registerArgs[4]).to.equal("/local/workingDir"); //dst
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
    getSshHostinfoMock.returns({ host: "dummyHost" });

    //2ファイルともneedDownload=true
    needDownloadMock.resolves(true);

    //makeDownloadRecipeがそれぞれ {src, dst} を返すが、dstは同じにする
    makeDownloadRecipeMock.onFirstCall().returns({ src: "/remote/dir/a.bin", dst: "/local/dir" });
    makeDownloadRecipeMock.onSecondCall().returns({ src: "/remote/dir/b.bin", dst: "/local/dir" });

    await stageOut(task);

    //register は1回のみ呼ばれる (dstが同じ => まとめて送る)
    expect(registerMock.calledOnce).to.be.true;
    const args = registerMock.firstCall.args;
    expect(args[3]).to.deep.equal(["/remote/dir/a.bin", "/remote/dir/b.bin"]); //srces
  });

  it("should pass exclude options to register only for the included files", async ()=>{
    //excludeあり, includeあり のパターン
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
    getSshHostinfoMock.returns({ host: "dummyHost" });

    //outputFilesのダウンロード
    needDownloadMock.resolves(true); //main.outは必要とする
    makeDownloadRecipeMock.onFirstCall().returns({ src: "/remote/dir/main.out", dst: "/local/dir" });

    //include対象
    makeDownloadRecipeMock.onSecondCall().returns({ src: "/remote/dir/extra.dat", dst: "/local/dir" });
    makeDownloadRecipeMock.onThirdCall().returns({ src: "/remote/dir/data/another.out", dst: "/local/dir" });

    await stageOut(task);

    //excludeは ["--exclude=*.tmp", "--exclude=*.log"] になる
    //outputFiles (main.out) ではオプション付けずに register
    //include (extra.dat, another.out) はオプションありで register
    expect(registerMock.callCount).to.equal(2);

    //1回目: outputFiles用
    const call1 = registerMock.getCall(0).args;
    //引数: (hostinfo, task, "recv", srces, dst, <未指定>)
    expect(call1[5]).to.be.undefined;

    //2回目: include用
    const call2 = registerMock.getCall(1).args;
    //最後の引数が exclude配列オプション
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
    getSshHostinfoMock.returns({ host: "dummyHost" });
    //sshMock を返すようにする
    getSshMock.returns(sshMock);

    //cleanupでエラーが起こるケースをテストするためにthrowしてみる
    sshMock.exec.rejects(new Error("Some SSH error"));

    await stageOut(task);

    //cleanupの呼び出しが行われている
    expect(getSshMock.calledOnceWithExactly("/proj", "hostB")).to.be.true;
    expect(sshMock.exec.calledOnceWithExactly("rm -fr /remote")).to.be.true;

    //エラーが出ても握りつぶすのでテストが正常終了する
    //最後にタスクのstateが "finished" に戻っているか
    expect(setTaskStateMock.secondCall.args).to.deep.equal([task, "finished"]);
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
    getSshHostinfoMock.returns({ host: "dummyHost" });

    await stageOut(task);

    //doCleanup=false なので getSshも ssh.execも呼ばれない
    expect(getSshMock.called).to.be.false;
    expect(sshMock.exec.called).to.be.false;
  });
});
