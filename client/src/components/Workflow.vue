/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-app>
    <nav-drawer
      v-model="drawer"
    />
    <v-app-bar
      app
      extended
    >
      <a
        href="./home"
        class="text-uppercase text-decoration-none text-h4 white--text"
      > WHEEL </a>
      <v-spacer />
      <p
        class="text-decoration-none text-h5 white--text"
        @click="projectDescription=projectJson.description;descriptionDialog=true"
      >
        {{ projectJson !== null ? projectJson.name : "" }}
      </p>
      <v-spacer />
      <v-btn
        rounded
        outlined
        :ripple="false"
        :style="{backgroundColor : stateColor}"
      >
        status: {{ projectState }}
      </v-btn>
      <v-spacer />
      <v-btn
        shaped
        outlined
        plain
        :ripple="false"
      >
        last updated: {{ projectJson !== null ? projectJson.mtime : "" }}
      </v-btn>
      <v-spacer />

      <v-app-bar-nav-icon
        app
        @click="drawer = true"
      />

      <template #extension>
        <v-btn-toggle
          v-model="mode"
          mandatory
        >
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <v-btn
                outlined
                replace
                :to="{name: 'graph' }"
                v-bind="attrs"
                v-on="on"
              >
                <v-icon>mdi-sitemap</v-icon>
              </v-btn>
            </template>
            <span>graph view</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <v-btn
                outlined
                replace
                :to="{name: 'list' }"
                v-bind="attrs"
                v-on="on"
              >
                <v-icon>mdi-format-list-bulleted</v-icon>
              </v-btn>
            </template>
            <span>list view</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <v-btn
                outlined
                replace
                :disabled="! (isEdittable && selectedComponent !== null)"
                :to="{name: 'editor' }"
                v-bind="attrs"
                v-on="on"
              >
                <v-icon>mdi-file-document-edit-outline</v-icon>
              </v-btn>
            </template>
            <span>text editor</span>
          </v-tooltip>
        </v-btn-toggle>

        <v-spacer />
        <v-card>
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <v-btn
                outlined
                icon
                :disabled="! canRun"
                v-bind="attrs"
                v-on="on"
                @click="emitProjectOperation('runProject')"
              >
                <v-icon>mdi-play</v-icon>
              </v-btn>
            </template>
            <span>run project</span>
          </v-tooltip>

          <v-tooltip
            v-if="false"
            bottom
          >
            <template #activator="{ on, attrs }">
              <v-btn
                outlined
                icon
                :disabled="! running"
                v-bind="attrs"
                v-on="on"
                @click="emitProjectOperation('pauseProject')"
              >
                <v-icon>mdi-pause</v-icon>
              </v-btn>
            </template>
            <span>pause project</span>
          </v-tooltip>

          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <v-btn
                outlined
                icon
                :disabled="canRun"
                v-bind="attrs"
                v-on="on"
                @click="emitProjectOperation('stopProject')"
              >
                <v-icon>mdi-stop</v-icon>
              </v-btn>
            </template>
            <span>stop project</span>
          </v-tooltip>

          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <v-btn
                outlined
                icon
                :disabled="canRun"
                v-bind="attrs"
                v-on="on"
                @click="emitProjectOperation('cleanProject')"
              >
                <v-icon>mdi-restore</v-icon>
              </v-btn>
            </template>
            <span>stop and cleanup project</span>
          </v-tooltip>
        </v-card>

        <v-spacer />
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              v-bind="attrs"
              :disabled="viewerDataDir === null"
              v-on="on"
              @click="openViewerScreen"
            >
              <v-icon>mdi-image-multiple-outline</v-icon>
            </v-btn>
          </template>
          <span>open viewer screen</span>
        </v-tooltip>
        <v-spacer />
        <v-card>
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <v-btn
                outlined
                :disabled="! isEdittable"
                v-bind="attrs"
                v-on="on"
                @click="emitProjectOperation('saveProject')"
              >
                <v-icon>mdi-content-save</v-icon>
              </v-btn>
            </template>
            <span>save project</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <v-btn
                outlined
                :disabled="! isEdittable"
                v-bind="attrs"
                v-on="on"
                @click="emitProjectOperation('revertProject')"
              >
                <v-icon>mdi-folder-refresh-outline</v-icon>
              </v-btn>
            </template>
            <span>revert project</span>
          </v-tooltip>
        </v-card>
      </template>
    </v-app-bar>
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
        >
          <v-icon v-if="showLogScreen">
            mdi-triangle-outline
          </v-icon>
          <v-icon v-if="!showLogScreen">
            mdi-triangle-outline mdi-rotate-180
          </v-icon>
        </v-btn>
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
    </v-footer>
    <v-overlay :value="waiting">
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
    />
    <v-snackbar
      v-model="openSnackbar"
      :vertical="true"
      :multi-line="true"
      :timeout="-1"
      centered
      text
    >
      {{ snackbarMessage }}
      <template #action="{ attrs }">
        <v-btn
          color="indigo"
          text
          v-bind="attrs"
          @click="closeSnackbar"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
    <versatile-dialog
      v-model="descriptionDialog"
      max-width="50vw"
      title="project description"
      @ok="updateDescription"
      @cancel="descriptionDialog=false"
    >
      <template slot="message">
        <v-textarea
          v-model="projectDescription"
          outlined
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
  </v-app>
