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
      @navIconClick="drawer=!drawer"
      data-cy="remotehost-remotehost-title"
    />
    <v-main>
      <v-toolbar
        color='background'
      >
        <v-btn
          @click.stop="openEditDialog()"
          text="new remote host setting"
          data-cy="remotehost-new_remote_host_setting-btn"
        />
      </v-toolbar>
      <v-data-table
        :items="hosts"
        :headers="headers"
        data-cy="remotehost-items-data_table"
      >
        <template #item.connectionTest="{ item, index }">
          <v-btn
            :disable="testing !== null && testing !== index"
            :color="item.testResult"
            :loading="item.loading"
            @click="testConnection(index)"
            :text=item.connectionStatus
            :prepend-icon=item.icon
            data-cy="remotehost-test-btn"
          />
        </template>
        <template #item.action="{ item}">
          <action-row
            :item="item"
            @delete="openRemoveConfirmDialog(item)"
            @edit="openEditDialog(item)"
          />
        </template>
      </v-data-table>
    <v-snackbar
      v-model="openSnackbar"
      multi-line
      :timeout=snackbarTimeout
      centered
      variant="outlined"
    >
      {{ snackbarMessage }}
      <template #actions>
        <v-btn
          class="justify-end"
          variant="outlined"
          @click="closeSnackbar"
          text="Close"
        />
      </template>
    </v-snackbar>
    <password-dialog
      v-model="pwDialog"
      :title="pwDialogTitle"
      @password="pwCallback"
      @cancel="pwCallback(null)"
    />
      <remove-confirm-dialog
        v-model="rmDialog"
        :title="removeConfirmMessage"
        @remove="removeRemotehost"
      />
      <add-new-host-dialog
        v-model="newHostDialog"
        max-width="80vw"
        :initial-value="currentSetting"
        :host-names="hostList"
        :available-job-schedulers="jobSchedulerNames"
        @newHost="addNewSetting"
        @cancel="currentSetting={}"
      />
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
import actionRow from "../components/common/actionRow.vue";
import navDrawer from "../components/common/NavigationDrawer.vue";
import removeConfirmDialog from "../components/common/removeConfirmDialog.vue";
import passwordDialog from "../components/common/passwordDialog.vue";
import addNewHostDialog from "../components/remotehost/addNewHostDialog.vue";
import applicationToolBar from "../components/common/applicationToolBar.vue";

