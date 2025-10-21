/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */

import { expect } from "chai";
import sinon from "sinon";
import path from "path";
import { _internal, readJsonGreedy, addX, openFile, saveFile, getUnusedPath, replaceCRLF } from "../../../app/core/fileUtils.js";

describe("#readJsonGreedy", ()=>{
  let readFileStub;
  let promiseRetryStub;

  beforeEach(()=>{
    readFileStub = sinon.stub(_internal.fs, "readFile");
    promiseRetryStub = sinon.stub(_internal, "promiseRetry").callsFake(async (retryFn, options)=>{
      let lastError;
      for (let i = 0; i <= (options.retries || 0); i++) {
        try {
          const result = await retryFn((err)=>{
            throw err;
          });
          return result;
        } catch (err) {
          lastError = err;
        }
      }
      throw lastError;
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return parsed JSON when readFile succeeds on first try", async ()=>{
    readFileStub.resolves(Buffer.from("{\"hello\":\"world\"}", "utf8"));

    const result = await readJsonGreedy("/path/to/file.json", 1);

    expect(promiseRetryStub.calledOnce).to.be.true;
    expect(result).to.deep.equal({ hello: "world" });
  });

  it("should retry on ENOENT and succeed on second try", async ()=>{
    readFileStub
      .onCall(0).rejects(Object.assign(new Error("File not found"), { code: "ENOENT" }))
      .onCall(1)
      .resolves(Buffer.from("{\"retry\":\"success\"}", "utf8"));

    const result = await readJsonGreedy("/path/to/missing.json", 2);

    expect(readFileStub.callCount).to.equal(2);
    expect(result).to.deep.equal({ retry: "success" });
  });

  it("should throw error if readFile fails with non-ENOENT error", async ()=>{
    readFileStub.rejects(Object.assign(new Error("Permission denied"), { code: "EACCES" }));

    try {
      await readJsonGreedy("/path/to/noaccess.json", 1);
      expect.fail("Expected to throw error");
    } catch (err) {
      expect(err.message).to.equal("Permission denied");
    }
  });

  it("should retry when file content is empty", async ()=>{
    readFileStub
      .onCall(0).resolves(Buffer.from("", "utf8"))
      .onCall(1)
      .resolves(Buffer.from("{\"ok\":\"done\"}", "utf8"));

    const result = await readJsonGreedy("/path/to/empty.json", 2);
    expect(readFileStub.callCount).to.equal(2);
    expect(result).to.deep.equal({ ok: "done" });
  });

  it("should retry on SyntaxError when parsing JSON", async ()=>{
    readFileStub
      .onCall(0).resolves(Buffer.from("{invalid JSON...", "utf8"))
      .onCall(1)
      .resolves(Buffer.from("{\"valid\":true}", "utf8"));

    const result = await readJsonGreedy("/path/to/syntaxerror.json", 2);
    expect(readFileStub.callCount).to.equal(2);
    expect(result).to.deep.equal({ valid: true });
  });

  it("should throw error if parse fails with non-SyntaxError", async ()=>{
    const customError = new Error("Unknown parse error");
    const parseStub = sinon.stub(JSON, "parse").throws(customError);

    readFileStub.resolves(Buffer.from("{\"dummy\":\"data\"}", "utf8"));

    try {
      await readJsonGreedy("/path/to/unknownerror.json", 1);
      expect.fail("Expected to throw custom error");
    } catch (err) {
      expect(err).to.equal(customError);
    } finally {
      parseStub.restore();
    }
  });

  it("should use default retries (10) if second argument is not a number", async ()=>{
    readFileStub.resolves(Buffer.from("{\"default\":\"retry\"}"));

    await readJsonGreedy("/dummy/path.json");
    const args = promiseRetryStub.getCall(0).args[1];
    expect(args.retries).to.equal(10);
    expect(args.minTimeout).to.equal(500);
    expect(args.factor).to.equal(1);
  });
});

describe("#addX", ()=>{
  let statStub;
  let chmodStub;
  let modeStub;

  beforeEach(()=>{
    statStub = sinon.stub(_internal.fs, "stat");
    chmodStub = sinon.stub(_internal.fs, "chmod");
    modeStub = sinon.stub(_internal, "Mode");
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should set '444' if no read/write bits are set (owner/group/others)", async ()=>{
    statStub.resolves({});
    modeStub.returns({
      owner: { read: false, write: false },
      group: { read: false, write: false },
      others: { read: false, write: false }
    });
    chmodStub.resolves();

    const filePath = "/dummy/path";
    await addX(filePath);

    expect(chmodStub.calledOnceWithExactly(filePath, "444")).to.be.true;
  });

  it("should set '555' if only read bits are set for owner/group/others", async ()=>{
    statStub.resolves({});
    modeStub.returns({
      owner: { read: true, write: false },
      group: { read: true, write: false },
      others: { read: true, write: false }
    });
    chmodStub.resolves();

    const filePath = "/dummy/path";
    await addX(filePath);

    expect(chmodStub.calledOnceWithExactly(filePath, "555")).to.be.true;
  });

  it("should set '666' if only write bits are set for owner/group/others", async ()=>{
    statStub.resolves({});
    modeStub.returns({
      owner: { read: false, write: true },
      group: { read: false, write: true },
      others: { read: false, write: true }
    });
    chmodStub.resolves();

    const filePath = "/dummy/path";
    await addX(filePath);

    expect(chmodStub.calledOnceWithExactly(filePath, "666")).to.be.true;
  });

  it("should set '777' if read and write bits are set for owner/group/others", async ()=>{
    statStub.resolves({});
    modeStub.returns({
      owner: { read: true, write: true },
      group: { read: true, write: true },
      others: { read: true, write: true }
    });
    chmodStub.resolves();

    const filePath = "/dummy/path";
    await addX(filePath);

    expect(chmodStub.calledOnceWithExactly(filePath, "777")).to.be.true;
  });

  it("should set mixed bits correctly if only owner has read/write, group has read only, others none", async ()=>{
    statStub.resolves({});
    modeStub.returns({
      owner: { read: true, write: true },
      group: { read: true, write: false },
      others: { read: false, write: false }
    });
    chmodStub.resolves();

    const filePath = "/dummy/path";
    await addX(filePath);

    expect(chmodStub.calledOnceWithExactly(filePath, "754")).to.be.true;
  });

  it("should reject if fs.stat fails", async ()=>{
    const statError = new Error("stat error");
    statStub.rejects(statError);

    try {
      await addX("/some/path");
      expect.fail("Expected addX to reject, but it resolved");
    } catch (err) {
      expect(err).to.equal(statError);
    }
    expect(chmodStub.called).to.be.false;
  });

  it("should reject if fs.chmod fails", async ()=>{
    statStub.resolves({});
    modeStub.returns({
      owner: { read: false, write: false },
      group: { read: false, write: false },
      others: { read: false, write: false }
    });
    const chmodError = new Error("chmod error");
    chmodStub.rejects(chmodError);

    try {
      await addX("/some/path");
      expect.fail("Expected addX to reject, but it resolved");
    } catch (err) {
      expect(err).to.equal(chmodError);
    }
  });
});

describe("#openFile", ()=>{
  let readFileStub;
  let ensureFileStub;
  let readJsonGreedyStub;
  let getLoggerStub;
  let loggerWarnStub;
  const dummyProjectRoot = "/dummy/projectRoot";

  beforeEach(()=>{
    readFileStub = sinon.stub(_internal.fs, "readFile");
    ensureFileStub = sinon.stub(_internal.fs, "ensureFile");
    readJsonGreedyStub = sinon.stub(_internal, "readJsonGreedy");
    loggerWarnStub = sinon.stub();
    getLoggerStub = sinon.stub(_internal, "getLogger").returns({ warn: loggerWarnStub });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should create an empty file and return empty content object if file does not exist (ENOENT)", async ()=>{
    readFileStub.rejects({ code: "ENOENT" });
    ensureFileStub.resolves();

    const result = await openFile(dummyProjectRoot, "notExist.txt");

    expect(ensureFileStub.calledOnce).to.be.true;
    expect(result).to.have.lengthOf(1);
    expect(result[0].content).to.equal("");
    expect(result[0].filename).to.equal("notExist.txt");
  });

  it("should throw an error if fs.readFile fails with non-ENOENT error", async ()=>{
    readFileStub.rejects(new Error("Unknown error"));

    try {
      await openFile(dummyProjectRoot, "someFile.txt");
      expect.fail("Expected openFile to throw but it did not");
    } catch (err) {
      expect(err).to.be.an("Error");
      expect(err.message).to.equal("Unknown error");
    }
  });

  it("should return single object if forceNormal = true", async ()=>{
    readFileStub.resolves(Buffer.from("normal content"));
    const result = await openFile(dummyProjectRoot, "normalFile.txt", true);

    expect(result).to.have.lengthOf(1);
    expect(result[0]).to.deep.include({
      content: "normal content",
      filename: "normalFile.txt"
    });
  });

  it("should return single object if JSON.parse fails (not a parameter file)", async ()=>{
    readFileStub.resolves(Buffer.from("{ invalid JSON"));
    const result = await openFile(dummyProjectRoot, "invalid.json");

    expect(result).to.have.lengthOf(1);
    expect(result[0]).to.deep.include({
      filename: "invalid.json",
      content: "{ invalid JSON"
    });
  });

  it("should return single object if parsed JSON does not have targetFiles property", async ()=>{
    readFileStub.resolves(Buffer.from("{\"someKey\": 123}"));
    const result = await openFile(dummyProjectRoot, "noTargetFiles.json");

    expect(result).to.have.lengthOf(1);
    expect(result[0].filename).to.equal("noTargetFiles.json");
    expect(result[0].content).to.equal("{\"someKey\": 123}");
  });

  it("should return single object if targetFiles is not an array", async ()=>{
    readFileStub.resolves(Buffer.from("{\"targetFiles\": \"not array\"}"));
    const result = await openFile(dummyProjectRoot, "notArray.json");

    expect(result).to.have.lengthOf(1);
    expect(result[0].content).to.equal("{\"targetFiles\": \"not array\"}");
  });

  it("should read multiple target files if parameter setting file has array of string targetFiles", async ()=>{
    readFileStub.onCall(0).resolves(Buffer.from(JSON.stringify({
      targetFiles: ["sub1.txt", "sub2.txt"]
    })));
    readJsonGreedyStub.resolves({
      componentPath: {}
    });
    readFileStub.onCall(1).resolves(Buffer.from("content sub1"));
    readFileStub.onCall(2).resolves(Buffer.from("content sub2"));

    const result = await openFile(dummyProjectRoot, "param.json");

    expect(result).to.have.lengthOf(3);
    expect(result[0]).to.include({
      filename: "param.json",
      isParameterSettingFile: true
    });
    expect(result[1]).to.include({
      content: "content sub1",
      filename: "sub1.txt"
    });
    expect(result[2]).to.include({
      content: "content sub2",
      filename: "sub2.txt"
    });
  });

  it("should handle target files which are object with only targetName (no targetNode)", async ()=>{
    readFileStub.onCall(0).resolves(Buffer.from(JSON.stringify({
      targetFiles: [
        { targetName: "hello.txt" }
      ]
    })));
    readJsonGreedyStub.resolves({ componentPath: {} });
    readFileStub.onCall(1).resolves(Buffer.from("hello content"));

    const result = await openFile(dummyProjectRoot, "paramObj.json");

    expect(result).to.have.lengthOf(2);
    expect(result[0]).to.have.property("isParameterSettingFile", true);
    expect(result[1]).to.include({
      filename: "hello.txt",
      content: "hello content"
    });
  });
});

describe("#saveFile", ()=>{
  let writeFileStub;
  let pathExistsStub;
  let gitAddStub;

  beforeEach(()=>{
    writeFileStub = sinon.stub(_internal.fs, "writeFile").resolves();
    pathExistsStub = sinon.stub(_internal.fs, "pathExists");
    sinon.stub(_internal.path, "resolve").returns("/home/user/project/file.txt");
    sinon.stub(_internal.path, "parse").returns({ root: "/home", dir: "/home/user/project", base: "file.txt", name: "file", ext: ".txt" });
    sinon.stub(_internal.path, "dirname")
      .onCall(0)
      .returns("/home/user/project")
      .onCall(1)
      .returns("/home/user")
      .onCall(2)
      .returns("/home")
      .returns("/"); //Default for subsequent calls
    sinon.stub(_internal.path, "join").callsFake((dir, file)=>{ return `${dir}/${file}`; });
    gitAddStub = sinon.stub(_internal, "gitAdd").resolves();
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should save file and add to git when .git directory is found at the same level", async ()=>{
    pathExistsStub.callsFake(async (p)=>{
      if (p === "/home/user/project/.git") {
        return true;
      }
      return false;
    });
    await saveFile("file.txt", "Hello, world!");

    expect(writeFileStub.calledOnceWithExactly("/home/user/project/file.txt", "Hello, world!")).to.be.true;
    expect(pathExistsStub.calledWith("/home/user/project/.git")).to.be.true; //Check that it was called with the correct path
    expect(gitAddStub.calledOnceWithExactly("/home/user/project", "/home/user/project/file.txt")).to.be.true;
  });

  it("should throw an error if no .git repository is found up to root directory", async ()=>{
    pathExistsStub.resolves(false); //Always return false

    try {
      await saveFile("file.txt", "No .git anywhere");
      expect.fail("Expected an error but none was thrown");
    } catch (err) {
      expect(err).to.be.instanceOf(Error);
      expect(err.message).to.equal("git repository not found");
      expect(err.filename).to.equal("file.txt");
      expect(err.absFilename).to.equal("/home/user/project/file.txt");
    }

    expect(gitAddStub.notCalled).to.be.true;
  });

  it("should throw an error if fs.writeFile fails", async ()=>{
    const writeError = new Error("Write operation failed");
    writeFileStub.rejects(writeError);

    try {
      await saveFile("file.txt", "some content");
      expect.fail("Expected an error due to fs.writeFile, but none was thrown");
    } catch (err) {
      expect(err).to.equal(writeError);
    }

    expect(gitAddStub.notCalled).to.be.true;
  });
});

describe("#getUnusedPath", ()=>{
  let pathExistsStub;

  beforeEach(()=>{
    pathExistsStub = sinon.stub(_internal.fs, "pathExists");
    sinon.stub(_internal.path, "resolve").callsFake((...args)=>{ return args.join("/"); });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return the desired path if it does not exist", async ()=>{
    pathExistsStub.resolves(false);

    const parent = "/mock/parent/dir";
    const name = "testFile.txt";

    const result = await getUnusedPath(parent, name);

    expect(pathExistsStub.calledOnceWithExactly("/mock/parent/dir/testFile.txt")).to.be.true;
    expect(result).to.equal("/mock/parent/dir/testFile.txt");
  });

  it("should return a suffixed path if the desired path already exists", async ()=>{
    pathExistsStub
      .onFirstCall().resolves(true)
      .onSecondCall()
      .resolves(true)
      .onThirdCall()
      .resolves(false);

    const parent = "/mock/parent/dir";
    const name = "testFile.txt";

    const result = await getUnusedPath(parent, name);

    expect(pathExistsStub.callCount).to.equal(3);
    expect(pathExistsStub.getCall(0).args[0]).to.equal("/mock/parent/dir/testFile.txt");
    expect(pathExistsStub.getCall(1).args[0]).to.equal("/mock/parent/dir/testFile.txt.1");
    expect(pathExistsStub.getCall(2).args[0]).to.equal("/mock/parent/dir/testFile.txt.2");
    expect(result).to.equal("/mock/parent/dir/testFile.txt.2");
  });
});

describe("#replaceCRLF", ()=>{
  let readFileStub;
  let writeFileStub;

  beforeEach(()=>{
    readFileStub = sinon.stub(_internal.fs, "readFile");
    writeFileStub = sinon.stub(_internal.fs, "writeFile");
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should replace CRLF with LF and write the file back", async ()=>{
    readFileStub.resolves(Buffer.from("line1\r\nline2\r\n"));
    writeFileStub.resolves();

    await replaceCRLF("/path/to/windowsfile.txt");

    expect(readFileStub.calledOnceWithExactly("/path/to/windowsfile.txt")).to.be.true;
    expect(writeFileStub.calledOnce).to.be.true;
    const writeArgs = writeFileStub.getCall(0).args;
    expect(writeArgs[0]).to.equal("/path/to/windowsfile.txt");
    expect(writeArgs[1]).to.equal("line1\nline2\n");
  });

  it("should keep LF as is if there is no CRLF", async ()=>{
    readFileStub.resolves(Buffer.from("line1\nline2\n"));
    writeFileStub.resolves();

    await replaceCRLF("/path/to/unixfile.txt");

    expect(readFileStub.calledOnceWithExactly("/path/to/unixfile.txt")).to.be.true;
    expect(writeFileStub.calledOnce).to.be.true;
    const writeArgs = writeFileStub.getCall(0).args;
    expect(writeArgs[0]).to.equal("/path/to/unixfile.txt");
    expect(writeArgs[1]).to.equal("line1\nline2\n");
  });

  it("should reject if readFile fails", async ()=>{
    readFileStub.rejects(new Error("readFile error"));

    try {
      await replaceCRLF("/path/to/errorfile.txt");
      expect.fail("Expected an error but none was thrown");
    } catch (err) {
      expect(err.message).to.equal("readFile error");
    }
    expect(writeFileStub.called).to.be.false;
  });

  it("should reject if writeFile fails", async ()=>{
    readFileStub.resolves(Buffer.from("line1\r\nline2\r\n"));
    writeFileStub.rejects(new Error("writeFile error"));

    try {
      await replaceCRLF("/path/to/errorfile2.txt");
      expect.fail("Expected an error but none was thrown");
    } catch (err) {
      expect(err.message).to.equal("writeFile error");
    }
  });
});
