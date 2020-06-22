"use strict";
const { EventEmitter } = require("events");
const db = new Map();

class EmitArbitrator extends EventEmitter {
  constructor(socket, event) {
    super();
    this.buffer = [];
    this.callbacks = [];
    this.socket = socket;
    this.event = event;
    this.interval = 10000; //msec
    this.chunkSize = 100; //number of elements
    this.once("go", this.onGo);
  }

  async onGo() {
    if (this.buffer.length === 0) {
      this.once("go", this.onGo);
      return;
    }

    try {
      while (this.buffer.length > 0) {
        const tmp = this.buffer.splice(0, this.chunkSize);
        await this.promisedEmit(tmp);
      }
      for (const cb of this.callbacks) {
        cb();
      }
    } finally {
      setTimeout(()=>{
        this.once("go", this.onGo);
      }, this.interval);
    }
  }

  async promisedEmit(data) {
    return new Promise((resolve, reject)=>{
      this.socket.on("error", reject);
      this.socket.emit(this.event, data, (rt)=>{
        this.socket.removeListener("error", reject);
        resolve(rt);
      });
    });
  }

  send(payload, cb) {
    this.buffer.push(payload);

    if (typeof cb === "function") {
      this.callbacks.push(cb);
    }
    this.emit("go");
  }
}

function getKey(socket, event) {
  return `${socket.id}-${event}`;
}

function setOpt(prop, socket, event, value) {
  const target = db.get(getKey(socket, event));
  if (typeof target === "undefined") {
    return;
  }
  target[prop] = value;
}

function bufferdEmit(socket, event, payload, cb, interval, chunkSize) {
  const key = getKey(socket, event);
  if (!db.has(key)) {
    db.set(key, new EmitArbitrator(socket, event));
    socket.on("close", ()=>{
      db.delete(key);
    });
  }
  const arbitorator = db.get(key);
  if (typeof interval === "number" && interval > 0) {
    arbitorator.interval = interval;
  }
  if (typeof chunkSize === "number" && chunkSize > 0) {
    arbitorator.chunkSize = chunkSize;
  }
  arbitorator.send(payload, cb);
}
module.exports = {
  bufferdEmit,
  setInterval: setOpt.bind(null, "interval"),
  setChunkSize: setOpt.bind(null, "chunkSize")
};
