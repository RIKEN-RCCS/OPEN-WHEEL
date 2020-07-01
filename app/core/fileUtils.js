/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License.txt in the project root for the license information.
 */
"use strict";
const promiseRetry = require("promise-retry");
const fs = require("fs-extra");
const path = require("path");
const Mode = require("stat-mode");
const { gitAdd } = require("./gitOperator2");
const { projectJsonFilename } = require("../db/db");


/**
 * read Json file until get some valid JSON data
 * @param {string} filename - filename to be read
 */
async function readJsonGreedy(filename) {
  return promiseRetry(async(retry)=>{
    const buf = await fs.readFile(filename)
      .catch((e)=>{
        if (e.code === "ENOENT") {
          retry(e);
        }
        throw e;
      });
    const strData = buf.toString("utf8").replace(/^\uFEFF/, "");
    if (strData.length === 0) {
      retry(new Error("read failed"));
    }
    let jsonData;
    try {
      jsonData = JSON.parse(strData);
    } catch (e) {
      if (e instanceof SyntaxError) {
        retry(e);
      }
      throw e;
    }
    //need check by jsonSchema but it may cause performance problem
    return jsonData;
  },
  {
    retries: 10,
    minTimeout: 500,
    factor: 1
  });
}

/**
 * add execute permission to file
 * @param {string} file - filename in absolute path
 */
async function addX(file) {
  const stat = await fs.stat(file);
  const mode = new Mode(stat);
  let u = 4;
  let g = 4;
  let o = 4;

  if (mode.owner.read) {
    u += 1;
  }

  if (mode.owner.write) {
    u += 2;
  }

  if (mode.group.read) {
    g += 1;
  }

  if (mode.group.write) {
    g += 2;
  }

  if (mode.others.read) {
    o += 1;
  }

  if (mode.others.write) {
    o += 2;
  }
  const modeString = u.toString() + g.toString() + o.toString();
  return fs.chmod(file, modeString);
}

/**
 * deliver src to dst
 * @param {string} src - absolute path of src path
 * @param {string} dst - absolute path of dst path
 *
 */
async function deliverFile(src, dst) {
  const stats = await fs.lstat(src);
  const type = stats.isDirectory() ? "dir" : "file";

  try {
    await fs.remove(dst);
    await fs.ensureSymlink(src, dst, type);
    return { type: `link-${type}`, src, dst };
  } catch (e) {
    if (e.code === "EPERM") {
      await fs.copy(src, dst, { overwrite: false });
      return { type: "copy", src, dst };
    }
    return Promise.reject(e);
  }
}

/**
 * @typedef File
 * @param {Object} File
 * @param {string} File.filename - filename
 * @param {string} File.dirname - dirname of the file
 * @param {string} File.content - file content
 */

/**
 * open file or target Files which is listed in parameter setting file
 * @param {string} projectRootDir -
 * @param {string} argFilename - target file's name
 * @param {boolean} forceNormal - if true absFilename is not treated as parameter setting file
 * @returns {File[]} - array of file object which is read
 */
async function openFile(projectRootDir, argFilename, forceNormal = false) {
  const absFilename = path.resolve(argFilename);
  let content;
  try {
    const bufffer = await fs.readFile(absFilename);
    content = bufffer.toString();
  } catch (err) {
    if (err.code === "ENOENT") {
      await fs.ensureFile(absFilename);
      return [{ content: "", filename: path.basename(absFilename), dirname: path.dirname(absFilename) }];
    }
    throw err;
  }

  let contentJson = {};
  try {
    contentJson = JSON.parse(content);
  } catch (err) {
    //just ignore if JSON.parse() failed
  }
  if (!contentJson.hasOwnProperty("targetFiles") || !Array.isArray(contentJson.targetFiles) || forceNormal) {
    return [{ content, filename: path.basename(absFilename), dirname: path.dirname(absFilename) }];
  }

  //resolve targetFile's path
  const rt = [{ content, filename: path.basename(absFilename), dirname: path.dirname(absFilename), isParameterSettingFile: true }];
  const dirname = path.dirname(absFilename);
  const absTargetFiles = contentJson.targetFiles
    .map((targetFile)=>{
      if (typeof targetFile === "string") {
        return path.resolve(dirname, targetFile);
      }
      if (!targetFile.hasOwnProperty("targetName")) {
        return null;
      }
      if (targetFile.hasOwnProperty("targetNode")) {
        //to avoid circurler dependency, do not use getComponentDir in projectFilesOperator.js
        const ID = targetFile.targetNode;
        const projectJson = JSON.parse(fs.readFileSync(path.resolve(projectRootDir, projectJsonFilename)).toString());
        const relativePath = projectJson.componentPath[ID];
        return path.resolve(projectRootDir, relativePath, targetFile.targetName);
      }
      return path.resolve(dirname, targetFile.targetName);
    })
    .filter((e)=>{
      return e !== null;
    });

  //read all targetFiles
  const contents = await Promise.all(absTargetFiles.map((targetFile)=>{
    return fs.readFile(targetFile);
  }));

  rt.push(...absTargetFiles
    .map((targetFile, i)=>{
      return {
        content: contents[i].toString(),
        dirname: path.dirname(targetFile),
        filename: path.basename(targetFile)
      };
    }));

  return rt;
}

/**
 * write content to the file
 * @param {string} argFilename - target file's name
 * @param {*} content - content to write
 * @returns {Promise} -
 */
async function saveFile(argFilename, content) {
  const absFilename = path.resolve(argFilename);
  await fs.writeFile(absFilename, content);

  const { root } = path.parse(absFilename);
  let repoDir = path.dirname(absFilename);

  while (!await fs.pathExists(path.join(repoDir, ".git"))) {
    if (repoDir === root) {
      const err = new Error("git repository not found");
      err.filename = argFilename;
      err.absFilename = absFilename;
      throw err;
    }
    repoDir = path.dirname(repoDir);
  }

  await gitAdd(repoDir, absFilename);
}


module.exports = {
  readJsonGreedy,
  addX,
  deliverFile,
  openFile,
  saveFile
};
