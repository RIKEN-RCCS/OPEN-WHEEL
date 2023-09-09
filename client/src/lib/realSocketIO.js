/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
import { io } from "socket.io-client";
import SocketIOFileUpload from "socketio-file-upload/client.min.js";
import Debug from "debug";
const debug = Debug("wheel:socketIO");

//const SocketIOFileUpload = require("socketio-file-upload");

let initialized=false;
let socket = null;
let uploader = null;

const init = (auth, argBaseURL="/")=>{
  if(initialized){
    debug("socketIO is already initialized");
    return;
  }
  const baseURL=(argBaseURL+"/socket.io/").replace(/\/\/+/g,"/");
  debug(`socketIO initialized with auth = ${auth}`);
  socket = auth ? io({path: baseURL, transports: ["websocket"], auth }) : io({path:baseURL, transports: ["websocket"] });
  uploader = new SocketIOFileUpload(socket);
  uploader.chunkSize = 1024 * 100;
  initialized=true;
};
const generalCallback = (rt)=>{
  if(rt instanceof Error){
    console.log(rt);
  }
};
const   onGlobal= (event, callback)=>{
  if(!initialized){
    debug(`on ${event} called but socketIO is not initialized`);
    return
  }
  socket.on(event, callback);
};
const  emitGlobal= (event, ...args)=>{
  if(!initialized){
    debug(`emit ${event} called but socketIO is not initialized`);
    return
  }
  socket.emit(event, ...args);
};
const close= ()=>{
  if (socket) {
    socket.close();
    socket = null;
  }
};
const  listenOnDrop= (...args)=>{
  if(!initialized){
    debug("uploader.listenOnDrop called but socketIO is not initialized");
    return
  }
  uploader.listenOnDrop(...args);
};
const  prompt= ()=>{
  if(!initialized){
    debug("uploader.prompt called but socketIO is not initialized");
    return
  }
  uploader.prompt();
};
const  onUploaderEvent= (event, callback)=>{
  if(!initialized){
    debug("uploader.addEventListener called but socketIO is not initialized");
    return
  }
  uploader.addEventListener(event, callback);
};
const removeUploaderEvent= (event, callback)=>{
  if(!initialized){
    debug("uploader.removeEventListener called but socketIO is not initialized");
    return
  }
  uploader.removeEventListener(event, callback);
};
const getID=()=>{
  return socket !== null ? socket.id : null;
};

export default {
  init,
  generalCallback,
  onGlobal,
  emitGlobal,
  close,
  listenOnDrop,
  prompt,
  onUploaderEvent,
  removeUploaderEvent,
  getID
};
