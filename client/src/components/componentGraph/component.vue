<template>
  <g
    @click.stop="onClick"
    @dblclick.stop="onDblclick"
    @click.right.prevent.stop="onRightclick"
  >
    <rect
      :x="componentPos.x-boxWidth/2-borderWidth"
      :y="componentPos.y-textHeight/2-borderWidth"
      :width="boxWidth + borderWidth*2"
      :height="boxHeight + borderWidth*2"
      fill="transparent"
      stroke="yellow"
      :stroke-width=borderWidth
      v-if=isSelected
    />
    <component-header
      :center=componentPos
      :name=componentData.name
      :disable=componentData.disable
      :type=componentData.type
      :host=componentData.host
      :use-job-scheduler=componentData.useJobScheduler
      :state=componentData.state
      :num-total=componentData.numTotal
      :num-finished=componentData.numFinished
      :num-failed=componentData.numFailed
      :stepnum=componentData.stepnum
      @drop=onDropToHeader
    />
    <input-output-file-box v-for="(item, i) in inputOutputFiles"
      :key=item.key
      :center=componentPos
      :index=i
      :box-height=boxHeight
      :output-filename=item.outputFileName
      :input-filename=item.inputFileName
      :component-id=componentData.ID
      @addFileLink=onAddFileLink
      @removeFileLink=onRemoveFileLink
    />
    <sub-graph :center=componentPos
      :box-height=boxHeight
      :descendants=componentData.descendants
      v-if=Array.isArray(componentData.descendants)
    />
    <reciever
      :center=recieverPos
      :component-id=componentData.ID
      @click.stop=onRemoveLink
      @drop.stop=onAddLink
      v-if=canHaveLink
    />
    <sender
      :start=senderPos
      :elsePlug=false
      :component-id=componentData.ID
      :key=senderKey
      v-if=canHaveLink
    />
    <sender
      :start=elseSenderPos
      :elsePlug=true
      :component-id=componentData.ID
      :key=elseSenderKey
      v-if='componentData.type === "if"'
    />
  </g>
</template>

<script>
"use strict";
import { mapActions } from "vuex";
import ComponentHeader from "@/components/componentGraph/componentHeader.vue"
import InputOutputFileBox from "@/components/componentGraph/inputOutputFileBox.vue"
import SubGraph from "@/components/componentGraph/subgraph.vue"
import Sender from "@/components/componentGraph/sender.vue"
import Reciever from "@/components/componentGraph/reciever.vue"
import { boxWidth, textHeight, borderWidth} from "@/lib/constants.json"
import { calcRecieverPos, calcNumIOFiles, calcBoxHeight, calcSenderPos, calcElseSenderPos } from "@/lib/utils.js"

export default{
  name: "wheel-component",
  components: {
    ComponentHeader,
    InputOutputFileBox,
    SubGraph,
    Sender,
    Reciever
  },
  props:{
    componentData:{
      required:true,
      type:Object
    },
    isSelected:{
      type: Boolean,
      default: false
    }
  },
  mounted(){
    this.$el.addEventListener("mousedown", this.mouseDown)
    const svg=this.$el.closest("svg")
    svg.addEventListener("mousemove", this.mouseMove)
    svg.addEventListener("mouseup", this.mouseUp)
  },
  beforeDestroy(){
    this.$el.removeEventListener("mousedown", this.mouseDown)
    const svg=this.$el.closest("svg")
    if(svg){
      svg.removeEventListener("mousemove", this.mouseMove)
      svg.removeEventListener("mouseup", this.mouseUp)
    }
  },
  data(){
    return {
      senderKey:-1,
      elseSenderKey:-2,
      startX: null,
      startY: null,
      oldcenter:{x:null, y:null},
      dragging: false,
      boxWidth,
      textHeight,
      borderWidth
    }
  },
  computed: {
    canHaveLink(){
      return this.componentData.type !== "source" && this.componentData.type !== "storage"
    },
    componentPos(){
      return this.componentData.pos
    },
    boxHeight(){
      return calcBoxHeight(this.componentData);
    },
    numIOFiles(){
      return calcNumIOFiles(this.componentData);
    },
    inputOutputFiles(){
      const rt = Array.from(Array(this.numIOFiles), (_,i)=>{return {
        key: i,
        inputFileName: this.componentData.inputFiles && this.componentData.inputFiles[i] ? this.componentData.inputFiles[i].name : undefined,
        outputFileName:this.componentData.outputFiles && this.componentData.outputFiles[i] ? this.componentData.outputFiles[i].name : undefined
      }})
      return rt
    },
    senderPos(){
      this.senderKey-=2
      return calcSenderPos(this.componentData);
    },
    elseSenderPos(){
      this.elseSenderKey-=2
      return calcElseSenderPos(this.componentData);
    },
    recieverPos(){
      return calcRecieverPos(this.componentPos)
    }
  },
  methods:{
    ...mapActions({commitSelectedComponent: "selectedComponent"}),
    mouseDown(e){
      this.startX=e.screenX
      this.startY=e.screenY
      this.oldcenter.x=this.componentPos.x
      this.oldcenter.y=this.componentPos.y
      this.dragging=true
    },
    mouseMove(e){
      if(! this.dragging){
        return
      }
      const dx = e.screenX - this.startX
      const dy = e.screenY - this.startY
      e.newX=this.oldcenter.x + dx
      e.newY=this.oldcenter.y + dy
      this.$emit("drag", e)
    },
    mouseUp(e){
      if(this.startX === null || this.startY === null || !this.dragging){
        return
      }
      if(e.screenX === this.startX && e.screenY === this.startY){
        this.dragging=false
        return
      }
      this.startX=null
      this.startY=null
      this.dragging=false
      this.$emit("dragend", e);
    },
    onAddFileLink( srcNode, srcName, inputFilename){
      this.$emit("addFileLink", srcNode, srcName, this.componentData.ID, inputFilename);
    },
    onRemoveFileLink(inputFilename){
      this.$emit("removeFileLink", this.componentData.ID, inputFilename, false);
    },
    onAddLink(e){
      this.$emit("addLink", e.detail.componentID, this.componentData.ID, e.detail.isElse)
    },
    onRemoveLink(){
      this.$emit("removeLink", this.componentData.ID, this.componentData.parent);
    },
    onDropToHeader(data){
      if(data.type === "fsender"){
        this.$emit("addFileLink", data.componentID, data.srcName, this.componentData.ID, data.srcName)
      }else if(data.type === "sender"){
        this.$emit("addLink", data.componentID, this.componentData.ID, data.isElse)
      }
    },
    onClick(){
      this.commitSelectedComponent(this.componentData);
    },
    onDblclick(){
      this.$emit("chdir", this.componentData.ID, this.componentData.type);
    },
    onRightclick(){
      //not implemented yet
      console.log("right clicked");
    }
  },
}

</script>
