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

const _internal = {
  fs,
  projectList,
  readJsonGreedy,
  writeJsonWrapper,
  gitAdd,
  promisify,
  path,
  diff,
  diffApply,
  getComponentDir,
  writeComponentJson,
  writeComponentJsonByID,
  readComponentJson,
  readComponentJsonByID,
  getLogger,
  remoteHost,
  getSsh,
  hasChild,
  componentFactory,
  isValidInputFilename,
  isValidOutputFilename,
  glob,
  gitInit,
  gitCommit,
  gitRm,
  getDateString,
  isLocalComponent,
  isValidName
};

/**
 * check feather given token is surrounded by { and }
 * @param {string} token - string to be checked
 * @returns {boolean} - true if token is surrounded by {}
 */
_internal.isSurrounded = function (token) {
  return token.startsWith("{") && token.endsWith("}");
};

/**
 * remove heading '{' and trailing '}'
 * @param {string} token - string to be checked
 * @returns {string} - trimed token
 */
_internal.trimSurrounded = function (token) {
  if (!_internal.isSurrounded(token)) {
    return token;
  }
  const rt = /{+(.*)}+/.exec(token);
  return (Array.isArray(rt) && typeof rt[1] === "string") ? rt[1] : token;
};

/**
 * transform grob string to array
 * @param {string} token - grob pattern
 * @returns {string[]} -
 */
_internal.glob2Array = function (token) {
  return _internal.trimSurrounded(token).split(",");
};

/**
 * remove trailing path sep from string
 * @param {string} filename - string possibly with trailing path sep
 * @returns {string} - string without trailing path sep
 */
_internal.removeTrailingPathSep = function (filename) {
  if (filename.endsWith(path.sep)) {
    return _internal.removeTrailingPathSep(filename.slice(0, -1));
  }
  return filename;
};

/**
 * get project JSON
 * @param {string} projectRootDir - project's root path
 * @returns {object} - project JSON data
 */
_internal.getProjectJson = async function (projectRootDir) {
  return _internal.readJsonGreedy(path.resolve(projectRootDir, projectJsonFilename));
};

/**
 * write project Json
 * @param {string} projectRootDir - project's root path
 * @param {object} projectJson - project JSON data
 * @returns {Promise} - resolved when write JSON file and git add performed
 */
_internal.writeProjectJson = async function (projectRootDir, projectJson) {
  const filename = path.resolve(projectRootDir, projectJsonFilename);
  await _internal.writeJsonWrapper(filename, projectJson);
  return _internal.gitAdd(projectRootDir, filename);
};

/**
 * read component JSON file and return children's ID
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - ID string of search root component
 * @returns {string[]} - array of id string
 */
_internal.getDescendantsIDs = async function (projectRootDir, ID) {
  const filename = path.resolve(projectRootDir, projectJsonFilename);
  const projectJson = await _internal.readJsonGreedy(filename);
  const poi = await _internal.getComponentDir(projectRootDir, ID, true);
  const rt = [ID];
  for (const [id, componentPath] of Object.entries(projectJson.componentPath)) {
    if (isPathInside(path.resolve(projectRootDir, componentPath), poi)) {
      rt.push(id);
    }
  }
  return rt;
};

/**
 * read project JSON file and return all component ID in project
 * @param {string} projectRootDir - project's root path
 * @returns {string[]} - array of id string
 */
_internal.getAllComponentIDs = async function (projectRootDir) {
  const filename = path.resolve(projectRootDir, projectJsonFilename);
  const projectJson = await _internal.readJsonGreedy(filename);
  return Object.keys(projectJson.componentPath);
};

/**
 * get suffix number part of project name
 * @param {string} projectName -
 * @returns {string} -
 */
_internal.getSuffixNumberFromProjectName = function (projectName) {
  const reResult = /.*(\d+)$/.exec(projectName);
  return reResult === null ? 0 : reResult[1];
};

/**
 * return unused projectRootDir
 * @param {string} projectRootDir - project's root path
 * @param {string} projectName - project name without suffix
 * @returns {string} - absolute path of project root directory
 */
