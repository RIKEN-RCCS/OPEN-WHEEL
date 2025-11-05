/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import path from "path";
import * as chai from "chai";
const { expect } = chai;
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
import sinon from "sinon";

//testee
import {
  _internal,
  addFileLinkToParent,
  addFileLinkFromParent,
  addFileLinkBetweenSiblings,
  removeFileLinkToParent,
  removeFileLinkFromParent,
  removeFileLinkBetweenSiblings,
  addLink,
  removeLink,
  removeAllLink,
  addFileLink,
  removeFileLink,
  removeAllFileLink,
  removeAllLinkFromComponent
} from "../../../app/core/componentLinks.js";

describe("componentLinks tests", ()=>{
  let sandbox;
  let getComponentDirStub;
  let readComponentJsonStub;
  let writeComponentJsonStub;
  let updateStepNumberStub;

  beforeEach(()=>{
    sandbox = sinon.createSandbox();
    getComponentDirStub = sandbox.stub(_internal, "getComponentDir");
    readComponentJsonStub = sandbox.stub(_internal, "readComponentJson");
    writeComponentJsonStub = sandbox.stub(_internal, "writeComponentJson");
    sandbox.stub(_internal, "readComponentJsonByID");
    sandbox.stub(_internal, "writeComponentJsonByID");
    sandbox.stub(_internal, "isParent");
    updateStepNumberStub = sandbox.stub(_internal, "updateStepNumber");
  });

  afterEach(()=>{
    sandbox.restore();
  });

  describe("#addLink", ()=>{
    it("should reject if src and dst are the same (cyclic link)", async ()=>{
      await expect(addLink("/path/to/project", "id123", "id123", false))
        .to.be.rejectedWith("cyclic link is not allowed");
    });

    it("should reject if src is a viewer component", async ()=>{
      getComponentDirStub.withArgs("/path/to/project", "src123", true).resolves("/path/to/src");
      getComponentDirStub.withArgs("/path/to/project", "dst123", true).resolves("/path/to/dst");
      readComponentJsonStub.withArgs("/path/to/src").resolves({ name: "srcViewer", type: "viewer", next: [], else: [] });
      readComponentJsonStub.withArgs("/path/to/dst").resolves({ name: "dstTask", type: "task", previous: [] });

      await expect(addLink("/path/to/project", "src123", "dst123", false))
        .to.be.rejectedWith("viewer can not have link");
    });

    it("should add link between two components", async ()=>{
      getComponentDirStub.withArgs("/path/to/project", "src123", true).resolves("/path/to/src");
      getComponentDirStub.withArgs("/path/to/project", "dst123", true).resolves("/path/to/dst");
      const srcJson = { name: "srcTask", type: "task", next: [], else: [], previous: [] };
      const dstJson = { name: "dstTask", type: "task", next: [], else: [], previous: [] };
      readComponentJsonStub.withArgs("/path/to/src").resolves(srcJson);
      readComponentJsonStub.withArgs("/path/to/dst").resolves(dstJson);
      writeComponentJsonStub.resolves();

      await addLink("/path/to/project", "src123", "dst123", false);

      expect(srcJson.next).to.include("dst123");
      expect(dstJson.previous).to.include("src123");
      expect(writeComponentJsonStub.calledTwice).to.be.true;
    });

    it("should add link to else connector when isElse is true", async ()=>{
      getComponentDirStub.withArgs("/path/to/project", "src123", true).resolves("/path/to/src");
      getComponentDirStub.withArgs("/path/to/project", "dst123", true).resolves("/path/to/dst");
      const srcJson = { name: "srcIf", type: "if", next: [], else: [], previous: [] };
      const dstJson = { name: "dstTask", type: "task", next: [], else: [], previous: [] };
      readComponentJsonStub.withArgs("/path/to/src").resolves(srcJson);
      readComponentJsonStub.withArgs("/path/to/dst").resolves(dstJson);
      writeComponentJsonStub.resolves();

      await addLink("/path/to/project", "src123", "dst123", true);

      expect(srcJson.else).to.include("dst123");
      expect(dstJson.previous).to.include("src123");
    });

    it("should call updateStepNumber if both components are stepjobTask", async ()=>{
      getComponentDirStub.withArgs("/path/to/project", "src123", true).resolves("/path/to/src");
      getComponentDirStub.withArgs("/path/to/project", "dst123", true).resolves("/path/to/dst");
      const srcJson = { name: "srcStepjob", type: "stepjobTask", next: [], else: [], previous: [] };
      const dstJson = { name: "dstStepjob", type: "stepjobTask", next: [], else: [], previous: [] };
      readComponentJsonStub.withArgs("/path/to/src").resolves(srcJson);
      readComponentJsonStub.withArgs("/path/to/dst").resolves(dstJson);
      writeComponentJsonStub.resolves();
      updateStepNumberStub.resolves();

      await addLink("/path/to/project", "src123", "dst123", false);

      expect(updateStepNumberStub.calledOnce).to.be.true;
    });
  });

  describe("#removeLink", ()=>{
    it("should remove link between two components", async ()=>{
      getComponentDirStub.withArgs("/path/to/project", "src123", true).resolves("/path/to/src");
      getComponentDirStub.withArgs("/path/to/project", "dst123", true).resolves("/path/to/dst");
      const srcJson = { name: "srcTask", type: "task", next: ["dst123"], else: [], previous: [] };
      const dstJson = { name: "dstTask", type: "task", next: [], else: [], previous: ["src123"] };
      readComponentJsonStub.withArgs("/path/to/src").resolves(srcJson);
      readComponentJsonStub.withArgs("/path/to/dst").resolves(dstJson);
      writeComponentJsonStub.resolves();

      await removeLink("/path/to/project", "src123", "dst123", false);

      expect(srcJson.next).to.not.include("dst123");
      expect(dstJson.previous).to.not.include("src123");
    });

    it("should remove link from else connector when isElse is true", async ()=>{
      getComponentDirStub.withArgs("/path/to/project", "src123", true).resolves("/path/to/src");
      getComponentDirStub.withArgs("/path/to/project", "dst123", true).resolves("/path/to/dst");
      const srcJson = { name: "srcIf", type: "if", next: [], else: ["dst123"], previous: [] };
      const dstJson = { name: "dstTask", type: "task", next: [], else: [], previous: ["src123"] };
      readComponentJsonStub.withArgs("/path/to/src").resolves(srcJson);
      readComponentJsonStub.withArgs("/path/to/dst").resolves(dstJson);
      writeComponentJsonStub.resolves();

      await removeLink("/path/to/project", "src123", "dst123", true);

      expect(srcJson.else).to.not.include("dst123");
      expect(dstJson.previous).to.not.include("src123");
    });
  });

  describe("#removeAllLink", ()=>{
    it("should remove all links from a component", async ()=>{
      getComponentDirStub.withArgs("/path/to/project", "comp123", true).resolves("/path/to/comp");
      getComponentDirStub.withArgs("/path/to/project", "next1", true).resolves("/path/to/next1");
      getComponentDirStub.withArgs("/path/to/project", "next2", true).resolves("/path/to/next2");
      getComponentDirStub.withArgs("/path/to/project", "prev1", true).resolves("/path/to/prev1");

      const compJson = {
        ID: "comp123",
        name: "comp",
        type: "task",
        next: ["next1", "next2"],
        else: [],
        previous: ["prev1"]
      };
      const next1Json = { ID: "next1", name: "next1", type: "task", next: [], else: [], previous: ["comp123"] };
      const next2Json = { ID: "next2", name: "next2", type: "task", next: [], else: [], previous: ["comp123"] };
      const prev1Json = { ID: "prev1", name: "prev1", type: "task", next: ["comp123"], else: [], previous: [] };

      readComponentJsonStub.withArgs("/path/to/comp").resolves(compJson);
      readComponentJsonStub.withArgs("/path/to/next1").resolves(next1Json);
      readComponentJsonStub.withArgs("/path/to/next2").resolves(next2Json);
      readComponentJsonStub.withArgs("/path/to/prev1").resolves(prev1Json);
      writeComponentJsonStub.resolves();

      await removeAllLink("/path/to/project", "comp123");

      expect(compJson.next).to.have.lengthOf(0);
      expect(compJson.previous).to.have.lengthOf(0);
    });
  });

  describe("#addFileLink", ()=>{
    it("should add file link between two components", async ()=>{
      getComponentDirStub.withArgs("/path/to/project", "src123", true).resolves("/path/to/src");
      getComponentDirStub.withArgs("/path/to/project", "dst123", true).resolves("/path/to/dst");
      const srcJson = {
        ID: "src123",
        name: "srcTask",
        type: "task",
        outputFiles: [{ name: "output.txt", dst: [] }]
      };
      const dstJson = {
        ID: "dst123",
        name: "dstTask",
        type: "task",
        inputFiles: [{ name: "input.txt", src: [] }]
      };
      readComponentJsonStub.withArgs("/path/to/src").resolves(srcJson);
      readComponentJsonStub.withArgs("/path/to/dst").resolves(dstJson);
      writeComponentJsonStub.resolves();

      await addFileLink("/path/to/project", "src123", "output.txt", "dst123", "input.txt");

      expect(srcJson.outputFiles[0].dst).to.deep.include({ dstNode: "dst123", dstName: "input.txt" });
      expect(dstJson.inputFiles[0].src).to.deep.include({ srcNode: "src123", srcName: "output.txt" });
    });
  });

  describe("#removeFileLink", ()=>{
    it("should remove file link between two components", async ()=>{
      getComponentDirStub.withArgs("/path/to/project", "src123", true).resolves("/path/to/src");
      getComponentDirStub.withArgs("/path/to/project", "dst123", true).resolves("/path/to/dst");
      const srcJson = {
        ID: "src123",
        name: "srcTask",
        type: "task",
        outputFiles: [{ name: "output.txt", dst: [{ dstNode: "dst123", dstName: "input.txt" }] }]
      };
      const dstJson = {
        ID: "dst123",
        name: "dstTask",
        type: "task",
        inputFiles: [{ name: "input.txt", src: [{ srcNode: "src123", srcName: "output.txt" }] }]
      };
      readComponentJsonStub.withArgs("/path/to/src").resolves(srcJson);
      readComponentJsonStub.withArgs("/path/to/dst").resolves(dstJson);
      writeComponentJsonStub.resolves();

      await removeFileLink("/path/to/project", "src123", "output.txt", "dst123", "input.txt");

      expect(srcJson.outputFiles[0].dst).to.have.lengthOf(0);
      expect(dstJson.inputFiles[0].src).to.have.lengthOf(0);
    });
  });

  describe("#addFileLinkToParent", ()=>{
    it("should add file link to parent component", async ()=>{
      getComponentDirStub.resolves("/path/to/component");
      const componentJson = {
        ID: "child123",
        name: "childTask",
        type: "task",
        parent: "parent123",
        outputFiles: [{ name: "output.txt", dst: [] }]
      };
      const parentJson = {
        ID: "parent123",
        name: "parentWorkflow",
        type: "workflow",
        outputFiles: [{ name: "parent_output.txt", origin: [] }]
      };
      readComponentJsonStub.onFirstCall().resolves(componentJson);
      readComponentJsonStub.onSecondCall().resolves(parentJson);
      writeComponentJsonStub.resolves();

      await addFileLinkToParent("/path/to/project", "child123", "output.txt", "parent_output.txt");

      expect(componentJson.outputFiles[0].dst).to.deep.include({ dstNode: "parent123", dstName: "parent_output.txt" });
      expect(parentJson.outputFiles[0].origin).to.deep.include({ srcNode: "child123", srcName: "output.txt" });
    });
  });

  describe("#removeFileLinkToParent", ()=>{
    it("should remove file link to parent component", async ()=>{
      getComponentDirStub.resolves("/path/to/component");
      const componentJson = {
        ID: "child123",
        name: "childTask",
        type: "task",
        parent: "parent123",
        outputFiles: [{ name: "output.txt", dst: [{ dstNode: "parent123", dstName: "parent_output.txt" }] }]
      };
      const parentJson = {
        ID: "parent123",
        name: "parentWorkflow",
        type: "workflow",
        outputFiles: [{ name: "parent_output.txt", origin: [{ srcNode: "child123", srcName: "output.txt" }] }]
      };
      readComponentJsonStub.onFirstCall().resolves(componentJson);
      readComponentJsonStub.onSecondCall().resolves(parentJson);
      writeComponentJsonStub.resolves();

      await removeFileLinkToParent("/path/to/project", "child123", "output.txt", "parent_output.txt");

      expect(componentJson.outputFiles[0].dst).to.have.lengthOf(0);
      expect(parentJson.outputFiles[0].origin).to.have.lengthOf(0);
    });
  });
});

