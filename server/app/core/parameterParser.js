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

function isValidParamAxis(min, max, step) {
  if (max > min) {
    return step > 0;
  } if (max < min) {
    return step < 0;
  }
  //max == min
  return true;
}

function calcParamAxisSize(min, max, step) {
  let modifiedMax = max;
  let modifiedMin = min;
  let modifiedStep = step;

  if (!min.isInteger || !max.isInteger || !step.isInteger) {
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

function getParamAxisSize(axis) {
  let size = 0;
  if (typeof axis.type === "undefined") {
    //for version 2
    if (axis.hasOwnProperty("list")) {
      size = axis.list.length;
    } else {
      size = calcParamAxisSize(axis.min, axis.max, axis.step);
    }
  } else {
    //for version 1
    switch (axis.type) {
      case "string":
        size = axis.list.length;
        break;
      case "file":
        size = axis.list.length;
        break;
      case "integer":
        size = calcParamAxisSize(axis.min, axis.max, axis.step);
        break;
      case "float":
        size = calcParamAxisSize(axis.min, axis.max, axis.step);
        break;
    }
  }
  return size;
}

function getDigitsAfterTheDecimalPoint(floatVal) {
  const strVal = floatVal.toString();
  return strVal.indexOf(".") !== -1 ? strVal.length - strVal.indexOf(".") - 1 : 0;
}

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

function getNthParamVec(n, ParamSpace) {
  const paramVec = [];

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

function getParamSize(ParamSpace) {
  return ParamSpace.reduce((p, a)=>{
    const paramAxisSize = getParamAxisSize(a);
    return paramAxisSize !== 0 ? p * paramAxisSize : p;
  }, 1);
}

function *paramVecGenerator(ParamSpace) {
  const totalSize = getParamSize(ParamSpace);
  let index = 0;

  while (index < totalSize) {
    yield getNthParamVec(index, ParamSpace);
    index++;
  }
}

function getFilenames(ParamSpace) {
  return ParamSpace.reduce((p, c)=>{
    if (c.type !== "file") {
      return p;
    }
    return p.concat(c.list);
  }, []);
}

function workAroundForVersion1(paramSpace) {
  paramSpace.forEach((e)=>{
    if (e.type === "integer") {
      e.min = parseInt(e.min, 10);
      e.max = parseInt(e.max, 10);
      e.step = parseInt(e.step, 10);
    } else if (e.type === "float") {
      e.min = parseFloat(e.min);
      e.max = parseFloat(e.max);
      e.step = parseFloat(e.step);
    } else if (e.type === "file") {
      e.list = e.list.filter((filename)=>{
        return filename !== "";
      });
    }
  });
  return paramSpace;
}

function removeInvalid(paramSpace) {
  return paramSpace.filter((e)=>{
    if (e.type === "integer" || e.type === "float") {
      return isValidParamAxis(e.min, e.max, e.step);
    }
    return (e.type === "file" && e.list.length > 0) || (e.type === "string" && e.list.length > 0);
  });
}

function removeInvalidv1(paramSpace) {
  return removeInvalid(workAroundForVersion1(paramSpace));
}

function removeInvalidv2(paramSpace) {
  return paramSpace.filter((e)=>{
    if (e.hasOwnProperty("min") && e.hasOwnProperty("max") && e.hasOwnProperty("step")) {
      return isValidParamAxis(e.min, e.max, e.step);
    } if (e.hasOwnProperty("list")) {
      return Array.isArray(e.list) && e.list.length > 0;
    } if (e.hasOwnProperty("files")) {
      return Array.isArray(e.files) && e.files.length > 0;
    }
  });
}

async function getParamSpacev2(paramSpace, cwd) {
  const cleanParamSpace = removeInvalidv2(paramSpace);
  for (const param of cleanParamSpace) {
    if (param.hasOwnProperty("files")) {
      param.type = "file";
      param.list = await expandArrayOfGlob(param.files, cwd);
    }
  }
  return cleanParamSpace;
}


//workAroundForVersion1 is used in UT
module.exports = {
  paramVecGenerator,
  getParamSize,
  getFilenames,
  removeInvalidv1,
  getParamSpacev2,
  workAroundForVersion1
};
