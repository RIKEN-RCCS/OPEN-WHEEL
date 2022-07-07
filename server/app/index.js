/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See Licensethe project root for the license information.
 */
"use strict";
const path = require("path");
const fs = require("fs-extra");
const cors = require("cors");
const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const Siofu = require("socketio-file-upload");
const { port, keyFilename, certFilename, projectList } = require("./db/db");
const { setProjectState, checkRunningJobs } = require("./core/projectFilesOperator");
const { getLogger } = require("./logSettings");
const { registerHandlers } = require("./handlers/registerHandlers");
const { setSio } = require("./core/global.js");

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
setSio(sio);

//setup logger
const logger = getLogger();

process.on("unhandledRejection", logger.debug.bind(logger));
process.on("uncaughtException", logger.debug.bind(logger));

//middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.resolve(__dirname, "public"), { index: false }));
app.use(express.static(path.resolve(__dirname, "viewer"), { index: false }));
app.use(express.static(path.resolve(__dirname, "download"), { index: false }));

app.use(Siofu.router);

//global socket IO handler
sio.on("connection", (socket)=>{
  const projectRootDir = socket.handshake.auth.projectRootDir;
  if (typeof projectRootDir === "string") {
    socket.join(projectRootDir);
  }
  socket.prependAny((eventName, ...args)=>{
    if (eventName.startsWith("siofu")) {
      return;
    }
    //get callback argument
    const cb = args.pop();
    //remove sensitive values
    if (eventName === "tryToConnect") {
      args.pop();
    }
    //this must go to trace level(file only, never go to console)
    logger.debug(`[socketIO API] ${eventName} recieved.`, args);

    //sanity check for ack
    if (typeof cb !== "function") {
      throw new Error("socketIO API must be called with call back function");
    }
  });
  registerHandlers(socket, Siofu);
});

//routing
const routes = {
  home: require(path.resolve(__dirname, "routes/home")),
  workflow: require(path.resolve(__dirname, "routes/workflow")),
  remotehost: require(path.resolve(__dirname, "routes/remotehost")),
  viewer: require(path.resolve(__dirname, "routes/viewer"))
};
app.get("/", routes.home);
app.get("/home", routes.home);
app.get("/remotehost", routes.remotehost);
app.use("/workflow", routes.workflow);
app.use("/graph", routes.workflow);
app.use("/list", routes.workflow);
app.use("/editor", routes.workflow);
app.use("/viewer", routes.viewer);


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
