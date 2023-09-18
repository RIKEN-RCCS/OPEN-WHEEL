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
    <application-tool-bar
      title="home"
      density="comfortable"
      @navIconClick="drawer=!drawer"
    />
    <v-main>
      <v-toolbar
        color='background'
      >
        <v-btn
          :disabled="batchMode"
          @click="openProject"
          prepend-icon="mdi-pencil"
          text="OPEN"
        />
        <v-btn
          :disabled="batchMode"
          @click="dialogMode='newProject';dialogTitle = 'create new project'; dialog=true"
          prepend-icon="mdi-plus"
          text="NEW"
        />
        <v-btn
          @click="openDeleteProjectDialog(true)"
          prepend-icon="mdi-text-box-remove-outline"
          text="REMOVE FROM LIST"
        />
        <v-btn
          @click="openDeleteProjectDialog(false)"
          prepend-icon="mdi-trash-can-outline"
          text="REMOVE"
        />
        <v-switch
          v-model="batchMode"
          label="BATCH MODE"
          color="primary"
          class="mt-6"
        />
      </v-toolbar>
      <v-data-table
        v-if="projectList.length > 0"
        v-model="selectedInTable"
        :show-select="true"
        :return-object="true"
        :select-strategy="batchMode?'page':'single'"
        :headers="headers"
        :items="projectList"
      >
        <template #item.name="props">
          <v-menu
            location="bottom"
            v-model="editDialog[props.index]"
            :close-on-content-click="false"
            min-width="auto"
            max-width="50vw"
          >
            <template v-slot:activator="{ props: menuProps }">
              <v-btn
                variant="text"
                v-bind="menuProps"
                block
                class="justify-start"
                :text=props.item.columns.name
                @click="openInlineEditDialog(props.item.columns.name, props.index)"
              />
            </template>
            <v-sheet
            min-width="auto"
            max-width="50vw"
            >
              <v-text-field
                v-model="newVal"
                :rules="[required]"
                clearable
                @keyup.enter="renameProject(props.item.columns, props.index)"
              />
          </v-sheet>
          </v-menu>
    </template>
        <template #item.description="{item}">
          <span class="d-inline-block text-truncate trancated-row" >
            {{ item.columns.description }}
          </span>
        </template>
        <template #item.path="{item}">
          <span
            class="d-inline-block text-truncate trancated-row"
          >{{ item.columns.path }} </span>
        </template>
      </v-data-table>
      <v-dialog
        v-model="dialog"
        max-width="70%"
        scrollable
      >
        <v-card>
          <v-card-title> {{ dialogTitle }}</v-card-title>
          <v-card-actions>
            <v-spacer />
            <buttons
              :buttons="buttons"
              @open="openProject"
              @create="createProject"
              @cancel="closeDialog"
            />
          </v-card-actions>
          <v-card-actions v-if="dialogMode === 'newProject'">
            <v-text-field
              v-model="newProjectName"
              label="project name"
              variant=outlined
              :rules="[required]"
            />
            <v-textarea
              v-model="newProjectDescription"
              label="project description"
              rows="2"
              auto-grow
            />
          </v-card-actions>
          <v-card-text>
            <file-browser
              @update="(a)=>{selectedInTree=a}"
            />
          </v-card-text>
        </v-card>
      </v-dialog>
    </v-main>
    <remove-confirm-dialog
      v-model="rmDialog"
      title="remove project"
      :message="removeProjectMessage"
      :remove-candidates="removeCandidates"
      @remove="commitRemoveProjects"
    />
  </v-app>
</template>
<script>
"use strict";
import navDrawer from "@/components/common/NavigationDrawer.vue";
import applicationToolBar from "@/components/common/applicationToolBar.vue";
import fileBrowser from "@/components/common/fileBrowserLite.vue";
import removeConfirmDialog from "@/components/common/removeConfirmDialog.vue";
import buttons from "@/components/common/buttons.vue";
import { readCookie } from "@/lib/utility.js";
import SIO from "@/lib/socketIOWrapper.js";
import { required } from "@/lib/validationRules.js";

//it should be get from server
const projectJsonFilename = "prj.wheel.json";
const reProjectJsonFilename = new RegExp(`/${projectJsonFilename}$`);

