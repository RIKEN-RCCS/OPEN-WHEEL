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

/**
 * get array of child components
 * @param {string} projectRootDir - projectRootDir's absolute path
 * @param {string} parentID - parent component's ID
 * @return {Object[]} - array of components
 */
async function getChildren(projectRootDir, parentID) {
  const dir = await getComponentDir(projectRootDir, parentID, true);
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
  const wf = await readComponentJson(rootComponentDir);
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

module.exports = {
  getChildren,
  getThreeGenerationFamily
};
