/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import * as chai from "chai";
const { expect } = chai;
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
import sinon from "sinon";
import path from "path";
//eslint-disable-next-line no-unused-vars
import { promisify } from "util";
//eslint-disable-next-line no-unused-vars
import * as glob from "glob";

//testee

//testee
import {
  removeComponentPath,
  updateComponentPath,
  _internal
} from "../../../app/core/componentPathOperations.js";

describe("#removeComponentPath", ()=>{
  let readJsonGreedyMock;
  let writeJsonWrapperMock;
  let gitAddMock;
  let pathExistsMock;

  beforeEach(()=>{
    readJsonGreedyMock = sinon.stub();
    writeJsonWrapperMock = sinon.stub();
    gitAddMock = sinon.stub();
    pathExistsMock = sinon.stub();

    readJsonGreedyMock = sinon.stub(_internal, "readJsonGreedy");
    writeJsonWrapperMock = sinon.stub(_internal, "writeJsonWrapper");
    gitAddMock = sinon.stub(_internal, "gitAdd");
    pathExistsMock = sinon.stub(_internal.fs, "pathExists");
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
  let readJsonGreedyMock;
  let writeJsonWrapperMock;
  let gitAddMock;

  beforeEach(()=>{
    readJsonGreedyMock = sinon.stub(_internal, "readJsonGreedy");
    writeJsonWrapperMock = sinon.stub(_internal, "writeJsonWrapper");
    gitAddMock = sinon.stub(_internal, "gitAdd");
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

