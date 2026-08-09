/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import fs from "fs-extra";
import path from "path";
import { getLogger } from "../logSettings.js";
import { projectList, defaultCleanupRemoteRoot, projectJsonFilename, componentJsonFilename, suffix } from "../db/db.js";
import { getDateString, writeJsonWrapper, isValidName, removeTrailingPathSep } from "../lib/utility.js";
import { convertPathSep } from "./pathUtils.js";
import { gitInit, gitAdd, gitCommit } from "./gitOperator2.js";
import { componentFactory } from "./workflowComponent.js";
import { writeComponentJson } from "./componentJsonIO.js";
import { getProjectJson, writeProjectJson, setProjectState } from "./projectJsonFileOperator.js";
import { rewriteAllIncludeExcludeProperty } from "./componentOperations.js";
import { readJsonGreedy } from "./fileUtils.js";
import { setComponentStateR } from "./componentState.js";

const _internal = {
  fs,
  path,
  getLogger,
  getDateString,
  convertPathSep,
  removeTrailingPathSep,
  gitInit,
  componentFactory,
  writeComponentJson,
  writeJsonWrapper,
  gitAdd,
  gitCommit,
  getProjectJson,
  rewriteAllIncludeExcludeProperty,
  isValidName,
  readJsonGreedy,
  writeProjectJson,
  setProjectState,
  setComponentStateR,
  projectList
};

/**
 * create new project dir, initial files and new git repository
 * @param {string} argProjectRootDir - project projectRootDir's absolute path
 * @param {string} name - project name without suffix
 * @param {string} argDescription - project description text
 * @param {string} user - username of project owner
 * @param {string} mail - mail address of project owner
 * @returns {*} -
 */
export async function createNewProject(argProjectRootDir, name, argDescription, user, mail) {
  const description = argDescription != null ? argDescription : "This is new project.";
  const projectRootDir = await _internal.getUnusedProjectDir(argProjectRootDir, name);
  await _internal.fs.ensureDir(projectRootDir);
  await _internal.gitInit(projectRootDir, user, mail);

  //write root workflow
  const rootWorkflow = _internal.componentFactory("workflow");
  rootWorkflow.name = path.basename(projectRootDir.slice(0, -suffix.length));
  rootWorkflow.cleanupFlag = defaultCleanupRemoteRoot ? 0 : 1;

  _internal.getLogger().debug(rootWorkflow);
  await _internal.writeComponentJson(projectRootDir, projectRootDir, rootWorkflow);

  //write project JSON
  const timestamp = _internal.getDateString(true);
  const projectJson = {
    version: 2,
    name: rootWorkflow.name,
    description,
    state: "not-started",
    root: projectRootDir,
    ctime: timestamp,
    mtime: timestamp,
    componentPath: {}
  };
  projectJson.componentPath[rootWorkflow.ID] = "./";
  const projectJsonFileFullpath = path.resolve(projectRootDir, projectJsonFilename);
  _internal.getLogger().debug(projectJson);
  await _internal.writeJsonWrapper(projectJsonFileFullpath, projectJson);
  await _internal.gitAdd(projectRootDir, "./");
  await _internal.gitCommit(projectRootDir, "create new project");
  return projectRootDir;
};

/**
 * add existing project to projectlist or create new project
 * @param {string} projectDir - git repo's root directory
 * @param {string} description - project description
 */
export async function addProject(projectDir, description) {
  let projectRootDir = path.resolve(_internal.removeTrailingPathSep(convertPathSep(projectDir)));
  if (!projectRootDir.endsWith(suffix)) {
    projectRootDir += suffix;
  }
  projectRootDir = path.resolve(projectRootDir);

  if (await _internal.fs.pathExists(projectRootDir)) {
    const err = new Error("specified project dir is already exists");
    err.projectRootDir = projectRootDir;
    throw err;
  }

  if (await _internal.fs.pathExists(projectRootDir)) {
    const err = new Error("specified project dir is already used");
    err.projectRootDir = projectRootDir;
    throw err;
  }

  const projectName = path.basename(projectRootDir.slice(0, -suffix.length));
  if (!_internal.isValidName(projectName)) {
    _internal.getLogger().error(projectName, "is not allowed for project name");
    throw (new Error("illegal project name"));
  }
  projectRootDir = await _internal.createNewProject(projectRootDir, projectName, description, "wheel", "wheel@example.com");
  _internal.projectList.unshift({ path: projectRootDir });
};

/**
 * rename project
 * @param {string} id - project ID
 * @param {string} argNewName - new project name
 * @param {string} oldDir - old projectRootDir
 */
