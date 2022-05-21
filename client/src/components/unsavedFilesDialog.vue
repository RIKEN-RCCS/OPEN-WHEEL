<template>
  <v-dialog
    v-model="show"
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
    props:{
        unsavedFiles: {
          type: Array,
          required: true
        },
        dialog: {
          type: Boolean,
          required: true
        }
    },
    data () {
      return {
        headers: [
          { text: "status", value: "status" },
          { text: "filename", value: "name" },
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
      saveAll () {
        this.$emit("closed","save");
      },
    },

  };
</script>
