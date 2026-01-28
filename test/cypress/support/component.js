import { mount } from 'cypress/vue'
import { defineComponent, h } from 'vue'
import { VApp, VMain } from 'vuetify/components'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

import vuetify from '@/plugins/vuetify.js'


import { createMiniStore } from './mini-store'

export function cyMount(Inner, options = {}) {
  const Wrapped = defineComponent({
    name: 'WrappedWithVApp',
    setup() {
      return () =>
       h('div', { id: 'app' }, [
          h(VApp, null, [
            h(VMain, null, [ h(Inner) ]),
          ]),
        ])
    },
  })

  return mount(Wrapped, {
    global: {
      plugins: [
        createMiniStore(), 
        vuetify,       
      ],
      ...(options.global || {}),
    },
    ...options,
  })
}

Cypress.Commands.add('mount', (comp, options) => cyMount(comp, options))