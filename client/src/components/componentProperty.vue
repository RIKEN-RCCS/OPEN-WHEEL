/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-navigation-drawer
    v-if="selectedComponent !== null"
    v-model="open"
    right
    absolute
    :width="propWidth"
  >
    <template slot:prepend>
      <v-toolbar flat>
        <v-toolbar-items>
          <v-form v-model="validName">
            <v-text-field
              v-model.lazy="copySelectedComponent.name"
              label="name"
              outlined
              class="pt-4"
              dense
              :rules="[rules.isValidName, isUniqueName]"
              @change="updateComponentProperty('name')"
              @submit.prevent
            />
          </v-form>
        </v-toolbar-items>
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-switch
              v-model="copySelectedComponent.disable"
              hide-details
              color="red darken-3"
              label="disable"
              @click="updateComponentProperty('disable')"
            />
          </template>
          disable
        </v-tooltip>
        <v-spacer />
        <v-toolbar-items>
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <v-btn
                v-bind="attrs"
                v-on="on"
                @click="open=false"
              >
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </template>
            close
          </v-tooltip>
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <v-btn
                :disabled="selectedComponent.state === 'not-started'"
                v-bind="attrs"
                v-on="on"
              >
                <v-icon>mdi-restore</v-icon>
              </v-btn>
            </template>
            clean
          </v-tooltip>
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <v-btn
                v-bind="attrs"
                v-on="on"
                @click="deleteComponent"
              >
                <v-icon>mdi-trash-can-outline</v-icon>
              </v-btn>
            </template>
            delete
          </v-tooltip>
        </v-toolbar-items>
      </v-toolbar>
    </template>
    <v-form
      v-model="valid"
      @submit.prevent
    >
      <v-expansion-panels
        v-model="openPanels"
        multiple
        accordion
      >
        <v-expansion-panel>
          <v-expansion-panel-header>basic</v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-textarea
              v-model.lazy="copySelectedComponent.description"
              label="description"
              outlined
              @change="updateComponentProperty('description')"
            />
            <v-autocomplete
              v-if="hasScript"
              v-model.lazy="copySelectedComponent.script"
              label="script"
              :items="scriptCandidates"
              clearable
              outlined
              @change="updateComponentProperty('script')"
            />
            <v-select
              v-if="hasHost"
              v-model.lazy="copySelectedComponent.host"
              label="host"
              :items="hostCandidates"
              outlined
              @change="updateComponentProperty('host')"
            />
            <v-switch
              v-if="hasJobScheduler"
              v-model.lazy="copySelectedComponent.useJobScheduler"
              label="use job scheduler"
              @change="updateComponentProperty('useJobScheduler')"
            />
            <v-select
              v-if="hasJobScheduler"
              v-model.lazy="copySelectedComponent.queue"
              label="queue"
              :items="queues"
              :disabled="! copySelectedComponent.useJobScheduler"
              outlined
              @change="updateComponentProperty('queue')"
            />
            <v-text-field
              v-if="hasJobScheduler"
              v-model.lazy="submitCmd"
              readonly
              label="submit command"
              :disabled="! copySelectedComponent.useJobScheduler"
              outlined
            />
            <v-text-field
              v-if="hasJobScheduler"
              v-model.lazy="copySelectedComponent.submitOption"
              label="submit option"
              :disabled="! copySelectedComponent.useJobScheduler"
              outlined
              @change="updateComponentProperty('submitOption')"
            />
            <v-text-field
              v-if="isStorage"
              v-model.lazy="copySelectedComponent.storagePath"
              label="directory path"
              outlined
              @change="updateComponentProperty('storagePath')"
            />
          </v-expansion-panel-content>
        </v-expansion-panel>
        <v-expansion-panel v-if="isTask">
          <v-expansion-panel-header>retry setting</v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-text-field
              v-model.lazy="copySelectedComponent.retry"
              label="number of retry"
              hide-details
              type="number"
              :rules="[rules.isInteger, rules.isZeroOrMore]"
              outlined
              @change="updateComponentProperty('retry')"
            />
            <v-switch
              v-model.lazy="retryByJS"
              label="use javascript expression for condition check"
            />
            <v-autocomplete
              v-if="!retryByJS"
              v-model.lazy="copySelectedComponent.retryCondition"
              label="script name for condition check"
              :items="scriptCandidates"
              clearable
              outlined
              @change="updateComponentProperty('retryCondition')"
            />
            <v-textarea
              v-if="retryByJS"
              v-model.lazy="copySelectedComponent.retryCondition"
              @change="updateComponentProperty('retryCondition')"
            />
          </v-expansion-panel-content>
        </v-expansion-panel>
        <v-expansion-panel v-if="isFor">
          <v-expansion-panel-header>loop setting</v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-form @submit.prevent>
              <v-text-field
                v-model.number="copySelectedComponent.start"
                label="start"
                type="number"
                :rules="[rules.isInteger]"
                @change="updateComponentProperty('start')"
              />
              <v-text-field
                v-model.number="copySelectedComponent.end"
                label="end"
                type="number"
                :rules="[rules.isInteger]"
                @change="updateComponentProperty('end')"
              />
              <v-text-field
                v-model.number="copySelectedComponent.step"
                label="step"
                type="number"
                :rules="[rules.isInteger]"
                @change="updateComponentProperty('step')"
              />
              <v-text-field
                v-model.number="copySelectedComponent.keep"
                label="number of instances to keep"
                type="number"
                clearable
                :rules="[rules.isValidKeepProp ]"
                @change="updateComponentProperty('keep')"
              />
            </v-form>
          </v-expansion-panel-content>
        </v-expansion-panel>
        <v-expansion-panel v-if="isForeach">
          <v-expansion-panel-header>loop setting</v-expansion-panel-header>
          <v-expansion-panel-content>
            <list-form
              :label="'foreach'"
              :items="indexList"
              @add="addToIndexList"
              @remove="removeFromIndexList"
              @update="updateIndexList"
            />
            <v-text-field
              v-model.number="copySelectedComponent.keep"
              label="number of instances to keep"
              type="number"
              @change="updateComponentProperty('keep')"
            />
          </v-expansion-panel-content>
        </v-expansion-panel>
        <v-expansion-panel v-if="isSource">
          <v-expansion-panel-header>upload setting</v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-switch
              v-model.lazy="copySelectedComponent.uploadOnDemand"
              label="upload on demand"
              @change="updateComponentProperty('uploadOnDemand')"
            />
            <v-row>
              <v-col>
                <v-autocomplete
                  v-if="!copySelectedComponent.uploadOnDemand"
                  v-model="sourceOutputFile"
                  label="source file name"
                  :items="scriptCandidates"
                  clearable
                  outlined
                  @change="updateSourceOutputFile"
                />
              </v-col>
              <v-col
                class="mt-2"
                cols="2"
                @click="deleteSourceOutputFile"
              >
                <v-btn
                  v-if="!copySelectedComponent.uploadOnDemand"
                >
                  <v-icon>mdi-trash-can-outline</v-icon>
                </v-btn>
              </v-col>
            </v-row>
          </v-expansion-panel-content>
        </v-expansion-panel>
        <v-expansion-panel v-if="isViewer">
          <v-expansion-panel-header>input file setting</v-expansion-panel-header>
          <v-expansion-panel-content>
            <list-form
              :label="'input files'"
              :items="copySelectedComponent.inputFiles"
              :new-item-template="inputFileTemplate"
              :additionalRules="[isValidInputFilename]"
              @add="addToInputFiles"
              @remove="removeFromInputFiles"
              @update="updateInputFiles"
            />
          </v-expansion-panel-content>
        </v-expansion-panel>
        <v-expansion-panel v-if="isPS">
          <v-expansion-panel-header>PS setting</v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-autocomplete
              v-model.lazy="copySelectedComponent.parameterFile"
              label="parameterFile"
              :items="scriptCandidates"
              clearable
              outlined
              @change="updateComponentProperty('parameterFile')"
            />
            <v-switch
              v-model.lazy="copySelectedComponent.forceOverwrite"
              label="force overwrite"
              @change="updateComponentProperty('forceOverwrite')"
            />
            <v-switch
              v-model.lazy="copySelectedComponent.deleteLoopInstance"
              label="delete all instances"
              @change="updateComponentProperty('deleteLoopInstance')"
            />
          </v-expansion-panel-content>
        </v-expansion-panel>
        <v-expansion-panel v-if="isStepjobTask">
          <v-expansion-panel-header>stepjobtask setting</v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-switch
              v-model.lazy="copySelectedComponent.useDependency"
              label="use dependency"
              @change="updateComponentProperty('useDependency')"
            />
            <v-text-field
              v-model="copySelectedComponent.stepnum"
              readonly
              label="step number"
              type="number"
              :disabled="! copySelectedComponent.useDependency"
            />
            <v-text-field
              v-model.lazy="copySelectedComponent.dependencyForm"
              label="dependencyForm"
              :disabled="! copySelectedComponent.useDependency"
              @change="updateComponentProperty('dependencyForm')"
            />
          </v-expansion-panel-content>
        </v-expansion-panel>
        <v-expansion-panel v-if="isBulkjobTask">
          <v-expansion-panel-header>bulkjob setting</v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-switch
              v-model.lazy="copySelectedComponent.usePSSettingFile"
              label="use parameter setting file for bulk number"
              @change="updateComponentProperty('usePSSettingFile')"
            />
            <v-autocomplete
              v-if="copySelectedComponent.usePSSettingFile"
              v-model.lazy="copySelectedComponent.parameterFile"
              label="parameter file"
              :items="scriptCandidates"
              clearable
              outlined
              @change="updateComponentProperty('parameterFile')"
            />
            <v-form
              v-if="! copySelectedComponent.usePSSettingFile"
              @submit.prevent
            >
              <v-text-field
                v-model.number="copySelectedComponent.startBulkNumber"
                label="start"
                type="number"
                @change="updateComponentProperty('startBulkNumber')"
              />
              <v-text-field
                v-model.number="copySelectedComponent.endBulkNumber"
                label="end"
                type="number"
                @change="updateComponentProperty('endBulkNumber')"
              />
            </v-form>
            <v-switch
              v-model="copySelectedComponent.manualFinishCondition"
              label="manual finish condition"
              @change="updateComponentProperty('manualFinishCondition')"
            />
            <div v-if="copySelectedComponent.manualFinishCondition">
              <v-switch
                v-model.lazy="conditionCheckByJS"
                label="use javascript expression for condition check"
              />
              <v-autocomplete
                v-if="!conditionCheckByJS"
                v-model.lazy="copySelectedComponent.condition"
                label="script name for condition check"
                :items="scriptCandidates"
                clearable
                outlined
                @change="updateComponentProperty('condition')"
              />
              <v-textarea
                v-if="conditionCheckByJS"
                v-model.lazy="copySelectedComponent.condition"
                @change="updateComponentProperty('condition')"
              />
            </div>
          </v-expansion-panel-content>
        </v-expansion-panel>
        <v-expansion-panel v-if="hasCondition">
          <v-expansion-panel-header>condition setting</v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-switch
              v-model.lazy="conditionCheckByJS"
              label="use javascript expression for condition check"
            />
            <v-autocomplete
              v-if="!conditionCheckByJS"
              v-model.lazy="copySelectedComponent.condition"
              label="script name for condition check"
              :items="scriptCandidates"
              clearable
              outlined
              @change="updateComponentProperty('condition')"
            />
            <v-textarea
              v-if="conditionCheckByJS"
              v-model.lazy="copySelectedComponent.condition"
              @change="updateComponentProperty('condition')"
            />
            <v-text-field
              v-if="isWhile"
              v-model.number="copySelectedComponent.keep"
              label="number of instances to keep"
              type="number"
              @change="updateComponentProperty('keep')"
            />
          </v-expansion-panel-content>
        </v-expansion-panel>
        <v-expansion-panel v-if="! isSource && !isViewer">
          <v-expansion-panel-header>input/output files</v-expansion-panel-header>
          <v-expansion-panel-content>
            <list-form
              :label="'input files'"
              :items="copySelectedComponent.inputFiles"
              :new-item-template="inputFileTemplate"
              :additional-rules="[isValidInputFilename]"
              @add="addToInputFiles"
              @remove="removeFromInputFiles"
              @update="updateInputFiles"
            />
            <list-form
              :label="'output files'"
              :items="copySelectedComponent.outputFiles"
              :new-item-template="outputFileTemplate"
              :additional-rules="[isValidOutputFilename]"
              @add="addToOutputFiles"
              @remove="removeFromOutputFiles"
              @update="updateOutputFiles"
            />
          </v-expansion-panel-content>
        </v-expansion-panel>
        <v-expansion-panel
          v-if="hasRemote"
          :disabled="disableRemoteSetting"
        >
          <v-expansion-panel-header>remote file setting</v-expansion-panel-header>
          <v-expansion-panel-content>
            <list-form
              :label="'include'"
              :items="includeList"
              :disabled="disableRemoteSetting"
              @add="addToIncludeList"
              @remove="removeFromIncludeList"
              @update="updateIncludeList"
            />
            <list-form
              :label="'exclude'"
              :items="excludeList"
              :disabled="disableRemoteSetting"
              @add="addToExcludeList"
              @remove="removeFromExcludeList"
              @update="updateExcludeList"
            />
            clean up flag
            <v-radio-group
              v-model="copySelectedComponent.cleanupFlag"
              :disabled="disableRemoteSetting"
              @change="updateComponentProperty('cleanupFlag')"
            >
              <v-radio
                label="remove files"
                :value="0"
              />
              <v-radio
                label="keep files"
                :value="1"
              />
              <v-radio
                label="same as parent"
                :value="2"
              />
            </v-radio-group>
          </v-expansion-panel-content>
        </v-expansion-panel>
        <v-expansion-panel>
          <v-expansion-panel-header>Files</v-expansion-panel-header>
          <v-expansion-panel-content>
            <file-browser
              v-if="! isRemoteComponent"
              :readonly="false"
              :project-root-dir="projectRootDir"
            />
            <remote-file-browser
              v-if="isRemoteComponent"
              :readonly="false"
              :project-root-dir="projectRootDir"
              ref=rfb
            />
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-form>
  </v-navigation-drawer>