//Moved from projectFilesOperator.js
describe("#addFileLinkBetweenSiblings", ()=>{
  //eslint-disable-next-line @stylistic/max-statements-per-line
  let getComponentDirMock; let readComponentJsonMock; let writeComponentJsonMock;

  beforeEach(()=>{
    getComponentDirMock = sinon.stub(_internal, "getComponentDir");
    readComponentJsonMock = sinon.stub(_internal, "readComponentJson");
    writeComponentJsonMock = sinon.stub(_internal, "writeComponentJson");
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should add a file link between sibling components when not already linked", async ()=>{
    const projectRootDir = "/mock/project";
    const srcNode = "componentA";
    const srcName = "outputA.txt";
    const dstNode = "componentB";
    const dstName = "inputB.txt";

    const srcComponentJson = {
      ID: srcNode,
      outputFiles: [{ name: srcName, dst: [] }]
    };

    const dstComponentJson = {
      ID: dstNode,
      inputFiles: []
    };

    getComponentDirMock.withArgs(projectRootDir, srcNode, true).resolves("/mock/project/componentA");
    getComponentDirMock.withArgs(projectRootDir, dstNode, true).resolves("/mock/project/componentB");
    readComponentJsonMock.withArgs("/mock/project/componentA").resolves(srcComponentJson);
    readComponentJsonMock.withArgs("/mock/project/componentB").resolves(dstComponentJson);

    await addFileLinkBetweenSiblings(projectRootDir, srcNode, srcName, dstNode, dstName);

    expect(srcComponentJson.outputFiles[0].dst).to.deep.include({ dstNode, dstName });

    expect(dstComponentJson.inputFiles).to.deep.include({ name: dstName, src: [{ srcNode, srcName }] });

    expect(writeComponentJsonMock.calledTwice).to.be.true;
    expect(writeComponentJsonMock.firstCall.args[1]).to.equal("/mock/project/componentA");
    expect(writeComponentJsonMock.secondCall.args[1]).to.equal("/mock/project/componentB");
  });

  it("should allow duplicate file links if already exists", async ()=>{
    const projectRootDir = "/mock/project";
    const srcNode = "componentA";
    const srcName = "outputA.txt";
    const dstNode = "componentB";
    const dstName = "inputB.txt";

    const srcComponentJson = {
      ID: srcNode,
      outputFiles: [{ name: srcName, dst: [{ dstNode, dstName }] }]
    };

    const dstComponentJson = {
      ID: dstNode,
      inputFiles: [{ name: dstName, src: [{ srcNode, srcName }] }]
    };

    getComponentDirMock.withArgs(projectRootDir, srcNode, true).resolves("/mock/project/componentA");
    getComponentDirMock.withArgs(projectRootDir, dstNode, true).resolves("/mock/project/componentB");
    readComponentJsonMock.withArgs("/mock/project/componentA").resolves(srcComponentJson);
    readComponentJsonMock.withArgs("/mock/project/componentB").resolves(dstComponentJson);

    await addFileLinkBetweenSiblings(projectRootDir, srcNode, srcName, dstNode, dstName);

    expect(srcComponentJson.outputFiles[0].dst).to.have.length(2);
    expect(srcComponentJson.outputFiles[0].dst).to.deep.equal([
      { dstNode, dstName },
      { dstNode, dstName }
    ]);

    expect(dstComponentJson.inputFiles).to.have.length(1);
    expect(dstComponentJson.inputFiles[0].src).to.have.length(2);
    expect(dstComponentJson.inputFiles[0].src).to.deep.equal([
      { srcNode, srcName },
      { srcNode, srcName }
    ]);

    expect(writeComponentJsonMock.calledTwice).to.be.true;
  });

  it("should create a new inputFiles entry if dstName does not exist", async ()=>{
    const projectRootDir = "/mock/project";
    const srcNode = "componentA";
    const srcName = "outputA.txt";
    const dstNode = "componentB";
    const dstName = "inputB.txt";

    const srcComponentJson = {
      ID: srcNode,
      outputFiles: [{ name: srcName, dst: [] }]
    };

    const dstComponentJson = {
      ID: dstNode,
      inputFiles: []
    };

    getComponentDirMock.withArgs(projectRootDir, srcNode, true).resolves("/mock/project/componentA");
    getComponentDirMock.withArgs(projectRootDir, dstNode, true).resolves("/mock/project/componentB");
    readComponentJsonMock.withArgs("/mock/project/componentA").resolves(srcComponentJson);
    readComponentJsonMock.withArgs("/mock/project/componentB").resolves(dstComponentJson);

    await addFileLinkBetweenSiblings(projectRootDir, srcNode, srcName, dstNode, dstName);

    expect(dstComponentJson.inputFiles).to.have.deep.members([{ name: dstName, src: [{ srcNode, srcName }] }]);
    expect(writeComponentJsonMock.calledTwice).to.be.true;
  });
});

