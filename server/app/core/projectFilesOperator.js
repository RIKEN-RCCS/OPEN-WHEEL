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
const uuid = require("uuid");
const glob = require("glob");
const { componentFactory, getComponentDefaultName } = require("./workflowComponent");
const { projectList, defaultCleanupRemoteRoot, projectJsonFilename, componentJsonFilename, jobManagerJsonFilename, suffix, remoteHost, jobScheduler, defaultPSconfigFilename  } = require("../db/db");
const { getDateString, writeJsonWrapper, isValidName, isValidInputFilename, isValidOutputFilename } = require("../lib/utility");
const { replacePathsep, convertPathSep } = require("./pathUtils");
const { readJsonGreedy } = require("./fileUtils");
const { gitInit, gitAdd, gitCommit, gitResetHEAD, gitClean, gitRm} = require("./gitOperator2");
const { hasChild, isInitialComponent } = require("./workflowComponent");
const { getLogger } = require("../logSettings");

const { diff } = require("just-diff");
const { diffApply } = require("just-diff-apply");


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
 * @param {string} projectRootDir - project projectRootDir's absolute path
 * @returns {Object} - project JSON data
 */
async function getProjectJson(projectRootDir) {
  return readJsonGreedy(path.resolve(projectRootDir, projectJsonFilename));
}

/**
 * write project Json
 * @param {string} projectRootDir - project projectRootDir's absolute path
 * @param {Object} projectJSON - project JSON data
 */
async function writeProjectJson(projectRootDir, projectJson){
  const filename=path.resolve(projectRootDir,projectJsonFilename)
  await writeJsonWrapper(filename, projectJson);
  return gitAdd(projectRootDir, filename);
}

/**
 * read component JSON file and return children's ID
 * @param {string} projectRootDir - project projectRootDir's absolute path
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
 * @param {string} projectRootDir - project projectRootDir's absolute path
 * @returns {string[]} - array of id string
 */
async function getAllComponentIDs(projectRootDir) {
  const filename = path.resolve(projectRootDir, projectJsonFilename);
  const projectJson = await readJsonGreedy(filename);
  return Object.keys(projectJson.componentPath);
}

function getSuffixNumberFromProjectName(projectName) {
  const reResult = /.*(\d+)$/.exec(projectName);
  return reResult === null ? 0 : reResult[1];
}

/**
 * return unused projectRootDir
 * @param {string} projectRootDir - desired projectRootDir
 * @param {string} projectName - project name without suffix
 * @return {string} - absolute path of project root directory
 */
async function getUnusedProjectDir(projectRootDir, projectName) {
  if (!await fs.pathExists(projectRootDir)) {
    return projectRootDir;
  }

  const dirname = path.dirname(projectRootDir);
  let projectRootDirCandidate=path.resolve(dirname, `${projectName}${suffix}`)
  if(!await fs.pathExists(projectRootDirCandidate)) {
    return projectRootDirCandidate
  }

  let suffixNumber = getSuffixNumberFromProjectName(projectName);
  projectRootDirCandidate=path.resolve(dirname, `${projectName}${suffixNumber}${suffix}`)

  while (await fs.pathExists(projectRootDirCandidate)) {
    ++suffixNumber;
    projectRootDirCandidate=path.resolve(dirname, `${projectName}${suffixNumber}${suffix}`)
  }
  return projectRootDirCandidate
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
  await writeComponentJson(projectRootDir, projectRootDir, rootWorkflow)

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
  await writeJsonWrapper(projectJsonFileFullpath, projectJson)
  await gitAdd(projectRootDir, "./");
  await gitCommit(projectRootDir, "create new project");
  return projectRootDir
}

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
  await writeJsonWrapper(filename, projectJson)
  return gitAdd(projectRootDir, filename);
}

/**
 * update component path-id map
 * @param {string} projectRootDir - project projectRootDir's absolute path
 * @param {string} ID - component ID
 * @param {string} absPath - component's absolute path
 * @returns {Object} - component path map
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
  await writeJsonWrapper(filename, projectJson)
  await gitAdd(projectRootDir, filename);
  return projectJson.componentPath;
}

async function setProjectState(projectRootDir, state, force) {
  const filename = path.resolve(projectRootDir, projectJsonFilename);
  const projectJson = await readJsonGreedy(filename);
  if (force || projectJson.state !== state) {
    projectJson.state = state;
    const timestamp = getDateString(true);
    projectJson.mtime = timestamp;
    await writeJsonWrapper(filename, projectJson)
    await gitAdd(projectRootDir, filename);
    return projectJson;
  }
  return false;
}

/**
 * return relative path from one component to another
 * @param {string} projectRootDir -
 * @param {string} from - starting point component's ID
 * @param {string} to - endpoint component's ID
 * @returns {string} - relativepath from "from" to "to"
 */
async function getRelativeComponentPath(projectRootDir, from, to) {
  const projectJson = await readJsonGreedy(path.resolve(projectRootDir, projectJsonFilename));
  const fromPath = projectJson.componentPath[from];
  const toPath = projectJson.componentPath[to];
  return path.relative(fromPath, toPath);
}

