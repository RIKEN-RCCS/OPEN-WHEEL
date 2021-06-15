import Vue from "vue"
import VueRouter from "vue-router"
import Graph from "@/views/graph.vue"
import List from "@/views/taskList.vue"
import Editor from "@/views/rapid.vue"

Vue.use(VueRouter)

const routes = [
  {
    path: "/graph",
    name: "graph",
    component: Graph,
  },
  {
    path: "/list",
    name: "list",
    component: List,
  },
  {
    path: "/editor",
    name: "editor",
    component: Editor,
  },
]

const router = new VueRouter({
  mode: "history",
  routes,
})

export default router
