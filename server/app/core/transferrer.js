/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path=require("path");
const { addX, replaceCRLF} = require("./fileUtils.js");
const { setTaskState, needDownload, makeDownloadRecipe} = require("./execUtils");
const { getSshHostinfo, getSsh } = require("./sshManager.js");
const { getLogger } = require("../logSettings.js");
const {register} = require("./transferManager.js");

async function stageIn(task){
  await setTaskState(task, "stage-in");
  const hostinfo=getSshHostinfo(task.projectRootDir, task.remotehostID);

  //convert \r\n to \n
  const localScriptPath = path.resolve(task.workingDir, task.script);
  await replaceCRLF(localScriptPath);

  //add exec permission to script
  await addX(localScriptPath)

  //register send request
  return register(hostinfo, task, "send",[task.workingDir], `${path.posix.dirname(task.remoteWorkingDir)}/`);
}

async function stageOut(task){
  await setTaskState(task, "stage-out");
  const hostinfo = getSshHostinfo(task.projectRootDir, task.remotehostID);

  getLogger(task.projectRootDir).debug("start to get files from remote server if specified");
  const downloadRecipe = [];
  for (const outputFile of task.outputFiles) {
    if (!await needDownload(task.projectRootDir, task.ID, outputFile)) {
      getLogger(task.projectRootDir).trace(`${outputFile.name} will NOT be downloaded`);
      continue;
    }
    downloadRecipe.push(makeDownloadRecipe(task.projectRootDir, outputFile.name, task.remoteWorkingDir, task.workingDir));
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
    promises.push(register(hostinfo, task, "recv", srces, dst));
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
      return makeDownloadRecipe(task.projectRootDir, e, task.remoteWorkingDir, task.workingDir);
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
      promises.push(register(hostinfo, task, "recv", srces, dst, opt));
    }
  }

  await Promise.all(promises);

  //clean up remote working directory
  if (task.doCleanup) {
    getLogger(task.projectRootDir).debug("(remote) rm -fr", task.remoteWorkingDir);

    try {
      const ssh = getSsh(task.projectRootDir, task.remotehostID);
      await ssh.exec(`rm -fr ${task.remoteWorkingDir}`);
    } catch (e) {
      //just log and ignore error
      getLogger(task.projectRootDir).warn("remote cleanup failed but ignored", e);
    }
  }
}

module.exports={
  stageIn,
  stageOut
}