//Moved from projectFilesOperator.js
describe("#addFileLinkFromParent", ()=>{
  let getComponentDirMock;
  let readComponentJsonMock;
  let writeComponentJsonMock;
  const projectRootDir = "/mock/project/root";

  beforeEach(()=>{
    readComponentJsonMock = sinon.stub(_internal, "readComponentJson");
    writeComponentJsonMock = sinon.stub(_internal, "writeComponentJson");
    getComponentDirMock = sinon.stub(_internal, "getComponentDir");
  });
  afterEach(()=>{
    sinon.restore();
  });

  it("should add a new file link from parent to child correctly", async ()=>{
    const dstDir = "/mock/project/root/child";
    const parentDir = "/mock/project/root";

    getComponentDirMock.withArgs(projectRootDir, "childID", true).resolves(dstDir);

    const parentJson = {
      ID: "parentID",
      inputFiles: [{ name: "fileA", forwardTo: [] }]
    };
    const childJson = {
      ID: "childID",
      inputFiles: []
    };

    readComponentJsonMock.withArgs(parentDir).resolves(parentJson);
    readComponentJsonMock.withArgs(dstDir).resolves(childJson);

    await addFileLinkFromParent(projectRootDir, "fileA", "childID", "inputB");

    expect(parentJson.inputFiles[0].forwardTo).to.deep.include({
      dstNode: "childID",
      dstName: "inputB"
    });
    expect(childJson.inputFiles).to.deep.include({
      name: "inputB",
      src: [{ srcNode: "parentID", srcName: "fileA" }]
    });

    expect(writeComponentJsonMock.firstCall.args).to.deep.equal([
      projectRootDir,
      parentDir,
      parentJson
    ]);
    expect(writeComponentJsonMock.secondCall.args).to.deep.equal([
      projectRootDir,
      dstDir,
      childJson
    ]);
  });

  it("should handle cases where parent inputFiles does not exist", async ()=>{
    const dstDir = "/mock/project/root/child";
    const parentDir = "/mock/project/root";

    getComponentDirMock.withArgs(projectRootDir, "childID", true).resolves(dstDir);

    const parentJson = {
      ID: "parentID",
      inputFiles: [{ name: "fileA", forwardTo: [] }]
    };
    const childJson = {
      ID: "childID",
      inputFiles: []
    };

    readComponentJsonMock.withArgs(parentDir).resolves(parentJson);
    readComponentJsonMock.withArgs(dstDir).resolves(childJson);

    await addFileLinkFromParent(projectRootDir, "fileA", "childID", "inputB");

    expect(parentJson.inputFiles[0].forwardTo).to.deep.include({
      dstNode: "childID",
      dstName: "inputB"
    });
    expect(childJson.inputFiles).to.deep.include({
      name: "inputB",
      src: [{ srcNode: "parentID", srcName: "fileA" }]
    });

    expect(writeComponentJsonMock.firstCall.args).to.deep.equal([
      projectRootDir,
      parentDir,
      parentJson
    ]);
    expect(writeComponentJsonMock.secondCall.args).to.deep.equal([
      projectRootDir,
      dstDir,
      childJson
    ]);
  });
});

