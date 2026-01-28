// test/cypress/support/component.js
// import './commands'   // ← 一旦外す（E2E用の重依存を避ける）

import { mount } from 'cypress/vue'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import vuetify from '@/plugins/vuetify.js'          // ★ @ を使う（client/src/plugins/vuetify.js）
import { createMiniStore } from './mini-store'      // ★ 下で作る簡易ストア

export function cyMount (component, options = {}) {
  return mount(component, {
    global: {
      plugins: [createMiniStore(), vuetify],        // ★ mini-store + Vuetify
      ...(options.global || {}),
    },
    ...options,
  })
}

// 既存の 'cy.mount' を上書き（sanity 等が使えるように）
Cypress.Commands.add('mount', (comp, options) => cyMount(comp, options))