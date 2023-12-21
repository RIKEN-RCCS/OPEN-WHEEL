/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-app>
    <nav-drawer
      v-model="drawer"
      :base-url="baseURL"
    />
    <application-tool-bar
      title="workflow"
      @navIconClick="drawer=!drawer"
      :base-url="baseURL"
    >
      <template #append>
      <span
        class="text-decoration-none text-h5 white--text"
        @click="projectDescription=projectJson.description;descriptionDialog=true"
      >
        {{ projectJson !== null ? projectJson.name : "" }}
      </span>
      <v-spacer />
      <v-btn
        rounded
        variant=outlined
        :ripple="false"
        :style="{backgroundColor : stateColor}"
      >
        status: {{ projectState }}
      </v-btn>
      <v-spacer />
      <v-btn
        shaped
        variant=outlined
        plain
        :ripple="false"
      >
        last updated: {{ projectJson !== null ? projectJson.mtime : "" }}
      </v-btn>
      <v-spacer />
      </template >
      <template #extension>
        <v-btn-toggle
          v-model="mode"
          mandatory
        >
          <v-tooltip text="graph view" location="bottom">
            <template #activator="{ props }">
              <v-btn
                variant=outlined
                replace
                :to="{name: 'graph' }"
                icon="mdi-sitemap"
                v-bind="props"
              />
            </template>
          </v-tooltip>
          <v-tooltip text="list view" location="bottom">
            <template #activator="{ props }">
              <v-btn
                variant=outlined
                replace
                :to="{name: 'list' }"
                v-bind="props"
                icon="mdi-format-list-bulleted"
              />
            </template>
          </v-tooltip>
          <v-tooltip text="text editor" location="bottom">
            <template #activator="{ props }">
              <v-btn
                variant=outlined
                replace
                :disabled="selectedComponent === null || selectedFile === null"
                :to="{name: 'editor' }"
                v-bind="props"
                icon="mdi-file-document-edit-outline"
              />
            </template>
          </v-tooltip>
        </v-btn-toggle>
        <v-spacer />
        <v-card>
          <v-tooltip text="run project" location=bottom>
            <template #activator="{ props }">
              <v-btn
                variant=outlined
                :disabled="! runProjectAllowed"
                v-bind="props"
                @click="emitProjectOperation('runProject')"
                icon="mdi-play"
              />
            </template>
          </v-tooltip>

          <!-- <v-tooltip text="pause project" location="bottom"> -->
          <!--   <template #activator="{ props }"> -->
          <!--     <v-btn -->
          <!--       variant=outlined -->
          <!--       icon="mdi-pause" -->
          <!--       :disabled="! pauseProjectAllowed" -->
          <!--       v-bind="props" -->
          <!--       @click="openProjectOperationComfirmationDialog('pauseProject')" -->
          <!--     /> -->
          <!--   </template> -->
          <!-- </v-tooltip> -->
          <v-tooltip text="stop project" location="bottom">
            <template #activator="{ props }">
              <v-btn
                variant=outlined
                icon="mdi-stop"
                :disabled="! stopProjectAllowed"
                v-bind="props"
                @click="openProjectOperationComfirmationDialog('stopProject')"
              />
            </template>
          </v-tooltip>
          <v-tooltip text="cleanup project" location=bottom>
            <template #activator="{ props }">
              <v-btn
                variant=outlined
                icon="mdi-restore"
                :disabled="! cleanProjectAllowed"
                v-bind="props"
                @click="openProjectOperationComfirmationDialog('cleanProject')"
              >
              </v-btn>
            </template>
          </v-tooltip>
        </v-card>

        <v-spacer />
        <v-tooltip text="open viewer screen" location=bottom>
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              :disabled="viewerDataDir === null"
              @click="openViewerScreen"
              icon="mdi-image-multiple-outline"
            />
          </template>
        </v-tooltip>
        <v-spacer />
        <v-card>
          <v-tooltip text="save project" location="bottom">
            <template #activator="{ props }">
              <v-btn
                variant=outlined
                rounded=0
                :disabled="! saveProjectAllowed"
                v-bind="props"
                @click="emitProjectOperation('saveProject')"
                icon="mdi-content-save"
              />
            </template>
          </v-tooltip>
          <v-tooltip text="revert project" location="bottom">
            <template #activator="{ props }">
              <v-btn
                rounded=0
                variant=outlined
                :disabled="! revertProjectAllowed"
                v-bind="props"
                icon="mdi-folder-refresh-outline"
                @click="openProjectOperationComfirmationDialog('revertProject')"
              />
            </template>
          </v-tooltip>
        </v-card>
      </template>
    </application-tool-bar>
    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>
    <v-footer app>
      <v-row
        justify="center"
        no-gutters
      >
        <v-btn
          @click="showLogScreen=!showLogScreen"
          :icon="`mdi-triangle-outline ${showLogScreen? '':'mdi-rotate-180'}`"
        />
        <v-col
          cols="12"
        >
          <log-screen
            v-show="showLogScreen"
            ref="logscreen"
            :show="showLogScreen"
          />
        </v-col>
      </v-row>
    <v-snackbar
      v-model="openSnackbar"
      multi-line
      :timeout="-1"
      centered
      variant="outlined"
    >
      {{ snackbarMessage }}
      <template #actions>
        <v-btn
          class="justify-end"
          variant="outlined"
          @click="closeSnackbar"
          text="Close"
        />
      </template>
    </v-snackbar>
    </v-footer>
    <v-overlay
      :model-value="waiting"
      class="align-center justify-center"
    >
      <v-progress-circular
        indeterminate
        size="64"
      />
    </v-overlay>
    <unsaved-files-dialog
      :unsaved-files="unsavedFiles"
      :dialog="showUnsavedFilesDialog"
      @closed="unsavedFilesDialogClosed"
    />
    <password-dialog
      v-model="pwDialog"
      :title="pwDialogTitle"
      @password="pwCallback"
      @cancel="pwCallback(null)"
    />
    <versatile-dialog
      v-model="descriptionDialog"
      max-width="50vw"
      title="project description"
      @ok="updateDescription"
      @cancel="descriptionDialog=false"
    >
      <template #message>
        <v-textarea
          v-model="projectDescription"
          variant=outlined
        />
      </template>
    </versatile-dialog>
    <versatile-dialog
      v-model="viewerScreenDialog"
      max-width="50vw"
      title="open viewer screen"
      @ok="openViewerScreen();viewerScreenDialog=false"
      @cancel="viewerScreenDialog=false"
    />
    <versatile-dialog
      v-model="dialog"
      max-width="50vw"
      :title=dialogTitle
      :message=dialogMessage
      @ok="confirmed();dialog=false"
      @cancel="dialog=false"
    />
    <versatile-dialog
      v-model="selectSourceFileDialog"
      max-width="50vw"
      :title="selectSourceFileDialogTitle"
      @ok="selectSourceFileDialogCallback(true)"
      @cancel="selectSourceFileDialogCallback(false)"
    >
      <template slot="message">
        <v-data-table
          v-model="selectedSourceFilenames"
          :items="sourceFileCandidates"
          item-key="filename"
          :headers="[{key: 'filename', title: 'filename'}]"
          disable-filterling
          disable-pagination
          hide-default-header
          show-select
          :single-select="true"
        >
          <template #bottom />
        </v-data-table>
      </template>
    </versatile-dialog>
    <source-file-upload-dialog 
      v-model="uploadSourceFileDialog"
    />
  </v-app>
