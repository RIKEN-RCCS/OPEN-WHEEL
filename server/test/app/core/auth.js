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
