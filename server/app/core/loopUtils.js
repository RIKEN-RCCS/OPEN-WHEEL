/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import fs from "fs-extra";
import path from "path";
import { sanitizePath } from "./pathUtils.js";
import { evalCondition } from "./dispatchUtils.js";
import { readComponentJson } from "./componentJsonIO.js";

const _internal = {
  fs,
  evalCondition,
  readComponentJson,
  getInstanceDirectoryName
};

/**
 * return instance directory name
 * @param {object} component - component object
 * @param {string} index - index Value (default currentIndex);
 * @param {string} originalName - template component's name (default component.originalName);
 * @returns {string} - instance directory's name
 */
function getInstanceDirectoryName(component, index, originalName) {
  const suffix = typeof index !== "undefined" ? index : component.currentIndex;
  const name = typeof originalName === "string" ? originalName : component.originalName;
  const separator = component.instanceDirSeparator || "_";
  return `${name}${separator}${sanitizePath(suffix)}`;
}
_internal.getInstanceDirectoryName = getInstanceDirectoryName;

const maxInstanceDirSeparatorEscalation = 5;

/**
 * decide a name-to-index separator ("_", "__", "___", ...) for this loop's
 * instance directories that does not collide with anything already sitting
 * next to the loop template - including plain files/directories and
 * unrelated components, not just this loop's own previous instances
 * @param {object} component - component object (component.name must already be the template name)
 * @param {string} cwfDir - current workflow directory
 * @returns {Promise<string>} - separator to use for every instance directory of this loop
 */
async function chooseInstanceDirSeparator(component, cwfDir) {
  const entries = await _internal.fs.readdir(cwfDir).catch(()=>{
    return [];
  });
  let separator = "_";
  for (let attempt = 0; attempt < maxInstanceDirSeparatorEscalation; attempt++) {
    const prefix = `${component.name}${separator}`;
    let conflict = false;
    for (const entry of entries) {
      if (!entry.startsWith(prefix)) {
        continue;
      }
      const entryJson = await _internal.readComponentJson(path.resolve(cwfDir, entry)).catch(()=>{
        return null;
      });
      //a legitimate previous instance of THIS loop always shares its ID
      //(see getInstanceDirectoryName callers in dispatcher.js) - anything
      //else, including non-component entries, is a real collision
      if (entryJson === null || entryJson.ID !== component.ID) {
        conflict = true;
        break;
      }
    }
    if (!conflict) {
      return separator;
    }
    separator += "_";
  }
  throw new Error(`unable to find a non-colliding instance directory naming scheme for component "${component.name}" after ${maxInstanceDirSeparatorEscalation} attempts`);
}
_internal.chooseInstanceDirSeparator = chooseInstanceDirSeparator;

/**
 * return previous index
 * @param {object} component - component object
 * @param {boolean} forceCalc - ignore component.prevIndex or not
 * @returns {number | null} - previous index
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

/**
 * remove unnecessary instance directories
 * @param {object} component - component object
 * @param {string} cwfDir - current workflow directory
 * @returns {Promise} - resolved when unnecessary directories are removed
 */
async function keepLoopInstance(component, cwfDir) {
  if (!Number.isInteger(component.keep) || component.keep <= 0) {
    return;
  }
  const step = component.step || 1;
  const deleteComponentInstance = component.currentIndex - (component.keep * step);
  if (deleteComponentInstance >= 0) {
    const target = path.resolve(cwfDir, _internal.getInstanceDirectoryName(component, deleteComponentInstance));
    return _internal.fs.remove(target);
  }
}

/**
 * get next index of for component
 * @param {object} component - component object
 * @returns {number} - next index
 */
function forGetNextIndex(component) {
  return component.currentIndex !== null ? component.currentIndex + component.step : component.start;
}

/**
 * determine if for component is finished
 * @param {object} component - component object
 * @returns {boolean} -
 */
function forIsFinished(component) {
  return (component.currentIndex > component.end && component.step > 0) || (component.currentIndex < component.end && component.step < 0);
}

/**
 * get total number of for component's loop trip
 * @param {object} component - component object
 * @returns {number} - size of for component
 */
function forTripCount(component) {
  const length = Math.abs(component.end - component.start);
  const step = Math.abs(component.step);
  return Math.floor(length / step) + 1;
}

