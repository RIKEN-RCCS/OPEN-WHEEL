/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <div>
    <v-row no-gutters >
      <v-col cols=12>
        <component-tree/>
      </v-col>
    </v-row>
    <v-row no-gutters >
      <component-library />
      <graph-view />
      <component-property />
    </v-row>
  </div>
</template>

<script>
  import GraphView from "@/components/graphView.vue";
  import ComponentLibrary from "@/components/componentLibrary.vue";
  import ComponentProperty from "@/components/componentProperty.vue";
  import ComponentTree from "@/components/componentTree.vue";

  export default {
    name: "Graph",
    components: {
      GraphView,
      ComponentLibrary,
      ComponentProperty,
      ComponentTree,
    },
  };
</script>
