/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-dialog
    v-model="show"
    max-width="50vw"
    persistent
  >
    <v-card>
      <v-card-title class="text-h5">
        Discard following changes and exit text editor?
      </v-card-title>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="items"
          density="compact"
        >
          <template #bottom />
        </v-data-table>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          class="text-capitalize"
          @click="discardChanges"
          prepend-icon=mdi-alert-circle-outline
          text="discard all changes"
        />
        <v-btn
          class="text-capitalize"
          @click="closeDialog"
          prepend-icon=mdi-close
          text=cancel
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script>
export default {
  props:{
    unsavedFiles: {
      type: Array,
      required: true
    },
    dialog: {
      type: Boolean,
      required: true
    },
  },
  data () {
    return {
      headers: [
        { title: "filename", key: "name" },
      ],
    };
  },
  computed:{
    show(){
      return this.dialog;
    },
    items(){
      return this.unsavedFiles;
    }
  },
  methods: {
    closeDialog () {
      this.$emit("closed","cancel");
    },
    discardChanges () {
      this.$emit("closed","discard");
    },
  },
};
</script>
