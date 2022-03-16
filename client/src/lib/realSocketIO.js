"use strict";
import { io } from "socket.io-client";
const SocketIOFileUpload = require("socketio-file-upload");

let initialized=false;
let socket = null;
let uploader = null;

export default {
  init(auth){
    socket = auth ? io("/", { transposrts: ["websocket"], auth }) : io("/", { transposrts: ["websocket"] });
    uploader = new SocketIOFileUpload(socket);
    uploader.chunkSize = 1024 * 100;
    initialized=true;
  },
  generalCallback: (rt)=>{
    if(rt instanceof Error){
      console.log(rt);
    }
  },
  onGlobal: (event, callback)=>{
    if (! initialized) {
      init();
    }
    socket.on(event, callback);
  },
  emitGlobal: (event, ...args)=>{
    if (! initialized) {
      init();
    }
    socket.emit(event, ...args);
  },
  close: ()=>{
    if (! initialized) {
      return;
    }
    socket.close();
    socket = null;
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
