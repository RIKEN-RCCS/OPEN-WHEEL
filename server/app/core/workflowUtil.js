/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path = require("path");
const fs = require("fs-extra");
const { promisify } = require("util");
const glob = require("glob");
const { getLogger } = require("../logSettings.js");
const { readJsonGreedy } = require("./fileUtils.js");
const { projectJsonFilename, componentJsonFilename } = require("../db/db.js");
const { hasChild, isComponent } = require("./workflowComponent.js");
const { getProjectJson } = require("./projectFilesOperator.js");

/**
 * get absolute path of component directory
 * @param {string} projectRootDir - projectRootDir's absolute path
 * @param {string} targetID - target component's ID
 * @returns {string} - absolute path of target component's template dir
 */
async function getComponentDir(projectRootDir, targetID) {
  const projectJson = await readJsonGreedy(path.resolve(projectRootDir, projectJsonFilename));
  const componentPath = projectJson.componentPath[targetID];
  return componentPath ? path.resolve(projectRootDir, componentPath) : null;
}

/**
 * get relative path from src component to target component
 * @param {string} projectRootDir - projectRootDir's absolute path
 * @param {string} targetID - target component's ID
 * @param {string} srcID - src component's ID
 * @return {string} - relative path from src component to target component
 */
async function getComponentRelativePath(projectRootDir, targetID, srcID) {
  const projectJson = await readJsonGreedy(path.resolve(projectRootDir, projectJsonFilename));
  const srcPath = srcID ? projectJson.componentPath[srcID] : projectRootDir;
  const targetPath = projectJson.componentPath[targetID];
  if (typeof targetPath === "undefined") {
    return targetPath;
  }
  return path.relative(srcPath, targetPath);
}

/**
 * get component JSON data
 * @param {string} projectRootDir - projectRootDir's absolute path
 * @param {string | Object} component - target component's ID or component JSON data
 * @returns {Object} - component JSON data
 */
async function getComponent(projectRootDir, component) {
  if (typeof component !== "string") {
    return isComponent(component) ? component : null;
  }
  let componentJson = component; //component is treated as component Json object by default
  const isFilePath = await fs.pathExists(component);
  if (isFilePath) {
    //component is path of component Json file
    componentJson = await readJsonGreedy(component);
  } else {
    //component should be ID string
    const componentDir = await getComponentDir(projectRootDir, component);
    if (await fs.pathExists(componentDir)) {
      componentJson = await readJsonGreedy(path.resolve(componentDir, componentJsonFilename));
    } else {
      componentJson = null;
    }
  }

  return componentJson;
}

/**
 * get array of child components
 * @param {string} projectRootDir - projectRootDir's absolute path
 * @param {string} parentID - parent component's ID
 * @return {Object[]} - array of components
 */
