/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const fs = require("fs-extra");
const path = require("path");
const { isComponentDir } = require("./projectFilesOperator");

/**
 * make bundled name of seqential number file
 * @param {object[]} fileList - list of files to be bundled
 * @param {boolean} isDir - If true, fileList contains directory names
 * @returns {object[]} -
 */
function getSNDs(fileList, isDir) {
  const reNumber = /\d+/g;
  const snds = [];
  const candidates = new Set();
  const globs = new Set();
  for (const e of fileList) {
    const filename = e.name;
    let result;
    while ((result = reNumber.exec(filename)) !== null) {
      const glob = `${filename.slice(0, result.index)}*${filename.slice(reNumber.lastIndex)}`;
      const pattern = String.raw`${filename.slice(0, result.index)}\d+${filename.slice(reNumber.lastIndex)}`;
      if (candidates.has(glob) && !globs.has(glob)) {
        const type = isDir ? "sndd" : "snd";
        snds.push({
          path: e.path,
          name: glob,
          pattern,
          type,
          islink: false
        });
        globs.add(glob);
      } else {
        candidates.add(glob);
      }
    }
  }
  return snds;
}

/**
 * bundle SND files
 * @param {object[]} fileList - list of files to be bundled
 * @param {string} fileList.path - parent directories'path
 * @param {string} fileList.name - filename,  directory name or glob
 * @param {string} fileList.type - file, dir(ectory) or snd(SerialNumberData)
 * @param {boolean} fileList.islink - file is symlink or not
 * @param {boolean} isDir - If true, fileList contains directory names
 * @returns {string[]} files and bundled SND globs these are not sorted
 */
function bundleSNDFiles(fileList, isDir) {
  if (fileList.length <= 0) {
    return [];
  }
  const globs = getSNDs(fileList, isDir);

  const files = fileList.filter((e)=>{
    for (const g of globs) {
      const re = new RegExp(g.pattern);
      if (re.test(e.name)) {
        return false;
      }
    }
    //filter filename which does NOT match all globs
    return true;
  });

  return files.concat(globs);
}

/**
 * compare file object
 * this function is subject to be called from sort function
 * @param {object} a - first file object
 * @param {object} b - the other file object to be compared with a
 * @returns {number} -
 */
function compare(a, b) {
  if (a.name < b.name) {
    return -1;
  }
  if (a.name > b.name) {
    return 1;
  }
  return 0;
}

/**
 * send directory contents via socket.io
 * @param {string} targetDir - directory path to read
 * @param {object} options -   dictionary contains following option value
 * @param {string}  [options.request] -      requested directory path
 * @param {boolean} [options.sendDirname] -  flag for send directory name or not
 * @param {boolean} [options.sendFilename] - flag for send file name or not
 * @param {boolean} [options.withParentDir] - flag for send parent dir('../') or not
 * @param {boolean} [options.withCurrentDir] - flag for send parent dir('./') or not
 * @param {boolean} [options.SND] -  flag for bundle serial number data or not
 * @param {object} [options.filter] -  item name filter
 * @param {object} [options.filter.all] -  filter regex for both directories and files
 * @param {object} [options.filter.dir] -  filter regex only for directories
 * @param {object} [options.filter.file] - filter regex only for files
 * @returns {object[]} - array of directory and files under targetDir
 * plese note, if both options.filter.all and options.filter.{dir|file} is specified,
 * both filter is used.
 * so the only {directory | file} which is matched filter.all and filter.{dir|file} will be sent.
 */
async function ls(targetDir, options = {}) {
  const request = path.resolve(options.request != null ? options.request : targetDir);
  const sendDirname = options.sendDirname != null ? options.sendDirname : true;
  const sendFilename = options.sendFilename != null ? options.sendFilename : true;
  const withParentDir = options.withParentDir != null ? options.withParentDir : false;
  const withCurrentDir = options.withCurrentDir != null ? options.withCurrentDir : false;
  const bundleSerialNumberData = options.SND != null ? options.SND : false;
  const allFilter = options.filter && options.filter.all;
  const dirFilter = options.filter && options.filter.dir;
  const fileFilter = options.filter && options.filter.file;
  const dirList = [];
  const fileList = [];
  const names = await fs.readdir(path.normalize(targetDir));
  await Promise.all(names.map(async (name)=>{
    if (allFilter && !allFilter.test(name)) {
      return;
    }
    const absoluteFilename = path.join(targetDir, name);
    let stats;
    try {
      stats = await fs.lstat(absoluteFilename);
    } catch (err) {
      //just ignore error
      return;
    }
    if (stats.isDirectory() && sendDirname) {
      if (dirFilter && !dirFilter.test(name)) {
        return;
      }
      dirList.push({ path: request, name, type: "dir", islink: false, isComponentDir: await isComponentDir(path.resolve(request, name)) });
    } else if (stats.isFile() && sendFilename) {
      if (fileFilter && !fileFilter.test(name)) {
        return;
      }
      fileList.push({ path: request, name, type: "file", islink: false });
    }
    if (stats.isSymbolicLink()) {
      try {
        const stats2 = await fs.stat(absoluteFilename);
        if (stats2.isDirectory() && sendDirname) {
          if (dirFilter && !dirFilter.test(name)) {
            return;
          }
          dirList.push({ path: request, name, type: "dir", islink: true, isComponentDir: await isComponentDir(path.resolve(request, name)) });
        }
        if (stats2.isFile() && sendFilename) {
          if (fileFilter && !fileFilter.test(name)) {
            return;
          }
          fileList.push({ path: request, name, type: "file", islink: true });
        }
      } catch (e) {
        if (e.code === "ENOENT") {
          fileList.push({ path: request, name, type: "deadlink", islink: true });
        } else {
          throw e;
        }
      }
    }
  }));
  if (withParentDir) {
    dirList.push({ path: request, name: "../", type: "dir", islink: false });
  }
  if (withCurrentDir) {
    dirList.push({ path: request, name: "./", type: "dir", islink: false });
  }
  if (bundleSerialNumberData) {
    const dirs = bundleSNDFiles(dirList, true);
    const files = bundleSNDFiles(fileList);
    return dirs.sort(compare).concat(files.sort(compare));
  }
  return dirList.sort(compare).concat(fileList.sort(compare));
}
module.exports = ls;
