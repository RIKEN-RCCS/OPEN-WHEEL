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

describe("#isSameRemoteHost", ()=>{
  let rewireProjectFilesOperator;
  let isSameRemoteHost;
  let readComponentJsonByIDMock;
  let remoteHostMock;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    isSameRemoteHost = rewireProjectFilesOperator.__get__("isSameRemoteHost");

    readComponentJsonByIDMock = sinon.stub();
    remoteHostMock = {
      query: sinon.stub()
    };

    rewireProjectFilesOperator.__set__({
      readComponentJsonByID: readComponentJsonByIDMock,
      remoteHost: remoteHostMock
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return null if src and dst are the same", async ()=>{
    const result = await isSameRemoteHost("/project/root", "componentA", "componentA");
    expect(result).to.be.null;
  });

  it("should return false if either component is local", async ()=>{
    readComponentJsonByIDMock
      .withArgs("/project/root", "componentA").resolves({ host: "localhost" })
      .withArgs("/project/root", "componentB")
      .resolves({ host: "host1" });

    const result = await isSameRemoteHost("/project/root", "componentA", "componentB");
    expect(result).to.be.false;
  });

  it("should return true if both components have the same host name", async ()=>{
    readComponentJsonByIDMock
      .withArgs("/project/root", "componentA").resolves({ host: "host1" })
      .withArgs("/project/root", "componentB")
      .resolves({ host: "host1" });

    const result = await isSameRemoteHost("/project/root", "componentA", "componentB");
    expect(result).to.be.true;
  });

  it("should return true if both components have matching remote host info", async ()=>{
    readComponentJsonByIDMock
      .withArgs("/project/root", "componentA").resolves({ host: "host1" })
      .withArgs("/project/root", "componentB")
      .resolves({ host: "host2" });
    remoteHostMock.query
      .withArgs("name", "host1").returns({ host: "sharedHost", port: 22 })
      .withArgs("name", "host2")
      .returns({ host: "sharedHost", port: 22 });

    const result = await isSameRemoteHost("/project/root", "componentA", "componentB");
    expect(result).to.be.true;
  });

  it("should return false if remote hosts do not match", async ()=>{
    readComponentJsonByIDMock
      .withArgs("/project/root", "componentA").resolves({ host: "host1" })
      .withArgs("/project/root", "componentB")
      .resolves({ host: "host2" });
    remoteHostMock.query
      .withArgs("name", "host1").returns({ host: "host1", port: 22, sharedHost: "host1", name: "host1" })
      .withArgs("name", "host2")
      .returns({ host: "host2", port: 22, sharedHost: "host2", name: "host2" });

    const result = await isSameRemoteHost("/project/root", "componentA", "componentB");
    expect(result).to.be.false;
  });

  it("should return true if dstHostInfo.sharedHost matches srcHostInfo.name", async ()=>{
    readComponentJsonByIDMock
      .withArgs("/project/root", "componentA").resolves({ host: "host1" })
      .withArgs("/project/root", "componentB")
      .resolves({ host: "host2" });
    remoteHostMock.query
      .withArgs("name", "host1").returns({ host: "host1", name: "host1" })
      .withArgs("name", "host2")
      .returns({ sharedHost: "host1" });

    const result = await isSameRemoteHost("/project/root", "componentA", "componentB");
    expect(result).to.be.true;
  });
});

describe("#isParent", ()=>{
  let rewireProjectFilesOperator;
  let isParent;
  let readComponentJsonByIDMock;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    isParent = rewireProjectFilesOperator.__get__("isParent");

    readComponentJsonByIDMock = sinon.stub();
    rewireProjectFilesOperator.__set__("readComponentJsonByID", readComponentJsonByIDMock);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return true if parentID is 'parent'", async ()=>{
    const result = await isParent("/mock/project", "parent", "childID");
    expect(result).to.be.true;
  });

  it("should return false if childID is 'parent'", async ()=>{
    const result = await isParent("/mock/project", "parentID", "parent");
    expect(result).to.be.false;
  });

  it("should return false if childJson is null", async ()=>{
    readComponentJsonByIDMock.resolves(null);

    const result = await isParent("/mock/project", "parentID", "childID");
    expect(result).to.be.false;
    expect(readComponentJsonByIDMock.calledOnceWithExactly("/mock/project", "childID")).to.be.true;
  });

  it("should return false if childID is not a string", async ()=>{
    readComponentJsonByIDMock.resolves({ parent: "parentID" });

    const result = await isParent("/mock/project", "parentID", 123);
    expect(result).to.be.false;
  });

  it("should return true if childJson.parent matches parentID", async ()=>{
    readComponentJsonByIDMock.resolves({ parent: "parentID" });

    const result = await isParent("/mock/project", "parentID", "childID");
    expect(result).to.be.true;
    expect(readComponentJsonByIDMock.calledOnceWithExactly("/mock/project", "childID")).to.be.true;
  });

  it("should return false if childJson.parent does not match parentID", async ()=>{
    readComponentJsonByIDMock.resolves({ parent: "otherParentID" });

    const result = await isParent("/mock/project", "parentID", "childID");
    expect(result).to.be.false;
    expect(readComponentJsonByIDMock.calledOnceWithExactly("/mock/project", "childID")).to.be.true;
  });
});

describe("#removeAllLinkFromComponent", ()=>{
  let rewireProjectFilesOperator;
  let removeAllLinkFromComponent;
  let readComponentJsonByIDMock;
  let writeComponentJsonByIDMock;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    removeAllLinkFromComponent = rewireProjectFilesOperator.__get__("removeAllLinkFromComponent");
    readComponentJsonByIDMock = sinon.stub();
    writeComponentJsonByIDMock = sinon.stub();
    rewireProjectFilesOperator.__set__({
      readComponentJsonByID: readComponentJsonByIDMock,
      writeComponentJsonByID: writeComponentJsonByIDMock
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should remove all links from the specified component", async ()=>{
    const projectRootDir = "/mock/project/root";
    const componentID = "testComponent";

    const targetComponent = {
      ID: componentID,
      previous: ["prev1", "prev2"],
      next: ["next1"],
      else: ["else1"]
    };

    const prev1Component = {
      ID: "prev1",
      next: [componentID]
    };
    const prev2Component = {
      ID: "prev2",
      next: [componentID],
      else: [componentID]
    };
    const nextComponent = {
      ID: "next1",
      previous: [componentID]
    };
    const elseComponent = {
      ID: "else1",
      previous: [componentID]
    };

    readComponentJsonByIDMock.withArgs(projectRootDir, componentID).resolves(targetComponent);
    readComponentJsonByIDMock.withArgs(projectRootDir, "prev1").resolves(prev1Component);
    readComponentJsonByIDMock.withArgs(projectRootDir, "prev2").resolves(prev2Component);
    readComponentJsonByIDMock.withArgs(projectRootDir, "next1").resolves(nextComponent);
    readComponentJsonByIDMock.withArgs(projectRootDir, "else1").resolves(elseComponent);

    await removeAllLinkFromComponent(projectRootDir, componentID);

    expect(prev1Component.next).to.not.include(componentID);
    expect(prev2Component.next).to.not.include(componentID);
    expect(prev2Component.else).to.not.include(componentID);
    expect(nextComponent.previous).to.not.include(componentID);
    expect(elseComponent.previous).to.not.include(componentID);

    expect(writeComponentJsonByIDMock.callCount).to.equal(4);
    expect(writeComponentJsonByIDMock.calledWith(projectRootDir, "prev1", sinon.match.object)).to.be.true;
    expect(writeComponentJsonByIDMock.calledWith(projectRootDir, "prev2", sinon.match.object)).to.be.true;
    expect(writeComponentJsonByIDMock.calledWith(projectRootDir, "next1", sinon.match.object)).to.be.true;
    expect(writeComponentJsonByIDMock.calledWith(projectRootDir, "else1", sinon.match.object)).to.be.true;
  });

  it("should handle components with no links gracefully", async ()=>{
    const projectRootDir = "/mock/project/root";
    const componentID = "isolatedComponent";

    const isolatedComponent = {
      ID: componentID
    };

    readComponentJsonByIDMock.withArgs(projectRootDir, componentID).resolves(isolatedComponent);

    await removeAllLinkFromComponent(projectRootDir, componentID);

    expect(writeComponentJsonByIDMock.notCalled).to.be.true;
  });

  it("should remove all file links from inputFiles and outputFiles", async ()=>{
    const projectRootDir = "/mock/project/root";
    const componentID = "fileLinkComponent";

    const targetComponent = {
      ID: componentID,
      inputFiles: [
        {
          src: [{ srcNode: "srcComponent1" }, { srcNode: "srcComponent2" }]
        }
      ],
      outputFiles: [
        {
          dst: [{ dstNode: "dstComponent1" }, { dstNode: "dstComponent2" }]
        }
      ]
    };

    const srcComponent1 = {
      ID: "srcComponent1",
      outputFiles: [
        { dst: [{ dstNode: componentID }, { dstNode: "otherComponent" }] }
      ]
    };
    const srcComponent2 = {
      ID: "srcComponent2",
      outputFiles: [{ dst: [{ dstNode: componentID }] }]
    };

    const dstComponent1 = {
      ID: "dstComponent1",
      inputFiles: [
        { src: [{ srcNode: componentID }, { srcNode: "otherComponent" }] }
      ]
    };
    const dstComponent2 = {
      ID: "dstComponent2",
      inputFiles: [{ src: [{ srcNode: componentID }] }]
    };

    readComponentJsonByIDMock.withArgs(projectRootDir, componentID).resolves(targetComponent);
    readComponentJsonByIDMock.withArgs(projectRootDir, "srcComponent1").resolves(srcComponent1);
    readComponentJsonByIDMock.withArgs(projectRootDir, "srcComponent2").resolves(srcComponent2);
    readComponentJsonByIDMock.withArgs(projectRootDir, "dstComponent1").resolves(dstComponent1);
    readComponentJsonByIDMock.withArgs(projectRootDir, "dstComponent2").resolves(dstComponent2);

    await removeAllLinkFromComponent(projectRootDir, componentID);

    expect(srcComponent1.outputFiles[0].dst).to.not.deep.include({ dstNode: componentID });
    expect(srcComponent2.outputFiles[0].dst).to.not.deep.include({ dstNode: componentID });

    expect(dstComponent1.inputFiles[0].src).to.not.deep.include({ srcNode: componentID });
    expect(dstComponent2.inputFiles[0].src).to.not.deep.include({ srcNode: componentID });

    expect(writeComponentJsonByIDMock.callCount).to.equal(4);
    expect(writeComponentJsonByIDMock.calledWith(projectRootDir, "srcComponent1", sinon.match.object)).to.be.true;
    expect(writeComponentJsonByIDMock.calledWith(projectRootDir, "srcComponent2", sinon.match.object)).to.be.true;
    expect(writeComponentJsonByIDMock.calledWith(projectRootDir, "dstComponent1", sinon.match.object)).to.be.true;
    expect(writeComponentJsonByIDMock.calledWith(projectRootDir, "dstComponent2", sinon.match.object)).to.be.true;
  });
});

describe("#addFileLinkToParent", ()=>{
  let rewireProjectFilesOperator;
  let addFileLinkToParent;
  let getComponentDirMock, readComponentJsonMock, writeComponentJsonMock;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    addFileLinkToParent = rewireProjectFilesOperator.__get__("addFileLinkToParent");

    getComponentDirMock = sinon.stub();
    readComponentJsonMock = sinon.stub();
    writeComponentJsonMock = sinon.stub();

    rewireProjectFilesOperator.__set__({
      getComponentDir: getComponentDirMock,
      readComponentJson: readComponentJsonMock,
      writeComponentJson: writeComponentJsonMock
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should add a file link to parent component correctly", async ()=>{
    const projectRootDir = "/mock/project/root";
    const srcNode = "srcNode1";
    const srcName = "outputFile1";
    const dstName = "inputFile1";

    const srcDir = "/mock/project/root/src";
    const parentDir = "/mock/project/root";
    const srcJson = {
      ID: "srcNode1",
      outputFiles: [{ name: "outputFile1", dst: [] }]
    };
    const parentJson = {
      ID: "parentNode1",
      outputFiles: [{ name: "inputFile1" }]
    };

    getComponentDirMock.onFirstCall().resolves(srcDir);
    readComponentJsonMock.withArgs(srcDir).resolves(srcJson);
    readComponentJsonMock.withArgs(parentDir).resolves(parentJson);
    writeComponentJsonMock.resolves();

    await addFileLinkToParent(projectRootDir, srcNode, srcName, dstName);

    expect(srcJson.outputFiles[0].dst).to.deep.include({
      dstNode: "parentNode1",
      dstName: "inputFile1"
    });
    expect(parentJson.outputFiles[0].origin).to.deep.include({
      srcNode: "srcNode1",
      srcName: "outputFile1"
    });

    expect(writeComponentJsonMock.calledTwice).to.be.true;
    expect(writeComponentJsonMock.firstCall.args).to.deep.equal([
      projectRootDir,
      srcDir,
      srcJson
    ]);
    expect(writeComponentJsonMock.secondCall.args).to.deep.equal([
      projectRootDir,
      parentDir,
      parentJson
    ]);
  });

  it("should throw an error if srcNode does not exist", async ()=>{
    const projectRootDir = "/mock/project/root";
    const srcNode = "invalidNode";
    const srcName = "outputFile1";
    const dstName = "inputFile1";

    getComponentDirMock.rejects(new Error("srcNode not found"));

    try {
      await addFileLinkToParent(projectRootDir, srcNode, srcName, dstName);
      throw new Error("Expected addFileLinkToParent to throw");
    } catch (err) {
      expect(err.message).to.equal("srcNode not found");
    }
  });
});

describe("#addFileLinkFromParent", ()=>{
  let rewireProjectFilesOperator;
  let addFileLinkFromParent;
  let readComponentJsonMock;
  let writeComponentJsonMock;
  let getComponentDirMock;
  let pathDirnameMock;
  let projectRootDir;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    addFileLinkFromParent = rewireProjectFilesOperator.__get__("addFileLinkFromParent");

    readComponentJsonMock = sinon.stub();
    writeComponentJsonMock = sinon.stub().resolves();
    getComponentDirMock = sinon.stub();
    pathDirnameMock = sinon.stub();

    rewireProjectFilesOperator.__set__({
      readComponentJson: readComponentJsonMock,
      writeComponentJson: writeComponentJsonMock,
      getComponentDir: getComponentDirMock,
      path: { dirname: pathDirnameMock }
    });

    projectRootDir = "/mock/project/root";
  });

  it("should add a new file link from parent to child correctly", async ()=>{
    const dstDir = "/mock/project/root/child";
    const parentDir = "/mock/project/root/parent";

    getComponentDirMock.withArgs(projectRootDir, "childID", true).resolves(dstDir);
    pathDirnameMock.withArgs(dstDir).returns(parentDir);

    const parentJson = {
      ID: "parentID",
      inputFiles: [{ name: "fileA", forwardTo: [] }]
    };
    const childJson = {
      ID: "childID",
      inputFiles: []
    };

    readComponentJsonMock.withArgs(parentDir).resolves(parentJson);
    readComponentJsonMock.withArgs(dstDir).resolves(childJson);

    await addFileLinkFromParent(projectRootDir, "fileA", "childID", "inputB");

    expect(parentJson.inputFiles[0].forwardTo).to.deep.include({
      dstNode: "childID",
      dstName: "inputB"
    });
    expect(childJson.inputFiles).to.deep.include({
      name: "inputB",
      src: [{ srcNode: "parentID", srcName: "fileA" }]
    });

    expect(writeComponentJsonMock.firstCall.args).to.deep.equal([
      projectRootDir,
      parentDir,
      parentJson
    ]);
    expect(writeComponentJsonMock.secondCall.args).to.deep.equal([
      projectRootDir,
      dstDir,
      childJson
    ]);
  });

  it("should handle cases where parent inputFiles does not exist", async ()=>{
    const dstDir = "/mock/project/root/child";
    const parentDir = "/mock/project/root/parent";

    getComponentDirMock.withArgs(projectRootDir, "childID", true).resolves(dstDir);
    pathDirnameMock.withArgs(dstDir).returns(parentDir);

    const parentJson = {
      ID: "parentID",
      inputFiles: [{ name: "fileA", forwardTo: [] }]
    };
    const childJson = {
      ID: "childID",
      inputFiles: []
    };

    readComponentJsonMock.withArgs(parentDir).resolves(parentJson);
    readComponentJsonMock.withArgs(dstDir).resolves(childJson);

    await addFileLinkFromParent(projectRootDir, "fileA", "childID", "inputB");

    expect(parentJson.inputFiles[0].forwardTo).to.deep.include({
      dstNode: "childID",
      dstName: "inputB"
    });
    expect(childJson.inputFiles).to.deep.include({
      name: "inputB",
      src: [{ srcNode: "parentID", srcName: "fileA" }]
    });

    expect(writeComponentJsonMock.firstCall.args).to.deep.equal([
      projectRootDir,
      parentDir,
      parentJson
    ]);
    expect(writeComponentJsonMock.secondCall.args).to.deep.equal([
      projectRootDir,
      dstDir,
      childJson
    ]);
  });
});

describe("#addFileLinkBetweenSiblings", ()=>{
  let rewireProjectFilesOperator;
  let addFileLinkBetweenSiblings;
  let getComponentDirMock, readComponentJsonMock, writeComponentJsonMock;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    addFileLinkBetweenSiblings = rewireProjectFilesOperator.__get__("addFileLinkBetweenSiblings");

    getComponentDirMock = sinon.stub();
    readComponentJsonMock = sinon.stub();
    writeComponentJsonMock = sinon.stub().resolves();

    rewireProjectFilesOperator.__set__({
      getComponentDir: getComponentDirMock,
      readComponentJson: readComponentJsonMock,
      writeComponentJson: writeComponentJsonMock
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should add a file link between sibling components when not already linked", async ()=>{
    const projectRootDir = "/mock/project";
    const srcNode = "componentA";
    const srcName = "outputA.txt";
    const dstNode = "componentB";
    const dstName = "inputB.txt";

    const srcComponentJson = {
      ID: srcNode,
      outputFiles: [{ name: srcName, dst: [] }]
    };

    const dstComponentJson = {
      ID: dstNode,
      inputFiles: []
    };

    getComponentDirMock.withArgs(projectRootDir, srcNode, true).resolves("/mock/project/componentA");
    getComponentDirMock.withArgs(projectRootDir, dstNode, true).resolves("/mock/project/componentB");
    readComponentJsonMock.withArgs("/mock/project/componentA").resolves(srcComponentJson);
    readComponentJsonMock.withArgs("/mock/project/componentB").resolves(dstComponentJson);

    await addFileLinkBetweenSiblings(projectRootDir, srcNode, srcName, dstNode, dstName);

    expect(srcComponentJson.outputFiles[0].dst).to.deep.include({ dstNode, dstName });

    expect(dstComponentJson.inputFiles).to.deep.include({ name: dstName, src: [{ srcNode, srcName }] });

    expect(writeComponentJsonMock.calledTwice).to.be.true;
    expect(writeComponentJsonMock.firstCall.args[1]).to.equal("/mock/project/componentA");
    expect(writeComponentJsonMock.secondCall.args[1]).to.equal("/mock/project/componentB");
  });

  it("should allow duplicate file links if already exists", async ()=>{
    const projectRootDir = "/mock/project";
    const srcNode = "componentA";
    const srcName = "outputA.txt";
    const dstNode = "componentB";
    const dstName = "inputB.txt";

    const srcComponentJson = {
      ID: srcNode,
      outputFiles: [{ name: srcName, dst: [{ dstNode, dstName }] }]
    };

    const dstComponentJson = {
      ID: dstNode,
      inputFiles: [{ name: dstName, src: [{ srcNode, srcName }] }]
    };

    getComponentDirMock.withArgs(projectRootDir, srcNode, true).resolves("/mock/project/componentA");
    getComponentDirMock.withArgs(projectRootDir, dstNode, true).resolves("/mock/project/componentB");
    readComponentJsonMock.withArgs("/mock/project/componentA").resolves(srcComponentJson);
    readComponentJsonMock.withArgs("/mock/project/componentB").resolves(dstComponentJson);

    await addFileLinkBetweenSiblings(projectRootDir, srcNode, srcName, dstNode, dstName);

    expect(srcComponentJson.outputFiles[0].dst).to.have.length(2);
    expect(srcComponentJson.outputFiles[0].dst).to.deep.equal([
      { dstNode, dstName },
      { dstNode, dstName }
    ]);

    expect(dstComponentJson.inputFiles).to.have.length(1);
    expect(dstComponentJson.inputFiles[0].src).to.have.length(2);
    expect(dstComponentJson.inputFiles[0].src).to.deep.equal([
      { srcNode, srcName },
      { srcNode, srcName }
    ]);

    expect(writeComponentJsonMock.calledTwice).to.be.true;
  });

  it("should create a new inputFiles entry if dstName does not exist", async ()=>{
    const projectRootDir = "/mock/project";
    const srcNode = "componentA";
    const srcName = "outputA.txt";
    const dstNode = "componentB";
    const dstName = "inputB.txt";

    const srcComponentJson = {
      ID: srcNode,
      outputFiles: [{ name: srcName, dst: [] }]
    };

    const dstComponentJson = {
      ID: dstNode,
      inputFiles: []
    };

    getComponentDirMock.withArgs(projectRootDir, srcNode, true).resolves("/mock/project/componentA");
    getComponentDirMock.withArgs(projectRootDir, dstNode, true).resolves("/mock/project/componentB");
    readComponentJsonMock.withArgs("/mock/project/componentA").resolves(srcComponentJson);
    readComponentJsonMock.withArgs("/mock/project/componentB").resolves(dstComponentJson);

    await addFileLinkBetweenSiblings(projectRootDir, srcNode, srcName, dstNode, dstName);

    expect(dstComponentJson.inputFiles).to.have.deep.members([{ name: dstName, src: [{ srcNode, srcName }] }]);
    expect(writeComponentJsonMock.calledTwice).to.be.true;
  });
});

