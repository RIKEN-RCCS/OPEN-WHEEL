import { mount } from 'cypress/vue'
import { h, defineComponent } from 'vue'

describe('mount check', () => {
  it('mounts simple component (render)', () => {
    mount(defineComponent({
      name: 'Hello',
      render() {
        return h('div', 'ok')
      },
    }))

    cy.contains('ok')
  })
})
