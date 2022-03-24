/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License.txt in the project root for the license information.
 */
"use strict";
const os = require("os");
const { onCreateNewFile, onCreateNewDir, onGetFileList, onGetSNDContents, onRenameFile, onRemoveFile, onUploadFileSaved } = require("./fileManager.js");
const { onTryToConnect, onTryToConnectById } = require("./tryToConnect.js");
const { onAddProject, onGetProjectList, onRenameProject, onReorderProjectList, onRemoveProjectsFromList, onRemoveProjects } = require("./projectList.js");
const { onGetProjectJson, onGetWorkflow, onRunProject, onPauseProject, onStopProject, onCleanProject, onSaveProject, onRevertProject, onUpdateProjectDescription } = require("./projectController.js");
const { onSaveFile, onOpenFile } = require("./rapid.js");
const { onAddHost, onCopyHost, onGetHostList, onUpdateHost, onRemoveHost } = require("./remoteHost.js");
const { onGetJobSchedulerList, onGetJobSchedulerLabelList } = require("./jobScheduler.js");
const {
  onCreateNode,
  onUpdateNode,
  onRemoveNode,
  onAddInputFile,
  onAddOutputFile,
  onRenameInputFile,
  onRenameOutputFile,
  onAddLink,
  onAddFileLink,
  onRemoveInputFile,
  onRemoveOutputFile,
  onRemoveLink,
  onRemoveFileLink
} = require("./workflowEditor.js");
const { sendTaskStateList, sendComponentTree } = require("./senders.js");
const { getLogger } = require("../logSettings");

const registerHandlers = (socket, Siofu)=>{
  //
  //read information
  //
  socket.on("getComponentTree", sendComponentTree.bind(null, socket));
  socket.on("getTaskStateList", sendTaskStateList.bind(null, socket));


  //
  //projectController
  //
  socket.on("runProject", onRunProject.bind(null, socket));
  socket.on("pauseProject", onPauseProject.bind(null, socket));
  socket.on("stopProject", onStopProject.bind(null, socket));
  socket.on("cleanProject", onCleanProject.bind(null, socket));
  socket.on("saveProject", onSaveProject.bind(null, socket));
  socket.on("revertProject", onRevertProject.bind(null, socket));

  //
  //workflow editor
  //
  //create
  socket.on("createNode", onCreateNode.bind(null, socket));
  socket.on("addInputFile", onAddInputFile.bind(null, socket));
  socket.on("addOutputFile", onAddOutputFile.bind(null, socket));
  socket.on("addLink", onAddLink.bind(null, socket));
  socket.on("addFileLink", onAddFileLink.bind(null, socket));
  //update
  socket.on("renameInputFile", onRenameInputFile.bind(null, socket));
  socket.on("renameOutputFile", onRenameOutputFile.bind(null, socket));
  socket.on("updateNode", onUpdateNode.bind(null, socket));
  //delete
  socket.on("removeNode", onRemoveNode.bind(null, socket));
  socket.on("removeInputFile", onRemoveInputFile.bind(null, socket));
  socket.on("removeOutputFile", onRemoveOutputFile.bind(null, socket));
  socket.on("removeLink", onRemoveLink.bind(null, socket));
  socket.on("removeFileLink", onRemoveFileLink.bind(null, socket));

  //
  //filemanager
  ///
  const uploader = new Siofu();
  uploader.listen(socket);
  uploader.dir = os.homedir();
  uploader.on("start", (event)=>{
    const projectRootDir = event.file.meta.projectRootDir;
    getLogger(projectRootDir).debug("upload request recieved", event.file.name);
  });
  uploader.on("saved", onUploadFileSaved.bind(null, socket));
  uploader.on("error", (event)=>{
    const projectRootDir = event.file.meta.projectRootDir;
    getLogger(projectRootDir).error("file upload failed", event.file, event.error);
  });
  //create
  socket.on("createNewFile", onCreateNewFile);
  socket.on("createNewDir", onCreateNewDir);
  //read
  socket.on("getFileList", onGetFileList);
  socket.on("getSNDContents", onGetSNDContents);
  //update
  socket.on("renameFile", onRenameFile);
  //delete
  socket.on("removeFile", onRemoveFile);
  //
  //rapid (to be merged with filemanager handlers)
  //
  //update
  socket.on("saveFile", onSaveFile);
  socket.on("openFile", onOpenFile.bind(null, socket));

  //
  //projectList
  //
  //create
  socket.on("addProject", onAddProject.bind(null, socket));
  //read
  socket.on("getProjectList", onGetProjectList.bind(null, socket));
  socket.on("renameProject", onRenameProject.bind(null, socket));
  //update
  socket.on("reorderProjectList", onReorderProjectList.bind(null, socket));
  //delete
  socket.on("removeProjectsFromList", onRemoveProjectsFromList.bind(null, socket));
  socket.on("removeProjects", onRemoveProjects.bind(null, socket));

  //
  //projectFiles
  //read
  socket.on("getProjectJson", onGetProjectJson.bind(null, socket));
  socket.on("getWorkflow", onGetWorkflow.bind(null, socket));
  //update
  socket.on("updateProjectDescription", onUpdateProjectDescription);

  //
  //remotehost
  //
  //create
  socket.on("addHost", onAddHost.bind(null, socket));
  socket.on("copyHost", onCopyHost.bind(null, socket));
  //read
  socket.on("getHostList", onGetHostList);
  //update
  socket.on("updateHost", onUpdateHost.bind(null, socket));
  //delete
  socket.on("removeHost", onRemoveHost.bind(null, socket));

  //
  //JobScheduler
  //
  //read
  socket.on("getJobSchedulerList", onGetJobSchedulerList);
  socket.on("getJobSchedulerLabelList", onGetJobSchedulerLabelList);

  //auxiliary
  socket.on("tryToConnect", onTryToConnect);
  socket.on("tryToConnectById", onTryToConnectById);
};
module.exports = {
  registerHandlers
};
