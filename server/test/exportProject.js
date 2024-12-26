/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const util = require("node:util");
const exec = util.promisify(require("node:child_process").exec);
const path = require("node:path");
const fs = require("fs-extra");

//setup test framework
const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-fs"));
chai.use(require("chai-as-promised"));

//helper
const { createNewComponent, createNewProject } = require("../app/core/projectFilesOperator");
const { gitCommit } = require("../app/core/gitOperator2.js");
const { projectJsonFilename, componentJsonFilename } = require("../app/db/db.js");

//testee
const { exportProject } = require("../app/core/exportProject.js");

//test data
const testDirRoot = "WHEEL_TEST_TMP";
const projectRootDir = path.resolve(testDirRoot, "test_project.wheel");

describe("#export project", function () {
  this.timeout(10000);
  const projectName = "test_project";
  const extractDir = path.resolve(testDirRoot, "tmp");
  let workflow0;
  beforeEach(async ()=>{
    await fs.remove(testDirRoot);
    await createNewProject(projectRootDir, projectName, null, "test", "test@example.com");
    await createNewComponent(projectRootDir, projectRootDir, "task", { x: 10, y: 10 });
    await createNewComponent(projectRootDir, projectRootDir, "task", { x: 10, y: 10 });
    await createNewComponent(projectRootDir, projectRootDir, "task", { x: 10, y: 10 });
    workflow0 = await createNewComponent(projectRootDir, projectRootDir, "workflow", { x: 10, y: 10 });
    await createNewComponent(projectRootDir, path.resolve(projectRootDir, workflow0.name), "task", { x: 10, y: 10 });
    await createNewComponent(projectRootDir, path.resolve(projectRootDir, workflow0.name), "task", { x: 10, y: 10 });
    await createNewComponent(projectRootDir, path.resolve(projectRootDir, workflow0.name), "task", { x: 10, y: 10 });
    await gitCommit(projectRootDir);
  });
  after(async ()=>{
    if (!process.env.WHEEL_KEEP_FILES_AFTER_LAST_TEST) {
      await fs.remove(testDirRoot);
    }
  });
  it("should export project as tar.gz", async ()=>{
    expect(await exportProject(projectRootDir)).to.be.a("string").and.match(new RegExp(`WHEEL_project_${projectName}.tgz`));
  });
  it("should export project even if not-committed files exist and exclude them", async ()=>{
    await fs.outputFile(path.resolve(projectRootDir, workflow0.name, "hoge"), "hoge");
    const url = await exportProject(projectRootDir);
    expect(url).to.be.a("string").and.match(new RegExp(`WHEEL_project_${projectName}.tgz`));
    await fs.ensureDir(extractDir);
    await exec(`tar xfz ${path.join("/tmp/exportProject", url)} -C ${extractDir}`);
    expect(path.join(extractDir, workflow0.name, "hoge")).to.not.be.a.path();
    expect(path.join(extractDir, projectJsonFilename)).to.be.a.file();
  });
  it("should export project and status changed to 'not-started'", async ()=>{
    const workflowJson = await fs.readJson(path.join(projectRootDir, workflow0.name, componentJsonFilename));
    workflowJson.state = "hoge";
    await fs.writeJson(path.join(projectRootDir, workflow0.name, componentJsonFilename), workflowJson);

    const projectJson = await fs.readJson(path.join(projectRootDir, projectJsonFilename));
    projectJson.state = "huga";
    await fs.writeJson(path.join(projectRootDir, projectJsonFilename), projectJson);
    await exec(`cd ${projectRootDir}&&git add -u&& git commit -m 'test'`);

    const url = await exportProject(projectRootDir);
    expect(url).to.be.a("string").and.match(new RegExp(`WHEEL_project_${projectName}.tgz`));
    await fs.ensureDir(extractDir);
    await exec(`tar xfz ${path.join("/tmp/exportProject", url)} -C ${extractDir}`);

    const workflowJsonAfter = await fs.readJson(path.join(extractDir, workflow0.name, componentJsonFilename));
    expect(workflowJsonAfter.state).to.be.a("string").and.equal("not-started");
    const projectJsonAfter = await fs.readJson(path.join(extractDir, projectJsonFilename));
    expect(projectJsonAfter.state).to.be.a("string").and.equal("not-started");
  });
});
