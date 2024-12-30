/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path = require("node:path");
const fs = require("fs-extra");
const { getLogger } = require("../logSettings");
const { emitAll } = require("./commUtils.js");

/**
 * generalized version of onUploadFileSaved
 * this onUploadFileSaved will be replaced by this one some day
 * @param {object} event - event object from socket-io-fileupload
 *
 *
 * this handler is async function, so file move may not finished when client get "complete" event.
 * please listen "uploadDone" event instead
 */
async function onUploadFileSaved2(event) {
  if (!event.file.success) {
    getLogger().error("file upload failed", event.file.name);
    return;
  }
  const fileSizeMB = parseInt(event.file.size / 1024 / 1024, 10);
  const hasParentDir = typeof event.file.meta.parentDir === "string";

  const absFilename = hasParentDir ? path.resolve(event.file.meta.parentDir, event.file.meta.filename) : event.file.pathName;
  getLogger().info(`upload completed ${absFilename} [${fileSizeMB > 1 ? `${fileSizeMB} MB` : `${event.file.size} Byte`}]`);
  event.file.absFilename = absFilename;

  if (hasParentDir) {
    if (event.file.meta.overwrite) {
      await fs.remove(absFilename);
    }
    await fs.move(event.file.pathName, absFilename);
  }
  const uploadClient = event.file.meta.clientID;
  const { writeStream, ...rt } = event.file; //eslint-disable-line no-unused-vars
  await emitAll(uploadClient, "uploadDone", rt);
}

module.exports = {
  onUploadFileSaved2
};
