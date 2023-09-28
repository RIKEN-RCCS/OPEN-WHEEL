<template>
  <g >
    <rect :x=x :y=y :width=width :height=height :fill=componentBackgroundColor />
    <input-file-box
      :center=center
      :index=index
      :component-id=componentId
      :input-filename=inputFilename
      @addFileLink=onAddFileLink
      @removeFileLink=onRemoveFileLink
      v-if=hasInputFileBox />
    <output-file-box
      :center=center
      :index=index
      :box-height=boxHeight
      :component-id=componentId
      :output-filename=outputFilename
      v-if=hasOutputFileBox />
 </g>
</template>
<script>
"use strict";
import InputFileBox from "@/components/componentGraph/inputFileBox.vue"
import OutputFileBox from "@/components/componentGraph/outputFileBox.vue"
import { boxWidth, textHeight, componentBackgroundColor } from "@/lib/constants.json"

export default{
  name: "inputOutputFileBox",
  components:{
    InputFileBox,
    OutputFileBox,
  },
  props:{
    center:{
      required: true,
      type: Object
    },
    index:{
      required: true,
      type: Number
    },
    outputFilename:{
      type:String,
    },
    inputFilename:{
      type:String,
    },
    componentId:{
      required: true,
      type:String,
    },
    boxHeight:{
      required: true,
      type:Number
    }
  },
  data(){
    return {
      width: boxWidth,
      height: textHeight,
      componentBackgroundColor:componentBackgroundColor
    }
  },
  computed:{
    hasInputFileBox(){
      return typeof this.inputFilename !== "undefined"
    },
    hasOutputFileBox(){
      return typeof this.outputFilename !== "undefined"
    },
    x(){
      return this.center.x - boxWidth/2
    },
    y(){
      return this.center.y+ textHeight*(this.index+1) - textHeight/2
    }
  },
  methods:{
    onAddFileLink(srcNode, srcName, inputFilename){
      this.$emit("addFileLink", srcNode, srcName, inputFilename);
    },
    onRemoveFileLink(inputFilename){
      this.$emit("removeFileLink", inputFilename);
    }
  }
}
</script>
