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
import * as projectOperations from "../../../app/core/projectOperations.js";
const {
  _internal,
  createNewProject,
  addProject,
  renameProject,
  readProject,
  getSuffixNumberFromProjectName,
  getUnusedProjectDir
} = projectOperations;

describe("projectOperations tests", ()=>{
  describe("#getSuffixNumberFromProjectName", ()=>{
    it("should return the suffix number if the project name ends with numbers", ()=>{
      const projectName = "Project123";
      const result = getSuffixNumberFromProjectName(projectName);
      expect(result).to.equal("3");
    });

    it("should return 0 if the project name does not end with numbers", ()=>{
      const projectName = "Project";
      const result = getSuffixNumberFromProjectName(projectName);
      expect(result).to.equal(0);
    });

    it("should return 0 for an empty project name", ()=>{
      const projectName = "";
      const result = getSuffixNumberFromProjectName(projectName);
      expect(result).to.equal(0);
    });
  });

  describe("#getUnusedProjectDir", ()=>{
    let pathExistsStub;
    beforeEach(()=>{
      pathExistsStub = sinon.stub(_internal.fs, "pathExists");
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should return the provided projectRootDir if it does not exist", async ()=>{
      const projectRootDir = "/mock/project/root";
      const projectName = "project";

      pathExistsStub.resolves(false);

      const result = await getUnusedProjectDir(projectRootDir, projectName);

      expect(result).to.equal(projectRootDir);
      expect(pathExistsStub.calledOnceWithExactly(projectRootDir)).to.be.true;
    });

    it("should return a new directory name with suffix if projectRootDir exists", async ()=>{
      const projectRootDir = "/mock/project/root";
      const projectName = "project";

      pathExistsStub.onFirstCall().resolves(true);
      pathExistsStub.onSecondCall().resolves(false);

      const result = await getUnusedProjectDir(projectRootDir, projectName);

      expect(result).to.equal("/mock/project/project.wheel");
      expect(pathExistsStub.calledTwice).to.be.true;
    });

    it("should increment the suffix number until an unused directory name is found", async ()=>{
      const projectRootDir = "/mock/project/root";
      const projectName = "project";

      pathExistsStub.onCall(0).resolves(true);
      pathExistsStub.onCall(1).resolves(true);
      pathExistsStub.onCall(2).resolves(true);
      pathExistsStub.onCall(3).resolves(false);

      const result = await getUnusedProjectDir(projectRootDir, projectName);

      expect(result).to.equal("/mock/project/project1.wheel");
      expect(pathExistsStub.callCount).to.equal(4);
    });
  });

  describe("#createNewProject", ()=>{
    let getUnusedProjectDirMock;
    let gitInitMock;
    let writeComponentJsonMock;
    let writeJsonWrapperMock;
    let gitAddMock;
    let gitCommitMock;
    let ensureDirMock;

    beforeEach(()=>{
      getUnusedProjectDirMock = sinon.stub(_internal, "getUnusedProjectDir");
      gitInitMock = sinon.stub(_internal, "gitInit");
      writeComponentJsonMock = sinon.stub(_internal, "writeComponentJson");
      writeJsonWrapperMock = sinon.stub(_internal, "writeJsonWrapper");
      gitAddMock = sinon.stub(_internal, "gitAdd");
      gitCommitMock = sinon.stub(_internal, "gitCommit");
      ensureDirMock = sinon.stub(_internal.fs, "ensureDir");
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should create a new project with a unique directory and initialize it", async ()=>{
      const mockRootDir = "/mock/project/root";
      const mockProjectName = "test_project";
      const mockDescription = "Mock project description";
      const mockUser = "test_user";
      const mockMail = "test@example.com";
      const mockTimestamp = "20250102-120000";

      getUnusedProjectDirMock.resolves(mockRootDir);
      gitInitMock.resolves();
      writeComponentJsonMock.resolves();
      writeJsonWrapperMock.resolves();
      gitAddMock.resolves();
      gitCommitMock.resolves();
      ensureDirMock.resolves();

      sinon.stub(_internal, "getDateString").returns(mockTimestamp);

      const result = await createNewProject(mockRootDir, mockProjectName, mockDescription, mockUser, mockMail);

      expect(result).to.equal(mockRootDir);
      expect(getUnusedProjectDirMock.calledOnceWithExactly(mockRootDir, mockProjectName)).to.be.true;
      expect(ensureDirMock.calledOnceWithExactly(mockRootDir)).to.be.true;
      expect(gitInitMock.calledOnceWithExactly(mockRootDir, mockUser, mockMail)).to.be.true;
      expect(writeComponentJsonMock.calledOnce).to.be.true;
      expect(writeJsonWrapperMock.calledOnce).to.be.true;
      expect(gitAddMock.calledOnceWithExactly(mockRootDir, "./")).to.be.true;
      expect(gitCommitMock.calledOnceWithExactly(mockRootDir, "create new project")).to.be.true;
    });

    it("should handle errors during project creation", async ()=>{
      const mockRootDir = "/mock/project/root";
      const mockProjectName = "test_project";
      const mockDescription = "Mock project description";
      const mockUser = "test_user";
      const mockMail = "test@example.com";

      getUnusedProjectDirMock.rejects(new Error("Directory error"));

      try {
        await createNewProject(mockRootDir, mockProjectName, mockDescription, mockUser, mockMail);
        throw new Error("Expected createNewProject to throw");
      } catch (err) {
        expect(err.message).to.equal("Directory error");
      }

      expect(getUnusedProjectDirMock.calledOnceWithExactly(mockRootDir, mockProjectName)).to.be.true;
      ensureDirMock.resolves();
      expect(ensureDirMock.called).to.be.false;
      expect(gitInitMock.called).to.be.false;
    });
  });

  describe("#addProject", ()=>{
    let createNewProjectMock;
    let pathExistsStub;
    let getProjectJsonMock;
    let pathIsAbsoluteMock;

    beforeEach(()=>{
      createNewProjectMock = sinon.stub(_internal, "createNewProject");
      pathExistsStub = sinon.stub(_internal.fs, "pathExists");
      getProjectJsonMock = sinon.stub(_internal, "getProjectJson");
      pathIsAbsoluteMock = sinon.stub(path, "isAbsolute");
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should throw an error if the project directory already exists", async ()=>{
      const mockProjectDir = "/existing/project/dir";

      pathExistsStub.resolves(true);

      try {
        await addProject(mockProjectDir, "Test description");
        throw new Error("Expected addProject to throw an error");
      } catch (err) {
        expect(err.message).to.equal("specified project dir is already exists");
        expect(err.projectRootDir).to.equal(`${mockProjectDir}.wheel`);
      }

      expect(pathExistsStub.calledOnceWithExactly(`${mockProjectDir}.wheel`)).to.be.true;
    });

    it("should create a new project and add it to the project list", async ()=>{
      const mockProjectDir = "/new/project/dir";
      const validProjectName = "validName";
      const mockCreatedProjectDir = `${mockProjectDir}.wheel`;

      pathExistsStub.resolves(false);
      sinon.stub(path, "basename").returns(validProjectName);
      createNewProjectMock.resolves(mockCreatedProjectDir);

      const projectListUnshiftStub = sinon.stub(_internal.projectList, "unshift");

      await addProject(mockProjectDir, "Test description");

      expect(createNewProjectMock.calledOnceWithExactly(
        `${mockProjectDir}.wheel`,
        validProjectName,
        "Test description",
        "wheel",
        "wheel@example.com"
      )).to.be.true;
      expect(projectListUnshiftStub.calledOnceWithExactly({ path: mockCreatedProjectDir })).to.be.true;
    });
  });

  describe("#renameProject", ()=>{
    let isValidNameMock;
    let fsMoveStub, fsPathExistsStub;
    let readJsonGreedyMock;
    let writeProjectJsonMock;
    let writeComponentJsonMock;
    let gitCommitMock;
    let projectListGetStub, projectListUpdateStub;

    beforeEach(()=>{
      isValidNameMock = sinon.stub(_internal, "isValidName");
      fsMoveStub = sinon.stub(_internal.fs, "move");
      fsPathExistsStub = sinon.stub(_internal.fs, "pathExists");
      readJsonGreedyMock = sinon.stub(_internal, "readJsonGreedy");
      writeProjectJsonMock = sinon.stub(_internal, "writeProjectJson");
      writeComponentJsonMock = sinon.stub(_internal, "writeComponentJson");
      gitCommitMock = sinon.stub(_internal, "gitCommit");
      projectListGetStub = sinon.stub(_internal.projectList, "get");
      projectListUpdateStub = sinon.stub(_internal.projectList, "update");
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should rename a project successfully", async ()=>{
      const mockId = "1234";
      const mockOldDir = "/old/project/path";
      const mockNewName = "newProjectName";
      const mockNewDir = "/old/project/newProjectName";
      const mockProjectJson = { name: "oldProjectName" };
      const mockRootWorkflow = { name: "oldWorkflowName" };
      const mockProjectListEntry = { id: mockId, path: mockOldDir };

      isValidNameMock.returns(true);
      fsPathExistsStub.resolves(false);
      fsMoveStub.resolves();
      readJsonGreedyMock.onCall(0).resolves(mockProjectJson);
      readJsonGreedyMock.onCall(1).resolves(mockRootWorkflow);
      writeProjectJsonMock.resolves();
      writeComponentJsonMock.resolves();
      gitCommitMock.resolves();
      projectListGetStub.returns(mockProjectListEntry);

      await renameProject(mockId, mockNewName, mockOldDir);

      expect(isValidNameMock.calledOnceWithExactly(mockNewName)).to.be.true;
      expect(fsPathExistsStub.calledOnceWithExactly(`${mockNewDir}.wheel`)).to.be.true;
      expect(fsMoveStub.calledOnceWithExactly(mockOldDir, `${mockNewDir}.wheel`)).to.be.true;
      expect(readJsonGreedyMock.calledTwice).to.be.true;
      expect(writeProjectJsonMock.calledOnce).to.be.true;
      expect(writeComponentJsonMock.calledOnce).to.be.true;
      expect(gitCommitMock.calledOnce).to.be.true;
      expect(projectListGetStub.calledOnceWithExactly(mockId)).to.be.true;
      expect(projectListUpdateStub.calledOnceWithExactly({ id: mockId, path: `${mockNewDir}.wheel` })).to.be.true;
    });

    it("should throw an error if the new name is invalid", async ()=>{
      const mockId = "1234";
      const mockOldDir = "/old/project/path";
      const mockNewName = "invalid/name";

      isValidNameMock.returns(false);

      try {
        await renameProject(mockId, mockNewName, mockOldDir);
        throw new Error("Expected renameProject to throw");
      } catch (err) {
        expect(err.message).to.equal("illegal project name");
        expect(isValidNameMock.calledOnceWithExactly(mockNewName)).to.be.true;
      }
    });

    it("should throw an error if the new directory already exists", async ()=>{
      const mockId = "1234";
      const mockOldDir = "/old/project/path";
      const mockNewName = "existingProjectName";
      const mockNewDir = "/old/project/existingProjectName";

      isValidNameMock.returns(true);
      fsPathExistsStub.withArgs(`${mockNewDir}.wheel`).resolves(true);

      try {
        await renameProject(mockId, mockNewName, mockOldDir);
        throw new Error("Expected renameProject to throw");
      } catch (err) {
        expect(err.message).to.equal("already exists");
        expect(isValidNameMock.calledOnceWithExactly(mockNewName)).to.be.true;
      }
    });
  });

  describe("#readProject", ()=>{
    let getProjectJsonMock, rewriteAllIncludeExcludePropertyMock, writeProjectJsonMock;
    let setProjectStateMock, setComponentStateRMock;
    let gitInitMock, gitAddMock, gitCommitMock;
    let fsPathExistsMock, fsOutputFileMock;
    let projectListQueryStub;
    let projectListUnshiftStub;

    beforeEach(()=>{
      getProjectJsonMock = sinon.stub(_internal, "getProjectJson");
      rewriteAllIncludeExcludePropertyMock = sinon.stub(_internal, "rewriteAllIncludeExcludeProperty");
      writeProjectJsonMock = sinon.stub(_internal, "writeProjectJson");
      setProjectStateMock = sinon.stub(_internal, "setProjectState");
      setComponentStateRMock = sinon.stub(_internal, "setComponentStateR");
      gitInitMock = sinon.stub(_internal, "gitInit");
      gitAddMock = sinon.stub(_internal, "gitAdd");
      gitCommitMock = sinon.stub(_internal, "gitCommit");
      projectListQueryStub = sinon.stub(_internal.projectList, "query");
      projectListUnshiftStub = sinon.stub(_internal.projectList, "unshift");
      fsPathExistsMock = sinon.stub(_internal.fs, "pathExists");
      fsOutputFileMock = sinon.stub(_internal.fs, "outputFile");
      sinon.stub(path, "resolve").callsFake((...args)=>{ return args.join("/"); });
      sinon.stub(path, "join").callsFake((...args)=>{ return args.join("/"); });
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should handle project version <= 2 and update version", async function () {
      getProjectJsonMock.resolves({ version: 1.9, name: "test_project" });
      rewriteAllIncludeExcludePropertyMock.resolves();
      fsPathExistsMock.resolves(false);
      gitInitMock.resolves();
      setProjectStateMock.resolves();
      setComponentStateRMock.resolves();
      gitCommitMock.resolves();
      projectListQueryStub.returns(false);
      projectListUnshiftStub.returns(true);

      const result = await readProject("/mock/project/root");

      expect(rewriteAllIncludeExcludePropertyMock.calledOnce).to.be.true;
      expect(writeProjectJsonMock.calledWith("/mock/project/root", sinon.match({ version: 2.1 }))).to.be.true;
      expect(gitInitMock.calledWith("/mock/project/root", "wheel", "wheel@example.com")).to.be.true;
      expect(setProjectStateMock.calledWith("/mock/project/root", "not-started")).to.be.true;
      expect(setComponentStateRMock.calledWith("/mock/project/root", "/mock/project/root", "not-started")).to.be.true;
      expect(gitAddMock.calledWith("/mock/project/root", "./")).to.be.true;
      expect(gitCommitMock.calledWith("/mock/project/root", "import project")).to.be.true;
      expect(projectListUnshiftStub.calledWith({ path: "/mock/project/root" })).to.be.true;
      expect(result).to.equal("/mock/project/root");
    });

    it("should skip processing if project is already imported", async function () {
      getProjectJsonMock.resolves({ version: 2.1 });
      projectListQueryStub.returns({ path: "/mock/project/already" });

      const result = await readProject("/mock/project/already");

      expect(rewriteAllIncludeExcludePropertyMock.calledWith("/mock/project/already", [])).to.be.false;
      expect(gitAddMock.calledOnce).to.be.false;
      expect(result).to.equal("/mock/project/already");
    });
  });
});
