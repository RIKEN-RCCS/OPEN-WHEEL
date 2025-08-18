describe("04:コンポーネントの基本機能動作確認", ()=>{
  const PROJECT_NAME = `WHEEL_TEST_${Date.now().toString()}`;
  const PROJECT_DESCRIPTION = "TestDescription";
  const TYPE_INPUT = "input";
  const TYPE_OUTPUT = "output";
  const TYPE_DIR = "dir";
  const TYPE_FILE = "file";
  const DEF_COMPONENT_WORKFLOW = "workflow";
  const WORKFLOW_NAME_0 = "workflow0";
  const WORKFLOW_NAME_1 = "workflow1";
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
  Workflowコンポーネント共通機能確認
  試験確認内容：プロパティが表示されることを確認
   */
  it("04-01-243:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-プロパティが表示されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    const DATA_CY_STR = "[data-cy=\"component_property-property-navigation_drawer\"]";
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /**
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  試験確認内容：name入力テキストエリアが表示されていることを確認
   */
  it("04-01-244:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-name入力テキストエリアが表示されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    const DATA_CY_STR = "[data-cy=\"component_property-name-text_field\"]";
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /**
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  name入力
  試験確認内容：nameが入力できることを確認
   */
  it("04-01-245:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-name入力-nameが入力できることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    const INPUT_OBJ_CY = "[data-cy=\"component_property-name-text_field\"]";
    cy.confirmInputValueReflection(INPUT_OBJ_CY, "-Test_Task", TAG_TYPE_INPUT, "-Test_Task");
  });

  /**
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  name入力（使用可能文字確認）
  試験確認内容：nameが入力できないことを確認
   */
  it("04-01-246:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-name入力（使用可能文字確認）-nameが入力できないことを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    const INPUT_OBJ_CY = "[data-cy=\"component_property-name-text_field\"]";
    cy.confirmInputValueNotReflection(INPUT_OBJ_CY, "Test*Task", TAG_TYPE_INPUT, WORKFLOW_NAME_0);
  });

  /**
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  試験確認内容：説明入力テキストエリアが表示されていることを確認
   */
  it("04-01-247:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-description入力テキストエリアが表示されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    const DATA_CY_STR = "[data-cy=\"component_property-description-textarea\"]";
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /**
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  description入力
  試験確認内容：descriptionが入力できることを確認
   */
  it("04-01-248:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-description入力-descriptionが入力できることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    const INPUT_OBJ_CY = "[data-cy=\"component_property-description-textarea\"]";
    cy.confirmInputValueReflection(INPUT_OBJ_CY, "descriptionTest", TAG_TYPE_TEXT_AREA, WORKFLOW_NAME_0);
  });

  /**
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  input files表示
  試験確認内容：input files入力テキストエリアが表示されていることを確認
   */
  it("04-01-249:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-input files表示-input files入力テキストエリアが表示されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    const DATA_CY_STR = "[data-cy=\"component_property-input_files-list_form\"]";
    const CLICK_AREA_CY = "[data-cy=\"component_property-in_out_files-panel_title\"]";
    cy.confirmDisplayInPropertyByDetailsArea(DATA_CY_STR, CLICK_AREA_CY, null);
  });

  /**
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  input files入力
  試験確認内容：input filesが入力できることを確認
   */
  it("04-01-250:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-input files入力-input filesが入力できることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, "testInputFile", true, false);
    cy.get("[data-cy=\"component_property-input_files-list_form\"]").find("input")
      .should("have.value", "testInputFile");
  });

  /**
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  input files反映確認
  試験確認内容：input filesが反映されることを確認
   */
  it("04-01-251:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-input files反映確認-input filesが反映されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, "testInputFile", true, true);
    cy.get("[data-cy=\"graph-component-row\"]").contains("testInputFile")
      .should("exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  output files表示
  試験確認内容：output files入力テキストエリアが表示されていることを確認
   */
  it("04-01-252:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-output files表示-output files入力テキストエリアが表示されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    const DATA_CY_STR = "[data-cy=\"component_property-output_files-list_form\"]";
    const CLICK_AREA_CY = "[data-cy=\"component_property-in_out_files-panel_title\"]";
    cy.confirmDisplayInPropertyByDetailsArea(DATA_CY_STR, CLICK_AREA_CY, null);
  });

  /**
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  output files入力
  試験確認内容：output filesが入力できることを確認
   */
  it("04-01-253:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-output files入力-output filesが入力できることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, "testOutputFile", true, false);
    cy.get("[data-cy=\"component_property-output_files-list_form\"]").find("input")
      .should("have.value", "testOutputFile");
  });

  /**
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  output files反映確認
  試験確認内容：output filesが反映されることを確認
   */
  it("04-01-254:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-output files反映確認-output filesが反映されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, "testOutputFile", true, true);
    cy.get("[data-cy=\"graph-component-row\"]").contains("testOutputFile")
      .should("exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  構成要素の機能確認
  closeボタン押下
  試験確認内容：プロパティが表示されていないことを確認
   */
  it("04-01-255:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-構成要素の機能確認-closeボタン押下-プロパティが表示されていないことを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    cy.closeProperty();
    cy.get("[data-cy=\"component_property-property-navigation_drawer\"]").should("not.exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  構成要素の機能確認
  cleanボタン押下
  試験確認内容：最新の保存状態に戻っていることを確認
  skip:issue#948
   */
  it.skip("04-01-256:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-構成要素の機能確認-cleanボタン押下-最新の保存状態に戻っていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, "test-a", true);
    cy.get("[data-cy=\"component_property-loop_set_for-panel_title\"]").click();
    cy.get("[data-cy=\"component_property-start_for-text_field\"]").type("1");
    cy.get("[data-cy=\"component_property-end_for-text_field\"]").type("5");
    cy.get("[data-cy=\"component_property-step_for-text_field\"]").type("5");
    cy.get("[data-cy=\"workflow-play-btn\"]").click();
    cy.clickComponentName(WORKFLOW_NAME_0);
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
  Workflowコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  接続確認
  試験確認内容：コンポーネントが接続されていることを確認
   */
  it("04-01-257:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-ファイル転送設定の各パターンの確認-接続確認-コンポーネントが接続されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, "testOutputFile", true, true);
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_1, 300, 600);
    cy.connectComponent(WORKFLOW_NAME_1); //コンポーネント同士を接続
    cy.checkConnectionLine(WORKFLOW_NAME_0, WORKFLOW_NAME_1); //作成したコンポーネントの座標を取得して接続線の座標と比較
  });

  /**
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  シンポリックリンク確認（outputFile、inputFile一致）
  試験確認内容：シンポリックリンクが作成されていることを確認
   */
  it("04-01-258:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-ファイル転送設定の各パターンの確認-シンポリックリンク確認（outputFile、inputFile一致）-シンポリックリンクが作成されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    //ps0
    cy.createDirOrFile(TYPE_FILE, "run.sh", true);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, "run.sh", true, true);
    //ps1
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_1, 300, 600);
    cy.clickComponentName(WORKFLOW_NAME_1);
    cy.enterInputOrOutputFile(TYPE_INPUT, "run.sh", true, true);
    cy.connectComponent(WORKFLOW_NAME_1); //コンポーネント同士を接続
    cy.checkConnectionLine(WORKFLOW_NAME_0, WORKFLOW_NAME_1); //作成したコンポーネントの座標を取得して接続線の座標と比較
    cy.get("[data-cy=\"workflow-play-btn\"]").click(); //実行する
    cy.checkProjectStatus("finished");
    cy.clickComponentName(WORKFLOW_NAME_1);
    cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("run.sh")
      .should("exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  シンポリックリンク確認（outputFileが通常、inputFileが空白）
  試験確認内容：シンポリックリンクが作成されていることを確認
   */
  it("04-01-259:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-シンポリックリンク確認（outputFileが通常、inputFileが空白）-シンポリックリンクが作成されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    //ps0
    cy.createDirOrFile(TYPE_FILE, "run.sh", true);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, "run.sh", true, true);
    //ps1
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_1, 300, 600);
    cy.clickComponentName(WORKFLOW_NAME_1);
    cy.connectComponent(WORKFLOW_NAME_1); //コンポーネント同士を接続
    cy.checkConnectionLine(WORKFLOW_NAME_0, WORKFLOW_NAME_1); //作成したコンポーネントの座標を取得して接続線の座標と比較
    cy.get("[data-cy=\"workflow-play-btn\"]").click(); //実行する
    cy.checkProjectStatus("finished");
    cy.clickComponentName(WORKFLOW_NAME_1);
    cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("run.sh")
      .should("exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  シンポリックリンク確認（outputFileが通常、inputFileが「/」で終わらない文字列）
  試験確認内容：シンポリックリンクが作成されていることを確認
   */
  it("04-01-260:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-シンポリックリンク確認（outputFileが通常、inputFileが「/」で終わらない文字列）-シンポリックリンクが作成されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    //ps0
    cy.createDirOrFile(TYPE_FILE, "run.sh", true);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, "run.sh", true, true);
    //ps1
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_1, 300, 600);
    cy.clickComponentName(WORKFLOW_NAME_1);
    cy.connectComponent(WORKFLOW_NAME_1); //コンポーネント同士を接続
    cy.checkConnectionLine(WORKFLOW_NAME_0, WORKFLOW_NAME_1); //作成したコンポーネントの座標を取得して接続線の座標と比較
    cy.get("[data-cy=\"component_property-in_out_files-panel_title\"]").click();
    cy.get("[data-cy=\"component_property-input_files-list_form\"]").contains("run.sh")
      .click();
    cy.get("[data-cy=\"list_form_property-edit-text_field\"]").find("input")
      .clear()
      .type("while1.sh{enter}"); //inputFileの値を変更
    cy.closeProperty();
    cy.get("[data-cy=\"workflow-play-btn\"]").click(); //実行する
    cy.checkProjectStatus("finished");
    cy.clickComponentName(WORKFLOW_NAME_1);
    cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("while1.sh")
      .should("exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  シンポリックリンク確認（outputFileがglob(*や\?など)を含むパス、inputFileが「/」で終わらない文字列）
  試験確認内容：シンポリックリンクが作成されていることを確認
   */
  //eslint-disable-next-line no-useless-escape
  it("04-01-261:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-シンポリックリンク確認（outputFileがglob(*や\?など)を含むパス、inputFileが「/」で終わらない文字列）-シンポリックリンクが作成されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    //Workflow0
    cy.createDirOrFile(TYPE_FILE, "run-a.sh", true);
    cy.createDirOrFile(TYPE_FILE, "run-b.sh", false);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, "run*", true, true);
    //Workflow1
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_1, 300, 600);
    cy.clickComponentName(WORKFLOW_NAME_1);
    cy.connectComponent(WORKFLOW_NAME_1); //コンポーネント同士を接続
    cy.checkConnectionLine(WORKFLOW_NAME_0, WORKFLOW_NAME_1); //作成したコンポーネントの座標を取得して接続線の座標と比較
    cy.get("[data-cy=\"component_property-in_out_files-panel_title\"]").click();
    cy.get("[data-cy=\"component_property-input_files-list_form\"]").contains("run*")
      .click();
    cy.get("[data-cy=\"list_form_property-edit-text_field\"]").find("input")
      .clear()
      .type("while1-run{enter}"); //inputFileの値を変更
    cy.closeProperty();
    cy.get("[data-cy=\"workflow-play-btn\"]").click(); //実行する
    cy.checkProjectStatus("finished");
    cy.clickComponentName(WORKFLOW_NAME_1);
    cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("while1-run")
      .should("exist")
      .click();
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("run-a.sh")
      .should("exist");
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("run-b.sh")
      .should("exist");
  });

  /**
 コンポーネントの基本機能動作確認
 Workflowコンポーネント共通機能確認
 ファイル転送設定の各パターンの確認
 シンポリックリンク確認（input filesが’/’で終わる文字列のとき）
 試験確認内容：シンポリックリンクが作成されていることを確認
   */
  it("04-01-262:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-シンポリックリンク確認（input filesが’/’で終わる文字列のとき）-シンポリックリンクが作成されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    //Workflow0
    cy.createDirOrFile(TYPE_FILE, "run-a.sh", true);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, "run-a.sh", true, true);
    //Workflow1
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_1, 300, 600);
    cy.clickComponentName(WORKFLOW_NAME_1);
    cy.connectComponent(WORKFLOW_NAME_1); //コンポーネント同士を接続
    cy.checkConnectionLine(WORKFLOW_NAME_0, WORKFLOW_NAME_1); //作成したコンポーネントの座標を取得して接続線の座標と比較
    cy.get("[data-cy=\"component_property-in_out_files-panel_title\"]").click();
    cy.get("[data-cy=\"component_property-input_files-list_form\"]").contains("run-a.sh")
      .click();
    cy.get("[data-cy=\"list_form_property-edit-text_field\"]").find("input")
      .clear()
      .type("while1-run/{enter}"); //inputFileの値を変更
    cy.closeProperty();
    cy.get("[data-cy=\"workflow-play-btn\"]").click(); //実行する
    cy.checkProjectStatus("finished");
    cy.clickComponentName(WORKFLOW_NAME_1);
    cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("while1-run")
      .should("exist")
      .click();
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("run-a.sh")
      .should("exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除ボタン表示確認（input file）
  試験確認内容：削除ボタンが表示されることを確認
   */
  it("04-01-263:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除ボタン表示確認（input file）-削除ボタンが表示されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, "testInputFile", true, true);
    cy.get("[data-cy=\"action_row-delete-btn\"]").should("be.visible");
  });

  /**
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除ボタン表示確認（output file）
  試験確認内容：削除ボタンが表示されることを確認
   */
  it("04-01-264:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除ボタン表示確認（output file）-削除ボタンが表示されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, "testOutputFile", true, true);
    cy.get("[data-cy=\"action_row-delete-btn\"]").should("be.visible");
  });

  /**
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除反映確認（input file）
  試験確認内容：input fileが削除されていることを確認
   */
  it("04-01-265:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除反映確認（input file）-input fileが削除されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, "testInputFile", true, true);
    cy.get("[data-cy=\"action_row-delete-btn\"]").click();
    cy.get("[data-cy=\"graph-component-row\"]").contains("testInputFile")
      .should("not.exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除反映確認（output file）
  試験確認内容：output fileが削除されていることを確認
   */
  it("04-01-266:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除反映確認（output file）-output fileが削除されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, "testOutputFile", true, true);
    cy.get("[data-cy=\"action_row-delete-btn\"]").click();
    cy.get("[data-cy=\"graph-component-row\"]").contains("testOutputFile")
      .should("not.exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ単体表示
  試験確認内容：ディレクトリが単体表示されることを確認
   */
  it("04-01-267:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ単体表示-ディレクトリが単体表示されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, "test-a", true);
    cy.createDirOrFile(TYPE_DIR, "test-b", false);
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-a")
      .should("exist");
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-b")
      .should("exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ複数表示（リロード前）
  試験確認内容：ディレクトリが単体表示されることを確認
   */
  it("04-01-268:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ複数表示（リロード前）-ディレクトリが単体表示されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, "test1", true);
    cy.createDirOrFile(TYPE_DIR, "test2", false);
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test1")
      .should("exist");
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test2")
      .should("exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ複数表示（リロード後）
  試験確認内容：ディレクトリが複数表示されることを確認
   */
  it("04-01-269:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ複数表示（リロード後）-ディレクトリが複数表示されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, "test1", true);
    cy.createDirOrFile(TYPE_DIR, "test2", false);
    cy.closeProperty();
    cy.clickComponentName(WORKFLOW_NAME_0);
    cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test*")
      .should("exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  ファイル操作エリア
  ファイル単体表示
  試験確認内容：ファイルが単体表示されることを確認
   */
  it("04-01-270:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-ファイル操作エリア-ファイル単体表示-ファイルが単体表示されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, "test-a", true);
    cy.createDirOrFile(TYPE_FILE, "test-b", false);
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-a")
      .should("exist");
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-b")
      .should("exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  ファイル操作エリア
  ファイル複数表示（リロード前）
  試験確認内容：ファイルが単体表示されることを確認
   */
  it("04-01-271:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-ファイル操作エリア-ファイル複数表示（リロード前）-ファイルが単体表示されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, "test1", true);
    cy.createDirOrFile(TYPE_FILE, "test2", false);
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test1")
      .should("exist");
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test2")
      .should("exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  ファイル操作エリア
  ファイル複数表示（リロード後）
  試験確認内容：ファイルが複数表示されることを確認
   */
  it("04-01-272:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-ファイル操作エリア-ファイル複数表示（リロード後）-ファイルが複数表示されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, "test1", true);
    cy.createDirOrFile(TYPE_FILE, "test2", false);
    cy.closeProperty();
    cy.clickComponentName(WORKFLOW_NAME_0);
    cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test*")
      .should("exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ディレクトリ表示
  試験確認内容：ディレクトリ内にディレクトリが作成されることを確認
   */
  it("04-01-273:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ内ディレクトリ表示-ディレクトリ内にディレクトリが作成されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
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
  Workflowコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ファイル表示
  試験確認内容：ディレクトリ内にファイルが作成されることを確認
   */
  it("04-01-274:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ内ファイル表示-ディレクトリ内にファイルが作成されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, "test-a", true);
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-a")
      .click();
    cy.createDirOrFile(TYPE_FILE, "test.txt", false);
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test.txt")
      .should("exist");
  });

  /**
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  各コンポーネントの追加/削除確認
  該当コンポーネント削除確認
  試験確認内容：コンポーネントが削除されていることを確認
   */
  it("04-01-275:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-各コンポーネントの追加/削除確認-該当コンポーネント削除確認-コンポーネントが削除されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    cy.deleteComponent(WORKFLOW_NAME_0);
    cy.get("[data-cy=\"graph-component-row\"]").contains(WORKFLOW_NAME_0)
      .should("not.exist");
  });
});
