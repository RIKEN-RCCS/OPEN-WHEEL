/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path = require("path");
const fs = require("fs-extra");

//setup test framework
const { describe, it, beforeEach, afterEach } = require("mocha");
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

const sinon = require("sinon");

describe("#ls", ()=>{
  let rewireFileBrowser;
  let ls;
  let fsMock; //fs-extra をモック化
  let isComponentDirMock; //isComponentDir をモック化

  beforeEach(()=>{
    //fileBrowser.js を rewire で読み込み
    rewireFileBrowser = rewire("../../../app/core/fileBrowser.js");

    //テスト対象の関数 ls を取得
    ls = rewireFileBrowser.__get__("ls");

    //fs のメソッドをすべて sinon.stub() 化し、名称は XXXXMock にする
    fsMock = {
      readdir: sinon.stub(),
      lstat: sinon.stub(),
      stat: sinon.stub()
    };

    //isComponentDir を stub 化
    isComponentDirMock = sinon.stub();

    //rewire で差し替え
    rewireFileBrowser.__set__("fs", fsMock);
    rewireFileBrowser.__set__("isComponentDir", isComponentDirMock);
  });

  afterEach(()=>{
    //テスト後にスタブをリセット
    sinon.restore();
  });

  it("should return empty array if the directory is empty", async ()=>{
    //readdir が空配列を返す
    fsMock.readdir.resolves([]);

    const result = await ls("/dummy/dir");
    expect(result).to.be.an("array").that.is.empty;
  });

  it("should filter out entries if allFilter does not match", async ()=>{
    //readdir が2つのエントリを返すが、allFilter に合わないものは除外
    fsMock.readdir.resolves(["keepThis", "skipThis"]);
    fsMock.lstat.resolves({ isDirectory: ()=>true, isFile: ()=>false, isSymbolicLink: ()=>false });
    isComponentDirMock.resolves(false);

    //allFilter を /keep/ に
    const options = {
      filter: {
        all: /keep/
      }
    };
    const result = await ls("/some/dir", options);
    //期待: "keepThis" は残り、"skipThis" はフィルタで除外される
    expect(result).to.have.lengthOf(1);
    expect(result[0]).to.include({ name: "keepThis", type: "dir" });
  });

  it("should skip lstat error entries", async ()=>{
    //readdir が3つ返す
    fsMock.readdir.resolves(["okDir", "badEntry", "okFile"]);

    //"okDir" 用の lstat は正常返却(ディレクトリ)
    fsMock.lstat.callsFake(async (pathName)=>{
      if (pathName.endsWith("okDir")) {
        return { isDirectory: ()=>true, isFile: ()=>false, isSymbolicLink: ()=>false };
      }
      if (pathName.endsWith("badEntry")) {
        //lstat で何らかのエラー発生 => そのエントリはスキップ
        throw new Error("some lstat error");
      }
      //"okFile"
      return { isDirectory: ()=>false, isFile: ()=>true, isSymbolicLink: ()=>false };
    });

    //ディレクトリかつ sendDirname = true => ディレクトリ配列へ
    //ファイルかつ sendFilename = true => ファイル配列へ
    isComponentDirMock.resolves(false);

    const result = await ls("/dummy/path");
    //badEntry はスキップされ、okDir と okFile が帰ってくる
    expect(result).to.have.lengthOf(2);
    expect(result.some((e)=>e.name === "okDir" && e.type === "dir")).to.be.true;
    expect(result.some((e)=>e.name === "okFile" && e.type === "file")).to.be.true;
  });

  it("should skip directories if sendDirname=false, skip files if sendFilename=false", async ()=>{
    fsMock.readdir.resolves(["someDir", "someFile"]);
    fsMock.lstat.callsFake(async (pathName)=>{
      if (pathName.endsWith("someDir")) {
        return { isDirectory: ()=>true, isFile: ()=>false, isSymbolicLink: ()=>false };
      }
      //file
      return { isDirectory: ()=>false, isFile: ()=>true, isSymbolicLink: ()=>false };
    });
    isComponentDirMock.resolves(false);

    //ディレクトリ名は送らない(sendDirname=false)、ファイル名は送る(sendFilename=true) と設定
    const opts1 = { sendDirname: false, sendFilename: true };
    const result1 = await ls("/test/path1", opts1);
    expect(result1).to.have.lengthOf(1);
    expect(result1[0].type).to.equal("file");

    //ディレクトリ名は送る(sendDirname=true)、ファイル名は送らない(sendFilename=false) と設定
    const opts2 = { sendDirname: true, sendFilename: false };
    const result2 = await ls("/test/path2", opts2);
    expect(result2).to.have.lengthOf(1);
    expect(result2[0].type).to.equal("dir");
  });

  it("should apply dirFilter and fileFilter", async ()=>{
    fsMock.readdir.resolves(["dirA", "dirB", "file1.txt", "file2.log"]);
    //dirA / dirB は isDirectory
    //file1 / file2 は isFile
    fsMock.lstat.callsFake(async (pathName)=>{
      if (pathName.endsWith("dirA") || pathName.endsWith("dirB")) {
        return { isDirectory: ()=>true, isFile: ()=>false, isSymbolicLink: ()=>false };
      }
      return { isDirectory: ()=>false, isFile: ()=>true, isSymbolicLink: ()=>false };
    });
    isComponentDirMock.resolves(false);

    const options = {
      filter: {
        dir: /dirA/,
        file: /\.txt$/
      }
    };
    const result = await ls("/some/dirFilterTest", options);
    //dirFilter=/dirA/ に合うのは dirA だけ
    //fileFilter=/\.txt$/ に合うのは file1.txt だけ
    expect(result).to.have.lengthOf(2);
    expect(result.some((e)=>e.name === "dirA")).to.be.true;
    expect(result.some((e)=>e.name === "file1.txt")).to.be.true;
    //dirB, file2.log は除外
  });

  it("should correctly handle symbolic links to directories/files and push them to the list", async ()=>{
    fsMock.readdir.resolves(["linkToDir", "linkToFile"]);
    //eslint-disable-next-line no-unused-vars
    fsMock.lstat.callsFake(async (_pathName)=>{
      //シンボリックリンク扱い
      return {
        isDirectory: ()=>false,
        isFile: ()=>false,
        isSymbolicLink: ()=>true
      };
    });

    //stat の結果でディレクトリ or ファイルに振り分け
    fsMock.stat.callsFake(async (pathName)=>{
      if (pathName.endsWith("linkToDir")) {
        return { isDirectory: ()=>true, isFile: ()=>false };
      }
      //linkToFile
      return { isDirectory: ()=>false, isFile: ()=>true };
    });

    isComponentDirMock.resolves(true); //シンボリックリンク先ディレクトリが componentDir という想定

    const result = await ls("/some/symlinkDir");
    expect(result).to.have.lengthOf(2);

    //linkToDir: type=dir, islink=true, isComponentDir=true
    const dirLink = result.find((e)=>e.name === "linkToDir");
    expect(dirLink.type).to.equal("dir");
    expect(dirLink.islink).to.be.true;
    expect(dirLink.isComponentDir).to.be.true;

    //linkToFile: type=file, islink=true
    const fileLink = result.find((e)=>e.name === "linkToFile");
    expect(fileLink.type).to.equal("file");
    expect(fileLink.islink).to.be.true;
  });

  it("should handle broken symbolic link (ENOENT) as deadlink", async ()=>{
    fsMock.readdir.resolves(["brokenLink"]);

    fsMock.lstat.resolves({
      isDirectory: ()=>false,
      isFile: ()=>false,
      isSymbolicLink: ()=>true
    });

    //fs.stat が ENOENT エラーを投げる
    fsMock.stat.rejects({ code: "ENOENT" });

    const result = await ls("/broken/linktest");
    expect(result).to.have.lengthOf(1);
    expect(result[0]).to.include({
      name: "brokenLink",
      type: "deadlink",
      islink: true
    });
  });

  it("should throw an error if symbolic link stat error is not ENOENT", async ()=>{
    fsMock.readdir.resolves(["someLink"]);
    fsMock.lstat.resolves({
      isDirectory: ()=>false,
      isFile: ()=>false,
      isSymbolicLink: ()=>true
    });
    //stat が EACCES など ENOENT 以外のエラー
    fsMock.stat.rejects({ code: "EACCES", message: "permission denied" });

    //ls は例外を投げる
    try {
      await ls("/error/link");
      expect.fail("Expected ls to throw an error, but it did not");
    } catch (err) {
      expect(err.message).to.equal("permission denied");
    }
  });

  it("should add ../ entry if withParentDir=true", async ()=>{
    fsMock.readdir.resolves([]);
    const options = { withParentDir: true };

    const result = await ls("/parent/dir", options);
    //ファイルやディレクトリは無いが、../ が追加される
    expect(result).to.have.lengthOf(1);
    expect(result[0]).to.include({ name: "../", type: "dir", islink: false });
  });

  it("should bundle serial-numbered files if SND=true", async ()=>{
    fsMock.readdir.resolves(["file_001.txt", "file_002.txt", "file_003.log", "normal.txt"]);
    //全て isFile で仮定
    //eslint-disable-next-line no-unused-vars
    fsMock.lstat.callsFake(async (_fullPath)=>{
      return {
        isDirectory: ()=>false,
        isFile: ()=>true,
        isSymbolicLink: ()=>false
      };
    });
    //isComponentDir は呼ばれない(ファイルのみなので)
    //ただし安全に stub を定義しておく
    isComponentDirMock.resolves(false);

    //連番ファイルをまとめる設定 SND=true
    const options = { SND: true };

    const result = await ls("/some/serial", options);
    //連番ファイル "file_001.txt" "file_002.txt" が１つの glob (snd) にバンドルされる
    expect(result).to.have.lengthOf(3);

    const sndItem = result.find((e)=>e.type === "snd");
    expect(sndItem.name).to.equal("file_*.txt");

    const file003 = result.find((e)=>e.name === "file_003.log");
    expect(file003.type).to.equal("file");

    const normalFile = result.find((e)=>e.name === "normal.txt");
    expect(normalFile.type).to.equal("file");
  });

  it("should return sorted dirList then fileList if SND=false", async ()=>{
    //名前順に並べ替えを確認するため、逆順を用意
    fsMock.readdir.resolves(["zzzFile", "aaaDir", "midFile"]);
    fsMock.lstat.callsFake(async (p)=>{
      if (p.endsWith("zzzFile") || p.endsWith("midFile")) {
        return { isDirectory: ()=>false, isFile: ()=>true, isSymbolicLink: ()=>false };
      }
      //aaaDir
      return { isDirectory: ()=>true, isFile: ()=>false, isSymbolicLink: ()=>false };
    });
    isComponentDirMock.resolves(false);

    //SND=false (デフォルト) ならそのままdirListとfileListを返す
    const result = await ls("/sort/test", { SND: false });
    //ソート後 => dir は "aaaDir" -> 次に file "midFile" -> "zzzFile"
    expect(result).to.have.lengthOf(3);
    expect(result[0].name).to.equal("aaaDir");
    expect(result[1].name).to.equal("midFile");
    expect(result[2].name).to.equal("zzzFile");
  });

  it("should skip symbolic link to a directory if dirFilter doesn't match", async ()=>{
    fsMock.readdir.resolves(["linkDir"]);
    //シンボリックリンク
    fsMock.lstat.resolves({
      isDirectory: ()=>false,
      isFile: ()=>false,
      isSymbolicLink: ()=>true
    });
    //シンボリックリンク先はディレクトリ
    fsMock.stat.resolves({ isDirectory: ()=>true, isFile: ()=>false });

    const options = {
      sendDirname: true,
      filter: {
        dir: /SHOULD_NOT_MATCH/ //name="linkDir" はマッチしない
      }
    };

    const result = await ls("/test/symlinkDir", options);
    //dirFilter に合わないので return; され、結果には含まれない
    expect(result).to.have.lengthOf(0);
  });

  it("should skip symbolic link to a file if fileFilter doesn't match", async ()=>{
    fsMock.readdir.resolves(["linkFile"]);
    //シンボリックリンク
    fsMock.lstat.resolves({
      isDirectory: ()=>false,
      isFile: ()=>false,
      isSymbolicLink: ()=>true
    });
    //シンボリックリンク先はファイル
    fsMock.stat.resolves({ isDirectory: ()=>false, isFile: ()=>true });

    const options = {
      sendFilename: true,
      filter: {
        file: /\.txt$/ //例えば linkFile は拡張子なし等でマッチしない
      }
    };

    const result = await ls("/test/symlinkFile", options);
    //fileFilter に合わないので return; され、結果には含まれない
    expect(result).to.have.lengthOf(0);
  });
});
