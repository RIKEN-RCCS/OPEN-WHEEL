<template>
    <text :x=x :y=y :fill=color :text-anchor="textAnchor" > {{ trancatedText }} </text>
</template>
<script>
"use strict";
import { textLengthLimit, textOffset, maxTextChar} from "@/lib/constants.json"

export default {
  name: "TextBox",
  props:{
    text: {
      required: true,
      type: String
    },
    center:{
      required: true,
      type: Object
    },
    color: {
      default: "white",
      type: String
    },
    textAnchor:{
      default: "start",
      type: String
    }
  },
  data(){
    return {
      width: textLengthLimit,
      xoffset: textOffset,
      yoffset: 0
    }
  },
  mounted(){
    this.calcYOffset()
  },
  methods:{
    calcYOffset(){
      //never re-calcuate y offset
      if(this.yoffset >0){
        return
      }
      if(! this.$el){
        return;
      }
      const {y, height}  = this.$el.getBBox()
      if(typeof y !== "number" || typeof height !== "number" || y <= 0 || height <= 0){
        return
      }
      this.yoffset = this.center.y - (y + height/2)
    }
  },
  computed:{
    trancatedText(){
      this.calcYOffset();

      if(this.text.length <= maxTextChar){
        return this.text
      }
      return `${this.text.slice(0,maxTextChar)}\u{22EF}` //22EF = MIDLINE HORIZONTAL ELLIPSIS
    },
    x(){
      if(this.textAnchor === "start"){
        return this.center.x + textOffset
      }
      if(this.textAnchor === "end"){
        return this.center.x - textOffset
      }
      return this.center.x
    },
    y(){
      this.calcYOffset();
      return this.center.y + this.yoffset
    }
  },
}
</script>
<style>
  text{
    -ms-user-select: none;
    -webkit-user-select: none;
    user-select: none;
  }
</style>

