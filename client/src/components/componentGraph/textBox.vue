<template>
    <text :x=x :y=y :fill=color :text-anchor="textAnchor" > {{ trancatedText }} </text>
</template>
<script>
  "use strict";
  import { textHeight,boxWidth, textLengthLimit, textOffset, maxTextChar} from "@/components/componentGraph/constants.json"

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
        yoffset: null
      }
    },
    mounted(){
          const bbox=this.$el.getBBox()
          this.yoffset=this.center.y - (bbox.y + bbox.height/2)
    },
    computed:{
      trancatedText(){
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

