/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-data-table
    v-model="selectedItems"
    :items="tableData"
    :headers="headersWithActions"
    disable-filterling
    disable-pagination
    hide-default-header
    hide-default-footer
    :show-select="selectable"
    :single-select="true"
  >
    <template #header>
      {{ label }}
    </template>
    <template
      v-if="allowRenameInline"
      #item.name="props"
    >
      <v-edit-dialog
        large
        persistent
        @open="edittingField=props.item.name;editTarget=props.item.name"
        @save="onSaveEditDialog(props.item, props)"
      >
        {{ props.item.name }}
        <template
          #input
        >
          <v-text-field
            v-model="edittingField"
            :rules="[editingItemIsNotDuplicate]"
            clearable
          />
        </template>
      </v-edit-dialog>
    </template>
    <template #item.actions="{ item }">
      <action-row
        :can-edit="allowEditButton"
        :item="item"
        @delete="deleteItem"
      />
    </template>
    <template
      v-if="inputColumn"
      #footer
    >
      <v-text-field
        v-model="inputField"
        :rules=newItemValidator
        :disabled="disabled"
        outlined
        dense
        clearable
        append-outer-icon="mdi-plus"
        @click:append-outer="addItem"
        @change="addItem"
      />
    </template>
  </v-data-table>
</template>
<script>
  import { removeFromArray } from "@/lib/clientUtility.js";
  import actionRow from "@/components/common/actionRow.vue";

  export default {
    name: "ListForm",
    components: {
      actionRow,
    },
    props: {
      label: {
        type: String,
        default: ""
      },
      allowEditButton: {
        type: Boolean,
        default: false,
      },
      allowRenameInline:{
        type: Boolean,
        default: true,
      },
      inputColumn: {
        type: Boolean,
        default: true
      },
      selectable:{
        type: Boolean,
        default: false
      },
      value:{
        type: Array,
        default: ()=>{return [];}
      },
      stringItems: {
        type: Boolean,
        default: false,
      },
      items: { type: Array, required: true },
      headers: {
        type: Array,
        default: function () {
          return [{ value: "name", sortable: false }];
        },
      },
      newItemTemplate: {
        type: Object,
        default: function () {
          return { name: "" };
        },
      },
      disabled: Boolean
    },
    data: function () {
      return {
        inputField: null,
        edittingField: null,
        editTarget: null,
        newItemValidator: [this.newItemIsNotDuplicate]
      };
    },
    computed: {
      selectedItems:{
        get(){
          return this.value;
        },
        set(newVal){
          this.$emit("input", newVal);
        }
      },
      headersWithActions: function () {
        const rt = this.headers.filter((e)=>{
          return e.value !== "actions";
        });
        rt.push({ value: "actions", text: "", sortable: false });
        rt[0].editable = true;
        return rt;
      },
      editableRows: function () {
        return this.headersWithActions
          .filter((e)=>{
            return e.editable;
          })
          .map((e)=>{
            return e.value;
          });
      },
      tableData () {
        if (!this.stringItems) {
          return this.items;
        }
        return this.items.map((e)=>{
          return { name: e };
        });
      },
    },
    methods: {
      isDuplicate (newItem) {
        if (typeof newItem !== "string") {
          return false;
        }
        return this.tableData.some((e)=>{
          return e.name === newItem;
        });
      },
      newItemIsNotDuplicate: function (newItem) {
        return this.isDuplicate(newItem) ? "duplicated name is not allowed" : true;
      },
      editingItemIsNotDuplicate: function (newItem) {
        return this.isDuplicate(newItem) && this.editTarget !== newItem ? "duplicated name is not allowed" : true;
      },
      // 2nd argument also have item ,isMobile, header, and value prop. value has old value
      onSaveEditDialog: function (item, { index }) {
        if (this.isDuplicate(this.edittingField) && this.editTarget !== this.edittingField) {
          return;
        }

        if (this.stringItems) {
          this.$emit("update", this.edittingField, index);
        } else {
          const newItem = {...item}
          newItem.name = this.edittingField;
          this.$emit("update", newItem, index);
        }
      },
      addItem: function () {
        if (this.isDuplicate(this.inputField) || typeof this.inputField !== "string") {
          return;
        }
        const newItem = this.stringItems ? this.inputField : Object.assign({}, this.newItemTemplate || {}, { name: this.inputField });
        this.$emit("add", newItem);
        this.inputField = null;
      },
      deleteItem: function (v) {
        let index=-1
        if (this.stringItems){
          index = this.items.findIndex((e)=>{
            return e === v;
          });
        }else{
          index = this.items.findIndex((e)=>{
            return e.name === v.name;
          });
        }
        if (index !== -1) {
          this.$emit("remove", v, index);
        }
      },
    },

  };
</script>
