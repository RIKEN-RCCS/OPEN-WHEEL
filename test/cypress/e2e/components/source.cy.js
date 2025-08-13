describe("04:コンポーネントの基本機能動作確認", ()=>{
  const PROJECT_NAME = `WHEEL_TEST_${Date.now().toString()}`;
  const PROJECT_DESCRIPTION = "TestDescription";
  const TYPE_DIR = "dir";
  const TYPE_FILE = "file";
  const DEF_COMPONENT_TASK = "task";
  const DEF_COMPONENT_SOURCE = "source";
  const TASK_NAME_0 = "task0";
  const SOURCE_NAME_0 = "source0";
  const TAG_TYPE_INPUT = "input";
  const TAG_TYPE_TEXT_AREA = "textarea";

  beforeEach(()=>{
    cy.viewport("macbook-16");
    return cy.createProject(PROJECT_NAME, PROJECT_DESCRIPTION)
      .projectOpen(PROJECT_NAME);
  });

  afterEach(()=>{
    return cy.removeAllProjects();
  });

  /**
  コンポーネントの基本機能動作確認
  Sourceコンポーネント共通機能確認
  試験確認内容：プロパティが表示されることを確認
   */
  it("04-01-310:コンポーネントの基本機能動作確認-Sourceコンポーネント共通機能確認-プロパティが表示されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_SOURCE, SOURCE_NAME_0, 300, 500);
    const DATA_CY_STR = "[data-cy=\"component_property-property-navigation_drawer\"]";
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /**
  コンポーネントの基本機能動作確認
  Sourceコンポーネント共通機能確認
  試験確認内容：name入力テキストエリアが表示されていることを確認
   */
  it("04-01-311:コンポーネントの基本機能動作確認-Sourceコンポーネント共通機能確認-name入力テキストエリアが表示されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_SOURCE, SOURCE_NAME_0, 300, 500);
    const DATA_CY_STR = "[data-cy=\"component_property-name-text_field\"]";
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /**
  コンポーネントの基本機能動作確認
  Sourceコンポーネント共通機能確認
  name入力
  試験確認内容：nameが入力できることを確認
   */
  it("04-01-312:コンポーネントの基本機能動作確認-Sourceコンポーネント共通機能確認-name入力-nameが入力できることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_SOURCE, SOURCE_NAME_0, 300, 500);
    const INPUT_OBJ_CY = "[data-cy=\"component_property-name-text_field\"]";
    cy.confirmInputValueReflection(INPUT_OBJ_CY, "-Test_Task", TAG_TYPE_INPUT, "-Test_Task");
  });

  /**
  コンポーネントの基本機能動作確認
  Sourceコンポーネント共通機能確認
  name入力（使用可能文字確認）
  試験確認内容：nameが入力できないことを確認
   */
  it("04-01-313:コンポーネントの基本機能動作確認-Sourceコンポーネント共通機能確認-name入力（使用可能文字確認）-nameが入力できないことを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_SOURCE, SOURCE_NAME_0, 300, 500);
    const INPUT_OBJ_CY = "[data-cy=\"component_property-name-text_field\"]";
    cy.confirmInputValueNotReflection(INPUT_OBJ_CY, "Test*Task", TAG_TYPE_INPUT, SOURCE_NAME_0);
  });

  /**
  コンポーネントの基本機能動作確認
  Sourceコンポーネント共通機能確認
  試験確認内容：説明入力テキストエリアが表示されていることを確認
   */
  it("04-01-314:コンポーネントの基本機能動作確認-Sourceコンポーネント共通機能確認-description入力テキストエリアが表示されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_SOURCE, SOURCE_NAME_0, 300, 500);
    const DATA_CY_STR = "[data-cy=\"component_property-description-textarea\"]";
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /**
  コンポーネントの基本機能動作確認
  Sourceコンポーネント共通機能確認
  description入力
  試験確認内容：descriptionが入力できることを確認
   */
  it("04-01-315:コンポーネントの基本機能動作確認-Sourceコンポーネント共通機能確認-description入力-descriptionが入力できることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_SOURCE, SOURCE_NAME_0, 300, 500);
    const INPUT_OBJ_CY = "[data-cy=\"component_property-description-textarea\"]";
    cy.confirmInputValueReflection(INPUT_OBJ_CY, "descriptionTest", TAG_TYPE_TEXT_AREA, SOURCE_NAME_0);
  });

  /**
  コンポーネントの基本機能動作確認
  Sourceコンポーネント共通機能確認
  構成要素の機能確認
  closeボタン押下
  試験確認内容：プロパティが表示されていないことを確認
   */
  it("04-01-316:コンポーネントの基本機能動作確認-Sourceコンポーネント共通機能確認-構成要素の機能確認-closeボタン押下-プロパティが表示されていないことを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_SOURCE, SOURCE_NAME_0, 300, 500);
    cy.closeProperty();
    cy.get("[data-cy=\"component_property-property-navigation_drawer\"]").should("not.exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Sourceコンポーネント共通機能確認
  構成要素の機能確認
  cleanボタン押下
  試験確認内容：最新の保存状態に戻っていることを確認
  skip:issue#948
   */
  it.skip("04-01-317:コンポーネントの基本機能動作確認-Sourceコンポーネント共通機能確認-構成要素の機能確認-cleanボタン押下-最新の保存状態に戻っていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_SOURCE, SOURCE_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, "test-a", true);
    cy.get("[data-cy=\"component_property-loop_set_for-panel_title\"]").click();
    cy.get("[data-cy=\"component_property-start_for-text_field\"]").type("1");
    cy.get("[data-cy=\"component_property-end_for-text_field\"]").type("5");
    cy.get("[data-cy=\"component_property-step_for-text_field\"]").type("5");
    cy.get("[data-cy=\"workflow-play-btn\"]").click();
    cy.clickComponentName(SOURCE_NAME_0);
    cy.get("[data-cy=\"component_property-name-text_field\"]").find("input")
      .clear();
    cy.get("[data-cy=\"component_property-name-text_field\"]").type("changeName");
    cy.get("[data-cy=\"component_property-description-textarea\"]").find("textarea")
      .focus();
    cy.get("[data-cy=\"component_property-clean-btn\"]").click();
    cy.get("[data-cy=\"component_property-name-text_field\"]").find("input")
      .should("have.value", "test-a");
  });

  /**
  コンポーネントの基本機能動作確認
  Sourceコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  接続確認
  試験確認内容：コンポーネントが接続されていることを確認
   */
  it("04-01-318:コンポーネントの基本機能動作確認-Storageコンポーネント共通機能確認-ファイル転送設定の各パターンの確認-接続確認-コンポーネントが接続されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_SOURCE, SOURCE_NAME_0, 300, 500);
    cy.get("[data-cy=\"component_property-upload_setting-panel_title\"]").click();
    cy.createDirOrFile(TYPE_FILE, "test-a", true);
    let targetDropBoxCy = "[data-cy=\"component_property-source_file_name-autocomplete\"]";
    cy.selectValueFromDropdownList(targetDropBoxCy, 3, "test-a");
    cy.createComponent(DEF_COMPONENT_TASK, TASK_NAME_0, 300, 600);
    cy.connectComponent(TASK_NAME_0); //コンポーネント同士を接続
    cy.checkConnectionLine(SOURCE_NAME_0, TASK_NAME_0); //作成したコンポーネントの座標を取得して接続線の座標と比較
  });

  /**
  コンポーネントの基本機能動作確認
  Sourceコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ複数表示
  試験確認内容：ディレクトリが単体表示されることを確認
   */
  it("04-01-319:コンポーネントの基本機能動作確認-Sourceコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ複数表示-ディレクトリが単体表示されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_SOURCE, SOURCE_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, "test1", true);
    cy.createDirOrFile(TYPE_DIR, "test2", false);
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test1")
      .should("exist");
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test2")
      .should("exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Sourceコンポーネント共通機能確認
  ファイル操作エリア
  ファイル複数表示
  試験確認内容：ファイルが単体表示されることを確認
   */
  it("04-01-320:コンポーネントの基本機能動作確認-Sourceコンポーネント共通機能確認-ファイル操作エリア-ファイル複数表示-ファイルが単体表示されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_SOURCE, SOURCE_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, "test1", true);
    cy.createDirOrFile(TYPE_FILE, "test2", false);
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test1")
      .should("exist");
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test2")
      .should("exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Sourceコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ディレクトリ表示
  試験確認内容：ディレクトリ内にディレクトリが作成されることを確認
   */
  it("04-01-321:コンポーネントの基本機能動作確認-Sourceコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ内ディレクトリ表示-ディレクトリ内にディレクトリが作成されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_SOURCE, SOURCE_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, "test-a", true);
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-a")
      .click();
    cy.createDirOrFile(TYPE_DIR, "test-b", false);
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-a")
      .should("exist");
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-b")
      .should("exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Sourceコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ファイル表示
  試験確認内容：ディレクトリ内にファイルが作成されることを確認
   */
  it("04-01-322:コンポーネントの基本機能動作確認-Sourceコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ内ファイル表示-ディレクトリ内にファイルが作成されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_SOURCE, SOURCE_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, "test-a", true);
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-a")
      .click();
    cy.createDirOrFile(TYPE_FILE, "test.txt", false);
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test.txt")
      .should("exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Sourceコンポーネント共通機能確認
  各コンポーネントの追加/削除確認
  該当コンポーネント削除確認
  試験確認内容：コンポーネントが削除されていることを確認
   */
  it("04-01-323:コンポーネントの基本機能動作確認-Sourceコンポーネント共通機能確認-各コンポーネントの追加/削除確認-該当コンポーネント削除確認-コンポーネントが削除されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_SOURCE, SOURCE_NAME_0, 300, 500);
    cy.deleteComponent(SOURCE_NAME_0);
    cy.get("[data-cy=\"graph-component-row\"]").contains(SOURCE_NAME_0)
      .should("not.exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Sourceコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  upload on demandスイッチボタン表示確認
  試験確認内容：upload on demandスイッチボタン表示確認が表示されていることを確認
   */
  it("04-01-324:コンポーネントの基本機能動作確認-Sourceコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-upload on demandスイッチボタン表示確認-upload on demandスイッチボタン表示確認が表示されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_SOURCE, SOURCE_NAME_0, 300, 500);
    cy.get("[data-cy=\"component_property-upload_setting-panel_title\"]").click();
    const DATA_CY_STR = "[data-cy=\"component_property-upload_on_demand-switch\"]";
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /**
  コンポーネントの基本機能動作確認
  Sourceコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  upload on demandスイッチボタン入力確認
  試験確認内容：upload on demandスイッチボタン表示確認が表示されていることを確認
   */
  it("04-01-325:コンポーネントの基本機能動作確認-Sourceコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-upload on demandスイッチボタン表示確認-upload on demandスイッチボタン表示確認が表示されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_SOURCE, SOURCE_NAME_0, 300, 500);
    cy.get("[data-cy=\"component_property-upload_setting-panel_title\"]").click();
    cy.get("[data-cy=\"component_property-upload_on_demand-switch\"]").find("input")
      .click();
    cy.get("[data-cy=\"component_property-source_file_name-autocomplete\"]").should("not.exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Sourceコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  source file name表示確認
  試験確認内容：source file nameテキストボックスが表示されていることを確認
   */
  it("04-01-326:コンポーネントの基本機能動作確認-Sourceコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-source file name表示確認-source file nameテキストボックスが表示されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_SOURCE, SOURCE_NAME_0, 300, 500);
    cy.get("[data-cy=\"component_property-upload_setting-panel_title\"]").click();
    const DATA_CY_STR = "[data-cy=\"component_property-source_file_name-autocomplete\"]";
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /**
  コンポーネントの基本機能動作確認
  Sourceコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  source file name入力確認
  試験確認内容：source file nameが入力できることを確認
   */
  it("04-01-327:コンポーネントの基本機能動作確認-Sourceコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-source file name入力確認-source file nameが入力できることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_SOURCE, SOURCE_NAME_0, 300, 500);
    cy.get("[data-cy=\"component_property-upload_setting-panel_title\"]").click();
    cy.createDirOrFile(TYPE_FILE, "test-a", true);
    let targetDropBoxCy = "[data-cy=\"component_property-source_file_name-autocomplete\"]";
    cy.selectValueFromDropdownList(targetDropBoxCy, 3, "test-a");
    cy.get("[data-cy=\"component_property-source_file_name-autocomplete\"]").find("input")
      .should("have.value", "test-a");
  });

  /**
  コンポーネントの基本機能動作確認
  Sourceコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  source file name入力反映確認
  試験確認内容：source file nameが反映されることを確認
   */
  it("04-01-328:コンポーネントの基本機能動作確認-Sourceコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-source file name入力反映確認-source file nameが反映されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_SOURCE, SOURCE_NAME_0, 300, 500);
    cy.get("[data-cy=\"component_property-upload_setting-panel_title\"]").click();
    cy.createDirOrFile(TYPE_FILE, "test-a", true);
    let targetDropBoxCy = "[data-cy=\"component_property-source_file_name-autocomplete\"]";
    cy.selectValueFromDropdownList(targetDropBoxCy, 3, "test-a");
    cy.closeProperty();
    cy.clickComponentName(SOURCE_NAME_0);
    cy.get("[data-cy=\"component_property-upload_setting-panel_title\"]").click();
    cy.get("[data-cy=\"component_property-source_file_name-autocomplete\"]").contains("test-a")
      .should("exist");
  });
});