export async function renameProject(id, argNewName, oldDir) {
  const newName = argNewName.endsWith(suffix) ? argNewName.slice(0, -suffix.length) : argNewName;
  if (!_internal.isValidName(newName)) {
    _internal.getLogger().error(newName, "is not allowed for project name");
    throw (new Error("illegal project name"));
  }
  const newDir = path.resolve(path.dirname(oldDir), `${newName}${suffix}`);
  if (await _internal.fs.pathExists(newDir)) {
    _internal.getLogger().error(newName, "directory is already exists");
    throw (new Error("already exists"));
  }

  await _internal.fs.move(oldDir, newDir);
  const projectJson = await _internal.readJsonGreedy(path.resolve(newDir, projectJsonFilename));
  projectJson.name = newName;
  projectJson.root = newDir;
  projectJson.mtime = _internal.getDateString(true);
  await _internal.writeProjectJson(newDir, projectJson);

  const rootWorkflow = await _internal.readJsonGreedy(path.resolve(newDir, componentJsonFilename));
  rootWorkflow.name = newName;
  await _internal.writeComponentJson(newDir, newDir, rootWorkflow);
  await _internal.gitCommit(newDir);

  //rewrite path in project List entry
  const target = _internal.projectList.get(id);
  target.path = newDir;
  await _internal.projectList.update(target);
};

/**
 * read existing project directory and fix if it has some problem
 * @param {string} projectRootDir - project's root path
 * @returns {string|null} - prorjectRootDir if successfully read, null if error occurred
 */
export async function readProject(projectRootDir) {
  const toBeCommited = [];

  //convert include/exclude prop
  const projectJson = await _internal.getProjectJson(projectRootDir);
  if (projectJson.version <= 2) {
    await _internal.rewriteAllIncludeExcludeProperty(projectRootDir, toBeCommited);
    projectJson.version = 2.1;
  }
  //skip following import process if project is already on projectList
  if (_internal.projectList.query("path", projectRootDir)) {
    return projectRootDir;
  }

  const projectBasename = path.basename(projectRootDir);

  if (projectBasename !== projectJson.name + suffix) {
    projectJson.name = projectBasename.replace(suffix, "");
    await _internal.writeProjectJson(projectRootDir, projectJson);
    toBeCommited.push(projectJsonFilename);
  }

  //set up project directory as git repo
  if (!await _internal.fs.pathExists(path.resolve(projectRootDir, ".git"))) {
    try {
      //this directory does not have ".git" that means its first time opening from WHEEL
      await _internal.gitInit(projectRootDir, "wheel", "wheel@example.com");
      await _internal.setProjectState(projectRootDir, "not-started");
      await _internal.setComponentStateR(projectRootDir, projectRootDir, "not-started");
      await _internal.gitAdd(projectRootDir, "./");
      await _internal.gitCommit(projectRootDir, "import project");
    } catch (e) {
      _internal.getLogger().error("can not access to git repository", e);
      return null;
    }
  } else {
    const ignoreFile = path.join(projectRootDir, ".gitignore");
    if (!await _internal.fs.pathExists(ignoreFile)) {
      await _internal.fs.outputFile(ignoreFile, "wheel.log");
      await _internal.gitAdd(projectRootDir, ".gitignore");
    }
    await Promise.all(toBeCommited.map((name)=>{
      return _internal.gitAdd(projectRootDir, name);
    }));
    await _internal.gitCommit(projectRootDir, "import project", ["--", ".gitignore", ...toBeCommited]);
  }
  _internal.projectList.unshift({ path: projectRootDir });
  return projectRootDir;
};

/**
 * get suffix number part of project name
 * @param {string} projectName -
 * @returns {string} -
 */
export function getSuffixNumberFromProjectName(projectName) {
  const reResult = /.*(\d+)$/.exec(projectName);
  return reResult === null ? 0 : reResult[1];
};

/**
 * return unused projectRootDir
 * @param {string} projectRootDir - project's root path
 * @param {string} projectName - project name without suffix
 * @returns {string} - absolute path of project root directory
 */
export async function getUnusedProjectDir(projectRootDir, projectName) {
  if (!await _internal.fs.pathExists(projectRootDir)) {
    return projectRootDir;
  }

  const dirname = path.dirname(projectRootDir);
  let projectRootDirCandidate = path.resolve(dirname, `${projectName}${suffix}`);
  if (!await _internal.fs.pathExists(projectRootDirCandidate)) {
    return projectRootDirCandidate;
  }

  let suffixNumber = getSuffixNumberFromProjectName(projectName);
  projectRootDirCandidate = path.resolve(dirname, `${projectName}${suffixNumber}${suffix}`);

  while (await _internal.fs.pathExists(projectRootDirCandidate)) {
    ++suffixNumber;
    projectRootDirCandidate = path.resolve(dirname, `${projectName}${suffixNumber}${suffix}`);
  }
  return projectRootDirCandidate;
};

//Add exported functions to _internal for testing purposes
_internal.getUnusedProjectDir = getUnusedProjectDir;
_internal.createNewProject = createNewProject;

export { _internal };
