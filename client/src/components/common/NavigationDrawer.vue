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
        v-if="!hideRemotehostButton"
        prepend-icon="mdi-cog-outline"
        variant="text"
        class="text-capitalize"
        text="Remotehost editor"
        data-cy="navigation-manage_remote_host-btn"
        @click="openRemotehostManager"
      />
      <v-btn
        prepend-icon="mdi-help-circle-outline"
        href="https://riken-rccs.github.io/OPEN-WHEEL"
        target="_blank"
        variant="text"
        class="text-capitalize"
        text="User guide"
        data-cy="navigation-user_guide_editor-btn"
        @click="drawer = false"
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
    baseUrl: {
      type: String,
      default: "."
    },
    hideRemotehostButton: {
      type: Boolean,
      default: false
    }
  },
  emits: [
    "update:modelValue",
    "open-remotehost-manager"
  ],
  computed: {
    ...mapState(["readOnly"]),
    readOnlyColor() {
      return state2color(`${this.readOnly ? "paused" : ""}`);
    },
    drawer: {
      get() {
        return this.value;
      },
      set(value) {
        this.$emit("update:modelValue", value);
      }
    }
  },
  methods: {

    /**
     * Close the drawer and emit the open-remotehost-manager event.
     */
    openRemotehostManager() {
      this.drawer = false;
      this.$emit("open-remotehost-manager");
    }
  }
};
</script>
