/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-container
    class="fill-height"
    fluid
  >
    <v-toolbar
      color="background"
      density=compact
    >
      <v-breadcrumbs
        :items="pathToCurrentComponent"
      >
        <template #divider>
          <v-icon icon="mdi-forward" />
        </template>
        <template #title="{ item }">
          <v-breadcrumbs-item>
            <component-button
              :item="item"
            />
          </v-breadcrumbs-item>
        </template>
      </v-breadcrumbs>
      <v-spacer />
      <v-toolbar-items>
        <v-select
          class='mt-n1'
          v-model="mode"
          :items="modes"
        />
        <v-switch
          class='mt-n1'
          v-model="readOnly"
          label="read only"
          :disabled="! isEdittable"
          color="primary"
        />
        <v-btn @click="saveAllFiles"
          prepend-icon=mdi-content-save-all
          text="save all files"
        />
      </v-toolbar-items>
    </v-toolbar>
    <v-row no-gutters>
      <v-col>
        <tab-editor
          ref="text"
          :read-only="readOnly"
          @jobscript="setIsJobScript"
        />
      </v-col>
      <v-col v-show="mode === 'PS-config'">
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
          :is-job-script="isJobScript"
          @insert="insertSnipet"
          @remove="removeSnipet"
        />
      </v-col>
    </v-row>
    <filter-editor />
    <unsaved-files-dialog
      :unsaved-files="unsavedFiles"
      :dialog="showUnsavedFilesDialog"
      without-status
      @closed="unsavedFilesDialogClosed"
    />
  </v-container>
</template>
<script>
  "use strict";
  import { mapState, mapGetters,mapActions } from "vuex";
  import getNodeAndPath from "@/lib/getNodeAndPath.js";
  import unsavedFilesDialog from "@/components/unsavedFilesDialog.vue";
  import componentButton from "@/components/common/componentButton.vue";
  import filterEditor from "@/components/rapid/filterEditor.vue";
  import tabEditor from "@/components/rapid/tabEditor.vue";
  import parameterEditor from "@/components/rapid/parameterEditor.vue";
  import jobScriptEditor  from "@/components/rapid/jobScriptEditor.vue";
  import SIO from "@/lib/socketIOWrapper.js";

  export default {
    name: "Editor",
    components: {
      componentButton,
      unsavedFilesDialog,
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
      const changedFilenames=[]
      if(this.$refs.param.hasChange()){
        changedFilenames.push({name: `${this.projectRootDir}${this.componentPath[this.selectedComponent.ID].slice(1)}/${this.$refs.param.filename}`})
      }
      if(this.$refs.text.hasChange() ){
        changedFilenames.push(...this.$refs.text.getChangedFiles())
      }
      this.unsavedFiles.splice(0,this.unsavedFiles.length, ...changedFilenames);
      this.showUnsavedFilesDialog= true;
      this.leave=next
    },
    data: ()=>{
      return {
        mode: "normal",
        readOnly_: false,
        isJobScript: false,
        showUnsavedFilesDialog: false,
        unsavedFiles:[],
        leave:null
      };
    },
    computed: {
      ...mapState(["projectRootDir",
                  "selectedFile",
                  "componentPath",
                  "selectedComponent",
                  "currentComponent",
                  "componentTree"]),
      ...mapGetters([ "isEdittable"]),
      readOnly:{
        get(){
          return this.isEdittable ? this.readOnly_: true;
        },
        set(v){
          this.readOnly_=v;
        }
      },
      pathToCurrentComponent: function () {
        const rt = [];
        if (this.currentComponent !== null) {
          getNodeAndPath(this.currentComponent.ID, this.componentTree, rt);
        }
        return rt;
      },
      selectedComponentRelativePath(){
        if(this.selectedComponent === null){
          return null;
        }
        const relativePath=this.componentPath[this.selectedComponent.ID];
        return relativePath.startsWith("./") ? relativePath.slice(2) : relativePath;
      },
      modes(){
        const rt=[ "normal"]
        if(!this.disablePS){
          rt.push("PS-config")
        }
        const disableJobScriptEditor=this.selectedComponent !== null ? this.selectedComponent.type !== "task" : false;
        if(!disableJobScriptEditor){
          rt.push("jobScriptEditor")
        }
        return rt;
      },
      disablePS(){
        if (this.selectedComponent === null){
          return true;
        }
        if(this.selectedComponent.type === "parameterStudy" || this.selectedComponent.type === "bulkjobTask"){
          return false;
        }
        return true;
      }
    },
    mounted () {
      SIO.onGlobal("parameterSettingFile", (file)=>{
        if(file.isParameterSettingFile){
            this.mode="PS-config";
        }
      });
    },
    methods: {
      ...mapActions(["showDialog"]),
      setIsJobScript(v){
        this.isJobScript=v;
      },
      openNewTab (...args) {
        this.$refs.text.openNewTab(...args);
      },
      insertBraces () {
        this.$refs.text.insertBraces();
      },
      insertSnipet(snipet){
        this.$refs.text.insertSnipet(snipet);
      },
      removeSnipet(){
        this.$refs.text.removeSnipet();
      },
      hasChange () {
        return this.$refs.text.hasChange() || this.$refs.param.hasChange(); // ||this.$refs.jse.hasChange();
      },
      saveAllFiles () {
        this.$refs.text.saveAll();
        this.$refs.param.save();
      },
      unsavedFilesDialogClosed(mode,payload){
        if(mode === "cancel"){
          this.unsavedFiles.splice(0);
          this.showUnsavedFilesDialog=false;
          return
        }
        if (mode === "save"){
          this.saveAllFiles()
        }
        this.unsavedFiles.splice(0);
        this.showUnsavedFilesDialog=false;
        this.leave();
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
