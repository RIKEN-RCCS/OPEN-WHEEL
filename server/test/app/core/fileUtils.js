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

describe("#readJsonGreedy", ()=>{
  let rewireFileUtils; //rewireで読み込んだfileUtils
  let readJsonGreedy; //テスト対象関数
  let fsMock; //fsをスタブ化したオブジェクト
  let promiseRetryMock; //promise-retryをスタブ化したオブジェクト

  beforeEach(()=>{
    //rewireFileUtilsを初期化
    rewireFileUtils = rewire("../../../app/core/fileUtils.js");

    //テスト対象関数を取得
    readJsonGreedy = rewireFileUtils.__get__("readJsonGreedy");

    //fsモジュールをスタブ化
    fsMock = {
      readFile: sinon.stub()
    };

    //promise-retryをスタブ化
    //実際にリトライ(タイマー)が走るとテストが遅くなるので、スタブで制御する
    promiseRetryMock = sinon.stub().callsFake(async (retryFn, options)=>{
      //retryFnには (retryErr) => {...} を渡す想定
      //ここでユーザの書いたロジックを複数回呼び出すことでリトライをシミュレートする

      //実際には retryFn を複数回試せるようにするが、
      //各テストのシナリオ毎に「何回目で成功させるか・失敗のままにするか」を決める。
      //→ テストコード内で fsMock.readFile の呼び出し回数などと合わせてコントロールする。

      let lastError;
      for (let i = 0; i <= (options.retries || 0); i++) {
        try {
          //retryFn の引数として渡すのが "retry(e)" だが、
          //このモックでは "retry(e)" を呼んだ時に単純に throw することでリトライを再実行
          //(本来のpromise-retryは再度fnを呼び直すが、ここでは手動ループで再現する)
          const result = await retryFn((err)=>{
            throw err;
          });
          return result;
        } catch (err) {
          lastError = err;
          //throw された場合はリトライし続ける
        }
      }
      //すべてのリトライを終えても成功しない場合は最後のエラーを投げる
      throw lastError;
    });

    //rewireを使ってfs, promise-retryを差し替え
    rewireFileUtils.__set__("fs", fsMock);
    rewireFileUtils.__set__("promiseRetry", promiseRetryMock);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return parsed JSON when readFile succeeds on first try", async ()=>{
    //readFile が最初から成功し、JSON 文字列も正しくパースできるケース
    fsMock.readFile.resolves(Buffer.from("{\"hello\":\"world\"}", "utf8"));

    const result = await readJsonGreedy("/path/to/file.json", 1);

    expect(promiseRetryMock.calledOnce).to.be.true;
    expect(result).to.deep.equal({ hello: "world" });
  });

  it("should retry on ENOENT and succeed on second try", async ()=>{
    //1回目は ENOENT エラー -> retry が呼ばれる
    //2回目は成功して JSON が返る想定
    fsMock.readFile
      .onCall(0).rejects(Object.assign(new Error("File not found"), { code: "ENOENT" }))
      .onCall(1)
      .resolves(Buffer.from("{\"retry\":\"success\"}", "utf8"));

    const result = await readJsonGreedy("/path/to/missing.json", 2);

    //readFile が2回呼ばれているか？
    expect(fsMock.readFile.callCount).to.equal(2);
    expect(result).to.deep.equal({ retry: "success" });
  });

  it("should throw error if readFile fails with non-ENOENT error", async ()=>{
    //codeがENOENT以外の場合は即座にthrow
    fsMock.readFile.rejects(Object.assign(new Error("Permission denied"), { code: "EACCES" }));

    try {
      await readJsonGreedy("/path/to/noaccess.json", 1);
      expect.fail("Expected to throw error");
    } catch (err) {
      expect(err.message).to.equal("Permission denied");
    }
  });

  it("should retry when file content is empty", async ()=>{
    //ファイルは存在しているが中身が空 -> retry
    fsMock.readFile
      .onCall(0).resolves(Buffer.from("", "utf8")) //空 => retry
      .onCall(1)
      .resolves(Buffer.from("{\"ok\":\"done\"}", "utf8"));

    const result = await readJsonGreedy("/path/to/empty.json", 2);
    expect(fsMock.readFile.callCount).to.equal(2);
    expect(result).to.deep.equal({ ok: "done" });
  });

  it("should retry on SyntaxError when parsing JSON", async ()=>{
    //JSON構文が誤っている -> retry
    //2回目は正しいJSON
    fsMock.readFile
      .onCall(0).resolves(Buffer.from("{invalid JSON...", "utf8"))
      .onCall(1)
      .resolves(Buffer.from("{\"valid\":true}", "utf8"));

    const result = await readJsonGreedy("/path/to/syntaxerror.json", 2);
    expect(fsMock.readFile.callCount).to.equal(2);
    expect(result).to.deep.equal({ valid: true });
  });

  it("should throw error if parse fails with non-SyntaxError", async ()=>{
    //予期しない例外がJSON.parse中に発生した場合 -> throw
    //(本来は JSON.parse で非SyntaxErrorはあまり無いが、例示として)
    const customError = new Error("Unknown parse error");
    const parseStub = sinon.stub(JSON, "parse").throws(customError);

    fsMock.readFile.resolves(Buffer.from("{\"dummy\":\"data\"}", "utf8"));

    try {
      await readJsonGreedy("/path/to/unknownerror.json", 1);
      expect.fail("Expected to throw custom error");
    } catch (err) {
      expect(err).to.equal(customError);
    } finally {
      parseStub.restore();
    }
  });

  it("should use default retries (10) if second argument is not a number", async ()=>{
    //retryパラメータを省略した場合は 10 回になる
    //ここでは実際に10回呼ぶより、promiseRetryMockの呼び出しオプションを確認して検証

    fsMock.readFile.resolves(Buffer.from("{\"default\":\"retry\"}"));

    await readJsonGreedy("/dummy/path.json"); //retry指定なし
    //promiseRetryに渡されたオプションを確認する
    const args = promiseRetryMock.getCall(0).args[1]; //第2引数がオプション
    expect(args.retries).to.equal(10);
    expect(args.minTimeout).to.equal(500);
    expect(args.factor).to.equal(1);
  });
});
