/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License.txt in the project root for the license information.
 */
"use strict";
const path = require("path");
const childProcess = require("child_process");
const fs = require("fs-extra");
const { addX } = require("./fileUtils");

async function pspawn(script, options, logger) {
  return new Promise((resolve, reject)=>{
    const cp = childProcess.spawn(script, options, (err)=>{
      if (err) {
        reject(err);
      }
    });
    cp.on("close", (code)=>{
      logger.debug("return value of conditional expression = ", code);
      resolve(code === 0);
    });
    cp.stdout.on("data", (data)=>{
      logger.trace(data.toString());
    });
    cp.stderr.on("data", (data)=>{
      logger.trace(data.toString());
    });
  });
}

/**
 * evalute condition by executing external command or evalute JS expression
 * @param {string} condition - command name or javascript expression
 * @param {string} cwd - task component's directory
 * @param {number} currentIndex - innermost loop index (WHEEL_CURRENT_INDEX)
 * @param {string} logger - logger instance
 * @returns {Promise} *
 */
async function evalCondition(condition, cwd, currentIndex, logger) {
  //condition is always string for now. but keep following just in case
  if (typeof condition === "boolean") {
    return condition;
  }
  if (typeof condition !== "string") {
    logger.warn("condition must be string or boolean");
    return new Error(`illegal condition specified ${typeof condition} \n${condition}`);
  }
  const script = path.resolve(cwd, condition);
  if (await fs.pathExists(script)) {
    logger.debug("execute ", script);
    await addX(script);
    const dir = path.dirname(script);
    const options = {
      env: process.env,
      cwd: dir
    };

    if (typeof currentIndex === "number") {
      options.env.WHEEL_CURRENT_INDEX = currentIndex.toString();
    }
    return pspawn(script, options, logger);
  }
  logger.debug("evalute ", condition);
  let conditionExpression = "";

  if (typeof currentIndex === "number") {
    conditionExpression += `var WHEEL_CURRENT_INDEX=${currentIndex};`;
  }
  conditionExpression += condition;
  //eslint-disable-next-line no-eval
  return eval(conditionExpression);
}

module.exports = {
  evalCondition
};
