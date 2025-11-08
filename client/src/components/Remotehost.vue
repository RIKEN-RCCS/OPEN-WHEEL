/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-app>
    <nav-drawer
      v-model="drawer"
    />
    <application-tool-bar
      title="remotehost"
      density="comfortable"
      data-cy="remotehost-remotehost-title"
      @nav-icon-click="drawer=!drawer"
    />
    <v-main>
      <remotehost-manager
        :show-snackbar-func="showSnackbar"
      />
      <v-snackbar
        v-model="openSnackbar"
        multi-line
        :timeout="snackbarTimeout"
        centered
        variant="outlined"
      >
        {{ snackbarMessage }}
        <template #actions>
          <v-btn
            class="justify-end"
            variant="outlined"
            text="Close"
            @click="closeSnackbar"
          />
        </template>
      </v-snackbar>
    </v-main>
  </v-app>
</template>
<script>
"use strict";
import { mapState, mapActions } from "vuex";
import Debug from "debug";
const debug = Debug("wheel:remotehost");
import SIO from "../lib/socketIOWrapper.js";
import { readCookie } from "../lib/utility.js";
import navDrawer from "../components/common/NavigationDrawer.vue";
import applicationToolBar from "../components/common/applicationToolBar.vue";
import remotehostManager from "../components/remotehost/remotehostManager.vue";

export default {
  name: "Remotehost",
  components: {
    navDrawer,
    applicationToolBar,
    remotehostManager
  },
  data: ()=>{
    return {
      drawer: false
    };
  },
  computed: {
    ...mapState([
      "openSnackbar",
      "snackbarMessage",
      "snackbarTimeout"
    ])
  },
  beforeMount() {
    const baseURL = readCookie("socketIOPath");
    debug(`beseURL=${baseURL}`);
    SIO.init(null, baseURL);
  },
  methods: {
    ...mapActions({
      showSnackbar: "showSnackbar",
      closeSnackbar: "closeSnackbar"
    })
  }
};
</script>
