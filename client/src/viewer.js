import Vue from "vue";
import Viewer from "./components/Viewer.vue";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  vuetify,
  render: function (h) { return h(Viewer); },
}).$mount("#app");

