/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path = require("path");
const fs = require("fs-extra");
const { getLogger } = require("../logSettings");
const { projectList, projectJsonFilename } = require("../db/db.js");
const { readJsonGreedy } = require("../core/fileUtils");
const { addProject, renameProject } = require("../core/projectFilesOperator.js");
const { removeTempd } = require("../core/tempd.js");

const getAllProject = async ()=>{
  const pj = await Promise.all(projectList.getAll().map(async (v)=>{
    let rt;
    try {
      const projectJson = await readJsonGreedy(path.join(v.path, projectJsonFilename));
      rt = Object.assign(projectJson, v);
    } catch (err) {
      getLogger().warn(v, "read failed remove from the list");
      projectList.remove(v.id);
      rt = null;
    }
    return rt;
  }));

  return pj.filter((e)=>{
    return e !== null;
  });
};
const sendProjectListIfExists = async (socket, cb)=>{
  try {
    const pjList = await getAllProject();
    if (pjList) {
      socket.emit("projectList", pjList);
    }
  } catch (e) {
    cb(false);
    return;
  }
  cb(true);
};
const projectListAdaptor = async (socket, cb, asyncFunc)=>{
  try {
    await asyncFunc();
  } catch (e) {
    cb(e);
    return;
  }
  await sendProjectListIfExists(socket, cb);
};
//return projectlist via call back routine
const onGetProjectList = async (socket, cb)=>{
  const pjList = await getAllProject();
  if (!pjList) {
    return cb(false);
  }
  return cb(pjList);
};
const onReorderProjectList = async (socket, orderList, cb)=>{
  await projectListAdaptor(socket, cb, projectList.reorder.bind(projectList, orderList));
};
const onRemoveProjectsFromList = async (socket, ids, cb)=>{
  await projectListAdaptor(socket, cb, projectList.removeMany.bind(projectList, ids));
};
const onRemoveProjects = async (socket, ids, cb)=>{
  await projectListAdaptor(socket, cb, async ()=>{
    await Promise.all(
      ids.map((id)=>{
        const target = projectList.get(id);
        const projectRootDir = target.path;
        return Promise.all([
          removeTempd(projectRootDir, "viewer"),
          removeTempd(projectRootDir, "download"),
          fs.remove(projectRootDir)]);
      })
    );
    await projectList.removeMany(ids);
  });
};
const onAddProject = async (socket, projectDir, description, cb)=>{
  await projectListAdaptor(socket, cb, addProject.bind(null, projectDir, description));
};
const onRenameProject = async (socket, id, newName, oldDir, cb)=>{
  await projectListAdaptor(socket, cb, renameProject.bind(null, id, newName, oldDir));
};

module.exports = {
  onAddProject,
  onRenameProject,
  onGetProjectList,
  onReorderProjectList,
  onRemoveProjectsFromList,
  onRemoveProjects
};
