/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import path from "path";
import { rootDir } from "../db/db.js";
import { baseURL } from "../core/global.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (req, res)=>{
  res.cookie("home", rootDir);
  res.cookie("pathSep", path.sep);
  res.cookie("socketIOPath", baseURL);

  res.sendFile(path.join(__dirname, "../public/home.html"));
};
