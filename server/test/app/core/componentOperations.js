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
import path from "path";

//testee
import * as componentOperations from "../../../app/core/componentOperations.js";
const {
  _internal,
  getDescendantsIDs,
  getComponentFullName,
  rewriteIncludeExclude,
  rewriteAllIncludeExcludeProperty,
  createNewComponent,
  renameComponentDir,
  updateStepNumber,
  arrangeComponent,
  removeComponent,
  getSourceComponents,
  isComponentDir,
  getComponentTree,
  pasteComponent
} = componentOperations;

describe("componentOperations tests", ()=>{
  describe("#getDescendantsIDs", ()=>{
    let readJsonGreedyMock;
    let getComponentDirMock;

    beforeEach(()=>{
      readJsonGreedyMock = sinon.stub (_internal, "readJsonGreedy");
      getComponentDirMock = sinon.stub(_internal, "getComponentDir");
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should return an array of descendant IDs including the given ID", async ()=>{
      const mockProjectRootDir = "/mock/project/root";
      const mockID = "rootID";
      const mockProjectJson = {
        componentPath: {
          rootID: "./root",
          child1: "./root/child1",
          child2: "./root/child2",
          unrelated: "./other"
        }
      };

      const mockPoi = path.resolve(mockProjectRootDir, "root");

      readJsonGreedyMock.resolves(mockProjectJson);
      getComponentDirMock.resolves(mockPoi);

      const result = await getDescendantsIDs(mockProjectRootDir, mockID);

      expect(readJsonGreedyMock.calledOnceWithExactly(path.resolve(mockProjectRootDir, "prj.wheel.json"))).to.be.true;
      expect(getComponentDirMock.calledOnceWithExactly(mockProjectRootDir, mockID, true)).to.be.true;
      expect(result).to.deep.equal(["rootID", "child1", "child2"]);
    });

    it("should return an array with only the given ID if no descendants are found", async ()=>{
      const mockProjectRootDir = "/mock/project/root";
      const mockID = "rootID";
      const mockProjectJson = {
        componentPath: {
          rootID: "./root",
          unrelated: "./other"
        }
      };

      const mockPoi = path.resolve(mockProjectRootDir, "root");

      readJsonGreedyMock.resolves(mockProjectJson);
      getComponentDirMock.resolves(mockPoi);

      const result = await getDescendantsIDs(mockProjectRootDir, mockID);

      expect(readJsonGreedyMock.calledOnceWithExactly(path.resolve(mockProjectRootDir, "prj.wheel.json"))).to.be.true;
      expect(getComponentDirMock.calledOnceWithExactly(mockProjectRootDir, mockID, true)).to.be.true;
      expect(result).to.deep.equal(["rootID"]);
    });
  });

  describe("#getComponentFullName", ()=>{
    let getComponentDirMock;
    beforeEach(()=>{
      getComponentDirMock = sinon.stub(_internal, "getComponentDir");
    });
    afterEach(()=>{
      sinon.restore();
    });

    it("should return the path without a leading dot when getComponentDir returns a valid relative path", async ()=>{
      const mockProjectRootDir = "/mock/project/root";
      const mockID = "component123";
      const mockPath = "./relative/path/to/component";

      getComponentDirMock.resolves(mockPath);

      const result = await getComponentFullName(mockProjectRootDir, mockID);

      expect(getComponentDirMock.calledOnceWithExactly(mockProjectRootDir, mockID)).to.be.true;
      expect(result).to.equal("/relative/path/to/component");
    });

    it("should return null when getComponentDir returns null", async ()=>{
      const mockProjectRootDir = "/mock/project/root";
      const mockID = "component123";

      getComponentDirMock.resolves(null);

      const result = await getComponentFullName(mockProjectRootDir, mockID);

      expect(getComponentDirMock.calledOnceWithExactly(mockProjectRootDir, mockID)).to.be.true;
      expect(result).to.be.null;
    });
  });

  describe("#createNewComponent", ()=>{
    let readJsonGreedyMock;
    let makeDirMock;
    let componentFactoryMock;
    let writeComponentJsonMock;
    let updateComponentPathMock;
    let writeJsonWrapperMock;
    let gitAddMock;

    const dummyProjectRootDir = "/dummy/projectRootDir";
    const dummyParentDir = "/dummy/parentDir";
    const dummyPos = { x: 100, y: 200 };
    const dummyAbsDirName = "/dummy/parentDir/task0";
    const dummyComponent = {
      type: "task",
      pos: dummyPos,
      parent: "parent-123",
      ID: "new-component-id",
      name: "task0"
    };

    beforeEach(()=>{
      readJsonGreedyMock = sinon.stub(_internal, "readJsonGreedy").resolves({ ID: "parentID" });
      makeDirMock = sinon.stub(_internal, "makeDir").resolves(dummyAbsDirName);
      componentFactoryMock = sinon.stub(_internal, "componentFactory").returns(dummyComponent);
      writeComponentJsonMock = sinon.stub(_internal, "writeComponentJson").resolves();
      updateComponentPathMock = sinon.stub(_internal, "updateComponentPath").resolves();
      writeJsonWrapperMock = sinon.stub(_internal, "writeJsonWrapper").resolves();
      gitAddMock = sinon.stub(_internal, "gitAdd");
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should successfully create a new component when type is 'task'", async ()=>{
      const result = await createNewComponent(dummyProjectRootDir, dummyParentDir, "task", { x: 1, y: 2 });

      expect(readJsonGreedyMock.calledOnce).to.be.true;
      expect(makeDirMock.calledOnce).to.be.true;
      expect(componentFactoryMock.calledOnce).to.be.true;
      expect(writeComponentJsonMock.calledOnce).to.be.true;
      expect(updateComponentPathMock.calledOnce).to.be.true;
      expect(writeJsonWrapperMock.called).to.be.false;
      expect(gitAddMock.called).to.be.false;
      expect(result).to.equal(dummyComponent);
    });
  });

  describe("#renameComponentDir", ()=>{
    let isValidNameMock, getComponentDirMock, readComponentJsonMock, writeComponentJsonMock;
    const mockProjectRootDir = "/mock/project/root";
    const mockID = "componentID";
    let gitRmStub;
    let moveStub;
    let updateComponentPathStub;

    beforeEach(()=>{
      moveStub = sinon.stub(_internal.fs, "move").resolves();
      updateComponentPathStub = sinon.stub(_internal, "updateComponentPath");
      sinon.stub(_internal, "gitAdd");
      gitRmStub = sinon.stub(_internal, "gitRm");
      isValidNameMock = sinon.stub(_internal, "isValidName");
      getComponentDirMock = sinon.stub(_internal, "getComponentDir");
      readComponentJsonMock = sinon.stub(_internal, "readComponentJson");
      writeComponentJsonMock = sinon.stub(_internal, "writeComponentJson");
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should throw an error if newName is invalid", async ()=>{
      isValidNameMock.returns(false);

      try {
        await renameComponentDir(mockProjectRootDir, mockID, "???");
        throw new Error("Expected error to be thrown");
      } catch (err) {
        expect(err).to.be.an("error");
        expect(err.message).to.match(/not valid component name/);
      }
    });

    it("should return true if path.basename(oldDir) === newName", async ()=>{
      isValidNameMock.returns(true);
      getComponentDirMock.resolves("/mock/project/SomeName");
      const result = await renameComponentDir(mockProjectRootDir, mockID, "SomeName");

      expect(result).to.be.true;
    });

    it("should rename component directory", async ()=>{
      isValidNameMock.returns(true);
      getComponentDirMock.withArgs("/projectRootDir", "id", true).returns("/projectRootDir/id/oldName");
      readComponentJsonMock.withArgs("/projectRootDir/id/oldName").resolves({ name: "oldName", ID: "id" });
      writeComponentJsonMock.resolves();
      gitRmStub.withArgs("/projectRootDir", "/projectRootDir/id/oldName").resolves();
      moveStub.withArgs("/projectRootDir/id/oldName", "/projectRootDir/id/newName").resolves();
      updateComponentPathStub.withArgs("/projectRootDir", "id", "/projectRootDir/id/newName").resolves();

      await expect(renameComponentDir("/projectRootDir", "id", "newName")).to.be.fulfilled;

      expect(readComponentJsonMock.calledWith("/projectRootDir/id/oldName")).to.be.true;
      expect(writeComponentJsonMock.calledOnce).to.be.true;
      const writeCall = writeComponentJsonMock.getCall(0);
      expect(writeCall.args[0]).to.equal("/projectRootDir");
      expect(writeCall.args[1]).to.equal("/projectRootDir/id/oldName");
      expect(writeCall.args[2].name).to.equal("newName");

      expect(gitRmStub.calledWith("/projectRootDir", "/projectRootDir/id/oldName")).to.be.true;
      expect(moveStub.calledWith("/projectRootDir/id/oldName", "/projectRootDir/id/newName")).to.be.true;
      expect(updateComponentPathStub.calledWith("/projectRootDir", "id", "/projectRootDir/id/newName")).to.be.true;
    });
    it("should reject if the project root dir is same as the component dir", async ()=>{
      getComponentDirMock.withArgs("/projectRootDir", "id", true).returns("/projectRootDir");
      await expect(renameComponentDir("/projectRootDir", "id", "newName")).to.be.rejected;
    });
  });

  describe("#removeComponent", ()=>{
    let getComponentDirMock;
    let getDescendantsIDsMock;
    let removeAllLinkFromComponentMock;
    let gitRmMock;
    let fsRemoveStub;
    let removeComponentPathMock;

    beforeEach(()=>{
      getComponentDirMock = sinon.stub(_internal, "getComponentDir").resolves("/mock/targetDir");
      getDescendantsIDsMock = sinon.stub(_internal, "getDescendantsIDs").resolves(["compA", "compB", "compC"]);
      removeAllLinkFromComponentMock = sinon.stub(_internal, "removeAllLinkFromComponent").resolves();
      gitRmMock = sinon.stub(_internal, "gitRm");
      fsRemoveStub = sinon.stub(_internal.fs, "remove").resolves();
      removeComponentPathMock = sinon.stub(_internal, "removeComponentPath").resolves("removePathResult");
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should remove the component and all its descendants successfully", async ()=>{
      const projectRootDir = "/mock/project/root";
      const componentID = "compA";

      const result = await removeComponent(projectRootDir, componentID);

      expect(getComponentDirMock.calledOnceWithExactly(projectRootDir, componentID, true)).to.be.true;
      expect(getDescendantsIDsMock.calledOnceWithExactly(projectRootDir, componentID)).to.be.true;
      expect(removeAllLinkFromComponentMock.callCount).to.equal(3);
      expect(gitRmMock.calledOnceWithExactly(projectRootDir, "/mock/targetDir")).to.be.true;
      expect(fsRemoveStub.calledOnceWithExactly("/mock/targetDir")).to.be.true;
      expect(removeComponentPathMock.calledOnceWithExactly(projectRootDir, ["compA", "compB", "compC"])).to.be.true;
      expect(result).to.equal("removePathResult");
    });
  });

  describe("#getSourceComponents", ()=>{
    let globStub;
    let readJsonGreedyStub;
    const mockProjectRootDir = "/mock/project/root";

    beforeEach(()=>{
      globStub = sinon.stub();
      sinon.stub(_internal, "glob").callsFake(globStub);
      readJsonGreedyStub = sinon.stub(_internal, "readJsonGreedy");
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should return only source components (subComponent=false, disable=false)", async ()=>{
      const mockFiles = [
        "/mock/project/root/comp1/cmp.wheel.json",
        "/mock/project/root/comp2/cmp.wheel.json",
        "/mock/project/root/comp3/cmp.wheel.json",
        "/mock/project/root/comp4/cmp.wheel.json"
      ];
      globStub.resolves(mockFiles);

      readJsonGreedyStub.onCall(0).resolves({ type: "source", subComponent: false, disable: false });
      readJsonGreedyStub.onCall(1).resolves({ type: "source", subComponent: true, disable: false });
      readJsonGreedyStub.onCall(2).resolves({ type: "source", subComponent: false, disable: true });
      readJsonGreedyStub.onCall(3).resolves({ type: "task", subComponent: false, disable: false });

      const result = await getSourceComponents(mockProjectRootDir);

      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.deep.equal({ type: "source", subComponent: false, disable: false });
    });
  });

  describe("#isComponentDir", ()=>{
    let fsLstatStub, fsPathExistsStub;

    beforeEach(()=>{
      fsLstatStub = sinon.stub(_internal.fs, "lstat");
      fsPathExistsStub = sinon.stub(_internal.fs, "pathExists");
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should return false if target is not a directory", async ()=>{
      const fakeStats = { isDirectory: ()=>{
        return false;
      }
      };
      fsLstatStub.resolves(fakeStats);

      const result = await isComponentDir("/some/file");
      expect(result).to.be.false;
    });

    it("should return true if target is a directory and cmp.wheel.json exists", async ()=>{
      const fakeStats = { isDirectory: ()=>{
        return true;
      }
      };
      fsLstatStub.resolves(fakeStats);
      fsPathExistsStub.resolves(true);

      const result = await isComponentDir("/some/dir");
      expect(result).to.be.true;
    });
  });

  describe("#getComponentTree", ()=>{
    let pathIsAbsoluteMock, pathRelativeMock, pathJoinMock, pathDirnameMock, readJsonGreedyMock;

    beforeEach(()=>{
      pathIsAbsoluteMock = sinon.stub(path, "isAbsolute");
      pathRelativeMock = sinon.stub(path, "relative");
      pathJoinMock = sinon.stub(path, "join");
      pathDirnameMock = sinon.stub(path, "dirname");
      readJsonGreedyMock = sinon.stub(_internal, "readJsonGreedy");
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should return the root component with children (absolute path case)", async ()=>{
      const mockProjectRootDir = "/mock/project/root";
      const mockRootDir = "/mock/project/root";

      const mockProjectJson = {
        componentPath: {
          rootID: "./",
          childID1: "./child1",
          childID2: "./child2"
        }
      };

      pathIsAbsoluteMock.returns(true);
      pathRelativeMock.returns("./");
      pathJoinMock.callsFake((dir, file)=>{
        return `${dir}/${file}`;
      });
      pathDirnameMock.returns(".");

      readJsonGreedyMock.onCall(0).resolves(mockProjectJson);
      readJsonGreedyMock.onCall(1).resolves({ ID: "rootID" });
      readJsonGreedyMock.onCall(2).resolves({ ID: "childID1", parent: "rootID" });
      readJsonGreedyMock.onCall(3).resolves({ ID: "childID2", parent: "childID1" });

      const result = await getComponentTree(mockProjectRootDir, mockRootDir);

      expect(result.ID).to.equal("rootID");
      expect(result.children).to.have.lengthOf(1);
      expect(result.children[0].ID).to.equal("childID1");
      expect(result.children[0].children).to.have.lengthOf(1);
      expect(result.children[0].children[0].ID).to.equal("childID2");
    });
  });
});

