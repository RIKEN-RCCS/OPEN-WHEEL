/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <div>
    <v-container
      v-if="!connected || loading"
      class="d-flex justify-center align-center"
    >
      <v-btn
        v-if="!connected && !loading"
        text="browse files on remotehost"
        size="x-large"
        data-cy="gfarm_tar_browser-request_remote_connection-btn"
        @click="requestRemoteConnection"
      />
      <v-btn
        v-if="loading"
        size="x-large"
        :loading="loading"
        variant="text"
        class="ma-16"
      />
    </v-container>
    <div
      v-if="connected && !loading"
    >
      <v-toolbar>
        <v-avatar
          :image="img"
          rounded="0"
          size="48"
        />
        <v-toolbar-title text="files in tar archive" />
        <v-tooltip
          location="top"
          text="remove storage directory"
        >
          <template #activator="{ props }">
            <v-btn
              :rounded="false"
              variant="flat"
              color="red"
              icon="mdi-trash-can-outline"
              v-bind="props"
              data-cy="gfarm_tar_browser-remove_storage_directory-btn"
              @click="openDialog"
            />
          </template>
        </v-tooltip>
      </v-toolbar>
      <v-data-table
        :items="items"
        hide-default-header
        density="compact"
        data-cy="gfarm_tar_browser-file-table"
      />
    </div>
    <versatile-dialog
      v-model="dialog"
      :title="dialogTitle"
      max-width="40vw"
      :message="dialogMessage"
      @ok="submitAndCloseDialog"
      @cancel="closeDialog"
    />
  </div>
</template>
<script>
import { mapState } from "vuex";
import SIO from "../lib/socketIOWrapper.js";
import { getTitle } from "../components/common/fileTreeUtils.js";
import versatileDialog from "../components/versatileDialog.vue";
import loadComponentDefinition from "../lib/componentDefinision.js";
const componentDefinitionObj = loadComponentDefinition();

export default {
  name: "GfarmTarBrowser",
  components: {
    versatileDialog
  },
  data: function () {
    return {
      loading: false,
      connected: false,
      items: [],
      dialog: false,
      dialogMessage: null,
      dialogTitle: null
    };
  },
  computed: {
    ...mapState(["selectedComponent", "projectRootDir"]),
    img() {
      return componentDefinitionObj["hpcisstar"].img;
    }
  },
  methods: {
    openDialog() {
      this.dialogMessage = getTitle("removeStoragePath", this.selectedComponent.storagePath);
      this.dialogTitle = "remove hpciss tar archive";
      this.dialog = true;
    },
    closeDialog() {
      this.dialogMessage = null;
      this.dialogTitle = null;
      this.dialog = false;
    },
    submitAndCloseDialog() {
      this.loading = true;
      SIO.emitGlobal("removeGfarmFile", this.projectRootDir, this.selectedComponent.storagePath, this.selectedComponent.host, (rt)=>{
        this.loading = false;
        if (!rt) {
          console.log(rt);
          return;
        }
        this.items = [];
      });
      this.closeDialog();
    },
    requestRemoteConnection() {
      this.loading = true;
      SIO.emitGlobal("requestRemoteConnection", this.projectRootDir, this.selectedComponent.ID, (isReady)=>{
        this.connected = isReady;
        if (!isReady) {
          this.loading = false;
        }
        SIO.emitGlobal(
          "getRemoteGfarmTarFileList",
          this.projectRootDir,
          this.selectedComponent.host,
          this.selectedComponent.storagePath,
          (fileList)=>{
            if (fileList === null) {
              return;
            }
            this.items = fileList.map((e)=>{
              return { name: e };
            });
            this.loading = false;
          });
      });
    }
  }
};
</script>
