/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";

export function targetFile2absPath (targetFile, componentPath, pathSep, prefix, PSID) {
  const PSDir = componentPath[PSID];
  let dirname = targetFile.hasOwnProperty("targetNode") ? componentPath[targetFile.targetNode] : PSDir;
  dirname = dirname.replace(/^\.\//, ""); // remove prefix
  let absPath = prefix + dirname + pathSep + targetFile.targetName;
  if (pathSep === "\\") {
    absPath = absPath.replace("/", pathSep);
  }
  return absPath;
}

export function file2absPath (file, pathSep) {
  return file.dirname + pathSep + file.filename;
}

export function isTargetFile (file, rootDir, pathSep, targetFiles, componentPath, ID) {
  const dirnamePrefix = rootDir + pathSep;
  return targetFiles.findIndex(
    (e)=>{
      const absPath = targetFile2absPath(e, componentPath, pathSep, dirnamePrefix, ID);
      return absPath === file.dirname + pathSep + file.filename;
    }) !== -1;
}

export const tableFooterProps = {
  showFirstLastPage: true,
  firstIcon: "fast_rewind",
  lastIcon: "fast_forward",
  prevIcon: "navigate_before",
  nextIcon: "navigate_next",
};
