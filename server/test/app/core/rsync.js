/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import path from "path";
import fs from "fs-extra";

//setup test framework
import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
const expect = chai.expect;
chai.use(chaiAsPromised);


//testee
import {
  overwriteByRsync
} from "../../../app/core/rsync.js";

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

      expect(fs.readFileSync(path.resolve(dstDir, "file1.txt"), "utf8")).to.equal("content1");
      expect(fs.readFileSync(path.resolve(dstDir, "file2.txt"), "utf8")).to.equal("content2");
    });

    it("should exclude files matching ignore patterns", async ()=>{
      await fs.outputFile(path.resolve(srcDir, "file1.txt"), "content1");
      await fs.outputFile(path.resolve(srcDir, "file2.txt"), "content2");
      await fs.outputFile(path.resolve(srcDir, "exclude.txt"), "excluded");
      await fs.outputFile(path.resolve(srcDir, "exclude2.txt"), "excluded");
      await fs.mkdir(dstDir, { recursive: true });

      await overwriteByRsync(srcDir, dstDir, ["exclude.txt", "exclude2.txt"]);

      expect(fs.readFileSync(path.resolve(dstDir, "file1.txt"), "utf8")).to.equal("content1");
      expect(fs.readFileSync(path.resolve(dstDir, "file2.txt"), "utf8")).to.equal("content2");
      expect(fs.existsSync(path.resolve(dstDir, "exclude.txt"))).to.be.false;
      expect(fs.existsSync(path.resolve(dstDir, "exclude2.txt"))).to.be.false;
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