</template>

<script>
  import listForm from "@/components/common/listForm.vue";
  import fileBrowser from "@/components/fileBrowser.vue";
  import remoteFileBrowser from "@/components/remoteFileBrowser.vue";
  import { isValidName } from "@/lib/utility.js";
  import { isValidInputFilename, isValidOutputFilename } from "@/lib/clientUtility.js";
  import { mapState, mapGetters, mapActions, mapMutations } from "vuex";
  import SIO from "@/lib/socketIOWrapper.js";

  const isZeroOrMore = (v) => {
    return v >= 0 ? true : "0 or more value required";
  };
  const isPositiveNumber = (v) => {
    return  v > 0 ? true : "positive value required"
  }
  const isInteger = (v)=>{
    return Number.isInteger(Number(v)) ? true : "integer value required";
  }
  const isValidKeepProp = (v)=>{
    if (v === ""){
      return true
    }
    const rt1 = isInteger(v);
    const rt2 = isZeroOrMore(v);
    return rt1 !== true ? rt1 : rt2
  }

  export default {
    name: "ComponentProperty",
    components: {
      listForm,
      fileBrowser,
      remoteFileBrowser
    },
    data: function () {
      return {
        valid: true,
        validName: true,
        inputFileTemplate: {
          name: "",
          src: [],
        },
        outputFileTemplate: {
          name: "",
          dst: [],
        },
        propWidth: "512",
        openPanels: [0],
        retryByJS: false,
        conditionCheckByJS: false,
        open: false,
        reopening: false,
        sourceOutputFile: null,
        rules:{
          isValidName,
          isZeroOrMore,
          isPositiveNumber,
          isInteger,
          isValidKeepProp
        }
      };
    },
    computed: {
      ...mapState(["selectedComponent", "copySelectedComponent", "remoteHost", "currentComponent", "scriptCandidates", "projectRootDir", "jobScheduler"]),
      ...mapGetters(["selectedComponentAbsPath", "pathSep"]),
      isRemoteComponent(){
      return this.selectedComponent.type === "storage"
                           && typeof this.selectedComponent.host === "string"
                           && this.selectedComponent.host !== "localhost";
      },
      disableRemoteSetting () {
        if(this.isStepjobTask){
          return false;
        }
        return this.copySelectedComponent.host === "localhost";
      },
      hasHost(){
        return typeof this.selectedComponent !== "undefined" && ["task", "stepjob", "bulkjobTask", "storage"].includes(this.selectedComponent.type);
      },
      hasJobScheduler(){
        return typeof this.selectedComponent !== "undefined" && ["task", "stepjob", "bulkjobTask"].includes(this.selectedComponent.type);
      },
      hasScript(){
        return typeof this.selectedComponent !== "undefined" && ["task", "stepjobTask", "bulkjobTask"].includes(this.selectedComponent.type);
      },
      hasCondition () {
        return typeof this.selectedComponent !== "undefined" && ["if", "while"].includes(this.selectedComponent.type);
      },
      hasRemote(){
        return typeof this.selectedComponent !== "undefined" && ["task", "stepjobTask", "bulkjobTask"].includes(this.selectedComponent.type);
      },
      isTask () {
        return typeof this.selectedComponent !== "undefined" && this.selectedComponent.type === "task";
      },
      isFor () {
        return typeof this.selectedComponent !== "undefined" && this.selectedComponent.type === "for";
      },
      isForeach () {
        return typeof this.selectedComponent !== "undefined" && this.selectedComponent.type === "foreach";
      },
      isWhile () {
        return typeof this.selectedComponent !== "undefined" && this.selectedComponent.type === "while";
      },
      isSource () {
        return typeof this.selectedComponent !== "undefined" && this.selectedComponent.type === "source";
      },
      isViewer() {
        return typeof this.selectedComponent !== "undefined" && this.selectedComponent.type === "viewer";
      },
      isPS () {
        return typeof this.selectedComponent !== "undefined" && this.selectedComponent.type === "parameterStudy";
      },
      isStepjobTask(){
        return typeof this.selectedComponent !== "undefined" && this.selectedComponent.type === "stepjobTask";
      },
      isBulkjobTask(){
        return typeof this.selectedComponent !== "undefined" && this.selectedComponent.type === "bulkjobTask";
      },
      isStorage(){
        return typeof this.selectedComponent !== "undefined" && this.selectedComponent.type === "storage";
      },
      excludeList (){
        if(!Array.isArray(this.copySelectedComponent.exclude)){
          return []
        }
        return this.copySelectedComponent.exclude
          .map((e)=>{
            return { name: e };
          });
      },
      includeList (){
        if(!Array.isArray(this.copySelectedComponent.include)){
          return []
        }
        return this.copySelectedComponent.include
          .map((e)=>{
            return { name: e };
          });
      },
      indexList: function () {
        return this.copySelectedComponent.indexList
          .map((e)=>{
            return { name: e };
          });
      },
      hostCandidates () {
        const hostInRemoteHost = this.remoteHost.map((e)=>{
          return e.name;
        });
        return ["localhost", ...hostInRemoteHost];
      },
      queues () {
        const currentHostSetting = this.remoteHost.find((e)=>{
          return e.name === this.copySelectedComponent.host;
        });
        return currentHostSetting && typeof currentHostSetting.queue === "string" ? currentHostSetting.queue.split(",") : [];
      },
      submitCmd(){
        const currentHostSetting = this.remoteHost.find((e)=>{
          return e.name === this.copySelectedComponent.host;
        });
        if(!currentHostSetting){
          return null;
        }
        const JS=currentHostSetting.jobScheduler;
        return JS?this.jobScheduler[JS].submit : null;
      }
    },
    watch: {
      open () {
        if (this.reopening || this.open) {
          return;
        }
        this.commitSelectedComponent(null);
      },
      selectedComponent (nv, ov) {
        if (this.selectedComponent === null || ( nv !== null && ov !== null && nv.ID === ov.ID)) {
          return;
        }
        this.sourceOutputFile = Array.isArray(this.selectedComponent.outputFiles) && this.selectedComponent.outputFiles[0] ?  this.selectedComponent.outputFiles[0].name : null
        // get script candidate
        if(!["for", "foreach", "workflow", "storage",  "viewer"].includes(this.selectedComponent.type)){
          const mode = this.selectedComponent.type === "source" ? "sourceComponent": "underComponent";
          SIO.emitGlobal("getFileList",this.projectRootDir,  {path: this.selectedComponentAbsPath, mode}, (fileList)=>{
          const scriptCandidates = fileList
            .filter((e)=>{
              return e.type === "file";
            })
            .map((e)=>{
              return e.name;
            });
            this.commitScriptCandidates(scriptCandidates);
            if(typeof this.selectedComponent.condition === "string"){
              this.conditionCheckByJS= !this.scriptCandidates.includes(this.selectedComponent.condition);
            }
            if(typeof this.selectedComponent.retryCondition=== "string"){
              this.retryByJS= !this.scriptCandidates.includes(this.selectedComponent.retryCondition);
            }
          });
        }
        this.reopening = true;
        this.openPanels = [0];
        this.open = false;
        setTimeout(()=>{
          this.open = true;
          this.reopening = false;
        }, 200);
      },
    },
    mounted () {
      if (this.selectedComponent !== null) {
        this.open = true;
      }
    },
    methods: {
      ...mapActions(["showSnackbar"]),
      ...mapMutations({
        commitScriptCandidates: "scriptCandidates",
        commitComponentTree: "componentTree",
        commitSelectedComponent: "selectedComponent",
      }),
      isValidInputFilename,
      isValidOutputFilename,
      deleteComponent () {
        SIO.emitGlobal("removeNode", this.projectRootDir, this.selectedComponent.ID, this.currentComponent.ID, (rt)=>{
          if (!rt) {
            return;
          }
          this.commitSelectedComponent(null);
          // update componentTree
          SIO.emitGlobal("getComponentTree", this.projectRootDir, this.projectRootDir, SIO.generalCallback);
        });
      },
      updateComponentProperty (prop) {
        if (prop === "name" && !this.validName) return;
        if (prop !== "name" && !this.valid) return;
        const ID = this.selectedComponent.ID;
        //[workaround] v-textfield convert input value to string even if type=number
        const newValue = ["start", "step", "end", "retry"].includes(prop) ? Number(this.copySelectedComponent[prop]): this.copySelectedComponent[prop];
        if(newValue === null && (prop === "script" || (!this.conditionCheckByJS && prop === "condition"))) return;

        // closeボタン押下時に、selectedComponentをnullにするより先に
        // blurイベントが発生してこちらの処理が走ってしまうので
        // 次行のif文の条件は常に満たさない。
        // 仕様を検討のうえ、ガードするなら何か方法を考える必要がある
        if (this.selectedComponent === null) return;

        SIO.emitGlobal("updateNode", this.projectRootDir,  ID, prop, newValue, SIO.generalCallback);
        if(this.selectedComponent.type === "storage" && prop === "path"){
          //一回componenntpropertyを閉じる
          this.$refs.rfb.connected=false;
        }
      },
      updateSourceOutputFile(){
        const name = this.sourceOutputFile
        if(name === null){
          this.deleteSourceOutputFile()
          return
        }
        if(!this.isValidOutputFilename(name)){
          this.showSnackbar(`${name} is not valid output filename`)
          return
        }
        const outputFile={name, dst: []};
        if(typeof this.selectedComponent.outputFiles[0] === "undefined"){
          this.addToOutputFiles(outputFile);
          return;
        }
        this.updateOutputFiles(outputFile, 0);
      },
      deleteSourceOutputFile(){
        this.sourceOutputFile=null;
        this.removeFromOutputFiles(this.selectedComponent.outputFiles[0], 0)
      },
      addToInputFiles(v) {
        this.copySelectedComponent.inputFiles.push(v)
        const ID = this.selectedComponent.ID;
        SIO.emitGlobal("addInputFile", this.projectRootDir, ID, v.name, this.currentComponent.ID,  SIO.generalCallback);
      },
      updateInputFiles(v, index) {
        this.copySelectedComponent.inputFiles.splice(index, 1, v);
        const ID = this.selectedComponent.ID;
        SIO.emitGlobal("renameInputFile", this.projectRootDir, ID, index, v.name, this.currentComponent.ID,  SIO.generalCallback);
      },
      removeFromInputFiles(v, index) {
        this.copySelectedComponent.inputFiles.splice(index,1)
        const ID = this.selectedComponent.ID;
        SIO.emitGlobal("removeInputFile", this.projectRootDir, ID, v.name, this.currentComponent.ID,  SIO.generalCallback);
      },
      addToOutputFiles(v) {
        this.copySelectedComponent.outputFiles.push(v)
        const ID = this.selectedComponent.ID;
        SIO.emitGlobal("addOutputFile", this.projectRootDir, ID, v.name, this.currentComponent.ID,  SIO.generalCallback);
      },
      updateOutputFiles(v, index) {
        this.copySelectedComponent.outputFiles.splice(index, 1, v);
        const ID = this.selectedComponent.ID;
        SIO.emitGlobal("renameOutputFile", this.projectRootDir, ID, index, v.name, this.currentComponent.ID,  SIO.generalCallback);
      },
      removeFromOutputFiles(v, index) {
        this.copySelectedComponent.outputFiles.splice(index,1)
        const ID = this.selectedComponent.ID;
        SIO.emitGlobal("removeOutputFile", this.projectRootDir, ID, v.name, this.currentComponent.ID,  SIO.generalCallback);
      },
      addToIndexList (v) {
        this.copySelectedComponent.indexList.push(v.name)
        this.updateComponentProperty("indexList");
      },
      updateIndexList (v, index) {
        this.copySelectedComponent.indexList.splice(index, 1, v.name);
        this.updateComponentProperty("indexList");
      },
      removeFromIndexList (v, index) {
        this.copySelectedComponent.indexList.splice(index,1)
        this.updateComponentProperty("indexList");
      },
      addToIncludeList (v) {
        this.copySelectedComponent.include.push(v.name)
        this.updateComponentProperty("include");
      },
      updateIncludeList (v, index) {
        this.copySelectedComponent.include.splice(index, 1, v.name);
        this.updateComponentProperty("include");
      },
      removeFromIncludeList (v, index) {
        this.copySelectedComponent.include.splice(index,1)
        this.updateComponentProperty("include");
      },
      addToExcludeList (v) {
        this.copySelectedComponent.exclude.push(v.name)
        this.updateComponentProperty("exclude");
      },
      removeFromExcludeList (v, index) {
        this.copySelectedComponent.exclude.splice(index,1)
        this.updateComponentProperty("exclude");
      },
      updateExcludeList (v, index) {
        this.copySelectedComponent.exclude.splice(index, 1, v.name);
        this.updateComponentProperty("exclude");
      },
      isUniqueName (v) {
        const names = this.currentComponent.descendants
          .map((e)=>{
            if (e === null) {
              return null;
            }
            if (e.name === this.selectedComponent.name) {
              return null;
            }
            return e.name;
          })
          .filter((e)=>{
            return e !== null;
          });
        return !names.some((name)=>{
          return name === this.copySelectedComponent.name;
        });
      },
    },
  };
</script>