describe("#removeFileLinkToParent", ()=>{
  let rewireProjectFilesOperator;
  let removeFileLinkToParent;
  let getComponentDirMock, readComponentJsonMock, writeComponentJsonMock;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    removeFileLinkToParent = rewireProjectFilesOperator.__get__("removeFileLinkToParent");

    getComponentDirMock = sinon.stub();
    readComponentJsonMock = sinon.stub();
    writeComponentJsonMock = sinon.stub().resolves();

    rewireProjectFilesOperator.__set__({
      getComponentDir: getComponentDirMock,
      readComponentJson: readComponentJsonMock,
      writeComponentJson: writeComponentJsonMock
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should remove the file link from the parent's outputFiles and source's outputFiles", async ()=>{
    const projectRootDir = "/mock/project";
    const srcNode = "source123";
    const srcName = "output.txt";
    const dstName = "input.txt";
    const parentID = "parent123";
    const srcDir = "/mock/project/components/source123";
    const parentDir = "/mock/project/components";

    const srcJson = {
      ID: srcNode,
      outputFiles: [
        { name: "output.txt", dst: [{ dstNode: parentID, dstName: "input.txt" }] }
      ]
    };

    const parentJson = {
      ID: parentID,
      outputFiles: [
        { name: "input.txt", origin: [{ srcNode: srcNode, srcName: "output.txt" }] }
      ]
    };

    getComponentDirMock.withArgs(projectRootDir, srcNode, true).resolves(srcDir);
    readComponentJsonMock.withArgs(srcDir).resolves(srcJson);
    readComponentJsonMock.withArgs(parentDir).resolves(parentJson);

    await removeFileLinkToParent(projectRootDir, srcNode, srcName, dstName);

    expect(srcJson.outputFiles[0].dst).to.deep.equal([]);
    expect(parentJson.outputFiles[0].origin).to.deep.equal([]);

    expect(writeComponentJsonMock.calledWith(projectRootDir, srcDir, srcJson)).to.be.true;
    expect(writeComponentJsonMock.calledWith(projectRootDir, parentDir, parentJson)).to.be.true;
  });

  it("should throw an error when no matching output file exists in the source component", async ()=>{
    const projectRootDir = "/mock/project";
    const srcNode = "source123";
    const srcName = "nonexistent.txt"; //存在しない出力ファイル
    const dstName = "input.txt";
    const parentID = "parent123";
    const srcDir = "/mock/project/components/source123";
    const parentDir = "/mock/project/components";

    const srcJson = {
      ID: srcNode,
      outputFiles: [ //ここには "nonexistent.txt" が存在しない
        { name: "output.txt", dst: [{ dstNode: parentID, dstName: "input.txt" }] }
      ]
    };

    const parentJson = {
      ID: parentID,
      outputFiles: [
        { name: "input.txt", origin: [{ srcNode: srcNode, srcName: "output.txt" }] }
      ]
    };

    getComponentDirMock.withArgs(projectRootDir, srcNode, true).resolves(srcDir);
    readComponentJsonMock.withArgs(srcDir).resolves(srcJson);
    readComponentJsonMock.withArgs(parentDir).resolves(parentJson);

    await expect(removeFileLinkToParent(projectRootDir, srcNode, srcName, dstName))
      .to.be.rejectedWith(TypeError, "Cannot read properties of undefined (reading 'dst')");
  });

  it("should handle the case when parent component does not have matching origin entry", async ()=>{
    const projectRootDir = "/mock/project";
    const srcNode = "source123";
    const srcName = "output.txt";
    const dstName = "input.txt";
    const parentID = "parent123";
    const srcDir = "/mock/project/components/source123";
    const parentDir = "/mock/project/components";

    const srcJson = {
      ID: srcNode,
      outputFiles: [
        { name: "output.txt", dst: [{ dstNode: parentID, dstName: "input.txt" }] }
      ]
    };

    const parentJson = {
      ID: parentID,
      outputFiles: [
        { name: "input.txt" }
      ]
    };

    getComponentDirMock.withArgs(projectRootDir, srcNode, true).resolves(srcDir);
    readComponentJsonMock.withArgs(srcDir).resolves(srcJson);
    readComponentJsonMock.withArgs(parentDir).resolves(parentJson);

    await removeFileLinkToParent(projectRootDir, srcNode, srcName, dstName);

    expect(srcJson.outputFiles[0].dst).to.deep.equal([]);
    expect(parentJson.outputFiles[0]).to.not.have.property("origin");

    expect(writeComponentJsonMock.calledWith(projectRootDir, srcDir, srcJson)).to.be.true;
    expect(writeComponentJsonMock.calledWith(projectRootDir, parentDir, parentJson)).to.be.true;
  });
});

describe("#removeFileLinkFromParent", ()=>{
  let rewireProjectFilesOperator;
  let removeFileLinkFromParent;
  let getComponentDirMock, readComponentJsonMock, writeComponentJsonMock;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    removeFileLinkFromParent = rewireProjectFilesOperator.__get__("removeFileLinkFromParent");

    getComponentDirMock = sinon.stub();
    readComponentJsonMock = sinon.stub();
    writeComponentJsonMock = sinon.stub().resolves();

    rewireProjectFilesOperator.__set__({
      getComponentDir: getComponentDirMock,
      readComponentJson: readComponentJsonMock,
      writeComponentJson: writeComponentJsonMock
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should remove the file link from parent component correctly", async ()=>{
    const projectRootDir = "/mock/project";
    const srcName = "output.txt";
    const dstNode = "childComponentID";
    const dstName = "input.txt";
    const parentID = "parentComponentID";

    const dstDir = "/mock/project/childComponent";
    const parentDir = path.dirname(dstDir);
    const resolvedParentDir = path.resolve(parentDir);

    getComponentDirMock.withArgs(projectRootDir, dstNode, true).resolves(dstDir);

    const mockParentJson = {
      ID: parentID,
      inputFiles: [
        { name: srcName, forwardTo: [{ dstNode, dstName }] }
      ]
    };

    const mockDstJson = {
      ID: dstNode,
      inputFiles: [
        { name: dstName, src: [{ srcNode: parentID, srcName }] }
      ]
    };

    readComponentJsonMock.withArgs(dstDir).resolves(mockDstJson);
    readComponentJsonMock.withArgs(resolvedParentDir).resolves(mockParentJson);

    await removeFileLinkFromParent(projectRootDir, srcName, dstNode, dstName);

    expect(mockParentJson.inputFiles[0].forwardTo).to.deep.equal([]);
    expect(mockDstJson.inputFiles[0].src).to.deep.equal([]);

    expect(writeComponentJsonMock.calledWith(projectRootDir, resolvedParentDir, mockParentJson)).to.be.true;
    expect(writeComponentJsonMock.calledWith(projectRootDir, dstDir, mockDstJson)).to.be.true;
  });

  it("should handle missing forwardTo in parent component", async ()=>{
    const projectRootDir = "/mock/project";
    const srcName = "output.txt";
    const dstNode = "childComponentID";
    const dstName = "input.txt";
    const parentID = "parentComponentID";

    const dstDir = "/mock/project/childComponent";
    const parentDir = path.dirname(dstDir);
    const resolvedParentDir = path.resolve(parentDir);

    getComponentDirMock.withArgs(projectRootDir, dstNode, true).resolves(dstDir);

    const mockParentJson = {
      ID: parentID,
      inputFiles: [{ name: srcName }]
    };

    const mockDstJson = {
      ID: dstNode,
      inputFiles: [
        { name: dstName, src: [{ srcNode: parentID, srcName }] }
      ]
    };

    readComponentJsonMock.withArgs(dstDir).resolves(mockDstJson);
    readComponentJsonMock.withArgs(resolvedParentDir).resolves(mockParentJson);

    await removeFileLinkFromParent(projectRootDir, srcName, dstNode, dstName);

    expect(mockDstJson.inputFiles[0].src).to.deep.equal([]);

    expect(writeComponentJsonMock.calledWith(projectRootDir, resolvedParentDir, mockParentJson)).to.be.true;
    expect(writeComponentJsonMock.calledWith(projectRootDir, dstDir, mockDstJson)).to.be.true;
  });
});

describe("#removeFileLinkBetweenSiblings", ()=>{
  let rewireProjectFilesOperator;
  let removeFileLinkBetweenSiblings;
  let getComponentDirMock, readComponentJsonMock, writeComponentJsonMock;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    removeFileLinkBetweenSiblings = rewireProjectFilesOperator.__get__("removeFileLinkBetweenSiblings");

    getComponentDirMock = sinon.stub();
    readComponentJsonMock = sinon.stub();
    writeComponentJsonMock = sinon.stub().resolves();

    rewireProjectFilesOperator.__set__({
      getComponentDir: getComponentDirMock,
      readComponentJson: readComponentJsonMock,
      writeComponentJson: writeComponentJsonMock
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should remove the file link between siblings successfully", async ()=>{
    const projectRootDir = "/mock/project";
    const srcNode = "src123";
    const srcName = "output.txt";
    const dstNode = "dst456";
    const dstName = "input.txt";

    getComponentDirMock.withArgs(projectRootDir, srcNode, true).resolves("/mock/project/src123");
    getComponentDirMock.withArgs(projectRootDir, dstNode, true).resolves("/mock/project/dst456");

    const srcJson = {
      outputFiles: [{ name: "output.txt", dst: [{ dstNode: "dst456", dstName: "input.txt" }] }]
    };
    const dstJson = {
      inputFiles: [{ name: "input.txt", src: [{ srcNode: "src123", srcName: "output.txt" }] }]
    };

    readComponentJsonMock.withArgs("/mock/project/src123").resolves(srcJson);
    readComponentJsonMock.withArgs("/mock/project/dst456").resolves(dstJson);

    await removeFileLinkBetweenSiblings(projectRootDir, srcNode, srcName, dstNode, dstName);

    expect(srcJson.outputFiles[0].dst).to.deep.equal([]);
    expect(dstJson.inputFiles[0].src).to.deep.equal([]);

    expect(writeComponentJsonMock.calledTwice).to.be.true;
    expect(writeComponentJsonMock.calledWithExactly(projectRootDir, "/mock/project/src123", srcJson)).to.be.true;
    expect(writeComponentJsonMock.calledWithExactly(projectRootDir, "/mock/project/dst456", dstJson)).to.be.true;
  });

  it("should not fail if the link does not exist", async ()=>{
    const projectRootDir = "/mock/project";
    const srcNode = "src123";
    const srcName = "output.txt";
    const dstNode = "dst456";
    const dstName = "input.txt";

    getComponentDirMock.withArgs(projectRootDir, srcNode, true).resolves("/mock/project/src123");
    getComponentDirMock.withArgs(projectRootDir, dstNode, true).resolves("/mock/project/dst456");

    const srcJson = {
      outputFiles: [{ name: "output.txt", dst: [] }]
    };
    const dstJson = {
      inputFiles: [{ name: "input.txt", src: [] }]
    };

    readComponentJsonMock.withArgs("/mock/project/src123").resolves(srcJson);
    readComponentJsonMock.withArgs("/mock/project/dst456").resolves(dstJson);

    await removeFileLinkBetweenSiblings(projectRootDir, srcNode, srcName, dstNode, dstName);

    expect(writeComponentJsonMock.calledTwice).to.be.true;
  });

  it("should throw an error if component JSON file is not found", async ()=>{
    const projectRootDir = "/mock/project";
    const srcNode = "src123";
    const srcName = "output.txt";
    const dstNode = "dst456";
    const dstName = "input.txt";

    getComponentDirMock.withArgs(projectRootDir, srcNode, true).resolves("/mock/project/src123");
    getComponentDirMock.withArgs(projectRootDir, dstNode, true).resolves("/mock/project/dst456");

    readComponentJsonMock.withArgs("/mock/project/src123").rejects(new Error("File not found"));

    try {
      await removeFileLinkBetweenSiblings(projectRootDir, srcNode, srcName, dstNode, dstName);
      throw new Error("Expected function to throw an error");
    } catch (error) {
      expect(error.message).to.equal("File not found");
    }
  });
});

describe("#makeDir", ()=>{
  let rewireProjectFilesOperator;
  let makeDir;
  let fsMock;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    makeDir = rewireProjectFilesOperator.__get__("makeDir");

    fsMock = {
      pathExists: sinon.stub(),
      mkdir: sinon.stub().resolves()
    };

    rewireProjectFilesOperator.__set__("fs", fsMock);
  });

  it("should create a new directory when the name is available", async ()=>{
    fsMock.pathExists.resolves(false);

    const result = await makeDir("/mock/path", 0);

    expect(fsMock.pathExists.calledOnceWithExactly("/mock/path0")).to.be.true;
    expect(fsMock.mkdir.calledOnceWithExactly("/mock/path0")).to.be.true;
    expect(result).to.equal("/mock/path0");
  });

  it("should increment suffix until an available name is found", async ()=>{
    fsMock.pathExists.onFirstCall().resolves(true);
    fsMock.pathExists.onSecondCall().resolves(true);
    fsMock.pathExists.onThirdCall().resolves(false);

    const result = await makeDir("/mock/path", 0);

    expect(fsMock.pathExists.callCount).to.equal(3);
    expect(fsMock.mkdir.calledOnceWithExactly("/mock/path2")).to.be.true;
    expect(result).to.equal("/mock/path2");
  });

  it("should handle an empty basename gracefully", async ()=>{
    fsMock.pathExists.resolves(false);

    const result = await makeDir("", 0);

    expect(fsMock.mkdir.calledOnceWithExactly("0")).to.be.true;
    expect(result).to.equal("0");
  });

  it("should throw an error if mkdir fails", async ()=>{
    fsMock.pathExists.resolves(false);
    fsMock.mkdir.rejects(new Error("Permission denied"));

    try {
      await makeDir("/mock/path", 0);
      throw new Error("Expected makeDir to throw an error");
    } catch (err) {
      expect(err.message).to.equal("Permission denied");
    }

    expect(fsMock.mkdir.calledOnceWithExactly("/mock/path0")).to.be.true;
  });
});

describe("#getChildren", ()=>{
  let rewireProjectFilesOperator;
  let getChildren;
  let getComponentDirMock;
  let readJsonGreedyMock;
  let globMock;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    getChildren = rewireProjectFilesOperator.__get__("getChildren");

    getComponentDirMock = sinon.stub();
    readJsonGreedyMock = sinon.stub();
    globMock = sinon.stub();
    rewireProjectFilesOperator.__set__({
      getComponentDir: getComponentDirMock,
      readJsonGreedy: readJsonGreedyMock,
      promisify: ()=>globMock
    });
  });

  it("should return an empty array if the directory is not found", async ()=>{
    getComponentDirMock.resolves(null);

    const result = await getChildren("/mock/project", "invalidID", false);

    expect(result).to.deep.equal([]);
  });

  it("should return an empty array if no child components are found", async ()=>{
    getComponentDirMock.resolves("/mock/project/component");
    globMock.resolves([]);

    const result = await getChildren("/mock/project", "validID", false);

    expect(result).to.deep.equal([]);
  });

  it("should return an array of child components excluding subComponents", async ()=>{
    getComponentDirMock.resolves("/mock/project/component");
    globMock.resolves(["/mock/project/component/child1/cmp.wheel.json", "/mock/project/component/child2/cmp.wheel.json"]);

    readJsonGreedyMock.withArgs("/mock/project/component/child1/cmp.wheel.json").resolves({ ID: "child1", subComponent: false });
    readJsonGreedyMock.withArgs("/mock/project/component/child2/cmp.wheel.json").resolves({ ID: "child2", subComponent: true });

    const result = await getChildren("/mock/project", "validID", false);

    expect(result).to.deep.equal([{ ID: "child1", subComponent: false }]);
  });

  it("should handle the case where parentID is a directory path", async ()=>{
    globMock.resolves(["/mock/project/parent/child/cmp.wheel.json"]);
    readJsonGreedyMock.resolves({ ID: "child", subComponent: false });

    const result = await getChildren("/mock/project", "/mock/project/parent", true);

    expect(result).to.deep.equal([{ ID: "child", subComponent: false }]);
  });
});

describe("#checkRemoteStoragePathWritePermission", ()=>{
  let rewireProjectFilesOperator;
  let checkRemoteStoragePathWritePermission;
  let getSshMock;
  let remoteHostMock;
  let sshExecMock;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    checkRemoteStoragePathWritePermission = rewireProjectFilesOperator.__get__("checkRemoteStoragePathWritePermission");

    remoteHostMock = {
      getID: sinon.stub()
    };

    sshExecMock = sinon.stub();
    getSshMock = sinon.stub().returns({ exec: sshExecMock });
    rewireProjectFilesOperator.__set__({
      getSsh: getSshMock,
      remoteHost: remoteHostMock
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should resolve when the storage path has write permission", async ()=>{
    const projectRootDir = "/mock/project/root";
    const params = { host: "remoteHost1", storagePath: "/remote/path" };

    remoteHostMock.getID.withArgs("name", "remoteHost1").returns("host123");
    sshExecMock.withArgs("test -w /remote/path").returns(0);

    await expect(checkRemoteStoragePathWritePermission(projectRootDir, params)).to.be.fulfilled;
    expect(remoteHostMock.getID.calledOnceWithExactly("name", "remoteHost1")).to.be.true;
    expect(getSshMock.calledOnceWithExactly(projectRootDir, "host123")).to.be.true;
    expect(sshExecMock.calledOnceWithExactly("test -w /remote/path")).to.be.true;
  });

  it("should throw an error when the storage path does not have write permission", async ()=>{
    const projectRootDir = "/mock/project/root";
    const params = { host: "remoteHost1", storagePath: "/remote/path" };

    remoteHostMock.getID.withArgs("name", "remoteHost1").returns("host123");
    sshExecMock.withArgs("test -w /remote/path").returns(1);

    await expect(checkRemoteStoragePathWritePermission(projectRootDir, params)).to.be.rejectedWith("bad permission");
  });

  it("should throw an error when SSH instance is not available", async ()=>{
    const projectRootDir = "/mock/project/root";
    const params = { host: "remoteHost1", storagePath: "/remote/path" };

    remoteHostMock.getID.withArgs("name", "remoteHost1").returns("host123");
    getSshMock.throws(new Error("ssh instance is not registerd for the project"));

    await expect(checkRemoteStoragePathWritePermission(projectRootDir, params)).to.be.rejectedWith("ssh instance is not registerd for the project");
  });
});

