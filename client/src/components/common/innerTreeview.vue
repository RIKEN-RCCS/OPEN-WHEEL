/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <template v-if="Array.isArray(item.children) && (typeof loadChildren === 'function' || item.children.length > 0)" >
    <v-list-group
      :value=item[itemKey]
    >
      <template #activator="{ isOpen, props }">
        <v-list-item
          v-bind="props"
          @click="onActiveted(item);onClickNodeIcon(item)"
          :class="{'text-primary': activatable && active.includes(item[itemKey])}"
          :key=item[itemKey] 
        >
          <template #prepend>
            <v-icon
              :icon="getNodeIcon(isOpen, item)"
            />
          </template>
          <slot name="label" :item="item">
            {{item.name}}
          </slot>
          <template #append>
            <slot name="append" :item="item"/>
          </template>
        </v-list-item>
      </template >
        <template v-for="child in item.children" :key=child[itemKey] >
          <inner-treeview
            :item="child"
            :load-children="loadChildren"
            :activatable=activatable
            :open-all="openAll"
            :item-key=itemKey
            :get-node-icon="getNodeIcon"
            :get-leaf-icon="getLeafIcon"
            :active=active
            @update:active="(e)=>{$emit('update:active', e);}"
            ref="childNodes"
          >
            <template #label={item}>
              <slot name="label" :item="item">
                {{child.name}}
              </slot>
            </template>
            <template #append={item}>
              <slot name="append" :item="item"/>
            </template>
          </inner-treeview>
        </template>
    </v-list-group>
  </template>
  <template v-else>
    <v-list-item
      @click="onActiveted(item)"
      :class="{'text-primary': activatable && active.includes(item[itemKey])}"
      :key=item[itemKey] 
    >
      <template #prepend>
        <v-icon
          :icon=getLeafIcon(item)
        />
      </template>
      <slot name="label" :item="item">
        {{item.name}}
      </slot>
      <template #append>
        <slot name="append" :item="item"/>
      </template>
    </v-list-item>
  </template>
</template>
<script>

export default {
  name: "innerTreeview",
  props:{
    item:{
      type: Object,
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
    active:{
      type: Array,
      required: this.activatable
    },
    itemKey:{
      type: String,
      default: "id"
    },
    getNodeIcon:{
      type: Function,
      default:()=>{return ""}
    },
    getLeafIcon:{
      type: Function,
      default:()=>{return ""}
    }
  },
  methods:{
    async onClickNodeIcon(item){
      if(!this.loadChildren){
        return false
      }
      await this.loadChildren(item);
    },
    onActiveted(item){
      if(! this.activatable){
        return null;
      }
      if(!this.multipleActive){
        this.active.splice(0,this.active.length);
      }
      if (!this.active.includes(item[this.itemKey])){
        this.active.push(item[this.itemKey]);
      }
      this.$emit("update:active", item);
    },
  },
}
</script>
