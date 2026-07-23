/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <div>
    <div v-if="! readonly">
      <v-spacer />
      <v-tooltip
        location="top"
        text="new folder"
      >
        <template #activator="{ props }">
          <v-btn
            :disabled="isSND"
            v-bind="props"
            icon="mdi-folder-plus-outline"
            data-cy="file_browser-new_dir-btn"
            @click="openDialog('createNewDir')"
          />
        </template>
      </v-tooltip>
      <v-tooltip
        text="new file"
        location="top"
      >
        <template #activator="{ props }">
          <v-btn
            :disabled="isSND"
            v-bind="props"
            icon="mdi-file-plus-outline"
            data-cy="file_browser-new_file-btn"
            @click="openDialog('createNewFile')"
          />
        </template>
      </v-tooltip>
      <v-tooltip
        text="rename"
        location="top"
      >
        <template #activator="{ props }">
          <v-btn
            :disabled="!isFileSelected || isSND"
            v-bind="props"
            icon="mdi-file-move-outline"
            @click="openDialog('rename')"
          />
        </template>
      </v-tooltip>
      <v-tooltip
        location="top"
        text="delete"
      >
        <template #activator="{ props }">
          <v-btn
            :disabled="!isFileSelected || isSND"
            v-bind="props"
            icon="mdi-file-remove-outline"
            data-cy="file_browser-remove_file-btn"
            @click="openDialog('remove')"
          />
        </template>
      </v-tooltip>
      <v-tooltip
        text="upload file"
        location="top"
      >
        <template #activator="{ props }">
          <v-btn
            :disabled="isSND"
            v-bind="props"
            icon="mdi-upload"
            data-cy="file_browser-upload-btn"
            @click="showUploadDialog"
          />
        </template>
      </v-tooltip>
      <v-tooltip
        text="download"
        location="top"
      >
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            icon="mdi-download"
            @click="download"
          />
        </template>
      </v-tooltip>
      <v-tooltip
        location="top"
        text="share file"
      >
        <template #activator="{ props }">
          <v-btn
            :disabled="!isFileSelected || isSND"
            icon="mdi-share-outline"
            v-bind="props"
            @click="openDialog('share')"
          />
        </template>
      </v-tooltip>
      <v-tooltip
        location="top"
        text="edit files"
      >
        <template #activator="{ props }">
          <v-btn
            :disabled="!isFileSelected || isSND"
            icon="mdi-file-edit-outline"
            v-bind="props"
            data-cy="file_browser-edit_files-btn"
            @click="openTextEditor"
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
      :active="activeItem"
      :open="openItems"
      :get-node-icon="getNodeIcon"
      :get-leaf-icon="getLeafIcon"
      data-cy="file_browser-treeview-treeview"
      @update:active="updateSelected"
    />
    <versatile-dialog
      v-model="dialog.open"
      max-width="40vw"
      :title="dialog.title"
      :buttons="dialogButtons"
      data-cy="file_browser-dialog-dialog"
      @ok="submitAndCloseDialog"
      @cancel="clearAndCloseDialog"
    >
      <template
        v-if="['createNewDir','createNewFile','rename','share'].includes(dialog.submitEvent)"
        #message
      >
        <v-text-field
          v-if="['createNewDir','createNewFile','rename'].includes(dialog.submitEvent)"
          v-model="dialog.inputField"
          autofocus
          :label="dialog.inputFieldLabel"
          :rules="[noDuplicate]"
          variant="outlined"
          data-cy="file_browser-input-text_field"
        />
        <v-text-field
          v-if="dialog.submitEvent === 'share'"
          v-model="dialog.inputField"
          readonly
          :label="dialog.inputFieldLabel"
        >
          <template #append>
            <v-tooltip
              v-model="showCopyButtonTooltipText"
              :text="copyButtonTooltipText"
              location="bottom"
            >
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
      v-model="conflictDialog.open"
      :title="`'${conflictDialog.filename}' already exists`"
      max-width="40vw"
      :buttons="conflictDialogButtons"
      @overwrite="resolveConflict('overwrite')"
      @rename="resolveConflict('rename')"
      @skip="resolveConflict('skip')"
    >
      <template #message>
        <span>A file or directory named <strong>{{ conflictDialog.filename }}</strong> already exists at the destination. What would you like to do?</span>
      </template>
    </versatile-dialog>
    <versatile-dialog
      v-model="downloadDialog"
      title="download content ready"
      max-width="30vw"
      :buttons="downloadDialogButton"
      @close="closeDownloadDialog"
    >
      <template #message>
        <v-row>
          <v-btn class="mx-auto mt-10 mb-6">
            <!-- Do NOT remove download attribute. some files may open in browser e.g. text, json -->
            <a
              :href="downloadURL"
              download
            >download</a>
          </v-btn>
        </v-row>
      </template>
    </versatile-dialog>
  </div>
