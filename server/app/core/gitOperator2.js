/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs-extra");
const { getLogger } = require("../logSettings");
const { escapeRegExp } = require("../lib/utility");

/**
 * asynchronous git call
 * @param {string} cwd - working directory
 * @param {string[]} args - argument list including git's sub command eg. add,commit,init... etc.
 * @param {string} rootDir - repo's root dir
 */
async function gitPromise(cwd, args, rootDir) {
  return new Promise((resolve, reject)=>{
    const cp = spawn("git", args, { cwd: path.resolve(cwd), env: process.env, shell: true });
    let output = "";
    cp.stdout.on("data", (data)=>{
      getLogger(rootDir).trace(data.toString());
      output += data.toString();
    });
    cp.stderr.on("data", (data)=>{
      getLogger(rootDir).trace(data.toString());
      output += data.toString();
    });
    cp.on("error", (e)=>{
      const err = typeof e === "string" ? new Error(e) : e;
      err.output = output;
      err.cwd = cwd;
      err.abs_cwd = path.resolve(cwd);
      err.args = args;
      reject(err);
    });
    cp.on("exit", (rt)=>{
      if (rt !== 0) {
        const err = new Error(output)
        err.cwd = cwd;
        err.abs_cwd = path.resolve(cwd);
        err.args = args;
        reject(err);
      }
      resolve(output);
    });
  });
}


/**
 * initialize repository with git-lfs support
 * @param {string} rootDir - repo's root dir
 * @param {string} user - committer's user name only for the project
 * @param {string} mail - committer's user email address only for the project
 */
async function gitInit(rootDir, user, mail) {
  if (typeof user !== "string") {
    const err = new Error("user must be a string");
    err.user = user;
    err.type = typeof user;
    return err;
  }
  if (typeof mail !== "string") {
    const err = new Error("mail must be a string");
    err.mail = mail;
    err.type = typeof mail;
    return err;
  }
  const { dir, base } = path.parse(path.resolve(rootDir));
  await fs.ensureDir(dir);
  await gitPromise(dir, ["init", "--", base], rootDir);
  await gitPromise(rootDir, ["config", "user.name", user], rootDir);
  await gitPromise(rootDir, ["config", "user.email", mail], rootDir);
  await gitPromise(rootDir, ["lfs", "install"], rootDir);
  await fs.outputFile(path.join(rootDir,".gitignore"), "wheel.log");
  await gitAdd(rootDir, ".gitignore")
  return gitCommit(rootDir, "initial commit");
}

/**
 * commit already staged(indexed) files
 * @param {string} rootDir - repo's root dir
 * @param {string} message - commmit message
 */
async function gitCommit(rootDir, message = "save project", additionalOption=[]) {
  return gitPromise(rootDir, ["commit", "-m", `"${message}"`, ...additionalOption], rootDir)
    .catch((err)=>{
      if (!/(no changes|nothing)( added | )to commit/m.test(err)) {
        throw err;
      }
    });
}

/**
 * performe git add
 * @param {string} rootDir - repo's root dir
 * @param {string} filename - filename which should be add to repo.
 * @param {boolean} updateOnly - add -u option to git add
 * filename should be absolute path or relative path from rootDir.
 */
async function gitAdd(rootDir, filename, updateOnly) {
  const args = ["add"];
  if (updateOnly) {
    args.push("-u");
  }
  args.push("--");
  args.push(filename);
  return gitPromise(rootDir, args, rootDir)
    .catch((err)=>{
      if (!/fatal: Unable to create '.*index.lock': File exists/.test(err)) {
        throw err;
      }
    });
}

/**
 * performe git rm recursively
 * @param {string} rootDir - repo's root dir
 * @param {string} filename - filename which should be add to repo.
 * filename should be absolute path or relative path from rootDir.
 */
async function gitRm(rootDir, filename) {
  return gitPromise(rootDir, ["rm", "-r", "--cached", "--", filename], rootDir)
    .catch((err)=>{
      if (!/fatal: pathspec '.*' did not match any files/.test(err)) {
        throw err;
      }
    });
}

/**
 * performe git reset HEAD
 * @param {string} rootDir - repo's root dir
 * @param {string} filePatterns - files to be reset
 */
