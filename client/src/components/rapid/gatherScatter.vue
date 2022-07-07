/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <div>
    <v-card
      outlined
    >
      <v-card-title>
        {{ label }}
        <v-row
          justify="end"
        >
          <v-btn
            class="text-capitalize"
            :disabled="readOnly"
            @click="dialog=true"
          >
            <v-icon>mdi-plus</v-icon>
            add new {{ label }} setting
          </v-btn>
        </v-row>
      </v-card-title>
      <v-card-text>
        <v-data-table
          dense
          :headers="headers"
          :items="container"
          hide-default-footer
        >
          <template #item.action="{ item }">
            <action-row
              :item="item"
              :disabled="readOnly"
              @edit="openDialog(item)"
              @delete="deleteItem(item)"
            />
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
    <v-dialog
      v-model="dialog"
      max-width="50vw"
      persistent
    >
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ label }}</span>
        </v-card-title>
        <v-card-text>
          <v-row no-gutters>
            <v-col>
              <v-text-field
                v-model.trim.lazy="newItem.srcName"
                :label="'srcName'"
              />
            </v-col>
            <v-col>
              <v-text-field
                v-model.trim.lazy="newItem.dstName"
                :label="'dstName'"
              />
            </v-col>
          </v-row>
          {{ label2 }}
          <lower-component-tree />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            text
            :disabled="isInValid"
            @click="commitChange"
          >
            OK
          </v-btn>
          <v-btn
            text
            @click="closeAndResetDialog"
          >
            Cancel
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
  "use strict";
  import { removeFromArray } from "@/lib/clientUtility.js";
  import actionRow from "@/components/common/actionRow.vue";
  import lowerComponentTree from "@/components/lowerComponentTree.vue";

  export default {
    name: "GatherScatter",
    components: {
      actionRow,
      lowerComponentTree,
    },
    props: {
      container: {
        type: Array,
        required: true,
      },
      headers: {
        type: Array,
        required: true,
      },
      label: {
        type: String,
        required: true,
      },
      readOnly: {
        type: Boolean,
        required: true,
      },
    },
    data () {
      return {
        dialog: false,
        newItem: {
          srcName: "",
          dstName: "",
        },
        selectedItem: null,
      };
    },
    computed: {
      label2 () {
        return this.label === "scatter" ? "destination node" : "source node";
      },
      isInValid () {
        if (this.newItem.srcName === "" || this.newItem.dstName === "") {
          return true;
        }
        const keys = ["srcName", "dstName", "srcNode", "dstNode"]
          .filter((e)=>{
            return Object.keys(this.newItem).includes(e);
          });
        return this.container.some((e)=>{
          return keys.every((key)=>{
            return this.newItem[key] === e[key];
          });
        });
      },
    },
    methods: {
      openDialog (item) {
        this.selectedItem = item;
        this.newItem.srcName = this.selectedItem.srcName;
        this.newItem.dstName = this.selectedItem.dstName;

        if (this.selectedItem.dstNode) {
          this.newItem.dstNode = this.selectedItem.dstNode;
        }
        this.dialog = true;
      },
      closeAndResetDialog () {
        this.dialog = false;
        this.newItem.srcName = "";
        this.newItem.dstName = "";
        delete this.newItem.dstNode;
        this.selectedItem = null;
      },
      commitChange () {
        if (this.selectedItem === null) {
          this.container.push({ ...this.newItem });
        } else {
          this.selectedItem.srcName = this.newItem.srcName;
          this.selectedItem.dstName = this.newItem.dstName;

          if (this.newItem.dstNode) {
            this.selectedItem.dstNode = this.newItem.dstNode;
          }
        }
        this.closeAndResetDialog();
      },
      deleteItem (item) {
        removeFromArray(this.container, item);
      },
    },
  };

</script>
