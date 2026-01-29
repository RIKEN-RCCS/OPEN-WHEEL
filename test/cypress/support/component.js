import { mount } from 'cypress/vue'
import { defineComponent, h, onMounted } from 'vue'
import { VApp, VMain } from 'vuetify/components'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import vuetify from '@/plugins/vuetify.js'
import { createMiniStore } from './mini-store'

export function cyMount(Inner, options = {}) {
  const Wrapped = defineComponent({
    name: 'WrappedWithVApp',
    setup() {
      onMounted(() => {
        const style = document.createElement('style')
        style.innerHTML = `
          * { transition: none !important; animation: none !important; }
          #app { min-width: 1200px; min-height: 800px; }  /* Drawerが潰れないよう領域確保 */
          html, body { margin: 0; }
        `
        document.head.appendChild(style)
      })
      return () =>
        h('div', { id: 'app' }, [
          h(VApp, null, [
            h(VMain, null, [ h(Inner) ]),
          ]),
        ])
    },
  })

  return mount(Wrapped, {
    attachTo: document.body,
    global: {
      plugins: [
        createMiniStore(options.storeOverrides),
        vuetify,
      ],
      ...(options.global || {}),
    },
    ...options,
  })
}

Cypress.Commands.add('mount', (comp, options) => cyMount(comp, options))