async function gitResetHEAD(rootDir, filePatterns = "") {
  if (filePatterns === "") {
    return gitPromise(rootDir, ["reset", "HEAD", "--hard"], rootDir);
  }
  await gitPromise(rootDir, ["reset", "HEAD", "--", filePatterns], rootDir);
  return gitPromise(rootDir, ["checkout", "HEAD", "--", filePatterns], rootDir);
}

/**
 * get repo's status
 * @param {string} rootDir - repo's root dir
 */
async function gitStatus(rootDir) {
  const output = await gitPromise(rootDir, ["status", "--short"], rootDir);
  const rt = { added: [], modified: [], deleted: [], renamed: [], untracked: [] };

  //parse output from git
  for (const token of output.split(/\n/)) {
    const splitedToken = token.split(" ");
    const filename = splitedToken[splitedToken.length - 1];
    if (typeof splitedToken[0][0] === "undefined") {
      continue;
    }
    switch (splitedToken[0][0]) {
      case "A":
        rt.added.push(filename);
        break;
      case "M":
        rt.modified.push(filename);
        break;
      case "D":
        rt.deleted.push(filename);
        break;
      case "R":
        rt.renamed.push(filename);
        break;
      case "?":
        rt.untracked.push(filename);
        break;
      default:
        throw new Error("unkonw output from git status --short");
    }
  }
  return rt;
}

/**
 * performe git clean -df
 * @param {string} rootDir - repo's root dir
 * @param {string} filePatterns - files to be reset
 */
async function gitClean(rootDir, filePatterns = "") {
  return gitPromise(rootDir, ["clean", "-df", "-e wheel.log", "--", filePatterns], rootDir);
}

function getRelativeFilename(rootDir, filename) {
  const absFilename = path.resolve(rootDir, filename);
  return path.relative(rootDir, absFilename);
}
function makeLFSPattern(rootDir, filename) {
  return `/${getRelativeFilename(rootDir, filename)}`;
}

async function isLFS(rootDir, filename) {
  const lfsPattern = getRelativeFilename(rootDir, filename);
  const lfsTrackResult = await gitPromise(rootDir, ["lfs", "track"], rootDir);
  const re = new RegExp(escapeRegExp(lfsPattern), "m");
  return re.test(lfsTrackResult);
}

/**
 * performe git lfs track
 * @param {string} rootDir - repo's root dir
 * @param {string} filename - files to be track
 */
async function gitLFSTrack(rootDir, filename) {
  await gitPromise(rootDir, ["lfs", "track", "--", makeLFSPattern(rootDir, filename)], rootDir);
  getLogger(rootDir).trace(`${filename} is treated as large file`);
  return gitAdd(rootDir, ".gitattributes");
}

/**
 * performe git lfs untrack
 * @param {string} rootDir - repo's root dir
 * @param {string} filename - files to be untracked
 */
async function gitLFSUntrack(rootDir, filename) {
  await gitPromise(rootDir, ["lfs", "untrack", "--", makeLFSPattern(rootDir, filename)], rootDir);
  getLogger(rootDir).trace(`${filename} never treated as large file`);

  if (await fs.pathExists(path.resolve(rootDir, ".gitattributes"))) {
    await gitAdd(rootDir, ".gitattributes");
  }
}

/**
 * @typedef {Object} unsavedFile
 * @property {string} status - unsaved file's status which is one of ["new", "modified", "deleted',"renamed"]
 * @property {string} name - unsaved file's name
 */
/**
 * get unsavedFiles
 * @param {string} rootDir - repo's root dir
 * @returns {unsavedFile[]} - unsaved files
 *
 */
async function getUnsavedFiles(rootDir) {
  const { added, modified, deleted, renamed } = await gitStatus(rootDir);
  const unsavedFiles = [];
  for (const e of added) {
    unsavedFiles.push({ status: "new", name: e });
  }
  for (const e of modified) {
    unsavedFiles.push({ status: "modified", name: e });
  }
  for (const e of deleted) {
    unsavedFiles.push({ status: "deleted", name: e });
  }
  for (const e of renamed) {
    unsavedFiles.push({ status: "renamed", name: e });
  }
  return unsavedFiles;
}


module.exports = {
  gitInit,
  gitCommit,
  gitAdd,
  gitRm,
  gitResetHEAD,
  gitStatus,
  gitClean,
  gitLFSTrack,
  gitLFSUntrack,
  isLFS,
  getUnsavedFiles
};
