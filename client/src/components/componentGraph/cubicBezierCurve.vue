<template>
  <g
    @click.right.prevent.stop="onRightClick"
  >
    <!-- Invisible wider path for easier clicking -->
    <path
      :d="cmd"
      stroke="rgba(0,0,0,0.01)"
      stroke-width="50"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
      data-cy="cubic-bezier-path-hitbox"
    />
    <!-- Visible path with actual styling -->
    <path
      :d="cmd"
      :stroke="strokeColor"
      :stroke-width="width"
      :stroke-dasharray="strokeDasharray"
      fill="transparent"
      data-cy="cubic-bezier-path"
      pointer-events="none"
    />
  </g>
</template>
<script>
"use strict";
export default {
  name: "CubicBezierCurve",
  props: {
    start: {
      required: true,
      type: Object
    },
    control1: {
      required: true,
      type: Object
    },
    control2: {
      required: true,
      type: Object
    },
    end: {
      required: true,
      type: Object
    },
    strokeColor: {
      type: String,
      default: "none"
    },
    width: {
      type: [Number, String],
      default: "1px"
    },
    strokeDasharray: {
      type: String,
      default: ""
    }
  },
  emits: ["contextmenu"],
  computed: {
    cmd() {
      return `M ${this.start.x},${this.start.y}
        C ${this.control1.x},${this.control1.y}
          ${this.control2.x},${this.control2.y}
          ${this.end.x},${this.end.y}
        `;
    }
  },
  methods: {
    onRightClick(e) {
      this.$emit("contextmenu", e);
    }
  }
};
</script>
