/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import "@mdi/font/css/materialdesignicons.css";
import Vue from "vue";
import { createVuetify } from 'vuetify'


Vue.use(Vuetify);

export default createVuetify({
  theme: {
    dark: true,
  },
  icons: {
    iconfont: "mdi",
  },
});
