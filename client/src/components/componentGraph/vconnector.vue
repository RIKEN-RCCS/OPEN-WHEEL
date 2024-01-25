<template>
  <cubic-bezier-curve
    :stroke-color=color
    :width=2
    :start=start
    :end=end
    :control1=control[0]
    :control2=control[1]
    v-if="start.x !== end.x || start.y !== end.y"
    @click.right.prevent.stop="onRightclick"
  />
</template>
<script>
"use strict";
import CubicBezierCurve from "@/components/componentGraph/cubicBezierCurve.vue";
import {boxWidth, offsetRatio, boxWidthRatio } from "@/lib/constants.json"

export default {
  name: "Vconnector",
  components:{
    CubicBezierCurve
  },
  props:{
    start:{
      required: true,
      type: Object
    },
    end:{
      required: true,
      type: Object
    },
    color:{
      required: true,
      type: String
    }
  },
  computed:{
    control(){
      const offset=boxWidth * offsetRatio
      const scaledBoxWidth = boxWidth * boxWidthRatio
      const mx = (this.start.x + this.end.x)/2
      const my = (this.start.y + this.end.y)/2
      if(this.start.y < this.end.y){
        return [{x: this.start.x, y: my},
          {x: this.end.x, y: my}]
      }
      if (this.start.x - scaledBoxWidth < this.end.x && this.end.x < this.start.x + scaledBoxWidth) {
        if (this.start.x > this.end.x) {
          return [{x:this.start.x+offset, y: this.start.y + offset},
            {x:this.end.x+offset, y:this.end.y-offset}]
        } else {
          return [{x:this.start.x-offset, y: this.start.y + offset},
            {x:this.end.x-offset, y: this.end.y-offset}]
        }
      }else{
        return [{x: mx, y:this.start.y+offset},
          {x: mx, y:this.end.y-offset}]
      }
    }
  },
  methods:{
    onRightclick(e){
      this.$emit("openContextMenu", e);
    },
  }
}
</script>

