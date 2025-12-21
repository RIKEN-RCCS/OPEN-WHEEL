/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import path from "path";
import fs from "fs-extra";
import * as tar from "tar";
import { v4 as uuidv4 } from "uuid";
import { createTempd } from "./tempd.js";
import { getComponentDir, readComponentJson } from "./componentJsonIO.js";
import { gitAdd, gitCommit } from "./gitOperator2.js";
import { updateComponentPath } from "./componentPathOperations.js";
import { componentJsonFilename } from "../db/db.js";

/**
 * extract component archive to temporary directory
 * @param {string} archiveFile - path to archive file
 * @returns {Promise<object>} - { componentDir: string, componentBasename: string, tempDir: string }
 */
async function extractComponentArchive(archiveFile) {
  const { dir } = await createTempd(null, "importComponent");
  const tempDir = await fs.mkdtemp(`${dir}/`);
  await tar.x({ file: archiveFile, cwd: tempDir, preserveOwner: false, unlink: true });

  //Get the extracted directory name
  const contents = await fs.readdir(tempDir);
  if (contents.length !== 1) {
    throw new Error("Archive must contain exactly one component directory");
  }

  const componentBasename = contents[0];
  const componentDir = path.join(tempDir, componentBasename);

  return { componentDir, componentBasename, tempDir };
}

/**
 * determine target directory name with suffix if name conflicts
 * @param {string} targetParentDir - parent directory path
 * @param {string} componentBasename - original component name
 * @returns {Promise<string>} - target directory path
 */
async function determineComponentTargetDir(targetParentDir, componentBasename) {
  let targetDir = path.join(targetParentDir, componentBasename);
  let suffix = 0;

  while (await fs.pathExists(targetDir)) {
    suffix++;
    targetDir = path.join(targetParentDir, `${componentBasename}_${suffix}`);
  }

  return targetDir;
}

/**
 * regenerate all component IDs recursively in a directory
 * @param {string} projectRootDir - project's root path
 * @param {string} componentDir - component directory path
 * @param {string} parentID - parent component ID
 * @returns {Promise<object>} - ID mapping (oldID -> newID)
 */
async function regenerateComponentIDsRecursively(projectRootDir, componentDir, parentID) {
  const idMap = new Map();

  //Read component JSON
  const componentJsonFile = path.join(componentDir, componentJsonFilename);
  const component = await fs.readJson(componentJsonFile);

  //Generate new ID
  const oldID = component.ID;
  const newID = uuidv4();
  idMap.set(oldID, newID);

  //Update component with new ID and parent
  component.ID = newID;
  component.parent = parentID;

  //Clear links (they're already cleared in export, but just to be safe)
  component.previous = [];
  component.next = [];
  if (component.else) {
    component.else = [];
  }

  //Write updated component JSON
  await fs.writeJson(componentJsonFile, component, { spaces: 4 });

  //Update componentPath - pass absolute path
  await updateComponentPath(projectRootDir, newID, componentDir);

  //Recursively process child components
  const childDirs = await fs.readdir(componentDir);
  for (const childDir of childDirs) {
    const childPath = path.join(componentDir, childDir);
    const childComponentJson = path.join(childPath, componentJsonFilename);

    if (await fs.pathExists(childComponentJson)) {
      const childIdMap = await regenerateComponentIDsRecursively(projectRootDir, childPath, newID);
      //Merge child ID mappings
      for (const [k, v] of childIdMap.entries()) {
        idMap.set(k, v);
      }
    }
  }

  return idMap;
}

/**
 * import component from archive file into a project
 * @param {string} projectRootDir - project's root path
 * @param {string} archiveFile - path to uploaded archive file
 * @param {string} targetParentID - parent component ID where to import
 * @returns {Promise<string>} - new component ID
 */
async function importComponent(projectRootDir, archiveFile, targetParentID) {
  let extractedTempDir = null;

  try {
    //Extract archive
    const { componentDir, componentBasename, tempDir } = await extractComponentArchive(archiveFile);
    extractedTempDir = tempDir;

    //Get target parent directory
    const targetParentDir = await getComponentDir(projectRootDir, targetParentID, true);

    //Determine target directory name (handle name conflicts)
    const targetDir = await determineComponentTargetDir(targetParentDir, componentBasename);

    //Copy component to target location
    await fs.copy(componentDir, targetDir);

    //Read the imported component to get its ID before regeneration
    const componentJson = await readComponentJson(targetDir);
    const oldRootID = componentJson.ID;

    //Regenerate all component IDs
    const idMap = await regenerateComponentIDsRecursively(projectRootDir, targetDir, targetParentID);

    //Get the new root component ID
    const newRootID = idMap.get(oldRootID);

    //Git add and commit
    await gitAdd(projectRootDir, targetDir);
    await gitCommit(projectRootDir, "import component");

    return newRootID;
  } finally {
    //Clean up temporary files and archive
    if (extractedTempDir) {
      await fs.remove(extractedTempDir);
    }
    if (await fs.pathExists(archiveFile)) {
      await fs.remove(archiveFile);
    }
  }
}

export { importComponent };
