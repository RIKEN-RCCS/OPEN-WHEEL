/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-navigation-drawer
    permanent
    mini-variant
  >
    <v-list
      id="iconlist"
      nav
    >
      <v-list-item
        v-for="item in librarys"
        :key="item.type"
      >
        <v-list-item-avatar
          :id="item.type"
          :color="item.color"
          tile
          draggable
          @dragstart.capture="onDragstart($event, item)"
          @dragover.prevent
          @dragenter.prevent
          @dragend="onDragend($event, item)"
        >
          <v-tooltip
            right
            :color="item.color"
          >
            <template #activator="{ on, attrs }">
              <img
                :src="item.img"
                :alt="item.type"
                v-bind="attrs"
                v-on="on"
              >
            </template>
            <span>{{ item.type }}</span>
          </v-tooltip>
        </v-list-item-avatar>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>
<script>
  import Debug from "debug";
  import { mapState, mapMutations, mapGetters } from "vuex";
  import { widthComponentLibrary, heightToolbar, heightDenseToolbar} from "@/lib/componentSizes.json";
  import SIO from "@/lib/socketIOWrapper.js";
  import loadComponentDefinition from "@/lib/componentDefinision.js";
  const componentDefinitionObj = loadComponentDefinition();
  const debug=Debug("wheel:workflow:componentLibrary");

  export default {
    name: "ComponentLibrary",
    data: ()=>{
      return {
        componentDefinitions: Object.keys(componentDefinitionObj).map((e)=>{
          return {
            type: e,
            ...componentDefinitionObj[e],
          };
        }),
        offsetX:null,
        offsetY:null
      };
    },
    computed: {
      ...mapState(["currentComponent", "canvasWidth", "canvasHeight", "projectRootDir"]),
      ...mapGetters(["currentComponentAbsPath" ]),
      isStepJob: function () {
        if (this.currentComponent === null) return false;
        return this.currentComponent.type === "stepjob";
      },
      librarys: function () {
        if (this.isStepJob) {
          return this.componentDefinitions.filter((e)=>{
            return e.type === "stepjobTask";
          });
        }
        return this.componentDefinitions.filter((e)=>{
          return ["task", "if", "for", "while", "foreach", "source", "storage", "viewer", "parameterStudy", "workflow", "stepjob", "bulkjobTask"].includes(e.type);
        });
      },
    },
    methods: {
      ...mapMutations({ commitComponentTree: "componentTree" }),
      onDragstart (event, item) {
        this.offsetX=event.offsetX
        this.offsetY=event.offsetY

        // set icon during drag
        const icon = this.$el.querySelector(`#${item.type}`);
        event.dataTransfer.setDragImage(icon, event.offsetX, event.offsetY);
        event.dataTransfer.effectAllowed = "move";
      },
      onDragend(event, item){
        const x = event.clientX - widthComponentLibrary - this.offsetX;
        const y = event.clientY - heightToolbar - heightDenseToolbar * 2 - this.offsetY;

        if ( x < 0 || x > this.canvasWidth || y < 0 || y > this.canvasHeight){
          debug("out of range ",x,y)
        }

        const payload = {
          type: item.type,
          pos: { x, y },
          path: this.currentComponentAbsPath,
        };
        if (payload.type === "parameterStudy") {
          payload.type = "PS";
        }
        SIO.emitGlobal("createNode", this.projectRootDir, payload, this.currentComponent.ID, SIO.generalCallback);
      }
    },
  };
</script>
<style scoped>
#iconlist {
  padding: 0;
}
</style>
