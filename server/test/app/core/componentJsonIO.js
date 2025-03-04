/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";

const rewire = require("rewire");
const sinon = require("sinon");
const { expect } = require("chai");
const componentJsonIO = rewire("../../../app/core/componentJsonIO");

//testee
const readComponentJsonByID = componentJsonIO.__get__("readComponentJsonByID");

describe("UT for componentJsonIO class", ()=>{
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

  describe("#readComponentJsonByID", ()=>{
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
});