async function getComponentDir(projectRootDir, ID, isAbsolute) {
  const projectJson = await readJsonGreedy(path.resolve(projectRootDir, projectJsonFilename));
  const relativePath = projectJson.componentPath[ID];
  if (relativePath) {
    return isAbsolute ? path.resolve(projectRootDir, relativePath) : relativePath;
  }
  return null;
}

async function getProjectState(projectRootDir) {
  const projectJson = await readJsonGreedy(path.resolve(projectRootDir, projectJsonFilename));
  return projectJson.state;
}

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

async function convertComponentJson(projectRootDir, componentPath, parentComponentJson, parentID) {
  getLogger().debug(`converting: ${parentComponentJson}`);
  const oldComponentFilenames = {
    workflow: "define.wf.json",
    parameterStudy: "define.ps.json",
    for: "define.fr.json",
    while: "define.wl.json",
    foreach: "define.fe.json"
  };
  const componentJson = await fs.readJson(parentComponentJson);
  delete componentJson.jsonFile;
  delete componentJson.path;
  delete componentJson.index;

  componentJson.ID = parentID || uuid.v1();

  //remove depricated props, add ID to child components and register to componentPath
  for (const node of componentJson.nodes) {
    if (node === null) {
      continue;
    }
    delete node.jsonFile;
    delete node.path;
    delete node.index;
    node.parent = componentJson.ID;
    node.ID = uuid.v1();
    componentPath[node.ID] = path.relative(projectRootDir, path.join(path.dirname(parentComponentJson), node.name));
  }
  //fix next, else, previous, inputFiles, outputFiles and indexList then write json file and recursive call if component has child
  for (const node of componentJson.nodes) {
    if (node === null) {
      continue;
    }
    if (hasChild(node)) {
      const oldComponentJsonFilename = oldComponentFilenames[node.type];
      await convertComponentJson(projectRootDir, componentPath, path.resolve(path.dirname(parentComponentJson), node.name, oldComponentJsonFilename), node.ID);
    }

    node.next = node.next.map((index)=>{
      return componentJson.nodes[index].ID;
    });

    node.previous = node.previous.map((index)=>{
      return componentJson.nodes[index].ID;
    });

    if (node.type === "if") {
      node.else = node.else.map((index)=>{
        return componentJson.nodes[index].ID;
      });
    }
    if (node.type === "foreach") {
      node.indexList = node.indexList.map((index)=>{
        return index.label;
      });
    }

    node.inputFiles = node.inputFiles.map((inputFile)=>{
      const srcID = inputFile.srcNode === "parent" ? componentJson.ID : componentJson.nodes[inputFile.srcNode].ID;
      return { name: inputFile.name, src: [{ srcNode: srcID, srcName: inputFile.srcName }] };
    });

    node.outputFiles = node.outputFiles.map((outputFile)=>{
      const dst = outputFile.dst.map((e)=>{
        const dstID = e.dstNode === "parent" ? componentJson.ID : componentJson.nodes[e.dstNode].ID;
        return { dstNode: dstID, dstName: e.dstName };
      });
      return { name: outputFile.name, dst };
    });

    const componentDir = path.resolve(path.dirname(parentComponentJson), node.name);
    delete node.nodes;
    await writeComponentJson(projectRootDir, componentDir, node);
    getLogger().debug(`write converted componentJson file into ${componentDir}`);
    getLogger().debug(node);
  }

  delete componentJson.nodes;
  await gitRm(projectRootDir, parentComponentJson);
  await fs.remove(parentComponentJson);
  return componentJson;
}

async function convertProjectFormat(projectJsonFilepath) {
  const projectRootDir = path.dirname(projectJsonFilepath);
  const projectJson = await fs.readJson(projectJsonFilepath);
  const rootWorkflow = path.resolve(projectRootDir, projectJson.path_workflow);
  projectJson.version = 2.1; //version 2 + all include/exclude prop must be array of string
  delete projectJson.path;
  delete projectJson.path_workflow;
  projectJson.root = projectRootDir;
  projectJson.mtime = getDateString(true);
  projectJson.componentPath = {};

  try {
    const rootWF = await convertComponentJson(projectRootDir, projectJson.componentPath, path.resolve(projectRootDir, rootWorkflow));
    rootWF.paret = "this is root";
    projectJson.componentPath[rootWF.ID] = "./";
    await writeComponentJson(projectRootDir,projectRootDir, rootWF)
  } catch (e) {
    //revert by clean project
    const files = await promisify(glob)(`./**/${componentJsonFilename}`, { cwd: projectRootDir });
    await Promise.all(files.map((file)=>{
      return fs.remove(path.resolve(projectRootDir, file));
    }));
    await gitResetHEAD(projectRootDir);
    await gitClean(projectRootDir);
    throw (e);
  }

  rewriteAllIncludeExcludeProperty(projectRootDir)
  const filename=path.resolve(projectRootDir, projectJsonFilename)
  await writeJsonWrapper(filename, projectJson)
  await gitAdd(projectRootDir, path.resolve(projectRootDir, projectJsonFilename));

  getLogger().debug(`write converted projectJson file to ${path.resolve(projectRootDir, projectJsonFilename)}`);
  getLogger().debug(projectJson);

  //remove old project Json file
  await gitRm(projectRootDir, projectJsonFilepath);
  await fs.remove(projectJsonFilepath);
  await gitCommit(projectRootDir,"convert old format project");
}

