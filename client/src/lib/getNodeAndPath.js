/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";

/**
 * serch component and its path from component tree
 * @param { string } targetID - target component's ID
 * @param { Object } root - search root component's ID
 * @param { Array } path - output argument for path
 * @return { Object } - target component
 */
const getNodeAndPath = (targetID, root, path)=>{
  if (typeof root === "undefined" || root === null || !Object.prototype.hasOwnProperty.call(root, "ID")) {
    return null;
  }
  if (root.ID === targetID || typeof targetID === "undefined" || targetID === null) {
    if (Array.isArray(path)) {
      path.unshift({
        name: root.name,
        type: root.type,
        parent: root.parent,
        ID: root.ID,
      });
    }
    return root;
  }
  if (!Array.isArray(root.children)) {
    return null;
  }
  for (const node of root.children) {
    const found = getNodeAndPath(targetID, node, path);

    if (found) {
      if (Array.isArray(path)) {
        path.unshift({
          name: root.name,
          type: root.type,
          parent: root.parent,
          ID: root.ID,
        });
      }
      return found;
    }
  }
  // implicitly return undefined if target node not found
};

export { getNodeAndPath as default };
