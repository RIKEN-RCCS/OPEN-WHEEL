/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import { diff } from "just-diff";
import { diffApply } from "just-diff-apply";
import { getProjectJson, writeProjectJson } from "./projectJsonFileOperator.js";

const _internal = {
  diff,
  diffApply,
  getProjectJson,
  writeProjectJson
};

/**
 * replace webhook setting on project meta data
 * @param {string} projectRootDir - project's root path
 * @param {object} newWebhook - new webhook setting
 * @returns {object} - updated webhook setting
 */
export async function replaceWebhook(projectRootDir, newWebhook) {
  const projectJson = await _internal.getProjectJson(projectRootDir);
  const { webhook } = projectJson;
  if (typeof webhook === "undefined") {
    projectJson.webhook = newWebhook;
  } else {
    const patch = _internal.diff(webhook, newWebhook);
    _internal.diffApply(webhook, patch);
  }
  await _internal.writeProjectJson(projectRootDir, projectJson);
  return webhook;
}

export { _internal };
