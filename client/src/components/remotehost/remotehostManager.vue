/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <div>
    <v-toolbar
      color="background"
    >
      <v-btn
        text="new remote host setting"
        data-cy="remotehost-new_remote_host_setting-btn"
        @click.stop="openEditDialog()"
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
          :text="item.connectionStatus"
          :prepend-icon="item.icon"
          data-cy="remotehost-test-btn"
          @click="testConnection(index)"
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
    <password-dialog
      v-model="pwDialog"
      :hostname="pwHostname"
      :mode="pwMode"
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
      @new-host="addNewSetting"
      @cancel="currentSetting={}"
    />
  </div>
</template>
<script>
"use strict";
import Debug from "debug";
const debug = Debug("wheel:remotehost:manager");
import SIO from "../../lib/socketIOWrapper.js";
import actionRow from "../../components/common/actionRow.vue";
import removeConfirmDialog from "../../components/common/removeConfirmDialog.vue";
import passwordDialog from "../../components/common/passwordDialog.vue";
import addNewHostDialog from "../../components/remotehost/addNewHostDialog.vue";

export default {
  name: "RemotehostManager",
  components: {
    actionRow,
    passwordDialog,
    removeConfirmDialog,
    addNewHostDialog
  },
  props: {
    showSnackbarFunc: {
      type: Function,
      default: null
    }
  },
  data: ()=>{
    return {
      pwDialog: false,
      pwCallback: null,
      pwHostname: null,
      pwMode: null,
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
    hostList() {
      return this.hosts.map((host)=>{
        return host.name;
      }).filter((hostname)=>{
        return hostname !== this.currentSetting.name;
      });
    }
  },
  mounted() {
    this.setupSocketHandlers();
    this.fetchData();
  },
  beforeUnmount() {
    SIO.off("askPassword", this.onAskPassword);
    SIO.off("logERR", this.onLogErr);
  },
  methods: {
    fetchData() {
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
    },
    setupSocketHandlers() {
      SIO.onGlobal("askPassword", this.onAskPassword);
      SIO.onGlobal("logERR", this.onLogErr);
    },

    /**
     * Handle askPassword event from server.
     * @param {string} hostname - Remote host name
     * @param {string} mode - Authentication mode
     * @param {string} jwtServerURL - JWT server URL
     * @param {Function} cb - Callback to invoke with entered password
     */
    onAskPassword(hostname, mode, jwtServerURL, cb) {
      this.pwCallback = (pw)=>{
        cb(pw);
      };
      this.pwMode = mode;
      this.pwHostname = hostname;
      this.pwDialog = true;
    },

    /**
     * Handle error log message from server.
     * @param {string} message - Error message string
     */
    onLogErr(message) {
      const rt = /^\[.*ERROR\].*- *(.*?)$/m.exec(message);
      const output = rt ? rt[1] || rt[0] : message;
      if (this.showSnackbarFunc) {
        this.showSnackbarFunc(output);
      }
    },
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
        if (this.showSnackbarFunc) {
          this.showSnackbarFunc({ message: "another ssh test is running", timeout: 1000 });
        }
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
            let errorMessage;
            if (rt.lineNumber && rt.host) {
              errorMessage = `remote host identification of ${rt.host} is different from the one on line ${rt.lineNumber} of ~/.ssh/known_hosts`;
            } else {
              errorMessage = "remote host identification is different from the one stored in ~/.ssh/known_hosts";
            }
            if (this.showSnackbarFunc) {
              this.showSnackbarFunc(errorMessage);
            }
          }
        }

        this.pwDialog = false;
        this.testing = null;
      });
    }
  }
};
</script>
