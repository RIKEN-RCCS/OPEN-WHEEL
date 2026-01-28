import ComponentProperty from '@/components/componentProperty.vue'

describe('componentProperty smoke', () => {
  it('最低限の props で描画できる', () => {
    cy.mount(ComponentProperty, {
      props: {
        selectedComponent: { name: 'nodeA', type: 'basic' }, 
        readOnly: false,
        rules: {
          isValidName: (v) => (!!v && String(v).trim().length > 0) || '必須',
        },
        isUniqueName: () => true, 
        onClose: cy.spy().as('close'), 
      },
    })

    cy.get('[data-cy="component_property-name-text_field"] input')
      .should('have.value', 'nodeA')
  })
})
