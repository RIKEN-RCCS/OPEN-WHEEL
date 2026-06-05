/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import path from "path";
import { addX, replaceCRLF } from "./fileUtils.js";
import { setTaskState, needDownload, makeDownloadRecipe } from "./execUtils.js";
import { getSshHostinfo, getSsh } from "./sshManager.js";
import { getLogger } from "../logSettings.js";
import { register } from "./transferManager.js";
import { isSameRemoteHost } from "./componentHostOperations.js";

export const _internal = {
  addX,
  replaceCRLF,
  setTaskState,
  needDownload,
  makeDownloadRecipe,
  getSshHostinfo,
  getSsh,
  getLogger,
  register,
  isSameRemoteHost,
  getRemoteSymlinkOutputNames: null, //set below after function definition
  addDeferredCleanup: null //set below after function definition
};

/**@type {Map<string, Array<{remoteWorkingDir: string, remotehostID: string, symlinkTargetNames: string[]}>>} */
const deferredCleanupRegistry = new Map();

/**
 * Register files that were preserved during partial cleanup for later deletion after project execution finishes.
 * @param {string} projectRootDir - project's root path
 * @param {{remoteWorkingDir: string, remotehostID: string, symlinkTargetNames: string[]}} entry - cleanup info
 */
function addDeferredCleanup(projectRootDir, entry) {
  if (!deferredCleanupRegistry.has(projectRootDir)) {
    deferredCleanupRegistry.set(projectRootDir, []);
  }
  deferredCleanupRegistry.get(projectRootDir).push(entry);
}
_internal.addDeferredCleanup = addDeferredCleanup;

/**
 * get output file names (top-level path component) that will be delivered as symlinks on the remote host
 * (same remote host or shared storage between remote and localhost)
 * @param {object} task - task component object
 * @returns {Promise<string[]>} - deduplicated array of top-level path components used as remote symlink targets
 */
export async function getRemoteSymlinkOutputNames(task) {
  if (!Array.isArray(task.outputFiles) || task.outputFiles.length === 0) {
    return [];
  }
  const names = new Set();
  for (const outputFile of task.outputFiles) {
    if (!Array.isArray(outputFile.dst)) {
      continue;
    }
    for (const dst of outputFile.dst) {
      if (await _internal.isSameRemoteHost(task.projectRootDir, task.ID, dst.dstNode)) {
        //keep the top-level path component so that subdir/file.dat preserves the whole subdir
        names.add(outputFile.name.split("/")[0]);
        break;
      }
    }
  }
  return Array.from(names);
}
_internal.getRemoteSymlinkOutputNames = getRemoteSymlinkOutputNames;

/**
 * prepare task component on remotehost
 * @param {object} task - component to be executed on remotehost
 * @returns {Promise} - resolved after preparation done
 */
export async function stageIn(task) {
  await _internal.setTaskState(task, "stage-in");
  const hostinfo = _internal.getSshHostinfo(task.projectRootDir, task.remotehostID);

  //convert \r\n to \n
  const localScriptPath = path.resolve(task.workingDir, task.script);
  await _internal.replaceCRLF(localScriptPath);

  //add exec permission to script
  await _internal.addX(localScriptPath);

  //register send request
  return _internal.register(hostinfo, task, "send", [task.workingDir], `${path.posix.dirname(task.remoteWorkingDir)}/`);
}

/**
 * get needed files from remotehost
 * @param {object} task - component which have been executed on remotehost
 * @returns {Promise} - resolved after file transfer done
 */
