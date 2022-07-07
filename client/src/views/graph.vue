/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <div>
    <componentTreeComponent />
    <v-row
      no-gutters
    >
      <componentLibrary />
      <componentGraph />
      <componentProperty />
    </v-row>
  </div>
</template>

<script>
  import componentGraph from "@/components/componentGraph.vue";
  import componentLibrary from "@/components/componentLibrary.vue";
  import componentProperty from "@/components/componentProperty.vue";
  import componentTreeComponent from "@/components/componentTree.vue";

  export default {
    name: "Graph",
    components: {
      componentGraph,
      componentLibrary,
      componentProperty,
      componentTreeComponent,
    },
  };
</script>