export default {
  name: "Home",
  components: {
    navDrawer,
    applicationToolBar,
    fileBrowser,
    buttons,
    removeConfirmDialog,
  },
  data: ()=>{
    return {
      batchMode: false,
      drawer: false,
      dialog: false,
      rmDialog: false,
      removeFromList: false,
      dialogMode: "default",
      selectedInTree: null,
      selectedInTable: [],
      projectList: [],
      headers: [
        { title: "Project Name", key: "name", width: "20vw" },
        { title: "Description", key: "description", width: "20vw" },
        { title: "Path", key: "path", width: "20vw" },
        { title: "Create time", key: "ctime" },
        { title: "Last modified time", key: "mtime" },
        { title: "State", key: "state" },
      ],
      dialogTitle: "",
      newProjectName: "",
      newProjectDescription: "",
      removeCandidates: [],
      pathSep: "/",
      home: "/",
      editDialog:[],
      newVal:null,
      edittingIndex:null
    };
  },
  watch:{
    batchMode(newMode){
      if(!newMode){
        this.selectedInTable.splice(0,this.selectedInTable.length);
      }
    }
  },
  computed: {
    selected () {
      if (this.selectedInTree) {
        return this.selectedInTree.replace(reProjectJsonFilename, "");
      }
      return this.selectedInTable.length > 0 ? this.selectedInTable[0].path : this.home;
    },
    buttons () {
      const open = { icon: "mdi-check", label: "open" };
      const create = { icon: "mdi-plus", label: "create" };
      const cancel = { icon: "mdi-close", label: "cancel" };
      const rt = [cancel];
      switch (this.dialogMode) {
        case "newProject":
          rt.unshift(create);
          break;
        default:
          rt.unshift(open);
          break;
      }
      return rt;
    },
    removeProjectMessage () {
      return this.removeFromList ? "remove following projects from list" : "remove following project files";
    },
  },
  mounted: function () {
    this.pathSep = readCookie("pathSep");
    this.home = readCookie("home");
    const baseURL=readCookie("socketIOPath");
    SIO.init(null, baseURL);
    SIO.onGlobal("projectList", (data)=>{
      this.projectList.splice(0, this.projectList.length, ...data);
    });
    this.forceUpdateProjectList();
  },
  methods: {
    required,
    openInlineEditDialog(name, index){
      this.newVal=name
      this.oldVal=name
      this.edittingIndex=index
      this.editDialog[index]=true
    },
    forceUpdateProjectList(){
      SIO.emitGlobal("getProjectList", (data)=>{
        if (!Array.isArray(data)) {
          console.log("unexpected projectlist recieved", data);
          return;
        }
        this.projectList.splice(0, this.projectList.length, ...data);
      });
    },
    closeDialog () {
      this.dialog = false;
      this.dialogMode = "default";
      this.selectedInTree = null;
      this.newProjectName = "";
      this.newProjectDescription = "";
      this.dialogTitle = "";
    },
    createProject () {
      const path = `${this.selected || "."}/${this.newProjectName}`;
      SIO.emitGlobal("addProject", path, this.newProjectDescription, (rt)=>{
        if(!rt){
          console.log("create project failed", this.selected, this.newProjectName, this.newProjectDescription, path);
          this.forceUpdateProjectList();
        }
      });
      this.closeDialog();
    },
    openProject () {
      if (this.selected === this.home) {
        this.dialogTitle = "select project path";
        this.dialogMode = "default";
        this.dialog = true;
        return;
      }
      sessionStorage.setItem("projectRootDir", "not-set");
      const form = document.createElement("form");
      form.setAttribute("action", "./workflow");
      form.setAttribute("method", "post");
      form.style.display = "none";
      document.body.appendChild(form);
      const input = document.createElement("input");
      input.setAttribute("type", "hidden");
      input.setAttribute("name", "project");
      input.setAttribute("value", this.selected);
      form.appendChild(input);
      form.submit();
    },
    renameProject (item, index) {
      if(this.newVal === item.name){
        console.log("project name not changed");
      }else{
        SIO.emitGlobal("renameProject", item.id, this.newVal, item.path, (rt)=>{
          if(!rt){
            console.log("rename failed", item.id, this.newVal, item.path);
          }
          this.forceUpdateProjectList();
        });
      }
      this.editDialog[index]=false
    },
    openDeleteProjectDialog (fromListOnly) {
      this.removeFromList = fromListOnly;
      this.removeCandidates = this.selectedInTable.map((e)=>{ return e.name; });
      this.rmDialog = true;
    },
    commitRemoveProjects () {
      const removeIDs = this.selectedInTable
        .map((e)=>{
          return e.id;
        });
      const eventName = this.removeFromList ? "removeProjectsFromList" : "removeProjects";
      SIO.emitGlobal(eventName, removeIDs, (rt)=>{
        if(!rt){
          console.log("remove failed", eventName, removeIDs);
          this.forceUpdateProjectList();
        }
        this.selectedInTable = [];
      });
    },
  },
};
</script>
<style>
.trancated-row{
  max-width: 20vw;
}
</style>
<style>
.v-btn__content {
  text-transform: none !important;
}
</style>
