/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License.txt in the project root for the license information.
 */
"use strict";
const { promisify } = require("util");
const fs = require("fs-extra");
const path = require("path");
const isPathInside = require("is-path-inside");
const uuidv1 = require("uuid/v1");
const glob = require("glob");
const { componentFactory } = require("./workflowComponent");
const { projectList, defaultCleanupRemoteRoot, projectJsonFilename, componentJsonFilename, jobManagerJsonFilename, suffix } = require("../db/db");
const { getDateString, isValidName } = require("../lib/utility");
const { replacePathsep, convertPathSep } = require("./pathUtils");
const { readJsonGreedy } = require("./fileUtils");
const { gitInit, gitAdd, gitCommit, gitResetHEAD, gitClean, gitRm } = require("./gitOperator2");
const { hasChild } = require("../core/workflowComponent");

const { getLogger } = require("../logSettings");
const logger = getLogger();

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

/**
 * create new project dir, initial files and new git repository
 * @param {string} projectRootDir - project projectRootDir's absolute path
 * @param {string} name - project name without suffix
 * @param {string} argDescription - project description text
 * @param {string} user - username of project owner
 * @param {string} mail - mail address of project owner
 * @returns {*} -
 */
async function createNewProject(projectRootDir, name, argDescription, user, mail) {
  const description = argDescription != null ? argDescription : "This is new project.";
  await fs.ensureDir(projectRootDir);

  //write root workflow
  const rootWorkflowFileFullpath = path.join(projectRootDir, componentJsonFilename);
  const rootWorkflow = componentFactory("workflow");
  rootWorkflow.name = name;
  rootWorkflow.cleanupFlag = defaultCleanupRemoteRoot === 0 ? 0 : 1;

  if (logger) {
    logger.debug(rootWorkflow);
  }
  await fs.writeJson(rootWorkflowFileFullpath, rootWorkflow, { spaces: 4 });

  //write project JSON
  const timestamp = getDateString(true);
  const projectJson = {
    version: 2,
    name,
    description,
    state: "not-started",
    root: projectRootDir,
    ctime: timestamp,
    mtime: timestamp,
    componentPath: {}
  };
  projectJson.componentPath[rootWorkflow.ID] = "./";
  const projectJsonFileFullpath = path.resolve(projectRootDir, projectJsonFilename);
  if (logger) {
    logger.debug(projectJson);
  }
  await fs.writeJson(projectJsonFileFullpath, projectJson, { spaces: 4 });
  await gitInit(projectRootDir, user, mail);
  await gitAdd(projectRootDir, "./");
  await gitCommit(projectRootDir, "create new project");
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
  await fs.writeJson(filename, projectJson, { spaces: 4 });
  return gitAdd(projectRootDir, filename);
}

