/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import path from "path";
import fs from "fs-extra";

//setup test framework
import * as chai from "chai";
const { expect } = chai;
import sinon from "sinon";

//testee
import lsFunction from "../../../app/core/fileBrowser.js";
import { getSNDs, bundleSNDFiles, _internal } from "../../../app/core/fileBrowser.js";
const getContents = lsFunction;

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

describe("#ls", ()=>{
  let ls;
  let readdirStub;
  let lstatStub;
  let statStub;
  let isComponentDirStub;

  beforeEach(()=>{
    ls = lsFunction;
    //_internal is already imported

    readdirStub = sinon.stub(_internal.fs, "readdir");
    lstatStub = sinon.stub(_internal.fs, "lstat");
    statStub = sinon.stub(_internal.fs, "stat");
    isComponentDirStub = sinon.stub(_internal, "isComponentDir");
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return empty array if the directory is empty", async ()=>{
    readdirStub.resolves([]);

    const result = await ls("/dummy/dir");
    expect(result).to.be.an("array").that.is.empty;
  });

  it("should filter out entries if allFilter does not match", async ()=>{
    readdirStub.resolves(["keepThis", "skipThis"]);
    //eslint-disable-next-line @stylistic/max-statements-per-line
    lstatStub.resolves({ isDirectory: ()=>{ return true; }, isFile: ()=>{ return false; }, isSymbolicLink: ()=>{ return false; } });
    isComponentDirStub.resolves(false);

    const options = {
      filter: {
        all: /keep/
      }
    };
    const result = await ls("/some/dir", options);
    expect(result).to.have.lengthOf(1);
    expect(result[0]).to.include({ name: "keepThis", type: "dir" });
  });

  it("should skip lstat error entries", async ()=>{
    readdirStub.resolves(["okDir", "badEntry", "okFile"]);

    lstatStub.callsFake(async (pathName)=>{
      if (pathName.endsWith("okDir")) {
        //eslint-disable-next-line @stylistic/max-statements-per-line
        return { isDirectory: ()=>{ return true; }, isFile: ()=>{ return false; }, isSymbolicLink: ()=>{ return false; } };
      }
      if (pathName.endsWith("badEntry")) {
        throw new Error("some lstat error");
      }
      //eslint-disable-next-line @stylistic/max-statements-per-line
      return { isDirectory: ()=>{ return false; }, isFile: ()=>{ return true; }, isSymbolicLink: ()=>{ return false; } };
    });

    isComponentDirStub.resolves(false);

    const result = await ls("/dummy/path");
    expect(result).to.have.lengthOf(2);
    //eslint-disable-next-line @stylistic/max-statements-per-line
    expect(result.some((e)=>{ return e.name === "okDir" && e.type === "dir"; })).to.be.true;
    //eslint-disable-next-line @stylistic/max-statements-per-line
    expect(result.some((e)=>{ return e.name === "okFile" && e.type === "file"; })).to.be.true;
  });

  it("should skip directories if sendDirname=false, skip files if sendFilename=false", async ()=>{
    readdirStub.resolves(["someDir", "someFile"]);
    lstatStub.callsFake(async (pathName)=>{
      if (pathName.endsWith("someDir")) {
        //eslint-disable-next-line @stylistic/max-statements-per-line
        return { isDirectory: ()=>{ return true; }, isFile: ()=>{ return false; }, isSymbolicLink: ()=>{ return false; } };
      }
      //eslint-disable-next-line @stylistic/max-statements-per-line
      return { isDirectory: ()=>{ return false; }, isFile: ()=>{ return true; }, isSymbolicLink: ()=>{ return false; } };
    });
    isComponentDirStub.resolves(false);

    const opts1 = { sendDirname: false, sendFilename: true };
    const result1 = await ls("/test/path1", opts1);
    expect(result1).to.have.lengthOf(1);
    expect(result1[0].type).to.equal("file");

    const opts2 = { sendDirname: true, sendFilename: false };
    const result2 = await ls("/test/path2", opts2);
    expect(result2).to.have.lengthOf(1);
    expect(result2[0].type).to.equal("dir");
  });

  it("should apply dirFilter and fileFilter", async ()=>{
    readdirStub.resolves(["dirA", "dirB", "file1.txt", "file2.log"]);
    lstatStub.callsFake(async (pathName)=>{
      if (pathName.endsWith("dirA") || pathName.endsWith("dirB")) {
        //eslint-disable-next-line @stylistic/max-statements-per-line
        return { isDirectory: ()=>{ return true; }, isFile: ()=>{ return false; }, isSymbolicLink: ()=>{ return false; } };
      }
      //eslint-disable-next-line @stylistic/max-statements-per-line
      return { isDirectory: ()=>{ return false; }, isFile: ()=>{ return true; }, isSymbolicLink: ()=>{ return false; } };
    });
    isComponentDirStub.resolves(false);

    const options = {
      filter: {
        dir: /dirA/,
        file: /\.txt$/
      }
    };
    const result = await ls("/some/dirFilterTest", options);
    expect(result).to.have.lengthOf(2);
    //eslint-disable-next-line @stylistic/max-statements-per-line
    expect(result.some((e)=>{ return e.name === "dirA"; })).to.be.true;
    //eslint-disable-next-line @stylistic/max-statements-per-line
    expect(result.some((e)=>{ return e.name === "file1.txt"; })).to.be.true;
  });

  it("should correctly handle symbolic links to directories/files and push them to the list", async ()=>{
    readdirStub.resolves(["linkToDir", "linkToFile"]);
    //eslint-disable-next-line no-unused-vars
    lstatStub.callsFake(async (_pathName)=>{
      return {
        isDirectory: ()=>{ return false; },
        isFile: ()=>{ return false; },
        isSymbolicLink: ()=>{ return true; }
      };
    });

    statStub.callsFake(async (pathName)=>{
      if (pathName.endsWith("linkToDir")) {
        //eslint-disable-next-line @stylistic/max-statements-per-line
        return { isDirectory: ()=>{ return true; }, isFile: ()=>{ return false; } };
      }
      //eslint-disable-next-line @stylistic/max-statements-per-line
      return { isDirectory: ()=>{ return false; }, isFile: ()=>{ return true; } };
    });

    isComponentDirStub.resolves(true);

    const result = await ls("/some/symlinkDir");
    expect(result).to.have.lengthOf(2);

    //eslint-disable-next-line @stylistic/max-statements-per-line
    const dirLink = result.find((e)=>{ return e.name === "linkToDir"; });
    expect(dirLink.type).to.equal("dir");
    expect(dirLink.islink).to.be.true;
    expect(dirLink.isComponentDir).to.be.true;

    //eslint-disable-next-line @stylistic/max-statements-per-line
    const fileLink = result.find((e)=>{ return e.name === "linkToFile"; });
    expect(fileLink.type).to.equal("file");
    expect(fileLink.islink).to.be.true;
  });

  it("should handle broken symbolic link (ENOENT) as deadlink", async ()=>{
    readdirStub.resolves(["brokenLink"]);

    lstatStub.resolves({
      isDirectory: ()=>{ return false; },
      isFile: ()=>{ return false; },
      isSymbolicLink: ()=>{ return true; }
    });

    statStub.rejects({ code: "ENOENT" });

    const result = await ls("/broken/linktest");
    expect(result).to.have.lengthOf(1);
    expect(result[0]).to.include({
      name: "brokenLink",
      type: "deadlink",
      islink: true
    });
  });

  it("should throw an error if symbolic link stat error is not ENOENT", async ()=>{
    readdirStub.resolves(["someLink"]);
    lstatStub.resolves({
      isDirectory: ()=>{ return false; },
      isFile: ()=>{ return false; },
      isSymbolicLink: ()=>{ return true; }
    });
    statStub.rejects({ code: "EACCES", message: "permission denied" });

    try {
      await ls("/error/link");
      expect.fail("Expected ls to throw an error, but it did not");
    } catch (err) {
      expect(err.message).to.equal("permission denied");
    }
  });

  it("should add ../ entry if withParentDir=true", async ()=>{
    readdirStub.resolves([]);
    const options = { withParentDir: true };

    const result = await ls("/parent/dir", options);
    expect(result).to.have.lengthOf(1);
    expect(result[0]).to.include({ name: "../", type: "dir", islink: false });
  });

  it("should bundle serial-numbered files if SND=true", async ()=>{
    readdirStub.resolves(["file_001.txt", "file_002.txt", "file_003.log", "normal.txt"]);
    //eslint-disable-next-line no-unused-vars
    lstatStub.callsFake(async (_fullPath)=>{
      return {
        isDirectory: ()=>{ return false; },
        isFile: ()=>{ return true; },
        isSymbolicLink: ()=>{ return false; }
      };
    });
    isComponentDirStub.resolves(false);

    const options = { SND: true };

    const result = await ls("/some/serial", options);
    expect(result).to.have.lengthOf(3);

    //eslint-disable-next-line @stylistic/max-statements-per-line
    const sndItem = result.find((e)=>{ return e.type === "snd"; });
    expect(sndItem.name).to.equal("file_*.txt");

    //eslint-disable-next-line @stylistic/max-statements-per-line
    const file003 = result.find((e)=>{ return e.name === "file_003.log"; });
    expect(file003.type).to.equal("file");

    //eslint-disable-next-line @stylistic/max-statements-per-line
    const normalFile = result.find((e)=>{ return e.name === "normal.txt"; });
    expect(normalFile.type).to.equal("file");
  });

  it("should return sorted dirList then fileList if SND=false", async ()=>{
    readdirStub.resolves(["zzzFile", "aaaDir", "midFile"]);
    lstatStub.callsFake(async (p)=>{
      if (p.endsWith("zzzFile") || p.endsWith("midFile")) {
        //eslint-disable-next-line @stylistic/max-statements-per-line
        return { isDirectory: ()=>{ return false; }, isFile: ()=>{ return true; }, isSymbolicLink: ()=>{ return false; } };
      }
      //eslint-disable-next-line @stylistic/max-statements-per-line
      return { isDirectory: ()=>{ return true; }, isFile: ()=>{ return false; }, isSymbolicLink: ()=>{ return false; } };
    });
    isComponentDirStub.resolves(false);

    const result = await ls("/sort/test", { SND: false });
    expect(result).to.have.lengthOf(3);
    expect(result[0].name).to.equal("aaaDir");
    expect(result[1].name).to.equal("midFile");
    expect(result[2].name).to.equal("zzzFile");
  });

  it("should skip symbolic link to a directory if dirFilter doesn't match", async ()=>{
    readdirStub.resolves(["linkDir"]);
    lstatStub.resolves({
      isDirectory: ()=>{ return false; },
      isFile: ()=>{ return false; },
      isSymbolicLink: ()=>{ return true; }
    });
    //eslint-disable-next-line @stylistic/max-statements-per-line
    statStub.resolves({ isDirectory: ()=>{ return true; }, isFile: ()=>{ return false; } });

    const options = {
      sendDirname: true,
      filter: {
        dir: /SHOULD_NOT_MATCH/
      }
    };

    const result = await ls("/test/symlinkDir", options);
    expect(result).to.have.lengthOf(0);
  });

  it("should skip symbolic link to a file if fileFilter doesn't match", async ()=>{
    readdirStub.resolves(["linkFile"]);
    lstatStub.resolves({
      isDirectory: ()=>{ return false; },
      isFile: ()=>{ return false; },
      isSymbolicLink: ()=>{ return true; }
    });
    //eslint-disable-next-line @stylistic/max-statements-per-line
    statStub.resolves({ isDirectory: ()=>{ return false; }, isFile: ()=>{ return true; } });

    const options = {
      sendFilename: true,
      filter: {
        file: /\\.txt$/
      }
    };

    const result = await ls("/test/symlinkFile", options);
    expect(result).to.have.lengthOf(0);
  });
});
