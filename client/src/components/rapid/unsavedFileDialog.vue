/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-dialog
    v-model="unsavedFileDialog"
    persistent
  >
    <v-card>
      <v-card-title>
        unsaved file
      </v-card-title>
      <v-card-text>
        {{ closingFilename }} is not saved
      </v-card-text>
      <v-card-actions>
        <v-btn
          text
          @click.stop="saveAndCloseTab"
        >
          <v-icon>save</v-icon> save
        </v-btn>
        <v-btn
          text
          @click.stop="closeTab"
        >
          <v-icon>delete</v-icon> discard changes
        </v-btn>
        <v-btn
          text
          @click.stop="closeDialog"
        >
          <v-icon>cancel</v-icon> cancel
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script>
  "use strict";
  export default {
    name: "UnsavedFileDialog",
    props: {
      unsavedFileDialog: Boolean,
      closingFilename: String,
    },
    data: function () {
      return {
      };
    },
    methods: {},
  };
</script>