export async function stageOut(task) {
  const taskState = task.state;
  if (taskState !== "finished") {
    return;
  }
  await _internal.setTaskState(task, "stage-out");
  const hostinfo = _internal.getSshHostinfo(task.projectRootDir, task.remotehostID);

  _internal.getLogger(task.projectRootDir).debug("start to get files from remote server if specified");

  const downloadRecipe = [];
  for (const outputFile of task.outputFiles) {
    if (!await _internal.needDownload(task.projectRootDir, task.ID, outputFile)) {
      _internal.getLogger(task.projectRootDir).trace(`${outputFile.name} will NOT be downloaded`);
      continue;
    }
    downloadRecipe.push(_internal.makeDownloadRecipe(task.projectRootDir, outputFile.name, task.remoteWorkingDir, task.workingDir));
  }

  const promises = [];

  const dsts = Array.from(new Set(downloadRecipe.map((e)=>{
    return e.dst;
  })));

  for (const dst of dsts) {
    const srces = downloadRecipe.filter((e)=>{
      return e.dst === dst;
    }).map((e)=>{
      return e.src;
    });
    promises.push(_internal.register(hostinfo, task, "recv", srces, dst));
  }
  let opt;
  if (Array.isArray(task.exclude)) {
    opt = task.exclude.map((e)=>{
      return `--exclude=${e}`;
    });
  }
  //get files which match include filter
  if (Array.isArray(task.include) && task.include.length > 0) {
    const downloadRecipe2 = task.include.map((e)=>{
      return _internal.makeDownloadRecipe(task.projectRootDir, e, task.remoteWorkingDir, task.workingDir);
    });
    const dsts2 = Array.from(new Set(downloadRecipe2.map((e)=>{
      return e.dst;
    })));
    for (const dst of dsts2) {
      const srces = downloadRecipe2.filter((e)=>{
        return e.dst === dst;
      }).map((e)=>{
        return e.src;
      });
      promises.push(_internal.register(hostinfo, task, "recv", srces, dst, opt));
    }
  }

  await Promise.all(promises);
  //clean up remote working directory
  if (task.doCleanup && taskState === "finished") {
    const symlinkTargetNames = await _internal.getRemoteSymlinkOutputNames(task);
    try {
      const ssh = _internal.getSsh(task.projectRootDir, task.remotehostID);
      if (symlinkTargetNames.length === 0) {
        //no symlink targets: full cleanup
        _internal.getLogger(task.projectRootDir).debug("(remote) rm -fr", task.remoteWorkingDir);
        await ssh.exec(`rm -fr ${task.remoteWorkingDir}`);
      } else {
        //partial cleanup: delete everything except files used as remote symlink targets
        _internal.getLogger(task.projectRootDir).debug("(remote) partial cleanup, keeping", symlinkTargetNames, "in", task.remoteWorkingDir);
        const excludes = symlinkTargetNames.map((name)=>{
          return `! -name '${name}'`;
        }).join(" ");
        await ssh.exec(`find ${task.remoteWorkingDir} -mindepth 1 -maxdepth 1 ${excludes} -exec rm -rf {} +`);
        //register symlink targets for cleanup after project execution finishes
        _internal.addDeferredCleanup(task.projectRootDir, { remoteWorkingDir: task.remoteWorkingDir, remotehostID: task.remotehostID, symlinkTargetNames });
      }
    } catch (e) {
      //just log and ignore error
      _internal.getLogger(task.projectRootDir).warn("remote cleanup failed but ignored", e);
    }
  }
  await _internal.setTaskState(task, taskState);
}

/**
 * Run all deferred cleanup operations for a project.
 * Deletes remote-symlink output files that were preserved during per-component cleanup,
 * then removes the now-empty remote working directories.
 * Must be called before SSH connections are removed.
 * @param {string} projectRootDir - project's root path
 */
export async function runDeferredCleanups(projectRootDir) {
  const entries = deferredCleanupRegistry.get(projectRootDir) || [];
  const logger = _internal.getLogger(projectRootDir);
  for (const { remoteWorkingDir, remotehostID, symlinkTargetNames } of entries) {
    const ssh = _internal.getSsh(projectRootDir, remotehostID);
    try {
      for (const name of symlinkTargetNames) {
        logger.debug("(deferred cleanup) rm -rf", `${remoteWorkingDir}/${name}`);
        await ssh.exec(`rm -rf ${remoteWorkingDir}/${name}`);
      }
      logger.debug("(deferred cleanup) rm -fr", remoteWorkingDir);
      await ssh.exec(`rm -fr ${remoteWorkingDir}`);
    } catch (e) {
      logger.warn("deferred remote cleanup failed but ignored", e);
    }
  }
  deferredCleanupRegistry.delete(projectRootDir);
}

/**
 * Clear all deferred cleanup registrations for a project without running them.
 * Called when project execution is stopped before normal completion.
 * @param {string} projectRootDir - project's root path
 */
export function clearDeferredCleanups(projectRootDir) {
  deferredCleanupRegistry.delete(projectRootDir);
}
