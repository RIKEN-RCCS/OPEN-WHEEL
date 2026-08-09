/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import { spawn } from "child_process";
import path from "path";
import fs from "fs-extra";
import { readFile } from "node:fs/promises";
import { getLogger } from "../logSettings.js";
import { escapeRegExp } from "../lib/utility.js";
import promiseRetry from "promise-retry";

const _internal = {
  spawn,
  getLogger,
  readFile
};

/**
 * asynchronous git call
 * @param {string} cwd - working directory
 * @param {string[]} args - argument list including git's sub command eg. add,commit,init... etc.
 * @param {string} rootDir - repo's root dir
 * @returns {Promise} - resolved if specified git command is successfully finished. rejected if any error occurred.
 */
_internal.promisifiedGit = async function (cwd, args, rootDir) {
  return new Promise((resolve, reject)=>{
    const cp = _internal.spawn("git", args, { cwd: path.resolve(cwd), env: process.env, shell: true });
    _internal.getLogger(rootDir).trace(`git ${args.join(" ")} called at ${cwd}`);
    let output = "";
    cp.stdout.on("data", (data)=>{
      _internal.getLogger(rootDir).trace(data.toString());
      output += data.toString();
    });
    cp.stderr.on("data", (data)=>{
      _internal.getLogger(rootDir).trace(data.toString());
      output += data.toString();
    });
    cp.on("error", (e)=>{
      const err = typeof e === "string" ? new Error(e) : e;
      err.output = output;
      err.cwd = cwd;
      err.abs_cwd = path.resolve(cwd);
      err.args = args;
      _internal.getLogger(rootDir).trace("git command failed", err);
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
};

/**
 * asynchronous git call with retry
 * @param {string} cwd - working directory
 * @param {string[]} args - argument list including git's sub command eg. add,commit,init... etc.
 * @param {string} rootDir - repo's root dir
 */
_internal.gitPromise = async function (cwd, args, rootDir) {
  return promiseRetry(async (retry)=>{
    return _internal.promisifiedGit(cwd, args, rootDir).catch((err)=>{
      _internal.getLogger(rootDir).trace(`RETRYING git ${args.join(" ")} at cwd`);
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
};

/**
 * check and setup wheel specific git repo setting
 * @param {string} rootDir - repo's root dir
 * @param {string} user - committer's user name only for the project
 * @param {string} mail - committer's user email address only for the project
 */
_internal.gitSetup = async function (rootDir, user, mail) {
  let needCommit = false;

  try {
    await _internal.gitPromise(rootDir, ["config", "--get", "user.name"], rootDir);
  } catch (err) {
    if (typeof err.rt === "undefined") {
      throw err;
    }
    await _internal.gitPromise(rootDir, ["config", "user.name", user], rootDir);
    needCommit = true;
  }

  try {
    await _internal.gitPromise(rootDir, ["config", "--get", "user.email"], rootDir);
  } catch (err) {
    if (typeof err.rt === "undefined") {
      throw err;
    }
    await _internal.gitPromise(rootDir, ["config", "user.email", mail], rootDir);
    needCommit = true;
  }

  //git lfs install does not affect if already installed
  await _internal.gitPromise(rootDir, ["lfs", "install"], rootDir);

  const ignoreFile = path.join(rootDir, ".gitignore");

  try {
    const ignore = await _internal.readFile(ignoreFile, { encoding: "utf8" });
    if (!ignore.includes("wheel.log")) {
      await fs.appendFile(path.join(rootDir, ".gitignore"), "\nwheel.log\n");
      await _internal.gitAdd(rootDir, ".gitignore");
      needCommit = true;
    }
  } catch (err) {
    if (err.code !== "ENOENT") {
      throw err;
    }
    await fs.outputFile(path.join(rootDir, ".gitignore"), "\nwheel.log\n");
    await _internal.gitAdd(rootDir, ".gitignore");
    needCommit = true;
  }

  return needCommit ? _internal.gitCommit(rootDir, "initial commit") : false;
};

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
  await _internal.gitPromise(dir, ["init", "--", base], rootDir);
  return _internal.gitSetup(rootDir, user, mail);
}

/**
 * commit already staged(indexed) files
 * @param {string} rootDir - repo's root dir
 * @param {string} message - commmit message
 * @param {string[]} additionalOption - additional option for git commit
 */
_internal.gitCommit = async function (rootDir, message = "save project", additionalOption = []) {
  return _internal.gitPromise(rootDir, ["commit", "-m", `"${message}"`, ...additionalOption], rootDir)
    .catch((err)=>{
      if (!/(no changes|nothing)( added | )to commit/m.test(err.message)) {
        throw err;
      }
    });
};

/**
 * performe git add
 * @param {string} rootDir - repo's root dir
 * @param {string} filename - filename which should be add to repo.
 * @param {boolean} updateOnly - add -u option to git add
 * filename should be absolute path or relative path from rootDir.
 */
_internal.gitAdd = async function (rootDir, filename, updateOnly) {
  const args = ["add"];
  if (updateOnly) {
    args.push("-u");
  }
  args.push("--");
  args.push(filename);
  return _internal.gitPromise(rootDir, args, rootDir);
};

/**
 * performe git rm recursively
 * @param {string} rootDir - repo's root dir
 * @param {string} filename - filename which should be add to repo.
 * filename should be absolute path or relative path from rootDir.
 */
async function gitRm(rootDir, filename) {
  return _internal.gitPromise(rootDir, ["rm", "-r", "--cached", "--", filename], rootDir)
    .catch((err)=>{
      if (!/fatal: pathspec '.*' did not match any files/.test(err.message)) {
        throw err;
      }
    });
}

/**
 * performe git reset HEAD
 * @param {string} rootDir - repo's root dir
 * @param {string} pathspec - files to be reset
 */
async function gitResetHEAD(rootDir, pathspec) {
  if (!pathspec || typeof pathspec !== "string") {
    return _internal.gitPromise(rootDir, ["reset", "HEAD", "--hard"], rootDir);
  }
  await _internal.gitPromise(rootDir, ["reset", "HEAD", "--", pathspec], rootDir);
  return _internal.gitPromise(rootDir, ["checkout", "HEAD", "--", pathspec], rootDir);
}

/**
 * get repo's status
 * @param {string} rootDir - repo's root dir
 * @param {string} pathspec - file pattern to limit status command
 */
_internal.gitStatus = async function (rootDir, pathspec) {
  const opt = ["status", "--short"];
  if (typeof pathspec === "string") {
    opt.push(pathspec);
  }
  const output = await _internal.gitPromise(rootDir, opt, rootDir);
  const rt = { added: [], modified: [], deleted: [], renamed: [], untracked: [] };
  //parse output from git
  //each line is in "XY PATH" or "XY ORIG_PATH -> PATH" format, where X is the index status and
  //Y is the worktree status. X and Y are always 2 fixed-width columns (a space means "no change"
  //in that column), so a change which is not staged yet (eg. a script's execute permission that
  //WHEEL itself sets just before running it) is reported with a *leading space*, eg. " M script.sh".
  //naively splitting the line by a single space breaks on that leading space, so the status code
  //and the path must be sliced off by fixed width instead.
  for (const line of output.split(/\n/)) {
    if (line.length === 0) {
      continue;
    }
    const statusCode = line.slice(0, 2);
    let filename = line.slice(3);
    if (statusCode.includes("R")) {
      const renameToken = filename.split(" -> ");
      filename = renameToken[renameToken.length - 1];
      rt.renamed.push(filename);
    } else if (statusCode.includes("A")) {
      rt.added.push(filename);
    } else if (statusCode.includes("D")) {
      rt.deleted.push(filename);
    } else if (statusCode.includes("M")) {
      rt.modified.push(filename);
    } else if (statusCode === "??") {
      rt.untracked.push(filename);
    } else {
      throw new Error("unkonw output from git status --short");
    }
  }
  return rt;
};

/**
 * performe git clean -df
 * @param {string} rootDir - repo's root dir
 * @param {string} pathspec - files to be reset
 * @returns {Promise} - resolved when git clean done
 */
async function gitClean(rootDir, pathspec) {
  const opt = ["clean", "-df", "-e wheel.log"];
  if (typeof pathspec === "string") {
    opt.push("--");
    opt.push(pathspec);
  }
  return _internal.gitPromise(rootDir, opt, rootDir);
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
  return _internal.gitPromise(rootDir, opt, rootDir);
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
  return _internal.gitPromise(cwd, opt, rootDir);
}

/**
 * make archive from git repo
 * @param {string} rootDir - repo's root dir
 * @param {string} filename - arcchive filename
 * @returns {Promise} - resolved when git archive done
 */
async function gitArchive(rootDir, filename) {
  const opt = ["archive", "-o", filename, "HEAD"];
  return _internal.gitPromise(rootDir, opt, rootDir);
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
      await _internal.gitPromise(rootDir, ["config", "--get", key], rootDir);
      return;
    } catch {
      //do nothing
    }
  }
  return _internal.gitPromise(rootDir, opt, rootDir);
}

/**
 * return relative filename from repository's root directry
 * @param {string} rootDir - repo's root dir
 * @param {string} filename - filename
 * @returns {string} - relative path of file from repo's root directory
 */
_internal.getRelativeFilename = function (rootDir, filename) {
  const absFilename = path.isAbsolute(filename) ? filename : path.resolve(rootDir, filename);
  return path.relative(rootDir, absFilename);
};

/**
 * make file pattern string for lfs track/untrack command
 * @param {string} rootDir - repo's root dir
 * @param {string} filename - filename
 * @returns {string} -
 */
function makeLFSPattern(rootDir, filename) {
  return `/${_internal.getRelativeFilename(rootDir, filename)}`;
}

/**
 * determine if specified filename is LFS target
 * @param {string} rootDir - repo's root dir
 * @param {string} filename - filename
 * @returns {boolean} -
 */
async function isLFS(rootDir, filename) {
  const lfsPattern = _internal.getRelativeFilename(rootDir, filename);
  const lfsTrackResult = await _internal.gitPromise(rootDir, ["lfs", "track"], rootDir);
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
  await _internal.gitPromise(rootDir, ["lfs", "track", "--", makeLFSPattern(rootDir, filename)], rootDir);
  _internal.getLogger(rootDir).trace(`${filename} is treated as large file`);
  return _internal.gitAdd(rootDir, ".gitattributes");
}

/**
 * performe git lfs untrack
 * @param {string} rootDir - repo's root dir
 * @param {string} filename - files to be untracked
 */
async function gitLFSUntrack(rootDir, filename) {
  await _internal.gitPromise(rootDir, ["lfs", "untrack", "--", makeLFSPattern(rootDir, filename)], rootDir);
  _internal.getLogger(rootDir).trace(`${filename} never treated as large file`);
  if (await fs.pathExists(path.resolve(rootDir, ".gitattributes"))) {
    await _internal.gitAdd(rootDir, ".gitattributes");
  }
}

/**
 * determine which of the given modified files only had their file mode (eg. execute permission)
 * changed, without any actual content change.
 * WHEEL adds the execute permission to a task's script (and checker) just before it is run, which
 * makes git report the script as "modified" even though its content is unchanged. such mode-only
 * changes carry no risk of data loss and must not be treated as unsaved work.
 * @param {string} rootDir - repo's root dir
 * @param {string[]} modifiedFiles - filenames reported as modified by gitStatus
 * @param {string} pathspec - file pattern to limit diff command
 * @returns {string[]} - filenames which only have a mode change (no content change)
 */
_internal.getModeOnlyModifiedFiles = async function (rootDir, modifiedFiles, pathspec) {
  if (!Array.isArray(modifiedFiles) || modifiedFiles.length === 0) {
    return [];
  }
  const opt = ["diff", "--numstat"];
  if (typeof pathspec === "string") {
    opt.push("--");
    opt.push(pathspec);
  }
  const output = await _internal.gitPromise(rootDir, opt, rootDir);
  const modeOnly = [];
  for (const line of output.split("\n")) {
    if (line.trim().length === 0) {
      continue;
    }
    const [insertions, deletions, ...rest] = line.split("\t");
    const filename = rest.join("\t");
    //numstat reports "0  0" for a file whose content is unchanged, ie. only its mode was changed
    if (insertions === "0" && deletions === "0") {
      modeOnly.push(filename);
    }
  }
  return modeOnly;
};

/**
 * @typedef {object} unsavedFile
 * @property {string} status - unsaved file's status which is one of ["new", "modified", "deleted","renamed"]
 * @property {string} name - unsaved file's name
 */
/**
 * get unsavedFiles
 * @param {string} rootDir - repo's root dir
 * @returns {unsavedFile[]} - unsaved files
 */
async function getUnsavedFiles(rootDir, pathspec) {
  const { added, modified, deleted, renamed } = await _internal.gitStatus(rootDir, pathspec);
  const modeOnlyModified = await _internal.getModeOnlyModifiedFiles(rootDir, modified, pathspec);
  const unsavedFiles = [];
  for (const e of added) {
    unsavedFiles.push({ status: "new", name: e });
  }
  for (const e of modified) {
    if (modeOnlyModified.includes(e)) {
      continue;
    }
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

export const gitPromise = _internal.gitPromise;
export const gitSetup = _internal.gitSetup;
export { gitInit };
export const gitCommit = _internal.gitCommit;
export const gitAdd = _internal.gitAdd;
export { gitRm };
export { gitResetHEAD };
export const gitStatus = _internal.gitStatus;
export { gitClean };
export { gitRemoveOrigin };
export { gitClone };
export { gitArchive };
export { gitConfig };
export const getRelativeFilename = _internal.getRelativeFilename;
export { makeLFSPattern };
export { gitLFSTrack };
export { gitLFSUntrack };
export { isLFS };
export { getUnsavedFiles };
export { _internal };
