/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import fs from "fs-extra";
import path from "path";
import { glob } from "glob";
import { componentJsonFilename } from "../db/db.js";
import { readJsonGreedy } from "./fileUtils.js";
import { writeComponentJson } from "./componentJsonIO.js";

const _internal = {
  fs,
  glob,
  readJsonGreedy,
  writeComponentJson
};

/**
 * set component and its descendant's state
 * @param {string} projectRootDir - project's root path
 * @param {string} dir - root component directory
 * @param {string} state  - state to be set
 * @param {boolean} doNotAdd - call gitAdd if false
 * @param {string[]} ignoreStates - do not change state if one of this state
 * @returns {Promise} - resolved when all componentJSON meta data file is written
 */
export async function setComponentStateR(projectRootDir, dir, state, doNotAdd = false, ignoreStates = []) {
  const filenames = await _internal.glob(path.join(dir, "**", componentJsonFilename));
  filenames.push(path.join(dir, componentJsonFilename));
  if (!ignoreStates.includes(state)) {
    ignoreStates.push(state);
  }
  const p = filenames.map((filename)=>{
    return _internal.readJsonGreedy(filename)
      .then((component)=>{
        if (ignoreStates.includes(component.state)) {
          return true;
        }
        component.state = state;
        const componentDir = path.dirname(filename);
        return _internal.writeComponentJson(projectRootDir, componentDir, component, doNotAdd);
      });
  });
  return Promise.all(p);
};

/**
 * copy each descendant component's state from srcDir into the matching descendant under dstDir
 * intended for parameterStudy: its "template" directory (dstDir) is only ever copied FROM to
 * create each parameter instance and is never itself executed, so its descendants' component
 * JSON files are left permanently "not-started" unless explicitly synced from one of the
 * executed instance directories (srcDir) after the run finishes
 * @param {string} projectRootDir - project's root path
 * @param {string} srcDir - directory to read state from (e.g. an executed parameterStudy instance)
 * @param {string} dstDir - directory to write state into (e.g. the parameterStudy template)
 * @returns {Promise} - resolved when all matching componentJSON files are updated
 */
export async function syncComponentStateFrom(projectRootDir, srcDir, dstDir) {
  const filenames = await _internal.glob(path.join(srcDir, "**", componentJsonFilename));
  const p = filenames.map(async (filename)=>{
    const relativePath = path.relative(srcDir, filename);
    const dstFilename = path.join(dstDir, relativePath);
    if (!await _internal.fs.pathExists(dstFilename)) {
      return null;
    }
    const [srcComponent, dstComponent] = await Promise.all([
      _internal.readJsonGreedy(filename),
      _internal.readJsonGreedy(dstFilename)
    ]);
    if (dstComponent.state === srcComponent.state) {
      return null;
    }
    dstComponent.state = srcComponent.state;
    const dstComponentDir = path.dirname(dstFilename);
    return _internal.writeComponentJson(projectRootDir, dstComponentDir, dstComponent, true);
  });
  return Promise.all(p);
}

export { _internal };
