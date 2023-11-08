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
import { offsetRatio, boxHeightRatio} from "@/lib/constants.json"

export default {
  name: "Connector",
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
    boxHeight :{
      required: true,
      type: Number
    },
    color:{
      required: true,
      type: String
    }
  },
  computed:{
    control(){
      const offset = this.boxHeight * offsetRatio
      const scaledBoxHeight = this.boxHeight * boxHeightRatio
      const mx = (this.start.x + this.end.x)/2
      const my = (this.start.y + this.end.y)/2
      if(this.end.x < this.start.x){
        if (this.start.y - scaledBoxHeight < this.end.y && this.end.y < this.start.y + scaledBoxHeight) {
          return [
            {x:this.start.x + offset, y:this.start.y - offset},
            {x:this.end.x - offset, y:this.end.y - offset}
          ]
        } else {
          return [
            {x:this.start.x + offset, y: my},
            {x:this.end.x - offset, y: my}
          ]
        }
      } else {
        return [
          {x:mx, y:this.start.y},
          {x:mx, y:this.end.y}
        ]
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
