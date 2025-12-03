<template>
  <VueZoomable
    v-model:zoom="currentZoom"
    v-model:pan="currentPan"
    :min-zoom="minZoom"
    :max-zoom="maxZoom"
    selector="#pannable-group"
    style="width: 100%; height: 100%;"
    :pan-enabled="!isComponentDragging"
    :enable-control-button="false"
  >
    <svg
      id="component-graph-svg"
      :width="canvasWidth"
      :height="canvasHeight"
    >
      <rect
        x="0"
        y="0"
        :width="canvasWidth"
        :height="canvasHeight"
        fill="black"
        @click="commitSelectedComponent(null);closeContextMenus();"
        @contextmenu.prevent="onBackgroundRightClick"
      />
      <g
        id="pannable-group"
      >
        <g v-if="currentComponent !== null">
          <vconnector
            v-for="item in linkGraph"
            :key="item.key"
            :color="item.color"
            :start="item.srcPos"
            :end="item.dstPos"
            @open-context-menu="(e)=>{onVconnectorRightClick(e, item)}"
          />
          <connector
            v-for="item in fileLinkGraph"
            :key="item.key"
            :color="item.color"
            :start="item.srcPos"
            :end="item.dstPos"
            :box-height="item.boxHeight"
            @open-context-menu="(e)=>{onConnectorRightClick(e, item)}"
          />
          <wheel-component
            v-for="(componentData, index) in currentComponent.descendants"
            :key="index"
            :component-data="componentData"
            :is-selected="selectedComponent !==null && componentData.ID === selectedComponent.ID"
            :is-invalid="componentData.isInvalid || false"
            :is-copied="copiedComponentID === componentData.ID"
            :is-cut="cutComponentID === componentData.ID"
            @drag="updatePosition(index, $event)"
            @dragend="commitNewPosition(index, $event)"
            @chdir="onChdir"
            @add-file-link="onAddFileLink"
            @remove-file-link="onRemoveFileLink"
            @add-link="onAddLink"
            @remove-link="onRemoveLink"
            @open-context-menu="(e)=>{onComponentRightClick(e, componentData, index)}"
            @drag-start="commitIsComponentDragging(true)"
            @drag-end="commitIsComponentDragging(false)"
          />
          <input-file-box
            v-for="(parentOutputFile ,index) in currentComponent.outputFiles"
            :key="index"
            :index="index"
            :center="parentOutputFilePos"
            :component-id="currentComponent.ID"
            :input-filename="parentOutputFile.name"
            @add-file-link="onAddFileLinkToParent"
            @remove-file-link="onRemoveFileLinkToParent"
          />
          <output-file-box
            v-for="(parentInputFile,index) in currentComponent.inputFiles"
            :key="index"
            :center="parentInputFilePos"
            :index="index"
            :component-id="currentComponent.ID"
            :output-filename="parentInputFile.name"
            :box-height="0"
          />
          <context-menu
            v-if="openComponentContextMenu"
            :x="menuX"
            :y="menuY"
            :items="componentContextMenuItems"
            @copy="copyComponent"
            @cut="cutComponent"
            @delete="deleteComponent"
            @clean="cleanComponent"
          />
          <context-menu
            v-if="openConnectorContextMenu"
            :x="menuX"
            :y="menuY"
            :items="connectorContextMenuItems"
            @delete="deleteConnector"
          />
          <context-menu
            v-if="openVconnectorContextMenu"
            :x="menuX"
            :y="menuY"
            :items="vconnectorContextMenuItems"
            @delete="deleteVconnector"
          />
          <context-menu
            v-if="openBackgroundContextMenu"
            :x="menuX"
            :y="menuY"
            :items="backgroundContextMenuItems"
            @paste="pasteComponent"
          />
        </g>
      </g>
    </svg>
  </VueZoomable>
  <div class="controls-container">
    <div class="pan-control">
      <button
        class="pan-btn pan-up"
        @click="pan('up')"
      >
        ▲
      </button>
      <button
        class="pan-btn pan-left"
        @click="pan('left')"
      >
        ◀
      </button>
      <button
        class="pan-btn pan-center"
        @click="resetPan"
      >
        ●
      </button>
      <button
        class="pan-btn pan-right"
        @click="pan('right')"
      >
        ▶
      </button>
      <button
        class="pan-btn pan-down"
        @click="pan('down')"
      >
        ▼
      </button>
    </div>
    <v-slider
      v-model.number="currentZoom"
      direction="vertical"
      :min="minZoom"
      :max="maxZoom"
      :step="zoomStep"
      show-ticks="always"
      thumb-label="always"
      thumb-size="16"
      track-fill-color="gray"
      track-color="white"
      track-size="10"
    />
  </div>
  <v-dialog
    v-model="deleteConfirmDialog"
    max-width="400px"
  >
    <v-card>
      <v-card-title>Confirm Delete</v-card-title>
      <v-card-text>
        Are you sure you want to delete component "{{ targetComponent?.name }}"?
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          text="Cancel"
          @click="deleteConfirmDialog = false"
        />
        <v-btn
          color="error"
          text="Delete"
          @click="confirmDeleteComponent"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
