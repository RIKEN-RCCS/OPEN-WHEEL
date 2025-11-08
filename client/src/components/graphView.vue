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
import { mapMutations, mapState, mapActions, useStore } from "vuex";
import { watchEffect } from "vue";
import ComponentGraph from "../components/componentGraph/componentGraph.vue";
import { widthComponentLibrary, heightToolbar, heightDenseToolbar, heightFooter } from "../lib/componentSizes.json";
import { useHotkey } from "vuetify/lib/composables/hotkey/index.mjs";

export default {
  name: "GraphView",
  components: {
    ComponentGraph
  },
  setup() {
    const store = useStore();

    const onCopy = ()=>{
      if (store.state.selectedComponent === null) return;
      store.commit("copyInfo", { type: "copy", ID: store.state.selectedComponent.ID });
    };
    const onCut = ()=>{
      if (store.state.selectedComponent === null) return;
      store.commit("copyInfo", { type: "cut", ID: store.state.selectedComponent.ID });
    };
    const onPaste = ()=>{
      store.dispatch("pasteComponent", ()=>{});
    };

    // Support both Ctrl (Windows/Linux) and Cmd (macOS)
    const hotkeys = [
      { key: "ctrl+c", handler: onCopy },
      { key: "meta+c", handler: onCopy },
      { key: "ctrl+x", handler: onCut },
      { key: "meta+x", handler: onCut },
      { key: "ctrl+v", handler: onPaste },
      { key: "meta+v", handler: onPaste }
    ];

    //Use the robust watchEffect pattern for each hotkey
    hotkeys.forEach(({ key, handler })=>{
      watchEffect((onCleanup)=>{
        if (key) {
          const unregister = useHotkey(key, handler);
          onCleanup(unregister);
        }
      });
    });

    return {};
  },
  computed: {
    ...mapState(["selectedComponent"])
  },
  mounted: function () {
    this.fit();
    window.addEventListener("resize", this.fit.bind(this));
  },
  beforeUnmount: function () {
    window.removeEventListener("resize", this.fit.bind(this));
  },
  methods: {
    ...mapMutations({
      commitCanvasWidth: "canvasWidth",
      commitCanvasHeight: "canvasHeight",
      setCopyInfo: "copyInfo"
    }),
    ...mapActions(["pasteComponent"]),
    fit: function () {
      const magicNumberH = 17 + 25;
      const magicNumberW = 24;
      const baseWidth
        = window.innerWidth < this.$parent.$parent.$el.clientWidth
          ? window.innerWidth
          : this.$parent.$parent.$el.clientWidth;
      const width = baseWidth - widthComponentLibrary - magicNumberW;
      const height
        = window.innerHeight
          - heightToolbar
          - heightDenseToolbar * 2
          - heightFooter
          - magicNumberH;
      if (width > 0 && height > 0) {
        this.commitCanvasWidth(width);
        this.commitCanvasHeight(height);
      }
    }
  }
};
</script>
