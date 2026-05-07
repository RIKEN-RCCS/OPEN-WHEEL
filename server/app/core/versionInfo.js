/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import versionData from "../db/version.json" with { type: "json" };
const { version } = versionData;
import { getLogger } from "../logSettings.js";
import { port, baseURL, useHttp, acceptAddress, logLevel, verboseSsh, numLocalJob, enableWebApi, enableAuth } from "../db/db.js";

/**
 * print version and environment variables
 * @param {string} projectRootDir - project's root path
 */
function aboutWheel(projectRootDir) {
  const logger = getLogger(projectRootDir);

  logger.info(`starting WHEEL server (version ${version})`);
  logger.info("base URL = ", baseURL);
  logger.info("effective configuration");
  logger.info(`WHEEL_TEMPD = ${process.env.WHEEL_TEMPD}`);
  logger.info(`WHEEL_CONFIG_DIR = ${process.env.WHEEL_CONFIG_DIR}`);
  logger.info(`WHEEL_BASE_URL = ${baseURL}`);
  logger.info(`WHEEL_USE_HTTP = ${useHttp}`);
  logger.info(`WHEEL_PORT = ${port}`);
  logger.info(`WHEEL_ACCEPT_ADDRESS = ${acceptAddress}`);
  logger.info(`WHEEL_LOG_LEVEL = ${logLevel}`);
  logger.info(`WHEEL_VERBOSE_SSH = ${verboseSsh}`);
  logger.info(`WHEEL_NUM_LOCAL_JOB = ${numLocalJob}`);
  logger.info(`WHEEL_ENABLE_WEB_API = ${enableWebApi}`);
  logger.info(`WHEEL_ENABLE_AUTH = ${enableAuth}`);
}

export {
  aboutWheel
};
