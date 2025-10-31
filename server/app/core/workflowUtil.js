/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import path from "path";
import { glob } from "glob";
import { readJsonGreedy } from "./fileUtils.js";
import { componentJsonFilename } from "../db/db.js";
import { getComponentDir, readComponentJson } from "./componentJsonIO.js";
import { hasChild } from "./workflowComponent.js";

const _internal = {
  glob,
  readJsonGreedy,
  getComponentDir,
  readComponentJson,
  hasChild,
  getChildren: null
};

/**
 * get array of child components
 * @param {string} projectRootDir - project's root path
 * @param {string} parentID - parent component's ID or directory path
 * @param {boolean} isParentDir - if true, parentID is regard as path to parent directory, not ID string
 * @returns {object[]} - array of child components except for subComponent
 */
export async function getChildren(projectRootDir, parentID, isParentDir) {
  const dir = isParentDir ? parentID : parentID === null ? projectRootDir : await _internal.getComponentDir(projectRootDir, parentID, true);
  if (!dir) {
    return [];
  }

  const children = await _internal.glob(path.join(dir, "*", componentJsonFilename));
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
 * return component,  its children, and grandsons
 * @param {string} projectRootDir - project's root path
 * @param {string} rootComponentDir - path of component to be obrained
 * @returns {object} - nested component JSON object
 */
export async function getThreeGenerationFamily(projectRootDir, rootComponentDir) {
  const wf = await _internal.readComponentJson(rootComponentDir);
  const rt = Object.assign({}, wf);
  rt.descendants = await _internal.getChildren(projectRootDir, wf.ID);

  for (const child of rt.descendants) {
    if (child.handler) {
      delete child.handler;
    }
    if (_internal.hasChild(child)) {
      const grandson = await _internal.getChildren(projectRootDir, child.ID);
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

export { _internal };