//Moved from projectFilesOperator.js
describe("#removeAllFileLink", ()=>{
  let getComponentDirMock;
  let readComponentJsonMock;
  let removeFileLinkToParentMock;
  let removeFileLinkBetweenSiblingsMock;

  beforeEach(()=>{
    getComponentDirMock = sinon.stub(_internal, "getComponentDir");
    readComponentJsonMock = sinon.stub(_internal, "readComponentJson");
    removeFileLinkToParentMock = sinon.stub(_internal, "removeFileLinkToParent");
    removeFileLinkBetweenSiblingsMock = sinon.stub(_internal, "removeFileLinkBetweenSiblings");
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return an Error if outputFile is not found in parent's outputFiles (fromChildren = true)", async ()=>{
    getComponentDirMock.resolves("/mock/dir");
    readComponentJsonMock.resolves({
      outputFiles: [{ name: "someOtherFile", origin: [] }]
    });

    const result = await removeAllFileLink("/projRoot", "compID", "missingFile", true);
    expect(result).to.be.instanceOf(Error);
    expect(result.message).to.equal("missingFile not found in parent's outputFiles");

    //removeFileLinkToParentが呼ばれないこと
    expect(removeFileLinkToParentMock.notCalled).to.be.true;
  });

  it("should return true if outputFile.origin is not an array (fromChildren = true)", async ()=>{
    getComponentDirMock.resolves("/mock/dir");
    readComponentJsonMock.resolves({
      outputFiles: [{ name: "myOutput", origin: null }]
    });

    const result = await removeAllFileLink("/projRoot", "compID", "myOutput", true);
    expect(result).to.equal(true);

    expect(removeFileLinkToParentMock.notCalled).to.be.true;
  });

  it("should call removeFileLinkToParent for each origin entry (fromChildren = true)", async ()=>{
    getComponentDirMock.resolves("/mock/dir");
    readComponentJsonMock.resolves({
      outputFiles: [{
        name: "myOutput",
        origin: [
          { srcNode: "node1", srcName: "file1" },
          { srcNode: "node2", srcName: "file2" }
        ]
      }]
    });
    removeFileLinkToParentMock.resolves("ok");

    const result = await removeAllFileLink("/projRoot", "compID", "myOutput", true);
    expect(removeFileLinkToParentMock.callCount).to.equal(2);
    expect(removeFileLinkToParentMock.firstCall.args).to.deep.equal(["/projRoot", "node1", "file1", "myOutput"]);
    expect(removeFileLinkToParentMock.secondCall.args).to.deep.equal(["/projRoot", "node2", "file2", "myOutput"]);

    //Promise.all()が返すため、配列になる想定
    expect(result).to.deep.equal(["ok", "ok"]);
  });

  it("should return an Error if inputFile is not found in inputFiles (fromChildren = false)", async ()=>{
    getComponentDirMock.resolves("/mock/dir");
    readComponentJsonMock.resolves({
      inputFiles: [{ name: "someInput", src: [] }]
    });

    const result = await removeAllFileLink("/projRoot", "compID", "missingInput", false);
    expect(result).to.be.instanceOf(Error);
    expect(result.message).to.equal("missingInput not found in inputFiles");

    //removeFileLinkBetweenSiblingsが呼ばれないこと
    expect(removeFileLinkBetweenSiblingsMock.notCalled).to.be.true;
  });

  it("should call removeFileLinkBetweenSiblings for each src entry (fromChildren = false)", async ()=>{
    getComponentDirMock.resolves("/mock/dir");
    readComponentJsonMock.resolves({
      inputFiles: [{
        name: "myInput",
        src: [
          { srcNode: "pnode1", srcName: "f1" },
          { srcNode: "pnode2", srcName: "f2" }
        ]
      }]
    });
    removeFileLinkBetweenSiblingsMock.resolves("done");

    const result = await removeAllFileLink("/projRoot", "compID", "myInput", false);
    expect(removeFileLinkBetweenSiblingsMock.callCount).to.equal(2);
    expect(removeFileLinkBetweenSiblingsMock.firstCall.args).to.deep.equal(["/projRoot", "pnode1", "f1", "compID", "myInput"]);
    expect(removeFileLinkBetweenSiblingsMock.secondCall.args).to.deep.equal(["/projRoot", "pnode2", "f2", "compID", "myInput"]);

    //Promise.all()で返るため、配列になる想定
    expect(result).to.deep.equal(["done", "done"]);
  });
});

