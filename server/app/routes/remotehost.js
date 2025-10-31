/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (req, res)=>{
  const baseURL = process.env.WHEEL_BASE_URL || "/";
  res.cookie("socketIOPath", baseURL);
  res.sendFile(path.resolve(__dirname, "../public/remotehost.html"));
};
