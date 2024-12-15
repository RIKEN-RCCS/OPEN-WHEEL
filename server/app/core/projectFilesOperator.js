/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const { promisify } = require("util");
const fs = require("fs-extra");
const path = require("path");
const isPathInside = require("is-path-inside");
const glob = require("glob");
const { diff } = require("just-diff");
const { diffApply } = require("just-diff-apply");
const { getComponentDir, writeComponentJson, writeComponentJsonByID, readComponentJson, readComponentJsonByID } = require("./componentJsonIO.js");
const { componentFactory, getComponentDefaultName } = require("./workflowComponent");
const { projectList, defaultCleanupRemoteRoot, projectJsonFilename, componentJsonFilename, jobManagerJsonFilename, suffix, remoteHost, defaultPSconfigFilename } = require("../db/db");
const { getDateString, writeJsonWrapper, isValidName, isValidInputFilename, isValidOutputFilename } = require("../lib/utility");
const { replacePathsep, convertPathSep } = require("./pathUtils");
const { readJsonGreedy } = require("./fileUtils");
const { gitInit, gitAdd, gitCommit, gitRm } = require("./gitOperator2");
const { hasChild, isLocalComponent } = require("./workflowComponent");
const { getLogger } = require("../logSettings");
const { getSsh } = require("./sshManager.js");

/**
 * check feather given token is surrounded by { and }
 * @param {string} token - string to be checked
 * @returns {boolean} - true if token is surrounded by {}
 */
function isSurrounded(token) {
  return token.startsWith("{") && token.endsWith("}");
}

/**
 * remove heading '{' and trailing '}'
 * @param {string} token - string to be checked
 * @returns {string} - trimed token
 */
function trimSurrounded(token) {
  if (!isSurrounded(token)) {
    return token;
  }
  const rt = /{+(.*)}+/.exec(token);
  return (Array.isArray(rt) && typeof rt[1] === "string") ? rt[1] : token;
}

/**
 * transform grob string to array
 * @param {string} token - grob pattern
 * @returns {string[]} -
 */
function glob2Array(token) {
  return trimSurrounded(token).split(",");
}

/**
 * remove trailing path sep from string
 * @param {string} filename - string possibly with trailing path sep
 * @returns {string} - string without trailing path sep
 */
function removeTrailingPathSep(filename) {
  if (filename.endsWith(path.sep)) {
    return removeTrailingPathSep(filename.slice(0, -1));
  }
  return filename;
}

/**
 * get project JSON
 * @param {string} projectRootDir - project's root path
 * @returns {object} - project JSON data
 */
async function getProjectJson(projectRootDir) {
  return readJsonGreedy(path.resolve(projectRootDir, projectJsonFilename));
}

/**
 * write project Json
 * @param {string} projectRootDir - project's root path
 * @param {object} projectJson - project JSON data
 * @returns {Promise} - resolved when write JSON file and git add performed
 */
async function writeProjectJson(projectRootDir, projectJson) {
  const filename = path.resolve(projectRootDir, projectJsonFilename);
  await writeJsonWrapper(filename, projectJson);
  return gitAdd(projectRootDir, filename);
}

/**
 * read component JSON file and return children's ID
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - ID string of search root component
 * @returns {string[]} - array of id string
 */
async function getDescendantsIDs(projectRootDir, ID) {
  const filename = path.resolve(projectRootDir, projectJsonFilename);
  const projectJson = await readJsonGreedy(filename);
  const poi = await getComponentDir(projectRootDir, ID, true);
  const rt = [ID];
  for (const [id, componentPath] of Object.entries(projectJson.componentPath)) {
    if (isPathInside(path.resolve(projectRootDir, componentPath), poi)) {
      rt.push(id);
    }
  }
  return rt;
}

/**
 * read project JSON file and return all component ID in project
 * @param {string} projectRootDir - project's root path
 * @returns {string[]} - array of id string
 */
async function getAllComponentIDs(projectRootDir) {
  const filename = path.resolve(projectRootDir, projectJsonFilename);
  const projectJson = await readJsonGreedy(filename);
  return Object.keys(projectJson.componentPath);
}

/**
 * get suffix number part of project name
 * @param {string} projectName -
 * @returns {string} -
 */
function getSuffixNumberFromProjectName(projectName) {
  const reResult = /.*(\d+)$/.exec(projectName);
  return reResult === null ? 0 : reResult[1];
}

/**
 * return unused projectRootDir
 * @param {string} projectRootDir - project's root path
 * @param {string} projectName - project name without suffix
 * @returns {string} - absolute path of project root directory
 */
async function getUnusedProjectDir(projectRootDir, projectName) {
  if (!await fs.pathExists(projectRootDir)) {
    return projectRootDir;
  }

  const dirname = path.dirname(projectRootDir);
  let projectRootDirCandidate = path.resolve(dirname, `${projectName}${suffix}`);
  if (!await fs.pathExists(projectRootDirCandidate)) {
    return projectRootDirCandidate;
  }

  let suffixNumber = getSuffixNumberFromProjectName(projectName);
  projectRootDirCandidate = path.resolve(dirname, `${projectName}${suffixNumber}${suffix}`);

  while (await fs.pathExists(projectRootDirCandidate)) {
    ++suffixNumber;
    projectRootDirCandidate = path.resolve(dirname, `${projectName}${suffixNumber}${suffix}`);
  }
  return projectRootDirCandidate;
}

/**
 * create new project dir, initial files and new git repository
 * @param {string} argProjectRootDir - project projectRootDir's absolute path
 * @param {string} name - project name without suffix
 * @param {string} argDescription - project description text
 * @param {string} user - username of project owner
 * @param {string} mail - mail address of project owner
 * @returns {*} -
 */
async function createNewProject(argProjectRootDir, name, argDescription, user, mail) {
  const description = argDescription != null ? argDescription : "This is new project.";
  const projectRootDir = await getUnusedProjectDir(argProjectRootDir, name);
  await fs.ensureDir(projectRootDir);
  await gitInit(projectRootDir, user, mail);

  //write root workflow
  const rootWorkflow = componentFactory("workflow");
  rootWorkflow.name = path.basename(projectRootDir.slice(0, -suffix.length));
  rootWorkflow.cleanupFlag = defaultCleanupRemoteRoot ? 0 : 1;

  getLogger().debug(rootWorkflow);
  await writeComponentJson(projectRootDir, projectRootDir, rootWorkflow);

  //write project JSON
  const timestamp = getDateString(true);
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
  getLogger().debug(projectJson);
  await writeJsonWrapper(projectJsonFileFullpath, projectJson);
  await gitAdd(projectRootDir, "./");
  await gitCommit(projectRootDir, "create new project");
  return projectRootDir;
}

/**
 * remove one or more component ID from componentPath map in porjectJson
 * @param {string} projectRootDir - project's root path
 * @param {string[]} IDs - component IDs to be removed
 * @param {boolean} force - remove path if component directory exists
 * @returns {Promise} - resolved when project Json file is added to git repo
 */
async function removeComponentPath(projectRootDir, IDs, force = false) {
  const filename = path.resolve(projectRootDir, projectJsonFilename);
  const projectJson = await readJsonGreedy(filename);
  for (const [id, componentPath] of Object.entries(projectJson.componentPath)) {
    if (IDs.includes(id)) {
      if (force || !await fs.pathExists(path.join(projectRootDir, componentPath))) {
        delete projectJson.componentPath[id];
      }
    }
  }

  //write project Json file
  await writeJsonWrapper(filename, projectJson);
  return gitAdd(projectRootDir, filename);
}