//Moved from projectFilesOperator.js
describe("#arrangeComponent", ()=>{
  it("should return an empty array when stepjobGroupArray is empty", async ()=>{
    const stepjobGroupArray = []; //空

    const result = await arrangeComponent(stepjobGroupArray);

    expect(result).to.deep.equal([]);
  });

  it("should return the entire group if no initial node is found (arrangeArraytemp.length === 0 on first filter)", async ()=>{
    //全てのタスクが next.length === 0 or previous.length !== 0 などで「先頭」になりうるコンポーネントが存在しない例
    const stepjobTaskGroup = [
      {
        ID: "comp1",
        previous: ["comp2"],
        next: []
      },
      {
        ID: "comp2",
        previous: [],
        next: []
      }
    ];
    const stepjobGroupArray = [stepjobTaskGroup];

    const result = await arrangeComponent(stepjobGroupArray);

    //初期filterでarrangeArraytempが空 → breakしてstepjobTaskGroupそのものを返す
    expect(result).to.deep.equal(stepjobTaskGroup);
  });

  it("should arrange a single connected chain in the correct order (normal chain scenario)", async ()=>{
    const stepjobTaskGroup = [
      {
        ID: "comp1",
        previous: [],
        next: ["comp2"]
      },
      {
        ID: "comp2",
        previous: ["comp1"],
        next: ["comp3"]
      },
      {
        ID: "comp3",
        previous: ["comp2"],
        next: []
      }
    ];
    const stepjobGroupArray = [stepjobTaskGroup];

    const result = await arrangeComponent(stepjobGroupArray);

    //comp1 -> comp2 -> comp3
    //eslint-disable-next-line @stylistic/max-statements-per-line
    expect(result.map((c)=>{ return c.ID; })).to.deep.equal(["comp1", "comp2", "comp3"]);
  });

  it("should continue loop but skip pushing next if next component is not found (nextComponent.length === 0)", async ()=>{
    //comp1がnext=["comp2"]だが、comp2がいないのでpushしないケース
    const stepjobTaskGroup = [
      {
        ID: "comp1",
        previous: [],
        next: ["comp2"]
      }
      //comp2は定義されていない
    ];
    const stepjobGroupArray = [stepjobTaskGroup];

    const result = await arrangeComponent(stepjobGroupArray);

    //comp2が見つからないのでcomp1のみ
    expect(result).to.have.lengthOf(1);
    expect(result[0].ID).to.equal("comp1");
  });

  it("should put isolated tasks (no previous & no next) at the end of the array", async ()=>{
    //comp1 -> comp2 の後ろに、完全に接続されていないcomp3を末尾に追加するか
    const stepjobTaskGroup = [
      {
        ID: "comp1",
        previous: [],
        next: ["comp2"]
      },
      {
        ID: "comp2",
        previous: ["comp1"],
        next: []
      },
      {
        ID: "comp3",
        previous: [],
        next: []
      }
    ];
    const stepjobGroupArray = [stepjobTaskGroup];

    const result = await arrangeComponent(stepjobGroupArray);
    //comp3が最後に回される
    //eslint-disable-next-line @stylistic/max-statements-per-line
    expect(result.map((c)=>{ return c.ID; })).to.deep.equal(["comp1", "comp2", "comp3"]);
  });

  it("should correctly handle multiple groups and flatten all results into a single array", async ()=>{
    const group1 = [
      { ID: "g1c1", previous: [], next: ["g1c2"] },
      { ID: "g1c2", previous: ["g1c1"], next: [] }
    ];
    const group2 = [
      { ID: "g2c1", previous: [], next: [] }, //isolated
      { ID: "g2c2", previous: [], next: ["g2c3"] },
      { ID: "g2c3", previous: ["g2c2"], next: [] }
    ];
    const stepjobGroupArray = [group1, group2];

    const result = await arrangeComponent(stepjobGroupArray);

    //group1 は [g1c1, g1c2]
    //group2 は [g2c2, g2c3, g2c1] の順（g2c1はisolatedで最後に来る）
    //flatにすると [g1c1, g1c2, g2c2, g2c3, g2c1]
    expect(result).to.have.lengthOf(5);
    //eslint-disable-next-line @stylistic/max-statements-per-line
    expect(result.map((c)=>{ return c.ID; })).to.deep.equal(["g1c1", "g1c2", "g2c2", "g2c3", "g2c1"]);
  });

  it("should handle a group that has a single element (both previous and next are empty)", async ()=>{
    const stepjobTaskGroup = [
      { ID: "single", previous: [], next: [] }
    ];
    const stepjobGroupArray = [stepjobTaskGroup];

    const result = await arrangeComponent(stepjobGroupArray);

    //単一要素なので、そのまま返る
    expect(result).to.have.lengthOf(1);
    expect(result[0].ID).to.equal("single");
  });

  it("should handle a group that has tasks but none have next.length !== 0", async ()=>{
    //先頭filterで next.length !== 0 のものが1つもないケース
    const stepjobTaskGroup = [
      {
        ID: "compA",
        previous: [],
        next: []
      },
      {
        ID: "compB",
        previous: [],
        next: []
      }
    ];
    const stepjobGroupArray = [stepjobTaskGroup];

    const result = await arrangeComponent(stepjobGroupArray);

    //arrangeArraytemp = stepjobTaskComponents となり break
    expect(result).to.deep.equal(stepjobTaskGroup);
  });
});

