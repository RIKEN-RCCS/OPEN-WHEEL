/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-dialog
    v-model="openDialog"
    max-width="60vw"
    persistent
  >
    <v-card
      :title="title"
      :subtitle="message"
      class="w-100"
    >
      <v-card-actions>
        <v-btn-group>
          <v-btn
            :prepend-icon="mdi-check"
            :disabled="isReady"
            text="ok"
            data-cy="import_dialog-ok-btn"
            @click="openImportWarningDialog=true"
          />
          <v-btn
            :prepend-icon="mdi-close"
            text="cancel"
            data-cy="import_dialog-cancel-btn"
            @click="closeDialog"
          />
        </v-btn-group>
      </v-card-actions>
      <v-card-text>
        <v-tabs
          v-model="tab"
        >
          <v-tab value="file">
            upload project archive
          </v-tab>
          <v-tab value="url">
            import from git repository
          </v-tab>
        </v-tabs>
        <v-tabs-window v-model="tab">
          <v-tabs-window-item value="file">
            <v-file-input
              v-model="archiveFile"
              class="mt-4"
              clearable
              label="select or drop project archive file"
              variant="outlined"
              accept=".tgz"
              data-cy="import_dialog-upload_file-input"
            />
          </v-tabs-window-item>
          <v-tabs-window-item value="url">
            <v-text-field
              v-model="archiveURL"
              class="mt-4"
              label="project repository url"
              data-cy="import_dialog-url-text_field"
            />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card-text>
      <v-card-text>
        <file-browser
          :with-current-dir="true"
          data-cy="import_dialog-file_browser"
          @update="(a)=>{selectedInTree=a}"
        />
      </v-card-text>
    </v-card>
  </v-dialog>
  <import-warning-dialog
    v-model="openImportWarningDialog"
    @ok="importProject"
  />
  <host-map-dialog
    v-model="openHostMapDialog"
    :hosts="hosts"
    @ok="commitHostMap"
    @cancel="commitHostMap(null)"
  />
  <rewind-state-dialog
    v-model="openRewindDialog"
    :targets="rewindTargets"
    @ok="commitRewind(true)"
    @cancel="commitRewind(null)"
  />
</template>
<script>
import fileBrowser from "../components/common/fileBrowserLite.vue";
import importWarningDialog from "../components/importWarningDialog.vue";
import hostMapDialog from "../components/hostMapDialog.vue";
import rewindStateDialog from "../components/rewindStateDialog.vue";
import SIO from "../lib/socketIOWrapper.js";

async function waitOnUploadDoneEvent() {
  return new Promise((resolve, reject)=>{
    SIO.once("uploadDone", (event)=>{
      if (event.success) {
        resolve(event);
      } else {
        reject(event);
      }
    });
  });
}

export default {
  name: "ImportDialog",
  components: {
    importWarningDialog,
    fileBrowser,
    hostMapDialog,
    rewindStateDialog
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true
    }
  },
  emits: [
    "update:modelValue",
    "imported"
  ],
  data: function () {
    return {
      title: "import project",
      message: "",
      selectedInTree: null,
      archiveFile: null,
      archiveURL: null,
      tab: "file",
      openImportWarningDialog: false,
      hosts: [],
      openHostMapDialog: false,
      hostMapCB: null,
      openRewindDialog: false,
      rewindTargets: [],
      rewindStateCB: null
    };
  },
  computed: {
    isReady() {
      if (typeof this.selectedInTree !== "string") {
        return true;
      }
      if (this.tab === "url" && typeof this.archiveURL === "string") {
        return false;
      }
      if (this.tab === "file" && this.archiveFile instanceof File) {
        return false;
      }
      return true;
    },
    openDialog: {
      get() {
        return this.modelValue;
      },
      set(v) {
        this.$emit("update:modelValue", v);
      }
    }
  },
  methods: {
    async importProject() {
      this.openWarning;
      const parentDir = this.selectedInTree;
      const isURL = this.tab === "url";
      let filename;
      if (!isURL) {
        const startHandler = (event)=>{
          event.file.meta.filename = this.archiveFile.name;
          event.file.meta.clientID = SIO.getID();
          SIO.removeUploaderEvent("start", startHandler);
        };
        SIO.onUploaderEvent("start", startHandler);
        const promise = waitOnUploadDoneEvent();
        SIO.submitFile(this.archiveFile);
        const event = await promise;
        filename = event.absFilename;
      }

      const archiveFile = isURL ? this.archiveURL : filename;
      SIO.emitGlobal("importProject", archiveFile, parentDir, isURL, ()=>{
        this.$emit("imported");
        this.closeDialog();
      });
      SIO.onGlobal("askHostMap", (hosts, cb)=>{
        this.hosts.splice(0, this.hosts.length);
        this.hosts.push(...hosts);
        this.hostMapCB = cb;
        this.openHostMapDialog = true;
      });
      SIO.onGlobal("askRewindState", (targets, cb)=>{
        this.rewindTargets.splice(0, this.rewindTargets.length);
        this.rewindTargets.push(...targets);
        this.rewindStateCB = cb;
        this.openRewindDialog = true;
      });
    },
    commitHostMap(hostMap) {
      if (typeof this.hostMapCB !== "function") {
        console.log("hostMapCB is not set");
      } else {
        this.hostMapCB(hostMap);
      }
      this.hosts.splice(0, this.hosts.length);
      this.hostMapCB = null;
    },
    commitRewind(arg) {
      if (typeof this.rewindStateCB !== "function") {
        console.log("rewindStateCB is not set");
      } else {
        this.rewindStateCB(arg);
      }
      this.rewindTargets.splice(0, this.rewindTargets.length);
      this.rewindStateCB = null;
    },
    closeDialog() {
      this.archiveURL = null;
      this.archiveFile = null;
      this.selectedInTree = null;
      this.tab = "file";
      this.openDialog = false;
    }
  }
};
</script>
