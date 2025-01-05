/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const { promisify } = require("util");
const path = require("path");
const fs = require("fs-extra");
const glob = require("glob");
const { extract } = require("tar");
const { createTempd } = require("./tempd.js");
const { readJsonGreedy } = require("./fileUtils.js");
const { projectList, projectJsonFilename, componentJsonFilename, suffix } = require("../db/db.js");
const { gitCommit, gitConfig } = require("./gitOperator2.js");
const { setComponentStateR, updateProjectROStatus, getHosts } = require("./projectFilesOperator.js");
const { askHostMap } = require("./askHostMap.js");
const { askRewindState } = require("./askRewindState.js");
const { rewriteHosts } = require("./rewriteHosts.js");

/**
 * determine specified directory is empty
 * @param {string} dir - dir path to be checked
 * @returns {Promise} - resolved true if direcrory is empty, false if one or more containts exist
 */
async function isEmptyDir(dir) {
  const containts = await fs.readdir(dir);
  return containts.length === 0;
}

/**
 * move project directory and register it to projectList.json
 * @param {string} src - projectRootDir which will be copied
 * @param {string} dst - new projectRootDir
 */
async function moveAndRegisterProject(src, dst) {
  await fs.move(src, dst);
  projectList.unshift({ path: dst });
}

/**
 * read archive meta data
 * @param {string} archiveFile - path to archive file
 * @param {boolean} keep - keep extracted files
 * @returns {object} - project name, export date, exporter
 */
async function extractAndReadArchiveMetadata(archiveFile, keep) {
  const { dir } = await createTempd(null, "importProject");
  await extract({ strict: true, file: archiveFile, cwd: dir, strip: 1, preserveOwner: false });
  const projectJson = await readJsonGreedy(path.join(dir, projectJsonFilename));
  if (!keep) {
    await fs.remove(dir);
  }
  return { name: projectJson.name, dir };
}

/**
 * read project and component metadata under dir and report readonly or status is not "not-started"
 * @param {string} dir - search root path
 * @returns {object[]} - array of metadata paths and reasons
 */
async function checkProjectAndComponentStatus(dir) {
  const result = [];
  const { readOnly } = await readJsonGreedy(path.resolve(dir, projectJsonFilename));
  if (readOnly) {
    result.push({ path: "project", reason: "read only" });
  }
  const componentJsonFiles = await promisify(glob)(path.join(dir, "**", componentJsonFilename));
  const components = await Promise.all(componentJsonFiles
    .map(async (componentJsonFile)=>{
      const componentJson = await readJsonGreedy(componentJsonFile);
      if (componentJson.state !== "not-started") {
        return { path: path.dirname(componentJsonFile), reason: "illegal state", state: componentJson.state };
      }
      return null;
    }));
  result.push(
    ...components.filter((e)=>{
      return e !== null;
    })
  );
  return result;
}

/**
 * import project archive file
 * @param {string} clientID - socket's ID
 * @param {string} archiveFile - path to archive file
 * @param {string} parentDir - path to be extracted archive file
 * @returns {Promise} - resolved when project archive is imported
 */
async function importProject(clientID, archiveFile, parentDir) {
  const { name: projectName, dir: src } = await extractAndReadArchiveMetadata(archiveFile, true);
  const projectRootDir = path.resolve(parentDir, projectName + suffix);
  if (await fs.pathExists(projectRootDir)) {
    const stats = await fs.stat(projectRootDir);
    if (!stats.isDirectory() || !await isEmptyDir(projectRootDir)) {
      const err = new Error("specified path is in use");
      err.parentDir = parentDir;
      err.archiveFile = archiveFile;
      err.projectName = projectName;
      err.projectRootDir = projectRootDir;
      throw err;
    }
  }

  try {
    //throw execption if user cancel importiong
    const toBeFixed = await checkProjectAndComponentStatus(src);

    if (toBeFixed.length > 0) {
      await askRewindState(clientID, toBeFixed);
      await setComponentStateR(src);
      await updateProjectROStatus(src, false);
    }

    const hosts = await getHosts(src);
    if (hosts.length > 0) {
      //throw exception if user cancel or input invalid host map
      const hostMap = await askHostMap(clientID, hosts);
      await rewriteHosts(src, hostMap);
    }
    await gitConfig(src, "user.name", "wheel");
    await gitConfig(src, "user.email", "wheel@example.com");
    await gitCommit(src, "import project");
  } catch (e) {
    await fs.remove(src);
    throw (e);
  }

  await moveAndRegisterProject(src, projectRootDir);
  return projectRootDir;
}

module.exports = {
  importProject
};
