/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <div>
    <v-btn
      v-if="!connected"
      @click="requestRemoteConnection"
      text="browse files on remotehost"
    />
    <div v-if="! readonly && connected">
      <v-spacer />
      <v-tooltip location="top" text="new folder"
      >
        <template #activator="{ props }">
          <v-btn
            :disabled="isSND"
            v-bind="props"
            @click="openDialog('createNewDir')"
            icon=mdi-folder-plus-outline
          />
        </template>
      </v-tooltip>
      <v-tooltip text="new file" location="top">
        <template #activator="{ props }">
          <v-btn
            :disabled="isSND"
            v-bind="props"
            icon="mdi-file-plus-outline"
            @click="openDialog('createNewFile')"
          />
        </template>
      </v-tooltip>
      <v-tooltip text="rename" location="top" >
        <template #activator="{ props }">
          <v-btn
            :disabled="isSND"
            @click="openDialog('renameFile')"
            v-bind="props"
            icon="mdi-file-move-outline"
          />
        </template>
      </v-tooltip>
      <v-tooltip location="top" text="delete" >
        <template #activator="{ props }">
          <v-btn
            :disabled="isSND"
            v-bind="props"
            @click="openDialog('removeFile')"
            icon="mdi-file-remove-outline"
          />
        </template>
      </v-tooltip>
      <v-tooltip text="upload file" location="top">
        <template #activator="{ props }">
          <v-btn
            :disabled="isSND"
              v-bind="props"
            icon="mdi-upload"
              @click="showUploadDialog"
            />
        </template>
      </v-tooltip>
      <v-tooltip text="download" location="top" >
        <template #activator="{ props }">
        <v-btn
          :disabled="isSND"
              v-bind="props"
            @click="download"
            icon="mdi-download"
          />
        </template>
      </v-tooltip>
          <v-tooltip location="top" text="share file" >
            <template #activator="{ props }">
        <v-btn
          :disabled="isSND"
            @click="openDialog('shareFile')"
            icon="mdi-share-outline"
            v-bind="props"
          />
            </template>
          </v-tooltip>
      <v-spacer />
      <v-progress-linear
        v-show="uploading"
        value="percentUploaded"
      />
    </div>
    <my-treeview
      v-if="connected"
      :items="items"
      :load-children="getChildren"
      activatable
      :open="openItems"
      @update:active="updateSelected"
      :get-node-icon="getNodeIcon"
      :get-leaf-icon="getLeafIcon"
    />
    <versatile-dialog
      v-model="dialog.open"
      max-width="40vw"
      :title="dialog.title"
      @ok="submitAndCloseDialog"
      @cancel="clearAndCloseDialog"
    >
      <template
        #message
        v-if="['createNewDir','createNewFile','renameFile'].includes(dialog.submitEvent)"
      >
        <v-text-field
          v-model="dialog.inputField"
          :label="dialog.inputFieldLabel"
          :rules="[noDuplicate]"
          variant="outlined"
        />
      </template>
      <template
        v-if="dialog.submitEvent === 'shareFile'"
        #message
      >
        <v-text-field
          v-model="dialog.inputField"
          readonly
          :label="dialog.inputFieldLabel"
          :rules="[noDuplicate]"
        >
          <template #append>
            <v-tooltip text="copy file path" location="bottom" >
              <template #activator="{ props }">
                <v-btn
                  icon="mdi-content-copy"
                  v-bind="props"
                  @click="copyToClipboard"
                />
              </template>
            </v-tooltip>
          </template>
        </v-text-field>
      </template>
    </versatile-dialog>
    <versatile-dialog
      v-model="downloadDialog"
      title="download content ready"
      max-width="30vw"
      :buttons="downloadDialogButton"
      @close="closeDownloadDialog"
    >
      <template #message >
        <v-row>
          <v-btn class="mx-auto mt-10 mb-6">
            <!-- Do NOT remove download attribute. some files may open in browser e.g. text, json -->
            <a :href="downloadURL" download>download</a>
          </v-btn>
        </v-row>
      </template>
    </versatile-dialog>
  </div>
</template>
<script>
import Debug from "debug"
const debug = Debug("wheel:remoteFileBrowser");
import { mapState, mapGetters, mapMutations } from "vuex"
import SIO from "@/lib/socketIOWrapper.js"
import versatileDialog from "@/components/versatileDialog.vue";
import myTreeview from "@/components/common/myTreeview.vue"
import {_getActiveItem,icons, openIcons, fileListModifier, removeItem , getTitle, getLabel } from "@/components/common/fileTreeUtils.js"


