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
        <v-select
          v-model="mode"
          :items="modes"
          class="pt-3"
        />
        <v-switch
          v-model="readOnly"
          label="read only"
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
      <v-col v-show="mode === 'paramEditor'">
        <parameter-editor
          ref="param"
          :read-only="readOnly"
          @openNewTab="openNewTab"
          @insertBraces="insertBraces"
        />
      </v-col>
      <v-col v-show="mode === 'jobScriptEditor'">
        <job-script-editor
          ref="jse"
          :read-only="readOnly"
          @insert="insertSnipet"
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
  import jobScriptEditor  from "@/components/rapid/jobScriptEditor.vue";
  import SIO from "@/lib/socketIOWrapper.js";

  export default {
    name: "Editor",
    components: {
      unsavedFileDialog,
      filterEditor,
      tabEditor,
      parameterEditor,
      jobScriptEditor,
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
        mode: "normal",
        modes: ["normal", "paramEditor", "jobScriptEditor"],
        readOnly: false,
      };
    },
    computed: {
      ...mapState(["selectedFile"]),
    },
    mounted () {
      SIO.onGlobal("parameterSettingFile", (file)=>{
        if(file.isParameterSettingFile){
            this.mode="paramEditor";
        }
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
      insertSnipet(snipet){
        this.$refs.text.insertSnipet(snipet);
      },
      hasChange () {
        return this.$refs.text.hasChange() || this.$refs.param.hasChange(); // ||this.$refs.jse.hasChange();
      },
      saveAllFiles () {
        this.$refs.text.saveAll();
        this.$refs.param.save();
      },
    },
  };
</script>
<style>
.v-select__selections {
  width: 140px;
}
.v-select__selections input {
  width: 0;
}
</style>
