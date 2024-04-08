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

function forKeepLoopInstance(component, cwfDir) {
  if (Number.isInteger(component.keep) && component.keep >= 0) {
    const deleteComponentInstance = component.keep === 0 ? component.currentIndex - component.step : component.currentIndex - (component.keep * component.step);
    if (deleteComponentInstance >= 0) {
      fs.remove(path.resolve(cwfDir, `${component.originalName}_${sanitizePath(deleteComponentInstance)}`));
    }
  }
}

function whileKeepLoopInstance(component, cwfDir) {
  if (Number.isInteger(component.keep) && component.keep >= 0) {
    const deleteComponentInstance = component.keep === 0 ? component.currentIndex - 1 : component.currentIndex - component.keep;
    if (deleteComponentInstance >= 0) {
      fs.remove(path.resolve(cwfDir, `${component.originalName}_${sanitizePath(deleteComponentInstance)}`));
    }
  }
}

function foreachKeepLoopInstance(component, cwfDir) {
  if (Number.isInteger(component.keep) && component.keep >= 0) {
    const currentIndexNumber = component.currentIndex !== null ? component.indexList.indexOf(component.currentIndex) : component.indexList.length;
    const deleteComponentNumber = component.keep === 0 ? currentIndexNumber - 1 : currentIndexNumber - component.keep;
    const deleteComponentName = deleteComponentNumber >= 0 ? `${component.originalName}_${sanitizePath(component.indexList[deleteComponentNumber])}` : "";
    if (deleteComponentName) {
      fs.remove(path.resolve(cwfDir, deleteComponentName));
    }
  }
}

function whileGetNextIndex(component) {
  return component.currentIndex !== null ? component.currentIndex + 1 : 0;
}

async function whileIsFinished(cwfDir, projectRootDir, component) {
  const cwd = path.resolve(cwfDir, component.name);
  const condition = await evalCondition(projectRootDir, component.condition, cwd, component.currentIndex);
  return !condition;
}

function foreachGetNextIndex(component) {
  if (component.currentIndex !== null) {
    const i = component.indexList.findIndex((e)=>{
      return e === component.currentIndex;
    });

    if (i === -1 || i === component.indexList.length - 1 ) {
      return null;
    }
    return component.indexList[i + 1];
  }
  return component.indexList[0];
}

function foreachIsFinished(component) {
  return component.currentIndex === null;
}
function foreachTripCount(component) {
  return component.indexList.length;
}

function loopInitialize(component, getTripCount) {
  component.initialized = true;
  component.originalName = component.name;
  component.numFinished = 0;
  component.numFailed = 0;
  component.currentIndex = null;

  if (typeof getTripCount === "function") {
    component.numTotal = getTripCount(component);
  }
  if (!component.env) {
    component.env = {};
  }
  if (component.type.toLowerCase() === "for") {
    component.env.WHEEL_FOR_START = component.start;
    component.env.WHEEL_FOR_END = component.end;
    component.env.WHEEL_FOR_STEP = component.step;
  } else if (component.type.toLowerCase() === "while") {
    component.env.WHEEL_FOREACH_LEN = component.numTotal;
  }
}

module.exports = {
  loopInitialize,
  forGetNextIndex,
  forIsFinished,
  forTripCount,
  forKeepLoopInstance,
  whileGetNextIndex,
  whileIsFinished,
  whileKeepLoopInstance,
  foreachGetNextIndex,
  foreachIsFinished,
  foreachTripCount,
  foreachKeepLoopInstance
};
