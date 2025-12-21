/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import { remoteHost } from "../db/db.js";
import { isLocal } from "../../../common/checkComponent.js";
import { hasChild } from "./workflowComponent.js";
import { getChildren } from "./workflowUtil.js";
import { readComponentJsonByID } from "./componentJsonIO.js";
import { isDefaultPort } from "../lib/utility.js";

const _internal = {
  remoteHost,
  isLocal,
  hasChild,
  getChildren,
  readComponentJsonByID,
  isDefaultPort,
  recursiveGetHosts: null //Will be set below
};

/**
 * check if two components are on the same remote host
 * @param {string} projectRootDir - project's root path
 * @param {string} src - source component ID
 * @param {string} dst - destination component ID
 * @returns {boolean|null} - true if same host, false if different, null if same component
 */
export async function isSameRemoteHost(projectRootDir, src, dst) {
  if (src === dst) {
    return null;
  }
  const srcComponent = await _internal.readComponentJsonByID(projectRootDir, src);
  const dstComponent = await _internal.readComponentJsonByID(projectRootDir, dst);
  if (_internal.isLocal(srcComponent) || _internal.isLocal(dstComponent)) {
    return false;
  }
  if (srcComponent.host === dstComponent.host) {
    return true;
  }
  const srcHostInfo = _internal.remoteHost.query("name", srcComponent.host);
  const dstHostInfo = _internal.remoteHost.query("name", dstComponent.host);

  if (!srcHostInfo || !dstHostInfo) {
    return false;
  }

  if (dstHostInfo.sharedHost === srcHostInfo.name) {
    return true;
  }

  if (srcHostInfo.host !== dstHostInfo.host || srcHostInfo.user !== dstHostInfo.user) {
    return false;
  }
  const srcHostPort = _internal.isDefaultPort(srcHostInfo.port) ? 22 : srcHostInfo.port;
  const dstHostPort = _internal.isDefaultPort(dstHostInfo.port) ? 22 : dstHostInfo.port;
  return srcHostPort === dstHostPort;
}

/**
 * recursively get hosts from component tree
 * @param {string} projectRootDir - project's root path
 * @param {string} parentID - parent component ID
 * @param {object[]} hosts - array to collect task hosts
 * @param {object[]} storageHosts - array to collect storage hosts
 * @param {object[]} gfarmHosts - array to collect gfarm hosts
 * @returns {Promise} - resolved when all children are processed
 */
export async function recursiveGetHosts(projectRootDir, parentID, hosts, storageHosts, gfarmHosts) {
  const promises = [];
  const children = await _internal.getChildren(projectRootDir, parentID);

  for (const component of children) {
    if (component.disable) {
      continue;
    }
    if (component.host === "localhost") {
      continue;
    }
    if (["task", "stepjob", "bulkjobTask"].includes(component.type)) {
      hosts.push({ hostname: component.host });
    } else if (["hpciss", "hpcisstar"].includes(component.type)) {
      gfarmHosts.push({ hostname: component.host, isGfarm: true });
    } else if (component.type === "storage") {
      storageHosts.push({ hostname: component.host, isStorage: true });
    }
    if (_internal.hasChild(component)) {
      promises.push(_internal.recursiveGetHosts(projectRootDir, component.ID, hosts, storageHosts, gfarmHosts));
    }
  }
  return Promise.all(promises);
}

//Set recursiveGetHosts in _internal after it's defined
_internal.recursiveGetHosts = recursiveGetHosts;

/**
 * read component Json recursively and pick up remote hosts used in task component
 * @param {string} projectRootDir - project's root path
 * @param {string | null} rootID - ID of the component to start travarsal. start from project root if rootID is null
 * @returns {object[]} - exclusive array of hosts
 */
export async function getHosts(projectRootDir, rootID) {
  const hosts = [];
  const storageHosts = [];
  const gfarmHosts = [];
  await _internal.recursiveGetHosts(projectRootDir, rootID, hosts, storageHosts, gfarmHosts);

  const storageHosts2 = Array.from(new Set(storageHosts));
  const gfarmHosts2 = Array.from(new Set(gfarmHosts));
  const keepHosts = storageHosts2.concat(gfarmHosts2);

  const hosts2 = Array.from(new Set(hosts))
    .filter((host)=>{
      return !keepHosts.some((e)=>{
        e.hostname === host.hostname;
      });
    });
  return [...keepHosts, ...hosts2];
}

export { _internal };
