/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
import { projectJson, componentTree, wf, taskStatelist, parameterSettingFile, file, hostList } from "./dummyData.json";
import Debug from "debug";
const debug = Debug("wheel:socket-io-dummy");

debug("dummy SIO imported!!");
let numInitialized = 0;

const logCallbacks = {};

export default {
  init: ()=>{
    debug("init called", ++numInitialized);
  },
  close: ()=>{
    debug("close called");
  },
  on: (event, callback)=>{
    debug(" add event listener to ", event);

    if (event === "projectJson") {
      callback(projectJson);
    } else if (event === "workflow") {
      callback(wf);
    } else if (event === "taskStateList") {
      callback(taskStatelist);
    } else if (event === "parameterSettingFile") {
      callback(parameterSettingFile);
    } else if (event === "file") {
      callback(file);
    } else if (event === "hostList") {
      callback(hostList);
    } else if (event.startsWith("log")) {
      logCallbacks[event] = callback;
    }
  },
  once: (event, callback)=>{
    // ダイアログまわりで使ってたかもしれないので用意してるけど
    // 使わない可能性大
    debug("add one-time event listener to ", event);
  },
  off: (event, callback)=>{
    debug("remove event listener from ", event);
  },
  emit: (event, ...args)=>{
    debug("emit", event, "with", args);

    if (event === "getComponentTree") {
      args[args.length - 1](componentTree);
    } else if (event.startsWith("log")) {
      logCallbacks[event](...args);
    }
  },
};
