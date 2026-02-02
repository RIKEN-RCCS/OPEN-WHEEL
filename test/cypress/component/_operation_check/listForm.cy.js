
import { defineComponent, h, ref } from 'vue'
import ListForm from '../../../../client/src/components/common/listForm.vue'

describe('ListForm UI 操作', () => {
  it('入力 → 追加 → 表示 → 削除 ができる', () => {

    const items = ref([])
    const headers = [{ key: 'name', value: 'name', title: 'Name', sortable: false }]

    const Wrapper = defineComponent({
      setup() {
        const onAdd = (v) => {
          items.value.push(typeof v === 'string' ? v : v.name)
        }
        const onRemove = (_v, idx) => {
          items.value.splice(idx, 1)
        }

        return () =>
          h('div', { 'data-cy': 'index_foreach_wrapper' }, [
            h(ListForm, {
              items: items.value,
              stringItems: true,
              headers,
              onAdd,
              onRemove,
              readOnly: false,
              disabled: false
            })
          ])
      }
    })

    cy.mount(Wrapper)

    const WRAP = '[data-cy="index_foreach_wrapper"]'
    const INPUT = '[data-cy="list_form-add-text_field"] input'
    const ADD_BTN = '[data-cy="list_form-add-text_field"] .v-input__append i[role="button"]'
    const DELETE_BTN = '[data-cy="action_row-delete-btn"]'
    const ROW_BTN = '[data-cy="list_form_property-btn"]'
    const text = 'typeText'

    // 入力
    cy.get(INPUT).type(text)

    // 追加ボタン押下
    cy.get(ADD_BTN).click()

    // 行として表示される（button の text に typeText）
    cy.get(ROW_BTN).contains(text).should('exist')

    // 削除
    cy.get(DELETE_BTN).click()

    // typeText が消える
    cy.contains(WRAP, text).should('not.exist')
  })
})
