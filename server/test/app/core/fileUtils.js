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

describe("#openFile", ()=>{
  let rewireFileUtils;
  let openFile;
  let fsMock;
  let readJsonGreedyMock;
  let getLoggerMock;
  let loggerMock;
  const dummyProjectRoot = "/dummy/projectRoot";

  beforeEach(()=>{
    //fileUtils.js を rewire で読み込む
    rewireFileUtils = rewire("../../../app/core/fileUtils.js");
    //テスト対象関数 openFile を取得
    openFile = rewireFileUtils.__get__("openFile");

    //fs のスタブを作成
    fsMock = {
      readFile: sinon.stub(),
      ensureFile: sinon.stub()
    };
    //logger のスタブ
    loggerMock = { warn: sinon.stub() };
    getLoggerMock = sinon.stub().returns(loggerMock);
    //readJsonGreedy のスタブ
    readJsonGreedyMock = sinon.stub();

    //rewire で差し替え
    rewireFileUtils.__set__("fs", fsMock);
    rewireFileUtils.__set__("getLogger", getLoggerMock);
    rewireFileUtils.__set__("readJsonGreedy", readJsonGreedyMock);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should create an empty file and return empty content object if file does not exist (ENOENT)", async ()=>{
    //readFile が ENOENT を投げる
    fsMock.readFile.rejects({ code: "ENOENT" });
    fsMock.ensureFile.resolves();

    const result = await openFile(dummyProjectRoot, "notExist.txt");

    expect(fsMock.ensureFile.calledOnce).to.be.true;
    //戻り値を検証
    expect(result).to.have.lengthOf(1);
    expect(result[0].content).to.equal("");
    expect(result[0].filename).to.equal("notExist.txt");
  });

  it("should throw an error if fs.readFile fails with non-ENOENT error", async ()=>{
    //readFile が別のエラーを投げる
    fsMock.readFile.rejects(new Error("Unknown error"));

    try {
      await openFile(dummyProjectRoot, "someFile.txt");
      expect.fail("Expected openFile to throw but it did not");
    } catch (err) {
      expect(err).to.be.an("Error");
      expect(err.message).to.equal("Unknown error");
    }
  });

  it("should return single object if forceNormal = true", async ()=>{
    //ファイルを正常に読み込める前提
    fsMock.readFile.resolves(Buffer.from("normal content"));
    const result = await openFile(dummyProjectRoot, "normalFile.txt", true);

    expect(result).to.have.lengthOf(1);
    expect(result[0]).to.deep.include({
      content: "normal content",
      filename: "normalFile.txt"
    });
  });

  it("should return single object if JSON.parse fails (not a parameter file)", async ()=>{
    fsMock.readFile.resolves(Buffer.from("{ invalid JSON"));
    //forceNormal = false (デフォルト) のまま
    const result = await openFile(dummyProjectRoot, "invalid.json");

    expect(result).to.have.lengthOf(1);
    expect(result[0]).to.deep.include({
      filename: "invalid.json",
      content: "{ invalid JSON"
    });
  });

  it("should return single object if parsed JSON does not have targetFiles property", async ()=>{
    fsMock.readFile.resolves(Buffer.from("{\"someKey\": 123}"));
    const result = await openFile(dummyProjectRoot, "noTargetFiles.json");

    expect(result).to.have.lengthOf(1);
    expect(result[0].filename).to.equal("noTargetFiles.json");
    expect(result[0].content).to.equal("{\"someKey\": 123}");
  });

  it("should return single object if targetFiles is not an array", async ()=>{
    fsMock.readFile.resolves(Buffer.from("{\"targetFiles\": \"not array\"}"));
    const result = await openFile(dummyProjectRoot, "notArray.json");

    expect(result).to.have.lengthOf(1);
    expect(result[0].content).to.equal("{\"targetFiles\": \"not array\"}");
  });

  it("should read multiple target files if parameter setting file has array of string targetFiles", async ()=>{
    //ベースファイル: parameter setting file
    fsMock.readFile.onCall(0).resolves(Buffer.from(JSON.stringify({
      targetFiles: ["sub1.txt", "sub2.txt"]
    })));
    //project.json を読む readJsonGreedy は componentPath を返す想定
    readJsonGreedyMock.resolves({
      componentPath: {}
    });
    //sub1.txt, sub2.txt の中身を用意
    fsMock.readFile.onCall(1).resolves(Buffer.from("content sub1"));
    fsMock.readFile.onCall(2).resolves(Buffer.from("content sub2"));

    const result = await openFile(dummyProjectRoot, "param.json");

    //戻り値の検証
    expect(result).to.have.lengthOf(3);

    //先頭がパラメータ設定ファイル自身
    expect(result[0]).to.include({
      filename: "param.json",
      isParameterSettingFile: true
    });
    //sub1.txt
    expect(result[1]).to.include({
      content: "content sub1",
      filename: "sub1.txt"
    });
    //sub2.txt
    expect(result[2]).to.include({
      content: "content sub2",
      filename: "sub2.txt"
    });
  });

  it("should handle target files which are object with only targetName (no targetNode)", async ()=>{
    //parameter file
    fsMock.readFile.onCall(0).resolves(Buffer.from(JSON.stringify({
      targetFiles: [
        { targetName: "hello.txt" }
      ]
    })));
    readJsonGreedyMock.resolves({ componentPath: {} });
    fsMock.readFile.onCall(1).resolves(Buffer.from("hello content"));

    const result = await openFile(dummyProjectRoot, "paramObj.json");

    expect(result).to.have.lengthOf(2);
    expect(result[0]).to.have.property("isParameterSettingFile", true);
    expect(result[1]).to.include({
      filename: "hello.txt",
      content: "hello content"
    });
  });
});

