"use strict";
const path = require("path");
const fs = require("fs-extra");

//setup test framework
const chai = require("chai");
const expect = chai.expect;
const sinon = require("sinon");
chai.use(require("sinon-chai"));
chai.use(require("chai-fs"));
const rewire = require("rewire");

//testee
const fileManager = rewire("../../../app/routes/fileManager");
const onGetFileList = fileManager.__get__("onGetFileList");
const onGetSNDContents = fileManager.__get__("onGetSNDContents");
const onRemoveFile = fileManager.__get__("onRemoveFile");
const onRenameFile = fileManager.__get__("onRenameFile");
const onDownloadFile = fileManager.__get__("onDownloadFile");
const onCreateNewFile = fileManager.__get__("onCreateNewFile");
const onCreateNewDir = fileManager.__get__("onCreateNewDir");

//stubs
const emit = sinon.stub();
const cb = sinon.stub();

//helper function
const { gitInit } = require("../../../app/core/gitOperator2");

//fileManager.__set__("getLogger", ()=>{
//return { tarace: console.log, info: console.log, debug: console.log, error: console.log, warn: console.log };
//});

const testDirRoot = "WHEEL_TEST_TMP";

describe("fileManager UT", ()=>{
  beforeEach(async()=>{
    await fs.remove(testDirRoot);
    cb.reset();
    emit.reset();
    await gitInit(testDirRoot, "test user", "testUser@exeample.com");
    await Promise.all([
      fs.ensureDir(path.join(testDirRoot, "foo")),
      fs.ensureDir(path.join(testDirRoot, "bar")),
      fs.ensureDir(path.join(testDirRoot, "baz")),
      fs.ensureDir(path.join(testDirRoot, "foo_00")),
      fs.ensureDir(path.join(testDirRoot, "foo_01")),
      fs.ensureDir(path.join(testDirRoot, "foo_02")),
      fs.outputFile(path.join(testDirRoot, "foo_1"), "foo_1"),
      fs.outputFile(path.join(testDirRoot, "foo_2"), "foo_2"),
      fs.outputFile(path.join(testDirRoot, "foo_3"), "foo_3"),
      fs.outputFile(path.join(testDirRoot, "huga_1_100"), "huga_1_100"),
      fs.outputFile(path.join(testDirRoot, "huga_1_200"), "huga_1_200"),
      fs.outputFile(path.join(testDirRoot, "huga_1_300"), "huga_1_300"),
      fs.outputFile(path.join(testDirRoot, "huga_2_99"), "huga_2_99"),
      fs.outputFile(path.join(testDirRoot, "huga_3_100"), "huga_3_100"),
      fs.outputFile(path.join(testDirRoot, "huga_4_100"), "huga_4_100"),
      fs.outputFile(path.join(testDirRoot, "huga_4_200"), "huga_4_200"),
      fs.outputFile(path.join(testDirRoot, "huga_4_300"), "huga_4_300")
    ]);
    await Promise.all([
      fs.ensureSymlink(path.join(testDirRoot, "foo"), path.join(testDirRoot, "linkfoo")),
      fs.ensureSymlink(path.join(testDirRoot, "bar"), path.join(testDirRoot, "linkbar")),
      fs.ensureSymlink(path.join(testDirRoot, "baz"), path.join(testDirRoot, "linkbaz")),
      fs.ensureSymlink(path.join(testDirRoot, "foo_1"), path.join(testDirRoot, "linkpiyo")),
      fs.ensureSymlink(path.join(testDirRoot, "foo_2"), path.join(testDirRoot, "linkpuyo")),
      fs.ensureSymlink(path.join(testDirRoot, "foo_3"), path.join(testDirRoot, "linkpoyo"))
    ]);
  });
  after(async()=>{
    await fs.remove(testDirRoot);
  });
  describe("#getFileList", ()=>{
    it("should send filelist", async()=>{
      const uploader = {};
      await onGetFileList(uploader, emit, "dummy", path.resolve(testDirRoot), cb);
      expect(cb).to.have.been.calledOnce;
      expect(cb).to.have.been.calledWith(true);
      expect(emit).to.have.been.calledOnce;
      expect(emit).to.have.been.calledWith("fileList");
      const emitted = emit.args[0][1];
      expect(emitted).to.eql([
        { path: path.resolve(testDirRoot), name: ".git", type: "dir", islink: false },
        { path: path.resolve(testDirRoot), name: "bar", type: "dir", islink: false },
        { path: path.resolve(testDirRoot), name: "baz", type: "dir", islink: false },
        { path: path.resolve(testDirRoot), name: "foo", type: "dir", islink: false },
        { path: path.resolve(testDirRoot), name: "foo_*", type: "sndd", islink: false },
        { path: path.resolve(testDirRoot), name: "linkbar", type: "dir", islink: true },
        { path: path.resolve(testDirRoot), name: "linkbaz", type: "dir", islink: true },
        { path: path.resolve(testDirRoot), name: "linkfoo", type: "dir", islink: true },
        { path: path.resolve(testDirRoot), name: "foo_*", type: "snd", islink: false },
        { path: path.resolve(testDirRoot), name: "huga_*_100", type: "snd", islink: false },
        { path: path.resolve(testDirRoot), name: "huga_*_200", type: "snd", islink: false },
        { path: path.resolve(testDirRoot), name: "huga_*_300", type: "snd", islink: false },
        { path: path.resolve(testDirRoot), name: "huga_1_*", type: "snd", islink: false },
        { path: path.resolve(testDirRoot), name: "huga_2_99", type: "file", islink: false },
        { path: path.resolve(testDirRoot), name: "huga_4_*", type: "snd", islink: false },
        { path: path.resolve(testDirRoot), name: "linkpiyo", type: "file", islink: true },
        { path: path.resolve(testDirRoot), name: "linkpoyo", type: "file", islink: true },
        { path: path.resolve(testDirRoot), name: "linkpuyo", type: "file", islink: true }
      ]);
    });
  });
  describe("#getSNDContents", ()=>{
    it("should send contens of SND", async()=>{
      await onGetSNDContents(emit, "dummy", testDirRoot, "huga_*_200", false, cb);
      expect(cb).to.have.been.calledOnce;
      expect(cb).to.have.been.calledWith(true);
      expect(emit).to.have.been.calledOnce;
      expect(emit).to.have.been.calledWith("fileList");
      expect(emit.args[0][1]).to.deep.equal([
        { path: path.resolve(testDirRoot), name: "huga_1_200", type: "file", islink: false },
        { path: path.resolve(testDirRoot), name: "huga_4_200", type: "file", islink: false }
      ]);
    });
    it("should send foo_* files", async()=>{
      await onGetSNDContents(emit, "dummy", testDirRoot, "foo_*", false, cb);
      expect(cb).to.have.been.calledOnce;
      expect(cb).to.have.been.calledWith(true);
      expect(emit).to.have.been.calledOnce;
      expect(emit).to.have.been.calledWith("fileList");
      expect(emit.args[0][1]).to.deep.equal([
        { path: path.resolve(testDirRoot), name: "foo_1", type: "file", islink: false },
        { path: path.resolve(testDirRoot), name: "foo_2", type: "file", islink: false },
        { path: path.resolve(testDirRoot), name: "foo_3", type: "file", islink: false }
      ]);
    });
    it("should send foo_* directories", async()=>{
      await onGetSNDContents(emit, "dummy", testDirRoot, "foo_*", true, cb);
      expect(cb).to.have.been.calledOnce;
      expect(cb).to.have.been.calledWith(true);
      expect(emit).to.have.been.calledOnce;
      expect(emit).to.have.been.calledWith("fileList");
      expect(emit.args[0][1]).to.deep.equal([
        { path: path.resolve(testDirRoot), name: "foo_00", type: "dir", islink: false },
        { path: path.resolve(testDirRoot), name: "foo_01", type: "dir", islink: false },
        { path: path.resolve(testDirRoot), name: "foo_02", type: "dir", islink: false }
      ]);
    });
  });
  describe("#removeFile", ()=>{
    it("should remove directory", async()=>{
      await onRemoveFile(emit, testDirRoot, path.join(testDirRoot, "baz"), cb);
      expect(path.join(testDirRoot, "baz")).not.to.be.a.path();
      expect(cb).to.have.been.calledOnce;
      expect(cb).to.have.been.calledWith(true);
    });
    it("should remove reguler file", async()=>{
      await onRemoveFile(emit, testDirRoot, path.join(testDirRoot, "foo_1"), cb);
      expect(path.join(testDirRoot, "foo_1")).not.to.be.a.path();
      expect(cb).to.have.been.calledOnce;
      expect(cb).to.have.been.calledWith(true);
    });
    it("should remove symlink to directory", async()=>{
      await onRemoveFile(emit, testDirRoot, path.join(testDirRoot, "linkbar"), cb);
      expect(path.join(testDirRoot, "linkbar")).not.to.be.a.path();
      expect(cb).to.have.been.calledOnce;
      expect(cb).to.have.been.calledWith(true);
    });
    it("should remove symlink to file", async()=>{
      await onRemoveFile(emit, testDirRoot, path.join(testDirRoot, "linkpiyo"), cb);
      expect(path.join(testDirRoot, "linkpiyo")).not.to.be.a.path();
      expect(cb).to.have.been.calledOnce;
      expect(cb).to.have.been.calledWith(true);
    });
  });
  describe("#renameFile", ()=>{
    it("should rename directory", async()=>{
      await onRenameFile(emit, testDirRoot, { path: testDirRoot, oldName: "baz", newName: "hoge" }, cb);
      expect(cb).to.have.been.calledOnce;
      expect(cb).to.have.been.calledWith(true);
      expect(path.join(testDirRoot, "baz")).not.to.be.a.path();
      expect(path.join(testDirRoot, "hoge")).to.be.a.directory();
    });
    it("should rename reguler file", async()=>{
      await onRenameFile(emit, testDirRoot, { path: testDirRoot, oldName: "foo_1", newName: "hoge" }, cb);
      expect(cb).to.have.been.calledOnce;
      expect(cb).to.have.been.calledWith(true);
      expect(path.join(testDirRoot, "foo_1")).not.to.be.a.path();
      expect(path.join(testDirRoot, "hoge")).to.be.a.file();
    });
    it("should rename symlink to directory", async()=>{
      await onRenameFile(emit, testDirRoot, { path: testDirRoot, oldName: "linkbar", newName: "hoge" }, cb);
      expect(cb).to.have.been.calledOnce;
      expect(cb).to.have.been.calledWith(true);
      expect(path.join(testDirRoot, "linkbar")).not.to.be.a.path();
      expect(path.join(testDirRoot, "hoge")).to.be.a.directory();
    });
    it("should rename symlink to file", async()=>{
      await onRenameFile(emit, testDirRoot, { path: testDirRoot, oldName: "linkpiyo", newName: "hoge" }, cb);
      expect(cb).to.have.been.calledOnce;
      expect(cb).to.have.been.calledWith(true);
      expect(path.join(testDirRoot, "linkpiyo")).not.to.be.a.path();
      expect(path.join(testDirRoot, "hoge")).to.be.a.file();
    });
  });
  describe("#downloadFile", ()=>{
    it("should send file", async()=>{
      await onDownloadFile(emit, "dummy", { path: testDirRoot, name: "foo_1" }, cb);
      expect(cb).to.have.been.calledOnce;
      expect(cb).to.have.been.calledWith(true);
      expect(emit).to.have.been.calledOnce;
      expect(emit).to.have.been.calledWith("downloadData");
      const sendData = emit.args[0][1];
      expect(sendData.toString()).to.equal("foo_1");
    });
    it("should not send directory", async()=>{
      await onDownloadFile(emit, "dummy", { path: testDirRoot, name: "foo" }, cb);
      expect(cb).to.have.been.calledOnce;
      expect(cb).to.have.been.calledWith(false);
      expect(emit).not.to.have.been.called;
    });
  });
  describe("#createNewFile", ()=>{
    it("should create new file by relative path", async()=>{
      await onCreateNewFile(emit, testDirRoot, path.join(testDirRoot, "hoge"), cb);
      expect(path.join(testDirRoot, "hoge")).to.be.a.file().and.empty;
    });
    it("should create new file by absolute path", async()=>{
      await onCreateNewFile(emit, testDirRoot, path.resolve(testDirRoot, "hoge"), cb);
      expect(path.join(testDirRoot, "hoge")).to.be.a.file().and.empty;
    });
  });
  describe("#createNewDir", async()=>{
    it("should create new directory by relative path", async()=>{
      await onCreateNewDir(emit, testDirRoot, path.join(testDirRoot, "hoge"), cb);
      expect(path.join(testDirRoot, "hoge")).to.be.a.directory().with.files([".gitkeep"]);
    });
    it("should create new directory by absolute path", async()=>{
      await onCreateNewDir(emit, testDirRoot, path.resolve(testDirRoot, "hoge"), cb);
      expect(path.join(testDirRoot, "hoge")).to.be.a.directory().with.files([".gitkeep"]);
    });
  });
});