/**
 * get next index of while component
 * @param {object} component - component object
 * @returns {number} - next index
 */
function whileGetNextIndex(component) {
  return component.currentIndex !== null ? component.currentIndex + 1 : 0;
}

/**
 * determine if while component is finished
 * @param {string} cwfDir - current workflow directory
 * @param {string} projectRootDir - project's root path
 * @param {object} component - component object
 * @param {object} env - environment variable
 * @returns {boolean} -
 */
async function whileIsFinished(cwfDir, projectRootDir, component, env) {
  const cwd = path.resolve(cwfDir, component.name);
  //work around
  //when WHEEL_CURRENT_INDEX is not defined, some code regards as special case
  //but whileIsFinished needs this value while evaluting condition definition script
  //for first loop trip. so we add this prop here. this only used in evalCondition
  //and never affect component.env and Dispatcher.env
  env.WHEEL_CURRENT_INDEX = component.currentIndex || 0;
  const condition = await _internal.evalCondition(projectRootDir, component.condition, cwd, env);
  return !condition;
}

/**
 * get next index of foreach component
 * @param {object} component - component object
 * @returns {number} - next index
 */
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

/**
 * get previous index of foreach component
 * @param {object} component - component object
 * @param {boolean} forceCalc - ignore component.prevIndex or not
 * @returns {number | null} - previous index. null means out of range (current index is 0)
 */
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

/**
 * determine foreach component is finished
 * @param {object} component - component object
 * @returns {boolean} -
 */
function foreachIsFinished(component) {
  return !component.indexList.includes(component.currentIndex);
}

/**
 * get total number of foreach component's loop trip
 * @param {object} component - component object
 * @returns {boolean} -
 */
function foreachTripCount(component) {
  return component.indexList.length;
}

/**
 * remove unnecessary instance directories
 * @param {object} component - component object
 * @param {string} cwfDir - current workflow directory
 * @returns {Promise} - resolved when unnecessary directories are removed
 */
async function foreachKeepLoopInstance(component, cwfDir) {
  if (!Number.isInteger(component.keep) || component.keep <= 0) {
    return;
  }

  const currentIndexNumber = component.currentIndex !== null ? component.indexList.indexOf(component.currentIndex) : component.indexList.length;
  const deleteComponentNumber = currentIndexNumber - component.keep;
  const deleteComponentName = deleteComponentNumber >= 0 ? _internal.getInstanceDirectoryName(component, component.indexList[deleteComponentNumber]) : "";
  if (deleteComponentName) {
    return _internal.fs.remove(path.resolve(cwfDir, deleteComponentName));
  }
}

/**
 * get latest finished index of foreach component
 * @param {object} component - component object
 * @param {string} cwfDir - current workflow directory
 * @returns {number |null}  - latest finished index. null means no instance is done
 */
async function foreachSearchLatestFinishedIndex(component, cwfDir) {
  let rt = null;
  for (const index of component.indexList) {
    const dir = path.resolve(cwfDir, _internal.getInstanceDirectoryName(component, index));
    try {
      const { state } = await _internal.readComponentJson(dir);
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

/**
 * initialize for/foreach/while component
 * @param {object} component - component object
 * @param {Function} getTripCount - getTripCount function for specified component
 * @param {string} cwfDir - current workflow directory
 */
async function loopInitialize(component, getTripCount, cwfDir) {
  component.numFinished = 0;
  component.numFailed = 0;
  component.currentIndex = 0;
  if (Array.isArray(component.indexList)) {
    component.currentIndex = component.indexList[0];
  } else if (typeof component.start !== "undefined") {
    component.currentIndex = component.start;
  }
  component.originalName = component.name;
  component.instanceDirSeparator = await _internal.chooseInstanceDirSeparator(component, cwfDir);
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

export {
  getPrevIndex,
  getInstanceDirectoryName,
  chooseInstanceDirSeparator,
  keepLoopInstance,
  forGetNextIndex,
  forIsFinished,
  forTripCount,
  whileGetNextIndex,
  whileIsFinished,
  foreachGetNextIndex,
  foreachGetPrevIndex,
  foreachIsFinished,
  foreachTripCount,
  foreachKeepLoopInstance,
  foreachSearchLatestFinishedIndex,
  loopInitialize,
  _internal
};
