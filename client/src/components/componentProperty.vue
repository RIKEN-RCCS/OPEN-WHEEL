/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-navigation-drawer
    v-if="selectedComponent !== null"
    v-model="open"
    location="right"
    absolute
    :width="propWidth"
  >
    <v-toolbar
        color='background'
      >
        <v-toolbar-title>
          <v-form v-model="validName"
              @submit.prevent
          >
            <v-text-field
              v-model="copySelectedComponent.name"
              label="name"
              :readonly="readOnly"
              variant=outlined
              class="pt-4"
              density=compact
              :rules="[rules.isValidName, isUniqueName]"
            />
          </v-form>
        </v-toolbar-title>
        <v-toolbar-items>
        <v-tooltip location="bottom" text="disable">
          <template #activator="{ props}">
            <v-switch
              v-model="copySelectedComponent.disable"
              :readonly="readOnly"
              hide-details
              color="error"
              label="disable"
              v-bind="props"
            />
          </template>
        </v-tooltip>
          <v-tooltip location="bottom" text="close">
            <template #activator="{ props }">
              <v-btn
                @click="closeProperty"
                v-bind="props"
                icon=mdi-close
              />
            </template>
          </v-tooltip>
          <v-tooltip location=bottom text="clean" >
            <template #activator="{ props }">
              <v-btn
                :disabled="selectedComponent.state === 'not-started'"
                v-bind="props"
                icon="mdi-restore"
              />
            </template>
          </v-tooltip>
        </v-toolbar-items>
      </v-toolbar>
    <v-form
      v-model="valid"
      @submit.prevent
    >
      <v-expansion-panels
        v-model="openPanels"
        multiple
        variant="accordion"
      >
        <v-expansion-panel title="basic">
          <v-expansion-panel-text>
            <v-textarea
              v-model="copySelectedComponent.description"
              label="description"
              :readonly="readOnly"
              variant=outlined
            />
            <v-autocomplete
              v-if="hasScript"
              v-model="copySelectedComponent.script"
              label="script"
              :readonly="readOnly"
              :items="scriptCandidates"
              clearable
              variant=outlined
            />
            <v-select
              v-if="hasHost"
              v-model="copySelectedComponent.host"
              label="host"
              :readonly="readOnly"
              :items="hostCandidates"
              variant=outlined
            />
            <v-switch
              v-if="hasJobScheduler"
              v-model="copySelectedComponent.useJobScheduler"
              label="use job scheduler"
              :readonly="readOnly"
              color="primary"
            />
            <v-select
              v-if="hasJobScheduler"
              v-model="copySelectedComponent.queue"
              label="queue"
              :readonly="readOnly"
              :items="queues"
              :disabled="! copySelectedComponent.useJobScheduler"
              variant=outlined
            />
            <v-text-field
              v-if="hasJobScheduler"
              v-model="submitCmd"
              :readonly="readOnly"
              label="submit command"
              :disabled="! copySelectedComponent.useJobScheduler"
              variant=outlined
            />
            <v-text-field
              v-if="hasJobScheduler"
              v-model="copySelectedComponent.submitOption"
              label="submit option"
              :readonly="readOnly"
              :disabled="! copySelectedComponent.useJobScheduler"
              variant=outlined
            />
            <v-text-field
              v-if="isStorage"
              v-model="copySelectedComponent.storagePath"
              label="directory path"
              :readonly="readOnly"
              variant=outlined
            />
          </v-expansion-panel-text>
        </v-expansion-panel>
        <v-expansion-panel v-if="isTask">
          <v-expansion-panel-title>retry setting</v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-text-field
              v-model="copySelectedComponent.retry"
              label="number of retry"
              :readonly="readOnly"
              hide-details
              type="number"
              :rules="[rules.isInteger, rules.isZeroOrMore]"
              variant=outlined
            />
            <v-switch
              v-model.lazy="retryByJS"
              color="primary"
              label="use javascript expression for condition check"
              :readonly="readOnly"
            />
            <v-autocomplete
              v-if="!retryByJS"
              v-model="copySelectedComponent.retryCondition"
              label="script name for condition check"
              :readonly="readOnly"
              :items="scriptCandidates"
              clearable
              variant=outlined
            />
            <v-textarea
              v-if="retryByJS"
              v-model="copySelectedComponent.retryCondition"
              :readonly="readOnly"
            />
          </v-expansion-panel-text>
        </v-expansion-panel>
        <v-expansion-panel v-if="isFor">
          <v-expansion-panel-title>loop setting</v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-form @submit.prevent>
              <v-text-field
                v-model.number="copySelectedComponent.start"
                label="start"
              :readonly="readOnly"
                type="number"
                :rules="[rules.isInteger]"
              />
              <v-text-field
                v-model.number="copySelectedComponent.end"
                label="end"
              :readonly="readOnly"
                type="number"
                :rules="[rules.isInteger]"
              />
              <v-text-field
                v-model.number="copySelectedComponent.step"
                label="step"
              :readonly="readOnly"
                type="number"
                :rules="[rules.isInteger]"
              />
              <v-text-field
                v-model.number="copySelectedComponent.keep"
                label="number of instances to keep"
              :readonly="readOnly"
                type="number"
                clearable
                :rules="[rules.isValidKeepProp ]"
              />
            </v-form>
          </v-expansion-panel-text>
        </v-expansion-panel>
        <v-expansion-panel v-if="isForeach">
          <v-expansion-panel-title>loop setting</v-expansion-panel-title>
          <v-expansion-panel-text>
            <list-form
              :label="'foreach'"
              :readonly="readOnly"
              :items="indexList"
              :edit-dialog-min-width="propWidth"
              @add="addToIndexList"
              @remove="removeFromIndexList"
              @update="updateIndexList"
            />
            <v-text-field
              v-model.number="copySelectedComponent.keep"
              label="number of instances to keep"
              :readonly="readOnly"
              type="number"
            />
          </v-expansion-panel-text>
        </v-expansion-panel>
        <v-expansion-panel v-if="isSource">
          <v-expansion-panel-title>upload setting</v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-switch
              v-model="copySelectedComponent.uploadOnDemand"
              color="primary"
              label="upload on demand"
              :readonly="readOnly"
            />
            <v-row>
              <v-col>
                <v-autocomplete
                  v-if="!copySelectedComponent.uploadOnDemand"
                  v-model="sourceOutputFile"
                  label="source file name"
              :readonly="readOnly"
                  :items="scriptCandidates"
                  clearable
                  variant=outlined
                  @update:modelValue="updateSourceOutputFile"
                />
              </v-col>
              <v-col
                class="mt-2"
                cols="2"
                @click="deleteSourceOutputFile"
              >
                <v-btn
                  v-if="!copySelectedComponent.uploadOnDemand"
                  icon=mdi-trash-can-outline
              :readonly="readOnly"
                />
              </v-col>
            </v-row>
          </v-expansion-panel-text>
        </v-expansion-panel>
        <v-expansion-panel v-if="isViewer">
          <v-expansion-panel-title>input file setting</v-expansion-panel-title>
          <v-expansion-panel-text>
            <list-form
              :label="'input files'"
              :readonly="readOnly"
              :items="copySelectedComponent.inputFiles"
              :new-item-template="inputFileTemplate"
              :additionalRules="[isValidInputFilename]"
              :edit-dialog-min-width="propWidth"
              @add="addToInputFiles"
              @remove="removeFromInputFiles"
              @update="updateInputFiles"
            />
          </v-expansion-panel-text>
        </v-expansion-panel>
        <v-expansion-panel v-if="isPS">
          <v-expansion-panel-title>PS setting</v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-autocomplete
              v-model="copySelectedComponent.parameterFile"
              label="parameterFile"
              :readonly="readOnly"
              :items="scriptCandidates"
              clearable
              variant=outlined
            />
            <v-switch
              color="primary"
              v-model="copySelectedComponent.forceOverwrite"
              label="force overwrite"
              :readonly="readOnly"
            />
            <v-switch
              color="primary"
              v-model="copySelectedComponent.deleteLoopInstance"
              label="delete all instances"
              :readonly="readOnly"
            />
          </v-expansion-panel-text>
        </v-expansion-panel>
        <v-expansion-panel v-if="isStepjobTask">
          <v-expansion-panel-title>stepjobtask setting</v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-switch
              color="primary"
              v-model="copySelectedComponent.useDependency"
              label="use dependency"
              :readonly="readOnly"
            />
            <v-text-field
              v-model="copySelectedComponent.stepnum"
              readonly
              label="step number"
              type="number"
              :disabled="! copySelectedComponent.useDependency"
            />
            <v-text-field
              v-model="copySelectedComponent.dependencyForm"
              label="dependencyForm"
              :readonly="readOnly"
              :disabled="! copySelectedComponent.useDependency"
            />
          </v-expansion-panel-text>
        </v-expansion-panel>
        <v-expansion-panel v-if="isBulkjobTask">
          <v-expansion-panel-title>bulkjob setting</v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-switch
              color="primary"
              v-model="copySelectedComponent.usePSSettingFile"
              label="use parameter setting file for bulk number"
              :readonly="readOnly"
            />
            <v-autocomplete
              v-if="copySelectedComponent.usePSSettingFile"
              v-model="copySelectedComponent.parameterFile"
              label="parameter file"
              :readonly="readOnly"
              :items="scriptCandidates"
              clearable
              variant=outlined
            />
            <v-form
              v-if="! copySelectedComponent.usePSSettingFile"
              @submit.prevent
            >
              <v-text-field
                v-model.number="copySelectedComponent.startBulkNumber"
                label="start"
              :readonly="readOnly"
                type="number"
              />
              <v-text-field
                v-model.number="copySelectedComponent.endBulkNumber"
                label="end"
              :readonly="readOnly"
                type="number"
              />
            </v-form>
            <v-switch
              color="primary"
              v-model="copySelectedComponent.manualFinishCondition"
              label="manual finish condition"
              :readonly="readOnly"
            />
            <div v-if="copySelectedComponent.manualFinishCondition">
              <v-switch
              color="primary"
                v-model.lazy="conditionCheckByJS"
                label="use javascript expression for condition check"
              :readonly="readOnly"
              />
              <v-autocomplete
                v-if="!conditionCheckByJS"
                v-model="copySelectedComponent.condition"
                label="script name for condition check"
              :readonly="readOnly"
                :items="scriptCandidates"
                clearable
                variant=outlined
              />
              <v-textarea
                v-if="conditionCheckByJS"
                v-model="copySelectedComponent.condition"
              :readonly="readOnly"
              />
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
        <v-expansion-panel v-if="hasCondition">
          <v-expansion-panel-title>condition setting</v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-switch
              color="primary"
              v-model.lazy="conditionCheckByJS"
              label="use javascript expression for condition check"
              :readonly="readOnly"
            />
            <v-autocomplete
              v-if="!conditionCheckByJS"
              v-model="copySelectedComponent.condition"
              label="script name for condition check"
              :readonly="readOnly"
              :items="scriptCandidates"
              clearable
              variant=outlined
            />
            <v-textarea
              v-if="conditionCheckByJS"
              v-model="copySelectedComponent.condition"
              :readonly="readOnly"
            />
            <v-text-field
              v-if="isWhile"
              v-model.number="copySelectedComponent.keep"
              label="number of instances to keep"
              :readonly="readOnly"
              type="number"
            />
          </v-expansion-panel-text>
        </v-expansion-panel>
        <v-expansion-panel v-if="! isSource && !isViewer">
          <v-expansion-panel-title>input/output files</v-expansion-panel-title>
          <v-expansion-panel-text>
            <list-form
              :label="'input files'"
              :readonly="readOnly"
              :items="copySelectedComponent.inputFiles"
              :new-item-template="inputFileTemplate"
              :additional-rules="[isValidInputFilename]"
              :edit-dialog-min-width="propWidth"
              @add="addToInputFiles"
              @remove="removeFromInputFiles"
              @update="updateInputFiles"
            />
            <list-form
              :label="'output files'"
              :readonly="readOnly"
              :items="copySelectedComponent.outputFiles"
              :new-item-template="outputFileTemplate"
              :additional-rules="[isValidOutputFilename]"
              :edit-dialog-min-width="propWidth"
              @add="addToOutputFiles"
              @remove="removeFromOutputFiles"
              @update="updateOutputFiles"
            />
          </v-expansion-panel-text>
        </v-expansion-panel>
        <v-expansion-panel
          v-if="hasRemote"
          :disabled="disableRemoteSetting"
        >
          <v-expansion-panel-title>remote file setting</v-expansion-panel-title>
          <v-expansion-panel-text>
            <list-form
              :label="'include'"
              :readonly="readOnly"
              :items="includeList"
              :disabled="disableRemoteSetting"
              :edit-dialog-min-width="propWidth"
              @add="addToIncludeList"
              @remove="removeFromIncludeList"
              @update="updateIncludeList"
            />
            <list-form
              :label="'exclude'"
              :readonly="readOnly"
              :items="excludeList"
              :disabled="disableRemoteSetting"
              :edit-dialog-min-width="propWidth"
              @add="addToExcludeList"
              @remove="removeFromExcludeList"
              @update="updateExcludeList"
            />
            clean up flag

            <v-radio-group
              v-model="copySelectedComponent.cleanupFlag"
              :disabled="disableRemoteSetting"
              :readonly="readOnly"
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
          </v-expansion-panel-text>
        </v-expansion-panel>
        <v-expansion-panel>
          <v-expansion-panel-title>Files</v-expansion-panel-title>
          <v-expansion-panel-text>
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
          </v-expansion-panel-text>
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
import { propWidth } from "@/lib/componentSizes.json";
const isZeroOrMore = (v)=>{
  return v >= 0 ? true : "0 or more value required";
};
const isPositiveNumber = (v)=>{
  return v > 0 ? true : "positive value required";
};
const isInteger = (v)=>{
  return Number.isInteger(Number(v)) ? true : "integer value required";
};
const isValidKeepProp = (v)=>{
  if (v === "") {
    return true;
  }
  const rt1 = isInteger(v);
  const rt2 = isZeroOrMore(v);
  return rt1 !== true ? rt1 : rt2;
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
        src: []
      },
      outputFileTemplate: {
        name: "",
        dst: []
      },
      propWidth,
      openPanels: [0],
      retryByJS: false,
      conditionCheckByJS: false,
      open: false,
      reopening: false,
      sourceOutputFile: null,
      rules: {
        isValidName,
        isZeroOrMore,
        isPositiveNumber,
        isInteger,
        isValidKeepProp
      }
    };
  },
  computed: {
    ...mapState(["selectedComponent", "copySelectedComponent", "remoteHost", "currentComponent", "scriptCandidates", "projectRootDir", "jobScheduler", "readOnly"]),
    ...mapGetters(["selectedComponentAbsPath", "pathSep"]),
    isRemoteComponent() {
      return this.selectedComponent.type === "storage"
        && typeof this.selectedComponent.host === "string"
        && this.selectedComponent.host !== "localhost";
    },
    disableRemoteSetting() {
      if (this.isStepjobTask) {
        return false;
      }
      return this.copySelectedComponent.host === "localhost";
    },
    hasHost() {
      return typeof this.selectedComponent !== "undefined" && ["task", "stepjob", "bulkjobTask", "storage"].includes(this.selectedComponent.type);
    },
    hasJobScheduler() {
      return typeof this.selectedComponent !== "undefined" && ["task", "stepjob", "bulkjobTask"].includes(this.selectedComponent.type);
    },
    hasScript() {
      return typeof this.selectedComponent !== "undefined" && ["task", "stepjobTask", "bulkjobTask"].includes(this.selectedComponent.type);
    },
    hasCondition() {
      return typeof this.selectedComponent !== "undefined" && ["if", "while"].includes(this.selectedComponent.type);
    },
    hasRemote() {
      return typeof this.selectedComponent !== "undefined" && ["task", "stepjobTask", "bulkjobTask"].includes(this.selectedComponent.type);
    },
    isTask() {
      return typeof this.selectedComponent !== "undefined" && this.selectedComponent.type === "task";
    },
    isFor() {
      return typeof this.selectedComponent !== "undefined" && this.selectedComponent.type === "for";
    },
    isForeach() {
      return typeof this.selectedComponent !== "undefined" && this.selectedComponent.type === "foreach";
    },
    isWhile() {
      return typeof this.selectedComponent !== "undefined" && this.selectedComponent.type === "while";
    },
    isSource() {
      return typeof this.selectedComponent !== "undefined" && this.selectedComponent.type === "source";
    },
    isViewer() {
      return typeof this.selectedComponent !== "undefined" && this.selectedComponent.type === "viewer";
    },
    isPS() {
      return typeof this.selectedComponent !== "undefined" && this.selectedComponent.type === "parameterStudy";
    },
    isStepjobTask() {
      return typeof this.selectedComponent !== "undefined" && this.selectedComponent.type === "stepjobTask";
    },
    isBulkjobTask() {
      return typeof this.selectedComponent !== "undefined" && this.selectedComponent.type === "bulkjobTask";
    },
    isStorage() {
      return typeof this.selectedComponent !== "undefined" && this.selectedComponent.type === "storage";
    },
    excludeList() {
      if (!Array.isArray(this.copySelectedComponent.exclude)) {
        return [];
      }
      return this.copySelectedComponent.exclude
        .map((e)=>{
          return { name: e };
        });
    },
    includeList() {
      if (!Array.isArray(this.copySelectedComponent.include)) {
        return [];
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
    hostCandidates() {
      const hostInRemoteHost = this.remoteHost.map((e)=>{
        return e.name;
      });
      return ["localhost", ...hostInRemoteHost];
    },
    queues() {
      const currentHostSetting = this.remoteHost.find((e)=>{
        return e.name === this.copySelectedComponent.host;
      });
      return currentHostSetting && typeof currentHostSetting.queue === "string"
        ? currentHostSetting.queue.split(",")
          .map((e)=>{ return e.trim(); })
        : [];
    },
    submitCmd() {
      const currentHostSetting = this.remoteHost.find((e)=>{
        return e.name === this.copySelectedComponent.host;
      });
      if (!currentHostSetting) {
        return null;
      }
      const JS = currentHostSetting.jobScheduler;
      return JS ? this.jobScheduler[JS].submit : null;
    }
  },
  watch: {
    open(newValue) {
      //another component is selected while componentProperty is open
      if (this.reopening || this.open) {
        return;
      }
      //closing
      if (newValue === false) {
        this.commitSelectedComponent(null);
      }
    },
    selectedComponent(newValue, oldValue) {
      if (this.selectedComponent === null || (newValue !== null && oldValue !== null && newValue.ID === oldValue.ID)) {
        return;
      }
      this.sourceOutputFile = Array.isArray(this.selectedComponent.outputFiles) && this.selectedComponent.outputFiles[0] ? this.selectedComponent.outputFiles[0].name : null;
      //get script candidate
      if (!["for", "foreach", "workflow", "storage", "viewer"].includes(this.selectedComponent.type)) {
        const mode = this.selectedComponent.type === "source" ? "sourceComponent" : "underComponent";
        SIO.emitGlobal("getFileList", this.projectRootDir, { path: this.selectedComponentAbsPath, mode }, (fileList)=>{
          if (Array.isArray(fileList)) {
            const scriptCandidates = fileList
              .filter((e)=>{
                return e.type === "file";
              })
              .map((e)=>{
                return e.name;
              });
            this.commitScriptCandidates(scriptCandidates);
          }
          if (typeof this.selectedComponent.condition === "string") {
            this.conditionCheckByJS = !this.scriptCandidates.includes(this.selectedComponent.condition);
          }
          if (typeof this.selectedComponent.retryCondition === "string") {
            this.retryByJS = !this.scriptCandidates.includes(this.selectedComponent.retryCondition);
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
    }
  },
  mounted() {
    if (this.selectedComponent !== null) {
      this.open = true;
    }
  },
  methods: {
    ...mapActions({
      commitSelectedComponent: "selectedComponent",
      commitShowSnackbar: "showSnackbar"
    }),
    ...mapMutations({
      commitScriptCandidates: "scriptCandidates",
      commitComponentTree: "componentTree"
    }),
    isValidInputFilename,
    isValidOutputFilename,
    closeProperty() {
      this.commitSelectedComponent(null);
      this.open = false;
    },
    updateSourceOutputFile() {
      const name = this.sourceOutputFile;
      if (name === null) {
        this.deleteSourceOutputFile();
        return;
      }
      if (!this.isValidOutputFilename(name)) {
        this.commitShowSnackbar(`${name} is not valid output filename`);
        return;
      }
      const outputFile = { name, dst: [] };
      if (typeof this.selectedComponent.outputFiles[0] === "undefined") {
        this.addToOutputFiles(outputFile);
        return;
      }
      this.updateOutputFiles(outputFile, 0);
    },
    deleteSourceOutputFile() {
      this.sourceOutputFile = null;
      this.removeFromOutputFiles(this.selectedComponent.outputFiles[0], 0);
    },
    addToInputFiles(v) {
      this.copySelectedComponent.inputFiles.push(v);
    },
    updateInputFiles(v, index) {
      this.copySelectedComponent.inputFiles.splice(index, 1, v);
    },
    removeFromInputFiles(v, index) {
      this.copySelectedComponent.inputFiles.splice(index, 1);
    },
    addToOutputFiles(v) {
      this.copySelectedComponent.outputFiles.push(v);
    },
    updateOutputFiles(v, index) {
      this.copySelectedComponent.outputFiles.splice(index, 1, v);
    },
    removeFromOutputFiles(v, index) {
      this.copySelectedComponent.outputFiles.splice(index, 1);
    },
    addToIndexList(v) {
      this.copySelectedComponent.indexList.push(v.name);
    },
    updateIndexList(v, index) {
      this.copySelectedComponent.indexList.splice(index, 1, v.name);
    },
    removeFromIndexList(v, index) {
      this.copySelectedComponent.indexList.splice(index, 1);
    },
    addToIncludeList(v) {
      this.copySelectedComponent.include.push(v.name);
    },
    updateIncludeList(v, index) {
      this.copySelectedComponent.include.splice(index, 1, v.name);
    },
    removeFromIncludeList(v, index) {
      this.copySelectedComponent.include.splice(index, 1);
    },
    addToExcludeList(v) {
      this.copySelectedComponent.exclude.push(v.name);
    },
    removeFromExcludeList(v, index) {
      this.copySelectedComponent.exclude.splice(index, 1);
    },
    updateExcludeList(v, index) {
      this.copySelectedComponent.exclude.splice(index, 1, v.name);
    },
    isUniqueName(v) {
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
        return name === v;
      });
    }
  }
};
</script>
