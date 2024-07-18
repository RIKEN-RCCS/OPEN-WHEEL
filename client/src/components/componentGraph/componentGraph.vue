<template>
  <svg :width=canvasWidth :height=canvasHeight xxmlns="http://www.w3.org/2000/svg" fill=black>
    <rect x=0 y=0
      :width=canvasWidth :height=canvasHeight fill="black"
      @click.stop="commitSelectedComponent(null);closeContextMenus();"
    />
    <g v-if="currentComponent !== null" >
      <vconnector
        v-for="item in linkGraph"
        :color=item.color
        :start=item.srcPos
        :end=item.dstPos
        :key=item.key
        @openContextMenu="(e)=>{onVconnectorRightClick(e, item)}"
      />
      <connector
        v-for="item in fileLinkGraph"
        :color=item.color
        :start=item.srcPos
        :end=item.dstPos
        :key="item.key"
        :box-height=item.boxHeight
        @openContextMenu="(e)=>{onConnectorRightClick(e, item)}"
      />
      <wheel-component
        v-for="(componentData, index) in currentComponent.descendants"
        :component-data=componentData
        :is-selected="selectedComponent !==null && componentData.ID === selectedComponent.ID"
        :is-invalid="componentData.isInvalid || false"
        @drag="updatePosition(index, $event)"
        @dragend="commitNewPosition(index, $event)"
        @chdir=onChdir
        @addFileLink=onAddFileLink
        @removeFileLink=onRemoveFileLink
        @addLink=onAddLink
        @removeLink=onRemoveLink
        @openContextMenu="(e)=>{onComponentRightClick(e, componentData, index)}"
      />
      <input-file-box
        v-for="(parentOutputFile ,index) in currentComponent.outputFiles"
        :index=index
        :center="parentOutputFilePos"
        :component-id=currentComponent.ID
        :input-filename=parentOutputFile.name
        @addFileLink=onAddFileLinkToParent
        @removeFileLink=onRemoveFileLinkToParent
      />
      <output-file-box
        v-for="(parentInputFile,index) in currentComponent.inputFiles"
        :center="parentInputFilePos"
        :index=index
        :component-id=currentComponent.ID
        :output-filename=parentInputFile.name
        :box-height=0
      />
      <context-menu
        v-if="openComponentContextMenu"
        :x="menuX"
        :y="menuY"
        :items=componentContextMenuItems
        @delete=deleteComponent
      />
      <context-menu
        v-if="openConnectorContextMenu"
        :x="menuX"
        :y="menuY"
        :items=connectorContextMenuItems
        @delete=deleteConnector
      />
      <context-menu
        v-if="openVconnectorContextMenu"
        :x="menuX"
        :y="menuY"
        :items=vconnectorContextMenuItems
        @delete=deleteVconnector
      />
    </g>
  </svg>
</template>

<script>
"use strict";
import { mapState, mapActions } from "vuex";
import SIO from "../../lib/socketIOWrapper.js";
import WheelComponent from "../../components/componentGraph/component.vue";
import InputFileBox from "../../components/componentGraph/inputFileBox.vue";
import OutputFileBox from "../../components/componentGraph/outputFileBox.vue";
import Vconnector from "../../components/componentGraph/vconnector.vue";
import Connector from "../../components/componentGraph/connector.vue";
import ContextMenu from "../../components/componentGraph/contextMenu.vue";
import { textHeight, boxWidth, plugColor, elsePlugColor, filePlugColor } from "../../lib/constants.json";
import { calcBoxHeight, calcRecieverPos, calcSenderPos, calcElseSenderPos, calcFsenderPos, calcFreceiverPos } from "../../lib/utils.js";
import { isContainer } from "../../lib/utility.js";
import Debug from "debug";
const debug = Debug("wheel:workflow:componentGraph");

