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
          @dragstart.capture="onDragStart($event, item)"
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
  import { mapState, mapMutations } from "vuex";
  import loadComponentDefinition from "@/lib/componentDefinision.js";
  const componentDefinitionObj = loadComponentDefinition();

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
      };
    },
    computed: {
      ...mapState(["currentComponent", "canvasWidth", "canvasHeight", "projectRootDir"]),
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
      onDragStart (event, item) {
        event.dataTransfer.setData("offsetX", event.offsetX);
        event.dataTransfer.setData("offsetY", event.offsetY);
        event.dataTransfer.setData("type", item.type);
        const icon = this.$el.querySelector(`#${item.type}`);
        event.dataTransfer.setDragImage(icon, event.offsetX, event.offsetY);
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.dropEffect = "move";
      },
    },
  };
</script>
<style scoped>
#iconlist {
  padding: 0;
}
</style>
