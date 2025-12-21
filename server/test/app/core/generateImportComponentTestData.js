/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "fs-extra";

//helper
import { createNewComponent } from "../../../app/core/componentOperations.js";
import { createNewProject } from "../../../app/core/projectOperations.js";
import { gitCommit } from "../../../app/core/gitOperator2.js";
import { getTempdRoot } from "../../../app/core/tempd.js";
import { addLink } from "../../../app/core/componentLinks.js";

//testee
import { exportComponent } from "../../../app/core/exportComponent.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testDirRoot = "WHEEL_TEST_TMP_TESTDATA";
const projectRootDir = path.resolve(testDirRoot, "testdata_project.wheel");
const testFilesDir = path.resolve(__dirname, "../../testFiles");

/**
 * generate test data archives for importComponent tests
 */
async function generateTestData() {
  console.log("Creating test project...");
  const tmpDir = getTempdRoot();
  await fs.ensureDir(tmpDir);
  await fs.remove(testDirRoot);
  await fs.ensureDir(testFilesDir);

  await createNewProject(projectRootDir, "testdata_project", null, "test", "test@example.com");

  //Create a simple task component
  console.log("Creating task component...");
  const task0 = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 10, y: 10 });
  await gitCommit(projectRootDir);

  //Export task component
  console.log("Exporting task component...");
  const taskUrl = await exportComponent(projectRootDir, task0.ID);
  const taskArchive = path.join(tmpDir, "exportComponent", taskUrl);
  const taskDestination = path.join(testFilesDir, "WHEEL_component_task.tgz");
  await fs.copy(taskArchive, taskDestination);
  console.log(`Created: ${taskDestination}`);

  //Create a workflow with nested components
  console.log("Creating workflow with nested components...");
  const workflow0 = await createNewComponent(projectRootDir, projectRootDir, "workflow", { x: 100, y: 100 });
  const task1 = await createNewComponent(projectRootDir, path.resolve(projectRootDir, workflow0.name), "task", { x: 10, y: 10 });
  const task2 = await createNewComponent(projectRootDir, path.resolve(projectRootDir, workflow0.name), "task", { x: 10, y: 50 });
  const task3 = await createNewComponent(projectRootDir, path.resolve(projectRootDir, workflow0.name), "task", { x: 10, y: 90 });
  await addLink(projectRootDir, task1.ID, task2.ID);
  await addLink(projectRootDir, task2.ID, task3.ID);
  await gitCommit(projectRootDir);

  //Export workflow
  console.log("Exporting workflow component...");
  const workflowUrl = await exportComponent(projectRootDir, workflow0.ID);
  const workflowArchive = path.join(tmpDir, "exportComponent", workflowUrl);
  const workflowDestination = path.join(testFilesDir, "WHEEL_component_workflow.tgz");
  await fs.copy(workflowArchive, workflowDestination);
  console.log(`Created: ${workflowDestination}`);

  //Create a workflow with nested workflow
  console.log("Creating workflow with nested workflow...");
  const workflow1 = await createNewComponent(projectRootDir, projectRootDir, "workflow", { x: 200, y: 200 });
  const workflow2 = await createNewComponent(projectRootDir, path.resolve(projectRootDir, workflow1.name), "workflow", { x: 10, y: 10 });
  await createNewComponent(projectRootDir, path.resolve(projectRootDir, workflow1.name, workflow2.name), "task", { x: 10, y: 10 });
  await createNewComponent(projectRootDir, path.resolve(projectRootDir, workflow1.name, workflow2.name), "task", { x: 10, y: 50 });
  await gitCommit(projectRootDir);

  //Export nested workflow
  console.log("Exporting nested workflow component...");
  const nestedWorkflowUrl = await exportComponent(projectRootDir, workflow1.ID);
  const nestedWorkflowArchive = path.join(tmpDir, "exportComponent", nestedWorkflowUrl);
  const nestedWorkflowDestination = path.join(testFilesDir, "WHEEL_component_workflow_nested.tgz");
  await fs.copy(nestedWorkflowArchive, nestedWorkflowDestination);
  console.log(`Created: ${nestedWorkflowDestination}`);

  //Clean up
  console.log("Cleaning up...");
  await fs.remove(testDirRoot);

  console.log("\nTest data generation complete!");
  console.log("Created files:");
  console.log("  - WHEEL_component_task.tgz");
  console.log("  - WHEEL_component_workflow.tgz");
  console.log("  - WHEEL_component_workflow_nested.tgz");
}

//Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateTestData()
    .then(()=>{
      console.log("\nSuccess!");
      process.exit(0);
    })
    .catch((err)=>{
      console.error("Error generating test data:", err);
      process.exit(1);
    });
}

export { generateTestData };
