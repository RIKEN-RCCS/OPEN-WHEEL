/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <div>
    <v-tabs
      v-model="activeTab"
      @update:model-value="changeTab"
    >
      <v-tab
        v-for="(file,index) of files"
        :key="file.order"
        class="text-none"
      >
        <v-tooltip location="top">
          <template #activator="{props}">
            <span v-bind="props">
              {{ file.filename }}
            </span>
          </template>
          <span>{{ file.absPath }}</span>
        </v-tooltip>
        <v-btn
          small
          icon="mdi-close"
          @click.stop="confirmClose(index)"
        />
      </v-tab>
      <v-tab @click.stop>
        <v-dialog v-model="newFilePrompt">
          <template #activator="{ props }">
            <v-btn
              block
              icon="mdi-plus"
              v-bind="props"
            />
          </template>
          <v-card>
            <v-card-text>
              <v-text-field
                v-model="newFilename"
                label="new file name"
                :rules="[isValidName]"
                data-cy="tab_editor-editor-text_field"
              />
            </v-card-text>
            <v-card-actions>
              <v-btn
                prepend-icon="mdi-pencil-outline"
                text="open"
                @click="openNewTab(newFilename);closeNewFileDialog()"
              />
              <v-btn
                prepend-icon="mdi-close"
                text="cancel"
                @click="closeNewFileDialog"
              />
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-tab>
    </v-tabs>
    <v-card
      id="editor"
      grow
      :height="editorHeight"
    />
    <v-dialog
      v-model="closeDialog"
      max-width="500"
      persistent
    >
      <v-card>
        <v-card-title>Close Tab</v-card-title>
        <v-card-text>
          This file is changed. Discard or save?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            text="Cancel"
            @click="closeDialog = false"
          />
          <v-btn
            text="Discard"
            color="warning"
            @click="executeDiscard"
          />
          <v-btn
            text="Save"
            color="primary"
            @click="executeSaveAndClose"
          />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
"use strict";
import { mapActions, mapState, mapGetters, mapMutations } from "vuex";
import { markRaw } from "vue";
import SIO from "../..//lib/socketIOWrapper.js";
import { isValidInputFilename } from "../..//lib/utility.js";
import { editorHeight } from "../..//lib/constants.json";
import ace from "ace-builds";
import "ace-builds/src-noconflict/theme-idle_fingers.js";

