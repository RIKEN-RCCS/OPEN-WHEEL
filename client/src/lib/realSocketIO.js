/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
import { io } from "socket.io-client";
import SocketIOFileUpload from "socketio-file-upload/client.min.js";

// const SocketIOFileUpload = require("socketio-file-upload");

let initialized=false;
let socket = null;
let uploader = null;

const init = (auth, argBaseURL="/")=>{
  if(initialized){
    return;
  }
  const baseURL=(argBaseURL+"/socket.io/").replace(/\/\/+/g,"/");
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
  init();
  socket.on(event, callback);
};
const  emitGlobal= (event, ...args)=>{
  init();
  socket.emit(event, ...args);
};
const close= ()=>{
  if (socket) {
    socket.close();
    socket = null;
  }
};
const  listenOnDrop= (...args)=>{
  init();
  uploader.listenOnDrop(...args);
};
const  prompt= ()=>{
  init();
  uploader.prompt();
};
const  onUploaderEvent= (event, callback)=>{
  init();
  uploader.addEventListener(event, callback);
};
const removeUploaderEvent= (event, callback)=>{
  init();
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
