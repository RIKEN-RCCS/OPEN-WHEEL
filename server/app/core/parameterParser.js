/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const { promisify } = require("util");
const glob = require("glob");

/**
 * expand array of glob and return flat array of path
 * @param {string[]} globs - array contains glob
 * @param {string} cwd - working directory for globbing
 * @returns {string[]} - array of path
 */
async function expandArrayOfGlob(globs, cwd) {
  const names = await Promise.all(
    globs.map((e)=>{
      return promisify(glob)(e, { cwd });
    })
  );
  return Array.prototype.concat.apply([], names);
}

/**
 * check if the combination of min, max, and step is valid
 * @param {number} min - one end point
 * @param {number} max - the other ent point
 * @param {number} step - step width
 * @returns {boolean} -
 */
function isValidParamAxis(min, max, step) {
  if (max > min) {
    return step > 0;
  }
  if (max < min) {
    return step < 0;
  }
  //max == min
  return true;
}

/**
 * get size of parameters in the min-max-step type axis
 * @param {number} min - one end point
 * @param {number} max - the other ent point
 * @param {number} step - step width
 * @returns {number} -
 */
function calcParamAxisSize(min, max, step) {
  let modifiedMax = max;
  let modifiedMin = min;
  let modifiedStep = step;
  if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || !Number.isSafeInteger(step) ) {
    const significantDigits = [min, max, step].reduce((a, e)=>{
      const digits = getDigitsAfterTheDecimalPoint(e);
      return Math.max(a, digits);
    }, 0);
    const iMax = max * 10 ** significantDigits;
    const iMin = min * 10 ** significantDigits;
    const iStep = step * 10 ** significantDigits;
    if (Number.isSafeInteger(iMax) && Number.isSafeInteger(iMin) && Number.isSafeInteger(iStep)) {
      modifiedMax = iMax;
      modifiedMin = iMin;
      modifiedStep = iStep;
    }
  }
  return Math.floor((modifiedMax - modifiedMin) / Math.abs(modifiedStep)) + 1;
}

/**
 * get number of parameter in the axis
 * @param {object} axis - paramter set
 * @returns {number} -
 */
function getParamAxisSize(axis) {
  if (Array.isArray(axis.list)) {
    return axis.list.length;
  }
  if (typeof axis.type === "undefined") {
    return calcParamAxisSize(axis.min, axis.max, axis.step);
  }
  switch (axis.type) {
    case "string":
      return axis.list.length;
    case "file":
      return axis.list.length;
    case "integer":
      return calcParamAxisSize(axis.min, axis.max, axis.step);
    case "float":
      return calcParamAxisSize(axis.min, axis.max, axis.step);
    case "min-max-step":
      return calcParamAxisSize(axis.min, axis.max, axis.step);
    default:
      throw new Error("unknown axis.type");
  }
}

/**
 * get the number of decimal places
 * @param {number} val - integer or fixed-point number
 * @returns {number} -
 */
function getDigitsAfterTheDecimalPoint(val) {
  const strVal = val.toString();
  return strVal.indexOf(".") !== -1 ? strVal.length - strVal.indexOf(".") - 1 : 0;
}

/**
 * get n-th parameter value in the axis
 * @param {number} n - index number
 * @param {object} axis - paramter set
 * @returns {string} - n-th parameter
 */
function getNthValue(n, axis) {
  if (Array.isArray(axis.list)) {
    return axis.list[n].toString();
  }
  let rt = (axis.step > 0 ? axis.min : axis.max) + axis.step * n;
  if (!Number.isInteger(rt)) {
    const significantDigits = [axis.min, axis.max, axis.step].reduce((a, e)=>{
      const digits = getDigitsAfterTheDecimalPoint(e);
      return Math.max(a, digits);
    }, 0);
    rt = rt.toFixed(significantDigits);
  }
  return rt.toString();
}

/**
 * get Nth parameter vector
 * @param {number} argN - index of needed param
 * @param {object} ParamSpace - parameter space
 * @returns {object} - parameter vector
 */
function getNthParamVec(argN, ParamSpace) {
  const paramVec = [];
  let n = argN;
  for (let i = 0; i < ParamSpace.length; i++) {
    const axis = ParamSpace[i];
    const l = getParamAxisSize(axis);
    const j = n % l;
    const value = getNthValue(j, axis);
    paramVec.push({ key: axis.keyword, value, type: axis.type });
    n = Math.floor(n / l);
  }
  return paramVec;
}

/**
 * get total number of parameters in parameter space
 * @param {object} ParamSpace - parameter space
 * @returns {number} -
 */
function getParamSize(ParamSpace) {
  return ParamSpace.reduce((p, a)=>{
    const paramAxisSize = getParamAxisSize(a);
    return paramAxisSize !== 0 ? p * paramAxisSize : p;
  }, 1);
}

/**
 * return parameter vector
 * @param {object} ParamSpace - parameter space
 * @yields {object} -
 */
function *paramVecGenerator(ParamSpace) {
  const totalSize = getParamSize(ParamSpace);
  let index = 0;
  while (index < totalSize) {
    yield getNthParamVec(index, ParamSpace);
    index++;
  }
}

/**
 * get array of filename in parameter space
 * @param {object} ParamSpace - parameter space
 * @returns {string[]} -
 */
function getFilenames(ParamSpace) {
  return ParamSpace.reduce((p, c)=>{
    if (c.type !== "file") {
      return p;
    }
    return p.concat(c.list);
  }, []);
}

/**
 * remove invalid parameter from parameter space
 * @param {object []} paramSpace - array of parameters
 * @param {string} cwd - working directory for globbing
 * @returns {object []} - parameter space which does not contain invalid parameter
 */
async function getParamSpacev2(paramSpace, cwd) {
  const cleanParamSpace = paramSpace.filter((e)=>{
    if (Object.prototype.hasOwnProperty.call(e, "min")
      && Object.prototype.hasOwnProperty.call(e, "max")
      && Object.prototype.hasOwnProperty.call(e, "step")) {
      return isValidParamAxis(e.min, e.max, e.step);
    }
    if (Array.isArray(e.list)) {
      return e.list.length > 0;
    }
    if (Array.isArray(e.files)) {
      return e.files.length > 0;
    }
    return false;
  });
  for (const param of cleanParamSpace) {
    if (Object.prototype.hasOwnProperty.call(param, "files")) {
      param.type = "file";
      param.list = await expandArrayOfGlob(param.files, cwd);
    }
  }
  return cleanParamSpace;
}

module.exports = {
  paramVecGenerator,
  getParamSize,
  getFilenames,
  getParamSpacev2
};
