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
const { promisify } = require("util");
const glob = require("glob");

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

describe("#getUnusedProjectDir", ()=>{
  let rewireProjectFilesOperator;
  let getUnusedProjectDir;
  let fsMock;
  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    getUnusedProjectDir = rewireProjectFilesOperator.__get__("getUnusedProjectDir");

    fsMock = {
      pathExists: sinon.stub()
    };
    rewireProjectFilesOperator.__set__("fs", fsMock);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return the provided projectRootDir if it does not exist", async ()=>{
    const projectRootDir = "/mock/project/root";
    const projectName = "project";

    fsMock.pathExists.resolves(false);

    const result = await getUnusedProjectDir(projectRootDir, projectName);

    expect(result).to.equal(projectRootDir);
    expect(fsMock.pathExists.calledOnceWithExactly(projectRootDir)).to.be.true;
  });

  it("should return a new directory name with suffix if projectRootDir exists", async ()=>{
    const projectRootDir = "/mock/project/root";
    const projectName = "project";
    const suffix = ".wheel";

    fsMock.pathExists.onFirstCall().resolves(true);
    fsMock.pathExists.onSecondCall().resolves(false);

    rewireProjectFilesOperator.__set__("suffix", suffix);

    const result = await getUnusedProjectDir(projectRootDir, projectName);

    expect(result).to.equal("/mock/project/project.wheel");
    expect(fsMock.pathExists.calledTwice).to.be.true;
  });

  it("should increment the suffix number until an unused directory name is found", async ()=>{
    const projectRootDir = "/mock/project/root";
    const projectName = "project";
    const suffix = ".wheel";

    fsMock.pathExists.onCall(0).resolves(true);
    fsMock.pathExists.onCall(1).resolves(true);
    fsMock.pathExists.onCall(2).resolves(true);
    fsMock.pathExists.onCall(3).resolves(false);

    rewireProjectFilesOperator.__set__("suffix", suffix);

    const result = await getUnusedProjectDir(projectRootDir, projectName);
    console.log(result);

    expect(result).to.equal("/mock/project/project1.wheel");
    expect(fsMock.pathExists.callCount).to.equal(4);
  });

  it("should use the suffix number from the projectName if present", async ()=>{
    const projectRootDir = "/mock/project/root";
    const projectName = "project2";
    const suffix = ".wheel";

    fsMock.pathExists.onCall(0).resolves(true);
    fsMock.pathExists.onCall(1).resolves(false);

    rewireProjectFilesOperator.__set__("suffix", suffix);

    const result = await getUnusedProjectDir(projectRootDir, projectName);

    expect(result).to.equal("/mock/project/project2.wheel");
    expect(fsMock.pathExists.callCount).to.equal(2);
  });
});

describe("#createNewProject", ()=>{
  let rewireProjectFilesOperator;
  let createNewProject;
  let getUnusedProjectDirMock;
  let gitInitMock;
  let writeComponentJsonMock;
  let writeJsonWrapperMock;
  let gitAddMock;
  let gitCommitMock;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    createNewProject = rewireProjectFilesOperator.__get__("createNewProject");

    getUnusedProjectDirMock = sinon.stub();
    gitInitMock = sinon.stub();
    writeComponentJsonMock = sinon.stub();
    writeJsonWrapperMock = sinon.stub();
    gitAddMock = sinon.stub();
    gitCommitMock = sinon.stub();

    const fsMock = {
      ensureDir: sinon.stub()
    };

    rewireProjectFilesOperator.__set__({
      getUnusedProjectDir: getUnusedProjectDirMock,
      gitInit: gitInitMock,
      writeComponentJson: writeComponentJsonMock,
      writeJsonWrapper: writeJsonWrapperMock,
      gitAdd: gitAddMock,
      gitCommit: gitCommitMock,
      fs: fsMock
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should create a new project with a unique directory and initialize it", async ()=>{
    const mockRootDir = "/mock/project/root";
    const mockProjectName = "test_project";
    const mockDescription = "Mock project description";
    const mockUser = "test_user";
    const mockMail = "test@example.com";
    const mockTimestamp = "20250102-120000";

    getUnusedProjectDirMock.resolves(mockRootDir);
    gitInitMock.resolves();
    writeComponentJsonMock.resolves();
    writeJsonWrapperMock.resolves();
    gitAddMock.resolves();
    gitCommitMock.resolves();

    const fsMock = rewireProjectFilesOperator.__get__("fs");
    fsMock.ensureDir.resolves();

    const getDateStringMock = sinon.stub().returns(mockTimestamp);
    rewireProjectFilesOperator.__set__("getDateString", getDateStringMock);

    const result = await createNewProject(mockRootDir, mockProjectName, mockDescription, mockUser, mockMail);

    expect(result).to.equal(mockRootDir);
    expect(getUnusedProjectDirMock.calledOnceWithExactly(mockRootDir, mockProjectName)).to.be.true;
    expect(fsMock.ensureDir.calledOnceWithExactly(mockRootDir)).to.be.true;
    expect(gitInitMock.calledOnceWithExactly(mockRootDir, mockUser, mockMail)).to.be.true;
    expect(writeComponentJsonMock.calledOnce).to.be.true;
    expect(writeJsonWrapperMock.calledOnce).to.be.true;
    expect(gitAddMock.calledOnceWithExactly(mockRootDir, "./")).to.be.true;
    expect(gitCommitMock.calledOnceWithExactly(mockRootDir, "create new project")).to.be.true;
  });

  it("should handle errors during project creation", async ()=>{
    const mockRootDir = "/mock/project/root";
    const mockProjectName = "test_project";
    const mockDescription = "Mock project description";
    const mockUser = "test_user";
    const mockMail = "test@example.com";

    getUnusedProjectDirMock.rejects(new Error("Directory error"));

    try {
      await createNewProject(mockRootDir, mockProjectName, mockDescription, mockUser, mockMail);
      throw new Error("Expected createNewProject to throw");
    } catch (err) {
      expect(err.message).to.equal("Directory error");
    }

    expect(getUnusedProjectDirMock.calledOnceWithExactly(mockRootDir, mockProjectName)).to.be.true;

    const fsMock = rewireProjectFilesOperator.__get__("fs");
    expect(fsMock.ensureDir.called).to.be.false;
    expect(gitInitMock.called).to.be.false;
  });
});

