/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
// memo move functions in server/app/core/workflowComponent.js and client/src/component/componentProperty.vue to this file

/**
 * check if specified component should have remote file browser
 * @param {object} component - component object which to be checked
 * @returns {boolean} - true if component should have remote file browser
 */
function hasRemoteFileBrowser(component) {
  return ["storage", "hpciss"].includes(component.type)
    && typeof component.host === "string"
    && component.host !== "localhost";
}

/**
 * check if specified component should have gfarm tar browser
 * @param {object} component - component object which to be checked
 * @returns {boolean} - true if component should have gfarm tar browser
 */
function hasGfarmTarBrowser(component) {
  return component.type === "hpcisstar"
    && typeof component.host === "string"
    && component.host !== "localhost";
}

/**
 * check if specified componet is HPCI-SS or not
 * @param {object} component - component object which to be checked
 * @returns {boolean} - true if component is HPCI-SS
 */
function isHPCISS(component) {
  return component.type === "hpciss";
}

module.exports = {
  hasRemoteFileBrowser,
  hasGfarmTarBrowser,
  isHPCISS,
};
