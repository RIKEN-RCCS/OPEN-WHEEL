/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const fs = require("fs-extra");
const path = require("path");
const { promisify } = require("util");
const { execFile } = require("child_process");
const asyncExecFile = promisify(execFile);
const rewire = require("rewire");

//setup test framework
const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-fs"));
chai.use(require("chai-as-promised"));

//helper
const { updateComponent, createNewComponent, createNewProject } = require("../app/core/projectFilesOperator");
const { gitAdd, gitRm, gitStatus, gitCommit} = require("../app/core/gitOperator2.js");
const {componentJsonFilename, projectJsonFilename } = require("../app/db/db.js");

//testee
const PFO = rewire("../app/core/projectFilesOperator.js");
const importProject = PFO.__get__("importProject");

let onList=false;
const projectList = PFO.__get__("projectList");
projectList.query=()=>{return onList}
projectList.write=()=>{};
PFO.__set__("projectList", projectList);
////for debug 
//PFO.__set__("getLogger", ()=>{return {
//trace: console.log.bind(console),
//debug: console.log.bind(console),
//info: console.log.bind(console),
//warn: console.log.bind(console),
//error: console.log.bind(console)
//}})


//test data
const testDirRoot = path.resolve("./", "WHEEL_TEST_TMP");
const projectRootDir = path.resolve(testDirRoot, "test_project.wheel");

