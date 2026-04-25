"use strict";

const { start } = require("./mock_server/server.js");

const port = Number(process.env.MOCK_SIO_PORT) || 3101;

start(port).catch((err) => {
  console.error("[start-mock-sio] Failed to start:", err);
  process.exit(1);
});
