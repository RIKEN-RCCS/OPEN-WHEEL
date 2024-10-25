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
const ipfilter = require("express-ipfilter").IpFilter;
const passport = require("passport");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const { ensureLoggedIn } = require("connect-ensure-login");
const asyncHandler = require("express-async-handler");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const Siofu = require("socketio-file-upload");
const { port, projectList } = require("./db/db.js");
const { setProjectState, checkRunningJobs } = require("./core/projectFilesOperator");
const { getLogger } = require("./logSettings");
const { registerHandlers } = require("./handlers/registerHandlers");
const { baseURL, setSio } = require("./core/global.js");
const { tempdRoot } = require("./core/tempd.js");
const { aboutWheel } = require("./core/versionInfo.js");
const { hasEntry, hasCode, hasRefreshToken, storeCode, acquireAccessToken, getURLtoAcquireCode, getRemotehostIDFromState } = require("./core/webAPI.js");
const secret = "wheel";
const sessionDBFilename = "session.db";
const sessionDBDir = process.env.WHEEL_SESSION_DB_DIR || path.resolve(__dirname, "db");

//setup logger
const logger = getLogger();
process.on("unhandledRejection", logger.debug.bind(logger));
process.on("uncaughtException", logger.debug.bind(logger));

if (process.env.WHEEL_CLEAR_SESSION_DB) {
  try {
    fs.removeSync(path.resolve(sessionDBDir, sessionDBFilename));
  } catch (e) {
    logger.debug("remove session DB failed", e);
  }
}

/*
 * setup express, socketIO
 */

const app = express();
const address = process.env.WHEEL_ACCEPT_ADDRESS;

function createHTTPSServer(argApp) {
  const { keyFilename, certFilename } = require("./db/db");
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

//
//do not call log functions above this line !!
//
aboutWheel();

//port number
const defaultPort = process.env.WHEEL_USE_HTTP ? 80 : 443;
let portNumber = port || defaultPort;
portNumber = portNumber > 0 ? portNumber : defaultPort;
//middlewares
if (address) {
  const ips = [address];
  app.use(ipfilter(ips, { mode: "allow", logF: logger.debug.bind(logger) }));
}

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(Siofu.router);
app.use(session({
  secret,
  resave: false,
  saveUninitialized: false,
  store: new SQLiteStore({ db: sessionDBFilename, dir: sessionDBDir })
}));

if (process.env.WHEEL_ENABLE_AUTH) {
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(passport.authenticate("session"));
}

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
const router = express.Router();
router.use(express.static(path.resolve(__dirname, "public"), { index: false }));
logger.info(`${tempdRoot} is used as static content directory`);
router.use(express.static(path.resolve(tempdRoot, "viewer"), { index: false }));
router.use(express.static(path.resolve(tempdRoot, "download"), { index: false }));
if (process.env.WHEEL_ENABLE_WEB_API) {
  router.use(asyncHandler(async (req, res, next)=>{
    if (!req.query.code) {
      if (req.query.error) {
        logger.debug("failed to get authorization code", req.query);
      }
      logger.trace("not with code");
      next();
      return;
    }
    const state = req.query.state;
    if (!req.query.state) {
      logger.debug("state is not set");
    }
    const remotehostID = getRemotehostIDFromState(state);
    if (!hasEntry(remotehostID)) {
      logger.debug(`we have not started authorization process for ${remotehostID}`);
      next();
      return;
    }
    if (hasRefreshToken(remotehostID)) {
      logger.debug(`we already have refresh token for ${remotehostID}`);
      next();
      return;
    }
    //state, session-stateなどのクエリパラメータがauthに保存していたものと一致するかチェックする必要あり
    const rt = storeCode(remotehostID, req.query.code);
    if (!rt) {
      logger.trace(`request does not include authorization code: ${remotehostID}`);
    }
    await acquireAccessToken(remotehostID);
    next();
  }));
}

const routes = {
  home: require("./routes/home"),
  workflow: require("./routes/workflow"),
  remotehost: require("./routes/remotehost"),
  login: require("./routes/login"),
  viewer: require("./routes/viewer")
};

let checkLoggedIn = (req, res, next)=>{
  next();
};

if (process.env.WHEEL_ENABLE_AUTH) {
  checkLoggedIn = ensureLoggedIn ("/login");
  router.route("/login").get(routes.login.get)
    .post(routes.login.post);
}
router.get("/", checkLoggedIn, routes.home);
router.get("/home", checkLoggedIn, routes.home);
router.get("/remotehost", checkLoggedIn, routes.remotehost);
router.route("/workflow").get(checkLoggedIn, routes.workflow.get)
  .post(checkLoggedIn, routes.workflow.post);
router.route("/graph").get(checkLoggedIn, routes.workflow.get)
  .post(checkLoggedIn, routes.workflow.post);
router.route("/list").get(checkLoggedIn, routes.workflow.get)
  .post(routes.workflow.post);
router.route("/editor").get(checkLoggedIn, routes.workflow.get)
  .post(checkLoggedIn, routes.workflow.post);
router.route("/viewer").get(checkLoggedIn, routes.viewer.get)
  .post(checkLoggedIn, routes.viewer.post);

if (process.env.WHEEL_ENABLE_WEB_API) {
  router.get("/webAPIauth", asyncHandler(async (req, res)=>{
    const projectRootDir = req.cookies.rootDir;
    if (!projectRootDir) {
      logger.warn("web authentication required without projectRootDir");
      return;
    }
    const remotehostID = req.query.remotehostID;
    if (hasEntry(remotehostID)) {
      logger.debug(`${remotehostID} found in authDB`);
      if (hasCode(remotehostID)) {
        logger.debug(`${remotehostID} already has code`);
        if (hasRefreshToken(remotehostID)) {
          logger.debug(`try to get access token for ${remotehostID}`);
        }
        res.redirect("/workflow");
        return;
      }
    }

    const referer = new URL(req.get("Referer"));
    const redirectURI = `${referer.origin}${referer.pathname}`;
    const url = await getURLtoAcquireCode(remotehostID, redirectURI);
    res.redirect(url);
  }));
}

app.use(baseURL, router);

//handle 404 not found
app.use((req, res, next)=>{
  logger.debug("404 not found", req.url);
  res.status(404).send("reqested page is not found");
  next();
});
//error handler
app.use((err, req, res, next)=>{
  logger.trace("http(s) handler err", err);
  //render the error page
  logger.debug("server error", err);
  res.status(err.status || 500);
  res.send("something broken!");
  next();
});

//check each project has running job or not
Promise.all(projectList.getAll()
  .map(async (pj)=>{
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
        console.log("WHEEL will shut down because Control-C pressed");
      }
      process.exit();
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
      process.exit(1);
      break;
    case "EADDRINUSE":
      logger.error(`${bind} is already in use`);
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
