/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const fs = require("fs-extra");
const path = require("path");
const { sanitizePath } = require("./pathUtils");
const { evalCondition } = require("./dispatchUtils");
const { readComponentJson } = require("./componentJsonIO.js");

/**
 * return instance directory name
 * @param {Object} component - component object
 * @param {string} index - index Value (default currentIndex);
 * @param {string} originalName - template component's name (default component.originalName);
 * @return {string} - instance directory's name
 */
function getInstanceDirectoryName(component, index, originalName) {
  const suffix = typeof index !== "undefined" ? index : component.currentIndex;
  const name = typeof originalName === "string" ? originalName : component.originalName;
  return `${name}_${sanitizePath(suffix)}`;
}

/**
 * return previous index
 * @param {Object} component - component object
 * @param {Boolean} forceCalc - ignore component.prevIndex or not
 * @return {number | null} - previous index
 *
 * if getPrevIndex is called in first loop, this function returns null
 */
function getPrevIndex(component, forceCalc) {
  if (!forceCalc && typeof component.prevIndex !== "undefined") {
    return component.prevIndex;
  }
  const step = component.step || 1;
  const start = component.start || 0;
  const candidate = component.currentIndex - step;
  return (candidate - start) * step >= 0 ? candidate : null;
}

async function keepLoopInstance(component, cwfDir) {
  if (!Number.isInteger(component.keep) || component.keep <= 0) {
    return;
  }
  const step = component.step || 1;
  const deleteComponentInstance = component.currentIndex - (component.keep * step);
  if (deleteComponentInstance >= 0) {
    const target = path.resolve(cwfDir, getInstanceDirectoryName(component, deleteComponentInstance));
    return fs.remove(target);
  }
}

function forGetNextIndex(component) {
  return component.currentIndex !== null ? component.currentIndex + component.step : component.start;
}
function forIsFinished(component) {
  return (component.currentIndex > component.end && component.step > 0) || (component.currentIndex < component.end && component.step < 0);
}
function forTripCount(component) {
  const length = Math.abs(component.end - component.start);
  const step = Math.abs(component.step);
  return Math.floor(length / step) + 1;
}
async function forKeepLoopInstance(component, cwfDir) {
  if (!Number.isInteger(component.keep) || component.keep <= 0) {
    return;
  }
  const deleteComponentInstance = component.currentIndex - (component.keep * component.step);
  if (deleteComponentInstance >= 0) {
    return fs.remove(path.resolve(cwfDir, getInstanceDirectoryName(component, deleteComponentInstance)));
  }
}
function whileGetNextIndex(component) {
  return component.currentIndex !== null ? component.currentIndex + 1 : 0;
}
async function whileIsFinished(cwfDir, projectRootDir, component) {
  const cwd = path.resolve(cwfDir, component.name);
  const condition = await evalCondition(projectRootDir, component.condition, cwd, component.env);
  return !condition;
}
async function whileKeepLoopInstance(component, cwfDir) {
  if (!Number.isInteger(component.keep) || component.keep <= 0) {
    return;
  }
  const deleteComponentInstance = component.currentIndex - component.keep;
  if (deleteComponentInstance >= 0) {
    return fs.remove(path.resolve(cwfDir, getInstanceDirectoryName(component, deleteComponentInstance)));
  }
}
function foreachGetNextIndex(component) {
  if (component.currentIndex === null) {
    return component.indexList[0];
  }
  const i = component.indexList.findIndex((e)=>{
    return e === component.currentIndex;
  });
  if (i === -1 || i === component.indexList.length - 1) {
    return null;
  }
  return component.indexList[i + 1];
}

function foreachGetPrevIndex(component, forceCalc) {
  if (!forceCalc && typeof component.prevIndex !== "undefined") {
    return component.prevIndex;
  }

  const i = component.indexList.findIndex((e)=>{
    return e === component.currentIndex;
  }) - 1;
  if (i < 0) {
    return null;
  }
  return component.indexList[i];
}

function foreachIsFinished(component) {
  return !component.indexList.includes(component.currentIndex);
}
function foreachTripCount(component) {
  return component.indexList.length;
}

async function foreachKeepLoopInstance(component, cwfDir) {
  if (!Number.isInteger(component.keep) || component.keep <= 0) {
    return;
  }

  const currentIndexNumber = component.currentIndex !== null ? component.indexList.indexOf(component.currentIndex) : component.indexList.length;
  const deleteComponentNumber = currentIndexNumber - component.keep;
  const deleteComponentName = deleteComponentNumber >= 0 ? getInstanceDirectoryName(component, component.indexList[deleteComponentNumber]) : "";
  if (deleteComponentName) {
    return fs.remove(path.resolve(cwfDir, deleteComponentName));
  }
}

async function foreachSearchLatestFinishedIndex(component, cwfDir) {
  let rt = null;
  for (const index of component.indexList) {
    const dir = path.resolve(cwfDir, getInstanceDirectoryName(component, index));
    try {
      const { state } = await readComponentJson(dir);
      if (state === "finished") {
        rt = index;
      } else {
        return rt;
      }
    } catch (err) {
      if (err.code === "ENOENT") {
        return rt;
      }
      throw err;
    }
  }
  return rt;
};

function loopInitialize(component, getTripCount) {
  component.numFinished = 0;
  component.numFailed = 0;
  component.currentIndex = 0;
  if (Array.isArray(component.indexList)) {
    component.currentIndex = component.indexList[0];
  } else if (typeof component.start !== "undefined") {
    component.currentIndex = component.start;
  }
  component.originalName = component.name;
  //getTripCount is null if component.type is "while"
  if (typeof getTripCount === "function") {
    component.numTotal = getTripCount(component);
  }
  if (!component.env) {
    component.env = {};
  }
  if (typeof component.start !== "undefined") {
    component.env.WHEEL_FOR_START = component.start;
  }
  if (typeof component.end !== "undefined") {
    component.env.WHEEL_FOR_END = component.end;
  }
  if (typeof component.step !== "undefined") {
    component.env.WHEEL_FOR_STEP = component.step;
  }
  if (typeof component.numTotal !== "undefined") {
    component.env.WHEEL_LOOP_LEN = component.numTotal;
  }

  if (component.type.toLowerCase() === "foreach") {
    component.env.WHEEL_FOREACH_LEN = component.numTotal;
  }
  component.initialized = true;
}

module.exports = {
  getPrevIndex,
  getInstanceDirectoryName,
  keepLoopInstance,
  forGetNextIndex,
  forIsFinished,
  forTripCount,
  forKeepLoopInstance,
  whileGetNextIndex,
  whileIsFinished,
  whileKeepLoopInstance,
  foreachGetNextIndex,
  foreachGetPrevIndex,
  foreachIsFinished,
  foreachTripCount,
  foreachKeepLoopInstance,
  foreachSearchLatestFinishedIndex,
  loopInitialize
};
