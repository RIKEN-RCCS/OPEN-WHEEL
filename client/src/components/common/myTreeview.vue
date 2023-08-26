/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-list v-model:opened="open" nav>
    <template v-for="item in items" :key=item[itemKey] >
      <template v-if="Array.isArray(item.children) && (typeof loadChildren === 'function' || item.children.length > 0)" >
        <v-list-group
          :value=item[itemKey]
        >
          <template #activator="{ isOpen, props }">
            <v-list-item
              @click="onActiveted(item)"
              :class="{'text-primary': activatable && active.includes(item[itemKey])}"
            >
              <template #prepend>
                <v-icon
                  :icon="getNodeIcon(isOpen, item)"
                  v-bind="props"
                  @click="onClickNodeIcon(item)"
                />
              </template>
              <slot name="label" :item="item">
                {{item.name}}
              </slot>
              <template #append />
            </v-list-item>
          </template >
          <my-treeview
            :items="item.children"
            :load-children="loadChildren"
            :activatable=activatable
            :active=active
            @update:active="(e)=>{$emit('update:active', e);}"
            :get-node-icon="getNodeIcon"
            :get-leaf-icon="getLeafIcon"
            :open-all="openAll"
          >
            <template #label={item}>
              <slot name="label" :item="item">
                {{item.name}}
              </slot>
            </template>
          </my-treeview>
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
              v-bind="props"
            />
          </template>
          <slot name="label" :item="item">
            {{item.name}}
          </slot>
        </v-list-item>
      </template>
    </template>
  </v-list>
</template>
<script>
  export default {
    name: "myTreeview",
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
        requred: this.activatable
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
          return;
        }
        if(!this.multipleActive){
          this.active.splice(0,this.active.length);
        }
        if (!this.active.includes(item[this.itemKey])){
          this.active.push(item[this.itemKey]);
        }
        this.$emit("update:active", item);
      }
    },
    mounted(){
      if(this.openAll){
        this.open.push(...this.items.map((e)=>{return e[this.itemKey]}))
      }
    }
  }
</script>