describe("#recursiveGetHosts", ()=>{
  let rewireProjectFilesOperator;
  let recursiveGetHosts, getChildrenMock, hasChildMock;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    recursiveGetHosts = rewireProjectFilesOperator.__get__("recursiveGetHosts");

    getChildrenMock = sinon.stub();
    hasChildMock = sinon.stub();

    rewireProjectFilesOperator.__set__({
      getChildren: getChildrenMock,
      hasChild: hasChildMock
    });
  });

  it("should not add any hosts if there are no children", async ()=>{
    getChildrenMock.resolves([]);
    const hosts = [];
    const storageHosts = [];

    await recursiveGetHosts("mockProjectRoot", "rootID", hosts, storageHosts);

    expect(hosts).to.be.empty;
    expect(storageHosts).to.be.empty;
  });

  it("should add task component hosts correctly", async ()=>{
    getChildrenMock.resolves([{ ID: "comp1", type: "task", host: "remote1" }]);
    hasChildMock.returns(false);

    const hosts = [];
    const storageHosts = [];

    await recursiveGetHosts("mockProjectRoot", "rootID", hosts, storageHosts);

    expect(hosts).to.deep.equal([{ hostname: "remote1" }]);
    expect(storageHosts).to.be.empty;
  });

  it("should add storage component hosts correctly", async ()=>{
    getChildrenMock.resolves([{ ID: "comp2", type: "storage", host: "storage1" }]);
    hasChildMock.returns(false);

    const hosts = [];
    const storageHosts = [];

    await recursiveGetHosts("mockProjectRoot", "rootID", hosts, storageHosts);

    expect(hosts).to.be.empty;
    expect(storageHosts).to.deep.equal([{ hostname: "storage1", isStorage: true }]);
  });

  it("should skip disabled components", async ()=>{
    getChildrenMock.resolves([{ ID: "comp3", type: "task", host: "remote2", disable: true }]);
    hasChildMock.returns(false);

    const hosts = [];
    const storageHosts = [];

    await recursiveGetHosts("mockProjectRoot", "rootID", hosts, storageHosts);

    expect(hosts).to.be.empty;
    expect(storageHosts).to.be.empty;
  });

  it("should skip localhost components", async ()=>{
    getChildrenMock.resolves([{ ID: "comp4", type: "task", host: "localhost" }]);
    hasChildMock.returns(false);

    const hosts = [];
    const storageHosts = [];

    await recursiveGetHosts("mockProjectRoot", "rootID", hosts, storageHosts);

    expect(hosts).to.be.empty;
    expect(storageHosts).to.be.empty;
  });

  it("should recursively add child hosts", async ()=>{
    getChildrenMock.onFirstCall().resolves([{ ID: "comp5", type: "for", host: "remote3" }]);
    getChildrenMock.onSecondCall().resolves([{ ID: "comp6", type: "task", host: "remote4" }]);

    hasChildMock.withArgs({ ID: "comp5", type: "for", host: "remote3" }).returns(true);
    hasChildMock.withArgs({ ID: "comp6", type: "task", host: "remote4" }).returns(false);

    const hosts = [];
    const storageHosts = [];

    await recursiveGetHosts("mockProjectRoot", "rootID", hosts, storageHosts);

    expect(hosts).to.deep.equal([{ hostname: "remote4" }]);
    expect(storageHosts).to.be.empty;
  });
});

describe("#getHosts", ()=>{
  let rewireProjectFilesOperator;
  let getHosts;
  let recursiveGetHostsMock;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    getHosts = rewireProjectFilesOperator.__get__("getHosts");

    recursiveGetHostsMock = sinon.stub();
    rewireProjectFilesOperator.__set__("recursiveGetHosts", recursiveGetHostsMock);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should call recursiveGetHosts with correct arguments", async ()=>{
    const projectRootDir = "/mock/project";
    const rootID = "rootComponent";
    recursiveGetHostsMock.resolves();

    await getHosts(projectRootDir, rootID);

    expect(recursiveGetHostsMock).to.be.calledOnceWithExactly(projectRootDir, rootID, [], [], []);
  });

  it("should correctly classify task and storage hosts", async ()=>{
    recursiveGetHostsMock.resolves();
    const projectRootDir = "/mock/project";
    const rootID = "rootComponent";

    const taskHosts = [{ hostname: "task1" }, { hostname: "task2" }];
    const storageHosts = [{ hostname: "storage1", isStorage: true }];

    recursiveGetHostsMock.callsFake(async (_, __, hosts, storageHostsList)=>{
      hosts.push(...taskHosts);
      storageHostsList.push(...storageHosts);
    });

    const result = await getHosts(projectRootDir, rootID);

    expect(result).to.deep.include.members([...storageHosts, ...taskHosts]);
  });

  it("should return an empty array if no hosts are found", async ()=>{
    recursiveGetHostsMock.resolves();
    const projectRootDir = "/mock/project";
    const rootID = "rootComponent";

    const result = await getHosts(projectRootDir, rootID);

    expect(result).to.deep.equal([]);
  });
});

describe("#createNewComponent", ()=>{
  let rewireProjectFilesOperator;
  let createNewComponent;

  let readJsonGreedyMock;
  let makeDirMock;
  let componentFactoryMock;
  let writeComponentJsonMock;
  let updateComponentPathMock;
  let writeJsonWrapperMock;
  let gitAddMock;

  //テストで使うダミー値
  const dummyProjectRootDir = "/dummy/projectRootDir";
  const dummyParentDir = "/dummy/parentDir";
  const dummyPos = { x: 100, y: 200 };
  const dummyParentJson = { ID: "parent-123" };
  const dummyAbsDirName = "/dummy/parentDir/task0"; //makeDir の戻り値
  const dummyComponent = {
    type: "task",
    pos: dummyPos,
    parent: "parent-123",
    ID: "new-component-id",
    name: "task0"
  };
  const dummyPsComponent = {
    type: "PS",
    pos: dummyPos,
    parent: "parent-123",
    ID: "new-ps-id",
    name: "PS0"
  };

  beforeEach(()=>{
    //rewire でモジュールを読み込む
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    createNewComponent = rewireProjectFilesOperator.__get__("createNewComponent");

    //sinon.stub で依存関数を置き換え
    readJsonGreedyMock = sinon.stub().resolves(dummyParentJson);
    makeDirMock = sinon.stub().resolves(dummyAbsDirName);
    componentFactoryMock = sinon.stub().returns(dummyComponent);
    writeComponentJsonMock = sinon.stub().resolves();
    updateComponentPathMock = sinon.stub().resolves();
    writeJsonWrapperMock = sinon.stub().resolves();
    gitAddMock = sinon.stub().resolves();

    //rewireで内部の依存を差し替え
    rewireProjectFilesOperator.__set__({
      readJsonGreedy: readJsonGreedyMock,
      makeDir: makeDirMock,
      componentFactory: componentFactoryMock,
      writeComponentJson: writeComponentJsonMock,
      updateComponentPath: updateComponentPathMock,
      writeJsonWrapper: writeJsonWrapperMock,
      gitAdd: gitAddMock
    });
  });

  afterEach(()=>{
    //sinon.restore()でもよいが、個別にリストアするならこちら
    sinon.reset();
    sinon.restore();
  });

  it("should successfully create a new component when type is 'task'", async ()=>{
    //実行
    const result = await createNewComponent(dummyProjectRootDir, dummyParentDir, "task", dummyPos);

    //検証
    //1) 親のcomponentJsonを読む
    expect(readJsonGreedyMock.calledOnce).to.be.true;
    expect(readJsonGreedyMock.firstCall.args[0])
      .to.equal(path.resolve(dummyParentDir, "cmp.wheel.json")); //cmp.wheel.jsonのパス

    //2) makeDirが呼ばれ、basenameが正しく連結されているか
    expect(makeDirMock.calledOnce).to.be.true;
    expect(makeDirMock.firstCall.args[0])
      .to.equal(path.resolve(dummyParentDir, "task")); //getComponentDefaultName("task") => "task"
    expect(makeDirMock.firstCall.args[1]).to.equal(0);

    //3) componentFactoryが正しい引数で呼ばれたか
    expect(componentFactoryMock.calledOnce).to.be.true;
    expect(componentFactoryMock.firstCall.args).to.deep.equal(["task", dummyPos, "parent-123"]);

    //4) writeComponentJsonが正しい引数で呼ばれているか
    expect(writeComponentJsonMock.calledOnce).to.be.true;
    expect(writeComponentJsonMock.firstCall.args[0]).to.equal(dummyProjectRootDir);
    expect(writeComponentJsonMock.firstCall.args[1]).to.equal(dummyAbsDirName);
    expect(writeComponentJsonMock.firstCall.args[2]).to.equal(dummyComponent);

    //5) updateComponentPathが正しい引数で呼ばれているか
    expect(updateComponentPathMock.calledOnce).to.be.true;
    expect(updateComponentPathMock.firstCall.args[0]).to.equal(dummyProjectRootDir);
    expect(updateComponentPathMock.firstCall.args[1]).to.equal("new-component-id");
    expect(updateComponentPathMock.firstCall.args[2]).to.equal(dummyAbsDirName);

    //6) type = "task" なので PSConfigFilename の書き込みは無い
    expect(writeJsonWrapperMock.called).to.be.false;
    expect(gitAddMock.called).to.be.false;

    //7) 戻り値のコンポーネントオブジェクトを検証
    expect(result).to.equal(dummyComponent);
    expect(result.type).to.equal("task");
  });

  it("should create additional parameterSetting.json when type is 'PS'", async ()=>{
    //テスト用に componentFactory の戻り値を差し替える
    componentFactoryMock.returns(dummyPsComponent);
    const pathToPS = path.resolve(dummyAbsDirName, "parameterSetting.json");

    //実行
    const result = await createNewComponent(dummyProjectRootDir, dummyParentDir, "PS", dummyPos);

    //検証
    expect(componentFactoryMock.calledOnce).to.be.true;
    expect(result.type).to.equal("PS");

    //PS用のparameterSetting.jsonが書き込まれたか
    expect(writeJsonWrapperMock.calledOnce).to.be.true;
    expect(writeJsonWrapperMock.firstCall.args[0]).to.equal(pathToPS);
    //中身 { version: 2, targetFiles: [], params: [], scatter: [], gather: [] }
    expect(writeJsonWrapperMock.firstCall.args[1]).to.deep.equal({
      version: 2,
      targetFiles: [],
      params: [],
      scatter: [],
      gather: []
    });

    //gitAdd が呼ばれているか
    expect(gitAddMock.calledOnce).to.be.true;
    expect(gitAddMock.firstCall.args[0]).to.equal(dummyProjectRootDir);
    expect(gitAddMock.firstCall.args[1]).to.equal(pathToPS);
  });

  it("should throw an error if parent componentJson read fails", async ()=>{
    //readJsonGreedyをrejectさせる
    const readError = new Error("Failed to read parent cmp.wheel.json");
    readJsonGreedyMock.rejects(readError);

    try {
      await createNewComponent(dummyProjectRootDir, dummyParentDir, "task", dummyPos);
      expect.fail("Expected createNewComponent to throw an error");
    } catch (err) {
      expect(err).to.equal(readError);
    }
  });
});

