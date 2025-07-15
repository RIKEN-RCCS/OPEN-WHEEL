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
      :prepend-icon="item.icon"
      :disabled="item.disabled"
      :text="item.label"
      :data-cy="`buttons-${item.label}-btn`"
      @click="$emit(item.label)"
    />
  </v-btn-group>
</template>
<script>

export default {
  name: "Buttons",
  props: {
    buttons: {
      type: Array,
      required: true
    }
  }
};
</script>
