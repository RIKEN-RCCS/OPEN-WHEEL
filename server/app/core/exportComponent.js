/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import path from "path";
import fs from "fs-extra";
import * as tar from "tar";
import { glob } from "glob";
import { createTempd } from "./tempd.js";
import { getComponentDir } from "./componentJsonIO.js";
import { gitClone } from "./gitOperator2.js";
import { componentJsonFilename } from "../db/db.js";

const { create } = tar;

/**
 * reset all component states to "not-started" in a directory (without git operations)
 * @param {string} dir - directory path
 * @returns {Promise} - resolved when all states are updated
 */
async function resetComponentStates(dir) {
  const componentJsonFiles = await glob(path.join(dir, "**", componentJsonFilename));
  //Include root component JSON if it exists
  const rootComponentJson = path.join(dir, componentJsonFilename);
  if (await fs.pathExists(rootComponentJson)) {
    componentJsonFiles.push(rootComponentJson);
  }

  const results = await Promise.allSettled(componentJsonFiles.map(async (file)=>{
    const stat = await fs.stat(file);
    if (stat.isFile()) {
      try {
        const component = await fs.readJson(file);
        component.state = "not-started";
        await fs.writeJson(file, component, { spaces: 4 });
      } catch (err) {
        //Ignore files that can't be read
        console.warn(`Warning: Could not reset state for ${file}:`, err.message);
      }
    }
  }));

  const failures = results.filter((r)=>{
    return r.status === "rejected";
  });
  if (failures.length > 0) {
    throw new Error(`Failed to reset states for ${failures.length} files`);
  }
}

/**
 * remove all links from components in a directory (without git operations)
 * @param {string} dir - directory path
 * @returns {Promise} - resolved when all links are removed
 */
async function removeAllLinks(dir) {
  const componentJsonFiles = await glob(path.join(dir, "**", componentJsonFilename));
  //Include root component JSON if it exists
  const rootComponentJson = path.join(dir, componentJsonFilename);
  if (await fs.pathExists(rootComponentJson)) {
    componentJsonFiles.push(rootComponentJson);
  }

  const results = await Promise.allSettled(componentJsonFiles.map(async (file)=>{
    const stat = await fs.stat(file);
    if (stat.isFile()) {
      try {
        const component = await fs.readJson(file);
        if (component.previous) {
          component.previous = [];
        }
        if (component.next) {
          component.next = [];
        }
        if (component.else) {
          component.else = [];
        }
        await fs.writeJson(file, component, { spaces: 4 });
      } catch (err) {
        //Ignore files that can't be read
        console.warn(`Warning: Could not remove links for ${file}:`, err.message);
      }
    }
  }));

  const failures = results.filter((r)=>{
    return r.status === "rejected";
  });
  if (failures.length > 0) {
    throw new Error(`Failed to remove links for ${failures.length} files`);
  }
}

/**
 * export component and its descendants as archive file
 * @param {string} projectRootDir - project's root path
 * @param {string} componentID - component ID to export
 * @returns {Promise<string>} - download URL
 */
async function exportComponent(projectRootDir, componentID) {
  const { dir, root } = await createTempd(projectRootDir, "exportComponent");
  const workDir = await fs.mkdtemp(`${dir}/`);

  //Get component directory (relative to project root)
  const componentDir = await getComponentDir(projectRootDir, componentID, true);
  const componentBasename = path.basename(componentDir);
  const relativeComponentPath = path.relative(projectRootDir, componentDir);

  //Clone entire project to temp to get only committed files
  const tmpProjectRootDir = path.join(workDir, "project_tmp");
  await fs.mkdir(tmpProjectRootDir);
  await gitClone(tmpProjectRootDir, 1, projectRootDir);

  //Get the component directory in the cloned project
  const tmpComponentDir = path.join(tmpProjectRootDir, relativeComponentPath);

  //Copy component to final location
  const finalComponentDir = path.join(workDir, componentBasename);
  await fs.copy(tmpComponentDir, finalComponentDir);

  //Remove .git directory to exclude git metadata
  const gitDir = path.join(finalComponentDir, ".git");
  if (await fs.pathExists(gitDir)) {
    await fs.remove(gitDir);
  }

  //Remove all links from components
  await removeAllLinks(finalComponentDir);

  //Reset all component states to "not-started"
  await resetComponentStates(finalComponentDir);

  //Create tar.gz archive with component ID as filename
  const archiveFilename = path.join(dir, `WHEEL_component_${componentID}.tgz`);
  await create({
    z: true,
    f: archiveFilename,
    C: workDir
  },
  [componentBasename]
  );

  const baseURL = process.env.WHEEL_BASE_URL || "";
  //Get path relative to tempdRoot, then prepend /exportComponent/
  const relativePath = path.relative(root, archiveFilename);
  const url = `${baseURL}/exportComponent/${relativePath}`;
  return url;
}

export { exportComponent };
