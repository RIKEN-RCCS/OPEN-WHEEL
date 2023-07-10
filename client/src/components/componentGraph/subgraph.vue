<template>
  <g>
    <rect :x=x :y=y :width=width :height=height :fill=componentBackgroundColor />
    <g v-for="item in descendants">
    <rect
      :x="x+(item.pos.x-minX)*xRatio"
      :y="y+(item.pos.y-minY)*yRatio"
      :width=iconSize
      :height=iconSize
      :fill=getIconColor(item.type)
    />
    <image
      :href="getComponentIcon(item.type, item.host, item.useJobScheduler)"
      :x="x+(item.pos.x-minX)*xRatio"
      :y="y+(item.pos.y-minY)*yRatio"
      :width=iconSize
      :height=iconSize
    />
  </g>

  </g>
</template>

<script>
  "use strict";
  import { boxWidth, textHeight, iconSize, componentBackgroundColor  } from "@/lib/constants.json"
  import { getComponentIcon, getColor, calcSubgraphHeight } from "@/lib/utils.js"
  export default{
    name: "sub-graph",
    props:{
      descendants:{
        required: true,
        type: Array
      },
      center:{
        required:true,
        type:Object
      },
      boxHeight:{
        required: true,
        type:Number
      }
    },
    data(){
      return {
        width: boxWidth,
        componentBackgroundColor: componentBackgroundColor,
        iconSize: iconSize
      }
    },
    computed:{
      xRatio(){
        return this.width/(this.maxX - this.minX + 6 * iconSize)
      },
      yRatio(){
        return this.height/(this.maxY - this.minY + 6 * iconSize)
      },
      minX(){
        return this.descendants.reduce((a,c)=>{
          return  a < c.pos.x ? a: c.pos.x
        }, 0);
      },
      minY(){
        return this.descendants.reduce((a,c)=>{
          return  a < c.pos.y ? a: c.pos.y
        }, 0);
      },
      maxX(){
        return this.descendants.reduce((a,c)=>{
          return  a > c.pos.x ? a: c.pos.x
        }, 0);
      },
      maxY(){
        return this.descendants.reduce((a,c)=>{
          return  a > c.pos.y ? a: c.pos.y
        }, 0);
      },
      height(){
        return calcSubgraphHeight(this.descendants)
      },
      x(){
        return this.center.x - boxWidth/2
      },
      y(){
        return this.center.y - textHeight/2 + this.boxHeight - this.height
      },
    },
    methods:{
      getComponentIcon(...args){
        return getComponentIcon(...args);
      },
      getIconColor(type){
        return getColor(type)
      }
    }
  }
</script>

