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

describe("#initialize", ()=>{
  let rewireAuth;
  let initialize;
  let openMock;
  let dbMock;

  beforeEach(()=>{
    //auth.js を rewire で読み込む
    rewireAuth = rewire("../../../app/core/auth.js");

    //テスト対象関数 initialize を取得
    initialize = rewireAuth.__get__("initialize");

    //dbオブジェクトを模倣するモックを作成し、execメソッドをStub化
    dbMock = {
      exec: sinon.stub().resolves()
    };

    //sqlite の open 関数をStub化し、dbMockを返すように設定
    openMock = sinon.stub().resolves(dbMock);

    //rewire を使って auth.js 内部の open を差し替え
    rewireAuth.__set__("open", openMock);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should open the database, create the table, set initialized to true, and return db", async ()=>{
    const result = await initialize();

    //open が呼ばれたことを確認
    expect(openMock.calledOnce).to.be.true;

    //dbMock.exec が正しいSQL文で呼ばれたことを確認
    expect(dbMock.exec.calledWith(
      "CREATE TABLE IF NOT EXISTS users ( \
    id INT PRIMARY KEY, \
    username TEXT UNIQUE, \
    hashed_password BLOB, \
    salt BLOB \
  )"
    )).to.be.true;

    //initialized が true になったかを確認
    expect(rewireAuth.__get__("initialized")).to.be.true;

    //return値が dbMock であることを確認
    expect(result).to.equal(dbMock);
  });
});

describe("#getHashedPassword", ()=>{
  let rewireAuth;
  let getHashedPassword;
  let pbkdf2Mock;

  beforeEach(()=>{
    //auth.jsをrewireで読み込み
    rewireAuth = rewire("../../../app/core/auth.js");

    //テスト対象関数を取得
    getHashedPassword = rewireAuth.__get__("getHashedPassword");

    //crypto.pbkdf2をStub化 (末尾はMock)
    pbkdf2Mock = sinon.stub();

    //auth.js内部のcryptoモジュールのpbkdf2だけをStubに差し替え
    //その他の関数(crypto.randomBytesなど)は元のまま使うのでスプレッドで展開
    rewireAuth.__set__("crypto", {
      ...require("crypto"),
      pbkdf2: pbkdf2Mock
    });
  });

  afterEach(()=>{
    //テストごとにスタブをリストア
    sinon.restore();
  });

  it("should return a Buffer with hashed password if pbkdf2 succeeds", async ()=>{
    //pbkdf2Mock が成功コールバックを返すように設定
    pbkdf2Mock.callsFake((password, salt, iterations, keylen, digest, callback)=>{
      //本来はBufferを返す
      callback(null, Buffer.from("fake hashed password"));
    });

    const password = "testPassword";
    const salt = "testSalt";

    //テスト対象呼び出し
    const result = await getHashedPassword(password, salt);

    //期待値検証
    expect(pbkdf2Mock.calledOnce).to.be.true;
    expect(result).to.be.instanceOf(Buffer);
    expect(result.toString()).to.equal("fake hashed password");
  });

  it("should throw an error if pbkdf2 fails", async ()=>{
    //pbkdf2Mock がエラーコールバックを返すように設定
    pbkdf2Mock.callsFake((password, salt, iterations, keylen, digest, callback)=>{
      callback(new Error("pbkdf2 error"));
    });

    const password = "testPassword";
    const salt = "testSalt";

    try {
      await getHashedPassword(password, salt);
      //ここに来てしまったらテスト失敗
      expect.fail("Expected getHashedPassword to throw an error, but it did not");
    } catch (err) {
      expect(err).to.be.instanceOf(Error);
      expect(err.message).to.equal("pbkdf2 error");
    }
  });
});

