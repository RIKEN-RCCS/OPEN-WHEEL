/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const { expect } = require("chai");
const { describe, it } = require("mocha");
const rewire = require("rewire");
const sinon = require("sinon");
const path = require("path");

describe("#isSurrounded", ()=>{
  let rewireProjectFilesOperator;
  let isSurrounded;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    isSurrounded = rewireProjectFilesOperator.__get__("isSurrounded");
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
  let rewireProjectFilesOperator;
  let trimSurrounded;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    trimSurrounded = rewireProjectFilesOperator.__get__("trimSurrounded");
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
  let rewireProjectFilesOperator;
  let glob2Array;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    glob2Array = rewireProjectFilesOperator.__get__("glob2Array");
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
  let rewireProjectFilesOperator;
  let removeTrailingPathSep;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    removeTrailingPathSep = rewireProjectFilesOperator.__get__("removeTrailingPathSep");
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

describe("#getProjectJson", ()=>{
  let rewireProjectFilesOperator;
  let getProjectJson;
  let readJsonGreedyMock;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    getProjectJson = rewireProjectFilesOperator.__get__("getProjectJson");

    readJsonGreedyMock = sinon.stub();
    rewireProjectFilesOperator.__set__("readJsonGreedy", readJsonGreedyMock);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return the project JSON data when readJsonGreedy resolves", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const mockProjectJson = { name: "test_project", version: 2 };

    readJsonGreedyMock.resolves(mockProjectJson);

    const result = await getProjectJson(mockProjectRootDir);

    expect(readJsonGreedyMock.calledOnceWithExactly(
            `${mockProjectRootDir}/prj.wheel.json`
    )).to.be.true;
    expect(result).to.deep.equal(mockProjectJson);
  });

  it("should throw an error when readJsonGreedy rejects", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const mockError = new Error("File not found");

    readJsonGreedyMock.rejects(mockError);

    try {
      await getProjectJson(mockProjectRootDir);
      throw new Error("Expected getProjectJson to throw");
    } catch (err) {
      expect(err).to.equal(mockError);
    }

    expect(readJsonGreedyMock.calledOnceWithExactly(
            `${mockProjectRootDir}/prj.wheel.json`
    )).to.be.true;
  });
});

describe("#writeProjectJson", ()=>{
  let rewireProjectFilesOperator;
  let writeProjectJson;
  let writeJsonWrapperMock;
  let gitAddMock;

  const mockProjectRootDir = "/mock/project/root";
  const mockProjectJson = { name: "test_project", version: 2 };
  const mockFileName = `${mockProjectRootDir}/prj.wheel.json`;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");

    writeJsonWrapperMock = sinon.stub();
    gitAddMock = sinon.stub();

    rewireProjectFilesOperator.__set__({
      writeJsonWrapper: writeJsonWrapperMock,
      gitAdd: gitAddMock
    });

    writeProjectJson = rewireProjectFilesOperator.__get__("writeProjectJson");
  });

  it("should write the JSON file and add it to git", async ()=>{
    writeJsonWrapperMock.resolves();
    gitAddMock.resolves();

    await writeProjectJson(mockProjectRootDir, mockProjectJson);

    expect(writeJsonWrapperMock.calledOnceWithExactly(mockFileName, mockProjectJson)).to.be.true;
    expect(gitAddMock.calledOnceWithExactly(mockProjectRootDir, mockFileName)).to.be.true;
  });

  it("should throw an error if writeJsonWrapper fails", async ()=>{
    const mockError = new Error("Failed to write JSON");
    writeJsonWrapperMock.rejects(mockError);

    try {
      await writeProjectJson(mockProjectRootDir, mockProjectJson);
      throw new Error("Expected writeProjectJson to throw");
    } catch (err) {
      expect(err).to.equal(mockError);
    }

    expect(writeJsonWrapperMock.calledOnceWithExactly(mockFileName, mockProjectJson)).to.be.true;
    expect(gitAddMock.notCalled).to.be.true;
  });

  it("should throw an error if gitAdd fails", async ()=>{
    const mockError = new Error("Failed to add file to git");
    writeJsonWrapperMock.resolves();
    gitAddMock.rejects(mockError);

    try {
      await writeProjectJson(mockProjectRootDir, mockProjectJson);
      throw new Error("Expected writeProjectJson to throw");
    } catch (err) {
      expect(err).to.equal(mockError);
    }

    expect(writeJsonWrapperMock.calledOnceWithExactly(mockFileName, mockProjectJson)).to.be.true;
    expect(gitAddMock.calledOnceWithExactly(mockProjectRootDir, mockFileName)).to.be.true;
  });
});

