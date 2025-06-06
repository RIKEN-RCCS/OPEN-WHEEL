/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <div>
    <div v-if="! readonly">
      <v-spacer />
      <v-tooltip location="top" text="new folder"
      >
        <template #activator="{ props }">
          <v-btn
            :disabled="isSND"
            v-bind="props"
            @click="openDialog('createNewDir')"
            icon=mdi-folder-plus-outline
            data-cy="file_browser-new_dir-btn"
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
            data-cy="file_browser-new_file-btn"
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
            data-cy="file_browser-remove_file-btn"
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
      :items="items"
      :load-children="getChildren"
      activatable
      :open="openItems"
      @update:active="updateSelected"
      :get-node-icon="getNodeIcon"
      :get-leaf-icon="getLeafIcon"
      data-cy="file_browser-treeview-treeview"
    />
    <versatile-dialog
      v-model="dialog.open"
      max-width="40vw"
      :title="dialog.title"
      @ok="submitAndCloseDialog"
      @cancel="clearAndCloseDialog"
      data-cy="file_browser-dialog-dialog"
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
          data-cy="file_browser-input-text_field"
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
        >
          <template #append>
            <v-tooltip :text=copyButtonTooltipText location="bottom" v-model=showCopyButtonTooltipText>
              <template #activator="{ props }">
                <v-btn
                  icon="mdi-content-copy"
                  v-bind="props"
                  @click=copyToClipboard
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
import Debug from "debug";
const debug = Debug("wheel:fileBrowser");
import { mapState, mapGetters, mapMutations } from "vuex";
import SIO from "../lib/socketIOWrapper.js";
import versatileDialog from "../components/versatileDialog.vue";
import myTreeview from "../components/common/myTreeview.vue";
import { _getActiveItem, icons, openIcons, fileListModifier, removeItem, getTitle, getLabel } from "../components/common/fileTreeUtils.js";

