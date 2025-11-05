/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import { getComponentDir, readComponentJson, writeComponentJson } from "../app/core/componentJsonIO.js";

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

export {
  sleep,
  updateComponentProperty
};
