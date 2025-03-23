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
        v-if="!connected"
        text="browse files on remotehost"
        size="x-large"
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
    <v-data-table
      v-if="connected && !loading"
      :items="items"
      :headers="headers"
      density="compact"
      :search="search"
    />
  </div>
</template>
<script>
import { mapState } from "vuex";
import SIO from "../lib/socketIOWrapper.js";

export default {
  name: "GfarmTarBrowser",
  data: function () {
    return {
      loading: false,
      connected: false,
      items: [],
      search: "",
      headers: [
        {
          title: "FILES IN ARCHIVE",
          value: "name",
          sortable: true
        }
      ]
    };
  },
  computed: {
    ...mapState(["selectedComponent", "projectRootDir"]),
    storagePath() {
      return this.selectedComponent.storagePath || "./";
    }
  },
  methods: {
    requestRemoteConnection() {
      this.loading = true;
      SIO.emitGlobal("requestRemoteConnection", this.projectRootDir, this.selectedComponent.ID, (isReady)=>{
        this.connected = isReady;
        if (!isReady) {
          this.loading = false;
        }
        SIO.emitGlobal(
          "listGfarmTarfile",
          this.projectRootDir,
          this.selectedComponent.host,
          this.storagePath,
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