"use strict";
import { mapState, mapActions, mapMutations, mapGetters } from "vuex";
import SIO from "../../lib/socketIOWrapper.js";
import WheelComponent from "../../components/componentGraph/component.vue";
import InputFileBox from "../../components/componentGraph/inputFileBox.vue";
import OutputFileBox from "../../components/componentGraph/outputFileBox.vue";
import Vconnector from "../../components/componentGraph/vconnector.vue";
import Connector from "../../components/componentGraph/connector.vue";
import ContextMenu from "../../components/componentGraph/contextMenu.vue";
import VueZoomable from "vue-zoomable";
import "vue-zoomable/dist/style.css";
import { textHeight, boxWidth, plugColor, elsePlugColor, filePlugColor } from "../../lib/constants.json";
import { calcBoxHeight, calcRecieverPos, calcSenderPos, calcElseSenderPos, calcFsenderPos, calcFreceiverPos } from "../../lib/utils.js";
import { isContainer } from "../../lib/utility.js";
import Debug from "debug";
const debug = Debug("wheel:workflow:componentGraph");

export default {
  name: "ComponentGraph",
  components: {
    WheelComponent,
    InputFileBox,
    OutputFileBox,
    Vconnector,
    Connector,
    ContextMenu,
    VueZoomable
  },
  emits: [
    "component-right-click",
    "connector-right-click",
    "vconnector-right-click",
    "background-right-click"
  ],
  data() {
    return {
      menuX: 0,
      menuY: 0,
      openComponentContextMenu: false,
      openConnectorContextMenu: false,
      openVconnectorContextMenu: false,
      openBackgroundContextMenu: false,
      targetComponent: null,
      targetConnector: null,
      targetVconnector: null,
      connectorContextMenuItems: [
        { label: "delete", event: "delete" }
      ],
      vconnectorContextMenuItems: [
        { label: "delete", event: "delete" }
      ],
      backgroundContextMenuItems: [
        { label: "paste", event: "paste" }
      ],
      minZoom: 0.01,
      maxZoom: 3,
      zoomStep: 0.01,
      deleteConfirmDialog: false
    };
  },
  computed: {
    ...mapState(["currentComponent", "canvasWidth", "canvasHeight", "projectRootDir", "selectedComponent", "readOnly", "projectState", "isComponentDragging", "copyInfo"]),
    ...mapState({ currentZoomState: "currentZoom", currentPanState: "currentPan" }),
    ...mapGetters(["copiedComponentID", "cutComponentID"]),
    currentZoom: {
      get() {
        return this.currentZoomState;
      },
      set(value) {
        this.commitCurrentZoom(value);
      }
    },
    currentPan: {
      get() {
        return this.currentPanState;
      },
      set(value) {
        this.commitCurrentPan(value);
      }
    },
    componentContextMenuItems() {
      const rt = [];
      rt.push({ label: "copy", event: "copy" });
      rt.push({ label: "cut", event: "cut" });
      if (this.projectState !== "not-started") {
        rt.push({ label: "clean", event: "clean" });
      } else {
        rt.push({ label: "delete", event: "delete" });
      }
      return rt;
    },
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
  },
  methods: {
    panToShowAllComponent() {
      let minX = Infinity;
      let minY = Infinity;

      for (const component of this.currentComponent.descendants) {
        if (component.pos.x < minX) {
          minX = component.pos.x;
        }
        if (component.pos.y < minY) {
          minY = component.pos.y;
        }
      }
      minX -= boxWidth;
      minY -= textHeight;

      this.currentPan = {
        x: -minX,
        y: -minY
      };
    },
    resetPan() {
      this.currentZoom = 1.0;
      if (!this.currentComponent || this.currentComponent.descendants.length === 0) {
        this.currentPan = { x: 0, y: 0 };
        return;
      }
      this.panToShowAllComponent();
    },
    pan(direction) {
      const panAmount = 50;
      const { x, y } = this.currentPan;
      if (direction === "up") this.currentPan = { x, y: y + panAmount };
      if (direction === "down") this.currentPan = { x, y: y - panAmount };
      if (direction === "left") this.currentPan = { x: x + panAmount, y };
      if (direction === "right") this.currentPan = { x: x - panAmount, y };
    },
    zoomIn() {
      const newZoom = this.currentZoom + 0.2;
      if (newZoom <= 3) {
        this.currentZoom = newZoom;
      }
    },
    zoomOut() {
      const newZoom = this.currentZoom - 0.2;
      if (newZoom >= 0.5) {
        this.currentZoom = newZoom;
      }
    },
    cleanComponent() {
      SIO.emitGlobal("cleanComponent", this.projectRootDir, this.targetComponent.ID, SIO.generalCallback);
      this.closeContextMenus();
    },
    copyComponent() {
      if (this.targetComponent) {
        this.commitCopyInfo({ type: "copy", ID: this.targetComponent.ID });
        this.showSnackbar({ message: "Component copied", timeout: 2000 });
      }
      this.closeContextMenus();
    },
    cutComponent() {
      if (this.targetComponent) {
        this.commitCopyInfo({ type: "cut", ID: this.targetComponent.ID, parentID: this.targetComponent.parent });
        this.showSnackbar({ message: "Component cut", timeout: 2000 });
      }
      this.closeContextMenus();
    },
    deleteComponent() {
      if (this.readOnly) {
        debug("delete component called but this project is not read-only for now");
        this.closeContextMenus();
        return;
      }
      this.deleteConfirmDialog = true;
      this.closeContextMenus();
    },
    confirmDeleteComponent() {
      this.deleteConfirmDialog = false;
      SIO.emitGlobal("removeNode", this.projectRootDir, this.targetComponent.ID, this.currentComponent.ID, (rt)=>{
        if (!rt) {
          return;
        }
        this.commitSelectedComponent(null);
        //update componentTree
        SIO.emitGlobal("getComponentTree", this.projectRootDir, this.projectRootDir, SIO.generalCallback);
      });
    },
    deleteConnector() {
      if (this.readOnly) {
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
      if (this.readOnly) {
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
      //Get the pannable group element which has the transformations applied
      const pannableGroup = document.getElementById("pannable-group");
      const svg = document.getElementById("component-graph-svg");
      const pt = svg.createSVGPoint();
      pt.x = event.clientX;
      pt.y = event.clientY;

      //Transform screen coordinates to the pannable group's coordinate system
      const svgP = pt.matrixTransform(pannableGroup.getScreenCTM().inverse());

      this.menuX = svgP.x;
      this.menuY = svgP.y;

      if (label === "component") {
        this.openComponentContextMenu = true;
      } else if (label === "connector") {
        this.openConnectorContextMenu = true;
      } else if (label === "vconnector") {
        this.openVconnectorContextMenu = true;
      } else if (label === "background") {
        this.openBackgroundContextMenu = true;
      }
    },
    closeContextMenus() {
      this.openComponentContextMenu = false;
      this.openConnectorContextMenu = false;
      this.openVconnectorContextMenu = false;
      this.openBackgroundContextMenu = false;
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
    onBackgroundRightClick(event) {
      //Only show menu if there's something to paste
      if (!this.copyInfo) {
        return;
      }
      this.openContextMenu(event, "background");
      this.$emit("background-right-click", event);
    },
    pasteComponent() {
      //Get the position where the menu was opened
      const pos = { x: this.menuX, y: this.menuY };

      //Dispatch paste action through Vuex store
      this.$store.dispatch("pasteComponent", {
        callback: ()=>{},
        pos: pos
      });

      this.closeContextMenus();
    },
    ...mapActions({ commitSelectedComponent: "selectedComponent", showSnackbar: "showSnackbar" }),
    ...mapMutations({ commitIsComponentDragging: "isComponentDragging", commitCurrentZoom: "currentZoom", commitCurrentPan: "currentPan", commitCopyInfo: "copyInfo" }),
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
  }
};
</script>

<style scoped>
.controls-container {
  position: absolute;
  bottom: 55px;
  left: 75px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}
.pan-control {
  display: grid;
  grid-template-columns: 30px 30px 30px;
  grid-template-rows: 30px 30px 30px;
  grid-template-areas:
    ". up ."
    "left center right"
    ". down .";
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 5px;
  border: 1px solid #ccc;
}
.pan-btn {
  border: none;
  background: none;
  cursor: pointer;
  font-size: 1.2em;
}
.pan-up { grid-area: up; }
.pan-left { grid-area: left; }
.pan-center { grid-area: center; }
.pan-right { grid-area: right; }
.pan-down { grid-area: down; }

</style>
