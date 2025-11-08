/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import fs from "fs-extra";
import path from "path";
import { promisify } from "util";
import { execFile } from "child_process";
const asyncExecFile = promisify(execFile);

//setup test framework
import * as chai from "chai";
const expect = chai.expect;
import sinon from "sinon";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);

//helper
import { updateComponentProperty } from "../../testUtil.js";
import { createNewComponent } from "../../../app/core/componentOperations.js";
import { createNewProject } from "../../../app/core/projectOperations.js";
import { gitAdd, gitRm, gitStatus, gitCommit } from "../../../app/core/gitOperator2.js";
import { componentJsonFilename, projectJsonFilename } from "../../../app/db/db.js";

//testee
import { readProject, _internal } from "../../../app/core/projectOperations.js";

//test data
const testDirRoot = path.resolve("./", "WHEEL_TEST_TMP");
const projectRootDir = path.resolve(testDirRoot, "test_project.wheel");

describe("readProject UT", function () {
  this.timeout(10000);
  let task0;
  let projectListQueryStub;
  let projectListWriteStub;

  beforeEach(async ()=>{
    await fs.remove(testDirRoot);

    //Set up stubs for projectList
    if (projectListQueryStub) projectListQueryStub.restore();
    if (projectListWriteStub) projectListWriteStub.restore();
    projectListQueryStub = sinon.stub(_internal.projectList, "query").returns(false);
    projectListWriteStub = sinon.stub(_internal.projectList, "write");

    await createNewProject(projectRootDir, "test_project", null, "test", "test@example.com");
    task0 = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 10, y: 10 });
    await createNewComponent(projectRootDir, projectRootDir, "task", { x: 10, y: 10 });
    await createNewComponent(projectRootDir, projectRootDir, "task", { x: 10, y: 10 });
    await gitCommit(projectRootDir);
  });
  afterEach(()=>{
    if (projectListQueryStub) projectListQueryStub.restore();
    if (projectListWriteStub) projectListWriteStub.restore();
  });
  after(async ()=>{
    if (!process.env.WHEEL_KEEP_FILES_AFTER_LAST_TEST) {
      await fs.remove(testDirRoot);
    }
  });
  it("should do nothing git-controlled and not-started state", async ()=>{
    await readProject(projectRootDir);

    const { added, modified, deleted, renamed, untracked } = await gitStatus(projectRootDir);
    expect(added).to.be.an("array").that.is.empty;
    expect(modified).to.be.an("array").that.is.empty;
    expect(deleted).to.be.an("array").that.is.empty;
    expect(renamed).to.be.an("array").that.is.empty;
    expect(untracked).to.be.an("array").that.is.empty;
  });
  it("should do nothing if git-controlled and something modified", async ()=>{
    await updateComponentProperty(projectRootDir, task0.ID, "state", "hoge");
    await readProject(projectRootDir);

    const { added, modified, deleted, renamed, untracked } = await gitStatus(projectRootDir);
    expect(added).to.be.an("array").that.is.empty;
    expect(modified).to.be.an("array").that.has.members([path.join("./", task0.name, componentJsonFilename)]);
    expect(deleted).to.be.an("array").that.is.empty;
    expect(renamed).to.be.an("array").that.is.empty;
    expect(untracked).to.be.an("array").that.is.empty;
  });
  it("should convert include or exclude prop is comma separated string", async ()=>{
    await updateComponentProperty(projectRootDir, task0.ID, "include", "foo,bar,baz");
    await updateComponentProperty(projectRootDir, task0.ID, "exclude", "hoge,huga,piyo");
    await gitCommit(projectRootDir);
    await readProject(projectRootDir);

    const { added, modified, deleted, renamed, untracked } = await gitStatus(projectRootDir);
    expect(added).to.be.an("array").that.is.empty;
    expect(modified).to.be.an("array").that.is.empty;
    expect(deleted).to.be.an("array").that.is.empty;
    expect(renamed).to.be.an("array").that.is.empty;
    expect(untracked).to.be.an("array").that.is.empty;

    const { include: task0include, exclude: task0exclude } = await fs.readJson(path.resolve(projectRootDir, task0.name, componentJsonFilename));
    expect(task0include).to.be.an("array").that.has.deep.members([{ name: "foo" }, { name: "bar" }, { name: "baz" }]);
    expect(task0exclude).to.be.an("array").that.has.deep.members([{ name: "piyo" }, { name: "huga" }, { name: "hoge" }]);
  });
  it("should add and commit .gitignore if git-controlled but .gitignore is not inclueded", async ()=>{
    const ignoreFile = path.join(projectRootDir, ".gitignore");
    await gitRm(projectRootDir, ".gitignore");
    await fs.remove(ignoreFile);
    await gitCommit(projectRootDir);
    await readProject(projectRootDir);

    const { added, modified, deleted, renamed, untracked } = await gitStatus(projectRootDir);
    expect(added).to.be.an("array").that.is.empty;
    expect(modified).to.be.an("array").that.is.empty;
    expect(deleted).to.be.an("array").that.is.empty;
    expect(renamed).to.be.an("array").that.is.empty;
    expect(untracked).to.be.an("array").that.is.empty;
    expect(fs.readFileSync(ignoreFile, "utf-8")).to.equal("wheel.log");
  });
  it("should set all components and project to 'not-started' and commit everything if project is not git-controlled", async ()=>{
    await updateComponentProperty(projectRootDir, task0.ID, "state", "hoge");
    await fs.remove(path.resolve(projectRootDir, ".git"));
    await readProject(projectRootDir);

    const { added, modified, deleted, renamed, untracked } = await gitStatus(projectRootDir);
    expect(added).to.be.an("array").that.is.empty;
    expect(modified).to.be.an("array").that.is.empty;
    expect(deleted).to.be.an("array").that.is.empty;
    expect(renamed).to.be.an("array").that.is.empty;
    expect(untracked).to.be.an("array").that.is.empty;
    const { stdout } = await asyncExecFile("git", ["ls-files"], { cwd: projectRootDir }).catch((e)=>{
      console.log("ERROR:\n", e);
    });
    expect(stdout).to.equal(".gitignore\ncmp.wheel.json\nprj.wheel.json\ntask0/cmp.wheel.json\ntask1/cmp.wheel.json\ntask2/cmp.wheel.json\n");
    const { state: task0State } = await fs.readJson(path.resolve(projectRootDir, task0.name, componentJsonFilename));
    expect(task0State).to.equal("not-started");
    const { state: rootWFState } = await fs.readJson(path.resolve(projectRootDir, componentJsonFilename));
    expect(rootWFState).to.equal("not-started");
    const { state: task1State } = await fs.readJson(path.resolve(projectRootDir, "task1", componentJsonFilename));
    expect(task1State).to.equal("not-started");
    const { state: task2State } = await fs.readJson(path.resolve(projectRootDir, "task2", componentJsonFilename));
    expect(task2State).to.equal("not-started");
    const { state: prjState } = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
    expect(prjState).to.equal("not-started");
  });
  it("should rename projectJson.name if that is differ from directory name", async ()=>{
    const projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
    const oldProjectName = projectJson.name;
    projectJson.name = "hoge";
    await fs.writeJson(path.resolve(projectRootDir, projectJsonFilename), projectJson);
    await gitAdd(projectRootDir, projectJsonFilename);
    await gitCommit(projectRootDir);
    await readProject(projectRootDir);

    const { added, modified, deleted, renamed, untracked } = await gitStatus(projectRootDir);
    expect(added).to.be.an("array").that.is.empty;
    expect(modified).to.be.an("array").that.is.empty;
    expect(deleted).to.be.an("array").that.is.empty;
    expect(renamed).to.be.an("array").that.is.empty;
    expect(untracked).to.be.an("array").that.is.empty;
    const { name: rootWFName } = await fs.readJson(path.resolve(projectRootDir, componentJsonFilename));
    expect(rootWFName).to.equal(oldProjectName);
    const { name: prjName } = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
    expect(prjName).to.equal(oldProjectName);
  });
});
