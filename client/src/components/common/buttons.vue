/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-btn-group>
      <v-btn
        v-for="item in buttons"
        :key="item.label"
        @click="$emit(item.label)"
        :prepend-icon=item.icon
        :disabled="item.disabled"
        :text=item.label
      />
  </v-btn-group>
</template>
<script>

/**
 * @type Button
 * @prop {string} icon
 * @prop {string} label
 */
export default {
  name: "Buttons",
  props: {
    buttons: Array
  }
};
</script>
