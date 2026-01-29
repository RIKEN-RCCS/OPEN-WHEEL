import ComponentProperty from '@/components/componentProperty.vue'

describe('Smoke - Drawer & Script Autocomplete', () => {
  it('Drawer 可視化 → Basic 展開 → autocomplete が開く', () => {
    cy.mount(ComponentProperty, {
      // 必要なら storeOverrides で上書き可能
      storeOverrides: {
        state: {
          selectedComponent: {
            ID: 1, name: 'CompA', type: 'task',
            outputFiles: [], inputFiles: [], host: 'localhost',
            useJobScheduler: false, condition: null, retryCondition: null,
          },
          scriptCandidates: ['checkA', 'checkB', 'checkC'],
        }
      }
    })

    // 1) Drawer 可視（v-navigation-drawer）
    cy.get('[data-cy="component_property-property-navigation_drawer"]').should('be.visible')

    // 2) Basic パネル展開
    cy.get('[data-cy="component_property-basic-panel_title"]').click()

    // 3) v-autocomplete の input をクリック（本体ではなく input が安定）
    cy.get('[data-cy="component_property-script-autocomplete"] input')
      .scrollIntoView()
      .should('be.visible')
      .click()

    // 4) 候補が body 側のオーバーレイに表示される
    cy.contains('checkA').should('be.visible')
  })
})