//Moved from projectFilesOperator.js
describe("#rewriteAllIncludeExcludeProperty", ()=>{
  let rewriteIncludeExcludeMock;
  let globMock;

  beforeEach(()=>{
    rewriteIncludeExcludeMock = sinon.stub(_internal, "rewriteIncludeExclude");

    globMock = sinon.stub();
    sinon.stub(_internal, "glob").callsFake(globMock);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should process all component JSON files and update 'changed' array", async ()=>{
    const projectRootDir = "/mock/project/root";
    const changed = [];
    const mockFiles = [
      `${projectRootDir}/comp1/cmp.wheel.json`,
      `${projectRootDir}/comp2/cmp.wheel.json`
    ];

    globMock.resolves(mockFiles);
    rewriteIncludeExcludeMock.resolves();

    await rewriteAllIncludeExcludeProperty(projectRootDir, changed);

    expect(globMock.calledOnceWithExactly(`./**/cmp.wheel.json`, { cwd: projectRootDir })).to.be.true;
    expect(rewriteIncludeExcludeMock.callCount).to.equal(mockFiles.length);
    mockFiles.forEach((file, index)=>{
      expect(rewriteIncludeExcludeMock.getCall(index).args[0]).to.equal(projectRootDir);
      expect(rewriteIncludeExcludeMock.getCall(index).args[1]).to.equal(path.resolve(projectRootDir, file));
      expect(rewriteIncludeExcludeMock.getCall(index).args[2]).to.equal(changed);
    });
  });

  it("should handle an empty project directory gracefully", async ()=>{
    const projectRootDir = "/mock/project/root";
    const changed = [];

    globMock.resolves([]);

    await rewriteAllIncludeExcludeProperty(projectRootDir, changed);

    expect(globMock.calledOnceWithExactly(`./**/cmp.wheel.json`, { cwd: projectRootDir })).to.be.true;
    expect(rewriteIncludeExcludeMock.notCalled).to.be.true;
    expect(changed).to.deep.equal([]);
  });

  it("should propagate errors from rewriteIncludeExclude", async ()=>{
    const projectRootDir = "/mock/project/root";
    const changed = [];
    const mockFiles = [
      `${projectRootDir}/comp1/cmp.wheel.json`
    ];
    const mockError = new Error("Test error");

    globMock.resolves(mockFiles);
    rewriteIncludeExcludeMock.rejects(mockError);

    try {
      await rewriteAllIncludeExcludeProperty(projectRootDir, changed);
      throw new Error("Expected rewriteAllIncludeExcludeProperty to throw");
    } catch (err) {
      expect(err).to.equal(mockError);
    }

    expect(globMock.calledOnceWithExactly(`./**/cmp.wheel.json`, { cwd: projectRootDir })).to.be.true;
    expect(rewriteIncludeExcludeMock.calledOnceWithExactly(
      projectRootDir,
      path.resolve(projectRootDir, mockFiles[0]),
      changed
    )).to.be.true;
  });
});