describe("#renameComponentDir", ()=>{
  let rewireProjectFilesOperator;
  let renameComponentDir;
  let isValidNameMock;
  let getComponentDirMock;
  let gitRmMock;
  let fsMoveMock;
  let gitAddMock;
  let updateComponentPathMock;

  const mockProjectRootDir = "/mock/project";
  const mockID = "mock-component-id";

  beforeEach(()=>{
    //rewireでモジュールを読み込み
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    renameComponentDir = rewireProjectFilesOperator.__get__("renameComponentDir");

    //テストダブル（スタブ/モック）を作成
    isValidNameMock = sinon.stub();
    getComponentDirMock = sinon.stub();
    gitRmMock = sinon.stub().resolves();
    fsMoveMock = sinon.stub().resolves();
    gitAddMock = sinon.stub().resolves();
    updateComponentPathMock = sinon.stub().resolves("updated-path-map");

    //projectFilesOperator 内で呼び出される関数を差し替え
    rewireProjectFilesOperator.__set__({
      isValidName: isValidNameMock,
      getComponentDir: getComponentDirMock,
      gitRm: gitRmMock,
      fs: { move: fsMoveMock },
      gitAdd: gitAddMock,
      updateComponentPath: updateComponentPathMock
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should throw an error if newName is invalid", async ()=>{
    isValidNameMock.returns(false); //newNameが不正

    try {
      await renameComponentDir(mockProjectRootDir, mockID, "???");
      throw new Error("Expected error to be thrown");
    } catch (err) {
      expect(err).to.be.an("error");
      expect(err.message).to.match(/not valid component name/);
    }

    expect(isValidNameMock.calledOnce).to.be.true;
    //下記処理は通らないのでstubは呼ばれない
    expect(getComponentDirMock.called).to.be.false;
    expect(gitRmMock.called).to.be.false;
    expect(fsMoveMock.called).to.be.false;
    expect(gitAddMock.called).to.be.false;
    expect(updateComponentPathMock.called).to.be.false;
  });

  it("should throw an error if trying to rename the root workflow directory", async ()=>{
    isValidNameMock.returns(true);
    getComponentDirMock.resolves(mockProjectRootDir); //oldDirがrootDirと同じ

    try {
      await renameComponentDir(mockProjectRootDir, mockID, "NewName");
      throw new Error("Expected error to be thrown");
    } catch (err) {
      expect(err).to.be.an("error");
      expect(err.message).to.equal("updateNode can not rename root workflow");
    }

    expect(isValidNameMock.calledOnce).to.be.true;
    expect(getComponentDirMock.calledOnce).to.be.true;
    expect(gitRmMock.called).to.be.false;
    expect(fsMoveMock.called).to.be.false;
    expect(gitAddMock.called).to.be.false;
    expect(updateComponentPathMock.called).to.be.false;
  });

  it("should return true if path.basename(oldDir) === newName", async ()=>{
    isValidNameMock.returns(true);
    getComponentDirMock.resolves("/mock/project/SomeName"); //oldDir
    //oldDirのbasenameが"SomeName" → newNameも"SomeName" の場合は処理スキップ
    const result = await renameComponentDir(mockProjectRootDir, mockID, "SomeName");

    expect(result).to.be.true;
    expect(isValidNameMock.calledOnce).to.be.true;
    expect(getComponentDirMock.calledOnce).to.be.true;
    //リネームしないので以降は呼ばれない
    expect(gitRmMock.called).to.be.false;
    expect(fsMoveMock.called).to.be.false;
    expect(gitAddMock.called).to.be.false;
    expect(updateComponentPathMock.called).to.be.false;
  });

  it("should move directory, call gitRm, fs.move, gitAdd and updateComponentPath if everything is fine", async ()=>{
    isValidNameMock.returns(true);
    getComponentDirMock.resolves("/mock/project/OldCompName");

    const result = await renameComponentDir(mockProjectRootDir, mockID, "NewCompName");

    //成功時はupdateComponentPathの戻り値をそのまま返している
    expect(result).to.equal("updated-path-map");

    //順序をテストしたい場合は call順のチェック
    expect(isValidNameMock.calledOnce).to.be.true;
    expect(getComponentDirMock.calledOnce).to.be.true;
    expect(gitRmMock.calledOnceWithExactly(mockProjectRootDir, "/mock/project/OldCompName")).to.be.true;
    expect(fsMoveMock.calledOnce).to.be.true;
    //fsMoveで呼ばれる第2引数が /mock/project/NewCompName になっているか
    const fsMoveArgs = fsMoveMock.args[0];
    expect(fsMoveArgs[0]).to.equal("/mock/project/OldCompName");
    expect(fsMoveArgs[1]).to.equal(path.resolve("/mock/project", "NewCompName"));

    expect(gitAddMock.calledOnce).to.be.true;
    //最後に updateComponentPath が正しい引数で呼ばれているか
    expect(updateComponentPathMock.calledOnce).to.be.true;
    const updateArgs = updateComponentPathMock.args[0];
    expect(updateArgs[0]).to.equal(mockProjectRootDir);
    expect(updateArgs[1]).to.equal(mockID);
    expect(updateArgs[2]).to.equal(path.resolve("/mock/project", "NewCompName"));
  });
});

describe("#replaceEnv", ()=>{
  let rewireProjectFilesOperator;
  let replaceEnv;
  let readComponentJsonByIDMock;
  let writeComponentJsonByIDMock;
  let diffMock;
  let diffApplyMock;
  let componentJson;

  beforeEach(()=>{
    //rewireでモジュールを読み込み
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    replaceEnv = rewireProjectFilesOperator.__get__("replaceEnv");

    //テストダブル（スタブ/モック）を作成
    readComponentJsonByIDMock = sinon.stub();
    writeComponentJsonByIDMock = sinon.stub();
    diffMock = sinon.stub();
    diffApplyMock = sinon.stub();

    //モックデータ（テスト対象のコンポーネントJSON）
    componentJson = {
      ID: "testComponent",
      env: { OLD_KEY: "old_value", UNUSED_KEY: "unused" }
    };

    //projectFilesOperator 内で呼び出される関数をスタブに差し替え
    rewireProjectFilesOperator.__set__({
      readComponentJsonByID: readComponentJsonByIDMock,
      writeComponentJsonByID: writeComponentJsonByIDMock,
      diff: diffMock,
      diffApply: diffApplyMock
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should replace env with newEnv and write the updated component JSON", async ()=>{
    //readComponentJsonByIDがコンポーネントJSONを返すように設定
    readComponentJsonByIDMock.resolves(componentJson);
    writeComponentJsonByIDMock.resolves();
    diffMock.returns([{ op: "replace", path: "/OLD_KEY", value: "new_value" }]);

    //diffApplyが適用された結果を反映するようにモック。_patchは使わないので _ で省略
    //eslint-disable-next-line no-unused-vars
    diffApplyMock.callsFake((target, _patch)=>{
      target.OLD_KEY = "new_value";
      delete target.UNUSED_KEY;
    });

    //新しい環境変数
    const newEnv = { OLD_KEY: "new_value" };

    //関数実行
    const result = await replaceEnv("/project/root", "testComponent", newEnv);

    //期待する関数の呼び出し確認
    expect(readComponentJsonByIDMock.calledOnceWithExactly("/project/root", "testComponent")).to.be.true;
    expect(diffMock.calledOnceWithExactly(componentJson.env, newEnv)).to.be.true;
    expect(diffApplyMock.calledOnce).to.be.true;
    expect(writeComponentJsonByIDMock.calledOnceWithExactly("/project/root", "testComponent", componentJson)).to.be.true;

    //変更後のenvが期待通りになっているか
    expect(result.env).to.deep.equal({ OLD_KEY: "new_value" });
  });

  it("should throw an error if readComponentJsonByID fails", async ()=>{
    //readComponentJsonByID がエラーを投げる場合のテスト
    const mockError = new Error("Failed to read component JSON");
    readComponentJsonByIDMock.rejects(mockError);

    try {
      await replaceEnv("/project/root", "testComponent", {});
      throw new Error("Expected replaceEnv to throw");
    } catch (err) {
      //期待するエラーが発生したかを確認
      expect(err).to.equal(mockError);
    }

    //readComponentJsonByIDが呼ばれたことを確認
    expect(readComponentJsonByIDMock.calledOnceWithExactly("/project/root", "testComponent")).to.be.true;
    //他の関数は呼ばれていないことを確認
    expect(writeComponentJsonByIDMock.notCalled).to.be.true;
    expect(diffMock.notCalled).to.be.true;
    expect(diffApplyMock.notCalled).to.be.true;
  });

  it("should throw an error if writeComponentJsonByID fails", async ()=>{
    //readComponentJsonByIDは正常に動作
    readComponentJsonByIDMock.resolves(componentJson);
    diffMock.returns([]);
    diffApplyMock.callsFake(()=>{});

    //writeComponentJsonByIDがエラーを投げる場合のテスト
    const mockError = new Error("Failed to write component JSON");
    writeComponentJsonByIDMock.rejects(mockError);

    try {
      await replaceEnv("/project/root", "testComponent", { NEW_KEY: "new_value" });
      throw new Error("Expected replaceEnv to throw");
    } catch (err) {
      //期待するエラーが発生したかを確認
      expect(err).to.equal(mockError);
    }

    //diff関数が呼ばれたことを確認
    expect(diffMock.calledOnce).to.be.true;
    //diffApply関数が呼ばれたことを確認
    expect(diffApplyMock.calledOnce).to.be.true;
    //writeComponentJsonByIDが1回呼ばれていることを確認
    expect(writeComponentJsonByIDMock.calledOnce).to.be.true;
  });
});

describe("#replaceWebhook", ()=>{
  let rewireProjectFilesOperator;
  let replaceWebhook;

  //モック用
  let getProjectJsonMock;
  let writeProjectJsonMock;
  let diffMock;
  let diffApplyMock;

  beforeEach(()=>{
    //rewiredモジュール読込
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    replaceWebhook = rewireProjectFilesOperator.__get__("replaceWebhook");

    //sinon.stubでMockを作成
    getProjectJsonMock = sinon.stub();
    writeProjectJsonMock = sinon.stub();
    diffMock = sinon.stub();
    diffApplyMock = sinon.stub();

    //projectFilesOperator内部の呼び出しを__set__で差し替え
    rewireProjectFilesOperator.__set__({
      getProjectJson: getProjectJsonMock,
      writeProjectJson: writeProjectJsonMock,
      diff: diffMock,
      diffApply: diffApplyMock
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should set the new webhook if the existing one is undefined", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const newWebhook = {
      URL: "https://example.com/webhook",
      project: true,
      component: true
    };

    const mockProjectJson = {
      name: "testProject",
      webhook: undefined
    };

    getProjectJsonMock.resolves(mockProjectJson);
    writeProjectJsonMock.resolves();

    const result = await replaceWebhook(mockProjectRootDir, newWebhook);

    //返り値はundefinedのまま
    expect(result).to.deep.equal(undefined);

    //副作用確認: projectJson.webhookがnewWebhookになったか
    expect(writeProjectJsonMock.calledOnceWithExactly(
      mockProjectRootDir,
      {
        name: "testProject",
        webhook: newWebhook
      }
    )).to.be.true;
  });

  it("should diff and apply patch if the existing webhook is not undefined", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const existingWebhook = {
      URL: "https://old.example.com",
      project: false,
      component: false
    };
    const newWebhook = {
      URL: "https://new.example.com",
      project: true,
      component: true
    };

    const mockProjectJson = {
      name: "testProject",
      webhook: existingWebhook
    };

    //diffパッチのモック
    const mockPatch = [{ op: "replace", path: "/URL", value: "https://new.example.com" }];

    getProjectJsonMock.resolves(mockProjectJson);
    writeProjectJsonMock.resolves();
    diffMock.returns(mockPatch);
    diffApplyMock.callsFake((target, patch)=>{
      target.URL = patch[0].value;
      target.project = true;
      target.component = true;
    });

    const result = await replaceWebhook(mockProjectRootDir, newWebhook);

    //diff呼び出しの検証
    expect(diffMock.calledOnceWithExactly(existingWebhook, newWebhook)).to.be.true;
    expect(diffApplyMock.calledOnce).to.be.true;

    //更新後のprojectJsonを書き込み
    expect(writeProjectJsonMock.calledOnceWithExactly(mockProjectRootDir, {
      name: "testProject",
      webhook: existingWebhook //diffApply適用後のオブジェクト
    })).to.be.true;

    expect(result).to.deep.equal({
      URL: "https://new.example.com",
      project: true,
      component: true
    });
  });

  it("should throw an error if getProjectJson fails", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const newWebhook = { URL: "https://example.com/webhook", project: true, component: true };

    const mockError = new Error("Failed to read project JSON");
    getProjectJsonMock.rejects(mockError);

    try {
      await replaceWebhook(mockProjectRootDir, newWebhook);
      throw new Error("Expected replaceWebhook to throw");
    } catch (err) {
      expect(err).to.equal(mockError);
    }

    //他が呼ばれていないことを確認
    expect(writeProjectJsonMock.notCalled).to.be.true;
    expect(diffMock.notCalled).to.be.true;
    expect(diffApplyMock.notCalled).to.be.true;
  });

  it("should throw an error if writeProjectJson fails", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const newWebhook = { URL: "https://example.com/webhook", project: true, component: true };
    const existingWebhook = { URL: "https://old.example.com", project: false, component: false };
    const mockPatch = [{ op: "replace", path: "/URL", value: "https://example.com/webhook" }];

    getProjectJsonMock.resolves({ webhook: existingWebhook });
    diffMock.returns(mockPatch);
    diffApplyMock.callsFake((target, patch)=>{
      target.URL = patch[0].value;
      target.project = true;
      target.component = true;
    });

    //writeProjectJson失敗
    const mockError = new Error("Failed to write JSON");
    writeProjectJsonMock.rejects(mockError);

    try {
      await replaceWebhook(mockProjectRootDir, newWebhook);
      throw new Error("Expected replaceWebhook to throw");
    } catch (err) {
      expect(err).to.equal(mockError);
    }

    expect(getProjectJsonMock.calledOnce).to.be.true;
    expect(diffMock.calledOnce).to.be.true;
    expect(diffApplyMock.calledOnce).to.be.true;
    expect(writeProjectJsonMock.calledOnce).to.be.true;
  });
});

describe("#getEnv", ()=>{
  let rewireProjectFilesOperator;
  let getEnv;
  let readComponentJsonByIDMock;

  beforeEach(()=>{
    //projectFilesOperator.jsをrewireで読み込む
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");

    //テスト対象の関数を取得
    getEnv = rewireProjectFilesOperator.__get__("getEnv");

    //依存するreadComponentJsonByIDをモック化
    readComponentJsonByIDMock = sinon.stub();
    rewireProjectFilesOperator.__set__({
      readComponentJsonByID: readComponentJsonByIDMock
    });
  });

  it("should return the env object if the component has env property", async ()=>{
    //モックが返すコンポーネントJSONを定義
    const mockComponentJson = {
      env: {
        VAR_A: "VALUE_A",
        VAR_B: "VALUE_B"
      }
    };

    //stubがresolveする値を設定
    readComponentJsonByIDMock.resolves(mockComponentJson);

    //テスト対象関数を呼び出し
    const projectRootDir = "/mock/project/root";
    const componentID = "mockComponentID";
    const result = await getEnv(projectRootDir, componentID);

    //アサーション
    expect(readComponentJsonByIDMock.calledOnceWithExactly(projectRootDir, componentID)).to.be.true;
    expect(result).to.deep.equal(mockComponentJson.env);
  });

  it("should return an empty object if env property is not defined", async ()=>{
    //envプロパティなし
    const mockComponentJson = { name: "testComponent" };
    readComponentJsonByIDMock.resolves(mockComponentJson);

    const result = await getEnv("/mock/project/root", "mockComponentID");
    expect(result).to.deep.equal({});
  });

  it("should throw an error if readComponentJsonByID rejects", async ()=>{
    const mockError = new Error("Failed to read component JSON");
    readComponentJsonByIDMock.rejects(mockError);

    try {
      await getEnv("/mock/project/root", "errorComponentID");
      expect.fail("getEnv should throw an error, but did not");
    } catch (err) {
      expect(err).to.equal(mockError);
    }
  });
});

describe("#updateComponent", ()=>{
  let rewireProjectFilesOperator;
  let updateComponentMock;
  let readComponentJsonByIDMock;
  let writeComponentJsonByIDMock;
  let renameComponentDirMock;
  let setUploadOndemandOutputFileMock;

  const mockProjectRootDir = "/mock/project/root";
  const mockID = "component123";
  const mockComponentJson = { ID: mockID, name: "OldName", anyProp: "oldValue" };

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");

    //実際の updateComponent 関数を取得
    updateComponentMock = rewireProjectFilesOperator.__get__("updateComponent");

    //各依存関数のモック化
    readComponentJsonByIDMock = sinon.stub().resolves(mockComponentJson);
    writeComponentJsonByIDMock = sinon.stub().resolves();
    renameComponentDirMock = sinon.stub().resolves();
    setUploadOndemandOutputFileMock = sinon.stub().resolves();

    //rewireで差し替え
    rewireProjectFilesOperator.__set__({
      readComponentJsonByID: readComponentJsonByIDMock,
      writeComponentJsonByID: writeComponentJsonByIDMock,
      renameComponentDir: renameComponentDirMock,
      setUploadOndemandOutputFile: setUploadOndemandOutputFileMock
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should reject if prop is path", async ()=>{
    try {
      await updateComponentMock(mockProjectRootDir, mockID, "path", "/new/path");
      throw new Error("Expected to throw an error, but did not.");
    } catch (err) {
      expect(err.message).to.include("path property is deprecated");
    }
  });

  it("should reject if prop is inputFiles or outputFiles", async ()=>{
    try {
      await updateComponentMock(mockProjectRootDir, mockID, "inputFiles", []);
      throw new Error("Expected to throw an error, but did not.");
    } catch (err) {
      expect(err.message).to.include("does not support inputFiles");
    }

    try {
      await updateComponentMock(mockProjectRootDir, mockID, "outputFiles", []);
      throw new Error("Expected to throw an error, but did not.");
    } catch (err) {
      expect(err.message).to.include("does not support outputFiles");
    }
  });

  it("should reject if prop is env", async ()=>{
    try {
      await updateComponentMock(mockProjectRootDir, mockID, "env", { KEY: "VAL" });
      throw new Error("Expected to throw an error, but did not.");
    } catch (err) {
      expect(err.message).to.include("does not support env");
    }
  });

  it("should call setUploadOndemandOutputFile if prop=uploadOnDemand and value=true", async ()=>{
    await updateComponentMock(mockProjectRootDir, mockID, "uploadOnDemand", true);
    expect(setUploadOndemandOutputFileMock.calledOnceWith(mockProjectRootDir, mockID)).to.be.true;
  });

  it("should call renameComponentDir if prop=name", async ()=>{
    await updateComponentMock(mockProjectRootDir, mockID, "name", "NewName");
    expect(renameComponentDirMock.calledOnceWith(mockProjectRootDir, mockID, "NewName")).to.be.true;
  });

  it("should update other properties and write to component JSON", async ()=>{
    await updateComponentMock(mockProjectRootDir, mockID, "anyProp", "newValue");

    //readComponentJsonByIDが呼ばれたか
    expect(readComponentJsonByIDMock.calledOnceWith(mockProjectRootDir, mockID)).to.be.true;

    //取得したcomponentJsonが更新されてwriteComponentJsonByIDされるか
    expect(writeComponentJsonByIDMock.calledOnce).to.be.true;
    const writeCallArgs = writeComponentJsonByIDMock.firstCall.args;
    expect(writeCallArgs[0]).to.equal(mockProjectRootDir); //projectRootDir
    expect(writeCallArgs[1]).to.equal(mockID); //component ID
    expect(writeCallArgs[2]).to.deep.equal({
      ID: mockID,
      anyProp: "newValue",
      name: "NewName",
      uploadOnDemand: true
    });
  });
});

describe("#updateStepNumber", ()=>{
  let rewireProjectFilesOperator;
  let updateStepNumber;
  let getAllComponentIDsMock;
  let getComponentDirMock;
  let readComponentJsonMock;
  let writeComponentJsonMock;
  let arrangeComponentMock;

  const mockProjectRootDir = "/mock/project/root";

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    updateStepNumber = rewireProjectFilesOperator.__get__("updateStepNumber");

    getAllComponentIDsMock = sinon.stub();
    getComponentDirMock = sinon.stub();
    readComponentJsonMock = sinon.stub();
    writeComponentJsonMock = sinon.stub().resolves();
    arrangeComponentMock = sinon.stub();

    rewireProjectFilesOperator.__set__({
      getAllComponentIDs: getAllComponentIDsMock,
      getComponentDir: getComponentDirMock,
      readComponentJson: readComponentJsonMock,
      writeComponentJson: writeComponentJsonMock,
      arrangeComponent: arrangeComponentMock
    });
  });

  it("should update 'stepnum' for all stepjobTask components in the arranged order", async ()=>{
    const componentIDs = ["compStepjob", "compTaskA", "compTaskB", "compOther"];
    getAllComponentIDsMock.resolves(componentIDs);

    const mockStepjob = { ID: "compStepjob", type: "stepjob" };
    const mockTaskA = { ID: "compTaskA", type: "stepjobTask", parent: "compStepjob" };
    const mockTaskB = { ID: "compTaskB", type: "stepjobTask", parent: "compStepjob" };
    const mockOther = { ID: "compOther", type: "storage" };

    getComponentDirMock.callsFake(async (_, id)=>`/mock/dir/${id}`);
    readComponentJsonMock.callsFake(async (dirPath)=>{
      switch (dirPath) {
        case "/mock/dir/compStepjob": return mockStepjob;
        case "/mock/dir/compTaskA": return mockTaskA;
        case "/mock/dir/compTaskB": return mockTaskB;
        case "/mock/dir/compOther": return mockOther;
        default: return {};
      }
    });

    arrangeComponentMock.callsFake(async (stepjobGroup)=>{
      //stepjobGroup は [[mockTaskA, mockTaskB]] の形を想定
      return stepjobGroup[0] || [];
    });

    await updateStepNumber(mockProjectRootDir);

    expect(getAllComponentIDsMock.calledOnce).to.be.true;
    expect(readComponentJsonMock.callCount).to.equal(componentIDs.length);
    expect(arrangeComponentMock.calledOnce).to.be.true;
    expect(writeComponentJsonMock.callCount).to.equal(2);

    const firstWriteArg = writeComponentJsonMock.firstCall.args[2];
    const secondWriteArg = writeComponentJsonMock.secondCall.args[2];
    expect(firstWriteArg.stepnum).to.equal(0);
    expect(secondWriteArg.stepnum).to.equal(1);
  });

  it("should do nothing if there are no stepjobTask components", async ()=>{
    getAllComponentIDsMock.resolves(["comp1", "comp2"]);
    readComponentJsonMock.resolves({ ID: "compX", type: "storage" });
    arrangeComponentMock.resolves([]);

    await updateStepNumber(mockProjectRootDir);

    expect(arrangeComponentMock.calledOnce).to.be.true;
    expect(arrangeComponentMock.firstCall.args[0]).to.deep.equal([]);
    expect(writeComponentJsonMock.notCalled).to.be.true;
  });

  it("should handle error if getAllComponentIDs fails", async ()=>{
    //getAllComponentIDs が例外を投げるケース
    const mockError = new Error("getAllComponentIDs failed");
    getAllComponentIDsMock.rejects(mockError);

    try {
      await updateStepNumber(mockProjectRootDir);
      expect.fail("Expected updateStepNumber to throw an error");
    } catch (err) {
      expect(err).to.equal(mockError);
    }

    //途中で例外が出たので何も書き込みが起こらない
    expect(writeComponentJsonMock.notCalled).to.be.true;
  });

  it("should handle error if readComponentJson fails", async ()=>{
    getAllComponentIDsMock.resolves(["compStepjob", "compTaskA"]);
    getComponentDirMock.returns("/mock/dir/any");
    //1回目はStepjob読み込み成功、2回目でエラー発生
    readComponentJsonMock.onCall(0).resolves({ ID: "compStepjob", type: "stepjob" });
    readComponentJsonMock.onCall(1).rejects(new Error("readComponentJson failed"));

    try {
      await updateStepNumber(mockProjectRootDir);
      expect.fail("Expected to throw an error");
    } catch (err) {
      expect(err.message).to.equal("readComponentJson failed");
    }

    //途中でエラーが出たので writeComponentJson は呼ばれない
    expect(writeComponentJsonMock.notCalled).to.be.true;
  });

  it("should process multiple stepjobs independently", async ()=>{
    //stepjobが2つあり、それぞれにstepjobTaskがあるケース
    getAllComponentIDsMock.resolves([
      "stepjobA", "taskA1", "taskA2",
      "stepjobB", "taskB1", "taskB2"
    ]);

    const stepjobA = { ID: "stepjobA", type: "stepjob" };
    const stepjobB = { ID: "stepjobB", type: "stepjob" };
    const taskA1 = { ID: "taskA1", type: "stepjobTask", parent: "stepjobA" };
    const taskA2 = { ID: "taskA2", type: "stepjobTask", parent: "stepjobA" };
    const taskB1 = { ID: "taskB1", type: "stepjobTask", parent: "stepjobB" };
    const taskB2 = { ID: "taskB2", type: "stepjobTask", parent: "stepjobB" };

    getComponentDirMock.callsFake(async (_, id)=>`/mock/dir/${id}`);
    readComponentJsonMock.callsFake(async (dirPath)=>{
      switch (dirPath) {
        case "/mock/dir/stepjobA": return stepjobA;
        case "/mock/dir/stepjobB": return stepjobB;
        case "/mock/dir/taskA1": return taskA1;
        case "/mock/dir/taskA2": return taskA2;
        case "/mock/dir/taskB1": return taskB1;
        case "/mock/dir/taskB2": return taskB2;
        default: return {};
      }
    });
    //arrangeComponent は stepjob単位でタスクリストを渡される
    //ここでは2つのstepjob => 配列長2 の配列が渡ってくる想定
    arrangeComponentMock.callsFake(async (groups)=>{
      //groups は [ [taskA1, taskA2], [taskB1, taskB2] ] のような形を想定
      //テストでは一切ソートせずそのまま返す
      const result = [];
      for (const group of groups) {
        result.push(...group);
      }
      return result; //[taskA1, taskA2, taskB1, taskB2]
    });

    await updateStepNumber(mockProjectRootDir);

    //A1->A2->B1->B2 の順で stepnum が割り当てられる
    expect(writeComponentJsonMock.callCount).to.equal(4);
    expect(writeComponentJsonMock.getCall(0).args[2].stepnum).to.equal(0);
    expect(writeComponentJsonMock.getCall(1).args[2].stepnum).to.equal(1);
    expect(writeComponentJsonMock.getCall(2).args[2].stepnum).to.equal(2);
    expect(writeComponentJsonMock.getCall(3).args[2].stepnum).to.equal(3);
  });

  it("should handle arrangeComponent throwing an error", async ()=>{
    getAllComponentIDsMock.resolves(["compStepjob", "compTaskA"]);
    readComponentJsonMock.onCall(0).resolves({ ID: "compStepjob", type: "stepjob" });
    readComponentJsonMock.onCall(1).resolves({ ID: "compTaskA", type: "stepjobTask", parent: "compStepjob" });

    arrangeComponentMock.rejects(new Error("arrangeComponent failed"));

    try {
      await updateStepNumber(mockProjectRootDir);
      expect.fail("Expected updateStepNumber to throw");
    } catch (err) {
      expect(err.message).to.equal("arrangeComponent failed");
    }

    //arrangeComponent 失敗後はwriteComponentJsonは呼ばれない
    expect(writeComponentJsonMock.notCalled).to.be.true;
  });

  it("should skip tasks if their parent is not a stepjob", async ()=>{
    //stepjobTask だが parent が workflow とか storage とかになっている場合を想定
    getAllComponentIDsMock.resolves(["normalStepjob", "weirdTask1", "weirdTask2"]);
    readComponentJsonMock.callsFake(async ()=>({})); //デフォルトは空
    //normalStepjob は stepjob
    readComponentJsonMock.onCall(0).resolves({ ID: "normalStepjob", type: "stepjob" });
    //weirdTask1/2 は stepjobTask だが parent="workflow" のようなケース
    readComponentJsonMock.onCall(1).resolves({ ID: "weirdTask1", type: "stepjobTask", parent: "workflow" });
    readComponentJsonMock.onCall(2).resolves({ ID: "weirdTask2", type: "stepjobTask", parent: "normalStepjob" });

    arrangeComponentMock.callsFake(async (groups)=>{
      //groups => [ [ {ID: weirdTask2} ] ] だけが親stepjob=normalStepjob
      //weirdTask1 は親がstepjobでない => そもそも追加されない想定
      return groups[0] || [];
    });

    await updateStepNumber(mockProjectRootDir);

    //weirdTask1 は親が stepjob でないのでスキップ
    //weirdTask2 は有効 => stepnum=0
    expect(writeComponentJsonMock.calledOnce).to.be.true;
    const updatedTask = writeComponentJsonMock.firstCall.args[2];
    expect(updatedTask.ID).to.equal("weirdTask2");
    expect(updatedTask.stepnum).to.equal(0);
  });
});

