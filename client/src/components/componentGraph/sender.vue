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
      v-if="isComponentDragging"
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
import { mapMutations, mapState } from "vuex";

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
      isSenderDragging: false
    };
  },
  computed: {
    ...mapState(["isComponentDragging"])
  },
  watch: {
    start(v) {
      if (this.isSenderDragging) {
        return;
      }
      this.end = v;
    }
  },
  methods: {
    ...mapMutations({ commitIsComponentDragging: "isComponentDragging" }),
    onDragStart() {
      this.isSenderDragging = true;
      this.commitIsComponentDragging(true);
    },
    onDragEnd(event) {
      this.isSenderDragging = false;
      this.commitIsComponentDragging(false);
      this.end.x = this.start.x;
      this.end.y = this.start.y;
      const dropEvent = new CustomEvent("drop", { detail: {
        type: "sender",
        isElse: this.elsePlug,
        componentID: this.componentId
      } });
      const elements = document.elementsFromPoint(event.clientX, event.clientY);
      elements.forEach((element)=>{
        //Skip if the drop target belongs to the same component that's being dragged
        if (element.dataset.droparea) {
          //Check if this element belongs to the same component
          let currentEl = element;
          let belongsToSameComponent = false;
          while (currentEl && currentEl !== document.body) {
            if (currentEl.dataset && currentEl.dataset.componentId === this.componentId) {
              belongsToSameComponent = true;
              break;
            }
            currentEl = currentEl.parentElement;
          }
          if (!belongsToSameComponent) {
            element.dispatchEvent(dropEvent);
          }
        }
      });
    }
  }
};

</script>
