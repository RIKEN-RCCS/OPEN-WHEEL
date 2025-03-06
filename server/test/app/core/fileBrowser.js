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
const { expect } = require("chai");
chai.use(require("chai-fs"));
const rewire = require("rewire");

//testee
const tmp = rewire("../../../app/core/fileBrowser");
const getSNDs = tmp.__get__("getSNDs");
const bundleSNDFiles = tmp.__get__("bundleSNDFiles");
const getContents = require("../../../app/core/fileBrowser");

const testDirRoot = "WHEEL_TEST_TMP";
describe("file Browser UT", ()=>{
  const input = [
    "foo",
    "bar",
    "baz",
    "foo_0",
    "foo_1",
    "foo_2",
    "foo_1_10",
    "foo_1_15",
    "foo_1_100",
    "bar_1_10",
    "foo_2_10",
    "foo_2_15",
    "foo_2_100",
    "0_baz",
    "1_baz",
    "2_baz"
  ].map((e)=>{
    return {
      path: testDirRoot,
      name: e,
      type: "file",
      islink: false,
      isComponentDir: false
    };
  });
  beforeEach(async ()=>{
    await fs.remove(testDirRoot);
    await Promise.all([
      fs.ensureDir(path.join(testDirRoot, "foo")),
      fs.ensureDir(path.join(testDirRoot, "bar")),
      fs.ensureDir(path.join(testDirRoot, "baz")),
      fs.outputFile(path.join(testDirRoot, "foo_1"), "foo_1"),
      fs.outputFile(path.join(testDirRoot, "foo_2"), "foo_2"),
      fs.outputFile(path.join(testDirRoot, "foo_3"), "foo_3"),
      fs.outputFile(path.join(testDirRoot, "huga_1_100"), "huga_1_100"),
      fs.outputFile(path.join(testDirRoot, "huga_1_200"), "huga_1_200"),
      fs.outputFile(path.join(testDirRoot, "huga_1_300"), "huga_1_300"),
      fs.outputFile(path.join(testDirRoot, "huga_2_100"), "huga_2_100"),
      fs.outputFile(path.join(testDirRoot, "huga_2_200"), "huga_2_200"),
      fs.outputFile(path.join(testDirRoot, "huga_2_300"), "huga_2_300"),
      fs.outputFile(path.join(testDirRoot, "huga_3_100"), "huga_3_100")
    ]);
    await Promise.all([
      fs.ensureSymlink(
        path.join(testDirRoot, "foo"),
        path.join(testDirRoot, "linkfoo")
      ),
      fs.ensureSymlink(
        path.join(testDirRoot, "bar"),
        path.join(testDirRoot, "linkbar")
      ),
      fs.ensureSymlink(
        path.join(testDirRoot, "baz"),
        path.join(testDirRoot, "linkbaz")
      ),
      fs.ensureSymlink(
        path.join(testDirRoot, "foo_1"),
        path.join(testDirRoot, "linkpiyo")
      ),
      fs.ensureSymlink(
        path.join(testDirRoot, "foo_2"),
        path.join(testDirRoot, "linkpuyo")
      ),
      fs.ensureSymlink(
        path.join(testDirRoot, "foo_3"),
        path.join(testDirRoot, "linkpoyo")
      )
    ]);
  });
  after(async ()=>{
    await fs.remove(testDirRoot);
  });
  describe("#getContents", ()=>{
    it("should get all files and directories", async ()=>{
      const rt = await getContents(testDirRoot);
      expect(rt).to.eql([
        {
          path: path.resolve(testDirRoot),
          name: "bar",
          type: "dir",
          islink: false,
          isComponentDir: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "baz",
          type: "dir",
          islink: false,
          isComponentDir: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "foo",
          type: "dir",
          islink: false,
          isComponentDir: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "linkbar",
          type: "dir",
          islink: true,
          isComponentDir: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "linkbaz",
          type: "dir",
          islink: true,
          isComponentDir: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "linkfoo",
          type: "dir",
          islink: true,
          isComponentDir: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "foo_1",
          type: "file",
          islink: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "foo_2",
          type: "file",
          islink: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "foo_3",
          type: "file",
          islink: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "huga_1_100",
          type: "file",
          islink: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "huga_1_200",
          type: "file",
          islink: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "huga_1_300",
          type: "file",
          islink: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "huga_2_100",
          type: "file",
          islink: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "huga_2_200",
          type: "file",
          islink: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "huga_2_300",
          type: "file",
          islink: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "huga_3_100",
          type: "file",
          islink: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "linkpiyo",
          type: "file",
          islink: true
        },
        {
          path: path.resolve(testDirRoot),
          name: "linkpoyo",
          type: "file",
          islink: true
        },
        {
          path: path.resolve(testDirRoot),
          name: "linkpuyo",
          type: "file",
          islink: true
        }
      ]);
    });
    it("should get directories", async ()=>{
      const rt = await getContents(testDirRoot, { sendFilename: false });
      expect(rt).to.eql([
        {
          path: path.resolve(testDirRoot),
          name: "bar",
          type: "dir",
          islink: false,
          isComponentDir: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "baz",
          type: "dir",
          islink: false,
          isComponentDir: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "foo",
          type: "dir",
          islink: false,
          isComponentDir: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "linkbar",
          type: "dir",
          islink: true,
          isComponentDir: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "linkbaz",
          type: "dir",
          islink: true,
          isComponentDir: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "linkfoo",
          type: "dir",
          islink: true,
          isComponentDir: false
        }
      ]);
    });
    it("should get files", async ()=>{
      const rt = await getContents(testDirRoot, { sendDirname: false });
      expect(rt).to.eql([
        {
          path: path.resolve(testDirRoot),
          name: "foo_1",
          type: "file",
          islink: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "foo_2",
          type: "file",
          islink: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "foo_3",
          type: "file",
          islink: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "huga_1_100",
          type: "file",
          islink: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "huga_1_200",
          type: "file",
          islink: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "huga_1_300",
          type: "file",
          islink: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "huga_2_100",
          type: "file",
          islink: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "huga_2_200",
          type: "file",
          islink: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "huga_2_300",
          type: "file",
          islink: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "huga_3_100",
          type: "file",
          islink: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "linkpiyo",
          type: "file",
          islink: true
        },
        {
          path: path.resolve(testDirRoot),
          name: "linkpoyo",
          type: "file",
          islink: true
        },
        {
          path: path.resolve(testDirRoot),
          name: "linkpuyo",
          type: "file",
          islink: true
        }
      ]);
    });
    it("should get files, directories and SND files", async ()=>{
      const rt = await getContents(testDirRoot, { SND: true });
      expect(rt).to.eql([
        {
          path: path.resolve(testDirRoot),
          name: "bar",
          type: "dir",
          islink: false,
          isComponentDir: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "baz",
          type: "dir",
          islink: false,
          isComponentDir: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "foo",
          type: "dir",
          islink: false,
          isComponentDir: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "linkbar",
          type: "dir",
          islink: true,
          isComponentDir: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "linkbaz",
          type: "dir",
          islink: true,
          isComponentDir: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "linkfoo",
          type: "dir",
          islink: true,
          isComponentDir: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "foo_*",
          type: "snd",
          islink: false,
          pattern: "foo_\\d+"
        },
        {
          path: path.resolve(testDirRoot),
          name: "huga_*_100",
          type: "snd",
          islink: false,
          pattern: "huga_\\d+_100"
        },
        {
          path: path.resolve(testDirRoot),
          name: "huga_*_200",
          type: "snd",
          islink: false,
          pattern: "huga_\\d+_200"
        },
        {
          path: path.resolve(testDirRoot),
          name: "huga_*_300",
          type: "snd",
          islink: false,
          pattern: "huga_\\d+_300"
        },
        {
          path: path.resolve(testDirRoot),
          name: "huga_1_*",
          type: "snd",
          islink: false,
          pattern: "huga_1_\\d+"
        },
        {
          path: path.resolve(testDirRoot),
          name: "huga_2_*",
          type: "snd",
          islink: false,
          pattern: "huga_2_\\d+"
        },
        {
          path: path.resolve(testDirRoot),
          name: "linkpiyo",
          type: "file",
          islink: true
        },
        {
          path: path.resolve(testDirRoot),
          name: "linkpoyo",
          type: "file",
          islink: true
        },
        {
          path: path.resolve(testDirRoot),
          name: "linkpuyo",
          type: "file",
          islink: true
        }
      ]);
    });
    it("should get matched files and directories", async ()=>{
      const rt = await getContents(testDirRoot, { filter: { all: /^[bh].*/ } });
      expect(rt).to.eql([
        {
          path: path.resolve(testDirRoot),
          name: "bar",
          type: "dir",
          islink: false,
          isComponentDir: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "baz",
          type: "dir",
          islink: false,
          isComponentDir: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "huga_1_100",
          type: "file",
          islink: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "huga_1_200",
          type: "file",
          islink: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "huga_1_300",
          type: "file",
          islink: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "huga_2_100",
          type: "file",
          islink: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "huga_2_200",
          type: "file",
          islink: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "huga_2_300",
          type: "file",
          islink: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "huga_3_100",
          type: "file",
          islink: false
        }
      ]);
    });
    it("should get matched files", async ()=>{
      const rt = await getContents(testDirRoot, { filter: { file: /[fl].*/ } });
      expect(rt).to.eql([
        {
          path: path.resolve(testDirRoot),
          name: "bar",
          type: "dir",
          islink: false,
          isComponentDir: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "baz",
          type: "dir",
          islink: false,
          isComponentDir: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "foo",
          type: "dir",
          islink: false,
          isComponentDir: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "linkbar",
          type: "dir",
          islink: true,
          isComponentDir: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "linkbaz",
          type: "dir",
          islink: true,
          isComponentDir: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "linkfoo",
          type: "dir",
          islink: true,
          isComponentDir: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "foo_1",
          type: "file",
          islink: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "foo_2",
          type: "file",
          islink: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "foo_3",
          type: "file",
          islink: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "linkpiyo",
          type: "file",
          islink: true
        },
        {
          path: path.resolve(testDirRoot),
          name: "linkpoyo",
          type: "file",
          islink: true
        },
        {
          path: path.resolve(testDirRoot),
          name: "linkpuyo",
          type: "file",
          islink: true
        }
      ]);
    });
    it("should get matched directories", async ()=>{
      const rt = await getContents(testDirRoot, { filter: { dir: /[fl].*/ } });
      expect(rt).to.eql([
        {
          path: path.resolve(testDirRoot),
          name: "foo",
          type: "dir",
          islink: false,
          isComponentDir: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "linkbar",
          type: "dir",
          islink: true,
          isComponentDir: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "linkbaz",
          type: "dir",
          islink: true,
          isComponentDir: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "linkfoo",
          type: "dir",
          islink: true,
          isComponentDir: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "foo_1",
          type: "file",
          islink: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "foo_2",
          type: "file",
          islink: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "foo_3",
          type: "file",
          islink: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "huga_1_100",
          type: "file",
          islink: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "huga_1_200",
          type: "file",
          islink: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "huga_1_300",
          type: "file",
          islink: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "huga_2_100",
          type: "file",
          islink: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "huga_2_200",
          type: "file",
          islink: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "huga_2_300",
          type: "file",
          islink: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "huga_3_100",
          type: "file",
          islink: false
        },
        {
          path: path.resolve(testDirRoot),
          name: "linkpiyo",
          type: "file",
          islink: true
        },
        {
          path: path.resolve(testDirRoot),
          name: "linkpoyo",
          type: "file",
          islink: true
        },
        {
          path: path.resolve(testDirRoot),
          name: "linkpuyo",
          type: "file",
          islink: true
        }
      ]);
    });
  });
  describe("#getSNDs", ()=>{
    it("should return glob patterns", ()=>{
      const expected = [
        {
          path: testDirRoot,
          name: "foo_1_*",
          type: "snd",
          islink: false,
          pattern: "foo_1_\\d+"
        },
        {
          path: testDirRoot,
          name: "foo_*",
          type: "snd",
          islink: false,
          pattern: "foo_\\d+"
        },
        {
          path: testDirRoot,
          name: "foo_*_10",
          type: "snd",
          islink: false,
          pattern: "foo_\\d+_10"
        },
        {
          path: testDirRoot,
          name: "foo_*_15",
          type: "snd",
          islink: false,
          pattern: "foo_\\d+_15"
        },
        {
          path: testDirRoot,
          name: "foo_2_*",
          type: "snd",
          islink: false,
          pattern: "foo_2_\\d+"
        },
        {
          path: testDirRoot,
          name: "foo_*_100",
          type: "snd",
          islink: false,
          pattern: "foo_\\d+_100"
        },
        {
          path: testDirRoot,
          name: "*_baz",
          type: "snd",
          islink: false,
          pattern: "\\d+_baz"
        }
      ];
      expect(getSNDs(input)).to.have.deep.not.ordered.members(expected);
    });
  });
  describe("#bundleSNDFiles", ()=>{
    it("should return files and SND", ()=>{
      const expected = [
        {
          path: testDirRoot,
          name: "foo",
          type: "file",
          islink: false,
          isComponentDir: false
        },
        {
          path: testDirRoot,
          name: "bar",
          type: "file",
          islink: false,
          isComponentDir: false
        },
        {
          path: testDirRoot,
          name: "baz",
          type: "file",
          islink: false,
          isComponentDir: false
        },
        {
          path: testDirRoot,
          name: "bar_1_10",
          type: "file",
          islink: false,
          isComponentDir: false
        },
        {
          path: testDirRoot,
          name: "foo_*",
          type: "snd",
          islink: false,
          pattern: "foo_\\d+"
        },
        {
          path: testDirRoot,
          name: "foo_1_*",
          type: "snd",
          islink: false,
          pattern: "foo_1_\\d+"
        },
        {
          path: testDirRoot,
          name: "foo_*_10",
          type: "snd",
          islink: false,
          pattern: "foo_\\d+_10"
        },
        {
          path: testDirRoot,
          name: "*_baz",
          type: "snd",
          islink: false,
          pattern: "\\d+_baz"
        },
        {
          path: testDirRoot,
          name: "foo_*_100",
          type: "snd",
          islink: false,
          pattern: "foo_\\d+_100"
        },
        {
          path: testDirRoot,
          name: "foo_*_15",
          type: "snd",
          islink: false,
          pattern: "foo_\\d+_15"
        },
        {
          path: testDirRoot,
          name: "foo_2_*",
          type: "snd",
          islink: false,
          pattern: "foo_2_\\d+"
        }
      ];
      expect(bundleSNDFiles(input)).to.have.deep.not.ordered.members(expected);
    });
  });
});