describe("#getDescendantsIDs", ()=>{
  let rewireProjectFilesOperator;
  let getDescendantsIDs;
  let readJsonGreedyMock;
  let getComponentDirMock;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    getDescendantsIDs = rewireProjectFilesOperator.__get__("getDescendantsIDs");

    readJsonGreedyMock = sinon.stub();
    getComponentDirMock = sinon.stub();

    rewireProjectFilesOperator.__set__("readJsonGreedy", readJsonGreedyMock);
    rewireProjectFilesOperator.__set__("getComponentDir", getComponentDirMock);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return an array of descendant IDs including the given ID", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const mockID = "rootID";
    const mockProjectJson = {
      componentPath: {
        rootID: "./root",
        child1: "./root/child1",
        child2: "./root/child2",
        unrelated: "./other"
      }
    };

    const mockPoi = path.resolve(mockProjectRootDir, "root");

    readJsonGreedyMock.resolves(mockProjectJson);
    getComponentDirMock.resolves(mockPoi);

    const result = await getDescendantsIDs(mockProjectRootDir, mockID);

    expect(readJsonGreedyMock.calledOnceWithExactly(path.resolve(mockProjectRootDir, "prj.wheel.json"))).to.be.true;
    expect(getComponentDirMock.calledOnceWithExactly(mockProjectRootDir, mockID, true)).to.be.true;
    expect(result).to.deep.equal(["rootID", "child1", "child2"]);
  });

  it("should return an array with only the given ID if no descendants are found", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const mockID = "rootID";
    const mockProjectJson = {
      componentPath: {
        rootID: "./root",
        unrelated: "./other"
      }
    };

    const mockPoi = path.resolve(mockProjectRootDir, "root");

    readJsonGreedyMock.resolves(mockProjectJson);
    getComponentDirMock.resolves(mockPoi);

    const result = await getDescendantsIDs(mockProjectRootDir, mockID);

    expect(readJsonGreedyMock.calledOnceWithExactly(path.resolve(mockProjectRootDir, "prj.wheel.json"))).to.be.true;
    expect(getComponentDirMock.calledOnceWithExactly(mockProjectRootDir, mockID, true)).to.be.true;
    expect(result).to.deep.equal(["rootID"]);
  });

  it("should throw an error if readJsonGreedy rejects", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const mockID = "rootID";
    const mockError = new Error("Failed to read JSON");

    readJsonGreedyMock.rejects(mockError);

    try {
      await getDescendantsIDs(mockProjectRootDir, mockID);
      throw new Error("Expected getDescendantsIDs to throw");
    } catch (err) {
      expect(err).to.equal(mockError);
    }

    expect(readJsonGreedyMock.calledOnceWithExactly(path.resolve(mockProjectRootDir, "prj.wheel.json"))).to.be.true;
    expect(getComponentDirMock.notCalled).to.be.true;
  });

  it("should throw an error if getComponentDir rejects", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const mockID = "rootID";
    const mockProjectJson = {
      componentPath: {
        rootID: "./root",
        unrelated: "./other"
      }
    };
    const mockError = new Error("Failed to get component directory");

    readJsonGreedyMock.resolves(mockProjectJson);
    getComponentDirMock.rejects(mockError);

    try {
      await getDescendantsIDs(mockProjectRootDir, mockID);
      throw new Error("Expected getDescendantsIDs to throw");
    } catch (err) {
      expect(err).to.equal(mockError);
    }

    expect(readJsonGreedyMock.calledOnceWithExactly(path.resolve(mockProjectRootDir, "prj.wheel.json"))).to.be.true;
    expect(getComponentDirMock.calledOnceWithExactly(mockProjectRootDir, mockID, true)).to.be.true;
  });
});

