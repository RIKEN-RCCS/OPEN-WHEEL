<template>
  <div
    id="node_svg"
    @drop="onDrop($event)"
    @dragover.prevent
    @dragenter.prevent
  />
</template>

<script>
  import { mapState, mapMutations, mapGetters } from "vuex";
  import SVG from "svgjs/dist/svg.js";
  import "svg.draggable.js/dist/svg.draggable.js";
  import SIO from "@/lib/socketIOWrapper.js";
  import drawComponents from "@/lib/oldSVG/drawComponents.js";
  import { widthComponentLibrary, heightToolbar, heightDenseToolbar, heightFooter } from "@/lib/componentSizes.json";

  export default {
    name: "ComponentGraph",
    data: function () {
      return {
        svg: null,
      };
    },
    computed: {
      ...mapState(["projectState", "currentComponent", "projectRootDir"]),
      ...mapGetters(["currentComponentAbsPath"]),
    },
    watch: {
      currentComponent: function () {
        drawComponents(this.currentComponent,
                       this.svg,
                       this.projectState,
                       this.projectRootDir,
                       this.$store.commit.bind(this),
                       this.$store.dispatch.bind(this),
        );
      },
    },
    mounted: function () {
      this.svg = SVG("node_svg");
      this.fit();
      window.addEventListener("resize", this.fit.bind(this));
      drawComponents(this.currentComponent,
                     this.svg,
                     this.projectState,
                     this.$store.commit.bind(this),
                     this.$store.dispatch.bind(this),
      );
    },
    beforeDestroy: function () {
      window.removeEventListener("resize", this.fit.bind(this));
    },
    methods: {
      ...mapMutations(
        {
          commitComponentTree: "componentTree",
          commitCanvasWidth: "canvasWidth",
          commitCanvasHeight: "canvasHeight",
        }),
      onDrop (event) {
        const offsetX = event.dataTransfer.getData("offsetX");
        const offsetY = event.dataTransfer.getData("offsetY");
        const type = event.dataTransfer.getData("type");

        const payload = {
          type,
          pos: {
            x: event.clientX - widthComponentLibrary - offsetX,
            y: event.clientY - heightToolbar - heightDenseToolbar * 2 - offsetY,
          },
          path: this.currentComponentAbsPath,
        };
        if (payload.type === "parameterStudy") {
          payload.type = "PS";
        }
        // if (payload.pos.x < 0 || this.canvasWidth + widthComponentLibrary < payload.pos.x ||
        //   payload.pos.y < 0 || this.canvasHeight + heightToolbar + heightDenseToolbar * 2 < payload.pos.y) {
        //   console.log("DEUBG: out of range drop!", payload.pos);
        // }

        SIO.emitGlobal("createNode", this.projectRootDir, payload, SIO.generalCallback);
      },
      fit: function () {
        const magicNumber = 17;
        const baseWidth = window.innerWidth < this.$parent.$parent.$el.clientWidth ? window.innerWidth : this.$parent.$parent.$el.clientWidth;
        const width = baseWidth - widthComponentLibrary - 1;
        const height = window.innerHeight - heightToolbar - heightDenseToolbar * 2 - heightFooter - magicNumber;

        if (width > 0 && height > 0) {
          this.commitCanvasWidth(width);
          this.commitCanvasHeight(height);
          this.svg.size(width, height);
        }
      },
    },
  };
</script>
