/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";

const { expect } = require("chai");
const { describe, it } = require("mocha");
const rewire = require("rewire");

describe("#getKey", ()=>{
  let rewireTransferManager;
  let getKey;

  beforeEach(()=>{
    //transferManager.js を rewire で読み込む
    rewireTransferManager = rewire("../../../app/core/transferManager.js");
    //テスト対象関数getKeyを__get__で取得
    getKey = rewireTransferManager.__get__("getKey");
  });

  it("should return correct key string if task has projectRootDir and remotehostID", ()=>{
    const task = {
      projectRootDir: "/path/to/projectA",
      remotehostID: "remoteHost123"
    };

    const result = getKey(task);
    expect(result).to.equal("/path/to/projectA-remoteHost123");
  });

  it("should return a string even if remotehostID is undefined", ()=>{
    //remotehostID を定義していないケース
    const task = {
      projectRootDir: "/path/to/projectB"
      //remotehostID: undefined
    };

    const result = getKey(task);
    //undefined部分も文字列化されるだけで、エラーにはならない
    expect(result).to.equal("/path/to/projectB-undefined");
  });
});
