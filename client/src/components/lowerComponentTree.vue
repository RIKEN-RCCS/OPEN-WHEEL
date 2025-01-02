/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <my-treeview
    v-if="lowerLevelComponents!==null"
    open-all
    item-key="ID"
    :items="[ lowerLevelComponents ]"
    activatable
    @update:active="onUpdateActive"
  >
    <template #label="{ item }">
      <component-button
        :type="item.type"
        :name="item.name"
      />
    </template>
  </my-treeview>
</template>
<script>
"use strict";
import { mapState } from "vuex";
import getNodeAndPath from "../lib/getNodeAndPath.js";
import componentButton from "../components/common/componentButton.vue";
import myTreeview from "../components/common/myTreeview.vue";

export default {
  name: "LowerComponentTree",
  components: {
    componentButton,
    myTreeview
  },
  emits: ["selected"],
  data() {
    return {
      lowerLevelComponents: null
    };
  },
  computed: {
    ...mapState(["selectedComponent", "componentPath", "componentTree"])
  },
  mounted() {
    const targetID = this.selectedComponent.ID;
    this.lowerLevelComponents = getNodeAndPath(targetID, this.componentTree);
  },
  methods: {
    onUpdateActive(item) {
      const activeComponentID = item.ID;
      const activeComponent = getNodeAndPath(activeComponentID, this.componentTree);
      this.$emit("selected", activeComponent);
    }
  }
};
</script>
