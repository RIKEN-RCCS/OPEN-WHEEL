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
