/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import { createApp } from "vue";
import Workflow from "./components/Workflow.vue";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";

createApp(Workflow).use(vuetify)
  .use(store)
  .use(router)
  .mount("#app");
