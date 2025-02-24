/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const { expect } = require("chai");
const { describe, it, beforeEach } = require("mocha");
const sinon = require("sinon");
const rewire = require("rewire");

describe("#getFirstCapture", ()=>{
  let rewireJobManager;
  let getFirstCapture;

  beforeEach(()=>{
    //jobManager.js を再取得
    rewireJobManager = rewire("../../../app/core/jobManager.js");

    //テスト対象関数を取得
    getFirstCapture = rewireJobManager.__get__("getFirstCapture");
  });

  it("should return null if there is no match (result === null)", ()=>{
    const outputText = "No matching pattern here";
    //キャプチャつきの正規表現を用意しても、マッチしなければ result === null
    const reCode = "value: ([0-9]+)";
    const result = getFirstCapture(outputText, reCode);
    expect(result).to.be.null;
  });

  it("should return null if a match exists but capturing group is undefined", ()=>{
    //正規表現にはカッコがないので、matchはするがグループが無く result[1] は undefined
    const outputText = "pattern matched but no capturing group";
    const reCode = "pattern matched"; //カッコなし
    const result = getFirstCapture(outputText, reCode);
    expect(result).to.be.null;
  });

  it("should return the captured group if match is found and capturing group is present", ()=>{
    const outputText = "ReturnCode: 12345 found here";
    const reCode = "ReturnCode:\\s+([0-9]+)";
    const result = getFirstCapture(outputText, reCode);
    expect(result).to.equal("12345");
  });

  it("should handle empty string capture correctly (still not null if matched)", ()=>{
    //キャプチャが空文字列になるパターンを試す
    const outputText = "PrefixSuffix";
    //() の中身が0文字でもマッチする例:
    //"Prefix" と "Suffix" の間をキャプチャするが、文字が無いとき空文字になる
    const reCode = "Prefix()Suffix";
    const result = getFirstCapture(outputText, reCode);
    //空文字だが undefined ではないので、空文字("")が帰る
    expect(result).to.equal("");
  });
});

describe("#getBulkFirstCapture", ()=>{
  let rewireJobManager;
  let getBulkFirstCapture;

  beforeEach(()=>{
    //jobManager.js を再取得
    rewireJobManager = rewire("../../../app/core/jobManager.js");

    //テスト対象関数を取得
    getBulkFirstCapture = rewireJobManager.__get__("getBulkFirstCapture");
  });

  it("should return [1, []] if no lines match the pattern", ()=>{
    //準備: outputTextに正規表現とマッチする行が無い
    const outputText = [
      "some line",
      "another line",
      "yet another line"
    ].join("\n");

    //実行: マッチしないパターンを与える
    const reSubCode = /CODE=(\d+)/; //例: CODE=数字 で探す
    const result = getBulkFirstCapture(outputText, reSubCode);

    //検証: subJobOutputsが空 => bulkjobFailed = true => result=1, codeList=[]
    expect(result).to.deep.equal([1, []]);
  });

  it("should return [0, codeList] if some lines match and at least one capture is '0'", ()=>{
    //準備: 複数行の中に CODE=0 を含む
    const outputText = [
      "some line CODE=1",
      "some line CODE=0", //<-- キャプチャグループ[1] が "0"
      "last line CODE=2"
    ].join("\n");

    const reSubCode = /CODE=(\d+)/;
    const result = getBulkFirstCapture(outputText, reSubCode);

    //検証: 1つでも "0" があれば bulkjobFailed = false => result=0
    //codeList はマッチしたもの全部 [ "1", "0", "2" ]
    expect(result).to.deep.equal([0, ["1", "0", "2"]]);
  });

  it("should return [1, codeList] if all captures are not '0'", ()=>{
    //準備: マッチする行がすべて "0" 以外
    const outputText = [
      "some line CODE=5",
      "some line CODE=9"
    ].join("\n");

    const reSubCode = /CODE=(\d+)/;
    const result = getBulkFirstCapture(outputText, reSubCode);

    //検証: キャプチャすべてが"0"以外 => bulkjobFailed = true => result=1
    //codeList => [ "5", "9" ]
    expect(result).to.deep.equal([1, ["5", "9"]]);
  });

  it("should treat lines with undefined capture group as nonzero, returning [1, codeList]", ()=>{
    //準備: 正規表現にマッチはするが、キャプチャグループが存在しないケース
    //例: キャプチャグループを (?: ...) にするとグループ[1] が無い
    const outputText = [
      "line1 CODE=0", //この行は通常通り CODE=0 (キャプチャ1あり)
      "line2 CODE=123" //この行はマッチするけど数値キャプチャが取れない想定
    ].join("\n");

    //正規表現にグループを設定していない例
    ///CODE=(\d+)/ → [0] 全体マッチ, [1] = "0" or "5" など
    ///CODE=\d+/   → キャプチャが無い => arrText[1] は undefined
    //ここでは複数パターンで意図的にグループを壊す
    const reSubCode = /CODE=\d+/;

    const result = getBulkFirstCapture(outputText, reSubCode);

    //subJobOutputsは2つマッチ
    //arrText[0] = "CODE=0" or "CODE=123"
    //arrText[1] = undefined => "0" と等しくない => すべて "0" 以外とみなされる
    //=> bulkjobFailed=true => result=1, codeList = [undefined, undefined]
    expect(result).to.deep.equal([1, [undefined, undefined]]);
  });
});