//Moved from projectFilesOperator.js
describe("#rewriteIncludeExclude", ()=>{
  //eslint-disable-next-line @stylistic/max-statements-per-line
  let readJsonGreedyMock; let writeComponentJsonMock; let glob2ArrayMock;
  const mockProjectRootDir = "/mock/project/root";
  const mockFilename = `${mockProjectRootDir}/component.json`;
  let changedFiles;

  beforeEach(()=>{
    changedFiles = [];
    readJsonGreedyMock = sinon.stub(_internal, "readJsonGreedy");
    writeComponentJsonMock = sinon.stub(_internal, "writeComponentJson").resolves();
    glob2ArrayMock = sinon.stub(_internal, "glob2Array");
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should convert string 'include' property to array of objects", async ()=>{
    const mockComponentJson = { include: "file1,file2", exclude: [] };
    readJsonGreedyMock.resolves(mockComponentJson);
    glob2ArrayMock.returns(["file1", "file2"]);

    await rewriteIncludeExclude(mockProjectRootDir, mockFilename, changedFiles);

    expect(glob2ArrayMock.calledOnceWithExactly("file1,file2")).to.be.true;
    expect(mockComponentJson.include).to.deep.equal([
      { name: "file1" },
      { name: "file2" }
    ]);
    expect(writeComponentJsonMock.calledOnceWithExactly(
      mockProjectRootDir,
      path.dirname(mockFilename),
      mockComponentJson
    )).to.be.true;
    expect(changedFiles).to.include(mockFilename);
  });

  it("should set 'include' to an empty array if it is null", async ()=>{
    const mockComponentJson = { include: null, exclude: [] };
    readJsonGreedyMock.resolves(mockComponentJson);

    await rewriteIncludeExclude(mockProjectRootDir, mockFilename, changedFiles);

    expect(mockComponentJson.include).to.deep.equal([]);
    expect(writeComponentJsonMock.calledOnce).to.be.true;
    expect(changedFiles).to.include(mockFilename);
  });

  it("should not write if no changes are made", async ()=>{
    const mockComponentJson = { include: [], exclude: [] };
    readJsonGreedyMock.resolves(mockComponentJson);

    await rewriteIncludeExclude(mockProjectRootDir, mockFilename, changedFiles);

    expect(writeComponentJsonMock.notCalled).to.be.true;
    expect(changedFiles).to.be.empty;
  });

  it("should convert string 'exclude' property to array of objects", async ()=>{
    const mockComponentJson = { include: [], exclude: "file3,file4" };
    readJsonGreedyMock.resolves(mockComponentJson);
    glob2ArrayMock.returns(["file3", "file4"]);

    await rewriteIncludeExclude(mockProjectRootDir, mockFilename, changedFiles);

    expect(glob2ArrayMock.calledOnceWithExactly("file3,file4")).to.be.true;
    expect(mockComponentJson.exclude).to.deep.equal([
      { name: "file3" },
      { name: "file4" }
    ]);
    expect(writeComponentJsonMock.calledOnce).to.be.true;
    expect(changedFiles).to.include(mockFilename);
  });

  it("should set 'exclude' to an empty array if it is null", async ()=>{
    const mockComponentJson = { include: [], exclude: null };
    readJsonGreedyMock.resolves(mockComponentJson);

    await rewriteIncludeExclude(mockProjectRootDir, mockFilename, changedFiles);

    expect(mockComponentJson.exclude).to.deep.equal([]);
    expect(writeComponentJsonMock.calledOnce).to.be.true;
    expect(changedFiles).to.include(mockFilename);
  });
});

