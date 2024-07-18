/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import {createApp} from "vue";
import Login from "./components/Login.vue";
import vuetify from "./plugins/vuetify"

createApp(Login).use(vuetify)
  .mount("#app");
