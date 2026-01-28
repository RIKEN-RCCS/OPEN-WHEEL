// test/cypress/component/componentProperty.smoke.cy.js
import { cyMount } from '../support/component'
import ComponentProperty from '@/components/componentProperty.vue'  // ★ @ = client/src

describe('componentProperty - Smoke', () => {
  it('見出しが表示される', () => {
    cyMount(ComponentProperty)
    cy.get('[data-cy="component_property-in_out_files-panel_title"]').should('exist')
    cy.get('[data-cy="component_property-files-panel_title"]').should('exist')
  })
})