//Moved from projectFilesOperator.js
describe("#updateStepNumber", ()=>{
  let getAllComponentIDsMock;
  let getComponentDirMock;
  let readComponentJsonMock;
  let writeComponentJsonMock;
  let arrangeComponentMock;

  const mockProjectRootDir = "/mock/project/root";

  beforeEach(()=>{
    getAllComponentIDsMock = sinon.stub(_internal, "getAllComponentIDs");
    readComponentJsonMock = sinon.stub(_internal, "readComponentJson");
    writeComponentJsonMock = sinon.stub(_internal, "writeComponentJson");
    arrangeComponentMock = sinon.stub(_internal, "arrangeComponent");
    getComponentDirMock = sinon.stub(_internal, "getComponentDir");
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should update 'stepnum' for all stepjobTask components in the arranged order", async ()=>{
    const componentIDs = ["compStepjob", "compTaskA", "compTaskB", "compOther"];
    getAllComponentIDsMock.resolves(componentIDs);

    const mockStepjob = { ID: "compStepjob", type: "stepjob" };
    const mockTaskA = { ID: "compTaskA", type: "stepjobTask", parent: "compStepjob" };
    const mockTaskB = { ID: "compTaskB", type: "stepjobTask", parent: "compStepjob" };
    const mockOther = { ID: "compOther", type: "storage" };

    //eslint-disable-next-line @stylistic/max-statements-per-line
    getComponentDirMock.callsFake(async (_, id)=>{ return `/mock/dir/${id}`; });
    readComponentJsonMock.callsFake(async (dirPath)=>{
      switch (dirPath) {
        case "/mock/dir/compStepjob": return mockStepjob;
        case "/mock/dir/compTaskA": return mockTaskA;
        case "/mock/dir/compTaskB": return mockTaskB;
        case "/mock/dir/compOther": return mockOther;
        default: return {};
      }
    });

    arrangeComponentMock.callsFake(async (stepjobGroup)=>{
      //stepjobGroup は [[mockTaskA, mockTaskB]] の形を想定
      return stepjobGroup[0] || [];
    });

    await updateStepNumber(mockProjectRootDir);

    expect(getAllComponentIDsMock.calledOnce).to.be.true;
    expect(readComponentJsonMock.callCount).to.equal(componentIDs.length);
    expect(arrangeComponentMock.calledOnce).to.be.true;
    expect(writeComponentJsonMock.callCount).to.equal(2);

    const firstWriteArg = writeComponentJsonMock.firstCall.args[2];
    const secondWriteArg = writeComponentJsonMock.secondCall.args[2];
    expect(firstWriteArg.stepnum).to.equal(0);
    expect(secondWriteArg.stepnum).to.equal(1);
  });

  it("should do nothing if there are no stepjobTask components", async ()=>{
    getAllComponentIDsMock.resolves(["comp1", "comp2"]);
    readComponentJsonMock.resolves({ ID: "compX", type: "storage" });
    arrangeComponentMock.resolves([]);

    await updateStepNumber(mockProjectRootDir);

    expect(arrangeComponentMock.calledOnce).to.be.true;
    expect(arrangeComponentMock.firstCall.args[0]).to.deep.equal([]);
    expect(writeComponentJsonMock.notCalled).to.be.true;
  });

  it("should handle error if getAllComponentIDs fails", async ()=>{
    //getAllComponentIDs が例外を投げるケース
    const mockError = new Error("getAllComponentIDs failed");
    getAllComponentIDsMock.rejects(mockError);

    try {
      await updateStepNumber(mockProjectRootDir);
      expect.fail("Expected updateStepNumber to throw an error");
    } catch (err) {
      expect(err).to.equal(mockError);
    }

    //途中で例外が出たので何も書き込みが起こらない
    expect(writeComponentJsonMock.notCalled).to.be.true;
  });

  it("should handle error if readComponentJson fails", async ()=>{
    getAllComponentIDsMock.resolves(["compStepjob", "compTaskA"]);
    getComponentDirMock.returns("/mock/dir/any");
    //1回目はStepjob読み込み成功、2回目でエラー発生
    readComponentJsonMock.onCall(0).resolves({ ID: "compStepjob", type: "stepjob" });
    readComponentJsonMock.onCall(1).rejects(new Error("readComponentJson failed"));

    try {
      await updateStepNumber(mockProjectRootDir);
      expect.fail("Expected to throw an error");
    } catch (err) {
      expect(err.message).to.equal("readComponentJson failed");
    }

    //途中でエラーが出たので writeComponentJson は呼ばれない
    expect(writeComponentJsonMock.notCalled).to.be.true;
  });

  it("should process multiple stepjobs independently", async ()=>{
    //stepjobが2つあり、それぞれにstepjobTaskがあるケース
    getAllComponentIDsMock.resolves([
      "stepjobA", "taskA1", "taskA2",
      "stepjobB", "taskB1", "taskB2"
    ]);

    const stepjobA = { ID: "stepjobA", type: "stepjob" };
    const stepjobB = { ID: "stepjobB", type: "stepjob" };
    const taskA1 = { ID: "taskA1", type: "stepjobTask", parent: "stepjobA" };
    const taskA2 = { ID: "taskA2", type: "stepjobTask", parent: "stepjobA" };
    const taskB1 = { ID: "taskB1", type: "stepjobTask", parent: "stepjobB" };
    const taskB2 = { ID: "taskB2", type: "stepjobTask", parent: "stepjobB" };

    //eslint-disable-next-line @stylistic/max-statements-per-line
    getComponentDirMock.callsFake(async (_, id)=>{ return `/mock/dir/${id}`; });
    readComponentJsonMock.callsFake(async (dirPath)=>{
      switch (dirPath) {
        case "/mock/dir/stepjobA": return stepjobA;
        case "/mock/dir/stepjobB": return stepjobB;
        case "/mock/dir/taskA1": return taskA1;
        case "/mock/dir/taskA2": return taskA2;
        case "/mock/dir/taskB1": return taskB1;
        case "/mock/dir/taskB2": return taskB2;
        default: return {};
      }
    });
    //arrangeComponent は stepjob単位でタスクリストを渡される
    //ここでは2つのstepjob => 配列長2 の配列が渡ってくる想定
    arrangeComponentMock.callsFake(async (groups)=>{
      //groups は [ [taskA1, taskA2], [taskB1, taskB2] ] のような形を想定
      //テストでは一切ソートせずそのまま返す
      const result = [];
      for (const group of groups) {
        result.push(...group);
      }
      return result; //[taskA1, taskA2, taskB1, taskB2]
    });

    await updateStepNumber(mockProjectRootDir);

    //A1->A2->B1->B2 の順で stepnum が割り当てられる
    expect(writeComponentJsonMock.callCount).to.equal(4);
    expect(writeComponentJsonMock.getCall(0).args[2].stepnum).to.equal(0);
    expect(writeComponentJsonMock.getCall(1).args[2].stepnum).to.equal(1);
    expect(writeComponentJsonMock.getCall(2).args[2].stepnum).to.equal(2);
    expect(writeComponentJsonMock.getCall(3).args[2].stepnum).to.equal(3);
  });

  it("should handle arrangeComponent throwing an error", async ()=>{
    getAllComponentIDsMock.resolves(["compStepjob", "compTaskA"]);
    readComponentJsonMock.onCall(0).resolves({ ID: "compStepjob", type: "stepjob" });
    readComponentJsonMock.onCall(1).resolves({ ID: "compTaskA", type: "stepjobTask", parent: "compStepjob" });

    arrangeComponentMock.rejects(new Error("arrangeComponent failed"));

    try {
      await updateStepNumber(mockProjectRootDir);
      expect.fail("Expected updateStepNumber to throw");
    } catch (err) {
      expect(err.message).to.equal("arrangeComponent failed");
    }

    //arrangeComponent 失敗後はwriteComponentJsonは呼ばれない
    expect(writeComponentJsonMock.notCalled).to.be.true;
  });

  it("should skip tasks if their parent is not a stepjob", async ()=>{
    //stepjobTask だが parent が workflow とか storage とかになっている場合を想定
    getAllComponentIDsMock.resolves(["normalStepjob", "weirdTask1", "weirdTask2"]);
    //eslint-disable-next-line @stylistic/max-statements-per-line
    readComponentJsonMock.callsFake(async ()=>{ return {}; }); //デフォルトは空
    //normalStepjob は stepjob
    readComponentJsonMock.onCall(0).resolves({ ID: "normalStepjob", type: "stepjob" });
    //weirdTask1/2 は stepjobTask だが parent="workflow" のようなケース
    readComponentJsonMock.onCall(1).resolves({ ID: "weirdTask1", type: "stepjobTask", parent: "workflow" });
    readComponentJsonMock.onCall(2).resolves({ ID: "weirdTask2", type: "stepjobTask", parent: "normalStepjob" });

    arrangeComponentMock.callsFake(async (groups)=>{
      //groups => [ [ {ID: weirdTask2} ] ] だけが親stepjob=normalStepjob
      //weirdTask1 は親がstepjobでない => そもそも追加されない想定
      return groups[0] || [];
    });

    await updateStepNumber(mockProjectRootDir);

    //weirdTask1 は親が stepjob でないのでスキップ
    //weirdTask2 は有効 => stepnum=0
    expect(writeComponentJsonMock.calledOnce).to.be.true;
    const updatedTask = writeComponentJsonMock.firstCall.args[2];
    expect(updatedTask.ID).to.equal("weirdTask2");
    expect(updatedTask.stepnum).to.equal(0);
  });
});

