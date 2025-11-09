/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <div class="d-flex flex-column fill-height">
    <v-toolbar
      color="background"
      density="compact"
    >
      <v-breadcrumbs
        :items="pathToCurrentComponent"
      >
        <template #divider>
          <v-icon icon="mdi-forward" />
        </template>
        <template #title="{ item }">
          <v-breadcrumbs-item>
            <component-button
              :type="item.type"
              :nane="item.name"
            />
          </v-breadcrumbs-item>
        </template>
      </v-breadcrumbs>
      <v-spacer />
      <v-toolbar-items>
        <v-select
          v-model="mode"
          class="mt-n1"
          :items="modes"
        />
        <v-switch
          v-if="! readOnly"
          v-model="readOnlyEditor"
          class="mt-n1"
          label="read only"
          color="primary"
        />
        <v-btn
          v-if="! readOnly"
          :disabled="!hasChangesComputed || reverting"
          :loading="reverting"
          prepend-icon="mdi-restore"
          @click="confirmRevert"
        >
          Revert All
        </v-btn>
      </v-toolbar-items>
    </v-toolbar>
    <v-row
      no-gutters
      class="flex-grow-1 overflow-hidden"
    >
      <v-col class="fill-height border-top">
        <tab-editor
          ref="text"
          :read-only="readOnly"
          data-cy="rapid-tab-tab_editor"
          @jobscript="setIsJobScript"
          @content-changed="onContentChanged"
        />
      </v-col>
      <v-col
        v-show="mode === 'PS-config'"
        class="fill-height border-top border-left"
      >
        <parameter-editor
          ref="param"
          :read-only="readOnly"
          data-cy="rapid-parameter-parameter_editor"
          @open-new-tab="openNewTab"
          @insert-braces="insertBraces"
          @open-filter-editor="openFilterEditor"
          @content-changed="onContentChanged"
        />
      </v-col>
      <v-col
        v-show="mode === 'jobScriptEditor'"
        class="fill-height border-top border-left"
      >
        <job-script-editor
          ref="jse"
          :read-only="readOnly"
          :is-job-script="isJobScript"
          data-cy="rapid-script-script_editor"
          @insert="insertSnipet"
          @remove="removeSnipet"
        />
      </v-col>
    </v-row>
    <filter-editor
      v-model="filterDialog"
      data-cy="rapid-filter-filter_editor"
      :placeholders="placeholders"
      @update-placeholders="getAllPlaceholders"
    />
    <unsaved-files-dialog
      :unsaved-files="unsavedFiles"
      :dialog="showUnsavedFilesDialog"
      @closed="unsavedFilesDialogClosed"
    />
    <v-dialog
      v-model="revertDialog"
      max-width="500"
      persistent
    >
      <v-card>
        <v-card-title>Confirm Revert</v-card-title>
        <v-card-text>
          Are you sure you want to revert all changes? This will restore all files to their original state when you started editing and save them to the server.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            text="Cancel"
            :disabled="reverting"
            @click="revertDialog = false"
          />
          <v-btn
            text="Revert"
            color="error"
            :loading="reverting"
            @click="executeRevert"
          />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
"use strict";
import { mapState, mapActions } from "vuex";
import getNodeAndPath from "../lib/getNodeAndPath.js";
import unsavedFilesDialog from "../components/rapid/unsavedFilesDialog.vue";
import componentButton from "../components/common/componentButton.vue";
import filterEditor from "../components/rapid/filterEditor.vue";
import tabEditor from "../components/rapid/tabEditor.vue";
import parameterEditor from "../components/rapid/parameterEditor.vue";
import jobScriptEditor from "../components/rapid/jobScriptEditor.vue";
import SIO from "../lib/socketIOWrapper.js";

