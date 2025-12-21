/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <div>
    <v-card>
      <v-card-title>
        {{ label }}
        <v-row
          justify="end"
        >
          <v-btn
            class="text-capitalize"
            :disabled="readOnly"
            prepend-icon="mdi-plus"
            :text="`add new ${label} setting`"
            data-cy="gather_scatter-add_new_setting_btn"
            @click="dialog=true"
          />
        </v-row>
      </v-card-title>
      <v-card-text>
        <v-data-table
          density="compact"
          :headers="headers"
          :items="modifiedContainer"
        >
          <template #bottom />
          <template #item.action="{ item }">
            <action-row
              :item="item"
              :disabled="readOnly"
              @edit="openDialog"
              @delete="itemToDelete = item; deleteDialog = true"
            />
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
    <v-dialog
      v-model="dialog"
      max-width="50vw"
      persistent
    >
      <v-card>
        <v-card-title>
          <v-row
            align="center"
            no-gutters
          >
            <v-col>
              <span class="text-h5">{{ label }}</span>
            </v-col>
            <v-col
              cols="auto"
            >
              <v-btn
                variant="text"
                @click="openHelp"
              >
                <v-icon left>
                  mdi-help-circle
                </v-icon>
                Help
              </v-btn>
            </v-col>
          </v-row>
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="6">
              <div class="text-h6 mb-2">
                Source
              </div>
              <div class="text-subtitle-2 mb-2">
                <span v-if="label === 'scatter'">select source file/directory directly in {{ selectedComponent.name }} dir</span>
                <span v-else>select component</span>
              </div>
              <lower-component-tree
                v-if="label === 'gather'"
                @selected="onSrcNodeSelected"
              />
              <div
                v-else
                class="pa-2 text-caption text-medium-emphasis"
              >
                {{ selectedComponent.name }} (current PS component)
              </div>
              <div class="mt-4">
                <v-text-field
                  v-if="label === 'gather'"
                  v-model.trim.lazy="newItem.srcName"
                  label="filename"
                  :rules="[required, notDupulicated]"
                  data-cy="gather_scatter-srcName_text_field"
                />
                <v-autocomplete
                  v-else
                  v-model.trim.lazy="newItem.srcName"
                  label="filename"
                  :items="srcFileCandidates"
                  :rules="[required, notDupulicated]"
                  data-cy="gather_scatter-srcName_text_field"
                />
              </div>
            </v-col>
            <v-divider vertical />
            <v-col cols="6">
              <div class="text-h6 mb-2">
                Destination
              </div>
              <div class="text-subtitle-2 mb-2">
                <span v-if="label === 'scatter'">select component</span>
                <span v-else>input destination file/directory name in {{ selectedComponent.name }} dir</span>
              </div>
              <lower-component-tree
                v-if="label === 'scatter'"
                @selected="onDstNodeSelected"
              />
              <div class="mt-4">
                <div
                  v-if="label === 'scatter'"
                  class="text-subtitle-2 mb-2"
                >
                  input destination file/directory name in the component
                </div>
                <v-text-field
                  v-model.trim.lazy="newItem.dstName"
                  label="filename"
                  :rules="[required, notDupulicated]"
                  data-cy="gather_scatter-dstName_text_field"
                  hint="Nunjucks template can be used"
                  persistent-hint
                />
              </div>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            :disabled="hasError"
            prepend-icon="mdi-check"
            text="OK"
            data-cy="gather_scatter-ok-btn"
            @click="commitChange"
          />
          <v-btn
            variant="text"
            prepend-icon="mdi-cancel"
            text="Cancel"
            data-cy="gather_scatter-cancel-btn"
            @click="closeAndResetDialog"
          />
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="deleteDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title>Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete this {{ label }} setting?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            variant="text"
            @click="confirmDelete"
          >
            Yes
          </v-btn>
          <v-btn
            variant="text"
            @click="cancelDelete"
          >
            No
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
"use strict";
import { mapState, mapGetters } from "vuex";
import actionRow from "../../components/common/actionRow.vue";
import lowerComponentTree from "../../components/lowerComponentTree.vue";
import { required } from "../../lib/validationRules.js";
import SIO from "../../lib/socketIOWrapper.js";