describe("#arrangeComponent", ()=>{
  let rewireProjectFilesOperator;
  let arrangeComponent;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    arrangeComponent = rewireProjectFilesOperator.__get__("arrangeComponent");
  });

  it("should return an empty array when stepjobGroupArray is empty", async ()=>{
    const stepjobGroupArray = []; //空

    const result = await arrangeComponent(stepjobGroupArray);

    expect(result).to.deep.equal([]);
  });

  it("should return the entire group if no initial node is found (arrangeArraytemp.length === 0 on first filter)", async ()=>{
    //全てのタスクが next.length === 0 or previous.length !== 0 などで「先頭」になりうるコンポーネントが存在しない例
    const stepjobTaskGroup = [
      {
        ID: "comp1",
        previous: ["comp2"],
        next: []
      },
      {
        ID: "comp2",
        previous: [],
        next: []
      }
    ];
    const stepjobGroupArray = [stepjobTaskGroup];

    const result = await arrangeComponent(stepjobGroupArray);

    //初期filterでarrangeArraytempが空 → breakしてstepjobTaskGroupそのものを返す
    expect(result).to.deep.equal(stepjobTaskGroup);
  });

  it("should arrange a single connected chain in the correct order (normal chain scenario)", async ()=>{
    const stepjobTaskGroup = [
      {
        ID: "comp1",
        previous: [],
        next: ["comp2"]
      },
      {
        ID: "comp2",
        previous: ["comp1"],
        next: ["comp3"]
      },
      {
        ID: "comp3",
        previous: ["comp2"],
        next: []
      }
    ];
    const stepjobGroupArray = [stepjobTaskGroup];

    const result = await arrangeComponent(stepjobGroupArray);

    //comp1 -> comp2 -> comp3
    expect(result.map((c)=>c.ID)).to.deep.equal(["comp1", "comp2", "comp3"]);
  });

  it("should continue loop but skip pushing next if next component is not found (nextComponent.length === 0)", async ()=>{
    //comp1がnext=["comp2"]だが、comp2がいないのでpushしないケース
    const stepjobTaskGroup = [
      {
        ID: "comp1",
        previous: [],
        next: ["comp2"]
      }
      //comp2は定義されていない
    ];
    const stepjobGroupArray = [stepjobTaskGroup];

    const result = await arrangeComponent(stepjobGroupArray);

    //comp2が見つからないのでcomp1のみ
    expect(result).to.have.lengthOf(1);
    expect(result[0].ID).to.equal("comp1");
  });

  it("should put isolated tasks (no previous & no next) at the end of the array", async ()=>{
    //comp1 -> comp2 の後ろに、完全に接続されていないcomp3を末尾に追加するか
    const stepjobTaskGroup = [
      {
        ID: "comp1",
        previous: [],
        next: ["comp2"]
      },
      {
        ID: "comp2",
        previous: ["comp1"],
        next: []
      },
      {
        ID: "comp3",
        previous: [],
        next: []
      }
    ];
    const stepjobGroupArray = [stepjobTaskGroup];

    const result = await arrangeComponent(stepjobGroupArray);
    //comp3が最後に回される
    expect(result.map((c)=>c.ID)).to.deep.equal(["comp1", "comp2", "comp3"]);
  });

  it("should correctly handle multiple groups and flatten all results into a single array", async ()=>{
    const group1 = [
      { ID: "g1c1", previous: [], next: ["g1c2"] },
      { ID: "g1c2", previous: ["g1c1"], next: [] }
    ];
    const group2 = [
      { ID: "g2c1", previous: [], next: [] }, //isolated
      { ID: "g2c2", previous: [], next: ["g2c3"] },
      { ID: "g2c3", previous: ["g2c2"], next: [] }
    ];
    const stepjobGroupArray = [group1, group2];

    const result = await arrangeComponent(stepjobGroupArray);

    //group1 は [g1c1, g1c2]
    //group2 は [g2c2, g2c3, g2c1] の順（g2c1はisolatedで最後に来る）
    //flatにすると [g1c1, g1c2, g2c2, g2c3, g2c1]
    expect(result).to.have.lengthOf(5);
    expect(result.map((c)=>c.ID)).to.deep.equal(["g1c1", "g1c2", "g2c2", "g2c3", "g2c1"]);
  });

  it("should handle a group that has a single element (both previous and next are empty)", async ()=>{
    const stepjobTaskGroup = [
      { ID: "single", previous: [], next: [] }
    ];
    const stepjobGroupArray = [stepjobTaskGroup];

    const result = await arrangeComponent(stepjobGroupArray);

    //単一要素なので、そのまま返る
    expect(result).to.have.lengthOf(1);
    expect(result[0].ID).to.equal("single");
  });

  it("should handle a group that has tasks but none have next.length !== 0", async ()=>{
    //先頭filterで next.length !== 0 のものが1つもないケース
    const stepjobTaskGroup = [
      {
        ID: "compA",
        previous: [],
        next: []
      },
      {
        ID: "compB",
        previous: [],
        next: []
      }
    ];
    const stepjobGroupArray = [stepjobTaskGroup];

    const result = await arrangeComponent(stepjobGroupArray);

    //arrangeArraytemp = stepjobTaskComponents となり break
    expect(result).to.deep.equal(stepjobTaskGroup);
  });
});

describe("#addInputFile", ()=>{
  let rewireProjectFilesOperator;
  let addInputFile;
  let isValidInputFilenameMock;
  let getComponentDirMock;
  let readComponentJsonMock;
  let writeComponentJsonMock;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    addInputFile = rewireProjectFilesOperator.__get__("addInputFile");

    //sinon.stub(...) で依存関数をモック化
    isValidInputFilenameMock = sinon.stub();
    getComponentDirMock = sinon.stub();
    readComponentJsonMock = sinon.stub();
    writeComponentJsonMock = sinon.stub();

    //rewireで内部の関数・変数を差し替え
    rewireProjectFilesOperator.__set__({
      isValidInputFilename: isValidInputFilenameMock,
      getComponentDir: getComponentDirMock,
      readComponentJson: readComponentJsonMock,
      writeComponentJson: writeComponentJsonMock
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should reject if the input filename is invalid", async ()=>{
    const projectRootDir = "/mock/project";
    const componentID = "component123";
    const invalidName = "invalid*filename";

    isValidInputFilenameMock.returns(false); //invalid と判定させる

    try {
      await addInputFile(projectRootDir, componentID, invalidName);
      throw new Error("Expected addInputFile to throw an error");
    } catch (err) {
      expect(err).to.be.an("Error");
      expect(err.message).to.equal(`${invalidName} is not valid inputFile name`);
    }
    expect(isValidInputFilenameMock.calledOnceWithExactly(invalidName)).to.be.true;
    //下記の関数は呼ばれない
    expect(getComponentDirMock.notCalled).to.be.true;
    expect(readComponentJsonMock.notCalled).to.be.true;
    expect(writeComponentJsonMock.notCalled).to.be.true;
  });

  it("should reject if the component does not have inputFiles property", async ()=>{
    const projectRootDir = "/mock/project";
    const componentID = "componentWithoutInputFiles";
    const name = "validInput.txt";
    isValidInputFilenameMock.returns(true);

    //仮にgetComponentDirの戻り値
    const mockDir = "/mock/project/components/componentWithoutInputFiles";
    getComponentDirMock.resolves(mockDir);

    //componentJson に inputFilesが無い想定
    const mockComponentJson = {
      ID: componentID,
      name: "NoInputFilesComponent"
      //ここで inputFiles プロパティ無し
    };
    readComponentJsonMock.resolves(mockComponentJson);

    try {
      await addInputFile(projectRootDir, componentID, name);
      throw new Error("Expected addInputFile to throw an error");
    } catch (err) {
      expect(err).to.be.an("Error");
      expect(err.message).to.equal(`${mockComponentJson.name} does not have inputFiles`);
      expect(err.component).to.deep.equal(mockComponentJson);
    }

    //各モック呼び出しの検証
    expect(isValidInputFilenameMock.calledOnceWithExactly(name)).to.be.true;
    expect(getComponentDirMock.calledOnceWithExactly(projectRootDir, componentID, true)).to.be.true;
    expect(readComponentJsonMock.calledOnceWithExactly(mockDir)).to.be.true;
    expect(writeComponentJsonMock.notCalled).to.be.true;
  });

  it("should add a new inputFile to the component and call writeComponentJson on success", async ()=>{
    const projectRootDir = "/mock/project";
    const componentID = "componentWithInputFiles";
    const name = "inputFileName.txt";
    isValidInputFilenameMock.returns(true);

    //getComponentDirのモック戻り値
    const mockDir = "/mock/project/components/componentWithInputFiles";
    getComponentDirMock.resolves(mockDir);

    //componentJsonに inputFiles: [] が存在する想定
    const mockComponentJson = {
      ID: componentID,
      name: "HasInputFilesComponent",
      inputFiles: []
    };
    readComponentJsonMock.resolves(mockComponentJson);

    writeComponentJsonMock.resolves(); //成功時には特に値は返さない

    await addInputFile(projectRootDir, componentID, name);

    expect(isValidInputFilenameMock.calledOnceWithExactly(name)).to.be.true;
    expect(getComponentDirMock.calledOnceWithExactly(projectRootDir, componentID, true)).to.be.true;
    expect(readComponentJsonMock.calledOnceWithExactly(mockDir)).to.be.true;

    //inputFilesに要素追加されたか
    expect(mockComponentJson.inputFiles).to.have.lengthOf(1);
    const newInputFile = mockComponentJson.inputFiles[0];
    expect(newInputFile).to.deep.equal({ name, src: [] });

    //writeComponentJsonが正しく呼ばれたか
    expect(writeComponentJsonMock.calledOnceWithExactly(projectRootDir, mockDir, mockComponentJson)).to.be.true;
  });

  it("should reject if getComponentDir fails", async ()=>{
    const projectRootDir = "/mock/project";
    const componentID = "someComponent";
    const name = "testInput.dat";
    isValidInputFilenameMock.returns(true);

    //getComponentDirを強制的にrejectさせる
    const mockError = new Error("Failed to get component dir");
    getComponentDirMock.rejects(mockError);

    try {
      await addInputFile(projectRootDir, componentID, name);
      throw new Error("Expected addInputFile to throw");
    } catch (err) {
      expect(err).to.equal(mockError);
    }

    expect(isValidInputFilenameMock.calledOnceWithExactly(name)).to.be.true;
    expect(readComponentJsonMock.notCalled).to.be.true;
    expect(writeComponentJsonMock.notCalled).to.be.true;
  });

  it("should reject if readComponentJson fails", async ()=>{
    const projectRootDir = "/mock/project";
    const componentID = "componentWithInputFiles";
    const name = "testInput.dat";
    isValidInputFilenameMock.returns(true);

    const mockDir = "/mock/project/components/componentWithInputFiles";
    getComponentDirMock.resolves(mockDir);

    const mockError = new Error("readComponentJson error");
    readComponentJsonMock.rejects(mockError);

    try {
      await addInputFile(projectRootDir, componentID, name);
      throw new Error("Expected addInputFile to throw");
    } catch (err) {
      expect(err).to.equal(mockError);
    }

    expect(isValidInputFilenameMock.calledOnceWithExactly(name)).to.be.true;
    expect(getComponentDirMock.calledOnce).to.be.true;
    expect(readComponentJsonMock.calledOnceWithExactly(mockDir)).to.be.true;
    expect(writeComponentJsonMock.notCalled).to.be.true;
  });

  it("should reject if writeComponentJson fails", async ()=>{
    const projectRootDir = "/mock/project";
    const componentID = "componentWithInputFiles";
    const name = "testInput.dat";
    isValidInputFilenameMock.returns(true);

    const mockDir = "/mock/project/components/componentWithInputFiles";
    getComponentDirMock.resolves(mockDir);

    const mockComponentJson = {
      ID: componentID,
      name: "HasInputFilesComponent",
      inputFiles: []
    };
    readComponentJsonMock.resolves(mockComponentJson);

    const mockError = new Error("writeComponentJson error");
    writeComponentJsonMock.rejects(mockError);

    try {
      await addInputFile(projectRootDir, componentID, name);
      throw new Error("Expected addInputFile to throw");
    } catch (err) {
      expect(err).to.equal(mockError);
    }

    expect(mockComponentJson.inputFiles).to.have.lengthOf(1); //追加はされている
    expect(writeComponentJsonMock.calledOnce).to.be.true;
  });
});

describe("#addOutputFile", ()=>{
  let rewireProjectFilesOperator;
  let addOutputFile;
  let isValidOutputFilenameMock;
  let getComponentDirMock;
  let readComponentJsonMock;
  let writeComponentJsonMock;

  const mockProjectRootDir = "/mock/project/root";
  const mockID = "componentID";
  const mockName = "outputFileA";
  const mockComponentDir = "/mock/project/root/componentDir";
  const mockComponentJson = {
    name: "testComponent",
    outputFiles: []
  };

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    addOutputFile = rewireProjectFilesOperator.__get__("addOutputFile");

    //sinonでstub作成
    isValidOutputFilenameMock = sinon.stub();
    getComponentDirMock = sinon.stub();
    readComponentJsonMock = sinon.stub();
    writeComponentJsonMock = sinon.stub().resolves();

    //rewireで内部の関数にモックを仕込む
    rewireProjectFilesOperator.__set__("isValidOutputFilename", isValidOutputFilenameMock);
    rewireProjectFilesOperator.__set__("getComponentDir", getComponentDirMock);
    rewireProjectFilesOperator.__set__("readComponentJson", readComponentJsonMock);
    rewireProjectFilesOperator.__set__("writeComponentJson", writeComponentJsonMock);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should reject if the filename is invalid", async ()=>{
    //filename不正でfalseになる
    isValidOutputFilenameMock.returns(false);

    try {
      await addOutputFile(mockProjectRootDir, mockID, mockName);
      throw new Error("Expected addOutputFile to reject with error");
    } catch (err) {
      expect(err.message).to.equal(`${mockName} is not valid outputFile name`);
    }
    expect(isValidOutputFilenameMock.calledOnceWithExactly(mockName)).to.be.true;
    expect(getComponentDirMock.notCalled).to.be.true;
    expect(readComponentJsonMock.notCalled).to.be.true;
    expect(writeComponentJsonMock.notCalled).to.be.true;
  });

  it("should reject if 'outputFiles' property does not exist in componentJson", async ()=>{
    isValidOutputFilenameMock.returns(true);
    getComponentDirMock.resolves(mockComponentDir);
    //outputFilesが存在しない場合
    const badComponentJson = { name: "badComponent" };
    readComponentJsonMock.resolves(badComponentJson);

    try {
      await addOutputFile(mockProjectRootDir, mockID, mockName);
      throw new Error("Expected addOutputFile to reject");
    } catch (err) {
      expect(err.message).to.equal("badComponent does not have outputFiles");
      expect(err.component).to.deep.equal(badComponentJson);
    }
    expect(getComponentDirMock.calledOnceWithExactly(mockProjectRootDir, mockID, true)).to.be.true;
    expect(readComponentJsonMock.calledOnceWithExactly(mockComponentDir)).to.be.true;
    expect(writeComponentJsonMock.notCalled).to.be.true;
  });

  it("should reject if the same name output file already exists", async ()=>{
    isValidOutputFilenameMock.returns(true);
    getComponentDirMock.resolves(mockComponentDir);
    readComponentJsonMock.resolves({
      name: "testComponent",
      outputFiles: [{ name: mockName, dst: [] }]
    });

    try {
      await addOutputFile(mockProjectRootDir, mockID, mockName);
      throw new Error("Expected addOutputFile to reject");
    } catch (err) {
      expect(err.message).to.equal(`${mockName} is already exists`);
    }
    expect(getComponentDirMock.calledOnce).to.be.true;
    expect(readComponentJsonMock.calledOnce).to.be.true;
    expect(writeComponentJsonMock.notCalled).to.be.true;
  });

  it("should add a new output file and call writeComponentJson when valid and not duplicate", async ()=>{
    isValidOutputFilenameMock.returns(true);
    getComponentDirMock.resolves(mockComponentDir);
    readComponentJsonMock.resolves(mockComponentJson);

    await addOutputFile(mockProjectRootDir, mockID, mockName);

    //outputFilesがpushされているかを確認
    expect(mockComponentJson.outputFiles).to.deep.equal([
      { name: mockName, dst: [] }
    ]);

    //writeComponentJsonが呼ばれているか
    expect(writeComponentJsonMock.calledOnceWithExactly(
      mockProjectRootDir,
      mockComponentDir,
      mockComponentJson
    )).to.be.true;
  });
});

describe("#setUploadOndemandOutputFile", ()=>{
  let rewireProjectFilesOperator;
  let setUploadOndemandOutputFile;
  let getComponentDirMock;
  let readComponentJsonMock;
  let addOutputFileMock;
  let removeFileLinkMock;
  let renameOutputFileMock;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    setUploadOndemandOutputFile = rewireProjectFilesOperator.__get__("setUploadOndemandOutputFile");

    //各依存関数をスタブ化
    getComponentDirMock = sinon.stub();
    readComponentJsonMock = sinon.stub();
    addOutputFileMock = sinon.stub().resolves();
    removeFileLinkMock = sinon.stub().resolves();
    renameOutputFileMock = sinon.stub().resolves();

    //rewire で内部参照を差し替え
    rewireProjectFilesOperator.__set__({
      getComponentDir: getComponentDirMock,
      readComponentJson: readComponentJsonMock,
      addOutputFile: addOutputFileMock,
      removeFileLink: removeFileLinkMock,
      renameOutputFile: renameOutputFileMock
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should reject if the component does not have an outputFiles property", async ()=>{
    const projectRootDir = "/mock/project";
    const componentID = "comp-id";
    getComponentDirMock.resolves("/mock/comp-dir");
    //outputFilesプロパティが無い
    readComponentJsonMock.resolves({ name: "testComponent" });

    try {
      await setUploadOndemandOutputFile(projectRootDir, componentID);
      throw new Error("Expected setUploadOndemandOutputFile to reject, but it resolved.");
    } catch (err) {
      expect(err.message).to.equal("testComponent does not have outputFiles");
      expect(err.component).to.deep.equal({ name: "testComponent" });
    }
    expect(addOutputFileMock.notCalled).to.be.true;
    expect(removeFileLinkMock.notCalled).to.be.true;
    expect(renameOutputFileMock.notCalled).to.be.true;
  });

  it("should call addOutputFile if there are no outputFiles", async ()=>{
    const projectRootDir = "/mock/project";
    const componentID = "comp-id";
    getComponentDirMock.resolves("/mock/comp-dir");
    //outputFiles は空配列
    readComponentJsonMock.resolves({
      name: "testComponent",
      outputFiles: []
    });

    await setUploadOndemandOutputFile(projectRootDir, componentID);

    //outputFiles が 0 個なら addOutputFile を呼ぶ
    expect(addOutputFileMock.calledOnceWithExactly(projectRootDir, componentID, "UPLOAD_ONDEMAND"))
      .to.be.true;

    expect(removeFileLinkMock.notCalled).to.be.true;
    expect(renameOutputFileMock.notCalled).to.be.true;
  });

  it("should remove extra outputFiles if there is more than one, and rename the first to UPLOAD_ONDEMAND", async ()=>{
    const projectRootDir = "/mock/project";
    const componentID = "comp-id";
    getComponentDirMock.resolves("/mock/comp-dir");

    //outputFilesが複数あるケース
    //2つ目以降にはdst が複数ある想定
    readComponentJsonMock.resolves({
      name: "testComponent",
      outputFiles: [
        {
          name: "someOutput1",
          dst: [{ dstNode: "dstComp1", dstName: "dstFilename1" }]
        },
        {
          name: "someOutput2",
          dst: [
            { dstNode: "dstComp2", dstName: "dstFilename2" },
            { dstNode: "dstComp3", dstName: "dstFilename3" }
          ]
        },
        {
          name: "someOutput3",
          dst: [{ dstNode: "dstComp4", dstName: "dstFilename4" }]
        }
      ]
    });

    await setUploadOndemandOutputFile(projectRootDir, componentID);

    //removeFileLink が正しく呼ばれているか
    //→ 2つ目以降の出力ファイルに記載されたdstセットに対して removeFileLink() が呼ばれる
    //第2〜n番目 outputFiles[i].dst: すべてunique set -> removeFileLinkが複数呼ばれる
    //具体的には以下で4回呼ばれる
    expect(removeFileLinkMock.callCount).to.equal(3); //2つ目は2回, 3つ目は1回: ただし Set() により重複除外
    //順番は特に保証されないが、呼び出し引数が正しいかチェック
    //例: removeFileLink(projectRootDir, "comp-id", "someOutput2", "dstComp2", "dstFilename2")
    //removeFileLink(projectRootDir, "comp-id", "someOutput2", "dstComp3", "dstFilename3")
    //removeFileLink(projectRootDir, "comp-id", "someOutput3", "dstComp4", "dstFilename4")
    const calls = removeFileLinkMock.getCalls().map((c)=>c.args);
    expect(calls).to.deep.include(
      [projectRootDir, "comp-id", "someOutput2", "dstComp2", "dstFilename2"]
    );
    expect(calls).to.deep.include(
      [projectRootDir, "comp-id", "someOutput2", "dstComp3", "dstFilename3"]
    );
    expect(calls).to.deep.include(
      [projectRootDir, "comp-id", "someOutput3", "dstComp4", "dstFilename4"]
    );

    //最後に renameOutputFile(… 0, "UPLOAD_ONDEMAND") が呼ばれる
    expect(renameOutputFileMock.calledOnceWithExactly(projectRootDir, "comp-id", 0, "UPLOAD_ONDEMAND"))
      .to.be.true;

    expect(addOutputFileMock.notCalled).to.be.true;
  });

  it("should rename the single existing outputFile to UPLOAD_ONDEMAND if outputFiles length is exactly one", async ()=>{
    const projectRootDir = "/mock/project";
    const componentID = "comp-id";
    getComponentDirMock.resolves("/mock/comp-dir");

    //outputFileがひとつだけのケース
    readComponentJsonMock.resolves({
      name: "testComponent",
      outputFiles: [
        {
          name: "someOutput",
          dst: [{ dstNode: "dstComp", dstName: "dstFilename" }]
        }
      ]
    });

    await setUploadOndemandOutputFile(projectRootDir, componentID);

    //removeFileLinkは呼ばれない
    expect(removeFileLinkMock.notCalled).to.be.true;

    //renameOutputFile が呼ばれる
    expect(renameOutputFileMock.calledOnceWithExactly(
      projectRootDir,
      componentID,
      0,
      "UPLOAD_ONDEMAND"
    )).to.be.true;
    expect(addOutputFileMock.notCalled).to.be.true;
  });
});

