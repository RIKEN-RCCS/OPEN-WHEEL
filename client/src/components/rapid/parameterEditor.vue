<!--
Copyright (c) Center for Computational Science, RIKEN All rights reserved.
Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
See License.txt in the project root for the license information.
-->
<template>
  <div>
    <target-files
      :target-files="parameterSetting.targetFiles"
      :read-only="readOnly"
      @openNewTab="openNewTab"
    />
    <parameter
      :params="parameterSetting.params"
      :read-only="readOnly"
      @newParamAdded="newParamAdded"
    />
    <gather-scatter
      :container="parameterSetting.scatter"
      :headers="[ { value: 'srcName', text: 'srcName', sortable: true },
                  { value: 'dstName', text: 'dstName', sortable: true },
                  { value: 'dstNode', text: 'dstNode', sortable: true},
                  { text: 'Actions', value: 'action', sortable: false }]"
      :label="'scatter'"
      :read-only="readOnly"
    />
    <gather-scatter
      :container="parameterSetting.gather"
      :headers="[ { value: 'srcName', text: 'srcName', sortable: true },
                  { value: 'srcNode', text: 'srcNode', sortable: true},
                  { value: 'dstName', text: 'dstName', sortable: true },
                  { text: 'Actions', value: 'action', sortable: false }]"
      :label="'gather'"
      :read-only="readOnly"
    />
  </div>
</template>
<script>
  "use strict";
  import { mapState, mapGetters } from "vuex";
  import SIO from "@/lib/socketIOWrapper.js";
  import targetFiles from "@/components/rapid/targetFiles.vue";
  import gatherScatter from "@/components/rapid/gatherScatter.vue";
  import parameter from "@/components/rapid/parameter.vue";
  const equal = require("fast-deep-equal");
  const clone = require("rfdc")();

  export default {
    name: "ParameterEditor",

    components: {
      targetFiles,
      gatherScatter,
      parameter,
    },
    props: {
      readOnly: {
        type: Boolean,
        required: true,
      },
    },
    data: function () {
      return {
        parameterSetting: {
          version: 2,
          targetFiles: [],
          params: [],
          scatter: [],
          gather: [],
        },
        initialParameterSetting: {
          version: 2,
          targetFiles: [],
          params: [],
          scatter: [],
          gather: [],
        },
        filename: "parameterSetting.json",
      };
    },
    computed: {
      ...mapState(["selectedFile", "projectRootDir"]),
      ...mapGetters(["selectedComponentAbsPath"]),
    },
    mounted () {
      SIO.onGlobal("parameterSettingFile", (file)=>{
        if (!file.isParameterSettingFile) {
          console.log("ERROR: illegal parameter setting file data", file);
          return;
        }
        this.initialParameterSetting = JSON.parse(file.content);
        this.parameterSetting = JSON.parse(file.content);
        // convert raw string target file to object targetFile
        this.parameterSetting.targetFiles = this.parameterSetting.targetFiles.map((e)=>{
          if (typeof e === "string") {
            return { targetName: e };
          }
          return e;
        });
        this.filename = file.filename;
        this.dirname = file.dirname;
      });
    },
    methods: {
      openNewTab (...args) {
        this.$emit("openNewTab", ...args);
      },
      newParamAdded (param) {
        this.parameterSetting.params.push(param);
        this.$emit("insertBraces");
      },
      hasChange () {
        return !equal(this.initialParameterSetting, this.parameterSetting);
      },
      save () {
        if (equal(this.initialParameterSetting, this.parameterSetting)) {
          console.log("paramter setting is not changed!");
          return false;
        }
        SIO.emitGlobal("saveFile", this.projectRootDir, this.filename, this.dirname || this.selectedComponentAbsPath,
                 JSON.stringify(this.parameterSetting), (rt)=>{
                   if (!rt) {
                     console.log("ERROR: parameter setting file save failed");
                   }

                   this.initialParameterSetting = clone(this.parameterSetting);
                 });
        return true;
      },
    },
  };
</script>