/*
 * convert old include exclude format (comma separated string) to array of string
 * @params {string} filename - component json filename
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
 */
async function rewriteAllIncludeExcludeProperty(projectRootDir, changed){
  //convert include and exclude property to array
  const files = await promisify(glob)(`./**/${componentJsonFilename}`, { cwd: projectRootDir });
  await Promise.all(files.map((filename)=>{
    return rewriteIncludeExclude(projectRootDir, path.resolve(projectRootDir, filename), changed);
  }));
}

async function importProject(projectRootDir) {
  const projectJsonFilepath = convertPathSep(path.resolve(projectRootDir, projectJsonFilename));
  const toBeCommited=[]

  //convert v1 to v2
  if (!fs.pathExists(projectJsonFilepath)) {
    const oldProjectJsonFilename = "swf.prj.json";
    //serch old version file
    const oldProjectJsonFilepath = convertPathSep(path.resolve(projectRootDir, oldProjectJsonFilename));
    if (fs.pathExists(convertPathSep(oldProjectJsonFilepath))) {
      getLogger().debug("converting old format project");

      try {
        await convertProjectFormat(oldProjectJsonFilepath);
      } catch (e) {
        getLogger().error("fatal error occurred while converting old format project", e);
        return;
      }
    }
  }

  //convert include/exclude prop
  const projectJson = await getProjectJson(projectRootDir);
  if(projectJson.version <= 2){
    await rewriteAllIncludeExcludeProperty(projectRootDir, toBeCommited)
    projectJson.version = 2.1;
  }

  //skip following import process if project is already on projectList
  if (projectList.query("path", projectRootDir)) {
    return projectRootDir;
  }

  getLogger().debug("import: ", projectJsonFilepath);

  if (!isValidName(projectJson.name)) {
    getLogger().error(projectJson.name, "is not allowed for project name");
    return;
  }


  let newProjectRootDir = projectRootDir
  //if projectRootDir is not based on projectJson.name, fix it
  const projectBasename=path.basename(projectRootDir);

  if(projectBasename !== projectJson.name+suffix){
    newProjectRootDir = await getUnusedProjectDir(projectRootDir, projectJson.name);
    const projectName = path.basename(newProjectRootDir.slice(0, -suffix.length));
    const oldProjectName=projectJson.name

    if (oldProjectName !== projectName) {
      projectJson.name=projectName
      getLogger().warn(projectJson.name, "is already used. so this project is renamed to", projectName);
    }

    if (projectRootDir !== newProjectRootDir) {
      getLogger().debug(`rename ${projectRootDir} to ${newProjectRootDir}`);

      try {
        await fs.move(projectRootDir, newProjectRootDir);
      } catch (e) {
        getLogger().error("directory move failed", e);
        return;
      }
      try {
        projectJson.root = newProjectRootDir;
        projectJson.name = projectName;
        const filename=path.resolve(newProjectRootDir, projectJsonFilename)
        await writeJsonWrapper(filename, projectJson)
        toBeCommited.push(filename);
      } catch (e) {
        getLogger().error("rewrite project JSON failed", e);
        return;
      }
      try {
        const rootWF=await readComponentJson(newProjectRootDir);
        rootWF.name = projectName;
        //do not use writeComponentJson because we do not know project files are git-controlled or not here
        const filename=path.resolve(newProjectRootDir,componentJsonFilename);
        await writeJsonWrapper(filename, rootWF)
        toBeCommited.push(filename);
      } catch (e) {
        getLogger().error("rewrite root WF JSON failed", e);
        return;
      }
    }
  }

  //set up project directory as git repo
  if (!await fs.pathExists(path.resolve(newProjectRootDir, ".git"))) {
    try {
      //this directory does not have ".git" that means its first time opening from WHEEL
      await gitInit(newProjectRootDir, "wheel", "wheel@example.com");
      await setProjectState(newProjectRootDir, "not-started");
      await setComponentStateR(newProjectRootDir, newProjectRootDir,"not-started");
      await gitAdd(newProjectRootDir, "./");
      await gitCommit(newProjectRootDir, "import project");
    } catch (e) {
      getLogger().error("can not access to git repository", e);
      return;
    }
  } else {
    const ignoreFile=path.join(newProjectRootDir,".gitignore")

    if(! await fs.pathExists(ignoreFile)){
      await fs.outputFile(ignoreFile, "wheel.log");
      await gitAdd(newProjectRootDir, ".gitignore");
    }
    await Promise.all( toBeCommited.map((name)=>{
      return gitAdd(newProjectRootDir, name);
    }));
    await gitCommit(newProjectRootDir, "import project", ["--", ".gitignore", ...toBeCommited]);
  }
  projectList.unshift({ path: newProjectRootDir });
  return newProjectRootDir;
}

