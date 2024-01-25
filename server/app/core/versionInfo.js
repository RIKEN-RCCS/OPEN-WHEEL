/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See Licensethe project root for the license information.
 */
"use strict";
const { version } = require("../db/version.json");
const { getLogger } = require("../logSettings");

function aboutWheel(projectRootDir) {
  const logger = getLogger(projectRootDir);
  const baseURL = process.env.WHEEL_BASE_URL || "/";

  logger.info(`starting WHEEL server (version ${version})`);
  logger.info("base URL = ", baseURL);
  logger.info("environment variables");
  logger.info(`WHEEL_TEMPD = ${process.env.WHEEL_TEMPD}`);
  logger.info(`WHEEL_CONFIG_DIR = ${process.env.WHEEL_CONFIG_DIR}`);
  logger.info(`WHEEL_BASE_URL= ${process.env.WHEEL_USE_HTTP}`);
  logger.info(`WHEEL_USE_HTTP = ${process.env.WHEEL_USE_HTTP}`);
  logger.info(`WHEEL_PORT = ${process.env.WHEEL_PORT}`);
  logger.info(`WHEEL_ACCEPT_ADDRESS = ${process.env.WHEEL_ACCEPT_ADDRESS}`);
  logger.info(`WHEEL_LOGLEVEL = ${process.env.WHEEL_LOGLEVEL}`);
  logger.info(`WHEEL_VERBOSE_SSH = ${process.env.WHEEL_VERBOSE_SSH}`);
  logger.info(`WHEEL_INTERVAL = ${process.env.WHEEL_INTERVAL}`);
  logger.info(`WHEEL_NUM_LOCAL_JOB = ${process.env.WHEEL_NUM_LOCAL_JOB}`);
  logger.info(`WHEEL_ENABLE_WEB_API = ${process.env.WHEEL_ENABLE_WEB_API}`);
}

module.exports = {
  aboutWheel
};
