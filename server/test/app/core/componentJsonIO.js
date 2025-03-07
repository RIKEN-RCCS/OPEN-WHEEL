/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";

const rewire = require("rewire");
const chai = require("chai");
const sinon = require("sinon");
const { expect } = chai;
const componentJsonIO = rewire("../../../app/core/componentJsonIO");
const path = require("path");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

//testee
const readComponentJsonByID = componentJsonIO.__get__("readComponentJsonByID");
const writeComponentJsonByID = componentJsonIO.__get__("writeComponentJsonByID");
const readComponentJson = componentJsonIO.__get__("readComponentJson");
const writeComponentJson = componentJsonIO.__get__("writeComponentJson");
const getComponentDir = componentJsonIO.__get__("getComponentDir");
const componentJsonReplacer = componentJsonIO.__get__("componentJsonReplacer");

describe("UT for componentJsonIO class", ()=>{
  describe("#readComponentJsonByID", ()=>{
    let getComponentDirStub, readComponentJsonStub;
    beforeEach(()=>{
      getComponentDirStub = sinon.stub();
      readComponentJsonStub = sinon.stub();

      componentJsonIO.__set__("getComponentDir", getComponentDirStub);
      componentJsonIO.__set__("readComponentJson", readComponentJsonStub);
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should return component JSON data if valid ID is provided", async ()=>{
      const mockProjectRootDir = "/mock/project";
      const mockID = "mockID";
      const mockComponentDir = "/mock/project/mockComponentDir";
      const mockComponentData = { name: "testComponent" };
      getComponentDirStub.resolves(mockComponentDir);
      readComponentJsonStub.resolves(mockComponentData);
      const result = await readComponentJsonByID(mockProjectRootDir, mockID);
      expect(result).to.deep.equal(mockComponentData);
    });
    it("should throw error if getComponentDir fails", async ()=>{
      const mockProjectRootDir = "/mock/project";
      const mockID = "mockID";
      getComponentDirStub.rejects(new Error("Directory not found"));

      try {
        await readComponentJsonByID(mockProjectRootDir, mockID);
        expect.fail("Expected error was not thrown");
      } catch (err) {
        expect(err.message).to.equal("Directory not found");
      }
    });
    it("should throw error if readComponentJson fails", async ()=>{
      const mockProjectRootDir = "/mock/project";
      const mockID = "mockID";
      const mockComponentDir = "/mock/project/mockComponentDir";
      getComponentDirStub.resolves(mockComponentDir);
      readComponentJsonStub.rejects(new Error("Read error"));

      try {
        await readComponentJsonByID(mockProjectRootDir, mockID);
        expect.fail("Expected error was not thrown");
      } catch (err) {
        expect(err.message).to.equal("Read error");
      }
    });
  });
  describe("#writeComponentJsonByID", ()=>{
    let getComponentDirStub, writeComponentJsonStub;
    beforeEach(()=>{
      getComponentDirStub = sinon.stub();
      writeComponentJsonStub = sinon.stub();

      componentJsonIO.__set__("getComponentDir", getComponentDirStub);
      componentJsonIO.__set__("writeComponentJson", writeComponentJsonStub);
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should write component JSON data if valid ID is provided", async ()=>{
      const mockProjectRootDir = "/mock/project";
      const mockID = "mockID";
      const mockComponentDir = "/mock/project/mockComponentDir";
      const mockComponentData = { name: "testComponent" };
      getComponentDirStub.resolves(mockComponentDir);
      writeComponentJsonStub.resolves();
      await writeComponentJsonByID(mockProjectRootDir, mockID, mockComponentData);
      expect(getComponentDirStub.calledOnceWith(mockProjectRootDir, mockID, true)).to.be.true;
      expect(writeComponentJsonStub.calledOnceWith(mockProjectRootDir, mockComponentDir, mockComponentData)).to.be.true;
    });
    it("should throw error if getComponentDir fails", async ()=>{
      const mockProjectRootDir = "/mock/project";
      const mockID = "mockID";
      getComponentDirStub.rejects(new Error("Directory not found"));

      try {
        await writeComponentJsonByID(mockProjectRootDir, mockID, {});
        expect.fail("Expected error was not thrown");
      } catch (err) {
        expect(err.message).to.equal("Directory not found");
      }
    });
    it("should throw error if writeComponentJson fails", async ()=>{
      const mockProjectRootDir = "/mock/project";
      const mockID = "mockID";
      const mockComponentDir = "/mock/project/mockComponentDir";
      getComponentDirStub.resolves(mockComponentDir);
      writeComponentJsonStub.rejects(new Error("Write error"));

      try {
        await writeComponentJsonByID(mockProjectRootDir, mockID, {});
        expect.fail("Expected error was not thrown");
      } catch (err) {
        expect(err.message).to.equal("Write error");
      }
    });
  });
  describe("#readComponentJson", ()=>{
    let readJsonGreedyStub;
    const mockComponentDir = "/mock/project/mockComponentDir";
    const mockComponentJson = { name: "testComponent" };
    const mockFilename = path.join(mockComponentDir, "cmp.wheel.json");
    beforeEach(()=>{
      readJsonGreedyStub = sinon.stub();
      componentJsonIO.__set__("readJsonGreedy", readJsonGreedyStub);
    });
    afterEach(()=>{
      sinon.restore();
    });
    it("should return component JSON data if valid path is provided", async ()=>{
      readJsonGreedyStub.resolves(mockComponentJson);
      const result = await readComponentJson(mockComponentDir);
      expect(result).to.deep.equal(mockComponentJson);
      expect(readJsonGreedyStub.calledOnceWith(mockFilename)).to.be.true;
    });
    it("should throw error if readJsonGreedy fails", async ()=>{
      readJsonGreedyStub.rejects(new Error("Read error"));
      await expect(readComponentJson(mockComponentDir)).to.be.rejectedWith("Read error");
    });
    it("should call readJsonGreedy with correct path", async ()=>{
      readJsonGreedyStub.resolves(mockComponentJson);
      await readComponentJson(mockComponentDir);
      expect(readJsonGreedyStub.calledOnceWith(mockFilename)).to.be.true;
    });
  });
  describe("#writeComponentJson", ()=>{
    let fsStub, gitAddStub, mockComponent, mockComponentDir, mockFilename;

    beforeEach(()=>{
      fsStub = {
        writeJson: sinon.stub().resolves()
      };
      gitAddStub = sinon.stub().resolves();
      componentJsonIO.__set__("fs", fsStub);
      componentJsonIO.__set__("gitAdd", gitAddStub);
      mockComponent = { name: "TestComponent", type: "task" };
      mockComponentDir = "/mock/project/components";
      mockFilename = path.join(mockComponentDir, "cmp.wheel.json");
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should write JSON data to the specified file", async ()=>{
      await writeComponentJson("/mock/project", mockComponentDir, mockComponent);
      expect(fsStub.writeJson.calledOnceWithExactly(mockFilename, mockComponent, { spaces: 4, replacer: sinon.match.func })).to.be.true;
    });
    it("should call gitAdd if doNotAdd is false or undefined", async ()=>{
      await writeComponentJson("/mock/project", mockComponentDir, mockComponent, false);
      expect(gitAddStub.calledOnceWithExactly("/mock/project", mockFilename)).to.be.true;
    });
    it("should not call gitAdd if doNotAdd is true", async ()=>{
      await writeComponentJson("/mock/project", mockComponentDir, mockComponent, true);
      expect(gitAddStub.notCalled).to.be.true;
    });
    it("should throw an error if fs.writeJson fails", async ()=>{
      fsStub.writeJson.rejects(new Error("Write error"));

      try {
        await writeComponentJson("/mock/project", mockComponentDir, mockComponent);
      } catch (err) {
        expect(err.message).to.equal("Write error");
      }
    });
    it("should throw an error if gitAdd fails", async ()=>{
      gitAddStub.rejects(new Error("Git add error"));

      try {
        await writeComponentJson("/mock/project", mockComponentDir, mockComponent);
      } catch (err) {
        expect(err.message).to.equal("Git add error");
      }
    });
  });
  describe("#getComponentDir", ()=>{
    let readJsonGreedyStub;
    const mockProjectRoot = "/mock/project";
    const mockComponentID = "component123";

    beforeEach(()=>{
      readJsonGreedyStub = sinon.stub();
      componentJsonIO.__set__("readJsonGreedy", readJsonGreedyStub);
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should return absolute path if isAbsolute is true", async ()=>{
      const mockComponentPath = "components/component123";
      readJsonGreedyStub.resolves({
        componentPath: {
          [mockComponentID]: mockComponentPath
        }
      });
      const result = await getComponentDir(mockProjectRoot, mockComponentID, true);
      expect(result).to.equal(path.resolve(mockProjectRoot, mockComponentPath));
    });
    it("should return relative path if isAbsolute is false", async ()=>{
      const mockComponentPath = "components/component123";
      readJsonGreedyStub.resolves({
        componentPath: {
          [mockComponentID]: mockComponentPath
        }
      });
      const result = await getComponentDir(mockProjectRoot, mockComponentID, false);
      expect(result).to.equal(mockComponentPath);
    });
    it("should return null if component ID does not exist", async ()=>{
      readJsonGreedyStub.resolves({
        componentPath: {}
      });
      const result = await getComponentDir(mockProjectRoot, mockComponentID, true);
      expect(result).to.be.null;
    });
    it("should throw an error if readJsonGreedy fails", async ()=>{
      readJsonGreedyStub.rejects(new Error("Read error"));

      try {
        await getComponentDir(mockProjectRoot, mockComponentID, true);
      } catch (err) {
        expect(err.message).to.equal("Read error");
      }
    });
  });
  describe("#componentJsonReplacer", ()=>{
    it("should return undefined for handler key", ()=>{
      const result = componentJsonReplacer("handler", "someValue");
      expect(result).to.be.undefined;
    });
    it("should return undefined for doCleanup key", ()=>{
      const result = componentJsonReplacer("doCleanup", "someValue");
      expect(result).to.be.undefined;
    });
    it("should return undefined for sbsID key", ()=>{
      const result = componentJsonReplacer("sbsID", "someValue");
      expect(result).to.be.undefined;
    });
    it("should return undefined for childLoopRunning key", ()=>{
      const result = componentJsonReplacer("childLoopRunning", "someValue");
      expect(result).to.be.undefined;
    });
    it("should return original value for keys not in the exclusion list", ()=>{
      const result = componentJsonReplacer("otherKey", "someValue");
      expect(result).to.equal("someValue");
    });
  });
});
