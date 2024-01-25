<template>
  <g v-for='(menu, index) in items'>
    <rect :x=x :y=y+index*height
      @click.stop=onClick(menu.event)
      :width=width :height=height fill=white :stroke-width=12 stroke="transparent"
    />
    <text :x=x :y=y+index*height+height/2
      @click.stop=onClick(menu.event)
      fill=black :text-anchor="start" >
      {{ menu.label }}
    </text>
  </g>
</template>
<script>
"use strict";

import { boxWidth, textHeight } from "@/lib/constants.json"
export default{
  name:"context-menu",
  props:{
    x:{
      required:true,
      type: Number
    },
    y:{
      required:true,
      type: Number
    },
    items:{
      required:true,
      type: Array
    }
  },
  methods:{
    onClick(e){
      console.log("onClick",e);
      this.$emit(e)
    },
  },
  data(){
    return {
      width: boxWidth*0.5,
      height: textHeight
    }
  },
}
</script>