describe("#isJobFailed", ()=>{
  let rewireJobManager;
  let isJobFailed;

  beforeEach(()=>{
    //jobManager.js をrewireで読み込む
    rewireJobManager = rewire("../../../app/core/jobManager.js");

    //テスト対象関数を取得
    isJobFailed = rewireJobManager.__get__("isJobFailed");
  });

  it("should return true if acceptableJobStatus is undefined and code is '0'", ()=>{
    //JS.acceptableJobStatus が未定義の場合
    const JS = {}; //acceptableJobStatus未定義
    const code = "0";
    const result = isJobFailed(JS, code);
    //statusList は ["0",0] となり、 code="0" は含まれる => true
    expect(result).to.be.true;
  });

  it("should return false if acceptableJobStatus is undefined and code is not '0'", ()=>{
    const JS = {};
    const code = "1";
    const result = isJobFailed(JS, code);
    //statusList は ["0",0] となり、 code="1" は含まれない => false
    expect(result).to.be.false;
  });

  it("should return true if acceptableJobStatus is an array and code is included in the array", ()=>{
    const JS = {
      acceptableJobStatus: ["1", "99", "abc"]
    };
    const code = "99";
    const result = isJobFailed(JS, code);
    expect(result).to.be.true; //code "99" が含まれる
  });

  it("should return false if acceptableJobStatus is an array and code is not included in the array", ()=>{
    const JS = {
      acceptableJobStatus: ["1", "99", "abc"]
    };
    const code = "xyz";
    const result = isJobFailed(JS, code);
    expect(result).to.be.false;
  });

  it("should return true if acceptableJobStatus is an object that has toString() and code matches that string", ()=>{
    //数値や文字列リテラルなど、prototype の toString() でも分岐を拾う可能性がありますが、
    //ここではカスタムなオブジェクトを使う例を示します。
    const JS = {
      acceptableJobStatus: {
        toString: ()=>"ABC"
      }
    };
    const code = "ABC";
    const result = isJobFailed(JS, code);
    expect(result).to.be.true;
  });

  it("should return false if acceptableJobStatus is an object that has toString() but code does not match", ()=>{
    const JS = {
      acceptableJobStatus: {
        toString: ()=>"ABC"
      }
    };
    const code = "DEF";
    const result = isJobFailed(JS, code);
    expect(result).to.be.false;
  });

  it("should return false if acceptableJobStatus has no valid toString() function", ()=>{
    //Object.create(null) で通常の Object.prototype を継承しないオブジェクトを作る
    //=> これで typeof obj.toString === "undefined" になる
    const objNoToString = Object.create(null);
    //念のため toString が無いことを確認
    expect(typeof objNoToString.toString).to.equal("undefined");

    const JS = {
      acceptableJobStatus: objNoToString
    };
    const code = "anything";
    const result = isJobFailed(JS, code);
    expect(result).to.be.false;
  });
});