export default {
  name: "TextEditorManager",
  components: {
    componentButton,
    unsavedFilesDialog,
    filterEditor,
    tabEditor,
    parameterEditor,
    jobScriptEditor
  },
  data: ()=>{
    return {
      mode: "normal",
      isJobScript: false,
      showUnsavedFilesDialog: false,
      unsavedFiles: [],
      closeCallback: null,
      filterDialog: false,
      placeholders: [],
      readOnlyEditor: false,
      reverting: false,
      revertDialog: false,
      changeTracker: 0
    };
  },
  computed: {
    ...mapState(["projectRootDir",
      "selectedFile",
      "componentPath",
      "selectedComponent",
      "currentComponent",
      "componentTree",
      "readOnly"]),
    pathToCurrentComponent: function () {
      const rt = [];
      if (this.currentComponent !== null) {
        getNodeAndPath(this.currentComponent.ID, this.componentTree, rt);
      }
      return rt;
    },
    selectedComponentRelativePath() {
      if (this.selectedComponent === null) {
        return null;
      }
      const relativePath = this.componentPath[this.selectedComponent.ID];
      return relativePath.startsWith("./") ? relativePath.slice(2) : relativePath;
    },
    modes() {
      const rt = ["normal"];
      if (!this.disablePS) {
        rt.push("PS-config");
      }
      const disableJobScriptEditor = this.selectedComponent !== null ? this.selectedComponent.type !== "task" : false;
      if (!disableJobScriptEditor) {
        rt.push("jobScriptEditor");
      }
      return rt;
    },
    disablePS() {
      if (this.selectedComponent === null) {
        return true;
      }
      if (this.selectedComponent.type === "parameterStudy" || this.selectedComponent.type === "bulkjobTask") {
        return false;
      }
      return true;
    },
    hasChangesComputed() {
      //Trigger reactivity by accessing changeTracker
      this.changeTracker;
      return (this.$refs.text?.hasChange() || false) || (this.$refs.param?.hasChange() || false);
    }
  },
  mounted() {
    SIO.onGlobal("parameterSettingFile", (file)=>{
      if (file.isParameterSettingFile) {
        this.mode = "PS-config";
      }
    });
  },
  methods: {
    ...mapActions(["showDialog"]),
    onContentChanged() {
      this.changeTracker++;
    },
    setIsJobScript(v) {
      this.isJobScript = v;
    },
    openNewTab(...args) {
      this.$refs.text.openNewTab(...args);
    },
    insertBraces() {
      this.$refs.text.insertBraces();
    },
    insertSnipet(snipet) {
      this.$refs.text.insertSnipet(snipet);
    },
    removeSnipet() {
      this.$refs.text.removeSnipet();
    },
    hasChange() {
      return (this.$refs.text?.hasChange() || false) || (this.$refs.param?.hasChange() || false);
    },
    saveAllFiles() {
      this.$refs.text.saveAll();
      this.$refs.param.save();
    },
    checkUnsavedBeforeClose(callback) {
      if (!this.hasChange()) {
        callback();
        return;
      }
      const changedFilenames = [];
      if (this.$refs.param.hasChange()) {
        changedFilenames.push({ name: `${this.projectRootDir}${this.componentPath[this.selectedComponent.ID].slice(1)}/${this.$refs.param.filename}` });
      }
      if (this.$refs.text.hasChange()) {
        changedFilenames.push(...this.$refs.text.getChangedFiles());
      }
      this.unsavedFiles.splice(0, this.unsavedFiles.length, ...changedFilenames);
      this.showUnsavedFilesDialog = true;
      this.closeCallback = callback;
    },
    unsavedFilesDialogClosed(mode) {
      if (mode === "cancel") {
        this.unsavedFiles.splice(0);
        this.showUnsavedFilesDialog = false;
        this.closeCallback = null;
        return;
      }
      if (mode === "save") {
        this.saveAllFiles();
      }
      this.unsavedFiles.splice(0);
      this.showUnsavedFilesDialog = false;
      if (this.closeCallback) {
        this.closeCallback();
        this.closeCallback = null;
      }
    },
    getAllPlaceholders() {
      return this.$refs.text.getAllPlaceholders();
    },
    openFilterEditor() {
      const rt = this.$refs.text.getAllPlaceholders();
      this.placeholders.splice(0, this.placeholders.length, ...rt);
      this.$nextTick(()=>{
        this.filterDialog = true;
      });
    },
    confirmRevert() {
      this.revertDialog = true;
    },
    async executeRevert() {
      this.reverting = true;

      try {
        await Promise.all([
          this.$refs.text.revertAll(),
          this.$refs.param.revertAll()
        ]);
        //Trigger reactivity update after revert
        this.onContentChanged();
        this.showDialog({ message: "All files reverted and saved successfully", timeout: 3000 });
        this.revertDialog = false;
      } catch (error) {
        console.error("Revert failed:", error);
        this.showDialog({ message: `Revert failed: ${error.message}`, timeout: 5000 });
      } finally {
        this.reverting = false;
      }
    }
  }
};
</script>
<style>
.v-select__selections {
  width: 140px;
}
.v-select__selections input {
  width: 0;
}
</style>
<style scoped>
/* Make tab editor fill available height */
:deep(.v-col) #editor {
  height: 100% !important;
}
:deep(.v-col) > div {
  height: 100%;
  display: flex;
  flex-direction: column;
}
:deep(.v-tabs) {
  flex-shrink: 0;
}
:deep(#editor) {
  flex: 1 !important;
  height: auto !important;
}
.border-top {
  border-top: 1px solid rgba(255, 255, 255, 0.3);
}
.border-left {
  border-left: 1px solid rgba(255, 255, 255, 0.3);
}
</style>
