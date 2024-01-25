/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import { createRouter, createMemoryHistory } from "vue-router";
import Graph from  "../views/graph.vue";
import List from   "../views/taskList.vue";
import Editor from "../views/rapid.vue";

const routes = [
  {
    path: "/graph",
    name: "graph",
    component: Graph
  },
  {
    path: "/list",
    name: "list",
    component: List
  },
  {
    path: "/editor",
    name: "editor",
    component: Editor
  }
];

const router = createRouter({
  history: createMemoryHistory(),
  routes
});

export default router;
