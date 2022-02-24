<!--
Copyright (c) Center for Computational Science, RIKEN All rights reserved.
Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
See License.txt in the project root for the license information.
-->
<template>
  <v-container
    class="fill-height"
    fluid
  >
    <v-toolbar dense>
      <v-spacer />
      <v-toolbar-items>
        <v-switch
          v-model="readOnly"
          label="read only"
          class="pt-3"
        />
        <v-switch
          v-model="openParamEditor"
          label="parameter study setting"
          class="pt-3"
        />
        <v-btn @click="saveAllFiles">
          <v-icon>mdi-content-save-all</v-icon>
          save all files
        </v-btn>
      </v-toolbar-items>
    </v-toolbar>
    <v-row no-gutters>
      <v-col>
        <tab-editor
          ref="text"
          :read-only="readOnly"
        />
      </v-col>
      <v-col v-show="openParamEditor">
        <parameter-editor
          ref="param"
          :read-only="readOnly"
          @openNewTab="openNewTab"
          @insertBraces="insertBraces"
        />
      </v-col>
    </v-row>
    <filter-editor />
    <unsaved-file-dialog />
  </v-container>
</template>
<script>

  "use strict";
  import { mapState, mapActions } from "vuex";
  import unsavedFileDialog from "@/components/rapid/unsavedFileDialog.vue";
  import filterEditor from "@/components/rapid/filterEditor.vue";
  import tabEditor from "@/components/rapid/tabEditor.vue";
  import parameterEditor from "@/components/rapid/parameterEditor.vue";
  import SIO from "@/lib/socketIOWrapper.js";

  export default {
    name: "Editor",
    components: {
      unsavedFileDialog,
      filterEditor,
      tabEditor,
      parameterEditor,
    },
    beforeRouteLeave (to, from, next) {
      if (!this.hasChange()) {
        next();
        return;
      }
      const dialogContent = {
        title: "unsaved files",
        message: "do you want to save files",
        withInputField: false,
        buttons: [
          {
            icon: "mdi-content-save-all-outline",
            label: "save",
            cb: ()=>{ this.saveAllFiles(); next(); },
          },
          {
            icon: "mdi-alert-circle-outline",
            label: "discard all unsaved files",
            cb: next,
          },
          {
            icon: "mdi-close",
            label: "cancel",
          },
        ],
      };
      this.showDialog(dialogContent);
    },
    data: ()=>{
      return {
        openParamEditor: false,
        readOnly: false,
      };
    },
    computed: {
      ...mapState(["selectedFile"]),
    },
    mounted () {
      SIO.onGlobal("parameterSettingFile", (file)=>{
        this.openParamEditor = file.isParameterSettingFile;
      });
    },
    methods: {
      ...mapActions(["showDialog"]),
      openNewTab (...args) {
        this.$refs.text.openNewTab(...args);
      },
      insertBraces () {
        this.$refs.text.insertBraces();
      },
      hasChange () {
        const fileChanged = this.$refs.text.hasChange();
        const paramChanged = this.$refs.param.hasChange();
        return fileChanged || paramChanged;
      },
      saveAllFiles () {
        const fileChanged = this.$refs.text.saveAll();
        const paramChanged = this.$refs.param.save();
        return fileChanged || paramChanged;
      },
    },
  };
</script>
