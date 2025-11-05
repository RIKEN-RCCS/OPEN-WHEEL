/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import path from "path";
import fs from "fs-extra";
import { glob } from "glob";
import * as tar from "tar";
import { createTempd } from "./tempd.js";
import { readJsonGreedy } from "./fileUtils.js";
import { projectList, projectJsonFilename, componentJsonFilename, suffix } from "../db/db.js";
import { gitSetup, gitClone, gitCommit, gitConfig, gitRemoveOrigin } from "./gitOperator2.js";
import { setComponentStateR } from "./componentState.js";
import { getHosts } from "./componentHostOperations.js";
import { updateProjectROStatus } from "./projectJsonFileOperator.js";
import { askHostMap } from "./askHostMap.js";
import { askRewindState } from "./askRewindState.js";
import { rewriteHosts } from "./rewriteHosts.js";

export const _internal = {
  askHostMap,
  getHosts,
  projectList,
  rewriteHosts
};

/**
 * determine specified directory is empty
 * @param {string} dir - dir path to be checked
 * @returns {Promise} - resolved true if direcrory is empty, false if one or more containts exist
 */
export async function isEmptyDir(dir) {
  const containts = await fs.readdir(dir);
  return containts.length === 0;
}

/**
 * read archive meta data
 * @param {string} archiveFile - path to archive file
 * @returns {object} - project name, export date, exporter
 */
export async function extractAndReadArchiveMetadata(archiveFile) {
  const { dir } = await createTempd(null, "importProject");
  const workDir = await fs.mkdtemp(`${dir}/`);
  await tar.x({ file: archiveFile, cwd: workDir, strip: 1, preserveOwner: false, unlink: true });
  const projectJson = await readJsonGreedy(path.join(workDir, projectJsonFilename));
  return { name: projectJson.name, dir: workDir };
}

/**
 * copy project file from git repo and read meta data
 * @param {string} URL - git repo url which has WHEEL project
 * @returns {object} - project name, export date, exporter
 */
async function gitCloneAndReadArchiveMetadata(URL) {
  const { dir } = await createTempd(null, "importProject");
  const workDir = await fs.mkdtemp(`${dir}/`);
  await gitClone(workDir, 1, URL);
  const projectJson = await readJsonGreedy(path.join(workDir, projectJsonFilename));
  return { name: projectJson.name, dir: workDir };
}

/**
 * read project and component metadata under dir and report readonly or status is not "not-started"
 * @param {string} dir - search root path
 * @returns {object[]} - array of metadata paths and reasons
 */
async function checkProjectAndComponentStatus(dir) {
  const result = [];
  const { readOnly, state } = await readJsonGreedy(path.resolve(dir, projectJsonFilename));
  if (readOnly) {
    result.push({ path: "project", state: "read only", ID: "projectRO" });
  }
  if (state !== "not-started") {
    result.push({ path: "project", state, ID: "projectState" });
  }
  const componentJsonFiles = await glob(path.join(dir, "**", componentJsonFilename));
  const componentsToBeFixed = await Promise.all(componentJsonFiles
    .map(async (componentJsonFile)=>{
      const { state, ID } = await readJsonGreedy(componentJsonFile);
      if (state !== "not-started") {
        return { path: path.relative(dir, path.dirname(componentJsonFile)), state, ID };
      }
      return null;
    }));
  result.push(
    ...componentsToBeFixed.filter((e)=>{
      return e !== null;
    })
  );
  return result;
}

async function ensureProjectRootDir(projectRootDir) {
  if (await fs.pathExists(projectRootDir)) {
    const stats = await fs.stat(projectRootDir);
    if (!stats.isDirectory() || !await isEmptyDir(projectRootDir)) {
      const err = new Error(`specified path is in use: ${projectRootDir}`);
      err.projectRootDir = projectRootDir;
      err.reason = "PathExists";
      throw err;
    }
  } else {
    await fs.ensureDir(projectRootDir);
  }
}

async function checkAndFixProject(src, clientID) {
  //throw execption if user cancel importiong
  const toBeFixed = await checkProjectAndComponentStatus(src);

  if (toBeFixed.length > 0) {
    await askRewindState(clientID, toBeFixed);
    await setComponentStateR(src, src, "not-started");
    await updateProjectROStatus(src, false);
  }

  const hosts = await _internal.getHosts(src, null);
  if (hosts.length > 0) {
    //throw exception if user cancel or input invalid host map
    const hostMap = await _internal.askHostMap(clientID, hosts);
    await _internal.rewriteHosts(src, hostMap);
  }
  await gitConfig(src, "user.name", "wheel");
  await gitConfig(src, "user.email", "wheel@example.com");
  await gitCommit(src, "import project");
}

/**
 * import project archive file
 * @param {string} clientID - socket's ID
 * @param {string} archiveFile - path to archive file
 * @param {string} parentDir - path to be extracted archive file
 * @returns {Promise} - resolved when project archive is imported
 */
export async function importProject(clientID, archiveFile, parentDir) {
  const { name: projectName, dir: src } = await extractAndReadArchiveMetadata(archiveFile);
  const projectRootDir = path.resolve(parentDir, projectName + suffix);
  try {
    await ensureProjectRootDir(projectRootDir);
    await checkAndFixProject(src, clientID);
    await gitClone(projectRootDir, 1, src);
    await gitRemoveOrigin(projectRootDir);
    await gitSetup(projectRootDir, "wheel", "wheel@example.com");
    _internal.projectList.unshift({ path: projectRootDir });
  } finally {
    await fs.remove(archiveFile);
    await fs.remove(src);
  }

  return projectRootDir;
}

/**
 * import project from git repository
 * @param {string} clientID - socket's ID
 * @param {string} URL - repository's URL
 * @param {string} parentDir - path to be extracted archive file
 * @returns {Promise} - resolved when project archive is imported
 */
export async function importProjectFromGitRepository(clientID, URL, parentDir) {
  const { name: projectName, dir: src } = await gitCloneAndReadArchiveMetadata(URL);
  const projectRootDir = path.resolve(parentDir, projectName + suffix);
  try {
    await ensureProjectRootDir(projectRootDir);
    await checkAndFixProject(src, clientID);
    await gitClone(projectRootDir, 1, src);
    _internal.projectList.unshift({ path: projectRootDir });
  } finally {
    await fs.remove(src);
  }
  return projectRootDir;
}
