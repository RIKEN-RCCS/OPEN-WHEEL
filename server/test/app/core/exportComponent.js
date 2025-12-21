/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import { promisify } from "node:util";
//eslint-disable-next-line camelcase
import { exec as exec_cb } from "node:child_process";
const exec = promisify(exec_cb);
import path from "node:path";
import fs from "fs-extra";

//setup test framework
import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
const expect = chai.expect;
chai.use(chaiAsPromised);

//helper
import { createNewComponent } from "../../../app/core/componentOperations.js";
import { createNewProject } from "../../../app/core/projectOperations.js";
import { gitCommit, gitAdd } from "../../../app/core/gitOperator2.js";
import { componentJsonFilename } from "../../../app/db/db.js";
import { getTempdRoot } from "../../../app/core/tempd.js";
import { addLink } from "../../../app/core/componentLinks.js";

//testee
import { exportComponent } from "../../../app/core/exportComponent.js";

//test data
const testDirRoot = "WHEEL_TEST_TMP";
const projectRootDir = path.resolve(testDirRoot, "test_project.wheel");

describe("#export component", function () {
  this.timeout(10000);
  const projectName = "test_project";
  const tmpDir = getTempdRoot();

  const extractDir = path.resolve(testDirRoot, "tmp");
  let task0;
  let workflow0;
  let task1;
  let task2;

  beforeEach(async ()=>{
    await fs.ensureDir(tmpDir);
    await fs.remove(testDirRoot);
    await createNewProject(projectRootDir, projectName, null, "test", "test@example.com");
    task0 = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 10, y: 10 });
    workflow0 = await createNewComponent(projectRootDir, projectRootDir, "workflow", { x: 10, y: 10 });
    task1 = await createNewComponent(projectRootDir, path.resolve(projectRootDir, workflow0.name), "task", { x: 10, y: 10 });
    task2 = await createNewComponent(projectRootDir, path.resolve(projectRootDir, workflow0.name), "task", { x: 10, y: 10 });
    await gitCommit(projectRootDir);
  });

  after(async ()=>{
    if (!process.env.WHEEL_KEEP_FILES_AFTER_LAST_TEST) {
      await fs.remove(testDirRoot);
    }
  });

  it("should export a single task component", async ()=>{
    const url = await exportComponent(projectRootDir, task0.ID);
    expect(url).to.be.a("string").and.match(new RegExp(`WHEEL_component_${task0.ID}.tgz`));
    const archiveFilename = path.join(tmpDir, "exportComponent", url);
    expect(fs.statSync(archiveFilename).isFile()).to.be.true;

    //Extract and verify
    await fs.ensureDir(extractDir);
    await exec(`tar xfz ${archiveFilename} -C ${extractDir}`);
    expect(fs.existsSync(path.join(extractDir, task0.name, componentJsonFilename))).to.be.true;
  });

  it("should export a workflow with nested components", async ()=>{
    const url = await exportComponent(projectRootDir, workflow0.ID);
    expect(url).to.be.a("string").and.match(new RegExp(`WHEEL_component_${workflow0.ID}.tgz`));
    const archiveFilename = path.join(tmpDir, "exportComponent", url);
    expect(fs.statSync(archiveFilename).isFile()).to.be.true;

    //Extract and verify
    await fs.ensureDir(extractDir);
    await exec(`tar xfz ${archiveFilename} -C ${extractDir}`);
    expect(fs.existsSync(path.join(extractDir, workflow0.name, componentJsonFilename))).to.be.true;
    expect(fs.existsSync(path.join(extractDir, workflow0.name, task1.name, componentJsonFilename))).to.be.true;
    expect(fs.existsSync(path.join(extractDir, workflow0.name, task2.name, componentJsonFilename))).to.be.true;
  });

  it("should reset all component states to 'not-started'", async ()=>{
    //Change state
    const workflowJson = await fs.readJson(path.join(projectRootDir, workflow0.name, componentJsonFilename));
    workflowJson.state = "running";
    await fs.writeJson(path.join(projectRootDir, workflow0.name, componentJsonFilename), workflowJson);
    await gitAdd(projectRootDir, path.join(projectRootDir, workflow0.name, componentJsonFilename));
    await gitCommit(projectRootDir);

    const url = await exportComponent(projectRootDir, workflow0.ID);
    const archiveFilename = path.join(tmpDir, "exportComponent", url);

    //Extract and verify
    await fs.ensureDir(extractDir);
    await exec(`tar xfz ${archiveFilename} -C ${extractDir}`);

    const exportedWorkflowJson = await fs.readJson(path.join(extractDir, workflow0.name, componentJsonFilename));
    expect(exportedWorkflowJson.state).to.equal("not-started");

    const exportedTask1Json = await fs.readJson(path.join(extractDir, workflow0.name, task1.name, componentJsonFilename));
    expect(exportedTask1Json.state).to.equal("not-started");
  });

  it("should remove all links from components", async ()=>{
    //Add link between tasks
    await addLink(projectRootDir, task1.ID, task2.ID);
    await gitCommit(projectRootDir);

    const url = await exportComponent(projectRootDir, workflow0.ID);
    const archiveFilename = path.join(tmpDir, "exportComponent", url);

    //Extract and verify
    await fs.ensureDir(extractDir);
    await exec(`tar xfz ${archiveFilename} -C ${extractDir}`);

    const exportedTask1Json = await fs.readJson(path.join(extractDir, workflow0.name, task1.name, componentJsonFilename));
    expect(exportedTask1Json.next).to.be.an("array").that.is.empty;

    const exportedTask2Json = await fs.readJson(path.join(extractDir, workflow0.name, task2.name, componentJsonFilename));
    expect(exportedTask2Json.previous).to.be.an("array").that.is.empty;
  });

  it("should not include .git directory in archive", async ()=>{
    const url = await exportComponent(projectRootDir, workflow0.ID);
    const archiveFilename = path.join(tmpDir, "exportComponent", url);

    //Extract and verify
    await fs.ensureDir(extractDir);
    await exec(`tar xfz ${archiveFilename} -C ${extractDir}`);

    expect(fs.existsSync(path.join(extractDir, workflow0.name, ".git"))).to.be.false;
  });

  it("should not include uncommitted files", async ()=>{
    //Create uncommitted file
    await fs.outputFile(path.join(projectRootDir, workflow0.name, "uncommitted.txt"), "test");

    const url = await exportComponent(projectRootDir, workflow0.ID);
    const archiveFilename = path.join(tmpDir, "exportComponent", url);

    //Extract and verify
    await fs.ensureDir(extractDir);
    await exec(`tar xfz ${archiveFilename} -C ${extractDir}`);

    expect(fs.existsSync(path.join(extractDir, workflow0.name, "uncommitted.txt"))).to.be.false;
  });

  it("should use component ID as archive filename", async ()=>{
    const url = await exportComponent(projectRootDir, task0.ID);
    expect(url).to.include(`WHEEL_component_${task0.ID}.tgz`);
    expect(url).not.to.include(task0.name);
  });
});
