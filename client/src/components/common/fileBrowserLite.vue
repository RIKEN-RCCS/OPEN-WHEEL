/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <!-- update event is not well tested. please check !! -->
  <v-treeview
    :items="items"
    :load-children="getChildren"
    activatable
    @update:active="onUpdateActive"
  >
    <template #prepend="{item, open}">
      <v-icon v-if="item.children !== null">
        {{ open ? openIcons[item.type] : icons[item.type] }}
      </v-icon>
      <v-icon v-else>
        {{ icons[item.type] }}
      </v-icon>
    </template>
  </v-treeview>
</template>
<script>
  import SIO from "@/lib/socketIOWrapper.js";

  function fileListModifier (pathsep, e) {
    const rt = {
      id: `${e.path}${pathsep}${e.name}`,
      path: e.path,
      name: e.name,
      type: `${e.type}${e.islink ? "-link" : ""}`,
    };
    if (["dir", "dir-link", "snd", "snd-link", "sndd", "sndd-link"].includes(e.type)) {
      rt.children = [];
    }
    return rt;
  }

  function getActiveItem (items, key, path) {
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
    props: {
      requestRoot: { type: String, default: undefined },
      mode: { type: String, default: "dirWithProjectJson" },
    },
    data: function () {
      return {
        root:null,
        pathSep:null,
        items: [],
        icons: {
          file: "mdi-file-outline",
          "file-link": "mdi-file-link-outline",
          dir: "mdi-folder",
          "dir-link": "mdi-link-box-outline",
          "deadlink-link": "mdi-file-link",
          sndd: "mdi-folder-multiple-outline",
          snd: "mdi-file-multiple-outline",
        },
        openIcons: {
          dir: "mdi-folder-open",
          sndd: "mdi-folder-multiple-outline",
          snd: "mdi-file-multiple-outline",
        },
      };
    },
    mounted () {
      SIO.emitGlobal("getFileList", null, { mode: this.mode, path: this.requestRoot}, (fileList)=>{
        this.root=this.requestRoot || fileList[0].path || "/";
        this.pathSep=this.root[0] === "/" ? "/" : "\\";
        this.items = fileList.map(fileListModifier.bind(null, this.pathSep));
      });
    },
    methods: {
      onUpdateActive (active) {
        this.$emit("update", active[0]);
      },
      getChildren (item) {
        return new Promise((resolve, reject)=>{
          const path = [this.root];
          getActiveItem(this.items, item.id, path);
          const currentDir = path.join(this.pathSep);
          SIO.emitGlobal("getFileList", null, { mode: this.mode, path: currentDir }, (fileList)=>{
            if (!Array.isArray(fileList)) {
              reject(fileList);
            }
            item.children = fileList.map(fileListModifier.bind(null, this.pathSep));
            resolve();
          });
        });
      },
    },
  };
</script>
