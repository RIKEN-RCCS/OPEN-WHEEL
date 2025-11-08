/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import fs from "fs-extra";
import path from "path";
import isPathInside from "is-path-inside";
import { glob } from "glob";
import { getLogger } from "../logSettings.js";
import { projectJsonFilename, componentJsonFilename, defaultPSconfigFilename } from "../db/db.js";
import { readJsonGreedy } from "./fileUtils.js";
import { makeDir, writeJsonWrapper, isValidName, glob2Array } from "../lib/utility.js";
import { gitAdd, gitRm } from "./gitOperator2.js";
import { componentFactory, getComponentDefaultName } from "./workflowComponent.js";
import { getComponentDir, writeComponentJson, readComponentJson, readComponentJsonByID, writeComponentJsonByID } from "./componentJsonIO.js";
import { updateComponentPath, removeComponentPath } from "./componentPathOperations.js";
import { removeAllLinkFromComponent } from "./componentLinks.js";
import { setUploadOndemandOutputFile } from "./componentFiles.js";
import { getAllComponentIDs } from "./projectJsonFileOperator.js";
import { isParent } from "./componentUtility.js";

const _internal = {
  fs,
  path,
  glob,
  getLogger,
  readJsonGreedy,
  writeJsonWrapper,
  gitAdd,
  gitRm,
  componentFactory,
  makeDir,
  isValidName,
  glob2Array,
  writeComponentJson,
  readComponentJson,
  readComponentJsonByID,
  writeComponentJsonByID,
  updateComponentPath,
  removeComponentPath,
  getComponentDir,
  removeAllLinkFromComponent,
  setUploadOndemandOutputFile,
  getAllComponentIDs,
  isParent,
  rewriteIncludeExclude: null //Will be set after function definition
};

/**
 * create new component in parentDir
 * @param {string} projectRootDir - project's root path
 * @param {string} parentDir - parent component's directory path
 * @param {string} type - component type
 * @param {object} pos - component's cordinate in browser
 * @returns {object} component
 */
export async function createNewComponent(projectRootDir, parentDir, type, pos) {
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
 * remove component
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - ID of component to be removed
 * @returns {Promise} - resolved after updated
 */
export async function removeComponent(projectRootDir, ID) {
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
 * perform git mv and update component path in projectJson file
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - ID of component to be renamed
 * @param {string} newName - new name
 * @returns {Promise} - resolved when rename is done
 */
export async function renameComponentDir(projectRootDir, ID, newName) {
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

  //Update the name property in component JSON before moving
  const componentJson = await _internal.readComponentJson(oldDir);
  componentJson.name = newName;
  await _internal.writeComponentJson(projectRootDir, oldDir, componentJson);

  await _internal.gitRm(projectRootDir, oldDir);
  await _internal.fs.move(oldDir, newDir);
  await _internal.gitAdd(projectRootDir, newDir);
  return _internal.updateComponentPath(projectRootDir, ID, newDir);
};

/**
 * arrange next/previous setting of stepjobTask
 * @param {object[]} stepjobGroupArray - array of stepjob components
 * @returns {object[]} - updated stepjob components
 */
export async function arrangeComponent(stepjobGroupArray) {
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
 * update stepnumber all stepjobTask component in project
 * @param {string} projectRootDir - project's root path
 * @returns {Promise} - resolved when update is done
 */
export async function updateStepNumber(projectRootDir) {
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
 * get '/' separated component's hierarchial name
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - target component's ID
 * @returns {string} - absolute path of target component's template dir
 */
export async function getComponentFullName(projectRootDir, ID) {
  const relativePath = await _internal.getComponentDir(projectRootDir, ID);
  if (relativePath === null) {
    return relativePath;
  }
  return relativePath.replace(/^\./, "");
}

/**
 * determin specified path is componennt dir or not
 * @param {string} target - directory path
 * @returns {boolean} - whether given path is component directory or not
 */
export async function isComponentDir(target) {
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
export async function getComponentTree(projectRootDir, rootDir) {
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
    throw new Error("root component not found");
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

/**
 * get all srouce components in project
 * @param {string} projectRootDir - project's root path
 * @returns {object[]} - array of source component
 */
export async function getSourceComponents(projectRootDir) {
  const componentJsonFiles = await _internal.glob(path.join(projectRootDir, "**", componentJsonFilename));
  const components = await Promise.all(componentJsonFiles
    .map((componentJsonFile)=>{
      return _internal.readJsonGreedy(componentJsonFile);
    }));

  return components.filter((componentJson)=>{
    return componentJson.type === "source" && !componentJson.subComponent && !componentJson.disable;
  });
};

/**
 * read component JSON file and return children's ID
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - ID string of search root component
 * @returns {string[]} - array of id string
 */
export async function getDescendantsIDs(projectRootDir, ID) {
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
 * convert old include exclude format (comma separated string) to array of string
 * @param {string} projectRootDir - project's root path
 * @param {string} filename - component json filename
 * @param {string[]} changed - array of filename which is changed
 */
export async function rewriteIncludeExclude(projectRootDir, filename, changed) {
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

//Set _internal.rewriteIncludeExclude after function definition to avoid circular reference
_internal.rewriteIncludeExclude = rewriteIncludeExclude;

/**
 * convert comma separated include and exclude prop to array of string
 * @param {string} projectRootDir - project's root path
 * @param {string[]} changed - array of filename which is changed
 */
export async function rewriteAllIncludeExcludeProperty(projectRootDir, changed) {
  //convert include and exclude property to array
  const files = await _internal.glob(`./**/${componentJsonFilename}`, { cwd: projectRootDir });
  await Promise.all(files.map((filename)=>{
    return _internal.rewriteIncludeExclude(projectRootDir, path.resolve(projectRootDir, filename), changed);
  }));
};

//Add exported functions to _internal for testing purposes
_internal.getDescendantsIDs = getDescendantsIDs;
_internal.renameComponentDir = renameComponentDir;
_internal.arrangeComponent = arrangeComponent;

export { _internal };
