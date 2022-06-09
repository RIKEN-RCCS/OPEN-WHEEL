/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License.txt in the project root for the license information.
 */
"use strict";
const path = require("path");
const { promisify } = require("util");
const log4js = require("log4js");
const logger = log4js.getLogger();
const { logFilename, numLogFiles, maxLogSize, compressLogFile } = require("./db/db");
const { emitAll } = require("./handlers/commUtils.js");

function getLoglevel(ignoreEnv = false) {
  const wheelLoglevel = process.env.WHEEL_LOGLEVEL;
  const defaultLevel = "debug";
  if (ignoreEnv || typeof wheelLoglevel !== "string") {
    return defaultLevel;
  }
  return ["ALL", "TRACE", "DEBUG", "INFO", "WARN", "ERROR", "FATAL", "MARK", "OFF"].includes(wheelLoglevel.toUpperCase()) ? wheelLoglevel.toUpperCase() : defaultLevel;
}

const eventNameTable = {
  DEBUG: null,
  INFO: "logINFO",
  WARN: null,
  ERROR: "logERR",
  FATAL: "logERR",
  STDOUT: "logStdout",
  STDERR: "logStderr",
  SSHOUT: "logSSHout",
  SSHERR: "logSSHerr"
};

function socketIOAppender(layout, timezoneOffset, argEventName) {
  return (loggingEvent)=>{
    const eventName = argEventName || eventNameTable[loggingEvent.level.levelStr];
    const projectRootDir = loggingEvent.context.projectRootDir;

    if (eventName) {
      //emitAll is async function but we did not wait here
      emitAll(projectRootDir, eventName, layout(loggingEvent, timezoneOffset));
    }
  };
}

const socketIO = {
  configure: (config, layouts)=>{
    let layout = layouts.basicLayout;

    if (config.layout) {
      layout = layouts.layout(config.layout.type, config.layout);
    }
    return socketIOAppender(layout, config.timezoneOffset);
  }
};

const logSettings = {
  appenders: {
    console: {
      type: "console"
    },
    socketIO: {
      type: socketIO
    },
    multi: {
      type: "multiFile",
      property: "projectRootDir",
      base: "",
      extension: `/${path.basename(logFilename)}`,
      maxLogSize,
      backups: numLogFiles,
      compress: compressLogFile
    },
    filterdConsole: {
      type: "logLevelFilter",
      appender: "console",
      level: getLoglevel()
    },
    filterdFile: {
      type: "logLevelFilter",
      appender: "multi",
      level: getLoglevel()
    },
    log2client: {
      type: "logLevelFilter",
      appender: "socketIO",
      level: getLoglevel()
    }
  },
  categories: {
    default: {
      appenders: [
        "filterdConsole",
        "filterdFile",
        "log2client"
      ],
      level: "trace"
    }
  },
  levels: {
    stdout: {
      value: 20000,
      colour: "green"
    },
    stderr: {
      value: 20000,
      colour: "yellow"
    },
    sshout: {
      value: 20000,
      colour: "green"
    },
    ssherr: {
      value: 20000,
      colour: "yellow"
    }
  }
};
//configure with default setting
log4js.configure(logSettings);

async function setLoglevel(appender, loglevel) {
  if (!["filterdConsole", "filterdFile", "log2client"].includes(appender)) {
    return;
  }
  logSettings.appenders[appender].level = loglevel || getLoglevel();
  await promisify(log4js.shutdown)();
  log4js.configure(logSettings);
}

function reset() {
  log4js.configure(logSettings);
}


function getLogger(projectRootDir) {
  //please note projectRootDir context will remain after logging
  logger.addContext("projectRootDir", projectRootDir || path.dirname(logFilename));
  logger.shutdown = promisify(log4js.shutdown); //only use in test code
  //logger.reset = log4js.configure.bind(log4js, logSettings);
  return logger;
}

module.exports = {
  setLoglevel,
  getLogger,
  reset
};
