/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
    <v-app-bar >
      <template #prepend>
        <a :href="homeURL" data-cy="tool_bar-wheel_logo-logo">
        <v-img height=72px width=180px :src="imgLogo" alt="wheel title logo" />
      </a>
      </template>
      <v-app-bar-title
        class="text-lowercase text-decoration-none text-h5 white--text"
      >
        {{ title }}
      </v-app-bar-title>
      <slot name="append" />
      <template #append>
        <v-app-bar-nav-icon
          @click="$emit('navIconClick')"
          data-cy="tool_bar-navi-icon"
        />
      </template>
      <template #extension>
        <slot name=extension />
      </template >
    </v-app-bar>
</template>

<script>
import imgLogo from "../../assets/wheel_logomark.png";
export default {
  data: ()=>{
    return {
      imgLogo
    };
  },
  props: {
    title: {
      type: String,
      required: true
    },
    baseUrl: String
  },
  computed: {
    homeURL() {
      return `${this.baseUrl || "."}/home`;
    }
  },
  emits: ["navIconClick"]
};
</script>
