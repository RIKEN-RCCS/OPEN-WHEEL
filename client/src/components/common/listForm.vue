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
    <template #headers>
      {{ label }}
    </template>
    <template
      v-if="allowRenameInline"
      #item.name="props"
    >
          <v-menu
            location="start"
            v-model="editDialog[props.index]"
            :close-on-content-click="false"
            :min-width="editDialogMinWidth"
            :max-width="editDialogMaxWidth"
          >
            <template v-slot:activator="{ props: menuProps }">
      <v-btn
        variant="text"
        v-bind="menuProps"
        block
        class="justify-start"
        :text=props.item.columns.name
        @click="openDialog(props.item.columns.name, props.index)"
      />
    </template>
            <v-sheet

            :min-width="editDialogMinWidth"
            :max-width="editDialogMaxWidth"
            >
              <v-text-field
                v-model="newVal"
                :rules=updateItemValidator
                clearable
                @keyup.enter="saveEditDialog"
              />
          </v-sheet>
        </v-menu>
    </template>
    <template #item.actions="{ item }">
      <action-row
        :can-edit="allowEditButton"
        :item="item.raw"
        @delete="deleteItem"
      />
    </template>
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
    <template
      v-else
      #bottom
    />
  </v-data-table>
</template>
<script>
import actionRow from "@/components/common/actionRow.vue";
import versatileDialog from "@/components/versatileDialog.vue";

const emptyStringIsNotAllowed = (v)=>{
  return v !== "";
}
const isString = (v)=>{
  return typeof v === "string";
}

export default {
  name: "ListForm",
  components: {
    actionRow,
    versatileDialog,
  },
  props: {
    editDialogMinWidth:{
      type: [String, Number],
      default: "auto"
    },
    editDialogMaxWidth:{
      type: [String, Number],
      default: "auto"
    },
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
      this.updateItemValidator.push(...this.additionalRules);
      this.newItemValidator.push(...this.additionalRules);
    }
    //store array of false with the same length as this.items
    this.editDialog.push(...this.items.map(()=>{return false}))
  },
  watch:{
    items(){
      this.editDialog.push(...this.items.map(()=>{return false}))
    }
  },
  data: function () {
    return {
      inputField: null,
      editDialog: [],
      newVal: null,
      oldVal: null,
      targetIndex: null,
      updateItemValidator:[this.editingItemIsNotDuplicate, emptyStringIsNotAllowed, isString],
      newItemValidator: [this.newItemIsNotDuplicate, emptyStringIsNotAllowed, isString]
    };
  },
  computed: {
    selectedItems:{
      get(){
        return this.value;
      },
      set(v){
        this.$emit("update:modelValue", v);
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
    isDuplicate (newItem, except=[]) {
      if (typeof newItem !== "string") {
        return false;
      }
      return this.tableData.some((e)=>{
        return !except.includes(e.name) && e.name === newItem;
      });
    },
    newItemIsNotDuplicate: function (newItem) {
      return this.isDuplicate(newItem) ? "duplicated name is not allowed" : true;
    },
    editingItemIsNotDuplicate: function (newItem) {
      return this.isDuplicate(newItem, [this.oldVal]) ? "duplicated name is not allowed" : true;
    },
    openDialog(name,index){
      this.targetIndex=index
      this.newVal=name;
      this.oldVal=name
      this.editDialog[index]=true
    },
    closeDialog(index){
      this.targetIndex=null
      this.newVal=null;
      this.oldVal=null
      this.editDialog[index]=false;
    },
    saveEditDialog: function () {
      const index=this.targetIndex
      const isValid = this.updateItemValidator.every((func)=>{
        return func(this.newVal) === true
      });
      if(!isValid){
        console.log("new value is not valid", this.newVal)
        this.closeDialog(index);
        return 
      }
      if( this.newVal === this.oldVal){
        console.log("new value is not changed", this.newVal)
        this.closeDialog(index);
        return 
      }
      if (this.stringItems) {
        this.$emit("update", this.newVal, index);
      } else {
        const newItem = this.stringItems ? this.newVal : Object.assign({}, this.newItemTemplate || {}, { name: this.newVal });
        this.$emit("update", newItem, index);
      }
      this.closeDialog(index);
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
      const  index = this.items.findIndex((e)=>{
        return this.stringItems ? e === v.name : e.name === v.name;
      });

      if (index !== -1) {
        this.$emit("remove", v, index);
      }
    },
  },
};
</script>
<style>
.v-btn__content {
  text-transform: none !important;
}
</style>
