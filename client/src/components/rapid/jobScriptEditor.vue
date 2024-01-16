/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-card>
    <v-card-actions>
      <v-btn
        @click="insertJobScript"
        :text="isJobScript ? 'update' : 'insert'"
      />
      <v-btn
        @click="removeJobScript"
        disable="!isJobSCript"
        text="remove"
      />
      <v-btn
        @click="clear"
        text="clear"
      />
      <v-btn
        class=ml-8
        @click="loadDialog=true"
        text="load"
      />
      <v-btn
        @click="saveDialog=true"
        text="register"
      />
    </v-card-actions>
    <v-card-text>
      <v-select
        v-model="center"
        label="HPC center"
        :items="centerNames"
      />
      <div v-if="template !== null">
        <div
          v-for="v, index in template.optionValues"
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
            variant=outlined
            :label="v.label"
            type="number"
            min="1"
          />
          <v-text-field
            v-else-if="v.type==='jobScheduler'"
            v-model.lazy.trim="v.value"
            variant=outlined
            :label="v.label"
            readonly
          />
          <v-text-field
            v-else-if="v.type==='text'"
            v-model.lazy.trim="v.value"
            variant=outlined
            :label="v.label"
          />
        </div>
      </div>
    </v-card-text>
    <versatile-dialog
      v-model="saveDialog"
      max-width="50vw"
      :title="'input template name'"
      @ok="saveTemplate"
      @cancel="cancelSaveDialog"
    >
      <template #message>
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
      <template #message>
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
import SIO from "@/lib/socketIOWrapper.js";
import hpcCenters from "@/lib/hpcCenter.json";
import createJobScript from "@/lib/jobScripts.js";
import versatileDialog from "@/components/versatileDialog.vue";
import listForm from "@/components/common/listForm.vue";

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
      centerNames: hpcCenters
        .filter((e)=>{
          return e.id.startsWith("builtin");
        })
        .map((e)=>{
          return e.name
        }) ,
      builtinTemplates: structuredClone(hpcCenters),
      jobScriptList: [],
      loadedCenterInfo: null,
      center: null,
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
    template(){
      const  index = this.centerNames.findIndex((e)=>{return e===this.center});
      return this.loadedCenterInfo || this.builtinTemplates[index] || null;
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
    this.center=this.centerNames[0];
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
      this.builtinTemplates=structuredClone(hpcCenters);
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
      const eventName = this.template.name === this.newTemplateName && typeof this.template.id === "string" ? "updateJobScriptTemplate" : "addJobScriptTemplate";
      const payload={...this.template};
      payload.name = this.newTemplateName
      SIO.emitGlobal(eventName, payload, SIO.generalCallback);
      this.cancelSaveDialog();
    },
    insertJobScript(){
      const values=this.template.optionValues.reduce((a,c)=>{
        a[c.prop]=c.value;
        return a;
      },{});
      const snipet=createJobScript(this.template.centerName, values);
      this.$emit("insert", snipet);
    },
    removeJobScript(){
      this.$emit("remove");
    }

  },
};
</script>
