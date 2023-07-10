"use strict";

import { textHeight, boxWidth, iconSize } from "@/lib/constants.json"
import loadComponentDefinition from "@/lib/componentDefinision.js";
const componentDefinitionObj = loadComponentDefinition();

export function getComponentIcon(type, host, useJobScheduler){
  if(type === "task"){
    if (host === "localhost") {
      if (useJobScheduler === true) {
        return componentDefinitionObj["taskAndUsejobscheluler"].img
      }
    }else{
      if (useJobScheduler === true) {
        return componentDefinitionObj["remotetaskAndUsejobscheluler"].img
      } else {
        return componentDefinitionObj["remotetask"].img
      }
    }
  }
  return componentDefinitionObj[type].img
}
 export function getColor(type){
   return componentDefinitionObj[type].color
 }

export function calcFreceiverPos(componentCenter, index){
  return {x: componentCenter.x - boxWidth/2,
          y: componentCenter.y + textHeight*(index+1)}
}
export function calcFsenderPos(componentCenter, index){
  return {x: componentCenter.x + boxWidth/2 ,
          y: componentCenter.y + textHeight*(index+1)}
}

export function calcRecieverPos(componentCenter){
  const {x,y} = componentCenter
  return {x, y:y-textHeight/2}
}

export function calcSubgraphHeight(descendants){
  if(!Array.isArray(descendants)){
    return 0;
  }
  const maxY = descendants.reduce((a,c)=>{
    return  a > c.pos.y ? a: c.pos.y
  }, 0);
  const rt = maxY / 5 + iconSize * 1.5
  return rt
}
export function calcNumIOFiles(componentData){
  let longerLength=0;
  if(componentData.outputFiles){
    longerLength=componentData.outputFiles.length
  }
  if(componentData.inputFiles){
    longerLength = longerLength >= componentData.inputFiles.length ? longerLength : componentData.inputFiles.length
  }
  return longerLength
}

export function calcBoxHeight(componentData){
  const subGraphHeight=calcSubgraphHeight(componentData.descendants)
  const numIOFiles=calcNumIOFiles(componentData)
  return textHeight + numIOFiles*textHeight + subGraphHeight
}

export function calcSenderPos(componentData){
  const {x,y} = componentData.pos
  const xOffset = componentData.type === "if" ? - boxWidth/6: 0
  const boxHeight= calcBoxHeight(componentData);
  const yOffset = boxHeight-textHeight/2
  return {x: x + xOffset , y: y + yOffset}
}

export function calcElseSenderPos(componentData){
  const {x,y} = componentData.pos
  const boxHeight= calcBoxHeight(componentData);
  return {x: x+boxWidth/6, y: y+boxHeight-textHeight/2}
}
