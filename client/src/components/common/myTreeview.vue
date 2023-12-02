/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-list v-model:opened="open" density="compact">
    <template v-for="item in items" :key=item[itemKey] >
      <inner-treeview
        :item=item
        :load-children=loadChildren
        :activatable=activatable
        :open-all=openAll
        :item-key=itemKey
        :get-node-icon="getNodeIcon"
        :get-leaf-icon="getLeafIcon"
        :active=active
        @update:active="(e)=>{$emit('update:active', e);}"
        ref=tree
      >
        <template #label={item}>
          <slot name="label" :item="item">
            {{item.name}}
          </slot>
        </template>
        <template #append={item}>
          <slot name="append" :item="item"/>
        </template>
      </inner-treeview>
    </template>
  </v-list>
</template>
<script>
import innerTreeview from "@/components/common/innerTreeview.vue";

const nodeOpenIcon= "mdi-menu-down";
const nodeCloseIcon= "mdi-menu-right";

export default {
  name: "myTreeview",
  components:{
    innerTreeview
  },
  props:{
    items:{
      type: Array,
      required: true
    },
    loadChildren:{
      type: Function,
    },
    activatable:{
      type: Boolean,
      default: false
    },
    openAll:{
      type: Boolean,
      default: false
    },
    itemKey:{
      type: String,
      default: "id"
    },
    getNodeIcon:{
      type: Function,
      default:(isOpen)=>{ return isOpen ? nodeOpenIcon : nodeCloseIcon }
    },
    getLeafIcon:{
      type: Function,
      default:()=>{return ""}
    }
  },
  data:()=>{
    return {
      open:[],
      active: []
    }
  },
  mounted(){
    if(this.openAll){
      this.open.splice(0,this.open.length,...this.items.filter((item)=>{
        return item && Array.isArray(item.children);
      })
        .map((e)=>{
          return e[this.itemKey]
        }))
    }
  }
}
</script>