describe("#removeComponentPath", ()=>{
  let rewireProjectFilesOperator;
  let removeComponentPath;
  let readJsonGreedyMock;
  let writeJsonWrapperMock;
  let gitAddMock;
  let pathExistsMock;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    removeComponentPath = rewireProjectFilesOperator.__get__("removeComponentPath");

    readJsonGreedyMock = sinon.stub();
    writeJsonWrapperMock = sinon.stub();
    gitAddMock = sinon.stub();
    pathExistsMock = sinon.stub();

    rewireProjectFilesOperator.__set__({
      readJsonGreedy: readJsonGreedyMock,
      writeJsonWrapper: writeJsonWrapperMock,
      gitAdd: gitAddMock,
      fs: { pathExists: pathExistsMock }
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should remove specified component IDs from componentPath and update the project JSON", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const mockProjectJson = {
      componentPath: {
        comp1: "path/to/comp1",
        comp2: "path/to/comp2",
        comp3: "path/to/comp3"
      }
    };
    const IDsToRemove = ["comp2"];

    readJsonGreedyMock.resolves(mockProjectJson);
    writeJsonWrapperMock.resolves();
    gitAddMock.resolves();
    pathExistsMock.resolves(false);

    await removeComponentPath(mockProjectRootDir, IDsToRemove);

    expect(readJsonGreedyMock.calledOnceWithExactly(path.resolve(mockProjectRootDir, "prj.wheel.json"))).to.be.true;
    expect(writeJsonWrapperMock.calledOnceWithExactly(
      path.resolve(mockProjectRootDir, "prj.wheel.json"),
      {
        componentPath: {
          comp1: "path/to/comp1",
          comp3: "path/to/comp3"
        }
      }
    )).to.be.true;
    expect(gitAddMock.calledOnceWithExactly(
      mockProjectRootDir,
      path.resolve(mockProjectRootDir, "prj.wheel.json")
    )).to.be.true;
  });

  it("should not remove components if their directories exist and force is false", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const mockProjectJson = {
      componentPath: {
        comp1: "path/to/comp1",
        comp2: "path/to/comp2"
      }
    };
    const IDsToRemove = ["comp2"];

    readJsonGreedyMock.resolves(mockProjectJson);
    writeJsonWrapperMock.resolves();
    gitAddMock.resolves();
    pathExistsMock.resolves(true);

    await removeComponentPath(mockProjectRootDir, IDsToRemove, false);

    expect(readJsonGreedyMock.calledOnceWithExactly(path.resolve(mockProjectRootDir, "prj.wheel.json"))).to.be.true;
    expect(writeJsonWrapperMock.calledOnceWithExactly(
      path.resolve(mockProjectRootDir, "prj.wheel.json"),
      {
        componentPath: {
          comp1: "path/to/comp1",
          comp2: "path/to/comp2"
        }
      }
    )).to.be.true;
    expect(gitAddMock.calledOnceWithExactly(
      mockProjectRootDir,
      path.resolve(mockProjectRootDir, "prj.wheel.json")
    )).to.be.true;
  });

  it("should forcefully remove components even if their directories exist when force is true", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const mockProjectJson = {
      componentPath: {
        comp1: "path/to/comp1",
        comp2: "path/to/comp2"
      }
    };
    const IDsToRemove = ["comp2"];

    readJsonGreedyMock.resolves(mockProjectJson);
    writeJsonWrapperMock.resolves();
    gitAddMock.resolves();
    pathExistsMock.resolves(true);

    await removeComponentPath(mockProjectRootDir, IDsToRemove, true);

    expect(readJsonGreedyMock.calledOnceWithExactly(path.resolve(mockProjectRootDir, "prj.wheel.json"))).to.be.true;
    expect(writeJsonWrapperMock.calledOnceWithExactly(
      path.resolve(mockProjectRootDir, "prj.wheel.json"),
      {
        componentPath: {
          comp1: "path/to/comp1"
        }
      }
    )).to.be.true;
    expect(gitAddMock.calledOnceWithExactly(
      mockProjectRootDir,
      path.resolve(mockProjectRootDir, "prj.wheel.json")
    )).to.be.true;
  });

  it("should handle an empty componentPath gracefully", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const mockProjectJson = { componentPath: {} };
    const IDsToRemove = ["comp1"];

    readJsonGreedyMock.resolves(mockProjectJson);
    writeJsonWrapperMock.resolves();
    gitAddMock.resolves();

    await removeComponentPath(mockProjectRootDir, IDsToRemove);

    expect(readJsonGreedyMock.calledOnceWithExactly(path.resolve(mockProjectRootDir, "prj.wheel.json"))).to.be.true;
    expect(writeJsonWrapperMock.calledOnceWithExactly(
      path.resolve(mockProjectRootDir, "prj.wheel.json"),
      { componentPath: {} }
    )).to.be.true;
    expect(gitAddMock.calledOnceWithExactly(
      mockProjectRootDir,
      path.resolve(mockProjectRootDir, "prj.wheel.json")
    )).to.be.true;
  });

  it("should throw an error if reading the project JSON fails", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const IDsToRemove = ["comp1"];

    const mockError = new Error("Read error");
    readJsonGreedyMock.rejects(mockError);

    try {
      await removeComponentPath(mockProjectRootDir, IDsToRemove);
      throw new Error("Expected removeComponentPath to throw");
    } catch (err) {
      expect(err).to.equal(mockError);
    }

    expect(readJsonGreedyMock.calledOnceWithExactly(path.resolve(mockProjectRootDir, "prj.wheel.json"))).to.be.true;
    expect(writeJsonWrapperMock.notCalled).to.be.true;
    expect(gitAddMock.notCalled).to.be.true;
  });
});

describe("#updateComponentPath", ()=>{
  let rewireProjectFilesOperator;
  let updateComponentPath;
  let readJsonGreedyMock;
  let writeJsonWrapperMock;
  let gitAddMock;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");

    readJsonGreedyMock = sinon.stub();
    writeJsonWrapperMock = sinon.stub();
    gitAddMock = sinon.stub();

    rewireProjectFilesOperator.__set__({
      readJsonGreedy: readJsonGreedyMock,
      writeJsonWrapper: writeJsonWrapperMock,
      gitAdd: gitAddMock
    });

    updateComponentPath = rewireProjectFilesOperator.__get__("updateComponentPath");
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should add a new componentPath entry for a new ID", async ()=>{
    const projectRootDir = "/mock/project/root";
    const ID = "newID";
    const absPath = "/mock/project/root/newComponent";
    const mockProjectJson = { componentPath: {} };

    readJsonGreedyMock.resolves(mockProjectJson);
    writeJsonWrapperMock.resolves();
    gitAddMock.resolves();

    const result = await updateComponentPath(projectRootDir, ID, absPath);

    expect(readJsonGreedyMock.calledOnceWithExactly(`${projectRootDir}/prj.wheel.json`)).to.be.true;
    expect(writeJsonWrapperMock.calledOnceWithExactly(
          `${projectRootDir}/prj.wheel.json`,
          { componentPath: { newID: "./newComponent" } }
    )).to.be.true;
    expect(gitAddMock.calledOnceWithExactly(projectRootDir, `${projectRootDir}/prj.wheel.json`)).to.be.true;
    expect(result).to.deep.equal({ newID: "./newComponent" });
  });

  it("should update descendants paths when ID exists", async ()=>{
    const projectRootDir = "/mock/project/root";
    const ID = "existingID";
    const absPath = "/mock/project/root/newPath";
    const mockProjectJson = {
      componentPath: {
        existingID: "./oldPath",
        childID: "./oldPath/child"
      }
    };

    readJsonGreedyMock.resolves(mockProjectJson);
    writeJsonWrapperMock.resolves();
    gitAddMock.resolves();

    const result = await updateComponentPath(projectRootDir, ID, absPath);

    expect(writeJsonWrapperMock.calledOnceWithExactly(
          `${projectRootDir}/prj.wheel.json`,
          { componentPath: { existingID: "./newPath", childID: "./newPath/child" } }
    )).to.be.true;
    expect(gitAddMock.calledOnceWithExactly(projectRootDir, `${projectRootDir}/prj.wheel.json`)).to.be.true;
    expect(result).to.deep.equal({
      existingID: "./newPath",
      childID: "./newPath/child"
    });
  });

  it("should throw an error if readJsonGreedy fails", async ()=>{
    const projectRootDir = "/mock/project/root";
    const ID = "someID";
    const absPath = "/mock/project/root/somePath";

    readJsonGreedyMock.rejects(new Error("File not found"));

    try {
      await updateComponentPath(projectRootDir, ID, absPath);
      throw new Error("Expected updateComponentPath to throw");
    } catch (err) {
      expect(err.message).to.equal("File not found");
    }

    expect(readJsonGreedyMock.calledOnceWithExactly(`${projectRootDir}/prj.wheel.json`)).to.be.true;
  });

  it("should normalize paths correctly", async ()=>{
    const projectRootDir = "/mock/project/root";
    const ID = "normalizeTestID";
    const absPath = "/mock/project/root//normalizedPath/";
    const mockProjectJson = { componentPath: {} };

    readJsonGreedyMock.resolves(mockProjectJson);
    writeJsonWrapperMock.resolves();
    gitAddMock.resolves();

    const result = await updateComponentPath(projectRootDir, ID, absPath);

    expect(writeJsonWrapperMock.calledOnceWithExactly(
          `${projectRootDir}/prj.wheel.json`,
          { componentPath: { normalizeTestID: "./normalizedPath" } }
    )).to.be.true;
    expect(gitAddMock.calledOnceWithExactly(projectRootDir, `${projectRootDir}/prj.wheel.json`)).to.be.true;
    expect(result).to.deep.equal({ normalizeTestID: "./normalizedPath" });
  });
});