</template>
<script>
import Debug from "debug";
const debug = Debug("wheel:fileBrowser");
import { mapState, mapGetters, mapMutations, mapActions } from "vuex";
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
    readonly: { type: Boolean, default: true }
  },
  emits: ["items-updated"],
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
      conflictDialogButtons: [
        { icon: "mdi-file-replace", label: "overwrite" },
        { icon: "mdi-file-plus", label: "keep both", event: "rename" },
        { icon: "mdi-cancel", label: "skip" }
      ],
      conflictDialog: {
        open: false,
        filename: "",
        uploadId: null
      },
      downloadURL: null,
      downloadDialog: false,
      showCopyButtonTooltipText: false,
      copyButtonTooltipText: "copy file path",
      fileListSeq: 0
    };
  },
  computed: {
    ...mapState(["projectRootDir", "selectedComponent", "selectedFile", "currentComponent", "copySelectedComponent", "projectState"]),
    ...mapGetters(["selectedComponentAbsPath", "pathSep"]),
    storagePath() {
      return this.copySelectedComponent.storagePath || "/";
    },
    isSND() {
      return this.activeItem !== null && this.activeItem.type.startsWith("snd");
    },
    isFileSelected() {
      return this.activeItem !== null;
    },
    needScriptCandidate() {
      if (!this.selectedComponent) {
        return false;
      }
      return !["for", "foreach", "workflow", "storage", "viewer"].includes(this.selectedComponent.type);
    },
    dialogButtons() {
      const requiresInput = ["createNewDir", "createNewFile", "rename"].includes(this.dialog.submitEvent);
      const isInvalid = requiresInput && (this.dialog.inputField === "" || !this.noDuplicate(this.dialog.inputField));
      return [
        { icon: "mdi-check", label: "ok", disabled: isInvalid },
        { icon: "mdi-close", label: "cancel" }
      ];
    }
  },
  watch: {
    currentComponent: {
      //edit workflow -> server respond workflow data -> fire this event
      handler(nv) {
        if (nv.descendants.some((e)=>{
          return e.ID === this.selectedComponent?.ID;
        })) {
          this.getComponentDirRootFiles();
        }
      },
      deep: true
    },

    selectedComponent(newVal, oldVal) {
      //Clear stale file selection when switching to a different component (or clearing selection).
      //Without this, clicking the same filename in the new component triggers a deselect
      //(because selectedFile still holds the old component's file path).
      if (!newVal || !oldVal || newVal.ID !== oldVal.ID) {
        this.activeItem = null;
        this.commitSelectedFile(null);
        //Clear stale file list so noDuplicate() never returns false based on old data
        //while the new component's file list is being fetched asynchronously.
        this.items = [];
      }
      this.getComponentDirRootFiles();
      this.currentDir = this.selectedComponent?.type === "storage" ? this.storagePath : this.selectedComponentAbsPath;
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
      SIO.onGlobal("uploadConflict", this.onUploadConflict);
      SIO.onGlobal("fileList", this.onFileListSaved);
    }
    this.currentDir = this.selectedComponent?.type === "storage" ? this.storagePath : this.selectedComponentAbsPath;
  },
  beforeUnmount() {
    SIO.removeUploaderEvent("choose", this.onChoose);
    SIO.removeUploaderEvent("complete", this.onUploadComplete);
    SIO.removeUploaderEvent("progress", this.updateProgressBar);
    SIO.off("uploadConflict", this.onUploadConflict);
    SIO.off("fileList", this.onFileListSaved);
  },
  methods: {
    ...mapActions(["openTextEditor"]),
    updateScriptCandidate() {
      if (!this.needScriptCandidate) {
        return;
      }
      //Emit items to parent (componentProperty) to update scriptCandidates
      this.$emit("items-updated", this.items);
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
      this.fileListSeq++;
      const seq = this.fileListSeq;
      const cb = (fileList)=>{
        if (seq !== this.fileListSeq || fileList === null || !this.selectedComponent) {
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
      const newSelectedFile = `${this.currentDir}${this.pathSep}${this.activeItem.name}`;

      //Deselect if clicking the same file again
      if (this.selectedFile === newSelectedFile) {
        this.commitSelectedFile(null);
        this.activeItem = null;
      } else {
        this.commitSelectedFile(newSelectedFile);
      }
    },
    onUploadConflict({ filename, uploadId }) {
      this.conflictDialog.filename = filename;
      this.conflictDialog.uploadId = uploadId;
      this.conflictDialog.open = true;
    },
    resolveConflict(choice) {
      SIO.emitGlobal("resolveUploadConflict", { uploadId: this.conflictDialog.uploadId, choice }, SIO.generalCallback);
      this.conflictDialog.open = false;
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
    onFileListSaved() {
      //The uploader's "complete" event (onUploadComplete) fires as soon as the bytes are
      //received, but the server still needs to move the file into place and "git add" it
      //asynchronously afterwards (see onUploadFileSaved on the server side). The server
      //emits "fileList" once that work is actually finished, so refresh again here to
      //pick up the newly uploaded file without requiring the panel to be closed and reopened.
      if (["running", "preparing"].includes(this.projectState)) {
        return;
      }
      this.getComponentDirRootFiles();
    },
    updateProgressBar(event) {
      if (["running", "preparing"].includes(this.projectState)) {
        return;
      }
      this.percentUploaded = (event.bytesLoaded / event.file.size) * 100;
    },
    ...mapMutations({
      commitSelectedFile: "selectedFile",
      commitWaitingDownload: "waitingDownload"
    }),
    getChildren(item) {
      return new Promise((resolve, reject)=>{
        const cb = (fileList)=>{
          if (!Array.isArray(fileList)) {
            reject(fileList);
            return;
          }
          const children = fileList
            .filter((e)=>{ return !e.isComponentDir; })
            .map(fileListModifier.bind(null, this.pathSep));
          //Re-look up the item at callback time: this.items may have been replaced
          //by a getComponentDirRootFiles() refresh while the socket request was in flight.
          const currentItem = this.getActiveItem(item.id);
          (currentItem || item).children = children;
          resolve();
        };
        const activeItem = this.getActiveItem(item.id);
        if (activeItem === null) {
          resolve();
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
      if (!["remove", "rename", "createNewFile", "createNewDir"].includes(this.dialog.submitEvent)) {
        console.log("unsupported event", this.dialog.submitEvent);
        this.clearAndCloseDialog();
        return;
      }
      if (this.dialog.submitEvent === "remove") {
        SIO.emitGlobal("removeFile", this.projectRootDir, this.activeItem.id, (rt)=>{
          if (!rt) {
            console.log(rt);
            return;
          }
          removeItem(this.items, this.activeItem.id);
          this.updateScriptCandidate();
          this.commitSelectedFile(null);
          this.currentDir = this.selectedComponent?.type === "storage" ? this.storagePath : this.selectedComponentAbsPath;
          this.activeItem = null;
        });
      } else if (this.dialog.submitEvent === "rename") {
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
        //Invalidate any in-flight getFileList so its stale response won't overwrite the new item.
        this.fileListSeq++;
        SIO.emitGlobal(this.dialog.submitEvent, this.projectRootDir, fullPath, (rt)=>{
          if (!rt) {
            console.log(rt);
            this.clearAndCloseDialog();
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
          this.clearAndCloseDialog();
        });
        return;
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
      if (["remove", "rename", "share"].includes(event)) {
        if (!this.activeItem) {
          console.log("remove or rename without active item is not allowed");
          return;
        }
        if (this.activeItem.type.startsWith("snd")) {
          console.log(`${event.replace("File", "")} SND or SNDD is not allowed`);
          return;
        }
      }
      if (event === "share") {
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
