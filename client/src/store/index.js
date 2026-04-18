/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import { toRaw } from "vue";
import Vuex from "vuex";
import Debug from "debug";
const debug = Debug("wheel:vuex");
import { diff } from "just-diff";
import SIO from "../lib/socketIOWrapper.js";
const logger = (store)=>{
  store.subscribe((mutation)=>{
    const { type, payload } = mutation;
    debug(`${type} set to`, payload);
  });
};
const simpleMutation = (type, state, payload)=>{
  state[type] = payload;
};
const mutationFactory = (types)=>{
  return types.reduce((a, c)=>{
    a[c] = simpleMutation.bind(null, c);
    return a;
  }, {});
};

/**
 * @typedef state
 * @property {object} currentComponent  - parent component of displayed boxes this is set by componentGraph or componentTree
 * @property {object} selectedComponent - component which is editing in property window and text editor. this is set by clicking in componentGraph
 * @property {object} copySelectedComponent - copy of selectedComponent at the slected moment
 * @property { string } projectRootDir - absolute path of project's root directory
 * @property { string } rootComponentID - root workflow component's ID
 * @property { string } projectState - project's satate. this value is never changed from client-side
 * @property {object} componentTree - component tree. this value is never changed from client-side
 * @property {object} componentPath - ID-compoentPath reverse map in projectJSON this value is never changed from client-side
 * @property { string } selectedFile - selected file in fileBrowser component
 * @property { string } selectedText - selected text in editor component (pass to parameter editor from tab editor)
 * @property {object} remoteHost - remoteHost JSON
 * @property {object} jobScheduler - jobScheduler JSON
 * @property {boolean} waitingProjectJson - flag for loading projectJson data
 * @property {boolean} waitingWorkflow - flag for loading Worgflow data for graph component
 * @property {boolean} waitingFile - flag for loading file data for rapid
 * @property {boolean} waitingSave - flag for waiting save (=commit)
 * @property {boolean} waitingEnv  - flag for loading environment variable data
 * @property {boolean} waitingDownload  - flag for prepareing download file
 * @property { number } canvasWidth - width of canvas in component graph
 * @property { number } canvasHeight - width of canvas in component graph
 * @property { string[] } scriptCandidates - filenames directly under selected component directory
 * @property {boolean} openSnackbar - flag to show snackbar message
 * @property { string } snackbarMessage - message on snackbar
 * @property {boolean} openDialog - flag to show global dialog
 * @property {object} dialogContent - dialog's content
 * @property {boolean} readOnly - project wide read-only flag
 */
const state = {
  currentComponent: null,
  selectedComponent: null,
  copySelectedComponent: null,
  copyInfo: null,
  projectState: null,
  projectRootDir: null,
  rootComponentID: null,
  componentTree: null,
  componentPath: null,
  selectedFile: null,
  selectedText: null,
  remoteHost: null,
  jobScheduler: null,
  waitingProjectJson: false,
  waitingWorkflow: false,
  waitingFile: false,
  waitingSave: false,
  waitingEnv: false,
  waitingDownload: false,
  canvasWidth: null,
  canvasHeight: null,
  scriptCandidates: [],
  openSnackbar: false,
  snackbarMessage: "",
  snackbarTimeout: -1,
  snackbarQueue: [],
  openDialog: false,
  dialogContent: null,
  dialogQueue: [],
  readOnly: false,
  isComponentDragging: false,
  currentZoom: 1,
  currentPan: { x: 0, y: 0 },
  textEditorDialog: false,
  pendingNavigation: null
};

const mutations = mutationFactory(Object.keys(state));