describe("#setProjectState", ()=>{
  let rewireProjectFilesOperator;
  let setProjectState;
  let readJsonGreedyMock;
  let writeJsonWrapperMock;
  let gitAddMock;
  let getDateStringMock;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    setProjectState = rewireProjectFilesOperator.__get__("setProjectState");

    readJsonGreedyMock = sinon.stub();
    writeJsonWrapperMock = sinon.stub();
    gitAddMock = sinon.stub();
    getDateStringMock = sinon.stub().returns("20250101-123456");

    rewireProjectFilesOperator.__set__({
      readJsonGreedy: readJsonGreedyMock,
      writeJsonWrapper: writeJsonWrapperMock,
      gitAdd: gitAddMock,
      getDateString: getDateStringMock
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should update the project state if it is different and return the updated metadata", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const mockState = "running";
    const mockMetadata = {
      state: "not-started",
      mtime: "20240101-000000"
    };

    readJsonGreedyMock.resolves(mockMetadata);

    const updatedMetadata = {
      ...mockMetadata,
      state: mockState,
      mtime: "20250101-123456"
    };

    const result = await setProjectState(mockProjectRootDir, mockState, false);

    expect(result).to.deep.equal(updatedMetadata);
    expect(writeJsonWrapperMock.calledOnceWithExactly(
          `${mockProjectRootDir}/prj.wheel.json`,
          updatedMetadata
    )).to.be.true;
    expect(gitAddMock.calledOnceWithExactly(mockProjectRootDir, `${mockProjectRootDir}/prj.wheel.json`)).to.be.true;
  });

  it("should not update the project state if it is the same and force is false", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const mockState = "not-started";
    const mockMetadata = {
      state: "not-started",
      mtime: "20240101-000000"
    };

    readJsonGreedyMock.resolves(mockMetadata);

    const result = await setProjectState(mockProjectRootDir, mockState, false);

    expect(result).to.be.false;
    expect(writeJsonWrapperMock.notCalled).to.be.true;
    expect(gitAddMock.notCalled).to.be.true;
  });

  it("should force update the project state even if it is the same", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const mockState = "not-started";
    const mockMetadata = {
      state: "not-started",
      mtime: "20240101-000000"
    };

    readJsonGreedyMock.resolves(mockMetadata);

    const updatedMetadata = {
      ...mockMetadata,
      mtime: "20250101-123456"
    };

    const result = await setProjectState(mockProjectRootDir, mockState, true);

    expect(result).to.deep.equal(updatedMetadata);
    expect(writeJsonWrapperMock.calledOnceWithExactly(
          `${mockProjectRootDir}/prj.wheel.json`,
          updatedMetadata
    )).to.be.true;
    expect(gitAddMock.calledOnceWithExactly(mockProjectRootDir, `${mockProjectRootDir}/prj.wheel.json`)).to.be.true;
  });

  it("should throw an error if readJsonGreedy fails", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const mockError = new Error("Read error");

    readJsonGreedyMock.rejects(mockError);

    try {
      await setProjectState(mockProjectRootDir, "running", false);
      throw new Error("Expected setProjectState to throw");
    } catch (err) {
      expect(err).to.equal(mockError);
    }
  });

  it("should throw an error if writeJsonWrapper fails", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const mockState = "running";
    const mockMetadata = {
      state: "not-started",
      mtime: "20240101-000000"
    };

    readJsonGreedyMock.resolves(mockMetadata);
    writeJsonWrapperMock.rejects(new Error("Write error"));

    try {
      await setProjectState(mockProjectRootDir, mockState, false);
      throw new Error("Expected setProjectState to throw");
    } catch (err) {
      expect(err.message).to.equal("Write error");
    }
  });
});

describe("#getComponentFullName", ()=>{
  let rewireProjectFilesOperator;
  let getComponentFullName;
  let getComponentDirMock;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    getComponentFullName = rewireProjectFilesOperator.__get__("getComponentFullName");

    //Mocking getComponentDir
    getComponentDirMock = sinon.stub();
    rewireProjectFilesOperator.__set__("getComponentDir", getComponentDirMock);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return the path without a leading dot when getComponentDir returns a valid relative path", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const mockID = "component123";
    const mockPath = "./relative/path/to/component";

    getComponentDirMock.resolves(mockPath);

    const result = await getComponentFullName(mockProjectRootDir, mockID);

    expect(getComponentDirMock.calledOnceWithExactly(mockProjectRootDir, mockID)).to.be.true;
    expect(result).to.equal("/relative/path/to/component");
  });

  it("should return null when getComponentDir returns null", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const mockID = "component123";

    getComponentDirMock.resolves(null);

    const result = await getComponentFullName(mockProjectRootDir, mockID);

    expect(getComponentDirMock.calledOnceWithExactly(mockProjectRootDir, mockID)).to.be.true;
    expect(result).to.be.null;
  });

  it("should return the original path when getComponentDir returns a path without a leading dot", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const mockID = "component123";
    const mockPath = "absolute/path/to/component";

    getComponentDirMock.resolves(mockPath);

    const result = await getComponentFullName(mockProjectRootDir, mockID);

    expect(getComponentDirMock.calledOnceWithExactly(mockProjectRootDir, mockID)).to.be.true;
    expect(result).to.equal(mockPath);
  });
});

describe("#getProjectState", ()=>{
  let rewireProjectFilesOperator;
  let getProjectState;
  let readJsonGreedyMock;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    getProjectState = rewireProjectFilesOperator.__get__("getProjectState");

    readJsonGreedyMock = sinon.stub();
    rewireProjectFilesOperator.__set__("readJsonGreedy", readJsonGreedyMock);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return the project state when the project JSON is valid", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const mockProjectJson = { state: "not-started" };

    readJsonGreedyMock.resolves(mockProjectJson);

    const result = await getProjectState(mockProjectRootDir);

    expect(readJsonGreedyMock.calledOnceWithExactly(
      "/mock/project/root/prj.wheel.json"
    )).to.be.true;
    expect(result).to.equal("not-started");
  });

  it("should throw an error when the project JSON cannot be read", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const mockError = new Error("read failed");

    readJsonGreedyMock.rejects(mockError);

    try {
      await getProjectState(mockProjectRootDir);
      throw new Error("Expected getProjectState to throw");
    } catch (err) {
      expect(err).to.equal(mockError);
    }

    expect(readJsonGreedyMock.calledOnceWithExactly(
      "/mock/project/root/prj.wheel.json"
    )).to.be.true;
  });

  it("should return undefined when the state property is missing", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const mockProjectJson = { name: "test_project" };

    readJsonGreedyMock.resolves(mockProjectJson);

    const result = await getProjectState(mockProjectRootDir);

    expect(result).to.be.undefined;

    expect(readJsonGreedyMock.calledOnceWithExactly(
      "/mock/project/root/prj.wheel.json"
    )).to.be.true;
  });
});

