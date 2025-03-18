/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
// memo move functions in server/app/core/workflowComponent.js and client/src/component/componentProperty.vue to this file

/**
 *
 * @param component
 */
function hasRemoteFileBrowser(component) {
  return ["storage", "hpciss"].includes(component.type)
    && typeof component.host === "string"
    && component.host !== "localhost";
}

/**
 *
 * @param component
 */
function isHPCISS(component) {
  return component.type === "hpciss";
}

module.exports = {
  hasRemoteFileBrowser,
  isHPCISS,
};
