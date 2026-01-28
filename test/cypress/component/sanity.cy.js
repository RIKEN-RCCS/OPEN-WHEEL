// test/cypress/component/sanity.cy.js
import { mount } from 'cypress/vue'
import { h } from 'vue'
it('sanity', () => {
  mount({ render: () => h('div', 'ok') })
  cy.contains('ok')
})