describe("#checkRunningJobs", ()=>{
  let rewireProjectFilesOperator;
  let checkRunningJobs;
  let globStub;
  let fsStub;
  let getLoggerStub;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    checkRunningJobs = rewireProjectFilesOperator.__get__("checkRunningJobs");

    globStub = sinon.stub();
    fsStub = {
      readJson: sinon.stub()
    };
    getLoggerStub = {
      warn: sinon.spy()
    };

    rewireProjectFilesOperator.__set__({
      promisify: ()=>globStub,
      fs: fsStub,
      getLogger: ()=>getLoggerStub
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return tasks and jmFiles when all job manager files are valid", async ()=>{
    const projectRootDir = "/mock/project/root";
    const mockFiles = ["job1.json", "job2.json"];
    const mockTask1 = [{ id: 1, name: "Task1" }];
    const mockTask2 = [{ id: 2, name: "Task2" }];

    globStub.resolves(mockFiles);
    fsStub.readJson.onFirstCall().resolves(mockTask1);
    fsStub.readJson.onSecondCall().resolves(mockTask2);

    const result = await checkRunningJobs(projectRootDir);

    expect(result.tasks).to.deep.equal([...mockTask1, ...mockTask2]);
    expect(result.jmFiles).to.deep.equal(mockFiles);
    expect(getLoggerStub.warn.notCalled).to.be.true;
  });

  it("should handle and log errors for invalid job manager files", async ()=>{
    const projectRootDir = "/mock/project/root";
    const mockFiles = ["job1.json", "job2.json"];
    const mockTask = [{ id: 1, name: "Task1" }];

    globStub.resolves(mockFiles);
    fsStub.readJson.onFirstCall().resolves(mockTask);
    fsStub.readJson.onSecondCall().rejects(new Error("Invalid JSON"));

    const result = await checkRunningJobs(projectRootDir);

    expect(result.tasks).to.deep.equal(mockTask);
    expect(result.jmFiles).to.deep.equal(["job1.json"]);
    expect(getLoggerStub.warn.calledOnce).to.be.true;
    expect(getLoggerStub.warn.firstCall.args[0]).to.equal("read job manager file failed");
  });

  it("should return empty tasks and jmFiles when no job manager files are found", async ()=>{
    const projectRootDir = "/mock/project/root";

    globStub.resolves([]);

    const result = await checkRunningJobs(projectRootDir);

    expect(result.tasks).to.deep.equal([]);
    expect(result.jmFiles).to.deep.equal([]);
    expect(getLoggerStub.warn.notCalled).to.be.true;
  });

  it("should skip files without valid task arrays", async ()=>{
    const projectRootDir = "/mock/project/root";
    const mockFiles = ["job1.json", "job2.json"];
    const mockInvalidContent = { notArray: true };

    globStub.resolves(mockFiles);
    fsStub.readJson.onFirstCall().resolves([]);
    fsStub.readJson.onSecondCall().resolves(mockInvalidContent);

    const result = await checkRunningJobs(projectRootDir);

    expect(result.tasks).to.deep.equal([]);
    expect(result.jmFiles).to.deep.equal([]);
    expect(getLoggerStub.warn.notCalled).to.be.true;
  });
});

describe("#rewriteIncludeExclude", ()=>{
  let rewireProjectFilesOperator;
  let rewriteIncludeExclude;
  let readJsonGreedyMock, writeComponentJsonMock, glob2ArrayMock;
  const mockProjectRootDir = "/mock/project/root";
  const mockFilename = `${mockProjectRootDir}/component.json`;
  let changedFiles;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    rewriteIncludeExclude = rewireProjectFilesOperator.__get__("rewriteIncludeExclude");

    changedFiles = [];

    readJsonGreedyMock = sinon.stub();
    writeComponentJsonMock = sinon.stub().resolves();
    glob2ArrayMock = sinon.stub();

    rewireProjectFilesOperator.__set__({
      readJsonGreedy: readJsonGreedyMock,
      writeComponentJson: writeComponentJsonMock,
      glob2Array: glob2ArrayMock
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should convert string 'include' property to array of objects", async ()=>{
    const mockComponentJson = { include: "file1,file2", exclude: [] };
    readJsonGreedyMock.resolves(mockComponentJson);
    glob2ArrayMock.returns(["file1", "file2"]);

    await rewriteIncludeExclude(mockProjectRootDir, mockFilename, changedFiles);

    expect(glob2ArrayMock.calledOnceWithExactly("file1,file2")).to.be.true;
    expect(mockComponentJson.include).to.deep.equal([
      { name: "file1" },
      { name: "file2" }
    ]);
    expect(writeComponentJsonMock.calledOnceWithExactly(
      mockProjectRootDir,
      path.dirname(mockFilename),
      mockComponentJson
    )).to.be.true;
    expect(changedFiles).to.include(mockFilename);
  });

  it("should set 'include' to an empty array if it is null", async ()=>{
    const mockComponentJson = { include: null, exclude: [] };
    readJsonGreedyMock.resolves(mockComponentJson);

    await rewriteIncludeExclude(mockProjectRootDir, mockFilename, changedFiles);

    expect(mockComponentJson.include).to.deep.equal([]);
    expect(writeComponentJsonMock.calledOnce).to.be.true;
    expect(changedFiles).to.include(mockFilename);
  });

  it("should not write if no changes are made", async ()=>{
    const mockComponentJson = { include: [], exclude: [] };
    readJsonGreedyMock.resolves(mockComponentJson);

    await rewriteIncludeExclude(mockProjectRootDir, mockFilename, changedFiles);

    expect(writeComponentJsonMock.notCalled).to.be.true;
    expect(changedFiles).to.be.empty;
  });

  it("should convert string 'exclude' property to array of objects", async ()=>{
    const mockComponentJson = { include: [], exclude: "file3,file4" };
    readJsonGreedyMock.resolves(mockComponentJson);
    glob2ArrayMock.returns(["file3", "file4"]);

    await rewriteIncludeExclude(mockProjectRootDir, mockFilename, changedFiles);

    expect(glob2ArrayMock.calledOnceWithExactly("file3,file4")).to.be.true;
    expect(mockComponentJson.exclude).to.deep.equal([
      { name: "file3" },
      { name: "file4" }
    ]);
    expect(writeComponentJsonMock.calledOnce).to.be.true;
    expect(changedFiles).to.include(mockFilename);
  });

  it("should set 'exclude' to an empty array if it is null", async ()=>{
    const mockComponentJson = { include: [], exclude: null };
    readJsonGreedyMock.resolves(mockComponentJson);

    await rewriteIncludeExclude(mockProjectRootDir, mockFilename, changedFiles);

    expect(mockComponentJson.exclude).to.deep.equal([]);
    expect(writeComponentJsonMock.calledOnce).to.be.true;
    expect(changedFiles).to.include(mockFilename);
  });
});

