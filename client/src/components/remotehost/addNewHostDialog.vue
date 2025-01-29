/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <div>
    <v-dialog
      v-model="openDialog"
      :max-width="maxWidth"
      persistent
    >
      <v-card>
        <v-card-title data-cy="add_new_host-add_new_host-title">
          add new host
        </v-card-title>
        <v-card-text>
          <v-form
            ref="form"
          >
            <v-expansion-panels
              v-model="openPanel"
              multiple
            >
              <v-expansion-panel>
                <v-expansion-panel-title>Basic settings</v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-container>
                    <v-row>
                      <v-col cols="6">
                        <v-text-field
                          v-model="host.name"
                          label="label"
                          :rules="[required, notDupulicatedLabel]"
                          placeholder="required"
                          validate-on="blur"
                          data-cy="add_new_host-label-textarea"
                        />
                      </v-col>
                      <v-col cols="6">
                        <v-text-field
                          v-model="host.host"
                          label="Hostname"
                          :rules="[required]"
                          placeholder="required"
                          validate-on="blur"
                          data-cy="add_new_host-hostname-textarea"
                        />
                      </v-col>
                      <v-col cols="6">
                        <v-text-field
                          v-model.number="host.port"
                          :label=portNumberLabel
                          :rules="[validPortNumber]"
                          validate-on="blur"
                          data-cy="add_new_host-port_number_label-textarea"
                        />
                      </v-col>
                      <v-col cols="6">
                        <v-text-field
                          v-model="host.user"
                          label="User ID"
                          :rules="[required]"
                          placeholder="required"
                          validate-on="blur"
                          data-cy="add_new_host-user_id-textarea"
                        />
                      </v-col>
                      <v-col cols="6">
                        <v-text-field
                          v-model="host.path"
                          :label=workDirLabel
                          validate-on="blur"
                          data-cy="add_new_host-work_dir_label-textarea"
                        />
                      </v-col>
                      <v-col cols="4">
                        <v-text-field
                          v-model="host.keyFile"
                          label="private key path"
                          data-cy="add_new_host-private_key_path-textarea"
                          clearable
                        />
                      </v-col>
                      <v-col cols="2">
                        <v-btn
                          @click="openFileBrowser=!openFileBrowser"
                          text=browse
                        />
                      </v-col>
                      <v-col cols="6">
                        <v-select
                          v-model="host.jobScheduler"
                          :items="availableJobSchedulers"
                          label="job scheduler"
                          data-cy="add_new_host-job_schedulers-textarea"
                        />
                      </v-col>
                      <v-col cols="6">
                        <v-text-field
                          v-model.number="host.numJob"
                          label="max number of jobs"
                          data-cy="add_new_host-max_number_of_jobs-textarea"
                        />
                      </v-col>
                      <v-col cols="6">
                        <v-text-field
                          v-model="host.queue"
                          label="available queues"
                          data-cy="add_new_host-available_queues-textarea"
                        />
                      </v-col>
                      <v-col cols="3">
                        <v-checkbox
                          v-model="host.useBulkjob"
                          label="use bulkjob"
                          data-cy="add_new_host-use_bulkjob-checkbox"
                        />
                      </v-col>
                      <v-col cols="3">
                        <v-checkbox
                          v-model="host.useStepjob"
                          label="use stepjob"
                          data-cy="add_new_host-use_stepjob-checkbox"
                        />
                      </v-col>
                      <v-col cols="6">
                        <v-select
                          v-model="host.sharedHost"
                          :items="hostNames"
                          label="shared host"
                          data-cy="add_new_host-shared_host-selectbox"
                          clearable
                        />
                      </v-col>
                      <v-col cols="6">
                        <v-text-field
                          v-model="host.sharedPath"
                          label="shared path on shared host"
                          data-cy="add_new_host-shared_path_on_shared_host-textarea"
                        />
                      </v-col>
                    </v-row>
                  </v-container>
                </v-expansion-panel-text>
              </v-expansion-panel>
              <v-expansion-panel>
                <v-expansion-panel-title data-cy="add_new_host-advanced_settings-title">Advanced settings</v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-container>
                    <v-row>
                      <v-col cols="6">
                        <v-text-field
                          v-model.number="host.renewInterval"
                          label="connection renewal interval (min.) [default: 0]"
                          :rules="[positiveNumber]"
                          validate-on="blur"
                          data-cy="add_new_host-connection_renewal-textarea"
                        />
                      </v-col>
                      <v-col cols="6">
                        <v-text-field
                          v-model.number="host.statusCheckInterval"
                          label="status check interval (sec.) [default: 60]"
                          :rules="[positiveNumber]"
                          validate-on="blur"
                          data-cy="add_new_host-status_check-textarea"
                        />
                      </v-col>
                      <v-col cols="6">
                        <v-text-field
                          v-model.number="host.maxStatusCheckError"
                          label="max number of status check error allowed [default: 10]"
                          :rules="[positiveNumber]"
                          validate-on="blur"
                          data-cy="add_new_host-max_number-textarea"
                        />
                      </v-col>
                      <v-col cols="6">
                        <v-text-field
                          v-model.number="host.execInterval"
                          label="execution interval (sec.) [default: job 5, task 1]"
                          :rules="[positiveNumber]"
                          validate-on="blur"
                          data-cy="add_new_host-execution_interval-textarea"
                        />
                      </v-col>
                      <v-col cols="6">
                        <v-text-field
                          v-model.number="host.readyTimeout"
                          label="timeout during handshake phase (msec.) [default: 0]"
                          :rules="[positiveNumber]"
                          validate-on="blur"
                          data-cy="add_new_host-timeout_during-textarea"
                        />
                      </v-col>
                    </v-row>
                  </v-container>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn
            :disabled="hasError"
            @click="submitHost"
            :prepend-icon="mdi-check"
            text="OK"
            data-cy="add_new_host-ok-btn"
          />
          <v-btn
            @click="cancelDialog"
            prepend-icon="mdi-close"
            text="cancel"
          />
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="openFileBrowser"
      max-width="70%"
      :persistent="true"
      overlay-opacity="100"
      scrollable
    >
      <v-card>
        <v-card-title>select private key file</v-card-title>
        <v-card-actions>
          <v-spacer />
          <v-btn
            :disabled="!selectedFile"
            @click="host.keyFile=selectedFile;closeFileBrowser()"
            prepend-icon="mdi-check"
            text="OK"
          />
          <v-btn
            @click="closeFileBrowser"
            prepend-icon="mdi-close"
            text="cancel"
          />
        </v-card-actions>
        <v-card-text>
          <file-browser
            mode="all"
            @update="(a)=>{selectedFile=a}"
          />
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
"use strict";
import fileBrowser from "../../components/common/fileBrowserLite.vue";
import { required, validPortNumber, positiveNumber } from "../../lib/validationRules.js";
export default {
  Name: "newHostDialog",
  components: {
    fileBrowser
  },
  props: {
    modelValue: Boolean,
    title: { type: String, default: "remote host" },
    maxWidth: { type: String, default: "50%" },
    hostNames: { type: Array, default: ()=>{ return []; } },
    initialValue: { type: Object, default: ()=>{ return {}; } },
    availableJobSchedulers: { type: Array, default: ()=>{ return []; } }
  },
  data: function () {
    return {
      host: {},
      openPanel: [0],
      pathSep: "/",
      home: "/",
      openFileBrowser: false,
      selectedFile: null
    };
  },
  computed: {
    hasError() {
      return this.hostNames.includes(this.host.name)
        || this.required(this.host.name) !== true
        || this.required(this.host.host) !== true
        || this.validPortNumber(this.host.port) !== true
        || this.required(this.host.user) !== true;
    },
    openDialog: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit("update:modelValue", value);
      }
    },
    portNumberLabel() {
      return `Port number ${this.host.port ? "" : "[default: 22]"}`;
    },
    workDirLabel() {
      return `Host work dir ${this.host.path ? "" : "[default $HOME]"}`;
    }
  },
  watch: {
    openDialog() {
      this.host = Object.assign(this.host, this.initialValue);
    }
  },
  methods: {
    closeFileBrowser() {
      this.selectedFile = null;
      this.openFileBrowser = false;
    },
    notDupulicatedLabel(v) {
      return !this.hostNames.includes(v) || "label is already in use";
    },
    required,
    validPortNumber,
    positiveNumber: positiveNumber.bind(null, true),
    submitHost() {
      this.$emit("newHost", this.host);
      this.closeDialog();
    },
    cancelDialog() {
      this.$emit("cancel");
      this.closeDialog();
    },
    closeDialog() {
      this.host = {};
      this.$refs.form.reset();
      this.openDialog = false;
    }
  }
};
</script>
