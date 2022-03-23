/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License.txt in the project root for the license information.
 */
"use strict";

const db = new Map();
const { destroy } = require("abc4");

function addCluster(projectRootDir, hostinfo, cluster) {
  if (!db.has(projectRootDir)) {
    db.set(projectRootDir, new Map());
  }
  db.get(projectRootDir).set(hostinfo.id, { cluster, hostinfo });
}

function removeCluster(projectRootDir) {
  const target = db.get(projectRootDir);
  if (!target) {
    return;
  }
  for (const cluster of target.values()) {
    destroy(cluster);
  }
  db.get(projectRootDir).clear();
}


module.exports = {
  addCluster,
  removeCluster
};
