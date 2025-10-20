/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <div
    @dragover.prevent
    @dragenter.prevent
  >
    <component-graph
      @component-right-click="onComponentRightClick"
      @connector-right-click="onConnectorRightClick"
      @vconnector-right-click="onVconnectorRightClick"
    />
  </div>
</template>

<script>
import { mapMutations, mapState, mapActions } from "vuex";
import ComponentGraph from "../components/componentGraph/componentGraph.vue";
import { widthComponentLibrary, heightToolbar, heightDenseToolbar, heightFooter } from "../lib/componentSizes.json";
import { useHotkey } from "vuetify/lib/composables/hotkey/index.mjs";

export default {
  name: "GraphView",
  components: {
    ComponentGraph
  },
  computed: {
    ...mapState(["selectedComponent"])
  },
  mounted: function () {
    this.fit();
    window.addEventListener("resize", this.fit.bind(this));
    useHotkey({
      "ctrl+c": this.onCopy,
      "ctrl+x": this.onCut,
      "ctrl+v": this.onPaste,
    });
  },
  beforeUnmount: function () {
    window.removeEventListener("resize", this.fit.bind(this));
  },
  methods: {
    ...mapMutations(
      {
        commitCanvasWidth: "canvasWidth",
        commitCanvasHeight: "canvasHeight",
        setCopyInfo: "setCopyInfo"
      }),
    ...mapActions(["pasteComponent"]),
    fit: function () {
      const magicNumberH = 17 + 25;
      const magicNumberW = 24;
      const baseWidth = window.innerWidth < this.$parent.$parent.$el.clientWidth ? window.innerWidth : this.$parent.$parent.$el.clientWidth;
      const width = baseWidth - widthComponentLibrary - magicNumberW;
      const height = window.innerHeight - heightToolbar - heightDenseToolbar * 2 - heightFooter - magicNumberH;
      if (width > 0 && height > 0) {
        this.commitCanvasWidth(width);
        this.commitCanvasHeight(height);
      }
    },
    onCopy() {
      if (this.selectedComponent === null) {
        return;
      }
      this.setCopyInfo({ type: "copy", ID: this.selectedComponent.ID });
    },
    onCut() {
      if (this.selectedComponent === null) {
        return;
      }
      this.setCopyInfo({ type: "cut", ID: this.selectedComponent.ID });
    },
    onPaste() {
      this.pasteComponent(() => {});
    },
  }
};
</script>
