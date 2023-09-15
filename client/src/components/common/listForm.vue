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
      <v-btn variant="text"
        :text=props.item.columns.name
        @click="openDialog(props.item.columns.name, props.index)"
      />
    </template>
    <template #item.actions="{ item }">
      <action-row
        :can-edit="allowEditButton"
        :item="item.raw"
        @delete="deleteItem"
      />
    </template>
    <template
      v-if="! inputColumn"
      #bottom
    />
    <template
      v-if="inputColumn"
      #bottom
    >
      <v-text-field
        v-model.lazy="inputField"
        :rules=newItemValidator
        :disabled="disabled"
        variant=outlined
        density=compact
        clearable
        append-icon="mdi-plus"
        @click:append="addItem"
        @keyup.enter="addItem"
      />
    </template>
  </v-data-table>
        <versatile-dialog
          v-model="editDialog"
        max-width="50vw"
        @ok="saveEditDialog"
        @cancel="closeDialog"
        >
          <template #message>
            <v-text-field
              v-model="edittingField"
              :rules=edittingFieldValidator
              clearable
              @keyup.enter="saveEditDialog"
            />
        </template>
      </versatile-dialog>
</template>
<script>
import actionRow from "@/components/common/actionRow.vue";
import versatileDialog from "@/components/versatileDialog.vue";

const emptyStringIsNotAllowed = (v)=>{
  return v !== "";
}

export default {
  name: "ListForm",
  components: {
    actionRow,
    versatileDialog,
  },
  props: {
    label: {
      type: String,
      default: ""
    },
    additionalRules:{
      type: Array
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
        return [{ key: "name", sortable: false }];
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
  mounted(){
    if(this.additionalRules){
      this.edittingFieldValidator.push(...this.additionalRules);
      this.newItemValidator.push(...this.additionalRules);
    }
  },
  data: function () {
    return {
      inputField: null,
      edittingField: null,
      edittingIndex: null,
      editDialog: false,
      edittingFieldValidator:[this.editingItemIsNotDuplicate, emptyStringIsNotAllowed, this.isString],
      editTarget: null,
      newItemValidator: [this.newItemIsNotDuplicate, emptyStringIsNotAllowed, this.isString]
    };
  },
  computed: {
    selectedItems:{
      get(){
        return this.value;
      },
      set(newVal){
        this.$emit("update:modelValue", newVal);
      }
    },
    headersWithActions: function () {
      const rt = this.headers.filter((e)=>{
        return e.key !== "actions";
      });
      rt.push({ key: "actions", title: "", sortable: false });
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
    isString(){
      return typeof this.inputField === "string"
    },
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
    openDialog(name,index){
      this.edittingIndex=index
      this.edittingField=name;
      this.editTarget=name
      this.editDialog=true
    },
    closeDialog(){
      this.edittingIndex=null
      this.edittingField=null;
      this.editTarget=null
      this.editDialog=false;
    },
    saveEditDialog: function () {
      const item=this.edittingField
      const index=this.edittingIndex
      const isInvalid = this.edittingFieldValidator.some((func)=>{
        return !func(this.inputField)
      });
      if(isInvalid){
        return
      }
      if (this.stringItems) {
        this.$emit("update", this.edittingField, index);
      } else {
        const newItem = {...item}
        newItem.name = this.edittingField;
        this.$emit("update", newItem, index);
      }
      this.onCloseDialog();
    },
    addItem: function () {
      const isInvalid = this.newItemValidator.some((func)=>{
        return func(this.inputField) !== true
      });

      if(isInvalid){
        return
      }
      const newItem = this.stringItems ? this.inputField : Object.assign({}, this.newItemTemplate || {}, { name: this.inputField });
      this.$emit("add", newItem);
      this.inputField = null;
    },
    deleteItem: function (v) {
      let index=-1;
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
<style>
  .v-btn__content { text-transform: none !important; }
</style>
