/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */

//setup test framework
import { expect } from "chai";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs-extra";
import sinon from "sinon";
import { createHash } from "crypto";

//testee
import { getTempd, removeTempd, createTempd, _internal } from "../../../app/core/tempd.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("UT for tempd class", function () {
  describe("#getTempd", ()=>{
    const projectRootDir = "/test/project";
    const prefix = "viewer";
    const tempdRoot = process.env.WHEEL_TEMPD || path.dirname(__dirname);
    beforeEach(()=>{
      sinon.stub(_internal, "tempdRoot").value(tempdRoot);
    });
    afterEach(()=>{
      sinon.restore();
    });
    it("should return the correct temporary directory path", async ()=>{
      const hash = createHash("sha256");
      const ID = hash.update(projectRootDir).digest("hex");
      const expectedPath = path.resolve(tempdRoot, prefix, ID);
      const result = await getTempd(projectRootDir, prefix);
      expect(result).to.equal(expectedPath);
    });
    it("should generate different paths for different project directories", async ()=>{
      const anotherProjectRoot = "/test/another_project";
      const hash1 = createHash("sha256").update(projectRootDir)
        .digest("hex");
      const hash2 = createHash("sha256").update(anotherProjectRoot)
        .digest("hex");
      const expectedPath1 = path.resolve(tempdRoot, prefix, hash1);
      const expectedPath2 = path.resolve(tempdRoot, prefix, hash2);
      const result1 = await getTempd(projectRootDir, prefix);
      const result2 = await getTempd(anotherProjectRoot, prefix);
      expect(result1).to.equal(expectedPath1);
      expect(result2).to.equal(expectedPath2);
      expect(result1).to.not.equal(result2);
    });
    it("should generate different paths for different prefixes", async ()=>{
      const anotherPrefix = "download";
      const hash = createHash("sha256").update(projectRootDir)
        .digest("hex");
      const expectedPath1 = path.resolve(tempdRoot, prefix, hash);
      const expectedPath2 = path.resolve(tempdRoot, anotherPrefix, hash);
      const result1 = await getTempd(projectRootDir, prefix);
      const result2 = await getTempd(projectRootDir, anotherPrefix);
      expect(result1).to.equal(expectedPath1);
      expect(result2).to.equal(expectedPath2);
      expect(result1).to.not.equal(result2);
    });
  });
  describe("#removeTempd", ()=>{
    const projectRootDir = "/test/project";
    const prefix = "viewer";
    const tempdRoot = process.env.WHEEL_TEMPD || path.dirname(__dirname);
    let tempDirPath;
    let removeStub;
    let getLoggerStub;
    let logDebugStub;
    beforeEach(()=>{
      sinon.stub(_internal, "tempdRoot").value(tempdRoot);
      const hash = createHash("sha256")
        .update(projectRootDir)
        .digest("hex");
      tempDirPath = path.resolve(tempdRoot, prefix, hash);
      removeStub = sinon.stub(fs, "remove").resolves();
      logDebugStub = sinon.stub();
      getLoggerStub = sinon.stub(_internal, "getLogger").returns({ debug: logDebugStub });
    });
    afterEach(()=>{
      sinon.restore();
    });
    it("should remove the temporary directory", async ()=>{
      await removeTempd(projectRootDir, prefix);
      expect(removeStub.calledOnceWithExactly(tempDirPath)).to.be.true;
    });
    it("should log the removal of the temporary directory", async ()=>{
      await removeTempd(projectRootDir, prefix);
      expect(logDebugStub.calledOnceWithExactly(`remove temporary directory ${tempDirPath}`)).to.be.true;
    });
    it("should handle errors gracefully", async ()=>{
      const error = new Error("Failed to remove directory");
      removeStub.rejects(error);

      try {
        await removeTempd(projectRootDir, prefix);
      } catch (err) {
        expect(err).to.equal(error);
      }
      expect(removeStub.calledOnceWithExactly(tempDirPath)).to.be.true;
    });
  });
  describe("#createTempd", ()=>{
    const projectRootDir = "/test/project";
    const prefix = "viewer";
    let tempDirPath, rootPath;
    const tempdRoot = process.env.WHEEL_TEMPD || path.dirname(__dirname);

    beforeEach(()=>{
      const hash = createHash("sha256")
        .update(projectRootDir)
        .digest("hex");
      sinon.stub(_internal, "tempdRoot").value(tempdRoot);
      rootPath = path.resolve(tempdRoot, prefix);
      tempDirPath = path.resolve(rootPath, hash);
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should create the temporary directory and return its path", async ()=>{
      const result = await createTempd(projectRootDir, prefix);
      expect(result).to.deep.equal({ dir: tempDirPath, root: rootPath });
    });

    it("should handle errors gracefully", async ()=>{
      const error = new Error("Failed to create directory");

      try {
        await createTempd(projectRootDir, prefix);
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });
});