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
          id="table-header-with-underline"
          v-model="selected"
          :headers="headers"
          :items="items"
          density="compact"
          :return-object="true"
          :show-select="true"
          select-strategy="page"
        >
          <template #bottom />
        </v-data-table>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          class="text-capitalize"
          prepend-icon="mdi-content-save-outline"
          text="Save selected files"
          @click="commit"
        />
        <v-btn
          class="text-capitalize"
          prepend-icon="mdi-content-save-all-outline"
          text="Save All"
          @click="commitAll"
        />
        <v-btn
          class="text-capitalize"
          prepend-icon="mdi-close-box-multiple-outline"
          text="discard all changes"
          @click="discardChanges"
        />
        <v-btn
          class="text-capitalize"
          prepend-icon="mdi-close"
          text="cancel"
          @click="closeDialog"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script>
export default {
  name: "UnsavedFilesDialog",
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
  emits: ["update:modelValue", "closed", "commit"],
  data() {
    return {
      headers: [
        { title: "status", key: "status" },
        { title: "filename", key: "name" }
      ],
      selected: []
    };
  },
  computed: {
    show() {
      return this.dialog;
    },
    items() {
      return this.unsavedFiles;
    }
  },
  mounted() {
    if (this.withoutStatus) {
      this.headers.splice(0, 1);
    }
  },
  methods: {
    closeDialog() {
      this.$emit("closed", "cancel");
    },
    commit() {
      this.$emit("commit", this.selected);
    },
    discardChanges() {
      this.$emit("closed", "discard");
    },
    commitAll() {
      this.$emit("closed", "commit");
    }
  }

};
</script>
<style scoped>
#table-header-with-underline :deep(.v-data-table-header__content) {
  border-bottom: 1px solid #07F1F8;
}
</style>
