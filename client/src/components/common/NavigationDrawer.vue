/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-navigation-drawer
    v-model="drawer"
    app
    temporary
    right
    cliped
  >
    <v-list
      nav
      dense
    >
      <a
        href="/remotehost"
        target="_blank"
      >
        <v-list-item>
          <v-list-item-icon>
            <v-icon>mdi-cog-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-title>
            Remotehost editor
          </v-list-item-title>
        </v-list-item>
      </a>
      <a
        href="https://riken-rccs.github.io/OPEN-WHEEL"
        target="_blank"
      >
        <v-list-item>
          <v-list-item-icon>
            <v-icon>mdi-help-circle-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-title>User guide</v-list-item-title>
        </v-list-item>
      </a>
    </v-list>
  </v-navigation-drawer>
</template>
<script>
  export default {
    name: "NavDrawer",
    props: {
      value: Boolean,
    },
    computed: {
      drawer: {
        get () {
          return this.value;
        },
        set (value) {
          this.$emit("input", value);
        },
      },
    },
  };
</script>
