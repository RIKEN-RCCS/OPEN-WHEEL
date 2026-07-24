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
    <template
      v-if="!showHeaders"
      #headers
    >
      {{ label }}
    </template>
    <template
      v-for="header in headersWithTooltip"
      :key="header.key"
      #[`header.${header.key}`]
    >
      <v-tooltip
        :text="header.tooltip"
        location="top"
      >
        <template #activator="{ props: tooltipProps }">
          <span v-bind="tooltipProps">{{ header.title }}</span>
        </template>
      </v-tooltip>
    </template>
    <template #item.name="props">
      <inline-editor
        v-if="allowRenameInline"
        :current-value="props.item.name"
        data-cy-prefix="list_form_property"
        :additional-rules="[updateItemValidator]"
        @confirmed="saveEditDialog(props.index, $event)"
      />
      <v-tooltip
        v-else
        :text="props.item.name"
        location="top"
        :disabled="props.item.name.length <= 10"
      >
        <template #activator="{ props: tooltipProps }">
          <span v-bind="tooltipProps">{{ props.item.name }}</span>
        </template>
      </v-tooltip>
    </template>
    <template #item.actions="{ item }">
      <action-row
        :can-edit="allowEditButton"
        :item="item"
        :disabled="readOnly"
        @delete="deleteItem"
      />
    </template>
    <template
      v-if="booleanColumns.includes('mandatory')"
      #item.mandatory="{ item, index }"
    >
      <v-checkbox
        :model-value="item.mandatory"
        :disabled="readOnly"
        hide-details
        density="compact"
        @update:model-value="$emit('toggle', index, 'mandatory', $event)"
      />
    </template>
    <template
      v-if="inputColumn"
      #bottom
    >
      <v-text-field
        ref="addField"
        v-model.lazy="inputField"
        :rules="newItemValidator"
        :disabled="disabled"
        variant="outlined"
        density="compact"
        :readonly="readOnly"
        clearable
        append-icon="mdi-plus"
        data-cy="list_form-add-text_field"
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
import actionRow from "../../components/common/actionRow.vue";
import inlineEditor from "./inlineEditor.vue";

const emptyStringIsNotAllowed = (v)=>{
  return v !== "";
};
const isString = (v)=>{
  return typeof v === "string";
};

export default {
  name: "ListForm",
  components: {
    actionRow,
    inlineEditor
  },
  props: {
    editDialogMinWidth: {
      type: [String, Number],
      default: "auto"
    },
    editDialogMaxWidth: {
      type: [String, Number],
      default: "auto"
    },
    label: {
      type: String,
      default: ""
    },
    additionalRules: {
      type: Array,
      default: ()=>{ return []; }
    },
    allowEditButton: {
      type: Boolean,
      default: false
    },
    allowRenameInline: {
      type: Boolean,
      default: true
    },
    inputColumn: {
      type: Boolean,
      default: true
    },
    autofocus: {
      type: Boolean,
      default: false
    },
    selectable: {
      type: Boolean,
      default: false
    },
    value: {
      type: Array,
      default: ()=>{ return []; }
    },
    stringItems: {
      type: Boolean,
      default: false
    },
    items: { type: Array, required: true },
    headers: {
      type: Array,
      default: function () {
        return [{ key: "name", sortable: false }];
      }
    },
    newItemTemplate: {
      type: Object,
      default: function () {
        return { name: "" };
      }
    },
    disabled: Boolean,
    readOnly: {
      type: Boolean,
      default: false
    },
    booleanColumns: {
      type: Array,
      default: ()=>{ return []; }
    },
    showHeaders: {
      type: Boolean,
      default: false
    }
  },
  emits: [
    "update:modelValue",
    "add",
    "remove",
    "update",
    "toggle"
  ],
  data: function () {
    return {
      inputField: null,
      oldVal: null,
      updateItemValidator: [this.editingItemIsNotDuplicate, emptyStringIsNotAllowed, isString],
      newItemValidator: [this.newItemIsNotDuplicate, emptyStringIsNotAllowed, isString]
    };
  },
  computed: {
    selectedItems: {
      get() {
        return this.value;
      },
      set(v) {
        this.$emit("update:modelValue", v);
      }
    },
    headersWithActions: function () {
      const rt = this.headers.filter((e)=>{
        return e.key !== "actions";
      });
      rt.push({ key: "actions", title: "", sortable: false });
      //Create a copy to avoid mutating the reactive prop object, which would cause an infinite re-render loop
      rt[0] = { ...rt[0], editable: true };
      return rt;
    },
    headersWithTooltip: function () {
      return this.headers.filter((e)=>{
        return e.tooltip;
      });
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
    tableData() {
      if (!this.stringItems) {
        return this.items;
      }
      return this.items.map((e)=>{
        return { name: e };
      });
    }
  },
  mounted() {
    if (this.additionalRules.length > 0) {
      this.updateItemValidator.push(...this.additionalRules);
      this.newItemValidator.push(...this.additionalRules);
    }
    if (this.autofocus) {
      //Focus once, right after mount, instead of vuetify's built-in intersection-based
      //autofocus: that fires on an animation frame, which can race with a sibling
      //list-form (e.g. output files) also being interacted with while this panel opens.
      this.$nextTick().then(()=>{
        this.$refs.addField?.focus();
      });
    }
  },
  methods: {
    isDuplicate(newItem, except = []) {
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
    openDialog(name) {
      if (this.readOnly) {
        return;
      }
      this.oldVal = name;
    },
    closeDialog() {
      this.oldVal = null;
    },
    saveEditDialog: function (index, newVal) {
      const isValid = this.updateItemValidator.every((func)=>{
        return func(newVal) === true;
      });
      if (!isValid) {
        console.log("new value is not valid", newVal);
        this.closeDialog();
        return;
      }
      if (newVal === this.oldVal) {
        console.log("new value is not changed", newVal);
        this.closeDialog();
        return;
      }
      if (this.stringItems) {
        this.$emit("update", newVal, index);
      } else {
        const newItem = this.stringItems ? newVal : Object.assign({}, this.newItemTemplate || {}, { name: newVal });
        this.$emit("update", newItem, index);
      }
      this.closeDialog();
    },
    addItem: function () {
      const isInvalid = this.newItemValidator.some((func)=>{
        return func(this.inputField) !== true;
      });
      if (isInvalid) {
        return;
      }
      const newItem = this.stringItems ? this.inputField : Object.assign({}, this.newItemTemplate || {}, { name: this.inputField });
      this.$emit("add", newItem);
      this.inputField = null;
    },
    deleteItem: function (v) {
      const index = this.items.findIndex((e)=>{
        return this.stringItems ? e === v.name : e.name === v.name;
      });
      if (index !== -1) {
        this.$emit("remove", v, index);
      }
    }
  }
};
</script>
<style>
.v-btn__content {
  text-transform: none !important;
}
</style>