export default {
  name: "FileBrowser",
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
      currentDir: null,
      activeItem: null,
      uploading: false,
      percentUploaded: 0,
      openItems: [],
      items: [],
      dialog: {
        open: false,
        title: "",
        withInputField: true,
        inputFieldLabel: "",
        inputField: "",
        submitArgs: []
      },
      downloadDialogButton: [
        { icon: "mdi-close", label: "close" }
      ],
      downloadURL: null,
      downloadDialog: false,
      showCopyButtonTooltipText: false,
      copyButtonTooltipText: "copy file path"
    };
  },
  computed: {
    ...mapState(["selectedComponent", "selectedFile", "currentComponent", "copySelectedComponent", "projectState"]),
    ...mapGetters(["selectedComponentAbsPath", "pathSep"]),
    storagePath() {
      return this.copySelectedComponent.storagePath || "/";
    },
    isSND() {
      return this.activeItem !== null && this.activeItem.type.startsWith("snd");
    },
    needScriptCandidate() {
      return !["for", "foreach", "workflow", "storage", "viewer"].includes(this.selectedComponent.type);
    }
  },
  watch: {
    currentComponent: {
      //edit workflow -> server respond workflow data -> fire this event
      handler(nv) {
        if (nv.descendants.some((e)=>{
          return e.ID === this.selectedComponent.ID;
        })) {
          this.getComponentDirRootFiles();
        }
      },
      deep: true
    },
    selectedComponent() {
      this.getComponentDirRootFiles();
      this.currentDir = this.selectedComponentAbsPath;
    }
  },
  mounted() {
    this.getComponentDirRootFiles();
    if (!this.readonly) {
      const recaptchaScript = document.createElement("script");
      recaptchaScript.setAttribute(
        "src",
        "/siofu/client.js"
      );
      document.head.appendChild(recaptchaScript);
      SIO.listenOnDrop(this.$el);
      SIO.onUploaderEvent("choose", this.onChoose);
      SIO.onUploaderEvent("complete", this.onUploadComplete);
      SIO.onUploaderEvent("progress", this.updateProgressBar);
    }
    this.currentDir = this.selectedComponent.type === "storage" ? this.storagePath : this.selectedComponentAbsPath;
  },
  beforeDestroy() {
    SIO.removeUploaderEvent("choose", this.onChoose);
    SIO.removeUploaderEvent("complete", this.onUploadComplete);
    SIO.removeUploaderEvent("progress", this.updateProgressBar);
  },
  methods: {
    updateScriptCandidate() {
      if (!this.needScriptCandidate) {
        return;
      }
      const scriptCandidates = this.items
        .filter((e)=>{
          return e.type.startsWith("file");
        })
        .map((e)=>{
          return e.name;
        });
      this.commitScriptCandidates(scriptCandidates);
    },
    getNodeIcon(isOpen, item) {
      return isOpen ? openIcons[item.type] : icons[item.type];
    },
    getLeafIcon(item) {
      return icons[item.type];
    },
    async copyToClipboard() {
      debug("copy file path", this.dialog.inputField);
      await navigator.clipboard.writeText(this.dialog.inputField);
      this.copyButtonTooltipText = "copied!";
      this.showCopyButtonTooltipText = true;
    },
    getActiveItem(key) {
      return _getActiveItem(this.items, key);
    },
    getComponentDirRootFiles() {
      if (!this.selectedComponent) {
        return;
      }
      const cb = (fileList)=>{
        if (fileList === null) {
          return;
        }
        this.items = fileList
          .filter((e)=>{ return !e.isComponentDir; })
          .map(fileListModifier.bind(null, this.pathSep));
        this.updateScriptCandidate();
      };
      const path = this.selectedComponent.type === "storage" ? this.storagePath : this.selectedComponentAbsPath;
      const mode = this.selectedComponent.type === "source" ? "sourceComponent" : "underComponent";
      SIO.emitGlobal("getFileList", this.projectRootDir, { path, mode }, cb);
    },
    noDuplicate(v) {
      return !this.items
        .map((e)=>{ return e.name; })
        .includes(v);
    },
    updateSelected(activeItem) {
      this.activeItem = activeItem;
      if (this.activeItem === null) {
        console.log("failed to get current selected Item");
        return;
      }
      this.currentDir = this.activeItem.type === "file" ? this.activeItem.path : this.activeItem.id;
      this.commitSelectedFile(`${this.currentDir}${this.pathSep}${this.activeItem.name}`);
    },
    onChoose(event) {
      if (["running", "preparing"].includes(this.projectState)) {
        return;
      }
      for (const file of event.files) {
        file.meta.currentDir = this.currentDir;
        file.meta.orgName = file.name;
        file.meta.projectRootDir = this.projectRootDir;
        file.meta.componentDir = this.selectedComponentAbsPath;
        file.meta.clientID = SIO.getID();
        file.meta.skipGit = false;
        file.meta.overwrite = false;
      }
      this.uploading = true;
    },
    onUploadComplete() {
      if (["running", "preparing"].includes(this.projectState)) {
        return;
      }
      this.uploading = false;
      this.getComponentDirRootFiles();
    },
    updateProgressBar(event) {
      if (["running", "preparing"].includes(this.projectState)) {
        return;
      }
      this.percentUploaded = (event.bytesLoaded / event.file.size) * 100;
    },
    ...mapMutations({
      commitScriptCandidates: "scriptCandidates",
      commitSelectedFile: "selectedFile",
      commitWaitingDownload: "waitingDownload"
    }),
    getChildren(item) {
      return new Promise((resolve, reject)=>{
        const cb = (fileList)=>{
          if (!Array.isArray(fileList)) {
            reject(fileList);
          }
          item.children = fileList
            .filter((e)=>{ return !e.isComponentDir; })
            .map(fileListModifier.bind(null, this.pathSep));
          resolve();
        };
        const activeItem = this.getActiveItem(item.id);
        if (activeItem === null) {
          console.log("failed to get current selected Item");
          return;
        }
        if (item.type === "dir" || item.type === "dir-link") {
          SIO.emitGlobal("getFileList", this.projectRootDir, { path: item.id, mode: "underComponent" }, cb);
        } else {
          SIO.emitGlobal("getSNDContents", this.projectRootDir, item.path, item.name, item.type.startsWith("sndd"), cb);
        }
      });
    },
    clearAndCloseDialog() {
      this.dialog.title = "";
      this.dialog.inputFieldLabel = "";
      this.dialog.inputField = "";
      this.dialog.open = false;
      this.copyButtonTooltipText = "copy file path";
      this.showCopyButtonTooltipText = false;
    },
    submitAndCloseDialog() {
      if (this.dialog.submitEvent === "removeFile") {
        SIO.emitGlobal("removeFile", this.projectRootDir, this.activeItem.id, (rt)=>{
          if (!rt) {
            console.log(rt);
            return;
          }
          removeItem(this.items, this.activeItem.id);
          this.updateScriptCandidate();
          this.commitSelectedFile(null);
          this.currentDir = this.selectedComponentAbsPath;
          this.activeItem = null;
        });
      } else if (this.dialog.submitEvent === "renameFile") {
        const newName = this.dialog.inputField;
        const oldName = this.activeItem.name;

        SIO.emitGlobal("renameFile", this.projectRootDir, this.activeItem.path, this.activeItem.name, newName, (rt)=>{
          if (!rt) {
            console.log(rt);
            return;
          }
          this.activeItem.name = newName;
          const re = new RegExp(oldName + "$");
          this.activeItem.id = this.activeItem.id.replace(re, newName);
          this.updateSelected(this.activeItem);
          this.updateScriptCandidate();
        });
      } else if (this.dialog.submitEvent === "createNewFile" || this.dialog.submitEvent === "createNewDir") {
        const name = this.dialog.inputField;
        const fullPath = `${this.currentDir}${this.pathSep}${name}`;
        if (!this.noDuplicate(name)) {
          console.log("duplicated name is not allowed");
          this.clearAndCloseDialog();
          return;
        }
        const type = this.dialog.submitEvent === "createNewFile" ? "file" : "dir";
        SIO.emitGlobal(this.dialog.submitEvent, this.projectRootDir, fullPath, (rt)=>{
          if (!rt) {
            console.log(rt);
            return;
          }
          const newItem = { id: fullPath, name, path: this.currentDir, type };
          if (this.dialog.submitEvent === "createNewDir") {
            newItem.children = [];
          }
          const container = this.activeItem ? this.activeItem.children : this.items;
          container.push(newItem);
          if (this.activeItem && !this.openItems.includes(this.activeItem.id)) {
            this.openItems.push(this.activeItem.id);
          }
          this.updateScriptCandidate();
        });
      } else {
        console.log("unsupported event", this.dialog.submitEvent);
      }
      this.clearAndCloseDialog();
    },
    closeDownloadDialog() {
      SIO.emitGlobal("removeDownloadFile", this.projectRootDir, this.downloadURL, ()=>{
        this.downloadURL = null;
        this.downloadDialog = false;
      });
    },
    download() {
      this.commitWaitingDownload(true);
      debug(`download request: ${this.activeItem.id}`);
      SIO.emitGlobal("download", this.projectRootDir, this.activeItem.id, (url)=>{
        this.commitWaitingDownload(false);
        if (url === null) {
          console.log("download failed.");
          return;
        }
        this.downloadURL = url;
        this.downloadDialog = true;
      });
    },
    openDialog(event) {
      if (["removeFile", "renameFile", "shareFile"].includes(event)) {
        if (!this.activeItem) {
          console.log("remove or rename without active item is not allowed");
          return;
        }
        if (this.activeItem.type.startsWith("snd")) {
          console.log(`${event.replace("File", "")} SND or SNDD is not allowed`);
          return;
        }
      }
      if (event === "shareFile") {
        this.dialog.inputField = this.activeItem.id;
      }

      this.dialog.title = getTitle(event, this.activeItem ? this.activeItem.name : null);
      this.dialog.inputFieldLabel = getLabel(event);
      this.dialog.submitEvent = event;
      this.dialog.open = true;
    },
    showUploadDialog() {
      SIO.prompt();
    }
  }
};
</script>