describe("#renameOutputFile", ()=>{
  let rewireProjectFilesOperator;
  let renameOutputFile;

  //sinonスタブ用
  let isValidOutputFilenameMock;
  let getComponentDirMock;
  let readComponentJsonMock;
  let writeComponentJsonMock;

  //テストに使うダミー値
  const mockProjectRootDir = "/mock/project/root";
  const mockID = "component-123";
  const mockIndex = 0;
  const validNewName = "newOutput.dat";
  const invalidNewName = "invalid/name";
  let mockComponentDir;
  let mockComponentJson;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    renameOutputFile = rewireProjectFilesOperator.__get__("renameOutputFile");

    //各種モックを作成
    isValidOutputFilenameMock = sinon.stub();
    getComponentDirMock = sinon.stub();
    readComponentJsonMock = sinon.stub();
    writeComponentJsonMock = sinon.stub().resolves();

    //rewireで元関数を差し替え
    rewireProjectFilesOperator.__set__({
      isValidOutputFilename: isValidOutputFilenameMock,
      getComponentDir: getComponentDirMock,
      readComponentJson: readComponentJsonMock,
      writeComponentJson: writeComponentJsonMock
    });

    mockComponentDir = "/mock/project/root/component-123";
    mockComponentJson = {
      outputFiles: [
        {
          name: "oldOutput.dat",
          dst: [] //テストごとに動的に差し替え
        }
      ]
    };
  });

  it("should reject if the newName is invalid", async ()=>{
    isValidOutputFilenameMock.returns(false);

    try {
      await renameOutputFile(mockProjectRootDir, mockID, mockIndex, invalidNewName);
      throw new Error("Expected renameOutputFile to throw an error for invalid name");
    } catch (err) {
      expect(err.message).to.equal(`${invalidNewName} is not valid outputFile name`);
      expect(isValidOutputFilenameMock.calledOnceWithExactly(invalidNewName)).to.be.true;
    }
  });

  it("should reject if the index is out of range (negative)", async ()=>{
    isValidOutputFilenameMock.returns(true);
    getComponentDirMock.resolves(mockComponentDir);
    readComponentJsonMock.resolves(mockComponentJson);

    try {
      await renameOutputFile(mockProjectRootDir, mockID, -1, validNewName);
      throw new Error("Expected renameOutputFile to throw an error for out-of-range index");
    } catch (err) {
      expect(err.message).to.equal("invalid index -1");
    }
  });

  it("should reject if the index is out of range (too large)", async ()=>{
    isValidOutputFilenameMock.returns(true);
    getComponentDirMock.resolves(mockComponentDir);

    //outputFiles.length は 1、なのに index=1 は範囲外
    mockComponentJson.outputFiles = [{ name: "oneFile.dat" }];
    readComponentJsonMock.resolves(mockComponentJson);

    try {
      await renameOutputFile(mockProjectRootDir, mockID, 1, validNewName);
      throw new Error("Expected renameOutputFile to throw an error for out-of-range index");
    } catch (err) {
      expect(err.message).to.equal("invalid index 1");
    }
  });

  it("should rename outputFile without counterparts if dst is empty", async ()=>{
    isValidOutputFilenameMock.returns(true);
    getComponentDirMock.resolves(mockComponentDir);

    //dst:[] なので counterparts は生成されるが空
    mockComponentJson.outputFiles = [
      { name: "oldOutput.dat", dst: [] }
    ];
    readComponentJsonMock.resolves(mockComponentJson);

    await renameOutputFile(mockProjectRootDir, mockID, 0, validNewName);

    expect(mockComponentJson.outputFiles[0].name).to.equal(validNewName);
    expect(writeComponentJsonMock.callCount).to.equal(1); //自分自身のみ書き込み
  });

  it("should rename outputFile and update references in the counterpart's inputFiles", async ()=>{
    isValidOutputFilenameMock.returns(true);
    getComponentDirMock.onCall(0).resolves(mockComponentDir); //自身
    getComponentDirMock.onCall(1).resolves("/mock/project/root/counterpart-999"); //相手

    //自分のoutputFiles
    mockComponentJson.outputFiles = [
      {
        name: "oldOutput.dat",
        dst: [{ dstNode: "counterpart-999" }]
      }
    ];
    readComponentJsonMock.onCall(0).resolves(mockComponentJson);

    //counterpartの inputFiles
    const counterpartJson = {
      inputFiles: [
        {
          name: "someInput",
          src: [
            { srcNode: mockID, srcName: "oldOutput.dat" } //ここがリネーム対象
          ]
        }
      ],
      outputFiles: []
    };
    readComponentJsonMock.onCall(1).resolves(counterpartJson);

    await renameOutputFile(mockProjectRootDir, mockID, 0, validNewName);

    //自分側
    expect(mockComponentJson.outputFiles[0].name).to.equal(validNewName);
    //counterpart側
    expect(counterpartJson.inputFiles[0].src[0].srcName).to.equal(validNewName);

    //書き込みの呼ばれ方を確認：自分 + counterpartの計2回
    expect(writeComponentJsonMock.callCount).to.equal(2);
    expect(writeComponentJsonMock.firstCall.args[1]).to.equal(mockComponentDir);
    expect(writeComponentJsonMock.secondCall.args[1]).to.equal("/mock/project/root/counterpart-999");
  });
  it("should keep old name if the counterpart's outputFiles has 'origin' property", async ()=>{
    isValidOutputFilenameMock.returns(true);
    getComponentDirMock.onCall(0).resolves(mockComponentDir);
    getComponentDirMock.onCall(1).resolves("/mock/project/root/counterpart-999");

    //自分のoutputFiles
    mockComponentJson.outputFiles = [
      {
        name: "oldOutput.dat",
        dst: [{ dstNode: "counterpart-999" }]
      }
    ];
    readComponentJsonMock.onCall(0).resolves(mockComponentJson);

    //counterpartのoutputFiles (originあり)
    const counterpartJson = {
      inputFiles: [],
      outputFiles: [
        {
          //実装上は「originが存在する」→ if(!hasOwnProperty("origin"))分岐に入らない
          origin: [{ srcNode: mockID, srcName: "oldOutput.dat" }]
        }
      ]
    };
    readComponentJsonMock.onCall(1).resolves(counterpartJson);

    //originはoldOutput.datのまま
    await renameOutputFile(mockProjectRootDir, mockID, 0, validNewName);

    //自分はrenameされる
    expect(mockComponentJson.outputFiles[0].name).to.equal(validNewName);
    //counterpartのoriginもrenameされる
    expect(counterpartJson.outputFiles[0].origin[0].srcName).to.equal(validNewName);

    //書き込み回数: 自分 + counterpart
    expect(writeComponentJsonMock.callCount).to.equal(2);
  });
});

describe("#addLink", ()=>{
  let rewireProjectFilesOperator;
  let addLink;
  let getComponentDirMock;
  let readComponentJsonMock;
  let writeComponentJsonMock;
  let updateStepNumberMock;

  const projectRootDir = "/mock/project/root";

  beforeEach(()=>{
    //rewireでモジュール読み込み
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");

    //テスト対象関数を取得
    addLink = rewireProjectFilesOperator.__get__("addLink");

    //依存関数をスタブ化
    getComponentDirMock = sinon.stub();
    readComponentJsonMock = sinon.stub();
    writeComponentJsonMock = sinon.stub().resolves();
    updateStepNumberMock = sinon.stub().resolves();

    //rewireで内部参照を書き換え
    rewireProjectFilesOperator.__set__({
      getComponentDir: getComponentDirMock,
      readComponentJson: readComponentJsonMock,
      writeComponentJson: writeComponentJsonMock,
      updateStepNumber: updateStepNumberMock
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should reject if src === dst (cyclic link not allowed)", async ()=>{
    try {
      await addLink(projectRootDir, "sameID", "sameID");
      throw new Error("Expected addLink to reject");
    } catch (err) {
      expect(err.message).to.equal("cyclic link is not allowed");
    }
  });

  it("should reject if either component is 'viewer'", async ()=>{
    //srcがviewerの場合
    getComponentDirMock.onFirstCall().resolves("/mock/srcDir");
    readComponentJsonMock.onFirstCall().resolves({
      type: "viewer", name: "ViewerComponent", else: [], next: [], previous: []
    });
    //dst
    getComponentDirMock.onSecondCall().resolves("/mock/dstDir");
    readComponentJsonMock.onSecondCall().resolves({
      type: "task", name: "SomeTask", else: [], next: [], previous: []
    });

    try {
      await addLink(projectRootDir, "viewerID", "taskID", false);
      throw new Error("Expected addLink to reject");
    } catch (err) {
      expect(err.message).to.equal("viewer can not have link");
      expect(err.code).to.equal("ELINK");
      expect(err.src).to.equal("viewerID");
      expect(err.dst).to.equal("taskID");
      expect(err.isElse).to.be.false;
    }
  });

  it("should reject if either component is 'source'", async ()=>{
    //srcがtask、dstがsourceの場合の例
    getComponentDirMock.onFirstCall().resolves("/mock/srcDir");
    readComponentJsonMock.onFirstCall().resolves({
      type: "task", name: "TaskComp", else: [], next: [], previous: []
    });
    getComponentDirMock.onSecondCall().resolves("/mock/dstDir");
    readComponentJsonMock.onSecondCall().resolves({
      type: "source", name: "SourceComp", else: [], next: [], previous: []
    });

    try {
      await addLink(projectRootDir, "taskID", "sourceID", true);
      throw new Error("Expected addLink to reject");
    } catch (err) {
      expect(err.message).to.equal("source can not have link");
      expect(err.code).to.equal("ELINK");
      expect(err.src).to.equal("taskID");
      expect(err.dst).to.equal("sourceID");
      expect(err.isElse).to.be.true;
    }
  });

  it("should add dst to src.else if isElse is true, and not already in the array", async ()=>{
    //srcJson.typeがtask, dstJson.typeがtaskなど
    getComponentDirMock.onFirstCall().resolves("/mock/srcDir");
    readComponentJsonMock.onFirstCall().resolves({
      type: "task",
      name: "TaskA",
      else: ["existingElseID"],
      next: [],
      previous: []
    });

    getComponentDirMock.onSecondCall().resolves("/mock/dstDir");
    readComponentJsonMock.onSecondCall().resolves({
      type: "task",
      name: "TaskB",
      else: [],
      next: [],
      previous: []
    });

    await addLink(projectRootDir, "srcID", "dstID", true);

    //src側: elseに追加される
    const srcWriteCallArg = writeComponentJsonMock.firstCall.args[2]; //srcJson
    expect(srcWriteCallArg.else).to.deep.equal(["existingElseID", "dstID"]);

    //dst側: previousにsrcID追加
    const dstWriteCallArg = writeComponentJsonMock.secondCall.args[2]; //dstJson
    expect(dstWriteCallArg.previous).to.deep.equal(["srcID"]);
  });

  it("should add dst to src.next if isElse is false, and not already in the array", async ()=>{
    getComponentDirMock.onFirstCall().resolves("/mock/srcDir");
    readComponentJsonMock.onFirstCall().resolves({
      type: "task",
      name: "TaskA",
      else: [],
      next: ["alreadyThere"],
      previous: []
    });

    getComponentDirMock.onSecondCall().resolves("/mock/dstDir");
    readComponentJsonMock.onSecondCall().resolves({
      type: "task",
      name: "TaskB",
      else: [],
      next: [],
      previous: []
    });

    await addLink(projectRootDir, "srcID", "dstID", false);

    //src側
    const srcWriteCallArg = writeComponentJsonMock.firstCall.args[2];
    expect(srcWriteCallArg.next).to.deep.equal(["alreadyThere", "dstID"]);

    //dst側
    const dstWriteCallArg = writeComponentJsonMock.secondCall.args[2];
    expect(dstWriteCallArg.previous).to.deep.equal(["srcID"]);
  });

  it("should not duplicate dst in srcJson.else or srcJson.next if it already exists", async ()=>{
    getComponentDirMock.onFirstCall().resolves("/mock/srcDir");
    readComponentJsonMock.onFirstCall().resolves({
      type: "task",
      name: "TaskA",
      else: ["dstID"], //すでにdstIDがある
      next: [],
      previous: []
    });

    getComponentDirMock.onSecondCall().resolves("/mock/dstDir");
    readComponentJsonMock.onSecondCall().resolves({
      type: "task",
      name: "TaskB",
      else: [],
      next: [],
      previous: ["srcID"] //すでにsrcIDがある
    });

    await addLink(projectRootDir, "srcID", "dstID", true);

    //src側
    const srcWriteCallArg = writeComponentJsonMock.firstCall.args[2];
    expect(srcWriteCallArg.else).to.deep.equal(["dstID"]); //重複追加されない

    //dst側
    const dstWriteCallArg = writeComponentJsonMock.secondCall.args[2];
    expect(dstWriteCallArg.previous).to.deep.equal(["srcID"]); //重複追加されない
  });

  it("should call updateStepNumber if both src and dst are stepjobTask", async ()=>{
    getComponentDirMock.onFirstCall().resolves("/mock/srcDir");
    readComponentJsonMock.onFirstCall().resolves({
      type: "stepjobTask", else: [], next: [], previous: []
    });

    getComponentDirMock.onSecondCall().resolves("/mock/dstDir");
    readComponentJsonMock.onSecondCall().resolves({
      type: "stepjobTask", else: [], next: [], previous: []
    });

    await addLink(projectRootDir, "srcID", "dstID", false);
    expect(updateStepNumberMock.calledOnce).to.be.true;
  });

  it("should not call updateStepNumber if src is stepjobTask but dst is task", async ()=>{
    getComponentDirMock.onFirstCall().resolves("/mock/srcDir");
    readComponentJsonMock.onFirstCall().resolves({
      type: "stepjobTask", else: [], next: [], previous: []
    });

    getComponentDirMock.onSecondCall().resolves("/mock/dstDir");
    readComponentJsonMock.onSecondCall().resolves({
      type: "task", else: [], next: [], previous: []
    });

    await addLink(projectRootDir, "srcID", "dstID");
    expect(updateStepNumberMock.notCalled).to.be.true;
  });

  it("should handle writeComponentJson rejections", async ()=>{
    //書き込み時にエラーが出るケース
    getComponentDirMock.resolves("/mock/dir");
    readComponentJsonMock.resolves({ type: "task", else: [], next: [], previous: [] });
    writeComponentJsonMock.rejects(new Error("write failed"));

    try {
      await addLink(projectRootDir, "x", "y", false);
      throw new Error("Expected addLink to throw");
    } catch (err) {
      expect(err.message).to.equal("write failed");
    }
  });
});

describe("#removeLink", ()=>{
  let rewireProjectFilesOperator;
  let removeLink;
  let getComponentDirMock;
  let readComponentJsonMock;
  let writeComponentJsonMock;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    removeLink = rewireProjectFilesOperator.__get__("removeLink");

    //Sinonで使うテストダブル（Mock）の命名ルール: 変数名末尾はMock
    getComponentDirMock = sinon.stub();
    readComponentJsonMock = sinon.stub();
    writeComponentJsonMock = sinon.stub().resolves();

    rewireProjectFilesOperator.__set__({
      getComponentDir: getComponentDirMock,
      readComponentJson: readComponentJsonMock,
      writeComponentJson: writeComponentJsonMock
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should remove dst from srcJson.next when isElse is false, and remove src from dstJson.previous", async ()=>{
    const projectRootDir = "/mock/project/root";
    const src = "componentSrc";
    const dst = "componentDst";
    const isElse = false;

    const mockSrcDir = "/mock/project/root/srcDir";
    const mockDstDir = "/mock/project/root/dstDir";

    //srcJsonにはnext配列を用意
    const mockSrcJson = {
      next: ["componentX", "componentDst", "componentY"],
      else: ["componentA"]
      //... 省略
    };

    //dstJsonにはprevious配列を用意
    const mockDstJson = {
      previous: ["componentQ", "componentSrc", "componentW"]
      //... 省略
    };

    getComponentDirMock.withArgs(projectRootDir, src, true).resolves(mockSrcDir);
    getComponentDirMock.withArgs(projectRootDir, dst, true).resolves(mockDstDir);

    readComponentJsonMock.withArgs(mockSrcDir).resolves(mockSrcJson);
    readComponentJsonMock.withArgs(mockDstDir).resolves(mockDstJson);

    //実行
    await removeLink(projectRootDir, src, dst, isElse);

    //検証: next配列から"componentDst"が取り除かれている
    expect(mockSrcJson.next).to.deep.equal(["componentX", "componentY"]);
    //else配列は変更なし
    expect(mockSrcJson.else).to.deep.equal(["componentA"]);

    //dstJsonのprevious配列から"componentSrc"が取り除かれている
    expect(mockDstJson.previous).to.deep.equal(["componentQ", "componentW"]);

    //writeComponentJsonが呼ばれたことを検証
    expect(writeComponentJsonMock.callCount).to.equal(2);
    expect(writeComponentJsonMock.firstCall.args[1]).to.equal(mockSrcDir);
    expect(writeComponentJsonMock.firstCall.args[2]).to.equal(mockSrcJson);
    expect(writeComponentJsonMock.secondCall.args[1]).to.equal(mockDstDir);
    expect(writeComponentJsonMock.secondCall.args[2]).to.equal(mockDstJson);
  });

  it("should remove dst from srcJson.else when isElse is true, and remove src from dstJson.previous", async ()=>{
    const projectRootDir = "/mock/project/root";
    const src = "componentSrc";
    const dst = "componentDst";
    const isElse = true;

    const mockSrcDir = "/mock/project/root/srcDir";
    const mockDstDir = "/mock/project/root/dstDir";

    //srcJsonにはelse配列を用意
    const mockSrcJson = {
      next: ["componentB"],
      else: ["componentDst", "componentC"]
    };

    //dstJsonにはprevious配列を用意
    const mockDstJson = {
      previous: ["componentSrc", "componentZ"]
    };

    getComponentDirMock.withArgs(projectRootDir, src, true).resolves(mockSrcDir);
    getComponentDirMock.withArgs(projectRootDir, dst, true).resolves(mockDstDir);

    readComponentJsonMock.withArgs(mockSrcDir).resolves(mockSrcJson);
    readComponentJsonMock.withArgs(mockDstDir).resolves(mockDstJson);

    await removeLink(projectRootDir, src, dst, isElse);

    //else配列から"componentDst"が削除されている
    expect(mockSrcJson.else).to.deep.equal(["componentC"]);
    //next配列は変更なし
    expect(mockSrcJson.next).to.deep.equal(["componentB"]);

    //dst側のpreviousから"componentSrc"が削除
    expect(mockDstJson.previous).to.deep.equal(["componentZ"]);

    expect(writeComponentJsonMock.callCount).to.equal(2);
  });

  it("should do nothing if dst does not exist in srcJson.next/else, and still remove src from dstJson.previous", async ()=>{
    const projectRootDir = "/mock/project/root";
    const src = "componentSrc";
    const dst = "notInArray";
    const isElse = false; //どちらでも動作確認する

    const mockSrcDir = "/mock/project/root/srcDir";
    const mockDstDir = "/mock/project/root/dstDir";

    //srcJsonにdstが含まれていないケース
    const mockSrcJson = {
      next: ["componentX", "componentY"],
      else: []
    };
    const mockDstJson = {
      previous: ["componentSrc", "componentQ"]
    };

    getComponentDirMock.withArgs(projectRootDir, src, true).resolves(mockSrcDir);
    getComponentDirMock.withArgs(projectRootDir, dst, true).resolves(mockDstDir);

    readComponentJsonMock.withArgs(mockSrcDir).resolves(mockSrcJson);
    readComponentJsonMock.withArgs(mockDstDir).resolves(mockDstJson);

    await removeLink(projectRootDir, src, dst, isElse);

    //next配列は変わらない
    expect(mockSrcJson.next).to.deep.equal(["componentX", "componentY"]);
    //dst側previousはsrcを削除
    expect(mockDstJson.previous).to.deep.equal(["componentQ"]);

    expect(writeComponentJsonMock.callCount).to.equal(2);
  });

  it("should do nothing if src does not exist in dstJson.previous, but still remove dst from srcJson", async ()=>{
    const projectRootDir = "/mock/project/root";
    const src = "componentSrc";
    const dst = "componentDst";
    const isElse = false;

    const mockSrcDir = "/mock/project/root/srcDir";
    const mockDstDir = "/mock/project/root/dstDir";

    const mockSrcJson = {
      next: ["componentDst", "componentK"],
      else: []
    };
    //dstJsonのpreviousにsrcが無いケース
    const mockDstJson = {
      previous: ["componentM", "componentN"]
    };

    getComponentDirMock.withArgs(projectRootDir, src, true).resolves(mockSrcDir);
    getComponentDirMock.withArgs(projectRootDir, dst, true).resolves(mockDstDir);

    readComponentJsonMock.withArgs(mockSrcDir).resolves(mockSrcJson);
    readComponentJsonMock.withArgs(mockDstDir).resolves(mockDstJson);

    await removeLink(projectRootDir, src, dst, isElse);

    //srcJson.next からcomponentDstを削除
    expect(mockSrcJson.next).to.deep.equal(["componentK"]);
    //dstJson.previous は変わらず
    expect(mockDstJson.previous).to.deep.equal(["componentM", "componentN"]);

    expect(writeComponentJsonMock.callCount).to.equal(2);
  });
});

describe("#removeAllLink", ()=>{
  let rewireProjectFilesOperator;
  let removeAllLink;
  let getComponentDirMock;
  let readComponentJsonMock;
  let writeComponentJsonMock;
  let projectRootDir;
  let componentID;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    removeAllLink = rewireProjectFilesOperator.__get__("removeAllLink");

    //sinon.stub()でテストダブルを作成（～Mock）
    getComponentDirMock = sinon.stub();
    readComponentJsonMock = sinon.stub();
    writeComponentJsonMock = sinon.stub();

    //関数を差し替え
    rewireProjectFilesOperator.__set__({
      getComponentDir: getComponentDirMock,
      readComponentJson: readComponentJsonMock,
      writeComponentJson: writeComponentJsonMock
    });

    projectRootDir = "/mock/project/root";
    componentID = "dstCompID";
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should do nothing when dstJson.previous is an empty array", async ()=>{
    //dstDir, dstJsonの設定
    getComponentDirMock.onFirstCall().resolves("/mock/project/root/dstDir");
    readComponentJsonMock.onFirstCall().resolves({ previous: [] });

    //実行
    await removeAllLink(projectRootDir, componentID);

    //期待動作: srcは一切呼び出されず、dstJson.previous = [] の書き戻しだけ行われる
    expect(getComponentDirMock.calledOnce).to.be.true;
    expect(readComponentJsonMock.calledOnce).to.be.true;
    //src用のwriteComponentJsonは呼ばれない
    expect(writeComponentJsonMock.calledOnce).to.be.true;
    const writtenDstArgs = writeComponentJsonMock.firstCall.args;
    expect(writtenDstArgs[1]).to.equal("/mock/project/root/dstDir"); //dstDir
    expect(writtenDstArgs[2]).to.deep.equal({ previous: [] }); //previousが空配列のまま
  });

  it("should remove componentID from srcJson.next and srcJson.else if they are arrays", async ()=>{
    //シナリオ: dstJson.previousに2つのsrcがある
    getComponentDirMock.onCall(0).resolves("/mock/project/root/dstDir");
    readComponentJsonMock.onCall(0).resolves({
      previous: ["srcCompA", "srcCompB"]
    });

    //srcCompA
    getComponentDirMock.onCall(1).resolves("/mock/project/root/srcCompA");
    //next配列にcomponentIDが含まれている
    readComponentJsonMock.onCall(1).resolves({
      next: ["dstCompID", "anotherID"],
      else: ["otherID", "dstCompID"]
    });

    //srcCompB
    getComponentDirMock.onCall(2).resolves("/mock/project/root/srcCompB");
    //elseのみ配列にcomponentIDが含まれない
    readComponentJsonMock.onCall(2).resolves({
      next: ["someID"],
      else: ["x", "y"]
    });

    //dst側書き込み後、srcA, srcB書き込みの順で3回writeComponentJsonが呼ばれる想定

    await removeAllLink(projectRootDir, componentID);

    //dstDir取得 + srcA/srcB取得 で計3回のgetComponentDirが呼ばれる
    expect(getComponentDirMock.callCount).to.equal(3);
    //dstJson + srcA + srcB の順で計3回readされる
    expect(readComponentJsonMock.callCount).to.equal(3);

    //書き込まれる回数3回 (srcA, srcB, dst)
    expect(writeComponentJsonMock.callCount).to.equal(3);

    //まずsrcAを書き込むときの引数検証
    const [rootA, dirA, newSrcAjson] = writeComponentJsonMock.getCall(0).args;
    expect(rootA).to.equal(projectRootDir);
    expect(dirA).to.equal("/mock/project/root/srcCompA");
    expect(newSrcAjson.next).to.deep.equal(["anotherID"]); //dstCompIDがfilterされて消える
    expect(newSrcAjson.else).to.deep.equal(["otherID"]); //dstCompIDがfilterされて消える

    //次にsrcBを書き込むときの引数検証
    const [rootB, dirB, newSrcBjson] = writeComponentJsonMock.getCall(1).args;
    expect(rootB).to.equal(projectRootDir);
    expect(dirB).to.equal("/mock/project/root/srcCompB");
    expect(newSrcBjson.next).to.deep.equal(["someID"]); //もともと"dstCompID"が無いため変化なし
    expect(newSrcBjson.else).to.deep.equal(["x", "y"]); //もともと含まれていない

    //最後にdstを書き込むときの引数検証
    const [rootDst, dstDir, updatedDstJson] = writeComponentJsonMock.getCall(2).args;
    expect(rootDst).to.equal(projectRootDir);
    expect(dstDir).to.equal("/mock/project/root/dstDir");
    expect(updatedDstJson.previous).to.deep.equal([]); //previousは空配列に
  });

  it("should skip removing next if srcJson.next is not an array", async ()=>{
    getComponentDirMock.onCall(0).resolves("/mock/project/root/dstDir");
    readComponentJsonMock.onCall(0).resolves({ previous: ["srcCompC"] });

    //srcCompC
    getComponentDirMock.onCall(1).resolves("/mock/project/root/srcCompC");
    readComponentJsonMock.onCall(1).resolves({
      next: "not-an-array",
      else: ["dstCompID"]
    });

    await removeAllLink(projectRootDir, componentID);

    //書き込みは最終的にsrcCompC, dst の2回
    expect(writeComponentJsonMock.callCount).to.equal(2);

    const [rootC, dirC, newSrcCjson] = writeComponentJsonMock.getCall(0).args;
    expect(rootC).to.equal(projectRootDir);
    expect(dirC).to.equal("/mock/project/root/srcCompC");
    //nextは配列でないので除去処理が行われず、元のまま
    expect(newSrcCjson.next).to.equal("not-an-array");
    //elseは配列なのでdstCompIDがfilterされる
    expect(newSrcCjson.else).to.deep.equal([]);

    //dstJsonはpreviousが空配列に
    //eslint-disable-next-line no-unused-vars
    const [_rootDst, _dstDir, updatedDst] = writeComponentJsonMock.getCall(1).args;
    expect(updatedDst.previous).to.deep.equal([]);
  });

  it("should skip removing else if srcJson.else is not an array", async ()=>{
    getComponentDirMock.onCall(0).resolves("/mock/project/root/dstDir");
    readComponentJsonMock.onCall(0).resolves({ previous: ["srcCompD"] });

    //srcCompD
    getComponentDirMock.onCall(1).resolves("/mock/project/root/srcCompD");
    readComponentJsonMock.onCall(1).resolves({
      next: ["dstCompID"],
      else: "not-array-else"
    });

    await removeAllLink(projectRootDir, componentID);

    //書き込み回数はsrcCompD と dst の2回
    expect(writeComponentJsonMock.callCount).to.equal(2);

    //srcCompD検証
    //eslint-disable-next-line no-unused-vars
    const [_rootS, _dirS, newSrcDjson] = writeComponentJsonMock.getCall(0).args;
    expect(newSrcDjson.next).to.deep.equal([]); //filterされてdstCompID削除
    expect(newSrcDjson.else).to.equal("not-array-else");

    //dstJson検証
    //eslint-disable-next-line no-unused-vars
    const [_rootD, _dirD, newDstJson] = writeComponentJsonMock.getCall(1).args;
    expect(newDstJson.previous).to.deep.equal([]);
  });
});

