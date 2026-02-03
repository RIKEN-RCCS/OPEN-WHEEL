//***********************************************************
//This example support/component.js is processed and
//loaded automatically before your test files.
//
//This is a great place to put global configuration and
//behavior that modifies Cypress.
//
//You can change the location of this file or turn off
//automatically serving support files with the
//'supportFile' configuration option.
//
//You can read more here:
//https://on.cypress.io/configuration
//***********************************************************

//Import commands.js using ES2015 syntax:
import "./commands";

//Alternatively you can use CommonJS syntax:
//require('./commands')

import { mount } from "cypress/vue";

Cypress.Commands.add("mount", mount);

//Example use:
//cy.mount(MyComponent)

import "./commands-workFlow";
import "./component_test/commands-components";

import { defineComponent, h, onMounted } from "vue";
import { VApp, VMain } from "vuetify/components";

import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";

import vuetify from "@/plugins/vuetify.js";
import { createMiniStore } from "./mini-store";

export function mountComponentWithAppShell(Inner, options = {}) {
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

Cypress.Commands.add("mountComponentWithAppShell", (comp, options) => mountComponentWithAppShell(comp, options));