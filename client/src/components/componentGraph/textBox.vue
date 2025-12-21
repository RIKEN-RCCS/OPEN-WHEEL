<template>
  <text
    :x="x"
    :y="y"
    :fill="color"
    :text-anchor="textAnchor"
    data-cy="text-title"
    style="pointer-events: all;"
    @mouseenter="showTooltip"
    @mousemove="updateTooltipPosition"
    @mouseleave="hideTooltip"
  >
    {{ trancatedText }}
  </text>
</template>
<script>
"use strict";
import { textLengthLimit, textOffset } from "../../lib/constants.json";

export default {
  name: "TextBox",
  props: {
    text: {
      required: true,
      type: String
    },
    center: {
      required: true,
      type: Object
    },
    color: {
      default: "white",
      type: String
    },
    textAnchor: {
      default: "start",
      type: String
    },
    textType: {
      type: String,
      default: "file"
    },
    truncateThreshold: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      width: textLengthLimit,
      xoffset: textOffset,
      yoffset: 0,
      tooltipVisible: false,
      tooltipX: 0,
      tooltipY: 0,
      tooltipElement: null
    };
  },
  computed: {
    trancatedText() {
      this.calcYOffset();
      if (this.text.length <= this.truncateThreshold) {
        return this.text;
      }
      return `${this.text.slice(0, this.truncateThreshold)}\u{22EF}`; //22EF = MIDLINE HORIZONTAL ELLIPSIS
    },
    x() {
      if (this.textAnchor === "start") {
        return this.center.x + textOffset;
      }
      if (this.textAnchor === "end") {
        return this.center.x - textOffset;
      }
      return this.center.x;
    },
    y() {
      this.calcYOffset();
      return this.center.y + this.yoffset;
    }
  },
  mounted() {
    this.calcYOffset();
  },
  methods: {
    calcYOffset() {
      //never re-calcuate y offset
      if (this.yoffset > 0) {
        return;
      }
      if (!this.$el) {
        return;
      }
      const { y, height } = this.$el.getBBox();
      if (typeof y !== "number" || typeof height !== "number" || y <= 0 || height <= 0) {
        return;
      }
      this.yoffset = this.center.y - (y + height / 2);
    },
    showTooltip(event) {
      if (this.text.length > this.truncateThreshold) {
        this.tooltipVisible = true;
        this.createTooltipElement(event);
      }
    },
    updateTooltipPosition(event) {
      if (this.text.length > this.truncateThreshold && this.tooltipElement) {
        const pannableGroup = document.getElementById('pannable-group');
        if (!pannableGroup) return;
        
        const svg = event.target.ownerSVGElement;
        const pt = svg.createSVGPoint();
        pt.x = event.clientX;
        pt.y = event.clientY;
        const svgP = pt.matrixTransform(pannableGroup.getScreenCTM().inverse());
        this.tooltipElement.setAttribute('x', svgP.x + 10);
        this.tooltipElement.setAttribute('y', svgP.y - 30);
      }
    },
    hideTooltip() {
      this.tooltipVisible = false;
      if (this.tooltipElement) {
        this.tooltipElement.remove();
        this.tooltipElement = null;
      }
    },
    createTooltipElement(event) {
      const pannableGroup = document.getElementById('pannable-group');
      if (!pannableGroup) return;
      
      // Remove existing tooltip if any
      if (this.tooltipElement) {
        this.tooltipElement.remove();
      }
      
      // Calculate position relative to the pannable group
      const svg = event.target.ownerSVGElement;
      const pt = svg.createSVGPoint();
      pt.x = event.clientX;
      pt.y = event.clientY;
      const svgP = pt.matrixTransform(pannableGroup.getScreenCTM().inverse());
      
      // Create foreignObject element
      const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
      foreignObject.setAttribute('x', svgP.x + 10);
      foreignObject.setAttribute('y', svgP.y - 30);
      foreignObject.setAttribute('width', '300');
      foreignObject.setAttribute('height', '100');
      foreignObject.setAttribute('style', 'pointer-events: none; overflow: visible;');
      
      // Create div inside foreignObject
      const div = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
      div.setAttribute('style', `
        background-color: rgba(0, 0, 0, 0.85);
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 14px;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      `);
      div.textContent = this.text;
      
      foreignObject.appendChild(div);
      pannableGroup.appendChild(foreignObject);
      
      this.tooltipElement = foreignObject;
    }
  }
};
</script>
<style>
  text{
    -ms-user-select: none;
    -webkit-user-select: none;
    user-select: none;
  }
</style>
