/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-btn-toggle>
    <div
      v-for="item in buttons"
      :key="item.label"
    >
      <v-btn
        @click="$emit(item.label)"
      >
        <v-icon>
          {{ item.icon }}
        </v-icon>
        {{ item.label }}
      </v-btn>
    </div>
  </v-btn-toggle>
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
      buttons: Array,
      openDialog: { type: Boolean, default: false },
    },
  };
</script>