/**
 * update component path-id map
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - component ID
 * @param {string} absPath - component's absolute path
 * @returns {object} - component path map
 */
async function updateComponentPath(projectRootDir, ID, absPath) {
  const filename = path.resolve(projectRootDir, projectJsonFilename);
  const projectJson = await readJsonGreedy(filename);

  //normalize path
  let newRelativePath = replacePathsep(path.relative(projectRootDir, absPath));
  if (!newRelativePath.startsWith(".")) {
    newRelativePath = `./${newRelativePath}`;
  }

  //if ID is already in componentPath, rewrite all desecndants' path
  const oldRelativePath = projectJson.componentPath[ID];
  if (typeof oldRelativePath !== "undefined") {
    for (const [k, v] of Object.entries(projectJson.componentPath)) {
      if (isPathInside(convertPathSep(v), convertPathSep(oldRelativePath)) || v === oldRelativePath) {
        projectJson.componentPath[k] = v.replace(oldRelativePath, newRelativePath);
      }
    }
  }

  //update componentPath
  projectJson.componentPath[ID] = newRelativePath;

  //write project Json file
  await writeJsonWrapper(filename, projectJson);
  await gitAdd(projectRootDir, filename);
  return projectJson.componentPath;
}

/**
 * set project status and write project metat data file
 * @param {string} projectRootDir - project's root path
 * @param {string} state - state to be set
 * @param {boolean} force - force update if already set given state
 * @returns {object|false} - new Project JSON meta data. false means meta data does not updated
 */
async function setProjectState(projectRootDir, state, force) {
  const filename = path.resolve(projectRootDir, projectJsonFilename);
  const projectJson = await readJsonGreedy(filename);
  if (force || projectJson.state !== state) {
    projectJson.state = state;
    const timestamp = getDateString(true);
    projectJson.mtime = timestamp;
    await writeJsonWrapper(filename, projectJson);
    await gitAdd(projectRootDir, filename);
    return projectJson;
  }
  return false;
}

/**
 * get '/' separated component's hierarchial name
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - target component's ID
 * @returns {string} - absolute path of target component's template dir
 */
async function getComponentFullName(projectRootDir, ID) {
  const relativePath = await getComponentDir(projectRootDir, ID);
  if (relativePath === null) {
    return relativePath;
  }
  return relativePath.replace(/^\./, "");
}

/**
 * get project's status string
 * @param {string} projectRootDir - project's root path
 * @returns {string} -
 */
async function getProjectState(projectRootDir) {
  const projectJson = await readJsonGreedy(path.resolve(projectRootDir, projectJsonFilename));
  return projectJson.state;
}

/**
 * get remain running job
 * @param {string} projectRootDir - project's root path
 * @returns {object} -
 */
async function checkRunningJobs(projectRootDir) {
  const tasks = [];
  const jmFiles = [];

  const candidates = await promisify(glob)(`*.${jobManagerJsonFilename}`, { cwd: projectRootDir });
  for (const jmFile of candidates) {
    try {
      const taskInJmFile = await fs.readJson(path.resolve(projectRootDir, jmFile));
      if (Array.isArray(taskInJmFile) && taskInJmFile.length > 0) {
        jmFiles.push(jmFile);
        tasks.push(...taskInJmFile);
      }
    } catch (e) {
      getLogger(projectRootDir).warn("read job manager file failed", e);
    }
  }
  return { tasks, jmFiles };
}

/**
 * convert old include exclude format (comma separated string) to array of string
 * @param {string} projectRootDir - project's root path
 * @param {string} filename - component json filename
 * @param {string[]} changed - array of filename which is changed
 */
async function rewriteIncludeExclude(projectRootDir, filename, changed) {
  let needToWrite = false;
  const componentJson = await readJsonGreedy(filename);
  if (typeof componentJson.include === "string" && !Array.isArray(componentJson.include)) {
    getLogger().info("convert include property", filename);
    componentJson.include = glob2Array(componentJson.include).map((e)=>{
      return { name: e };
    });
    needToWrite = true;
  }
  if (componentJson.include === null) {
    componentJson.include = [];
    needToWrite = true;
  }
  if (typeof componentJson.exclude === "string" && !Array.isArray(componentJson.exclude)) {
    getLogger().info("convert exclude property", filename);
    componentJson.exclude = glob2Array(componentJson.exclude).map((e)=>{
      return { name: e };
    });
    needToWrite = true;
  }
  if (componentJson.exclude === null) {
    componentJson.exclude = [];
    needToWrite = true;
  }
  if (needToWrite) {
    await writeComponentJson(projectRootDir, path.dirname(filename), componentJson);
    changed.push(filename);
  }
}

/**
 * convert comma separated include and exclude prop to array of string
 * @param {string} projectRootDir - project's root path
 * @param {string[]} changed - array of filename which is changed
 */
async function rewriteAllIncludeExcludeProperty(projectRootDir, changed) {
  //convert include and exclude property to array
  const files = await promisify(glob)(`./**/${componentJsonFilename}`, { cwd: projectRootDir });
  await Promise.all(files.map((filename)=>{
    return rewriteIncludeExclude(projectRootDir, path.resolve(projectRootDir, filename), changed);
  }));
}

/**
 * read existing project directory and fix if it has some problem
 * @param {string} projectRootDir - project's root path
 * @returns {string|null} - prorjectRootDir if successfully read, null if error occurred
 */
async function readProject(projectRootDir) {
  const toBeCommited = [];

  //convert include/exclude prop
  const projectJson = await getProjectJson(projectRootDir);
  if (projectJson.version <= 2) {
    await rewriteAllIncludeExcludeProperty(projectRootDir, toBeCommited);
    projectJson.version = 2.1;
  }
  //skip following import process if project is already on projectList
  if (projectList.query("path", projectRootDir)) {
    return projectRootDir;
  }

  const projectBasename = path.basename(projectRootDir);

  if (projectBasename !== projectJson.name + suffix) {
    projectJson.name = projectBasename.replace(suffix, "");
    await writeProjectJson(projectRootDir, projectJson);
    toBeCommited.push(projectJsonFilename);
  }

  //set up project directory as git repo
  if (!await fs.pathExists(path.resolve(projectRootDir, ".git"))) {
    try {
      //this directory does not have ".git" that means its first time opening from WHEEL
      await gitInit(projectRootDir, "wheel", "wheel@example.com");
      await setProjectState(projectRootDir, "not-started");
      await setComponentStateR(projectRootDir, projectRootDir, "not-started");
      await gitAdd(projectRootDir, "./");
      await gitCommit(projectRootDir, "import project");
    } catch (e) {
      getLogger().error("can not access to git repository", e);
      return null;
    }
  } else {
    const ignoreFile = path.join(projectRootDir, ".gitignore");
    if (!await fs.pathExists(ignoreFile)) {
      await fs.outputFile(ignoreFile, "wheel.log");
      await gitAdd(projectRootDir, ".gitignore");
    }
    await Promise.all(toBeCommited.map((name)=>{
      return gitAdd(projectRootDir, name);
    }));
    await gitCommit(projectRootDir, "import project", ["--", ".gitignore", ...toBeCommited]);
  }
  projectList.unshift({ path: projectRootDir });
  return projectRootDir;
}

/**
 * set component and its descendant's state
 * @param {string} projectRootDir - project's root path
 * @param {string} dir - root component directory
 * @param {string} state  - state to be set
 * @param {boolean} doNotAdd - call gitAdd if false
 * @param {string[]} ignoreStates - do not change state if one of this state
 * @returns {Promise} - resolved when all componentJSON meta data file is written
 */
