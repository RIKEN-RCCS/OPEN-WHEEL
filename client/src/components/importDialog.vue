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
            @click="openImportWarningDialog=true"
          />
          <v-btn
            :prepend-icon="mdi-close"
            text="cancel"
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
            import from repository
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
            />
          </v-tabs-window-item>
          <v-tabs-window-item value="url">
            <v-text-field
              v-model="archiveURL"
              class="mt-4"
              label="project repository url"
            />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card-text>
      <v-card-text>
        <file-browser
          :with-current-dir="true"
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
  <versatile-dialog
    v-model="openRewindDialog"
    max-eidth="60vw"
    title="change project/component status"
    message=""
    @ok="commitRewind"
    @cancel="commitRewind(null)"
  />
</template>
<script>
import fileBrowser from "../components/common/fileBrowserLite.vue";
import importWarningDialog from "../components/importWarningDialog.vue";
import hostMapDialog from "../components/hostMapDialog.vue";
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
    hostMapDialog
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
      hostMapCB: null
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
        this.hosts.push(...hosts);
        this.hostMapCB = cb;
        this.openHostMapDialog = true;
      });
    },
    commitHostMap(hostMap) {
      if (typeof this.hostMapCB !== "function") {
        console.log("hostMapCB is not set");
        return;
      }
      this.hostMapCB(hostMap);
    },
    closeDialog() {
      this.archiveURL = null;
      this.archiveFile = null;
      this.selectedInTree = null;
      this.tab = "file";
      this.openDialog = false;
      this.hosts = [];
      this.openHostMapDialog = false;
      this.hostMapCB = null;
    }
  }
};
</script>
