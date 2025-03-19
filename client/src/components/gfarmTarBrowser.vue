/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <div>
    <v-btn
      v-if="!connected"
      text="browse files on remotehost"
      @click="requestRemoteConnection"
    />
    <v-data-table
      v-if="connected"
      :items="items"
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
      connected: false,
      items: [],
      search: ""
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
      SIO.emitGlobal("requestRemoteConnection", this.projectRootDir, this.selectedComponent.ID, (isReady)=>{
        this.connected = isReady;
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
          });
      });
    }
  }
};
</script>
