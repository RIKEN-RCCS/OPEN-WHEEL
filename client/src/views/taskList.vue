/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <my-treeview
    ref="tree"
    :items="list"
    :open-all="true"
    item-key="ID"
  >
    <template #label="{ item }">
      <div v-if=" ! item.root ">
        <component-button
          :item="item"
        />
      </div>
      <div v-else>
        name
      </div>
    </template>
    <template #append="{ item }">
      <div
        v-if="item.root || !Array.isArray(item.children)"
        id="append"
      >
        <v-row
          no-gutters
          align="center"
        >
          <v-col
            v-for="prop in headers"
            :key="prop"
            :cols="prop === 'state'? 2: 5"
          >
            {{ item[prop] }}
          </v-col>
        </v-row>
      </div>
    </template>
  </my-treeview>
</template>
<script>
import { mapState } from "vuex";
import SIO from "../lib/socketIOWrapper.js";
import { taskStateList2Tree } from "../lib/taskStateList2Tree.js";
import componentButton from "../components/common/componentButton.vue";
import myTreeview from "../components/common/myTreeview.vue";

const headers = { state: "state", startTime: "startTime", endTime: "endTime" };

export default {
  name: "List",
  components: {
    componentButton,
    myTreeview
  },
  data: function () {
    return {
      taskStateTree: { children: [], root: true, ...headers, ID: "root" },
      headers: Object.keys(headers),
      firstTime: true
    };
  },
  computed: {
    list: function () {
      return [this.taskStateTree];
    },
    ...mapState([
      "projectRootDir"
    ])
  },
  mounted: function () {
    SIO.onGlobal("taskStateList", async (taskStateList)=>{
      let isChanged = false;
      if (taskStateList.length === 0) {
        this.taskStateTree = { children: [], root: true, ...headers, ID: "root" };
        isChanged = true;
      } else {
        isChanged = await taskStateList2Tree(taskStateList, this.taskStateTree);
      }
      if (this.$refs.tree && (this.firstTime || isChanged)) {
        this.firstTime = false;
        this.$refs.tree.updateAll(true);
      }
    });
    SIO.emitGlobal("getTaskStateList", this.projectRootDir, (rt)=>{
      console.log("getTaskStateList done", rt);
    });
  }
};
</script>
<style>
#append{
  width: 50vw;
}
</style>
