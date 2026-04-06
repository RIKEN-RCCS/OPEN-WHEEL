/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <div
    ref="canvasContainer"
    @dragover.prevent
    @dragenter.prevent
  >
    <component-graph
      @component-right-click="onComponentRightClick"
      @connector-right-click="onConnectorRightClick"
      @vconnector-right-click="onVconnectorRightClick"
      @background-right-click="onBackgroundRightClick"
    />
  </div>
</template>

<script>
import { mapMutations, mapState, mapActions } from "vuex";
import ComponentGraph from "../components/componentGraph/componentGraph.vue";
import { widthComponentLibrary, heightToolbar, heightDenseToolbar, heightFooter } from "../lib/componentSizes.json";

export default {
  name: "GraphView",
  components: {
    ComponentGraph
  },
  data() {
    return {
      lastMouseEvent: null,
      hotkeyUnregisterFunctions: [],
      mouseMoveHandler: null
    };
  },
  computed: {
    ...mapState(["selectedComponent", "copyInfo", "selectedFile"])
  },
  mounted: function () {
    this.fit();
    window.addEventListener("resize", this.fit);

    //Track mouse movement with simple event listener
    if (this.$refs.canvasContainer) {
      this.mouseMoveHandler = (e)=>{
        this.lastMouseEvent = e;
      };
      this.$refs.canvasContainer.addEventListener("mousemove", this.mouseMoveHandler);
    }

    //Register hotkeys
    this.registerHotkeys();
  },
  beforeUnmount: function () {
    window.removeEventListener("resize", this.fit);

    //Unregister mousemove listener
    if (this.$refs.canvasContainer && this.mouseMoveHandler) {
      this.$refs.canvasContainer.removeEventListener("mousemove", this.mouseMoveHandler);
    }

    //Unregister all hotkeys
    this.hotkeyUnregisterFunctions.forEach((unregister)=>{
      if (typeof unregister === "function") {
        unregister();
      }
    });
    this.hotkeyUnregisterFunctions = [];
  },
  methods: {
    ...mapMutations({
      commitCanvasWidth: "canvasWidth",
      commitCanvasHeight: "canvasHeight",
      commitCopyInfo: "copyInfo",
      commitSelectedFile: "selectedFile"
    }),
    ...mapActions({
      paste: "pasteComponent",
      showSnackbar: "showSnackbar"
    }),
    onCopy() {
      if (!this.selectedComponent) return;
      this.commitCopyInfo({ type: "copy", ID: this.selectedComponent.ID });
      this.showSnackbar({ message: "Component copied", timeout: 2000 });
    },
    onCut() {
      if (!this.selectedComponent) return;
      this.commitCopyInfo({ type: "cut", ID: this.selectedComponent.ID, parentID: this.selectedComponent.parent });
      this.showSnackbar({ message: "Component cut", timeout: 2000 });
    },
    onPaste() {
      let pos = { x: 0, y: 0 };

      //Calculate position only when pasting
      if (this.lastMouseEvent && this.$refs.canvasContainer) {
        const rect = this.$refs.canvasContainer.getBoundingClientRect();
        pos = {
          x: this.lastMouseEvent.clientX - rect.left,
          y: this.lastMouseEvent.clientY - rect.top
        };
      }

      this.paste({
        callback: ()=>{},
        pos: pos
      });
    },
    onBackgroundRightClick(event) {
      //Store event for position calculation
      this.lastMouseEvent = event;
    },
    onEscape() {
      //Clear copyInfo (copied/cut component)
      if (this.copyInfo) {
        this.commitCopyInfo(null);
      }
    },
    registerHotkeys() {
      const callback = (e)=>{
        const isCtrl = e.ctrlKey || e.metaKey;
        const key = e.key.toLowerCase();

        if (isCtrl && key === "c") {
          e.preventDefault();
          this.onCopy();
        } else if (isCtrl && key === "x") {
          e.preventDefault();
          this.onCut();
        } else if (isCtrl && key === "v") {
          e.preventDefault();
          this.onPaste();
        } else if (key === "escape") {
          e.preventDefault();
          this.onEscape();
        }
      };

      document.addEventListener("keydown", callback);

      //Store unregister function
      this.hotkeyUnregisterFunctions.push(()=>{
        document.removeEventListener("keydown", callback);
      });
    },
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