_internal.getUnusedProjectDir = async function (projectRootDir, projectName) {
  if (!await _internal.fs.pathExists(projectRootDir)) {
    return projectRootDir;
  }

  const dirname = path.dirname(projectRootDir);
  let projectRootDirCandidate = path.resolve(dirname, `${projectName}${suffix}`);
  if (!await _internal.fs.pathExists(projectRootDirCandidate)) {
    return projectRootDirCandidate;
  }

  let suffixNumber = _internal.getSuffixNumberFromProjectName(projectName);
  projectRootDirCandidate = path.resolve(dirname, `${projectName}${suffixNumber}${suffix}`);

  while (await _internal.fs.pathExists(projectRootDirCandidate)) {
    ++suffixNumber;
    projectRootDirCandidate = path.resolve(dirname, `${projectName}${suffixNumber}${suffix}`);
  }
  return projectRootDirCandidate;
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
_internal.createNewProject = async function (argProjectRootDir, name, argDescription, user, mail) {
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
  _internal.getLogger().debug(projectJson);
  await _internal.writeJsonWrapper(projectJsonFileFullpath, projectJson);
  await _internal.gitAdd(projectRootDir, "./");
  await _internal.gitCommit(projectRootDir, "create new project");
  return projectRootDir;
};

/**
 * remove one or more component ID from componentPath map in porjectJson
 * @param {string} projectRootDir - project's root path
 * @param {string[]} IDs - component IDs to be removed
 * @param {boolean} force - remove path if component directory exists
 * @returns {Promise} - resolved when project Json file is added to git repo
 */
async function removeComponentPath(projectRootDir, IDs, force = false) {
  const filename = path.resolve(projectRootDir, projectJsonFilename);
  const projectJson = await _internal.readJsonGreedy(filename);
  for (const [id, componentPath] of Object.entries(projectJson.componentPath)) {
    if (IDs.includes(id)) {
      if (force || !await _internal.fs.pathExists(path.join(projectRootDir, componentPath))) {
        delete projectJson.componentPath[id];
      }
    }
  }

  //write project Json file
  await _internal.writeJsonWrapper(filename, projectJson);
  return _internal.gitAdd(projectRootDir, filename);
}
_internal.removeComponentPath = removeComponentPath;

/**
 * update component path-id map
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - component ID
 * @param {string} absPath - component's absolute path
 * @returns {object} - component path map
 */
_internal.updateComponentPath = async function (projectRootDir, ID, absPath) {
  const filename = path.resolve(projectRootDir, projectJsonFilename);
  const projectJson = await _internal.readJsonGreedy(filename);

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
  await _internal.writeJsonWrapper(filename, projectJson);
  await _internal.gitAdd(projectRootDir, filename);
  return projectJson.componentPath;
};

/**
 * set project status and write project metat data file
 * @param {string} projectRootDir - project's root path
 * @param {string} state - state to be set
 * @param {boolean} force - force update if already set given state
 * @returns {object|false} - new Project JSON meta data. false means meta data does not updated
 */
async function setProjectState(projectRootDir, state, force) {
  const filename = path.resolve(projectRootDir, projectJsonFilename);
  const projectJson = await _internal.readJsonGreedy(filename);
  if (force || projectJson.state !== state) {
    projectJson.state = state;
    const timestamp = _internal.getDateString(true);
    projectJson.mtime = timestamp;
    await _internal.writeJsonWrapper(filename, projectJson);
    await _internal.gitAdd(projectRootDir, filename);
    return projectJson;
  }
  return false;
}
_internal.setProjectState = setProjectState;

/**
 * get '/' separated component's hierarchial name
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - target component's ID
 * @returns {string} - absolute path of target component's template dir
 */
async function getComponentFullName(projectRootDir, ID) {
  const relativePath = await _internal.getComponentDir(projectRootDir, ID);
  if (relativePath === null) {
    return relativePath;
  }
  return relativePath.replace(/^\./, "");
}
_internal.getComponentFullName = getComponentFullName;

/**
 * get project's status string
 * @param {string} projectRootDir - project's root path
 * @returns {string} -
 */
async function getProjectState(projectRootDir) {
  const projectJson = await _internal.readJsonGreedy(path.resolve(projectRootDir, projectJsonFilename));
  return projectJson.state;
}
_internal.getProjectState = getProjectState;

/**
 * get remain running job
 * @param {string} projectRootDir - project's root path
 * @returns {object} -
 */
_internal.checkRunningJobs = async function (projectRootDir) {
  const tasks = [];
  const jmFiles = [];

  const candidates = await _internal.promisify(glob)(`*.${jobManagerJsonFilename}`, { cwd: projectRootDir });
  for (const jmFile of candidates) {
    try {
      const taskInJmFile = await _internal.fs.readJson(path.resolve(projectRootDir, jmFile));
      if (Array.isArray(taskInJmFile) && taskInJmFile.length > 0) {
        jmFiles.push(jmFile);
        tasks.push(...taskInJmFile);
      }
    } catch (e) {
      _internal.getLogger(projectRootDir).warn("read job manager file failed", e);
    }
  }
  return { tasks, jmFiles };
};

/**
 * convert old include exclude format (comma separated string) to array of string
 * @param {string} projectRootDir - project's root path
 * @param {string} filename - component json filename
 * @param {string[]} changed - array of filename which is changed
 */
_internal.rewriteIncludeExclude = async function (projectRootDir, filename, changed) {
  let needToWrite = false;
  const componentJson = await _internal.readJsonGreedy(filename);
  if (typeof componentJson.include === "string" && !Array.isArray(componentJson.include)) {
    _internal.getLogger().info("convert include property", filename);
    componentJson.include = _internal.glob2Array(componentJson.include).map((e)=>{
      return { name: e };
    });
    needToWrite = true;
  }
  if (componentJson.include === null) {
    componentJson.include = [];
    needToWrite = true;
  }
  if (typeof componentJson.exclude === "string" && !Array.isArray(componentJson.exclude)) {
    _internal.getLogger().info("convert exclude property", filename);
    componentJson.exclude = _internal.glob2Array(componentJson.exclude).map((e)=>{
      return { name: e };
    });
    needToWrite = true;
  }
  if (componentJson.exclude === null) {
    componentJson.exclude = [];
    needToWrite = true;
  }
  if (needToWrite) {
    await _internal.writeComponentJson(projectRootDir, path.dirname(filename), componentJson);
    changed.push(filename);
  }
};

/**
 * convert comma separated include and exclude prop to array of string
 * @param {string} projectRootDir - project's root path
 * @param {string[]} changed - array of filename which is changed
 */
_internal.rewriteAllIncludeExcludeProperty = async function (projectRootDir, changed) {
  //convert include and exclude property to array
  const files = await _internal.promisify(glob)(`./**/${componentJsonFilename}`, { cwd: projectRootDir });
  await Promise.all(files.map((filename)=>{
    return _internal.rewriteIncludeExclude(projectRootDir, path.resolve(projectRootDir, filename), changed);
  }));
};

/**
 * read existing project directory and fix if it has some problem
 * @param {string} projectRootDir - project's root path
 * @returns {string|null} - prorjectRootDir if successfully read, null if error occurred
 */
_internal.readProject = async function (projectRootDir) {
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
 * set component and its descendant's state
 * @param {string} projectRootDir - project's root path
 * @param {string} dir - root component directory
 * @param {string} state  - state to be set
 * @param {boolean} doNotAdd - call gitAdd if false
 * @param {string[]} ignoreStates - do not change state if one of this state
 * @returns {Promise} - resolved when all componentJSON meta data file is written
 */
_internal.setComponentStateR = async function (projectRootDir, dir, state, doNotAdd = false, ignoreStates = []) {
  const filenames = await _internal.promisify(glob)(path.join(dir, "**", componentJsonFilename));
  filenames.push(path.join(dir, componentJsonFilename));
  if (!ignoreStates.includes(state)) {
    ignoreStates.push(state);
  }
  const p = filenames.map((filename)=>{
    return _internal.readJsonGreedy(filename)
      .then((component)=>{
        if (ignoreStates.includes(component.state)) {
          return true;
        }
        component.state = state;
        const componentDir = path.dirname(filename);
        return _internal.writeComponentJson(projectRootDir, componentDir, component, doNotAdd);
      });
  });
  return Promise.all(p);
};

/**
 * set or remove read-only status
 * @param {string} projectRootDir - project's root path
 * @param {boolean} isRO - read only status
 */
async function updateProjectROStatus(projectRootDir, isRO) {
  const filename = path.resolve(projectRootDir, projectJsonFilename);
  const projectJson = await _internal.readJsonGreedy(filename);
  projectJson.readOnly = isRO;
  await _internal.writeJsonWrapper(filename, projectJson);
}
_internal.updateProjectROStatus = updateProjectROStatus;

/**
 * update project description
 * @param {string} projectRootDir - project's root path
 * @param {string} description - new project description
 */
async function updateProjectDescription(projectRootDir, description) {
  const filename = path.resolve(projectRootDir, projectJsonFilename);
  const projectJson = await _internal.readJsonGreedy(filename);
  projectJson.description = description;
  await _internal.writeJsonWrapper(filename, projectJson);
  await _internal.gitAdd(projectRootDir, filename);
}
_internal.updateProjectDescription = updateProjectDescription;

/**
 * add existing project to projectlist or create new project
 * @param {string} projectDir - git repo's root directory
 * @param {string} description - project description
 */
_internal.addProject = async function (projectDir, description) {
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
_internal.renameProject = async function (id, argNewName, oldDir) {
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
 * determine if port number setting means default ssh port
 * @param {*} port - port number
 * @returns {boolean} -
 */
function isDefaultPort(port) {
  return typeof port === "undefined" || port === 22 || port === "22" || port === "";
}
_internal.isDefaultPort = isDefaultPort;

/**
 * determine if component is local
 * @param {object} component - component object
 * @returns {boolean} -
 */
function isLocal(component) {
  return typeof component.host === "undefined" || component.host === "localhost";
}
_internal.isLocal = isLocal;

/**
 * check if specified components are executed on same remote host
 * @param {string} projectRootDir - project's root path
 * @param {string} src - src componentID
 * @param {string} dst - dst componentID
 * @returns {boolean} - on same remote or not
 */
_internal.isSameRemoteHost = async function (projectRootDir, src, dst) {
  if (src === dst) {
    return null;
  }
  const srcComponent = await _internal.readComponentJsonByID(projectRootDir, src);
  const dstComponent = await _internal.readComponentJsonByID(projectRootDir, dst);
  if (isLocalComponent(srcComponent) || isLocalComponent(dstComponent)) {
    return false;
  }
  if (srcComponent.host === dstComponent.host) {
    return true;
  }
  const srcHostInfo = _internal.remoteHost.query("name", srcComponent.host);
  const dstHostInfo = _internal.remoteHost.query("name", dstComponent.host);

  if (!srcHostInfo || !dstHostInfo) {
    return false;
  }

  if (dstHostInfo.sharedHost === srcHostInfo.name) {
    return true;
  }

  if (srcHostInfo.host !== dstHostInfo.host || srcHostInfo.user !== dstHostInfo.user) {
    return false;
  }
  const srcHostPort = _internal.isDefaultPort(srcHostInfo.port) ? 22 : srcHostInfo.port;
  const dstHostPort = _internal.isDefaultPort(dstHostInfo.port) ? 22 : dstHostInfo.port;
  return srcHostPort === dstHostPort;
};

/**
 * check if given 2 id's has parent-child relationship
 * @param {string} projectRootDir - project's root path
 * @param {string} parentID - parenet component's ID
 * @param {string} childID - child component's ID
 * @returns {boolean} -
 */
_internal.isParent = async function (projectRootDir, parentID, childID) {
  if (parentID === "parent") {
    return true;
  }
  if (childID === "parent") {
    return false;
  }
  const childJson = await _internal.readComponentJsonByID(projectRootDir, childID);
  if (childJson === null || typeof childID !== "string") {
    return false;
  }
  return childJson.parent === parentID;
};

/**
 *
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - ID string of component which has link to be deleted
 */
_internal.removeAllLinkFromComponent = async function (projectRootDir, ID) {
  const counterparts = new Map();
  const component = await _internal.readComponentJsonByID(projectRootDir, ID);
  if (Object.prototype.hasOwnProperty.call(component, "previous")) {
    for (const previousComponent of component.previous) {
      const counterpart = counterparts.get(previousComponent) || await _internal.readComponentJsonByID(projectRootDir, previousComponent);
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
      const counterpart = counterparts.get(nextComponent) || await _internal.readComponentJsonByID(projectRootDir, nextComponent);
      counterpart.previous = counterpart.previous.filter((e)=>{
        return e !== component.ID;
      });
      counterparts.set(counterpart.ID, counterpart);
    }
  }
  if (Object.prototype.hasOwnProperty.call(component, "else")) {
    for (const elseComponent of component.else) {
      const counterpart = counterparts.get(elseComponent) || await _internal.readComponentJsonByID(projectRootDir, elseComponent);
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
        const counterpart = counterparts.get(srcComponent) || await _internal.readComponentJsonByID(projectRootDir, srcComponent);
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
        const counterpart = counterparts.get(dstComponent) || await _internal.readComponentJsonByID(projectRootDir, dstComponent);
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
    await _internal.writeComponentJsonByID(projectRootDir, counterPartID, counterpart);
  }
};

/**
 * add new file link to parent component
 * @param {string} projectRootDir - project's root path
 * @param {string} srcNode - src component ID
 * @param {string} srcName - outputFile name
 * @param {string} dstName - inputFile name
 * @returns {Promise} - resolved when all component JSON files are writted
 */
async function addFileLinkToParent(projectRootDir, srcNode, srcName, dstName) {
  const srcDir = await _internal.getComponentDir(projectRootDir, srcNode, true);
  const srcJson = await _internal.readComponentJson(srcDir);
  const parentDir = path.dirname(srcDir);
  const parentJson = await _internal.readComponentJson(parentDir);
  const parentID = parentJson.ID;

  const srcOutputFile = srcJson.outputFiles.find((e)=>{
    return e.name === srcName;
  });
  if (!srcOutputFile.dst.includes({ dstNode: parentID, dstName })) {
    srcOutputFile.dst.push({ dstNode: parentID, dstName });
  }
  const p = _internal.writeComponentJson(projectRootDir, srcDir, srcJson);

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
  return _internal.writeComponentJson(projectRootDir, parentDir, parentJson);
}
_internal.addFileLinkToParent = addFileLinkToParent;

/**
 * add new file link from parent component
 * @param {string} projectRootDir - project's root path
 * @param {string} srcName - outputFile name
 * @param {string} dstNode - destination component ID
 * @param {string} dstName - inputFile name
 * @returns {Promise} - resolved when all component JSON files are writted
 */
async function addFileLinkFromParent(projectRootDir, srcName, dstNode, dstName) {
  const dstDir = await _internal.getComponentDir(projectRootDir, dstNode, true);
  const dstJson = await _internal.readComponentJson(dstDir);
  const parentDir = path.dirname(dstDir);
  const parentJson = await _internal.readComponentJson(parentDir);
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
  const p = _internal.writeComponentJson(projectRootDir, parentDir, parentJson);

  const dstInputFile = dstJson.inputFiles.find((e)=>{
    return e.name === dstName;
  });
  if (typeof dstInputFile === "undefined") {
    dstJson.inputFiles.push({ name: dstName, src: [{ srcNode: parentID, srcName }] });
  } else if (!dstInputFile.src.includes({ srcNode: parentID, srcName })) {
    dstInputFile.src.push({ srcNode: parentID, srcName });
  }
  await p;
  return _internal.writeComponentJson(projectRootDir, dstDir, dstJson);
}
_internal.addFileLinkFromParent = addFileLinkFromParent;

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
  const srcDir = await _internal.getComponentDir(projectRootDir, srcNode, true);
  const srcJson = await _internal.readComponentJson(srcDir);
  const srcOutputFile = srcJson.outputFiles.find((e)=>{
    return e.name === srcName;
  });
  if (!srcOutputFile.dst.includes({ dstNode, dstName })) {
    srcOutputFile.dst.push({ dstNode, dstName });
  }
  const p1 = _internal.writeComponentJson(projectRootDir, srcDir, srcJson);

  const dstDir = await _internal.getComponentDir(projectRootDir, dstNode, true);
  const dstJson = await _internal.readComponentJson(dstDir);
  const dstInputFile = dstJson.inputFiles.find((e)=>{
    return e.name === dstName;
  });
  if (typeof dstInputFile === "undefined") {
    dstJson.inputFiles.push({ name: dstName, src: [{ srcNode, srcName }] });
  } else if (!dstInputFile.src.includes({ srcNode, srcName })) {
    dstInputFile.src.push({ srcNode, srcName });
  }
  await p1;
  return _internal.writeComponentJson(projectRootDir, dstDir, dstJson);
}
_internal.addFileLinkBetweenSiblings = addFileLinkBetweenSiblings;

/**
 * remove filelink to parent component
 * @param {string} projectRootDir - project's root path
 * @param {string} srcNode - src component ID
 * @param {string} srcName - outputFile name
 * @param {string} dstName - inputFile name
 * @returns {Promise} - resolved when all component JSON files are writted
 */
async function removeFileLinkToParent(projectRootDir, srcNode, srcName, dstName) {
  const srcDir = await _internal.getComponentDir(projectRootDir, srcNode, true);
  const srcJson = await _internal.readComponentJson(srcDir);
  const parentDir = path.dirname(srcDir);
  const parentJson = await _internal.readComponentJson(parentDir);

  const srcOutputFile = srcJson.outputFiles.find((e)=>{
    return e.name === srcName;
  });
  srcOutputFile.dst = srcOutputFile.dst.filter((e)=>{
    return e.dstNode !== parentJson.ID || e.dstName !== dstName;
  });
  const p = _internal.writeComponentJson(projectRootDir, srcDir, srcJson);

  const parentOutputFile = parentJson.outputFiles.find((e)=>{
    return e.name === dstName;
  });
  if (Object.prototype.hasOwnProperty.call(parentOutputFile, "origin")) {
    parentOutputFile.origin = parentOutputFile.origin.filter((e)=>{
      return e.srcNode !== srcNode || e.srcName !== srcName;
    });
  }

  await p;
  return _internal.writeComponentJson(projectRootDir, parentDir, parentJson);
}
_internal.removeFileLinkToParent = removeFileLinkToParent;

/**
 * remove filelink from parent component
 * @param {string} projectRootDir - project's root path
 * @param {string} srcName - outputFile name
 * @param {string} dstNode - destination component ID
 * @param {string} dstName - inputFile name
 * @returns {Promise} - resolved when all component JSON files are writted
 */
async function removeFileLinkFromParent(projectRootDir, srcName, dstNode, dstName) {
  const dstDir = await _internal.getComponentDir(projectRootDir, dstNode, true);
  const dstJson = await _internal.readComponentJson(dstDir);
  const parentDir = path.dirname(dstDir);
  const parentJson = await _internal.readComponentJson(parentDir);
  const parentID = parentJson.ID;

  const parentInputFile = parentJson.inputFiles.find((e)=>{
    return e.name === srcName;
  });
  if (Object.prototype.hasOwnProperty.call(parentInputFile, "forwardTo")) {
    parentInputFile.forwardTo = parentInputFile.forwardTo.filter((e)=>{
      return e.dstNode !== dstNode || e.dstName !== dstName;
    });
  }
  const p = _internal.writeComponentJson(projectRootDir, parentDir, parentJson);

  const dstInputFile = dstJson.inputFiles.find((e)=>{
    return e.name === dstName;
  });
  dstInputFile.src = dstInputFile.src.filter((e)=>{
    return e.srcNode !== parentID || e.srcName !== srcName;
  });
  await p;
  return _internal.writeComponentJson(projectRootDir, dstDir, dstJson);
}
_internal.removeFileLinkFromParent = removeFileLinkFromParent;

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
  const srcDir = await _internal.getComponentDir(projectRootDir, srcNode, true);
  const srcJson = await _internal.readComponentJson(srcDir);
  const srcOutputFile = srcJson.outputFiles.find((e)=>{
    return e.name === srcName;
  });
  srcOutputFile.dst = srcOutputFile.dst.filter((e)=>{
    return !(e.dstNode === dstNode && e.dstName === dstName);
  });
  const p = _internal.writeComponentJson(projectRootDir, srcDir, srcJson);

  const dstDir = await _internal.getComponentDir(projectRootDir, dstNode, true);
  const dstJson = await _internal.readComponentJson(dstDir);
  const dstInputFile = dstJson.inputFiles.find((e)=>{
    return e.name === dstName;
  });
  dstInputFile.src = dstInputFile.src.filter((e)=>{
    return !(e.srcNode === srcNode && e.srcName === srcName);
  });
  await p;
  return _internal.writeComponentJson(projectRootDir, dstDir, dstJson);
}
_internal.removeFileLinkBetweenSiblings = removeFileLinkBetweenSiblings;

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
  while (await _internal.fs.pathExists(basename + suffix)) {
    ++suffix;
  }

  const dirname = basename + suffix;
  await _internal.fs.mkdir(dirname);
  return dirname;
}
_internal.makeDir = makeDir;

/**
 * get array of child components
 * @param {string} projectRootDir - project's root path
 * @param {string} parentID - parent component's ID or directory path
 * @param {boolean} isParentDir - if true, parentID is regard as path to parent directory, not ID string
 * @returns {object[]} - array of child components except for subComponent
 */
async function getChildren(projectRootDir, parentID, isParentDir) {
  const dir = isParentDir ? parentID : parentID === null ? projectRootDir : await _internal.getComponentDir(projectRootDir, parentID, true);
  if (!dir) {
    return [];
  }

  const children = await _internal.promisify(glob)(path.join(dir, "*", componentJsonFilename));
  if (children.length === 0) {
    return [];
  }

  const rt = await Promise.all(children.map((e)=>{
    return _internal.readJsonGreedy(e);
  }));

  return rt.filter((e)=>{
    return !e.subComponent;
  });
}
_internal.getChildren = getChildren;

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
  const ssh = _internal.getSsh(projectRootDir, remotehostID);
  const rt = await ssh.exec(`test -w ${storagePath}`);
  if (rt !== 0) {
    const err = new Error("bad permission");
    err.host = host;
    err.storagePath = storagePath;
    err.reason = "invalidRemoteStorage";
    throw err;
  }
  return Promise.resolve();
}
_internal.checkRemoteStoragePathWritePermission = checkRemoteStoragePathWritePermission;

/**
 * get host value recursively
 * @param {string} projectRootDir - project's root path
 * @param {string} parentID - comopnent ID for current serch
 * @param {string[]} hosts - hosts set to task component
 * @param {string[]} storageHosts - hosts set to storage component
 * @returns {Promise} - resolved if serch under parentID is done
 */
_internal.recursiveGetHosts = async function (projectRootDir, parentID, hosts, storageHosts, gfarmHosts) {
  const promises = [];
  const children = await _internal.getChildren(projectRootDir, parentID);

  for (const component of children) {
    if (component.disable) {
      continue;
    }
    if (component.host === "localhost") {
      continue;
    }
    if (["task", "stepjob", "bulkjobTask"].includes(component.type)) {
      hosts.push({ hostname: component.host });
    } else if (["hpciss", "hpcisstar"].includes(component.type)) {
      gfarmHosts.push({ hostname: component.host, isGfarm: true });
    } else if (component.type === "storage") {
      storageHosts.push({ hostname: component.host, isStorage: true });
    }
    if (hasChild(component)) {
      promises.push(_internal.recursiveGetHosts(projectRootDir, component.ID, hosts, storageHosts, gfarmHosts));
    }
  }
  return Promise.all(promises);
};

/**
 * read component Json recursively and pick up remote hosts used in task component
 * @param {string} projectRootDir - project's root path
 * @param {string | null} rootID - ID of the component to start travarsal. start from project root if rootID is null
 * @returns {object[]} - exclusive array of hosts
 */
async function getHosts(projectRootDir, rootID) {
  const hosts = [];
  const storageHosts = [];
  const gfarmHosts = [];
  await _internal.recursiveGetHosts(projectRootDir, rootID, hosts, storageHosts, gfarmHosts);

  const storageHosts2 = Array.from(new Set(storageHosts));
  const gfarmHosts2 = Array.from(new Set(gfarmHosts));
  const keepHosts = storageHosts2.concat(gfarmHosts2);

  const hosts2 = Array.from(new Set(hosts))
    .filter((host)=>{
      return !keepHosts.some((e)=>{
        e.hostname === host.hostname;
      });
    });
  return [...keepHosts, ...hosts2];
}
_internal.getHosts = getHosts;

/**
 * create new component in parentDir
 * @param {string} projectRootDir - project's root path
 * @param {string} parentDir - parent component's directory path
 * @param {string} type - component type
 * @param {object} pos - component's cordinate in browser
 * @returns {object} component
 */
_internal.createNewComponent = async function (projectRootDir, parentDir, type, pos) {
  const parentJson = await _internal.readJsonGreedy(path.resolve(parentDir, componentJsonFilename));
  const parentID = parentJson.ID;
  const componentBasename = getComponentDefaultName(type);

  //create component directory and Json file
  const absDirName = await _internal.makeDir(path.resolve(parentDir, componentBasename), 0);
  const newComponent = _internal.componentFactory(type, pos, parentID);
  newComponent.name = path.basename(absDirName);
  await _internal.writeComponentJson(projectRootDir, absDirName, newComponent);
  await _internal.updateComponentPath(projectRootDir, newComponent.ID, absDirName);
  if (type === "PS") {
    const PSConfigFilename = path.resolve(absDirName, defaultPSconfigFilename);
    await _internal.writeJsonWrapper(PSConfigFilename, { version: 2, targetFiles: [], params: [], scatter: [], gather: [] });
    await _internal.gitAdd(projectRootDir, PSConfigFilename);
  }
  return newComponent;
};

/**
 * perform git mv and update component path in projectJson file
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - ID of component to be renamed
 * @param {string} newName - new name
 * @returns {Promise} - resolved when rename is done
 */
_internal.renameComponentDir = async function (projectRootDir, ID, newName) {
  if (!_internal.isValidName(newName)) {
    return Promise.reject(new Error(`${newName} is not valid component name`));
  }
  const oldDir = await _internal.getComponentDir(projectRootDir, ID, true);
  if (oldDir === projectRootDir) {
    return Promise.reject(new Error("updateNode can not rename root workflow"));
  }
  if (path.basename(oldDir) === newName) {
    //nothing to be done when you attempt to rename to the same name
    return true;
  }
  const newDir = path.resolve(path.dirname(oldDir), newName);
  await _internal.gitRm(projectRootDir, oldDir);
  await _internal.fs.move(oldDir, newDir);
  await _internal.gitAdd(projectRootDir, newDir);
  return _internal.updateComponentPath(projectRootDir, ID, newDir);
};

/**
 * replace component's env value
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - component ID
 * @param {object} newEnv - key-value object of environment variable
 * @returns {object} - updated componentJSON
 */
_internal.replaceEnv = async function (projectRootDir, ID, newEnv) {
  const componentJson = await _internal.readComponentJsonByID(projectRootDir, ID);
  const env = componentJson.env || {};
  const patch = _internal.diff(env, newEnv);
  _internal.diffApply(env, patch);
  componentJson.env = env;
  await _internal.writeComponentJsonByID(projectRootDir, ID, componentJson);
  return componentJson;
};

/**
 * replace webhook setting on project meta data
 * @param {string} projectRootDir - project's root path
 * @param {object} newWebhook - new webhook setting
 * @returns {object} - updated webhook setting
 */
async function replaceWebhook(projectRootDir, newWebhook) {
  const projectJson = await _internal.getProjectJson(projectRootDir);
  const { webhook } = projectJson;
  if (typeof webhook === "undefined") {
    projectJson.webhook = newWebhook;
  } else {
    const patch = _internal.diff(webhook, newWebhook);
    _internal.diffApply(webhook, patch);
  }
  await _internal.writeProjectJson(projectRootDir, projectJson);
  return webhook;
}
_internal.replaceWebhook = replaceWebhook;

/**
 * get env setting on component
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - component ID
 * @returns {object} -
 */
async function getEnv(projectRootDir, ID) {
  const componentJson = await _internal.readComponentJsonByID(projectRootDir, ID);
  const env = componentJson.env || {};
  return env;
}
_internal.getEnv = getEnv;

/**
 * update component property (used only in test)
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - component ID
 * @param {string} prop - property to be updated
 * @param {string} value - new value
 * @returns {object} - updated component meta data
 */
_internal.updateComponent = async function (projectRootDir, ID, prop, value) {
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
    await _internal.setUploadOndemandOutputFile(projectRootDir, ID);
  }
  if (prop === "name") {
    await _internal.renameComponentDir(projectRootDir, ID, value);
  }
  const componentJson = await _internal.readComponentJsonByID(projectRootDir, ID);
  componentJson[prop] = value;
  await _internal.writeComponentJsonByID(projectRootDir, ID, componentJson);
  return componentJson;
};

