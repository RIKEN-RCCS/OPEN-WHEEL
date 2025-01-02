<template>
  <path
    :d="cmd"
    :stroke="strokeColor"
    :stroke-width="width"
    fill="transparent"
  />
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
    }
  },
  computed: {
    cmd() {
      return `M ${this.start.x},${this.start.y}
        C ${this.control1.x},${this.control1.y}
          ${this.control2.x},${this.control2.y}
          ${this.end.x},${this.end.y}
        `;
    }
  }
};
</script>
