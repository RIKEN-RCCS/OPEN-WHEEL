import "./commands";
import "./commands-workFlow";
import "./commands-components";

import { mount } from "cypress/vue";
import { defineComponent, h, onMounted } from "vue";
import { VApp, VMain } from "vuetify/components";

import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";

import vuetify from "@/plugins/vuetify.js";
import { createMiniStore } from "./mini-store";

export function cyMount(Inner, options = {}) {
  const Wrapped = defineComponent({
    name: "WrappedWithVApp",
    setup() {
      onMounted(() => {
        const style = document.createElement("style");
        style.innerHTML = `
          * { transition: none !important; animation: none !important; }
          #app { min-width: 1200px; min-height: 800px; }
          html, body { margin: 0; }
        `;
        document.head.appendChild(style);
      });

      return () =>
        h("div", { id: "app" }, [
          h(VApp, null, {
            default: () => h(VMain, null, { default: () => h(Inner) }),
          }),
        ]);
    },
  });

  const userGlobal = options.global ?? {};

  const basePlugins = [
    createMiniStore(options.storeOverrides),
    vuetify,
  ];
  const userPlugins = userGlobal.plugins ?? [];

  const mergedGlobal = {
    ...userGlobal,
    plugins: [...basePlugins, ...userPlugins],
    stubs: {
      ...(userGlobal.stubs ?? {}),
    },
  };

  const { global: _discard, ...restOptions } = options;

  return mount(Wrapped, {
    attachTo: document.body,
    ...restOptions,
    global: mergedGlobal,
  });
}

Cypress.Commands.add("mount", (comp, options) => cyMount(comp, options));