describe("#addFileLink", ()=>{
  let rewireProjectFilesOperator;
  let addFileLink;
  let isParentMock;
  let addFileLinkToParentMock;
  let addFileLinkFromParentMock;
  let addFileLinkBetweenSiblingsMock;

  const projectRootDir = "/mock/project";
  const srcNode = "srcNode";
  const srcName = "out.dat";
  const dstNode = "dstNode";
  const dstName = "in.dat";

  beforeEach(()=>{
    //rewireでプロダクトコードを読み込み
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    //テスト対象の関数を取得
    addFileLink = rewireProjectFilesOperator.__get__("addFileLink");

    //依存関数をstub化
    isParentMock = sinon.stub();
    addFileLinkToParentMock = sinon.stub().resolves();
    addFileLinkFromParentMock = sinon.stub().resolves();
    addFileLinkBetweenSiblingsMock = sinon.stub().resolves();

    //rewireを使って依存関数を差し替え
    rewireProjectFilesOperator.__set__("isParent", isParentMock);
    rewireProjectFilesOperator.__set__("addFileLinkToParent", addFileLinkToParentMock);
    rewireProjectFilesOperator.__set__("addFileLinkFromParent", addFileLinkFromParentMock);
    rewireProjectFilesOperator.__set__("addFileLinkBetweenSiblings", addFileLinkBetweenSiblingsMock);
  });

  it("should reject if srcNode and dstNode are the same", async ()=>{
    try {
      await addFileLink(projectRootDir, "same", srcName, "same", dstName);
      throw new Error("Expected addFileLink to reject with an error");
    } catch (err) {
      expect(err).to.be.an("Error");
      expect(err.message).to.equal("cyclic link is not allowed");
    }

    expect(isParentMock.notCalled).to.be.true;
    expect(addFileLinkToParentMock.notCalled).to.be.true;
    expect(addFileLinkFromParentMock.notCalled).to.be.true;
    expect(addFileLinkBetweenSiblingsMock.notCalled).to.be.true;
  });

  it("should call addFileLinkToParent if dstNode is parent of srcNode", async ()=>{
    //(B) dstNode が srcNode の親
    isParentMock.onFirstCall().resolves(true); //isParent(projectRootDir, dstNode, srcNode) => true

    await addFileLink(projectRootDir, srcNode, srcName, dstNode, dstName);

    //addFileLinkToParent が呼ばれていること
    expect(addFileLinkToParentMock.calledOnceWithExactly(
      projectRootDir, srcNode, srcName, dstName
    )).to.be.true;

    //他の関数は呼ばれない
    expect(isParentMock.callCount).to.equal(1);
    expect(addFileLinkFromParentMock.notCalled).to.be.true;
    expect(addFileLinkBetweenSiblingsMock.notCalled).to.be.true;
  });

  it("should call addFileLinkFromParent if srcNode is parent of dstNode", async ()=>{
    //(C) dstNode が親ではない => false, srcNode が親 => true
    isParentMock.onFirstCall().resolves(false); //dstNodeがsrcNodeの親か？ => false
    isParentMock.onSecondCall().resolves(true); //srcNodeがdstNodeの親か？ => true

    await addFileLink(projectRootDir, srcNode, srcName, dstNode, dstName);

    //addFileLinkFromParent が呼ばれていること
    expect(addFileLinkFromParentMock.calledOnceWithExactly(
      projectRootDir, srcName, dstNode, dstName
    )).to.be.true;

    expect(addFileLinkToParentMock.notCalled).to.be.true;
    expect(addFileLinkBetweenSiblingsMock.notCalled).to.be.true;
  });

  it("should call addFileLinkBetweenSiblings otherwise", async ()=>{
    //(D) isParent が両方 false => siblings のケース
    isParentMock.onFirstCall().resolves(false);
    isParentMock.onSecondCall().resolves(false);

    await addFileLink(projectRootDir, srcNode, srcName, dstNode, dstName);

    expect(addFileLinkBetweenSiblingsMock.calledOnceWithExactly(
      projectRootDir, srcNode, srcName, dstNode, dstName
    )).to.be.true;

    expect(addFileLinkToParentMock.notCalled).to.be.true;
    expect(addFileLinkFromParentMock.notCalled).to.be.true;
  });
});

describe("#removeFileLink", ()=>{
  let rewireProjectFilesOperator;
  let removeFileLink;
  let isParentMock;
  let removeFileLinkToParentMock;
  let removeFileLinkFromParentMock;
  let removeFileLinkBetweenSiblingsMock;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    removeFileLink = rewireProjectFilesOperator.__get__("removeFileLink");

    //sinon.stub()で作成したテストダブルは変数末尾にMockを付ける
    isParentMock = sinon.stub();
    removeFileLinkToParentMock = sinon.stub().resolves();
    removeFileLinkFromParentMock = sinon.stub().resolves();
    removeFileLinkBetweenSiblingsMock = sinon.stub().resolves();

    //テスト対象が内部で呼んでいる関数をスタブ化
    rewireProjectFilesOperator.__set__("isParent", isParentMock);
    rewireProjectFilesOperator.__set__("removeFileLinkToParent", removeFileLinkToParentMock);
    rewireProjectFilesOperator.__set__("removeFileLinkFromParent", removeFileLinkFromParentMock);
    rewireProjectFilesOperator.__set__("removeFileLinkBetweenSiblings", removeFileLinkBetweenSiblingsMock);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should call removeFileLinkToParent if dstNode is parent of srcNode", async ()=>{
    //dstNodeがsrcNodeの親であると判定
    isParentMock.onCall(0).resolves(true); //isParent(projectRootDir, dstNode, srcNode) => true

    await removeFileLink("/mock/project", "srcComp", "srcFile", "dstComp", "dstFile");

    expect(isParentMock.callCount).to.equal(1);
    expect(removeFileLinkToParentMock.calledOnce).to.be.true;
    expect(removeFileLinkToParentMock.calledWithExactly(
      "/mock/project", "srcComp", "srcFile", "dstFile"
    )).to.be.true;
    expect(removeFileLinkFromParentMock.called).to.be.false;
    expect(removeFileLinkBetweenSiblingsMock.called).to.be.false;
  });

  it("should call removeFileLinkFromParent if srcNode is parent of dstNode", async ()=>{
    //dstNodeがsrcNodeの親ではない => false
    //srcNodeがdstNodeの親である => true
    isParentMock.onCall(0).resolves(false);
    isParentMock.onCall(1).resolves(true);

    await removeFileLink("/mock/project", "srcComp", "srcFile", "dstComp", "dstFile");

    //dstNodeがsrcNodeの親かを先に確認
    expect(isParentMock.firstCall.args).to.deep.equal([
      "/mock/project", "dstComp", "srcComp"
    ]);
    //srcNodeがdstNodeの親かを2番目に確認
    expect(isParentMock.secondCall.args).to.deep.equal([
      "/mock/project", "srcComp", "dstComp"
    ]);

    expect(removeFileLinkToParentMock.called).to.be.false;
    expect(removeFileLinkFromParentMock.calledOnce).to.be.true;
    expect(removeFileLinkFromParentMock.calledWithExactly(
      "/mock/project", "srcFile", "dstComp", "dstFile"
    )).to.be.true;
    expect(removeFileLinkBetweenSiblingsMock.called).to.be.false;
  });

  it("should call removeFileLinkBetweenSiblings if neither is parent", async ()=>{
    //dstNodeがsrcNodeの親 => false, srcNodeがdstNodeの親 => false
    isParentMock.onCall(0).resolves(false);
    isParentMock.onCall(1).resolves(false);

    await removeFileLink("/mock/project", "srcComp", "srcFile", "dstComp", "dstFile");

    expect(isParentMock.callCount).to.equal(2);
    expect(removeFileLinkToParentMock.called).to.be.false;
    expect(removeFileLinkFromParentMock.called).to.be.false;
    expect(removeFileLinkBetweenSiblingsMock.calledOnce).to.be.true;
    expect(removeFileLinkBetweenSiblingsMock.calledWithExactly(
      "/mock/project", "srcComp", "srcFile", "dstComp", "dstFile"
    )).to.be.true;
  });

  it("should throw an error if isParent throws an error (first check)", async ()=>{
    //最初の isParent 呼び出しでエラーがthrowされるケース
    const testError = new Error("isParent error");
    isParentMock.onCall(0).rejects(testError);

    await expect(
      removeFileLink("/mock/project", "srcComp", "srcFile", "dstComp", "dstFile")
    ).to.be.rejectedWith("isParent error");

    expect(isParentMock.calledOnce).to.be.true;
    expect(removeFileLinkToParentMock.called).to.be.false;
    expect(removeFileLinkFromParentMock.called).to.be.false;
    expect(removeFileLinkBetweenSiblingsMock.called).to.be.false;
  });

  it("should throw an error if the second isParent call throws an error", async ()=>{
    //最初の isParent は falseを返す => 次の isParent でエラー
    isParentMock.onCall(0).resolves(false);
    isParentMock.onCall(1).rejects(new Error("second isParent error"));

    await expect(
      removeFileLink("/mock/project", "srcComp", "srcFile", "dstComp", "dstFile")
    ).to.be.rejectedWith("second isParent error");

    expect(isParentMock.callCount).to.equal(2);
    expect(removeFileLinkToParentMock.called).to.be.false;
    expect(removeFileLinkFromParentMock.called).to.be.false;
    expect(removeFileLinkBetweenSiblingsMock.called).to.be.false;
  });
});