export default {
  name: "RemoteFileBrowser",
  components: {
    versatileDialog,
    myTreeview
  },
  props: {
    readonly: { type: Boolean, default: true },
    projectRootDir: { type: String, default: null }
  },
  data: function () {
    return {
      connected: false,
      currentDir: null,
      activeItem: null,
      uploading:false,
      percentUploaded: 0,
      openItems: [],
      items: [],
      dialog: {
        open: false,
        title: "",
        withInputField: true,
        inputFieldLabel: "",
        inputField: "",
        submitArgs: [],
      },
      downloadDialogButton:[
        {icon: "mdi-close", label: "close"}
      ],
      downloadURL:null,
      downloadDialog:false
    }
  },
  computed: {
    ...mapState(["selectedComponent", "selectedFile", "currentComponent", "copySelectedComponent"]),
    ...mapGetters(["selectedComponentAbsPath", "pathSep"]),
    storagePath(){
      return this.copySelectedComponent.storagePath || "./"
    }
  },
  watch: {
    items () {
      if(["for", "foreach", "workflow", "storage",  "viewer"].includes(this.selectedComponent.type)){
        return;
      }
      const scriptCandidates = this.items
        .filter((e)=>{
          return e.type.startsWith("file")
        })
        .map((e)=>{
          return e.name
        })
      this.commitScriptCandidates(scriptCandidates)
    },
    currentComponent: {
      //edit workflow -> server respond workflow data -> fire this event
      handler(nv){
        if(nv.descendants.some((e)=>{
          return e.ID === this.selectedComponent.ID
        })){
          this.getComponentDirRootFiles();
        }
      },
      deep: true
    },
    selectedComponent(){
      this.getComponentDirRootFiles();
      this.currentDir=this.selectedComponentAbsPath
    },
    connected(nv){
      if(nv){
        this.getComponentDirRootFiles();
      }
    }
  },
  mounted () {
    if(! this.readonly){
      SIO.listenOnDrop(this.$el)
      SIO.onUploaderEvent("choose", this.onChoose)
      SIO.onUploaderEvent("complete", this.onUploadComplete)
      SIO.onUploaderEvent("progress", this.updateProgressBar)
    }
    this.currentDir=this.selectedComponent.type === "storage" ? this.storagePath: this.selectedComponentAbsPath;
  },
  beforeDestroy(){
    SIO.removeUploaderEvent("choose", this.onChoose)
    SIO.removeUploaderEvent("complete", this.onUploadComplete)
    SIO.removeUploaderEvent("progress", this.updateProgressBar)
  },
  methods: {
    getNodeIcon(isOpen, item){
      return isOpen ? openIcons[item.type] : icons[item.type]
    },
    getLeafIcon(item){
      return icons[item.type]
    },
    requestRemoteConnection(){
      SIO.emitGlobal("requestRemoteConnection", this.projectRootDir, this.selectedComponent.ID, (isReady)=>{
        this.connected=isReady
      });
    },
    copyToClipboard(){
      debug("copy file path",this.dialog.inputField)
      navigator.clipboard.writeText(this.dialog.inputField)
    },
    getActiveItem (key) {
      return  _getActiveItem(this.items,key);
    },
    getComponentDirRootFiles(){
      const cb= (fileList)=>{
        if(fileList === null){
          return
        }
        this.items = fileList
          .filter((e)=>{return !e.isComponentDir})
          .map(fileListModifier.bind(null, this.pathSep))
      }
      const path = this.selectedComponent.type === "storage" ? this.storagePath: this.selectedComponentAbsPath;
      SIO.emitGlobal("getRemoteFileList",this.projectRootDir,  this.selectedComponent.host ,{path, mode: "underComponent"}, cb)
    },
    noDuplicate(v){
      return ! this.items.map((e)=>{ return e.name }).includes(v)
    },
    updateSelected(activeItem){
      this.activeItem=activeItem

      if(this.activeItem === null){
        console.log("failed to get current selected Item");
        return
      }
      this.currentDir=this.activeItem.type === "file" ?this.activeItem.path : this.activeItem.id
      this.commitSelectedFile(null); //we cant open remote file with text editor
    },
    onChoose(event){
      for (const file of event.files){
        file.meta.currentDir=this.currentDir
        file.meta.orgName=file.name
        file.meta.projectRootDir=this.projectRootDir
        file.meta.componentDir=this.selectedComponentAbsPath
        file.meta.clientID=SIO.getID()
        file.meta.skipGit=true;
        file.meta.overwrite=true;
        file.meta.remoteUploadPath=this.storagePath
        file.meta.remotehost=this.selectedComponent.host
      }
      this.uploading=true;
    },
    onUploadComplete(){
      this.uploading=false;
      this.getComponentDirRootFiles();
    },
    updateProgressBar(event){
      this.percentUploaded=(event.bytesLoaded / event.file.size)*100
    },
    ...mapMutations({
      commitScriptCandidates: "scriptCandidates",
      commitSelectedFile: "selectedFile",
      commitWaitingDownload: "waitingDownload"
    }),
    getChildren (item) {
      return new Promise((resolve, reject)=>{
        const cb=(fileList)=>{
          if (!Array.isArray(fileList)) {
            reject(fileList)
          }
          item.children = fileList
            .filter((e)=>{return !e.isComponentDir})
            .map(fileListModifier.bind(null, this.pathSep))
          resolve()
        }
        const activeItem = this.getActiveItem(item.id)
        if(activeItem === null){
          console.log("failed to get current selected Item");
          return
        }

        if(item.type === "dir" || item.type === "dir-link"){
          SIO.emitGlobal("getRemoteFileList",this.projectRootDir, this.selectedComponent.host, {path: item.id, mode: "underComponent"}, cb)
        }else{
          //memo SND content is not supported in remote file browser for now
          SIO.emitGlobal("getSNDContents", this.projectRootDir, item.path , item.name, item.type.startsWith("sndd"),cb)
        }
      })
    },
    clearAndCloseDialog () {
      this.dialog.title = ""
      this.dialog.inputFieldLabel = ""
      this.dialog.inputField = ""
      this.dialog.open = false
    },
    submitAndCloseDialog () {
      if (this.dialog.submitEvent === "removeFile") {
        SIO.emitGlobal("removeRemoteFile", this.projectRootDir, this.activeItem.id, this.selectedComponent.host, (rt)=>{
          if (!rt) {
            console.log(rt);
            return
          }
          removeItem(this.items, this.activeItem.id)
          this.commitSelectedFile(null);
          this.currentDir=this.selectedComponent.type === "storage" ? this.storagePath: this.selectedComponentAbsPath;
          this.activeItem=null;
        })
      } else if (this.dialog.submitEvent === "renameFile") {
        const newName = this.dialog.inputField
        const oldName = this.activeItem.name

        SIO.emitGlobal("renameRemoteFile", this.projectRootDir, this.activeItem.path, this.activeItem.name, newName, this.selectedComponent.host, (rt)=>{
          if (!rt) {
            console.log(rt);
            return
          }
          this.activeItem.name = newName
          const re=new RegExp(oldName+"$")
          this.activeItem.id = this.activeItem.id.replace(re,newName);
          this.updateSelected(this.activeItem);
        })
      } else if (this.dialog.submitEvent === "createNewFile" || this.dialog.submitEvent === "createNewDir") {
        const name = this.dialog.inputField
        const fullPath = `${this.currentDir}${this.pathSep}${name}`
        if(!this.noDuplicate(name)){
          console.log("duplicated name is not allowed")
          this.clearAndCloseDialog()
          return
        }
        const type = this.dialog.submitEvent === "createNewFile" ? "file" : "dir"
        const event = this.dialog.submitEvent === "createNewFile" ? "createNewRemoteFile":"createNewRemoteDir"
        SIO.emitGlobal(event, this.projectRootDir, fullPath, this.selectedComponent.host, (rt)=>{
          if (!rt) {
            console.log(rt);
            return
          }
          const newItem = { id: fullPath, name, path:this.currentDir, type }
          if (this.dialog.submitEvent === "createNewDir") {
            newItem.children = []
          }
          const container = this.activeItem ? this.activeItem.children : this.items
          container.push(newItem)

          if (this.activeItem && !this.openItems.includes(this.activeItem.id)) {
            this.openItems.push(this.activeItem.id)
          }
        })
      } else {
        console.log("unsupported event", this.dialog.submitEvent)
      }
      this.clearAndCloseDialog()
    },
    closeDownloadDialog(){
      SIO.emitGlobal("removeDownloadFile", this.projectRootDir, this.downloadURL, ()=>{
        this.downloadURL=null
        this.downloadDialog=false
      });
    },
    download(){
      this.commitWaitingDownload(true);

      SIO.emitGlobal("downloadRemote", this.projectRootDir, this.activeItem.id, this.selectedComponent.host, (url)=>{
        this.commitWaitingDownload(false);

        if(url === null){
          console.log("download failed.");
          return
        }
        this.downloadURL=url
        this.downloadDialog=true
      });
    },
    openDialog (event) {
      if (["removeFile", "renameFile", "shareFile"].includes(event)) {
        if (!this.activeItem) {
          console.log("remove or rename without active item is not allowed")
          return
        }
        if (this.activeItem.type.startsWith("snd")) {
          console.log(`${event.replace("File", "")} SND or SNDD is not allowed`)
          return
        }
      }
      if(event === "shareFile"){
        this.dialog.inputField=this.activeItem.id
      }

      this.dialog.title = getTitle(event, this.activeItem ? this.activeItem.name : null)
      this.dialog.inputFieldLabel = getLabel(event)
      this.dialog.submitEvent = event
      this.dialog.open = true
    },
    showUploadDialog () {
      SIO.prompt();
    },
  },
}
</script>
