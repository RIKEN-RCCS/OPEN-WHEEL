/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */

<template>
  <div>
    <v-card >
      <v-card-title>
        targetFiles
        <v-row
          justify="end"
        >
          <v-btn
            class="text-capitalize"
            :disabled="readOnly"
            @click="openDialog(null)"
            prepend-icon=mdi-plus
            text="add new target file"
          />
        </v-row>
      </v-card-title>
      <v-card-text>
        <v-data-table
          density=compact
          :headers="[{ key: 'targetName', title: 'filename', sortable: true },
                     { key: 'targetNode', title: 'component', sortable: true },
                     { key: 'action', title: 'Actions', sortable: false }]"
          :items="targetFiles"
        >
          <template #bottom />
          <template #item.action="{ item }">
            <action-row
              :item="item"
              @edit="openDialog(item.raw)"
              @delete="deleteItem(item.raw)"
            />
          </template>
          <template #item.targetNode="{ item }">
            <div v-if="item.raw.hasOwnProperty('targetNode')">
              {{ getComponentName(item.raw.targetNode) }}
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
    <v-dialog
      v-model="targetFileDialog"
      width="auto "
      persistent
    >
      <v-card>
        <v-card-title>
          <span class="text-h5">target filename</span>
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model.trim="newTargetFilename"
            label="filename"
            :rules="[required, notDupulicated]"
          />
          <lower-component-tree @selected="targetNodeSelected" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant=text
            @click="commitTargetFileChange"
            prepend-icon="mdi-check"
            :disabled="hasError"
            text="OK"
          />
          <v-btn
            variant=text
            @click="closeAndResetDialog"
            prepend-icon="mdi-cancel"
            text="cancel"
          />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
import { mapState, mapGetters } from "vuex";
import { tableFooterProps } from "@/lib/rapid2Util.js";
import { removeFromArray } from "@/lib/clientUtility.js";
import actionRow from "@/components/common/actionRow.vue";
import lowerComponentTree from "@/components/lowerComponentTree.vue";
import { required } from "@/lib/validationRules.js";

export default {
  name: "TargetFiles",
  components: {
    actionRow,
    lowerComponentTree,
  },
  props: {
    targetFiles: {
      type: Array,
      required: true,
    },
    readOnly: {
      type: Boolean,
      required: true,
    },
  },
  data () {
    return {
      targetFileDialog: false,
      newTargetFilename: "",
      newTargetNode: null,
      currentItem: null,
      tableFooterProps,
    };
  },
  computed: {
    ...mapState(["selectedText",
      "projectRootDir",
      "componentPath",
      "selectedComponent",
    ]),
    ...mapGetters(["selectedComponentAbsPath", "pathSep"]),
    hasError(){
      return this.required(this.newTargetFilename) !== true ||
              this.notDupulicated(this.newTargetFilename) !== true
    }
  },
  methods: {
    required,
    notDupulicated(v){
      for(const targetFile of this.targetFiles){
        if(typeof targetFile === "string" && targetFile === v){
          return "dupricated targert file is not allowd"
        }else if(targetFile.targetName === v &&(!targetFile.targetNode || targetFile.targetNode === this.newTargetNode) ){
          return "dupricated targert file is not allowd"
        }
      }
      return true
    },
    getComponentName (id) {
      const name = this.componentPath[id];
      const tmp = name.split("/");
      return tmp[tmp.length - 1];
    },
    openDialog (item) {
      if (item !== null) {
        this.newTargetFilename = item.targetName;
      }
      this.currentItem = item || null;
      this.targetFileDialog = true;
    },
    deleteItem (item) {
      removeFromArray(this.targetFiles, item, "targetName");
    },
    closeAndResetDialog () {
      this.currentItem = null;
      this.targetFileDialog = false;
      this.newTargetFilename = "";
      this.newTargetNode = null;
    },
    commitTargetFileChange () {
      if (this.newTargetFilename === "") {
        //regard as canceled
        return this.closeAndResetDialog();
      }
      if (this.currentItem === null) {
        this.addNewTargetFile();
      } else {
        this.renameTargetFile(this.currentItem);
      }
      this.closeAndResetDialog();
    },
    compareTargetFile (l, r) {
      if (l.targetNode || r.targetNode) {
        if (l.targetNode !== r.targetNode) {
          return false;
        }
      }
      return l.targetName === r.targetName;
    },
    renameTargetFile (oldEntry) {
      //check duplicated entry
      const targetFileToBeModified = this.targetFiles.find((e)=>{
        return this.compareTargetFile(oldEntry, e);
      });
      if (targetFileToBeModified) {
        targetFileToBeModified.targetName = this.newTargetFilename;

        if (this.newTargetNode) {
          targetFileToBeModified.targetNode = this.newTargetNode.ID;
        } else if (targetFileToBeModified.targetNode) {
          delete targetFileToBeModified.targetNode;
        }
        this.$emit("openNewTab", this.newTargetFilename, this.selectedComponentAbsPath);
      }
      this.closeAndResetDialog();
    },
    addNewTargetFile () {
      const newTarget = { targetName: this.newTargetFilename };
      if (this.newTargetNode) {
        newTarget.targetNode = this.newTargetNode.ID;
      }
      //check duplicated entry
      const index = this.targetFiles.findIndex((e)=>{
        return this.compareTargetFile(e, newTarget);
      });
      if (index === -1) {
        this.targetFiles.push(newTarget);
        const targetComponentID = newTarget.targetNode || this.selectedComponent.ID;
        const targetComponentDir = `${this.projectRootDir}${this.pathSep}${this.componentPath[targetComponentID]}`;
        this.$emit("openNewTab", this.newTargetFilename, targetComponentDir);
      }
      this.closeAndResetDialog();
    },
    targetNodeSelected (targetNode) {
      this.newTargetNode = targetNode;
    },
  },
};
</script>
