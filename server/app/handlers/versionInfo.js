/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const { getLogger } = require("../logSettings");
const {version} = require("../db/version.json");

function getVersionInfo(projectRootDir){
  const logger = getLogger(projectRootDir);
  logger.info(`WHEEL version ${version}`);
}

module.exports={
  getVersionInfo
}
