/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License.txt in the project root for the license information.
 */
"use strict";
const path = require("path");
const fs = require("fs-extra");
const { readComponentJson } = require("./componentFilesOperator");

async function createTempd(projectRootDir, prefix) {
  const root = path.resolve(path.dirname(__dirname), prefix);
  const { ID } = await readComponentJson(projectRootDir);
  const dir = path.join(root, ID);
  await fs.ensureDir(dir);
  return { dir, root };
}

async function removeTempd(projectRootDir, prefix) {
  const { ID } = await readComponentJson(projectRootDir);
  return fs.remove(path.resolve(path.dirname(__dirname), prefix, ID));
}


module.exports = {
  createTempd,
  removeTempd
};