describe("#pasteComponent", ()=>{
  let getComponentDirMock;
  let readComponentJsonMock;
  let fsCopyStub;
  let fsMoveStub;
  let fsPathExistsStub;
  let fsMkdirStub;
  let gitRmStub;
  let gitAddStub;
  let writeComponentJsonMock;
  let updateComponentPathMock;
  let removeAllLinkFromComponentMock;

  beforeEach(()=>{
    getComponentDirMock = sinon.stub(_internal, "getComponentDir");
    readComponentJsonMock = sinon.stub(_internal, "readComponentJson");
    fsCopyStub = sinon.stub(_internal.fs, "copy");
    fsMoveStub = sinon.stub(_internal.fs, "move");
    fsPathExistsStub = sinon.stub(_internal.fs, "pathExists");
    fsMkdirStub = sinon.stub(_internal.fs, "mkdir");
    gitRmStub = sinon.stub(_internal, "gitRm");
    gitAddStub = sinon.stub(_internal, "gitAdd");
    writeComponentJsonMock = sinon.stub(_internal, "writeComponentJson");
    updateComponentPathMock = sinon.stub(_internal, "updateComponentPath");
    removeAllLinkFromComponentMock = sinon.stub(_internal, "removeAllLinkFromComponent");
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should throw error if copyInfo is invalid", async ()=>{
    await expect(componentOperations.pasteComponent("/project", null, "targetID")).to.be.rejectedWith("Invalid copyInfo");
    await expect(componentOperations.pasteComponent("/project", {}, "targetID")).to.be.rejectedWith("Invalid copyInfo");
    await expect(componentOperations.pasteComponent("/project", { ID: "123" }, "targetID")).to.be.rejectedWith("Invalid copyInfo");
  });

  it("should throw error if paste type is invalid", async ()=>{
    const copyInfo = { type: "invalid", ID: "sourceID" };
    await expect(componentOperations.pasteComponent("/project", copyInfo, "targetID")).to.be.rejectedWith("Invalid paste type");
  });

  it("should throw error if trying to paste into itself", async ()=>{
    const copyInfo = { type: "copy", ID: "sourceID" };
    getComponentDirMock.withArgs("/project", "sourceID", true).resolves("/project/parent/source");
    getComponentDirMock.withArgs("/project", "targetID", true).resolves("/project/parent/source/child");

    await expect(componentOperations.pasteComponent("/project", copyInfo, "targetID"))
      .to.be.rejectedWith("Cannot paste component into itself or its descendants");
  });

  it("should copy component successfully", async ()=>{
    const copyInfo = { type: "copy", ID: "sourceID" };
    const sourceJson = { name: "workflow1", ID: "sourceID" };
    const copiedJson = { name: "workflow1", ID: "newID", parent: "targetID" };

    getComponentDirMock.withArgs("/project", "sourceID", true).resolves("/project/source");
    getComponentDirMock.withArgs("/project", "targetID", true).resolves("/project/target");
    readComponentJsonMock.withArgs("/project/source").resolves(sourceJson);
    readComponentJsonMock.withArgs("/project/target/workflow1").resolves(copiedJson);
    fsPathExistsStub.withArgs("/project/target/workflow1").resolves(false);
    fsMkdirStub.resolves();
    fsCopyStub.resolves();
    removeAllLinkFromComponentMock.resolves();
    writeComponentJsonMock.resolves();

    //Mock the internal regenerateComponentIDs to avoid complex UUID generation in test
    const regenerateStub = sinon.stub();
    regenerateStub.resolves();
    const originalRegenerate = componentOperations._internal.regenerateComponentIDs;
    componentOperations._internal.regenerateComponentIDs = regenerateStub;

    try {
      const result = await componentOperations.pasteComponent("/project", copyInfo, "targetID");

      expect(fsCopyStub.calledOnceWithExactly("/project/source", "/project/target/workflow1")).to.be.true;
      expect(removeAllLinkFromComponentMock.calledOnce).to.be.true;
      expect(writeComponentJsonMock.callCount).to.be.at.least(2);
      expect(result.ID).to.equal("newID");
      expect(result.parent).to.equal("targetID");
    } finally {
      componentOperations._internal.regenerateComponentIDs = originalRegenerate;
    }
  });

  it("should cut (move) component successfully", async ()=>{
    const copyInfo = { type: "cut", ID: "sourceID" };
    const sourceJson = { name: "workflow1", ID: "sourceID", parent: "oldParent" };
    const movedJson = { name: "workflow1", ID: "sourceID", parent: "targetID" };

    getComponentDirMock.withArgs("/project", "sourceID", true).resolves("/project/source");
    getComponentDirMock.withArgs("/project", "targetID", true).resolves("/project/target");
    readComponentJsonMock.withArgs("/project/source").resolves(sourceJson);
    readComponentJsonMock.withArgs("/project/target/workflow1").resolves(movedJson);
    fsPathExistsStub.withArgs("/project/target/workflow1").resolves(false);
    gitRmStub.resolves();
    fsMoveStub.resolves();
    gitAddStub.resolves();
    updateComponentPathMock.resolves();
    removeAllLinkFromComponentMock.resolves();
    writeComponentJsonMock.resolves();

    const result = await componentOperations.pasteComponent("/project", copyInfo, "targetID");

    expect(gitRmStub.calledOnceWithExactly("/project", "/project/source")).to.be.true;
    expect(fsMoveStub.calledOnceWithExactly("/project/source", "/project/target/workflow1")).to.be.true;
    expect(gitAddStub.calledOnceWithExactly("/project", "/project/target/workflow1")).to.be.true;
    expect(updateComponentPathMock.calledOnceWithExactly("/project", "sourceID", "/project/target/workflow1")).to.be.true;
    expect(removeAllLinkFromComponentMock.calledOnce).to.be.true;
    expect(writeComponentJsonMock.callCount).to.be.at.least(2);
    expect(result.ID).to.equal("sourceID");
    expect(result.parent).to.equal("targetID");
  });

  it("should handle copy to same parent with name conflict", async ()=>{
    const copyInfo = { type: "copy", ID: "sourceID" };
    const sourceJson = { name: "workflow1", ID: "sourceID", parent: "parentID" };
    const copiedJson = { name: "workflow1_1", ID: "newID", parent: "parentID" };

    //Source and target parent are the same
    getComponentDirMock.withArgs("/project", "sourceID", true).resolves("/project/parent/workflow1");
    getComponentDirMock.withArgs("/project", "parentID", true).resolves("/project/parent");
    readComponentJsonMock.withArgs("/project/parent/workflow1").resolves(sourceJson);
    readComponentJsonMock.withArgs("/project/parent/workflow1_1").resolves(copiedJson);

    //Simulate that workflow1 exists, so it will try workflow1_1
    fsPathExistsStub.withArgs("/project/parent/workflow1").resolves(true);
    fsPathExistsStub.withArgs("/project/parent/workflow1_1").resolves(false);
    fsMkdirStub.resolves();
    fsCopyStub.resolves();
    removeAllLinkFromComponentMock.resolves();
    writeComponentJsonMock.resolves();

    //Mock the internal regenerateComponentIDs
    const regenerateStub = sinon.stub();
    regenerateStub.resolves();
    const originalRegenerate = componentOperations._internal.regenerateComponentIDs;
    componentOperations._internal.regenerateComponentIDs = regenerateStub;

    try {
      const result = await componentOperations.pasteComponent("/project", copyInfo, "parentID");

      expect(fsCopyStub.calledOnceWithExactly("/project/parent/workflow1", "/project/parent/workflow1_1")).to.be.true;
      expect(removeAllLinkFromComponentMock.calledOnce).to.be.true;

      //Verify writeComponentJson was called multiple times (once for name update, once for parent/link update)
      expect(writeComponentJsonMock.callCount).to.be.at.least(2);

      expect(result.ID).to.equal("newID");
      expect(result.parent).to.equal("parentID");
      expect(result.name).to.equal("workflow1_1");
    } finally {
      componentOperations._internal.regenerateComponentIDs = originalRegenerate;
    }
  });

  it("should handle copy with smart suffix increment (task0_1 -> task0_2)", async ()=>{
    const copyInfo = { type: "copy", ID: "sourceID" };
    const sourceJson = { name: "task0_1", ID: "sourceID", parent: "parentID" };
    const copiedJson = { name: "task0_2", ID: "newID", parent: "parentID" };

    //Source is task0_1, should create task0_2 (not task0_1_1)
    getComponentDirMock.withArgs("/project", "sourceID", true).resolves("/project/parent/task0_1");
    getComponentDirMock.withArgs("/project", "parentID", true).resolves("/project/parent");
    readComponentJsonMock.withArgs("/project/parent/task0_1").resolves(sourceJson);
    readComponentJsonMock.withArgs("/project/parent/task0_2").resolves(copiedJson);

    //Simulate: task0, task0_1 exist, task0_2 doesn't
    fsPathExistsStub.withArgs("/project/parent/task0_1").resolves(true);
    fsPathExistsStub.withArgs("/project/parent/task0_2").resolves(false);
    fsMkdirStub.resolves();
    fsCopyStub.resolves();
    removeAllLinkFromComponentMock.resolves();
    writeComponentJsonMock.resolves();

    //Mock the internal regenerateComponentIDs
    const regenerateStub = sinon.stub();
    regenerateStub.resolves();
    const originalRegenerate = componentOperations._internal.regenerateComponentIDs;
    componentOperations._internal.regenerateComponentIDs = regenerateStub;

    try {
      const result = await componentOperations.pasteComponent("/project", copyInfo, "parentID");

      expect(fsCopyStub.calledOnceWithExactly("/project/parent/task0_1", "/project/parent/task0_2")).to.be.true;
      expect(result.name).to.equal("task0_2");
    } finally {
      componentOperations._internal.regenerateComponentIDs = originalRegenerate;
    }
  });

  it("should handle cut to same parent with name conflict", async ()=>{
    //Note: This is actually an unusual case - cutting to same parent.
    //In practice, this scenario might not make sense, but we test the behavior anyway.
    const copyInfo = { type: "cut", ID: "sourceID" };
    const sourceJson = { name: "workflow1", ID: "sourceID", parent: "parentID" };
    //When cut to same parent, if name doesn't conflict, it should keep the same name
    const movedJson = { name: "workflow1", ID: "sourceID", parent: "parentID" };

    //Source and target parent are the same, and it's the same location
    getComponentDirMock.withArgs("/project", "sourceID", true).resolves("/project/parent/workflow1");
    getComponentDirMock.withArgs("/project", "parentID", true).resolves("/project/parent");
    readComponentJsonMock.withArgs("/project/parent/workflow1").resolves(sourceJson);

    //Source path exists (it's the source itself)
    fsPathExistsStub.callsFake((p)=>{
      if (p === "/project/parent/workflow1") return Promise.resolve(true);
      return Promise.resolve(false);
    });

    gitRmStub.resolves();
    fsMoveStub.resolves();
    gitAddStub.resolves();
    updateComponentPathMock.resolves();
    removeAllLinkFromComponentMock.resolves();
    writeComponentJsonMock.resolves();

    const result = await componentOperations.pasteComponent("/project", copyInfo, "parentID");

    //When source and target are the same, fs.move should still be called
    //The path should remain the same since attemptPath === sourceDir
    expect(result.ID).to.equal("sourceID");
    expect(result.parent).to.equal("parentID");
  });
});

