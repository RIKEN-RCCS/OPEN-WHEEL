/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
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
import { gitCommit } from "../../../app/core/gitOperator2.js";
import { getProjectJson } from "../../../app/core/projectJsonFileOperator.js";
import { componentJsonFilename } from "../../../app/db/db.js";
import { addLink } from "../../../app/core/componentLinks.js";
import { getTempdRoot } from "../../../app/core/tempd.js";

//testee
import { exportComponent } from "../../../app/core/exportComponent.js";
import { importComponent } from "../../../app/core/importComponent.js";

//test data
const testDirRoot = "WHEEL_TEST_TMP";
const sourceProjectDir = path.resolve(testDirRoot, "source_project.wheel");
const targetProjectDir = path.resolve(testDirRoot, "target_project.wheel");

describe("#component export and import e2e", function () {
  this.timeout(15000);
  const tmpDir = getTempdRoot();

  beforeEach(async ()=>{
    await fs.ensureDir(tmpDir);
    await fs.remove(testDirRoot);
  });

  after(async ()=>{
    if (!process.env.WHEEL_KEEP_FILES_AFTER_LAST_TEST) {
      await fs.remove(testDirRoot);
    }
  });

  it("should export component from one project and import to another", async ()=>{
    //Create source project with a workflow containing tasks
    await createNewProject(sourceProjectDir, "source_project", null, "test", "test@example.com");
    const workflow = await createNewComponent(sourceProjectDir, sourceProjectDir, "workflow", { x: 100, y: 100 });
    const task1 = await createNewComponent(sourceProjectDir, path.join(sourceProjectDir, workflow.name), "task", { x: 10, y: 10 });
    const task2 = await createNewComponent(sourceProjectDir, path.join(sourceProjectDir, workflow.name), "task", { x: 10, y: 50 });
    const task3 = await createNewComponent(sourceProjectDir, path.join(sourceProjectDir, workflow.name), "task", { x: 10, y: 90 });
    await addLink(sourceProjectDir, task1.ID, task2.ID);
    await addLink(sourceProjectDir, task2.ID, task3.ID);
    await gitCommit(sourceProjectDir);

    //Get original component IDs
    const originalProjectJson = await getProjectJson(sourceProjectDir);
    const originalComponentIDs = Object.keys(originalProjectJson.componentPath);

    //Export the workflow component
    const exportUrl = await exportComponent(sourceProjectDir, workflow.ID);

    //Verify export URL is correct
    expect(exportUrl).to.be.a("string");
    expect(exportUrl).to.include("exportComponent");
    expect(exportUrl).to.include(`WHEEL_component_${workflow.ID}.tgz`);

    //Get the actual archive file path
    const archiveFilename = path.join(tmpDir, exportUrl);
    expect(await fs.pathExists(archiveFilename)).to.be.true;

    //Verify archive is a valid tar.gz
    const stat = await fs.stat(archiveFilename);
    expect(stat.size).to.be.greaterThan(0);

    //Create target project
    await createNewProject(targetProjectDir, "target_project", null, "test", "test@example.com");
    await gitCommit(targetProjectDir);

    const targetProjectJson = await getProjectJson(targetProjectDir);
    const targetRootID = Object.keys(targetProjectJson.componentPath)[0];

    //Import the component to target project
    const newComponentID = await importComponent(targetProjectDir, archiveFilename, targetRootID);

    //Verify import
    expect(newComponentID).to.be.a("string");
    expect(newComponentID).not.to.equal(workflow.ID); //Should have new ID

    const updatedTargetProjectJson = await getProjectJson(targetProjectDir);

    //Verify new component exists in target project
    expect(updatedTargetProjectJson.componentPath[newComponentID]).to.exist;

    //Verify all nested components were imported
    const targetComponentIDs = Object.keys(updatedTargetProjectJson.componentPath);
    expect(targetComponentIDs.length).to.equal(5); //root + workflow + 3 tasks

    //Verify no original IDs were used (all IDs regenerated)
    for (const originalID of originalComponentIDs) {
      if (originalID !== originalProjectJson.componentPath[Object.keys(originalProjectJson.componentPath)[0]]) {
        //Skip root component
        expect(targetComponentIDs).not.to.include(originalID);
      }
    }

    //Verify component directory exists
    const importedComponentPath = updatedTargetProjectJson.componentPath[newComponentID];
    const importedComponentDir = path.resolve(targetProjectDir, importedComponentPath);
    expect(await fs.pathExists(importedComponentDir)).to.be.true;

    //Verify component JSON exists and has correct structure
    const importedComponentJson = await fs.readJson(path.join(importedComponentDir, componentJsonFilename));
    expect(importedComponentJson.ID).to.equal(newComponentID);
    expect(importedComponentJson.type).to.equal("workflow");
    expect(importedComponentJson.parent).to.equal(targetRootID);

    //Verify nested tasks exist
    const nestedDirs = await fs.readdir(importedComponentDir);
    const taskDirs = [];
    for (const dir of nestedDirs) {
      const taskJsonPath = path.join(importedComponentDir, dir, componentJsonFilename);
      if (await fs.pathExists(taskJsonPath)) {
        taskDirs.push(dir);
      }
    }
    expect(taskDirs.length).to.equal(3);

    //Verify links were removed during export
    for (const taskDir of taskDirs) {
      const taskJson = await fs.readJson(path.join(importedComponentDir, taskDir, componentJsonFilename));
      expect(taskJson.previous).to.be.an("array").that.is.empty;
      expect(taskJson.next).to.be.an("array").that.is.empty;
    }

    //Verify all component states are "not-started"
    expect(importedComponentJson.state).to.equal("not-started");

    for (const taskDir of taskDirs) {
      const taskJson = await fs.readJson(path.join(importedComponentDir, taskDir, componentJsonFilename));
      expect(taskJson.state).to.equal("not-started");
    }

    //Verify source project is unchanged
    const finalSourceProjectJson = await getProjectJson(sourceProjectDir);
    expect(Object.keys(finalSourceProjectJson.componentPath)).to.have.lengthOf(originalComponentIDs.length);
  });

  it("should handle importing the same component twice with different names", async ()=>{
    //Create source project with a simple task
    await createNewProject(sourceProjectDir, "source_project", null, "test", "test@example.com");
    const task = await createNewComponent(sourceProjectDir, sourceProjectDir, "task", { x: 10, y: 10 });
    await gitCommit(sourceProjectDir);

    //Export the task
    const exportUrl = await exportComponent(sourceProjectDir, task.ID);
    const archiveFilename = path.join(tmpDir, exportUrl);

    //Create target project
    await createNewProject(targetProjectDir, "target_project", null, "test", "test@example.com");
    await gitCommit(targetProjectDir);

    const targetProjectJson = await getProjectJson(targetProjectDir);
    const targetRootID = Object.keys(targetProjectJson.componentPath)[0];

    //Import first time
    const archiveFile1 = path.join(testDirRoot, "import1.tgz");
    await fs.copy(archiveFilename, archiveFile1);
    const firstImportID = await importComponent(targetProjectDir, archiveFile1, targetRootID);

    //Import second time (should get different name with suffix)
    const archiveFile2 = path.join(testDirRoot, "import2.tgz");
    await fs.copy(archiveFilename, archiveFile2);
    const secondImportID = await importComponent(targetProjectDir, archiveFile2, targetRootID);

    //Verify both imports succeeded with different IDs
    expect(firstImportID).not.to.equal(secondImportID);

    const finalProjectJson = await getProjectJson(targetProjectDir);
    expect(finalProjectJson.componentPath[firstImportID]).to.exist;
    expect(finalProjectJson.componentPath[secondImportID]).to.exist;

    //Verify different directory names
    const firstName = path.basename(finalProjectJson.componentPath[firstImportID]);
    const secondName = path.basename(finalProjectJson.componentPath[secondImportID]);
    expect(firstName).not.to.equal(secondName);
    expect(secondName).to.match(/_imported\d*$/); //Should have _imported suffix
  });

  it("should export and import nested workflows correctly", async ()=>{
    //Create source project with nested workflows
    await createNewProject(sourceProjectDir, "source_project", null, "test", "test@example.com");
    const outerWorkflow = await createNewComponent(sourceProjectDir, sourceProjectDir, "workflow", { x: 100, y: 100 });
    const innerWorkflow = await createNewComponent(sourceProjectDir, path.join(sourceProjectDir, outerWorkflow.name), "workflow", { x: 10, y: 10 });
    await createNewComponent(sourceProjectDir, path.join(sourceProjectDir, outerWorkflow.name, innerWorkflow.name), "task", { x: 10, y: 10 });
    await createNewComponent(sourceProjectDir, path.join(sourceProjectDir, outerWorkflow.name, innerWorkflow.name), "task", { x: 10, y: 50 });
    await gitCommit(sourceProjectDir);

    //Export the outer workflow
    const exportUrl = await exportComponent(sourceProjectDir, outerWorkflow.ID);
    const archiveFilename = path.join(tmpDir, exportUrl);

    //Create target project
    await createNewProject(targetProjectDir, "target_project", null, "test", "test@example.com");
    await gitCommit(targetProjectDir);

    const targetProjectJson = await getProjectJson(targetProjectDir);
    const targetRootID = Object.keys(targetProjectJson.componentPath)[0];

    //Import to target project
    const newComponentID = await importComponent(targetProjectDir, archiveFilename, targetRootID);

    //Verify nested structure
    const finalProjectJson = await getProjectJson(targetProjectDir);
    const allComponentIDs = Object.keys(finalProjectJson.componentPath);
    expect(allComponentIDs.length).to.equal(5); //root + outer workflow + inner workflow + 2 tasks

    //Verify nested workflow exists
    const importedPath = finalProjectJson.componentPath[newComponentID];
    const importedDir = path.resolve(targetProjectDir, importedPath);
    const nestedDirs = await fs.readdir(importedDir);

    let innerWorkflowFound = false;
    for (const dir of nestedDirs) {
      const jsonPath = path.join(importedDir, dir, componentJsonFilename);
      if (await fs.pathExists(jsonPath)) {
        const json = await fs.readJson(jsonPath);
        if (json.type === "workflow") {
          innerWorkflowFound = true;
          //Verify inner workflow has tasks
          const innerDir = path.join(importedDir, dir);
          const innerContents = await fs.readdir(innerDir);
          let taskCount = 0;
          for (const innerItem of innerContents) {
            const taskJsonPath = path.join(innerDir, innerItem, componentJsonFilename);
            if (await fs.pathExists(taskJsonPath)) {
              taskCount++;
            }
          }
          expect(taskCount).to.equal(2);
        }
      }
    }
    expect(innerWorkflowFound).to.be.true;
  });
});
