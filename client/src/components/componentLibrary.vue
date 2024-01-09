/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-navigation-drawer
    permanent
    :width=widthComponentLibrary
    class='pt-2'
  >
    <v-list
      id="iconlist"
      nav
    >
      <v-list-item>
        <env-setting-dialog class='mb-16'/>
      </v-list-item>
      <v-list-item
        v-for="item in librarys"
        :key="item.type"
        :id="item.type"
      >
        <v-tooltip location="end" >
          <template v-slot:activator="{ props }">
            <v-avatar
              v-bind=props
              :color="item.color"
              :image="item.img"
              :ref="item.type"
              rounded="0"
              draggable="!readOnly"
              @dragstart.capture="onDragstart($event, item)"
              @dragover.prevent
              @dragenter.prevent
              @dragend="onDragend($event, item)"
            />
          </template>
          <span>{{item.type}}</span>
        </v-tooltip>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>
<script>
import Debug from "debug";
import envSettingDialog from "@/components/envSettingDialog.vue"
import { mapState, mapMutations, mapGetters } from "vuex";
import { widthComponentLibrary, heightToolbar, heightDenseToolbar} from "@/lib/componentSizes.json";
import SIO from "@/lib/socketIOWrapper.js";
import loadComponentDefinition from "@/lib/componentDefinision.js";
const componentDefinitionObj = loadComponentDefinition();
const debug=Debug("wheel:workflow:componentLibrary");

export default {
  name: "ComponentLibrary",
  components:{
    envSettingDialog,
  },
  data: ()=>{
    return {
      componentDefinitions: Object.keys(componentDefinitionObj).map((e)=>{
        return {
          type: e,
          ...componentDefinitionObj[e],
        };
      }),
      offsetX:null,
      offsetY:null,
      widthComponentLibrary 
    };
  },
  computed: {
    ...mapState(["currentComponent", "canvasWidth", "canvasHeight", "projectRootDir", "readOnly"]),
    ...mapGetters(["currentComponentAbsPath", "isEdittable" ]),
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

      //set icon during drag
      const target=this.$refs[item.type][0]._.subTree.el
      event.dataTransfer.setDragImage(target, event.offsetX, event.offsetY);
      event.dataTransfer.effectAllowed = "move";
    },
    onDragend(event, item){
      if( !this.isEdittable ){
        debug("new component can not be added current project status")
        return
      }
      const x = event.clientX - widthComponentLibrary - this.offsetX;
      const y = event.clientY - heightToolbar - heightDenseToolbar * 2 - this.offsetY;

      if ( x < 0 || x > this.canvasWidth || y < 0 || y > this.canvasHeight){
        debug("out of range ",x,y)
        return
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
