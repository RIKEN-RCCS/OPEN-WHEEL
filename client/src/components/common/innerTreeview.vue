/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-list v-model:opened="open" density="compact">
    <template v-for="item in items" :key=item[itemKey] >
      <template v-if="Array.isArray(item.children) && (typeof loadChildren === 'function' || item.children.length > 0)" >
        <v-list-group
          :value=item[itemKey]
        >
          <template #activator="{ isOpen, props }">
            <v-list-item
              v-bind="props"
              @click="onActiveted(item);onClickNodeIcon(item)"
              :class="{'text-primary': activatable && active.includes(item[itemKey])}"
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
          <inner-treeview
            :items="item.children"
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
                {{item.name}}
              </slot>
            </template>
            <template #append={item}>
              <slot name="append" :item="item"/>
            </template>
          </inner-treeview>
        </v-list-group>
      </template>
      <template v-else>
        <v-list-item
          @click="onActiveted(item)"
          :class="{'text-primary': activatable && active.includes(item[itemKey])}"
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
  </v-list>
</template>
<script>

export default {
  name: "innerTreeview",
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
  data:()=>{
    return {
      open:[],
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
    updateAll(){
      this.openChild();

      if(Array.isArray(this.$refs.childNodes)){
        this.$refs.childNodes.forEach((e)=>{e.updateAll()});
      }
    },
    openChild(){
      if(!Array.isArray(this.items)){
        return
      }
      this.open.splice(0,this.open.length,...this.items.filter((item)=>{
        return item && Array.isArray(item.children);
      })
        .map((e)=>{
          return e[this.itemKey]
        }))
    }
  },
  mounted(){
    if(this.openAll){
      this.openChild()
    }
  }
}
</script>
