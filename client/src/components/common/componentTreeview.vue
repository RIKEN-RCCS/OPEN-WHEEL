/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-list v-model:opened="open" nav>
    <template v-for="item in items" :key=item.ID >
      <template v-if="Array.isArray(item.children) && item.children.length > 0" >
        <v-list-group
          :value=item.ID
        >
          <template #activator="{ isOpen, props }">
            <v-list-item >
              <template #prepend>
                <v-icon
                  :icon="isOpen?nodeOpenIcon:nodeCloseIcon"
                   v-bind="props"
                />
              </template>
              <component-button
                :item="item"
                @clicked="goto(item)"
              />
              <template #append />
            </v-list-item>
          </template >
          <component-treeview
            :items="item.children"
            @close="$emit('close')"
          />
        </v-list-group>
      </template>
      <template v-else>
        <v-list-item>
          <component-button
            :item="item"
            @clicked="goto(item)"
          />
        </v-list-item>
      </template>
    </template>
  </v-list>
</template>
<script>
  import { mapState } from "vuex";
  import { isContainer } from "@/lib/utility.js";
  import componentButton from "@/components/common/componentButton.vue";
  import SIO from "@/lib/socketIOWrapper.js";

  export default {
    name: "componentTreeview",
    components:{
      componentButton,
    },
    props:{
      items:{
        type: Array,
        required: true
      },
    },
    data:()=>{
      return {
        open:[],
        nodeOpenIcon: "mdi-menu-down",
        nodeCloseIcon: "mdi-menu-right"
      }
    },
    computed: {
      ...mapState(["projectRootDir"]),
    },
    methods:{
      goto: function (item) {
        const requestID = isContainer(item) ? item.ID : item.parent;
        SIO.emitGlobal("getWorkflow", this.projectRootDir, requestID, SIO.generalCallback);
        this.$emit("close")
      },
    },
    mounted(){
      this.open.push(...this.items.map((e)=>{return e.ID}))
    }
  }
</script>

