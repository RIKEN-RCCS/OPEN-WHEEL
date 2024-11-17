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
        <v-menu location="end">
          <template v-slot:activator="{ props: menu }">
            <v-tooltip location="top">
              <template v-slot:activator="{ props: tooltip }">
                <v-btn
                  icon="mdi-cog"
                  v-bind="mergeProps(menu, tooltip)"
                />
              </template>
              <span>project settings</span>
            </v-tooltip>
          </template>
          <v-list>
            <v-list-item
              title="environment variables"
              @click="envDialog=true"
            />
            <v-list-item
              title="webhook"
              @click="webhookDialog=true"
            />
          </v-list>
        </v-menu>
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
  <env-setting-dialog v-model="envDialog" class='mb-16'/>
  <webhook-setting-dialog v-model="webhookDialog" class='mb-16'/>
</template>
<script>
import Debug from "debug";
import { mergeProps } from "vue";
import envSettingDialog from "../components/envSettingDialog.vue";
import webhookSettingDialog from "../components/webhookSettingDialog.vue";
import { mapState, mapMutations, mapGetters } from "vuex";
import { widthComponentLibrary, heightToolbar, heightDenseToolbar } from "../lib/componentSizes.json";
import SIO from "../lib/socketIOWrapper.js";
import loadComponentDefinition from "../lib/componentDefinision.js";
const componentDefinitionObj = loadComponentDefinition();
const debug = Debug("wheel:workflow:componentLibrary");

export default {
  name: "ComponentLibrary",
  components: {
    envSettingDialog,
    webhookSettingDialog
  },
  data: ()=>{
    return {
      componentDefinitions: Object.keys(componentDefinitionObj).map((e)=>{
        return {
          type: e,
          ...componentDefinitionObj[e]
        };
      }),
      offsetX: null,
      offsetY: null,
      widthComponentLibrary,
      envDialog: false,
      webhookDialog: false
    };
  },
  computed: {
    ...mapState(["currentComponent", "canvasWidth", "canvasHeight", "projectRootDir", "readOnly"]),
    ...mapGetters(["currentComponentAbsPath"]),
    isStepJob: function () {
      if (this.currentComponent === null) return false;
      return this.currentComponent.type === "stepjob";
    },
    isLoop: function () {
      if (this.currentComponent === null) return false;
      return ["for", "while", "foreach"].includes(this.currentComponent.type);
    },
    librarys: function () {
      if (this.isStepJob) {
        return this.componentDefinitions.filter((e)=>{
          return e.type === "stepjobTask";
        });
      }

      const componentTypes = this.isLoop
        ? ["task", "if", "for", "while", "foreach", "break", "continue", "source", "storage", "viewer", "parameterStudy", "workflow", "stepjob", "bulkjobTask"]
        : ["task", "if", "for", "while", "foreach", "source", "storage", "viewer", "parameterStudy", "workflow", "stepjob", "bulkjobTask"];
      return this.componentDefinitions.filter((e)=>{
        return componentTypes.includes(e.type);
      });
    }
  },
  methods: {
    mergeProps,
    ...mapMutations({ commitComponentTree: "componentTree" }),
    onDragstart(event, item) {
      this.offsetX = event.offsetX;
      this.offsetY = event.offsetY;

      //set icon during drag
      const target = this.$refs[item.type][0]._.subTree.el;
      event.dataTransfer.setDragImage(target, event.offsetX, event.offsetY);
      event.dataTransfer.effectAllowed = "move";
    },
    onDragend(event, item) {
      if (this.readOnly) {
        debug("new component can not be added current project status");
        return;
      }
      const x = event.clientX - widthComponentLibrary - this.offsetX;
      const y = event.clientY - heightToolbar - heightDenseToolbar * 2 - this.offsetY;
      if (x < 0 || x > this.canvasWidth || y < 0 || y > this.canvasHeight) {
        debug("out of range ", x, y);
        return;
      }

      const payload = {
        type: item.type,
        pos: { x, y },
        path: this.currentComponentAbsPath
      };
      if (payload.type === "parameterStudy") {
        payload.type = "PS";
      }
      SIO.emitGlobal("createNode", this.projectRootDir, payload, this.currentComponent.ID, SIO.generalCallback);
    }
  }
};
</script>
<style scoped>
#iconlist {
  padding: 0;
}
</style>