/**
 *
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
  await fs.writeJson(filename, projectJson, { spaces: 4 });
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
    await fs.writeJson(filename, projectJson, { spaces: 4 });
    await gitAdd(projectRootDir, filename);
    return projectJson;
  }
  return false;
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
      logger.warn("read job manager file failed", e);
    }
  }
  return { tasks, jmFiles };
}

async function convertComponentJson(projectRootDir, componentPath, parentComponentJson, parentID) {
  logger.debug(`converting: ${parentComponentJson}`);
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

  componentJson.ID = parentID || uuidv1();

  //remove depricated props, add ID to child components and register to componentPath
  for (const node of componentJson.nodes) {
    if (node === null) {
      continue;
    }
    delete node.jsonFile;
    delete node.path;
    delete node.index;
    node.parent = componentJson.ID;
    node.ID = uuidv1();
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

    const filename = path.resolve(path.dirname(parentComponentJson), node.name, componentJsonFilename);
    delete node.nodes;
    await fs.writeJson(filename, node, { spaces: 4 });
    await gitAdd(projectRootDir, filename);
    logger.debug(`write converted componentJson file to ${filename}`);
    logger.debug(node);
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
  projectJson.version = 2;
  delete projectJson.path;
  delete projectJson.path_workflow;
  projectJson.root = projectRootDir;
  projectJson.mtime = getDateString(true);
  projectJson.componentPath = {};

  try {
    const rootWF = await convertComponentJson(projectRootDir, projectJson.componentPath, path.resolve(projectRootDir, rootWorkflow));
    rootWF.paret = "this is root";
    projectJson.componentPath[rootWF.ID] = "./";
    await fs.writeJson(path.resolve(projectRootDir, componentJsonFilename), rootWF, { spaces: 4 });
    await gitAdd(projectRootDir, path.resolve(projectRootDir, componentJsonFilename));
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

  await fs.writeJson(path.resolve(projectRootDir, projectJsonFilename), projectJson, { spaces: 4 });
  logger.debug(`write converted projectJson file to ${path.resolve(projectRootDir, projectJsonFilename)}`);
  logger.debug(projectJson);

  //remove old project Json file
  await gitRm(projectRootDir, projectJsonFilepath);
  await fs.remove(projectJsonFilepath);
  await gitAdd(projectRootDir, path.resolve(projectRootDir, projectJsonFilename));
  const name = "wheel";
  const mail = "wheel.example.com";
  await gitCommit(projectRootDir, name, mail, "convert old format project");
}
function isDuplicateProjectName(newName) {
  const currentProjectList = projectList.getAll();
  if (currentProjectList.length === 0) {
    return false;
  }
  const rt = currentProjectList.some((e)=>{
    const projectName = path.basename(e.path.slice(0, -suffix.length));
    return projectName === newName;
  });
  return rt;
}

function avoidDuplicatedProjectName(basename, argSuffix) {
  let suffixNumber = argSuffix;
  while (isDuplicateProjectName(basename + suffixNumber)) {
    ++suffixNumber;
  }
  return basename + suffixNumber;
}

async function importProject(projectRootDir) {
  if (projectList.query("path", projectRootDir)) {
    //already registerd
    return;
  }
  const projectJsonFilepath = convertPathSep(path.resolve(projectRootDir, projectJsonFilename));
  logger.debug("import: ", projectJsonFilepath);

  if (!fs.pathExists(projectJsonFilepath)) {
    const oldProjectJsonFilename = "swf.prj.json";
    //serch old version file
    const oldProjectJsonFilepath = convertPathSep(path.resolve(projectRootDir, oldProjectJsonFilename));
    if (fs.pathExistsconvertPathSep(oldProjectJsonFilepath)) {
      logger.debug("converting old format project");

      try {
        await convertProjectFormat(oldProjectJsonFilepath);
      } catch (e) {
        logger.error("fatal error occurred while converting old format project", e);
        return;
      }
    }
  }

  const projectJson = await readJsonGreedy(projectJsonFilepath);
  const rootWF = await readJsonGreedy(path.join(projectRootDir, componentJsonFilename));

  let projectName = projectJson.name;
  if (!isValidName(projectName)) {
    logger.error(projectName, "is not allowed for project name");
  }
  if (isDuplicateProjectName(projectName)) {
    const reResult = /.*(\d+)$/.exec(projectName);
    projectName = reResult === null ? projectName : projectName.slice(0, reResult.index);
    const suffixNumber = reResult === null ? 0 : reResult[1];
    const newName = avoidDuplicatedProjectName(projectName, suffixNumber);
    logger.warn(projectName, "is already used. so this project is renamed to", newName);
    projectName = newName;
  }
  const newProjectRootDir = path.resolve(path.dirname(projectRootDir), projectName + suffix);

  if (projectRootDir !== newProjectRootDir) {
    try {
      await fs.move(projectRootDir, newProjectRootDir);
    } catch (e) {
      logger.error("directory move failed", e);
      return;
    }

    try {
      projectJson.root = newProjectRootDir;
      projectJson.name = projectName;
      await fs.writeJson(path.resolve(newProjectRootDir, projectJsonFilename), projectJson);
    } catch (e) {
      logger.error("rewrite project JSON failed", e);
      return;
    }

    try {
      rootWF.name = projectName;
      await fs.writeJson(path.resolve(newProjectRootDir, componentJsonFilename), rootWF);
    } catch (e) {
      logger.error("rewrite root WF JSON failed", e);
      return;
    }
  }

  if (!await fs.pathExists(path.resolve(newProjectRootDir, ".git"))) {
    try {
      await gitInit(newProjectRootDir, "wheel", "wheel@example.com"); //TODO replace by user info
      await gitAdd(newProjectRootDir, "./");
      await gitCommit(newProjectRootDir, "import project");
    } catch (e) {
      logger.error("can not access to git repository", e);
      return;
    }
  } else {
    await gitAdd(newProjectRootDir, "./");
    await gitCommit(newProjectRootDir, "import project");
  }
  projectList.unshift({ path: newProjectRootDir });
}
async function updateProjectDescription(projectRootDir, description) {
  const filename = path.resolve(projectRootDir, projectJsonFilename);
  const projectJson = await readJsonGreedy(filename);
  projectJson.description = description;
  await fs.writeJson(filename, projectJson);
}

async function addProject(projectDir, description) {
  let projectRootDir = path.normalize(removeTrailingPathSep(convertPathSep(projectDir)));

  if (!projectRootDir.endsWith(suffix)) {
    projectRootDir += suffix;
  }
  projectRootDir = path.resolve(projectRootDir);

  const projectName = path.basename(projectRootDir.slice(0, -suffix.length));

  if (!isValidName(projectName)) {
    logger.error(projectName, "is not allowed for project name");
    throw (new Error("illegal project name"));
  }
  if (isDuplicateProjectName(projectName)) {
    logger.error(projectName, "is already used");
    throw (new Error("already exists"));
  }

  await createNewProject(projectRootDir, projectName, description, "wheel", "wheel@example.com", logger);
  projectList.unshift({ path: projectRootDir });
}

async function renameProject(id, newName, oldDir) {
  if (!isValidName(newName)) {
    logger.error(newName, "is not allowed for project name");
    throw (new Error("illegal project name"));
  }
  if (isDuplicateProjectName(newName)) {
    logger.error(newName, "is already exists");
    throw (new Error("already exists"));
  }

  const newDir = path.resolve(path.dirname(oldDir), newName + suffix);

  await fs.move(oldDir, newDir);
  const projectJson = await readJsonGreedy(path.resolve(newDir, projectJsonFilename));
  projectJson.name = newName;
  projectJson.root = newDir;
  projectJson.mtime = getDateString(true);
  await fs.writeJson(path.resolve(newDir, projectJsonFilename), projectJson);
  const rootWorkflow = await readJsonGreedy(path.resolve(newDir, componentJsonFilename));
  rootWorkflow.name = newName;
  await fs.writeJson(path.resolve(newDir, componentJsonFilename), rootWorkflow);
  await gitAdd(newDir, projectJsonFilename);
  await gitAdd(newDir, componentJsonFilename);

  //TODO get from user db
  const name = "wheel";
  const mail = "wheel.example.com";
  await gitCommit(newDir, name, mail);

  //rewrite path in project List entry
  const target = projectList.get(id);
  target.path = newDir;
  await projectList.update(target);
}

module.exports = {
  createNewProject,
  updateComponentPath,
  removeComponentPath,
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
  renameProject
};
