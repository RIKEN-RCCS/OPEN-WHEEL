/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import fs from "fs-extra";
import { getComponentDir, readComponentJson, writeComponentJson } from "../app/core/componentJsonIO.js";
import { gitInit } from "../app/core/gitOperator2.js";

async function sleep(time) {
  return new Promise((resolve)=>{
    setTimeout(resolve, time);
  });
}

/**
 * Helper function to update a single property WITHOUT validation (for tests that need invalid values)
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - component ID
 * @param {string} prop - property name to update
 * @param {*} value - new value for the property
 * @returns {Promise<object>} - updated component JSON
 */
async function updateComponentProperty(projectRootDir, ID, prop, value) {
  const componentDir = await getComponentDir(projectRootDir, ID, true);
  const currentComponent = await readComponentJson(componentDir);
  currentComponent[prop] = value;
  await writeComponentJson(projectRootDir, componentDir, currentComponent);
  return currentComponent;
}

/**
 * Create a clean test root directory initialised as its own git repository.
 * Call this at the start of each beforeEach that creates files on disk so that
 * WHEEL_TEST_TMP is never a bare (non-git) directory inside the WHEEL source
 * tree (which would show up as untracked in `git status`).
 * @param {string} testDirRoot - path to the test root directory (e.g. "WHEEL_TEST_TMP")
 * @returns {Promise<void>}
 */
async function setupTestDir(testDirRoot) {
  await fs.remove(testDirRoot);
  await fs.ensureDir(testDirRoot);
  await gitInit(testDirRoot, "test", "test@example.com");
}

export {
  sleep,
  updateComponentProperty,
  setupTestDir
};
