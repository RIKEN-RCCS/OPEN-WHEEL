import ComponentProperty from '@/components/componentProperty.vue';
import SIO from '../../../../client/src/lib/socketIOWrapper.js';

describe('04:コンポーネントの基本機能動作確認', () => {
  const TYPE_INPUT = "input";
  const TYPE_OUTPUT = "output";
  const TAG_TYPE_INPUT = "input";
  const TAG_TYPE_TEXT_AREA = "textarea";

  beforeEach(() => {
    cy.viewport("macbook-16");
    cy.stub(SIO, 'emitGlobal')
      .callsFake((event, _root, _payload, maybeCbOrId, maybeCb) => {
        const cb = typeof maybeCbOrId === 'function' ? maybeCbOrId : maybeCb;
        if (event === 'getFileList' && typeof cb === 'function') cb([]);
      });
    cy.mount_comp(ComponentProperty, {
      storeOverrides: {
        state: {
          selectedComponent: {
            type: 'foreach',
          },
        }
      }
    });
  });

  /**
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  試験確認内容：name入力テキストエリアが表示されていることを確認
   */
  it("04-01-131:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-name入力テキストエリアが表示されていることを確認", () => {
    const DATA_CY_STR = "[data-cy=\"component_property-name-text_field\"]";
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /**
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  name入力
  試験確認内容：nameが入力できることを確認
   */
  it("04-01-132:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-name入力-nameが入力できることを確認", () => {
    const INPUT_OBJ_CY = "[data-cy=\"component_property-name-text_field\"]";
    cy.confirmInputValueReflection_comp(INPUT_OBJ_CY, "-Test_Task", TAG_TYPE_INPUT, "-Test_Task");
  });

  /**
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  name入力（使用可能文字確認）
  試験確認内容：nameが入力できないことを確認
   */
  it("04-01-133:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-name入力（使用可能文字確認）-nameが入力できないことを確認", () => {
    const INPUT_OBJ_CY = "[data-cy=\"component_property-name-text_field\"]";
    cy.confirmInputValueNotReflection_comp(INPUT_OBJ_CY, "Test*Task", TAG_TYPE_INPUT);
  });


  /**
   コンポーネントの基本機能動作確認
   foreachコンポーネント共通機能確認
   試験確認内容：説明入力テキストエリアが表示されていることを確認
    */
  it("04-01-134:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-description入力テキストエリアが表示されていることを確認", () => {
    const DATA_CY_STR = "[data-cy=\"component_property-description-textarea\"]";
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /**
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  description入力
  試験確認内容：descriptionが入力できることを確認
   */
  it("04-01-135:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-description入力-descriptionが入力できることを確認", () => {

    const INPUT_OBJ_CY = "[data-cy=\"component_property-description-textarea\"]";
    cy.confirmInputValueReflection_comp(INPUT_OBJ_CY, "descriptionTest", TAG_TYPE_TEXT_AREA);
  });

  /**
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  input files表示
  試験確認内容：input files入力テキストエリアが表示されていることを確認
   */
  it("04-01-136:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-input files表示-input files入力テキストエリアが表示されていることを確認", () => {
    const DATA_CY_STR = "[data-cy=\"component_property-input_files-list_form\"]";
    const CLICK_AREA_CY = "[data-cy=\"component_property-in_out_files-panel_title\"]";
    cy.confirmDisplayInPropertyByDetailsArea(DATA_CY_STR, CLICK_AREA_CY, null);
  });

  /**
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  input files入力
  試験確認内容：input filesが入力できることを確認
   */
  it("04-01-137:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-input files入力-input filesが入力できることを確認", () => {
    cy.enterInputOrOutputFile(TYPE_INPUT, "testInputFile", true, false);
    cy.get("[data-cy=\"component_property-input_files-list_form\"]").find("input")
      .should("have.value", "testInputFile");
  });


  /**
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  output files表示
  試験確認内容：output files入力テキストエリアが表示されていることを確認
   */
  it("04-01-139:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-output files表示-output files入力テキストエリアが表示されていることを確認", () => {

    const DATA_CY_STR = "[data-cy=\"component_property-output_files-list_form\"]";
    const CLICK_AREA_CY = "[data-cy=\"component_property-in_out_files-panel_title\"]";
    cy.confirmDisplayInPropertyByDetailsArea(DATA_CY_STR, CLICK_AREA_CY, null);
  });

  /**
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  output files入力
  試験確認内容：output filesが入力できることを確認
   */
  it("04-01-140:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-output files入力-output filesが入力できることを確認", () => {

    cy.enterInputOrOutputFile(TYPE_OUTPUT, "testOutputFile", true, false);
    cy.get("[data-cy=\"component_property-output_files-list_form\"]").find("input")
      .should("have.value", "testOutputFile");
  });

  /**
   コンポーネントの基本機能動作確認
   foreachコンポーネント共通機能確認
   転送対象ファイル・フォルダの設定
   削除ボタン表示確認（input file）
   試験確認内容：削除ボタンが表示されることを確認
    */
  it("04-01-151:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除ボタン表示確認（input file）-削除ボタンが表示されることを確認", () => {

    cy.enterInputOrOutputFile(TYPE_INPUT, "testInputFile", true, true);
    cy.get("[data-cy=\"action_row-delete-btn\"]").should("be.visible");
  });

  /**
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除ボタン表示確認（output file）
  試験確認内容：削除ボタンが表示されることを確認
   */
  it("04-01-152:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除ボタン表示確認（output file）-削除ボタンが表示されることを確認", () => {

    cy.enterInputOrOutputFile(TYPE_OUTPUT, "testOutputFile", true, true);
    cy.get("[data-cy=\"action_row-delete-btn\"]").should("be.visible");
  });

  /**
 コンポーネントの基本機能動作確認
 foreachコンポーネント共通機能確認
 各コンポーネント特有のプロパティ確認
 インデックス値テキストボックス表示確認
 試験確認内容：インデックス値テキストボックスが表示されていることを確認
  */
  it("04-01-164:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-プロパティ設定確認-インデックス値テキストボックス表示確認-インデックス値テキストボックスが表示されていることを確認", () => {

    cy.get("[data-cy=\"component_property-loop_set_foreach-panel_title\"]").click();
    cy.get("[data-cy=\"component_property-index_foreach-list_form\"]").should("be.visible");
  });

  /**
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  インデックス値テキストボックス入力確認
  試験確認内容：インデックス値テキストボックスが入力できることを確認
   */
  it("04-01-165:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-プロパティ設定確認-インデックス値テキストボックス入力確認-インデックス値テキストボックスが入力できることを確認", () => {

    cy.get("[data-cy=\"component_property-loop_set_foreach-panel_title\"]").click();
    cy.get("[data-cy=\"component_property-index_foreach-list_form\"]").find("input")
      .type(10);
    cy.get("[data-cy=\"component_property-index_foreach-list_form\"]").find("input")
      .should("have.value", 10);
  });

  /**
 コンポーネントの基本機能動作確認
 foreachコンポーネント共通機能確認
 各コンポーネント特有のプロパティ確認
 number of instances to keepテキストボックス表示確認
 試験確認内容：number of instances to keepテキストボックスが表示されていることを確認
  */
  it("04-01-167:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-プロパティ設定確認-keepテキストボックス表示確認-keepテキストボックスが表示されていることを確認", () => {

    cy.get("[data-cy=\"component_property-loop_set_foreach-panel_title\"]").click();
    cy.get("[data-cy=\"component_property-keep_foreach-text_field\"]").should("be.visible");
  });

  /**
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  number of instances to keepテキストボックス入力確認
  試験確認内容：number of instances to keepテキストボックスが入力できることを確認
   */
  it("04-01-168:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-プロパティ設定確認-keepテキストボックス入力確認-keepテキストボックスが入力できることを確認", () => {

    cy.get("[data-cy=\"component_property-loop_set_foreach-panel_title\"]").click();
    cy.get("[data-cy=\"component_property-keep_foreach-text_field\"]").find("input")
      .type(20);
    cy.get("[data-cy=\"component_property-keep_foreach-text_field\"]").find("input")
      .should("have.value", 20);
  });
});