describe("#addUser", ()=>{
  let rewireAuth;
  let addUser;
  let initializeMock;
  let getUserDataMock;
  let randomUUIDMock;
  let randomBytesMock;
  let getHashedPasswordMock;
  let dbRunMock;

  beforeEach(()=>{
    //auth.js を rewire で読み込み
    rewireAuth = rewire("../../../app/core/auth.js");

    //テスト対象関数を取得
    addUser = rewireAuth.__get__("addUser");

    //sinon.stub() を用いて Mock（Stub）を作成
    initializeMock = sinon.stub();
    getUserDataMock = sinon.stub();
    randomUUIDMock = sinon.stub();
    randomBytesMock = sinon.stub();
    getHashedPasswordMock = sinon.stub();
    dbRunMock = sinon.stub();

    //auth.js 内部の変数や依存関数を rewireAuth.__set__ で差し替え
    //initialized をとりあえず false にしておく (各テストで状況を変える)
    rewireAuth.__set__("initialized", false);

    rewireAuth.__set__("initialize", initializeMock);
    rewireAuth.__set__("getUserData", getUserDataMock);

    //crypto.randomUUID, crypto.randomBytes を置き換え
    rewireAuth.__set__("crypto", {
      randomUUID: randomUUIDMock,
      randomBytes: randomBytesMock
    });

    rewireAuth.__set__("getHashedPassword", getHashedPasswordMock);

    //db.run を置き換え
    rewireAuth.__set__("db", {
      run: dbRunMock
    });
  });

  afterEach(()=>{
    //テストごとにスタブをリセット
    sinon.restore();
  });

  it("should initialize if not initialized, then insert user if the user does not exist", async ()=>{
    //initialize 未実行のケース
    //user がまだ存在しないケース
    initializeMock.resolves();
    getUserDataMock.resolves(null);
    randomUUIDMock.returns("unique-id-123");
    randomBytesMock.returns(Buffer.from("salt123"));
    getHashedPasswordMock.resolves(Buffer.from("hashed123"));
    dbRunMock.resolves();

    await addUser("john", "secret");

    //initialize が呼ばれた
    expect(initializeMock.calledOnce).to.be.true;
    //getUserData が正しく呼ばれた
    expect(getUserDataMock.calledOnceWithExactly("john")).to.be.true;
    //crypto 関連が呼ばれているか
    expect(randomUUIDMock.calledOnce).to.be.true;
    expect(randomBytesMock.calledOnceWithExactly(16)).to.be.true;
    //パスワードハッシュ関数の呼び出し確認
    expect(getHashedPasswordMock.calledOnceWithExactly("secret", Buffer.from("salt123"))).to.be.true;
    //DB への INSERT 実行確認
    expect(dbRunMock.calledOnce).to.be.true;

    //db.run の呼び出し引数を詳細チェック
    const [sql, id, username, hashedPw, salt] = dbRunMock.firstCall.args;
    expect(sql).to.include("INSERT OR IGNORE INTO users");
    expect(id).to.equal("unique-id-123");
    expect(username).to.equal("john");
    expect(hashedPw).to.deep.equal(Buffer.from("hashed123"));
    expect(salt).to.deep.equal(Buffer.from("salt123"));
  });

  it("should skip initialize if already initialized is true and user does not exist", async ()=>{
    //すでに initialize 済みのケース
    rewireAuth.__set__("initialized", true);

    initializeMock.resolves(); //呼ばれない想定だが、stub には一応セット
    getUserDataMock.resolves(null);
    randomUUIDMock.returns("unique-id-abc");
    randomBytesMock.returns(Buffer.from("saltABC"));
    getHashedPasswordMock.resolves(Buffer.from("hashedABC"));
    dbRunMock.resolves();

    await addUser("alice", "mypassword");

    //すでに initialized = true なので initialize は呼ばれない
    expect(initializeMock.notCalled).to.be.true;
    //そのほかの流れは同様
    expect(getUserDataMock.calledOnceWithExactly("alice")).to.be.true;
    expect(randomUUIDMock.calledOnce).to.be.true;
    expect(randomBytesMock.calledOnce).to.be.true;
    expect(getHashedPasswordMock.calledOnce).to.be.true;
    expect(dbRunMock.calledOnce).to.be.true;
  });

  it("should throw an error if user already exists", async ()=>{
    //すでにユーザーが存在するケース
    initializeMock.resolves();
    getUserDataMock.resolves({ username: "bob" });

    try {
      await addUser("bob", "secret2");
      //ここに到達したらテスト失敗
      expect.fail("Expected addUser to throw an error, but it did not");
    } catch (err) {
      //"user already exists" エラーになる
      expect(err.message).to.equal("user already exists");
      //エラーオブジェクトには username プロパティが設定される
      expect(err).to.have.property("username", "bob");
    }

    //ユーザー存在チェックの前に initialize が呼ばれている
    expect(initializeMock.calledOnce).to.be.true;
    //既存ユーザーのため INSERT は実行されない
    expect(dbRunMock.notCalled).to.be.true;
  });
});

