/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See Licensethe project root for the license information.
 */
import path from "path";
import { promisify } from "util";
import log4js from "log4js";
const logger = log4js.getLogger();
import { logFilename, numLogFiles, maxLogSize, compressLogFile, logLevel } from "./db/db.js";
import { emitAll } from "./handlers/commUtils.js";

export const _internal = {
  emitAll
};

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
      const message = layout(loggingEvent, timezoneOffset);
      _internal.emitAll(projectRootDir, "WHEEL_LOG", message);
      //the structured "WHEEL_LOG" stream above feeds the log screen. the client also
      //raises a toast for "logERR" events (onLogErr in Home.vue/Viewer.vue/Workflow.vue),
      //but that per-level channel stopped being emitted once the socketIO appender was
      //unified onto "WHEEL_LOG". re-emit FATAL only (as plain text) so a run-aborting
      //error still pops a toast, without flooding it with every ERROR-level line.
      if (loggingEvent.level.levelStr === "FATAL") {
        _internal.emitAll(projectRootDir, "logERR", formatToastMessage(loggingEvent));
      }
    }
  };
}

const getCircularReplacer = ()=>{
  const seen = new WeakSet();
  return (key, value)=>{
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return; //undefined, property is removed
      }
      seen.add(value);
    }
    return value;
  };
};

//log4js only concatenates message parts with String() coercion (used by our own multiFile line
//builder and by socketIO's json layout below), so a bare Error/Map/Set/plain object would render
//as the useless literal "[object Object]". Serialize non-primitive values ourselves before that
//happens so the actual content shows up in logs.
function formatLogArg(value) {
  if (value instanceof Error) {
    return value.stack || `${value.name}: ${value.message}`;
  }
  if (value instanceof Map) {
    return JSON.stringify(Object.fromEntries(value), getCircularReplacer());
  }
  if (value instanceof Set) {
    return JSON.stringify(Array.from(value), getCircularReplacer());
  }
  if (value !== null && typeof value === "object") {
    try {
      return JSON.stringify(value, getCircularReplacer());
    } catch {
      return String(value);
    }
  }
  return value;
}

//build a short one-line string from a logging event's data parts for a client-side
//toast. unlike formatLogArg(), an Error is reduced to its message (no stack trace)
//since the toast has no room for it - the full entry is still in the log screen/file.
function formatToastMessage(loggingEvent) {
  const data = Array.isArray(loggingEvent.data) ? loggingEvent.data : [loggingEvent.data];
  return data
    .map((value)=>{
      return value instanceof Error ? value.message : formatLogArg(value);
    })
    .join(" ");
}

const socketIO = {
  configure: (config, layouts)=>{
    let layout = layouts.basicLayout;
    if (config.layout) {
      if (config.layout.type === "json") {
        const separator = config.layout.separator || ",";
        layout = (logEvent)=>{
          const data = Array.isArray(logEvent.data) ? logEvent.data.map(formatLogArg) : logEvent.data;
          return JSON.stringify({ ...logEvent, data }, getCircularReplacer()) + separator;
        };
      } else {
        layout = layouts.layout(config.layout.type, config.layout);
      }
    }
    return socketIOAppender(layout, config.timezoneOffset);
  }
};

export const logSettings = {
  appenders: {
    console: {
      type: "console"
    },
    socketIO: {
      type: socketIO,
      layout: { type: "json", separator: "," }
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
      level: logLevel
    },
    filterdFile: {
      type: "logLevelFilter",
      appender: "multi",
      level: logLevel
    },
    log2client: {
      type: "logLevelFilter",
      appender: "socketIO",
      level: logLevel
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

export function getLogger(projectRootDir) {
  const contextProjectRootDir = typeof projectRootDir === "string" ? projectRootDir : path.dirname(logFilename);
  if (logger.context.projectRootDir === contextProjectRootDir) {
    return logger;
  }

  //please note projectRootDir context will remain after logging
  logger.addContext("projectRootDir", contextProjectRootDir);
  logger.shutdown = promisify(log4js.shutdown);
  return logger;
}

export function configure(setting) {
  log4js.configure(setting);
}
function logWithComponentDir(level, projectRootDir, componentDir, ...messages) {
  const logger = getLogger(projectRootDir);
  if (logger[level]) {
    const message = messages.map(formatLogArg).join(" ");
    let displayPath;

    if (componentDir === projectRootDir) {
      displayPath = "project root";
    } else if (componentDir.startsWith(projectRootDir)) {
      //Convert absolute path to relative path
      displayPath = path.relative(projectRootDir, componentDir);
    } else {
      //Keep as-is if not under projectRootDir
      displayPath = componentDir;
    }

    logger[level](`[${displayPath}] ${message}`);
  }
}

export function logTrace(projectRootDir, componentDir, ...messages) {
  logWithComponentDir("trace", projectRootDir, componentDir, ...messages);
}
export function logDebug(projectRootDir, componentDir, ...messages) {
  logWithComponentDir("debug", projectRootDir, componentDir, ...messages);
}
export function logInfo(projectRootDir, componentDir, ...messages) {
  logWithComponentDir("info", projectRootDir, componentDir, ...messages);
}
export function logWarn(projectRootDir, componentDir, ...messages) {
  logWithComponentDir("warn", projectRootDir, componentDir, ...messages);
}
export function logError(projectRootDir, componentDir, ...messages) {
  logWithComponentDir("error", projectRootDir, componentDir, ...messages);
}
export function logFatal(projectRootDir, componentDir, ...messages) {
  logWithComponentDir("fatal", projectRootDir, componentDir, ...messages);
}
export function logStdout(projectRootDir, componentDir, ...messages) {
  logWithComponentDir("stdout", projectRootDir, componentDir, ...messages);
}
export function logStderr(projectRootDir, componentDir, ...messages) {
  logWithComponentDir("stderr", projectRootDir, componentDir, ...messages);
}
export function logSSHout(projectRootDir, componentDir, ...messages) {
  logWithComponentDir("sshout", projectRootDir, componentDir, ...messages);
}
export function logSSHerr(projectRootDir, componentDir, ...messages) {
  logWithComponentDir("ssherr", projectRootDir, componentDir, ...messages);
}
export const loggerWrapper = {
  logTrace,
  logDebug,
  logInfo,
  logWarn,
  logError,
  logFatal,
  logStdout,
  logStderr,
  logSSHout,
  logSSHerr
};
