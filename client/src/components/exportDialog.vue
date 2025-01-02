/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-dialog
    v-model="openDialog"
    max-width="60vw"
    persistent
  >
    <v-card
      :title="`${title} [${projectJson.name ||''}]`"
      :subtitle="message"
    >
      <v-card-text>
        <v-row>
          <v-btn
            v-if="mode !== 'inputMetaData'"
            class="mx-auto mt-10 mb-6"
            :loading="loading"
          />
          <v-form
            v-else
            class="w-100"
          >
            <v-text-field
              v-model="newName"
              label="your name"
            />
            <v-text-field
              v-model="newEmail"
              label="your e-mail"
            />
            <v-textarea
              v-model="newMemo"
              label="memo"
              auto-grow
            />
          </v-form>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <buttons
          :buttons="buttons"
          @ok="exportProject"
          @cancel="closeDialog"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script>
import buttons from "./common/buttons.vue";
import SIO from "../lib/socketIOWrapper.js";

export default {
  name: "ExportDialog",
  components: {
    buttons
  },
  props: {
    modelValue: Boolean,
    projectJson: {
      type: Object,
      required: true
    },
    projectRootDir: {
      type: String,
      required: true
    },
    name: {
      type: String,
      default: ""
    },
    email: {
      type: String,
      default: ""
    },
    memo: {
      type: String,
      default: ""
    }
  },
  emits: ["update:modelValue"],
  data: function () {
    return {
      mode: "inputMetaData",
      title: "export project",
      message: "input export information",
      buttons: [
        { icon: "mdi-check", label: "ok" },
        { icon: "mdi-close", label: "cancel" }
      ],
      newName: "",
      newEmail: "",
      newMemo: "",
      btnText: ""
    };
  },
  computed: {
    loading() {
      return this.mode !== "inputMetaData";
    },
    openDialog: {
      get() {
        return this.modelValue;
      },
      set(v) {
        this.$emit("update:modelValue", v);
      }
    }
  },
  watch: {
    projectJson() {
      if (this.projectJson.exporter && this.projectJson.exporter.name) {
        this.newName = this.projectJson.exporter.name;
      }
      if (this.projectJson.exporter && this.projectJson.exporter.email) {
        this.newEmail = this.projectJson.exporter.email;
      }
      if (this.projectJson.exporter && this.projectJson.exporter.memo) {
        this.newMemo = this.projectJson.exporter.memo;
      }
    }
  },
  methods: {
    closeDialog() {
      this.mode = "inputMetaData",
      this.newName = "";
      this.newEmail = "";
      this.newMemo = "";
      this.btnText = "";
      this.openDialog = false;
    },
    exportProject() {
      this.mode = "preparing";
      const name = typeof this.newName === "string" && this.newName.length > 0 ? this.newName : null;
      const email = typeof this.newEmail === "string" && this.newEmail.length > 0 ? this.newEmail : null;
      const memo = typeof this.newMemo === "string" && this.newMemo.length > 0 ? this.newMemo : null;
      SIO.emitGlobal("exportProject", this.projectJson.path, name, email, memo, async (url)=>{
        if (typeof url !== "string") {
          this.closeDialog();
          return;
        }
        this.mode = "downloading";
        const res = await fetch(url);
        if (!res.ok) {
          this.closeDialog();
          return;
        }
        const content = await res.blob();
        const objectUrl = (window.URL || window.webkitURL).createObjectURL(content);
        const a = document.createElement("a");
        a.href = objectUrl;
        const urlTokens = url.split("/");
        a.download = urlTokens[urlTokens.length - 1];
        a.click();
        this.closeDialog();
      });
    }
  }
};
</script>