describe("#getUserData", ()=>{
  let rewireAuth;
  let getUserData;
  let dbMock;

  beforeEach(()=>{
    //auth.js を rewire で読み込む
    rewireAuth = rewire("../../../app/core/auth.js");

    //テスト対象関数を取得
    getUserData = rewireAuth.__get__("getUserData");

    //db 変数をモック化 (sinon.stub() を使用)
    dbMock = {
      get: sinon.stub()
    };

    //auth.js 内の db を差し替え
    rewireAuth.__set__("db", dbMock);
  });

  it("should return null if user does not exist in DB", async ()=>{
    //db.get が見つからなかった場合 (undefined など) を返すように設定
    dbMock.get.resolves(undefined);

    const result = await getUserData("nonexistentUser");
    expect(result).to.be.null;
    expect(dbMock.get.calledOnceWithExactly(
      "SELECT * FROM users WHERE username = ?",
      "nonexistentUser"
    )).to.be.true;
  });

  it("should return null if DB row exists but row.username does not match", async ()=>{
    //row は取得できるが、username が異なるケース
    dbMock.get.resolves({
      username: "anotherUser",
      hashed_password: Buffer.from("someHash"),
      salt: Buffer.from("someSalt"),
      id: "userID999"
    });

    const result = await getUserData("testUser");
    expect(result).to.be.null;
  });

  it("should return the row if DB row exists and row.username matches", async ()=>{
    const fakeRow = {
      username: "testUser",
      hashed_password: Buffer.from("someHash"),
      salt: Buffer.from("someSalt"),
      id: "userID123"
    };
    dbMock.get.resolves(fakeRow);

    const result = await getUserData("testUser");
    expect(result).to.deep.equal(fakeRow);
  });
});

