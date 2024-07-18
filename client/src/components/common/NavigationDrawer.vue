/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-navigation-drawer
    v-model="drawer"
    temporary
    location="right"
  >
    <v-list>
      <v-btn
        prepend-icon=mdi-cog-outline
        :href="remotehostURL"
        target="_blank"
        variant=text
        class="text-capitalize"
        text="Remotehost editor"
      />
      <v-btn
        prepend-icon=mdi-help-circle-outline
        href="https://riken-rccs.github.io/OPEN-WHEEL"
        target="_blank"
        variant=text
        class="text-capitalize"
        text="User guide"
      />
    </v-list>
  </v-navigation-drawer>
</template>
<script>
import { mapState } from "vuex";
import { state2color } from "../../lib/utility.js";
export default {
  name: "NavDrawer",
  props: {
    value: Boolean,
    baseUrl: String
  },
  computed: {
    ...mapState(["readOnly"]),
    readOnlyColor() {
      return state2color(`${this.readOnly ? "paused" : ""}`);
    },
    remotehostURL() {
      return `${this.baseUrl || "."}/remotehost`;
    },
    drawer: {
      get() {
        return this.value;
      },
      set(value) {
        this.$emit("update:modelValue", value);
      }
    }
  }
};
</script>
