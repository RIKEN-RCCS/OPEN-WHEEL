<template>
  <rect :x=x :y=y :width=width :height=height
    :fill=color
    stroke-width=12 stroke="transparent"
    :data-droparea=true
    @drop=onDrop
    @click.stop=onClick
    @mousedown.stop
  />
</template>
<script>
"use strict";
import { filePlugColor, socketLongSideLength, socketShortSideLength } from "../../lib/constants.json";

export default {
  name: "Freciever",
  data: ()=>{
    return {
      color: filePlugColor,
      width: socketShortSideLength,
      height: socketLongSideLength
    };
  },
  props: {
    center: {
      required: true,
      type: Object
    }
  },
  emits: [
    "drop",
    "click"
  ],
  computed: {
    x() {
      return this.center.x - this.width / 2;
    },
    y() {
      return this.center.y - this.height / 2;
    }
  },
  methods: {
    onDrop(e) {
      this.$emit("drop", e);
    },
    onClick(e) {
      this.$emit("click", e);
    }
  }
};
</script>
