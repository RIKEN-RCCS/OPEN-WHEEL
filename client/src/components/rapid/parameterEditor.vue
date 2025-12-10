/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <div>
    <v-toolbar
      density="compact"
      title="PS config"
      color="background"
    >
      {{ filename }}
    </v-toolbar>
    <target-files
      :target-files="parameterSetting.targetFiles"
      :read-only="readOnly"
      @open-new-tab="openNewTab"
      @add="(e)=>{parameterSetting.targetFiles.push(e)}"
      @del="(e)=>{removeFromArray(parameterSetting.targetFiles, e, 'targetName')}"
    />
    <div class="border-top">
      <parameter
        :params="parameterSetting.params"
        :read-only="readOnly"
        @new-param-added="newParamAdded"
        @open-filter-editor="$emit('openFilterEditor')"
      />
    </div>
    <div class="border-top">
      <gather-scatter
        :container="parameterSetting.scatter"
        :headers="[ { key: 'srcName', title: 'srcName', sortable: false },
                    { key: 'dstNodeName', title: 'dstNode', sortable: false },
                    { key: 'dstName', title: 'dstName', sortable: false },
                    { title: 'Actions', key: 'action', sortable: false }]"
        :label="'scatter'"
        :read-only="readOnly"
        data-cy="parameter_editor-scatter-gather_scatter"
        @add-new-item="onAddNewItem"
        @update-item="onUpdateItem"
        @delete-item="onDeleteItem"
      />
    </div>
    <div class="border-top">
      <gather-scatter
        :container="parameterSetting.gather"
        :headers="[ { key: 'srcNodeName', title: 'srcNode', sortable: false },
                    { key: 'srcName', title: 'srcName', sortable: false },
                    { key: 'dstName', title: 'dstName', sortable: false },
                    { title: 'Actions', key: 'action', sortable: false }]"
        :label="'gather'"
        :read-only="readOnly"
        data-cy="parameter_editor-gather-gather_scatter"
        @add-new-item="onAddNewItem"
        @update-item="onUpdateItem"
        @delete-item="onDeleteItem"
      />
    </div>
  </div>
</template>
<script>
"use strict";
import { mapState, mapGetters, mapActions } from "vuex";
import deepEqual from "deep-eql";
import SIO from "../..//lib/socketIOWrapper.js";
import targetFiles from "../../components/rapid/targetFiles.vue";
import gatherScatter from "../../components/rapid/gatherScatter.vue";
import parameter from "../../components/rapid/parameter.vue";
import Debug from "debug";
import { removeFromArray } from "../../lib/clientUtility.js";
const debug = Debug("wheel:workflow:textEditor:paramEditor");

