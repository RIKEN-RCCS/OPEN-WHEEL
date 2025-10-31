<template>
  <polygon
    :points="points"
    :fill="color"
    :storoke="storokeColor"
    :stroke-width="width"
    :transform="rotation"
  />
</template>
<script>
"use strict";
import { mapState } from "vuex";
import { startDrag, calcDrag } from "../../lib/dragUtils.js";

export default {
  name: "EquilateralTriangle",
  props: {
    center: {
      required: true,
      type: Object
    },
    color: {
      default: "red",
      type: String
    },
    size: {
      default: 8,
      type: Number
    },
    width: {
      type: [Number, String],
      default: "1px"
    },
    storokeColor: {
      type: String,
      default: "none"
    },
    direction: {
      type: String,
      default: "right"
    },
    draggable: {
      type: Boolean,
      default: false
    }
  },
  emits: [
    "dragstart",
    "drag",
    "dragend"
  ],
  data() {
    return {
      dragState: null
    };
  },
  computed: {
    ...mapState(["currentZoom"]),
    rotation() {
      if (this.direction === "left") {
        return `rotate(180 ${this.center.x} ${this.center.y})`;
      } else if (this.direction === "up") {
        return `rotate(270 ${this.center.x} ${this.center.y})`;
      } else if (this.direction === "down") {
        return `rotate(90 ${this.center.x} ${this.center.y})`;
      }
      return null;
    },
    points() {
      const Ax = this.center.x + 2 * this.size / 3;
      const Ay = this.center.y;

      const Bx = this.center.x - this.size / 3;
      const By = this.center.y + this.size / 2;

      const Cx = this.center.x - this.size / 3;
      const Cy = this.center.y - this.size / 2;
      return `${Ax},${Ay} ${Bx},${By} ${Cx},${Cy}`;
    }
  },
  mounted() {
    if (!this.draggable) {
      return;
    }
    this.$el.addEventListener("mousedown", this.mouseDown);
    const svg = this.$el.closest("svg");
    svg.addEventListener("mousemove", this.mouseMove);
    svg.addEventListener("mouseup", this.mouseUp);
  },
  beforeUnmount() {
    if (!this.draggable) {
      return;
    }
    this.$el.removeEventListener("mousedown", this.mouseDown);
    const svg = this.$el.closest("svg");
    if (svg) {
      svg.removeEventListener("mousemove", this.mouseMove);
      svg.removeEventListener("mouseup", this.mouseUp);
    }
  },
  methods: {
    mouseDown(e) {
      e.stopPropagation();
      if (!this.draggable) {
        return;
      }
      this.$emit("dragstart", e);
      this.dragState = startDrag(e, this.center);
    },
    mouseMove(e) {
      if (!this.dragState) return;
      const newPos = calcDrag(e, this.dragState);
      if (!newPos) return;
      this.$emit("drag", { x: newPos.newX, y: newPos.newY });
    },
    mouseUp(e) {
      if (!this.dragState) return;
      const isClick = e.screenX === this.dragState.startScreenX && e.screenY === this.dragState.startScreenY;
      if (!isClick) {
        this.$emit("dragend", e);
      }
      this.dragState = null;
    }
  }
};
</script>
