/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const fs = require("fs-extra");
const path = require("path");
const { promisify } = require("util");
const glob = require("glob");
const nunjucks = require("nunjucks");
const { getParamSpacev2, removeInvalidv1 } = require("./parameterParser");
const {overwriteByRsync} = require("./rsync.js");

async function getScatterFilesV2(templateRoot, paramSettings) {
  if (!(Object.prototype.hasOwnProperty.call(paramSettings, "scatter") && Array.isArray(paramSettings.scatter))) {
    return [];
  }
  const srcNames = await Promise.all(
    paramSettings.scatter
      .map((e)=>{
        return promisify(glob)(e.srcName, { cwd: templateRoot });
      })
  );
  return Array.prototype.concat.apply([], srcNames);
}

async function replaceByNunjucks(templateRoot, instanceRoot, targetFiles, params) {
  return Promise.all(
    targetFiles.map(async (targetFile)=>{
      const template = (await fs.readFile(path.resolve(templateRoot, targetFile))).toString();
      const result = nunjucks.renderString(template, params);
      return fs.outputFile(path.resolve(instanceRoot, targetFile), result);
    })
  );
}

async function scatterFilesV2(templateRoot, instanceRoot, scatterRecipe, params, logger, useRsync) {
  const p = [];
  for (const recipe of scatterRecipe) {
    const srcName = nunjucks.renderString(recipe.srcName, params);
    const srces = await promisify(glob)(srcName, { cwd: templateRoot });
    const dstDir = Object.prototype.hasOwnProperty.call(recipe, "dstNode") ? path.join(instanceRoot, recipe.dstNode) : instanceRoot;
    const dstName = nunjucks.renderString(recipe.dstName, params);
    for (const src of srces) {
      const dst = recipe.dstName.endsWith("/") || recipe.dstName.endsWith("\\") ? path.join(dstDir, dstName.slice(0, -1), src) : path.join(dstDir, dstName);
      logger.trace(`scatter copy ${path.join(templateRoot, src)} to ${dst}`);

      if(useRsync){
        p.push(overwriteByRsync(path.join(templateRoot, src), dst));
      }else{
        p.push(fs.copy(path.join(templateRoot, src), dst, {overwrite: true}));
      }
    }
  }
  return Promise.all(p).catch((err)=>{
    logger.trace("error occurred at scatter", err);

    if (err.code !== "ENOENT" || err.code !== "EEXIST") {
      return Promise.reject(err);
    }
    return true;
  });
}

async function gatherFilesV2(templateRoot, instanceRoot, gatherRecipe, params, logger) {
  const p = [];
  for (const recipe of gatherRecipe) {
    const srcDir = Object.prototype.hasOwnProperty.call(recipe, "srcNode") ? path.join(instanceRoot, recipe.srcNode) : instanceRoot;
    const srcName = nunjucks.renderString(recipe.srcName, params);
    const srces = await promisify(glob)(srcName, { cwd: srcDir });
    const dstName = nunjucks.renderString(recipe.dstName, params);
    for (const src of srces) {
      const dst = recipe.dstName.endsWith("/") || recipe.dstName.endsWith("\\") ? path.join(templateRoot, dstName.slice(0, -1), src) : path.join(templateRoot, dstName);
      logger.trace(`gather copy ${path.join(srcDir, src)} to ${dst}`);
      p.push( fs.copy(path.join(srcDir, src), dst, {overwrite: true}));
    }
  }
  return Promise.all(p).catch((err)=>{
    logger.trace("error occurred at gather", err);

    if (err.code !== "ENOENT" || err.code === "EEXIST") {
      return Promise.reject(err);
    }
    return true;
  });
}

async function doNothing() {
}

async function replaceTargetFile(srcDir, dstDir, targetFiles, params) {
  const promises = [];
  for (const targetFile of targetFiles) {
    const tmp = await fs.readFile(path.resolve(srcDir, targetFile));
    let data = tmp.toString();
    for (const key in params) {
      if (typeof key === "string") {
        data = data.replace(new RegExp(`%%${key}%%`, "g"), params[key].toString());
      }
    }
    //fs.writeFile will overwrites existing file.
    //so, targetFile is always overwrited!!
    promises.push(fs.writeFile(path.resolve(dstDir, targetFile), data));
  }
  return Promise.all(promises);
}

function makeCmd(paramSettings) {
  const params = Object.prototype.hasOwnProperty.call(paramSettings, "params") ? paramSettings.params : paramSettings.target_param;
  if (paramSettings.version === 2) {
    return [getParamSpacev2.bind(null, params), getScatterFilesV2, scatterFilesV2, gatherFilesV2, replaceByNunjucks];
  }
  //version 1 (=unversioned)
  return [removeInvalidv1.bind(null, params), ()=>{
    return [];
  }, doNothing, doNothing, replaceTargetFile];
}

module.exports = {
  makeCmd
};
