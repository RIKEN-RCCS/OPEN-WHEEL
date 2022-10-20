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

//setup logger
const logger = getLogger();
process.on("unhandledRejection", logger.debug.bind(logger));
process.on("uncaughtException", logger.debug.bind(logger));

/*
 * setup express, socketIO
 */

const baseURL = process.env.WHEEL_BASE_URL || "/";
const app = express();

function createHTTPSServer(argApp) {
  //read SSL related files
  const key = fs.readFileSync(keyFilename);
  const cert = fs.readFileSync(certFilename);
  const opt = { key, cert };
  return require("https").createServer(opt, argApp);
}
function createHTTPServer(argApp) {
  return require("http").createServer(argApp);
}

const server = process.env.WHEEL_USE_HTTP ? createHTTPServer(app) : createHTTPSServer(app);
const sio = require("socket.io")(server, { path: path.normalize(`${baseURL}/socket.io/`) });
setSio(sio);
//do not call log functions above this line !!
logger.info("base URL = ", baseURL);

//port number
const defaultPort = process.env.WHEEL_USE_HTTP ? 80 : 443;
let portNumber = port || defaultPort;
portNumber = portNumber > 0 ? portNumber : defaultPort;

//middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
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
const router = express.Router(); //eslint-disable-line new-cap
router.use(express.static(path.resolve(__dirname, "public"), { index: false }));
router.use(express.static(path.resolve(__dirname, "viewer"), { index: false }));
router.use(express.static(path.resolve(__dirname, "download"), { index: false }));

const routes = {
  home: require(path.resolve(__dirname, "routes/home")),
  workflow: require(path.resolve(__dirname, "routes/workflow")),
  remotehost: require(path.resolve(__dirname, "routes/remotehost")),
  viewer: require(path.resolve(__dirname, "routes/viewer"))
};

router.get("/", routes.home);
router.get("/home", routes.home);
router.get("/remotehost", routes.remotehost);
router.route("/workflow").get(routes.workflow.get)
  .post(routes.workflow.post);
router.route("/graph").get(routes.workflow.get)
  .post(routes.workflow.post);
router.route("/list").get(routes.workflow.get)
  .post(routes.workflow.post);
router.route("/editor").get(routes.workflow.get)
  .post(routes.workflow.post);
router.route("/viewer").get(routes.viewer.get)
  .post(routes.viewer.post);

app.use(baseURL, router);


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
      break;
    case "EADDRINUSE":
      logger.error(`${bind} is already in use`);
      //eslint-disable-next-line no-process-exit
      process.exit(1);
      break;
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
