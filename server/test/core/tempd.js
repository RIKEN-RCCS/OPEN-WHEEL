/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";

//setup test framework
const { expect } = require("chai");
const rewire = require("rewire");
const path = require("path");
const { createHash } = require("crypto");

//testee
const rewTempd = rewire("../../app/core/tempd.js");
const getTempd = rewTempd.__get__("getTempd");

describe("UT for tempd class", function () {
  describe("#getTempd", ()=>{
    const projectRootDir = "/test/project";
    const prefix = "viewer";
    const tempdRoot = process.env.WHEEL_TEMPD || path.dirname("__dirname");
    beforeEach(()=>{
      rewTempd.__set__("tempdRoot", tempdRoot);
    });
    it("should return the correct temporary directory path", async ()=>{
      //ハッシュを計算して期待されるパスを作成
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
});
