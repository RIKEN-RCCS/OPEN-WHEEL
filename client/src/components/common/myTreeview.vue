/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-list
    v-model:opened="open"
    density="compact"
  >
    <template
      v-for="item in items"
      :key="item[itemKey]"
    >
      <inner-treeview
        ref="tree"
        :item="item"
        :load-children="loadChildren"
        :activatable="activatable"
        :active="lastActive"
        :open-all="openAll"
        :item-key="itemKey"
        :get-node-icon="getNodeIcon"
        :get-leaf-icon="getLeafIcon"
        @update:active="onUpdateActive"
      >
        <template #label="{item:item2}">
          <slot
            name="label"
            :item="item2"
          >
            {{ item.name }}
          </slot>
        </template>
        <template #append="{item:item2}">
          <slot
            name="append"
            :item="item2"
          />
        </template>
      </inner-treeview>
    </template>
  </v-list>
</template>
<script>
import innerTreeview from "../../components/common/innerTreeview.vue";

const nodeOpenIcon = "mdi-menu-down";
const nodeCloseIcon = "mdi-menu-right";

export default {
  name: "MyTreeview",
  components: {
    innerTreeview
  },
  props: {
    items: {
      type: Array,
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
    itemKey: {
      type: String,
      default: "id"
    },
    getNodeIcon: {
      type: Function,
      default: (isOpen)=>{ return isOpen ? nodeOpenIcon : nodeCloseIcon; }
    },
    getLeafIcon: {
      type: Function,
      default: ()=>{ return ""; }
    }
  },
  emits: ["update:active"],
  data: ()=>{
    return {
      lastActive: null,
      open: []
    };
  },
  mounted() {
    if (this.openAll) {
      this.open.splice(0, this.open.length, ...this.items.filter((item)=>{
        return item && Array.isArray(item.children);
      })
        .map((e)=>{
          return e[this.itemKey];
        }));
    }
  },
  methods: {
    onUpdateActive(item) {
      this.lastActive = item;
      this.$emit("update:active", item);
    }
  }
};
</script>
