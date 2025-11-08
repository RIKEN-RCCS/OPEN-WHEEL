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
  getComponentTree
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
