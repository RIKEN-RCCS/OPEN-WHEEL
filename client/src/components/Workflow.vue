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
      @open-remotehost-manager="remoteHostDialog=true"
    />
    <application-tool-bar
      title="workflow"
      :base-url="baseURL"
      @nav-icon-click="drawer=!drawer"
      @show-toast="showSnackbar"
    >
      <template #append>
        <v-tooltip
          location="bottom"
          :text="projectJson?.description"
          :disabled="!projectJson?.description"
        >
          <template #activator="{ props }">
            <span
              v-bind="props"
              class="text-decoration-none text-h5 white--text"
              data-cy="workflow-project_name-text"
              @click="projectDescription=projectJson?.description;descriptionDialog=true"
            >
              {{ projectJson !== null ? projectJson.name : "" }}
            </span>
          </template>
        </v-tooltip>
        <v-spacer />
        <v-btn
          rounded
          variant="outlined"
          :ripple="false"
          :style="{backgroundColor : stateColor}"
          data-cy="workflow-project_state-btn"
        >
          status: {{ projectState }}{{ isReadOnly }}
        </v-btn>
        <v-spacer />
        <v-btn
          shaped
          variant="outlined"
          plain
          :ripple="false"
        >
          last updated: {{ projectJson !== null ? projectJson.mtime : "" }}
        </v-btn>
        <v-spacer />
      </template>
      <template #extension>
        <v-btn-toggle
          v-model="mode"
          mandatory
        >
          <v-tooltip
            text="graph view"
            location="bottom"
          >
            <template #activator="{ props }">
              <v-btn
                variant="outlined"
                replace
                :to="{name: 'graph' }"
                icon="mdi-sitemap"
                v-bind="props"
                data-cy="workflow-graph_view-btn"
              />
            </template>
          </v-tooltip>
          <v-tooltip
            text="list view"
            location="bottom"
          >
            <template #activator="{ props }">
              <v-btn
                variant="outlined"
                replace
                :to="{name: 'list' }"
                v-bind="props"
                icon="mdi-format-list-bulleted"
              />
            </template>
          </v-tooltip>
        </v-btn-toggle>
        <v-spacer />
        <v-card>
          <v-tooltip
            text="run project"
            location="bottom"
          >
            <template #activator="{ props }">
              <v-btn
                variant="outlined"
                :disabled="! runProjectAllowed"
                v-bind="props"
                icon="mdi-play"
                data-cy="workflow-play-btn"
                @click="emitProjectOperation('runProject')"
              />
            </template>
          </v-tooltip>
          <v-tooltip
            text="stop project"
            location="bottom"
          >
            <template #activator="{ props }">
              <v-btn
                variant="outlined"
                icon="mdi-stop"
                :disabled="! stopProjectAllowed"
                v-bind="props"
                @click="openProjectOperationComfirmationDialog('stopProject')"
              />
            </template>
          </v-tooltip>
          <v-tooltip
            text="cleanup project"
            location="bottom"
          >
            <template #activator="{ props }">
              <v-btn
                variant="outlined"
                icon="mdi-restore"
                :disabled="! cleanProjectAllowed"
                data-cy="workflow-cleanup_project-btn"
                v-bind="props"
                @click="openProjectOperationComfirmationDialog('cleanProject')"
              />
            </template>
          </v-tooltip>
        </v-card>

        <v-spacer />
        <v-tooltip
          text="open viewer screen"
          location="bottom"
        >
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              :disabled="viewerDataDir === null"
              icon="mdi-image-multiple-outline"
              data-cy="workflow-open_viewer_screen-btn"
              @click="openViewerScreen"
            />
          </template>
        </v-tooltip>
        <v-spacer />
        <v-card>
          <v-tooltip
            text="force edit"
            location="bottom"
          >
            <template #activator="{ props }">
              <v-btn
                v-if="forceEditAllowed"
                icon="mdi-pencil-lock-outline"
                rounded="0"
                variant="outlined"
                v-bind="props"
                :style="{backgroundColor : readOnlyColor}"
                @click="forceEditDialog=true"
              />
            </template>
          </v-tooltip>
          <v-tooltip
            text="validation check"
            location="bottom"
          >
            <template #activator="{ props }">
              <v-btn
                variant="outlined"
                rounded="0"
                :disabled="! checkProjectAllowed"
                v-bind="props"
                icon="mdi-check-outline"
                @click="checkComponents"
              />
            </template>
          </v-tooltip>
          <v-tooltip
            text="save project"
            location="bottom"
          >
            <template #activator="{ props }">
              <v-btn
                variant="outlined"
                rounded="0"
                :disabled="! saveProjectAllowed"
                v-bind="props"
                icon="mdi-content-save"
                data-cy="workflow-save-text"
                @click="emitProjectOperation('saveProject')"
              />
            </template>
          </v-tooltip>
          <v-tooltip
            text="revert project"
            location="bottom"
          >
            <template #activator="{ props }">
              <v-btn
                rounded="0"
                variant="outlined"
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
          :icon="`mdi-triangle-outline ${showLogScreen? '':'mdi-rotate-180'}`"
          @click="showLogScreen=!showLogScreen"
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
        :timeout="snackbarTimeout"
        centered
        variant="outlined"
      >
        {{ snackbarMessage }}
        <template #actions>
          <v-btn
            class="justify-end"
            variant="outlined"
            text="Close"
            @click="closeSnackbar"
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
      @commit="commitFiles"
    />
    <password-dialog
      v-model="pwDialog"
      :hostname="pwHostname"
      :mode="pwMode"
      :jwt-server-u-r-l="pwJwtServerURL"
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
          variant="outlined"
        />
      </template>
    </versatile-dialog>
    <versatile-dialog
      v-model="viewerScreenDialog"
      max-width="50vw"
      title="open viewer screen"
      data-cy="workflow-viewer_screen-dialog"
      @ok="openViewerScreen();viewerScreenDialog=false"
      @cancel="viewerScreenDialog=false"
    />
    <versatile-dialog
      v-model="dialog"
      max-width="50vw"
      :title="dialogTitle"
      :message="dialogMessage"
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
      <template #message>
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
    <versatile-dialog
      v-model="forceEditDialog"
      max-width="50vw"
      title="Are you sure you want to edit read-only project ?"
      @ok="makeWritable();forceEditDialog=false"
      @cancel="forceEditDialog=false"
    >
      <template #message>
        <div>
          it may cause some problem.
          <ul>
            <li> Inconsistencies arise with the results of previous runs </li>
            <li> After saving project you can not revert project to what it was before project run started</li>
          </ul>
        </div>
      </template>
    </versatile-dialog>
    <v-card
      v-if="validationErrorDialog"
      class="validation-error-panel"
      :style="{ left: errorPanelX + 'px', top: errorPanelY + 'px' }"
      elevation="8"
    >
      <v-card-title
        class="validation-error-panel-title"
        @mousedown="startDragErrorPanel"
      >
        <v-icon color="warning">
          mdi-alert
        </v-icon>
        validation error detected!
      </v-card-title>
      <v-card-text class="validation-error-panel-content">
        <v-text-field
          v-model="validationErrorFilter"
          label="filter"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          hide-details
          single-line
        />
        <v-data-table
          v-model:sort-by="validationErrorsSortBy"
          :items="validationErrors"
          :headers="validationErrorTableHeader"
          :search="validationErrorFilter"
          density="compact"
        >
          <template #item.errors="{ item }">
            <ul>
              <li
                v-for="(e, i) in item.errors"
                :key="i"
              >
                {{ e.message }}
              </li>
            </ul>
          </template>
        </v-data-table>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          :disabled="!canIgnoreAllErrors"
          prepend-icon="mdi-skip-forward"
          @click="onIgnoreAllErrors"
        >
          ignore all errors
        </v-btn>
        <v-btn
          prepend-icon="mdi-close"
          @click="closeValidationErrorDialog"
        >
          close
        </v-btn>
      </v-card-actions>
    </v-card>
    <import-warning-dialog
      v-model="warnDialog"
    />
    <v-dialog
      v-model="remoteHostDialog"
      max-width="90vw"
      persistent
    >
      <v-card>
        <v-card-title data-cy="workflow-remote_host_management-title">
          Remote Host Management
        </v-card-title>
        <v-card-text>
          <remotehost-manager
            :show-snackbar-func="showSnackbar"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            prepend-icon="mdi-close"
            text="Close"
            data-cy="workflow-remote_host_close-btn"
            @click="remoteHostDialog=false"
          />
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="textEditorDialog"
      max-width="95vw"
      max-height="90vh"
      persistent
    >
      <v-card
        height="90vh"
        class="dialog-border"
      >
        <v-card-title
          data-cy="workflow-text_editor-title"
          class="d-flex align-center"
        >
          <span>Text Editor</span>
          <v-spacer />
          <v-btn
            icon="mdi-close"
            variant="text"
            data-cy="workflow-text_editor_close-btn"
            @click="closeTextEditor"
          />
        </v-card-title>
        <v-card-text class="pa-1 overflow-hidden editor-content">
          <text-editor-manager
            ref="textEditorManager"
            class="fill-height"
          />
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script>
"use strict";
import { mapState, mapMutations, mapActions, mapGetters } from "vuex";
import applicationToolBar from "../components/common/applicationToolBar.vue";
import logScreen from "../components/logScreen.vue";
import NavDrawer from "../components/common/NavigationDrawer.vue";
import passwordDialog from "../components/common/passwordDialog.vue";
import unsavedFilesDialog from "../components/unsavedFilesDialog.vue";
import sourceFileUploadDialog from "../components/uploadSourceFileDialog.vue";
import versatileDialog from "../components/versatileDialog.vue";
import SIO from "../lib/socketIOWrapper.js";
import { readCookie, state2color } from "../lib/utility.js";
import Debug from "debug";
import allowedOperations from "../../../common/allowedOperations.js";
import importWarningDialog from "../components/importWarningDialog.vue";
import remotehostManager from "../components/remotehost/remotehostManager.vue";
import textEditorManager from "../components/textEditorManager.vue";

