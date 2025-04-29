/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const fs = require("fs-extra");
const isSvg = require("is-svg");

const viewerSupportedTypes = ["apng", "avif", "gif", "jpg", "png", "webp", "tif", "bmp", "svg"];

/**
 * read file and determine its filetype
 * @param {string} filename - name of file to be checked
 * @returns {object} - name, extention and mime Content-type
 */
async function getFiletype(filename) {
  const FileType = await import("file-type");
  let rt;
  const buffer = await fs.readFile(filename);
  if (isSvg(buffer.toString())) {
    rt = {
      ext: "svg",
      mime: "image/svg+xml"
    };
  } else {
    try {
      rt = await FileType.fromBuffer(buffer);
    } catch (e) {
    //eslint-disable-next-line valid-typeof
      if (typeof (e) === "EndOfStreamError") {
        return rt;
      }
    }
  }
  if (rt) {
    rt.name = filename;
  }
  return rt;
}

module.exports = {
  viewerSupportedTypes,
  getFiletype
};