</template>

<script>
"use strict";
import { mapState, mapMutations, mapActions, mapGetters } from "vuex";
import applicationToolBar from "@/components/common/applicationToolBar.vue";
import logScreen from "@/components/logScreen.vue";
import NavDrawer from "@/components/common/NavigationDrawer.vue";
import passwordDialog from "@/components/common/passwordDialog.vue";
import unsavedFilesDialog from "@/components/unsavedFilesDialog.vue";
import sourceFileUploadDialog from "@/components/uploadSourceFileDialog.vue";
import versatileDialog from "@/components/versatileDialog.vue";
import SIO from "@/lib/socketIOWrapper.js";
import { readCookie, state2color } from "@/lib/utility.js";
import Debug from "debug";
const debug = Debug("wheel:workflow:main");

const allowedOperations={
  "not-started":["runProject", "saveProject", "revertProject"],
  "prepareing" :[],
  "running" :["stopProject"],
  "stopped":["cleanProject"],
  "finished":["cleanProject"],
  "failed":["cleanProject"],
  "unknown":["cleanProject"],
  "holding":["cleanProject"],
  "paused":[],
}
const isAllowed = (state, operation)=>{
  if(! allowedOperations[state]){
    return false
  }
  return allowedOperations[state].includes(operation)
}

export default {
  name: "Workflow",
  components: {
    logScreen,
    applicationToolBar,
    NavDrawer,
    unsavedFilesDialog,
    versatileDialog,
    sourceFileUploadDialog,
    passwordDialog,
  },
  data: ()=>{
    return {
      projectJson: null,
      drawer: false,
      mode: 0,
      showLogScreen: false,
      pwDialog: false,
      pwDialogTitle: "",
      pwCallback: ()=>{},
      descriptionDialog: false,
      viewerScreenDialog: false,
      projectDescription: "",
      cb: null,
      unsavedFiles:[],
      showUnsavedFilesDialog:false,
      viewerDataDir: null,
      firstViewDataAlived: false,
      selectSourceFileDialog:false,
      sourceFileCandidates:[],
      selectedSourceFilenames:[],
      selectSourceFileDialogTitle: "",
      uploadSourceFileDialog:false,
      dialog:false,
      dialogTitle:"",
      dialogMessage:"",
      confirmed:null,
      baseURL:"."
    };
  },
  computed: {
    ...mapState([
      "projectState",
      "rootComponentID",
      "openSnackbar",
      "currentComponent",
      "snackbarMessage",
      "projectRootDir",
      "selectedComponent",
      "selectedFile",
    ]),
    ...mapGetters(["waiting"]),
    stateColor(){
      return state2color(this.projectState);
    },
    selectedSourceFilename(){
      return this.selectedSourceFilenames[0].filename;
    },
    runProjectAllowed(){
      return isAllowed(this.projectState, "runProject")
    },
    pauseProjectAllowed(){
      return isAllowed(this.projectState, "pauseProject")
    },
    saveProjectAllowed(){
      return isAllowed(this.projectState, "saveProject")
    },
    revertProjectAllowed(){
      return isAllowed(this.projectState, "revertProject")
    },
    stopProjectAllowed(){
      return isAllowed(this.projectState, "stopProject")
    },
    cleanProjectAllowed(){
      return isAllowed(this.projectState, "cleanProject")
    },
  },
  mounted: function () {
    let projectRootDir = sessionStorage.getItem("projectRootDir")
    if(projectRootDir === "not-set"){
      projectRootDir = readCookie("rootDir");
      sessionStorage.setItem("projectRootDir", projectRootDir);
    }
    this.commitProjectRootDir(projectRootDir);

    const socketIOPath=readCookie("socketIOPath");
    debug(`beseURL=${socketIOPath}`);
    this.baseURL=this.$router.options.history.base || ".";
    SIO.init({projectRootDir}, socketIOPath);

    const ID = readCookie("root");
    this.commitRootComponentID(ID);

    SIO.onGlobal("askPassword", (hostname, cb)=>{
      this.pwCallback = (pw)=>{
        cb(pw);
      };
      this.pwDialogTitle = `input password or passphrase for ${hostname}`;
      this.pwDialog = true;
    });
    SIO.onGlobal("askSourceFilename", ( ID, name, description, candidates, cb)=>{
      this.selectSourceFileDialogTitle=`select source file for ${name}`;
      this.sourceFileCandidates=candidates.map((filename)=>{
        return {filename};
      });

      this.selectSourceFileDialogCallback=(result)=>{
        cb(result ? this.selectedSourceFilename : null);
        this.selectedSourceFilenames=[];
        this.sourceFileCandidates=[];
        this.selectSourceFileDialog=false;
      };
      this.selectSourceFileDialog=true;
    });
    SIO.onGlobal("componentTree", (componentTree)=>{
      this.commitComponentTree(componentTree);
    });
    SIO.onGlobal("showMessage", this.showSnackbar);
    SIO.onGlobal("logERR", (message)=>{
      const rt=/^\[.*ERROR\].*- *(.*?)$/m.exec(message)
      const output= rt ? rt[1] || rt[0] : message;
      this.showSnackbar(output)
    });
    SIO.onGlobal("hostList", this.commitRemoteHost);
    SIO.onGlobal("projectState", (state)=>{
      this.commitProjectState(state.toLowerCase());
    });
    SIO.onGlobal("projectJson", (projectJson)=>{
      this.projectJson = projectJson;
      this.commitProjectState(projectJson.state.toLowerCase());
      this.commitComponentPath(projectJson.componentPath);
      this.commitWaitingProjectJson(false);
    });
    SIO.onGlobal("workflow", (wf)=>{
      if(this.currentComponent!==null && wf.ID !== this.currentComponent.ID){
        this.commitSelectedComponent(null);
      }
      this.commitCurrentComponent(wf);

      if(this.selectedComponent){
        const update = wf.descendants.find((e)=>{
          return e.ID === this.selectedComponent.ID;
        });
        if(update){
          this.commitSelectedComponent(update);
        }
      }
      this.commitWaitingWorkflow(false);
    });
    SIO.onGlobal("unsavedFiles", (unsavedFiles, cb)=>{
      if (unsavedFiles.length === 0) {
        return;
      }
      this.cb = cb;
      this.unsavedFiles.splice(0, this.unsavedFiles.length, ...unsavedFiles);
      this.showUnsavedFilesDialog= true;
    });
    SIO.onGlobal("resultFilesReady", (dir)=>{
      this.viewerDataDir=dir;

      if(! this.firstViewDataAlived){
        this.viewerScreenDialog=true;
        this.firstViewDataAlived=true;
      }
      return;
    });

    //call back for log-screen
    for (const event of ["logINFO", "logWARN", "logERR", "logStdout", "logStderr", "logSSHout", "logSSHerr"]) {
      SIO.onGlobal(event, (data)=>{
        this.$refs.logscreen.logRecieved(event, data);
      });
    }

    SIO.emitGlobal("getHostList", (hostList)=>{
      this.commitRemoteHost(hostList);
    });
    SIO.emitGlobal("getJobSchedulerList", (JSList)=>{
      this.commitJobScheduler(JSList);
    });
    SIO.emitGlobal("getComponentTree", projectRootDir, projectRootDir, SIO.generalCallback);

    this.commitWaitingProjectJson(true);
    SIO.emitGlobal("getProjectJson", projectRootDir, (rt)=>{
      debug("getProjectJson done", rt);
    });
    this.commitWaitingWorkflow(true);
    SIO.emitGlobal("getWorkflow", projectRootDir, ID, (rt)=>{
      debug("getWorkflow done", rt);
    });
    this.$router.replace({ name: "graph" })
      .catch((err)=>{
        if (err.name === "NavigationDuplicated") {
          return;
        }
        throw err;
      });
  },
  methods: {
    openViewerScreen(){
      const form = document.createElement("form");
      form.setAttribute("target", `${this.baseURL}/viewer`);
      form.setAttribute("action", `${this.baseURL}/viewer`);
      form.setAttribute("method", "post");
      form.style.display = "none";
      document.body.appendChild(form);
      const input = document.createElement("input");
      input.setAttribute("type", "hidden");
      input.setAttribute("name", "dir");
      input.setAttribute("value", this.viewerDataDir);
      form.appendChild(input);
      const input2 = document.createElement("input");
      input2.setAttribute("type", "hidden");
      input2.setAttribute("name", "rootDir");
      input2.setAttribute("value", this.projectRootDir);
      form.appendChild(input2);
      form.submit();
    },
    unsavedFilesDialogClosed(...args){
      this.unsavedFiles.splice(0);
      this.cb(args);
      this.showUnsavedFilesDialog=false;
    },
    ...mapActions({
      showSnackbar:"showSnackbar",
      closeSnackbar:"closeSnackbar",
      commitSelectedComponent: "selectedComponent"
    }),
    ...mapMutations({
      commitComponentTree: "componentTree",
      commitProjectState: "projectState",
      commitComponentPath: "componentPath",
      commitCurrentComponent: "currentComponent",
      commitProjectRootDir: "projectRootDir",
      commitRootComponentID: "rootComponentID",
      commitRemoteHost: "remoteHost",
      commitJobScheduler: "jobScheduler",
      commitWaitingProjectJson: "waitingProjectJson",
      commitWaitingWorkflow: "waitingWorkflow",
    }),
    emitProjectOperation (operation) {
      if(operation === "cleanProject"){
        this.firstViewDataAlived=false;
      }
      if(operation === "stopProject" || operation === "cleanProject"){
        this.commitWaitingWorkflow(true);
      }
      SIO.emitGlobal(operation, this.projectRootDir, (rt)=>{
        debug(operation, "done", rt);

        if(operation === "stopProject" || operation === "cleanProject"){
          this.commitWaitingWorkflow(false);
        }
        if(operation === "cleanProject"){
          this.viewerDataDir=null;
        }
      });
    },
    openProjectOperationComfirmationDialog(operation){
      if(["stopProject","cleanProject","pauseProject","revertProject"].includes(operation)){
        this.dialogTitle=operation
        this.dialogMessage=`are you sure you want to ${operation.replace("P", " p")} ?`
        this.confirmed=this.emitProjectOperation.bind(this, operation);
        this.dialog=true
      }
    },
    updateDescription(){
      SIO.emitGlobal("updateProjectDescription", this.projectRootDir,  this.projectDescription,(rt)=>{
        if(rt){
          this.projectJson.description=this.projectDescription;
          this.projectDescription="";
        }
      });
      this.descriptionDialog=false;
    }
  },
};
</script>
