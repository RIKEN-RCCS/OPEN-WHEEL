/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path = require("path");
const fs = require("fs-extra");
const { zip } = require("zip-a-folder");
const { readComponentJsonByID, isLocal } = require("../core/componentFilesOperator.js");
const { remoteHost } = require("../db/db");
const { getLogger } = require("../logSettings");
const { createSsh, getSsh } = require("../core/sshManager");
const { createTempd } = require("../core/tempd.js");

async function onRequestRemoteConnection(socket, projectRootDir, componentID, cb) {
  const component = await readComponentJsonByID(projectRootDir, componentID);
  if (component.type !== "storage" || isLocal(component)) {
    return;
  }

  try {
    const id = remoteHost.getID("name", component.host);
    const hostInfo = remoteHost.get(id);
    await createSsh(projectRootDir, component.host, hostInfo, socket.id);
  } catch (e) {
    cb(false);
    return;
  }
  cb(true);
}


async function onGetRemoteFileList(projectRootDir, host, { path: target }, cb) {
  try {
    const id = remoteHost.getID("name", host);
    const ssh = await getSsh(projectRootDir, id);
    const stdout = [];
    const rt = await ssh.exec(`ls -F ${target}`, {}, stdout);
    if (rt !== 0) {
      getLogger(projectRootDir).error(projectRootDir, "ls on remotehost failed", rt);
      return cb(null);
    }
    const lsResults = stdout.join("\n")
      .split("\n")
      .filter((e)=>{
        return e !== "";
      });
    const links = lsResults.filter((e)=>{
      return e.endsWith("@");
    }).map((e)=>{
      return e.slice(0, e.length - 1);
    });
    const stdout2 = [];
    if (links.length > 0) {
      //eslint-disable-next-line no-useless-escape
      const rt2 = await ssh.exec(` cd ${target};for i in ${links.join(" ")};do echo $i; stat -c %F $(readlink -f $i);done`, {}, stdout2);
      if (rt2 !== 0) {
        getLogger(projectRootDir).error(projectRootDir, "ls on remotehost failed", rt);
        return cb(null);
      }
    }
    const readlinkResults = stdout2.join("\n")
      .split("\n")
      .filter((e)=>{
        return e !== "";
      });

    const content = lsResults.map((e)=>{
      const islink = e.endsWith("@");
      const name = e.slice(0, e.length - 1);
      let type = null;
      if (islink) {
        const index = readlinkResults.findIndex((result)=>{
          return result.split(",")[0] === name;
        });
        if (index + 1 < readlinkResults.length) {
          type = readlinkResults[index + 1] === "directory" ? "dir" : "file";
        }
      } else {
        type = e.endsWith("/") ? "dir" : "file";
      }
      return { path: target, name, type, islink };
    });
    return cb(content);
  } catch (e) {
    getLogger(projectRootDir).error(projectRootDir, "error occurred during reading remotedirectory", e);
    return cb(null);
  }
}
async function onGetRemoteSNDContents(projectRootDir) {
  getLogger(projectRootDir).error(projectRootDir, "onGetRemoteSNDContents should not be called any more");
}

async function onRemoteDownload(projectRootDir, target, host, cb) {
  try {
    const { dir, root: downloadRootDir } = await createTempd(projectRootDir, "download");
    const tmpDir = await fs.mkdtemp(`${dir}/`);
    const downloadContentName = path.basename(target);
    const id = remoteHost.getID("name", host);
    const ssh = await getSsh(projectRootDir, id);
    await ssh.recv(target, `${tmpDir}/`);
    const stats = await fs.stat(path.resolve(tmpDir, downloadContentName));

    if (stats.isDirectory()) {
      zip(path.resolve(tmpDir, downloadContentName), `${path.resolve(tmpDir, downloadContentName)}.zip`);
    }
    const url = `/${path.join(path.relative(downloadRootDir, tmpDir), downloadContentName)}${stats.isDirectory() ? ".zip" : ""}`;
    getLogger(projectRootDir).debug("Download url is ready", url);
    return cb(url);
  } catch (e) {
    getLogger(projectRootDir).error("fetch download file failed", e);
    return cb(null);
  }
}
module.exports = {
  onRequestRemoteConnection,
  onGetRemoteFileList,
  onGetRemoteSNDContents,
  onRemoteDownload
};
