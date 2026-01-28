import './commands'
import { mount } from 'cypress/vue'
import vuetify from '../../../client/src/plugins/vuetify.js'
// 本番 store は一旦使わない：import store from '../../client/src/store/index.js'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createMiniStore } from './mini-store'

export function cyMount (component, options = {}) {
  return mount(component, {
    global: {
      plugins: [createMiniStore(), vuetify],
      ...(options.global || {}),
    },
    ...options,
  })
}

Cypress.Commands.add('mount', (comp, options) => cyMount(comp, options))