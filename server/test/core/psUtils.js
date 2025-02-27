/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";

//setup test framework
const { expect } = require("chai");
const rewire = require("rewire");
const { getParamSpacev2 } = require("../../app/core/parameterParser");

const sinon = require("sinon");
const fs = require("fs-extra");
const path = require("path");
const nunjucks = require("nunjucks");

//testee
const psUtils = rewire("../../app/core/psUtils.js");
const makeCmd = psUtils.__get__("makeCmd");
const getScatterFilesV2 = psUtils.__get__("getScatterFilesV2");
const scatterFilesV2 = psUtils.__get__("scatterFilesV2");
const gatherFilesV2 = psUtils.__get__("gatherFilesV2");
const replaceByNunjucks = psUtils.__get__("replaceByNunjucks");

describe("UT for psUtils class", function () {
  describe("#makeCmd", ()=>{
    it("should return functions for PS version 2", ()=>{
      const paramSettings = {
        version: 2,
        params: { key: "value" }
      };
      const result = makeCmd(paramSettings);
      expect(result).to.be.an("array").with.lengthOf(5);
      expect(result[0].name).to.equal(getParamSpacev2.bind(null, paramSettings.params).name);
      expect(result[1]).to.equal(getScatterFilesV2);
      expect(result[2]).to.equal(scatterFilesV2);
      expect(result[3]).to.equal(gatherFilesV2);
      expect(result[4]).to.equal(replaceByNunjucks);
    });
    it("should throw an error for unsupported PS version", ()=>{
      const paramSettings = { version: 1 };
      expect(()=>makeCmd(paramSettings)).to.throw("PS version 1 is no longer supported");
    });
    it("should use 'target_param' if 'params' is not provided", ()=>{
      const paramSettings = {
        version: 2,
        target_param: { key: "value" }
      };
      const result = makeCmd(paramSettings);
      expect(result[0].name).to.equal(getParamSpacev2.bind(null, paramSettings.target_param).name);
    });
  });
  describe("#gatherFilesV2", ()=>{
    let mockLogger;
    let globStub;
    let fsCopyStub;
    let nunjucksStub;

    beforeEach(()=>{
      mockLogger = { trace: sinon.stub() };
      globStub = sinon.stub().resolves(["source.txt"]); //非同期処理対応
      fsCopyStub = sinon.stub(fs, "copy").resolves(); //fs.copy のモック
      nunjucksStub = sinon.stub(nunjucks, "renderString");
      psUtils.__set__("promisify", ()=>globStub);
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should gather files correctly", async ()=>{
      const templateRoot = "/template";
      const instanceRoot = "/instance";
      const params = { param1: "value1" };
      const gatherRecipe = [{ srcName: "source.txt", dstName: "destination.txt" }];
      nunjucksStub.withArgs("source.txt", params).returns("source.txt");
      nunjucksStub.withArgs("destination.txt", params).returns("destination.txt");
      await gatherFilesV2(templateRoot, instanceRoot, gatherRecipe, params, mockLogger);
      expect(fsCopyStub.calledOnceWith(
        path.join(instanceRoot, "source.txt"),
        path.join(templateRoot, "destination.txt"),
        { overwrite: true }
      )).to.be.true;
    });
    it("should log and ignore ENOENT or EEXIST errors", async ()=>{
      const templateRoot = "/template";
      const instanceRoot = "/instance";
      const params = { param1: "value1" };
      const gatherRecipe = [{ srcName: "source.txt", dstName: "destination.txt" }];
      nunjucksStub.withArgs("source.txt", params).returns("source.txt");
      nunjucksStub.withArgs("destination.txt", params).returns("destination.txt");
      fsCopyStub.rejects({ code: "ENOENT" });
      const result = await gatherFilesV2(templateRoot, instanceRoot, gatherRecipe, params, mockLogger);
      expect(result).to.equal(true); //`true` を返すかチェック
      expect(mockLogger.trace.calledWith("error occurred at gather")).to.be.true;
    });
    it("should throw an error for unexpected errors", async ()=>{
      const templateRoot = "/template";
      const instanceRoot = "/instance";
      const params = { param1: "value1" };
      const gatherRecipe = [{ srcName: "source.txt", dstName: "destination.txt" }];
      nunjucksStub.withArgs("source.txt", params).returns("source.txt");
      nunjucksStub.withArgs("destination.txt", params).returns("destination.txt");
      fsCopyStub.rejects(new Error("Unexpected error"));

      try {
        await gatherFilesV2(templateRoot, instanceRoot, gatherRecipe, params, mockLogger);
      } catch (err) {
        expect(err.message).to.equal("Unexpected error");
      }
    });
  });
});
