/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-toolbar
    density="compact"
  >
    <v-dialog
      v-model="showComponentTree"
      overlay-opacity="0.9"
    >
      <template #activator="{ props }">
        <v-btn
          icon="mdi-sitemap mdi-rotate-270"
          v-bind="props"
          class="ms-12"
        />
      </template>

      <my-treeview
        :items="componentTree"
        itemKey="ID"
        :get-node-icon="getNodeIcon"
        :open-all=true
      >
        <template #label="{item}">
          <component-button
              :item="item"
              @clicked="goto(item)"
          />
        </template>
      </my-treeview>
    </v-dialog>
    <v-breadcrumbs
      :items="pathToCurrentComponent"
    >
      <template #divider>
        <v-icon>mdi-forward</v-icon>
      </template>
      <template #title="{ item }">
        <v-breadcrumbs-item
            :disabled="false"
        >
          <component-button
            :item="item"
            @clicked="goto(item)"
          />
        </v-breadcrumbs-item>
      </template>
    </v-breadcrumbs>
  </v-toolbar>
</template>

<script>
  import { mapState } from "vuex";
  import getNodeAndPath from "@/lib/getNodeAndPath.js";
  import { isContainer } from "@/lib/utility.js";
  import componentButton from "@/components/common/componentButton.vue";
  import myTreeview from "@/components/common/myTreeview.vue"
  import SIO from "@/lib/socketIOWrapper.js";

  export default {
    name: "ComponentTree",
    components: {
      componentButton,
      myTreeview
    },
    data: ()=>{
      return {
        showComponentTree: false,
      };
    },
    computed: {
      ...mapState({
        tree: "componentTree",
        currentComponent: "currentComponent",
        projectRootDir: "projectRootDir"
      }),
      pathToCurrentComponent: function () {
        const rt = [];
        if (this.currentComponent !== null) {
          getNodeAndPath(this.currentComponent.ID, this.tree, rt);
        }
        return rt;
      },
      componentTree: function () {
        return [this.tree];
      },
    },
    methods: {
      goto: function (item) {
        const requestID = isContainer(item) ? item.ID : item.parent;
        SIO.emitGlobal("getWorkflow", this.projectRootDir, requestID, SIO.generalCallback);
        this.showComponentTree = false;
      },
    },
  };
</script>
<style>
.v-breadcrumbs-item--disabled {
  opacity: 1.0;
}
</style>