async function getChildren(projectRootDir, parentID) {
  const dir = await getComponentDir(projectRootDir, parentID);
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
 * return component,  its children, and grandsons
 * @param {string} projectRootDir - project's root path
 * @param {strint} rootComponentDir - path of component to be obrained
 * @returns {Object} - nested component JSON object
 */
async function getThreeGenerationFamily(projectRootDir, rootComponentDir) {
  const wf = await getComponent(projectRootDir, path.resolve(rootComponentDir, componentJsonFilename));
  const rt = Object.assign({}, wf);
  rt.descendants = await getChildren(projectRootDir, wf.ID);

  for (const child of rt.descendants) {
    if (child.handler) {
      delete child.handler;
    }
    if (hasChild(child)) {
      const grandson = await getChildren(projectRootDir, child.ID);
      child.descendants = grandson.map((e)=>{
        if (e.type === "task") {
          return { type: e.type, pos: e.pos, host: e.host, useJobScheduler: e.useJobScheduler };
        }
        return { type: e.type, pos: e.pos };
      });
    }
  }
  return rt;
}

/**
 * extract node in cycle graph from search path aquired from getCycleGraph
 * @param {string[]} graphPath - array of component IDs in search path
 * @return {string[]} - component IDs in cycle graph
 */
function getComponentIDsInCycle(graphPath) {
  if (graphPath.length === 0) {
    return [];
  }
  const lastID = graphPath.pop();
  const rt = [];
  for (let i = graphPath.length - 1; i >= 0; i--) {
    rt.push(graphPath[i]);
    if (graphPath[i] === lastID) {
      break;
    }
  }
  return rt;
}

function getNextComponents(components, component) {
  const nextComponentIDs = [];
  if (component.next) {
    nextComponentIDs.push(...component.next);
  }
  if (component.else) {
    nextComponentIDs.push(...component.else);
  }
  if (Array.isArray(component.outputFiles)) {
    component.outputFiles.forEach((outputFile)=>{
      const tmp = outputFile.dst.map((e)=>{
        if (Object.prototype.hasOwnProperty.call(e, "origin")) {
          return null;
        }
        if (e.dstNode !== component.parent) {
          return e.dstNode;
        }
        return null;
      }).filter((e)=>{
        return e !== null;
      });
      nextComponentIDs.push(...tmp);
    });
  }
  const removeDuplicated = Array.from(new Set(nextComponentIDs));
  const nextComponents = components.filter((component)=>{
    return removeDuplicated.includes(component.ID);
  });
  return nextComponents;
}

/**
 * DFS to detect cycle
 * @param {string} projectRootDir - project's root path
 * @param {Object[]} components - array of components
 * @param {Object} startComponent - start point of traverse
 * @param {Object} cyclePath - graph traverse path
 * @return {Boolean} - found circuler path or not
 */
function isCycleGraph(projectRootDir, components, startComponent, results, cyclePath) {
  const nextComponents = getNextComponents(components, startComponent);
  results[startComponent.ID] = "gray";
  cyclePath.push(startComponent.ID);
  if (nextComponents === null) {
    results[startComponent.ID] = "black";
    return false;
  }
  for (const component of nextComponents) {
    if (results[component.ID] === "black") {
      continue;
    }
    if (results[component.ID] === "gray") {
      cyclePath.push(component.ID);
      getLogger(projectRootDir).trace("DEBUG found!!", component.name, cyclePath);
      return true;
    }
    const found = isCycleGraph(projectRootDir, components, component, results, cyclePath);
    if (found) {
      return true;
    }
  }
  cyclePath.pop();
  return false;
}

/**
 * get components which are in circuler sub graph
 * @param {string} projectRootDir - project's root path
 * @param {Object[]} components - array of components
 * @return {Object[]} - components which are in cierculer sub graph
 */
function getCycleGraph(projectRootDir, components) {
  const results = {};
  components.forEach((e)=>{
    results[e.ID] = "white";
  });
  const cycleComponentIDs = [];

  for (const component of components) {
    const cyclePath = [];
    if (results[component.ID] === "white") {
      isCycleGraph(projectRootDir, components, component, results, cyclePath);
    }
    cycleComponentIDs.push(...getComponentIDsInCycle(cyclePath));
  }

  return cycleComponentIDs;
}

/**
 * check specified component's children has circuler dependency or not
 * @param {string} projectRootDir - project's root path
 * @param {Object} parentComponentID - target component's ID
 * @return {Object[]} - array of components in cycle graph
 */
async function checkComponentDependency(projectRootDir, parentComponentID) {
  const children = await getChildren(projectRootDir, parentComponentID);
  const rt = getCycleGraph(projectRootDir, children);
  getLogger(projectRootDir).debug("cycle graph found !", rt);

  const { componentPath } = await getProjectJson(projectRootDir);
  const cycleComponents = rt.map((id)=>{
    return componentPath[id].replace(/^./, "");
  });
  getLogger(projectRootDir).info("cycle graph found \n", cycleComponents);
  return rt;
}

module.exports = {
  getComponentDir,
  getComponent,
  getComponentRelativePath,
  getThreeGenerationFamily,
  checkComponentDependency
};
