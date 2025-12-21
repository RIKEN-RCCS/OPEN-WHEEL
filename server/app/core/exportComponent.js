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
import { setComponentStateR } from "./componentState.js";
import { removeAllLinkFromComponent } from "./componentLinks.js";
import { componentJsonFilename } from "../db/db.js";

const { create } = tar;

/**
 * get all component IDs under specified directory
 * @param {string} dir - directory path to search
 * @returns {Promise<string[]>} - array of component IDs
 */
async function getAllComponentIDsInDir(dir) {
  const componentJsonFiles = await glob(path.join(dir, "**", componentJsonFilename));
  const IDs = await Promise.all(componentJsonFiles.map(async (file)=>{
    const componentJson = await fs.readJson(file);
    return componentJson.ID;
  }));
  return IDs;
}

/**
 * export component and its descendants as archive file
 * @param {string} projectRootDir - project's root path
 * @param {string} componentID - component ID to export
 * @returns {Promise<string>} - download URL
 */
async function exportComponent(projectRootDir, componentID) {
  const { dir } = await createTempd(projectRootDir, "exportComponent");
  const workDir = await fs.mkdtemp(`${dir}/`);

  //Get component directory and name
  const componentDir = await getComponentDir(projectRootDir, componentID);
  const componentBasename = path.basename(componentDir);

  //Clone component directory to exclude uncommitted files
  const tmpComponentDir = path.join(workDir, componentBasename);
  await fs.ensureDir(tmpComponentDir);
  await gitClone(tmpComponentDir, 1, componentDir);

  //Remove .git directory to exclude git metadata
  await fs.remove(path.join(tmpComponentDir, ".git"));

  //Get all component IDs in the cloned directory
  const componentIDs = await getAllComponentIDsInDir(tmpComponentDir);

  //Remove all links from components
  for (const ID of componentIDs) {
    await removeAllLinkFromComponent(projectRootDir, ID);
  }

  //Reset all component states to "not-started"
  await setComponentStateR(projectRootDir, tmpComponentDir, "not-started");

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
  const url = `${baseURL}/${path.join(path.relative(path.dirname(dir), archiveFilename))}`;
  return url;
}

export { exportComponent };
