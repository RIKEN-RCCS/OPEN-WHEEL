/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const { jobScriptTemplate } = require("../db/db");
async function onAddJobScriptTemplate(socket, template) {
  await jobScriptTemplate.add(template);
  onGetJobScriptTemplates(socket);
}
async function onUpdateJobScriptTemplate(socket, template) {
  await jobScriptTemplate.update(template);
  onGetJobScriptTemplates(socket);
}
async function onRemoveJobScriptTemplate(socket, ID) {
  await jobScriptTemplate.remove(ID);
  onGetJobScriptTemplates(socket);
}
async function onGetJobScriptTemplates(socket) {
  socket.emit("jobScriptTemplateList", jobScriptTemplate.getAll());
}

module.exports = {
  onAddJobScriptTemplate,
  onUpdateJobScriptTemplate,
  onRemoveJobScriptTemplate,
  onGetJobScriptTemplates
};
