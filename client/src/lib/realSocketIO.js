"use strict";
import { io } from "socket.io-client";
const SocketIOFileUpload = require("socketio-file-upload");

let initialized=false;
let socket = null;

let initializedGlobal=false;
let socketGlobal = null;
let uploader = null;
function init () {
  socket = io("/workflow", { transposrts: ["websocket"] });
  initialized=true;
}

export default {
  initGlobal(auth){
    socketGlobal = auth ? io("/", { transposrts: ["websocket"], auth }) : io("/", { transposrts: ["websocket"] });
    uploader = new SocketIOFileUpload(socketGlobal);
    uploader.chunkSize = 1024 * 100;
    initializedGlobal=true;
  },
  generalCallback: (rt)=>{
    if(rt instanceof Error){
      console.log(rt);
    }
  },
  onGlobal: (event, callback)=>{
    if (! initializedGlobal) {
      init();
    }
    socketGlobal.on(event, callback);
  },
  emitGlobal: (event, ...args)=>{
    if (! initializedGlobal) {
      init();
    }
    socketGlobal.emit(event, ...args);
  },
  close: ()=>{
    if (! initialized) {
      return;
    }
    socket.close();
    socket = null;
  },
  on: (event, callback)=>{
    if (! initialized) {
      init();
    }
    socket.on(event, callback);
  },
  once: (event, callback)=>{
    if (! initialized) {
      init();
    }
    socket.once(event, callback);
  },
  off: (event, callback)=>{
    if (! initialized) {
      init();
    }
    socket.off(event, callback);
  },
  emit: (event, ...args)=>{
    if (! initialized) {
      init();
    }
    socket.emit(event, ...args);
  },
  listenOnDrop: (...args)=>{
    if (! initialized) {
      init();
    }
    uploader.listenOnDrop(...args);
  },
  prompt: ()=>{
    if (! initialized) {
      init();
    }
    uploader.prompt();
  },
  onUploaderEvent: (event, callback)=>{
    if (! initialized) {
      init();
    }
    uploader.addEventListener(event, callback);
  },
  removeUploaderEvent: (event, callback)=>{
    if (! initialized) {
      return;
    }
    uploader.removeEventListener(event, callback);
  },
};
