describe("04:コンポーネントの基本機能動作確認", ()=>{
  const PROJECT_NAME = `WHEEL_TEST_${Date.now().toString()}`;
  const PROJECT_DESCRIPTION = "TestDescription";
  const TYPE_INPUT = "input";
  const TYPE_OUTPUT = "output";
  const TYPE_DIR = "dir";
  const TYPE_FILE = "file";
  const DEF_COMPONENT_STEPJOB = "stepjob";
  const STEPJOB_NAME_0 = "stepjob0";
  const STEPJOB_NAME_1 = "stepjob1";
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
  Stepjobコンポーネント共通機能確認
  試験確認内容：プロパティが表示されることを確認
   */
  it("04-01-353:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-プロパティが表示されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    const DATA_CY_STR = "[data-cy=\"component_property-property-navigation_drawer\"]";
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /**
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  試験確認内容：name入力テキストエリアが表示されていることを確認
   */
  it("04-01-354:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-name入力テキストエリアが表示されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    const DATA_CY_STR = "[data-cy=\"component_property-name-text_field\"]";
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /**
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  name入力
  試験確認内容：nameが入力できることを確認
   */
  it("04-01-355:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-name入力-nameが入力できることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    const INPUT_OBJ_CY = "[data-cy=\"component_property-name-text_field\"]";
    cy.confirmInputValueReflection(INPUT_OBJ_CY, "-Test_Task", TAG_TYPE_INPUT, "-Test_Task");
  });

  /**
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  name入力（使用可能文字確認）
  試験確認内容：nameが入力できないことを確認
   */
  it("04-01-356:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-name入力（使用可能文字確認）-nameが入力できないことを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    const INPUT_OBJ_CY = "[data-cy=\"component_property-name-text_field\"]";
    cy.confirmInputValueNotReflection(INPUT_OBJ_CY, "Test*Task", TAG_TYPE_INPUT, STEPJOB_NAME_0);
  });

  /**
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  試験確認内容：説明入力テキストエリアが表示されていることを確認
   */
  it("04-01-357:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-description入力テキストエリアが表示されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    const DATA_CY_STR = "[data-cy=\"component_property-description-textarea\"]";
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /**
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  description入力
  試験確認内容：descriptionが入力できることを確認
   */
  it("04-01-358:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-description入力-descriptionが入力できることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    const INPUT_OBJ_CY = "[data-cy=\"component_property-description-textarea\"]";
    cy.confirmInputValueReflection(INPUT_OBJ_CY, "descriptionTest", TAG_TYPE_TEXT_AREA, STEPJOB_NAME_0);
  });

  /**
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  input files表示
  試験確認内容：input files入力テキストエリアが表示されていることを確認
   */
  it("04-01-359:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-input files表示-input files入力テキストエリアが表示されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    const DATA_CY_STR = "[data-cy=\"component_property-input_files-list_form\"]";
    const CLICK_AREA_CY = "[data-cy=\"component_property-in_out_files-panel_title\"]";
    cy.confirmDisplayInPropertyByDetailsArea(DATA_CY_STR, CLICK_AREA_CY, null);
  });

  /**
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  input files入力
  試験確認内容：input filesが入力できることを確認
   */
  it("04-01-360:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-input files入力-input filesが入力できることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, "testInputFile", true, false);
    cy.get("[data-cy=\"component_property-input_files-list_form\"]").find("input")
      .should("have.value", "testInputFile");
  });

  /**
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  input files反映確認
  試験確認内容：input filesが反映されることを確認
   */
  it("04-01-361:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-input files反映確認-input filesが反映されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, "testInputFile", true, true);
    cy.get("[data-cy=\"graph-component-row\"]").contains("testInputFile")
      .should("exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  output files表示
  試験確認内容：output files入力テキストエリアが表示されていることを確認
   */
  it("04-01-362:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-output files表示-output files入力テキストエリアが表示されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.get("[data-cy=\"component_property-in_out_files-panel_title\"]").click();
    cy.get("[data-cy=\"component_property-output_files-list_form\"]").should("exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  output files入力
  試験確認内容：output filesが入力できることを確認
   */
  it("04-01-363:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-output files入力-output filesが入力できることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, "testOutputFile", true, false);
    cy.get("[data-cy=\"component_property-output_files-list_form\"]").find("input")
      .should("have.value", "testOutputFile");
  });

  /**
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  output files反映確認
  試験確認内容：output filesが反映されることを確認
   */
  it("04-01-364:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-output files反映確認-output filesが反映されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, "testOutputFile", true, true);
    cy.get("[data-cy=\"graph-component-row\"]").contains("testOutputFile")
      .should("exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  構成要素の機能確認
  closeボタン押下
  試験確認内容：プロパティが表示されていないことを確認
   */
  it("04-01-365:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-構成要素の機能確認-closeボタン押下-プロパティが表示されていないことを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.closeProperty();
    cy.get("[data-cy=\"component_property-property-navigation_drawer\"]").should("not.exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  接続確認
  試験確認内容：コンポーネントが接続されていることを確認
   */
  it("04-01-366:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-ファイル転送設定の各パターンの確認-接続確認-コンポーネントが接続されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, "testOutputFile", true, true);
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_1, 300, 600);
    cy.connectComponent(STEPJOB_NAME_1); //コンポーネント同士を接続
    cy.checkConnectionLine(STEPJOB_NAME_0, STEPJOB_NAME_1); //作成したコンポーネントの座標を取得して接続線の座標と比較
  });

  /**
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除ボタン表示確認（input file）
  試験確認内容：削除ボタンが表示されることを確認
   */
  it("04-01-367:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除ボタン表示確認（input file）-削除ボタンが表示されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, "testInputFile", true, true);
    cy.get("[data-cy=\"action_row-delete-btn\"]").should("be.visible");
  });

  /**
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除ボタン表示確認（output file）
  試験確認内容：削除ボタンが表示されることを確認
   */
  it("04-01-368:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除ボタン表示確認（output file）-削除ボタンが表示されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, "testOutputFile", true, true);
    cy.get("[data-cy=\"action_row-delete-btn\"]").should("be.visible");
  });

  /**
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除反映確認（input file）
  試験確認内容：input fileが削除されていることを確認
   */
  it("04-01-369:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除反映確認（input file）-input fileが削除されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, "testInputFile", true, true);
    cy.get("[data-cy=\"action_row-delete-btn\"]").click();
    cy.get("[data-cy=\"graph-component-row\"]").contains("testInputFile")
      .should("not.exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除反映確認（output file）
  試験確認内容：output fileが削除されていることを確認
   */
  it("04-01-370:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除反映確認（output file）-output fileが削除されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, "testOutputFile", true, true);
    cy.get("[data-cy=\"action_row-delete-btn\"]").click();
    cy.get("[data-cy=\"graph-component-row\"]").contains("testOutputFile")
      .should("not.exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ単体表示
  試験確認内容：ディレクトリが単体表示されることを確認
   */
  it("04-01-371:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ単体表示-ディレクトリが単体表示されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, "test-a", true);
    cy.createDirOrFile(TYPE_DIR, "test-b", false);
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-a")
      .should("exist");
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-b")
      .should("exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ複数表示（リロード前）
  試験確認内容：ディレクトリが単体表示されることを確認
   */
  it("04-01-372:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ複数表示（リロード前）-ディレクトリが単体表示されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, "test1", true);
    cy.createDirOrFile(TYPE_DIR, "test2", false);
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test1")
      .should("exist");
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test2")
      .should("exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ複数表示（リロード後）
  試験確認内容：ディレクトリが複数表示されることを確認
   */
  it("04-01-373:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ複数表示（リロード後）-ディレクトリが複数表示されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, "test1", true);
    cy.createDirOrFile(TYPE_DIR, "test2", false);
    cy.closeProperty();
    cy.clickComponentName(STEPJOB_NAME_0);
    cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test*")
      .should("exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  ファイル操作エリア
  ファイル単体表示
  試験確認内容：ファイルが単体表示されることを確認
   */
  it("04-01-374:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-ファイル操作エリア-ファイル単体表示-ファイルが単体表示されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, "test-a", true);
    cy.createDirOrFile(TYPE_FILE, "test-b", false);
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-a")
      .should("exist");
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-b")
      .should("exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  ファイル操作エリア
  ファイル複数表示（リロード前）
  試験確認内容：ファイルが単体表示されることを確認
   */
  it("04-01-375:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-ファイル操作エリア-ファイル複数表示（リロード前）-ファイルが単体表示されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, "test1", true);
    cy.createDirOrFile(TYPE_FILE, "test2", false);
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test1")
      .should("exist");
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test2")
      .should("exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  ファイル操作エリア
  ファイル複数表示（リロード後）
  試験確認内容：ファイルが複数表示されることを確認
   */
  it("04-01-376:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-ファイル操作エリア-ファイル複数表示（リロード後）-ファイルが複数表示されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, "test1", true);
    cy.createDirOrFile(TYPE_FILE, "test2", false);
    cy.closeProperty();
    cy.clickComponentName(STEPJOB_NAME_0);
    cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test*")
      .should("exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ディレクトリ表示
  試験確認内容：ディレクトリ内にディレクトリが作成されることを確認
   */
  it("04-01-377:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ内ディレクトリ表示-ディレクトリ内にディレクトリが作成されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
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
  Stepjobコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ファイル表示
  試験確認内容：ディレクトリ内にファイルが作成されることを確認
   */
  it("04-01-378:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ内ファイル表示-ディレクトリ内にファイルが作成されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, "test-a", true);
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-a")
      .click();
    cy.createDirOrFile(TYPE_FILE, "test.txt", false);
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test.txt")
      .should("exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  各コンポーネントの追加/削除確認
  該当コンポーネント削除確認
  試験確認内容：コンポーネントが削除されていることを確認
   */
  it("04-01-379:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-各コンポーネントの追加/削除確認-該当コンポーネント削除確認-コンポーネントが削除されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.deleteComponent(STEPJOB_NAME_0);
    cy.get("[data-cy=\"graph-component-row\"]").contains(STEPJOB_NAME_0)
      .should("not.exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  host表示確認
  試験確認内容：hostセレクトボックスが表示されていることを確認
   */
  it("04-01-380:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-host表示確認-hostセレクトボックスが表示されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    const DATA_CY_STR = "[data-cy=\"component_property-host-select\"]";
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /**
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  host選択確認（localhost以外を選択）
  試験確認内容：hostセレクトボックスで選択した値が表示されていることを確認
   */
  it("04-01-381:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-host選択確認（localhost以外を選択）-hostセレクトボックスで選択した値が表示されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    //新規リモートホスト設定を作成
    cy.visit("/remotehost");
    cy.get("[data-cy=\"remotehost-new_remote_host_setting-btn\"]").click();
    cy.enterRequiredRemoteHost("TestLabel", "TestHostname", 8000, "testUser");
    cy.get("[data-cy=\"add_new_host-ok-btn\"]").click();
    //ホーム画面からプロジェクトを開き検証を行う
    cy.visit("/");
    cy.projectOpen(PROJECT_NAME);
    cy.clickComponentName(STEPJOB_NAME_0);
    cy.get("[data-cy=\"component_property-host-select\"]").type("TestLabel");
    cy.get("[data-cy=\"component_property-host-select\"]").contains("TestLabel")
      .should("exist");
    cy.removeRemoteHost("TestLabel");
  });

  /**
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  host選択確認（localhost以外を選択）
  試験確認内容：hostセレクトボックスで選択した値が反映されていることを確認
   */
  it("04-01-382:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-hostファイル選択表示確認-hostセレクトボックスで選択したファイルが表示されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    //新規リモートホスト設定を作成
    cy.visit("/remotehost");
    cy.get("[data-cy=\"remotehost-new_remote_host_setting-btn\"]").click();
    cy.enterRequiredRemoteHost("TestLabel", "TestHostname", 8000, "testUser");
    cy.get("[data-cy=\"add_new_host-ok-btn\"]").click();
    //ホーム画面からプロジェクトを開き検証を行う
    cy.visit("/");
    cy.projectOpen(PROJECT_NAME);
    cy.clickComponentName(STEPJOB_NAME_0);
    cy.get("[data-cy=\"component_property-host-select\"]").type("TestLabel");
    cy.saveProperty();
    cy.get("[data-cy=\"component_property-host-select\"]").contains("TestLabel")
      .should("exist");
    cy.removeRemoteHost("TestLabel");
  });

  /**
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  use job schedulerスイッチボタン表示確認
  試験確認内容：use job schedulerスイッチボタンが表示されていることを確認
   */
  it("04-01-383:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認use job schedulerスイッチボタン表示確認-use job schedulerスイッチボタンが表示されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    const DATA_CY_STR = "[data-cy=\"component_property-job_scheduler-switch\"]";
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /**
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  queue表示確認（有効）
  試験確認内容：queueセレクトボックスが有効となっていることを確認
   */
  it("04-01-385:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-queue表示確認（有効）-queueセレクトボックスが有効となっていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.get("[data-cy=\"component_property-queue-select\"]").find("input")
      .should("be.not.disabled");
  });

  /**
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  queue選択確認
  試験確認内容：queueセレクトボックスに選択した値が表示されていることを確認
   */
  it("04-01-386:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-queue選択確認-queueセレクトボックスに選択した値が表示されていることを確認", ()=>{
    //新規リモートホスト設定を作成
    cy.visit("/remotehost");
    cy.get("[data-cy=\"remotehost-new_remote_host_setting-btn\"]").click();
    cy.enterRequiredRemoteHost("TestLabel", "TestHostname", 8000, "testUser");
    cy.get("[data-cy=\"add_new_host-available_queues-text_field\"]").type("testQueues");
    cy.get("[data-cy=\"add_new_host-ok-btn\"]").click();
    //ホーム画面からプロジェクトを開き検証を行う
    cy.visit("/");
    cy.projectOpen(PROJECT_NAME);
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    let targetDropBoxCy = "[data-cy=\"component_property-host-select\"]";
    cy.selectValueFromDropdownList(targetDropBoxCy, 2, "TestLabel");
    targetDropBoxCy = "[data-cy=\"component_property-queue-select\"]";
    cy.selectValueFromDropdownList(targetDropBoxCy, 2, "testQueues");
    cy.get("[data-cy=\"component_property-queue-select\"]").find("input")
      .should("have.value", "testQueues");
    cy.removeRemoteHost("TestLabel");
  });

  /**
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  queue選択反映確認
  試験確認内容：queueセレクトボックスに選択した値が反映されていることを確認
   */
  it("04-01-387:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-queue選択反映確認-queueセレクトボックスに選択した値が反映されていることを確認", ()=>{
    //新規リモートホスト設定を作成
    cy.visit("/remotehost");
    cy.get("[data-cy=\"remotehost-new_remote_host_setting-btn\"]").click();
    cy.enterRequiredRemoteHost("TestLabel", "TestHostname", 8000, "testUser");
    cy.get("[data-cy=\"add_new_host-available_queues-text_field\"]").type("testQueues");
    cy.get("[data-cy=\"add_new_host-ok-btn\"]").click();
    //ホーム画面からプロジェクトを開き検証を行う
    cy.visit("/");
    cy.projectOpen(PROJECT_NAME);
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    let targetDropBoxCy = "[data-cy=\"component_property-host-select\"]";
    cy.selectValueFromDropdownList(targetDropBoxCy, 2, "TestLabel");
    targetDropBoxCy = "[data-cy=\"component_property-queue-select\"]";
    cy.selectValueFromDropdownList(targetDropBoxCy, 2, "testQueues");
    cy.closeProperty();
    cy.clickComponentName(STEPJOB_NAME_0);
    cy.get("[data-cy=\"component_property-queue-select\"]").find("input")
      .should("have.value", "testQueues");
    cy.removeRemoteHost("TestLabel");
  });

  /**
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  submit command表示確認（有効）
  試験確認内容：submit commandテキストボックスが有効となっていることを確認
   */
  it("04-01-389:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-プロパティ設定確認-submit command表示確認（有効）-submit commandテキストボックスが有効となっていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.get("[data-cy=\"component_property-submit_command-text_field\"]").find("input")
      .should("be.not.disabled");
  });

  /**
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  submit command反映確認
  試験確認内容：リモートホストのジョブ投入コマンドが表示されていることを確認
   */
  it("04-01-390:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-submit command反映確認-リモートホストのジョブ投入コマンドが表示されていることを確認", ()=>{
    //新規リモートホスト設定を作成
    cy.visit("/remotehost");
    cy.get("[data-cy=\"remotehost-new_remote_host_setting-btn\"]").click();
    cy.enterRequiredRemoteHost("TestLabel", "TestHostname", 8000, "testUser");
    cy.get("[data-cy=\"add_new_host-job_schedulers-select\"]").type("PBSPro");
    cy.get("[data-cy=\"add_new_host-ok-btn\"]").click();
    //ホーム画面からプロジェクトを開き検証を行う
    cy.visit("/");
    cy.projectOpen(PROJECT_NAME);
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.clickComponentName(STEPJOB_NAME_0);
    let targetDropBoxCy = "[data-cy=\"component_property-host-select\"]";
    cy.selectValueFromDropdownList(targetDropBoxCy, 2, "TestLabel");
    cy.closeProperty();
    cy.clickComponentName(STEPJOB_NAME_0);
    cy.get("[data-cy=\"component_property-submit_command-text_field\"]").find("input")
      .should("have.value", "qsub");
    cy.removeRemoteHost("TestLabel");
  });

  /**
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  submit option表示確認（有効）
  試験確認内容：submit optionテキストボックスが有効となっていることを確認
   */
  it("04-01-392:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-submit option表示確認（有効）-submit optionテキストボックスが有効となっていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.get("[data-cy=\"component_property-submit_option-text_field\"]").find("input")
      .should("be.not.disabled");
  });

  /**
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  submit option反映確認
  試験確認内容：submit optionテキストボックスに入力した値が設定されていることを確認
   */
  it("04-01-393:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-submit option反映確認-submit optionテキストボックスに入力した値が設定されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.get("[data-cy=\"component_property-submit_option-text_field\"]").find("input")
      .type("testSubmitCommand");
    cy.closeProperty();
    cy.clickComponentName(STEPJOB_NAME_0);
    cy.get("[data-cy=\"component_property-submit_option-text_field\"]").find("input")
      .should("have.value", "testSubmitCommand");
  });
});