/**
 * update stepnumber all stepjobTask component in project
 * @param {string} projectRootDir - project's root path
 * @returns {Promise} - resolved when update is done
 */
_internal.updateStepNumber = async function (projectRootDir) {
  const componentIDs = await _internal.getAllComponentIDs(projectRootDir);
  const stepjobTaskComponentJson = [];
  const stepjobComponentIDs = [];
  const stepjobGroup = [];
  //get stepjob, stepjobTask
  for (const id of componentIDs) {
    const componentDir = await _internal.getComponentDir(projectRootDir, id, true);
    const componentJson = await _internal.readComponentJson(componentDir);
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
  const arrangedComponents = await _internal.arrangeComponent(stepjobGroup);
  let stepnum = 0;
  const prop = "stepnum";
  const p = [];
  for (const componentJson of arrangedComponents) {
    componentJson[prop] = stepnum;
    const componentDir = await _internal.getComponentDir(projectRootDir, componentJson.ID, true);
    p.push(_internal.writeComponentJson(projectRootDir, componentDir, componentJson));
    stepnum++;
  }
  return Promise.all(p);
};

/**
 * arrange next/previous setting of stepjobTask
 * @param {object[]} stepjobGroupArray - array of stepjob components
 * @returns {object[]} - updated stepjob components
 */
_internal.arrangeComponent = async function (stepjobGroupArray) {
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
};

/**
 * add inputFile to component
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - component ID
 * @param {string} name - inputfile's name
 * @returns {Promise} - resolved when update is done
 */
_internal.addInputFile = async function (projectRootDir, ID, name) {
  if (!_internal.isValidInputFilename(name)) {
    return Promise.reject(new Error(`${name} is not valid inputFile name`));
  }
  const componentDir = await _internal.getComponentDir(projectRootDir, ID, true);
  const componentJson = await _internal.readComponentJson(componentDir);
  if (!Object.prototype.hasOwnProperty.call(componentJson, "inputFiles")) {
    const err = new Error(`${componentJson.name} does not have inputFiles`);
    err.component = componentJson;
    return Promise.reject(err);
  }
  componentJson.inputFiles.push({ name, src: [] });
  return _internal.writeComponentJson(projectRootDir, componentDir, componentJson);
};

/**
 * add outputFile to component
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - component ID
 * @param {string} name - inputfile's name
 * @returns {Promise} - resolved when update is done
 */
_internal.addOutputFile = async function (projectRootDir, ID, name) {
  if (!_internal.isValidOutputFilename(name)) {
    return Promise.reject(new Error(`${name} is not valid outputFile name`));
  }
  const componentDir = await _internal.getComponentDir(projectRootDir, ID, true);
  const componentJson = await _internal.readComponentJson(componentDir);
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
  return _internal.writeComponentJson(projectRootDir, componentDir, componentJson);
};

/**
 * set on-demand uploaded filename to outputFile
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - component ID
 * @returns {Promise} - resolved when update is done
 */
_internal.setUploadOndemandOutputFile = async function (projectRootDir, ID) {
  const componentDir = await _internal.getComponentDir(projectRootDir, ID, true);
  const componentJson = await _internal.readComponentJson(componentDir);
  if (!Object.prototype.hasOwnProperty.call(componentJson, "outputFiles")) {
    const err = new Error(`${componentJson.name} does not have outputFiles`);
    err.component = componentJson;
    return Promise.reject(err);
  }
  if (componentJson.outputFiles.length === 0) {
    return _internal.addOutputFile(projectRootDir, ID, "UPLOAD_ONDEMAND");
  }
  if (componentJson.outputFiles.length > 1) {
    const p = [];
    for (let i = 1; i < componentJson.outputFiles.length; i++) {
      const counterparts = new Set();
      for (const dst of componentJson.outputFiles[i].dst) {
        counterparts.add(dst);
      }
      for (const counterPart of counterparts) {
        p.push(_internal.removeFileLink(projectRootDir, ID, componentJson.outputFiles[i].name, counterPart.dstNode, counterPart.dstName));
      }
    }
    await Promise.all(p);
    componentJson.outputFiles.splice(1, componentJson.outputFiles.length - 1);
  }

  return _internal.renameOutputFile(projectRootDir, ID, 0, "UPLOAD_ONDEMAND");
};

async function removeInputFile(projectRootDir, ID, name) {
  const counterparts = new Set();
  const componentDir = await _internal.getComponentDir(projectRootDir, ID, true);
  const componentJson = await _internal.readComponentJson(componentDir);
  componentJson.inputFiles.forEach((inputFile)=>{
    if (name === inputFile.name) {
      for (const src of inputFile.src) {
        counterparts.add(src);
      }
    }
  });

  for (const counterPart of counterparts) {
    await _internal.removeFileLink(projectRootDir, counterPart.srcNode, counterPart.srcName, ID, name);
  }

  componentJson.inputFiles = componentJson.inputFiles.filter((inputFile)=>{
    return name !== inputFile.name;
  });
  return _internal.writeComponentJson(projectRootDir, componentDir, componentJson);
}
_internal.removeInputFile = removeInputFile;

async function removeOutputFile(projectRootDir, ID, name) {
  const counterparts = new Set();
  const componentDir = await _internal.getComponentDir(projectRootDir, ID, true);
  const componentJson = await _internal.readComponentJson(componentDir);

  componentJson.outputFiles = componentJson.outputFiles.filter((outputFile)=>{
    if (name !== outputFile.name) {
      return true;
    }
    for (const dst of outputFile.dst) {
      counterparts.add(dst);
    }
    return false;
  });

  for (const counterPart of counterparts) {
    await _internal.removeFileLink(projectRootDir, ID, name, counterPart.dstNode, counterPart.dstName);
  }
  return _internal.writeComponentJson(projectRootDir, componentDir, componentJson);
}
_internal.removeOutputFile = removeOutputFile;

async function renameInputFile(projectRootDir, ID, index, newName) {
  if (!_internal.isValidInputFilename(newName)) {
    return Promise.reject(new Error(`${newName} is not valid inputFile name`));
  }
  const componentDir = await _internal.getComponentDir(projectRootDir, ID, true);
  const componentJson = await _internal.readComponentJson(componentDir);
  if (index < 0 || componentJson.inputFiles.length - 1 < index) {
    return Promise.reject(new Error(`invalid index ${index}`));
  }

  const counterparts = new Set();
  const oldName = componentJson.inputFiles[index].name;
  componentJson.inputFiles[index].name = newName;
  componentJson.inputFiles[index].src.forEach((e)=>{
    counterparts.add(e.srcNode);
  });
  await _internal.writeComponentJson(projectRootDir, componentDir, componentJson);

  const p = [];
  for (const counterPartID of counterparts) {
    const counterpartDir = await _internal.getComponentDir(projectRootDir, counterPartID, true);
    const counterpartJson = await _internal.readComponentJson(counterpartDir);
    for (const outputFile of counterpartJson.outputFiles) {
      for (const dst of outputFile.dst) {
        if (dst.dstNode === ID && dst.dstName === oldName) {
          dst.dstName = newName;
        }
      }
    }
    if (Array.isArray(counterpartJson.inputFiles)) {
      for (const inputFile of counterpartJson.inputFiles) {
        if (Object.prototype.hasOwnProperty.call(inputFile, "forwardTo")) {
          for (const dst of inputFile.forwardTo) {
            if (dst.dstNode === ID && dst.dstName === oldName) {
              dst.dstName = newName;
            }
          }
        }
      }
    }
    p.push(_internal.writeComponentJson(projectRootDir, counterpartDir, counterpartJson));
  }
  return Promise.all(p);
}
_internal.renameInputFile = renameInputFile;

/**
 * rename outputFile
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - component ID
 * @param {number} index - index number of outputFile to be renamed
 * @param {string} newName - new outputFile name
 * @returns {Promise} - resolved when update is done
 */
_internal.renameOutputFile = async function (projectRootDir, ID, index, newName) {
  if (!_internal.isValidOutputFilename(newName)) {
    return Promise.reject(new Error(`${newName} is not valid outputFile name`));
  }
  const componentDir = await _internal.getComponentDir(projectRootDir, ID, true);
  const componentJson = await _internal.readComponentJson(componentDir);
  if (index < 0 || componentJson.outputFiles.length - 1 < index) {
    return Promise.reject(new Error(`invalid index ${index}`));
  }

  const counterparts = new Set();
  const oldName = componentJson.outputFiles[index].name;
  componentJson.outputFiles[index].name = newName;
  componentJson.outputFiles[index].dst.forEach((e)=>{
    counterparts.add(e.dstNode);
  });
  await _internal.writeComponentJson(projectRootDir, componentDir, componentJson);

  const promises = [];
  for (const counterPartID of counterparts) {
    const counterpartDir = await _internal.getComponentDir(projectRootDir, counterPartID, true);
    const counterpartJson = await _internal.readComponentJson(counterpartDir);
    for (const inputFile of counterpartJson.inputFiles) {
      for (const src of inputFile.src) {
        if (src.srcNode === ID && src.srcName === oldName) {
          src.srcName = newName;
        }
      }
    }
    if (Array.isArray(counterpartJson.outputFiles)) {
      for (const outputFile of counterpartJson.outputFiles) {
        if (Object.prototype.hasOwnProperty.call(outputFile, "origin")) {
          for (const src of outputFile.origin) {
            if (src.srcNode === ID && src.srcName === oldName) {
              src.srcName = newName;
            }
          }
        }
      }
    }
    promises.push(_internal.writeComponentJson(projectRootDir, counterpartDir, counterpartJson));
  }
  return Promise.all(promises);
};

/**
 * add link between 2 components
 * @param {string} projectRootDir - project's root path
 * @param {string} src - src component ID
 * @param {string} dst - destination component ID
 * @param {boolean} isElse - connect to else connector
 * @returns {Promise} - reject if link is not allowd. resolved after updated
 */
_internal.addLink = async function (projectRootDir, src, dst, isElse = false) {
  if (src === dst) {
    return Promise.reject(new Error("cyclic link is not allowed"));
  }
  const srcDir = await _internal.getComponentDir(projectRootDir, src, true);
  const srcJson = await _internal.readComponentJson(srcDir);
  const dstDir = await _internal.getComponentDir(projectRootDir, dst, true);
  const dstJson = await _internal.readComponentJson(dstDir);
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
  await _internal.writeComponentJson(projectRootDir, srcDir, srcJson);
  if (!dstJson.previous.includes(src)) {
    dstJson.previous.push(src);
  }
  await _internal.writeComponentJson(projectRootDir, dstDir, dstJson);
  if (srcJson.type === "stepjobTask" && dstJson.type === "stepjobTask") {
    await _internal.updateStepNumber(projectRootDir);
  }
};

/**
 * remove link between 2 components
 * @param {string} projectRootDir - project's root path
 * @param {string} src - src component ID
 * @param {string} dst - destination component ID
 * @param {boolean} isElse - connect to else connector
 * @returns {Promise} - resolved after updated
 */
_internal.removeLink = async function (projectRootDir, src, dst, isElse) {
  const srcDir = await _internal.getComponentDir(projectRootDir, src, true);
  const srcJson = await _internal.readComponentJson(srcDir);
  if (isElse) {
    srcJson.else = srcJson.else.filter((e)=>{
      return e !== dst;
    });
  } else {
    srcJson.next = srcJson.next.filter((e)=>{
      return e !== dst;
    });
  }
  await _internal.writeComponentJson(projectRootDir, srcDir, srcJson);

  const dstDir = await _internal.getComponentDir(projectRootDir, dst, true);
  const dstJson = await _internal.readComponentJson(dstDir);
  dstJson.previous = dstJson.previous.filter((e)=>{
    return e !== src;
  });
  await _internal.writeComponentJson(projectRootDir, dstDir, dstJson);
};

/**
 * remove all link from specified component
 * @param {string} projectRootDir - project's root path
 * @param {string} componentID - component's ID string
 */
_internal.removeAllLink = async function (projectRootDir, componentID) {
  const dstDir = await _internal.getComponentDir(projectRootDir, componentID, true);
  const dstJson = await _internal.readComponentJson(dstDir);

  const srcComponents = dstJson.previous;
  const p = [];

  for (const src of srcComponents) {
    const srcDir = await _internal.getComponentDir(projectRootDir, src, true);
    const srcJson = await _internal.readComponentJson(srcDir);
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
    p.push(_internal.writeComponentJson(projectRootDir, srcDir, srcJson));
  }

  dstJson.previous = [];
  p.push(_internal.writeComponentJson(projectRootDir, dstDir, dstJson));
  return Promise.all(p);
};

/**
 * add file link between 2 components
 * @param {string} projectRootDir - project's root path
 * @param {string} srcNode - src component ID
 * @param {string} srcName - outputFile name
 * @param {string} dstNode - destination component ID
 * @param {string} dstName - inputFile name
 * @returns {Promise} - resolved after updated
 */
_internal.addFileLink = async function (projectRootDir, srcNode, srcName, dstNode, dstName) {
  if (srcNode === dstNode) {
    return Promise.reject(new Error("cyclic link is not allowed"));
  }
  if (await _internal.isParent(projectRootDir, dstNode, srcNode)) {
    return _internal.addFileLinkToParent(projectRootDir, srcNode, srcName, dstName);
  }
  if (await _internal.isParent(projectRootDir, srcNode, dstNode)) {
    return _internal.addFileLinkFromParent(projectRootDir, srcName, dstNode, dstName);
  }
  return _internal.addFileLinkBetweenSiblings(projectRootDir, srcNode, srcName, dstNode, dstName);
};

/**
 * remove filelink between 2 components
 * @param {string} projectRootDir - project's root path
 * @param {string} srcNode - src component ID
 * @param {string} srcName - outputFile name
 * @param {string} dstNode - destination component ID
 * @param {string} dstName - inputFile name
 * @returns {Promise} - resolved after updated
 */
_internal.removeFileLink = async function (projectRootDir, srcNode, srcName, dstNode, dstName) {
  if (await _internal.isParent(projectRootDir, dstNode, srcNode)) {
    return _internal.removeFileLinkToParent(projectRootDir, srcNode, srcName, dstName);
  }
  if (await _internal.isParent(projectRootDir, srcNode, dstNode)) {
    return _internal.removeFileLinkFromParent(projectRootDir, srcName, dstNode, dstName);
  }
  return _internal.removeFileLinkBetweenSiblings(projectRootDir, srcNode, srcName, dstNode, dstName);
};

/**
 * remove all filelink on the inputFile
 * @param {string} projectRootDir - project's root path
 * @param {string} componentID - ID of component which has filelink to be removed
 * @param {string} inputFilename - inputFile which has filelink to be removed
 * @param {boolean} fromChildren - if true, remove filelink from children
 * @returns {Promise} - resolved after updated
 */
async function removeAllFileLink(projectRootDir, componentID, inputFilename, fromChildren) {
  const targetDir = await _internal.getComponentDir(projectRootDir, componentID, true);
  const componentJson = await _internal.readComponentJson(targetDir);
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
      p.push(_internal.removeFileLinkToParent(projectRootDir, srcNode, srcName, inputFilename));
    }
  } else {
    const inputFile = componentJson.inputFiles.find((e)=>{
      return e.name === inputFilename;
    });
    if (!inputFile) {
      return new Error(`${inputFilename} not found in inputFiles`);
    }
    for (const { srcNode, srcName } of inputFile.src) {
      p.push(_internal.removeFileLinkBetweenSiblings(projectRootDir, srcNode, srcName, componentID, inputFilename));
    }
  }
  return Promise.all(p);
}
_internal.removeAllFileLink = removeAllFileLink;

