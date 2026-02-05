import ComponentProperty from "@/components/componentProperty.vue";
import SIO from "../../../../client/src/lib/socketIOWrapper.js";

describe("components", ()=>{
  const TAG_TYPE_OUTPUT = "output";
  const TAG_TYPE_INPUT = "input";
  const TAG_TYPE_TEXT_AREA = "textarea";
  const PANEL_INPUT_OUTPUT = "[data-cy=\"component_property-in_out_files-panel_title\"]";

  beforeEach(()=>{
    cy.viewport("macbook-16");
    cy.stub(SIO, "emitGlobal")
      .callsFake((event, _root, _payload, maybeCbOrId, maybeCb)=>{
        const cb = typeof maybeCbOrId === "function" ? maybeCbOrId : maybeCb;
        if (event === "getFileList" && typeof cb === "function") cb([]);
      });
    cy.mountComponentWithAppShell(ComponentProperty, {
      storeOverrides: {
        state: {
          selectedComponent: {
            ID: "comp-workflow-1",
            type: "workflow",
            name: "workflow0"
          }
        }
      }
    });
  });

  /**
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  試験確認内容：name入力テキストエリアが表示されていることを確認
   */
  it("name入力テキストエリアが表示されていることを確認", ()=>{
    const DATA_CY_STR = "[data-cy=\"component_property-name-text_field\"]";
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /**
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  name入力
  試験確認内容：nameが入力できることを確認
   */
  it("name入力-nameが入力できることを確認", ()=>{
    const INPUT_VAL = "-Test_Task";
    const INPUT_OBJ_CY = "[data-cy=\"component_property-name-text_field\"]";
    cy.confirmInputValueReflection_comp(INPUT_OBJ_CY, INPUT_VAL, TAG_TYPE_INPUT, INPUT_VAL);
  });

  /**
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  name入力（使用可能文字確認）
  試験確認内容：nameが入力できないことを確認
   */
  it("name入力（使用可能文字確認）-nameが入力できないことを確認", ()=>{
    const INPUT_VAL = "-Test*Task";
    const INPUT_OBJ_CY = "[data-cy=\"component_property-name-text_field\"]";
    cy.confirmInputValueNotReflection_comp(INPUT_OBJ_CY, INPUT_VAL, TAG_TYPE_INPUT);
  });

  /**
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  試験確認内容：説明入力テキストエリアが表示されていることを確認
   */
  it("description入力テキストエリアが表示されていることを確認", ()=>{
    const DATA_CY_STR = "[data-cy=\"component_property-description-textarea\"]";
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /**
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  description入力
  試験確認内容：descriptionが入力できることを確認
   */
  it("description入力-descriptionが入力できることを確認", ()=>{
    const INPUT_OBJ_CY = "[data-cy=\"component_property-description-textarea\"]";
    const INPUT_VAL = "descriptionTest";
    cy.confirmInputValueReflection_comp(INPUT_OBJ_CY, INPUT_VAL, TAG_TYPE_TEXT_AREA);
  });

  /**
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  input files表示
  試験確認内容：input files入力テキストエリアが表示されていることを確認
   */
  it("input files表示-input files入力テキストエリアが表示されていることを確認", ()=>{
    const DATA_CY_STR = "[data-cy=\"component_property-input_files-list_form\"]";
    cy.confirmDisplayInPropertyByDetailsArea(DATA_CY_STR, PANEL_INPUT_OUTPUT, null);
  });

  /**
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  input files入力
  試験確認内容：input filesが入力できることを確認
   */
  it("input files入力-input filesが入力できることを確認", ()=>{
    const DATA_CY_STR = "[data-cy=\"component_property-input_files-list_form\"]";
    const INPUT_VAL = "testInputFile";
    cy.enterInputOrOutputFile(TAG_TYPE_INPUT, INPUT_VAL, true, false);
    cy.get(DATA_CY_STR).find(TAG_TYPE_INPUT)
      .should("have.value", INPUT_VAL);
  });

  /**
コンポーネントの基本機能動作確認
Workflowコンポーネント共通機能確認
output files表示
試験確認内容：output files入力テキストエリアが表示されていることを確認
   */
  it("output files表示-output files入力テキストエリアが表示されていることを確認", ()=>{
    const DATA_CY_STR = "[data-cy=\"component_property-output_files-list_form\"]";
    cy.confirmDisplayInPropertyByDetailsArea(DATA_CY_STR, PANEL_INPUT_OUTPUT, null);
  });

  /**
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  output files入力
  試験確認内容：output filesが入力できることを確認
   */
  it("output files入力-output filesが入力できることを確認", ()=>{
    cy.enterInputOrOutputFile(TAG_TYPE_OUTPUT, "testOutputFile", true, false);
    cy.get("[data-cy=\"component_property-output_files-list_form\"]").find("input")
      .should("have.value", "testOutputFile");
  });

  /**
コンポーネントの基本機能動作確認
Workflowコンポーネント共通機能確認
転送対象ファイル・フォルダの設定
削除ボタン表示確認（input file）
試験確認内容：削除ボタンが表示されることを確認
   */
  it("転送対象ファイル・フォルダの設定-削除ボタン表示確認（input file）-削除ボタンが表示されることを確認", ()=>{
    cy.enterInputOrOutputFile(TAG_TYPE_INPUT, "testInputFile", true, true);
    cy.get("[data-cy=\"action_row-delete-btn\"]").should("be.visible");
  });

  /**
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除ボタン表示確認（output file）
  試験確認内容：削除ボタンが表示されることを確認
   */
  it("転送対象ファイル・フォルダの設定-削除ボタン表示確認（output file）-削除ボタンが表示されることを確認", ()=>{
    cy.enterInputOrOutputFile(TAG_TYPE_OUTPUT, "testOutputFile", true, true);
    cy.get("[data-cy=\"action_row-delete-btn\"]").should("be.visible");
  });
});
