<template>
  <polygon :points=points :fill=color :storoke=storokeColor :stroke-width=width :transform=rotation />
</template>
<script>
"use strict";
export default {
  name: "equilateral-triangle",
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
      type: Number
    },
    storokeColor: {
      type: String
    },
    direction: {
      type: String
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
  mounted() {
    if (!this.draggable) {
      return;
    }
    this.$el.addEventListener("mousedown", this.mouseDown);
    const svg = this.$el.closest("svg");
    svg.addEventListener("mousemove", this.mouseMove);
    svg.addEventListener("mouseup", this.mouseUp);
  },
  beforeDestroy() {
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
      if (!this.draggable) {
        return;
      }
      this.startX = e.screenX;
      this.startY = e.screenY;
      this.oldcenter.x = this.center.x;
      this.oldcenter.y = this.center.y;
      this.dragging = true;
      this.$emit("dragstart", e);
    },
    mouseMove(e) {
      if (!this.dragging) {
        return;
      }
      const x = this.oldcenter.x + e.screenX - this.startX;
      const y = this.oldcenter.y + e.screenY - this.startY;
      this.$emit("drag", { x, y });
    },
    mouseUp(e) {
      if (this.startX === null || this.startY === null || !this.dragging) {
        return;
      }
      if (e.screenX === this.startX && e.screenY === this.startY) {
        return;
      }
      this.startX = null;
      this.startY = null;
      this.dragging = false;
      this.$emit("dragend", e);
    }
  },
  data() {
    return {
      startX: null,
      startY: null,
      oldcenter: { x: null, y: null },
      dragging: false
    };
  },
  computed: {
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
  }

};
</script>
