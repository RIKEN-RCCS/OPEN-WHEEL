/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import path from "path";
import { projectJsonFilename } from "../db/db.js";
import { readProject } from "../core/projectFilesOperator.js";
import { readComponentJson } from "../core/componentJsonIO.js";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function get(req, res) {
  //accept GET method only for reload case
  if (!req.cookies || !req.cookies.rootDir) {
    return;
  }
  const baseURL = process.env.WHEEL_BASE_URL || "/";
  res.cookie("socketIOPath", baseURL);
  res.sendFile(path.resolve(__dirname, "../public/workflow.html"));
}
export async function post(req, res) {
  const projectRootDir = req.body.project;
  const newProjectRootDir = await readProject(projectRootDir);
  if (!newProjectRootDir) {
    return;
  }
  const { ID } = await readComponentJson(newProjectRootDir);
  res.cookie("root", ID);
  res.cookie("rootDir", newProjectRootDir);
  res.cookie("project", path.resolve(newProjectRootDir, projectJsonFilename));
  const baseURL = process.env.WHEEL_BASE_URL || "/";
  res.cookie("socketIOPath", baseURL);
  res.sendFile(path.resolve(__dirname, "../public/workflow.html"));
}