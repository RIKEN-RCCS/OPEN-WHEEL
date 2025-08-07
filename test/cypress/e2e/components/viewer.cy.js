describe("04:コンポーネントの基本機能動作確認", ()=>{
  const PROJECT_NAME = `WHEEL_TEST_${Date.now().toString()}`;
  const PROJECT_DESCRIPTION = "TestDescription";
  const TYPE_OUTPUT = "output";
  const TYPE_DIR = "dir";
  const TYPE_FILE = "file";
  const DEF_COMPONENT_IF = "if";
  const DEF_COMPONENT_VIEWER = "viewer";
  const IF_NAME_0 = "if0";
  const VIEWER_NAME_0 = "viewer0";
  const TAG_TYPE_INPUT = "input";
  const TAG_TYPE_TEXT_AREA = "textarea";

  beforeEach(()=>{
    cy.createProject(PROJECT_NAME, PROJECT_DESCRIPTION);
    cy.projectOpen(PROJECT_NAME);
    cy.viewport("macbook-16");
  });

  afterEach(()=>{
    cy.removeAllProjects();
  });

  /**
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  試験確認内容：プロパティが表示されることを確認
   */
  it("04-01-329:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-プロパティが表示されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    const DATA_CY_STR = "[data-cy=\"component_property-property-navigation_drawer\"]";
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /**
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  試験確認内容：name入力テキストエリアが表示されていることを確認
   */
  it("04-01-330:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-name入力テキストエリアが表示されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    const DATA_CY_STR = "[data-cy=\"component_property-name-text_field\"]";
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /**
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  name入力
  試験確認内容：nameが入力できることを確認
   */
  it("04-01-331:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-name入力-nameが入力できることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    const INPUT_OBJ_CY = "[data-cy=\"component_property-name-text_field\"]";
    cy.confirmInputValueReflection(INPUT_OBJ_CY, "-Test_Task", TAG_TYPE_INPUT, "-Test_Task");
  });

  /**
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  name入力（使用可能文字確認）
  試験確認内容：nameが入力できないことを確認
   */
  it("04-01-332:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-name入力（使用可能文字確認）-nameが入力できないことを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    const INPUT_OBJ_CY = "[data-cy=\"component_property-name-text_field\"]";
    cy.confirmInputValueNotReflection(INPUT_OBJ_CY, "Test*Task", TAG_TYPE_INPUT, VIEWER_NAME_0);
  });

  /**
    コンポーネントの基本機能動作確認
    Viewerコンポーネント共通機能確認
    試験確認内容：説明入力テキストエリアが表示されていることを確認
   */
  it("04-01-333:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-description入力テキストエリアが表示されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    const DATA_CY_STR = "[data-cy=\"component_property-description-textarea\"]";
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /**
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  description入力
  試験確認内容：descriptionが入力できることを確認
   */
  it("04-01-334:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-description入力-descriptionが入力できることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    const INPUT_OBJ_CY = "[data-cy=\"component_property-description-textarea\"]";
    cy.confirmInputValueReflection(INPUT_OBJ_CY, "descriptionTest", TAG_TYPE_TEXT_AREA, VIEWER_NAME_0);
  });

  /**
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  input files表示
  試験確認内容：input files入力テキストエリアが表示されていることを確認
   */
  it("04-01-335:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-input files表示-input files入力テキストエリアが表示されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    const DATA_CY_STR = "[data-cy=\"component_property-input_files_viewer-list_form\"]";
    const CLICK_AREA_CY = "[data-cy=\"component_property-input_file_setting-panel_title\"]";
    cy.confirmDisplayInPropertyByDetailsArea(DATA_CY_STR, CLICK_AREA_CY, null);
  });

  /**
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  input files入力
  試験確認内容：input filesが入力できることを確認
   */
  it("04-01-336:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-input files入力-input filesが入力できることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    cy.get("[data-cy=\"component_property-input_file_setting-panel_title\"]").click();
    cy.get("[data-cy=\"component_property-input_files_viewer-list_form\"]").find("input")
      .type("testInputFile");
    cy.get("[data-cy=\"component_property-input_files_viewer-list_form\"]").find("input")
      .should("have.value", "testInputFile");
  });

  /**
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  input files反映確認
  試験確認内容：input filesが反映されることを確認
   */
  it("04-01-337:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-input files反映確認-input filesが反映されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    cy.get("[data-cy=\"component_property-input_file_setting-panel_title\"]").click();
    cy.get("[data-cy=\"component_property-input_files_viewer-list_form\"]").find("input")
      .type("testInputFile");
    cy.get("[data-cy=\"list_form-add-text_field\"]").find("[role=\"button\"]")
      .eq(1)
      .click();
    cy.get("[data-cy=\"graph-component-row\"]").contains("testInputFile")
      .should("exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  構成要素の機能確認
  closeボタン押下
  試験確認内容：プロパティが表示されていないことを確認
   */
  it("04-01-338:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-構成要素の機能確認-closeボタン押下-プロパティが表示されていないことを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    cy.closeProperty();
    cy.get("[data-cy=\"component_property-property-navigation_drawer\"]").should("not.exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  構成要素の機能確認
  cleanボタン押下
  試験確認内容：最新の保存状態に戻っていることを確認
  skip:issue#948
   */
  it.skip("04-01-339:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-構成要素の機能確認-cleanボタン押下-最新の保存状態に戻っていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, "test-a", true);
    cy.get("[data-cy=\"component_property-loop_set_for-panel_title\"]").click();
    cy.get("[data-cy=\"component_property-start_for-text_field\"]").type("1");
    cy.get("[data-cy=\"component_property-end_for-text_field\"]").type("5");
    cy.get("[data-cy=\"component_property-step_for-text_field\"]").type("5");
    cy.get("[data-cy=\"workflow-play-btn\"]").click();
    cy.clickComponentName(VIEWER_NAME_0);
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
  Viewerコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  接続確認
  試験確認内容：コンポーネントが接続されていることを確認
   */
  it("04-01-340:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-ファイル転送設定の各パターンの確認-接続確認-コンポーネントが接続されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, "testOutputFile", true, true);
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 600);
    cy.connectComponent(VIEWER_NAME_0); //コンポーネント同士を接続
    cy.checkConnectionLine(IF_NAME_0, VIEWER_NAME_0); //作成したコンポーネントの座標を取得して接続線の座標と比較
  });

  /**
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除ボタン表示確認（input file）
  試験確認内容：削除ボタンが表示されることを確認
   */
  it("04-01-341:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除ボタン表示確認（input file）-削除ボタンが表示されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    cy.get("[data-cy=\"component_property-input_file_setting-panel_title\"]").click();
    cy.get("[data-cy=\"component_property-input_files_viewer-list_form\"]").find("input")
      .type("testInputFile");
    cy.get("[data-cy=\"list_form-add-text_field\"]").find("[role=\"button\"]")
      .eq(1)
      .click();
    cy.get("[data-cy=\"action_row-delete-btn\"]").should("be.visible");
  });

  /**
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除反映確認（input file）
  試験確認内容：input fileが削除されていることを確認
   */
  it("04-01-342:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除反映確認（input file）-input fileが削除されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    cy.get("[data-cy=\"component_property-input_file_setting-panel_title\"]").click();
    cy.get("[data-cy=\"component_property-input_files_viewer-list_form\"]").find("input")
      .type("testInputFile");
    cy.get("[data-cy=\"list_form-add-text_field\"]").find("[role=\"button\"]")
      .eq(1)
      .click();
    cy.get("[data-cy=\"action_row-delete-btn\"]").click();
    cy.get("[data-cy=\"graph-component-row\"]").contains("testInputFile")
      .should("not.exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ単体表示
  試験確認内容：ディレクトリが単体表示されることを確認
   */
  it("04-01-343:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ単体表示-ディレクトリが単体表示されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, "test-a", true);
    cy.createDirOrFile(TYPE_DIR, "test-b", false);
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-a")
      .should("exist");
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-b")
      .should("exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ複数表示（リロード前）
  試験確認内容：ディレクトリが単体表示されることを確認
   */
  it("04-01-344:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ複数表示（リロード前）-ディレクトリが単体表示されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, "test1", true);
    cy.createDirOrFile(TYPE_DIR, "test2", false);
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test1")
      .should("exist");
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test2")
      .should("exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ複数表示（リロード後）
  試験確認内容：ディレクトリが複数表示されることを確認
   */
  it("04-01-345:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ複数表示（リロード後）-ディレクトリが複数表示されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, "test1", true);
    cy.createDirOrFile(TYPE_DIR, "test2", false);
    cy.closeProperty();
    cy.clickComponentName(VIEWER_NAME_0);
    cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test*")
      .should("exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  ファイル操作エリア
  ファイル単体表示
  試験確認内容：ファイルが単体表示されることを確認
   */
  it("04-01-346:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-ファイル操作エリア-ファイル単体表示-ファイルが単体表示されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, "test-a", true);
    cy.createDirOrFile(TYPE_FILE, "test-b", false);
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-a")
      .should("exist");
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-b")
      .should("exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  ファイル操作エリア
  ファイル複数表示（リロード前）
  試験確認内容：ファイルが単体表示されることを確認
   */
  it("04-01-347:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-ファイル操作エリア-ファイル複数表示（リロード前）-ファイルが単体表示されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, "test1", true);
    cy.createDirOrFile(TYPE_FILE, "test2", false);
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test1")
      .should("exist");
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test2")
      .should("exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  ファイル操作エリア
  ファイル複数表示（リロード後）
  試験確認内容：ファイルが複数表示されることを確認
   */
  it("04-01-348:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-ファイル操作エリア-ファイル複数表示（リロード後）-ファイルが複数表示されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, "test1", true);
    cy.createDirOrFile(TYPE_FILE, "test2", false);
    cy.closeProperty();
    cy.clickComponentName(VIEWER_NAME_0);
    cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test*")
      .should("exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ディレクトリ表示
  試験確認内容：ディレクトリ内にディレクトリが作成されることを確認
   */
  it("04-01-349:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ内ディレクトリ表示-ディレクトリ内にディレクトリが作成されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
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
  Viewerコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ファイル表示
  試験確認内容：ディレクトリ内にファイルが作成されることを確認
   */
  it("04-01-350:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ内ファイル表示-ディレクトリ内にファイルが作成されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, "test-a", true);
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-a")
      .click();
    cy.createDirOrFile(TYPE_FILE, "test.txt", false);
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test.txt")
      .should("exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  各コンポーネントの追加/削除確認
  該当コンポーネント削除確認
  試験確認内容：コンポーネントが削除されていることを確認
   */
  it("04-01-351:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-各コンポーネントの追加/削除確認-該当コンポーネント削除確認-コンポーネントが削除されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    cy.deleteComponent(VIEWER_NAME_0);
    cy.get("[data-cy=\"graph-component-row\"]").contains(VIEWER_NAME_0)
      .should("not.exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  open viewer screenボタン表示確認
  試験確認内容：open viewer screenボタンが有効となっていることを確認
  skip:issue#949
   */
  it.skip("04-01-352:コンポーネントの基本機能動作確認-Sourceコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-open viewer screenボタン表示確認-open viewer screenボタンが有効となっていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, "test-a", true);
    cy.get("[data-cy=\"component_property-condition-setting_title\"]").click();
    let targetDropBoxCy = "[data-cy=\"component_property-condition_use_javascript-autocomplete\"]";
    cy.selectValueFromDropdownList(targetDropBoxCy, 3, "test-a");
    cy.enterInputOrOutputFile(TYPE_OUTPUT, "testOutputFile", true, true);
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 600);
    cy.connectComponent(VIEWER_NAME_0); //コンポーネント同士を接続
    cy.get("[data-cy=\"workflow-open_viewer_screen-btn\"]").should("be.disabled");
  });
});
