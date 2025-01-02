/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <!-- update event is not well tested. please check !! -->
  <my-treeview
    :items="items"
    :load-children="getChildren"
    activatable
    :get-node-icon="getNodeIcon"
    :get-leaf-icon="getLeafIcon"
    @update:active="onUpdateActive"
  />
</template>
<script>
import SIO from "../../lib/socketIOWrapper.js";
import myTreeview from "../../components/common/myTreeview.vue";
import { icons, openIcons, fileListModifier } from "../../components/common/fileTreeUtils.js";

function getActiveItem(items, key, path) {
  for (const item of items) {
    if (Array.isArray(item.children) && item.children.length > 0) {
      path.push(item.name);
      const rt = getActiveItem(item.children, key, path);
      if (rt) {
        return rt;
      }
      path.pop();
    }
    if (item.id === key) {
      if (item.type === "dir" || item.type === "dir-link") {
        path.push(item.name);
      }
      return item;
    }
  }
  return null;
}

export default {
  name: "FileBrowserLite",
  components: {
    myTreeview
  },
  props: {
    requestRoot: { type: String, default: undefined },
    mode: { type: String, default: "dirWithProjectJson" }
  },
  emits: ["update"],
  data: function () {
    return {
      root: null,
      items: []
    };
  },
  mounted() {
    SIO.emitGlobal("getFileList", null, { mode: this.mode, path: this.requestRoot }, (fileList)=>{
      this.root = this.requestRoot || fileList[0].path || "/";
      const pathSep = this.root[0] === "/" ? "/" : "\\";
      this.items.splice(0, this.items.length, ...fileList.map(fileListModifier.bind(null, pathSep)));
    });
  },
  methods: {
    onUpdateActive(active) {
      this.$emit("update", active.id);
    },
    getNodeIcon(isOpen, item) {
      return isOpen ? openIcons[item.type] : icons[item.type];
    },
    getLeafIcon(item) {
      return icons[item.type];
    },
    getChildren(item) {
      return new Promise((resolve, reject)=>{
        const path = [this.root];
        const pathSep = this.root[0] === "/" ? "/" : "\\";
        getActiveItem(this.items, item.id, path);
        const currentDir = path.join(pathSep);
        SIO.emitGlobal("getFileList", null, { mode: this.mode, path: currentDir }, (fileList)=>{
          if (!Array.isArray(fileList)) {
            reject(fileList);
          }
          item.children = fileList.map(fileListModifier.bind(null, pathSep));
          resolve();
        });
      });
    }
  }
};
</script>
