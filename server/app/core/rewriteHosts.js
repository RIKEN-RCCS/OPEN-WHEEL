/**
 * read component Json recursively and overwrite hosts
 * @param {string} projectRootDir - project's root path
 * @param {object} hostMap - old and new remotehost label map
 * @param {string | null} rootID - ID of the component to start travarsal. start from project root if rootID is null
 */
"use strict";
const { promisify } = require("util");
const glob = require("glob");
const { readJsonGreedy } = require("./fileUtils.js");
const { componentJsonFilename } = require("../db/db");
const { writeComponentJson } = require("./componentJsonIO.js");

/**
 * rewrite all component's host property
 * @param {string} projectRootDir - project's root path
 * @param {object} hostMap - old and new remotehost label map
 * @returns {Promise} - resolved when all component metat data is rewritten
 */
async function rewriteHosts(projectRootDir, hostMap) {
  const componentJsonFiles = await promisify(glob)(`**/${componentJsonFilename}`, { cwd: projectRootDir });
  const oldRemotehostLabels = Object.keys(hostMap);

  return Promise.all(componentJsonFiles.map(async (filename)=>{
    const componentJson = await readJsonGreedy(filename);
    if (typeof componentJson.host !== "string") {
      return;
    }
    if (componentJson.host === hostMap[componentJson.host]) {
      return;
    }
    if (oldRemotehostLabels.includes(componentJson.host)) {
      componentJson.host = hostMap[componentJson.host];
      writeComponentJson;
    }
  }));
};

module.exports = {
  rewriteHosts
};