describe("#rewriteAllIncludeExcludeProperty", ()=>{
  let rewireProjectFilesOperator;
  let rewriteAllIncludeExcludeProperty;
  let rewriteIncludeExcludeMock;
  let globMock;
  let promisifyMock;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    rewriteAllIncludeExcludeProperty = rewireProjectFilesOperator.__get__("rewriteAllIncludeExcludeProperty");

    rewriteIncludeExcludeMock = sinon.stub();
    rewireProjectFilesOperator.__set__("rewriteIncludeExclude", rewriteIncludeExcludeMock);

    globMock = sinon.stub();
    promisifyMock = sinon.stub().callsFake((fn)=>fn === glob ? globMock : promisify(fn));
    rewireProjectFilesOperator.__set__("promisify", promisifyMock);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should process all component JSON files and update 'changed' array", async ()=>{
    const projectRootDir = "/mock/project/root";
    const changed = [];
    const mockFiles = [
      `${projectRootDir}/comp1/cmp.wheel.json`,
      `${projectRootDir}/comp2/cmp.wheel.json`
    ];

    globMock.resolves(mockFiles);
    rewriteIncludeExcludeMock.resolves();

    await rewriteAllIncludeExcludeProperty(projectRootDir, changed);

    expect(globMock.calledOnceWithExactly(`./**/cmp.wheel.json`, { cwd: projectRootDir })).to.be.true;
    expect(rewriteIncludeExcludeMock.callCount).to.equal(mockFiles.length);
    mockFiles.forEach((file, index)=>{
      expect(rewriteIncludeExcludeMock.getCall(index).args[0]).to.equal(projectRootDir);
      expect(rewriteIncludeExcludeMock.getCall(index).args[1]).to.equal(path.resolve(projectRootDir, file));
      expect(rewriteIncludeExcludeMock.getCall(index).args[2]).to.equal(changed);
    });
  });

  it("should handle an empty project directory gracefully", async ()=>{
    const projectRootDir = "/mock/project/root";
    const changed = [];

    globMock.resolves([]);

    await rewriteAllIncludeExcludeProperty(projectRootDir, changed);

    expect(globMock.calledOnceWithExactly(`./**/cmp.wheel.json`, { cwd: projectRootDir })).to.be.true;
    expect(rewriteIncludeExcludeMock.notCalled).to.be.true;
    expect(changed).to.deep.equal([]);
  });

  it("should propagate errors from rewriteIncludeExclude", async ()=>{
    const projectRootDir = "/mock/project/root";
    const changed = [];
    const mockFiles = [
      `${projectRootDir}/comp1/cmp.wheel.json`
    ];
    const mockError = new Error("Test error");

    globMock.resolves(mockFiles);
    rewriteIncludeExcludeMock.rejects(mockError);

    try {
      await rewriteAllIncludeExcludeProperty(projectRootDir, changed);
      throw new Error("Expected rewriteAllIncludeExcludeProperty to throw");
    } catch (err) {
      expect(err).to.equal(mockError);
    }

    expect(globMock.calledOnceWithExactly(`./**/cmp.wheel.json`, { cwd: projectRootDir })).to.be.true;
    expect(rewriteIncludeExcludeMock.calledOnceWithExactly(
      projectRootDir,
      path.resolve(projectRootDir, mockFiles[0]),
      changed
    )).to.be.true;
  });
});

describe("#readProject", ()=>{
  let rewireProjectFilesOperator;
  let readProject;
  let getProjectJsonMock, rewriteAllIncludeExcludePropertyMock, writeProjectJsonMock;
  let setProjectStateMock, setComponentStateRMock;
  let gitInitMock, gitAddMock, gitCommitMock, projectListMock;
  let fsPathExistsMock, fsOutputFileMock;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    readProject = rewireProjectFilesOperator.__get__("readProject");

    getProjectJsonMock = sinon.stub();
    rewriteAllIncludeExcludePropertyMock = sinon.stub();
    writeProjectJsonMock = sinon.stub();
    setProjectStateMock = sinon.stub();
    setComponentStateRMock = sinon.stub();
    gitInitMock = sinon.stub();
    gitAddMock = sinon.stub();
    gitCommitMock = sinon.stub();
    projectListMock = { query: sinon.stub(), unshift: sinon.stub() };
    fsPathExistsMock = sinon.stub();
    fsOutputFileMock = sinon.stub();

    rewireProjectFilesOperator.__set__({
      getProjectJson: getProjectJsonMock,
      rewriteAllIncludeExcludeProperty: rewriteAllIncludeExcludePropertyMock,
      writeProjectJson: writeProjectJsonMock,
      gitInit: gitInitMock,
      setProjectState: setProjectStateMock,
      setComponentStateR: setComponentStateRMock,
      gitAdd: gitAddMock,
      gitCommit: gitCommitMock,
      projectList: projectListMock,
      fs: { pathExists: fsPathExistsMock, outputFile: fsOutputFileMock },
      path: {
        ...path,
        resolve: sinon.stub().callsFake((...args)=>args.join("/")),
        join: sinon.stub().callsFake((...args)=>args.join("/"))
      }
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should handle project version <= 2 and update version", async function () {
    getProjectJsonMock.resolves({ version: 1.9, name: "test_project" });
    rewriteAllIncludeExcludePropertyMock.resolves();
    fsPathExistsMock.resolves(false);
    gitInitMock.resolves();
    setProjectStateMock.resolves();
    setComponentStateRMock.resolves();
    gitCommitMock.resolves();
    projectListMock.query.returns(false);
    projectListMock.unshift.returns(true);

    const result = await readProject("/mock/project/root");

    expect(rewriteAllIncludeExcludePropertyMock.calledOnce).to.be.true;
    expect(writeProjectJsonMock.calledWith("/mock/project/root", sinon.match({ version: 2.1 }))).to.be.true;
    expect(gitInitMock.calledWith("/mock/project/root", "wheel", "wheel@example.com")).to.be.true;
    expect(setProjectStateMock.calledWith("/mock/project/root", "not-started")).to.be.true;
    expect(setComponentStateRMock.calledWith("/mock/project/root", "/mock/project/root", "not-started")).to.be.true;
    expect(gitAddMock.calledWith("/mock/project/root", "./")).to.be.true;
    expect(gitCommitMock.calledWith("/mock/project/root", "import project")).to.be.true;
    expect(projectListMock.unshift.calledWith({ path: "/mock/project/root" })).to.be.true;
    expect(result).to.equal("/mock/project/root");
  });

  it("should skip processing if project is already imported", async function () {
    getProjectJsonMock.resolves({ version: 2.1 });
    projectListMock.query.returns({ path: "/mock/project/already" });

    const result = await readProject("/mock/project/already");

    expect(rewriteAllIncludeExcludePropertyMock.calledWith("/mock/project/already", [])).to.be.false;
    expect(gitAddMock.calledOnce).to.be.false;//projectList.queryでtrueが返るので、後続のgitAddは呼ばれない。
    expect(result).to.equal("/mock/project/already");
  });

  it("should handle invalid directory names", async function () {
    getProjectJsonMock.resolves({ version: 2.1, name: "test_project" });
    fsPathExistsMock.resolves(true);
    projectListMock.query.returns(null);
    gitAddMock.resolves();
    writeProjectJsonMock.resolves();

    const result = await readProject("/mock/project/root");

    expect(writeProjectJsonMock.calledOnce).to.be.true;
    expect(gitAddMock.calledOnce).to.be.true;
    expect(gitCommitMock.calledWith("/mock/project/root", "import project", ["--", ".gitignore", "prj.wheel.json"])).to.be.true;

    expect(result).to.equal("/mock/project/root");
  });

  it("should initialize git repository if not already initialized", async function () {
    getProjectJsonMock.resolves({ version: 2.1 });
    projectListMock.query.returns(false);
    writeProjectJsonMock.resolves();
    fsPathExistsMock.onFirstCall().resolves(true)
      .onSecondCall()
      .resolves(false);
    fsOutputFileMock.resolves();
    gitAddMock.resolves();
    gitCommitMock.resolves();
    projectListMock.unshift.returns(true);

    const result = await readProject("/mock/project/root");

    expect(fsOutputFileMock.calledWith("/mock/project/root/.gitignore", "wheel.log")).to.be.true;
    expect(gitAddMock.calledWith("/mock/project/root", ".gitignore")).to.be.true;
    expect(gitCommitMock.calledWith("/mock/project/root", "import project", ["--", ".gitignore", "prj.wheel.json"])).to.be.true;
    expect(result).to.equal("/mock/project/root");
  });

  it("should handle errors during git operations", async function () {
    getProjectJsonMock.resolves({ version: 2.1 });
    projectListMock.query.returns(false);
    writeProjectJsonMock.resolves();
    fsPathExistsMock.resolves(false);
    gitInitMock.rejects(new Error("git init failed"));

    const result = await readProject("/mock/project/root");

    expect(result).to.null;
  });
});

