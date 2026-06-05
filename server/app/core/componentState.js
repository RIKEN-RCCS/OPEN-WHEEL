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

export { _internal };
