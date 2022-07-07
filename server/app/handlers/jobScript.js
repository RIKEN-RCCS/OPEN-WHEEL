/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const { jobScript } = require("../db/db");


async function onAddJobScriptTemplate(socket, template) {
  await jobScript.add(template);
  onGetJobScriptTemplates(socket);
}
async function onUpdateJobScriptTemplate(socket, template) {
  await jobScript.update(template);
  onGetJobScriptTemplates(socket);
}

async function onRemoveJobScriptTemplate(socket, ID) {
  await jobScript.remove(ID);
  onGetJobScriptTemplates(socket);
}
async function onGetJobScriptTemplates(socket) {
  socket.emit("jobScriptTemplateList", jobScript.getAll());
}

module.exports = {
  onAddJobScriptTemplate,
  onUpdateJobScriptTemplate,
  onRemoveJobScriptTemplate,
  onGetJobScriptTemplates
};
