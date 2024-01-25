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
          variant=text
          @click.stop="saveAndCloseTab"
          prepend-icon="save"
          text="save"
        />
        <v-btn
          variant=text
          @click.stop="closeTab"
          prepend-icon="delete"
          text="discard changes"
        />
        <v-btn
          variant=text
          @click.stop="closeDialog"
          prepend-icon="cancel"
          text="cancel"
        />
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
    closingFilename: String
  },
  data: function () {
    return {
    };
  },
  methods: {}
};
</script>
