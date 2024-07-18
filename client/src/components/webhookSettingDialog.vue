/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";

<template>
  <versatile-dialog
    :model-value="modelValue"
    title="webhook setting"
    max-width="80vw"
    @ok="saveWebhook"
    @cancel="closeDialog"
  >
    <template #message>
      <v-text-field
        v-model="webhookURL"
        :readonly="readOnly"
        :rules="[required, isValidURL]"
        label="URL"
        clearable
      />
      <v-row>
        <v-col cols="6">
          <v-checkbox
            v-model="isProjectHook"
            :readonly="readOnly"
            label="project status changed"
          />
        </v-col>
        <v-col cols="6">
          <v-checkbox
            v-model="isComponentHook"
            :readonly="readOnly"
            label="component status changed"
          />
        </v-col>
      </v-row>
    </template>
  </versatile-dialog>
</template>
<script>
import { mapState, mapMutations } from "vuex";
import SIO from "@/lib/socketIOWrapper.js";
import versatileDialog from "@/components/versatileDialog.vue";
import { required, isValidURL } from "@/lib/validationRules.js";

export default {
  name: "webhookSettingDialog",
  components: {
    versatileDialog
  },
  props: ["modelValue"],
  emits: ["update:modelValue"],
  computed: {
    ...mapState(["currentComponent", "projectRootDir", "rootComponentID", "readOnly"])
  },
  data() {
    return {
      webhookURL: "",
      isProjectHook: false,
      isComponentHook: false
    };
  },
  watch: {
    modelValue(v) {
      if (!v) {
        return;
      }
      this.commitWaitingWebhook(true);
      SIO.emitGlobal("getWebhook", this.projectRootDir, this.rootComponentID, (data)=>{
        if (data) {
          this.webhookURL = data.URL;
          this.isProjectHook = data.project;
          this.isComponentHook = data.component;
        }
        this.commitWaitingWebhook(false);
      });
    }
  },
  methods: {
    required,
    isValidURL,
    ...mapMutations(
      {
        commitWaitingWebhook: "waitingWebhook"
      }),
    saveWebhook() {
      const webhook = {
        URL: this.webhookURL,
        project: this.isProjectHook,
        component: this.isComponentHook
      };
      SIO.emitGlobal("updateWebhook", this.projectRootDir, webhook, this.currentComponent.ID, SIO.generalCallback);
      this.closeDialog();
    },
    closeDialog() {
      this.webhookURL = "";
      this.isProjectHook = false;
      this.isComponentHook = false;
      this.$emit("update:model-value", false);
    }
  }
};
</script>
