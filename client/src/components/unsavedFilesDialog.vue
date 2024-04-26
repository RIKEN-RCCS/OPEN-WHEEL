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
        unsaved files
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
        <v-btn
          class="text-capitalize"
          @click="saveAll"
          prepend-icon="mdi-content-save-all-outline"
          text="Save All"
        />
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
  props: {
    unsavedFiles: {
      type: Array,
      required: true
    },
    dialog: {
      type: Boolean,
      required: true
    },
    withoutStatus: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      headers: [
        { title: "status", key: "status" },
        { title: "filename", key: "name" }
      ]
    };
  },
  mounted() {
    if (this.withoutStatus) {
      this.headers.splice(0, 1);
    }
  },
  computed: {
    show() {
      return this.dialog;
    },
    items() {
      return this.unsavedFiles;
    }
  },
  methods: {
    closeDialog() {
      this.$emit("closed", "cancel");
    },
    discardChanges() {
      this.$emit("closed", "discard");
    },
    saveAll() {
      this.$emit("closed", "save");
    }
  }

};
</script>
