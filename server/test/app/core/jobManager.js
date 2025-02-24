/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const { expect } = require("chai");
const { describe, it, beforeEach } = require("mocha");
const rewire = require("rewire");

describe("#getFirstCapture", ()=>{
  let rewireJobManager;
  let getFirstCapture;

  beforeEach(()=>{
    //jobManager.js を再取得
    rewireJobManager = rewire("../../../app/core/jobManager.js");

    //テスト対象関数を取得
    getFirstCapture = rewireJobManager.__get__("getFirstCapture");
  });

  it("should return null if there is no match (result === null)", ()=>{
    const outputText = "No matching pattern here";
    //キャプチャつきの正規表現を用意しても、マッチしなければ result === null
    const reCode = "value: ([0-9]+)";
    const result = getFirstCapture(outputText, reCode);
    expect(result).to.be.null;
  });

  it("should return null if a match exists but capturing group is undefined", ()=>{
    //正規表現にはカッコがないので、matchはするがグループが無く result[1] は undefined
    const outputText = "pattern matched but no capturing group";
    const reCode = "pattern matched"; //カッコなし
    const result = getFirstCapture(outputText, reCode);
    expect(result).to.be.null;
  });

  it("should return the captured group if match is found and capturing group is present", ()=>{
    const outputText = "ReturnCode: 12345 found here";
    const reCode = "ReturnCode:\\s+([0-9]+)";
    const result = getFirstCapture(outputText, reCode);
    expect(result).to.equal("12345");
  });

  it("should handle empty string capture correctly (still not null if matched)", ()=>{
    //キャプチャが空文字列になるパターンを試す
    const outputText = "PrefixSuffix";
    //() の中身が0文字でもマッチする例:
    //"Prefix" と "Suffix" の間をキャプチャするが、文字が無いとき空文字になる
    const reCode = "Prefix()Suffix";
    const result = getFirstCapture(outputText, reCode);
    //空文字だが undefined ではないので、空文字("")が帰る
    expect(result).to.equal("");
  });
});