describe("#setComponentStateR", ()=>{
  let rewireProjectFilesOperator;
  let setComponentStateR;
  let globMock, readJsonGreedyMock, writeComponentJsonMock;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    setComponentStateR = rewireProjectFilesOperator.__get__("setComponentStateR");

    globMock = sinon.stub();
    readJsonGreedyMock = sinon.stub();
    writeComponentJsonMock = sinon.stub();

    rewireProjectFilesOperator.__set__({
      promisify: ()=>globMock,
      readJsonGreedy: readJsonGreedyMock,
      writeComponentJson: writeComponentJsonMock
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should update the state for all components and call writeComponentJson", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const mockDir = "/mock/project/root/components";
    const state = "finished";

    const globMockFilenames = [
      path.join(mockDir, "component1.json"),
      path.join(mockDir, "component2.json")
    ];
    const expectedFilenames = [
      path.join(mockDir, "component1.json"),
      path.join(mockDir, "component2.json"),
      path.join(mockDir, "cmp.wheel.json")
    ];

    const mockComponents = [
      { state: "not-started" },
      { state: "not-started" },
      { state: "default" }
    ];

    globMock.resolves(globMockFilenames);
    readJsonGreedyMock.onCall(0).resolves(mockComponents[0]);
    readJsonGreedyMock.onCall(1).resolves(mockComponents[1]);
    readJsonGreedyMock.onCall(2).resolves(mockComponents[2]);
    writeComponentJsonMock.resolves("success");

    await setComponentStateR(mockProjectRootDir, mockDir, state);

    expect(globMock.calledOnceWithExactly(path.join(mockDir, "**", "cmp.wheel.json"))).to.be.true;
    expect(readJsonGreedyMock.calledThrice).to.be.true;
    expect(writeComponentJsonMock.calledThrice).to.be.true;

    expect(writeComponentJsonMock.firstCall.args[1]).to.equal(path.dirname(expectedFilenames[0]));
    expect(writeComponentJsonMock.secondCall.args[1]).to.equal(path.dirname(expectedFilenames[1]));
    expect(writeComponentJsonMock.thirdCall.args[1]).to.equal(path.dirname(expectedFilenames[2]));

    expect(writeComponentJsonMock.firstCall.args[2].state).to.equal(state);
    expect(writeComponentJsonMock.secondCall.args[2].state).to.equal(state);
    expect(writeComponentJsonMock.thirdCall.args[2].state).to.equal(state);
  });

  it("should skip updating components in ignoreStates", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const mockDir = "/mock/project/root/components";
    const mockState = "finished";
    const ignoreStates = ["running", "finished"];

    const globMockFilenames = [
      path.join(mockDir, "component1.json"),
      path.join(mockDir, "component2.json")
    ];
    const expectedFilenames = [
      path.join(mockDir, "component1.json"),
      path.join(mockDir, "component2.json"),
      path.join(mockDir, "cmp.wheel.json")
    ];

    const mockComponents = [
      { state: "not-started" }, //更新対象
      { state: "running" }, //スキップ対象
      { state: "default" } //更新対象
    ];

    globMock.resolves(globMockFilenames);
    readJsonGreedyMock.onCall(0).resolves(mockComponents[0]);
    readJsonGreedyMock.onCall(1).resolves(mockComponents[1]);
    readJsonGreedyMock.onCall(2).resolves(mockComponents[2]);
    writeComponentJsonMock.resolves("success");

    await setComponentStateR(mockProjectRootDir, mockDir, mockState, false, ignoreStates);

    expect(globMock.calledOnceWithExactly(path.join(mockDir, "**", "cmp.wheel.json"))).to.be.true;
    expect(readJsonGreedyMock.calledThrice).to.be.true;
    expect(writeComponentJsonMock.calledTwice).to.be.true; //2回のみ更新

    expect(writeComponentJsonMock.firstCall.args[1]).to.equal(path.dirname(expectedFilenames[0]));
    expect(writeComponentJsonMock.secondCall.args[1]).to.equal(path.dirname(expectedFilenames[2]));

    expect(writeComponentJsonMock.firstCall.args[2].state).to.equal(mockState);
    expect(writeComponentJsonMock.secondCall.args[2].state).to.equal(mockState);
  });

  it("should handle an empty directory gracefully", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const mockDir = "/mock/project/root/components";
    const mockState = "finished";

    const globMockFilenames = []; //空ディレクトリとして設定
    const expectedFilenames = [
      path.join(mockDir, "cmp.wheel.json") //自動追加される
    ];

    globMock.resolves(globMockFilenames);
    readJsonGreedyMock.onCall(0).resolves({ state: "default" });
    writeComponentJsonMock.resolves("success");

    await setComponentStateR(mockProjectRootDir, mockDir, mockState);

    expect(globMock.calledOnceWithExactly(path.join(mockDir, "**", "cmp.wheel.json"))).to.be.true;
    expect(readJsonGreedyMock.calledOnce).to.be.true; //cmp.wheel.json のみ処理される
    expect(writeComponentJsonMock.calledOnce).to.be.true;

    expect(writeComponentJsonMock.firstCall.args[1]).to.equal(path.dirname(expectedFilenames[0]));
    expect(writeComponentJsonMock.firstCall.args[2].state).to.equal(mockState);
  });
});

