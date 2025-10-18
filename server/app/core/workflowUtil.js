/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path = require("path");
const { promisify } = require("util");
const glob = require("glob");
const { readJsonGreedy } = require("./fileUtils");
const { componentJsonFilename } = require("../db/db");
const { getComponentDir, readComponentJson } = require("./componentJsonIO.js");
const { hasChild } = require("./workflowComponent");

const _internal = {
  promisify,
  readJsonGreedy,
  getComponentDir,
  readComponentJson,
  hasChild,
  getChildren
};

/**
 * get array of child components
 * @param {string} projectRootDir - project's root path
 * @param {string} parentID - parent component's ID
 * @returns {object[]} - array of components
 */
async function getChildren(projectRootDir, parentID) {
  const dir = await _internal.getComponentDir(projectRootDir, parentID, true);
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
 * return component,  its children, and grandsons
 * @param {string} projectRootDir - project's root path
 * @param {string} rootComponentDir - path of component to be obrained
 * @returns {object} - nested component JSON object
 */
async function getThreeGenerationFamily(projectRootDir, rootComponentDir) {
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

module.exports = {
  getChildren,
  getThreeGenerationFamily,
  componentJsonFilename
};

if (process.env.NODE_ENV === "test") {
  module.exports._internal = _internal;
}