describe("#regenerateComponentIDs", ()=>{
  let globStub;
  let readJsonGreedyStub;
  let writeJsonWrapperStub;
  let updateComponentPathMock;
  let gitAddStub;

  beforeEach(()=>{
    globStub = sinon.stub(_internal, "glob");
    readJsonGreedyStub = sinon.stub(_internal, "readJsonGreedy");
    writeJsonWrapperStub = sinon.stub(_internal, "writeJsonWrapper");
    updateComponentPathMock = sinon.stub(_internal, "updateComponentPath");
    gitAddStub = sinon.stub(_internal, "gitAdd");
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should regenerate IDs and clear links for all components", async ()=>{
    const mockComponentFiles = [
      "/project/copied/component.json",
      "/project/copied/child1/component.json",
      "/project/copied/child2/component.json"
    ];

    const mockComponents = [
      {
        ID: "oldID1",
        name: "root",
        parent: "parentID",
        previous: ["linkA"],
        next: ["linkB"],
        else: ["linkC"],
        inputFiles: [{ name: "in1", src: [{ srcNode: "nodeA", srcName: "out1" }] }],
        outputFiles: [{ name: "out1", dst: [{ dstNode: "nodeB", dstName: "in1" }] }]
      },
      {
        ID: "oldID2",
        name: "child1",
        parent: "oldID1",
        previous: [],
        next: [],
        inputFiles: [],
        outputFiles: []
      },
      {
        ID: "oldID3",
        name: "child2",
        parent: "oldID1",
        previous: [],
        next: []
      }
    ];

    globStub.resolves(mockComponentFiles);
    readJsonGreedyStub.onCall(0).resolves(mockComponents[0]);
    readJsonGreedyStub.onCall(1).resolves(mockComponents[1]);
    readJsonGreedyStub.onCall(2).resolves(mockComponents[2]);
    readJsonGreedyStub.onCall(3).resolves({ ...mockComponents[0], ID: "newID1" });
    readJsonGreedyStub.onCall(4).resolves({ ...mockComponents[1], ID: "newID2" });
    readJsonGreedyStub.onCall(5).resolves({ ...mockComponents[2], ID: "newID3" });
    readJsonGreedyStub.onCall(6).resolves({ ...mockComponents[0], ID: "newID1" });
    readJsonGreedyStub.onCall(7).resolves({ ...mockComponents[1], ID: "newID2" });
    readJsonGreedyStub.onCall(8).resolves({ ...mockComponents[2], ID: "newID3" });

    writeJsonWrapperStub.resolves();
    updateComponentPathMock.resolves();
    gitAddStub.resolves();

    await _internal.regenerateComponentIDs("/project", "/project/copied", "newParentID");

    //Should write each component 3 times (first pass, second pass for parent refs, update paths)
    expect(writeJsonWrapperStub.callCount).to.be.at.least(3);

    //Check that root component's parent was updated
    const firstWrite = writeJsonWrapperStub.getCall(0);
    expect(firstWrite.args[1].previous).to.deep.equal([]);
    expect(firstWrite.args[1].next).to.deep.equal([]);
    expect(firstWrite.args[1].else).to.deep.equal([]);
    expect(firstWrite.args[1].inputFiles[0].src).to.deep.equal([]);
    expect(firstWrite.args[1].outputFiles[0].dst).to.deep.equal([]);

    //Should update component paths for all components
    expect(updateComponentPathMock.callCount).to.equal(3);
    expect(gitAddStub.callCount).to.equal(3);
  });

  it("should update child component parent references", async ()=>{
    const mockComponentFiles = [
      "/project/copied/component.json",
      "/project/copied/child/component.json"
    ];

    const mockParent = {
      ID: "oldParentID",
      name: "parent",
      parent: "externalParent"
    };

    const mockChild = {
      ID: "oldChildID",
      name: "child",
      parent: "oldParentID"
    };

    let parentNewID;
    let childNewID;

    globStub.resolves(mockComponentFiles);

    //First pass - read old data
    readJsonGreedyStub.onCall(0).callsFake(()=>{
      return Promise.resolve({ ...mockParent });
    });
    readJsonGreedyStub.onCall(1).callsFake(()=>{
      return Promise.resolve({ ...mockChild });
    });

    //Second pass - read updated data with new IDs
    readJsonGreedyStub.onCall(2).callsFake(()=>{
      const newParent = { ...mockParent, ID: parentNewID, parent: "targetParentID" };
      return Promise.resolve(newParent);
    });
    readJsonGreedyStub.onCall(3).callsFake(()=>{
      const newChild = { ...mockChild, ID: childNewID, parent: "oldParentID" };
      return Promise.resolve(newChild);
    });

    //Third pass - read to update component paths
    readJsonGreedyStub.onCall(4).callsFake(()=>{
      return Promise.resolve({ ...mockParent, ID: parentNewID });
    });
    readJsonGreedyStub.onCall(5).callsFake(()=>{
      return Promise.resolve({ ...mockChild, ID: childNewID });
    });

    writeJsonWrapperStub.callsFake((file, json)=>{
      //Capture the new IDs when they're written
      if (file.includes("/component.json") && !file.includes("/child/")) {
        parentNewID = json.ID;
      } else if (file.includes("/child/component.json")) {
        childNewID = json.ID;
      }
      return Promise.resolve();
    });

    updateComponentPathMock.resolves();
    gitAddStub.resolves();

    await _internal.regenerateComponentIDs("/project", "/project/copied", "targetParentID");

    //Should have written multiple times
    expect(writeJsonWrapperStub.called).to.be.true;
    expect(updateComponentPathMock.callCount).to.equal(2);
    expect(gitAddStub.callCount).to.equal(2);

    //Verify new IDs were generated
    expect(parentNewID).to.not.be.undefined;
    expect(childNewID).to.not.be.undefined;
    expect(parentNewID).to.not.equal("oldParentID");
    expect(childNewID).to.not.equal("oldChildID");
  });
});
