/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs-extra");
const { readFile } = require("node:fs/promises");
const { getLogger } = require("../logSettings");
const { escapeRegExp } = require("../lib/utility");
const promiseRetry = require("promise-retry");

/**
 * asynchronous git call
 * @param {string} cwd - working directory
 * @param {string[]} args - argument list including git's sub command eg. add,commit,init... etc.
 * @param {string} rootDir - repo's root dir
 * @returns {Promise} - resolved if specified git command is successfully finished. rejected if any error occurred.
 */
async function promisifiedGit(cwd, args, rootDir) {
  return new Promise((resolve, reject)=>{
    const cp = spawn("git", args, { cwd: path.resolve(cwd), env: process.env, shell: true });
    getLogger(rootDir).trace(`git ${args.join(" ")} called at ${cwd}`);
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
      getLogger(rootDir).trace("git command failed", err);
      reject(err);
    });
    cp.on("exit", (rt)=>{
      if (rt !== 0) {
        const err = new Error(output);
        err.rt = rt;
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
 * asynchronous git call with retry
 * @param {string} cwd - working directory
 * @param {string[]} args - argument list including git's sub command eg. add,commit,init... etc.
 * @param {string} rootDir - repo's root dir
 */
async function gitPromise(cwd, args, rootDir) {
  return promiseRetry(async (retry)=>{
    return promisifiedGit(cwd, args, rootDir).catch((err)=>{
      getLogger(rootDir).trace(`RETRYING git ${args.join(" ")} at cwd`);
      if (!/fatal: Unable to create '.*index.lock': File exists/.test(err.message)
        && !/error: could not lock .*: File exists/.test(err.message)) {
        throw err;
      }
      return retry(err);
    });
  }, {
    retries: 5,
    minTimeout: 300,
    maxTimeout: 2000,
    randomize: true,
    factor: 1.2
  });
}

/**
 * check and setup wheel specific git repo setting
 * @param {string} rootDir - repo's root dir
 * @param {string} user - committer's user name only for the project
 * @param {string} mail - committer's user email address only for the project
 */
async function gitSetup(rootDir, user, mail) {
  let needCommit = false;

  try {
    await gitPromise(rootDir, ["config", "--get", "user.name"], rootDir);
  } catch (err) {
    if (typeof err.rt === "undefined") {
      throw err;
    }
    await gitPromise(rootDir, ["config", "user.name", user], rootDir);
    needCommit = true;
  }

  try {
    await gitPromise(rootDir, ["config", "--get", "user.email"], rootDir);
  } catch (err) {
    if (typeof err.rt === "undefined") {
      throw err;
    }
    await gitPromise(rootDir, ["config", "user.email", mail], rootDir);
    needCommit = true;
  }

  //git lfs install does not affect if already installed
  await gitPromise(rootDir, ["lfs", "install"], rootDir);

  const ignoreFile = path.join(rootDir, ".gitignore");

  try {
    const ignore = await readFile(ignoreFile, { encoding: "utf8" });
    if (!ignore.includes("wheel.log")) {
      await fs.appendFile(path.join(rootDir, ".gitignore"), "\nwheel.log\n");
      await gitAdd(rootDir, ".gitignore");
      needCommit = true;
    }
  } catch (err) {
    if (err.code !== "ENOENT") {
      throw err;
    }
    await fs.outputFile(path.join(rootDir, ".gitignore"), "\nwheel.log\n");
    await gitAdd(rootDir, ".gitignore");
    needCommit = true;
  }

  return needCommit ? gitCommit(rootDir, "initial commit") : false;
}

/**
 * initialize repository with git-lfs support
 * @param {string} rootDir - repo's root dir
 * @param {string} user - committer's user name only for the project
 * @param {string} mail - committer's user email address only for the project
 * @returns {Promise} - settled when git commit command issued
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
  return gitSetup(rootDir, user, mail);
}

/**
 * commit already staged(indexed) files
 * @param {string} rootDir - repo's root dir
 * @param {string} message - commmit message
 * @param {string[]} additionalOption - additional option for git commit
 */
async function gitCommit(rootDir, message = "save project", additionalOption = []) {
  return gitPromise(rootDir, ["commit", "-m", `"${message}"`, ...additionalOption], rootDir)
    .catch((err)=>{
      if (!/(no changes|nothing)( added | )to commit/m.test(err.message)) {
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
  return gitPromise(rootDir, args, rootDir);
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
      if (!/fatal: pathspec '.*' did not match any files/.test(err.message)) {
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
 * @returns {Promise} - resolved when git clean done
 */
async function gitClean(rootDir, filePatterns = "") {
  return gitPromise(rootDir, ["clean", "-df", "-e wheel.log", "--", filePatterns], rootDir);
}

/**
/**
 * remove origin url
 * @param {string} rootDir - repo's root dir
 * @param {string} name - remote name
 * @returns {Promise} - resolved when git clone done
 */
async function gitRemoveOrigin(rootDir, name = "origin") {
  const opt = ["remote", "remove", name];
  return gitPromise(rootDir, opt, rootDir);
}

/**
 * clone rootDir to cwd
 * @param {string} cwd - working directory
 * @param {number} depth - clone depth for shallow clone
 * @param {string} rootDir - repo's root dir
 * @returns {Promise} - resolved when git clone done
 */
async function gitClone(cwd, depth, rootDir) {
  const opt = ["clone"];
  if (Number.isInteger(depth)) {
    opt.push(`--depth=${depth}`);
  }
  opt.push("--single-branch");
  opt.push(rootDir);
  opt.push(".");
  return gitPromise(cwd, opt, rootDir);
}

/**
 * make archive from git repo
 * @param {string} rootDir - repo's root dir
 * @param {string} filename - arcchive filename
 * @returns {Promise} - resolved when git archive done
 */
async function gitArchive(rootDir, filename) {
  const opt = ["archive", "-o", filename, "HEAD"];
  return gitPromise(rootDir, opt, rootDir);
}

/**
 * add local config
 * @param {string} rootDir - repo's root dir
 * @param {string} key - config key name
 * @param {string} value - config value
 * @param {boolean} keep - keep value if already set
 * @returns {Promise} - resolved when git archive done
 */
async function gitConfig(rootDir, key, value, keep = false) {
  const opt = ["config", "--local", key, value];
  if (keep) {
    try {
      await gitPromise(rootDir, ["config", "--get", key], rootDir);
      return;
    } catch (e) {
      //do nothing
    }
  }
  return gitPromise(rootDir, opt, rootDir);
}

/**
 * return relative filename from repository's root directry
 * @param {string} rootDir - repo's root dir
 * @param {string} filename - filename
 * @returns {string} - relative path of file from repo's root directory
 */
function getRelativeFilename(rootDir, filename) {
  const absFilename = path.isAbsolute(filename) ? filename : path.resolve(rootDir, filename);
  return path.relative(rootDir, absFilename);
}

/**
 * make file pattern string for lfs track/untrack command
 * @param {string} rootDir - repo's root dir
 * @param {string} filename - filename
 * @returns {string} -
 */
function makeLFSPattern(rootDir, filename) {
  return `/${getRelativeFilename(rootDir, filename)}`;
}

/**
 * determine if specified filename is LFS target
 * @param {string} rootDir - repo's root dir
 * @param {string} filename - filename
 * @returns {boolean} -
 */
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
 * @returns {Promise} - resolved when LFS track setting is done
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
 * @typedef {object} unsavedFile
 * @property {string} status - unsaved file's status which is one of ["new", "modified", "deleted',"renamed"]
 * @property {string} name - unsaved file's name
 */
/**
 * get unsavedFiles
 * @param {string} rootDir - repo's root dir
 * @returns {unsavedFile[]} - unsaved files
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
  gitSetup,
  gitInit,
  gitCommit,
  gitAdd,
  gitRm,
  gitResetHEAD,
  gitStatus,
  gitClean,
  gitRemoveOrigin,
  gitClone,
  gitArchive,
  gitConfig,
  gitLFSTrack,
  gitLFSUntrack,
  isLFS,
  getUnsavedFiles
};