const debug = Debug("wheel:workflow:main");
const isAllowed = (state, operation)=>{
  if (!allowedOperations[state]) {
    return false;
  }
  return allowedOperations[state].includes(operation);
};

export default {
  name: "Workflow",
  components: {
    logScreen,
    applicationToolBar,
    NavDrawer,
    unsavedFilesDialog,
    versatileDialog,
    sourceFileUploadDialog,
    importWarningDialog,
    passwordDialog,
    remotehostManager,
    textEditorManager
  },
  data: ()=>{
    return {
      sioListeners: [],
      projectJson: null,
      drawer: false,
      mode: 0,
      showLogScreen: false,
      pwDialog: false,
      pwMode: null,
      pwHostname: null,
      pwJwtServerURL: null,
      pwCallback: ()=>{},
      descriptionDialog: false,
      viewerScreenDialog: false,
      projectDescription: "",
      cb: null,
      unsavedFiles: [],
      showUnsavedFilesDialog: false,
      viewerDataDir: null,
      firstViewDataAlived: false,
      selectSourceFileDialog: false,
      sourceFileCandidates: [],
      selectedSourceFilenames: [],
      selectSourceFileDialogTitle: "",
      uploadSourceFileDialog: false,
      forceEditDialog: false,
      dialog: false,
      dialogTitle: "",
      dialogMessage: "",
      confirmed: null,
      baseURL: ".",
      validationErrorDialog: false,
      validationErrors: [],
      validationErrorsSortBy: [{ key: "component", order: "asc" }],
      validationErrorFilter: "",
      validationErrorTableHeader: [
        { title: "component", value: "name", key: "component" },
        { title: "errors", value: "errors", key: "errors", sortable: false }
      ],
      validationCheckedComponent: null,
      errorPanelX: Math.max(0, window.innerWidth / 2 - 300),
      errorPanelY: 80,
      errorPanelDragging: false,
      errorPanelDragOffsetX: 0,
      errorPanelDragOffsetY: 0,
      warnDialog: null,
      remoteHostDialog: false
    };
  },
  computed: {
    ...mapState([
      "projectState",
      "componentPath",
      "rootComponentID",
      "currentComponent",
      "openSnackbar",
      "snackbarMessage",
      "snackbarTimeout",
      "projectRootDir",
      "selectedComponent",
      "selectedFile",
      "readOnly",
      "textEditorDialog",
      "pendingNavigation"
    ]),
    ...mapGetters(["waiting"]),
    canIgnoreAllErrors() {
      if (this.validationErrors.length === 0) {
        return false;
      }
      return this.validationErrors.every((entry)=>{
        return entry.errors.every((e)=>{ return e.ignoreable; });
      });
    },
    isReadOnly() {
      return this.readOnly ? " - read-only" : "";
    },
    stateColor() {
      return state2color(this.projectState);
    },
    readOnlyColor() {
      return state2color(`${this.readOnly ? "paused" : ""}`);
    },
    selectedSourceFilename() {
      return this.selectedSourceFilenames[0].filename;
    },
    runProjectAllowed() {
      return isAllowed(this.projectState, "runProject") && !this.readOnly;
    },
    forceEditAllowed() {
      return this.readOnly && ["stopped", "finished", "failed", "unknown"].includes(this.projectState);
    },
    pauseProjectAllowed() {
      return isAllowed(this.projectState, "pauseProject");
    },
    checkProjectAllowed() {
      return isAllowed(this.projectState, "checkProject");
    },
    saveProjectAllowed() {
      return isAllowed(this.projectState, "saveProject");
    },
    revertProjectAllowed() {
      return isAllowed(this.projectState, "revertProject");
    },
    stopProjectAllowed() {
      return isAllowed(this.projectState, "stopProject");
    },
    cleanProjectAllowed() {
      return isAllowed(this.projectState, "cleanProject");
    }
  },
  mounted: function () {
    let projectRootDir = sessionStorage.getItem("projectRootDir");
    if (projectRootDir === "not-set") {
      projectRootDir = readCookie("rootDir");
      sessionStorage.setItem("projectRootDir", projectRootDir);
    }
    this.commitProjectRootDir(projectRootDir);

    const socketIOPath = readCookie("socketIOPath");
    debug(`beseURL=${socketIOPath}`);
    this.baseURL = this.$router.options.history.base || ".";
    SIO.init({ projectRootDir }, socketIOPath);

    //Helper to register and track SIO listeners for cleanup in beforeUnmount
    const onSIO = (event, cb)=>{
      SIO.onGlobal(event, cb);
      this.sioListeners.push([event, cb]);
    };

    onSIO("WHEEL_LOG", (data)=>{
      if (this.$refs.logscreen) {
        this.$refs.logscreen.onWheelLog(data);
      }
    });

    const ID = readCookie("root");
    this.commitRootComponentID(ID);

    onSIO("askPassword", (hostname, mode, jwtServerURL, cb)=>{
      console.log("DEBUG: ", hostname, mode, jwtServerURL);
      this.pwCallback = (pw)=>{
        cb(pw);
      };
      this.pwMode = mode;
      this.pwHostname = hostname;
      this.pwJwtServerURL = jwtServerURL;
      this.pwDialog = true;
    });
    onSIO("askSourceFilename", (ID, name, description, candidates, cb)=>{
      this.selectSourceFileDialogTitle = `select source file for ${name}`;
      this.sourceFileCandidates = candidates.map((filename)=>{
        return { filename };
      });
      this.selectSourceFileDialogCallback = (result)=>{
        cb(result ? this.selectedSourceFilename : null);
        this.selectedSourceFilenames = [];
        this.sourceFileCandidates = [];
        this.selectSourceFileDialog = false;
      };
      this.selectSourceFileDialog = true;
    });
    onSIO("componentTree", (componentTree)=>{
      this.commitComponentTree(componentTree);
    });
    onSIO("showMessage", this.showSnackbar);
    onSIO("logERR", (message)=>{
      const rt = /^\[.*ERROR\].*- *(.*?)$/m.exec(message);
      const output = rt ? rt[1] || rt[0] : message;
      this.showSnackbar(output);
    });
    onSIO("projectState", (state)=>{
      this.commitProjectState(state.toLowerCase());
    });
    onSIO("projectJson", (projectJson)=>{
      this.projectJson = projectJson;
      this.commitProjectState(projectJson.state.toLowerCase());
      this.commitProjectReadOnly(projectJson.readOnly);
      this.commitComponentPath(projectJson.componentPath);
      this.commitWaitingProjectJson(false);
      if (this.warnDialog === null && projectJson.exportInfo && projectJson.exportInfo.notChanged) {
        this.warnDialog = true;
      }
    });
    onSIO("workflow", (wf)=>{
      if (this.pendingNavigation !== null && wf.ID === this.pendingNavigation) {
        //Navigation response matching the pending request
        this.commitPendingNavigation(null);
        //Use direct mutations to clear selection during navigation
        //bypasses the action's diff/updateComponent which can throw
        this.commitSelectedComponentMutation(null);
        this.commitCopySelectedComponentMutation(null);
        this.commitCurrentComponent(wf);
      } else if (this.pendingNavigation !== null) {
        //Stale event during navigation — ignore to prevent revert
      } else if (this.currentComponent === null || wf.ID === this.currentComponent.ID) {
        //Update for the current component
        this.commitCurrentComponent(wf);
      }
      if (this.selectedComponent && Array.isArray(wf.descendants)) {
        const update = wf.descendants.find((e)=>{
          return e.ID === this.selectedComponent.ID;
        });
        if (update) {
          this.commitSelectedComponent(update);
        }
      }
      this.commitWaitingWorkflow(false);
    });
    onSIO("unsavedFiles", (unsavedFiles, cb)=>{
      if (unsavedFiles.length === 0) {
        this.showUnsavedFilesDialog = false;
        this.unsavedFiles.splice(0, this.unsavedFiles.length);
        cb();
        return;
      }
      this.cb = cb;
      this.unsavedFiles.splice(0, this.unsavedFiles.length, ...unsavedFiles);
      this.showUnsavedFilesDialog = true;
    });
    onSIO("resultFilesReady", (dir)=>{
      this.viewerDataDir = dir;
      if (!this.firstViewDataAlived) {
        this.viewerScreenDialog = true;
        this.firstViewDataAlived = true;
      }
    });
    onSIO("requestOIDCAuth", (remotehostID, ack)=>{
      const param = new URLSearchParams({ remotehostID });
      window.location.replace(`${this.baseURL}/webAPIauth?${param.toString()}`);
      ack(true);
    });
    onSIO("hostList", this.commitRemoteHost);

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
    SIO.emitGlobal("getHostList", (hostList)=>{
      this.commitRemoteHost(hostList);
    });
    this.$router.replace({ name: "graph" })
      .catch((err)=>{
        if (err.name === "NavigationDuplicated") {
          return;
        }
        throw err;
      });
  },
  beforeUnmount() {
    //Reset textEditorDialog so the next Workflow mount starts with a closed editor,
    //preventing stale Vuex state from causing the Ace editor to mount unnecessarily.
    this.commitTextEditorDialog(false);

    for (const [event, cb] of this.sioListeners) {
      SIO.off(event, cb);
    }
    this.sioListeners = [];

    //Remove drag listeners in case the component is unmounted while a drag is in progress.
    document.removeEventListener("mousemove", this.onDragErrorPanel);
    document.removeEventListener("mouseup", this.stopDragErrorPanel);
  },
  methods: {
    closeValidationErrorDialog() {
      this.validationErrorDialog = false;
      this.validationErrors = [];
      this.validationErrorFilter = "";
      this.validationCheckedComponent = null;
    },

    /**
     * Start dragging the validation error panel.
     * @param {MouseEvent} event - The mousedown event on the panel title bar
     */
    startDragErrorPanel(event) {
      this.errorPanelDragging = true;
      this.errorPanelDragOffsetX = event.clientX - this.errorPanelX;
      this.errorPanelDragOffsetY = event.clientY - this.errorPanelY;
      document.addEventListener("mousemove", this.onDragErrorPanel);
      document.addEventListener("mouseup", this.stopDragErrorPanel);
    },

    /**
     * Update position of the validation error panel while dragging.
     * @param {MouseEvent} event - The mousemove event
     */
    onDragErrorPanel(event) {
      if (!this.errorPanelDragging) {
        return;
      }
      this.errorPanelX = event.clientX - this.errorPanelDragOffsetX;
      this.errorPanelY = event.clientY - this.errorPanelDragOffsetY;
    },

    /**
     * Stop dragging the validation error panel.
     */
    stopDragErrorPanel() {
      this.errorPanelDragging = false;
      document.removeEventListener("mousemove", this.onDragErrorPanel);
      document.removeEventListener("mouseup", this.stopDragErrorPanel);
    },
    onIgnoreAllErrors() {
      this.validationErrorDialog = false;
      this.validationErrors = [];
      this.validationErrorFilter = "";
      this.validationCheckedComponent = null;
    },
    showValidationErrorDialog(validationErrors, targetComponent) {
      this.validationErrors = validationErrors;
      this.validationCheckedComponent = targetComponent;
      const errorIDs = validationErrors.map((err)=>{
        return err.ID;
      });
      targetComponent.descendants.forEach((child)=>{
        child.isInvalid = errorIDs.includes(child.ID);
        if (!child.isInvalid) {
          const childName = this.componentPath[child.ID].replace(/^./, "");
          child.isInvalid = this.validationErrors.some((err)=>{
            return err.name.startsWith(childName);
          });
        }
      });
      this.validationErrorDialog = true;
    },
    checkComponents() {
      const targetComponent = (this.validationErrorDialog && this.validationCheckedComponent)
        ? this.validationCheckedComponent
        : this.currentComponent;
      SIO.emitGlobal("checkComponents", this.projectRootDir, targetComponent.ID, (validationErrors)=>{
        if (!Array.isArray(validationErrors)) {
          debug("checkComponents failed!", validationErrors);
        }
        if (validationErrors.length === 0) {
          this.showSnackbar(`all components under ${targetComponent.name} are valid`);
          debug(`no invalid components found under ${targetComponent.name} (${targetComponent.ID})`);
          return;
        }
        debug("invalid components", validationErrors);
        this.showValidationErrorDialog(validationErrors, targetComponent);
      });
    },
    makeWritable() {
      SIO.emitGlobal("updateProjectROStatus", this.projectRootDir, false, (rt)=>{
        debug("updateProjectROStatus done", rt);
      });
    },
    openViewerScreen() {
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
    openTextEditor() {
      this.commitTextEditorDialog(true);
    },
    closeTextEditor() {
      if (this.$refs.textEditorManager?.hasChange()) {
        this.$refs.textEditorManager.checkUnsavedBeforeClose(()=>{
          this.commitTextEditorDialog(false);
        });
      } else {
        this.commitTextEditorDialog(false);
      }
    },
    unsavedFilesDialogClosed(...args) {
      this.cb(args);
      this.unsavedFiles.splice(0);
      this.showUnsavedFilesDialog = false;
    },
    commitFiles(files) {
      SIO.emitGlobal("commitFiles", this.projectRootDir, files, ()=>{
        this.cb("update");
      });
    },
    ...mapActions({
      showSnackbar: "showSnackbar",
      closeSnackbar: "closeSnackbar",
      clearSnackbarQueue: "clearSnackbarQueue",
      commitSelectedComponent: "selectedComponent"
    }),
    ...mapMutations({
      commitTextEditorDialog: "textEditorDialog",
      commitComponentTree: "componentTree",
      commitProjectState: "projectState",
      commitProjectReadOnly: "readOnly",
      commitComponentPath: "componentPath",
      commitCurrentComponent: "currentComponent",
      commitProjectRootDir: "projectRootDir",
      commitRootComponentID: "rootComponentID",
      commitRemoteHost: "remoteHost",
      commitJobScheduler: "jobScheduler",
      commitWaitingProjectJson: "waitingProjectJson",
      commitWaitingWorkflow: "waitingWorkflow",
      commitPendingNavigation: "pendingNavigation",
      commitSelectedComponentMutation: "selectedComponent",
      commitCopySelectedComponentMutation: "copySelectedComponent"
    }),
    emitProjectOperation(operation) {
      if (operation === "runProject") {
        this.commitSelectedComponent(null);
      }
      if (operation === "cleanProject") {
        this.firstViewDataAlived = false;
        this.clearSnackbarQueue();
      }
      if (operation === "stopProject" || operation === "cleanProject") {
        this.commitWaitingWorkflow(true);
      }
      SIO.emitGlobal("projectOperation", this.projectRootDir, operation, (rt)=>{
        debug(`${operation} ${rt ? "finished" : `failed with ${rt}`}`);
        if (operation === "stopProject" || operation === "cleanProject") {
          this.commitWaitingWorkflow(false);
        }
        if (operation === "cleanProject") {
          this.viewerDataDir = null;
        }
        const label = operation.replace("Project", " project");
        if (rt) {
          this.showSnackbar({ message: `${label} accepted`, timeout: 3000 });
        } else {
          this.showSnackbar({ message: `${label} failed`, timeout: -1 });
        }
      });
    },
    openProjectOperationComfirmationDialog(operation) {
      if (["stopProject", "cleanProject", "pauseProject", "revertProject"].includes(operation)) {
        this.dialogTitle = operation;
        this.dialogMessage = `are you sure you want to ${operation.replace("P", " p")} ?`;
        this.confirmed = this.emitProjectOperation.bind(this, operation);
        this.dialog = true;
      }
    },
    updateDescription() {
      SIO.emitGlobal("updateProjectDescription", this.projectRootDir, this.projectDescription, (rt)=>{
        if (rt) {
          this.projectJson.description = this.projectDescription;
          this.projectDescription = "";
        }
      });
      this.descriptionDialog = false;
    }
  }
};
</script>
<style scoped>
.dialog-border {
  border: 2px solid white;
}
.editor-content {
  height: calc(90vh - 64px);
}
.validation-error-panel {
  position: fixed;
  z-index: 2000;
  width: 40vw;
  max-height: 60vh;
  display: flex;
  flex-direction: column;
}
.validation-error-panel-title {
  cursor: move;
  user-select: none;
  flex-shrink: 0;
}
.validation-error-panel-content {
  overflow-y: auto;
  flex: 1;
}
</style>
