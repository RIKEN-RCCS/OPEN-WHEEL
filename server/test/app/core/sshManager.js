/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";

const { expect } = require("chai");
const { describe, it } = require("mocha");
const sinon = require("sinon");
const rewire = require("rewire");

describe("#hasEntry", ()=>{
  let rewireSshManager;
  let hasEntry;
  let dbMock;

  beforeEach(()=>{
    //sshManager.js を再取得
    rewireSshManager = rewire("../../../app/core/sshManager.js");

    //テスト対象関数を取得
    hasEntry = rewireSshManager.__get__("hasEntry");

    //db のモック(Map)を用意し、sshManager.js 内の db を差し替える
    dbMock = new Map();
    rewireSshManager.__set__("db", dbMock);
  });

  it("should return false if the projectRootDir is not in db", ()=>{
    //dbMock 上に projectRootDir は存在しない
    const result = hasEntry("/path/to/projectA", "someID");
    expect(result).to.be.false;
  });

  it("should return false if db has the projectRootDir but does not have the id", ()=>{
    //dbMock に projectRootDir は追加するが、その中に id は存在しない
    const projectDir = "/path/to/projectB";
    dbMock.set(projectDir, new Map()); //空のMap

    const result = hasEntry(projectDir, "missingID");
    expect(result).to.be.false;
  });

  it("should return true if db has the projectRootDir and the id", ()=>{
    const projectDir = "/path/to/projectC";
    const id = "existingID";

    //projectDir 用のサブMapを作って id を登録
    const subMap = new Map();
    subMap.set(id, { ssh: "dummySshObject" });
    dbMock.set(projectDir, subMap);

    //検証
    const result = hasEntry(projectDir, id);
    expect(result).to.be.true;
  });
});

describe("#addSsh", ()=>{
  let rewireSshManager;
  let addSsh;
  let dbMock;

  beforeEach(()=>{
    //sshManager.jsをrewireで読み込む
    rewireSshManager = rewire("../../../app/core/sshManager.js");
    //テスト対象関数addSshを取得
    addSsh = rewireSshManager.__get__("addSsh");

    //dbをMock化する
    //dbはMapオブジェクトですが、has/set/getなどをsinon.stubで差し替えます
    dbMock = {
      has: sinon.stub(),
      set: sinon.stub(),
      get: sinon.stub()
    };

    //rewireを使ってsshManager.js内部のdbを差し替え
    rewireSshManager.__set__("db", dbMock);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should create a new Map when the projectRootDir does not exist in db", ()=>{
    //dbMock.has(...)がfalseを返すように設定
    dbMock.has.returns(false);

    //dbMock.getは返り値をダミーでもいいので設定しておく (後段の .set()呼び出しで利用)
    const mapStub = {
      set: sinon.stub()
    };
    dbMock.get.returns(mapStub);

    //テスト対象呼び出し
    const projectRootDir = "/dummy/path";
    const hostinfo = { id: "host-123" };
    const ssh = { connect: ()=>{} };
    const pw = "dummyPw";
    const ph = "dummyPh";
    const isStorage = false;

    addSsh(projectRootDir, hostinfo, ssh, pw, ph, isStorage);

    //アサーション: dbMock.has(...)が引数"/dummy/path"で呼ばれた
    expect(dbMock.has.calledOnceWithExactly(projectRootDir)).to.be.true;

    //アサーション: dbMock.set(...)が呼ばれた (新規Map生成)
    expect(dbMock.set.calledOnceWithExactly(projectRootDir, sinon.match.instanceOf(Map))).to.be.true;

    //アサーション: dbMock.get(...).set(...)にも期待通りの引数で呼ばれているか
    expect(mapStub.set.calledOnceWithExactly("host-123", {
      ssh,
      hostinfo,
      pw,
      ph,
      isStorage
    })).to.be.true;
  });

  it("should reuse existing Map when the projectRootDir already exists in db", ()=>{
    //dbMock.has(...)がtrueを返す
    dbMock.has.returns(true);

    //既存Mapのモック
    const existingMapMock = {
      set: sinon.stub()
    };
    dbMock.get.returns(existingMapMock);

    //テスト対象呼び出し
    const projectRootDir = "/exists/path";
    const hostinfo = { id: "host-999" };
    const ssh = { connect: ()=>{} };
    const pw = "secretPw";
    const ph = "secretPh";
    const isStorage = true;

    addSsh(projectRootDir, hostinfo, ssh, pw, ph, isStorage);

    //新規Map生成はされないはずなので dbMock.set(...)は呼ばれない
    expect(dbMock.set.notCalled).to.be.true;

    //代わりに、dbMock.get(...).set(...)で情報を追加
    expect(existingMapMock.set.calledOnceWithExactly("host-999", {
      ssh,
      hostinfo,
      pw,
      ph,
      isStorage
    })).to.be.true;
  });
});
