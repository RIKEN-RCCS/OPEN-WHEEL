import Vue from "vue";
import Workflow from "./components/Workflow.vue";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";
import VueClipboard from "vue-clipboard2";

Vue.config.productionTip = false;
Vue.use(VueClipboard);

new Vue({
  router,
  store,
  vuetify,
  render: function (h) { return h(Workflow); },
}).$mount("#app");


