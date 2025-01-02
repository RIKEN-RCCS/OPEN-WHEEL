<template>
  <g>
    <equilateral-triangle
      :color="color"
      :center="end"
      :size="size"
      direction="down"
      :draggable="true"
      @dragstart.stop="onDragStart"
      @drag="end=$event"
      @dragend="onDragEnd"
    />
    <equilateral-triangle
      v-if="dragging"
      :color="color"
      :center="start"
      :size="size"
      direction="down"
      :draggable="false"
    />
    <vconnector
      :color="color"
      :start="start"
      :end="end"
    />
  </g>
</template>
<script>
"use strict";
import EquilateralTriangle from "../../components/componentGraph/triangle.vue";
import Vconnector from "../../components/componentGraph/vconnector.vue";

import { plugColor, elsePlugColor, plugSize } from "../../lib/constants.json";

export default {
  name: "Sender",
  components: {
    EquilateralTriangle,
    Vconnector
  },
  props: {
    start: {
      required: true,
      type: Object
    },
    elsePlug: {
      type: Boolean,
      default: false
    },
    componentId: {
      required: true,
      type: String
    }
  },
  data() {
    return {
      color: this.elsePlug ? elsePlugColor : plugColor,
      end: { x: this.start.x, y: this.start.y },
      size: plugSize,
      dragging: false
    };
  },
  watch: {
    start(v) {
      if (this.dragging) {
        return;
      }
      this.end = v;
    }
  },
  methods: {
    onDragStart() {
      this.dragging = true;
    },
    onDragEnd(event) {
      this.dragging = false;
      this.end.x = this.start.x;
      this.end.y = this.start.y;
      const dropEvent = new CustomEvent("drop", { detail: {
        type: "sender",
        isElse: this.elsePlug,
        componentID: this.componentId
      } });
      const elements = document.elementsFromPoint(event.clientX, event.clientY);
      elements.forEach((element)=>{
        if (element.dataset.droparea) {
          element.dispatchEvent(dropEvent);
        }
      });
    }
  }
};

</script>