describe("#saveFile", ()=>{
  let rewireFileUtils;
  let saveFile;
  let fsMock;
  let pathMock;
  let gitAddMock;

  beforeEach(()=>{
    rewireFileUtils = rewire("../../../app/core/fileUtils.js");

    //テスト対象関数を取得
    saveFile = rewireFileUtils.__get__("saveFile");

    //sinon.stub() でテストダブルを作成（末尾はMock）
    fsMock = {
      writeFile: sinon.stub().resolves(),
      pathExists: sinon.stub().resolves()
    };
    pathMock = {
      resolve: sinon.stub(),
      parse: sinon.stub(),
      dirname: sinon.stub(),
      join: sinon.stub()
    };
    gitAddMock = sinon.stub().resolves();

    //rewire を使って差し替え
    rewireFileUtils.__set__({
      fs: fsMock,
      path: pathMock,
      gitAdd: gitAddMock
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should save file and add to git when .git directory is found at the same level", async ()=>{
    //モックの動作定義
    pathMock.resolve.returns("/home/user/project/file.txt");
    pathMock.parse.returns({
      root: "/home",
      dir: "/home/user/project",
      base: "file.txt",
      name: "file",
      ext: ".txt"
    });
    pathMock.dirname.onCall(0).returns("/home/user/project"); //最初の dirname 呼び出し
    pathMock.join.callsFake((dir, file)=>`${dir}/${file}`);

    //1回目の pathExists で true (.git が見つかる)
    fsMock.pathExists.resolves(true);

    await saveFile("file.txt", "Hello, world!");

    //writeFile が正しく呼ばれたか
    expect(fsMock.writeFile.calledOnceWithExactly(
      "/home/user/project/file.txt",
      "Hello, world!"
    )).to.be.true;

    //pathExists は一度だけ呼ばれて true が返り、ループを抜ける
    expect(fsMock.pathExists.calledOnceWithExactly("/home/user/project/.git")).to.be.true;

    //gitAdd が呼ばれる
    expect(gitAddMock.calledOnceWithExactly(
      "/home/user/project", //repoDir
      "/home/user/project/file.txt" //absFilename
    )).to.be.true;
  });

  it("should climb up directories until .git is found", async ()=>{
    pathMock.resolve.returns("/home/user/project/subdir/file.txt");
    pathMock.parse.returns({
      root: "/home",
      dir: "/home/user/project/subdir",
      base: "file.txt",
      name: "file",
      ext: ".txt"
    });
    //ループの中で dirname が呼ばれるたびにディレクトリを一つずつ上がっていく想定
    pathMock.dirname.onCall(0).returns("/home/user/project/subdir");
    pathMock.dirname.onCall(1).returns("/home/user/project");
    pathMock.dirname.onCall(2).returns("/home/user");

    pathMock.join.callsFake((dir, file)=>`${dir}/${file}`);

    //.git が最初のチェックでは見つからない(false) -> 次の階層で見つかる(true)
    fsMock.pathExists.onCall(0).resolves(false);
    fsMock.pathExists.onCall(1).resolves(true);

    await saveFile("/someRelativePath/file.txt", "Some content");

    //writeFile が正しく呼ばれているか
    expect(fsMock.writeFile.calledOnceWithExactly(
      "/home/user/project/subdir/file.txt",
      "Some content"
    )).to.be.true;

    //最初は "/home/user/project/subdir/.git" を探して失敗 -> 次は "/home/user/project/.git" を探す
    expect(fsMock.pathExists.getCall(0).args[0]).to.equal("/home/user/project/subdir/.git");
    expect(fsMock.pathExists.getCall(1).args[0]).to.equal("/home/user/project/.git");

    //gitAdd が最終的に "/home/user/project" を repoDir として呼ばれている
    expect(gitAddMock.calledOnceWithExactly(
      "/home/user/project",
      "/home/user/project/subdir/file.txt"
    )).to.be.true;
  });

  it("should throw an error if no .git repository is found up to root directory", async ()=>{
    pathMock.resolve.returns("/home/user/project/file.txt");
    pathMock.parse.returns({
      root: "/home",
      dir: "/home/user/project",
      base: "file.txt",
      name: "file",
      ext: ".txt"
    });
    //dirname を辿っていくと最終的に /home へ。さらに上がると / (root)
    pathMock.dirname.onCall(0).returns("/home/user/project");
    pathMock.dirname.onCall(1).returns("/home/user");
    pathMock.dirname.onCall(2).returns("/home");

    //.git を常に見つけられない
    fsMock.pathExists.resolves(false);

    //エラーのテスト
    try {
      await saveFile("file.txt", "No .git anywhere");
      expect.fail("Expected an error but none was thrown");
    } catch (err) {
      expect(err).to.be.instanceOf(Error);
      expect(err.message).to.equal("git repository not found");
      //カスタムで入れているエラー情報も検証
      expect(err.filename).to.equal("file.txt");
      expect(err.absFilename).to.equal("/home/user/project/file.txt");
    }

    //gitAdd は呼ばれていない
    expect(gitAddMock.notCalled).to.be.true;
  });

  it("should throw an error if fs.writeFile fails", async ()=>{
    pathMock.resolve.returns("/home/user/project/file.txt");
    pathMock.parse.returns({
      root: "/home",
      dir: "/home/user/project",
      base: "file.txt",
      name: "file",
      ext: ".txt"
    });
    pathMock.dirname.returns("/home/user/project");
    pathMock.join.returns("/home/user/project/.git");

    //writeFile が失敗するように設定
    const writeError = new Error("Write operation failed");
    fsMock.writeFile.rejects(writeError);

    fsMock.pathExists.resolves(true); //一応 .git はある想定

    try {
      await saveFile("file.txt", "some content");
      expect.fail("Expected an error due to fs.writeFile, but none was thrown");
    } catch (err) {
      expect(err).to.equal(writeError);
    }

    //gitAdd には到達しない
    expect(gitAddMock.notCalled).to.be.true;
  });
});

describe("#getUnusedPath", ()=>{
  let rewireFileUtils;
  let getUnusedPath;
  let fsMock; //sinon.stub()で作成するモックには Mock の接尾語をつける

  beforeEach(()=>{
    //fileUtils.js を rewire で取得
    rewireFileUtils = rewire("../../../app/core/fileUtils.js");

    //テスト対象の関数を __get__ で取得
    getUnusedPath = rewireFileUtils.__get__("getUnusedPath");

    //fs のモックを作成し、必要なメソッドだけスタブ化
    fsMock = {
      pathExists: sinon.stub()
    };

    //rewire を使って fileUtils.js 内の fs をモックに差し替え
    rewireFileUtils.__set__("fs", fsMock);
  });

  it("should return the desired path if it does not exist", async ()=>{
    //desiredPath がまだ存在しないケース
    fsMock.pathExists.resolves(false);

    const parent = "/mock/parent/dir";
    const name = "testFile.txt";

    const result = await getUnusedPath(parent, name);

    //path.resolve の結果 "/mock/parent/dir/testFile.txt" を確認
    expect(fsMock.pathExists.calledOnceWithExactly("/mock/parent/dir/testFile.txt")).to.be.true;
    //ファイルが存在しないのでそのまま返る
    expect(result).to.equal("/mock/parent/dir/testFile.txt");
  });

  it("should return a suffixed path if the desired path already exists", async ()=>{
    //1回目: 元のファイルが存在する (true)
    //2回目: suffix=1 も存在する (true)
    //3回目: suffix=2 は存在しない (false) => ループを抜けて返す
    fsMock.pathExists
      .onFirstCall().resolves(true)
      .onSecondCall()
      .resolves(true)
      .onThirdCall()
      .resolves(false);

    const parent = "/mock/parent/dir";
    const name = "testFile.txt";

    const result = await getUnusedPath(parent, name);

    expect(fsMock.pathExists.callCount).to.equal(3);
    expect(fsMock.pathExists.getCall(0).args[0]).to.equal("/mock/parent/dir/testFile.txt"); //元のパス
    expect(fsMock.pathExists.getCall(1).args[0]).to.equal("/mock/parent/dir/testFile.txt.1"); //suffix=1
    expect(fsMock.pathExists.getCall(2).args[0]).to.equal("/mock/parent/dir/testFile.txt.2"); //suffix=2
    expect(result).to.equal("/mock/parent/dir/testFile.txt.2");
  });
});

describe("#replaceCRLF", ()=>{
  let rewireFileUtils;
  let replaceCRLF;
  let fsMock;

  beforeEach(()=>{
    //fileUtils.js をrewireで読み込む
    rewireFileUtils = rewire("../../../app/core/fileUtils.js");

    //テスト対象関数を取得
    replaceCRLF = rewireFileUtils.__get__("replaceCRLF");

    //fsをStub化
    fsMock = {
      readFile: sinon.stub(),
      writeFile: sinon.stub()
    };

    //fileUtils.js内部のfsを差し替え
    rewireFileUtils.__set__("fs", fsMock);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should replace CRLF with LF and write the file back", async ()=>{
    //readFile成功 -> CRLF混じり文字列を返す
    fsMock.readFile.resolves(Buffer.from("line1\r\nline2\r\n"));
    fsMock.writeFile.resolves();

    await replaceCRLF("/path/to/windowsfile.txt");

    //readFileが正しく呼ばれたか確認
    expect(fsMock.readFile.calledOnceWithExactly("/path/to/windowsfile.txt")).to.be.true;

    //writeFileに渡される文字列が \r\n -> \n に変換されているか確認
    expect(fsMock.writeFile.calledOnce).to.be.true;
    const writeArgs = fsMock.writeFile.getCall(0).args;
    expect(writeArgs[0]).to.equal("/path/to/windowsfile.txt");
    expect(writeArgs[1]).to.equal("line1\nline2\n");
  });

  it("should keep LF as is if there is no CRLF", async ()=>{
    //readFile成功 -> LFのみの文字列を返す
    fsMock.readFile.resolves(Buffer.from("line1\nline2\n"));
    fsMock.writeFile.resolves();

    await replaceCRLF("/path/to/unixfile.txt");

    expect(fsMock.readFile.calledOnceWithExactly("/path/to/unixfile.txt")).to.be.true;
    expect(fsMock.writeFile.calledOnce).to.be.true;
    const writeArgs = fsMock.writeFile.getCall(0).args;
    expect(writeArgs[0]).to.equal("/path/to/unixfile.txt");
    //もともと LF だけなので置換内容は同じ
    expect(writeArgs[1]).to.equal("line1\nline2\n");
  });

  it("should reject if readFile fails", async ()=>{
    //readFileが失敗するケース
    fsMock.readFile.rejects(new Error("readFile error"));

    try {
      await replaceCRLF("/path/to/errorfile.txt");
      expect.fail("Expected an error but none was thrown");
    } catch (err) {
      expect(err.message).to.equal("readFile error");
    }
    //writeFileは呼ばれない
    expect(fsMock.writeFile.called).to.be.false;
  });

  it("should reject if writeFile fails", async ()=>{
    //readFile成功、writeFile失敗のケース
    fsMock.readFile.resolves(Buffer.from("line1\r\nline2\r\n"));
    fsMock.writeFile.rejects(new Error("writeFile error"));

    try {
      await replaceCRLF("/path/to/errorfile2.txt");
      expect.fail("Expected an error but none was thrown");
    } catch (err) {
      expect(err.message).to.equal("writeFile error");
    }
  });
});
