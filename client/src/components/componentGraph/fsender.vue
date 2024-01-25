<template>
  <g>
  <equilateral-triangle
    :color=color
    :center=end
    :size=size
    @update:center="end=$event"
    :draggable=true
    @dragstart.stop=onDragStart
    @dragend.stop=onDragEnd
  />
  <equilateral-triangle
    :color=color
    :center=start
    :size=size
    v-if=dragging
  />
  <connector
    :color=color
    :start=start
    :end=end
    :box-height=boxHeight
  />
</g>
</template>
<script>
"use strict";
import EquilateralTriangle from "@/components/componentGraph/triangle.vue";
import Connector from "@/components/componentGraph/connector.vue";
import {filePlugColor, plugSize } from "@/lib/constants.json"


export default {
  name: "Fsender",
  components:{
    EquilateralTriangle,
    Connector
  },
  props:{
    start:{
      required: true,
      type: Object
    },
    boxHeight :{
      type: Number,
      required: true
    },
    componentId:{
      required: true,
      type:String,
    },
    outputFilename:{
      required: true,
      type:String,
    }
  },
  data(){
    return {
      color: filePlugColor,
      end: {x: this.start.x ,y: this.start.y},
      dragging: false,
      size: plugSize
    }
  },
  watch:{
    start(e){
      this.end.x=e.x
      this.end.y=e.y
    }
  },
  methods:{
    onDragStart(){
      this.dragging=true
    },
    onDragEnd(event){
      this.dragging=false
      this.end.x=this.start.x
      this.end.y=this.start.y
      const dropEvent=new CustomEvent("drop", {detail:{
        type: "fsender",
        componentID: this.componentId,
        srcName: this.outputFilename
      }})
      const elements = document.elementsFromPoint(event.clientX, event.clientY)
      elements.forEach((element)=>{
        if(element.dataset.droparea){
          element.dispatchEvent(dropEvent)
        }
      });
    },
  }
}

</script>

