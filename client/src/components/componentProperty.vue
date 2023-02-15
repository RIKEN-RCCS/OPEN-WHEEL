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
              :rules="[isValidName, isUniqueName]"
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
              :rules="[zeroOrMore]"
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
              label="script name for confition check"
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
                @change="updateComponentProperty('start')"
              />
              <v-text-field
                v-model.number="copySelectedComponent.end"
                label="end"
                type="number"
                @change="updateComponentProperty('end')"
              />
              <v-text-field
                v-model.number="copySelectedComponent.step"
                label="step"
                type="number"
                @change="updateComponentProperty('step')"
              />
              <v-text-field
                v-model.number="copySelectedComponent.keep"
                label="number of instances to keep"
                type="number"
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
              @add=" (...args)=>{ updateIndexList('add', ...args)}"
              @remove="(...args)=>{ updateIndexList('remove', ...args)}"
              @update="(...args)=>{ updateIndexList('rename', ...args)}"
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
                  @change="updateSourceOutputFile(sourceOutputFile)"
                />
              </v-col>
              <v-col
                class="mt-2"
                cols="2"
                @click="deleteSourceOutputFile()"
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
              @add=" (...args)=>{ changeInputOutputFiles('addInputFile', ...args)}"
              @remove="(...args)=>{ changeInputOutputFiles('removeInputFile', ...args)}"
              @update="(...args)=>{ changeInputOutputFiles('renameInputFile', ...args)}"
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
                label="script name for confition check"
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
              label="script name for confition check"
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
              @add=" (...args)=>{ changeInputOutputFiles('addInputFile', ...args)}"
              @remove="(...args)=>{ changeInputOutputFiles('removeInputFile', ...args)}"
              @update="(...args)=>{ changeInputOutputFiles('renameInputFile', ...args)}"
            />
            <list-form
              :label="'output files'"
              :items="copySelectedComponent.outputFiles"
              :new-item-template="outputFileTemplate"
              @add=" (...args)=>{ changeInputOutputFiles('addOutputFile', ...args)}"
              @remove="(...args)=>{ changeInputOutputFiles('removeOutputFile', ...args)}"
              @update="(...args)=>{ changeInputOutputFiles('renameOutputFile', ...args)}"
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
  import { glob2Array, addGlobPattern, removeGlobPattern, updateGlobPattern } from "@/lib/clientUtility.js";
  import { mapState, mapGetters, mapMutations } from "vuex";
  import SIO from "@/lib/socketIOWrapper.js";

  const zeroOrMore = (v)=>{
    return v >= 0 ? true : "retry time must be positive value";
  };

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
        sourceOutputFile: null,
        propWidth: "512",
        openPanels: [0],
        retryByJS: false,
        conditionCheckByJS: false,
        open: false,
        reopening: false,
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
      includeList: function () {
        if (typeof this.copySelectedComponent.include !== "string") {
          return [];
        }
        return glob2Array(this.copySelectedComponent.include)
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
      excludeList: function () {
        if (typeof this.copySelectedComponent.exclude !== "string") {
          return [];
        }
        return glob2Array(this.copySelectedComponent.exclude)
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
        // get script candidate
        if(["for", "foreach", "workflow", "storage",  "viewer"].includes(this.selectedComponent.type)){
          return;
        }
        const mode = this.selectedComponent.type === "source" ? "sourceComponent": "underComponent";
        SIO.emitGlobal("getFileList",this.projectRootDir,  {path:this.selectedComponentAbsPath, mode}, (fileList)=>{
        const scriptCandidates = fileList
          .filter((e)=>{
            return e.type === "file";
          })
          .map((e)=>{
            return e.name;
          });
          this.commitScriptCandidates(scriptCandidates);
        });
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
      ...mapMutations({
        commitScriptCandidates: "scriptCandidates",
        commitComponentTree: "componentTree",
        commitSelectedComponent: "selectedComponent",
      }),
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
      deleteSourceOutputFile(){
        this.changeInputOutputFiles("removeOutputFile", this.selectedComponent.outputFiles[0] );
        this.selectedComponent.outputFiles.pop();
        this.sourceOutputFile=null;
      },
      updateSourceOutputFile(name){
        if(name===null){
          return;
        }
        const outputFile={name, dst: []};
        const event = typeof this.selectedComponent.outputFiles[0] === "undefined"
          || typeof this.selectedComponent.outputFiles[0].name === "undefined"
          ? "addOutputFile" :"renameOutputFile";
        this.changeInputOutputFiles(event , outputFile, 0);
        this.selectedComponent.outputFiles[0] = outputFile;
      },
      changeInputOutputFiles (event, v, index) {
        if (!this.valid) return;
        const ID = this.selectedComponent.ID;
        // event がrenameInputFile, renameOutputFileの時だけindex引数をもってくれば良い
        if (event === "renameInputFile" || event === "renameOutputFile") {
          SIO.emitGlobal(event, this.projectRootDir, ID, index, v.name, this.currentComponent.ID,  SIO.generalCallback);
          return;
        }
        SIO.emitGlobal(event, this.projectRootDir, ID, v.name, this.currentComponent.ID,  SIO.generalCallback);
      },
      updateIndexList (op, e, index) {
        if (op === "add") {
          this.copySelectedComponent.indexList.push(e.name);
        } else if (op === "remove") {
          this.copySelectedComponent.indexList.splice(index, 1);
        } else if (op === "rename") {
          this.copySelectedComponent.indexList[index] = e.name;
        } else {
          return;
        }
        const ID = this.selectedComponent.ID;
        const newValue = this.copySelectedComponent.indexList;
        SIO.emitGlobal("updateNode", this.projectRootDir, ID, "indexList", newValue, SIO.generalCallback);
      },
      updateComponentProperty (prop) {
        if (prop === "name" && !this.validName) return;
        if (prop !== "name" && !this.valid) return;
        const ID = this.selectedComponent.ID;
        const newValue = this.copySelectedComponent[prop];
        if(newValue === null && (prop === "script" || (!this.conditionCheckByJS && prop === "condition"))) return;

        // closeボタン押下時に、selectedComponentをnullにするより先に
        // blurイベントが発生してこちらの処理が走ってしまうので
        // 次行のif文の条件は常に満たさない。
        // 仕様を検討のうえ、ガードするなら何か方法を考える必要がある
        if (this.selectedComponent === null) return;

        SIO.emitGlobal("updateNode", this.projectRootDir,  ID, prop, newValue, SIO.generalCallback);
      },
      addToIncludeList (v) {
        this.copySelectedComponent.include = addGlobPattern(this.copySelectedComponent.include, v.name);
        this.updateComponentProperty("include");
      },
      addToExcludeList (v) {
        this.copySelectedComponent.exclude = addGlobPattern(this.copySelectedComponent.exclude, v.name);
        this.updateComponentProperty("exclude");
      },
      removeFromIncludeList (v, index) {
        this.copySelectedComponent.include = removeGlobPattern(this.copySelectedComponent.include, v.name, index);
        this.updateComponentProperty("include");
      },
      removeFromExcludeList (v, index) {
        this.copySelectedComponent.exclude = removeGlobPattern(this.copySelectedComponent.exclude, v.name, index);
        this.updateComponentProperty("exclude");
      },
      updateIncludeList (v, index) {
        this.copySelectedComponent.include = updateGlobPattern(this.copySelectedComponent.include, v.name, index);
        this.updateComponentProperty("include");
      },
      updateExcludeList (v, index) {
        this.copySelectedComponent.include = updateGlobPattern(this.copySelectedComponent.include, v.name, index);
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
      isValidName,
      zeroOrMore,
    },
  };
</script>