describe("#updateProjectROStatus", ()=>{
  let rewireProjectFilesOperator;
  let updateProjectROStatus;
  let readJsonGreedyMock;
  let writeJsonWrapperMock;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    updateProjectROStatus = rewireProjectFilesOperator.__get__("updateProjectROStatus");

    readJsonGreedyMock = sinon.stub();
    writeJsonWrapperMock = sinon.stub();

    rewireProjectFilesOperator.__set__("readJsonGreedy", readJsonGreedyMock);
    rewireProjectFilesOperator.__set__("writeJsonWrapper", writeJsonWrapperMock);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should update the readOnly property in the project JSON file", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const mockProjectJson = { name: "test_project", readOnly: false };
    const updatedProjectJson = { name: "test_project", readOnly: true };

    readJsonGreedyMock.resolves(mockProjectJson);
    writeJsonWrapperMock.resolves();

    await updateProjectROStatus(mockProjectRootDir, true);

    expect(readJsonGreedyMock.calledOnceWithExactly(
      `${mockProjectRootDir}/prj.wheel.json`
    )).to.be.true;

    expect(writeJsonWrapperMock.calledOnceWithExactly(
      `${mockProjectRootDir}/prj.wheel.json`,
      updatedProjectJson
    )).to.be.true;
  });

  it("should throw an error if readJsonGreedy fails", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const mockError = new Error("File not found");

    readJsonGreedyMock.rejects(mockError);

    try {
      await updateProjectROStatus(mockProjectRootDir, true);
      throw new Error("Expected updateProjectROStatus to throw");
    } catch (err) {
      expect(err).to.equal(mockError);
    }

    expect(readJsonGreedyMock.calledOnceWithExactly(
      `${mockProjectRootDir}/prj.wheel.json`
    )).to.be.true;

    expect(writeJsonWrapperMock.notCalled).to.be.true;
  });

  it("should throw an error if writeJsonWrapper fails", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const mockProjectJson = { name: "test_project", readOnly: false };
    const mockError = new Error("Write failed");

    readJsonGreedyMock.resolves(mockProjectJson);
    writeJsonWrapperMock.rejects(mockError);

    try {
      await updateProjectROStatus(mockProjectRootDir, true);
      throw new Error("Expected updateProjectROStatus to throw");
    } catch (err) {
      expect(err).to.equal(mockError);
    }

    expect(readJsonGreedyMock.calledOnceWithExactly(
      `${mockProjectRootDir}/prj.wheel.json`
    )).to.be.true;

    expect(writeJsonWrapperMock.calledOnceWithExactly(
      `${mockProjectRootDir}/prj.wheel.json`,
      { name: "test_project", readOnly: true }
    )).to.be.true;
  });
});

describe("#updateProjectDescription", ()=>{
  let rewireProjectFilesOperator;
  let updateProjectDescription;
  let readJsonGreedyMock;
  let writeJsonWrapperMock;
  let gitAddMock;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    updateProjectDescription = rewireProjectFilesOperator.__get__("updateProjectDescription");

    readJsonGreedyMock = sinon.stub();
    writeJsonWrapperMock = sinon.stub();
    gitAddMock = sinon.stub();

    rewireProjectFilesOperator.__set__({
      readJsonGreedy: readJsonGreedyMock,
      writeJsonWrapper: writeJsonWrapperMock,
      gitAdd: gitAddMock
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should update the description in the project JSON and stage the changes", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const mockDescription = "New project description";
    const mockProjectJson = { name: "test_project", version: 2, description: "Old description" };

    readJsonGreedyMock.resolves(mockProjectJson);
    writeJsonWrapperMock.resolves();
    gitAddMock.resolves();

    await updateProjectDescription(mockProjectRootDir, mockDescription);

    expect(readJsonGreedyMock.calledOnceWithExactly(
      path.resolve(mockProjectRootDir, "prj.wheel.json")
    )).to.be.true;

    expect(writeJsonWrapperMock.calledOnceWithExactly(
      path.resolve(mockProjectRootDir, "prj.wheel.json"),
      { ...mockProjectJson, description: mockDescription }
    )).to.be.true;

    expect(gitAddMock.calledOnceWithExactly(
      mockProjectRootDir,
      path.resolve(mockProjectRootDir, "prj.wheel.json")
    )).to.be.true;
  });

  it("should throw an error if reading the JSON fails", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const mockDescription = "New project description";
    const mockError = new Error("Failed to read JSON");

    readJsonGreedyMock.rejects(mockError);

    try {
      await updateProjectDescription(mockProjectRootDir, mockDescription);
      throw new Error("Expected updateProjectDescription to throw");
    } catch (err) {
      expect(err).to.equal(mockError);
    }

    expect(readJsonGreedyMock.calledOnce).to.be.true;
    expect(writeJsonWrapperMock.notCalled).to.be.true;
    expect(gitAddMock.notCalled).to.be.true;
  });

  it("should throw an error if writing the JSON fails", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const mockDescription = "New project description";
    const mockProjectJson = { name: "test_project", version: 2, description: "Old description" };
    const mockError = new Error("Failed to write JSON");

    readJsonGreedyMock.resolves(mockProjectJson);
    writeJsonWrapperMock.rejects(mockError);

    try {
      await updateProjectDescription(mockProjectRootDir, mockDescription);
      throw new Error("Expected updateProjectDescription to throw");
    } catch (err) {
      expect(err).to.equal(mockError);
    }

    expect(readJsonGreedyMock.calledOnce).to.be.true;
    expect(writeJsonWrapperMock.calledOnce).to.be.true;
    expect(gitAddMock.notCalled).to.be.true;
  });

  it("should throw an error if gitAdd fails", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const mockDescription = "New project description";
    const mockProjectJson = { name: "test_project", version: 2, description: "Old description" };
    const mockError = new Error("Failed to stage changes");

    readJsonGreedyMock.resolves(mockProjectJson);
    writeJsonWrapperMock.resolves();
    gitAddMock.rejects(mockError);

    try {
      await updateProjectDescription(mockProjectRootDir, mockDescription);
      throw new Error("Expected updateProjectDescription to throw");
    } catch (err) {
      expect(err).to.equal(mockError);
    }

    expect(readJsonGreedyMock.calledOnce).to.be.true;
    expect(writeJsonWrapperMock.calledOnce).to.be.true;
    expect(gitAddMock.calledOnce).to.be.true;
  });
});

describe("#addProject", ()=>{
  let rewireProjectFilesOperator;
  let addProject;
  let createNewProjectMock;
  let fsMock;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    addProject = rewireProjectFilesOperator.__get__("addProject");
    createNewProjectMock = sinon.stub();

    fsMock = {
      pathExists: sinon.stub()
    };

    rewireProjectFilesOperator.__set__({
      createNewProject: createNewProjectMock,
      fs: fsMock
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should throw an error if the project directory already exists", async ()=>{
    const mockProjectDir = "/existing/project/dir";

    fsMock.pathExists.resolves(true);

    try {
      await addProject(mockProjectDir, "Test description");
      throw new Error("Expected addProject to throw an error");
    } catch (err) {
      expect(err.message).to.equal("specified project dir is already exists");
      expect(err.projectRootDir).to.equal(`${mockProjectDir}.wheel`);
    }

    expect(fsMock.pathExists.calledOnceWithExactly(`${mockProjectDir}.wheel`)).to.be.true;
  });

  it("should throw an error if the project name is invalid", async ()=>{
    const mockProjectDir = "/valid/dir";
    const invalidProjectName = "Invalid/Name";

    fsMock.pathExists.resolves(false);
    sinon.stub(path, "basename").returns(invalidProjectName);

    try {
      await addProject(mockProjectDir, "Test description");
      throw new Error("Expected addProject to throw an error");
    } catch (err) {
      expect(err.message).to.equal("illegal project name");
    }
  });

  it("should create a new project and add it to the project list", async ()=>{
    const mockProjectDir = "/new/project/dir";
    const validProjectName = "validName";
    const mockCreatedProjectDir = `${mockProjectDir}.wheel`;

    fsMock.pathExists.resolves(false);
    sinon.stub(path, "basename").returns(validProjectName);
    createNewProjectMock.resolves(mockCreatedProjectDir);

    const projectListUnshiftStub = sinon.stub();
    rewireProjectFilesOperator.__set__("projectList", { unshift: projectListUnshiftStub });

    await addProject(mockProjectDir, "Test description");

    expect(createNewProjectMock.calledOnceWithExactly(
      `${mockProjectDir}.wheel`,
      validProjectName,
      "Test description",
      "wheel",
      "wheel@example.com"
    )).to.be.true;
    expect(projectListUnshiftStub.calledOnceWithExactly({ path: mockCreatedProjectDir })).to.be.true;
  });
});

