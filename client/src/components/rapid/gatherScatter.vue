/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <div>
    <v-card >
      <v-card-title>
        {{ label }}
        <v-row
          justify="end"
        >
          <v-btn
            class="text-capitalize"
            :disabled="readOnly"
            @click="dialog=true"
            prepend-icon="mdi-plus"
            :text="`add new ${label} setting`"
          />
        </v-row>
      </v-card-title>
      <v-card-text>
        <v-data-table
          density=compact
          :headers="headers"
          :items="modifiedContainer"
        >
          <template #bottom />
          <template #item.action="{ item }">
            <action-row
              :item="item.raw"
              :disabled="readOnly"
              @edit="openDialog(item.raw)"
              @delete="deleteItem(item.raw)"
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
                label="srcName"
                :rules="[required, notDupulicated]"
              />
            </v-col>
            <v-col>
              <v-text-field
                v-model.trim.lazy="newItem.dstName"
                label="dstName"
                :rules="[required, notDupulicated]"
              />
            </v-col>
          </v-row>
          {{ label2 }}
          <lower-component-tree
            @selected=onDstNodeSelected
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant=text
            :disabled="hasError"
            @click="commitChange"
            prepend-icon=mdi-check
            text=OK
          />
          <v-btn
            variant=text
            @click="closeAndResetDialog"
            prepend-icon=mdi-cancel
            text=Cancel
          />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
"use strict";
import { mapState } from "vuex"
import actionRow from "@/components/common/actionRow.vue";
import lowerComponentTree from "@/components/lowerComponentTree.vue";
import { required } from "@/lib/validationRules.js";

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
    ...mapState(["componentPath", "selectedComponent"]),
    modifiedContainer(){
      return this.container.map((e)=>{
        const parent= this.componentPath[this.selectedComponent.ID];
        if(e.dstNode){
          const child = this.componentPath[e.dstNode];
          if(typeof child === "string"){
            e.dstNodeName=child.replace(parent,".");
          }
        }
        if(e.srcNode){
          const child = this.componentPath[e.srcNode];
          if(typeof child === "string"){
            e.srcNodeName=child.replace(parent,".");
          }
        }
        return e
      });
    },
    label2 () {
      return this.label === "scatter" ? "destination node" : "source node";
    },
    hasError(){
      return this.required(this.newItem.srcName) !== true ||
              this.required(this.newItem.dstName)!== true ||
              this.notDupulicated(null) !== true 
    },
  },
  methods: {
    required,
    notDupulicated() {
      if(this.container.length === 0){
        return true
      }
      //check duplication or not changed
      const keys = ["srcName", "dstName", "srcNode", "dstNode"]
        .filter((e)=>{
          return Object.keys(this.newItem).includes(e);
        });

      const hasSameEntry = !this.container.some((e)=>{
        return  keys.every((key)=>{
          return this.newItem[key] === e[key];
        });
      });
      return hasSameEntry || "duplicated entry is not allowed"
    },
    onDstNodeSelected(item){
      if(this.label === "scatter"){
        this.newItem.dstNode=item.ID
      }else{
        this.newItem.srcNode=item.ID
      }
    },
    openDialog (item) {
      this.selectedItem = item;
      this.newItem.srcName = this.selectedItem.srcName;
      this.newItem.dstName = this.selectedItem.dstName;

      if (this.selectedItem.dstNode) {
        this.newItem.dstNode = this.selectedItem.dstNode;
      }
      if (this.selectedItem.srcNode) {
        this.newItem.srcNode = this.selectedItem.srcNode;
      }
      this.dialog = true;
    },
    closeAndResetDialog () {
      this.dialog = false;
      this.newItem.srcName = "";
      this.newItem.dstName = "";
      delete this.newItem.dstNode;
      delete this.newItem.srcNode;
      this.selectedItem = null;
    },
    commitChange () {
      if (this.selectedItem === null) {
        //3rd argument means copy of this.newItem
        //this.newItem will be initialized in closeAndRestDialog()
        this.$emit("addNewItem", this.label,{ ...this.newItem } );
      } else {
        this.$emit("updateItem", this.label, this.selectedItem, { ...this.newItem } );
      }
      this.closeAndResetDialog();
    },
    deleteItem (item) {
      this.$emit("deleteItem", this.label, item);
    },
  },
};

</script>