export default new Vuex.Store({
  state,
  mutations,
  actions: {
    openTextEditor: (context)=>{
      context.commit("textEditorDialog", true);
    },
    pasteComponent: (context, payload)=>{
      const { callback, pos } = payload || {};
      const { copyInfo, currentComponent } = context.state;

      //Check if cutting and pasting to the same parent
      if (copyInfo && copyInfo.type === "cut" && copyInfo.parentID === currentComponent.ID) {
        context.dispatch("showSnackbar", { message: "paste to same parent is not allowed", timeout: 2000 });
        context.commit("copyInfo", null);
        return;
      }

      SIO.emitGlobal("pasteComponent", context.state.projectRootDir, copyInfo, currentComponent.ID, pos, callback || (()=>{}));
      context.commit("copyInfo", null);
    },
    selectedComponent: (context, payload)=>{
      const { selectedComponent: selected,
        copySelectedComponent: copied,
        projectRootDir,
        currentComponent } = context.state;
      //Only send updateComponent when switching to a different component or closing (payload===null).
      //Do NOT send it for same-component workflow events to prevent cascade overwrites:
      //e.g., when the user types chars rapidly, each renameOutputFile call triggers a workflow event
      //which would call this action with the same component ID. Without this guard, each such call
      //would send updateComponent with an intermediate copySelectedComponent value, potentially
      //overwriting the final renameOutputFile result on the server.
      const isSameComponent = copied !== null && payload !== null && copied.ID === payload.ID;
      try {
        if (!isSameComponent && copied !== null && selected !== null) {
          const difference = diff(selected, copied);
          const changedProps = difference.filter((e)=>{
            return e.path[0] !== "pos";
          });
          if (changedProps.length > 0) {
            //Snapshot both the previous server value and what we are sending,
            //so the denial callback can revert precisely even if state changes later.
            const sentCopy = structuredClone(toRaw(copied));
            const prevSelected = structuredClone(toRaw(selected));
            SIO.emitGlobal("updateComponent", projectRootDir, copied.ID, copied, currentComponent.ID, (rt)=>{
              if (rt !== true) {
                //Server denied the update: notify the user and undo all optimistic changes.
                context.dispatch("showSnackbar", "component update failed");
                //Revert the optimistic update in currentComponent.descendants.
                const revertedDescendants = context.state.currentComponent.descendants.map((d)=>{
                  return d.ID === sentCopy.ID ? { ...prevSelected } : d;
                });
                context.commit("currentComponent", { ...toRaw(context.state.currentComponent), descendants: revertedDescendants });
                //Revert selectedComponent (diff baseline) so subsequent edits diff against the true server value.
                if (context.state.selectedComponent?.ID === sentCopy.ID) {
                  context.commit("selectedComponent", structuredClone(prevSelected));
                }
                //Per-prop selective revert of copySelectedComponent:
                //- props the user hasn't touched since we sent → revert to prevSelected value
                //- props the user changed again after sending → keep user's newer value
                const currentCopied = context.state.copySelectedComponent;
                if (currentCopied?.ID === sentCopy.ID) {
                  const revertedCopy = structuredClone(toRaw(currentCopied));
                  for (const key of Object.keys(sentCopy)) {
                    if (key === "ID" || key === "pos") {
                      continue;
                    }
                    if (JSON.stringify(sentCopy[key]) !== JSON.stringify(prevSelected[key])) {
                      //This prop was changed in our (denied) update.
                      if (JSON.stringify(revertedCopy[key]) === JSON.stringify(sentCopy[key])) {
                        //User hasn't changed it again → revert to server value.
                        revertedCopy[key] = prevSelected[key];
                      }
                      //else: user already changed it → keep user's value.
                    }
                  }
                  context.commit("copySelectedComponent", revertedCopy);
                }
              }
            });
            //Optimistic update: reflect the new component data in currentComponent immediately,
            //before the server's workflow response arrives. This prevents a race where
            //commitSelectedComponent (e.g. from clickComponentName) reads stale descendants
            //and sets copySelectedComponent with outdated values (e.g. old storagePath).
            //The server's workflow event will overwrite this with the authoritative final values.
            const updatedDescendants = currentComponent.descendants.map((d)=>{
              return d.ID === copied.ID ? { ...toRaw(copied) } : d;
            });
            context.commit("currentComponent", { ...toRaw(currentComponent), descendants: updatedDescendants });
          }
        }
      } catch (e) {
        debug("selectedComponent action: error during updateComponent logic:", e);
      }
      if (payload === null) {
        context.commit("selectedComponent", null);
        context.commit("copySelectedComponent", null);
        return;
      }

      context.commit("selectedComponent", payload);
      //When switching to a different component, always reset the working copy.
      //When the same component is updated by an incoming workflow event,
      //only update the working copy if the user has no in-progress edits.
      //This prevents stale copySelectedComponent from diverging from selectedComponent
      //and causing spurious updateComponent calls when subsequent workflow events arrive.
      if (isSameComponent) {
        const hasEdits = selected !== null && diff(selected, copied).some((e)=>{
          return e.path[0] !== "pos";
        });
        if (!hasEdits) {
          context.commit("copySelectedComponent", structuredClone(toRaw(payload)));
        }
      } else {
        context.commit("copySelectedComponent", structuredClone(toRaw(payload)));
      }
    },
    showSnackbar: (context, payload)=>{
      if (typeof payload === "string") {
        context.state.snackbarQueue.push({ message: payload, timeout: -1 });
      } else {
        context.state.snackbarQueue.push(payload);
      }
      if (context.state.snackbarQueue.length === 0) {
        return;
      }
      const { message, timeout } = context.state.snackbarQueue.shift();
      //v-snackbar's timeout is not working at this moment
      //so we add folloing workaround
      if (timeout > 0) {
        setTimeout(()=>{
          context.commit("snackbarMessage", "");
          context.commit("openSnackbar", false);
          if (context.state.snackbarQueue.length > 0) {
            context.dispatch("showSnackbar");
          }
        },
        timeout);
      }
      context.commit("snackbarMessage", message);
      context.commit("snackbarTimeout", timeout);
      context.commit("openSnackbar", true);
    },
    closeSnackbar: (context)=>{
      context.commit("snackbarMessage", "");
      context.commit("openSnackbar", false);
      if (context.state.snackbarQueue.length > 0) {
        context.dispatch("showSnackbar");
      }
    },
    showDialog: (context, payload)=>{
      //ignore if dialog is already opend
      //we have to use dialog queue for this case
      if (context.state.openDialog) {
        return;
      }
      context.commit("dialogContent", payload);
      context.commit("openDialog", true);
    },
    closeDialog: (context)=>{
      context.commit("dialogContent", null);
      context.commit("openDialog", false);
    }
  },
  getters: {
    copiedComponentID: (state)=>{
      return state.copyInfo?.type === "copy" ? state.copyInfo.ID : null;
    },
    cutComponentID: (state)=>{
      return state.copyInfo?.type === "cut" ? state.copyInfo.ID : null;
    },
    //get selected component's absolute path on server
    selectedComponentAbsPath: (state, getters)=>{
      if (state.selectedComponent === null || typeof state.selectedComponent.ID === "undefined") {
        return state.projectRootDir;
      }
      const relativePath = state.componentPath[state.selectedComponent.ID];
      //remove "./" or "/" at the begining of line
      let numRemove = 0;
      if (/^\.\//.test(relativePath)) {
        numRemove = 2;
      } else if (relativePath.startsWith("/")) {
        numRemove = 1;
      }
      return `${state.projectRootDir}${getters.pathSep}${relativePath.slice(numRemove)}`;
    },
    //get current component's absolute path on server
    currentComponentAbsPath: (state, getters)=>{
      if (state.currentComponent.ID === state.rootComponentID) {
        return state.projectRootDir;
      }
      const relativePath = state.componentPath[state.currentComponent.ID];
      return `${state.projectRootDir}${getters.pathSep}${relativePath.slice(1)}`;
    },
    //flag to show loading screen
    waiting: (state)=>{
      return state.waitingProjectJson || state.waitingWorkflow || state.waitingFile || state.waitingSave || state.waitingEnv || state.waitingDownload;
    },
    pathSep: (state)=>{
      return typeof state.projectRootDir === "string" && state.projectRootDir[0] !== "/" ? "\\" : "/";
    },
    canRun: (state)=>{
      return ["not-started", "paused"].includes(state.projectState);
    },
    running: (state)=>{
      return state.projectState === "running";
    }
  },
  modules: {
  },
  plugins: [logger]
});
