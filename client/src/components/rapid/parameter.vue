/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <div>
    <v-card
      outlined
    >
      <v-card-title>
        parameters
        <v-row
          justify="end"
        >
          <v-btn
            class="text-capitalize"
            :disabled="readOnly"
            @click="dialog=true"
          >
            <v-icon>mdi-plus</v-icon>
            add new parameter
          </v-btn>
          <v-btn
            class="text-capitalize"
            :disabled="readOnly"
            @click="$emit('openFilterEditor')"
          >
            <v-icon> mdi-pencil </v-icon>
            add filter
          </v-btn>
        </v-row>
      </v-card-title>
      <v-card-subtitle>
        <v-text-field
          v-model="selectedText"
          outlined
          readonly
        />
      </v-card-subtitle>
      <v-card-text>
        <v-data-table
          dense
          :headers="[{text: 'placeholder', value: 'keyword', sortable: true},
                     {text: 'type', value: 'type', sortable: true},
                     { text: 'Actions', value: 'action', sortable: false }]"
          :items="params"
          hide-default-footer
        >
          <template #item.action="{ item }">
            <action-row
              :item="item"
              :disabled="readOnly"
              @edit="openDialog(item)"
              @delete="deleteItem(item)"
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
            outlined
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
            />
          </div>
          <div v-if="newItem.type==='files'">
            <list-form
              :items="newItem.files"
              :headers="filesHeaders"
              :string-items="true"
            />
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="commitChange">
            <v-icon>mdi-content-save</v-icon>save
          </v-btn>
          <v-btn @click="closeAndResetDialog">
            <v-icon>mdi-cancel</v-icon>cancel
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="filterDialog"
      width="auto "
      persistent
    >
      <v-card>
        <v-card-title />
        <v-card-text>
          <v-text-field
            v-model="filterText"
            label="filter"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="updateFilter">
            <v-icon>save</v-icon>save
          </v-btn>
          <v-btn @click="closeFilterDialog">
            <v-icon>cancel</v-icon>cancel
          </v-btn>
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
        filterEdittingItem: null,
        filterText: "",
        filterDialog: false,
        newItem: {
          type: "min-max-step",
          list: [],
          files: [],
          min: 0,
          max: 0,
          step: 1,
        },
        listHeaders: [
          { text: "value", value: "name", sortable: true },
        ],
        filesHeaders: [
          { text: "filename", value: "name", sortable: true },
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
        removeFromArray(this.newItem.files, item);
      },
      addFiles(item){
        this.newItem.files.push(item);
      },
      updateFiles(item, index){
        this.newItem.files.splice(index, 1, item);
      },
      removeFiles(item, index){
        removeFromArray(this.newItem.files, item);
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
      openFilterDialog (item) {
        this.filterEdittingItem = item;
        this.filterDialog = true;
      },
      updateFilter () {
        this.$emit("updateFilter", this.filterText);
        this.closeFilterDialog();
      },
      closeFilterDialog () {
        this.filterEdittingItem = null;
        this.filterDialog = false;
      },
      openDialog (item) {
        this.currentItem = item;
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
            // TODO エラーメッセージをトーストあたりで出す
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
        // clear all input value except for type prop
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
