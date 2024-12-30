/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const { expect } = require("chai");
const { describe, it } = require("mocha");
const rewire = require("rewire");
const path = require("path");

describe("#isSurrounded", ()=>{
  let projectFilesOperator;
  let isSurrounded;

  beforeEach(()=>{
    projectFilesOperator = rewire("../app/core/projectFilesOperator.js");
    isSurrounded = projectFilesOperator.__get__("isSurrounded");
  });

  it("should return true if the string is surrounded by curly braces", ()=>{
    expect(isSurrounded("{example}")).to.be.true;
  });

  it("should return false if the string is not surrounded by curly braces", ()=>{
    expect(isSurrounded("example")).to.be.false;
  });

  it("should return false if the string starts with a brace but does not end with one", ()=>{
    expect(isSurrounded("{example")).to.be.false;
  });

  it("should return false if the string ends with a brace but does not start with one", ()=>{
    expect(isSurrounded("example}")).to.be.false;
  });

  it("should return true for an empty string surrounded by braces", ()=>{
    expect(isSurrounded("{}")).to.be.true;
  });

  it("should handle strings with multiple layers of braces correctly", ()=>{
    expect(isSurrounded("{{example}}")).to.be.true;
    expect(isSurrounded("{example}}")).to.be.true;
    expect(isSurrounded("{{example}")).to.be.true;
  });
});

describe("#trimSurrounded", ()=>{
  let projectFilesOperator;
  let trimSurrounded;

  beforeEach(()=>{
    projectFilesOperator = rewire("../app/core/projectFilesOperator.js");
    trimSurrounded = projectFilesOperator.__get__("trimSurrounded");
  });

  it("should return the string without curly braces if it is surrounded by them", ()=>{
    const input = "{example}";
    const result = trimSurrounded(input);
    expect(result).to.equal("example");
  });

  it("should return the original string if it is not surrounded by curly braces", ()=>{
    const input = "example";
    const result = trimSurrounded(input);
    expect(result).to.equal("example");
  });

  it("should return the original string if only one side has a curly brace", ()=>{
    const inputLeft = "{example";
    const inputRight = "example}";
    expect(trimSurrounded(inputLeft)).to.equal(inputLeft);
    expect(trimSurrounded(inputRight)).to.equal(inputRight);
  });

  it("should return the inner content if multiple curly braces surround the string", ()=>{
    const input = "{{{example}}}";
    const result = trimSurrounded(input);
    expect(result).to.equal("example}}");
  });

  it("should return the original string if it contains no curly braces", ()=>{
    const input = "noBracesHere";
    const result = trimSurrounded(input);
    expect(result).to.equal("noBracesHere");
  });

  it("should handle an empty string as input", ()=>{
    const input = "";
    const result = trimSurrounded(input);
    expect(result).to.equal("");
  });

  it("should handle strings with spaces correctly", ()=>{
    const input = "{  spaced example  }";
    const result = trimSurrounded(input);
    expect(result).to.equal("  spaced example  ");
  });
});

describe("#glob2Array", ()=>{
  let projectFilesOperator;
  let glob2Array;

  beforeEach(()=>{
    projectFilesOperator = rewire("../app/core/projectFilesOperator");
    glob2Array = projectFilesOperator.__get__("glob2Array");
  });

  it("should convert a comma-separated string into an array", ()=>{
    const input = "file1,file2,file3";
    const expectedOutput = ["file1", "file2", "file3"];
    expect(glob2Array(input)).to.deep.equal(expectedOutput);
  });

  it("should handle strings surrounded by curly braces", ()=>{
    const input = "{file1,file2,file3}";
    const expectedOutput = ["file1", "file2", "file3"];
    expect(glob2Array(input)).to.deep.equal(expectedOutput);
  });

  it("should return an empty array for an empty string", ()=>{
    const input = "";
    const expectedOutput = [""];
    expect(glob2Array(input)).to.deep.equal(expectedOutput);
  });

  it("should handle spaces in the comma-separated list", ()=>{
    const input = " file1 , file2 , file3 ";
    const expectedOutput = [" file1 ", " file2 ", " file3 "];
    expect(glob2Array(input)).to.deep.equal(expectedOutput);
  });

  it("should return the original token if it is not comma-separated", ()=>{
    const input = "file1";
    const expectedOutput = ["file1"];
    expect(glob2Array(input)).to.deep.equal(expectedOutput);
  });

  it("should handle nested curly braces gracefully", ()=>{
    const input = "{{file1,file2},file3}";
    const expectedOutput = ["file1", "file2}", "file3"];
    expect(glob2Array(input)).to.deep.equal(expectedOutput);
  });
});

describe("#removeTrailingPathSep", ()=>{
  let projectFilesOperator;
  let removeTrailingPathSep;

  beforeEach(()=>{
    projectFilesOperator = rewire("../app/core/projectFilesOperator.js");
    removeTrailingPathSep = projectFilesOperator.__get__("removeTrailingPathSep");
  });

  it("should remove trailing path separator for POSIX paths", ()=>{
    const input = "/path/to/directory/";
    const expected = path.sep === "/" ? "/path/to/directory" : input; //実行環境がPOSIXなら削除、Windowsならそのまま
    expect(removeTrailingPathSep(input)).to.equal(expected);
  });

  it("should remove trailing path separator for Windows paths", ()=>{
    const input = "C:\\path\\to\\directory\\";
    const expected = path.sep === "\\" ? "C:\\path\\to\\directory" : input; //Windowsなら削除、POSIXならそのまま
    expect(removeTrailingPathSep(input)).to.equal(expected);
  });

  it("should not alter a path without trailing path separator", ()=>{
    const input = "/path/to/directory";
    const expected = "/path/to/directory";
    expect(removeTrailingPathSep(input)).to.equal(expected);
  });

  it("should handle an empty string gracefully", ()=>{
    const input = "";
    const expected = "";
    expect(removeTrailingPathSep(input)).to.equal(expected);
  });

  it("should handle paths consisting of only a single path separator", ()=>{
    const input = path.sep;
    const expected = "";
    expect(removeTrailingPathSep(input)).to.equal(expected);
  });

  it("should recursively remove multiple trailing path separators", ()=>{
    const input = `/path/to/directory///`.replace(/\//g, path.sep); //セパレータを現在の実行環境に合わせる
    const expected = `/path/to/directory`.replace(/\//g, path.sep); //入力と同様に変換後の期待値
    expect(removeTrailingPathSep(input)).to.equal(expected);
  });
});
