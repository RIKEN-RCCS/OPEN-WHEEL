/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <div>
    <v-tabs
      v-model="activeTab"
      @update:modelValue="changeTab"
    >
      <v-tab
        v-for="(file,index) of files"
        :key="file.order"
        class="text-none"
      >
        <v-menu
          location="bottom"
          offset-y
          close-on-content-click
          close-on-click
        >
          <template #activator="{props: menu}">
            <v-tooltip location="top">
              <template #activator="{props: tooltip}">
                <v-btn
                  variant=plain
                  :ripple="false"
                />
                <span
                  v-bind="mergeProps(menu, tooltip)"
                >
                  {{ file.filename }} </span>
              </template>
              <span>{{ file.absPath }}</span>
            </v-tooltip>
          </template>
          <v-list>
            <v-list-item
              @click="save(index)"
            >
              save
            </v-list-item>
            <v-list-item
              @click="closeTab(index)"
            >
              close without save
            </v-list-item>
          </v-list>
        </v-menu>
        <v-btn
          small
          icon=mdi-close
          @click.stop="save(index).then(()=>closeTab(index))"
        />
      </v-tab>
      <v-tab @click.stop>
        <v-dialog v-model="newFilePrompt">
          <template #activator="{ props }">
            <v-btn
              block
              icon=mdi-plus
              v-bind="props"
            />
          </template>
          <v-card>
            <v-card-text>
              <v-text-field
                v-model="newFilename"
                label="new file name"
                :rules="[isValidName]"
              />
            </v-card-text>
            <v-card-actions>
              <v-btn
                @click="openNewTab(newFilename);closeNewFileDialog()"
                prepend-icon="mdi-pencil-outline"
                text="open"
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
      :height=editorHeight
    />
  </div>
</template>

<script>
"use strict";
import { mergeProps } from "vue";
import { mapState, mapGetters, mapMutations } from "vuex";
import SIO from "@/lib/socketIOWrapper.js";
import { isValidInputFilename } from "@/lib/utility.js";
import { editorHeight } from "@/lib/constants.json";
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
  data: function () {
    return {
      newFilePrompt: false,
      newFilename: null,
      activeTab: 0,
      files: [],
      editor: null,
      isJobScript: false,
      editorHeight
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
      this.editor.setReadOnly(this.readOnly);
    },
    activeTab(nv, ov) {
      if (nv >= this.files.length) {
        this.activeTab = ov;
      }
    }
  },
  mounted: function () {
    this.editor = ace.edit("editor");
    this.editor.setOptions({
      theme: "ace/theme/idle_fingers",
      autoScrollEditorIntoView: true,
      highlightSelectedWord: true,
      highlightActiveLine: true,
      readOnly: this.readOnly
    });
    this.editor.on("changeSession", this.editor.resize.bind(this.editor));
    this.editor.on("changeSession", ()=>{
      const isJobScript = typeof this.editor.find("#### WHEEL inserted lines ####", { start: { row: 0, column: 0 } }) !== "undefined";
      this.$emit("jobscript", isJobScript);
    });

    SIO.onGlobal("file", (file)=>{
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
      file.editorSession = ace.createEditSession(file.content);
      file.absPath = `${file.dirname}${this.pathSep}${file.filename}`;
      this.files.push(file);

      //select last tab after DOM is updated
      this.$nextTick(function () {
        this.activeTab = this.files.length - 1;
        const session = this.files[this.activeTab].editorSession;
        this.editor.setSession(session);
        this.editor.resize();
        session.selection.on("changeSelection", ()=>{
          this.commitSelectedText(this.editor.getSelectedText());
        });
      });
    });
    if (typeof this.selectedFile === "string") {
      SIO.emitGlobal("openFile", this.projectRootDir, this.selectedFile, false, (rt)=>{
        if (rt instanceof Error) {
          console.log(rt);
        }
      });
    }
  },
  methods: {
    mergeProps,
    ...mapMutations({ commitSelectedFile: "selectedFile",
      commitSelectedText: "selectedText" }
    ),
    isValidName(v) {
      //allow . / - and alphanumeric chars
      return isValidInputFilename(v) || "invalid filename";
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
        }
        SIO.emitGlobal("saveFile", this.projectRootDir, file.filename, file.dirname, content, (rt)=>{
          if (!rt) {
            console.log("ERROR: file save failed:", rt);
            reject(rt);
          }
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
      const changedFiles = this.getChangedFiles();
      return changedFiles.length > 0;
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
            }
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
    closeTab(index) {
      const file = this.files[index];
      if (index === 0) {
        const document = file.editorSession.getDocument();
        document.setValue("");
      }
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
      session.selection.on("changeSelection", ()=>{
        this.commitSelectedText(this.editor.getSelectedText());
      });
    }
  }
};
</script>
