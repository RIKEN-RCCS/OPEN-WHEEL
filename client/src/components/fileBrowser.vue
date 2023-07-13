/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <div>
    <div v-if="! readonly">
      <v-spacer />
      <v-tooltip top>
        <template #activator="{ on, attrs }">
          <v-btn
            :disabled="isSND"
          >
            <v-icon
              v-bind="attrs"
              v-on="on"
              @click="openDialog('createNewDir')"
            >
              mdi-folder-plus-outline
            </v-icon>
          </v-btn>
        </template>
        new folder
      </v-tooltip>
      <v-tooltip top>
        <template #activator="{ on, attrs }">
          <v-btn
            :disabled="isSND"
          >
            <v-icon
              v-bind="attrs"
              v-on="on"
              @click="openDialog('createNewFile')"
            >
              mdi-file-plus-outline
            </v-icon>
          </v-btn>
        </template>
        new file
      </v-tooltip>
      <v-tooltip top>
        <template #activator="{ on, attrs }">
          <v-btn
            :disabled="isSND"
          >
            <v-icon
              v-bind="attrs"
              v-on="on"
              @click="openDialog('renameFile')"
            >
              mdi-file-move-outline
            </v-icon>
          </v-btn>
        </template>
        rename
      </v-tooltip>
      <v-tooltip top>
        <template #activator="{ on, attrs }">
          <v-btn
            :disabled="isSND"
          >
            <v-icon
              v-bind="attrs"
              v-on="on"
              @click="openDialog('removeFile')"
            >
              mdi-file-remove-outline
            </v-icon>
          </v-btn>
        </template>
        delete
      </v-tooltip>
      <v-tooltip top>
        <template #activator="{ on, attrs }">
          <v-btn
            :disabled="isSND"
          >
            <v-icon
              v-bind="attrs"
              v-on="on"
              @click="showUploadDialog"
            >
              mdi-upload
            </v-icon>
          </v-btn>
        </template>
        upload file
      </v-tooltip>
      <v-tooltip top>
        <template #activator="{ on, attrs }">
          <v-btn
            :disabled="isSND"
          >
            <v-icon
              v-bind="attrs"
              v-on="on"
              @click="download"
            >
              mdi-download
            </v-icon>
          </v-btn>
        </template>
        download
      </v-tooltip>
      <v-tooltip top>
        <template #activator="{ on, attrs }">
          <v-btn
            :disabled="isSND"
          >
            <v-icon
              v-bind="attrs"
              v-on="on"
              @click="openDialog('shareFile')"
            >
              mdi-share-outline
            </v-icon>
          </v-btn>
        </template>
        share file
      </v-tooltip>
      <v-spacer />
      <v-progress-linear
        v-show="uploading"
        value="percentUploaded"
      />
    </div>
    <v-treeview
      :active="activeItems"
      :items="items"
      :load-children="getChildren"
      activatable
      :open="openItems"
      @update:active="updateSelected"
    >
      <template #prepend="{item, open}">
        <v-icon v-if="item.children !== null">
          {{ open ? openIcons[item.type] : icons[item.type] }}
        </v-icon>
        <v-icon v-else>
          {{ icons[item.type] }}
        </v-icon>
      </template>
    </v-treeview>
    <versatile-dialog
      v-model="dialog.open"
      max-width="40vw"
      :title="dialog.title"
      :message="dialog.message"
      @ok="submitAndCloseDialog"
      @cancel="clearAndCloseDialog"
    >
      <template
        v-if="['createNewDir','createNewFile','renameFile'].includes(dialog.submitEvent)"
        slot="message"
      >
        <v-text-field
          v-model="dialog.inputField"
          :label="dialog.inputFieldLabel"
          :rules="[noDuplicate]"
        />
      </template>
      <template
        v-if="dialog.submitEvent === 'shareFile'"
        slot="message"
      >
        <v-text-field
          v-model="dialog.inputField"
          readonly
          :label="dialog.inputFieldLabel"
          :rules="[noDuplicate]"
        >
          <template #append-outer>
            <v-tooltip
              bottom
            >
              <template #activator="{ on }">
                <v-icon
                  ref="icon"
                  @click="copyToClipboard"
                  v-on="on"
                >
                  mdi-content-copy
                </v-icon>
              </template>
              copy file path
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
      <template
        slot="message"
      >
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
  const debug = Debug("wheel:fileBrowser");
  import { mapState, mapGetters, mapMutations } from "vuex"
  import SIO from "@/lib/socketIOWrapper.js"
  import versatileDialog from "@/components/versatileDialog.vue";
  import { removeFromArray } from "@/lib/clientUtility.js"

  function fileListModifier (pathsep, e) {
    const rt = {
      id: `${e.path}${pathsep}${e.name}`,
      path: e.path,
      name: e.name,
      type: `${e.type}${e.islink ? "-link" : ""}`,
    }
    if (["dir", "dir-link", "snd", "snd-link", "sndd", "sndd-link"].includes(e.type)) {
      rt.children = []
    }
    return rt
  }

  function removeItem (items, key) {
    for (const item of items) {
      if (item.id === key) {
        removeFromArray(items, { id: key }, "id")
        return true
      }
      if (Array.isArray(item.children) && item.children.length > 0) {
        const found = removeItem(item.children, key)
        if (found) {
          return true
        }
      }
    }
  }

  //get selected item from displayed items
  function _getActiveItem (items, key ) {
    for (const item of items) {
      if (Array.isArray(item.children) && item.children.length > 0) {
        const rt = _getActiveItem(item.children, key)
        if (rt) {
          return rt
        }
      }
      if (item.id === key) {
        return item
      }
    }
    return null
  }

  function getTitle (event, itemName) {
    const titles = {
      createNewDir: "create new directory",
      createNewFile: "create new File",
      removeFile: `are you sure you want to delete ${itemName} ?`,
      renameFile: `rename ${itemName}`,
      shareFile:  `copy file path ${itemName}`,
    }
    return titles[event]
  }
  function getLabel (event) {
    const labels = {
      createNewDir: "new directory name",
      createNewFile: "new file name",
      renameFile: "new name",
      shareFile: "file path",
    }
    return labels[event]
  }
  export default {
    name: "FileBrowser",
    components: {
      versatileDialog,
    },
    props: {
      readonly: { type: Boolean, default: true },
      projectRootDir: { type: String, default: null }
    },
    data: function () {
      return {
        currentDir: null,
        activeItem: null,
        uploading:false,
        percentUploaded: 0,
        activeItems: [],
        openItems: [],
        items: [],
        icons: {
          file: "mdi-file-outline",
          "file-link": "mdi-file-link-outline",
          dir: "mdi-folder",
          "dir-link": "mdi-link-box-outline",
          "deadlink-link": "mdi-file-link",
          sndd: "mdi-folder-multiple-outline",
          snd: "mdi-file-multiple-outline",
        },
        openIcons: {
          dir: "mdi-folder-open",
          sndd: "mdi-folder-multiple-outline",
          snd: "mdi-file-multiple-outline",
        },
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
        return this.copySelectedComponent.storagePath || "/"
      },
      isSND(){
        return this.activeItem !== null && this.activeItem.type.startsWith("snd");
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
        // edit workflow -> server respond workflow data -> fire this event
        handler(nv,ov){
          if(nv.descendants.some((e)=> {
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
    },
    mounted () {
      this.getComponentDirRootFiles();
      if(! this.readonly){
        const recaptchaScript = document.createElement("script");
        recaptchaScript.setAttribute(
          "src",
          "/siofu/client.js"
        );
        document.head.appendChild(recaptchaScript);
        SIO.listenOnDrop(this.$el)
        SIO.onUploaderEvent("choose", this.onChoose)
        SIO.onUploaderEvent("complete", this.onUploadComplete)
        SIO.onUploaderEvent("progress", this.updateProgressBar)
      }
      this.currentDir=this.selectedComponentAbsPath
    },
    beforeDestroy(){
      SIO.removeUploaderEvent("choose", this.onChoose)
      SIO.removeUploaderEvent("complete", this.onUploadComplete)
      SIO.removeUploaderEvent("progress", this.updateProgressBar)
    },
    methods: {
      copyToClipboard(){
        this.$copyText(this.dialog.inputField, this.$refs.icon.$el)
      },
      getActiveItem (key) {
        return  _getActiveItem(this.items,key);
      },
      getComponentDirRootFiles(){
        const cb= (fileList)=>{
          if(fileList === null){
            return;
          }
          this.items = fileList
            .filter((e)=>{return !e.isComponentDir})
            .map(fileListModifier.bind(null, this.pathSep))
        }
        const path = this.selectedComponent.type === "storage" ? this.storagePath: this.selectedComponentAbsPath;
        const mode = this.selectedComponent.type === "source" ? "sourceComponent": "underComponent"
        SIO.emitGlobal("getFileList",this.projectRootDir,  {path, mode}, cb)
      },
      noDuplicate(v){
       return ! this.items.map((e)=>{ return e.name }).includes(v)
      },
      updateSelected(activeItems){
        if(!activeItems[0]){
          this.activeItem=null
          return
        }
        this.activeItem = this.getActiveItem(activeItems[0])
        if(this.activeItem === null){
          console.log("failed to get current selected Item");
          return
        }
        this.currentDir=this.activeItem.path
        this.commitSelectedFile(`${this.currentDir}${this.pathSep}${this.activeItem.name}`);
      },
      onChoose(event){
        for (const file of event.files){
          file.meta.currentDir=this.currentDir
          file.meta.orgName=file.name
          file.meta.projectRootDir=this.projectRootDir
          file.meta.componentDir=this.selectedComponentAbsPath
          file.meta.clientID=SIO.getID()
          file.meta.skipGit=false;
          file.meta.overwrite=false;
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
          const path = this.selectedComponent.type === "storage"
            ?  [this.storagePath, item.id.replace(this.selectedComponentAbsPath+this.pathSep,"")].join(this.pathSep)
            : item.id
          if(item.type === "dir" || item.type === "dir-link"){
              SIO.emitGlobal("getFileList",this.projectRootDir,  {path, mode: "underComponent"}, cb)
          }else{
            SIO.emitGlobal("getSNDContents", this.projectRootDir, item.path, item.name, item.type.startsWith("sndd"),cb)
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
          SIO.emitGlobal("removeFile", this.projectRootDir, this.activeItem.id, (rt)=>{
            if (!rt) {
              return
            }
            removeItem(this.items, this.activeItem.id)
            this.commitSelectedFile(null);
            this.currentDir=this.selectedComponentAbsPath
          })
        } else if (this.dialog.submitEvent === "renameFile") {
          const newName = this.dialog.inputField

          SIO.emitGlobal("renameFile", this.projectRootDir, this.currentDir, this.activeItem.name, newName, (rt)=>{
            if (!rt) {
              return
            }
            this.activeItem.name = newName
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
          SIO.emitGlobal(this.dialog.submitEvent, this.projectRootDir, fullPath, (rt)=>{
            if (!rt) {
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
        debug(`download request: ${this.activeItem.id}`);
        SIO.emitGlobal('download', this.projectRootDir, this.activeItem.id, (url)=>{
          this.downloadURL=url
          this.downloadDialog=true
          this.commitWaitingDownload(false);
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
