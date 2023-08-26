/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-list v-model:opened="open" nav>
    <template v-for="item in items" :key=item.id >
      <template v-if="Array.isArray(item.children)" >
        <v-list-group
          :value=item.id
        >
          <template #activator="{ isOpen, props }">
            <v-list-item
              @click="onActiveted(item)"
              :class="{'text-primary': active.includes(item[itemKey])}"
            >
              <template #prepend>
                <v-icon
                  :icon="isOpen ? openIcons[item.type] : icons[item.type]"
                   v-bind="props"
                   @click="onClickIcon(item)"
                />
              </template>
              {{item.name}}
              <template #append />
            </v-list-item>
          </template >
          <file-treeview
            :items="item.children"
            :load-children="loadChildren"
            :activatable=activatable
            :active=active
            @update:active="onUpdateActive"
          />
        </v-list-group>
      </template>
      <template v-else>
        <v-list-item
          @click="onActiveted(item)"
          :class="{'text-primary': active.includes(item[itemKey])}"
        >
          <template #prepend>
            <v-icon
              :icon="icons[item.type]"
              v-bind="props"
              :load-children="getChildren"
              activatable
              :active=active
            />
          </template>
          {{item.name}}
        </v-list-item>
      </template>
    </template>
  </v-list>
</template>
<script>
  import { mapState } from "vuex";
  import { isContainer } from "@/lib/utility.js";
  import SIO from "@/lib/socketIOWrapper.js";

  export default {
    name: "fileTreeview",
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
      active:{
        type: Array,
        requred: this.activatable
      },
      itemKey:{
        type: String,
        default: "id"
      }
    },
    data:()=>{
      return {
        open:[],
        icons: {
          file: "mdi-file-outline",
          "file-link": "mdi-file-link-outline",
          dir: "mdi-folder",
          "dir-link": "mdi-link-box-outline",
          "deadlink-link": "mdi-file-link",
          sndd: "mdi-folder-multiple-outline",
          snd: "mdi-file-multiple-outline",
        },
        openIcons: {
          dir: "mdi-folder-open",
          sndd: "mdi-folder-multiple-outline",
          snd: "mdi-file-multiple-outline",
        },
      }
    },
    computed: {
      ...mapState(["projectRootDir"]),
    },
    methods:{
      async onClickIcon(item){
        if(!this.loadChildren){
          return false
        }
        await this.loadChildren(item);
      },
      onActiveted(item){
        if(!this.multipleActive){
          this.active.splice(0,this.active.length);
        }
        if (!this.active.includes(item[this.itemKey])){
          this.active.push(item[this.itemKey]);
        }
        this.$emit("update:active", item);
      }
    }
  }
</script>