async function setComponentStateR(projectRootDir, dir, state, doNotAdd = false, ignoreStates = []) {
  const filenames = await promisify(glob)(path.join(dir, "**", componentJsonFilename));
  filenames.push(path.join(dir, componentJsonFilename));
  if (!ignoreStates.includes(state)) {
    ignoreStates.push(state);
  }
  const p = filenames.map((filename)=>{
    return readJsonGreedy(filename)
      .then((component)=>{
        if (ignoreStates.includes(component.state)) {
          return true;
        }
        component.state = state;
        const componentDir = path.dirname(filename);
        return writeComponentJson(projectRootDir, componentDir, component, doNotAdd);
      });
  });
  return Promise.all(p);
}

/**
 * set or remove read-only status
 * @param {string} projectRootDir - project's root path
 * @param {boolean} isRO - read only status
 */
async function updateProjectROStatus(projectRootDir, isRO) {
  const filename = path.resolve(projectRootDir, projectJsonFilename);
  const projectJson = await readJsonGreedy(filename);
  projectJson.readOnly = isRO;
  await writeJsonWrapper(filename, projectJson);
}

/**
 * update project description
 * @param {string} projectRootDir - project's root path
 * @param {string} description - new project description
 */
async function updateProjectDescription(projectRootDir, description) {
  const filename = path.resolve(projectRootDir, projectJsonFilename);
  const projectJson = await readJsonGreedy(filename);
  projectJson.description = description;
  await writeJsonWrapper(filename, projectJson);
  await gitAdd(projectRootDir, filename);
}

/**
 * add existing project to projectlist or create new project
 * @param {string} projectDir - git repo's root directory
 * @param {string} description - project description
 */
async function addProject(projectDir, description) {
  let projectRootDir = path.resolve(removeTrailingPathSep(convertPathSep(projectDir)));
  if (!projectRootDir.endsWith(suffix)) {
    projectRootDir += suffix;
  }
  projectRootDir = path.resolve(projectRootDir);

  if (await fs.pathExists(projectRootDir)) {
    const err = new Error("specified project dir is already exists");
    err.projectRootDir = projectRootDir;
    throw err;
  }

  if (await fs.pathExists(projectRootDir)) {
    const err = new Error("specified project dir is already used");
    err.projectRootDir = projectRootDir;
    throw err;
  }

  const projectName = path.basename(projectRootDir.slice(0, -suffix.length));
  if (!isValidName(projectName)) {
    getLogger().error(projectName, "is not allowed for project name");
    throw (new Error("illegal project name"));
  }
  projectRootDir = await createNewProject(projectRootDir, projectName, description, "wheel", "wheel@example.com");
  projectList.unshift({ path: projectRootDir });
}

/**
 * rename project
 * @param {string} id - project ID
 * @param {string} argNewName - new project name
 * @param {string} oldDir - old projectRootDir
 */
async function renameProject(id, argNewName, oldDir) {
  const newName = argNewName.endsWith(suffix) ? argNewName : argNewName + suffix;
  if (!isValidName(newName)) {
    getLogger().error(newName, "is not allowed for project name");
    throw (new Error("illegal project name"));
  }
  const newDir = path.resolve(path.dirname(oldDir), newName);
  if (await fs.pathExists(newDir)) {
    getLogger().error(newName, "is already exists");
    throw (new Error("already exists"));
  }

  await fs.move(oldDir, newDir);
  const projectJson = await readJsonGreedy(path.resolve(newDir, projectJsonFilename));
  projectJson.name = newName;
  projectJson.root = newDir;
  projectJson.mtime = getDateString(true);
  await writeProjectJson(newDir, projectJson);

  const rootWorkflow = await readJsonGreedy(path.resolve(newDir, componentJsonFilename));
  rootWorkflow.name = newName;
  await writeComponentJson(newDir, newDir, rootWorkflow);
  await gitCommit(newDir);

  //rewrite path in project List entry
  const target = projectList.get(id);
  target.path = newDir;
  await projectList.update(target);
}

/**
 * determine if port number setting means default ssh port
 * @param {*} port - port number
 * @returns {boolean} -
 */
function isDefaultPort(port) {
  return typeof port === "undefined" || port === 22 || port === "22" || port === "";
}

/**
 * determine if component is local
 * @param {object} component - component object
 * @returns {boolean} -
 */
function isLocal(component) {
  return typeof component.host === "undefined" || component.host === "localhost";
}

/**
 * check if specified components are executed on same remote host
 * @param {string} projectRootDir - project's root path
 * @param {string} src - src componentID
 * @param {string} dst - dst componentID
 * @returns {boolean} - on same remote or not
 */
async function isSameRemoteHost(projectRootDir, src, dst) {
  if (src === dst) {
    return null;
  }
  const srcComponent = await readComponentJsonByID(projectRootDir, src);
  const dstComponent = await readComponentJsonByID(projectRootDir, dst);
  if (isLocalComponent(srcComponent) || isLocalComponent(dstComponent)) {
    return false;
  }
  if (srcComponent.host === dstComponent.host) {
    return true;
  }
  const srcHostInfo = remoteHost.query("name", srcComponent.host);
  const dstHostInfo = remoteHost.query("name", dstComponent.host);
  if (srcHostInfo.host === dstHostInfo.host) {
    if (isDefaultPort(srcHostInfo.port)) {
      return isDefaultPort(dstHostInfo.port);
    } else {
      return srcHostInfo.port === dstHostInfo.port;
    }
  }
  if (dstHostInfo.sharedHost === srcHostInfo.name) {
    return true;
  }
  return false;
}

/**
 * check if given 2 id's has parent-child relationship
 * @param {string} projectRootDir - project's root path
 * @param {string} parentID - parenet component's ID
 * @param {string} childID - child component's ID
 * @returns {boolean} -
 */
async function isParent(projectRootDir, parentID, childID) {
  if (parentID === "parent") {
    return true;
  }
  if (childID === "parent") {
    return false;
  }
  const childJson = await readComponentJsonByID(projectRootDir, childID);
  if (childJson === null || typeof childID !== "string") {
    return false;
  }
  return childJson.parent === parentID;
}

/**
 *
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - ID string of component which has link to be deleted
 */
