/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License.txt in the project root for the license information.
 */
"use strict";
const path = require("path");
const debugLib = require("debug");
const debug = debugLib("wheel:logger");
const { promisify } = require("util");
const log4js = require("log4js");
const { logFilename, numLogFiles, maxLogSize, compressLogFile } = require("./db/db");
log4js.addLayout("errorlog", ()=>{
  return function(logEvent) {
    const tmp = logEvent.data.reduce((a, p)=>{
      if (p instanceof Error) {
        return `${a}<br>${p.message}`;
      }

      if (typeof p === "string") {
        return `${a} ${p}`;
      }
      return a;
    }, "");
    return tmp;
  };
});

const eventNameTable = {
  DEBUG: "logDBG",
  INFO: "logINFO",
  WARN: "logWARN",
  ERROR: "logERR",
  STDOUT: "logStdout",
  STDERR: "logStderr",
  SSHOUT: "logSSHout",
  SSHERR: "logSSHerr"
};

function socketIOAppender(layout, timezoneOffset, ignoreLevel, argEventName) {
  return (loggingEvent)=>{
    if (loggingEvent.level.level < ignoreLevel) {
      return;
    }
    const eventName = argEventName || eventNameTable[loggingEvent.level.levelStr];
    const socket = loggingEvent.context.sio;

    if (eventName) {
      socket.emit(eventName, layout(loggingEvent, timezoneOffset));
    }
  };
}

const log2client = {
  configure: (config, layouts)=>{
    let layout = layouts.basicLayout;

    if (config.layout) {
      layout = layouts.layout(config.layout.type, config.layout);
    }
    return socketIOAppender(layout, config.timezoneOffset, 20000);
  }
};

const errorlog = {
  configure: (config, layouts)=>{
    let layout = layouts.messagePassThroughLayout;

    if (config.layout) {
      layout = layouts.layout(config.layout.type, config.layout);
    }
    const eventName = config.eventName || "showMessage";
    return socketIOAppender(layout, config.timezoneOffset, 40000, eventName);
  }
};


const defaultSettings = {
  appenders: {
    console: {
      type: "console"
    },
    filterdConsole: {
      type: "logLevelFilter",
      appender: "console",
      level: "debug"
    },
    file: {
      type: "file",
      filename: path.resolve(logFilename),
      maxLogSize,
      backups: numLogFiles,
      compress: compressLogFile
    },
    multi: {
      type: "multiFile",
      property: "logFilename",
      base: "",
      extension: "",
      maxLogSize,
      backups: numLogFiles,
      compress: compressLogFile
    },
    socketIO: {
      type: log2client
    },
    errorlog: {
      type: errorlog,
      layout: { type: "errorlog" }
    }
  },
  categories: {
    default: {
      appenders: [
        "filterdConsole",
        "file"
      ],
      level: "trace"
    },
    workflow: {
      appenders: [
        "filterdConsole",
        "multi",
        "socketIO",
        "errorlog"
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

let firstCall = true;
const logSettings = Object.assign({}, defaultSettings);


/**
 * setup log4js
 * @param {string} filename - general log file name
 * @param {number} size - max size of log file
 * @param {number} num - max back up files to keep
 * @param {boolean} compress - backup files to be compressed or not
 */
async function setup(filename, size, num, compress) {
  //this function will not affect project log filename to keep file
  logSettings.appenders.file.filename = filename;
  logSettings.appenders.file.maxLogSize = size;
  logSettings.appenders.multi.maxLogSize = size;
  logSettings.appenders.file.backups = num;
  logSettings.appenders.multi.backups = num;
  logSettings.appenders.file.compress = compress === true;
  logSettings.appenders.multi.compress = compress === true;

  if (!firstCall) {
    await promisify(log4js.shutdown);
    firstCall = true;
  }
}

//TODO 引数は無しor projectRootDir に変更
//projectRootDirが渡されたらaddcontextしてからloggerを返す
//なかったらremoveContextしておくこと
function getLogger(cat) {
  if (firstCall) {
    if (process.env.WHEEL_DISABLE_CONSOLE_LOG) {
      logSettings.categories.default.appenders = logSettings.categories.default.appenders.filter((e)=>{
        return e !== "filterdConsole";
      });
      logSettings.categories.workflow.appenders = logSettings.categories.workflow.appenders.filter((e)=>{
        return e !== "filterdConsole";
      });
    }
    debug("getLogger called. current setting is as follows\n", logSettings);
    log4js.configure(logSettings);
    firstCall = false;
  }
  const logger = log4js.getLogger(cat);
  if (process.env.WHEEL_DISABLE_LOG) {
    debug("logging is disabled because WHEEL_DISABLE_LOG is set to ", process.env.WHEEL_DISABLE_LOG);
    logger.level = "off";
  } else {
    debug("logging level is trace");
    logger.level = "trace";
  }
  return logger;
}

module.exports = {
  getLogger,
  setup
};