/**
 * set component and its descendant's state
 * @param {string} projectRootDir - git repo's root directory
 * @param {string} dir - root component directory
 * @param {string} state  - state to be set
 * @param {Boolean} doNotAdd- - call gitAdd if false
 */
async function setComponentStateR(projectRootDir, dir, state, doNotAdd=false) {
  const filenames = await promisify(glob)(path.join(dir, "**", componentJsonFilename));
  filenames.push(path.join(dir, componentJsonFilename));
  const p = filenames.map((filename)=>{
    return readJsonGreedy(filename)
      .then((component)=>{
        component.state = state;
        const componentDir=path.dirname(filename);
        return writeComponentJson(projectRootDir, componentDir, component, doNotAdd )
      });
  });
  return Promise.all(p);
}


async function updateProjectDescription(projectRootDir, description) {
  const filename = path.resolve(projectRootDir, projectJsonFilename);
  const projectJson = await readJsonGreedy(filename);
  projectJson.description = description;
  await writeJsonWrapper(filename, projectJson)
  await gitAdd(projectRootDir, filename);
}

async function addProject(projectDir, description) {
  let projectRootDir = path.normalize(removeTrailingPathSep(convertPathSep(projectDir)));

  if (!projectRootDir.endsWith(suffix)) {
    projectRootDir += suffix;
  }
  projectRootDir = path.resolve(projectRootDir);

  const projectName = path.basename(projectRootDir.slice(0, -suffix.length));

  if (!isValidName(projectName)) {
    getLogger().error(projectName, "is not allowed for project name");
    throw (new Error("illegal project name"));
  }
  projectRootDir=await createNewProject(projectRootDir, projectName, description, "wheel", "wheel@example.com");
  projectList.unshift({ path: projectRootDir });
}

