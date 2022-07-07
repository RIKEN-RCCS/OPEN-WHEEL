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
        >
          <v-icon>add</v-icon> apply
        </v-btn>
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
        >
          <v-icon>close</v-icon> close
        </v-btn>
      </v-card-title>
      <v-card-text>
        <v-data-table
          v-model="selected"
          dense
          show-select
          :single-select="false"
          :search="search"
          :headers="[{ value: 'text', text: 'placeholder', sortable: true },
                     { value: 'filename', text: 'filename', sortable: true, filterable: false },
                     { value: 'row', text: 'row', sortable: true, filterable: false},
                     { value: 'column', text: 'column', sortable: true, filterable: false} ]"
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
    props: {
      filterEditor: Boolean,
    },
    data: function () {
      return {
        newFilter: "",
        search: "",
        placeholders: [],
        selected: [],
        tableFooterProps,
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
