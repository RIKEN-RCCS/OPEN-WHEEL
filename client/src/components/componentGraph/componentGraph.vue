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
            @mousemove="(e)=>{onConnectorMouseMove(e, item)}"
            @mouseleave="onConnectorMouseLeave"
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
            @export="exportComponent"
            @delete="deleteComponent"
            @clean="cleanComponent"
          />
          <context-menu
            v-if="openConnectorContextMenu"
            :x="menuX"
            :y="menuY"
            :items="connectorContextMenuItems"
            @delete="deleteConnector"
            @toggle-force-copy="toggleForceCopy"
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
            @import="importComponent"
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
  <import-component-dialog
    v-model="openImportComponentDialog"
    :pos="importComponentPos"
    @imported="onComponentImported"
  />
  <Teleport to="body">
    <div
      v-if="connectorTooltip.show"
      class="connector-tooltip"
      :style="{ left: `${connectorTooltip.x}px`, top: `${connectorTooltip.y}px` }"
    >
      {{ connectorTooltip.label }}
    </div>
  </Teleport>
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
import ImportComponentDialog from "../../components/importComponentDialog.vue";
import VueZoomable from "vue-zoomable";
import "vue-zoomable/dist/style.css";
import { textHeight, boxWidth, plugColor, elsePlugColor, filePlugColor, fileLinkCopyColor, fileLinkRemoteSymlinkColor, fileLinkCrossBoundaryColor } from "../../lib/constants.json";
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
    ImportComponentDialog,
    VueZoomable
  },
  emits: [
    "component-right-click",
    "connector-right-click",
    "vconnector-right-click",
    "background-right-click",
    "component-imported"
  ],
  data() {
    return {
      connectorTooltip: {
        show: false,
        x: 0,
        y: 0,
        label: ""
      },
      menuX: 0,
      menuY: 0,
      openComponentContextMenu: false,
      openConnectorContextMenu: false,
      openVconnectorContextMenu: false,
      openBackgroundContextMenu: false,
      targetComponent: null,
      targetConnector: null,
      targetVconnector: null,
      vconnectorContextMenuItems: [
        { label: "delete", event: "delete" }
      ],
      minZoom: 0.01,
      maxZoom: 3,
      zoomStep: 0.01,
      deleteConfirmDialog: false,
      openImportComponentDialog: false,
      importComponentPos: null
    };
  },
  computed: {
    ...mapState(["currentComponent", "canvasWidth", "canvasHeight", "projectRootDir", "selectedComponent", "readOnly", "projectState", "isComponentDragging", "copyInfo", "remoteHost"]),
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
    connectorContextMenuItems() {
      const forceCopy = this.targetConnector?.forceCopy || false;
      return [
        { label: forceCopy ? "use symlink" : "use force copy", event: "toggle-force-copy" },
        { label: "delete", event: "delete" }
      ];
    },
    componentContextMenuItems() {
      const rt = [];
      rt.push({ label: "copy", event: "copy" });
      rt.push({ label: "cut", event: "cut" });
      rt.push({ label: "export", event: "export" });
      if (this.projectState !== "not-started") {
        rt.push({ label: "clean", event: "clean" });
      } else {
        rt.push({ label: "delete", event: "delete" });
      }
      return rt;
    },
    backgroundContextMenuItems() {
      const rt = [];
      //Only show paste if something is copied
      if (this.copyInfo) {
        rt.push({ label: "paste", event: "paste" });
      }
      //Always show import
      rt.push({ label: "import", event: "import" });
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
                  const forceCopy = dst.forceCopy || false;
                  rt.push({
                    src: component.ID,
                    srcName: outputFile.name,
                    srcPos: calcFsenderPos(component.pos, srcIndex),
                    dst: dst.dstNode,
                    dstName: dst.dstName,
                    dstPos: calcFreceiverPos(dstComponent.pos, dstIndex),
                    color: this.fileLinkColor(forceCopy, component.host, dstComponent.host),
                    label: this.fileLinkLabel(forceCopy, component.host, dstComponent.host),
                    key: `${component.ID}${srcIndex}${dst.dstNode}${dstIndex}`,
                    boxHeight,
                    forceCopy
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
                  const forceCopy = dst.forceCopy || false;
                  rt.push({
                    src: component.ID,
                    srcName: outputFile.name,
                    srcPos: calcFsenderPos(component.pos, srcIndex),
                    dst: dst.dstNode,
                    dstName: dst.dstName,
                    dstPos: calcFreceiverPos(this.parentOutputFilePos, dstIndex),
                    color: this.fileLinkColor(forceCopy, component.host, this.currentComponent.host),
                    label: this.fileLinkLabel(forceCopy, component.host, this.currentComponent.host),
                    key: `${component.ID}${srcIndex}${dst.dstNode}${dstIndex}`,
                    boxHeight,
                    forceCopy
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
                    color: this.fileLinkColor(false, this.currentComponent.host, dstComponent.host),
                    label: this.fileLinkLabel(false, this.currentComponent.host, dstComponent.host),
                    key: `${this.currentComponent.ID}${srcIndex}${dst.dstNode}${dstIndex}`,
                    boxHeight: 0,
                    forceCopy: false
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

    /**
     * Look up a remote host entry by component host name.
     * @param {string} hostName - component host value
     * @returns {object|null} host info object or null
     */
    getHostInfo(hostName) {
      if (!Array.isArray(this.remoteHost) || !hostName || hostName === "localhost") {
        return null;
      }
      return this.remoteHost.find((h)=>{
        return h.name === hostName;
      }) || null;
    },

    /**
     * Determine the color of a file link connector based on its transfer type.
     * @param {boolean} forceCopy - whether the link uses force copy
     * @param {string|undefined} srcHost - host of the source component
     * @param {string|undefined} dstHost - host of the destination component
     * @returns {string} hex color string
     */
    fileLinkColor(forceCopy, srcHost, dstHost) {
      const isRemote = (host)=>{
        return host && host !== "localhost";
      };
      if (!isRemote(dstHost)) {
        if (isRemote(srcHost)) {
          //src is remote, dst is local → cross-boundary (download)
          return fileLinkCrossBoundaryColor;
        }
        //both local → local symlink or local copy
        return forceCopy ? fileLinkCopyColor : filePlugColor;
      }
      //dst is remote — check if src and dst share storage
      if (srcHost === dstHost) {
        //same remote host → share storage → symlink on remote (or remote copy)
        return fileLinkRemoteSymlinkColor;
      }
      if (!isRemote(srcHost)) {
        //src is localhost: check sharedWithLocalhost on dst host
        const dstInfo = this.getHostInfo(dstHost);
        if (dstInfo && dstInfo.sharedWithLocalhost) {
          return fileLinkRemoteSymlinkColor;
        }
      } else {
        //both remote, different hosts: check sharedHost arrangement
        const srcInfo = this.getHostInfo(srcHost);
        const dstInfo = this.getHostInfo(dstHost);
        if (srcInfo && dstInfo && dstInfo.sharedHost === srcInfo.name) {
          return fileLinkRemoteSymlinkColor;
        }
      }
      //no shared storage → cross-boundary (upload, inter-remote transfer, or copy across boundary)
      return fileLinkCrossBoundaryColor;
    },

    /**
     * Determine the human-readable label of a file link based on its transfer type.
     * @param {boolean} forceCopy - whether the link uses force copy
     * @param {string|undefined} srcHost - host of the source component
     * @param {string|undefined} dstHost - host of the destination component
     * @returns {string} label string
     */
    fileLinkLabel(forceCopy, srcHost, dstHost) {
      const color = this.fileLinkColor(forceCopy, srcHost, dstHost);
      if (color === fileLinkCopyColor) {
        return "local copy: files are copied within the local filesystem";
      }
      if (color === fileLinkRemoteSymlinkColor) {
        return "remote symlink: files are linked on the shared remote storage";
      }
      if (color === fileLinkCrossBoundaryColor) {
        return "remote copy: files are transferred between different storage locations";
      }
      return "local symlink: files are linked within the local filesystem";
    },

    /**
     * Show the connector tooltip at the current mouse position.
     * @param {MouseEvent} event - the mousemove event
     * @param {object} item - the fileLinkGraph item being hovered
     */
    onConnectorMouseMove(event, item) {
      this.connectorTooltip.show = true;
      this.connectorTooltip.x = event.clientX + 14;
      this.connectorTooltip.y = event.clientY - 32;
      this.connectorTooltip.label = item.label;
    },

    /**
     * Hide the connector tooltip.
     */
    onConnectorMouseLeave() {
      this.connectorTooltip.show = false;
    },
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
    toggleForceCopy() {
      if (this.readOnly) {
        debug("toggle force copy called but this project is read-only for now");
        return;
      }
      const newForceCopy = !this.targetConnector.forceCopy;
      SIO.emitGlobal("toggleOutputFileForceCopy",
        this.projectRootDir,
        this.targetConnector.src,
        this.targetConnector.srcName,
        this.targetConnector.dst,
        this.targetConnector.dstName,
        newForceCopy,
        this.currentComponent.ID,
        (rt)=>{
          if (!rt) {
            debug("toggleOutputFileForceCopy failed", rt);
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
    exportComponent() {
      if (!this.targetComponent) {
        return;
      }

      const projectRootDir = this.projectRootDir;
      const componentID = this.targetComponent.ID;

      SIO.emitGlobal("exportComponent", projectRootDir, componentID, (result)=>{
        if (result instanceof Error) {
          this.showSnackbar({ message: `Export failed: ${result.message}`, timeout: 3000 });
        } else {
          //Trigger download
          window.open(result, "_blank");
          this.showSnackbar({ message: "Component exported successfully", timeout: 3000 });
        }
      });

      this.closeContextMenus();
    },
    importComponent() {
      //Save the menu position for placing the imported component
      this.importComponentPos = { x: this.menuX, y: this.menuY };
      this.closeContextMenus();
      this.openImportComponentDialog = true;
    },
    onComponentImported() {
      this.showSnackbar({ message: "Component import started", timeout: 2000 });
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
.connector-tooltip {
  position: fixed;
  pointer-events: none;
  z-index: 9999;
  background: rgba(40, 40, 50, 0.92);
  color: #e0e0e0;
  font-size: 0.85rem;
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  white-space: nowrap;
}

</style>
