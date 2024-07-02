/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const os = require("os");
const { onCreateNewFile, onCreateNewDir, onGetFileList, onGetSNDContents, onRenameFile, onCommitFiles, onRemoveFile, onUploadFileSaved, onDownload, onRemoveDownloadFile } = require("./fileManager.js");
const { onTryToConnect, onTryToConnectById } = require("./tryToConnect.js");
const { onAddProject, onGetProjectList, onRenameProject, onReorderProjectList, onRemoveProjectsFromList, onRemoveProjects } = require("./projectList.js");
const { onGetProjectJson, onGetWorkflow, onProjectOperation, onUpdateProjectDescription, onUpdateProjectROStatus } = require("./projectController.js");
const { onSaveFile, onOpenFile } = require("./rapid.js");
const { onAddHost, onCopyHost, onGetHostList, onUpdateHost, onRemoveHost } = require("./remoteHost.js");
const { onGetJobSchedulerList, onGetJobSchedulerLabelList } = require("./jobScheduler.js");
const { validateComponents } = require("../core/validateComponents.js");
const {
  onCreateNode,
  onUpdateComponent,
  onUpdatePos,
  onRemoveNode,
  onAddLink,
  onAddFileLink,
  onRemoveLink,
  onRemoveAllLink,
  onRemoveFileLink,
  onRemoveAllFileLink,
  onGetEnv,
  onUpdateEnv
} = require("./workflowEditor.js");
const { onAddJobScriptTemplate, onUpdateJobScriptTemplate, onRemoveJobScriptTemplate, onGetJobScriptTemplates } = require("./jobScript.js");
const { onGetResultFiles } = require("./resultFiles.js");
const { sendTaskStateList, sendComponentTree } = require("./senders.js");
const { getLogger } = require("../logSettings");
const { onCreateNewRemoteFile, onCreateNewRemoteDir, onRequestRemoteConnection, onGetRemoteFileList, onGetRemoteSNDContents, onRemoteDownload, onRenameRemoteFile, onRemoveRemoteFile } = require("./remoteFileBrowser.js");
const { aboutWheel } = require("../core/versionInfo.js");
const registerHandlers = (socket, Siofu)=>{
  //
  //read information
  //
  socket.on("getComponentTree", sendComponentTree);
  socket.on("getTaskStateList", sendTaskStateList);

  //
  //projectController
  //
  socket.on("projectOperation", onProjectOperation.bind(null, socket.id));

  //
  //workflow editor
  //
  //create
  socket.on("createNode", onCreateNode);
  socket.on("addLink", onAddLink);
  socket.on("addFileLink", onAddFileLink);
  //read
  socket.on("getEnv", onGetEnv);
  //update
  socket.on("updateComponent", onUpdateComponent);
  socket.on("updatePos", onUpdatePos);
  socket.on("updateEnv", onUpdateEnv);
  //delete
  socket.on("removeNode", onRemoveNode);
  socket.on("removeLink", onRemoveLink);
  socket.on("removeAllLink", onRemoveAllLink);
  socket.on("removeFileLink", onRemoveFileLink);
  socket.on("removeAllFileLink", onRemoveAllFileLink);

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
  uploader.on("saved", onUploadFileSaved);
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
  socket.on("download", onDownload);
  //update
  socket.on("renameFile", onRenameFile);
  socket.on("commitFiles", onCommitFiles);
  //delete
  socket.on("removeFile", onRemoveFile);
  socket.on("removeDownloadFile", onRemoveDownloadFile);
  //
  //rapid (to be merged with filemanager handlers)
  //
  //update
  socket.on("saveFile", onSaveFile);
  socket.on("openFile", onOpenFile.bind(null, socket.id));

  //
  //remote file browser
  //
  //create
  socket.on("createNewRemoteFile", onCreateNewRemoteFile);
  socket.on("createNewRemoteDir", onCreateNewRemoteDir);
  //read
  socket.on("getRemoteFileList", onGetRemoteFileList);
  socket.on("getRemoteSNDContents", onGetRemoteSNDContents);
  socket.on("downloadRemote", onRemoteDownload);
  //update
  socket.on("renameRemoteFile", onRenameRemoteFile);
  //delete
  socket.on("removeRemoteFile", onRemoveRemoteFile);

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
  socket.on("getProjectJson", onGetProjectJson);
  socket.on("getWorkflow", onGetWorkflow.bind(null, socket.id));
  //update
  socket.on("updateProjectDescription", onUpdateProjectDescription);
  socket.on("updateProjectROStatus", onUpdateProjectROStatus);

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

  //
  //JobScriptTemplate
  //
  //create
  socket.on("addJobScriptTemplate", onAddJobScriptTemplate.bind(null, socket));
  //read
  socket.on("getJobscriptTemplates", onGetJobScriptTemplates.bind(null, socket));
  //update
  socket.on("updateJobScriptTemplate", onUpdateJobScriptTemplate.bind(null, socket));
  //delete
  socket.on("removeJobScriptTemplate", onRemoveJobScriptTemplate.bind(null, socket));

  //
  //result files (read only)
  //
  socket.on("getResultFiles", onGetResultFiles.bind(null, socket.id));

  //auxiliary
  socket.on("tryToConnect", onTryToConnect.bind(null, socket.id));
  socket.on("tryToConnectById", onTryToConnectById.bind(null, socket.id));
  socket.on("requestRemoteConnection", onRequestRemoteConnection.bind(null, socket));
  socket.on("aboutWheel", aboutWheel);
  socket.on("checkComponents", async (projectRootDir, parentComponentID, ack)=>{
    const rt = await validateComponents(projectRootDir, parentComponentID);
    ack(rt);
  });

  //
  //deprecated APIs which are left for DEBUG
  //
  socket.on("runProject", (clientID, projectRootDir)=>{
    getLogger(projectRootDir).error("[deprecated] runProject API is no longer available");
  });
  socket.on("pauseProject", (projectRootDir)=>{
    getLogger(projectRootDir).error("[deprecated] pauseProject API is no longer available");
  });
  socket.on("stopProject", (projectRootDir)=>{
    getLogger(projectRootDir).error("[deprecated] stopProject API is no longer available");
  });
  socket.on("cleanProject", (clientID, projectRootDir)=>{
    getLogger(projectRootDir).error("[deprecated] cleanProject API is no longer available");
  });
  socket.on("saveProject", (projectRootDir)=>{
    getLogger(projectRootDir).error("[deprecated] saveProject API is no longer available");
  });
  socket.on("revertProject", (clientID, projectRootDir)=>{
    getLogger(projectRootDir).error("[deprecated] revertProject API is no longer available");
  });
  socket.on("updateNode", (projectRootDir)=>{
    getLogger(projectRootDir).error("[deprecated] updateNode API is no longer available");
  });
  socket.on("addInputFile", (projectRootDir)=>{
    getLogger(projectRootDir).error("[deprecated] addInputFile API is no longer available");
  });
  socket.on("addOutputFile", (projectRootDir)=>{
    getLogger(projectRootDir).error("[deprecated] addOutputFile API is no longer available");
  });
  socket.on("renameInputFile", (projectRootDir)=>{
    getLogger(projectRootDir).error("[deprecated] renameIntputFile API is no longer available");
  });
  socket.on("renameOutputFile", (projectRootDir)=>{
    getLogger(projectRootDir).error("[deprecated] renameOutputFile API is no longer available");
  });
  socket.on("removeInputFile", (projectRootDir)=>{
    getLogger(projectRootDir).error("[deprecated] removeIntputFile API is no longer available");
  });
  socket.on("removeOutputFile", (projectRootDir)=>{
    getLogger(projectRootDir).error("[deprecated] removeOuttputFile API is no longer available");
  });
};

module.exports = {
  registerHandlers
};