async function renameProject(id, newName, oldDir) {
  if (!isValidName(newName)) {
    getLogger().error(newName, "is not allowed for project name");
    throw (new Error("illegal project name"));
  }
  const newDir = path.resolve(path.dirname(oldDir), newName + suffix);
  if (await fs.pathExists(newDir)){
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

function isLocal(component) {
  return typeof component.host === "undefined" || component.host === "localhost";
}

/**
 * check if specified components are executed on same remote host
 * @param {string} projectRootDir - root directory path of project
 * @param {string} left -  first componentID
 * @param {string} right - second componentID
 * @returns {boolean} - on same remote or not
 */
async function isSameRemoteHost(projectRootDir, left, right) {
  if (left === right) {
    return null;
  }
  const leftComponent = await readComponentJsonByID(projectRootDir, left);
  const rightComponent = await readComponentJsonByID(projectRootDir, right);

  if (isLocal(leftComponent) || isLocal(rightComponent)) {
    return false;
  }

  if (leftComponent.host === rightComponent.host) {
    return true;
  }
  const leftHost = remoteHost.query("name", leftComponent.host);
  const rightHost = remoteHost.query("name", rightComponent.host);
  const leftSharedHost = remoteHost.query("sharedHost", leftHost.sharedHost);
  const rightSharedHost = remoteHost.query("sharedHost", rightHost.sharedHost);

  if (leftHost === rightSharedHost || rightHost === leftSharedHost || leftSharedHost === rightSharedHost) {
    return true;
  }
  return false;
}


/**
 * write component JSON file and git add
 * @param {string} projectRootDir - project projectRootDir's absolute path
 * @param {string} componentDir - absolute or relative path to component directory
 * @param {Object} component - component JSON data
 * @param {Boolean} doNotAdd- - call gitAdd if false
 */
async function writeComponentJson(projectRootDir, componentDir, component, doNotAdd=false) {
  const filename = path.join(componentDir, componentJsonFilename);
  await fs.writeJson(filename, component, { spaces: 4, replacer: componentJsonReplacer });

  if(doNotAdd){
    return
  }
  return gitAdd(projectRootDir, filename);
}

/**
 * read component Json by directory
 * @param {string} componentDir - absolute or relative path to component directory
 * @return {Object} - component JSON data
 */
async function readComponentJson(componentDir) {
  const filename = path.join(componentDir, componentJsonFilename);
  const componentJson = await readJsonGreedy(filename);
  return componentJson;
}

/**
 * write componentJson by ID
 * @param {string} projectRootDir - project projectRootDir's absolute path
 * @param {string} ID - component's ID string
 * @param {Object} component - component JSON data
 */
async function writeComponentJsonByID(projectRootDir, ID, component) {
  const componentDir = await getComponentDir(projectRootDir, ID, true);
  return writeComponentJson(projectRootDir, componentDir, component);
}

/**
 * read componentJson by ID
 * @param {string} projectRootDir - project projectRootDir's absolute path
 * @param {string} ID - component's ID string
 * @return {Object} - component JSON data
 */
async function readComponentJsonByID(projectRootDir, ID) {
  const componentDir = await getComponentDir(projectRootDir, ID, true);
  return readComponentJson(componentDir);
}

/**
 * check if given 2 id's has parent-child relationship
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

async function getChildren(projectRootDir, parentID) {
  const dir = parentID === null ? projectRootDir : await getComponentDir(projectRootDir, parentID, true);

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

async function validateTask(projectRootDir, component) {
  if (component.name === null) {
    return Promise.reject(new Error(`illegal path ${component.name}`));
  }

  if (component.useJobScheduler) {
    const hostinfo = remoteHost.query("name", component.host);
    if (typeof hostinfo === "undefined") {
      //local job is not implemented
      return Promise.reject(new Error(`remote host setting for ${component.host} not found`));
    }
    if (!Object.keys(jobScheduler).includes(hostinfo.jobScheduler)) {
      return Promise.reject(new Error(`job scheduler for ${hostinfo.name} (${hostinfo.jobScheduler}) is not supported`));
    }
    if (component.submitOption) {
      const optList = String(jobScheduler[hostinfo.jobScheduler].queueOpt).split(" ");
      if (optList.map((opt)=>{
        return component.submitOption.indexOf(opt);
      }).every((i)=>{
        return i >= 0;
      })) {
        return Promise.reject(new Error(`submit option duplicate queue option : ${jobScheduler[hostinfo.jobScheduler].queueOpt}`));
      }
    }
  }

  if (!(Object.prototype.hasOwnProperty.call(component, "script") && typeof component.script === "string")) {
    return Promise.reject(new Error(`script is not specified ${component.name}`));
  }
  const componentDir = await getComponentDir(projectRootDir, component.ID, true);
  const filename = path.resolve(componentDir, component.script);
  if (!(await fs.stat(filename)).isFile()) {
    return Promise.reject(new Error(`script is not existing file ${filename}`));
  }
  return true;
}

async function validateStepjobTask(projectRootDir, component) {
  const isInitial = isInitialComponent(component);
  if (component.name === null) {
    return Promise.reject(new Error(`illegal path ${component.name}`));
  }

  if (component.useDependency && isInitial) {
    return Promise.reject(new Error("initial stepjobTask cannot specified the Dependency form"));
  }

  if (!(Object.prototype.hasOwnProperty.call(component, "script") && typeof component.script === "string")) {
    return Promise.reject(new Error(`script is not specified ${component.name}`));
  }
  const componentDir = await getComponentDir(projectRootDir, component.ID, true);
  const filename = path.resolve(componentDir, component.script);
  if (!(await fs.stat(filename)).isFile()) {
    return Promise.reject(new Error(`script is not existing file ${filename}`));
  }
  return true;
}

async function validateStepjob(projectRootDir, component) {
  if (component.useJobScheduler) {
    const hostinfo = remoteHost.query("name", component.host);
    if (typeof hostinfo === "undefined") {
      //assume local job
    } else if (!Object.keys(jobScheduler).includes(hostinfo.jobScheduler)) {
      return Promise.reject(new Error(`job scheduler for ${hostinfo.name} (${hostinfo.jobScheduler}) is not supported`));
    }
    const setJobScheduler = jobScheduler[hostinfo.jobScheduler];
    if (!(Object.prototype.hasOwnProperty.call(setJobScheduler, "stepjob") && setJobScheduler.stepjob === true)) {
      return Promise.reject(new Error(`${hostinfo.jobScheduler} jobSheduler does not support stepjob`));
    }
    if (!(Object.prototype.hasOwnProperty.call(hostinfo, "useStepjob") && hostinfo.useStepjob === true)) {
      return Promise.reject(new Error(`${hostinfo.name} does not support stepjob`));
    }
  }
  return true;
}

async function validateBulkjobTask(projectRootDir, component) {
  if (component.name === null) {
    return Promise.reject(new Error(`illegal path ${component.name}`));
  }

  if (!(Object.prototype.hasOwnProperty.call(component, "script") && typeof component.script === "string")) {
    return Promise.reject(new Error(`script is not specified ${component.name}`));
  }
  const componentDir = await getComponentDir(projectRootDir, component.ID, true);
  const filename = path.resolve(componentDir, component.script);
  if (!(await fs.stat(filename)).isFile()) {
    return Promise.reject(new Error(`script is not existing file ${filename}`));
  }

  if (component.host === "localhost") {
    return Promise.reject(new Error("localhost does not support bulkjob`"));
  }

  if (component.useJobScheduler) {
    const hostinfo = remoteHost.query("name", component.host);
    if (typeof hostinfo === "undefined") {
      //local job is not supported for now
      return Promise.reject(new Error(`remote host setting for ${component.host} not found`));
    }
    if (!Object.keys(jobScheduler).includes(hostinfo.jobScheduler)) {
      return Promise.reject(new Error(`job scheduler for ${hostinfo.name} (${hostinfo.jobScheduler}) is not supported`));
    }
    const setJobScheduler = jobScheduler[hostinfo.jobScheduler];
    if (!(Object.prototype.hasOwnProperty.call(setJobScheduler, "bulkjob") && setJobScheduler.bulkjob === true)) {
      return Promise.reject(new Error(`${hostinfo.jobScheduler} jobSheduler does not support bulkjob`));
    }
    if (!(Object.prototype.hasOwnProperty.call(hostinfo, "useBulkjob") && hostinfo.useBulkjob === true)) {
      return Promise.reject(new Error(`${hostinfo.name} does not support bulkjob`));
    }
  }

  if (component.usePSSettingFile === false) {
    if (!(Object.prototype.hasOwnProperty.call(component, "startBulkNumber") && typeof component.startBulkNumber === "number")) {
      return Promise.reject(new Error(`startBulkNumber is not specified ${component.name}`));
    }
    if (!(component.startBulkNumber >= 0)) {
      return Promise.reject(new Error(`${component.name} startBulkNumber is integer of 0 or more`));
    }
    if (!(Object.prototype.hasOwnProperty.call(component, "endBulkNumber") && typeof component.endBulkNumber === "number" && component.startBulkNumber >= 0)) {
      return Promise.reject(new Error(`endBulkNumber is not specified ${component.name}`));
    }
    if (!(component.endBulkNumber > component.startBulkNumber)) {
      return Promise.reject(new Error(`${component.name} endBulkNumber is greater than startBulkNumber`));
    }
  } else {
    if (!(Object.prototype.hasOwnProperty.call(component, "parameterFile") && typeof component.parameterFile === "string")) {
      return Promise.reject(new Error(`parameter setting file is not specified ${component.name}`));
    }
  }

  if (component.manualFinishCondition) {
    if (!(Object.prototype.hasOwnProperty.call(component, "condition") && typeof component.condition === "string")) {
      return Promise.reject(new Error(`condition is not specified ${component.name}`));
    }
  }
  return true;
}

async function validateConditionalCheck(component) {
  if (!(Object.prototype.hasOwnProperty.call(component, "condition") && typeof component.condition === "string")) {
    return Promise.reject(new Error(`condition is not specified ${component.name}`));
  }
  return Promise.resolve();
}

async function validateKeepProp(component) {
  if (Object.prototype.hasOwnProperty.call(component, "keep")) {
    if (component.keep === null || component.keep === "") {
      return Promise.resolve();
    }
    if (!(Number.isInteger(component.keep) && component.keep >= 0)) {
      return Promise.reject(new Error(`keep must be positive integer ${component.name}`));
    }
  }
  return Promise.resolve();
}

async function validateForLoop(component) {
  if (!(Object.prototype.hasOwnProperty.call(component, "start") && typeof component.start === "number")) {
    return Promise.reject(new Error(`start is not specified ${component.name}`));
  }

  if (!(Object.prototype.hasOwnProperty.call(component, "step") && typeof component.step === "number")) {
    return Promise.reject(new Error(`step is not specified ${component.name}`));
  }

  if (!(Object.prototype.hasOwnProperty.call(component, "end") && typeof component.end === "number")) {
    return Promise.reject(new Error(`end is not specified ${component.name}`));
  }

  if (component.step === 0 || (component.end - component.start) * component.step < 0) {
    return Promise.reject(new Error(`inifinite loop ${component.name}`));
  }
  return Promise.resolve();
}

async function validateParameterStudy(projectRootDir, component) {
  if (!(Object.prototype.hasOwnProperty.call(component, "parameterFile") && typeof component.parameterFile === "string")) {
    return Promise.reject(new Error(`parameter setting file is not specified ${component.name}`));
  }
  const componentDir = await getComponentDir(projectRootDir, component.ID, true);
  const filename = path.resolve(componentDir, component.parameterFile);
  await fs.access(filename);

  try {
    await readJsonGreedy(filename);
  } catch (err) {
    err.orgMessage = err.message;
    err.message = "parameter file parse error";
    err.parameterFile = component.parameterFile;
    throw err;
  }
  //validation check by JSON-schema will be done
  return true;
}

async function validateForeach(component) {
  if (!Array.isArray(component.indexList)) {
    return Promise.reject(new Error(`index list is broken ${component.name}`));
  }
  if (component.indexList.length <= 0) {
    return Promise.reject(new Error(`index list is empty ${component.name}`));
  }
  return Promise.resolve();
}

async function validateStorage(component) {
  if (typeof component.storagePath !== "string") {
    return Promise.reject(new Error("storagePath is not set"));
  }
  if (isLocal(component) && !fs.pathExists(component.storagePath)) {
    return Promise.reject(new Error("specified path is not exist on localhost"));
  }
  return Promise.resolve();
}

/**
 * validate inputFiles
 * @param {Object} component - any component object which has inputFiles prop
 * @returns {true|Error} - inputFile is valid or not
 */
async function validateInputFiles(component) {
  for (const inputFile of component.inputFiles) {
    const filename = inputFile.name;
    if (inputFile.src.length > 1 && !(filename[filename.length - 1] === "/" || filename[filename.length - 1] === "\\")) {
      return Promise.reject(new Error(`${component.name} inputFile '${inputFile.name}' data type is 'file' but it has two or more outputFiles.`));
    }
  }
  return true;
}

/**
 * validate outputFiles
 * @param {Object} component - any component object which has putFiles prop
 * @returns {true|Error} - outputFile is valid or not
 */
async function validateOutputFiles(component) {
  for (const outputFile of component.outputFiles) {
    const filename = outputFile.name;
    if (!isValidOutputFilename(filename)) {
      return Promise.reject(new Error(`${component.name} '${outputFile.name}' is not allowed.`));
    }
  }
  return true;
}

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


/*
 * public functions
 */

/**
 * read component Json recursively and pick up remote hosts used in task component
 */
async function getHosts(projectRootDir, rootID) {
  const hosts = [];
  const storageHosts = [];
  await recursiveGetHosts(projectRootDir, rootID, hosts, storageHosts);
  const storageHosts2 = Array.from(new Set(storageHosts));
  const hosts2 = Array.from(new Set(hosts))
    .filter((host)=>{
      return !storageHosts2.includes(host.hostname);
    });
  return [...storageHosts2, ...hosts2];
}

/**
 * validate all components in workflow
 */
async function validateComponents(projectRootDir, argParentID) {
  let parentID;
  if (typeof argParentID !== "string") {
    const rootWF = await readComponentJson(projectRootDir);
    parentID = rootWF.ID;
  } else {
    parentID = argParentID;
  }

  const children = await getChildren(projectRootDir, parentID);
  const promises = [];

  for (const component of children) {
    if (component.disable) {
      continue;
    }
    if (component.type === "task") {
      promises.push(validateTask(projectRootDir, component));
    } else if (component.type === "stepjobTask") {
      promises.push(validateStepjobTask(projectRootDir, component));
    } else if (component.type === "stepjob") {
      promises.push(validateStepjob(projectRootDir, component));
    } else if (component.type === "bulkjobTask") {
      promises.push(validateBulkjobTask(projectRootDir, component));
    } else if (component.type === "if") {
      promises.push(validateConditionalCheck(component));
    } else if (component.type === "while") {
      promises.push(validateConditionalCheck(component));
      promises.push(validateKeepProp(component));
    } else if (component.type === "for") {
      promises.push(validateForLoop(component));
      promises.push(validateKeepProp(component));
    } else if (component.type === "parameterStudy") {
      promises.push(validateParameterStudy(projectRootDir, component));
    } else if (component.type === "foreach") {
      promises.push(validateForeach(component));
      promises.push(validateKeepProp(component));
    } else if (component.type === "storage") {
      promises.push(validateStorage(component));
    }
    if (Object.prototype.hasOwnProperty.call(component, "inputFiles")) {
      promises.push(validateInputFiles(component));
    }
    if (Object.prototype.hasOwnProperty.call(component, "outputFiles")) {
      promises.push(validateOutputFiles(component));
    }
    if (hasChild(component)) {
      promises.push(validateComponents(projectRootDir, component.ID));
    }
  }

  const hasInitialNode = children.some((component)=>{
    return isInitialComponent(component);
  });

  if (!hasInitialNode) {
    promises.push(Promise.reject(new Error("no component can be run")));
  }

  return Promise.all(promises);
}


function componentJsonReplacer(key, value) {
  if (["handler", "doCleanup", "sbsID", "childLoopRunning"].includes(key)) {
    return undefined;
  }
  return value;
}


/**
 * create new component in parentDir
 * @param {string} projectRootDir - project root directory path
 * @param {string} parentDir - parent component's directory path
 * @param {string} type - component type
 * @param {Object} pos - component's cordinate in browser
 * @returns {Object} component
 */
async function createNewComponent(projectRootDir, parentDir, type, pos) {
  const parentJson = await readJsonGreedy(path.resolve(parentDir, componentJsonFilename));
  const parentID = parentJson.ID;
  const componentBasename=getComponentDefaultName(type)

  //create component directory and Json file
  const absDirName = await makeDir(path.resolve(parentDir, componentBasename), 0);
  const newComponent = componentFactory(type, pos, parentID);
  newComponent.name = path.basename(absDirName);
  await writeComponentJson(projectRootDir, absDirName, newComponent);
  await updateComponentPath(projectRootDir, newComponent.ID, absDirName);

  if (type === "PS") {
    await writeJsonWrapper(path.resolve(absDirName, defaultPSconfigFilename), { version: 2, targetFiles: [], params: [], scatter: [], gather: [] });
  }
  return newComponent;
}

/**
 * perform git mv and update component path in projectJson file
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

async function replaceEnv(projectRootDir, ID, newEnv) {
  const componentJson = await readComponentJsonByID(projectRootDir, ID);
  const env = componentJson.env || {};
  const patch = diff(env, newEnv);
  diffApply(env, patch);
  componentJson.env = env;
  await writeComponentJsonByID(projectRootDir, ID, componentJson);
  return componentJson;
}

async function getEnv(projectRootDir, ID) {
  const componentJson = await readComponentJsonByID(projectRootDir, ID);
  const env = componentJson.env || {};
  return env;
}

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
  const componentJson = await readComponentJsonByID(projectRootDir, ID)
  componentJson[prop] = value;
  await writeComponentJsonByID(projectRootDir, ID, componentJson);
  return componentJson
}

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

  componentJson.outputFiles[0].name = "UPLOAD_ONDEMAND";
  return writeComponentJson(projectRootDir, componentDir, componentJson);
}
async function removeInputFile(projectRootDir, ID, name) {
  const counterparts = new Set();
  const componentDir = await getComponentDir(projectRootDir, ID, true);
  const componentJson = await readComponentJson(componentDir);
  componentJson.inputFiles.forEach((inputFile)=>{
    if (name === inputFile.name) {
      for (const src of inputFile.src) {
        counterparts.add(src);
      }
    }
  });

  for (const counterPart of counterparts) {
    await removeFileLink(projectRootDir, counterPart.srcNode, counterPart.srcName, ID, name);
  }

  componentJson.inputFiles = componentJson.inputFiles.filter((inputFile)=>{
    return name !== inputFile.name;
  });
  return writeComponentJson(projectRootDir, componentDir, componentJson);
}
async function removeOutputFile(projectRootDir, ID, name) {
  const counterparts = new Set();
  const componentDir = await getComponentDir(projectRootDir, ID, true);
  const componentJson = await readComponentJson(componentDir);

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
    await removeFileLink(projectRootDir, ID, name, counterPart.dstNode, counterPart.dstName);
  }
  return writeComponentJson(projectRootDir, componentDir, componentJson);
}

async function renameInputFile(projectRootDir, ID, index, newName) {
  if (!isValidInputFilename(newName)) {
    return Promise.reject(new Error(`${newName} is not valid inputFile name`));
  }
  const componentDir = await getComponentDir(projectRootDir, ID, true);
  const componentJson = await readComponentJson(componentDir);
  if (index < 0 || componentJson.inputFiles.length - 1 < index) {
    return Promise.reject(new Error(`invalid index ${index}`));
  }

  const counterparts = new Set();
  const oldName = componentJson.inputFiles[index].name;
  componentJson.inputFiles[index].name = newName;
  componentJson.inputFiles[index].src.forEach((e)=>{
    counterparts.add(e.srcNode);
  });
  const p = [writeComponentJson(projectRootDir, componentDir, componentJson)];

  for (const counterPartID of counterparts) {
    const counterpartDir = await getComponentDir(projectRootDir, counterPartID, true);
    const counterpartJson = await readComponentJson(counterpartDir);
    for (const outputFile of counterpartJson.outputFiles) {
      for (const dst of outputFile.dst) {
        if (dst.dstNode === ID && dst.dstName === oldName) {
          dst.dstName = newName;
        }
      }
    }
    for (const inputFile of counterpartJson.inputFiles) {
      if (!Object.prototype.hasOwnProperty.call(inputFile, "forwardTo")) {
        for (const dst of inputFile.forwardTo) {
          if (dst.dstNode === ID && dst.dstName === oldName) {
            dst.dstName = newName;
          }
        }
      }
    }
    p.push(writeComponentJson(projectRootDir, counterpartDir, counterpartJson));
  }
  return Promise.all(p);
}
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

  if(srcJson.type === "stepjobTask" && dstJson.type === "stepjobTask"){
    await updateStepNumber(projectRootDir);
  }
}

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

async function removeFileLink(projectRootDir, srcNode, srcName, dstNode, dstName) {
  if (await isParent(projectRootDir, dstNode, srcNode)) {
    return removeFileLinkToParent(projectRootDir, srcNode, srcName, dstName);
  }
  if (await isParent(projectRootDir, srcNode, dstNode)) {
    return removeFileLinkFromParent(projectRootDir, srcName, dstNode, dstName);
  }
  return removeFileLinkBetweenSiblings(projectRootDir, srcNode, srcName, dstNode, dstName);
}

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


async function cleanComponent(projectRootDir, ID) {
  const targetDir = await getComponentDir(projectRootDir, ID, true);

  const pathSpec = `${replacePathsep(path.relative(projectRootDir, targetDir))}/*`;
  await gitResetHEAD(projectRootDir, pathSpec);
  await gitClean(projectRootDir, pathSpec);

  const descendantsDirs = await getDescendantsIDs(projectRootDir, ID);
  return removeComponentPath(projectRootDir, descendantsDirs);
}

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
 * @param {string} projectRootDir - root directory path of project
 * @param {strint} rootDir - start point of directory search
 * @returns {Object} - integrated component json data
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
  removeComponentPath,
  getRelativeComponentPath,
  getComponentDir,
  getDescendantsIDs,
  getAllComponentIDs,
  setProjectState,
  getProjectState,
  checkRunningJobs,
  importProject,
  updateProjectDescription,
  getProjectJson,
  addProject,
  renameProject,
  setComponentStateR,
  getHosts,
  getSourceComponents,
  getChildren,
  readComponentJsonByID,
  validateComponents,
  componentJsonReplacer,
  createNewComponent,
  renameComponentDir,
  updateComponent,
  updateStepNumber,
  addInputFile,
  addOutputFile,
  removeInputFile,
  removeOutputFile,
  renameInputFile,
  renameOutputFile,
  addLink,
  addFileLink,
  removeLink,
  removeAllLink,
  removeFileLink,
  removeAllFileLink,
  getEnv,
  replaceEnv,
  cleanComponent,
  removeComponent,
  isComponentDir,
  getComponentTree,
  readComponentJson,
  writeComponentJson,
  isLocal,
  isSameRemoteHost,
};