/**
 * remove component
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - ID of component to be removed
 * @returns {Promise} - resolved after updated
 */
_internal.removeComponent = async function (projectRootDir, ID) {
  const targetDir = await _internal.getComponentDir(projectRootDir, ID, true);
  const descendantsIDs = await _internal.getDescendantsIDs(projectRootDir, ID);
  //remove all link/filelink to or from components to be removed
  for (const descendantID of descendantsIDs) {
    await _internal.removeAllLinkFromComponent(projectRootDir, descendantID);
  }
  //gitOperator.rm() only remove existing files from git repo if directory is passed
  //so, gitRm and fs.remove must be called in this order
  await _internal.gitRm(projectRootDir, targetDir);
  await _internal.fs.remove(targetDir);
  return _internal.removeComponentPath(projectRootDir, descendantsIDs);
};

/**
 * get all srouce components in project
 * @param {string} projectRootDir - project's root path
 * @returns {object[]} - array of source component
 */
_internal.getSourceComponents = async function (projectRootDir) {
  const componentJsonFiles = await _internal.promisify(glob)(path.join(projectRootDir, "**", componentJsonFilename));
  const components = await Promise.all(componentJsonFiles
    .map((componentJsonFile)=>{
      return _internal.readJsonGreedy(componentJsonFile);
    }));

  return components.filter((componentJson)=>{
    return componentJson.type === "source" && !componentJson.subComponent && !componentJson.disable;
  });
};