export default {
  name: "ParameterEditor",
  components: {
    targetFiles,
    gatherScatter,
    parameter
  },
  props: {
    readOnly: {
      type: Boolean,
      required: true
    }
  },
  emits: ["openFilterEditor", "openNewTab", "insertBraces", "content-changed"],
  data: function () {
    return {
      parameterSetting: {
        version: 2,
        targetFiles: [],
        params: [],
        scatter: [],
        gather: []
      },
      initialParameterSetting: {
        version: 2,
        targetFiles: [],
        params: [],
        scatter: [],
        gather: []
      },
      filename: "parameterSetting.json",
      autoSaveTimer: null
    };
  },
  computed: {
    ...mapState(["selectedFile", "projectRootDir", "componentPath"]),
    ...mapGetters(["selectedComponentAbsPath"])
  },
  watch: {
    parameterSetting: {
      handler() {
        this.scheduleAutoSave();
        this.$emit("content-changed");
      },
      deep: true
    }
  },
  mounted() {
    SIO.onGlobal("parameterSettingFile", (file)=>{
      if (!file.isParameterSettingFile) {
        debug("ERROR: illegal parameter setting file data", file);
        return;
      }
      this.initialParameterSetting = JSON.parse(file.content);
      this.parameterSetting = JSON.parse(file.content);
      //convert raw string target file to object targetFile
      this.parameterSetting.targetFiles = this.parameterSetting.targetFiles.map((e)=>{
        if (typeof e === "string") {
          return { targetName: e };
        }
        return e;
      });
      this.filename = file.filename;
      this.dirname = file.dirname;
    });
  },
  methods: {
    removeFromArray,
    ...mapActions({
      showSnackbar: "showSnackbar"
    }),
    onAddNewItem(mode, newItem) {
      this.parameterSetting[mode].push(newItem);
      this.scheduleAutoSave();
    },
    onUpdateItem(mode, target, newItem) {
      target.srcName = newItem.srcName;
      target.dstName = newItem.dstName;
      if (newItem.dstNode) {
        target.dstNode = newItem.dstNode;
      }
      this.scheduleAutoSave();
    },
    onDeleteItem(mode, target) {
      this.parameterSetting[mode] = this.parameterSetting[mode].filter((e)=>{
        if (e.srcName !== target.srcName || e.dstName !== target.dstName) {
          return true;
        }
        if (e.dstNode && e.dstNode !== target.dstNode) {
          return true;
        }
        if (e.srcNode && e.srcNode !== target.srcNode) {
          return true;
        }
        return false;
      });
      this.scheduleAutoSave();
    },
    openNewTab(...args) {
      this.$emit("openNewTab", ...args);
    },
    newParamAdded(param) {
      this.parameterSetting.params.push(param);
      this.$emit("insertBraces");
    },
    hasChange() {
      return !deepEqual(this.initialParameterSetting, this.parameterSetting);
    },
    save() {
      if (deepEqual(this.initialParameterSetting, this.parameterSetting)) {
        debug("paramter setting is not changed!");
        return false;
      }
      const payload = JSON.stringify(this.parameterSetting);
      SIO.emitGlobal("saveFile", this.projectRootDir, this.filename, this.dirname || this.selectedComponentAbsPath,
        payload, (rt)=>{
          if (!rt) {
            debug("ERROR: parameter setting file save failed");
            this.showSnackbar(`parameter setting file save failed`);
            return;
          }
          this.showSnackbar({ message: `parameter setting file saved`, timeout: 2000 });
          this.initialParameterSetting = JSON.parse(payload);
          debug("new initial PS-setting=", this.initialParameterSetting);
        });
      return true;
    },
    scheduleAutoSave() {
      if (this.readOnly) {
        return;
      }
      if (this.autoSaveTimer) {
        clearTimeout(this.autoSaveTimer);
      }
      this.autoSaveTimer = setTimeout(()=>{
        this.autoSave();
      }, 2000); //2 seconds client-side debounce
    },
    autoSave() {
      if (deepEqual(this.initialParameterSetting, this.parameterSetting)) {
        return;
      }
      const payload = JSON.stringify(this.parameterSetting);
      SIO.emitGlobal("saveFile", this.projectRootDir, this.filename, this.dirname || this.selectedComponentAbsPath,
        payload, (rt)=>{
          if (!rt) {
            debug("ERROR: parameter setting auto-save failed");
            this.showSnackbar(`parameter setting auto-save failed`);
            return;
          }
          this.initialParameterSetting = JSON.parse(payload);
        });
    },
    async revertAll() {
      //Revert to initial parameter setting and save to server
      const reverted = JSON.parse(JSON.stringify(this.initialParameterSetting));
      
      // Update parameterSetting reactively
      Object.keys(this.parameterSetting).forEach(key => {
        delete this.parameterSetting[key];
      });
      Object.assign(this.parameterSetting, reverted);

      const payload = JSON.stringify(this.parameterSetting);

      return new Promise((resolve, reject)=>{
        SIO.emitGlobal("saveFile", this.projectRootDir, this.filename, this.dirname || this.selectedComponentAbsPath,
          payload, (rt)=>{
            if (!rt) {
              reject(new Error("Failed to save parameter setting"));
            } else {
              resolve();
            }
          });
      });
    }
  }
};
</script>
<style scoped>
.border-top {
  border-top: 1px solid rgba(255, 255, 255, 0.3);
}
</style>
