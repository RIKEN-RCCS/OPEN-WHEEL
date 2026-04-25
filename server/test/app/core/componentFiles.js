/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import * as chai from "chai";
const { expect } = chai;
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
import sinon from "sinon";

//testee
import {
  _internal,
  addInputFile,
  addOutputFile,
  setUploadOndemandOutputFile,
  renameOutputFile,
  toggleInputFileMandatory,
  toggleOutputFileForceCopy
} from "../../../app/core/componentFiles.js";

describe("componentFiles tests", ()=>{
  let sandbox;
  let isValidInputFilenameStub;
  let isValidOutputFilenameStub;
  let getComponentDirStub;
  let readComponentJsonStub;
  let writeComponentJsonStub;
  let addOutputFileStub;

  beforeEach(()=>{
    sandbox = sinon.createSandbox();
    sandbox.stub(_internal, "fs");
    sandbox.stub(_internal, "glob");
    sandbox.stub(_internal, "getLogger");
    isValidInputFilenameStub = sandbox.stub(_internal, "isValidInputFilename");
    isValidOutputFilenameStub = sandbox.stub(_internal, "isValidOutputFilename");
    getComponentDirStub = sandbox.stub(_internal, "getComponentDir");
    readComponentJsonStub = sandbox.stub(_internal, "readComponentJson");
    writeComponentJsonStub = sandbox.stub(_internal, "writeComponentJson");
    sandbox.stub(_internal, "removeFileLink");
    sandbox.stub(_internal, "renameOutputFile");
    addOutputFileStub = sandbox.stub(_internal, "addOutputFile");
  });

  afterEach(()=>{
    sandbox.restore();
  });

  describe("#addInputFile", ()=>{
    it("should reject if name is not valid", async ()=>{
      isValidInputFilenameStub.returns(false);
      await expect(addInputFile("/path/to/project", "id123", "invalid@name"))
        .to.be.rejectedWith("invalid@name is not valid inputFile name");
    });

    it("should reject if component does not have inputFiles property", async ()=>{
      isValidInputFilenameStub.returns(true);
      getComponentDirStub.resolves("/path/to/component");
      readComponentJsonStub.resolves({ name: "testComponent", type: "task" });

      await expect(addInputFile("/path/to/project", "id123", "input.txt"))
        .to.be.rejected;
    });

    it("should add inputFile to component", async ()=>{
      isValidInputFilenameStub.returns(true);
      getComponentDirStub.resolves("/path/to/component");
      const componentJson = {
        name: "testComponent",
        inputFiles: []
      };
      readComponentJsonStub.resolves(componentJson);
      writeComponentJsonStub.resolves();

      await addInputFile("/path/to/project", "id123", "input.txt");

      expect(componentJson.inputFiles).to.have.lengthOf(1);
      expect(componentJson.inputFiles[0]).to.deep.equal({ name: "input.txt", src: [], mandatory: false });
      expect(writeComponentJsonStub.calledOnce).to.be.true;
    });
  });

  describe("#addOutputFile", ()=>{
    it("should reject if name is not valid", async ()=>{
      isValidOutputFilenameStub.returns(false);
      await expect(addOutputFile("/path/to/project", "id123", "invalid@name"))
        .to.be.rejectedWith("invalid@name is not valid outputFile name");
    });

    it("should reject if component does not have outputFiles property", async ()=>{
      isValidOutputFilenameStub.returns(true);
      getComponentDirStub.resolves("/path/to/component");
      readComponentJsonStub.resolves({ name: "testComponent", type: "task" });

      await expect(addOutputFile("/path/to/project", "id123", "output.txt"))
        .to.be.rejected;
    });

    it("should reject if outputFile with same name already exists", async ()=>{
      isValidOutputFilenameStub.returns(true);
      getComponentDirStub.resolves("/path/to/component");
      const componentJson = {
        name: "testComponent",
        outputFiles: [{ name: "output.txt", dst: [] }]
      };
      readComponentJsonStub.resolves(componentJson);

      await expect(addOutputFile("/path/to/project", "id123", "output.txt"))
        .to.be.rejectedWith("output.txt is already exists");
    });

    it("should add outputFile to component", async ()=>{
      isValidOutputFilenameStub.returns(true);
      getComponentDirStub.resolves("/path/to/component");
      const componentJson = {
        name: "testComponent",
        outputFiles: []
      };
      readComponentJsonStub.resolves(componentJson);
      writeComponentJsonStub.resolves();

      await addOutputFile("/path/to/project", "id123", "output.txt");

      expect(componentJson.outputFiles).to.have.lengthOf(1);
      expect(componentJson.outputFiles[0]).to.deep.equal({ name: "output.txt", dst: [] });
      expect(writeComponentJsonStub.calledOnce).to.be.true;
    });
  });

  describe("#setUploadOndemandOutputFile", ()=>{
    it("should add UPLOAD_ONDEMAND outputFile if no outputFiles exist", async ()=>{
      getComponentDirStub.resolves("/path/to/component");
      const componentJson = {
        name: "testComponent",
        outputFiles: []
      };
      readComponentJsonStub.resolves(componentJson);
      addOutputFileStub.resolves();

      await setUploadOndemandOutputFile("/path/to/project", "id123");

      expect(addOutputFileStub.calledWith("/path/to/project", "id123", "UPLOAD_ONDEMAND")).to.be.true;
    });
  });

  describe("#renameOutputFile", ()=>{
    it("should rename outputFile at specified index", async ()=>{
      isValidOutputFilenameStub.returns(true);
      getComponentDirStub.resolves("/path/to/component");
      const componentJson = {
        name: "testComponent",
        outputFiles: [
          { name: "old.txt", dst: [] },
          { name: "another.txt", dst: [] }
        ]
      };
      readComponentJsonStub.resolves(componentJson);
      writeComponentJsonStub.resolves();

      await renameOutputFile("/path/to/project", "id123", 0, "new.txt");

      expect(componentJson.outputFiles[0].name).to.equal("new.txt");
      expect(writeComponentJsonStub.calledOnce).to.be.true;
    });
  });

  describe("#toggleInputFileMandatory", ()=>{
    it("should set mandatory to true at specified index", async ()=>{
      getComponentDirStub.resolves("/path/to/component");
      const componentJson = {
        name: "testComponent",
        inputFiles: [
          { name: "input.txt", src: [], mandatory: false },
          { name: "other.txt", src: [], mandatory: false }
        ]
      };
      readComponentJsonStub.resolves(componentJson);
      writeComponentJsonStub.resolves();

      await toggleInputFileMandatory("/path/to/project", "id123", 0, true);

      expect(componentJson.inputFiles[0].mandatory).to.be.true;
      expect(componentJson.inputFiles[1].mandatory).to.be.false;
      expect(writeComponentJsonStub.calledOnce).to.be.true;
    });
    it("should set mandatory to false at specified index", async ()=>{
      getComponentDirStub.resolves("/path/to/component");
      const componentJson = {
        name: "testComponent",
        inputFiles: [
          { name: "input.txt", src: [], mandatory: true }
        ]
      };
      readComponentJsonStub.resolves(componentJson);
      writeComponentJsonStub.resolves();

      await toggleInputFileMandatory("/path/to/project", "id123", 0, false);

      expect(componentJson.inputFiles[0].mandatory).to.be.false;
      expect(writeComponentJsonStub.calledOnce).to.be.true;
    });
    it("should reject if index is out of range", async ()=>{
      getComponentDirStub.resolves("/path/to/component");
      const componentJson = {
        name: "testComponent",
        inputFiles: [{ name: "input.txt", src: [], mandatory: false }]
      };
      readComponentJsonStub.resolves(componentJson);

      await expect(toggleInputFileMandatory("/path/to/project", "id123", 5, true))
        .to.be.rejectedWith("invalid index 5");
    });
  });
  describe("#toggleOutputFileForceCopy", ()=>{
    it("should set forceCopy to true on specified dst connection", async ()=>{
      getComponentDirStub.resolves("/path/to/component");
      const componentJson = {
        name: "testComponent",
        outputFiles: [
          {
            name: "output.txt",
            dst: [
              { dstNode: "comp1", dstName: "input1.txt", forceCopy: false },
              { dstNode: "comp2", dstName: "input2.txt", forceCopy: false }
            ]
          }
        ]
      };
      readComponentJsonStub.resolves(componentJson);
      writeComponentJsonStub.resolves();

      await toggleOutputFileForceCopy("/path/to/project", "id123", "output.txt", "comp1", "input1.txt", true);

      expect(componentJson.outputFiles[0].dst[0].forceCopy).to.be.true;
      expect(componentJson.outputFiles[0].dst[1].forceCopy).to.be.false;
      expect(writeComponentJsonStub.calledOnce).to.be.true;
    });
    it("should set forceCopy to false on specified dst connection", async ()=>{
      getComponentDirStub.resolves("/path/to/component");
      const componentJson = {
        name: "testComponent",
        outputFiles: [
          {
            name: "output.txt",
            dst: [{ dstNode: "comp1", dstName: "input1.txt", forceCopy: true }]
          }
        ]
      };
      readComponentJsonStub.resolves(componentJson);
      writeComponentJsonStub.resolves();

      await toggleOutputFileForceCopy("/path/to/project", "id123", "output.txt", "comp1", "input1.txt", false);

      expect(componentJson.outputFiles[0].dst[0].forceCopy).to.be.false;
      expect(writeComponentJsonStub.calledOnce).to.be.true;
    });
    it("should reject if outputFile is not found", async ()=>{
      getComponentDirStub.resolves("/path/to/component");
      const componentJson = {
        name: "testComponent",
        outputFiles: [{ name: "output.txt", dst: [] }]
      };
      readComponentJsonStub.resolves(componentJson);

      await expect(toggleOutputFileForceCopy("/path/to/project", "id123", "nonexistent.txt", "comp1", "input1.txt", true))
        .to.be.rejectedWith("outputFile nonexistent.txt not found");
    });
    it("should reject if dst connection is not found", async ()=>{
      getComponentDirStub.resolves("/path/to/component");
      const componentJson = {
        name: "testComponent",
        outputFiles: [{ name: "output.txt", dst: [{ dstNode: "comp1", dstName: "input1.txt", forceCopy: false }] }]
      };
      readComponentJsonStub.resolves(componentJson);

      await expect(toggleOutputFileForceCopy("/path/to/project", "id123", "output.txt", "comp2", "input2.txt", true))
        .to.be.rejectedWith("dst connection to comp2:input2.txt not found");
    });
  });
});
