/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";

const { expect } = require("chai");
const { describe, it } = require("mocha");
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
