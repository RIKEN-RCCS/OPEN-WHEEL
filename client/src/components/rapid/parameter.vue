/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <div>
    <v-card >
      <v-card-title>
        parameters
      </v-card-title>
      <v-card-text>
        <v-toolbar
          color='background'
        >
        <v-text-field
          v-model="selectedText"
          label="current selected text"
          readonly
        />
          <v-btn
            class="text-capitalize"
            :disabled="readOnly"
            @click="dialog=true"
            prepend-icon="mdi-plus"
            text="add new parameter"
          />
          <v-btn
            class="text-capitalize"
            :disabled="readOnly"
            @click="$emit('openFilterEditor')"
            prepend-icon="mdi-pencil"
            text="add filter"
          />
        </v-toolbar>
        <v-data-table
          density=compact
          :headers="[{title: 'placeholder', key: 'keyword', sortable: true},
                     {title: 'type', key: 'type', sortable: true},
                     { title: 'Actions', key: 'action', sortable: false }]"
          :items="params"
        >
          <template #bottom />
          <template #item.action="{ item }">
            <action-row
              :item="item.raw"
              :disabled="readOnly"
              @edit="openDialog(item.raw)"
              @delete="deleteItem(item.raw)"
            />
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
    <v-dialog
      v-model="dialog"
      width="auto "
      persistent
    >
      <v-card>
        <v-card-title>
          <span class="text-h5"> parameter setting </span>
        </v-card-title>
        <v-card-text>
          <v-select
            v-model="newItem.type"
            variant=outlined
            :items="['min-max-step', 'list', 'files']"
          />
          <v-row v-if="newItem.type==='min-max-step'">
            <v-text-field
              v-model="newItem.min"
              type="number"
              hint="min"
              persistent-hint
              :rules="[required]"
              novalidate
            />
            <v-text-field
              v-model="newItem.max"
              type="number"
              hint="max"
              persistent-hint
              :rules="[required]"
              novalidate
            />
            <v-text-field
              v-model="newItem.step"
              type="number"
              hint="step"
              persistent-hint
              :rules="[required]"
              novalidate
            />
          </v-row>
          <div v-if="newItem.type==='list'">
            <list-form
              :items="newItem.list"
              :headers="listHeaders"
              :string-items="true"
              @add=addList
              @update=updateList
              @remove=removeList
            />
          </div>
          <div v-if="newItem.type==='files'">
            <list-form
              :items="newItem.files"
              :headers="filesHeaders"
              :string-items="true"
              @add=addFiles
              @update=updateFiles
              @remove=removeFiles
            />
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            @click="commitChange"
            prepend-icon="mdi-check"
            text="OK"
          />
          <v-btn
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
"use strict";
import { mapState } from "vuex";
import { removeFromArray } from "@/lib/clientUtility.js";
import actionRow from "@/components/common/actionRow.vue";
import listForm from "@/components/common/listForm.vue";

export default {
  name: "Parameter",
  components: {
    listForm,
    actionRow,
  },
  props: {
    params: {
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
      currentItem: null,
      dialog: false,
      newItem: {
        type: "min-max-step",
        list: [],
        files: [],
        min: 0,
        max: 0,
        step: 1,
      },
      listHeaders: [
        { title: "value", key: "name", sortable: true },
      ],
      filesHeaders: [
        { title: "filename", key: "name", sortable: true },
      ],
    };
  },
  computed: {
    ...mapState(["selectedText"]),
  },
  mounted: function () {
    this.reset();

    if (this.currentItem === null || typeof this.currentItem === "undefined") {
      return;
    }
    this.newItem.type = this.currentItem.type;

    if (this.currentItem.type === "min-max-step") {
      this.newItem.min = this.currentItem.min;
      this.newItem.max = this.currentItem.max;
      this.newItem.step = this.currentItem.step;
    } else if (this.curentItem.type === "list") {
      this.newItem.list = this.currentItem.list;
    } else if (this.currentItem.type === "files") {
      this.newItem.files = this.currentItem.files;
    }
  },
  methods: {
    addList(item){
      this.newItem.list.push(item);
    },
    updateList(item, index){
      this.newItem.list.splice(index, 1, item);
    },
    removeList(item, index){
      this.newItem.list.splice(index,1)
    },
    addFiles(item){
      this.newItem.files.push(item);
    },
    updateFiles(item, index){
      this.newItem.files.splice(index, 1, item);
    },
    removeFiles(item, index){
      this.newItem.files.splice(index,1)
    },
    reset () {
      this.newItem = {
        type: this.newItem ? this.newItem.type : "min-max-step",
        list: [],
        files: [],
        min: 0,
        max: 0,
        step: 1,
      };
    },
    required (v) {
      return v !== "" || "must be number.";
    },
    openDialog (item) {
      this.currentItem = item;
      this.newItem = {...item};
      this.dialog = true;
    },
    deleteItem (item) {
      removeFromArray(this.params, item);
    },
    storeParam (target) {
      target.type=this.newItem.type;

      if (this.newItem.type === "min-max-step") {
        const min = Number(this.newItem.min);
        const max = Number(this.newItem.max);
        const step = Number(this.newItem.step);
        if (Number.isNaN(min) || Number.isNaN(max) || Number.isNaN(step)) {
          console.log("min, max or step is Nan", min, max, step);
          return;
        }
        target.min = min;
        target.max = max;
        target.step = step;
      } else if (this.newItem.type === "list") {
        target.list = this.newItem.list;
      } else if (this.newItem.type === "files") {
        target.files = this.newItem.files;
      }
    },
    addItem () {
      const newParam = { keyword: this.selectedText };
      this.storeParam(newParam);
      this.$emit("newParamAdded", newParam);
    },
    updateItem (item) {
      const targetIndex = this.params.findIndex((e)=>{
        return e === item;
      });
      if (targetIndex === -1) {
        return;
      }
      this.storeParam(this.params[targetIndex]);
    },
    commitChange () {
      if (this.currentItem === null) {
        this.addItem();
      } else {
        this.updateItem(this.currentItem);
      }
      //clear all input value except for type prop
      const tmp = this.newItem.type;
      this.closeAndResetDialog();
      this.newItem.type = tmp;
    },
    closeAndResetDialog () {
      this.dialog = false;
      this.currentItem = null;
      this.reset();
    },
  },
};
</script>