//Moved from projectFilesOperator.js
describe("#removeAllLinkFromComponent", ()=>{
  //eslint-disable-next-line @stylistic/max-statements-per-line
  let readComponentJsonByIDMock; let writeComponentJsonByIDMock;

  beforeEach(()=>{
    readComponentJsonByIDMock = sinon.stub(_internal, "readComponentJsonByID");
    writeComponentJsonByIDMock = sinon.stub(_internal, "writeComponentJsonByID").resolves();
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should remove all links from the specified component", async ()=>{
    const projectRootDir = "/mock/project/root";
    const componentID = "testComponent";

    const targetComponent = {
      ID: componentID,
      previous: ["prev1", "prev2"],
      next: ["next1"],
      else: ["else1"]
    };

    const prev1Component = {
      ID: "prev1",
      next: [componentID]
    };
    const prev2Component = {
      ID: "prev2",
      next: [componentID],
      else: [componentID]
    };
    const nextComponent = {
      ID: "next1",
      previous: [componentID]
    };
    const elseComponent = {
      ID: "else1",
      previous: [componentID]
    };

    readComponentJsonByIDMock.withArgs(projectRootDir, componentID).resolves(targetComponent);
    readComponentJsonByIDMock.withArgs(projectRootDir, "prev1").resolves(prev1Component);
    readComponentJsonByIDMock.withArgs(projectRootDir, "prev2").resolves(prev2Component);
    readComponentJsonByIDMock.withArgs(projectRootDir, "next1").resolves(nextComponent);
    readComponentJsonByIDMock.withArgs(projectRootDir, "else1").resolves(elseComponent);

    await removeAllLinkFromComponent(projectRootDir, componentID);

    expect(prev1Component.next).to.not.include(componentID);
    expect(prev2Component.next).to.not.include(componentID);
    expect(prev2Component.else).to.not.include(componentID);
    expect(nextComponent.previous).to.not.include(componentID);
    expect(elseComponent.previous).to.not.include(componentID);

    expect(writeComponentJsonByIDMock.callCount).to.equal(4);
    expect(writeComponentJsonByIDMock.calledWith(projectRootDir, "prev1", sinon.match.object)).to.be.true;
    expect(writeComponentJsonByIDMock.calledWith(projectRootDir, "prev2", sinon.match.object)).to.be.true;
    expect(writeComponentJsonByIDMock.calledWith(projectRootDir, "next1", sinon.match.object)).to.be.true;
    expect(writeComponentJsonByIDMock.calledWith(projectRootDir, "else1", sinon.match.object)).to.be.true;
  });

  it("should handle components with no links gracefully", async ()=>{
    const projectRootDir = "/mock/project/root";
    const componentID = "isolatedComponent";

    const isolatedComponent = {
      ID: componentID
    };

    readComponentJsonByIDMock.withArgs(projectRootDir, componentID).resolves(isolatedComponent);

    await removeAllLinkFromComponent(projectRootDir, componentID);

    expect(writeComponentJsonByIDMock.notCalled).to.be.true;
  });

  it("should remove all file links from inputFiles and outputFiles", async ()=>{
    const projectRootDir = "/mock/project/root";
    const componentID = "fileLinkComponent";

    const targetComponent = {
      ID: componentID,
      inputFiles: [
        {
          src: [{ srcNode: "srcComponent1" }, { srcNode: "srcComponent2" }]
        }
      ],
      outputFiles: [
        {
          dst: [{ dstNode: "dstComponent1" }, { dstNode: "dstComponent2" }]
        }
      ]
    };

    const srcComponent1 = {
      ID: "srcComponent1",
      outputFiles: [
        { dst: [{ dstNode: componentID }, { dstNode: "otherComponent" }] }
      ]
    };
    const srcComponent2 = {
      ID: "srcComponent2",
      outputFiles: [{ dst: [{ dstNode: componentID }] }]
    };

    const dstComponent1 = {
      ID: "dstComponent1",
      inputFiles: [
        { src: [{ srcNode: componentID }, { srcNode: "otherComponent" }] }
      ]
    };
    const dstComponent2 = {
      ID: "dstComponent2",
      inputFiles: [{ src: [{ srcNode: componentID }] }]
    };

    readComponentJsonByIDMock.withArgs(projectRootDir, componentID).resolves(targetComponent);
    readComponentJsonByIDMock.withArgs(projectRootDir, "srcComponent1").resolves(srcComponent1);
    readComponentJsonByIDMock.withArgs(projectRootDir, "srcComponent2").resolves(srcComponent2);
    readComponentJsonByIDMock.withArgs(projectRootDir, "dstComponent1").resolves(dstComponent1);
    readComponentJsonByIDMock.withArgs(projectRootDir, "dstComponent2").resolves(dstComponent2);

    await removeAllLinkFromComponent(projectRootDir, componentID);

    expect(srcComponent1.outputFiles[0].dst).to.not.deep.include({ dstNode: componentID });
    expect(srcComponent2.outputFiles[0].dst).to.not.deep.include({ dstNode: componentID });

    expect(dstComponent1.inputFiles[0].src).to.not.deep.include({ srcNode: componentID });
    expect(dstComponent2.inputFiles[0].src).to.not.deep.include({ srcNode: componentID });

    expect(writeComponentJsonByIDMock.callCount).to.equal(4);
    expect(writeComponentJsonByIDMock.calledWith(projectRootDir, "srcComponent1", sinon.match.object)).to.be.true;
    expect(writeComponentJsonByIDMock.calledWith(projectRootDir, "srcComponent2", sinon.match.object)).to.be.true;
    expect(writeComponentJsonByIDMock.calledWith(projectRootDir, "dstComponent1", sinon.match.object)).to.be.true;
    expect(writeComponentJsonByIDMock.calledWith(projectRootDir, "dstComponent2", sinon.match.object)).to.be.true;
  });
});

