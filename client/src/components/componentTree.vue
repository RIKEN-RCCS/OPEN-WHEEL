/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-toolbar
    dense
  >
    <v-dialog
      v-model="showComponentTree"
      overlay-opacity="0.9"
    >
      <template #activator="{ on, attrs }">
        <v-btn
          icon
          v-bind="attrs"
          class="ms-12"
          v-on="on"
        >
          <v-icon>mdi-sitemap mdi-rotate-270 </v-icon>
        </v-btn>
      </template>

      <v-treeview
        open-all
        item-key="ID"
        :items="componentTree"
      >
        <template #label="{ item }">
          <component-button
            :item="item"
            @clicked="goto(item)"
          />
        </template>
      </v-treeview>
    </v-dialog>
    <v-breadcrumbs
      :items="pathToCurrentComponent"
    >
      <template #divider>
        <v-icon>mdi-forward</v-icon>
      </template>
      <template #item="{ item }">
        <v-breadcrumbs-item>
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
  import SIO from "@/lib/socketIOWrapper.js";

  export default {
    name: "ComponentTree",
    components: {
      componentButton,
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
