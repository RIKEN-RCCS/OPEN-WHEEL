/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import Vuex from "vuex";
import Debug from "debug";
const debug = Debug("wheel:vuex");
import deepEqual from "deep-eql";
import SIO from "@/lib/socketIOWrapper.js";

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
 * @property { Object } currentComponent  - parent component of displayed boxes this is set by componentGraph or componentTree
 * @property { Object } selectedComponent - component which is editing in property window and text editor. this is set by clicking in componentGraph
 * @property { Object } copySelectedComponent - copy of selectedComponent at the slected moment
 * @property { string } projectRootDir - absolute path of project's root directory
 * @property { string } rootComponentID - root workflow component's ID
 * @property { string } projectState - project's satate. this value is never changed from client-side
 * @property { Object } componentTree - component tree. this value is never changed from client-side
 * @property { Object } componentPath - ID-compoentPath reverse map in projectJSON this value is never changed from client-side
 * @property { string } selectedFile - selected file in fileBrowser component
 * @property { string } selectedText - selected text in editor component (pass to parameter editor from tab editor)
 * @property { Object} remoteHost - remoteHost JSON
 * @property { Object} jobScheduler - jobScheduler JSON
 * @property { Boolean } waitingProjectJson - flag for loading projectJson data
 * @property { Boolean } waitingWorkflow - flag for loading Worgflow data for graph component
 * @property { Boolean } waitingFile - flag for loading file data for rapid
 * @property { Boolean } waitingSave - flag for waiting save (=commit)
 * @property { Boolean } waitingEnv  - flag for loading environment variable data
 * @property { Boolean } waitingDownload  - flag for prepareing download file
 * @property { number } canvasWidth - width of canvas in component graph
 * @property { number } canvasHeight - width of canvas in component graph
 * @property { string[] } scriptCandidates - filenames directly under selected component directory
 * @property { Boolean } openSnackbar - flag to show snackbar message
 * @property { string } snackbarMessage - message on snackbar
 * @property { Boolean } openDialog - flag to show global dialog
 * @property { Object } dialogContent - dialog's content
 * @property { Boolean } readOnly - project wide read-only flag
 *
 */
const state = {
  currentComponent: null,
  selectedComponent: null,
  copySelectedComponent: null,
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
  snackbarQueue: [],
  openDialog: false,
  dialogContent: null,
  dialogQueue: [],
  readOnly: false
};

const mutations = mutationFactory(Object.keys(state));

export default new Vuex.Store({
  state,
  mutations,
  actions: {
    selectedComponent: (context, payload)=>{
      const {selectedComponent: selected, copySelectedComponent:copied, projectRootDir, currentComponent} = context.state

      if( copied !== null && !deepEqual(copied, selected)){
        SIO.emitGlobal("updateComponent", projectRootDir, copied.ID, copied, currentComponent.ID,(rt)=>{
          console.log("compoent update done", rt);
        });
      }
      if(payload === null){
        context.commit("selectedComponent", null);
        context.commit("copySelectedComponent", null);
        return
      }

      context.commit("selectedComponent", payload);
      const dup = Object.assign({}, payload);
      context.commit("copySelectedComponent", dup);
    },
    showSnackbar: (context, payload)=>{
      if (typeof payload === "string") {
        context.state.snackbarQueue.push(payload);
      }
      if (context.state.snackbarQueue.length === 0) {
        return;
      }
      const message = context.state.snackbarQueue.shift();
      context.commit("snackbarMessage", message);
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
    closeDialog: (context )=>{
      context.commit("dialogContent", null);
      context.commit("openDialog", false);
    },
  },
  getters: {
    //get selected component's absolute path on server
    selectedComponentAbsPath: (state, getters)=>{
      if (state.selectedComponent === null || typeof state.selectedComponent.ID === "undefined") {
        return state.projectRootDir;
      }
      const relativePath = state.componentPath[state.selectedComponent.ID];
      //remove "./" or "/" at the begining of line 
      let numRemove=0;
      if( /^\.\//.test(relativePath)){
        numRemove=2;
      }else if(relativePath.startsWith("/")){
        numRemove=1;
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
    running:(state)=>{
      return state.projectState === "running";
    },
  },
  modules: {
  },
  plugins: [logger],
});