export default {
  name: "Remotehost",
  components: {
    navDrawer,
    applicationToolBar,
    actionRow,
    passwordDialog,
    removeConfirmDialog,
    addNewHostDialog
  },
  data: ()=>{
    return {
      drawer: false,
      pwDialog: false,
      pwCallback: null,
      pwDialogTitle: "",
      rmDialog: false,
      newHostDialog: false,
      headers: [
        { title: "name", key: "name" },
        { title: "connection test", key: "connectionTest" },
        { title: "hostname", key: "host" },
        { title: "user", key: "user" },
        { title: "port", key: "port" },
        { title: "private key", key: "keyFile" },
        { title: "action", key: "action", sortable: false }
      ],
      hosts: [],
      jobSchedulerNames: [],
      removeConfirmMessage: "",
      currentSetting: {},
      testing: null
    };
  },
  computed: {
    ...mapState([
      "openSnackbar",
      "snackbarMessage",
      "snackbarTimeout"
    ]),
    hostList() {
      return this.hosts.map((host)=>{
        return host.name;
      }).filter((hostname)=>{
        return hostname !== this.currentSetting.name;
      });
    }
  },
  mounted() {
    const baseURL = readCookie("socketIOPath");
    debug(`beseURL=${baseURL}`);
    SIO.init(null, baseURL);
    SIO.emitGlobal("getJobSchedulerLabelList", (data)=>{
      this.jobSchedulerNames.splice(0, this.jobSchedulerNames.length, ...data);
    });
    SIO.emitGlobal("getHostList", (data)=>{
      data.forEach((e)=>{
        e.icon = "mdi-lan-pending";
        e.connectionStatus = "test";
        e.testResult = "background";
      });
      this.hosts.splice(0, this.hosts.length, ...data);
    });
    SIO.onGlobal("askPassword", (hostname, cb)=>{
      this.pwCallback = cb;
      this.pwDialogTitle = `input password or passphrase for ${hostname}`;
      this.pwDialog = true;
    });
    SIO.onGlobal("logERR", (message)=>{
      const rt = /^\[.*ERROR\].*- *(.*?)$/m.exec(message);
      const output = rt ? rt[1] || rt[0] : message;
      this.showSnackbar(output);
    });
  },
  methods: {
    ...mapActions({
      showSnackbar: "showSnackbar",
      closeSnackbar: "closeSnackbar"
    }),
    openEditDialog(item) {
      this.currentSetting = item || {};
      this.newHostDialog = true;
    },
    initializeConnectionTestIcon(item) {
      item.loading = false;
      delete (item.testResult);
      item.icon = "mdi-lan-pending";
      item.connectionStatus = "test";
      item.testResult = "background";
    },
    addNewSetting(updated) {
      this.currentSetting = {};
      delete (updated.icon);
      delete (updated.connectionStatus);
      delete (updated.testResult);
      delete (updated.loading);

      const eventName = updated.id ? "updateHost" : "addHost";
      const index = updated.id
        ? this.hosts.findIndex((e)=>{
          return updated.id === e.id;
        })
        : 0;
      const numDelete = updated.id ? 1 : 0;
      SIO.emitGlobal(eventName, updated, (id)=>{
        if (!id) {
          console.log(`${eventName} API failed`, id);
          return;
        }
        updated.id = id;
        this.initializeConnectionTestIcon(updated);
        this.hosts.splice(index, numDelete, updated);
      });
    },
    openRemoveConfirmDialog(item) {
      this.rmTarget = item;
      this.removeConfirmMessage = `Are you shure you want to remove ${item.name} ?`;
      this.rmDialog = true;
    },
    removeRemotehost() {
      SIO.emitGlobal("removeHost", this.rmTarget.id, (rt)=>{
        if (!rt) {
          console.log("removeHost API failed", this.rmTarget.id);
          return;
        }
        const index = this.hosts.findIndex((e)=>{
          return e.id === this.rmTarget.id;
        });
        if (index >= 0) {
          this.hosts.splice(index, 1);
        }
      });
    },
    testConnection(index) {
      if (this.testing === index) {
        debug(`ssh test for ${this.hosts[index].name} is already running`);
        return;
      }
      if (this.testing !== null) {
        this.showSnackbar({ message: "another ssh test is running", timeout: 1000 });
        return;
      }
      this.testing = index;
      const target = this.hosts[index];
      target.loading = true;
      SIO.emitGlobal("tryToConnect", this.hosts[index], (rt)=>{
        debug("connection test result:", rt);
        target.loading = false;

        if (rt === "canceled") {
          target.connectionStatus = "test";
          target.icon = "mdi-lan-pending";
          target.testResult = "background";
        } else if (rt === "success") {
          target.connectionStatus = "OK";
          target.icon = "mdi-lan-connect";
          target.testResult = "success";
        } else {
          target.connectionStatus = "failed";
          target.icon = "mdi-lan-disconnect";
          target.testResult = "error";

          if (rt.code === "HostKeyError") {
            if (rt.lineNumber && rt.host) {
              this.snackbarMessage = `remote host identification of ${rt.host} is different from the one on line ${rt.lineNumber} of ~/.ssh/known_hosts`;
            } else {
              this.snackbarMessage = "remote host identification is different from the one stored in ~/.ssh/known_hosts";
            }
            this.openSnackbar = true;
          }
        }

        this.pwDialog = false;
        this.testing = null;
      });
    }
  }
};
</script>