//Moved from projectFilesOperator.js
describe("#removeFileLinkBetweenSiblings", ()=>{
  //eslint-disable-next-line @stylistic/max-statements-per-line
  let getComponentDirMock; let readComponentJsonMock; let writeComponentJsonMock;

  beforeEach(()=>{
    getComponentDirMock = sinon.stub(_internal, "getComponentDir");
    readComponentJsonMock = sinon.stub(_internal, "readComponentJson");
    writeComponentJsonMock = sinon.stub(_internal, "writeComponentJson");
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should remove the file link between siblings successfully", async ()=>{
    const projectRootDir = "/mock/project";
    const srcNode = "src123";
    const srcName = "output.txt";
    const dstNode = "dst456";
    const dstName = "input.txt";

    getComponentDirMock.withArgs(projectRootDir, srcNode, true).resolves("/mock/project/src123");
    getComponentDirMock.withArgs(projectRootDir, dstNode, true).resolves("/mock/project/dst456");

    const srcJson = {
      outputFiles: [{ name: "output.txt", dst: [{ dstNode: "dst456", dstName: "input.txt" }] }]
    };
    const dstJson = {
      inputFiles: [{ name: "input.txt", src: [{ srcNode: "src123", srcName: "output.txt" }] }]
    };

    readComponentJsonMock.withArgs("/mock/project/src123").resolves(srcJson);
    readComponentJsonMock.withArgs("/mock/project/dst456").resolves(dstJson);

    await removeFileLinkBetweenSiblings(projectRootDir, srcNode, srcName, dstNode, dstName);

    expect(srcJson.outputFiles[0].dst).to.deep.equal([]);
    expect(dstJson.inputFiles[0].src).to.deep.equal([]);

    expect(writeComponentJsonMock.calledTwice).to.be.true;
    expect(writeComponentJsonMock.calledWithExactly(projectRootDir, "/mock/project/src123", srcJson)).to.be.true;
    expect(writeComponentJsonMock.calledWithExactly(projectRootDir, "/mock/project/dst456", dstJson)).to.be.true;
  });

  it("should not fail if the link does not exist", async ()=>{
    const projectRootDir = "/mock/project";
    const srcNode = "src123";
    const srcName = "output.txt";
    const dstNode = "dst456";
    const dstName = "input.txt";

    getComponentDirMock.withArgs(projectRootDir, srcNode, true).resolves("/mock/project/src123");
    getComponentDirMock.withArgs(projectRootDir, dstNode, true).resolves("/mock/project/dst456");

    const srcJson = {
      outputFiles: [{ name: "output.txt", dst: [] }]
    };
    const dstJson = {
      inputFiles: [{ name: "input.txt", src: [] }]
    };

    readComponentJsonMock.withArgs("/mock/project/src123").resolves(srcJson);
    readComponentJsonMock.withArgs("/mock/project/dst456").resolves(dstJson);

    await removeFileLinkBetweenSiblings(projectRootDir, srcNode, srcName, dstNode, dstName);

    expect(writeComponentJsonMock.calledTwice).to.be.true;
  });

  it("should throw an error if component JSON file is not found", async ()=>{
    const projectRootDir = "/mock/project";
    const srcNode = "src123";
    const srcName = "output.txt";
    const dstNode = "dst456";
    const dstName = "input.txt";

    getComponentDirMock.withArgs(projectRootDir, srcNode, true).resolves("/mock/project/src123");
    getComponentDirMock.withArgs(projectRootDir, dstNode, true).resolves("/mock/project/dst456");

    readComponentJsonMock.withArgs("/mock/project/src123").rejects(new Error("File not found"));

    try {
      await removeFileLinkBetweenSiblings(projectRootDir, srcNode, srcName, dstNode, dstName);
      throw new Error("Expected function to throw an error");
    } catch (error) {
      expect(error.message).to.equal("File not found");
    }
  });
});

