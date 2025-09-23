/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path = require("path");
const fs = require("fs-extra");

//setup test framework
const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-fs"));
chai.use(require("chai-as-promised"));

//testee
const {
  overwriteByRsync
} = require("../../../app/core/rsync");

describe("rsync functions", function () {
  const testRoot = "WHEEL_TEST_TMP";
  const srcDir = path.resolve(testRoot, "rsyncsrc");
  const dstDir = path.resolve(testRoot, "rsyncdst");

  beforeEach(async function () {
    await fs.remove(testRoot);
  });

  after(async ()=>{
    if (!process.env.WHEEL_KEEP_FILES_AFTER_LAST_TEST) {
      await fs.remove(testRoot);
    }
  });

  describe("#overwriteByRsync", ()=>{
    it("should copy all files from src to dst", async ()=>{
      await fs.outputFile(path.resolve(srcDir, "file1.txt"), "content1");
      await fs.outputFile(path.resolve(srcDir, "file2.txt"), "content2");
      await overwriteByRsync(srcDir, dstDir);

      expect(path.resolve(dstDir, "file1.txt")).to.be.a.file().with.content("content1");
      expect(path.resolve(dstDir, "file2.txt")).to.be.a.file().with.content("content2");
    });

    it("should exclude files matching ignore patterns", async ()=>{
      await fs.outputFile(path.resolve(srcDir, "file1.txt"), "content1");
      await fs.outputFile(path.resolve(srcDir, "file2.txt"), "content2");
      await fs.outputFile(path.resolve(srcDir, "exclude.txt"), "excluded");
      await fs.outputFile(path.resolve(srcDir, "exclude2.txt"), "excluded");
      await fs.mkdir(dstDir, { recursive: true });

      await overwriteByRsync(srcDir, dstDir, ["exclude.txt", "exclude2.txt"]);

      expect(path.resolve(dstDir, "file1.txt")).to.be.a.file().with.content("content1");
      expect(path.resolve(dstDir, "file2.txt")).to.be.a.file().with.content("content2");
      expect(path.resolve(dstDir, "exclude.txt")).to.not.be.a.path();
      expect(path.resolve(dstDir, "exclude2.txt")).to.not.be.a.path();
    });

    it("should handle empty src directory gracefully", async ()=>{
      await fs.mkdir(srcDir, { recursive: true });
      await overwriteByRsync(srcDir, dstDir);

      const dstFiles = await fs.readdir(dstDir);
      expect(dstFiles).to.be.empty;
    });

    it("should throw an error if src does not exist", async ()=>{
      await fs.remove(srcDir); //srcを削除
      await expect(overwriteByRsync(srcDir, dstDir)).to.be.rejectedWith(Error);
    });
  });
});
