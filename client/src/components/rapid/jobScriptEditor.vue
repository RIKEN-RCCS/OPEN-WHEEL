<!--
Copyright (c) Center for Computational Science, RIKEN All rights reserved.
Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
See License.txt in the project root for the license information.
-->
<template>
  <v-card>
    <v-card-actions>
      <v-btn
        @click="loadDialog=true"
      >
        load
      </v-btn>
      <v-btn
        @click="insertJobScript"
      >
        {{ isJobScript ? "update" : "insert" }}
      </v-btn>
      <v-btn
        @click="clear"
      >
        clear
      </v-btn>
      <v-btn
        class="ml-8"
        @click="saveDialog=true"
      >
        register
      </v-btn>
    </v-card-actions>
    <v-card-text>
      <v-select
        v-model="center"
        label="HPC center"
        :items="centerNames"
      />
      <div
        v-for="v, index in centerInfo"
        :key="index"
      >
        <v-select
          v-if="v.type === 'select'"
          v-model="v.value"
          :label="v.label"
          :items="v.items"
        />
        <v-text-field
          v-else-if="v.type==='number'"
          v-model.lazy.trim="v.value"
          outlined
          :label="v.label"
          type="number"
          min="1"
        />
        <v-text-field
          v-else-if="v.type==='jobScheduler'"
          v-model.lazy.trim="v.value"
          outlined
          :label="v.label"
          readonly
        />
        <v-text-field
          v-else-if="v.type==='text'"
          v-model.lazy.trim="v.value"
          outlined
          :label="v.label"
        />
      </div>
    </v-card-text>
    <versatile-dialog
      v-model="saveDialog"
      max-width="50vw"
      :title="'input template name'"
      @ok="saveTemplate"
      @cancel="cancelSaveDialog"
    >
      <template slot="message">
        <v-text-field
          v-model="newTemplateName"
          clearble
        />
      </template>
    </versatile-dialog>
    <versatile-dialog
      v-model="loadDialog"
      title="load template"
      max-width="50vw"
      @ok="loadTemplate"
      @cancel="loadDialog=false"
    >
      <template slot="message">
        <list-form
          v-model="selected"
          :title="'load templates'"
          :items="jobScriptList"
          :buttons="buttons"
          :input-column="false"
          :allow-rename-inline="false"
          :selectable="true"
          @remove="removeTemplate"
        />
      </template>
    </versatile-dialog>
  </v-card>
</template>
<script>
  "use strict";
  import { mapState, mapGetters } from "vuex";
  import SIO from "@/lib/socketIOWrapper.js";
  import hpcCenters from "@/lib/hpcCenter.json";
  import createJobScript from "@/lib/jobScripts.js";
  import versatileDialog from "@/components/versatileDialog.vue";
  import listForm from "@/components/common/listForm.vue";

  const clone = require("rfdc")();

  export default {
    name: "JobScriptEditor",
    components:{
      versatileDialog,
      listForm
    },
    props: {
      readOnly: {
        type: Boolean,
        required: true,
      },
      isJobScript:{
        type: Boolean,
        required: true,
      }
    },
    data: function () {
      return {
        centerNames: Object.keys(hpcCenters),
        hpcCenters: clone(hpcCenters),
        jobScriptList: [],
        loadedCenterInfo: null,
        center: 0,
        loadDialog:false,
        saveDialog:false,
        newTemplateName: "",
        buttons:[
          {label: "load", icon: "mdi-check"},
          {label: "remove", icon: "mdi-trash"},
          {label: "cancel", icon: "mdi-close"}
        ],
        selected:[]
      };
    },
    computed: {
      centerInfo(){
        return this.loadedCenterInfo || this.hpcCenters[this.center];
      }
   },
   watch:{
     center(newVal, oldVal){
       if(newVal===oldVal){
         return;
       }
       this.loadedCenterInfo=null;
     }
   },
   mounted(){
     SIO.onGlobal("jobScriptTemplateList", (data)=>{
       this.jobScriptList=data;
     });
     SIO.emitGlobal("getJobscriptTemplates", SIO.generalCallback);
   },
   methods: {
     cancelSaveDialog(){
       this.newTemplateName="";
       this.saveDialog=false;
     },
     clear(){
       this.hpcCenters=clone(hpcCenters);
       this.loadedCenterInfo=null;
     },
     removeTemplate(item){
       SIO.emitGlobal("removeJobScriptTemplate", item.id, SIO.generalCallback);
     },
     loadTemplate(){
       if(this.selected.length > 0){
         this.loadedCenterInfo=this.selected[0];
         this.selected.splice(0);
       }
       this.loadDialog=false;
     },
     saveTemplate(){
       const eventName = this.centerInfo.name === this.newTemplateName && typeof this.centerInfo.id === "string" ? "updateJobScriptTemplate" : "addJobScriptTemplate";
       SIO.emitGlobal(eventName, {name: this.newTemplateName, ...this.centerInfo}, SIO.generalCallback);
     this.cancelSaveDialog();
     },
     insertJobScript(){
       const values=this.centerInfo.reduce((a,c)=>{
         a[c.prop]=c.value;
         return a;
       },{});
       const snipet=createJobScript(this.center, values);
       this.$emit("insert", snipet);
     }
   },
  };
</script>
