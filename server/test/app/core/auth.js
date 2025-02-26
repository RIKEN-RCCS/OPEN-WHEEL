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
