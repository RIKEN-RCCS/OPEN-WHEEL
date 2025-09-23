/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-dialog
    v-model="filterEditor"
    persistent
    max-width="50vw"
  >
    <v-card>
      <v-card-title>
        <v-text-field
          v-model="newFilter"
          label="filter"
        />
        <v-row>
          <v-btn
            class="text-capitalize"
            prepend-icon="add"
            text="apply"
            @click="applyFilter"
          />
          <v-btn
            class="text-capitalize"
            prepend-icon="close"
            text="close"
            @click="closeFilterEditor"
          />
        </v-row>
      </v-card-title>
      <v-card-text>
        <v-data-table
          v-model="selected"
          density="compact"
          show-select
          return-object
          select-strategy="all"
          :headers="[{ key: 'text', title: 'placeholder', sortable: true },
                     { key: 'filename', title: 'filename', sortable: true, filterable: false },
                     { key: 'row', title: 'row', sortable: true, filterable: false},
                     { key: 'column', title: 'column', sortable: true, filterable: false} ]"
          :items="placeholders"
        >
          <template #bottom />
        </v-data-table>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<script>
"use strict";
import { tableFooterProps } from "../../lib/rapid2Util.js";

export default {
  name: "FilterEditor",
  props: {
    modelValue: {
      type: Boolean,
      required: true
    },
    placeholders: {
      type: Array,
      required: true
    }
  },
  emits: ["update:modelValue", "updatePlaceholders"],
  data: function () {
    return {
      newFilter: "",
      search: "",
      selected: [],
      tableFooterProps
    };
  },
  computed: {
    filterEditor: {
      get() {
        return this.modelValue;
      },
      set(v) {
        this.$emit("update:modelValue", v);
      }
    }
  },
  methods: {
    applyFilter() {
      const placeholdersToApply = Array.from(this.selected);
      placeholdersToApply.sort((a, b)=>{
        if (a.filename === b.filename) {
          return a.end.row - b.end.row !== 0 ? b.end.row - a.end.row : b.end.column - a.end.column;
        }
        return a.filename > b.filename ? 1 : -1;
      });
      const filter = "| " + this.newFilter + " ";
      placeholdersToApply.forEach((ph)=>{
        ph.editorSession.insert({ row: ph.end.row, column: ph.end.column - 2 }, filter);
      });
      console.log(placeholdersToApply); //DEBUG
      this.$emit("updatePlaceholders");
    },

    closeFilterEditor() {
      this.filterEditor = false;
      this.params = null;
    }

  }
};
</script>
