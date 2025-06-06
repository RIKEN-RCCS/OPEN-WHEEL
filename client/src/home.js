/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import { createApp } from "vue";
import Home from "./components/Home.vue";
import vuetify from "./plugins/vuetify";
import store from "./store";

createApp(Home).use(vuetify)
  .use(store)
  .mount("#app");