describe("importProject UT", function (){
  this.timeout(4000);
  let task0;
  beforeEach(async()=>{
    await fs.remove(testDirRoot);
    await createNewProject(projectRootDir, "test_project", null, "test", "test@example.com");
    task0=await createNewComponent(projectRootDir, projectRootDir, "task", { x: 10, y: 10 });
    await createNewComponent(projectRootDir, projectRootDir, "task", { x: 10, y: 10 });
    await createNewComponent(projectRootDir, projectRootDir, "task", { x: 10, y: 10 });
    await gitCommit(projectRootDir);
  });
  after(async()=>{
    if (!process.env.WHEEL_KEEP_FILES_AFTER_LAST_TEST) {
      await fs.remove(testDirRoot);
    }
  });
  it("should do nothing git-controlled and not-started state", async ()=>{
    await importProject(projectRootDir);

    const { added, modified, deleted, renamed, untracked } = await gitStatus(projectRootDir);
    expect(added).to.be.an("array").that.is.empty;
    expect(modified).to.be.an("array").that.is.empty;
    expect(deleted).to.be.an("array").that.is.empty;
    expect(renamed).to.be.an("array").that.is.empty;
    expect(untracked).to.be.an("array").that.is.empty;
  });
  it("should do nothing if git-controlled and something modified", async()=>{
    await updateComponent(projectRootDir, task0.ID, "state", "hoge");
    await importProject(projectRootDir);

    const { added, modified, deleted, renamed, untracked } = await gitStatus(projectRootDir);
    expect(added).to.be.an("array").that.is.empty;
    expect(modified).to.be.an("array").that.has.members([path.join("./",task0.name,componentJsonFilename)]);
    expect(deleted).to.be.an("array").that.is.empty;
    expect(renamed).to.be.an("array").that.is.empty;
    expect(untracked).to.be.an("array").that.is.empty;
  });
  it("should convert include or exclude prop is comma separated string", async()=>{
    await updateComponent(projectRootDir, task0.ID, "include", "foo,bar,baz");
    await updateComponent(projectRootDir, task0.ID, "exclude", "hoge,huga,piyo");
    await gitCommit(projectRootDir);
    await importProject(projectRootDir);

    const { added, modified, deleted, renamed, untracked } = await gitStatus(projectRootDir);
    expect(added).to.be.an("array").that.is.empty;
    expect(modified).to.be.an("array").that.is.empty;
    expect(deleted).to.be.an("array").that.is.empty;
    expect(renamed).to.be.an("array").that.is.empty;
    expect(untracked).to.be.an("array").that.is.empty;

    const {include: task0include, exclude:task0exclude} =await fs.readJson(path.resolve(projectRootDir, task0.name, componentJsonFilename));
    expect(task0include).to.be.an("array").that.has.deep.members([{name: "foo" }, {name: "bar" }, {name: "baz" }]);
    expect(task0exclude).to.be.an("array").that.has.deep.members([{name: "piyo"}, {name: "huga"}, {name: "hoge"}]);
  });
  it("should add and commit .gitignore if git-controlled but .gitignore is not inclueded", async()=>{
    const ignoreFile=path.join(projectRootDir, ".gitignore")
    await gitRm(projectRootDir, ".gitignore");
    await fs.remove(ignoreFile);
    await gitCommit(projectRootDir);
    await importProject(projectRootDir);

    const { added, modified, deleted, renamed, untracked } = await gitStatus(projectRootDir);
    expect(added).to.be.an("array").that.is.empty;
    expect(modified).to.be.an("array").that.is.empty;
    expect(deleted).to.be.an("array").that.is.empty;
    expect(renamed).to.be.an("array").that.is.empty;
    expect(untracked).to.be.an("array").that.is.empty;
    expect(ignoreFile).to.be.a.file().with.content("wheel.log");
  });
  it("should set all components and project to 'not-started' and commit everything if project is not git-controlled", async ()=>{
    await updateComponent(projectRootDir, task0.ID, "state", "hoge");
    await fs.remove(path.resolve(projectRootDir, ".git"));
    await importProject(projectRootDir);

    const { added, modified, deleted, renamed, untracked } = await gitStatus(projectRootDir);
    expect(added).to.be.an("array").that.is.empty;
    expect(modified).to.be.an("array").that.is.empty;
    expect(deleted).to.be.an("array").that.is.empty;
    expect(renamed).to.be.an("array").that.is.empty;
    expect(untracked).to.be.an("array").that.is.empty;
    const { stdout } = await asyncExecFile("git", ["ls-files"], { cwd: projectRootDir}).catch((e)=>{
      console.log("ERROR:\n", e);
    });
    expect(stdout).to.equal(".gitignore\ncmp.wheel.json\nprj.wheel.json\ntask0/cmp.wheel.json\ntask1/cmp.wheel.json\ntask2/cmp.wheel.json\n");
    const {state: task0State} =await fs.readJson(path.resolve(projectRootDir, task0.name, componentJsonFilename));
    expect(task0State).to.equal("not-started");
    const {state: rootWFState}=await fs.readJson(path.resolve(projectRootDir, componentJsonFilename));
    expect(rootWFState).to.equal("not-started");
    const {state:task1State}=await fs.readJson(path.resolve(projectRootDir, "task1", componentJsonFilename));
    expect(task1State).to.equal("not-started");
    const {state:task2State}=await fs.readJson(path.resolve(projectRootDir, "task2", componentJsonFilename));
    expect(task2State).to.equal("not-started");
    const {state:prjState}=await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
    expect(prjState).to.equal("not-started");
  });
  it("should rename root directory to projectJson.name if that is differ", async ()=>{
    const projectJson=await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
    projectJson.name = "hoge"
    await fs.writeJson(path.resolve(projectRootDir, projectJsonFilename), projectJson);
    await gitAdd(projectRootDir, projectJsonFilename);
    await gitCommit(projectRootDir);
    await importProject(projectRootDir);

    const newProjectRootDir=path.resolve(testDirRoot, "hoge.wheel")
    const { added, modified, deleted, renamed, untracked } = await gitStatus(newProjectRootDir);
    expect(added).to.be.an("array").that.is.empty;
    expect(modified).to.be.an("array").that.is.empty;
    expect(deleted).to.be.an("array").that.is.empty;
    expect(renamed).to.be.an("array").that.is.empty;
    expect(untracked).to.be.an("array").that.is.empty;

    const {name: rootWFName}=await fs.readJson(path.resolve(newProjectRootDir, componentJsonFilename));
    expect(rootWFName).to.equal("hoge");
    const {name:prjName}=await fs.readJson(path.resolve(newProjectRootDir, projectJsonFilename));
    expect(prjName).to.equal("hoge");
  });
});