describe("#isValidUser", ()=>{
  let rewireAuth;
  let isValidUser;
  let initializeMock;
  let getUserDataMock;
  let getHashedPasswordMock;
  let loggerTraceMock;
  let timingSafeEqualMock;

  beforeEach(()=>{
    //auth.js を rewire で読み込む
    rewireAuth = rewire("../../../app/core/auth.js");

    //テスト対象の関数を取得
    isValidUser = rewireAuth.__get__("isValidUser");

    //各種依存関数・変数をStub化
    initializeMock = sinon.stub();
    getUserDataMock = sinon.stub();
    getHashedPasswordMock = sinon.stub();
    loggerTraceMock = sinon.stub();
    timingSafeEqualMock = sinon.stub();

    //auth.js 内部の依存を差し替え
    rewireAuth.__set__("initialize", initializeMock);
    rewireAuth.__set__("getUserData", getUserDataMock);
    rewireAuth.__set__("getHashedPassword", getHashedPasswordMock);
    //logger.trace だけ使うので logger オブジェクトを Stub にすげ替える
    rewireAuth.__set__("logger", { trace: loggerTraceMock });
    //crypto.timingSafeEqual を Stub 化
    rewireAuth.__set__("crypto.timingSafeEqual", timingSafeEqualMock);
  });

  afterEach(()=>{
    //毎テスト後にstubやmockを元に戻す
    sinon.restore();
  });

  it("should call initialize if not initialized", async ()=>{
    //initialized = false のパターン
    rewireAuth.__set__("initialized", false);

    //ユーザーが存在しないパターンにしておく
    getUserDataMock.resolves(null);

    const result = await isValidUser("testUser", "testPassword");

    //initialize が呼ばれること
    expect(initializeMock.calledOnce).to.be.true;
    //ユーザーが見つからず false
    expect(result).to.be.false;
    //ログが正しく出力されているか
    expect(loggerTraceMock.calledWith("user: testUser not found")).to.be.true;
  });

  it("should return false if user does not exist", async ()=>{
    //すでに初期化されているパターン
    rewireAuth.__set__("initialized", true);

    //ユーザーが存在しない => getUserData が null
    getUserDataMock.resolves(null);

    const result = await isValidUser("notExisting", "somePassword");
    expect(result).to.be.false;
    expect(loggerTraceMock.calledWith("user: notExisting not found")).to.be.true;
  });

  it("should return false if password is wrong", async ()=>{
    rewireAuth.__set__("initialized", true);

    //ユーザーが見つかったが、ハッシュが合わないパターン
    getUserDataMock.resolves({
      username: "someUser",
      hashed_password: Buffer.from("correctHash"),
      salt: Buffer.from("saltValue")
    });
    //getHashedPassword の戻り値を「全然違うハッシュ」にする
    getHashedPasswordMock.resolves(Buffer.from("wrongHash"));
    //timingSafeEqual は false を返す
    timingSafeEqualMock.returns(false);

    const result = await isValidUser("someUser", "badPassword");

    //期待通り呼ばれているか
    expect(getHashedPasswordMock.calledOnceWithExactly("badPassword", Buffer.from("saltValue"))).to.be.true;
    expect(timingSafeEqualMock.calledOnce).to.be.true;
    expect(result).to.be.false;
    expect(loggerTraceMock.calledWith("wrong password")).to.be.true;
  });

  it("should return the user row if password is correct", async ()=>{
    rewireAuth.__set__("initialized", true);

    //ユーザーが見つかる場合
    const userRow = {
      username: "someUser",
      hashed_password: Buffer.from("correctHash"),
      salt: Buffer.from("saltValue")
    };
    getUserDataMock.resolves(userRow);

    //正しいハッシュが返ってくる
    getHashedPasswordMock.resolves(Buffer.from("correctHash"));
    //timingSafeEqual は true を返す
    timingSafeEqualMock.returns(true);

    const result = await isValidUser("someUser", "correctPassword");

    expect(getHashedPasswordMock.calledOnceWithExactly("correctPassword", Buffer.from("saltValue"))).to.be.true;
    expect(timingSafeEqualMock.calledOnce).to.be.true;
    expect(result).to.equal(userRow);
    //パスワードが正しい場合はログ出力されない（trace呼び出しなし）
    expect(loggerTraceMock.notCalled).to.be.true;
  });
});

