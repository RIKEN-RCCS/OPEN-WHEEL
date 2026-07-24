/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <template v-if="Array.isArray(item.children) && (typeof loadChildren === 'function' || item.children.length > 0)">
    <v-list-group
      :value="item[itemKey]"
    >
      <template #activator="{ isOpen, props }">
        <v-list-item
          :key="item[itemKey]"
          :class="{'text-primary font-weight-bold selected-item': activatable && active !== null && active[itemKey] === item[itemKey]}"
        >
          <template #prepend>
            <span
              v-bind="props"
              class="d-inline-flex align-center"
              @click.stop="() => { if (!isOpen) { onClickNodeIcon(item); } }"
            >
              <v-icon
                :icon="getExpandIcon(isOpen)"
                data-cy="inner_treeview-expand-icon"
              />
              <v-icon
                v-if="getNodeIcon(isOpen, item)"
                :icon="getNodeIcon(isOpen, item)"
                data-cy="inner_treeview-node-icon"
              />
            </span>
          </template>
          <div @click="(e) => { if (!isOpen) { props.onClick(e); onClickNodeIcon(item); } onActiveted(item); }">
            <slot
              name="label"
              :item="item"
            >
              {{ item.name }}
            </slot>
          </div>
          <template #append>
            <slot
              name="append"
              :item="item"
            />
          </template>
        </v-list-item>
      </template>
      <template
        v-for="child in item.children"
        :key="child[itemKey]"
      >
        <inner-treeview
          ref="childNodes"
          :item="child"
          :load-children="loadChildren"
          :activatable="activatable"
          :open-all="openAll"
          :item-key="itemKey"
          :get-node-icon="getNodeIcon"
          :get-leaf-icon="getLeafIcon"
          :active="active"
          @update:active="(e)=>{$emit('update:active', e);}"
        >
          <template #label="{item}">
            <slot
              name="label"
              :item="item"
            >
              {{ child.name }}
            </slot>
          </template>
          <template #append="{item}">
            <slot
              name="append"
              :item="item"
            />
          </template>
        </inner-treeview>
      </template>
    </v-list-group>
  </template>
  <template v-else>
    <v-list-item
      :key="item[itemKey]"
      :class="{'text-primary font-weight-bold selected-item': activatable && active !== null && active[itemKey] === item[itemKey]}"
      @click="onActiveted(item)"
    >
      <template #prepend>
        <v-icon
          :icon="getLeafIcon(item)"
        />
      </template>
      <slot
        name="label"
        :item="item"
      >
        {{ item.name }}
      </slot>
      <template #append>
        <slot
          name="append"
          :item="item"
        />
      </template>
    </v-list-item>
  </template>
</template>
<script>

//always-shown expand/collapse indicator for directory-like (expandable) nodes.
//kept separate from getNodeIcon so callers can add their own icon (e.g. folder icon)
//alongside this indicator instead of replacing it.
const nodeOpenIcon = "mdi-menu-down";
const nodeCloseIcon = "mdi-menu-right";

export default {
  name: "InnerTreeview",
  props: {
    item: {
      type: Object,
      required: true
    },
    loadChildren: {
      type: [Function, null],
      default: null
    },
    activatable: {
      type: Boolean,
      default: false
    },
    openAll: {
      type: Boolean,
      default: false
    },
    active: {
      type: [Object, null],
      required: true
    },
    itemKey: {
      type: String,
      default: "id"
    },
    getNodeIcon: {
      type: Function,
      default: ()=>{ return ""; }
    },
    getLeafIcon: {
      type: Function,
      default: ()=>{ return ""; }
    }
  },
  emits: ["update:active"],
  methods: {
    getExpandIcon(isOpen) {
      return isOpen ? nodeOpenIcon : nodeCloseIcon;
    },
    async onClickNodeIcon(item) {
      if (!this.loadChildren) {
        return false;
      }
      await this.loadChildren(item);
    },
    onActiveted(item) {
      if (!this.activatable) {
        return null;
      }
      this.$emit("update:active", item);
    }
  }
};
</script>
<style scoped>
.selected-item {
  background-color: rgba(var(--v-theme-primary), 0.12) !important;
  border-left: 3px solid rgb(var(--v-theme-primary));
}
</style>
