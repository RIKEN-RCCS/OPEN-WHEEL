/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import { removeFromArray } from "../../lib/clientUtility.js";

export const icons = {
  "file": "mdi-file-outline",
  "file-link": "mdi-file-link-outline",
  "dir": "mdi-folder",
  "dir-link": "mdi-link-box-outline",
  "deadlink-link": "mdi-file-link",
  "sndd": "mdi-folder-multiple-outline",
  "snd": "mdi-file-multiple-outline"
};
export const openIcons = {
  dir: "mdi-folder-open",
  sndd: "mdi-folder-multiple-outline",
  snd: "mdi-file-multiple-outline"
};
export function fileListModifier(pathsep, e) {
  const rt = {
    id: `${e.path}${pathsep}${e.name}`,
    path: e.path,
    name: e.name,
    type: `${e.type}${e.islink ? "-link" : ""}`
  };
  if (["dir", "dir-link", "snd", "snd-link", "sndd", "sndd-link"].includes(e.type)) {
    rt.children = [];
  }
  return rt;
}
export function removeItem(items, key) {
  for (const item of items) {
    if (item.id === key) {
      removeFromArray(items, { id: key }, "id");
      return true;
    }
    if (Array.isArray(item.children) && item.children.length > 0) {
      const found = removeItem(item.children, key);
      if (found) {
        return true;
      }
    }
  }
}
export function getTitle(event, itemName) {
  const titles = {
    createNewDir: "Create new directory",
    createNewFile: "Create new File",
    remove: `Are you sure you want to delete ${itemName} ?`,
    rename: `Rename ${itemName}`,
    share: `Copy file path ${itemName}`,
    removeStoragePath: `Are you sure you want to remove ${itemName} and ALL CONTENTS under it?`
  };
  return titles[event];
}
export function getLabel(event) {
  const labels = {
    createNewDir: "new directory name",
    createNewFile: "new file name",
    rename: "new name",
    share: "file path"
  };
  return labels[event];
}
export function _getActiveItem(items, key) {
  for (const item of items) {
    if (Array.isArray(item.children) && item.children.length > 0) {
      const rt = _getActiveItem(item.children, key);
      if (rt) {
        return rt;
      }
    }
    if (item.id === key) {
      return item;
    }
  }
  return null;
}