describe("#listUser", ()=>{
  let rewireAuth;
  let listUser;
  let dbMock;
  let initializeMock;

  beforeEach(()=>{
    //auth.jsをrewireで読み込む
    rewireAuth = rewire("../../../app/core/auth.js");

    //テスト対象関数を__get__で取得
    listUser = rewireAuth.__get__("listUser");

    //dbのモックを作成 (db.allだけ使うのでそこをStub)
    dbMock = {
      all: sinon.stub().resolves([])
    };

    //initializeのモックを作成
    initializeMock = sinon.stub().resolves();

    //rewireを使ってauth.js内部の変数をStub化
    //まだ初期化されていない状態にする
    rewireAuth.__set__("initialized", false);
    rewireAuth.__set__("db", dbMock);
    rewireAuth.__set__("initialize", initializeMock);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should call initialize if not yet initialized (db is not ready yet)", async ()=>{
    //前提：initialized = false
    //dbMock.allはデフォルトで空配列を返すようになっている

    const result = await listUser();

    //initializeが呼ばれているか確認
    expect(initializeMock.calledOnce).to.be.true;

    //db.allが呼ばれたか
    expect(dbMock.all.calledOnce).to.be.true;

    //結果は空配列
    expect(result).to.be.an("array").that.is.empty;
  });

  it("should not call initialize if already initialized", async ()=>{
    //すでにinitializedがtrueの場合
    rewireAuth.__set__("initialized", true);

    const result = await listUser();

    //initializeは呼ばれない
    expect(initializeMock.notCalled).to.be.true;

    //db.allが呼ばれたか
    expect(dbMock.all.calledOnce).to.be.true;

    //結果は空配列
    expect(result).to.be.an("array").that.is.empty;
  });

  it("should return empty array if db has no users", async ()=>{
    //dbMock.allが空配列を返す
    dbMock.all.resolves([]);

    const result = await listUser();

    //空配列が返ることを確認
    expect(result).to.deep.equal([]);
  });

  it("should return array of usernames if db has data", async ()=>{
    //dbMock.allがユーザー名を持つ配列を返すように設定
    dbMock.all.resolves([
      { username: "Alice" },
      { username: "Bob" }
    ]);

    const result = await listUser();

    //["Alice", "Bob"]が返ることを確認
    expect(result).to.deep.equal(["Alice", "Bob"]);
  });
});

describe("#delUser", ()=>{
  let rewireAuth;
  let delUser;
  let dbMock;
  let initializeMock;

  beforeEach(()=>{
    rewireAuth = rewire("../../../app/core/auth.js");

    //テスト対象関数 delUser を取得
    delUser = rewireAuth.__get__("delUser");

    //initialize 関数をスタブ化 (Mock)
    initializeMock = sinon.stub().resolves();

    //db.run をスタブ化 (Mock)
    dbMock = {
      run: sinon.stub()
    };

    //rewireで差し替え
    rewireAuth.__set__({
      db: dbMock, //delUser内で使われるdb
      initialize: initializeMock
    });

    //デフォルトでは初期化済み(true)とする
    rewireAuth.__set__("initialized", true);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should call initialize if not initialized", async ()=>{
    //まだ初期化されていない状態にセット
    rewireAuth.__set__("initialized", false);

    //db.runが返す値をセット
    dbMock.run.resolves({ changes: 1 });

    await delUser("testUserA");

    //initializeが呼ばれることを確認
    expect(initializeMock.calledOnce).to.be.true;
    //db.runが適切なクエリで呼ばれたことを確認
    expect(dbMock.run.calledOnceWithExactly(
      "DELETE FROM users WHERE username = 'testUserA'"
    )).to.be.true;
  });

  it("should not call initialize if already initialized", async ()=>{
    //すでに初期化済み
    rewireAuth.__set__("initialized", true);

    dbMock.run.resolves({ changes: 1 });

    await delUser("testUserB");

    //initializeは呼ばれない
    expect(initializeMock.notCalled).to.be.true;
    //db.runが適切なクエリで呼ばれたことを確認
    expect(dbMock.run.calledOnceWithExactly(
      "DELETE FROM users WHERE username = 'testUserB'"
    )).to.be.true;
  });

  it("should return statement object if user exists (changes=1)", async ()=>{
    //runの戻り値を変更
    const statement = { changes: 1 };
    dbMock.run.resolves(statement);

    const result = await delUser("existingUser");
    //delUserは db.runの戻り値(Statementオブジェクト)をそのまま返す
    expect(result).to.equal(statement);
  });

  it("should return statement object if user does not exist (changes=0)", async ()=>{
    //runの戻り値を変更
    const statement = { changes: 0 };
    dbMock.run.resolves(statement);

    const result = await delUser("nonExistingUser");
    expect(result).to.equal(statement);
  });
});
