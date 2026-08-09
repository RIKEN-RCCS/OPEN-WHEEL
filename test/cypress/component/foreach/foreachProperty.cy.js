import ComponentProperty from "@/components/componentProperty.vue";

describe("components", ()=>{
//コンポーネント内の各種入力要素の data-type 識別子。
  const TAG_TYPE_OUTPUT = "output"; //output file 用の <input> タイプ
  const TAG_TYPE_INPUT = "input"; //input file 用の <input> タイプ
  const TAG_TYPE_TEXT_AREA = "textarea"; //description 等の複数行入力対象

  //プロパティパネル内のセクションタイトル要素を指す data-cy。
  const PANEL_INPUT_OUTPUT = "[data-cy=\"component_property-in_out_files-panel_title\"]";

  beforeEach(()=>{
    //表示崩れ防止のため画面サイズを指定
    cy.viewport("macbook-16");
    //プロパティ部分の初期化で getFileList を呼ぶため、外部I/O依存を排除して固定値を返す
    cy.stubGlobalFileListEmpty();
    //プロパティ部分をマウントする。
    cy.mountComponentWithAppShell(ComponentProperty, {
      storeOverrides: {
        state: {
          selectedComponent: {
            ID: "comp-foreach-1",
            type: "foreach",
            name: "foreach0"
          }
        }
      }
    });
  });

  /**
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  試験確認内容：name入力テキストエリアが表示されていることを確認
   */
  it("name入力テキストエリアが表示されていることを確認", ()=>{
    const DATA_CY_STR = "[data-cy=\"component_property-name-text_field\"]";
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /**
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
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
  foreachコンポーネント共通機能確認
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
   foreachコンポーネント共通機能確認
   試験確認内容：説明入力テキストエリアが表示されていることを確認
   */
  it("description入力テキストエリアが表示されていることを確認", ()=>{
    const DATA_CY_STR = "[data-cy=\"component_property-description-textarea\"]";
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /**
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
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
  foreachコンポーネント共通機能確認
  input files表示
  試験確認内容：input files入力テキストエリアが表示されていることを確認
   */
  it("input files表示-input files入力テキストエリアが表示されていることを確認", ()=>{
    const DATA_CY_STR = "[data-cy=\"component_property-input_files-list_form\"]";
    cy.confirmDisplayInPropertyByDetailsArea(DATA_CY_STR, PANEL_INPUT_OUTPUT, null);
  });

  /**
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
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
  foreachコンポーネント共通機能確認
  output files表示
  試験確認内容：output files入力テキストエリアが表示されていることを確認
   */
  it("output files表示-output files入力テキストエリアが表示されていることを確認", ()=>{
    const DATA_CY_STR = "[data-cy=\"component_property-output_files-list_form\"]";
    cy.confirmDisplayInPropertyByDetailsArea(DATA_CY_STR, PANEL_INPUT_OUTPUT, null);
  });

  /**
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  output files入力
  試験確認内容：output filesが入力できることを確認
   */
  it("output files入力-output filesが入力できることを確認", ()=>{
    const DATA_CY_STR = "[data-cy=\"component_property-output_files-list_form\"]";
    const INPUT_VAL = "testOutputFile";
    cy.enterInputOrOutputFile(TAG_TYPE_OUTPUT, INPUT_VAL, true, false);
    cy.get(DATA_CY_STR).find(TAG_TYPE_INPUT)
      .should("have.value", INPUT_VAL);
  });

  /**
   コンポーネントの基本機能動作確認
   foreachコンポーネント共通機能確認
   転送対象ファイル・フォルダの設定
   削除ボタン表示確認（input file）
   試験確認内容：削除ボタンが表示されることを確認
   */
  it("転送対象ファイル・フォルダの設定-削除ボタン表示確認（input file）-削除ボタンが表示されることを確認", ()=>{
    const INPUT_VAL = "testInputFile";
    const DELETE_BTN = "[data-cy=\"action_row-delete-btn\"]";
    cy.enterInputOrOutputFile(TAG_TYPE_INPUT, INPUT_VAL, true, true);
    cy.get(DELETE_BTN).should("be.visible");
  });

  /**
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除ボタン表示確認（output file）
  試験確認内容：削除ボタンが表示されることを確認
   */
  it("転送対象ファイル・フォルダの設定-削除ボタン表示確認（output file）-削除ボタンが表示されることを確認", ()=>{
    const INPUT_VAL = "testOutputFile";
    const DELETE_BTN = "[data-cy=\"action_row-delete-btn\"]";
    cy.enterInputOrOutputFile(TAG_TYPE_OUTPUT, INPUT_VAL, true, true);
    cy.get(DELETE_BTN).should("be.visible");
  });

  /**
 コンポーネントの基本機能動作確認
 foreachコンポーネント共通機能確認
 各コンポーネント特有のプロパティ確認
 インデックス値テキストボックス表示確認
 試験確認内容：インデックス値テキストボックスが表示されていることを確認
   */
  it("プロパティ設定確認-インデックス値テキストボックス表示確認-インデックス値テキストボックスが表示されていることを確認", ()=>{
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
  it("プロパティ設定確認-インデックス値テキストボックス入力確認-インデックス値テキストボックスが入力できることを確認", ()=>{
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
  it("プロパティ設定確認-keepテキストボックス表示確認-keepテキストボックスが表示されていることを確認", ()=>{
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
  it("プロパティ設定確認-keepテキストボックス入力確認-keepテキストボックスが入力できることを確認", ()=>{
    const INPUT_OBJ_CY = "[data-cy=\"component_property-keep_foreach-text_field\"]";
    cy.get("[data-cy=\"component_property-loop_set_foreach-panel_title\"]").click();
    cy.get(INPUT_OBJ_CY).find("input")
      .type(20);
    cy.get(INPUT_OBJ_CY).find("input")
      .should("have.value", 20);
  });
});
