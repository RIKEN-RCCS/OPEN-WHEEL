/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import { getLogger } from "../logSettings.js";
const _internal = {
  getLogger
};

/**
 * extract node in cycle graph from search path aquired from getCycleGraph
 * @param {string[]} graphPath - array of component IDs in search path
 * @returns {string[]} - component IDs in cycle graph
 */
export function getComponentIDsInCycle(graphPath) {
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

/**
 * return dependent component
 * @param {object[]} components - sibling components
 * @param {object} component - target component
 * @returns {object[]} - components which depends on specified component
 */
export function getNextComponents(components, component) {
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
_internal.getNextComponents = getNextComponents;

/**
 * DFS to detect cycle
 * @param {string} projectRootDir - project's root path
 * @param {object[]} components - array of components
 * @param {object} startComponent - start point of traverse
 * @param {object} results - cycle graph detection result
 * @param {object} cyclePath - graph traverse path
 * @returns {boolean} - found circuler path or not
 */
export function isCycleGraph(projectRootDir, components, startComponent, results, cyclePath) {
  const nextComponents = _internal.getNextComponents(components, startComponent);
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
      _internal.getLogger(projectRootDir).debug("cycle graph found!!", component.name, cyclePath);
      return true;
    }
    const found = _internal.isCycleGraph(projectRootDir, components, component, results, cyclePath);
    if (found) {
      return true;
    }
  }
  results[startComponent.ID] = "black";
  cyclePath.pop();
  return false;
}
_internal.isCycleGraph = isCycleGraph;

/**
 * get components which are in circuler sub graph
 * @param {string} projectRootDir - project's root path
 * @param {object[]} components - array of components
 * @returns {object[]} - components which are in cierculer sub graph
 */
export function getCycleGraph(projectRootDir, components) {
  const results = {};
  components.forEach((e)=>{
    results[e.ID] = "white";
  });
  const cycleComponentIDs = [];

  for (const component of components) {
    const cyclePath = [];
    if (results[component.ID] === "white") {
      _internal.isCycleGraph(projectRootDir, components, component, results, cyclePath);
    }
    cycleComponentIDs.push(...getComponentIDsInCycle(cyclePath));
  }

  return cycleComponentIDs;
}

export { _internal };
