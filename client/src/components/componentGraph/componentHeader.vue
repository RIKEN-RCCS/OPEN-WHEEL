<template>
  <g>
    <rect :x=x :y=y :width=width :height=height :fill=color

    :data-droparea=true @drop=onDrop
  />
  <text :x=x+height/1.2 font-size="90%" :y=center.y fill="white" text-anchor="start" v-if="stepnum !== null"> {{ stepnum }} </text>
    <image :href=iconImg :x=x :y=center.y-height/2 :width=height :height=height />
    <text-box :center=nameCenter :text=name :color=nameColor />
    <status-icon :x=statusIconX :y=center.y :state=state :num-total=numTotal :num-finished=numFinished :num-failed=numFailed />
 </g>
</template>
<script>
"use strict";
import TextBox from "@/components/componentGraph/textBox.vue"
import StatusIcon from "@/components/componentGraph/statusIcon.vue"
import { boxWidth, textHeight } from "@/lib/constants.json"
import {getComponentIcon, getColor} from "@/lib/utils.js"

export default{
  name: "component-header",
  components:{
    TextBox,
    StatusIcon
  },
  props:{
    center:{
      required: true,
      type: Object
    },
    name:{
      required: true,
      type: String
    },
    type:{
      required: true,
      type: String
    },
    state:{
      required: true,
      type: String
    },
    host:{
      type: String
    },
    useJobScheduler:{
      type: Boolean
    },
    numTotal:{
      type: Number
    },
    numFinished :{
      type: Number
    },
    numFailed :{
      type: Number
    },
    disable:{
      type: Boolean
    },
    stepnum:{
      type: [Number, null],
      default: null
    }
  },
  data(){
    return{
      width: boxWidth,
      height: textHeight
    }
  },
  computed:{
    x(){
      return this.center.x - boxWidth/2
    },
    y(){
      return this.center.y - textHeight/2
    },
    nameCenter(){
      return {x: this.x+textHeight, y: this.center.y}
    },
    nameColor(){
      return this.disable ? "red" : "white"
    },
    statusIconX(){
      return this.x + boxWidth - textHeight/2
    },
    iconImg(){
      return getComponentIcon(this.type, this.host, this.useJobScheduler)
    },
    color(){
      return getColor(this.type)
    }
  },
  methods:{
    onDrop(e){
      this.$emit("drop", e.detail)
    }
  }
}
</script>
