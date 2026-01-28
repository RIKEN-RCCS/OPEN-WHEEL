// open-wheel/test/cypress/component/_layout-smoke.cy.js
import { defineComponent, h } from 'vue'
import { mount as _mount } from 'cypress/vue'
import { VApp, VMain, VAppBar } from 'vuetify/components'
import vuetify from '@/plugins/vuetify.js'

describe('Vuetify layout smoke', () => {
  it('VApp 提供の layout を解決できる', () => {
    const Dumb = {
      name: 'Dumb',
      render() { return h('div', 'ok') },
    }

    const Wrap = defineComponent({
      name: 'Wrap',
      render() {
        return h(VApp, null, [
          h(VAppBar, { title: 'Title' }),
          h(VMain, null, [ h(Dumb) ]),
        ])
      },
    })

    _mount(Wrap, {
      global: { plugins: [vuetify] }, 
    })

    cy.get('.v-application').should('exist') 
    cy.contains('ok').should('exist')
  })
})