describe("#renameProject", ()=>{
  let rewireProjectFilesOperator;
  let renameProject;
  let isValidNameMock;
  let fsMock;
  let readJsonGreedyMock;
  let writeProjectJsonMock;
  let writeComponentJsonMock;
  let gitCommitMock;
  let projectListMock;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    renameProject = rewireProjectFilesOperator.__get__("renameProject");

    isValidNameMock = sinon.stub();
    fsMock = {
      move: sinon.stub(),
      pathExists: sinon.stub()
    };
    readJsonGreedyMock = sinon.stub();
    writeProjectJsonMock = sinon.stub();
    writeComponentJsonMock = sinon.stub();
    gitCommitMock = sinon.stub();
    projectListMock = {
      get: sinon.stub(),
      update: sinon.stub()
    };

    rewireProjectFilesOperator.__set__({
      isValidName: isValidNameMock,
      fs: fsMock,
      readJsonGreedy: readJsonGreedyMock,
      writeProjectJson: writeProjectJsonMock,
      writeComponentJson: writeComponentJsonMock,
      gitCommit: gitCommitMock,
      projectList: projectListMock
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should rename a project successfully", async ()=>{
    const mockId = "1234";
    const mockOldDir = "/old/project/path";
    const mockNewName = "newProjectName";
    const mockNewDir = "/old/project/newProjectName";
    const mockProjectJson = { name: "oldProjectName" };
    const mockRootWorkflow = { name: "oldWorkflowName" };
    const mockProjectListEntry = { id: mockId, path: mockOldDir };

    isValidNameMock.returns(true);
    fsMock.pathExists.resolves(false);
    fsMock.move.resolves();
    readJsonGreedyMock.onCall(0).resolves(mockProjectJson);
    readJsonGreedyMock.onCall(1).resolves(mockRootWorkflow);
    writeProjectJsonMock.resolves();
    writeComponentJsonMock.resolves();
    gitCommitMock.resolves();
    projectListMock.get.returns(mockProjectListEntry);

    await renameProject(mockId, mockNewName, mockOldDir);

    expect(isValidNameMock.calledOnceWithExactly(`${mockNewName}.wheel`)).to.be.true;
    expect(fsMock.pathExists.calledOnceWithExactly(`${mockNewDir}.wheel`)).to.be.true;
    expect(fsMock.move.calledOnceWithExactly(mockOldDir, `${mockNewDir}.wheel`)).to.be.true;
    expect(readJsonGreedyMock.calledTwice).to.be.true;
    expect(writeProjectJsonMock.calledOnce).to.be.true;
    expect(writeComponentJsonMock.calledOnce).to.be.true;
    expect(gitCommitMock.calledOnce).to.be.true;
    expect(projectListMock.get.calledOnceWithExactly(mockId)).to.be.true;
    expect(projectListMock.update.calledOnceWithExactly({ id: mockId, path: `${mockNewDir}.wheel` })).to.be.true;
  });

  it("should throw an error if the new name is invalid", async ()=>{
    const mockId = "1234";
    const mockOldDir = "/old/project/path";
    const mockNewName = "invalid/name";

    isValidNameMock.returns(false);

    try {
      await renameProject(mockId, mockNewName, mockOldDir);
      throw new Error("Expected renameProject to throw");
    } catch (err) {
      expect(err.message).to.equal("illegal project name");
      expect(isValidNameMock.calledOnceWithExactly(`${mockNewName}.wheel`)).to.be.true;
    }
  });

  it("should throw an error if the new directory already exists", async ()=>{
    const mockId = "1234";
    const mockOldDir = "/old/project/path";
    const mockNewName = "existingProjectName";
    const mockNewDir = "/old/project/existingProjectName";

    isValidNameMock.returns(true);
    fsMock.pathExists.withArgs(`${mockNewDir}.wheel`).resolves(true);

    try {
      await renameProject(mockId, mockNewName, mockOldDir);
      throw new Error("Expected renameProject to throw");
    } catch (err) {
      expect(err.message).to.equal("already exists");
      expect(isValidNameMock.calledOnceWithExactly(`${mockNewName}.wheel`)).to.be.true;
    }
  });

  it("should handle file system errors during directory move", async ()=>{
    const mockId = "1234";
    const mockOldDir = "/old/project/path";
    const mockNewName = "validProjectName";
    const mockNewDir = "/old/project/validProjectName";

    isValidNameMock.returns(true);
    fsMock.pathExists.resolves(false);
    fsMock.move.rejects(new Error("File system error"));

    try {
      await renameProject(mockId, mockNewName, mockOldDir);
      throw new Error("Expected renameProject to throw");
    } catch (err) {
      expect(err.message).to.equal("File system error");
      expect(fsMock.pathExists.calledOnceWithExactly(`${mockNewDir}.wheel`)).to.be.true;
      expect(isValidNameMock.calledOnceWithExactly(`${mockNewName}.wheel`)).to.be.true;
      expect(fsMock.move.calledOnceWithExactly(mockOldDir, `${mockNewDir}.wheel`)).to.be.true;
    }
  });
});

describe("#isDefaultPort", ()=>{
  let rewireProjectFilesOperator;
  let isDefaultPort;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    isDefaultPort = rewireProjectFilesOperator.__get__("isDefaultPort");
  });

  it("should return true for undefined", ()=>{
    expect(isDefaultPort(undefined)).to.be.true;
  });

  it("should return true for numeric 22", ()=>{
    expect(isDefaultPort(22)).to.be.true;
  });

  it("should return true for string '22'", ()=>{
    expect(isDefaultPort("22")).to.be.true;
  });

  it("should return true for an empty string", ()=>{
    expect(isDefaultPort("")).to.be.true;
  });

  it("should return false for other numeric values", ()=>{
    expect(isDefaultPort(23)).to.be.false;
    expect(isDefaultPort(80)).to.be.false;
  });

  it("should return false for other string values", ()=>{
    expect(isDefaultPort("23")).to.be.false;
    expect(isDefaultPort("80")).to.be.false;
  });

  it("should return false for non-numeric strings", ()=>{
    expect(isDefaultPort("random"))
      .to.be.false;
  });

  it("should handle null input gracefully", ()=>{
    expect(isDefaultPort(null)).to.be.false;
  });

  it("should handle boolean inputs", ()=>{
    expect(isDefaultPort(true)).to.be.false;
    expect(isDefaultPort(false)).to.be.false;
  });
});

describe("#isLocal", ()=>{
  let rewireProjectFilesOperator;
  let isLocal;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    isLocal = rewireProjectFilesOperator.__get__("isLocal");
  });

  it("should return true if host is undefined", ()=>{
    const component = {};
    expect(isLocal(component)).to.be.true;
  });

  it("should return true if host is 'localhost'", ()=>{
    const component = { host: "localhost" };
    expect(isLocal(component)).to.be.true;
  });

  it("should return false if host is null", ()=>{
    const component = { host: null };
    expect(isLocal(component)).to.be.false;
  });

  it("should return false if host is a remote host", ()=>{
    const component = { host: "remotehost" };
    expect(isLocal(component)).to.be.false;
  });

  it("should return true for an empty object", ()=>{
    const component = {};
    expect(isLocal(component)).to.be.true;
  });
});
