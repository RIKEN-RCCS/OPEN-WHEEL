/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-btn
    variant="flat"
    :color="componentDefinition[type].color"
    class="custom-transform-class text-none"
    @click="$emit('clicked')"
  >
    <img
      :src="componentDefinition[type].img"
      :alt="componentDefinition[type].type"
    >
    {{ name }}
  </v-btn>
</template>
<script>
"use strict";
import loadComponentDefinition from "../../lib/componentDefinision.js";
export default {
  name: "ComponentButton",
  props: {
    type: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    }
  },
  emits: ["clicked"],
  data: ()=>{
    return {
      componentDefinition: loadComponentDefinition()
    };
  }

};
</script>
