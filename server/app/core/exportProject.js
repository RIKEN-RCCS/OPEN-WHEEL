/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import path from "path";
import fs from "fs-extra";
import * as tar from "tar";
import { createTempd } from "./tempd.js";
import { readJsonGreedy } from "./fileUtils.js";
import { projectJsonFilename } from "../db/db.js";
import { baseURL } from "./global.js";
import { gitAdd, gitClone, gitCommit, gitConfig, gitRemoveOrigin } from "./gitOperator2.js";
import { setComponentStateR } from "./componentState.js";

const { create } = tar;

/**
 * export existing project as archive file
 * @param {string} projectRootDir - project's root path
 * @param {string} name - user name
 * @param {string} mail - user's e-mail address
 * @param {string} memo - memo to exported archive
 * @returns {string} - download URL
 */
async function exportProject(projectRootDir, name = null, mail = null, memo = null) {
  const { dir } = await createTempd(projectRootDir, "exportProject");
  const workDir = await fs.mkdtemp(`${dir}/`);
  const tmpProjectRootDir = path.join(workDir, path.basename(projectRootDir));
  await fs.mkdir(tmpProjectRootDir);
  await gitClone(tmpProjectRootDir, 1, projectRootDir);
  await gitRemoveOrigin(tmpProjectRootDir);
  await setComponentStateR(tmpProjectRootDir, tmpProjectRootDir, "not-started");

  const filename = path.resolve(tmpProjectRootDir, projectJsonFilename);
  const projectJson = await readJsonGreedy(filename);
  if (!projectJson.exportInfo) {
    projectJson.exportInfo = {};
  }
  if (!projectJson.exportInfo.exporter) {
    projectJson.exportInfo.exporter = {};
  }
  projectJson.exportInfo.notChanged = true;

  if (typeof name === "string") {
    projectJson.exportInfo.exporter.name = name;
    await gitConfig(tmpProjectRootDir, "user.name", name, true);
  } else {
    await gitConfig(tmpProjectRootDir, "user.name", "WHEEL", true);
  }
  if (typeof mail === "string") {
    projectJson.exportInfo.exporter.mail = mail;
    await gitConfig(tmpProjectRootDir, "user.email", mail, true);
  } else {
    await gitConfig(tmpProjectRootDir, "user.email", "wheel@example.com", true);
  }
  if (typeof memo === "string") {
    projectJson.exportInfo.exporter.memo = memo;
  }

  projectJson.state = "not-started";

  const locale = Intl.DateTimeFormat().resolvedOptions().locale;
  const exportDate = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "long" }).format();
  projectJson.exportInfo.exportDate = exportDate;

  await fs.writeJson(filename, projectJson, { spaces: 4 });

  await gitAdd(tmpProjectRootDir, filename);
  await gitCommit(tmpProjectRootDir, "export project");

  const archiveFilename = path.join(dir, `WHEEL_project_${projectJson.name}.tgz`);
  await create({
    z: true,
    f: archiveFilename,
    C: path.dirname(tmpProjectRootDir)
  },
  [`${projectJson.name}.wheel`]
  );

  const url = `${baseURL}/${path.join(path.relative(path.dirname(dir), archiveFilename))}`;
  return url;
}

export { exportProject };
