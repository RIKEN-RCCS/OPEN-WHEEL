"use strict";
import { io } from "socket.io-client";
const SocketIOFileUpload = require("socketio-file-upload");

let initialized=false;
let socket = null;
let uploader = null;

const init = (auth)=>{
  socket = auth ? io("/", { transposrts: ["websocket"], auth }) : io("/", { transposrts: ["websocket"] });
  uploader = new SocketIOFileUpload(socket);
  uploader.chunkSize = 1024 * 100;
  initialized=true;
};
const generalCallback = (rt)=>{
  if(rt instanceof Error){
    console.log(rt);
  }
};
const initIfNeeded = (auth)=>{
  if (! initialized) {
    init(auth);
  }
};
const   onGlobal= (event, callback)=>{
  initIfNeeded();
  socket.on(event, callback);
};
const  emitGlobal= (event, ...args)=>{
  initIfNeeded();
  socket.emit(event, ...args);
};
const   close= ()=>{
  if (socket) {
    socket.close();
    socket = null;
  }
};
const  listenOnDrop= (...args)=>{
  initIfNeeded();
  uploader.listenOnDrop(...args);
};
const  prompt= ()=>{
  initIfNeeded();
  uploader.prompt();
};
const  onUploaderEvent= (event, callback)=>{
  initIfNeeded();
  uploader.addEventListener(event, callback);
};
const removeUploaderEvent= (event, callback)=>{
  initIfNeeded();
  uploader.removeEventListener(event, callback);
};

export default {
  init,
  generalCallback,
  initIfNeeded,
  onGlobal,
  emitGlobal,
  close,
  listenOnDrop,
  prompt,
  onUploaderEvent,
  removeUploaderEvent
};