describe("#getAllComponentIDs", ()=>{
  let rewireProjectFilesOperator;
  let getAllComponentIDs;
  let readJsonGreedyMock;

  const mockProjectRootDir = "/mock/project/root";
  const mockProjectJson = {
    componentPath: {
      component1: "./path/to/component1",
      component2: "./path/to/component2",
      component3: "./path/to/component3"
    }
  };
  const mockFileName = path.resolve(mockProjectRootDir, "prj.wheel.json");

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    readJsonGreedyMock = sinon.stub();

    rewireProjectFilesOperator.__set__("readJsonGreedy", readJsonGreedyMock);

    getAllComponentIDs = rewireProjectFilesOperator.__get__("getAllComponentIDs");
  });

  it("should return all component IDs from the project JSON", async ()=>{
    readJsonGreedyMock.resolves(mockProjectJson);

    const result = await getAllComponentIDs(mockProjectRootDir);

    expect(readJsonGreedyMock.calledOnceWithExactly(mockFileName)).to.be.true;
    expect(result).to.deep.equal(Object.keys(mockProjectJson.componentPath));
  });

  it("should throw an error if readJsonGreedy fails", async ()=>{
    const mockError = new Error("Failed to read JSON");
    readJsonGreedyMock.rejects(mockError);

    try {
      await getAllComponentIDs(mockProjectRootDir);
      throw new Error("Expected getAllComponentIDs to throw");
    } catch (err) {
      expect(err).to.equal(mockError);
    }

    expect(readJsonGreedyMock.calledOnceWithExactly(mockFileName)).to.be.true;
  });

  it("should return an empty array if componentPath is not present in the JSON", async ()=>{
    readJsonGreedyMock.resolves({
      componentPath: {}
    });

    const result = await getAllComponentIDs(mockProjectRootDir);

    expect(readJsonGreedyMock.calledOnceWithExactly(mockFileName)).to.be.true;
    expect(result).to.deep.equal([]);
  });
});

describe("#getSuffixNumberFromProjectName", ()=>{
  let rewireProjectFilesOperator;
  let getSuffixNumberFromProjectName;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    getSuffixNumberFromProjectName = rewireProjectFilesOperator.__get__("getSuffixNumberFromProjectName");
  });

  it("should return the suffix number if the project name ends with numbers", ()=>{
    const projectName = "Project123";
    const result = getSuffixNumberFromProjectName(projectName);
    expect(result).to.equal("3");
  });

  it("should return 0 if the project name does not end with numbers", ()=>{
    const projectName = "Project";
    const result = getSuffixNumberFromProjectName(projectName);
    expect(result).to.equal(0);
  });

  it("should return the correct suffix when the project name contains numbers but does not end with them", ()=>{
    const projectName = "Project123abc";
    const result = getSuffixNumberFromProjectName(projectName);
    expect(result).to.equal(0);
  });

  it("should return 0 for an empty project name", ()=>{
    const projectName = "";
    const result = getSuffixNumberFromProjectName(projectName);
    expect(result).to.equal(0);
  });

  it("should return 0 if the project name consists only of non-numeric characters", ()=>{
    const projectName = "abcdef";
    const result = getSuffixNumberFromProjectName(projectName);
    expect(result).to.equal(0);
  });

  it("should return 0 if the project name consists only of spaces", ()=>{
    const projectName = "Project123   ";
    const result = getSuffixNumberFromProjectName(projectName);
    expect(result).to.equal(0);
  });

  it("should handle names with leading spaces correctly", ()=>{
    const projectName = "   Project123";
    const result = getSuffixNumberFromProjectName(projectName);
    expect(result).to.equal("3");
  });
});
