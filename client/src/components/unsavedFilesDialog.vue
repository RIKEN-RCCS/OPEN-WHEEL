<template>
  <v-dialog
    v-model="dialog"
    persistent
  >
    <v-card>
      <v-card-title class="text-h5">
        unsaved files
      </v-card-title>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="unsavedFiles"
          disable-pagination
          hide-default-footer
          dense
        />
      </v-card-text>
      <v-card-actions>
        <v-btn
          class="text-capitalize"
          @click="saveAll"
        >
          <v-icon>mdi-content-save-all-outline</v-icon>Save All
        </v-btn>
        <v-btn
          class="text-capitalize"
          @click="discardChanges"
        >
          <v-icon>mdi-alert-circle-outline</v-icon>discard all changes
        </v-btn>
        <v-btn
          class="text-capitalize"
          @click="closeDialog"
        >
          <v-icon>mdi-close</v-icon>cancel
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script>
  import SIO from "@/lib/socketIOWrapper.js";
  export default {
    data () {
      return {
        dialog: false,
        unsavedFiles: [],
        headers: [
          { text: "status", value: "status" },
          { text: "filename", value: "name" },
        ],
      };
    },
    mounted () {
      SIO.onGlobal("unsavedFiles", (unsavedFiles, cb)=>{
        if (unsavedFiles.length === 0) {
          return;
        }
        this.cb = cb;
        this.unsavedFiles = unsavedFiles;
        // this.unsavedFiles.splice();//force update DOM //現状では要らないっぽい?
        this.dialog = true;
      });
    },
    methods: {
      closeDialog () {
        this.unsavedFiles.splice(0);
        this.dialog = false;
      },
      discardChanges () {
        this.cb(false);
        this.closeDialog();
      },
      saveAll () {
        this.cb(true);
        this.closeDialog();
      },
    },

  };
</script>
