/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */

//setup test framework
import { expect } from "chai";
import { getParamSpacev2 } from "../../../app/core/parameterParser.js";

import sinon from "sinon";
import path from "path";

//testee
import { _internal, makeCmd, getScatterFilesV2, scatterFilesV2, gatherFilesV2, replaceByNunjucks } from "../../../app/core/psUtils.js";

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
      expect(()=>{ return makeCmd(paramSettings); }).to.throw("PS version 1 is no longer supported");
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
    let nunjucksRenderStringStub;

    beforeEach(()=>{
      mockLogger = { trace: sinon.stub() };
      globStub = sinon.stub().resolves(["source.txt"]);
      fsCopyStub = sinon.stub(_internal.fs, "copy").resolves();
      nunjucksRenderStringStub = sinon.stub(_internal.nunjucks, "renderString");
      sinon.stub(_internal, "glob").callsFake(globStub);
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should gather files correctly", async ()=>{
      const templateRoot = "/template";
      const instanceRoot = "/instance";
      const params = { param1: "value1" };
      const gatherRecipe = [{ srcName: "source.txt", dstName: "destination.txt" }];
      nunjucksRenderStringStub.withArgs("source.txt", params).returns("source.txt");
      nunjucksRenderStringStub.withArgs("destination.txt", params).returns("destination.txt");
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
      nunjucksRenderStringStub.withArgs("source.txt", params).returns("source.txt");
      nunjucksRenderStringStub.withArgs("destination.txt", params).returns("destination.txt");
      fsCopyStub.rejects({ code: "ENOENT" });
      const result = await gatherFilesV2(templateRoot, instanceRoot, gatherRecipe, params, mockLogger);
      expect(result).to.equal(true);
      expect(mockLogger.trace.calledWith("error occurred at gather")).to.be.true;
    });
    it("should throw an error for unexpected errors", async ()=>{
      const templateRoot = "/template";
      const instanceRoot = "/instance";
      const params = { param1: "value1" };
      const gatherRecipe = [{ srcName: "source.txt", dstName: "destination.txt" }];
      nunjucksRenderStringStub.withArgs("source.txt", params).returns("source.txt");
      nunjucksRenderStringStub.withArgs("destination.txt", params).returns("destination.txt");
      fsCopyStub.rejects(new Error("Unexpected error"));

      try {
        await gatherFilesV2(templateRoot, instanceRoot, gatherRecipe, params, mockLogger);
      } catch (err) {
        expect(err.message).to.equal("Unexpected error");
      }
    });
  });
  describe("UT for psUtils class", ()=>{
    let globStub, nunjucksRenderStringStub, fsCopyStub, rsyncStub, mockLogger;

    beforeEach(()=>{
      globStub = sinon.stub().resolves(["file1.txt", "file2.txt"]);
      nunjucksRenderStringStub = sinon.stub(_internal.nunjucks, "renderString");
      fsCopyStub = sinon.stub(_internal.fs, "copy").resolves();
      rsyncStub = sinon.stub(_internal, "overwriteByRsync").resolves();
      mockLogger = { trace: sinon.stub() };
      sinon.stub(_internal, "glob").callsFake(globStub);
    });
    afterEach(()=>{
      sinon.restore();
    });
    it("should scatter files correctly using fs.copy", async ()=>{
      const templateRoot = "/template";
      const instanceRoot = "/instance";
      const params = { param1: "value1" };
      const scatterRecipe = [{ srcName: "srcFile", dstName: "dstFile" }];
      nunjucksRenderStringStub.withArgs("srcFile", params).returns("srcFile");
      nunjucksRenderStringStub.withArgs("dstFile", params).returns("dstFile");
      await scatterFilesV2(templateRoot, instanceRoot, scatterRecipe, params, mockLogger, false);
      expect(fsCopyStub.calledTwice).to.be.true;
      expect(fsCopyStub.firstCall.calledWithExactly(
        path.join(templateRoot, "file1.txt"),
        path.join(instanceRoot, "dstFile"),
        { overwrite: true }
      )).to.be.true;
      expect(fsCopyStub.secondCall.calledWithExactly(
        path.join(templateRoot, "file2.txt"),
        path.join(instanceRoot, "dstFile"),
        { overwrite: true }
      )).to.be.true;
    });
    it("should scatter files correctly using rsync", async ()=>{
      const templateRoot = "/template";
      const instanceRoot = "/instance";
      const params = { param1: "value1" };
      const scatterRecipe = [{ srcName: "srcFile", dstName: "dstFile" }];
      nunjucksRenderStringStub.withArgs("srcFile", params).returns("srcFile");
      nunjucksRenderStringStub.withArgs("dstFile", params).returns("dstFile");
      await scatterFilesV2(templateRoot, instanceRoot, scatterRecipe, params, mockLogger, true);
      expect(rsyncStub.calledTwice).to.be.true;
      expect(rsyncStub.firstCall.calledWithExactly(
        path.join(templateRoot, "file1.txt"),
        path.join(instanceRoot, "dstFile")
      )).to.be.true;
      expect(rsyncStub.secondCall.calledWithExactly(
        path.join(templateRoot, "file2.txt"),
        path.join(instanceRoot, "dstFile")
      )).to.be.true;
    });
    it("should handle ENOENT and EEXIST errors gracefully", async ()=>{
      fsCopyStub.rejects({ code: "ENOENT" });
      const templateRoot = "/template";
      const instanceRoot = "/instance";
      const params = { param1: "value1" };
      const scatterRecipe = [{ srcName: "srcFile", dstName: "dstFile" }];
      nunjucksRenderStringStub.withArgs("srcFile", params).returns("file1.txt");
      nunjucksRenderStringStub.withArgs("dstFile", params).returns("dstFile");
      const result = await scatterFilesV2(templateRoot, instanceRoot, scatterRecipe, params, mockLogger, false);
      expect(result).to.be.true;
    });
    it("should throw an error for unexpected errors", async ()=>{
      fsCopyStub.rejects(new Error("Unexpected error"));
      const templateRoot = "/template";
      const instanceRoot = "/instance";
      const params = { param1: "value1" };
      const scatterRecipe = [{ srcName: "srcFile", dstName: "dstFile" }];
      nunjucksRenderStringStub.withArgs("srcFile", params).returns("file1.txt");
      nunjucksRenderStringStub.withArgs("dstFile", params).returns("dstFile");

      try {
        await scatterFilesV2(templateRoot, instanceRoot, scatterRecipe, params, mockLogger, false);
        throw new Error("Test failed: should have thrown an error");
      } catch (err) {
        expect(err.message).to.equal("Unexpected error");
      }
    });
  });
  describe("#replaceByNunjucks", ()=>{
    let fsReadFileStub;
    let fsOutputFileStub;
    let nunjucksRenderStringStub;

    beforeEach(()=>{
      fsReadFileStub = sinon.stub(_internal.fs, "readFile");
      fsOutputFileStub = sinon.stub(_internal.fs, "outputFile");
      nunjucksRenderStringStub = sinon.stub(_internal.nunjucks, "renderString");
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should throw error if fs.readFile fails", async ()=>{
      const templateRoot = "/template";
      const instanceRoot = "/instance";
      const targetFiles = ["file1.txt"];
      const params = { param1: "value1" };
      fsReadFileStub.rejects(new Error("Read error"));

      try {
        await replaceByNunjucks(templateRoot, instanceRoot, targetFiles, params);
        expect.fail("Expected error to be thrown");
      } catch (err) {
        expect(err.message).to.equal("Read error");
      }
    });
    it("should throw error if fs.outputFile fails", async ()=>{
      const templateRoot = "/template";
      const instanceRoot = "/instance";
      const targetFiles = ["file1.txt"];
      const params = { param1: "value1" };
      fsReadFileStub.resolves("template content {{ param1 }}");
      nunjucksRenderStringStub.returns("template content value1");
      fsOutputFileStub.rejects(new Error("Write error"));

      try {
        await replaceByNunjucks(templateRoot, instanceRoot, targetFiles, params);
        expect.fail("Expected error to be thrown");
      } catch (err) {
        expect(err.message).to.equal("Write error");
      }
    });
  });
  describe("#getScatterFilesV2", ()=>{
    let globStub;

    beforeEach(()=>{
      globStub = sinon.stub().resolves([]);
      sinon.stub(_internal, "glob").callsFake(globStub);
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should return empty array if paramSettings.scatter is missing", async ()=>{
      const templateRoot = "/template";
      const paramSettings = {};
      const result = await getScatterFilesV2(templateRoot, paramSettings);
      expect(result).to.deep.equal([]);
    });

    it("should return empty array if paramSettings.scatter is not an array", async ()=>{
      const templateRoot = "/template";
      const paramSettings = { scatter: "not-an-array" };
      const result = await getScatterFilesV2(templateRoot, paramSettings);
      expect(result).to.deep.equal([]);
    });
    it("should return matched scatter files", async ()=>{
      const templateRoot = "/template";
      const paramSettings = {
        scatter: [
          { srcName: "file*.txt" },
          { srcName: "data*.json" }
        ]
      };
      globStub.withArgs("file*.txt", { cwd: templateRoot }).resolves(["file1.txt", "file2.txt"]);
      globStub.withArgs("data*.json", { cwd: templateRoot }).resolves(["data1.json"]);
      const result = await getScatterFilesV2(templateRoot, paramSettings);
      expect(result).to.deep.equal([
        "file1.txt",
        "file2.txt",
        "data1.json"
      ]);
    });
    it("should throw error if glob fails", async ()=>{
      const templateRoot = "/template";
      const paramSettings = {
        scatter: [{ srcName: "file*.txt" }]
      };
      globStub.rejects(new Error("Glob error"));

      try {
        await getScatterFilesV2(templateRoot, paramSettings);
        expect.fail("Expected error to be thrown");
      } catch (err) {
        expect(err.message).to.equal("Glob error");
      }
    });
  });
});
