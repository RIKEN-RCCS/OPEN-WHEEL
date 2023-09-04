/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-dialog
    v-model="openDialog"
    :max-width="maxWidth"
    :persistent="true"
  >
    <v-card>
      <v-card-title>
        cloud service setting
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
              <v-expansion-panel-header>Basic settings</v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-container>
                  <v-row>
                    <v-col
                      cols="6"
                    >
                      <v-text-field
                        v-model="host.name"
                        label="label"
                        :rules="[required, notDupulicatedLabel]"
                        hint="required"
                        validate-on-blur
                      />
                    </v-col>
                    <v-col
                      cols="6"
                    >
                      <v-text-field
                        v-model="host.type"
                        label="cloud service provider"
                        readonly
                        :rules="[required]"
                        placeholder="required"
                        validate-on-blur
                      />
                    </v-col>
                    <v-col cols="6">
                      <v-text-field
                        v-model.number="host.os"
                        label="OS"
                        readonly
                        :rules="[required]"
                        placeholder="required"
                        validate-on-blur
                      />
                    </v-col>
                    <v-col cols="6">
                      <v-text-field
                        v-model="host.region"
                        label="region"
                        :rules="[required]"
                        placeholder="required"
                        validate-on-blur
                      />
                    </v-col>
                    <v-col cols="6">
                      <v-text-field
                        v-model="host.numNodes"
                        label="number of instance"
                        :rules="[required]"
                        placeholder="required"
                        validate-on-blur
                      />
                    </v-col>
                    <v-col cols="6">
                      <v-text-field
                        v-model="host.InstanceType"
                        label="instance type"
                        :rules="[required]"
                        placeholder="required"
                        validate-on-blur
                      />
                    </v-col>
                    <v-col cols="6">
                      <v-text-field
                        v-model.number="host.rootVolume"
                        label="root storage volume (GB)"
                        :rules="[positiveNumber]"
                        validate-on-blur
                      />
                    </v-col>
                    <v-col cols="6">
                      <v-text-field
                        v-model="host.mpi"
                        label="MPI library"
                      />
                    </v-col>
                    <v-col cols="6">
                      <v-text-field
                        v-model="host.compiler"
                        label="compiler"
                      />
                    </v-col>
                    <v-col cols="6">
                      <v-textarea
                        v-model="host.playbook"
                        label="playbook for setup"
                      />
                    </v-col>
                    <v-col cols="6">
                      <v-textarea
                        v-model="host.additionalParams"
                        label="additional parameters"
                      />
                    </v-col>
                    <v-col cols="6">
                      <v-textarea
                        v-model="host.additionalParamsForHead"
                        label="additional parameters for head node"
                      />
                    </v-col>
                    <v-col cols="6">
                      <v-select
                        v-model="host.jobScheduler"
                        :items="availableJobSchedulers"
                        label="job scheduler"
                      />
                    </v-col>
                    <v-col cols="6">
                      <v-text-field
                        v-model.number="host.numJob"
                        label="max number of jobs"
                      />
                    </v-col>
                    <v-col cols="6">
                      <v-text-field
                        v-model="host.queue"
                        label="available queues"
                      />
                    </v-col>
                  </v-row>
                </v-container>
              </v-expansion-panel-content>
            </v-expansion-panel>
            <v-expansion-panel>
              <v-expansion-panel-header>Advanced settings</v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-container>
                  <v-row>
                    <v-col cols="6">
                      <v-text-field
                        v-model.number="host.renewInterval"
                        label="connection renewal interval (min.)"
                        :rules="[positiveNumber]"
                        validate-on-blur
                      />
                    </v-col>
                    <v-col cols="6">
                      <v-text-field
                        v-model.number="host.renewDelay"
                        label="connection renewal delay (sec.)"
                        :rules="[positiveNumber]"
                        validate-on-blur
                      />
                    </v-col>
                    <v-col cols="6">
                      <v-text-field
                        v-model.number="host.statusCheckInterval"
                        label="status check interval (sec.)"
                        :rules="[positiveNumber]"
                        validate-on-blur
                      />
                    </v-col>
                    <v-col cols="6">
                      <v-text-field
                        v-model.number="host.maxStatusCheckError"
                        label="max number of status check error allowed"
                        :rules="[positiveNumber]"
                        validate-on-blur
                      />
                    </v-col>
                    <v-col cols="6">
                      <v-text-field
                        v-model.number="host.execInterval"
                        label="interval time between each executions"
                        :rules="[positiveNumber]"
                        validate-on-blur
                      />
                    </v-col>
                    <v-col cols="6" />
                  </v-row>
                </v-container>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-btn
          :disabled="hasError"
          @click="submitHost"
        >
          <v-icon>
            mdi-check
          </v-icon>
          OK
        </v-btn>
        <v-btn @click="cancelDialog">
          <v-icon>
            mdi-close
          </v-icon>
          cancel
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script>
  import { required, validPortNumber, positiveNumber } from "@/lib/validationRules.js";
  export default {
    Name: "newCloudDialog",
    props: {
      value: Boolean,
      title: { type: String, default: "cloud service" },
      maxWidth: { type: String, default: "50%" },
      hostNames: {type: Array, default: ()=>{return [];}},
      initialValue: {type: Object, default: ()=>{return {};}}
    },
    data: function () {
      return {
        host: { type: "aws", os: "ubuntu16" },
        usePubkey: false,
        openPanel: [0],
        availableJobSchedulers: ["PBSPro"],
      };
    },
    computed: {
      hasError (){
        return this.hostNames.includes(this.host.name)
          || this.required(this.host.name) !== true
          || this.required(this.host.type) !== true
          || this.required(this.host.os) !== true
          || this.required(this.host.region) !== true
          || this.required(this.host.numNodes) !== true
          || this.required(this.host.InstanceType) !== true;
      },
      openDialog: {
        get () {
          return this.value;
        },
        set (value) {
          this.$emit("update:modelValue", value);
        },
      },
    },
    watch:{
      openDialog(v){
      this.host = Object.assign(this.host, this.initialValue);
      }
    },
    methods: {
      notDupulicatedLabel (v){
        return !this.hostNames.includes(v) ||"label is already in use";
      },
      required,
      validPortNumber,
      positiveNumber: positiveNumber.bind(null, true),
      submitHost () {
        this.$emit("newHost", this.host);
        this.closeDialog();
      },
      cancelDialog(){
        this.$emit("cancel");
        this.closeDialog();
      },
      closeDialog () {
        this.host = {};
        this.$refs.form.reset();
        this.openDialog = false;
      },
    },
  };
</script>