/**
 * determin specified path is componennt dir or not
 * @param {string} target - directory path
 * @returns {boolean} - whether given path is component directory or not
 */
_internal.isComponentDir = async function (target) {
  const stats = await _internal.fs.lstat(path.resolve(target));
  if (!stats.isDirectory()) {
    return false;
  }
  return _internal.fs.pathExists(path.resolve(target, componentJsonFilename));
};

/**
 * read all component json file under specified directory
 * @param {string} projectRootDir - project's root path
 * @param {string} rootDir - start point of directory search
 * @returns {object} - integrated component json data
 */
_internal.getComponentTree = async function (projectRootDir, rootDir) {
  const projectJson = await _internal.readJsonGreedy(path.resolve(projectRootDir, projectJsonFilename));
  const start = path.isAbsolute(rootDir) ? path.relative(projectRootDir, rootDir) || "./" : rootDir;
  const componentJsonFileList = Object.values(projectJson.componentPath)
    .filter((dirname)=>{
      return isPathInside(dirname, start) || path.normalize(dirname) === path.normalize(start);
    })
    .map((dirname)=>{
      return path.join(dirname, componentJsonFilename);
    });
  const componentJsonList = await Promise.all(componentJsonFileList.map((target)=>{
    return _internal.readJsonGreedy(path.resolve(projectRootDir, target));
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
};

module.exports = {
  createNewProject: _internal.createNewProject,
  updateComponentPath: _internal.updateComponentPath,
  getComponentFullName: _internal.getComponentFullName,
  setProjectState: _internal.setProjectState,
  getProjectState: _internal.getProjectState,
  checkRunningJobs: _internal.checkRunningJobs,
  readProject: _internal.readProject,
  updateProjectROStatus: _internal.updateProjectROStatus,
  updateProjectDescription: _internal.updateProjectDescription,
  getProjectJson: _internal.getProjectJson,
  addProject: _internal.addProject,
  renameProject: _internal.renameProject,
  setComponentStateR: _internal.setComponentStateR,
  getHosts: _internal.getHosts,
  checkRemoteStoragePathWritePermission: _internal.checkRemoteStoragePathWritePermission,
  getSourceComponents: _internal.getSourceComponents,
  getChildren: _internal.getChildren,
  updateComponent: _internal.updateComponent,
  addInputFile: _internal.addInputFile,
  addOutputFile: _internal.addOutputFile,
  removeInputFile: _internal.removeInputFile,
  removeOutputFile: _internal.removeOutputFile,
  renameInputFile: _internal.renameInputFile,
  renameOutputFile: _internal.renameOutputFile,
  addLink: _internal.addLink,
  addFileLink: _internal.addFileLink,
  removeLink: _internal.removeLink,
  removeAllLink: _internal.removeAllLink,
  removeFileLink: _internal.removeFileLink,
  removeAllFileLink: _internal.removeAllFileLink,
  getEnv: _internal.getEnv,
  replaceEnv: _internal.replaceEnv,
  replaceWebhook: _internal.replaceWebhook,
  removeComponent: _internal.removeComponent,
  isComponentDir: _internal.isComponentDir,
  getComponentTree: _internal.getComponentTree,
  isLocal: _internal.isLocal,
  isSameRemoteHost: _internal.isSameRemoteHost,
  isSurrounded: _internal.isSurrounded,
  trimSurrounded: _internal.trimSurrounded,
  glob2Array: _internal.glob2Array,
  removeTrailingPathSep: _internal.removeTrailingPathSep,
  writeProjectJson: _internal.writeProjectJson,
  getDescendantsIDs: _internal.getDescendantsIDs,
  getAllComponentIDs: _internal.getAllComponentIDs,
  getSuffixNumberFromProjectName: _internal.getSuffixNumberFromProjectName,
  getUnusedProjectDir: _internal.getUnusedProjectDir,
  removeComponentPath: _internal.removeComponentPath,
  arrangeComponent: _internal.arrangeComponent,
  isDefaultPort: _internal.isDefaultPort,
  isParent: _internal.isParent,
  removeAllLinkFromComponent: _internal.removeAllLinkFromComponent,
  addFileLinkToParent: _internal.addFileLinkToParent,
  addFileLinkFromParent: _internal.addFileLinkFromParent,
  addFileLinkBetweenSiblings: _internal.addFileLinkBetweenSiblings,
  removeFileLinkToParent: _internal.removeFileLinkToParent,
  removeFileLinkFromParent: _internal.removeFileLinkFromParent,
  removeFileLinkBetweenSiblings: _internal.removeFileLinkBetweenSiblings,
  makeDir: _internal.makeDir,
  recursiveGetHosts: _internal.recursiveGetHosts,
  setUploadOndemandOutputFile: _internal.setUploadOndemandOutputFile,
  updateStepNumber: _internal.updateStepNumber,
  rewriteIncludeExclude: _internal.rewriteIncludeExclude,
  rewriteAllIncludeExcludeProperty: _internal.rewriteAllIncludeExcludeProperty,
  gitInit: _internal.gitInit,
  gitCommit: _internal.gitCommit,
  gitRm: _internal.gitRm,
  createNewComponent: _internal.createNewComponent,
  renameComponentDir: _internal.renameComponentDir
};

if (process.env.NODE_ENV === "test") {
  module.exports._internal = _internal;
}