</template>

<script>
  "use strict";
  import { mapState, mapMutations, mapActions, mapGetters } from "vuex";
  import logScreen from "@/components/logScreen.vue";
  import NavDrawer from "@/components/common/NavigationDrawer.vue";
  import passwordDialog from "@/components/common/passwordDialog.vue";
  import unsavedFilesDialog from "@/components/unsavedFilesDialog.vue";
  import versatileDialog from "@/components/versatileDialog.vue";
  import SIO from "@/lib/socketIOWrapper.js";
  import { readCookie, state2color } from "@/lib/utility.js";
  import Debug from "debug";
  const debug = Debug("wheel:workflow:main");
  let viewerWindow = null;

  export default {
    name: "Workflow",
    components: {
      logScreen,
      NavDrawer,
      unsavedFilesDialog,
      versatileDialog,
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
      ]),
      ...mapGetters(["waiting", "isEdittable", "canRun", "running"]),
      stateColor(){
        return state2color(this.projectState);
      }
    },
    mounted: function () {
      const projectRootDir = readCookie("rootDir");
      const path=readCookie("socketIOPath");
      SIO.init({projectRootDir}, path);
      const ID = readCookie("root");
      this.commitProjectRootDir(projectRootDir);
      this.commitRootComponentID(ID);

      SIO.onGlobal("componentTree", (componentTree)=>{
        this.commitComponentTree(componentTree);
      });
      SIO.onGlobal("showMessage", this.showSnackbar);
      SIO.onGlobal("askPassword", (hostname, cb)=>{
        this.pwCallback = (pw)=>{
          cb(pw);
        };
        this.pwDialogTitle = `input password or passphrase for ${hostname}`;
        this.pwDialog = true;
      });
      SIO.onGlobal("hostList", (hostList)=>{
        this.commitRemoteHost(hostList);
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

      // call back for log-screen
      for (const event of ["logINFO", "logWARN", "logERR", "logStdout", "logStderr", "logSSHout", "logSSHerr"]) {
        SIO.onGlobal(event, (data)=>{
          this.$refs.logscreen.logRecieved(event, data);
        });
      }
    },
    methods: {
      openViewerScreen(){
        viewerWindow = window.open("/viewer", "viewer");
        const form = document.createElement("form");
        form.setAttribute("target", "viewer");
        form.setAttribute("action", "/viewer");
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
      ...mapActions(["showSnackbar", "closeSnackbar"]),
      ...mapMutations(
        {
          commitComponentTree: "componentTree",
          commitProjectState: "projectState",
          commitComponentPath: "componentPath",
          commitCurrentComponent: "currentComponent",
          commitSelectedComponent: "selectedComponent",
          commitProjectRootDir: "projectRootDir",
          commitRootComponentID: "rootComponentID",
          commitRemoteHost: "remoteHost",
          commitJobScheduler: "jobScheduler",
          commitWaitingProjectJson: "waitingProjectJson",
          commitWaitingWorkflow: "waitingWorkflow",
        },
      ),
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
