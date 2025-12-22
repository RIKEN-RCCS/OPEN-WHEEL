/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "fs-extra";

//setup test framework
import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
const expect = chai.expect;
chai.use(chaiAsPromised);

//helper
import { createNewProject } from "../../../app/core/projectOperations.js";
import { createNewComponent } from "../../../app/core/componentOperations.js";
import { gitCommit } from "../../../app/core/gitOperator2.js";
import { getProjectJson } from "../../../app/core/projectJsonFileOperator.js";
import { componentJsonFilename } from "../../../app/db/db.js";

//testee
import { importComponent } from "../../../app/core/importComponent.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//test data
const testDirRoot = "WHEEL_TEST_TMP";
const projectRootDir = path.resolve(testDirRoot, "test_project.wheel");
const testFilesDir = path.resolve(__dirname, "../../testFiles");

describe("#import component", function () {
  this.timeout(10000);
  const projectName = "test_project";

  beforeEach(async ()=>{
    await fs.remove(testDirRoot);
    await createNewProject(projectRootDir, projectName, null, "test", "test@example.com");
    await gitCommit(projectRootDir);
  });

  after(async ()=>{
    if (!process.env.WHEEL_KEEP_FILES_AFTER_LAST_TEST) {
      await fs.remove(testDirRoot);
    }
  });

  it("should import a task component", async ()=>{
    //Copy test archive to temp location (importComponent will delete it)
    const archiveFile = path.join(testDirRoot, "test_task.tgz");
    await fs.copy(path.join(testFilesDir, "WHEEL_component_task.tgz"), archiveFile);

    const projectJson = await getProjectJson(projectRootDir);
    const rootID = Object.keys(projectJson.componentPath)[0];

    const newComponentID = await importComponent(projectRootDir, archiveFile, rootID);

    //Verify component was imported
    expect(newComponentID).to.be.a("string");
    expect(newComponentID).not.to.be.empty;

    //Verify component exists in componentPath
    const updatedProjectJson = await getProjectJson(projectRootDir);
    expect(updatedProjectJson.componentPath[newComponentID]).to.exist;

    //Verify component directory exists
    const componentPath = updatedProjectJson.componentPath[newComponentID];
    const componentDir = path.resolve(projectRootDir, componentPath);
    expect(await fs.pathExists(componentDir)).to.be.true;

    //Verify component JSON exists
    const componentJsonFile = path.join(componentDir, componentJsonFilename);
    expect(await fs.pathExists(componentJsonFile)).to.be.true;

    //Verify component has correct parent
    const componentJson = await fs.readJson(componentJsonFile);
    expect(componentJson.parent).to.equal(rootID);

    //Verify archive was cleaned up
    expect(await fs.pathExists(archiveFile)).to.be.false;
  });

  it("should import a workflow with nested components", async ()=>{
    const archiveFile = path.join(testDirRoot, "test_workflow.tgz");
    await fs.copy(path.join(testFilesDir, "WHEEL_component_workflow.tgz"), archiveFile);

    const projectJson = await getProjectJson(projectRootDir);
    const rootID = Object.keys(projectJson.componentPath)[0];

    const newComponentID = await importComponent(projectRootDir, archiveFile, rootID);

    //Verify workflow was imported
    expect(newComponentID).to.be.a("string");

    const updatedProjectJson = await getProjectJson(projectRootDir);
    const componentPath = updatedProjectJson.componentPath[newComponentID];
    const componentDir = path.resolve(projectRootDir, componentPath);

    //Count nested components
    const nestedDirs = await fs.readdir(componentDir);
    const nestedComponents = nestedDirs.filter(async (dir)=>{
      const jsonFile = path.join(componentDir, dir, componentJsonFilename);
      return await fs.pathExists(jsonFile);
    });

    //Should have 3 nested task components
    expect(nestedComponents.length).to.be.at.least(3);

    //Verify all nested components are in componentPath
    const allComponentIDs = Object.keys(updatedProjectJson.componentPath);
    expect(allComponentIDs.length).to.be.at.least(4); //root + workflow + 3 tasks
  });

  it("should handle name conflicts by adding suffix", async ()=>{
    //First import
    const archiveFile1 = path.join(testDirRoot, "test_task1.tgz");
    await fs.copy(path.join(testFilesDir, "WHEEL_component_task.tgz"), archiveFile1);

    const projectJson = await getProjectJson(projectRootDir);
    const rootID = Object.keys(projectJson.componentPath)[0];

    const firstID = await importComponent(projectRootDir, archiveFile1, rootID);
    const firstProjectJson = await getProjectJson(projectRootDir);
    const firstPath = firstProjectJson.componentPath[firstID];
    const firstName = path.basename(firstPath);

    //Second import - should add suffix
    const archiveFile2 = path.join(testDirRoot, "test_task2.tgz");
    await fs.copy(path.join(testFilesDir, "WHEEL_component_task.tgz"), archiveFile2);

    const secondID = await importComponent(projectRootDir, archiveFile2, rootID);
    const secondProjectJson = await getProjectJson(projectRootDir);
    const secondPath = secondProjectJson.componentPath[secondID];
    const secondName = path.basename(secondPath);

    //Names should be different
    expect(firstName).not.to.equal(secondName);
    expect(secondName).to.match(/_imported\d*$/); //Should end with _imported, _imported2, etc.
  });

  it("should regenerate all component IDs", async ()=>{
    const archiveFile = path.join(testDirRoot, "test_workflow_ids.tgz");
    await fs.copy(path.join(testFilesDir, "WHEEL_component_workflow.tgz"), archiveFile);

    const projectJson = await getProjectJson(projectRootDir);
    const rootID = Object.keys(projectJson.componentPath)[0];

    //Get IDs before import
    const idsBefore = Object.keys(projectJson.componentPath);

    await importComponent(projectRootDir, archiveFile, rootID);

    //Get IDs after import
    const projectJsonAfter = await getProjectJson(projectRootDir);
    const idsAfter = Object.keys(projectJsonAfter.componentPath);

    //Should have more IDs now
    expect(idsAfter.length).to.be.greaterThan(idsBefore.length);

    //All new IDs should be different from old IDs
    const newIDs = idsAfter.filter((id)=>{
      return !idsBefore.includes(id);
    });
    expect(newIDs.length).to.be.at.least(4); //workflow + 3 tasks
  });

  it("should update componentPath correctly for all imported components", async ()=>{
    const archiveFile = path.join(testDirRoot, "test_workflow_path.tgz");
    await fs.copy(path.join(testFilesDir, "WHEEL_component_workflow.tgz"), archiveFile);

    const projectJson = await getProjectJson(projectRootDir);
    const rootID = Object.keys(projectJson.componentPath)[0];

    await importComponent(projectRootDir, archiveFile, rootID);

    const updatedProjectJson = await getProjectJson(projectRootDir);

    //Verify all component paths exist
    for (const [id, relativePath] of Object.entries(updatedProjectJson.componentPath)) {
      const absolutePath = path.resolve(projectRootDir, relativePath);
      const componentJsonFile = path.join(absolutePath, componentJsonFilename);
      expect(await fs.pathExists(componentJsonFile), `Component ${id} path should exist`).to.be.true;

      //Verify component JSON has correct ID
      const component = await fs.readJson(componentJsonFile);
      expect(component.ID).to.equal(id);
    }
  });

  it("should git add imported component", async ()=>{
    const archiveFile = path.join(testDirRoot, "test_task_git.tgz");
    await fs.copy(path.join(testFilesDir, "WHEEL_component_task.tgz"), archiveFile);

    const projectJson = await getProjectJson(projectRootDir);
    const rootID = Object.keys(projectJson.componentPath)[0];

    await importComponent(projectRootDir, archiveFile, rootID);

    //Verify git add was done (should have staged changes but no unstaged changes)
    const { promisify } = await import("node:util");
    //eslint-disable-next-line camelcase
    const { exec: exec_cb } = await import("node:child_process");
    const exec = promisify(exec_cb);

    const { stdout } = await exec(`cd ${projectRootDir} && git status --porcelain`);
    //Should have staged changes (lines starting with 'A ')
    expect(stdout).to.include("A ");
  });

  it("should import to different target parents correctly", async ()=>{
    //Create a workflow to use as target parent
    const workflow = await createNewComponent(projectRootDir, projectRootDir, "workflow", { x: 100, y: 100 });
    await gitCommit(projectRootDir);

    //Import into the workflow
    const archiveFile = path.join(testDirRoot, "test_task_parent.tgz");
    await fs.copy(path.join(testFilesDir, "WHEEL_component_task.tgz"), archiveFile);

    const newComponentID = await importComponent(projectRootDir, archiveFile, workflow.ID);

    //Verify component has correct parent
    const projectJson = await getProjectJson(projectRootDir);
    const componentPath = projectJson.componentPath[newComponentID];
    const componentDir = path.resolve(projectRootDir, componentPath);
    const componentJson = await fs.readJson(path.join(componentDir, componentJsonFilename));

    expect(componentJson.parent).to.equal(workflow.ID);

    //Verify component is inside the workflow directory
    const workflowPath = projectJson.componentPath[workflow.ID];
    const workflowDir = path.resolve(projectRootDir, workflowPath);
    expect(componentDir).to.include(workflowDir);
  });

  it("should import nested workflow correctly", async ()=>{
    const archiveFile = path.join(testDirRoot, "test_nested_workflow.tgz");
    await fs.copy(path.join(testFilesDir, "WHEEL_component_workflow_nested.tgz"), archiveFile);

    const projectJson = await getProjectJson(projectRootDir);
    const rootID = Object.keys(projectJson.componentPath)[0];

    const newComponentID = await importComponent(projectRootDir, archiveFile, rootID);

    const updatedProjectJson = await getProjectJson(projectRootDir);

    //Should have workflow + nested workflow + nested tasks
    const allComponentIDs = Object.keys(updatedProjectJson.componentPath);
    expect(allComponentIDs.length).to.be.at.least(4); //root + workflow + nested workflow + tasks

    //Verify component structure
    const componentPath = updatedProjectJson.componentPath[newComponentID];
    const componentDir = path.resolve(projectRootDir, componentPath);

    //Should have nested workflow
    const nestedDirs = await fs.readdir(componentDir);
    const hasNestedWorkflow = nestedDirs.some(async (dir)=>{
      const jsonFile = path.join(componentDir, dir, componentJsonFilename);
      if (await fs.pathExists(jsonFile)) {
        const json = await fs.readJson(jsonFile);
        return json.type === "workflow";
      }
      return false;
    });

    expect(hasNestedWorkflow).to.be.true;
  });
});
