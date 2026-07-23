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

//testee
import {
  getProjectJson,
  writeProjectJson,
  getAllComponentIDs,
  setProjectState,
  getProjectState,
  updateProjectROStatus,
  updateProjectDescription,
  _internal
} from "../../../app/core/projectJsonFileOperator.js";

describe("#getProjectJson", ()=>{
  let readJsonGreedyMock;

  beforeEach(()=>{
    readJsonGreedyMock = sinon.stub(_internal, "readJsonGreedy");
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
  let writeJsonWrapperMock;
  let gitAddMock;

  const mockProjectRootDir = "/mock/project/root";
  const mockProjectJson = { name: "test_project", version: 2 };
  const mockFileName = `${mockProjectRootDir}/prj.wheel.json`;

  beforeEach(()=>{
    writeJsonWrapperMock = sinon.stub(_internal, "writeJsonWrapper");
    gitAddMock = sinon.stub(_internal, "gitAdd");
  });
  afterEach(()=>{
    sinon.restore();
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

describe("#getAllComponentIDs", ()=>{
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
    readJsonGreedyMock = sinon.stub(_internal, "readJsonGreedy");
  });
  afterEach(()=>{
    sinon.restore();
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

describe("#setProjectState", ()=>{
  let readJsonGreedyMock;
  let writeJsonWrapperMock;
  let gitAddMock;

  beforeEach(()=>{
    readJsonGreedyMock = sinon.stub(_internal, "readJsonGreedy");
    writeJsonWrapperMock = sinon.stub(_internal, "writeJsonWrapper");
    gitAddMock = sinon.stub(_internal, "gitAdd");
    sinon.stub(_internal, "getDateString").returns("20250101-123456");
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

  it("should not overwrite an already-concluded (terminal) state with another terminal state", async ()=>{
    //reproduction for the bug where a task failure causes the project to naturally conclude as
    //"failed", but a redundant/stale "project stopped" transition (fired from the taskStateChanged
    //handler after the project already concluded) used to overwrite it and re-stage prj.wheel.json
    const mockProjectRootDir = "/mock/project/root";
    const mockMetadata = {
      state: "failed",
      mtime: "20240101-000000"
    };

    readJsonGreedyMock.resolves(mockMetadata);

    const result = await setProjectState(mockProjectRootDir, "stopped", false);

    expect(result).to.be.false;
    expect(writeJsonWrapperMock.notCalled).to.be.true;
    expect(gitAddMock.notCalled).to.be.true;
  });

  it("should force overwrite an already-concluded (terminal) state with another terminal state when force is true", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const mockMetadata = {
      state: "failed",
      mtime: "20240101-000000"
    };

    readJsonGreedyMock.resolves(mockMetadata);

    const updatedMetadata = {
      ...mockMetadata,
      state: "stopped",
      mtime: "20250101-123456"
    };

    const result = await setProjectState(mockProjectRootDir, "stopped", true);

    expect(result).to.deep.equal(updatedMetadata);
    expect(writeJsonWrapperMock.calledOnceWithExactly(
      `${mockProjectRootDir}/prj.wheel.json`,
      updatedMetadata
    )).to.be.true;
    expect(gitAddMock.calledOnceWithExactly(mockProjectRootDir, `${mockProjectRootDir}/prj.wheel.json`)).to.be.true;
  });

  it("should still allow leaving a terminal state for a non-terminal one (e.g. re-running the project)", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const mockMetadata = {
      state: "failed",
      mtime: "20240101-000000"
    };

    readJsonGreedyMock.resolves(mockMetadata);

    const updatedMetadata = {
      ...mockMetadata,
      state: "preparing",
      mtime: "20250101-123456"
    };

    const result = await setProjectState(mockProjectRootDir, "preparing", false);

    expect(result).to.deep.equal(updatedMetadata);
    expect(writeJsonWrapperMock.calledOnceWithExactly(
      `${mockProjectRootDir}/prj.wheel.json`,
      updatedMetadata
    )).to.be.true;
    expect(gitAddMock.calledOnceWithExactly(mockProjectRootDir, `${mockProjectRootDir}/prj.wheel.json`)).to.be.true;
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

describe("#getProjectState", ()=>{
  let readJsonGreedyMock;

  beforeEach(()=>{
    readJsonGreedyMock = sinon.stub(_internal, "readJsonGreedy");
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

describe("#updateProjectROStatus", ()=>{
  let readJsonGreedyMock;
  let writeJsonWrapperMock;

  beforeEach(()=>{
    readJsonGreedyMock = sinon.stub(_internal, "readJsonGreedy");
    writeJsonWrapperMock = sinon.stub(_internal, "writeJsonWrapper");
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
