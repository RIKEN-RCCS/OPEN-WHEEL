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

describe("#addX", ()=>{
  let rewireFileUtils;
  let addX;
  let fsMock;
  let modeMock;

  beforeEach(()=>{
    //fileUtils.js を rewire で読み込む
    rewireFileUtils = rewire("../../../app/core/fileUtils.js");

    //テスト対象関数を rewire で取得
    addX = rewireFileUtils.__get__("addX");

    //fs と Mode をモック化する
    fsMock = {
      stat: sinon.stub(),
      chmod: sinon.stub()
    };
    modeMock = sinon.stub();

    //rewireでfileUtils内部のfs, Modeを差し替える
    rewireFileUtils.__set__({
      fs: fsMock,
      Mode: modeMock
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should set '444' if no read/write bits are set (owner/group/others)", async ()=>{
    //モック化したfs.statが返すstatオブジェクト
    fsMock.stat.resolves({ /*dummy stat object */ });

    //Modeのコンストラクタが返すowner/group/othersのread/writeをすべて false
    modeMock.returns({
      owner: { read: false, write: false },
      group: { read: false, write: false },
      others: { read: false, write: false }
    });

    fsMock.chmod.resolves(); //成功を返す

    const filePath = "/dummy/path";
    await addX(filePath);

    //'444' になっているか
    expect(fsMock.chmod.calledOnceWithExactly(filePath, "444")).to.be.true;
  });

  it("should set '555' if only read bits are set for owner/group/others", async ()=>{
    fsMock.stat.resolves({});
    modeMock.returns({
      owner: { read: true, write: false },
      group: { read: true, write: false },
      others: { read: true, write: false }
    });
    fsMock.chmod.resolves();

    const filePath = "/dummy/path";
    await addX(filePath);

    //'555' になっているか
    expect(fsMock.chmod.calledOnceWithExactly(filePath, "555")).to.be.true;
  });

  it("should set '666' if only write bits are set for owner/group/others", async ()=>{
    fsMock.stat.resolves({});
    modeMock.returns({
      owner: { read: false, write: true },
      group: { read: false, write: true },
      others: { read: false, write: true }
    });
    fsMock.chmod.resolves();

    const filePath = "/dummy/path";
    await addX(filePath);

    //'666' になっているか
    expect(fsMock.chmod.calledOnceWithExactly(filePath, "666")).to.be.true;
  });

  it("should set '777' if read and write bits are set for owner/group/others", async ()=>{
    fsMock.stat.resolves({});
    modeMock.returns({
      owner: { read: true, write: true },
      group: { read: true, write: true },
      others: { read: true, write: true }
    });
    fsMock.chmod.resolves();

    const filePath = "/dummy/path";
    await addX(filePath);

    //'777' になっているか
    expect(fsMock.chmod.calledOnceWithExactly(filePath, "777")).to.be.true;
  });

  it("should set mixed bits correctly if only owner has read/write, group has read only, others none", async ()=>{
    fsMock.stat.resolves({});
    modeMock.returns({
      owner: { read: true, write: true }, //=> +1 +2
      group: { read: true, write: false }, //=> +1
      others: { read: false, write: false }
    });
    fsMock.chmod.resolves();

    const filePath = "/dummy/path";
    await addX(filePath);

    //owner:4+1+2=7, group:4+1=5, others:4=4 => "754"
    expect(fsMock.chmod.calledOnceWithExactly(filePath, "754")).to.be.true;
  });

  it("should reject if fs.stat fails", async ()=>{
    //statが失敗した場合
    const statError = new Error("stat error");
    fsMock.stat.rejects(statError);

    try {
      await addX("/some/path");
      expect.fail("Expected addX to reject, but it resolved");
    } catch (err) {
      expect(err).to.equal(statError);
    }
    //chmodは呼ばれない
    expect(fsMock.chmod.called).to.be.false;
  });

  it("should reject if fs.chmod fails", async ()=>{
    fsMock.stat.resolves({});
    modeMock.returns({
      owner: { read: false, write: false },
      group: { read: false, write: false },
      others: { read: false, write: false }
    });
    //chmodでエラー
    const chmodError = new Error("chmod error");
    fsMock.chmod.rejects(chmodError);

    try {
      await addX("/some/path");
      expect.fail("Expected addX to reject, but it resolved");
    } catch (err) {
      expect(err).to.equal(chmodError);
    }
  });
});

describe("#deliverFile", ()=>{
  let rewireFileUtils;
  let deliverFile;
  let fsMock; //fsモジュールをstub化
  let statsMock; //fs.lstatで返されるstatオブジェクトをstub化

  beforeEach(()=>{
    //rewireでfileUtils.jsを読み込み
    rewireFileUtils = rewire("../../../app/core/fileUtils.js");

    //テスト対象関数deliverFileを取得
    deliverFile = rewireFileUtils.__get__("deliverFile");

    //fsモックを用意し、呼び出しをすべてsinon.stub()化
    fsMock = {
      lstat: sinon.stub(),
      copy: sinon.stub(),
      remove: sinon.stub(),
      ensureSymlink: sinon.stub()
    };

    //fileUtils.js内部のfsをモックに差し替え
    rewireFileUtils.__set__("fs", fsMock);

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

describe("#deliverFileOnRemote", ()=>{
  let rewireFileUtils;
  let deliverFileOnRemote;
  let getLoggerMock;
  let loggerMock;
  let getSshMock;
  let sshMock;

  beforeEach(()=>{
    //rewire で fileUtils.js を読み込む
    rewireFileUtils = rewire("../../../app/core/fileUtils.js");

    //テスト対象関数の取得
    deliverFileOnRemote = rewireFileUtils.__get__("deliverFileOnRemote");

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

    //rewire で fileUtils.js 内部の依存を差し替え
    rewireFileUtils.__set__("getLogger", getLoggerMock);
    rewireFileUtils.__set__("getSsh", getSshMock);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return null and log a warning if recipe.onRemote is false", async ()=>{
    const recipe = {
      onRemote: false, //onRemoteがfalseの場合のテスト
      projectRootDir: "/dummy/dir",
      remotehostID: "hostID"
    };
    const result = await deliverFileOnRemote(recipe);

    expect(result).to.be.null;
    expect(loggerMock.warn.calledOnceWithExactly("deliverFileOnRemote must be called with onRemote flag")).to.be.true;
    //getSsh は呼ばれない
    expect(getSshMock.notCalled).to.be.true;
  });

  it("should execute ln -sf if forceCopy is false and ssh.exec returns 0 (success)", async ()=>{
    const recipe = {
      onRemote: true,
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

    const result = await deliverFileOnRemote(recipe);

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
      onRemote: true,
      forceCopy: true,
      projectRootDir: "/project/copy",
      remotehostID: "copyHostID",
      srcRoot: "/remote/src2",
      srcName: "folderA",
      dstRoot: "/remote/dest2",
      dstName: "folderB"
    };
    sshMock.exec.resolves(0);

    const result = await deliverFileOnRemote(recipe);

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
      onRemote: true,
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
      await deliverFileOnRemote(recipe);
      expect.fail("Expected deliverFileOnRemote to throw, but it did not");
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

describe("#deliverFileFromRemote", ()=>{
  let rewireFileUtils;
  let deliverFileFromRemote;
  let getLoggerMock;
  let loggerMock;
  let getSshMock;
  let sshMock;
  let consoleLogMock;

  beforeEach(()=>{
    //fileUtils.js を rewireで読み込む
    rewireFileUtils = rewire("../../../app/core/fileUtils.js");

    //テスト対象関数を取得
    deliverFileFromRemote = rewireFileUtils.__get__("deliverFileFromRemote");

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

    //console.logをスタブ化（エラー出力部分のカバレッジを取得するため）
    consoleLogMock = sinon.stub(console, "log");

    //rewireで差し替え
    rewireFileUtils.__set__({
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
    const result = await deliverFileFromRemote(recipe);

    //検証
    expect(result).to.be.null;
    expect(loggerMock.warn.calledOnceWithExactly("deliverFileFromRemote must be called with remoteToLocal flag")).to.be.true;
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
      await deliverFileFromRemote(recipe);
      expect.fail("Expected deliverFileFromRemote to reject, but it resolved");
    } catch (err) {
      expect(err).to.equal(fakeError);
      //console.log(e) が呼ばれたことも確認
      expect(consoleLogMock.calledWith(fakeError)).to.be.true;
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
    const result = await deliverFileFromRemote(recipe);

    //検証
    expect(result).to.deep.equal({
      type: "copy",
      src: "/remote/src/fileB.dat",
      dst: "/local/dst/fileB.dat"
    });
    expect(sshMock.recv.calledOnceWithExactly(
      ["/remote/src/fileB.dat"],
      "/local/dst/fileB.dat",
      ["-vv"]
    )).to.be.true;
  });
});