async function removeAllLinkFromComponent(projectRootDir, ID) {
  const counterparts = new Map();
  const component = await readComponentJsonByID(projectRootDir, ID);
  if (Object.prototype.hasOwnProperty.call(component, "previous")) {
    for (const previousComponent of component.previous) {
      const counterpart = counterparts.get(previousComponent) || await readComponentJsonByID(projectRootDir, previousComponent);
      counterpart.next = counterpart.next.filter((e)=>{
        return e !== component.ID;
      });
      if (counterpart.else) {
        counterpart.else = counterpart.else.filter((e)=>{
          return e !== component.ID;
        });
      }
      counterparts.set(counterpart.ID, counterpart);
    }
  }
  if (Object.prototype.hasOwnProperty.call(component, "next")) {
    for (const nextComponent of component.next) {
      const counterpart = counterparts.get(nextComponent) || await readComponentJsonByID(projectRootDir, nextComponent);
      counterpart.previous = counterpart.previous.filter((e)=>{
        return e !== component.ID;
      });
      counterparts.set(counterpart.ID, counterpart);
    }
  }
  if (Object.prototype.hasOwnProperty.call(component, "else")) {
    for (const elseComponent of component.else) {
      const counterpart = counterparts.get(elseComponent) || await readComponentJsonByID(projectRootDir, elseComponent);
      counterpart.previous = counterpart.previous.filter((e)=>{
        return e !== component.ID;
      });
      counterparts.set(counterpart.ID, counterpart);
    }
  }
  if (Object.prototype.hasOwnProperty.call(component, "inputFiles")) {
    for (const inputFile of component.inputFiles) {
      for (const src of inputFile.src) {
        const srcComponent = src.srcNode;
        const counterpart = counterparts.get(srcComponent) || await readComponentJsonByID(projectRootDir, srcComponent);
        for (const outputFile of counterpart.outputFiles) {
          outputFile.dst = outputFile.dst.filter((e)=>{
            return e.dstNode !== component.ID;
          });
        }
        counterparts.set(counterpart.ID, counterpart);
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(component, "outputFiles")) {
    for (const outputFile of component.outputFiles) {
      for (const dst of outputFile.dst) {
        const dstComponent = dst.dstNode;
        const counterpart = counterparts.get(dstComponent) || await readComponentJsonByID(projectRootDir, dstComponent);
        for (const inputFile of counterpart.inputFiles) {
          inputFile.src = inputFile.src.filter((e)=>{
            return e.srcNode !== component.ID;
          });
        }
        counterparts.set(counterpart.ID, counterpart);
      }
    }
  }
  for (const [counterPartID, counterpart] of counterparts) {
    await writeComponentJsonByID(projectRootDir, counterPartID, counterpart);
  }
}

/**
 * add new file link to parent component
 * @param {string} projectRootDir - project's root path
 * @param {string} srcNode - src component ID
 * @param {string} srcName - outputFile name
 * @param {string} dstName - inputFile name
 * @returns {Promise} - resolved when all component JSON files are writted
 */
async function addFileLinkToParent(projectRootDir, srcNode, srcName, dstName) {
  const srcDir = await getComponentDir(projectRootDir, srcNode, true);
  const srcJson = await readComponentJson(srcDir);
  const parentDir = path.dirname(srcDir);
  const parentJson = await readComponentJson(parentDir);
  const parentID = parentJson.ID;

  const srcOutputFile = srcJson.outputFiles.find((e)=>{
    return e.name === srcName;
  });
  if (!srcOutputFile.dst.includes({ dstNode: parentID, dstName })) {
    srcOutputFile.dst.push({ dstNode: parentID, dstName });
  }
  const p = writeComponentJson(projectRootDir, srcDir, srcJson);

  const parentOutputFile = parentJson.outputFiles.find((e)=>{
    return e.name === dstName;
  });
  if (!Object.prototype.hasOwnProperty.call(parentOutputFile, "origin")) {
    parentOutputFile.origin = [];
  }
  if (!parentOutputFile.origin.includes({ srcNode, srcName })) {
    parentOutputFile.origin.push({ srcNode, srcName });
  }
  await p;
  return writeComponentJson(projectRootDir, parentDir, parentJson);
}

/**
 * add new file link from parent component
 * @param {string} projectRootDir - project's root path
 * @param {string} srcName - outputFile name
 * @param {string} dstNode - destination component ID
 * @param {string} dstName - inputFile name
 * @returns {Promise} - resolved when all component JSON files are writted
 */
async function addFileLinkFromParent(projectRootDir, srcName, dstNode, dstName) {
  const dstDir = await getComponentDir(projectRootDir, dstNode, true);
  const dstJson = await readComponentJson(dstDir);
  const parentDir = path.dirname(dstDir);
  const parentJson = await readComponentJson(parentDir);
  const parentID = parentJson.ID;

  const parentInputFile = parentJson.inputFiles.find((e)=>{
    return e.name === srcName;
  });
  if (!Object.prototype.hasOwnProperty.call(parentInputFile, "forwardTo")) {
    parentInputFile.forwardTo = [];
  }
  if (!parentInputFile.forwardTo.includes({ dstNode, dstName })) {
    parentInputFile.forwardTo.push({ dstNode, dstName });
  }
  const p = writeComponentJson(projectRootDir, parentDir, parentJson);

  const dstInputFile = dstJson.inputFiles.find((e)=>{
    return e.name === dstName;
  });
  if (typeof dstInputFile === "undefined") {
    dstJson.inputFiles.push({ name: dstName, src: [{ srcNode: parentID, srcName }] });
  } else if (!dstInputFile.src.includes({ srcNode: parentID, srcName })) {
    dstInputFile.src.push({ srcNode: parentID, srcName });
  }
  await p;
  return writeComponentJson(projectRootDir, dstDir, dstJson);
}

/**
 * add file link between sibling components
 * @param {string} projectRootDir - project's root path
 * @param {string} srcNode - src component ID
 * @param {string} srcName - outputFile name
 * @param {string} dstNode - destination component ID
 * @param {string} dstName - inputFile name
 * @returns {Promise} - resolved when all component JSON files are writted
 */
async function addFileLinkBetweenSiblings(projectRootDir, srcNode, srcName, dstNode, dstName) {
  const srcDir = await getComponentDir(projectRootDir, srcNode, true);
  const srcJson = await readComponentJson(srcDir);
  const srcOutputFile = srcJson.outputFiles.find((e)=>{
    return e.name === srcName;
  });
  if (!srcOutputFile.dst.includes({ dstNode, dstName })) {
    srcOutputFile.dst.push({ dstNode, dstName });
  }
  const p1 = writeComponentJson(projectRootDir, srcDir, srcJson);

  const dstDir = await getComponentDir(projectRootDir, dstNode, true);
  const dstJson = await readComponentJson(dstDir);
  const dstInputFile = dstJson.inputFiles.find((e)=>{
    return e.name === dstName;
  });
  if (typeof dstInputFile === "undefined") {
    dstJson.inputFiles.push({ name: dstName, src: [{ srcNode, srcName }] });
  } else if (!dstInputFile.src.includes({ srcNode, srcName })) {
    dstInputFile.src.push({ srcNode, srcName });
  }
  await p1;
  return writeComponentJson(projectRootDir, dstDir, dstJson);
}

/**
 * remove filelink to parent component
 * @param {string} projectRootDir - project's root path
 * @param {string} srcNode - src component ID
 * @param {string} srcName - outputFile name
 * @param {string} dstName - inputFile name
 * @returns {Promise} - resolved when all component JSON files are writted
 */
async function removeFileLinkToParent(projectRootDir, srcNode, srcName, dstName) {
  const srcDir = await getComponentDir(projectRootDir, srcNode, true);
  const srcJson = await readComponentJson(srcDir);
  const parentDir = path.dirname(srcDir);
  const parentJson = await readComponentJson(parentDir);

  const srcOutputFile = srcJson.outputFiles.find((e)=>{
    return e.name === srcName;
  });
  srcOutputFile.dst = srcOutputFile.dst.filter((e)=>{
    return e.dstNode !== parentJson.ID || e.dstName !== dstName;
  });
  const p = writeComponentJson(projectRootDir, srcDir, srcJson);

  const parentOutputFile = parentJson.outputFiles.find((e)=>{
    return e.name === dstName;
  });
  if (Object.prototype.hasOwnProperty.call(parentOutputFile, "origin")) {
    parentOutputFile.origin = parentOutputFile.origin.filter((e)=>{
      return e.srcNode !== srcNode || e.srcName !== srcName;
    });
  }

  await p;
  return writeComponentJson(projectRootDir, parentDir, parentJson);
}

/**
 * remove filelink from parent component
 * @param {string} projectRootDir - project's root path
 * @param {string} srcName - outputFile name
 * @param {string} dstNode - destination component ID
 * @param {string} dstName - inputFile name
 * @returns {Promise} - resolved when all component JSON files are writted
 */
async function removeFileLinkFromParent(projectRootDir, srcName, dstNode, dstName) {
  const dstDir = await getComponentDir(projectRootDir, dstNode, true);
  const dstJson = await readComponentJson(dstDir);
  const parentDir = path.dirname(dstDir);
  const parentJson = await readComponentJson(parentDir);
  const parentID = parentJson.ID;

  const parentInputFile = parentJson.inputFiles.find((e)=>{
    return e.name === srcName;
  });
  if (Object.prototype.hasOwnProperty.call(parentInputFile, "forwardTo")) {
    parentInputFile.forwardTo = parentInputFile.forwardTo.filter((e)=>{
      return e.dstNode !== dstNode || e.dstName !== dstName;
    });
  }
  const p = writeComponentJson(projectRootDir, parentDir, parentJson);

  const dstInputFile = dstJson.inputFiles.find((e)=>{
    return e.name === dstName;
  });
  dstInputFile.src = dstInputFile.src.filter((e)=>{
    return e.srcNode !== parentID || e.srcName !== srcName;
  });
  await p;
  return writeComponentJson(projectRootDir, dstDir, dstJson);
}

/**
 * remove filelink between sibling components
 * @param {string} projectRootDir - project's root path
 * @param {string} srcNode - src component ID
 * @param {string} srcName - outputFile name
 * @param {string} dstNode - destination component ID
 * @param {string} dstName - inputFile name
 * @returns {Promise} - resolved when all component JSON files are writted
 */
async function removeFileLinkBetweenSiblings(projectRootDir, srcNode, srcName, dstNode, dstName) {
  const srcDir = await getComponentDir(projectRootDir, srcNode, true);
  const srcJson = await readComponentJson(srcDir);
  const srcOutputFile = srcJson.outputFiles.find((e)=>{
    return e.name === srcName;
  });
  srcOutputFile.dst = srcOutputFile.dst.filter((e)=>{
    return !(e.dstNode === dstNode && e.dstName === dstName);
  });
  const p = writeComponentJson(projectRootDir, srcDir, srcJson);

  const dstDir = await getComponentDir(projectRootDir, dstNode, true);
  const dstJson = await readComponentJson(dstDir);
  const dstInputFile = dstJson.inputFiles.find((e)=>{
    return e.name === dstName;
  });
  dstInputFile.src = dstInputFile.src.filter((e)=>{
    return !(e.srcNode === srcNode && e.srcName === srcName);
  });
  await p;
  return writeComponentJson(projectRootDir, dstDir, dstJson);
}

/**
 * add suffix to dirname and make directory
 * @param {string} basename - dirname
 * @param {string} argSuffix -   number
 * @returns {string} - actual directory name
 *
 * makeDir create "basenme+suffix" direcotry. suffix is increased until the dirname is no longer duplicated.
 */
async function makeDir(basename, argSuffix) {
  let suffix = argSuffix;
  while (await fs.pathExists(basename + suffix)) {
    ++suffix;
  }

  const dirname = basename + suffix;
  await fs.mkdir(dirname);
  return dirname;
}

/**
 * get array of child components
 * @param {string} projectRootDir - project's root path
 * @param {string} parentID - parent component's ID or directory path
 * @param {boolean} isParentDir - if true, parentID is regard as path to parent directory, not ID string
 * @returns {object[]} - array of child components except for subComponent
 */
async function getChildren(projectRootDir, parentID, isParentDir) {
  const dir = isParentDir ? parentID : parentID === null ? projectRootDir : await getComponentDir(projectRootDir, parentID, true);
  if (!dir) {
    return [];
  }

  const children = await promisify(glob)(path.join(dir, "*", componentJsonFilename));
  if (children.length === 0) {
    return [];
  }

  const rt = await Promise.all(children.map((e)=>{
    return readJsonGreedy(e);
  }));

  return rt.filter((e)=>{
    return !e.subComponent;
  });
}

/**
 * check if user has write permission to storagePath on remotehost
 * @param {string} projectRootDir - project's root path
 * @param {object} secondArg -
 * @param {string} secondArg.host - label of remotehost
 * @param {string} secondArg.storagePath - storage path on remotehost
 * @returns {Promise} - resolved if user has write permission to storagePath on remotehost
 */
async function checkRemoteStoragePathWritePermission(projectRootDir, { host, storagePath }) {
  const remotehostID = remoteHost.getID("name", host);
  const ssh = getSsh(projectRootDir, remotehostID);
  const rt = ssh.exec(`test -w ${storagePath}`);
  if (rt !== 0) {
    const err = new Error("bad permission");
    err.host = host;
    err.storagePath = storagePath;
    err.reason = "invalidRemoteStorage";
    throw err;
  }
  return Promise.resolve();
}

/**
 * get host value recursively
 * @param {string} projectRootDir - project's root path
 * @param {string} parentID - comopnent ID for current serch
 * @param {string[]} hosts - hosts set to task component
 * @param {string[]} storageHosts - hosts set to storage component
 * @returns {Promise} - resolved if serch under parentID is done
 */
async function recursiveGetHosts(projectRootDir, parentID, hosts, storageHosts) {
  const promises = [];
  const children = await getChildren(projectRootDir, parentID);
  for (const component of children) {
    if (component.disable) {
      continue;
    }
    if (component.host === "localhost") {
      continue;
    }
    if (["task", "stepjob", "bulkjobTask"].includes(component.type)) {
      hosts.push({ hostname: component.host, isStorage: false });
    } else if (component.type === "storage") {
      storageHosts.push({ hostname: component.host, isStorage: true });
    }
    if (hasChild(component)) {
      promises.push(recursiveGetHosts(projectRootDir, component.ID, hosts, storageHosts));
    }
  }
  return Promise.all(promises);
}

/**
 * read component Json recursively and pick up remote hosts used in task component
 * @param {string} projectRootDir - project's root path
 * @param {string | null} rootID - ID of the component to start travarsal. start from project root if rootID is null
 * @returns {object[]} - exclusive array of hosts
 */
async function getHosts(projectRootDir, rootID) {
  const hosts = [];
  const storageHosts = [];
  await recursiveGetHosts(projectRootDir, rootID, hosts, storageHosts);
  const storageHosts2 = Array.from(new Set(storageHosts));
  const hosts2 = Array.from(new Set(hosts))
    .filter((host)=>{
      return !storageHosts.some((e)=>{
        e.hostname === host.hostname;
      });
    });
  return [...storageHosts2, ...hosts2];
}

/**
 * create new component in parentDir
 * @param {string} projectRootDir - project's root path
 * @param {string} parentDir - parent component's directory path
 * @param {string} type - component type
 * @param {object} pos - component's cordinate in browser
 * @returns {object} component
 */
async function createNewComponent(projectRootDir, parentDir, type, pos) {
  const parentJson = await readJsonGreedy(path.resolve(parentDir, componentJsonFilename));
  const parentID = parentJson.ID;
  const componentBasename = getComponentDefaultName(type);

  //create component directory and Json file
  const absDirName = await makeDir(path.resolve(parentDir, componentBasename), 0);
  const newComponent = componentFactory(type, pos, parentID);
  newComponent.name = path.basename(absDirName);
  await writeComponentJson(projectRootDir, absDirName, newComponent);
  await updateComponentPath(projectRootDir, newComponent.ID, absDirName);
  if (type === "PS") {
    const PSConfigFilename = path.resolve(absDirName, defaultPSconfigFilename);
    await writeJsonWrapper(PSConfigFilename, { version: 2, targetFiles: [], params: [], scatter: [], gather: [] });
    await gitAdd(projectRootDir, PSConfigFilename);
  }
  return newComponent;
}

/**
 * perform git mv and update component path in projectJson file
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - ID of component to be renamed
 * @param {string} newName - new name
 * @returns {Promise} - resolved when rename is done
 */
async function renameComponentDir(projectRootDir, ID, newName) {
  if (!isValidName(newName)) {
    return Promise.reject(new Error(`${newName} is not valid component name`));
  }
  const oldDir = await getComponentDir(projectRootDir, ID, true);
  if (oldDir === projectRootDir) {
    return Promise.reject(new Error("updateNode can not rename root workflow"));
  }
  if (path.basename(oldDir) === newName) {
    //nothing to be done when you attempt to rename to the same name
    return true;
  }
  const newDir = path.resolve(path.dirname(oldDir), newName);
  await gitRm(projectRootDir, oldDir);
  await fs.move(oldDir, newDir);
  await gitAdd(projectRootDir, newDir);
  return updateComponentPath(projectRootDir, ID, newDir);
}

/**
 * replace component's env value
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - component ID
 * @param {object} newEnv - key-value object of environment variable
 * @returns {object} - updated componentJSON
 */
async function replaceEnv(projectRootDir, ID, newEnv) {
  const componentJson = await readComponentJsonByID(projectRootDir, ID);
  const env = componentJson.env || {};
  const patch = diff(env, newEnv);
  diffApply(env, patch);
  componentJson.env = env;
  await writeComponentJsonByID(projectRootDir, ID, componentJson);
  return componentJson;
}

/**
 * replace webhook setting on project meta data
 * @param {string} projectRootDir - project's root path
 * @param {object} newWebhook - new webhook setting
 * @returns {object} - updated webhook setting
 */
async function replaceWebhook(projectRootDir, newWebhook) {
  const projectJson = await getProjectJson(projectRootDir);
  const { webhook } = projectJson;
  if (typeof webhook === "undefined") {
    projectJson.webhook = newWebhook;
  } else {
    const patch = diff(webhook, newWebhook);
    diffApply(webhook, patch);
  }
  await writeProjectJson(projectRootDir, projectJson);
  return webhook;
}

/**
 * get env setting on component
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - component ID
 * @returns {object} -
 */
async function getEnv(projectRootDir, ID) {
  const componentJson = await readComponentJsonByID(projectRootDir, ID);
  const env = componentJson.env || {};
  return env;
}

/**
 * update component property (used only in test)
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - component ID
 * @param {string} prop - property to be updated
 * @param {string} value - new value
 * @returns {object} - updated component meta data
 */
async function updateComponent(projectRootDir, ID, prop, value) {
  if (prop === "path") {
    return Promise.reject(new Error("path property is deprecated. please use 'name' instead."));
  }
  if (prop === "inputFiles" || prop === "outputFiles") {
    return Promise.reject(new Error(`updateNode does not support ${prop}. please use renameInputFile or renameOutputFile`));
  }
  if (prop === "env") {
    return Promise.reject(new Error("updateNode does not support env. please use updateEnv"));
  }
  if (prop === "uploadOnDemand" && value === true) {
    await setUploadOndemandOutputFile(projectRootDir, ID);
  }
  if (prop === "name") {
    await renameComponentDir(projectRootDir, ID, value);
  }
  const componentJson = await readComponentJsonByID(projectRootDir, ID);
  componentJson[prop] = value;
  await writeComponentJsonByID(projectRootDir, ID, componentJson);
  return componentJson;
}

/**
 * update stepnumber all stepjobTask component in project
 * @param {string} projectRootDir - project's root path
 * @returns {Promise} - resolved when update is done
 */
async function updateStepNumber(projectRootDir) {
  const componentIDs = await getAllComponentIDs(projectRootDir);
  const stepjobTaskComponentJson = [];
  const stepjobComponentIDs = [];
  const stepjobGroup = [];
  //get stepjob, stepjobTask
  for (const id of componentIDs) {
    const componentDir = await getComponentDir(projectRootDir, id, true);
    const componentJson = await readComponentJson(componentDir);
    if (componentJson.type === "stepjobTask") {
      stepjobTaskComponentJson.push(componentJson);
    }
    if (componentJson.type === "stepjob") {
      stepjobComponentIDs.push(componentJson.ID);
    }
  }
  for (const id of stepjobComponentIDs) {
    const stepjobTaskIDs = stepjobTaskComponentJson.filter((component)=>{
      return component.parent === id;
    });
    stepjobGroup.push(stepjobTaskIDs);
  }

  //arrange stepjobTask in consideration of connect relation
  const arrangedComponents = await arrangeComponent(stepjobGroup);
  let stepnum = 0;
  const prop = "stepnum";
  const p = [];
  for (const componentJson of arrangedComponents) {
    componentJson[prop] = stepnum;
    const componentDir = await getComponentDir(projectRootDir, componentJson.ID, true);
    p.push(writeComponentJson(projectRootDir, componentDir, componentJson));
    stepnum++;
  }
  return Promise.all(p);
}

/**
 * arrange next/previous setting of stepjobTask
 * @param {object[]} stepjobGroupArray - array of stepjob components
 * @returns {object[]} - updated stepjob components
 */
async function arrangeComponent(stepjobGroupArray) {
  const arrangedArray = [];
  for (const stepjobTaskComponents of stepjobGroupArray) {
    let arrangeArraytemp = [];
    let notConnectTasks = [];
    for (let i = 0; i < stepjobTaskComponents.length; i++) {
      if (i === 0) {
        arrangeArraytemp = stepjobTaskComponents.filter((stepjobTask)=>{
          return stepjobTask.previous.length === 0 && stepjobTask.next.length !== 0;
        });
        if (arrangeArraytemp.length === 0) {
          arrangeArraytemp = stepjobTaskComponents;
          break;
        }
        continue;
      }

      let nextComponent = [];

      nextComponent = stepjobTaskComponents.filter((stepjobTask)=>{
        return stepjobTask.ID === arrangeArraytemp[i - 1].next[0];
      });
      if (nextComponent.length !== 0) {
        arrangeArraytemp.push(nextComponent[0]);
      }

      notConnectTasks = stepjobTaskComponents.filter((stepjobTask)=>{
        return stepjobTask.previous.length === 0 && stepjobTask.next.length === 0;
      });
    }
    for (const stepJobTask of notConnectTasks) {
      arrangeArraytemp.push(stepJobTask);
    }
    arrangedArray.push(arrangeArraytemp);
  }

  //flat single
  const arrayList = [];
  for (const stepJobList of arrangedArray) {
    for (const stepJobTask of stepJobList) {
      arrayList.push(stepJobTask);
    }
  }
  return arrayList;
}

/**
 * add inputFile to component
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - component ID
 * @param {string} name - inputfile's name
 * @returns {Promise} - resolved when update is done
 */
async function addInputFile(projectRootDir, ID, name) {
  if (!isValidInputFilename(name)) {
    return Promise.reject(new Error(`${name} is not valid inputFile name`));
  }
  const componentDir = await getComponentDir(projectRootDir, ID, true);
  const componentJson = await readComponentJson(componentDir);
  if (!Object.prototype.hasOwnProperty.call(componentJson, "inputFiles")) {
    const err = new Error(`${componentJson.name} does not have inputFiles`);
    err.component = componentJson;
    return Promise.reject(err);
  }
  componentJson.inputFiles.push({ name, src: [] });
  return writeComponentJson(projectRootDir, componentDir, componentJson);
}

/**
 * add outputFile to component
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - component ID
 * @param {string} name - inputfile's name
 * @returns {Promise} - resolved when update is done
 */
async function addOutputFile(projectRootDir, ID, name) {
  if (!isValidOutputFilename(name)) {
    return Promise.reject(new Error(`${name} is not valid outputFile name`));
  }
  const componentDir = await getComponentDir(projectRootDir, ID, true);
  const componentJson = await readComponentJson(componentDir);
  if (!Object.prototype.hasOwnProperty.call(componentJson, "outputFiles")) {
    const err = new Error(`${componentJson.name} does not have outputFiles`);
    err.component = componentJson;
    return Promise.reject(err);
  }
  if (componentJson.outputFiles.find((outputFile)=>{
    return outputFile.name === name;
  })) {
    return Promise.reject(new Error(`${name} is already exists`));
  }
  componentJson.outputFiles.push({ name, dst: [] });
  return writeComponentJson(projectRootDir, componentDir, componentJson);
}

/**
 * set on-demand uploaded filename to outputFile
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - component ID
 * @returns {Promise} - resolved when update is done
 */
async function setUploadOndemandOutputFile(projectRootDir, ID) {
  const componentDir = await getComponentDir(projectRootDir, ID, true);
  const componentJson = await readComponentJson(componentDir);
  if (!Object.prototype.hasOwnProperty.call(componentJson, "outputFiles")) {
    const err = new Error(`${componentJson.name} does not have outputFiles`);
    err.component = componentJson;
    return Promise.reject(err);
  }
  if (componentJson.outputFiles.length === 0) {
    return addOutputFile(projectRootDir, ID, "UPLOAD_ONDEMAND");
  }
  if (componentJson.outputFiles.length > 1) {
    const p = [];
    for (let i = 1; i < componentJson.outputFiles.length; i++) {
      const counterparts = new Set();
      for (const dst of componentJson.outputFiles[i].dst) {
        counterparts.add(dst);
      }
      for (const counterPart of counterparts) {
        p.push(removeFileLink(projectRootDir, ID, componentJson.outputFiles[i].name, counterPart.dstNode, counterPart.dstName));
      }
    }
    await Promise.all(p);
    componentJson.outputFiles.splice(1, componentJson.outputFiles.length - 1);
  }

  return renameOutputFile(projectRootDir, ID, 0, "UPLOAD_ONDEMAND");
}

/**
 * rename outputFile
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - component ID
 * @param {number} index - index number of outputFile to be renamed
 * @param {string} newName - new outputFile name
 * @returns {Promise} - resolved when update is done
 */
async function renameOutputFile(projectRootDir, ID, index, newName) {
  if (!isValidOutputFilename(newName)) {
    return Promise.reject(new Error(`${newName} is not valid outputFile name`));
  }
  const componentDir = await getComponentDir(projectRootDir, ID, true);
  const componentJson = await readComponentJson(componentDir);
  if (index < 0 || componentJson.outputFiles.length - 1 < index) {
    return Promise.reject(new Error(`invalid index ${index}`));
  }

  const counterparts = new Set();
  const oldName = componentJson.outputFiles[index].name;
  componentJson.outputFiles[index].name = newName;
  componentJson.outputFiles[index].dst.forEach((e)=>{
    counterparts.add(e.dstNode);
  });
  await writeComponentJson(projectRootDir, componentDir, componentJson);

  const promises = [];
  for (const counterPartID of counterparts) {
    const counterpartDir = await getComponentDir(projectRootDir, counterPartID, true);
    const counterpartJson = await readComponentJson(counterpartDir);
    for (const inputFile of counterpartJson.inputFiles) {
      for (const src of inputFile.src) {
        if (src.srcNode === ID && src.srcName === oldName) {
          src.srcName = newName;
        }
      }
    }
    for (const outputFile of counterpartJson.outputFiles) {
      if (!Object.prototype.hasOwnProperty.call(outputFile, "origin")) {
        for (const src of outputFile.origin) {
          if (src.srcNode === ID && src.srcName === oldName) {
            src.srcName = newName;
          }
        }
      }
    }
    promises.push(writeComponentJson(projectRootDir, counterpartDir, counterpartJson));
  }
  return Promise.all(promises);
}

/**
 * add link between 2 components
 * @param {string} projectRootDir - project's root path
 * @param {string} src - src component ID
 * @param {string} dst - destination component ID
 * @param {boolean} isElse - connect to else connector
 * @returns {Promise} - reject if link is not allowd. resolved after updated
 */
async function addLink(projectRootDir, src, dst, isElse = false) {
  if (src === dst) {
    return Promise.reject(new Error("cyclic link is not allowed"));
  }
  const srcDir = await getComponentDir(projectRootDir, src, true);
  const srcJson = await readComponentJson(srcDir);
  const dstDir = await getComponentDir(projectRootDir, dst, true);
  const dstJson = await readComponentJson(dstDir);
  for (const type of ["viewer", "source"]) {
    if (srcJson.type !== type && dstJson.type !== type) {
      continue;
    }
    const err = new Error(`${type} can not have link`);
    err.src = src;
    err.srcName = srcJson.name;
    err.dst = dst;
    err.dstName = dstJson.name;
    err.isElse = isElse;
    err.code = "ELINK";
    return Promise.reject(err);
  }
  if (isElse && !srcJson.else.includes(dst)) {
    srcJson.else.push(dst);
  } else if (!srcJson.next.includes(dst)) {
    srcJson.next.push(dst);
  }
  await writeComponentJson(projectRootDir, srcDir, srcJson);
  if (!dstJson.previous.includes(src)) {
    dstJson.previous.push(src);
  }
  await writeComponentJson(projectRootDir, dstDir, dstJson);
  if (srcJson.type === "stepjobTask" && dstJson.type === "stepjobTask") {
    await updateStepNumber(projectRootDir);
  }
}

/**
 * remove link between 2 components
 * @param {string} projectRootDir - project's root path
 * @param {string} src - src component ID
 * @param {string} dst - destination component ID
 * @param {boolean} isElse - connect to else connector
 * @returns {Promise} - resolved after updated
 */
async function removeLink(projectRootDir, src, dst, isElse) {
  const srcDir = await getComponentDir(projectRootDir, src, true);
  const srcJson = await readComponentJson(srcDir);
  if (isElse) {
    srcJson.else = srcJson.else.filter((e)=>{
      return e !== dst;
    });
  } else {
    srcJson.next = srcJson.next.filter((e)=>{
      return e !== dst;
    });
  }
  await writeComponentJson(projectRootDir, srcDir, srcJson);

  const dstDir = await getComponentDir(projectRootDir, dst, true);
  const dstJson = await readComponentJson(dstDir);
  dstJson.previous = dstJson.previous.filter((e)=>{
    return e !== src;
  });
  await writeComponentJson(projectRootDir, dstDir, dstJson);
}

/**
 * remove all link from specified component
 * @param {string} projectRootDir - project's root path
 * @param {string} componentID - component's ID string
 */
async function removeAllLink(projectRootDir, componentID) {
  const dstDir = await getComponentDir(projectRootDir, componentID, true);
  const dstJson = await readComponentJson(dstDir);

  const srcComponents = dstJson.previous;
  const p = [];
  for (const src of srcComponents) {
    const srcDir = await getComponentDir(projectRootDir, src, true);
    const srcJson = await readComponentJson(srcDir);
    if (Array.isArray(srcJson.next)) {
      srcJson.next = srcJson.next.filter((e)=>{
        return e !== componentID;
      });
    }
    if (Array.isArray(srcJson.else)) {
      srcJson.else = srcJson.else.filter((e)=>{
        return e !== componentID;
      });
    }
    p.push(writeComponentJson(projectRootDir, srcDir, srcJson));
  }

  dstJson.previous = [];
  p.push(writeComponentJson(projectRootDir, dstDir, dstJson));
  return Promise.all(p);
}

/**
 * add file link between 2 components
 * @param {string} projectRootDir - project's root path
 * @param {string} srcNode - src component ID
 * @param {string} srcName - outputFile name
 * @param {string} dstNode - destination component ID
 * @param {string} dstName - inputFile name
 * @returns {Promise} - resolved after updated
 */
async function addFileLink(projectRootDir, srcNode, srcName, dstNode, dstName) {
  if (srcNode === dstNode) {
    return Promise.reject(new Error("cyclic link is not allowed"));
  }
  if (await isParent(projectRootDir, dstNode, srcNode)) {
    return addFileLinkToParent(projectRootDir, srcNode, srcName, dstName);
  }
  if (await isParent(projectRootDir, srcNode, dstNode)) {
    return addFileLinkFromParent(projectRootDir, srcName, dstNode, dstName);
  }
  return addFileLinkBetweenSiblings(projectRootDir, srcNode, srcName, dstNode, dstName);
}

/**
 * remove filelink between 2 components
 * @param {string} projectRootDir - project's root path
 * @param {string} srcNode - src component ID
 * @param {string} srcName - outputFile name
 * @param {string} dstNode - destination component ID
 * @param {string} dstName - inputFile name
 * @returns {Promise} - resolved after updated
 */
async function removeFileLink(projectRootDir, srcNode, srcName, dstNode, dstName) {
  if (await isParent(projectRootDir, dstNode, srcNode)) {
    return removeFileLinkToParent(projectRootDir, srcNode, srcName, dstName);
  }
  if (await isParent(projectRootDir, srcNode, dstNode)) {
    return removeFileLinkFromParent(projectRootDir, srcName, dstNode, dstName);
  }
  return removeFileLinkBetweenSiblings(projectRootDir, srcNode, srcName, dstNode, dstName);
}

/**
 * remove all filelink on the inputFile
 * @param {string} projectRootDir - project's root path
 * @param {string} componentID - ID of component which has filelink to be removed
 * @param {string} inputFilename - inputFile which has filelink to be removed
 * @param {boolean} fromChildren - if true, remove filelink from children
 * @returns {Promise} - resolved after updated
 */
async function removeAllFileLink(projectRootDir, componentID, inputFilename, fromChildren) {
  const targetDir = await getComponentDir(projectRootDir, componentID, true);
  const componentJson = await readComponentJson(targetDir);
  const p = [];
  if (fromChildren) {
    const outputFile = componentJson.outputFiles.find((e)=>{
      return e.name === inputFilename;
    });
    if (!outputFile) {
      return new Error(`${inputFilename} not found in parent's outputFiles`);
    }
    if (!Array.isArray(outputFile.origin)) {
      return true;
    }
    for (const { srcNode, srcName } of outputFile.origin) {
      p.push(removeFileLinkToParent(projectRootDir, srcNode, srcName, inputFilename));
    }
  } else {
    const inputFile = componentJson.inputFiles.find((e)=>{
      return e.name === inputFilename;
    });
    if (!inputFile) {
      return new Error(`${inputFilename} not found in inputFiles`);
    }
    for (const { srcNode, srcName } of inputFile.src) {
      p.push(removeFileLinkBetweenSiblings(projectRootDir, srcNode, srcName, componentID, inputFilename));
    }
  }
  return Promise.all(p);
}

/**
 * remove component
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - ID of component to be removed
 * @returns {Promise} - resolved after updated
 */
async function removeComponent(projectRootDir, ID) {
  const targetDir = await getComponentDir(projectRootDir, ID, true);
  const descendantsIDs = await getDescendantsIDs(projectRootDir, ID);
  //remove all link/filelink to or from components to be removed
  for (const descendantID of descendantsIDs) {
    await removeAllLinkFromComponent(projectRootDir, descendantID);
  }
  //gitOperator.rm() only remove existing files from git repo if directory is passed
  //so, gitRm and fs.remove must be called in this order
  await gitRm(projectRootDir, targetDir);
  await fs.remove(targetDir);
  return removeComponentPath(projectRootDir, descendantsIDs);
}

/**
 * get all srouce components in project
 * @param {string} projectRootDir - project's root path
 * @returns {object[]} - array of source component
 */
async function getSourceComponents(projectRootDir) {
  const componentJsonFiles = await promisify(glob)(path.join(projectRootDir, "**", componentJsonFilename));
  const components = await Promise.all(componentJsonFiles
    .map((componentJsonFile)=>{
      return readJsonGreedy(componentJsonFile);
    }));

  return components.filter((componentJson)=>{
    return componentJson.type === "source" && !componentJson.subComponent && !componentJson.disable;
  });
}

/**
 * determin specified path is componennt dir or not
 * @param {string} target - directory path
 * @returns {boolean} - whether given path is component directory or not
 */
async function isComponentDir(target) {
  const stats = await fs.lstat(path.resolve(target));
  if (!stats.isDirectory()) {
    return false;
  }
  return fs.pathExists(path.resolve(target, componentJsonFilename));
}

/**
 * read all component json file under specified directory
 * @param {string} projectRootDir - project's root path
 * @param {string} rootDir - start point of directory search
 * @returns {object} - integrated component json data
 */
async function getComponentTree(projectRootDir, rootDir) {
  const projectJson = await readJsonGreedy(path.resolve(projectRootDir, projectJsonFilename));
  const start = path.isAbsolute(rootDir) ? path.relative(projectRootDir, rootDir) || "./" : rootDir;
  const componentJsonFileList = Object.values(projectJson.componentPath)
    .filter((dirname)=>{
      return isPathInside(dirname, start) || path.normalize(dirname) === path.normalize(start);
    })
    .map((dirname)=>{
      return path.join(dirname, componentJsonFilename);
    });
  const componentJsonList = await Promise.all(componentJsonFileList.map((target)=>{
    return readJsonGreedy(path.resolve(projectRootDir, target));
  }));

  //Naive implementation
  const startStriped = start.endsWith("/") ? start.slice(0, -1) : start;
  const rootIndex = componentJsonFileList.findIndex((e)=>{
    return path.dirname(e) === startStriped;
  });
  if (rootIndex === -1) {
    throw Promise.reject(new Error("root component not found"));
  }

  const root = componentJsonList.splice(rootIndex, 1)[0];
  for (const target of componentJsonList) {
    const parentComponent = componentJsonList.find((e)=>{
      return e.ID === target.parent;
    }) || root;
    if (Array.isArray(parentComponent.children)) {
      parentComponent.children.push(target);
    } else {
      parentComponent.children = [target];
    }
  }

  return root;
}

module.exports = {
  createNewProject,
  updateComponentPath,
  getComponentFullName,
  setProjectState,
  getProjectState,
  checkRunningJobs,
  readProject,
  updateProjectROStatus,
  updateProjectDescription,
  getProjectJson,
  addProject,
  renameProject,
  setComponentStateR,
  getHosts,
  checkRemoteStoragePathWritePermission,
  getSourceComponents,
  getChildren,
  createNewComponent,
  updateComponent,
  addInputFile,
  addOutputFile,
  renameOutputFile,
  addLink,
  addFileLink,
  removeLink,
  removeAllLink,
  removeFileLink,
  removeAllFileLink,
  getEnv,
  replaceEnv,
  replaceWebhook,
  removeComponent,
  isComponentDir,
  getComponentTree,
  isLocal,
  isSameRemoteHost
};
