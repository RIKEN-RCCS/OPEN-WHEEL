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
    />
    <v-main>
      <v-toolbar
        color='background'
      >
        <v-btn
          @click.stop="openEditDialog()"
          text="new remote host setting"
        />
        <v-btn
          @click.stop="openEditDialog({type:'aws'})"
          text="new cloud setting"
        />
      </v-toolbar>
      <v-data-table
        :items="hosts"
        :headers="headers"
      >
        <template #item.connectionTest="{ item, index }">
          <v-btn
            :color="item.raw.testResult"
            :loading="item.raw.loading"
            @click="testConnection(index)"
            :text=item.raw.connectionStatus
            :prepend-icon=item.raw.icon
          />
        </template>
        <template #item.action="{ item}">
          <action-row
            :item="item.raw"
            @delete="openRemoveConfirmDialog(item.raw)"
            @edit="openEditDialog(item.raw)"
          />
        </template>
      </v-data-table>
    <password-dialog
      v-model="pwDialog"
      :title="pwDialogTitle"
      @password="pwCallback"
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
      <add-new-cloud-dialog
        v-model="newCloudDialog"
        max-width="80vw"
        :initial-value="currentSetting"
        :host-names="hostList"
        @newHost="addNewSetting"
        @cancel="currentSetting={}"
      />
    </v-main>
  </v-app>
</template>
<script>
  "use strict";
  import Debug from "debug";
  const debug = Debug("wheel:remotehost");
  import SIO from "@/lib/socketIOWrapper.js";
  import { readCookie } from "@/lib/utility.js";
  import actionRow from "@/components/common/actionRow.vue";
  import navDrawer from "@/components/common/NavigationDrawer.vue";
  import removeConfirmDialog from "@/components/common/removeConfirmDialog.vue";
  import passwordDialog from "@/components/common/passwordDialog.vue";
  import addNewHostDialog from "@/components/remotehost/addNewHostDialog.vue";
  import addNewCloudDialog from "@/components/remotehost/addNewCloudDialog.vue";
  import applicationToolBar from "@/components/common/applicationToolBar.vue";

  export default {
    name: "Remotehost",
    components: {
      navDrawer,
      applicationToolBar,
      actionRow,
      passwordDialog,
      removeConfirmDialog,
      addNewHostDialog,
      addNewCloudDialog,
    },
    data: ()=>{
      return {
        drawer: false,
        pwDialog: false,
        pwCallback:null,
        pwDialogTitle:"",
        rmDialog: false,
        newHostDialog: false,
        newCloudDialog: false,
        headers: [
          { title: "name", key: "name" },
          { title: "connection test", key: "connectionTest" },
          { title: "hostname", key: "host" },
          { title: "usrename", key: "username" },
          { title: "port", key: "port" },
          { title: "private key", key: "keyFile" },
          { title: "action", key: "action", sortable: false },
        ],
        hosts: [],
        jobSchedulerNames: [],
        removeConfirmMessage: "",
        currentSetting: {},
      };
    },
    computed:{
      hostList(){
        return this.hosts.map((host)=>{
          return host.name;
        }).filter((hostname)=>{
          return hostname !== this.currentSetting.name;
        });
      }
    },
    mounted () {
      const baseURL=readCookie("socketIOPath");
      SIO.init(null, baseURL);
      SIO.emitGlobal("getJobSchedulerLabelList", (data)=>{
        this.jobSchedulerNames.splice(0,this.jobSchedulerNames.length, ...data);
      });
      SIO.emitGlobal("getHostList", (data)=>{
        data.forEach((e)=>{
          e.icon = "mdi-lan-pending";
          e.connectionStatus = "test";
        });
        this.hosts.splice(0, this.hosts.length, ...data);
      });
      SIO.onGlobal("askPassword", (hostname, cb)=>{
        this.pwCallback = (pw)=>{
          cb(pw);
        };
        this.pwDialogTitle = `input password or passphrase for ${hostname}`;
        this.pwDialog = true;
      });
    },
    methods: {
      openEditDialog (item) {
        this.currentSetting = item || {};

        if (this.currentSetting.type === "aws") {
          this.newCloudDialog = true;
          return;
        }
        this.newHostDialog = true;
      },
      initializeConnectionTestIcon(item){
        item.loading = false;
        delete (item.testResult);
        item.icon = "mdi-lan-pending";
        item.connectionStatus = "test";
      },
      addNewSetting (updated) {
        this.currentSetting={};
        delete (updated.icon);
        delete (updated.connectionStatus);
        delete (updated.testResult);
        delete (updated.loading);

        const eventName = updated.id ? "updateHost" : "addHost";
        const index = updated.id ?this.hosts.findIndex((e)=>{
          return updated.id === e.id;
        }):0;
        const numDelete = updated.id? 1:0;
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
      openRemoveConfirmDialog (item) {
        this.rmTarget = item;
        this.removeConfirmMessage = `Are you shure you want to remove ${item.name} ?`;
        this.rmDialog = true;
      },
      removeRemotehost () {
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
      testConnection (index) {
        const target=this.hosts[index];
        target.loading=true;
        SIO.emitGlobal("tryToConnect", this.hosts[index], (rt)=>{
          debug("connection test result:",rt);
          target.loading= false
          target.testResult=rt
          target.connectionStatus= rt === "success" ? "OK" : "failed"
          target.icon= rt === "success" ? "mdi-lan-connect" : "mdi-lan-disconnect"
          this.pwDialog=false
        });
      },
    },
  };
</script>
