/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-dialog
    v-model="openDialog"
    persistent
    width="480"
  >
    <v-card>
      <v-card-title>
        remote work directory cleanup settings
      </v-card-title>
      <v-card-text>
        <p class="text-body-2 mb-4">
          all components will have same setting by default
        </p>
        <v-radio-group
          v-model="localCleanupFlag"
          :disabled="readOnly"
        >
          <v-radio
            label="remove files"
            :value="0"
            data-cy="cleanup_setting-remove-radio"
          />
          <v-radio
            label="keep files"
            :value="1"
            data-cy="cleanup_setting-keep-radio"
          />
        </v-radio-group>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <buttons
          :buttons="[
            {label: 'save', icon: 'mdi-check'},
            {label: 'cancel', icon: 'mdi-close'},
          ]"
          @save="saveCleanupFlag"
          @cancel="closeDialog"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script>
import { toRaw } from "vue";
import { mapState } from "vuex";
import SIO from "../lib/socketIOWrapper.js";
import buttons from "../components/common/buttons.vue";

export default {
  name: "CleanupSettingDialog",
  components: {
    buttons
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true
    }
  },
  emits: [
    "update:modelValue"
  ],
  data: function () {
    return {
      localCleanupFlag: 0
    };
  },
  computed: {
    openDialog: {
      get() {
        return this.modelValue;
      },
      set(v) {
        this.$emit("update:modelValue", v);
      }
    },
    ...mapState(["projectRootDir", "rootComponentID", "componentTree", "currentComponent", "readOnly"])
  },
  watch: {
    modelValue(newVal) {
      if (newVal && this.componentTree) {
        this.localCleanupFlag = this.componentTree.cleanupFlag;
      }
    }
  },
  methods: {
    closeDialog() {
      this.$emit("update:modelValue", false);
    },

    /**
     * save the root workflow's cleanupFlag to the server
     */
    saveCleanupFlag() {
      const updated = { ...toRaw(this.componentTree), cleanupFlag: this.localCleanupFlag };
      SIO.emitGlobal("updateComponent", this.projectRootDir, this.rootComponentID, updated, this.currentComponent.ID, SIO.generalCallback);
      this.closeDialog();
    }
  }
};
</script>