//Moved from projectFilesOperator.js
describe("#removeFileLinkFromParent", ()=>{
  //eslint-disable-next-line @stylistic/max-statements-per-line
  let getComponentDirMock; let readComponentJsonMock; let writeComponentJsonMock;

  beforeEach(()=>{
    getComponentDirMock = sinon.stub(_internal, "getComponentDir");
    readComponentJsonMock = sinon.stub(_internal, "readComponentJson");
    writeComponentJsonMock = sinon.stub(_internal, "writeComponentJson").resolves();
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should remove the file link from parent component correctly", async ()=>{
    const projectRootDir = "/mock/project";
    const srcName = "output.txt";
    const dstNode = "childComponentID";
    const dstName = "input.txt";
    const parentID = "parentComponentID";

    const dstDir = "/mock/project/childComponent";
    const parentDir = path.dirname(dstDir);
    const resolvedParentDir = path.resolve(parentDir);

    getComponentDirMock.withArgs(projectRootDir, dstNode, true).resolves(dstDir);

    const mockParentJson = {
      ID: parentID,
      inputFiles: [
        { name: srcName, forwardTo: [{ dstNode, dstName }] }
      ]
    };

    const mockDstJson = {
      ID: dstNode,
      inputFiles: [
        { name: dstName, src: [{ srcNode: parentID, srcName }] }
      ]
    };

    readComponentJsonMock.withArgs(dstDir).resolves(mockDstJson);
    readComponentJsonMock.withArgs(resolvedParentDir).resolves(mockParentJson);

    await removeFileLinkFromParent(projectRootDir, srcName, dstNode, dstName);

    expect(mockParentJson.inputFiles[0].forwardTo).to.deep.equal([]);
    expect(mockDstJson.inputFiles[0].src).to.deep.equal([]);

    expect(writeComponentJsonMock.calledWith(projectRootDir, resolvedParentDir, mockParentJson)).to.be.true;
    expect(writeComponentJsonMock.calledWith(projectRootDir, dstDir, mockDstJson)).to.be.true;
  });

  it("should handle missing forwardTo in parent component", async ()=>{
    const projectRootDir = "/mock/project";
    const srcName = "output.txt";
    const dstNode = "childComponentID";
    const dstName = "input.txt";
    const parentID = "parentComponentID";

    const dstDir = "/mock/project/childComponent";
    const parentDir = path.dirname(dstDir);
    const resolvedParentDir = path.resolve(parentDir);

    getComponentDirMock.withArgs(projectRootDir, dstNode, true).resolves(dstDir);

    const mockParentJson = {
      ID: parentID,
      inputFiles: [{ name: srcName }]
    };

    const mockDstJson = {
      ID: dstNode,
      inputFiles: [
        { name: dstName, src: [{ srcNode: parentID, srcName }] }
      ]
    };

    readComponentJsonMock.withArgs(dstDir).resolves(mockDstJson);
    readComponentJsonMock.withArgs(resolvedParentDir).resolves(mockParentJson);

    await removeFileLinkFromParent(projectRootDir, srcName, dstNode, dstName);

    expect(mockDstJson.inputFiles[0].src).to.deep.equal([]);

    expect(writeComponentJsonMock.calledWith(projectRootDir, resolvedParentDir, mockParentJson)).to.be.true;
    expect(writeComponentJsonMock.calledWith(projectRootDir, dstDir, mockDstJson)).to.be.true;
  });
});
