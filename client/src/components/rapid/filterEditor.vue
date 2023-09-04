/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-dialog
    v-model="filterEditor"
    persistent
  >
    <v-card>
      <v-card-title>
        <v-text-field
          v-model="newFilter"
          label="filter"
        />
        <v-btn
          class="text-capitalize"
          @click="applyFilter"
          prepend-icon="add"
          text="apply"
        />
        <v-spacer />
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="Search"
          single-line
        />
        <v-btn
          class="text-capitalize"
          @click="closeFilterEditor"
          prepend-icon="close"
          text="close"
        />
      </v-card-title>
      <v-card-text>
        <v-data-table
          v-model="selected"
          density=compact
          show-select
          :single-select="false"
          :search="search"
          :headers="[{ key: 'text', title: 'placeholder', sortable: true },
                     { key: 'filename', title: 'filename', sortable: true, filterable: false },
                     { key: 'row', title: 'row', sortable: true, filterable: false},
                     { key: 'column', title: 'column', sortable: true, filterable: false} ]"
          :items="placeholders"
          :items-per-page="5"
          :footer-props="tableFooterProps"
        />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<script>
  "use strict";
  import { tableFooterProps } from "@/lib/rapid2Util.js";

  export default {
    name: "FilterEditor",
    data: function () {
      return {
        newFilter: "",
        search: "",
        placeholders: [],
        selected: [],
        tableFooterProps,
      filterEditor: false,
      };
    },
    methods: {
      applyFilter () {
        const placeholders = Array.from(this.selected);
        placeholders.sort((a, b)=>{
          if (a.filename === b.filename) {
            return a.row_end - b.row_end !== 0 ? b.row_end - a.row_end : b.column_end - a.column_end;
          }
          return a.filename > b.filename ? 1 : -1;
        });
        const filter = "| " + this.newFilter + " ";
        placeholders.forEach((ph)=>{
          ph.editorSession.insert({ row: ph.row_end, column: ph.column_end - 2 }, filter);
        });
        console.log(placeholders); // DEBUG
        this.updatePlaceholderList();
      },

      closeFilterEditor () {
        this.filterEditor = false;
        this.params = null;
      },

    },
  };
</script>
