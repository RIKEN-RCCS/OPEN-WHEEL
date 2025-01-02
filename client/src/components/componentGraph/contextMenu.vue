<template>
  <g
    v-for="(menu, index) in items"
    :key="index"
  >
    <rect
      :x="x"
      :y="y+index*height"
      :width="width"
      :height="height"
      fill="white"
      :stroke-width="12"
      stroke="transparent"
      @click.stop="onClick(menu.event)"
    />
    <text
      :x="x"
      :y="y+index*height+height/2"
      fill="black"
      :text-anchor="start"
      @click.stop="onClick(menu.event)"
    >
      {{ menu.label }}
    </text>
  </g>
</template>
<script>
"use strict";

import { boxWidth, textHeight } from "../../lib/constants.json";
export default {
  name: "ContextMenu",
  props: {
    x: {
      required: true,
      type: Number
    },
    y: {
      required: true,
      type: Number
    },
    items: {
      required: true,
      type: Array
    }
  },
  data() {
    return {
      width: boxWidth * 0.5,
      height: textHeight
    };
  },
  methods: {
    onClick(e) {
      console.log("DEBUG: contextmenu onClick handler called", e);
      this.$emit(e);
    }
  }
};
</script>
