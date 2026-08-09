/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-dialog
    v-model="openDialog"
    max-width="50vw"
    persistent
  >
    <v-card
      title="Import Component"
      class="w-100"
    >
      <v-card-actions>
        <v-btn-group>
          <v-btn
            :disabled="!archiveFile"
            text="ok"
            @click="importComponent"
          />
          <v-btn
            text="cancel"
            @click="closeDialog"
          />
        </v-btn-group>
      </v-card-actions>
      <v-card-text>
        <v-file-input
          v-model="archiveFile"
          class="mt-4"
          clearable
          label="select or drop component archive file"
          variant="outlined"
          accept=".tgz"
          @update:model-value="onFileSelected"
        />
        <div
          v-if="uploadedFilename"
          class="text-center pa-4 text-h6"
        >
          {{ uploadedFilename }}
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<script>
import { mapState } from "vuex";
import SIO from "../lib/socketIOWrapper.js";

export default {
  name: "ImportComponentDialog",
  props: {
    modelValue: {
      type: Boolean,
      required: true
    },
    pos: {
      type: Object,
      default: null
    }
  },
  emits: [
    "update:modelValue",
    "imported"
  ],
  data() {
    return {
      archiveFile: null,
      uploadedFilename: null
    };
  },
  computed: {
    ...mapState([
      "projectRootDir",
      "currentComponent"
    ]),
    openDialog: {
      get() {
        return this.modelValue;
      },
      set(v) {
        this.$emit("update:modelValue", v);
      }
    }
  },
  methods: {
    onFileSelected() {
      if (this.archiveFile) {
        this.uploadedFilename = this.archiveFile.name;
      } else {
        this.uploadedFilename = null;
      }
    },
    async importComponent() {
      if (!this.archiveFile) {
        return;
      }

      const projectRootDir = this.projectRootDir;
      const targetParentID = this.currentComponent.ID;

      //Set up event handlers for file upload
      const startHandler = (event)=>{
        event.file.meta.projectRootDir = projectRootDir;
        event.file.meta.targetParentID = targetParentID;
        event.file.meta.clientID = SIO.getID();
        event.file.meta.isComponentImport = true;
        //Pass position if available
        if (this.pos) {
          event.file.meta.pos = this.pos;
        }
        SIO.removeUploaderEvent("start", startHandler);
      };

      const completeHandler = ()=>{
        this.$emit("imported");
        this.closeDialog();
        SIO.removeUploaderEvent("complete", completeHandler);
      };

      SIO.onUploaderEvent("start", startHandler);
      SIO.onUploaderEvent("complete", completeHandler);

      //Submit the file for upload
      SIO.submitFile(this.archiveFile);
    },
    closeDialog() {
      this.archiveFile = null;
      this.uploadedFilename = null;
      this.openDialog = false;
    }
  }
};
</script>