export default {
  name: "TabEditor",
  props: {
    readOnly: {
      type: Boolean,
      required: true
    }
  },
  emits: ["jobscript", "content-changed"],
  data: function () {
    return {
      newFilePrompt: false,
      newFilename: null,
      activeTab: 0,
      files: [],
      editor: null,
      isJobScript: false,
      editorHeight,
      autoSaveTimer: null,
      closeDialog: false,
      pendingCloseIndex: null,
      sessionResizeHandler: null,
      sessionJobscriptHandler: null
    };
  },
  computed: {
    ...mapState(["selectedFile",
      "selectedText",
      "projectRootDir",
      "componentPath",
      "selectedComponent"
    ]),
    ...mapGetters(["pathSep", "selectedComponentAbsPath"])
  },
  watch: {
    readOnly() {
      if (this.editor) {
        this.editor.setReadOnly(this.readOnly);
      }
    },
    activeTab(nv, ov) {
      if (nv >= this.files.length) {
        this.activeTab = ov;
      }
    }
  },
  mounted: function () {
    this.editor = markRaw(ace.edit("editor"));
    this.editor.setOptions({
      theme: "ace/theme/idle_fingers",
      autoScrollEditorIntoView: true,
      highlightSelectedWord: true,
      highlightActiveLine: true,
      readOnly: this.readOnly
    });
    this.sessionResizeHandler = this.editor.resize.bind(this.editor);
    this.sessionJobscriptHandler = ()=>{
      const isJobScript = typeof this.editor.find("#### WHEEL inserted lines ####", { start: { row: 0, column: 0 } }) !== "undefined";
      this.$emit("jobscript", isJobScript);
    };
    this.editor.on("changeSession", this.sessionResizeHandler);
    this.editor.on("changeSession", this.sessionJobscriptHandler);

    SIO.onGlobal("file", this.onFile);
    if (typeof this.selectedFile === "string") {
      SIO.emitGlobal("openFile", this.projectRootDir, this.selectedFile, false, (rt)=>{
        if (rt instanceof Error) {
          console.log(rt);
        }
      });
    }
  },
  beforeUnmount() {
    SIO.off("file", this.onFile);
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }
    for (const file of this.files) {
      this.cleanupSession(file);
    }
    this.files = [];
    if (this.editor) {
      this.editor.off("changeSession", this.sessionResizeHandler);
      this.editor.off("changeSession", this.sessionJobscriptHandler);
      this.sessionResizeHandler = null;
      this.sessionJobscriptHandler = null;
      this.editor.destroy();
      this.editor = null;
    }
  },
  methods: {
    ...mapMutations({ commitSelectedFile: "selectedFile",
      commitSelectedText: "selectedText" }
    ),
    ...mapActions({
      showSnackbar: "showSnackbar"
    }),

    /**
     * Handle incoming file data from socket and open it in a new tab.
     * @param {object} file - File data object from server
     */
    onFile(file) {
      //check arraived file is already opened or not
      const existingTab = this.files.findIndex((e)=>{
        return e.filename === file.filename && e.dirname === file.dirname;
      });
      //just switch tab if arraived file is already opened
      if (existingTab !== -1) {
        this.activeTab = existingTab;
        return;
      }
      //open new tab for arraived file
      file.editorSession = markRaw(ace.createEditSession(file.content));
      file.absPath = `${file.dirname}${this.pathSep}${file.filename}`;
      file.initialContent = file.content; //Store initial content for revert
      file.changeSelectionHandler = ()=>{
        this.commitSelectedText(this.editor.getSelectedText());
      };
      file.contentChangedHandler = ()=>{
        this.$emit("content-changed");
      };
      file.autoSaveHandler = ()=>{
        this.scheduleAutoSave();
      };
      this.files.push(file);

      //select last tab after DOM is updated
      this.$nextTick(function () {
        if (!this.editor) {
          return;
        }
        this.activeTab = this.files.length - 1;
        const session = this.files[this.activeTab].editorSession;
        this.editor.setSession(session);
        this.editor.resize();
        session.selection.on("changeSelection", file.changeSelectionHandler);
        //Emit content-changed event when editor content changes
        session.on("change", file.contentChangedHandler);
        //Schedule auto-save when session content changes
        session.on("change", file.autoSaveHandler);
      });
    },
    isValidName(v) {
      //allow . / - and alphanumeric chars
      return isValidInputFilename(v) || "invalid filename";
    },
    confirmClose(index) {
      const file = this.files[index];
      const document = file.editorSession.getDocument();
      const content = document.getValue();

      //If file is not changed, close directly
      if (file.initialContent === content) {
        this.closeTab(index);
      } else {
        //Show dialog for changed file
        this.pendingCloseIndex = index;
        this.closeDialog = true;
      }
    },
    executeDiscard() {
      if (this.pendingCloseIndex !== null) {
        const file = this.files[this.pendingCloseIndex];
        const document = file.editorSession.getDocument();
        const initialContent = file.initialContent || "";

        //Revert to initial content
        document.setValue(initialContent);

        //Save reverted content to server
        SIO.emitGlobal("saveFile", this.projectRootDir, file.filename, file.dirname, initialContent, (rt)=>{
          if (!rt) {
            console.log("ERROR: discard/revert failed:", rt);
            this.showSnackbar(`${file.filename} discard failed`);
          } else {
            file.content = initialContent;
            this.showSnackbar({ message: `${file.filename} discarded`, timeout: 2000 });
          }
        });

        //Close the tab
        this.closeTab(this.pendingCloseIndex);
        this.pendingCloseIndex = null;
      }
      this.closeDialog = false;
    },
    executeSaveAndClose() {
      //Auto-save has already saved the file, so just close the tab
      if (this.pendingCloseIndex !== null) {
        this.closeTab(this.pendingCloseIndex);
        this.pendingCloseIndex = null;
      }
      this.closeDialog = false;
    },
    async openNewTab(filename, argDirname) {
      const dirname = argDirname || this.selectedComponentAbsPath;
      if (!isValidInputFilename(filename)) {
        return this.closeNewFileDialog();
      }
      const existingTab = this.files.findIndex((e)=>{
        return e.filename === filename && e.dirname === dirname;
      });
      if (existingTab === -1) {
        const absFilename = `${dirname}${this.pathSep}${filename}`;
        SIO.emitGlobal("openFile", this.projectRootDir, absFilename, false, (rt)=>{
          if (rt instanceof Error) {
            console.log("file open error!", rt);
          }
        });
      } else {
        this.activeTab = existingTab;
        this.changeTab(existingTab);
      }
    },
    closeNewFileDialog() {
      //clear temporaly variables and close prompt
      this.newFilename = null;
      this.newFilePrompt = false;
    },
    insertSnipet(argSnipet) {
      //this function will be called from parent component
      const session = this.editor.getSession();
      const range = this.editor.find("#### WHEEL inserted lines ####", { start: { row: 0, column: 0 } }) || new ace.Range(0, 0, 0, 0);
      range.start.row = 0;
      range.start.column = 0;
      const snipet = range.end.row === 0 && range.end.column === 0 ? argSnipet : argSnipet.trimEnd();
      session.replace(range, snipet);
      this.$emit("jobscript", true);
    },
    removeSnipet() {
      //this function will be called from parent component
      const session = this.editor.getSession();
      const range = this.editor.find("#### WHEEL inserted lines ####", { start: { row: 0, column: 0 } });
      if (!range) {
        return;
      }
      range.start.row = 0;
      range.start.column = 0;
      session.replace(range, "");
      this.$emit("jobscript", false);
    },
    insertBraces() {
      //this function will be called from parent component
      const selectedRange = this.editor.getSelection().getRange();
      const session = this.editor.getSession();
      session.insert(selectedRange.end, " }}");
      session.insert(selectedRange.start, "{{ ");
      this.editor.getSelection().clearSelection();
    },
    save(index) {
      return new Promise((resolve, reject)=>{
        const file = this.files[index];
        const document = file.editorSession.getDocument();
        const content = document.getValue();
        if (file.content === content) {
          console.log("do not call 'saveFile' API because file is not changed. index=", index);
          return;
        }
        SIO.emitGlobal("saveFile", this.projectRootDir, file.filename, file.dirname, content, (rt)=>{
          if (!rt) {
            console.log("ERROR: file save failed:", rt);
            this.showSnackbar(`${file.filename} save failed`);
            reject(rt);
          }
          this.showSnackbar({ message: `${file.filename} saved`, timeout: 2000 });
          file.content = content;
          resolve(rt);
        });
      });
    },
    getChangedFiles() {
      return this.files.map((file)=>{
        const document = file.editorSession.getDocument();
        const content = document.getValue();
        if (file.content !== content) {
          return { name: `${file.dirname}/${file.filename}` };
        }
        return null;
      })
        .filter((e)=>{
          return e !== null;
        });
    },
    hasChange() {
      //Check if any file differs from its initial content
      return this.files.some((file)=>{
        const document = file.editorSession.getDocument();
        const content = document.getValue();
        return file.initialContent !== content;
      });
    },
    saveAll() {
      let changed = false;
      for (const file of this.files) {
        const document = file.editorSession.getDocument();
        const content = document.getValue();
        if (file.content === content) {
          console.log(`INFO: ${file.filename} is not changed.`);
        } else {
          changed = true;
          SIO.emitGlobal("saveFile", this.projectRootDir, file.filename, file.dirname, content, (rt)=>{
            if (!rt) {
              console.log("ERROR: file save failed:", rt);
              this.showSnackbar(`${file.filename} save failed`);
            }
            this.showSnackbar({ message: `${file.filename} saved`, timeout: 2000 });
            file.content = content;
          });
        }
      }
      return changed;
    },
    getAllPlaceholders() {
      const placeholders = [];
      this.editor.$search.setOptions({
        needle: /{{.*?}}/,
        wholeWord: true,
        regExp: true
      });

      for (const file of this.files) {
        const rt = this.editor.$search.findAll(file.editorSession);
        placeholders.push(...rt.map((e)=>{
          const text = file.editorSession.getDocument()
            .getTextRange(e)
            .replace(/{{ */, "")
            .replace(/ *}}/, "");
          return { text, end: e.end, row: e.start.row, column: e.start.column, filename: file.filename, absPath: file.absPath, editorSession: file.editorSession };
        }));
      }
      return placeholders;
    },

    /**
     * Remove all tracked event listeners from an editor session to prevent memory leaks.
     * @param {object} file - File object with editorSession and named listener references
     */
    cleanupSession(file) {
      if (!file.editorSession) {
        return;
      }
      if (file.changeSelectionHandler) {
        file.editorSession.selection.off("changeSelection", file.changeSelectionHandler);
        file.changeSelectionHandler = null;
      }
      if (file.contentChangedHandler) {
        file.editorSession.off("change", file.contentChangedHandler);
        file.contentChangedHandler = null;
      }
      if (file.autoSaveHandler) {
        file.editorSession.off("change", file.autoSaveHandler);
        file.autoSaveHandler = null;
      }
      file.editorSession.destroy();
      file.editorSession = null;
    },
    closeTab(index) {
      const file = this.files[index];
      if (index === 0) {
        const document = file.editorSession.getDocument();
        document.setValue("");
      }
      this.cleanupSession(file);
      this.files.splice(index, 1);
      if (file.absPath === this.selectedFile) {
        this.commitSelectedFile(null);
      }
    },
    changeTab(argIndex) {
      if (argIndex >= this.files.length) {
        //just ignored
        return;
      }
      const index = argIndex;
      const session = this.files[index].editorSession;
      this.editor.setSession(session);
      this.commitSelectedText("");
    },
    scheduleAutoSave() {
      if (this.readOnly) {
        return;
      }
      if (this.autoSaveTimer) {
        clearTimeout(this.autoSaveTimer);
      }
      this.autoSaveTimer = setTimeout(()=>{
        this.autoSaveAll();
      }, 2000); //2 seconds client-side debounce
    },
    autoSaveAll() {
      for (const file of this.files) {
        const document = file.editorSession.getDocument();
        const content = document.getValue();
        if (file.content !== content) {
          this.autoSaveFile(file, content);
        }
      }
    },
    autoSaveFile(file, content) {
      SIO.emitGlobal("saveFile", this.projectRootDir, file.filename, file.dirname, content, (rt)=>{
        if (!rt) {
          console.log("ERROR: auto-save failed:", rt);
          this.showSnackbar(`${file.filename} auto-save failed`);
        } else {
          file.content = content;
        }
      });
    },
    async revertAll() {
      //Revert all files to initial content and save to server
      const savePromises = [];

      for (const file of this.files) {
        const document = file.editorSession.getDocument();
        const initialContent = file.initialContent || "";

        //Set content back to initial
        document.setValue(initialContent);

        //Save reverted content to server
        const promise = new Promise((resolve, reject)=>{
          SIO.emitGlobal("saveFile", this.projectRootDir, file.filename, file.dirname, initialContent, (rt)=>{
            if (!rt) {
              reject(new Error(`Failed to save ${file.filename}`));
            } else {
              file.content = initialContent;
              resolve();
            }
          });
        });
        savePromises.push(promise);
      }

      await Promise.all(savePromises);
    }
  }
};
</script>
