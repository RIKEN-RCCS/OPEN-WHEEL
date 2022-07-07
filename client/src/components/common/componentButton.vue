/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-btn
    :color="componentDefinition[item.type].color"
    class="custom-transform-class text-none"
    @click="$emit('clicked')"
  >
    <img
      :src="componentDefinition[item.type].img"
      :alt="componentDefinition[item.type].type"
    >
    {{ item.name }}
  </v-btn>
</template>
<script>
  "use strict";
  import loadComponentDefinition from "@/lib/componentDefinision.js";
  export default {
    name: "ComponentButton",
    props: { item: Object },
    data: ()=>{
      return {
        componentDefinition: loadComponentDefinition(),
      };
    },

  };
</script>