describe("#getStatusCode", ()=>{
  let rewireJobManager;
  let getStatusCode;
  let getLoggerMock;
  let loggerMock;
  let getFirstCaptureMock;
  let getBulkFirstCaptureMock;
  let createBulkStatusFileMock;

  beforeEach(()=>{
    //jobManager.jsをrewireで読み込む
    rewireJobManager = rewire("../../../app/core/jobManager.js");

    //テスト対象関数を取得
    getStatusCode = rewireJobManager.__get__("getStatusCode");

    //loggerのMockオブジェクト作成
    loggerMock = {
      debug: sinon.stub(),
      warn: sinon.stub()
    };

    //依存関数のMock化
    getLoggerMock = sinon.stub().returns(loggerMock);
    getFirstCaptureMock = sinon.stub();
    getBulkFirstCaptureMock = sinon.stub();
    createBulkStatusFileMock = sinon.stub().resolves();

    //jobManager内部の依存を差し替え
    rewireJobManager.__set__({
      getLogger: getLoggerMock,
      getFirstCapture: getFirstCaptureMock,
      getBulkFirstCapture: getBulkFirstCaptureMock,
      createBulkStatusFile: createBulkStatusFileMock
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return parsed int when (task.type !== 'bulkjobTask') and everything is normal", async ()=>{
    //テスト用のダミー引数
    const JS = {
      reJobStatusCode: "RE_JOB_STATUSCODE_{{ JOBID }}=(\\d+)",
      reReturnCode: "RE_RETURNCODE_{{ JOBID }}=(\\d+)",
      acceptableRt: [0, 1]
    };
    const task = {
      type: "normalTask",
      jobID: "123",
      projectRootDir: "/dummy/dir"
    };
    const statCmdRt = 0; //ステータスコマンド自体が正常終了
    const outputText = "RE_JOB_STATUSCODE_123=0\nRE_RETURNCODE_123=5"; //jobStatus=0, returnCode=5

    //getFirstCaptureの戻り値を設定
    getFirstCaptureMock.onFirstCall().returns("0"); //jobStatus
    getFirstCaptureMock.onSecondCall().returns("5"); //returnCode

    const result = await getStatusCode(JS, task, statCmdRt, outputText);

    expect(result).to.equal(5);
    expect(task.jobStatus).to.equal("0");
    expect(task.rt).to.equal(5);
    //loggerが想定どおり呼ばれているか(呼ばれていないメソッドなどは呼ばれない)
    expect(loggerMock.debug.called).to.be.false;
    expect(loggerMock.warn.called).to.be.false;
  });

  it("should use JS.reJobStatus instead of JS.reJobStatusCode if the latter is undefined", async ()=>{
    //reJobStatusCodeが存在しないケース => reJobStatusを使う
    const JS = {
      reJobStatus: "FALLBACK_{{ JOBID }}=(\\d+)",
      reReturnCode: "FALLBACK_RET_{{ JOBID }}=(\\d+)",
      acceptableRt: [0]
    };
    const task = {
      type: "normalTask",
      jobID: "999",
      projectRootDir: "/dummy/fallback"
    };
    const statCmdRt = 0;
    const outputText = "FALLBACK_999=2\nFALLBACK_RET_999=4";

    //Stub応答をセット
    getFirstCaptureMock.onFirstCall().returns("2"); //jobStatus
    getFirstCaptureMock.onSecondCall().returns("4"); //returnCode

    const result = await getStatusCode(JS, task, statCmdRt, outputText);

    expect(result).to.equal(4);
    expect(task.jobStatus).to.equal("2");
    expect(loggerMock.warn.called).to.be.false;
  });

  it("should set jobStatus to -2 when jobStatus is not found (null)", async ()=>{
    const JS = {
      reJobStatusCode: "NO_MATCH_{{ JOBID }}=(\\d+)",
      reReturnCode: "ANY_RET_{{ JOBID }}=(\\d+)",
      acceptableRt: [0]
    };
    const task = {
      type: "normalTask",
      jobID: "111",
      projectRootDir: "/dummy/null"
    };
    const statCmdRt = 0;
    const outputText = "SOME_OTHER_TEXT"; //マッチしない => jobStatus=null

    //getFirstCaptureでjobStatus用をnullに
    getFirstCaptureMock.onFirstCall().returns(null);
    //returnCodeは一応5を返しておく(最後まで進む)
    getFirstCaptureMock.onSecondCall().returns("5");

    const result = await getStatusCode(JS, task, statCmdRt, outputText);

    expect(result).to.equal(5);
    expect(task.jobStatus).to.equal(-2);
    expect(loggerMock.warn.called).to.be.true; //warnログが出ている
  });

  it("should return -2 immediately if statCmdRt is not acceptable", async ()=>{
    const JS = {
      reJobStatusCode: "ANY_{{ JOBID }}=(\\d+)",
      reReturnCode: "ANY_RET_{{ JOBID }}=(\\d+)",
      acceptableRt: [0, 5] //3は含まれない
    };
    const task = {
      type: "normalTask",
      jobID: "222",
      projectRootDir: "/dummy/stat"
    };
    const statCmdRt = 3; //acceptableRtに入っていない
    const outputText = "";

    const result = await getStatusCode(JS, task, statCmdRt, outputText);
    expect(result).to.equal(-2);
    //warnログが呼ばれている
    expect(loggerMock.warn.calledWithMatch("status check command failed (3)")).to.be.true;
  });

  it("should return 0 if statCmdRt is acceptable but not zero", async ()=>{
    const JS = {
      reJobStatusCode: "ANY_{{ JOBID }}=(\\d+)",
      reReturnCode: "ANY_RET_{{ JOBID }}=(\\d+)",
      acceptableRt: [0, 8] //8はOK
    };
    const task = {
      type: "normalTask",
      jobID: "333",
      projectRootDir: "/dummy/stat"
    };
    const statCmdRt = 8; //acceptable
    const outputText = "";

    const result = await getStatusCode(JS, task, statCmdRt, outputText);
    expect(result).to.equal(0);
    //warnログが呼ばれている
    expect(loggerMock.warn.calledWithMatch("it may fail to get job script's return code. so it is overwirted by 0")).to.be.true;
  });

  it("should return -2 when strRt is null", async ()=>{
    //statCmdRtが0 => 次の分岐へ進むが、reReturnCodeがマッチせずstrRt=nullのケース
    const JS = {
      reJobStatusCode: "JS_{{ JOBID }}=(\\d+)",
      reReturnCode: "RET_{{ JOBID }}=(\\d+)",
      acceptableRt: [0]
    };
    const task = {
      type: "normalTask",
      jobID: "444",
      projectRootDir: "/dummy/nullret"
    };
    const statCmdRt = 0;
    const outputText = "JS_444=0"; //returnCodeにマッチしない => null

    //jobStatus=0 を返すように
    getFirstCaptureMock.onFirstCall().returns("0");
    //returnCodeはnull
    getFirstCaptureMock.onSecondCall().returns(null);

    const result = await getStatusCode(JS, task, statCmdRt, outputText);
    expect(result).to.equal(-2);
    expect(loggerMock.warn.calledWithMatch("get return code failed")).to.be.true;
  });

  it("should return 0 when strRt is '6'", async ()=>{
    //ステップジョブ依存でキャンセルされたケース
    const JS = {
      reJobStatusCode: "JS_{{ JOBID }}=(\\d+)",
      reReturnCode: "RET_{{ JOBID }}=(\\d+)",
      acceptableRt: [0]
    };
    const task = {
      type: "normalTask",
      jobID: "555",
      projectRootDir: "/dummy/cancel"
    };
    const statCmdRt = 0;
    const outputText = "JS_555=3\nRET_555=6";

    //jobStatus=3を適当に返す
    getFirstCaptureMock.onFirstCall().returns("3");
    //returnCodeに'6'を返す
    getFirstCaptureMock.onSecondCall().returns("6");

    const result = await getStatusCode(JS, task, statCmdRt, outputText);
    expect(result).to.equal(0);
    expect(loggerMock.warn.calledWithMatch("this job was canceled by stepjob dependency")).to.be.true;
  });

  it("should handle bulkjobTask by calling createBulkStatusFile", async ()=>{
    const JS = {
      reJobStatusCode: "NO_USE", //bulkjobTaskなので使わない
      reSubJobStatusCode: "SUBSTATUS_{{ JOBID }}=(\\d+)",
      reReturnCode: "NO_USE", //同上
      reSubReturnCode: "SUBRET_{{ JOBID }}=(\\d+)",
      acceptableRt: [0]
    };
    const task = {
      type: "bulkjobTask",
      jobID: "666",
      projectRootDir: "/dummy/bulk"
    };
    const statCmdRt = 0;
    const outputText = "SUBSTATUS_666=0\nSUBRET_666=1\nSUBSTATUS_666=0\nSUBRET_666=0";

    //getBulkFirstCaptureMockの戻り値
    //[jobStatus, jobStatusList], [rt, rtCodeList]
    //例: jobStatus=0, jobStatusList=[0,0],  returnCode=1(または0), rtCodeList=[1,0]みたいなイメージ
    getBulkFirstCaptureMock.onFirstCall().returns([0, ["0", "0"]]); //jobStatus=0
    getBulkFirstCaptureMock.onSecondCall().returns([1, ["1", "0"]]); //returnCode=1 (最後にparseInt => 1)

    const result = await getStatusCode(JS, task, statCmdRt, outputText);

    expect(result).to.equal(1);
    expect(task.jobStatus).to.equal(0); //最初の getBulkFirstCapture で取得した値
    expect(task.rt).to.equal(1);
    //createBulkStatusFileが呼ばれているか
    expect(createBulkStatusFileMock.calledOnce).to.be.true;
    //debugログが呼ばれているか
    expect(loggerMock.debug.calledWithMatch("JobStatus: 0 ,jobStatusList: 0,0")).to.be.true;
    expect(loggerMock.debug.calledWithMatch("rt: 1 ,rtCodeList: 1,0")).to.be.true;
  });
});

describe("#createRequestForWebAPI", ()=>{
  let rewireJobManager;
  let createRequestForWebAPIFunc;

  //環境変数のバックアップ用
  let originalCertFilename;
  let originalCertPassphrase;

  let hostinfo;
  let task;
  let JS;

  beforeEach(()=>{
    //jobManager.js を rewire で読み込む
    rewireJobManager = rewire("../../../app/core/jobManager.js");

    //テスト対象関数を rewire の __get__ で取得
    createRequestForWebAPIFunc = rewireJobManager.__get__("createRequestForWebAPI");

    //process.env をバックアップしてから、テスト用に上書き
    originalCertFilename = process.env.WHEEL_CERT_FILENAME;
    originalCertPassphrase = process.env.WHEEL_CERT_PASSPHRASE;
    process.env.WHEEL_CERT_FILENAME = "testCertFile.p12";
    process.env.WHEEL_CERT_PASSPHRASE = "testCertPass";

    //テスト用のダミーデータを用意
    hostinfo = {
      statusCheckInterval: 5
    };
    task = {
      jobID: "12345"
    };
    JS = {
      statDelimiter: "\n",
      reRunning: "RUNNING_{{ JOBID }}",
      allowEmptyOutput: false
    };
  });

  afterEach(()=>{
    //process.env を元に戻す
    process.env.WHEEL_CERT_FILENAME = originalCertFilename;
    process.env.WHEEL_CERT_PASSPHRASE = originalCertPassphrase;
    sinon.restore();
  });

  it("should return a valid request object for Fugaku webAPI", ()=>{
    const result = createRequestForWebAPIFunc(hostinfo, task, JS);

    expect(result).to.be.an("object");

    //cmd の確認
    expect(result.cmd).to.be.a("string");
    expect(result.cmd).to.include("curl");
    expect(result.cmd).to.include("testCertFile.p12");
    expect(result.cmd).to.include("testCertPass");

    //withoutArgument の確認
    expect(result.withoutArgument).to.be.true;

    //finishedLocalHook の確認
    expect(result.finishedLocalHook).to.be.an("object");
    expect(result.finishedLocalHook.cmd).to.include("12345");

    //delimiter
    expect(result.delimiter).to.equal("\n");

    //re (reRunning)
    expect(result.re).to.equal("RUNNING_12345");

    //interval
    expect(result.interval).to.equal(5 * 1000);

    //argument
    expect(result.argument).to.equal("12345");

    //hostInfo
    expect(result.hostInfo).to.deep.equal({ host: "localhost" });

    //numAllowFirstFewEmptyOutput
    expect(result.numAllowFirstFewEmptyOutput).to.equal(3);

    //allowEmptyOutput
    expect(result.allowEmptyOutput).to.be.false;
  });
});

describe("#createRequest", ()=>{
  let rewireJobManager;
  let createRequestFunc;
  let hostinfo;
  let task;
  let JS;

  beforeEach(()=>{
    rewireJobManager = rewire("../../../app/core/jobManager.js");
    createRequestFunc = rewireJobManager.__get__("createRequest");

    hostinfo = {
      statusCheckInterval: 10,
      someOtherProperty: "dummy"
    };
    task = {
      jobID: "9999"
      //task.type を後で変更してテスト
    };
    JS = {
      stat: "qstat",
      statAfter: "qstat -f",
      bulkstat: "qstat-bulk",
      bulkstatAfter: "qstat-bulk -f",
      statDelimiter: "\n",
      reRunning: "RUNNING_{{ JOBID }}",
      allowEmptyOutput: true
    };
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return correct object when task.type is not 'bulkjobTask'", ()=>{
    task.type = "normalTask";

    const result = createRequestFunc(hostinfo, task, JS);
    expect(result).to.be.an("object");

    //cmd
    expect(result.cmd).to.equal("qstat");
    //finishedHook
    expect(result.finishedHook).to.deep.equal({
      cmd: "qstat -f",
      withArgument: true
    });
    //delimiter
    expect(result.delimiter).to.equal("\n");
    //re
    expect(result.re).to.equal("RUNNING_9999");
    //interval
    expect(result.interval).to.equal(10 * 1000);
    //argument
    expect(result.argument).to.equal("9999");
    //hostInfo
    expect(result.hostInfo).to.equal(hostinfo);
    //numAllowFirstFewEmptyOutput
    expect(result.numAllowFirstFewEmptyOutput).to.equal(3);
    //allowEmptyOutput
    expect(result.allowEmptyOutput).to.be.true;
  });

  it("should return correct object when task.type is 'bulkjobTask'", ()=>{
    task.type = "bulkjobTask";

    const result = createRequestFunc(hostinfo, task, JS);
    expect(result).to.be.an("object");

    //cmd
    expect(result.cmd).to.equal("qstat-bulk");
    //finishedHook
    expect(result.finishedHook).to.deep.equal({
      cmd: "qstat-bulk -f",
      withArgument: true
    });
    //delimiter
    expect(result.delimiter).to.equal("\n");
    //re
    expect(result.re).to.equal("RUNNING_9999");
    //interval
    expect(result.interval).to.equal(10 * 1000);
    //argument
    expect(result.argument).to.equal("9999");
    //hostInfo
    expect(result.hostInfo).to.equal(hostinfo);
    //numAllowFirstFewEmptyOutput
    expect(result.numAllowFirstFewEmptyOutput).to.equal(3);
    //allowEmptyOutput
    expect(result.allowEmptyOutput).to.be.true;
  });
});