export default {
  name: "componentGraph",
  components: {
    WheelComponent,
    InputFileBox,
    OutputFileBox,
    Vconnector,
    Connector,
    ContextMenu
  },
  data() {
    return {
      menuX: 0,
      menuY: 0,
      openComponentContextMenu: false,
      openConnectorContextMenu: false,
      openVconnectorContextMenu: false,
      targetComponent: null,
      targetConnector: null,
      targetVconnector: null,
      componentContextMenuItems: [
        { label: "delete", event: "delete" }
      ],
      connectorContextMenuItems: [
        { label: "delete", event: "delete" }
      ],
      vconnectorContextMenuItems: [
        { label: "delete", event: "delete" }
      ]
    };
  },
  methods: {
    deleteComponent() {
      if (this.readOnly) {
        debug("delete component called but this project is not read-only for now");
        return;
      }
      SIO.emitGlobal("removeNode", this.projectRootDir, this.targetComponent.ID, this.currentComponent.ID, (rt)=>{
        if (!rt) {
          return;
        }
        this.commitSelectedComponent(null);
        //update componentTree
        SIO.emitGlobal("getComponentTree", this.projectRootDir, this.projectRootDir, SIO.generalCallback);
      });
      this.closeContextMenus();
    },
    deleteConnector() {
      console.log("deleteConnector called", this.targetConnector);
      if (!this.readOnly) {
        debug("delete link called but this project is read-only for now");
        return;
      }
      SIO.emitGlobal("removeFileLink",
        this.projectRootDir,
        this.targetConnector.src,
        this.targetConnector.srcName,
        this.targetConnector.dst,
        this.targetConnector.dstName,
        this.currentComponent.ID,
        (rt)=>{
          if (!rt) {
            debug("removeFileLink failed", rt);
          }
        });
      this.closeContextMenus();
    },
    deleteVconnector() {
      console.log("deleteVconnector called", this.targetVconnector);
      if (!this.readOnly) {
        debug("delete file link called but this project is read-only for now");
        return;
      }

      SIO.emitGlobal("removeLink",
        this.projectRootDir,
        this.targetVconnector.src,
        this.targetVconnector.dst,
        this.targetVconnector.isElse,
        this.currentComponent.ID,
        (rt)=>{
          if (!rt) {
            debug("removeLink failed", rt);
          }
        });
      this.closeContextMenus();
    },
    openContextMenu(event, label) {
      this.menuX = event.offsetX;
      this.menuY = event.offsetY;
      if (label === "component") {
        this.openComponentContextMenu = true;
      } else if (label === "connector") {
        this.openConnectorContextMenu = true;
      } else if (label === "vconnector") {
        this.openVconnectorContextMenu = true;
      }
    },
    closeContextMenus() {
      this.openComponentContextMenu = false;
      this.openConnectorContextMenu = false;
      this.openVconnectorContextMenu = false;
    },
    onComponentRightClick(event, component) {
      this.targetComponent = component;
      this.openContextMenu(event, "component");
    },
    onConnectorRightClick(event, item) {
      this.targetConnector = item;
      this.openContextMenu(event, "connector");
    },
    onVconnectorRightClick(event, item) {
      this.targetVconnector = item;
      this.openContextMenu(event, "vconnector");
    },
    ...mapActions({ commitSelectedComponent: "selectedComponent" }),
    updatePosition(index, event) {
      this.currentComponent.descendants[index].pos.x = event.newX;
      this.currentComponent.descendants[index].pos.y = event.newY;
    },
    commitNewPosition(index) {
      const ID = this.currentComponent.descendants[index].ID;
      const pos = this.currentComponent.descendants[index].pos;
      if (this.readOnly) {
        debug("component is moved but this project is read-only for now");
        return;
      }
      SIO.emitGlobal("updateComponentPos", this.projectRootDir, ID, pos, this.currentComponent.ID, SIO.generalCallback);
    },
    onChdir(componentID, componentType) {
      if (!isContainer(componentType)) {
        return;
      }
      SIO.emitGlobal("getWorkflow", this.projectRootDir, componentID, SIO.generalCallback);
    },
    onAddFileLinkToParent(srcNode, srcName, inputFilename) {
      this.onAddFileLink(srcNode, srcName, this.currentComponent.ID, inputFilename);
    },
    onRemoveFileLinkToParent(inputFilename) {
      this.onRemoveFileLink(this.currentComponent.ID, inputFilename, this.currentComponent.parent, true);
    },
    onAddFileLink(srcNode, srcName, dstNode, dstName) {
      if (this.readOnly) {
        debug("file link is added but this project is read-only for now");
        return;
      }
      SIO.emitGlobal("addFileLink", this.projectRootDir,
        srcNode, srcName, dstNode, dstName,
        this.currentComponent.ID, SIO.generalCallback);
    },
    onRemoveFileLink(componentId, inputFilename, fromChildren) {
      if (this.readOnly) {
        debug("file link is removed but this project is read-only for now");
        return;
      }
      SIO.emitGlobal("removeAllFileLink", this.projectRootDir,
        componentId, inputFilename, fromChildren,
        this.currentComponent.ID, SIO.generalCallback);
    },
    onAddLink(src, dst, isElse) {
      if (this.readOnly) {
        debug("link is added but this project is read-only for now");
        return;
      }
      SIO.emitGlobal("addLink", this.projectRootDir, src, dst, isElse,
        this.currentComponent.ID, SIO.generalCallback);
    },
    onRemoveLink(componentId) {
      if (this.readOnly) {
        debug("link is removed but this project is read-only for now");
        return;
      }
      SIO.emitGlobal("removeAllLink", this.projectRootDir,
        componentId, this.currentComponent.ID, SIO.generalCallback);
    }
  },
  computed: {
    ...mapState(["currentComponent", "canvasWidth", "canvasHeight", "projectRootDir", "selectedComponent", "readOnly"]),
    linkGraph() {
      const rt = [];
      if (this.currentComponent === null) {
        return rt;
      }
      for (const component of this.currentComponent.descendants) {
        if (Array.isArray(component.next)) {
          for (const next of component.next) {
            const nextComponent = this.currentComponent.descendants.find((e)=>{
              return e.ID === next;
            });
            if (nextComponent) {
              rt.push({
                src: component.ID,
                srcPos: calcSenderPos(component),
                dst: next,
                dstPos: calcRecieverPos(nextComponent.pos),
                color: plugColor,
                isElse: false,
                key: `${component.ID}${next}`
              });
            }
          }
        }
        if (Array.isArray(component.else)) {
          for (const next of component.else) {
            const nextComponent = this.currentComponent.descendants.find((e)=>{
              return e.ID === next;
            });
            if (nextComponent) {
              rt.push({
                src: component.ID,
                srcPos: calcElseSenderPos(component),
                dst: next,
                dstPos: calcRecieverPos(nextComponent.pos),
                color: elsePlugColor,
                isElse: true,
                key: `else${component.ID}${next}`
              });
            }
          }
        }
      }
      return rt;
    },
    fileLinkGraph() {
      const rt = [];
      if (this.currentComponent === null) {
        return rt;
      }
      for (const component of this.currentComponent.descendants) {
        const boxHeight = calcBoxHeight(component);
        if (Array.isArray(component.outputFiles)) {
          for (let srcIndex = 0; srcIndex < component.outputFiles.length; srcIndex++) {
            const outputFile = component.outputFiles[srcIndex];
            for (const dst of outputFile.dst) {
              const dstComponent = this.currentComponent.descendants.find((e)=>{
                return e.ID === dst.dstNode;
              });
              if (dstComponent) {
                const dstIndex = dstComponent.inputFiles.findIndex((inputFile)=>{
                  return dst.dstName === inputFile.name && inputFile.src.some((e)=>{
                    return e.srcNode === component.ID;
                  });
                });
                if (dstIndex !== -1) {
                  rt.push({
                    src: component.ID,
                    srcName: outputFile.name,
                    srcPos: calcFsenderPos(component.pos, srcIndex),
                    dst: dst.dstNode,
                    dstName: dst.dstName,
                    dstPos: calcFreceiverPos(dstComponent.pos, dstIndex),
                    color: filePlugColor,
                    key: `${component.ID}${srcIndex}${dst.dstNode}${dstIndex}`,
                    boxHeight
                  });
                }
              } else if (dst.dstNode === "parent" || dst.dstNode === this.currentComponent.ID) {
                //file link to parent level components
                const dstIndex = this.currentComponent.outputFiles.findIndex((parentOutputFile)=>{
                  if (!Array.isArray(parentOutputFile.origin)) {
                    return true;
                  }
                  return dst.dstName === parentOutputFile.name && parentOutputFile.origin.some((e)=>{
                    return e.srcNode === component.ID;
                  });
                });
                if (dstIndex !== -1) {
                  rt.push({
                    src: component.ID,
                    srcName: outputFile.name,
                    srcPos: calcFsenderPos(component.pos, srcIndex),
                    dst: dst.dstNode,
                    dstName: dst.dstName,
                    dstPos: calcFreceiverPos(this.parentOutputFilePos, dstIndex),
                    color: filePlugColor,
                    key: `${component.ID}${srcIndex}${dst.dstNode}${dstIndex}`,
                    boxHeight
                  });
                }
              }
            }
          }
        }
      }
      //file link from parent level components
      if (Array.isArray(this.currentComponent.inputFiles)) {
        for (let srcIndex = 0; srcIndex < this.currentComponent.inputFiles.length; srcIndex++) {
          if (Array.isArray(this.currentComponent.inputFiles[srcIndex].forwardTo)) {
            for (const dst of this.currentComponent.inputFiles[srcIndex].forwardTo) {
              const dstComponent = this.currentComponent.descendants.find((e)=>{
                return e.ID === dst.dstNode;
              });
              if (dstComponent) {
                const dstIndex = dstComponent.inputFiles.findIndex((inputFile)=>{
                  return dst.dstName === inputFile.name && inputFile.src.some((e)=>{
                    return e.srcNode === this.currentComponent.ID;
                  });
                });
                if (dstIndex !== -1) {
                  rt.push({
                    src: this.currentComponent.ID,
                    srcName: this.currentComponent.inputFiles[srcIndex].name,
                    srcPos: calcFsenderPos(this.parentInputFilePos, srcIndex),
                    dst: dst.dstNode,
                    dstName: dst.dstName,
                    dstPos: calcFreceiverPos(dstComponent.pos, dstIndex),
                    color: filePlugColor,
                    key: `${this.currentComponent.ID}${srcIndex}${dst.dstNode}${dstIndex}`,
                    boxHeight: 0
                  });
                }
              }
            }
          }
        }
      }
      return rt;
    },
    parentOutputFilePos() {
      const rt = { x: this.canvasWidth - boxWidth / 2,
        y: this.canvasHeight - (this.currentComponent.outputFiles.length + 2) * textHeight };
      return rt;
    },
    parentInputFilePos() {
      return { x: 56, y: textHeight };
    }
  }
};
</script>
