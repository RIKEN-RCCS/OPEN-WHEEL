/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import path from "path";
import fs from "fs-extra";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function get(req, res) {
  //accept GET method only for reload case
  if (!req.cookies || !req.cookies.rootDir || !req.cookies.dir) {
    return;
  }
  res.sendFile(path.resolve(__dirname, "../public/viewer.html"));
}
export async function post(req, res) {
  const projectRootDir = req.body.rootDir;
  const dir = req.body.dir;
  if (!await fs.pathExists(dir)) {
    return;
  }
  const baseURL = process.env.WHEEL_BASE_URL || "/";
  res.cookie("socketIOPath", baseURL);
  res.cookie("dir", dir);
  res.cookie("rootDir", projectRootDir);
  res.sendFile(path.resolve(__dirname, "../public/viewer.html"));
}
