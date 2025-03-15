/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";

const path = require("path");
const { expect } = require("chai");
const { describe, it, beforeEach, afterEach } = require("mocha");
const fs = require("fs-extra");

const { getFiletype } = require("../../../app/core/viewerUtils.js");

describe("#getFiletype (Integration Test)", ()=>{
  const testDir = path.join(__dirname, "tempfiletest_viewerUtils");

  beforeEach(()=>{
    //テスト用の一時ディレクトリ作成
    fs.ensureDirSync(testDir);
  });

  afterEach(()=>{
    //テスト終了後に一時ディレクトリを丸ごと削除
    fs.removeSync(testDir);
  });

  it("should detect SVG file when file content is valid SVG", async ()=>{
    //SVGファイルを作成
    const svgFilePath = path.join(testDir, "dummy.svg");
    const svgContent = `<svg width="100" height="100">
      <rect width="100" height="100" style="fill:rgb(255,0,0);" />
    </svg>`;
    fs.writeFileSync(svgFilePath, svgContent, "utf8");

    //実行
    const result = await getFiletype(svgFilePath);

    //検証
    expect(result).to.deep.equal({
      ext: "svg",
      mime: "image/svg+xml",
      name: svgFilePath
    });
  });

  it("should return undefined if the file type is not recognized by file-type", async ()=>{
    const unknownFile = path.join(testDir, "unknown.bin");
    fs.writeFileSync(unknownFile, "abcdefg"); //適当なテキスト

    const result = await getFiletype(unknownFile);

    //file-type が判定できない場合、return undefined
    expect(result).to.be.undefined;
  });

  it("should return undefined if file-type throws an error (normal error case)", async ()=>{
    //「ファイルが消えてしまった」ケース
    const missingFilePath = path.join(testDir, "willDelete.bin");
    fs.writeFileSync(missingFilePath, "someData");
    //ファイルを即削除してしまう
    fs.removeSync(missingFilePath);

    //getFiletype内部はまず fs.readFile で失敗する → エラー発生
    let result;
    try {
      result = await getFiletype(missingFilePath);
    } catch (err) {
      //ここに入った時点で fs.readFile がエラーを投げている
    }

    //このケースでは、resultはundefinedのまま
    expect(result).to.be.undefined;
  });
});