export default {
  name: "GatherScatter",
  components: {
    actionRow,
    lowerComponentTree
  },
  props: {
    container: {
      type: Array,
      required: true
    },
    headers: {
      type: Array,
      required: true
    },
    label: {
      type: String,
      required: true
    },
    readOnly: {
      type: Boolean,
      required: true
    }
  },
  emits: ["addNewItem", "updateItem", "deleteItem"],
  data() {
    return {
      dialog: false,
      deleteDialog: false,
      itemToDelete: null,
      newItem: {
        srcName: "",
        dstName: ""
      },
      selectedItem: null,
      srcFileCandidates: [],
      dstFileCandidates: []
    };
  },
  watch: {
    dialog(newVal) {
      if (newVal && this.label === "scatter") {
        //Load source file candidates when dialog opens for scatter
        //(scatter uses current PS component as source, no tree selection needed)
        this.loadSrcFileCandidates();
      }
    }
  },
  computed: {
    ...mapState(["componentPath", "selectedComponent", "projectRootDir"]),
    ...mapGetters(["pathSep"]),
    modifiedContainer() {
      return this.container.map((e)=>{
        const parent = this.componentPath[this.selectedComponent.ID];
        if (e.dstNode) {
          const child = this.componentPath[e.dstNode];
          if (typeof child === "string") {
            e.dstNodeName = child.replace(parent, ".");
          }
        }
        if (e.srcNode) {
          const child = this.componentPath[e.srcNode];
          if (typeof child === "string") {
            e.srcNodeName = child.replace(parent, ".");
          }
        }
        return e;
      });
    },
    label2() {
      return this.label === "scatter" ? "destination node" : "source node";
    },
    hasError() {
      return this.required(this.newItem.srcName) !== true
        || this.required(this.newItem.dstName) !== true
        || this.notDupulicated(null) !== true;
    }
  },
  methods: {
    required,
    notDupulicated() {
      if (this.container.length === 0) {
        return true;
      }
      //check duplication or not changed
      const keys = ["srcName", "dstName", "srcNode", "dstNode"]
        .filter((e)=>{
          return Object.keys(this.newItem).includes(e);
        });

      const hasSameEntry = !this.container.some((e)=>{
        return keys.every((key)=>{
          return this.newItem[key] === e[key];
        });
      });
      return hasSameEntry || "duplicated entry is not allowed";
    },
    onSrcNodeSelected(item) {
      this.newItem.srcNode = item.ID;
    },
    onDstNodeSelected(item) {
      this.newItem.dstNode = item.ID;
    },
    openDialog(item) {
      this.selectedItem = item;
      this.newItem.srcName = this.selectedItem?.srcName || "";
      this.newItem.dstName = this.selectedItem?.dstName || "";
      if (this.selectedItem?.dstNode) {
        this.newItem.dstNode = this.selectedItem.dstNode;
      }
      if (this.selectedItem?.srcNode) {
        this.newItem.srcNode = this.selectedItem.srcNode;
      }
      this.dialog = true;
      if (this.label === "scatter") {
        this.loadSrcFileCandidates();
      }
    },
    closeAndResetDialog() {
      this.dialog = false;
      this.newItem.srcName = "";
      this.newItem.dstName = "";
      delete this.newItem.dstNode;
      delete this.newItem.srcNode;
      this.selectedItem = null;
    },
    commitChange() {
      if (this.selectedItem === null) {
        //3rd argument means copy of this.newItem
        //this.newItem will be initialized in closeAndRestDialog()
        this.$emit("addNewItem", this.label, { ...this.newItem });
      } else {
        this.$emit("updateItem", this.label, this.selectedItem, { ...this.newItem });
      }
      this.closeAndResetDialog();
    },
    deleteItem(item) {
      this.itemToDelete = item;
      this.deleteDialog = true;
    },
    confirmDelete() {
      if (this.itemToDelete) {
        this.$emit("deleteItem", this.label, this.itemToDelete);
        this.itemToDelete = null;
      }
      this.deleteDialog = false;
    },
    cancelDelete() {
      this.itemToDelete = null;
      this.deleteDialog = false;
    },
    loadSrcFileCandidates() {
      const srcComponentID = this.label === "scatter" ? this.selectedComponent.ID : (this.newItem.srcNode || this.selectedComponent.ID);
      const path = `${this.projectRootDir}${this.pathSep}${this.componentPath[srcComponentID]}`;
      const mode = "files";

      SIO.emitGlobal("getFileList", this.projectRootDir, { path, mode }, (fileList)=>{
        if (fileList === null) {
          this.srcFileCandidates = [];
          return;
        }

        let candidates = fileList.map((e)=>{
          return e.name;
        });

        //For scatter, also add inputFiles (excluding globs and directories)
        if (this.label === "scatter" && this.selectedComponent.inputFiles) {
          const inputFileNames = this.selectedComponent.inputFiles
            .map((f)=>{ return f.name; })
            .filter((name)=>{
              return !name.includes("*") && !name.includes("?") && !name.endsWith("/") && !name.endsWith("\\");
            });
          candidates = [...new Set([...candidates, ...inputFileNames])];
        }

        this.srcFileCandidates = candidates;
      });
    },
    loadDstFileCandidates() {
      const dstComponentID = this.label === "scatter" ? (this.newItem.dstNode || this.selectedComponent.ID) : this.selectedComponent.ID;
      const path = `${this.projectRootDir}${this.pathSep}${this.componentPath[dstComponentID]}`;
      const mode = "files";

      SIO.emitGlobal("getFileList", this.projectRootDir, { path, mode }, (fileList)=>{
        if (fileList === null) {
          this.dstFileCandidates = [];
          return;
        }
        this.dstFileCandidates = fileList
          .filter((e)=>{
            return e.type && e.type.startsWith("file");
          })
          .map((e)=>{
            return e.name;
          });
      });
    },
    onDeleteItem(item) {
      this.$emit("deleteItem", this.label, item);
    },
    confirmDelete() {
      this.onDeleteItem(this.itemToDelete);
      this.deleteDialog = false;
      this.itemToDelete = null;
    },
    cancelDelete() {
      this.deleteDialog = false;
      this.itemToDelete = null;
    },
    openHelp() {
      const url = this.label === "scatter"
        ? "https://riken-rccs.github.io/OPEN-WHEEL/reference/4_component/06_PS.html#scatter"
        : "https://riken-rccs.github.io/OPEN-WHEEL/reference/4_component/06_PS.html#gather";
      window.open(url, "_blank");
    }
  }
};

</script>
