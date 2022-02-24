/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License.txt in the project root for the license information.
 */
"use strict";

//this line must be placed before require express, socket.io and any other depending library
if (process.env.WHEEL_DEBUG_VERBOSE) {
  const debugLib = require("debug");
  const orgNamespaces = debugLib.load();
  const newNamespaces = "socket.io:*,express:*,abc4*,arssh2*,sbs*";
  const namespaces = orgNamespaces ? `${orgNamespaces},${newNamespaces}` : newNamespaces;
  debugLib.enable(namespaces);
}

const path = require("path");
const os = require("os");
const fs = require("fs-extra");
const cors = require("cors");
const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const Siofu = require("socketio-file-upload");
const { port, keyFilename, certFilename, projectList, remoteHost, jobScheduler } = require("./db/db");
const { setProjectState, checkRunningJobs, updateProjectDescription } = require("./core/projectFilesOperator");
const { onCreateNewFile, onCreateNewDir, onGetFileList, onGetSNDContents, onRenameFile, onRemoveFile, onUploadFileSaved } = require("./handlers/fileManager.js");
const tryToConnect = require("./handlers/tryToConnect.js");
const { onAddProject, onGetProjectList, onRenameProject, onReorderProjectList, onRemoveProjectsFromList, onRemoveProjects } = require("./handlers/projectList.js");
const { onGetProjectJson, onGetWorkflow, onRunProject, onPauseProject, onStopProject, onCleanProject, onSaveProject, onRevertProject } = require("./handlers/projectController.js");
const { onSaveFile, onOpenFile } = require("./handlers/rapid.js");
const { getLogger } = require("./logSettings");

/*
 * read SSL related files
 */
const key = fs.readFileSync(keyFilename);
const cert = fs.readFileSync(certFilename);

/*
 * set up express, http and socket.io
 */
const app = express();
const opt = { key, cert };
const server = require("https").createServer(opt, app);
const sio = require("socket.io")(server);

//setup logger
const logger = getLogger();

process.on("unhandledRejection", logger.debug.bind(logger));
process.on("uncaughtException", logger.debug.bind(logger));

//middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.resolve(__dirname, "viewer"), { index: false }));
app.use(express.static(path.resolve(__dirname, "public"), { index: false }));

app.use(Siofu.router);

//global socket IO handler
sio.on("connection", (socket)=>{
  //TODO このタイミングでworkflowを開こうとしている時はroomに入れる
  //client側でprojectRootDirはこの値に入れている
  //socket.handshake.auth.projectRootDir
  socket.prependAny((eventName, ...args)=>{
    if (eventName.startsWith("siofu")) {
      return;
    }
    //remove callback function
    const cb = args.pop();
    if (typeof cb !== "function") {
      throw new Error("socketIO API must be called with call back function");
    }

    //cut sensitive values
    if (eventName === "tryToConnect") {
      args.pop();
    }
    //this must go to trace level(file only, never go to console)
    logger.debug(`[socketIO API] ${eventName} recieved.`, args);
  });

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
  //filemanager
  ///
  const uploader = new Siofu();
  uploader.listen(socket);
  uploader.dir = os.homedir();
  uploader.on("start", (event)=>{
    logger.debug("upload request recieved", event.file.name);
  });
  uploader.on("saved", onUploadFileSaved.bind(null, socket));
  uploader.on("error", (event)=>{
    logger.error("file upload failed", event.file, event.error);
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
  //rapid to be merged with filemanager handlers
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
  socket.on("updateProjectDescription", async(projectRootDir, description, cb)=>{
    await updateProjectDescription(projectRootDir, description);
    cb(true);
  });

  //
  //remotehost
  //
  //create
  socket.on("addHost", async(newHost, cb)=>{
    const id = await remoteHost.unshift(newHost);
    socket.emit("hostList", remoteHost.getAll());//for workflow screen's handler
    cb(id);
  });
  socket.on("copyHost", async(id, cb)=>{
    await remoteHost.copy(id);
    socket.emit("hostList", remoteHost.getAll());//for workflow screen's handler
    cb(remoteHost.get(id));
  });

  //read
  socket.on("getHostList", (cb)=>{
    cb(remoteHost.getAll());
  });

  //update
  socket.on("updateHost", async(updatedHost, cb)=>{
    await remoteHost.update(updatedHost);
    socket.emit("hostList", remoteHost.getAll());//for workflow screen's handler
    cb(updatedHost.id);
  });

  //delete
  socket.on("removeHost", async(id, cb)=>{
    await remoteHost.remove(id);
    socket.emit("hostList", remoteHost.getAll());//for workflow screen's handler
    cb(true);
  });


  //
  //JobScheduler
  //
  //read
  socket.on("getJobSchedulerList", (cb)=>{
    cb(jobScheduler);
  });
  socket.on("getJobSchedulerLabelList", (cb)=>{
    cb(Object.keys(jobScheduler));
  });

  //auxiliary
  socket.on("tryToConnect", tryToConnect);
  socket.on("tryToConnectById", async(id, password, cb)=>{
    const hostInfo = remoteHost.get(id);
    await tryToConnect(hostInfo, password, cb);
  });
});

//routing
const routes = {
  home: require(path.resolve(__dirname, "routes/home")),
  workflow: require(path.resolve(__dirname, "routes/workflow"))(sio),
  remotehost: require(path.resolve(__dirname, "routes/remotehost")),
  jobScript: require(path.resolve(__dirname, "routes/jobScript"))(sio)
};
app.get("/", routes.home);
app.get("/home", routes.home);
app.get("/remotehost", routes.remotehost);
app.use("/workflow", routes.workflow);
app.use("/graph", routes.workflow);
app.use("/list", routes.workflow);
app.use("/editor", routes.workflow);
app.use("/jobScript", routes.jobScript);


//port number
const defaultPort = 443;
let portNumber = parseInt(process.env.WHEEL_PORT, 10) || port || defaultPort;
portNumber = portNumber > 0 ? portNumber : defaultPort;

//handle 404 not found
app.use((req, res, next)=>{
  res.status(404).send("reqested page is not found");
  next();
});
//error handler
app.use((err, req, res, next)=>{
  //render the error page
  res.status(err.status || 500);
  res.send("something broken!");
  next();
});

//check each project has running job or not
Promise.all(projectList.getAll()
  .map(async(pj)=>{
    const { jmFiles } = await checkRunningJobs(pj.path);
    if (jmFiles.length > 0) {
      setProjectState(pj.path, "holding");
    }
  }))
  .then(()=>{
    //Listen on provided port, on all network interfaces.
    server.listen(portNumber);
    server.on("error", onError);
    server.on("listening", onListening);
    process.on("SIGINT", ()=>{
      if (logger) {
        logger.info("WHEEL will shut down because Control-C pressed");
      } else {
        //eslint-disable-next-line no-console
        console.log("WHEEL will shut down because Control-C pressed");
      }
      process.exit(); //eslint-disable-line no-process-exit
    });
  });


/**
 * Event listener for HTTP server "error" event.
 * @param {Error} error - exception raised from http(s) server
 */
function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }
  const bind = typeof port === "string" ? `Pipe ${port}` : `Port ${port}`;

  //handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      logger.error(`${bind} requires elevated privileges`);
      //eslint-disable-next-line no-process-exit
      process.exit(1);
    case "EADDRINUSE":
      logger.error(`${bind} is already in use`);
      //eslint-disable-next-line no-process-exit
      process.exit(1);
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
  const addr = server.address();
  const bind = typeof addr === "string"
    ? `pipe ${addr}`
    : `port ${addr.port}`;
  logger.info(`Listening on ${bind}`);
}