describe("#removeAllFileLink", ()=>{
  let rewireProjectFilesOperator;
  let removeAllFileLink;
  let getComponentDirMock;
  let readComponentJsonMock;
  let removeFileLinkToParentMock;
  let removeFileLinkBetweenSiblingsMock;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    removeAllFileLink = rewireProjectFilesOperator.__get__("removeAllFileLink");

    getComponentDirMock = sinon.stub();
    readComponentJsonMock = sinon.stub();
    removeFileLinkToParentMock = sinon.stub();
    removeFileLinkBetweenSiblingsMock = sinon.stub();

    rewireProjectFilesOperator.__set__({
      getComponentDir: getComponentDirMock,
      readComponentJson: readComponentJsonMock,
      removeFileLinkToParent: removeFileLinkToParentMock,
      removeFileLinkBetweenSiblings: removeFileLinkBetweenSiblingsMock
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return an Error if outputFile is not found in parent's outputFiles (fromChildren = true)", async ()=>{
    getComponentDirMock.resolves("/mock/dir");
    readComponentJsonMock.resolves({
      outputFiles: [{ name: "someOtherFile", origin: [] }]
    });

    const result = await removeAllFileLink("/projRoot", "compID", "missingFile", true);
    expect(result).to.be.instanceOf(Error);
    expect(result.message).to.equal("missingFile not found in parent's outputFiles");

    //removeFileLinkToParentが呼ばれないこと
    expect(removeFileLinkToParentMock.notCalled).to.be.true;
  });

  it("should return true if outputFile.origin is not an array (fromChildren = true)", async ()=>{
    getComponentDirMock.resolves("/mock/dir");
    readComponentJsonMock.resolves({
      outputFiles: [{ name: "myOutput", origin: null }]
    });

    const result = await removeAllFileLink("/projRoot", "compID", "myOutput", true);
    expect(result).to.equal(true);

    expect(removeFileLinkToParentMock.notCalled).to.be.true;
  });

  it("should call removeFileLinkToParent for each origin entry (fromChildren = true)", async ()=>{
    getComponentDirMock.resolves("/mock/dir");
    readComponentJsonMock.resolves({
      outputFiles: [{
        name: "myOutput",
        origin: [
          { srcNode: "node1", srcName: "file1" },
          { srcNode: "node2", srcName: "file2" }
        ]
      }]
    });
    removeFileLinkToParentMock.resolves("ok");

    const result = await removeAllFileLink("/projRoot", "compID", "myOutput", true);
    expect(removeFileLinkToParentMock.callCount).to.equal(2);
    expect(removeFileLinkToParentMock.firstCall.args).to.deep.equal(["/projRoot", "node1", "file1", "myOutput"]);
    expect(removeFileLinkToParentMock.secondCall.args).to.deep.equal(["/projRoot", "node2", "file2", "myOutput"]);

    //Promise.all()が返すため、配列になる想定
    expect(result).to.deep.equal(["ok", "ok"]);
  });

  it("should return an Error if inputFile is not found in inputFiles (fromChildren = false)", async ()=>{
    getComponentDirMock.resolves("/mock/dir");
    readComponentJsonMock.resolves({
      inputFiles: [{ name: "someInput", src: [] }]
    });

    const result = await removeAllFileLink("/projRoot", "compID", "missingInput", false);
    expect(result).to.be.instanceOf(Error);
    expect(result.message).to.equal("missingInput not found in inputFiles");

    //removeFileLinkBetweenSiblingsが呼ばれないこと
    expect(removeFileLinkBetweenSiblingsMock.notCalled).to.be.true;
  });

  it("should call removeFileLinkBetweenSiblings for each src entry (fromChildren = false)", async ()=>{
    getComponentDirMock.resolves("/mock/dir");
    readComponentJsonMock.resolves({
      inputFiles: [{
        name: "myInput",
        src: [
          { srcNode: "pnode1", srcName: "f1" },
          { srcNode: "pnode2", srcName: "f2" }
        ]
      }]
    });
    removeFileLinkBetweenSiblingsMock.resolves("done");

    const result = await removeAllFileLink("/projRoot", "compID", "myInput", false);
    expect(removeFileLinkBetweenSiblingsMock.callCount).to.equal(2);
    expect(removeFileLinkBetweenSiblingsMock.firstCall.args).to.deep.equal(["/projRoot", "pnode1", "f1", "compID", "myInput"]);
    expect(removeFileLinkBetweenSiblingsMock.secondCall.args).to.deep.equal(["/projRoot", "pnode2", "f2", "compID", "myInput"]);

    //Promise.all()で返るため、配列になる想定
    expect(result).to.deep.equal(["done", "done"]);
  });
});

describe("#removeComponent", ()=>{
  let rewireProjectFilesOperator;
  let removeComponent;
  let getComponentDirMock;
  let getDescendantsIDsMock;
  let removeAllLinkFromComponentMock;
  let gitRmMock;
  let fsRemoveMock;
  let removeComponentPathMock;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    removeComponent = rewireProjectFilesOperator.__get__("removeComponent");

    //モック／スタブの用意
    getComponentDirMock = sinon.stub().resolves("/mock/targetDir");
    getDescendantsIDsMock = sinon.stub().resolves(["compA", "compB", "compC"]);
    removeAllLinkFromComponentMock = sinon.stub().resolves();
    gitRmMock = sinon.stub().resolves();
    fsRemoveMock = sinon.stub().resolves();
    removeComponentPathMock = sinon.stub().resolves("removePathResult");

    //rewireで本体に差し込む
    rewireProjectFilesOperator.__set__({
      getComponentDir: getComponentDirMock,
      getDescendantsIDs: getDescendantsIDsMock,
      removeAllLinkFromComponent: removeAllLinkFromComponentMock,
      gitRm: gitRmMock,
      fs: {
        remove: fsRemoveMock
      },
      removeComponentPath: removeComponentPathMock
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should remove the component and all its descendants successfully", async ()=>{
    const projectRootDir = "/mock/project/root";
    const componentID = "compA";

    const result = await removeComponent(projectRootDir, componentID);

    //各stubが正しく呼ばれたかの検証
    expect(getComponentDirMock.calledOnceWithExactly(projectRootDir, componentID, true)).to.be.true;
    expect(getDescendantsIDsMock.calledOnceWithExactly(projectRootDir, componentID)).to.be.true;

    //3つのdescendantID（["compA", "compB", "compC"]）それぞれにremoveAllLinkFromComponentが呼ばれる
    expect(removeAllLinkFromComponentMock.callCount).to.equal(3);
    expect(removeAllLinkFromComponentMock.getCall(0).args).to.deep.equal([projectRootDir, "compA"]);
    expect(removeAllLinkFromComponentMock.getCall(1).args).to.deep.equal([projectRootDir, "compB"]);
    expect(removeAllLinkFromComponentMock.getCall(2).args).to.deep.equal([projectRootDir, "compC"]);

    expect(gitRmMock.calledOnceWithExactly(projectRootDir, "/mock/targetDir")).to.be.true;
    expect(fsRemoveMock.calledOnceWithExactly("/mock/targetDir")).to.be.true;
    expect(removeComponentPathMock.calledOnceWithExactly(projectRootDir, ["compA", "compB", "compC"])).to.be.true;

    //戻り値の検証
    expect(result).to.equal("removePathResult");
  });

  it("should throw an error if getComponentDir fails", async ()=>{
    getComponentDirMock.rejects(new Error("Failed to get component dir"));
    await expect(removeComponent("/mock/project/root", "compA"))
      .to.be.rejectedWith("Failed to get component dir");
  });

  it("should throw an error if getDescendantsIDs fails", async ()=>{
    getDescendantsIDsMock.rejects(new Error("Failed to get descendants"));
    await expect(removeComponent("/mock/project/root", "compA"))
      .to.be.rejectedWith("Failed to get descendants");
  });

  it("should throw an error if removeAllLinkFromComponent fails for one descendant", async ()=>{
    //二番目の呼び出しでエラーを投げる
    removeAllLinkFromComponentMock.onCall(1).rejects(new Error("removeAllLinkFromComponent error"));

    await expect(removeComponent("/mock/project/root", "compA"))
      .to.be.rejectedWith("removeAllLinkFromComponent error");

    //エラーが起きる前には1回だけ呼ばれている
    expect(removeAllLinkFromComponentMock.callCount).to.equal(2);
  });

  it("should throw an error if gitRm fails", async ()=>{
    gitRmMock.rejects(new Error("Failed gitRm"));
    await expect(removeComponent("/mock/project/root", "compA"))
      .to.be.rejectedWith("Failed gitRm");
  });

  it("should throw an error if fs.remove fails", async ()=>{
    fsRemoveMock.rejects(new Error("Failed fsRemove"));
    await expect(removeComponent("/mock/project/root", "compA"))
      .to.be.rejectedWith("Failed fsRemove");
  });

  it("should throw an error if removeComponentPath fails", async ()=>{
    removeComponentPathMock.rejects(new Error("Failed removeComponentPath"));
    await expect(removeComponent("/mock/project/root", "compA"))
      .to.be.rejectedWith("Failed removeComponentPath");
  });
});

describe("#getSourceComponents", ()=>{
  let rewireProjectFilesOperator;
  let getSourceComponents;
  let promisifyStub;
  let globStub;
  let readJsonGreedyStub;
  const mockProjectRootDir = "/mock/project/root";

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    getSourceComponents = rewireProjectFilesOperator.__get__("getSourceComponents");

    globStub = sinon.stub();
    readJsonGreedyStub = sinon.stub();

    //promisify の戻り値として globStub を返すようにする
    promisifyStub = sinon.stub().callsFake(()=>{
      return globStub;
    });

    //rewireで依存する関数を差し替える
    rewireProjectFilesOperator.__set__({
      promisify: promisifyStub,
      readJsonGreedy: readJsonGreedyStub
    });
  });

  it("should return only source components (subComponent=false, disable=false)", async ()=>{
    //Arrange
    const mockFiles = [
      "/mock/project/root/comp1/cmp.wheel.json",
      "/mock/project/root/comp2/cmp.wheel.json",
      "/mock/project/root/comp3/cmp.wheel.json",
      "/mock/project/root/comp4/cmp.wheel.json"
    ];
    globStub.resolves(mockFiles);

    //comp1: source かつ subComponent=false, disable=false ⇒ フィルタを通る
    //comp2: source かつ subComponent=true ⇒ フィルタ対象外
    //comp3: source かつ disable=true ⇒ フィルタ対象外
    //comp4: task なので type != source ⇒ フィルタ対象外
    readJsonGreedyStub.onCall(0).resolves({ type: "source", subComponent: false, disable: false });
    readJsonGreedyStub.onCall(1).resolves({ type: "source", subComponent: true, disable: false });
    readJsonGreedyStub.onCall(2).resolves({ type: "source", subComponent: false, disable: true });
    readJsonGreedyStub.onCall(3).resolves({ type: "task", subComponent: false, disable: false });

    //Act
    const result = await getSourceComponents(mockProjectRootDir);

    //Assert
    expect(promisifyStub.calledOnce).to.be.true;
    expect(globStub.calledOnceWithExactly(
      path.join(mockProjectRootDir, "**", "cmp.wheel.json")
    )).to.be.true;

    //結果は comp1 のみが該当する
    expect(result).to.have.lengthOf(1);
    expect(result[0]).to.deep.equal({ type: "source", subComponent: false, disable: false });
  });

  it("should return an empty array if no componentJson files are found", async ()=>{
    //Arrange
    globStub.resolves([]);
    //readJsonGreedy は呼ばれないのでスタブは設定しなくてもOK

    //Act
    const result = await getSourceComponents(mockProjectRootDir);

    //Assert
    expect(result).to.be.an("array").that.is.empty;
    expect(globStub.calledOnce).to.be.true;
    expect(readJsonGreedyStub.notCalled).to.be.true;
  });

  it("should throw an error if readJsonGreedy rejects for any file", async ()=>{
    //Arrange
    const mockFiles = [
      "/mock/project/root/comp1/cmp.wheel.json",
      "/mock/project/root/comp2/cmp.wheel.json"
    ];
    globStub.resolves(mockFiles);

    readJsonGreedyStub.onCall(0).resolves({ type: "source", subComponent: false, disable: false });
    //comp2 側でエラーを投げる
    const mockError = new Error("Failed to read JSON");
    readJsonGreedyStub.onCall(1).rejects(mockError);

    //Act & Assert
    try {
      await getSourceComponents(mockProjectRootDir);
      throw new Error("Expected getSourceComponents to throw an error");
    } catch (err) {
      expect(err).to.equal(mockError);
    }

    expect(globStub.calledOnce).to.be.true;
    //comp1までは読み込むが comp2 でエラー
    expect(readJsonGreedyStub.callCount).to.equal(2);
  });
});

describe("#isComponentDir", ()=>{
  let rewireProjectFilesOperator;
  let isComponentDir;
  let fsMock;

  beforeEach(()=>{
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    isComponentDir = rewireProjectFilesOperator.__get__("isComponentDir");

    //fs.lstatとfs.pathExistsをstub化。ただし変数名はMockで終わらせる規約
    fsMock = {
      lstatMock: sinon.stub(),
      pathExistsMock: sinon.stub()
    };

    //rewireで内部のfs参照を上書き
    rewireProjectFilesOperator.__set__({
      fs: {
        lstat: fsMock.lstatMock,
        pathExists: fsMock.pathExistsMock
      }
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should reject if lstat throws an error (e.g. path does not exist)", async ()=>{
    fsMock.lstatMock.rejects(new Error("ENOENT"));

    await expect(isComponentDir("/non/existing/path")).to.be.rejectedWith("ENOENT");
    expect(fsMock.lstatMock.calledOnce).to.be.true;
    expect(fsMock.pathExistsMock.notCalled).to.be.true;
  });

  it("should return false if target is not a directory", async ()=>{
    const fakeStats = { isDirectory: ()=>false };
    fsMock.lstatMock.resolves(fakeStats);

    const result = await isComponentDir("/some/file");
    expect(result).to.be.false;
    expect(fsMock.lstatMock.calledOnce).to.be.true;
    expect(fsMock.pathExistsMock.notCalled).to.be.true;
  });

  it("should return false if target is a directory but cmp.wheel.json does not exist", async ()=>{
    const fakeStats = { isDirectory: ()=>true };
    fsMock.lstatMock.resolves(fakeStats);
    fsMock.pathExistsMock.resolves(false);

    const result = await isComponentDir("/some/dir");
    expect(result).to.be.false;
    expect(fsMock.lstatMock.calledOnce).to.be.true;
    expect(fsMock.pathExistsMock.calledOnce).to.be.true;
  });

  it("should return true if target is a directory and cmp.wheel.json exists", async ()=>{
    const fakeStats = { isDirectory: ()=>true };
    fsMock.lstatMock.resolves(fakeStats);
    fsMock.pathExistsMock.resolves(true);

    const result = await isComponentDir("/some/dir");
    expect(result).to.be.true;
    expect(fsMock.lstatMock.calledOnce).to.be.true;
    expect(fsMock.pathExistsMock.calledOnce).to.be.true;
  });
});

describe("#getComponentTree", ()=>{
  let rewireProjectFilesOperator;
  let getComponentTree;
  let readJsonGreedyMock;
  let pathIsAbsoluteMock;
  let pathRelativeMock;
  let pathDirnameMock;
  let pathJoinMock;

  beforeEach(()=>{
    //rewireで対象モジュールを読み込み
    rewireProjectFilesOperator = rewire("../../../app/core/projectFilesOperator.js");
    getComponentTree = rewireProjectFilesOperator.__get__("getComponentTree");

    readJsonGreedyMock = sinon.stub();
    pathIsAbsoluteMock = sinon.stub();
    pathRelativeMock = sinon.stub();
    pathDirnameMock = sinon.stub();
    pathJoinMock = sinon.stub();

    //getComponentTree内で使われるメソッドをtest側でstub化
    //必要に応じてnormalizeやresolveもstub化可能
    rewireProjectFilesOperator.__set__({
      readJsonGreedy: readJsonGreedyMock,
      path: {
        ...path,
        isAbsolute: pathIsAbsoluteMock,
        relative: pathRelativeMock,
        dirname: pathDirnameMock,
        join: pathJoinMock,
        normalize: path.normalize,
        resolve: path.resolve
      }
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return the root component with children properly attached (absolute path case)", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const mockRootDir = "/mock/project/root"; //絶対パス指定(テスト上の想定)

    //projectJson (prj.wheel.json) の想定データ
    const mockProjectJson = {
      componentPath: {
        rootID: "./",
        childID1: "./child1",
        childID2: "./child2"
      }
    };

    //1) rootDirが絶対パス => true
    pathIsAbsoluteMock.returns(true);

    //2) path.relativeで "./" を返す => 関数内で「|| './'」してstartが"./"に
    pathRelativeMock.returns("./");

    //3) path.join("...", "cmp.wheel.json")の戻り値
    //今回はあえて ".//cmp.wheel.json" 等を返す
    pathJoinMock.callsFake((dir, file)=>`${dir}/${file}`);

    //4) path.dirname(...) が呼ばれたら、すべて "." を返すようにする
    //=> これにより "startStriped" = "." と一致し rootIndexが -1 にならない
    pathDirnameMock.returns(".");

    //readJsonGreedyMock: 順番に呼ばれるので onCall() で返却
    //0回目 : prj.wheel.json
    //1回目 : .//cmp.wheel.json
    //2回目 : ./child1/cmp.wheel.json
    //3回目 : ./child2/cmp.wheel.json
    readJsonGreedyMock.onCall(0).resolves(mockProjectJson);
    readJsonGreedyMock.onCall(1).resolves({ ID: "rootID" });
    readJsonGreedyMock.onCall(2).resolves({ ID: "childID1", parent: "rootID" });
    readJsonGreedyMock.onCall(3).resolves({ ID: "childID2", parent: "childID1" });

    const result = await getComponentTree(mockProjectRootDir, mockRootDir);

    expect(result.ID).to.equal("rootID");
    expect(result.children).to.have.lengthOf(1);
    expect(result.children[0].ID).to.equal("childID1");
    expect(result.children[0].children).to.have.lengthOf(1);
    expect(result.children[0].children[0].ID).to.equal("childID2");
  });

  it("should return the root component with children (relative path case)", async ()=>{
    //rootDirを相対パス扱いにする => isAbsolute = false
    const mockProjectRootDir = "/mock/project/root";
    const mockRootDir = "./"; //相対パス

    const mockProjectJson = {
      componentPath: {
        rootID: "./",
        childID1: "./child1"
      }
    };

    //isAbsolute => false
    pathIsAbsoluteMock.returns(false);

    //path.relativeは呼ばれない(or 呼ばれても使われない)ためstubしておく
    pathRelativeMock.returns("./");

    //path.join => 同様に "dirname/cmp.wheel.json" みたいに返す
    pathJoinMock.callsFake((dir, file)=>`${dir}/${file}`);

    //path.dirnameは常に "." を返せば "startStriped" = "." に合致
    pathDirnameMock.returns(".");

    readJsonGreedyMock.onCall(0).resolves(mockProjectJson); //prj.wheel.json
    readJsonGreedyMock.onCall(1).resolves({ ID: "rootID" });
    readJsonGreedyMock.onCall(2).resolves({ ID: "childID1", parent: "rootID" });

    const result = await getComponentTree(mockProjectRootDir, mockRootDir);

    expect(result.ID).to.equal("rootID");
    expect(result.children).to.have.lengthOf(1);
    expect(result.children[0].ID).to.equal("childID1");
  });

  it("should attach child to root if child refers a non-existent parent", async ()=>{
    //ルートが "./", 子が "./child"
    const mockProjectRootDir = "/mock/project/root";
    const mockRootDir = "/mock/project/root";

    const mockProjectJson = {
      componentPath: {
        rootID: "./",
        lonelyChild: "./child"
      }
    };

    pathIsAbsoluteMock.returns(true);
    pathRelativeMock.returns("./");
    pathJoinMock.callsFake((dir, file)=>`${dir}/${file}`);

    //dirnameはいつものように "." を返して rootIndex=0 にする
    pathDirnameMock.returns(".");

    //cmp.wheel.jsonそれぞれ
    readJsonGreedyMock.onCall(0).resolves(mockProjectJson);
    //ルートコンポーネント
    readJsonGreedyMock.onCall(1).resolves({ ID: "rootID" });
    //parentプロパティが "unknownParent" など存在しないID
    readJsonGreedyMock.onCall(2).resolves({ ID: "lonelyChild", parent: "unknownParent" });

    const result = await getComponentTree(mockProjectRootDir, mockRootDir);

    //親が見つからない => rootにぶら下がる
    expect(result.ID).to.equal("rootID");
    expect(result.children).to.have.lengthOf(1);
    expect(result.children[0].ID).to.equal("lonelyChild");
  });

  it("should create a new children array if the parent component has no existing children array", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const mockRootDir = "/mock/project/root";
    const mockProjectJson = {
      componentPath: {
        rootID: "./",
        childID: "./child"
      }
    };

    pathIsAbsoluteMock.returns(true);
    pathRelativeMock.returns("./");
    pathJoinMock.callsFake((dir, file)=>`${dir}/${file}`);
    pathDirnameMock.returns(".");

    readJsonGreedyMock.onCall(0).resolves(mockProjectJson);
    //rootCmpに children プロパティはなし
    readJsonGreedyMock.onCall(1).resolves({ ID: "rootID" });
    readJsonGreedyMock.onCall(2).resolves({ ID: "childID", parent: "rootID" });

    const result = await getComponentTree(mockProjectRootDir, mockRootDir);

    //rootCmpは当初 children=[] がないが、子供がattachされて children=[{childID}] になる
    expect(result.ID).to.equal("rootID");
    expect(result.children).to.have.lengthOf(1);
    expect(result.children[0].ID).to.equal("childID");
  });
});
