describe("04:コンポーネントの基本機能動作確認", () => {
  const wheelPath = Cypress.env("WHEEL_PATH")
  const PROJECT_NAME = "TestProject"
  const PROJECT_DESCRIPTION = "TestDescription"
  const TYPE_INPUT = "input"
  const TYPE_OUTPUT = "output"
  const TYPE_DIR = "dir"
  const TYPE_FILE = "file"
  const DEF_COMPONENT_TASK = "task"
  const DEF_COMPONENT_IF = "if"
  const DEF_COMPONENT_FOR = "for"
  const DEF_COMPONENT_WHILE = "while"
  const DEF_COMPONENT_FOREACH = "foreach"
  const DEF_COMPONENT_PS = "parameterStudy"
  const DEF_COMPONENT_WORKFLOW = "workflow"
  const DEF_COMPONENT_STORAGE = "storage"
  const DEF_COMPONENT_SOURCE = "source"
  const DEF_COMPONENT_VIEWER = "viewer"
  const DEF_COMPONENT_STEPJOB = "stepjob"
  const DEF_COMPONENT_BJ_TASK = "bulkjobTask"
  const DEF_COMPONENT_STEPJOB_TASK = "stepjobTask"
  const TASK_NAME_0 = "task0"
  const IF_NAME_0 = "if0"
  const FOR_NAME_0 = "for0"
  const WHILE_NAME_0 = "while0"
  const FOREACH_NAME_0 = "foreach0"
  const PS_NAME_0 = "PS0"
  const WORKFLOW_NAME_0 = "workflow0"
  const STORAGE_NAME_0 = "storage0"
  const SOURCE_NAME_0 = "source0"
  const VIEWER_NAME_0 = "viewer0"
  const STEPJOB_NAME_0 = "stepjob0"
  const BJ_TASK_NAME_0 = "bjTask0"
  const STEPJOB_TASK_NAME_0 = "sjTask0"
  const IF_NAME_1 = "if1"
  const FOR_NAME_1 = "for1"
  const WHILE_NAME_1 = "while1"
  const FOREACH_NAME_1 = "foreach1"
  const PS_NAME_1 = "PS1"
  const WORKFLOW_NAME_1 = "workflow1"
  const STORAGE_NAME_1 = "storage1"
  const STEPJOB_NAME_1 = "stepjob1"
  const BJ_TASK_NAME_1 = "bjTask1"
  const STEPJOB_TASK_NAME_1 = "sjTask1"
  const TAG_TYPE_INPUT = "input"
  const TAG_TYPE_TEXT_AREA = "textarea"

  beforeEach(() => {
    cy.createProject(PROJECT_NAME, PROJECT_DESCRIPTION);
    cy.openProject();
    cy.viewport("macbook-16");
  })

  afterEach(() => {
    cy.removeAllProjects();
  })

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  試験確認内容：プロパティが表示されることを確認
  */
  it("04-01-001:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-プロパティが表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-property-navigation_drawer"]';
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  試験確認内容：name入力テキストエリアが表示されていることを確認
  */
  it("04-01-002:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-name入力テキストエリアが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-name-text_field"]'
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  name入力
  試験確認内容：nameが入力できることを確認
  */
  it("04-01-003:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-name入力-nameが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    const INPUT_OBJ_CY = '[data-cy="component_property-name-text_field"]';
    cy.confirmInputValueReflection(INPUT_OBJ_CY, '-Test_Task', TAG_TYPE_INPUT);
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  name入力（使用可能文字確認）
  試験確認内容：nameが入力できないことを確認
  */
  it("04-01-004:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-name入力（使用可能文字確認）-nameが入力できないことを確認", () => {
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    const INPUT_OBJ_CY = '[data-cy="component_property-name-text_field"]';
    cy.confirmInputValueNotReflection(INPUT_OBJ_CY, 'Test*Task', TAG_TYPE_INPUT);
  });

  /** 
   コンポーネントの基本機能動作確認
   ifコンポーネント共通機能確認
   試験確認内容：説明入力テキストエリアが表示されていることを確認
   */
  it("04-01-005:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-description入力テキストエリアが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-description-textarea"]'
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  description入力
  試験確認内容：descriptionが入力できることを確認
  */
  it("04-01-006:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-description入力-descriptionが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    const INPUT_OBJ_CY = '[data-cy="component_property-description-textarea"]';
    cy.confirmInputValueReflection(INPUT_OBJ_CY, 'descriptionTest', TAG_TYPE_TEXT_AREA);
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  input files表示
  試験確認内容：input files入力テキストエリアが表示されていることを確認
  */
  it("04-01-007:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-input files表示-input files入力テキストエリアが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-input_files-list_form"]';
    const CLICK_AREA_CY = '[data-cy="component_property-in_out_files-panel_title"]';
    cy.confirmDisplayInPropertyByDetailsArea(DATA_CY_STR, CLICK_AREA_CY, null);
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  input files入力
  試験確認内容：input filesが入力できることを確認
  */
  it("04-01-008:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-input files入力-input filesが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true, false);
    cy.get('[data-cy="component_property-input_files-list_form"]').find('input').should('have.value', 'testInputFile');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  input files反映確認
  試験確認内容：input filesが反映されることを確認
  */
  it("04-01-009:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-input files反映確認-input filesが反映されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true, true);
    cy.get('[data-cy="graph-component-row"]').contains('testInputFile').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  output files表示
  試験確認内容：output files入力テキストエリアが表示されていることを確認
  */
  it("04-01-0010:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-output files表示-output files入力テキストエリアが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-output_files-list_form"]';
    const CLICK_AREA_CY = '[data-cy="component_property-in_out_files-panel_title"]';
    cy.confirmDisplayInPropertyByDetailsArea(DATA_CY_STR, CLICK_AREA_CY, null);
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  output files入力
  試験確認内容：output filesが入力できることを確認
  */
  it("04-01-011:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-output files入力-output filesが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, false);
    cy.get('[data-cy="component_property-output_files-list_form"]').find('input').should('have.value', 'testOutputFile');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  output files反映確認
  試験確認内容：output filesが反映されることを確認
  */
  it("04-01-012:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-output files反映確認-output filesが反映されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, true);
    cy.get('[data-cy="graph-component-row"]').contains('testOutputFile').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  構成要素の機能確認
  closeボタン押下
  試験確認内容：プロパティが表示されていないことを確認
  */
  it("04-01-013:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-構成要素の機能確認-closeボタン押下-プロパティが表示されていないことを確認", () => {
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    cy.closeProperty();
    cy.get('[data-cy="component_property-property-navigation_drawer"]').should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  構成要素の機能確認
  cleanボタン押下
  試験確認内容：最新の保存状態に戻っていることを確認
  */
  it.skip("04-01-014:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-構成要素の機能確認-cleanボタン押下-最新の保存状態に戻っていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test-a', true);
    cy.get('[data-cy="component_property-condition-setting_title"]').click();
    let targetDropBoxCy = '[data-cy="component_property-condition_use_javascript-autocomplete"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 3, 'test-a');
    cy.saveProperty();
    cy.get('[data-cy="workflow-play-btn"]').click();
    cy.clickComponentName(IF_NAME_0);
    cy.get('[data-cy="component_property-name-text_field"]').find('input').clear();
    cy.get('[data-cy="component_property-name-text_field"]').type('changeName');
    cy.get('[data-cy="component_property-description-textarea"]').find('textarea').focus();
    cy.get('[data-cy="component_property-clean-btn"]').click();
    cy.get('[data-cy="component_property-name-text_field"]').find('input').should('have.value', 'test-a');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  接続確認
  試験確認内容：コンポーネントが接続されていることを確認
  */
  it("04-01-016:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-ファイル転送設定の各パターンの確認-接続確認-コンポーネントが接続されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, true);
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_1, 300, 600);
    cy.connectComponent(IF_NAME_1);  // コンポーネント同士を接続
    cy.checkConnectionLine(IF_NAME_0, IF_NAME_1);  // 作成したコンポーネントの座標を取得して接続線の座標と比較
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  シンポリックリンク確認（outputFile、inputFile一致）
  試験確認内容：シンポリックリンクが作成されていることを確認
  */
  it("04-01-017:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-ファイル転送設定の各パターンの確認-シンポリックリンク確認（outputFile、inputFile一致）-シンポリックリンクが作成されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    // if0
    cy.createDirOrFile(TYPE_FILE, 'run.sh', true);
    cy.get('[data-cy="component_property-condition-setting_title"]').click();
    let targetDropBoxCy = '[data-cy="component_property-condition_use_javascript-autocomplete"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 3, 'run.sh'); // scritファイル選択
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'run.sh', true, true);
    // if1
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_1, 300, 600);
    cy.createDirOrFile(TYPE_FILE, 'test-b', true);
    cy.get('[data-cy="component_property-condition-setting_title"]').click();
    cy.selectValueFromDropdownList(targetDropBoxCy, 3, 'test-b'); // scritファイル選択
    cy.enterInputOrOutputFile(TYPE_INPUT, 'run.sh', true, true);
    cy.clickComponentName(IF_NAME_1);
    cy.connectComponent(IF_NAME_1);  // コンポーネント同士を接続
    cy.get('[data-cy="workflow-play-btn"]').click(); // 実行する
    cy.checkProjectStatus("finished");
    cy.clickComponentName(IF_NAME_1);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('run.sh').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  シンポリックリンク確認（outputFileが通常、inputFileが空白）
  試験確認内容：シンポリックリンクが作成されていることを確認
  */
  it("04-01-018:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-ファイル転送設定の各パターンの確認-シンポリックリンク確認（outputFileが通常、inputFileが空白）-シンポリックリンクが作成されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    // if0
    cy.createDirOrFile(TYPE_FILE, 'run.sh', true);
    cy.get('[data-cy="component_property-condition-setting_title"]').click();
    let targetDropBoxCy = '[data-cy="component_property-condition_use_javascript-autocomplete"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 3, 'run.sh'); // scritファイル選択
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'run.sh', true, true);
    // if1
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_1, 300, 600);
    cy.createDirOrFile(TYPE_FILE, 'test-b', true);
    cy.get('[data-cy="component_property-condition-setting_title"]').click();
    cy.selectValueFromDropdownList(targetDropBoxCy, 3, 'test-b'); // scritファイル選択
    cy.clickComponentName(IF_NAME_1);
    cy.connectComponent(IF_NAME_1);  // コンポーネント同士を接続
    cy.get('[data-cy="workflow-play-btn"]').click(); // 実行する
    cy.checkProjectStatus("finished");
    cy.clickComponentName(IF_NAME_1);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('run.sh').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  シンポリックリンク確認（outputFileが通常、inputFileが「/」で終わらない文字列）
  試験確認内容：シンポリックリンクが作成されていることを確認
  */
  it("04-01-019:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-ファイル転送設定の各パターンの確認-シンポリックリンク確認（outputFileが通常、inputFileが「/」で終わらない文字列）-シンポリックリンクが作成されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    // if0
    cy.createDirOrFile(TYPE_FILE, 'run.sh', true);
    cy.get('[data-cy="component_property-condition-setting_title"]').click();
    let targetDropBoxCy = '[data-cy="component_property-condition_use_javascript-autocomplete"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 3, 'run.sh'); // scritファイル選択
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'run.sh', true, true);
    // if1
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_1, 300, 600);
    cy.createDirOrFile(TYPE_FILE, 'test-b', true);
    cy.get('[data-cy="component_property-condition-setting_title"]').click();
    cy.selectValueFromDropdownList(targetDropBoxCy, 3, 'test-b'); // scritファイル選択
    cy.clickComponentName(IF_NAME_1);
    cy.connectComponent(IF_NAME_1);  // コンポーネント同士を接続
    cy.get('[data-cy="component_property-in_out_files-panel_title"]').click();
    cy.get('[data-cy="component_property-input_files-list_form"]').contains('run.sh').click();
    cy.get('[data-cy="list_form_property-edit-text_field"]').find('input').clear().type('if1.sh{enter}'); // inputFileの値を変更
    cy.closeProperty();
    cy.get('[data-cy="workflow-play-btn"]').click(); // 実行する
    cy.checkProjectStatus("finished");
    cy.clickComponentName(IF_NAME_1);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('if1.sh').should('exist');   
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  シンポリックリンク確認（outputFileがglob(*や\?など)を含むパス、inputFileが「/」で終わらない文字列）
  試験確認内容：シンポリックリンクが作成されていることを確認
  */
  it("04-01-020:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-ファイル転送設定の各パターンの確認-シンポリックリンク確認（outputFileがglob(*や\?など)を含むパス、inputFileが「/」で終わらない文字列）-シンポリックリンクが作成されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    // task0
    cy.createDirOrFile(TYPE_FILE, 'run-a.sh', true);
    cy.createDirOrFile(TYPE_FILE, 'run-b.sh', false);
    cy.get('[data-cy="component_property-condition-setting_title"]').click();
    let targetDropBoxCy = '[data-cy="component_property-condition_use_javascript-autocomplete"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 3, 'run-a.sh'); // scritファイル選択
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'run*', true, true);
    // task1
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_1, 300, 600);
    cy.createDirOrFile(TYPE_FILE, 'test-b', true);
    cy.get('[data-cy="component_property-condition-setting_title"]').click();
    cy.selectValueFromDropdownList(targetDropBoxCy, 3, 'test-b'); // scritファイル選択
    cy.clickComponentName(IF_NAME_1);
    cy.connectComponent(IF_NAME_1);  // コンポーネント同士を接続
    cy.clickComponentName(IF_NAME_1);
    cy.get('[data-cy="component_property-in_out_files-panel_title"]').click();
    cy.get('[data-cy="component_property-input_files-list_form"]').contains('run*').click();
    cy.get('[data-cy="list_form_property-edit-text_field"]').find('input').clear().type('task1-run{enter}'); // inputFileの値を変更
    cy.closeProperty();
    cy.get('[data-cy="workflow-play-btn"]').click() // コンポーネントを実行する
    cy.checkProjectStatus("finished")
    cy.clickComponentName(IF_NAME_1);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('task1-run').should('exist').click();   
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('run-a.sh').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('run-b.sh').should('exist'); 
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  シンポリックリンク確認（input filesが’/’で終わる文字列のとき）
  試験確認内容：シンポリックリンクが作成されていることを確認
  */
  it("04-01-021:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-ファイル転送設定の各パターンの確認-シンポリックリンク確認（input filesが’/’で終わる文字列のとき）-シンポリックリンクが作成されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    // task0
    cy.createDirOrFile(TYPE_FILE, 'run-a.sh', true);
    cy.get('[data-cy="component_property-condition-setting_title"]').click();
    let targetDropBoxCy = '[data-cy="component_property-condition_use_javascript-autocomplete"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 3, 'run-a.sh'); // scritファイル選択
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'run-a.sh', true, true);
    // task1
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_1, 300, 600);
    cy.createDirOrFile(TYPE_FILE, 'test-b', true);
    cy.get('[data-cy="component_property-condition-setting_title"]').click();
    cy.selectValueFromDropdownList(targetDropBoxCy, 3, 'test-b'); // scritファイル選択
    cy.clickComponentName(IF_NAME_1);
    cy.connectComponent(IF_NAME_1);  // コンポーネント同士を接続
    cy.clickComponentName(IF_NAME_1);
    cy.get('[data-cy="component_property-in_out_files-panel_title"]').click();
    cy.get('[data-cy="component_property-input_files-list_form"]').contains('run-a.sh').click();
    cy.get('[data-cy="list_form_property-edit-text_field"]').find('input').clear().type('task1-run/{enter}'); // inputFileの値を変更
    cy.closeProperty();
    cy.get('[data-cy="workflow-play-btn"]').click(); // コンポーネントを実行する
    cy.checkProjectStatus("finished");
    cy.clickComponentName(IF_NAME_1);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('task1-run').should('exist').click();   
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('run-a.sh').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除ボタン表示確認（input file）
  試験確認内容：削除ボタンが表示されることを確認
  */
  it("04-01-022:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除ボタン表示確認（input file）-削除ボタンが表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true, true);
    cy.get('[data-cy="action_row-delete-btn"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除ボタン表示確認（output file）
  試験確認内容：削除ボタンが表示されることを確認
  */
  it("04-01-023:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除ボタン表示確認（output file）-削除ボタンが表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, true);
    cy.get('[data-cy="action_row-delete-btn"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除反映確認（input file）
  試験確認内容：input fileが削除されていることを確認
  skip:issue#942
  */
  it.skip("04-01-024:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除反映確認（input file）-input fileが削除されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true, true);
    cy.get('[data-cy="action_row-delete-btn"]').click();
    cy.get('[data-cy="graph-component-row"]').contains('testInputFile').should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除反映確認（output file）
  試験確認内容：output fileが削除されていることを確認
  skip:issue#942
  */
  it.skip("04-01-025:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除反映確認（output file）-output fileが削除されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, true);
    cy.get('[data-cy="action_row-delete-btn"]').click();
    cy.get('[data-cy="graph-component-row"]').contains('testOutputFile').should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ単体表示
  試験確認内容：ディレクトリが単体表示されることを確認
  */
  it("04-01-026:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ単体表示-ディレクトリが単体表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test-a', true);
    cy.createDirOrFile(TYPE_DIR, 'test-b', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-b').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ複数表示（リロード前）
  試験確認内容：ディレクトリが単体表示されることを確認
  */
  it("04-01-027:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ複数表示（リロード前）-ディレクトリが単体表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test1', true);
    cy.createDirOrFile(TYPE_DIR, 'test2', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test1').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test2').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ複数表示（リロード後）
  試験確認内容：ディレクトリが複数表示されることを確認
  */
  it("04-01-028:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ複数表示（リロード後）-ディレクトリが複数表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test1', true);
    cy.createDirOrFile(TYPE_DIR, 'test2', false);
    cy.closeProperty();
    cy.clickComponentName(IF_NAME_0);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test*').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  ファイル操作エリア
  ファイル単体表示
  試験確認内容：ファイルが単体表示されることを確認
  */
  it("04-01-029:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-ファイル操作エリア-ファイル単体表示-ファイルが単体表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test-a', true);
    cy.createDirOrFile(TYPE_FILE, 'test-b', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-b').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  ファイル操作エリア
  ファイル複数表示（リロード前）
  試験確認内容：ファイルが単体表示されることを確認
  */
  it("04-01-030:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-ファイル操作エリア-ファイル複数表示（リロード前）-ファイルが単体表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test1', true);
    cy.createDirOrFile(TYPE_FILE, 'test2', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test1').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test2').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  ファイル操作エリア
  ファイル複数表示（リロード後）
  試験確認内容：ファイルが複数表示されることを確認
  */
  it("04-01-031:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-ファイル操作エリア-ファイル複数表示（リロード後）-ファイルが複数表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test1', true);
    cy.createDirOrFile(TYPE_FILE, 'test2', false);
    cy.closeProperty();
    cy.clickComponentName(IF_NAME_0);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test*').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ディレクトリ表示
  試験確認内容：ディレクトリ内にディレクトリが作成されることを確認
  */
  it("04-01-032:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ内ディレクトリ表示-ディレクトリ内にディレクトリが作成されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test-a', true);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').click();
    cy.createDirOrFile(TYPE_DIR, 'test-b', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-b').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ファイル表示
  試験確認内容：ディレクトリ内にファイルが作成されることを確認
  */
  it("04-01-033:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ内ファイル表示-ディレクトリ内にファイルが作成されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test-a', true);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').click();
    cy.createDirOrFile(TYPE_FILE, 'test.txt', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test.txt').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  プロパティ設定確認
  シェルスクリプト選択セレクトボックス表示確認
  試験確認内容：シェルスクリプト選択セレクトボックスが表示されていることを確認
  */
  it("04-01-034:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-プロパティ設定確認-シェルスクリプト選択セレクトボックス表示確認-シェルスクリプト選択セレクトボックスが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-condition-setting_title"]').click();
    cy.get('[data-cy="component_property-condition_use_javascript-autocomplete"]').find('input').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  プロパティ設定確認
  シェルスクリプト選択セレクトボックス選択確認
  試験確認内容：選択した値が表示されていることを確認
  */
  it("04-01-035:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-プロパティ設定確認-シェルスクリプト選択セレクトボックス選択確認-選択した値が表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test-a', true);
    cy.get('[data-cy="component_property-condition-setting_title"]').click();
    let targetDropBoxCy = '[data-cy="component_property-condition_use_javascript-autocomplete"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 3, 'test-a');
    cy.get('[data-cy="component_property-condition_use_javascript-autocomplete"]').find('input').should('have.value', 'test-a');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  プロパティ設定確認
  シェルスクリプト選択セレクトボックス選択反映確認
  試験確認内容：選択した値が表示されていることを確認
  */
  it("04-01-036:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-プロパティ設定確認-シェルスクリプト選択セレクトボックス選択反映確認-選択した値が反映されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test-a', true);
    cy.get('[data-cy="component_property-condition-setting_title"]').click();
    let targetDropBoxCy = '[data-cy="component_property-condition_use_javascript-autocomplete"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 3, 'test-a');
    cy.closeProperty();
    cy.clickComponentName(IF_NAME_0);
    cy.get('[data-cy="component_property-condition-setting_title"]').click();
    cy.get('[data-cy="component_property-condition_use_javascript-autocomplete"]').contains('test-a').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  プロパティ設定確認
  javascriptテキストボックス表示確認
  試験確認内容：javascriptテキストボックスが表示されていることを確認
  */
  it("04-01-037:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-プロパティ設定確認-javascriptテキストボックス表示確認-javascriptテキストボックスが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-condition-setting_title"]').click();
    cy.get('[data-cy="component_property-condition_use_javascript-switch"]').click();
    cy.get('[data-cy="component_property-condition_use_javascript-textarea"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  プロパティ設定確認
  javascriptテキストボックス入力確認
  試験確認内容：入力した値が表示されていることを確認
  */
  it("04-01-038:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-プロパティ設定確認-javascriptテキストボックス入力確認-入力した値が表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-condition-setting_title"]').click();
    cy.get('[data-cy="component_property-condition_use_javascript-switch"]').click();
    cy.get('[data-cy="component_property-condition_use_javascript-textarea"]').type('testJavaScript');
    cy.get('[data-cy="component_property-condition_use_javascript-textarea"]').find('textarea').should('have.value', 'testJavaScript');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  プロパティ設定確認
  javascriptテキストボックス反映確認
  試験確認内容：入力した値が反映されていることを確認
  */
  it("04-01-039:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-プロパティ設定確認-javascriptテキストボックス反映確認-入力した値が反映されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-condition-setting_title"]').click();
    cy.get('[data-cy="component_property-condition_use_javascript-switch"]').click();
    cy.get('[data-cy="component_property-condition_use_javascript-textarea"]').type('testJavaScript');
    cy.closeProperty();
    cy.clickComponentName(IF_NAME_0);
    cy.get('[data-cy="component_property-condition-setting_title"]').click();
    cy.get('[data-cy="component_property-condition_use_javascript-textarea"]').find('textarea').should('have.value', 'testJavaScript');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  各コンポーネントの追加/削除確認
  該当コンポーネント削除確認
  試験確認内容：コンポーネントが削除されていることを確認
  */
  it("04-01-040:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-各コンポーネントの追加/削除確認-該当コンポーネント削除確認-コンポーネントが削除されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    cy.deleteComponent(IF_NAME_0);
    cy.get('[data-cy="graph-component-row"]').contains(IF_NAME_0).should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  試験確認内容：プロパティが表示されることを確認
  */
  it("04-01-041:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-プロパティが表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-property-navigation_drawer"]';
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  試験確認内容：name入力テキストエリアが表示されていることを確認
  */
  it("04-01-042:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-name入力テキストエリアが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-name-text_field"]'
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  name入力
  試験確認内容：nameが入力できることを確認
  */
  it("04-01-043:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-name入力-nameが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    const INPUT_OBJ_CY = '[data-cy="component_property-name-text_field"]';
    cy.confirmInputValueReflection(INPUT_OBJ_CY, '-Test_Task', TAG_TYPE_INPUT);
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  name入力（使用可能文字確認）
  試験確認内容：nameが入力できないことを確認
  */
  it("04-01-044:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-name入力（使用可能文字確認）-nameが入力できないことを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    const INPUT_OBJ_CY = '[data-cy="component_property-name-text_field"]';
    cy.confirmInputValueNotReflection(INPUT_OBJ_CY, 'Test*Task', TAG_TYPE_INPUT);
  });

  /** 
    コンポーネントの基本機能動作確認
    forコンポーネント共通機能確認
    試験確認内容：説明入力テキストエリアが表示されていることを確認
    */
  it("04-01-045:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-description入力テキストエリアが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-description-textarea"]'
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  description入力
  試験確認内容：descriptionが入力できることを確認
  */
  it("04-01-046:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-description入力-descriptionが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    const INPUT_OBJ_CY = '[data-cy="component_property-description-textarea"]';
    cy.confirmInputValueReflection(INPUT_OBJ_CY, 'descriptionTest', TAG_TYPE_TEXT_AREA);
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  input files表示
  試験確認内容：input files入力テキストエリアが表示されていることを確認
  */
  it("04-01-047:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-input files表示-input files入力テキストエリアが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-input_files-list_form"]';
    const CLICK_AREA_CY = '[data-cy="component_property-in_out_files-panel_title"]';
    cy.confirmDisplayInPropertyByDetailsArea(DATA_CY_STR, CLICK_AREA_CY, null);
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  input files入力
  試験確認内容：input filesが入力できることを確認
  */
  it("04-01-048:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-input files入力-input filesが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true, false);
    cy.get('[data-cy="component_property-input_files-list_form"]').find('input').should('have.value', 'testInputFile');
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  input files反映確認
  試験確認内容：input filesが反映されることを確認
  */
  it("04-01-049:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-input files反映確認-input filesが反映されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true, true);
    cy.get('[data-cy="graph-component-row"]').contains('testInputFile').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  output files表示
  試験確認内容：output files入力テキストエリアが表示されていることを確認
  */
  it("04-01-050:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-output files表示-output files入力テキストエリアが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-output_files-list_form"]';
    const CLICK_AREA_CY = '[data-cy="component_property-in_out_files-panel_title"]';
    cy.confirmDisplayInPropertyByDetailsArea(DATA_CY_STR, CLICK_AREA_CY, null);
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  output files入力
  試験確認内容：output filesが入力できることを確認
  */
  it("04-01-051:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-output files入力-output filesが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, false);
    cy.get('[data-cy="component_property-output_files-list_form"]').find('input').should('have.value', 'testOutputFile');
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  output files反映確認
  試験確認内容：output filesが反映されることを確認
  */
  it("04-01-052:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-output files反映確認-output filesが反映されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, true);
    cy.get('[data-cy="graph-component-row"]').contains('testOutputFile').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  構成要素の機能確認
  closeボタン押下
  試験確認内容：プロパティが表示されていないことを確認
  */
  it("04-01-053:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-構成要素の機能確認-closeボタン押下-プロパティが表示されていないことを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    cy.closeProperty();
    cy.get('[data-cy="component_property-property-navigation_drawer"]').should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  構成要素の機能確認
  cleanボタン押下
  試験確認内容：最新の保存状態に戻っていることを確認
  */
  it.skip("04-01-054:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-構成要素の機能確認-cleanボタン押下-最新の保存状態に戻っていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test-a', true);
    cy.get('[data-cy="component_property-loop_set_for-panel_title"]').click();
    cy.get('[data-cy="component_property-start_for-text_field"]').type('1');
    cy.get('[data-cy="component_property-end_for-text_field"]').type('5');
    cy.get('[data-cy="component_property-step_for-text_field"]').type('5');
    cy.get('[data-cy="workflow-play-btn"]').click();
    cy.clickComponentName(FOR_NAME_0);
    cy.get('[data-cy="component_property-name-text_field"]').find('input').clear();
    cy.get('[data-cy="component_property-name-text_field"]').type('changeName');
    cy.get('[data-cy="component_property-description-textarea"]').find('textarea').focus();
    cy.get('[data-cy="component_property-clean-btn"]').click();
    cy.get('[data-cy="component_property-name-text_field"]').find('input').should('have.value', 'test-a');
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  接続確認
  試験確認内容：コンポーネントが接続されていることを確認
  */
  it("04-01-056:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-ファイル転送設定の各パターンの確認-接続確認-コンポーネントが接続されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, true);
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_1, 300, 600);
    cy.connectComponent(FOR_NAME_1);  // コンポーネント同士を接続
    cy.checkConnectionLine(FOR_NAME_0, FOR_NAME_1);  // 作成したコンポーネントの座標を取得して接続線の座標と比較
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  シンポリックリンク確認（outputFile、inputFile一致）
  試験確認内容：シンポリックリンクが作成されていることを確認
  */
  it("04-01-057:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-ファイル転送設定の各パターンの確認-シンポリックリンク確認（outputFile、inputFile一致）-シンポリックリンクが作成されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'run.sh', true, true);
    cy.createDirOrFile(TYPE_FILE, 'run.sh', true);
    cy.get('[data-cy="component_property-loop_set_for-panel_title"]').click();
    cy.get('[data-cy="component_property-start_for-text_field"]').type('1');
    cy.get('[data-cy="component_property-end_for-text_field"]').type('5');
    cy.get('[data-cy="component_property-step_for-text_field"]').type('5');
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_1, 300, 600);
    cy.enterInputOrOutputFile(TYPE_INPUT, 'run.sh', true, true);
    cy.get('[data-cy="component_property-loop_set_for-panel_title"]').click();
    cy.get('[data-cy="component_property-start_for-text_field"]').type('1');
    cy.get('[data-cy="component_property-end_for-text_field"]').type('5');
    cy.get('[data-cy="component_property-step_for-text_field"]').type('5');
    cy.connectComponent(FOR_NAME_1);  // コンポーネント同士を接続
    cy.get('[data-cy="workflow-play-btn"]').click(); // 実行する
    cy.checkProjectStatus("finished");
    cy.clickComponentName(FOR_NAME_1);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('run.sh').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  シンポリックリンク確認（outputFileが通常、inputFileが空白）
  試験確認内容：シンポリックリンクが作成されていることを確認
  */
  it("04-01-058:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-ファイル転送設定の各パターンの確認-シンポリックリンク確認（outputFileが通常、inputFileが空白）-シンポリックリンクが作成されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'run.sh', true, true);
    cy.createDirOrFile(TYPE_FILE, 'run.sh', true);
    cy.get('[data-cy="component_property-loop_set_for-panel_title"]').click();
    cy.get('[data-cy="component_property-start_for-text_field"]').type('1');
    cy.get('[data-cy="component_property-end_for-text_field"]').type('5');
    cy.get('[data-cy="component_property-step_for-text_field"]').type('5');
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_1, 400, 700);
    cy.get('[data-cy="component_property-loop_set_for-panel_title"]').click();
    cy.get('[data-cy="component_property-start_for-text_field"]').type('1');
    cy.get('[data-cy="component_property-end_for-text_field"]').type('5');
    cy.get('[data-cy="component_property-step_for-text_field"]').type('5');
    cy.clickComponentName(FOR_NAME_1);
    cy.connectComponent(FOR_NAME_1);  // コンポーネント同士を接続
    cy.get('[data-cy="workflow-play-btn"]').click(); // 実行する
    cy.checkProjectStatus("finished");
    cy.clickComponentName(FOR_NAME_1);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('run.sh').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  シンポリックリンク確認（outputFileが通常、inputFileが「/」で終わらない文字列）
  試験確認内容：シンポリックリンクが作成されていることを確認
  */
  it("04-01-059:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-ファイル転送設定の各パターンの確認-シンポリックリンク確認（outputFileが通常、inputFileが「/」で終わらない文字列）-シンポリックリンクが作成されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'run.sh', true, true);
    cy.createDirOrFile(TYPE_FILE, 'run.sh', true);
    cy.get('[data-cy="component_property-loop_set_for-panel_title"]').click();
    cy.get('[data-cy="component_property-start_for-text_field"]').type('1');
    cy.get('[data-cy="component_property-end_for-text_field"]').type('5');
    cy.get('[data-cy="component_property-step_for-text_field"]').type('5');
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_1, 400, 700);
    cy.get('[data-cy="component_property-loop_set_for-panel_title"]').click();
    cy.get('[data-cy="component_property-start_for-text_field"]').type('1');
    cy.get('[data-cy="component_property-end_for-text_field"]').type('5');
    cy.get('[data-cy="component_property-step_for-text_field"]').type('5');
    cy.clickComponentName(FOR_NAME_1);
    cy.connectComponent(FOR_NAME_1);  // コンポーネント同士を接続
    cy.get('[data-cy="component_property-in_out_files-panel_title"]').click();
    cy.get('[data-cy="component_property-input_files-list_form"]').contains('run.sh').click();
    cy.get('[data-cy="list_form_property-edit-text_field"]').find('input').clear().type('for1.sh{enter}'); // inputFileの値を変更
    cy.closeProperty();
    cy.get('[data-cy="workflow-play-btn"]').click(); // 実行する
    cy.checkProjectStatus("finished");
    cy.clickComponentName(FOR_NAME_1);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('for1.sh').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  シンポリックリンク確認（outputFileがglob(*や\?など)を含むパス、inputFileが「/」で終わらない文字列）
  試験確認内容：シンポリックリンクが作成されていることを確認
  */
  it("04-01-060:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-ファイル転送設定の各パターンの確認-シンポリックリンク確認（outputFileがglob(*や\?など)を含むパス、inputFileが「/」で終わらない文字列）-シンポリックリンクが作成されていることを確認", () => {
    // for0
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'run*', true, true);
    cy.createDirOrFile(TYPE_FILE, 'run-a.sh', true);
    cy.createDirOrFile(TYPE_FILE, 'run-b.sh', false);
    cy.get('[data-cy="component_property-loop_set_for-panel_title"]').click();
    cy.get('[data-cy="component_property-start_for-text_field"]').type('1');
    cy.get('[data-cy="component_property-end_for-text_field"]').type('5');
    cy.get('[data-cy="component_property-step_for-text_field"]').type('5');
    // for1
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_1, 400, 700);
    cy.get('[data-cy="component_property-loop_set_for-panel_title"]').click();
    cy.get('[data-cy="component_property-start_for-text_field"]').type('1');
    cy.get('[data-cy="component_property-end_for-text_field"]').type('5');
    cy.get('[data-cy="component_property-step_for-text_field"]').type('5');
    cy.clickComponentName(FOR_NAME_1);
    cy.connectComponent(FOR_NAME_1);  // コンポーネント同士を接続
    cy.get('[data-cy="component_property-in_out_files-panel_title"]').click();
    cy.get('[data-cy="component_property-input_files-list_form"]').contains('run*').click();
    cy.get('[data-cy="list_form_property-edit-text_field"]').find('input').clear().type('for1-run{enter}'); // inputFileの値を変更
    cy.closeProperty();
    cy.get('[data-cy="workflow-play-btn"]').click(); // 実行する
    cy.checkProjectStatus("finished");
    cy.clickComponentName(FOR_NAME_1);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('for1-run').should('exist').click();   
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('run-a.sh').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('run-b.sh').should('exist'); 
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  シンポリックリンク確認（input filesが’/’で終わる文字列のとき）
  試験確認内容：シンポリックリンクが作成されていることを確認
  */
  it("04-01-061:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-ファイル転送設定の各パターンの確認-シンポリックリンク確認（input filesが’/’で終わる文字列のとき）-シンポリックリンクが作成されていることを確認", () => {
    // for0
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'run-a.sh', true, true);
    cy.createDirOrFile(TYPE_FILE, 'run-a.sh', true);
    cy.get('[data-cy="component_property-loop_set_for-panel_title"]').click();
    cy.get('[data-cy="component_property-start_for-text_field"]').type('1');
    cy.get('[data-cy="component_property-end_for-text_field"]').type('5');
    cy.get('[data-cy="component_property-step_for-text_field"]').type('5');
    // for1
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_1, 400, 700);
    cy.get('[data-cy="component_property-loop_set_for-panel_title"]').click();
    cy.get('[data-cy="component_property-start_for-text_field"]').type('1');
    cy.get('[data-cy="component_property-end_for-text_field"]').type('5');
    cy.get('[data-cy="component_property-step_for-text_field"]').type('5');
    cy.clickComponentName(FOR_NAME_1);
    cy.connectComponent(FOR_NAME_1);  // コンポーネント同士を接続
    cy.get('[data-cy="component_property-in_out_files-panel_title"]').click();
    cy.get('[data-cy="component_property-input_files-list_form"]').contains('run-a.sh').click();
    cy.get('[data-cy="list_form_property-edit-text_field"]').find('input').clear().type('for1-run/{enter}'); // inputFileの値を変更
    cy.closeProperty();
    cy.get('[data-cy="workflow-play-btn"]').click(); // 実行する
    cy.checkProjectStatus("finished");
    cy.clickComponentName(FOR_NAME_1);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('for1-run').should('exist').click();   
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('run-a.sh').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除ボタン表示確認（input file）
  試験確認内容：削除ボタンが表示されることを確認
  */
  it("04-01-062:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除ボタン表示確認（input file）-削除ボタンが表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true, true);
    cy.get('[data-cy="action_row-delete-btn"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除ボタン表示確認（output file）
  試験確認内容：削除ボタンが表示されることを確認
  */
  it("04-01-063:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除ボタン表示確認（output file）-削除ボタンが表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, true);
    cy.get('[data-cy="action_row-delete-btn"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除反映確認（input file）
  試験確認内容：input fileが削除されていることを確認
  skip:issue#942
  */
  it.skip("04-01-064:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除反映確認（input file）-input fileが削除されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true, true);
    cy.get('[data-cy="action_row-delete-btn"]').click();
    cy.get('[data-cy="graph-component-row"]').contains('testInputFile').should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除反映確認（output file）
  試験確認内容：output fileが削除されていることを確認
  skip:issue#942
  */
  it.skip("04-01-065:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除反映確認（output file）-output fileが削除されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, true);
    cy.get('[data-cy="action_row-delete-btn"]').click();
    cy.get('[data-cy="graph-component-row"]').contains('testOutputFile').should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ単体表示
  試験確認内容：ディレクトリが単体表示されることを確認
  */
  it("04-01-066:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ単体表示-ディレクトリが単体表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test-a', true);
    cy.createDirOrFile(TYPE_DIR, 'test-b', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-b').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ複数表示（リロード前）
  試験確認内容：ディレクトリが単体表示されることを確認
  */
  it("04-01-067:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ複数表示（リロード前）-ディレクトリが単体表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test1', true);
    cy.createDirOrFile(TYPE_DIR, 'test2', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test1').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test2').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ複数表示（リロード後）
  試験確認内容：ディレクトリが複数表示されることを確認
  */
  it("04-01-068:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ複数表示（リロード後）-ディレクトリが複数表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test1', true);
    cy.createDirOrFile(TYPE_DIR, 'test2', false);
    cy.closeProperty();
    cy.clickComponentName(FOR_NAME_0);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test*').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  ファイル操作エリア
  ファイル単体表示
  試験確認内容：ファイルが単体表示されることを確認
  */
  it("04-01-069:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-ファイル操作エリア-ファイル単体表示-ファイルが単体表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test-a', true);
    cy.createDirOrFile(TYPE_FILE, 'test-b', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-b').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  ファイル操作エリア
  ファイル複数表示（リロード前）
  試験確認内容：ファイルが単体表示されることを確認
  */
  it("04-01-070:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-ファイル操作エリア-ファイル複数表示（リロード前）-ファイルが単体表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test1', true);
    cy.createDirOrFile(TYPE_FILE, 'test2', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test1').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test2').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  ファイル操作エリア
  ファイル複数表示（リロード後）
  試験確認内容：ファイルが複数表示されることを確認
  */
  it("04-01-071:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-ファイル操作エリア-ファイル複数表示（リロード後）-ファイルが複数表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test1', true);
    cy.createDirOrFile(TYPE_FILE, 'test2', false);
    cy.closeProperty();
    cy.clickComponentName(FOR_NAME_0);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test*').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ディレクトリ表示
  試験確認内容：ディレクトリ内にディレクトリが作成されることを確認
  */
  it("04-01-072:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ内ディレクトリ表示-ディレクトリ内にディレクトリが作成されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test-a', true);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').click();
    cy.createDirOrFile(TYPE_DIR, 'test-b', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-b').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ファイル表示
  試験確認内容：ディレクトリ内にファイルが作成されることを確認
  */
  it("04-01-073:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ内ファイル表示-ディレクトリ内にファイルが作成されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test-a', true);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').click();
    cy.createDirOrFile(TYPE_FILE, 'test.txt', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test.txt').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  各コンポーネントの追加/削除確認
  該当コンポーネント削除確認
  試験確認内容：コンポーネントが削除されていることを確認
  */
  it("04-01-074:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-各コンポーネントの追加/削除確認-該当コンポーネント削除確認-コンポーネントが削除されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    cy.deleteComponent(FOR_NAME_0);
    cy.get('[data-cy="graph-component-row"]').contains(FOR_NAME_0).should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  start表示確認
  試験確認内容：startテキストボックスが表示されていることを確認
  */
  it("04-01-075:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-start表示確認-startテキストボックスが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-loop_set_for-panel_title"]').click();
    cy.get('[data-cy="component_property-start_for-text_field"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  start入力確認
  試験確認内容：startテキストボックスが入力できることを確認
  */
  it("04-01-076:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-start入力確認-startテキストボックスが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-loop_set_for-panel_title"]').click();
    cy.get('[data-cy="component_property-start_for-text_field"]').type('1');
    cy.get('[data-cy="component_property-start_for-text_field"]').find('input').should('have.value', 1);
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  start入力反映確認
  試験確認内容：startテキストボックスに入力した値が反映されていることを確認
  */
  it("04-01-077:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-start入力反映確認-startテキストボックスに入力した値が反映されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-loop_set_for-panel_title"]').click();
    cy.get('[data-cy="component_property-start_for-text_field"]').type('1');
    cy.closeProperty();
    cy.clickComponentName(FOR_NAME_0);
    cy.get('[data-cy="component_property-loop_set_for-panel_title"]').click();
    cy.get('[data-cy="component_property-start_for-text_field"]').find('input').should('have.value', 1);
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  end表示確認
  試験確認内容：endテキストボックスが表示されていることを確認
  */
  it("04-01-078:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-end表示確認-endテキストボックスが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-loop_set_for-panel_title"]').click();
    cy.get('[data-cy="component_property-end_for-text_field"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  end入力確認
  試験確認内容：endテキストボックスが入力できることを確認
  */
  it("04-01-079:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-end入力確認-endテキストボックスが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-loop_set_for-panel_title"]').click();
    cy.get('[data-cy="component_property-end_for-text_field"]').type('5');
    cy.get('[data-cy="component_property-end_for-text_field"]').find('input').should('have.value', 5);
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  end入力反映確認
  試験確認内容：endテキストボックスに入力した値が反映されていることを確認
  */
  it("04-01-080:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-end入力反映確認-endテキストボックスに入力した値が反映されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-loop_set_for-panel_title"]').click();
    cy.get('[data-cy="component_property-end_for-text_field"]').type('5');
    cy.closeProperty();
    cy.clickComponentName(FOR_NAME_0);
    cy.get('[data-cy="component_property-loop_set_for-panel_title"]').click();
    cy.get('[data-cy="component_property-end_for-text_field"]').find('input').should('have.value', 5);
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  step表示確認
  試験確認内容：stepテキストボックスが表示されていることを確認
  */
  it("04-01-081:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-step表示確認-stepテキストボックスが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-loop_set_for-panel_title"]').click();
    cy.get('[data-cy="component_property-step_for-text_field"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  step入力確認
  試験確認内容：endテキストボックスが入力できることを確認
  */
  it("04-01-082:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-step入力確認-stepテキストボックスが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-loop_set_for-panel_title"]').click();
    cy.get('[data-cy="component_property-step_for-text_field"]').type(3);
    cy.get('[data-cy="component_property-step_for-text_field"]').find('input').should('have.value', 3);
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  step入力反映確認
  試験確認内容：stepテキストボックスに入力した値が反映されていることを確認
  */
  it("04-01-083:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-step入力反映確認-stepテキストボックスに入力した値が反映されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-loop_set_for-panel_title"]').click();
    cy.get('[data-cy="component_property-step_for-text_field"]').type(5);
    cy.closeProperty();
    cy.clickComponentName(FOR_NAME_0);
    cy.get('[data-cy="component_property-loop_set_for-panel_title"]').click();
    cy.get('[data-cy="component_property-step_for-text_field"]').find('input').should('have.value', 5);
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  number of instances to keep表示確認
  試験確認内容：number of instances to keepテキストボックスが表示されていることを確認
  */
  it("04-01-084:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-keep表示確認-keepテキストボックスが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-loop_set_for-panel_title"]').click();
    cy.get('[data-cy="component_property-keep_for-text_field"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  number of instances to keep入力確認
  試験確認内容：number of instances to keepテキストボックスが入力できることを確認
  */
  it("04-01-085:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-keep入力確認-keepテキストボックスが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-loop_set_for-panel_title"]').click();
    cy.get('[data-cy="component_property-keep_for-text_field"]').type(10);
    cy.get('[data-cy="component_property-keep_for-text_field"]').find('input').should('have.value', 10);
  });

  /** 
  コンポーネントの基本機能動作確認
  forコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  number of instances to keep入力反映確認
  試験確認内容：number of instances to keepテキストボックスに入力した値が反映されていることを確認
  */
  it("04-01-086:コンポーネントの基本機能動作確認-forコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-keep入力反映確認-keepテキストボックスに入力した値が反映されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-loop_set_for-panel_title"]').click();
    cy.get('[data-cy="component_property-keep_for-text_field"]').type(10);
    cy.closeProperty();
    cy.clickComponentName(FOR_NAME_0);
    cy.get('[data-cy="component_property-loop_set_for-panel_title"]').click();
    cy.get('[data-cy="component_property-keep_for-text_field"]').find('input').should('have.value', 10);
  });

  /** 
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  試験確認内容：プロパティが表示されることを確認
  */
  it("04-01-087:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-プロパティが表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-property-navigation_drawer"]';
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  試験確認内容：name入力テキストエリアが表示されていることを確認
  */
  it("04-01-088:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-name入力テキストエリアが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-name-text_field"]'
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  name入力
  試験確認内容：nameが入力できることを確認
  */
  it("04-01-089:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-name入力-nameが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 300, 500);
    const INPUT_OBJ_CY = '[data-cy="component_property-name-text_field"]';
    cy.confirmInputValueReflection(INPUT_OBJ_CY, '-Test_Task', TAG_TYPE_INPUT);
  });

  /** 
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  name入力（使用可能文字確認）
  試験確認内容：nameが入力できないことを確認
  */
  it("04-01-090:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-name入力（使用可能文字確認）-nameが入力できないことを確認", () => {
    cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 300, 500);
    const INPUT_OBJ_CY = '[data-cy="component_property-name-text_field"]';
    cy.confirmInputValueNotReflection(INPUT_OBJ_CY, 'Test*Task', TAG_TYPE_INPUT);
  });

  /** 
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  試験確認内容：説明入力テキストエリアが表示されていることを確認
  */
  it("04-01-091:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-description入力テキストエリアが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-description-textarea"]'
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  description入力
  試験確認内容：descriptionが入力できることを確認
  */
  it("04-01-092:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-description入力-descriptionが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 300, 500);
    const INPUT_OBJ_CY = '[data-cy="component_property-description-textarea"]';
    cy.confirmInputValueReflection(INPUT_OBJ_CY, 'descriptionTest', TAG_TYPE_TEXT_AREA);
  });

  /** 
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  input files表示
  試験確認内容：input files入力テキストエリアが表示されていることを確認
  */
  it("04-01-093:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-input files表示-input files入力テキストエリアが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-input_files-list_form"]';
    const CLICK_AREA_CY = '[data-cy="component_property-in_out_files-panel_title"]';
    cy.confirmDisplayInPropertyByDetailsArea(DATA_CY_STR, CLICK_AREA_CY, null);
  });

  /** 
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  input files入力
  試験確認内容：input filesが入力できることを確認
  */
  it("04-01-094:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-input files入力-input filesが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true, false);
    cy.get('[data-cy="component_property-input_files-list_form"]').find('input').should('have.value', 'testInputFile');
  });

  /** 
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  input files反映確認
  試験確認内容：input filesが反映されることを確認
  */
  it("04-01-095:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-input files反映確認-input filesが反映されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true, true);
    cy.get('[data-cy="graph-component-row"]').contains('testInputFile').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  output files表示
  試験確認内容：output files入力テキストエリアが表示されていることを確認
  */
  it("04-01-096:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-output files表示-output files入力テキストエリアが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-output_files-list_form"]';
    const CLICK_AREA_CY = '[data-cy="component_property-in_out_files-panel_title"]';
    cy.confirmDisplayInPropertyByDetailsArea(DATA_CY_STR, CLICK_AREA_CY, null);
  });

  /** 
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  output files入力
  試験確認内容：output filesが入力できることを確認
  */
  it("04-01-097:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-output files入力-output filesが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, false);
    cy.get('[data-cy="component_property-output_files-list_form"]').find('input').should('have.value', 'testOutputFile');
  });

  /** 
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  output files反映確認
  試験確認内容：output filesが反映されることを確認
  */
  it("04-01-099:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-output files反映確認-output filesが反映されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, true);
    cy.get('[data-cy="graph-component-row"]').contains('testOutputFile').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  構成要素の機能確認
  closeボタン押下
  試験確認内容：プロパティが表示されていないことを確認
  */
  it("04-01-100:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-構成要素の機能確認-closeボタン押下-プロパティが表示されていないことを確認", () => {
    cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 300, 500);
    cy.closeProperty();
    cy.get('[data-cy="component_property-property-navigation_drawer"]').should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  構成要素の機能確認
  cleanボタン押下
  試験確認内容：最新の保存状態に戻っていることを確認
  */
  it.skip("04-01-101:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-構成要素の機能確認-cleanボタン押下-最新の保存状態に戻っていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test-a', true);
    cy.get('[data-cy="component_property-condition-setting_title"]').click();
    let targetDropBoxCy = '[data-cy="component_property-condition_use_javascript-autocomplete"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 3, 'test-a');
    cy.get('[data-cy="workflow-play-btn"]').click();
    cy.clickComponentName(WHILE_NAME_0);
    cy.get('[data-cy="component_property-name-text_field"]').find('input').clear();
    cy.get('[data-cy="component_property-name-text_field"]').type('changeName');
    cy.get('[data-cy="component_property-description-textarea"]').find('textarea').focus();
    cy.get('[data-cy="component_property-clean-btn"]').click();
    cy.get('[data-cy="component_property-name-text_field"]').find('input').should('have.value', WHILE_NAME_0);
  });

  /** 
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  接続確認
  試験確認内容：コンポーネントが接続されていることを確認
  */
  it("04-01-102:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-ファイル転送設定の各パターンの確認-接続確認-コンポーネントが接続されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, true);
    cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_1, 300, 600);
    cy.connectComponent(WHILE_NAME_1);  // コンポーネント同士を接続
    cy.checkConnectionLine(WHILE_NAME_0, WHILE_NAME_1);  // 作成したコンポーネントの座標を取得して接続線の座標と比較
  });

  /** 
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除ボタン表示確認（input file）
  試験確認内容：削除ボタンが表示されることを確認
  */
  it("04-01-108:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除ボタン表示確認（input file）-削除ボタンが表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true, true);
    cy.get('[data-cy="action_row-delete-btn"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除ボタン表示確認（output file）
  試験確認内容：削除ボタンが表示されることを確認
  */
  it("04-01-109:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除ボタン表示確認（output file）-削除ボタンが表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, true);
    cy.get('[data-cy="action_row-delete-btn"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除反映確認（input file）
  試験確認内容：input fileが削除されていることを確認
  skip:issue#942
  */
  it.skip("04-01-110:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除反映確認（input file）-input fileが削除されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true, true);
    cy.get('[data-cy="action_row-delete-btn"]').click();
    cy.get('[data-cy="graph-component-row"]').contains('testInputFile').should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除反映確認（output file）
  試験確認内容：output fileが削除されていることを確認
  skip:issue#942
  */
  it.skip("04-01-111:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除反映確認（output file）-output fileが削除されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, true);
    cy.get('[data-cy="action_row-delete-btn"]').click();
    cy.get('[data-cy="graph-component-row"]').contains('testOutputFile').should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ単体表示
  試験確認内容：ディレクトリが単体表示されることを確認
  */
  it("04-01-112:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ単体表示-ディレクトリが単体表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test-a', true);
    cy.createDirOrFile(TYPE_DIR, 'test-b', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-b').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ複数表示（リロード前）
  試験確認内容：ディレクトリが単体表示されることを確認
  */
  it("04-01-113:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ複数表示（リロード前）-ディレクトリが単体表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test1', true);
    cy.createDirOrFile(TYPE_DIR, 'test2', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test1').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test2').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ複数表示（リロード後）
  試験確認内容：ディレクトリが複数表示されることを確認
  */
  it("04-01-114:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ複数表示（リロード後）-ディレクトリが複数表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test1', true);
    cy.createDirOrFile(TYPE_DIR, 'test2', false);
    cy.closeProperty();
    cy.clickComponentName(WHILE_NAME_0);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test*').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  ファイル操作エリア
  ファイル単体表示
  試験確認内容：ファイルが単体表示されることを確認
  */
  it("04-01-115:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-ファイル操作エリア-ファイル単体表示-ファイルが単体表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test-a', true);
    cy.createDirOrFile(TYPE_FILE, 'test-b', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-b').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  ファイル操作エリア
  ファイル複数表示（リロード前）
  試験確認内容：ファイルが単体表示されることを確認
  */
  it("04-01-116:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-ファイル操作エリア-ファイル複数表示（リロード前）-ファイルが単体表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test1', true);
    cy.createDirOrFile(TYPE_FILE, 'test2', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test1').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test2').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  ファイル操作エリア
  ファイル複数表示（リロード後）
  試験確認内容：ファイルが複数表示されることを確認
  */
  it("04-01-117:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-ファイル操作エリア-ファイル複数表示（リロード後）-ファイルが複数表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test1', true);
    cy.createDirOrFile(TYPE_FILE, 'test2', false);
    cy.closeProperty();
    cy.clickComponentName(WHILE_NAME_0);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test*').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ディレクトリ表示
  試験確認内容：ディレクトリ内にディレクトリが作成されることを確認
  */
  it("04-01-118:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ内ディレクトリ表示-ディレクトリ内にディレクトリが作成されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test-a', true);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').click();
    cy.createDirOrFile(TYPE_DIR, 'test-b', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-b').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ファイル表示
  試験確認内容：ディレクトリ内にファイルが作成されることを確認
  */
  it("04-01-119:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ内ファイル表示-ディレクトリ内にファイルが作成されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test-a', true);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').click();
    cy.createDirOrFile(TYPE_FILE, 'test.txt', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test.txt').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  各コンポーネントの追加/削除確認
  該当コンポーネント削除確認
  試験確認内容：コンポーネントが削除されていることを確認
  */
  it("04-01-120:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-各コンポーネントの追加/削除確認-該当コンポーネント削除確認-コンポーネントが削除されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 300, 500);
    cy.deleteComponent(WHILE_NAME_0);
    cy.get('[data-cy="graph-component-row"]').contains(WHILE_NAME_0).should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  プロパティ設定確認
  シェルスクリプト選択セレクトボックス表示確認
  試験確認内容：シェルスクリプト選択セレクトボックスが表示されていることを確認
  */
  it("04-01-121:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-プロパティ設定確認-シェルスクリプト選択セレクトボックス表示確認-シェルスクリプト選択セレクトボックスが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-condition-setting_title"]').click();
    cy.get('[data-cy="component_property-condition_use_javascript-autocomplete"]').find('input').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  プロパティ設定確認
  シェルスクリプト選択セレクトボックス選択確認
  試験確認内容：選択した値が表示されていることを確認
  */
  it("04-01-122:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-プロパティ設定確認-シェルスクリプト選択セレクトボックス選択確認-選択した値が表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test-a', true);
    cy.get('[data-cy="component_property-condition-setting_title"]');
    cy.get('[data-cy="component_property-condition-setting_title"]').click();
    let targetDropBoxCy = '[data-cy="component_property-condition_use_javascript-autocomplete"]';
    cy.get(targetDropBoxCy).find('input').click();
    cy.get("[role=\"listbox\"]").eq(3).contains('test-a').click();
    cy.get('[data-cy="component_property-condition_use_javascript-autocomplete"]').contains('test-a').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  プロパティ設定確認
  シェルスクリプト選択セレクトボックス選択反映確認
  試験確認内容：選択した値が表示されていることを確認
  */
  it("04-01-123:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-プロパティ設定確認-シェルスクリプト選択セレクトボックス選択反映確認-選択した値が反映されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test-a', true);
    cy.get('[data-cy="component_property-condition-setting_title"]');
    cy.get('[data-cy="component_property-condition-setting_title"]').click();
    let targetDropBoxCy = '[data-cy="component_property-condition_use_javascript-autocomplete"]';
    cy.get(targetDropBoxCy).find('input').click();
    cy.get("[role=\"listbox\"]").eq(3).contains('test-a').click();
    cy.closeProperty();
    cy.clickComponentName(WHILE_NAME_0);
    cy.get('[data-cy="component_property-condition-setting_title"]').click();
    cy.get('[data-cy="component_property-condition_use_javascript-autocomplete"]').contains('test-a').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  プロパティ設定確認
  javascriptテキストボックス表示確認
  試験確認内容：javascriptテキストボックスが表示されていることを確認
  */
  it("04-01-124:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-プロパティ設定確認-javascriptテキストボックス表示確認-javascriptテキストボックスが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-condition-setting_title"]').click();
    cy.get('[data-cy="component_property-condition_use_javascript-switch"]').click();
    cy.get('[data-cy="component_property-condition_use_javascript-textarea"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  プロパティ設定確認
  javascriptテキストボックス入力確認
  試験確認内容：入力した値が表示されていることを確認
  */
  it("04-01-125:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-プロパティ設定確認-javascriptテキストボックス入力確認-入力した値が表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-condition-setting_title"]').click();
    cy.get('[data-cy="component_property-condition_use_javascript-switch"]').click();
    cy.get('[data-cy="component_property-condition_use_javascript-textarea"]').type('testJavaScript');
    cy.get('[data-cy="component_property-condition_use_javascript-textarea"]').find('textarea').should('have.value', 'testJavaScript');
  });

  /** 
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  プロパティ設定確認
  javascriptテキストボックス反映確認
  試験確認内容：入力した値が反映されていることを確認
  */
  it("04-01-126:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-プロパティ設定確認-javascriptテキストボックス反映確認-入力した値が反映されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-condition-setting_title"]').click();
    cy.get('[data-cy="component_property-condition_use_javascript-switch"]').click();
    cy.get('[data-cy="component_property-condition_use_javascript-textarea"]').type('testJavaScript');
    cy.closeProperty();
    cy.clickComponentName(WHILE_NAME_0);
    cy.get('[data-cy="component_property-condition-setting_title"]').click();
    cy.get('[data-cy="component_property-condition_use_javascript-textarea"]').find('textarea').should('have.value', 'testJavaScript');
  });

  /** 
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  number of instances to keep表示確認
  試験確認内容：number of instances to keepテキストボックスが表示されていることを確認
  */
  it("04-01-127:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-keep表示確認-keepテキストボックスが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-condition-setting_title"]').click();
    cy.get('[data-cy="component_property-keep_while-text_field"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  number of instances to keep入力確認
  試験確認内容：number of instances to keepテキストボックスが入力できることを確認
  */
  it("04-01-128:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-keep入力確認-keepテキストボックスが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-condition-setting_title"]').click();
    cy.get('[data-cy="component_property-keep_while-text_field"]').type(10);
    cy.get('[data-cy="component_property-keep_while-text_field"]').find('input').should('have.value', 10);
  });

  /** 
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  number of instances to keep入力反映確認
  試験確認内容：number of instances to keepテキストボックスに入力した値が反映されていることを確認
  */
  it("04-01-129:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-keep入力反映確認-keepテキストボックスに入力した値が反映されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-condition-setting_title"]').click();
    cy.get('[data-cy="component_property-keep_while-text_field"]').type(10);
    cy.closeProperty();
    cy.clickComponentName(WHILE_NAME_0);
    cy.get('[data-cy="component_property-condition-setting_title"]').click();
    cy.get('[data-cy="component_property-keep_while-text_field"]').find('input').should('have.value', 10);
  });

  /** 
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  試験確認内容：プロパティが表示されることを確認
  */
  it("04-01-130:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-プロパティが表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-property-navigation_drawer"]';
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  試験確認内容：name入力テキストエリアが表示されていることを確認
  */
  it("04-01-131:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-name入力テキストエリアが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-name-text_field"]'
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  name入力
  試験確認内容：nameが入力できることを確認
  */
  it("04-01-132:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-name入力-nameが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 300, 500);
    const INPUT_OBJ_CY = '[data-cy="component_property-name-text_field"]';
    cy.confirmInputValueReflection(INPUT_OBJ_CY, '-Test_Task', TAG_TYPE_INPUT);
  });

  /** 
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  name入力（使用可能文字確認）
  試験確認内容：nameが入力できないことを確認
  */
  it("04-01-133:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-name入力（使用可能文字確認）-nameが入力できないことを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 300, 500);
    const INPUT_OBJ_CY = '[data-cy="component_property-name-text_field"]';
    cy.confirmInputValueNotReflection(INPUT_OBJ_CY, 'Test*Task', TAG_TYPE_INPUT);
  });

  /** 
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  試験確認内容：説明入力テキストエリアが表示されていることを確認
  */
  it("04-01-134:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-description入力テキストエリアが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-description-textarea"]'
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  description入力
  試験確認内容：descriptionが入力できることを確認
  */
  it("04-01-135:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-description入力-descriptionが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 300, 500);
    const INPUT_OBJ_CY = '[data-cy="component_property-description-textarea"]';
    cy.confirmInputValueReflection(INPUT_OBJ_CY, 'descriptionTest', TAG_TYPE_TEXT_AREA);
  });

  /** 
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  input files表示
  試験確認内容：input files入力テキストエリアが表示されていることを確認
  */
  it("04-01-136:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-input files表示-input files入力テキストエリアが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-input_files-list_form"]';
    const CLICK_AREA_CY = '[data-cy="component_property-in_out_files-panel_title"]';
    cy.confirmDisplayInPropertyByDetailsArea(DATA_CY_STR, CLICK_AREA_CY, null);
  });

  /** 
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  input files入力
  試験確認内容：input filesが入力できることを確認
  */
  it("04-01-137:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-input files入力-input filesが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true, false);
    cy.get('[data-cy="component_property-input_files-list_form"]').find('input').should('have.value', 'testInputFile');
  });

  /** 
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  input files反映確認
  試験確認内容：input filesが反映されることを確認
  */
  it("04-01-138:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-input files反映確認-input filesが反映されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true, true);
    cy.get('[data-cy="graph-component-row"]').contains('testInputFile').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  output files表示
  試験確認内容：output files入力テキストエリアが表示されていることを確認
  */
  it("04-01-139:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-output files表示-output files入力テキストエリアが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-output_files-list_form"]';
    const CLICK_AREA_CY = '[data-cy="component_property-in_out_files-panel_title"]';
    cy.confirmDisplayInPropertyByDetailsArea(DATA_CY_STR, CLICK_AREA_CY, null);
  });

  /** 
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  output files入力
  試験確認内容：output filesが入力できることを確認
  */
  it("04-01-140:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-output files入力-output filesが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, false);
    cy.get('[data-cy="component_property-output_files-list_form"]').find('input').should('have.value', 'testOutputFile');
  });

  /** 
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  output files反映確認
  試験確認内容：output filesが反映されることを確認
  */
  it("04-01-141:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-output files反映確認-output filesが反映されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, true);
    cy.get('[data-cy="graph-component-row"]').contains('testOutputFile').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  構成要素の機能確認
  closeボタン押下
  試験確認内容：プロパティが表示されていないことを確認
  */
  it("04-01-142:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-構成要素の機能確認-closeボタン押下-プロパティが表示されていないことを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 300, 500);
    cy.closeProperty();
    cy.get('[data-cy="component_property-property-navigation_drawer"]').should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  構成要素の機能確認
  cleanボタン押下
  試験確認内容：最新の保存状態に戻っていることを確認
  */
  it.skip("04-01-143:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-構成要素の機能確認-cleanボタン押下-最新の保存状態に戻っていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test-a', true);
    cy.get('[data-cy="component_property-loop_set_for-panel_title"]').click();
    cy.get('[data-cy="component_property-start_for-text_field"]').type('1');
    cy.get('[data-cy="component_property-end_for-text_field"]').type('5');
    cy.get('[data-cy="component_property-step_for-text_field"]').type('5');
    cy.get('[data-cy="workflow-play-btn"]').click();
    cy.clickComponentName(FOREACH_NAME_0);
    cy.get('[data-cy="component_property-name-text_field"]').find('input').clear();
    cy.get('[data-cy="component_property-name-text_field"]').type('changeName');
    cy.get('[data-cy="component_property-description-textarea"]').find('textarea').focus();
    cy.get('[data-cy="component_property-clean-btn"]').click();
    cy.get('[data-cy="component_property-name-text_field"]').find('input').should('have.value', 'test-a');
  });

  /** 
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  接続確認
  試験確認内容：コンポーネントが接続されていることを確認
  */
  it("04-01-145:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-ファイル転送設定の各パターンの確認-接続確認-コンポーネントが接続されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, true);
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_1, 300, 600);
    cy.connectComponent(FOREACH_NAME_1);  // コンポーネント同士を接続
    cy.checkConnectionLine(FOREACH_NAME_0, FOREACH_NAME_1);  // 作成したコンポーネントの座標を取得して接続線の座標と比較
  });

  /** 
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  シンポリックリンク確認（outputFile、inputFile一致）
  試験確認内容：シンポリックリンクが作成されていることを確認
  */
  it("04-01-146:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-ファイル転送設定の各パターンの確認-シンポリックリンク確認（outputFile、inputFile一致）-シンポリックリンクが作成されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 300, 500);
    // foreach0
    cy.createDirOrFile(TYPE_FILE, 'run.sh', true);
    cy.get('[data-cy="component_property-loop_set_foreach-panel_title"]').click();
    cy.get('[data-cy="component_property-index_foreach-list_form"]').find('input').type(1);
    cy.get('[data-cy="list_form-add-text_field"]').find('[role="button"]').eq(1).click(); // Add input file button
    cy.closeProperty();
    cy.clickComponentName(FOREACH_NAME_0);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'run.sh', true, true);
    // foreach1
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_1, 300, 600);
    cy.get('[data-cy="component_property-loop_set_foreach-panel_title"]').click();
    cy.get('[data-cy="component_property-index_foreach-list_form"]').find('input').type(2);
    cy.get('[data-cy="list_form-add-text_field"]').find('[role="button"]').eq(1).click(); // Add input file button
    cy.closeProperty();
    cy.clickComponentName(FOREACH_NAME_1);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'run.sh', true, true);
    cy.connectComponent(FOREACH_NAME_1);  // コンポーネント同士を接続
    cy.get('[data-cy="workflow-play-btn"]').click(); // 実行する
    cy.checkProjectStatus("finished");
    cy.clickComponentName(FOREACH_NAME_1);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('run.sh').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  シンポリックリンク確認（outputFileが通常、inputFileが空白）
  試験確認内容：シンポリックリンクが作成されていることを確認
  */
  it("04-01-147:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-ファイル転送設定の各パターンの確認-シンポリックリンク確認（outputFileが通常、inputFileが空白）-シンポリックリンクが作成されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 300, 500);
    // foreach0
    cy.createDirOrFile(TYPE_FILE, 'run.sh', true);
    cy.get('[data-cy="component_property-loop_set_foreach-panel_title"]').click();
    cy.get('[data-cy="component_property-index_foreach-list_form"]').find('input').type(1);
    cy.get('[data-cy="list_form-add-text_field"]').find('[role="button"]').eq(1).click(); // Add input file button
    cy.closeProperty();
    cy.clickComponentName(FOREACH_NAME_0);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'run.sh', true, true);
    // foreach1
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_1, 300, 600);
    cy.get('[data-cy="component_property-loop_set_foreach-panel_title"]').click();
    cy.get('[data-cy="component_property-index_foreach-list_form"]').find('input').type(2);
    cy.get('[data-cy="list_form-add-text_field"]').find('[role="button"]').eq(1).click(); // Add input file button
    cy.clickComponentName(FOREACH_NAME_1);
    cy.connectComponent(FOREACH_NAME_1);  // コンポーネント同士を接続
    cy.get('[data-cy="workflow-play-btn"]').click(); // 実行する
    cy.checkProjectStatus("finished");
    cy.clickComponentName(FOREACH_NAME_1);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('run.sh').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  シンポリックリンク確認（outputFileが通常、inputFileが「/」で終わらない文字列）
  試験確認内容：シンポリックリンクが作成されていることを確認
  */
  it("04-01-148:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-ファイル転送設定の各パターンの確認-シンポリックリンク確認（outputFileが通常、inputFileが「/」で終わらない文字列）-シンポリックリンクが作成されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 300, 500);
    // foreach0
    cy.createDirOrFile(TYPE_FILE, 'run.sh', true);
    cy.get('[data-cy="component_property-loop_set_foreach-panel_title"]').click();
    cy.get('[data-cy="component_property-index_foreach-list_form"]').find('input').type(1);
    cy.get('[data-cy="list_form-add-text_field"]').find('[role="button"]').eq(1).click(); // Add input file button
    cy.closeProperty();
    cy.clickComponentName(FOREACH_NAME_0);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'run.sh', true, true);
    // foreach1
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_1, 300, 600);
    cy.get('[data-cy="component_property-loop_set_foreach-panel_title"]').click();
    cy.get('[data-cy="component_property-index_foreach-list_form"]').find('input').type(2);
    cy.get('[data-cy="list_form-add-text_field"]').find('[role="button"]').eq(1).click(); // Add input file button
    cy.clickComponentName(FOREACH_NAME_1);
    cy.connectComponent(FOREACH_NAME_1);  // コンポーネント同士を接続
    cy.get('[data-cy="component_property-in_out_files-panel_title"]').click();
    cy.get('[data-cy="component_property-input_files-list_form"]').contains('run.sh').click();
    cy.get('[data-cy="list_form_property-edit-text_field"]').find('input').clear().type('foreach1.sh{enter}'); // inputFileの値を変更
    cy.closeProperty();
    cy.get('[data-cy="workflow-play-btn"]').click(); // 実行する
    cy.checkProjectStatus("finished");
    cy.clickComponentName(FOREACH_NAME_1);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('foreach1.sh').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  シンポリックリンク確認（outputFileがglob(*や\?など)を含むパス、inputFileが「/」で終わらない文字列）
  試験確認内容：シンポリックリンクが作成されていることを確認
  */
  it("04-01-149:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-ファイル転送設定の各パターンの確認-シンポリックリンク確認（outputFileがglob(*や\?など)を含むパス、inputFileが「/」で終わらない文字列）-シンポリックリンクが作成されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 300, 500);
    // foreach0
    cy.createDirOrFile(TYPE_FILE, 'run-a.sh', true);
    cy.createDirOrFile(TYPE_FILE, 'run-b.sh', false);
    cy.get('[data-cy="component_property-loop_set_foreach-panel_title"]').click();
    cy.get('[data-cy="component_property-index_foreach-list_form"]').find('input').type(1);
    cy.get('[data-cy="list_form-add-text_field"]').find('[role="button"]').eq(1).click(); // Add input file button
    cy.closeProperty();
    cy.clickComponentName(FOREACH_NAME_0);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'run*', true, true);
    // foreach1
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_1, 300, 600);
    cy.get('[data-cy="component_property-loop_set_foreach-panel_title"]').click();
    cy.get('[data-cy="component_property-index_foreach-list_form"]').find('input').type(2);
    cy.get('[data-cy="list_form-add-text_field"]').find('[role="button"]').eq(1).click(); // Add input file button
    cy.clickComponentName(FOREACH_NAME_1);
    cy.connectComponent(FOREACH_NAME_1);  // コンポーネント同士を接続
    cy.get('[data-cy="component_property-in_out_files-panel_title"]').click();
    cy.get('[data-cy="component_property-input_files-list_form"]').contains('run*').click();
    cy.get('[data-cy="list_form_property-edit-text_field"]').find('input').clear().type('foreach1-run{enter}'); // inputFileの値を変更
    cy.closeProperty();
    cy.get('[data-cy="workflow-play-btn"]').click(); // 実行する
    cy.checkProjectStatus("finished");
    cy.clickComponentName(FOREACH_NAME_1);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('foreach1-run').should('exist').click();   
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('run-a.sh').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('run-b.sh').should('exist'); 
  });

  /** 
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  シンポリックリンク確認（input filesが’/’で終わる文字列のとき）
  試験確認内容：シンポリックリンクが作成されていることを確認
  */
  it("04-01-150:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-ファイル転送設定の各パターンの確認-シンポリックリンク確認（input filesが’/’で終わる文字列のとき）-シンポリックリンクが作成されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 300, 500);
    // foreach0
    cy.createDirOrFile(TYPE_FILE, 'run-a.sh', true);
    cy.get('[data-cy="component_property-loop_set_foreach-panel_title"]').click();
    cy.get('[data-cy="component_property-index_foreach-list_form"]').find('input').type(1);
    cy.get('[data-cy="list_form-add-text_field"]').find('[role="button"]').eq(1).click(); // Add input file button
    cy.closeProperty();
    cy.clickComponentName(FOREACH_NAME_0);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'run*', true, true);
    // foreach1
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_1, 300, 600);
    cy.get('[data-cy="component_property-loop_set_foreach-panel_title"]').click();
    cy.get('[data-cy="component_property-index_foreach-list_form"]').find('input').type(2);
    cy.get('[data-cy="list_form-add-text_field"]').find('[role="button"]').eq(1).click(); // Add input file button
    cy.clickComponentName(FOREACH_NAME_1);
    cy.connectComponent(FOREACH_NAME_1);  // コンポーネント同士を接続
    cy.get('[data-cy="component_property-in_out_files-panel_title"]').click();
    cy.get('[data-cy="component_property-input_files-list_form"]').contains('run*').click();
    cy.get('[data-cy="list_form_property-edit-text_field"]').find('input').clear().type('foreach1-run/{enter}'); // inputFileの値を変更
    cy.closeProperty();
    cy.get('[data-cy="workflow-play-btn"]').click(); // 実行する
    cy.checkProjectStatus("finished");
    cy.clickComponentName(FOREACH_NAME_1);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('foreach1-run').should('exist').click();   
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('run-a.sh').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除ボタン表示確認（input file）
  試験確認内容：削除ボタンが表示されることを確認
  */
  it("04-01-151:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除ボタン表示確認（input file）-削除ボタンが表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true, true);
    cy.get('[data-cy="action_row-delete-btn"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除ボタン表示確認（output file）
  試験確認内容：削除ボタンが表示されることを確認
  */
  it("04-01-152:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除ボタン表示確認（output file）-削除ボタンが表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, true);
    cy.get('[data-cy="action_row-delete-btn"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除反映確認（input file）
  試験確認内容：input fileが削除されていることを確認
  skip:issue#942
  */
  it.skip("04-01-153:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除反映確認（input file）-input fileが削除されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true, true);
    cy.get('[data-cy="action_row-delete-btn"]').click();
    cy.get('[data-cy="graph-component-row"]').contains('testInputFile').should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除反映確認（output file）
  試験確認内容：output fileが削除されていることを確認
  skip:issue#942
  */
  it.skip("04-01-154:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除反映確認（output file）-output fileが削除されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, true);
    cy.get('[data-cy="action_row-delete-btn"]').click();
    cy.get('[data-cy="graph-component-row"]').contains('testOutputFile').should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ単体表示
  試験確認内容：ディレクトリが単体表示されることを確認
  */
  it("04-01-155:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ単体表示-ディレクトリが単体表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test-a', true);
    cy.createDirOrFile(TYPE_DIR, 'test-b', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-b').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ複数表示（リロード前）
  試験確認内容：ディレクトリが単体表示されることを確認
  */
  it("04-01-156:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ複数表示（リロード前）-ディレクトリが単体表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test1', true);
    cy.createDirOrFile(TYPE_DIR, 'test2', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test1').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test2').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ複数表示（リロード後）
  試験確認内容：ディレクトリが複数表示されることを確認
  */
  it("04-01-157:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ複数表示（リロード後）-ディレクトリが複数表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test1', true);
    cy.createDirOrFile(TYPE_DIR, 'test2', false);
    cy.closeProperty();
    cy.clickComponentName(FOREACH_NAME_0);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test*').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  ファイル操作エリア
  ファイル単体表示
  試験確認内容：ファイルが単体表示されることを確認
  */
  it("04-01-158:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-ファイル操作エリア-ファイル単体表示-ファイルが単体表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test-a', true);
    cy.createDirOrFile(TYPE_FILE, 'test-b', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-b').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  ファイル操作エリア
  ファイル複数表示（リロード前）
  試験確認内容：ファイルが単体表示されることを確認
  */
  it("04-01-159:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-ファイル操作エリア-ファイル複数表示（リロード前）-ファイルが単体表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test1', true);
    cy.createDirOrFile(TYPE_FILE, 'test2', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test1').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test2').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  ファイル操作エリア
  ファイル複数表示（リロード後）
  試験確認内容：ファイルが複数表示されることを確認
  */
  it("04-01-160:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-ファイル操作エリア-ファイル複数表示（リロード後）-ファイルが複数表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test1', true);
    cy.createDirOrFile(TYPE_FILE, 'test2', false);
    cy.closeProperty();
    cy.clickComponentName(FOREACH_NAME_0);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test*').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ディレクトリ表示
  試験確認内容：ディレクトリ内にディレクトリが作成されることを確認
  */
  it("04-01-161:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ内ディレクトリ表示-ディレクトリ内にディレクトリが作成されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test-a', true);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').click();
    cy.createDirOrFile(TYPE_DIR, 'test-b', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-b').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ファイル表示
  試験確認内容：ディレクトリ内にファイルが作成されることを確認
  */
  it("04-01-162:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ内ファイル表示-ディレクトリ内にファイルが作成されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test-a', true);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').click();
    cy.createDirOrFile(TYPE_FILE, 'test.txt', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test.txt').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  各コンポーネントの追加/削除確認
  該当コンポーネント削除確認
  試験確認内容：コンポーネントが削除されていることを確認
  */
  it("04-01-163:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-各コンポーネントの追加/削除確認-該当コンポーネント削除確認-コンポーネントが削除されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 300, 500);
    cy.deleteComponent(FOREACH_NAME_0);
    cy.get('[data-cy="graph-component-row"]').contains(FOREACH_NAME_0).should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  インデックス値テキストボックス表示確認
  試験確認内容：インデックス値テキストボックスが表示されていることを確認
  */
  it("04-01-164:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-プロパティ設定確認-インデックス値テキストボックス表示確認-インデックス値テキストボックスが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-loop_set_foreach-panel_title"]').click();
    cy.get('[data-cy="component_property-index_foreach-list_form"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  インデックス値テキストボックス入力確認
  試験確認内容：インデックス値テキストボックスが入力できることを確認
  */
  it("04-01-165:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-プロパティ設定確認-インデックス値テキストボックス入力確認-インデックス値テキストボックスが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-loop_set_foreach-panel_title"]').click();
    cy.get('[data-cy="component_property-index_foreach-list_form"]').find('input').type(10);
    cy.get('[data-cy="component_property-index_foreach-list_form"]').find('input').should('have.value', 10);
  });

  /** 
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  インデックス値テキストボックス入力反映確認
  試験確認内容：インデックス値テキストボックスに入力した値が反映されていることを確認
  */
  it("04-01-166:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-プロパティ設定確認-インデックス値テキストボックス入力反映確認-インデックス値テキストボックスに入力した値が反映されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-loop_set_foreach-panel_title"]').click();
    cy.get('[data-cy="component_property-index_foreach-list_form"]').find('input').type(10);
    cy.get('[data-cy="list_form-add-text_field"]').find('[role="button"]').eq(1).click(); // Add input file button
    cy.get('[data-cy="component_property-index_foreach-list_form"]').contains(10).should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  number of instances to keepテキストボックス表示確認
  試験確認内容：number of instances to keepテキストボックスが表示されていることを確認
  */
  it("04-01-167:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-プロパティ設定確認-keepテキストボックス表示確認-keepテキストボックスが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-loop_set_foreach-panel_title"]').click();
    cy.get('[data-cy="component_property-keep_foreach-text_field"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  number of instances to keepテキストボックス入力確認
  試験確認内容：number of instances to keepテキストボックスが入力できることを確認
  */
  it("04-01-168:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-プロパティ設定確認-keepテキストボックス入力確認-keepテキストボックスが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-loop_set_foreach-panel_title"]').click();
    cy.get('[data-cy="component_property-keep_foreach-text_field"]').find('input').type(20);
    cy.get('[data-cy="component_property-keep_foreach-text_field"]').find('input').should('have.value', 20);
  });

  /** 
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  number of instances to keepテキストボックス入力反映確認
  試験確認内容：number of instances to keepテキストボックスに入力した値が反映されていることを確認
  */
  it("04-01-169:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-プロパティ設定確認-keepテキストボックス入力反映確認-keepテキストボックスに入力した値が反映されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-loop_set_foreach-panel_title"]').click();
    cy.get('[data-cy="component_property-keep_foreach-text_field"]').find('input').type(20);
    cy.closeProperty();
    cy.clickComponentName(FOREACH_NAME_0);
    cy.get('[data-cy="component_property-loop_set_foreach-panel_title"]').click();
    cy.get('[data-cy="component_property-keep_foreach-text_field"]').find('input').should('have.value', 20);
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  試験確認内容：プロパティが表示されることを確認
  */
  it("04-01-170:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-プロパティが表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-property-navigation_drawer"]';
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  試験確認内容：name入力テキストエリアが表示されていることを確認
  */
  it("04-01-171:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-name入力テキストエリアが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-name-text_field"]'
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  name入力
  試験確認内容：nameが入力できることを確認
  */
  it("04-01-172:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-name入力-nameが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    const INPUT_OBJ_CY = '[data-cy="component_property-name-text_field"]';
    cy.confirmInputValueReflection(INPUT_OBJ_CY, '-Test_Task', TAG_TYPE_INPUT);
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  name入力（使用可能文字確認）
  試験確認内容：nameが入力できないことを確認
  */
  it("04-01-173:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-name入力（使用可能文字確認）-nameが入力できないことを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    const INPUT_OBJ_CY = '[data-cy="component_property-name-text_field"]';
    cy.confirmInputValueNotReflection(INPUT_OBJ_CY, 'Test*Task', TAG_TYPE_INPUT);
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  試験確認内容：説明入力テキストエリアが表示されていることを確認
  */
  it("04-01-174:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-description入力テキストエリアが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-description-textarea"]'
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  description入力
  試験確認内容：descriptionが入力できることを確認
  */
  it("04-01-175:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-description入力-descriptionが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    const INPUT_OBJ_CY = '[data-cy="component_property-description-textarea"]';
    cy.confirmInputValueReflection(INPUT_OBJ_CY, 'descriptionTest', TAG_TYPE_TEXT_AREA);
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  input files表示
  試験確認内容：input files入力テキストエリアが表示されていることを確認
  */
  it("04-01-176:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-input files表示-input files入力テキストエリアが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-input_files-list_form"]';
    const CLICK_AREA_CY = '[data-cy="component_property-in_out_files-panel_title"]';
    cy.confirmDisplayInPropertyByDetailsArea(DATA_CY_STR, CLICK_AREA_CY, null);
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  input files入力
  試験確認内容：input filesが入力できることを確認
  */
  it("04-01-177:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-input files入力-input filesが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true, false);
    cy.get('[data-cy="component_property-input_files-list_form"]').find('input').should('have.value', 'testInputFile');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  input files反映確認
  試験確認内容：input filesが反映されることを確認
  */
  it("04-01-178:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-input files反映確認-input filesが反映されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true, true);
    cy.get('[data-cy="graph-component-row"]').contains('testInputFile').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  output files表示
  試験確認内容：output files入力テキストエリアが表示されていることを確認
  */
  it("04-01-179:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-output files表示-output files入力テキストエリアが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-output_files-list_form"]';
    const CLICK_AREA_CY = '[data-cy="component_property-in_out_files-panel_title"]';
    cy.confirmDisplayInPropertyByDetailsArea(DATA_CY_STR, CLICK_AREA_CY, null);
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  output files入力
  試験確認内容：output filesが入力できることを確認
  */
  it("04-01-180:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-output files入力-output filesが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, false);
    cy.get('[data-cy="component_property-output_files-list_form"]').find('input').should('have.value', 'testOutputFile');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  output files反映確認
  試験確認内容：output filesが反映されることを確認
  */
  it("04-01-181:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-output files反映確認-output filesが反映されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, true);
    cy.get('[data-cy="graph-component-row"]').contains('testOutputFile').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  構成要素の機能確認
  closeボタン押下
  試験確認内容：プロパティが表示されていないことを確認
  */
  it("04-01-182:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-構成要素の機能確認-closeボタン押下-プロパティが表示されていないことを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.closeProperty();
    cy.get('[data-cy="component_property-property-navigation_drawer"]').should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  構成要素の機能確認
  cleanボタン押下
  試験確認内容：最新の保存状態に戻っていることを確認
  */
  it.skip("04-01-183:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-構成要素の機能確認-cleanボタン押下-最新の保存状態に戻っていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test-a', true);
    cy.get('[data-cy="component_property-loop_set_for-panel_title"]').click();
    cy.get('[data-cy="component_property-start_for-text_field"]').type('1');
    cy.get('[data-cy="component_property-end_for-text_field"]').type('5');
    cy.get('[data-cy="component_property-step_for-text_field"]').type('5');
    cy.get('[data-cy="workflow-play-btn"]').click();
    cy.clickComponentName(PS_NAME_0);
    cy.get('[data-cy="component_property-name-text_field"]').find('input').clear();
    cy.get('[data-cy="component_property-name-text_field"]').type('changeName');
    cy.get('[data-cy="component_property-description-textarea"]').find('textarea').focus();
    cy.get('[data-cy="component_property-clean-btn"]').click();
    cy.get('[data-cy="component_property-name-text_field"]').find('input').should('have.value', 'test-a');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  接続確認
  試験確認内容：コンポーネントが接続されていることを確認
  */
  it("04-01-185:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-ファイル転送設定の各パターンの確認-接続確認-コンポーネントが接続されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, true);
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_1, 300, 600);
    cy.connectComponent(PS_NAME_1);  // コンポーネント同士を接続
    cy.checkConnectionLine(PS_NAME_0, PS_NAME_1);  // 作成したコンポーネントの座標を取得して接続線の座標と比較
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除ボタン表示確認（input file）
  試験確認内容：削除ボタンが表示されることを確認
  */
  it("04-01-191:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除ボタン表示確認（input file）-削除ボタンが表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true, true);
    cy.get('[data-cy="action_row-delete-btn"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除ボタン表示確認（output file）
  試験確認内容：削除ボタンが表示されることを確認
  */
  it("04-01-192:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除ボタン表示確認（output file）-削除ボタンが表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, true);
    cy.get('[data-cy="action_row-delete-btn"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除反映確認（input file）
  試験確認内容：input fileが削除されていることを確認
  skip:issue#942
  */
  it.skip("04-01-193:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除反映確認（input file）-input fileが削除されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true, true);
    cy.get('[data-cy="action_row-delete-btn"]').click();
    cy.get('[data-cy="graph-component-row"]').contains('testInputFile').should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除反映確認（output file）
  試験確認内容：output fileが削除されていることを確認
  skip:issue#942
  */
  it.skip("04-01-194:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除反映確認（output file）-output fileが削除されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, true);
    cy.get('[data-cy="action_row-delete-btn"]').click();
    cy.get('[data-cy="graph-component-row"]').contains('testOutputFile').should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ単体表示
  試験確認内容：ディレクトリが単体表示されることを確認
  */
  it("04-01-195:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ単体表示-ディレクトリが単体表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test-a', true);
    cy.createDirOrFile(TYPE_DIR, 'test-b', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-b').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ複数表示（リロード前）
  試験確認内容：ディレクトリが単体表示されることを確認
  */
  it("04-01-196:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ複数表示（リロード前）-ディレクトリが単体表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test1', true);
    cy.createDirOrFile(TYPE_DIR, 'test2', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test1').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test2').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ複数表示（リロード後）
  試験確認内容：ディレクトリが複数表示されることを確認
  */
  it("04-01-197:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ複数表示（リロード後）-ディレクトリが複数表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test1', true);
    cy.createDirOrFile(TYPE_DIR, 'test2', false);
    cy.closeProperty();
    cy.clickComponentName(PS_NAME_0);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test*').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  ファイル操作エリア
  ファイル単体表示
  試験確認内容：ファイルが単体表示されることを確認
  */
  it("04-01-198:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-ファイル操作エリア-ファイル単体表示-ファイルが単体表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test-a', true);
    cy.createDirOrFile(TYPE_FILE, 'test-b', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-b').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  ファイル操作エリア
  ファイル複数表示（リロード前）
  試験確認内容：ファイルが単体表示されることを確認
  */
  it("04-01-199:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-ファイル操作エリア-ファイル複数表示（リロード前）-ファイルが単体表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test1', true);
    cy.createDirOrFile(TYPE_FILE, 'test2', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test1').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test2').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  ファイル操作エリア
  ファイル複数表示（リロード後）
  試験確認内容：ファイルが複数表示されることを確認
  */
  it("04-01-200:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-ファイル操作エリア-ファイル複数表示（リロード後）-ファイルが複数表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test1', true);
    cy.createDirOrFile(TYPE_FILE, 'test2', false);
    cy.closeProperty();
    cy.clickComponentName(PS_NAME_0);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test*').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ディレクトリ表示
  試験確認内容：ディレクトリ内にディレクトリが作成されることを確認
  */
  it("04-01-201:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ内ディレクトリ表示-ディレクトリ内にディレクトリが作成されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test-a', true);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').click();
    cy.createDirOrFile(TYPE_DIR, 'test-b', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-b').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ファイル表示
  試験確認内容：ディレクトリ内にファイルが作成されることを確認
  */
  it("04-01-202:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ内ファイル表示-ディレクトリ内にファイルが作成されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test-a', true);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').click();
    cy.createDirOrFile(TYPE_FILE, 'test.txt', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test.txt').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネントの追加/削除確認
  該当コンポーネント削除確認
  試験確認内容：コンポーネントが削除されていることを確認
  */
  it("04-01-203:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-各コンポーネントの追加/削除確認-該当コンポーネント削除確認-コンポーネントが削除されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.deleteComponent(PS_NAME_0);
    cy.get('[data-cy="graph-component-row"]').contains(PS_NAME_0).should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  parameterFileテキストボックス表示確認
  試験確認内容：parameterFileテキストボックスが表示されていることを確認
  */
  it("04-01-204:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-プロパティ設定確認-parameterFileテキストボックス表示確認-parameterFileテキストボックスが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-ps-panel_title"]').click();
    cy.get('[data-cy="component_property-parameter_file-autocomplete"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  parameterFileテキストボックス入力入力確認
  試験確認内容：parameterFileテキストボックスが入力できることを確認
  */
  it("04-01-205:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-プロパティ設定確認-parameterFileテキストボックス入力確認-parameterFileテキストボックスが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-ps-panel_title"]').click();
    cy.createDirOrFile(TYPE_FILE, 'test.json', true);
    let targetDropBoxCy = '[data-cy="component_property-parameter_file-autocomplete"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 3, 'test.json');
    cy.get('[data-cy="component_property-parameter_file-autocomplete"]').find('input').should('have.value', 'test.json');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  parameterFileテキストボックス入力反映確認
  試験確認内容：parameterFileテキストボックスが反映されていることを確認
  */
  it("04-01-206:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-プロパティ設定確認-parameterFileテキストボックス入力反映確認-parameterFileテキストボックスが反映されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-ps-panel_title"]').click();
    cy.createDirOrFile(TYPE_FILE, 'test.json', true);
    let targetDropBoxCy = '[data-cy="component_property-parameter_file-autocomplete"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 3, 'test.json');
    cy.closeProperty();
    cy.clickComponentName(PS_NAME_0);
    cy.get('[data-cy="component_property-ps-panel_title"]').click();
    cy.get('[data-cy="component_property-parameter_file-autocomplete"]').contains('test.json').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  force overwriteスイッチボタン表示確認
  試験確認内容：force overwriteスイッチボタンが表示されていることを確認
  */
  it("04-01-207:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-プロパティ設定確認-force overwriteスイッチボタン表示確認-force overwriteスイッチボタンが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-ps-panel_title"]').click();
    cy.get('[data-cy="component_property-force_overwrite-switch"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  force overwriteスイッチボタン入力確認
  試験確認内容：force overwriteスイッチボタンが入力されていることを確認
  */
  it("04-01-208:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-プロパティ設定確認-force overwriteスイッチボタン入力確認-force overwriteスイッチボタンが入力されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-ps-panel_title"]').click();
    cy.get('[data-cy="component_property-force_overwrite-switch"]').find('input').click();
    cy.get('[data-cy="component_property-force_overwrite-switch"]').find('input').should('be.checked')
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  force overwriteスイッチボタン入力反映確認
  試験確認内容：force overwriteスイッチボタンが入力反映されていることを確認
  */
  it("04-01-209:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-プロパティ設定確認-force overwriteスイッチボタン入力確認-force overwriteスイッチボタンが入力反映されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-ps-panel_title"]').click();
    cy.get('[data-cy="component_property-force_overwrite-switch"]').find('input').click();
    cy.closeProperty();
    cy.clickComponentName(PS_NAME_0);
    cy.get('[data-cy="component_property-ps-panel_title"]').click();
    cy.get('[data-cy="component_property-force_overwrite-switch"]').find('input').should('be.checked')
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  delete all instancesスイッチボタン表示確認
  試験確認内容：delete all instancesスイッチボタンが表示されていることを確認
  */
  it("04-01-210:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-プロパティ設定確認-delete all instancesスイッチボタン表示確認-delete all instancesスイッチボタンが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-ps-panel_title"]').click();
    cy.get('[data-cy="component_property-delete_all_instances-switch"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  delete all instancesスイッチボタン入力確認
  試験確認内容：delete all instancesスイッチボタンが入力されていることを確認
  */
  it("04-01-211:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-プロパティ設定確認-delete all instancesスイッチボタン入力確認-delete all instancesスイッチボタンが入力されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-ps-panel_title"]').click();
    cy.get('[data-cy="component_property-delete_all_instances-switch"]').find('input').click();
    cy.get('[data-cy="component_property-delete_all_instances-switch"]').find('input').should('be.checked')
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  delete all instancesスイッチボタン入力反映確認
  試験確認内容：delete all instancesスイッチボタンが入力反映されていることを確認
  */
  it("04-01-212:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-プロパティ設定確認-delete all instancesスイッチボタン入力確認-delete all instancesスイッチボタンが入力反映されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-ps-panel_title"]').click();
    cy.get('[data-cy="component_property-delete_all_instances-switch"]').find('input').click();
    cy.closeProperty();
    cy.clickComponentName(PS_NAME_0);
    cy.get('[data-cy="component_property-ps-panel_title"]').click();
    cy.get('[data-cy="component_property-delete_all_instances-switch"]').find('input').should('be.checked')
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  targetFiles入力テキストボックス表示確認
  試験確認内容：targetFiles入力テキストボックスが表示されていることを確認
  */
  it("04-01-213:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-プロパティ設定確認-targetFiles入力テキストボックス表示確認-targetFiles入力テキストボックスが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('parameterSetting.json').click();
    cy.get('[data-cy="workflow-document_edit-btn"]').click();
    cy.get('[data-cy="target_files-add_target_file-btn"]').click();
    cy.get('[data-cy="target_files-target_file_name-text_field"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  targetFiles入力テキストボックス入力確認
  試験確認内容：targetFilesテキストボックスに入力した値が表示されていることを確認
  */
  it("04-01-214:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-プロパティ設定確認-targetFiles入力テキストボックス入力確認-targetFilesテキストボックスに入力した値が表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('parameterSetting.json').click();
    cy.get('[data-cy="workflow-document_edit-btn"]').click();
    cy.get('[data-cy="target_files-add_target_file-btn"]').click();
    cy.get('[data-cy="target_files-target_file_name-text_field"]').type('run.sh');
    cy.get('[data-cy="target_files-target_file_name-text_field"]').find('input').should('have.value', 'run.sh');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  targetFiles追加
  試験確認内容：targetFileが追加されていることを確認
  */
  it("04-01-215:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-プロパティ設定確認-targetFiles追加-targetFileが追加されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('parameterSetting.json').click();
    cy.get('[data-cy="workflow-document_edit-btn"]').click();
    cy.get('[data-cy="target_files-add_target_file-btn"]').click();
    cy.get('[data-cy="target_files-target_file_name-text_field"]').type('run.sh');
    cy.get('[data-cy="target_files-ok-btn"]').click();
    cy.get('[data-cy="target_files-data-data_table"]').contains('run.sh').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  targetFiles削除
  試験確認内容：targetFilesが削除されていることを確認
  */
  it("04-01-216:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-プロパティ設定確認-targetFiles削除-targetFilesが削除されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('parameterSetting.json').click();
    cy.get('[data-cy="workflow-document_edit-btn"]').click();
    cy.get('[data-cy="target_files-add_target_file-btn"]').click();
    cy.get('[data-cy="target_files-target_file_name-text_field"]').type('run.sh');
    cy.get('[data-cy="target_files-ok-btn"]').click();
    cy.get('[data-cy="action_row-delete-btn"]').click();
    cy.get('[data-cy="target_files-data-data_table"]').contains('run.sh').should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  targetFilesタブエディタ入力確認
  試験確認内容：入力した値が表示されていることを確認
  */
  it("04-01-217:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-プロパティ設定確認-delete all instancesスイッチボタン入力確認-入力した値が表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('parameterSetting.json').click();
    cy.get('[data-cy="workflow-document_edit-btn"]').click();
    cy.get('[data-cy="target_files-add_target_file-btn"]').click();
    cy.get('[data-cy="target_files-target_file_name-text_field"]').type('run.sh');
    cy.get('[data-cy="target_files-ok-btn"]').click();
    cy.get('[data-cy="rapid-tab-tab_editor"]').type('test');
    cy.get('[data-cy="rapid-tab-tab_editor"]').contains('test').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  targetFiles反映確認
  試験確認内容：targetFilesが反映されていることを確認
  */
  it("04-01-218:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-プロパティ設定確認-targetFiles反映確認-targetFilesが反映されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('parameterSetting.json').click();
    cy.get('[data-cy="workflow-document_edit-btn"]').click();
    cy.get('[data-cy="target_files-add_target_file-btn"]').click();
    cy.get('[data-cy="target_files-target_file_name-text_field"]').type('run.sh');
    cy.get('[data-cy="target_files-ok-btn"]').click();
    cy.get('[data-cy="rapid-save_all_files-btn"]').click(); // 保存ボタンクリック
    cy.get('[data-cy="workflow-graph_view-btn"]').click();
    cy.get('[data-cy="workflow-document_edit-btn"]').click();
    cy.get('[data-cy="target_files-data-data_table"]').contains('run.sh').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  parameters->current selected text 表示確認
  試験確認内容：current selected textテキストボックスが表示されていることを確認
  */
  it("04-01-219:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-プロパティ設定確認-parameters->current selected text 表示確認-current selected textテキストボックスが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('parameterSetting.json').click();
    cy.get('[data-cy="workflow-document_edit-btn"]').click();
    cy.get('[data-cy="parameter-selected_text-text_field"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  parameters->current selected text 入力確認
  試験確認内容：current selected textテキストボックスにドラッグした値が表示されていることを確認
  */
  it("04-01-220:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-プロパティ設定確認-parameters->current selected text 入力確認-current selected textテキストボックスにドラッグした値が表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('parameterSetting.json').click();
    cy.get('[data-cy="workflow-document_edit-btn"]').click();
    cy.get('[data-cy="target_files-add_target_file-btn"]').click();
    cy.get('[data-cy="target_files-target_file_name-text_field"]').type('run.sh');
    cy.get('[data-cy="target_files-ok-btn"]').click();
    cy.get('[data-cy="rapid-tab-tab_editor"]').type('VALUE=value');
    cy.get('[data-cy="rapid-tab-tab_editor"]').dblclick();
    cy.get('[data-cy="parameter-selected_text-text_field"]').find('input').should('have.value', 'value');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  parameters->current selected text 入力反映確認
  試験確認内容：current selected textテキストボックスにドラッグした値が反映されていることを確認
  */
  it("04-01-221:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-プロパティ設定確認-delete all instancesスイッチボタン入力確認-current selected textテキストボックスにドラッグした値が反映されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('parameterSetting.json').click();
    cy.get('[data-cy="workflow-document_edit-btn"]').click();
    cy.get('[data-cy="target_files-add_target_file-btn"]').click();
    cy.get('[data-cy="target_files-target_file_name-text_field"]').type('run.sh');
    cy.get('[data-cy="target_files-ok-btn"]').click();
    cy.get('[data-cy="rapid-tab-tab_editor"]').type('VALUE=value');
    cy.get('[data-cy="rapid-tab-tab_editor"]').dblclick();
    cy.get('[data-cy="rapid-save_all_files-btn"]').click();
    cy.get('[data-cy="parameter-selected_text-text_field"]').find('input').should('have.value', 'value');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  parameters->+ add new parameter ボタン表示確認
  試験確認内容：parameter設定ダイアログが表示されることを確認
  */
  it("04-01-222:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-プロパティ設定確認-parameters->+ add new parameter ボタン表示確認-parameter設定ダイアログが表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('parameterSetting.json').click();
    cy.get('[data-cy="workflow-document_edit-btn"]').click();
    cy.get('[data-cy="parameter-add_new_parameter_btn"]').click();
    cy.get('[data-cy="parameter-parameter_setting-select"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  min-max-step表示確認
  試験確認内容：min-max-step入力フォームが表示されていることを確認
  */
  it("04-01-223:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-プロパティ設定確認-min-max-step表示確認-min-max-step入力フォームが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('parameterSetting.json').click();
    cy.get('[data-cy="workflow-document_edit-btn"]').click();
    cy.get('[data-cy="parameter-add_new_parameter_btn"]').click();
    cy.get('[data-cy="parameter-min-text_field"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  min-max-step表示確認
  試験確認内容：min-max-step入力フォームが表示されていることを確認
  */
  it("04-01-223:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-プロパティ設定確認-min-max-step表示確認-min-max-step入力フォームが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('parameterSetting.json').click();
    cy.get('[data-cy="workflow-document_edit-btn"]').click();
    cy.get('[data-cy="parameter-add_new_parameter_btn"]').click();
    cy.get('[data-cy="parameter-min-text_field"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  min-max-step入力確認
  試験確認内容：min-max-step入力フォームに入力した値が表示されていることを確認
  */
  it("04-01-224:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-プロパティ設定確認-min-max-step入力確認-min-max-step入力フォームに入力した値が表示されていることを確認認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('parameterSetting.json').click();
    cy.get('[data-cy="workflow-document_edit-btn"]').click();
    cy.get('[data-cy="parameter-add_new_parameter_btn"]').click();
    cy.get('[data-cy="parameter-min-text_field"]').clear().type(1).find('input').should('have.value', 1);
    cy.get('[data-cy="parameter-max-text_field"]').clear().type(3).find('input').should('have.value', 3);
    cy.get('[data-cy="parameter-step-text_field"]').clear().type(2).find('input').should('have.value', 2);    
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  min-max-step入力反映確認
  試験確認内容：min-max-step入力フォームに入力した値が反映されていることを確認
  */
  it("04-01-225:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-プロパティ設定確認-min-max-step入力反映確認-min-max-step入力フォームに入力した値が反映されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('parameterSetting.json').click();
    cy.get('[data-cy="workflow-document_edit-btn"]').click();
    // ターゲットファイル設定
    cy.get('[data-cy="target_files-add_target_file-btn"]').click();
    cy.get('[data-cy="target_files-target_file_name-text_field"]').type('run.sh');
    cy.get('[data-cy="target_files-ok-btn"]').click();
    cy.get('[data-cy="rapid-tab-tab_editor"]').type('VALUE=value');
    cy.get('[data-cy="rapid-tab-tab_editor"]').dblclick();
    //　パラメータ設定
    cy.get('[data-cy="parameter-add_new_parameter_btn"]').click();
    cy.get('[data-cy="parameter-min-text_field"]').clear().type(1);
    cy.get('[data-cy="parameter-max-text_field"]').clear().type(3);
    cy.get('[data-cy="parameter-step-text_field"]').clear().type(2);
    cy.get('[data-cy="parameter-ok-btn"]').click();
    cy.get('[data-cy="rapid-save_all_files-btn"]').click();
    cy.get('[data-cy="rapid-tab-tab_editor"]').contains('VALUE={{ value }}').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  list表示確認
  試験確認内容：list入力フォームが表示されていることを確認
  */
  it("04-01-226:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-プロパティ設定確認-list表示確認-list入力フォームが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('parameterSetting.json').click();
    cy.get('[data-cy="workflow-document_edit-btn"]').click();
    cy.get('[data-cy="parameter-add_new_parameter_btn"]').click();
    let targetDropBoxCy = '[data-cy="parameter-parameter_setting-select"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 1, 'list');
    cy.get('[data-cy="parameter-list-list_form"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  list入力確認
  試験確認内容：list入力フォームに入力した値が表示されていることを確認
  */
  it("04-01-227:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-プロパティ設定確認-list入力確認-list入力フォームに入力した値が表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('parameterSetting.json').click();
    cy.get('[data-cy="workflow-document_edit-btn"]').click();
    cy.get('[data-cy="parameter-add_new_parameter_btn"]').click();
    let targetDropBoxCy = '[data-cy="parameter-parameter_setting-select"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 1, 'list');
    cy.get('[data-cy="parameter-list-list_form"]').type(10).find('input').should('have.value', 10);
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  list入力反映確認
  試験確認内容：list入力フォームに入力した値が反映されていることを確認
  */
  it("04-01-228:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-プロパティ設定確認-list入力反映確認-list入力フォームに入力した値が反映されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('parameterSetting.json').click();
    cy.get('[data-cy="workflow-document_edit-btn"]').click();
    // ターゲットファイル設定
    cy.get('[data-cy="target_files-add_target_file-btn"]').click();
    cy.get('[data-cy="target_files-target_file_name-text_field"]').type('run.sh');
    cy.get('[data-cy="target_files-ok-btn"]').click();
    cy.get('[data-cy="rapid-tab-tab_editor"]').type('VALUE=value');
    cy.get('[data-cy="rapid-tab-tab_editor"]').dblclick();
    cy.get('[data-cy="parameter-add_new_parameter_btn"]').click();
    let targetDropBoxCy = '[data-cy="parameter-parameter_setting-select"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 1, 'list');
    cy.get('[data-cy="parameter-list-list_form"]').type(10);
    cy.get('[data-cy="parameter-ok-btn"]').click();
    cy.get('[data-cy="rapid-save_all_files-btn"]').click();
    cy.get('[data-cy="rapid-tab-tab_editor"]').contains('VALUE={{ value }}').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  files表示確認
  試験確認内容：files入力フォームが表示されていることを確認
  */
  it("04-01-229:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-プロパティ設定確認-files表示確認-files入力フォームが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('parameterSetting.json').click();
    cy.get('[data-cy="workflow-document_edit-btn"]').click();
    cy.get('[data-cy="parameter-add_new_parameter_btn"]').click();
    let targetDropBoxCy = '[data-cy="parameter-parameter_setting-select"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 1, 'files');
    cy.get('[data-cy="parameter-files-list_form"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  files入力確認
  試験確認内容：files入力フォームに入力した値が表示されていることを確認
  */
  it("04-01-230:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-プロパティ設定確認-files入力確認-files入力フォームに入力した値が表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('parameterSetting.json').click();
    cy.get('[data-cy="workflow-document_edit-btn"]').click();
    cy.get('[data-cy="parameter-add_new_parameter_btn"]').click();
    let targetDropBoxCy = '[data-cy="parameter-parameter_setting-select"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 1, 'files');
    cy.get('[data-cy="parameter-files-list_form"]').type(10).find('input').should('have.value', 10);
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  files入力反映確認
  試験確認内容：files入力フォームに入力した値が反映されていることを確認
  */
  it("04-01-231:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-プロパティ設定確認-files入力反映確認-files入力フォームに入力した値が反映されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('parameterSetting.json').click();
    cy.get('[data-cy="workflow-document_edit-btn"]').click();
    // ターゲットファイル設定
    cy.get('[data-cy="target_files-add_target_file-btn"]').click();
    cy.get('[data-cy="target_files-target_file_name-text_field"]').type('run.sh');
    cy.get('[data-cy="target_files-ok-btn"]').click();
    cy.get('[data-cy="rapid-tab-tab_editor"]').type('VALUE=value');
    cy.get('[data-cy="rapid-tab-tab_editor"]').dblclick();
    cy.get('[data-cy="parameter-add_new_parameter_btn"]').click();
    let targetDropBoxCy = '[data-cy="parameter-parameter_setting-select"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 1, 'files');
    cy.get('[data-cy="parameter-files-list_form"]').type(10);
    cy.get('[data-cy="parameter-ok-btn"]').click();
    cy.get('[data-cy="rapid-save_all_files-btn"]').click();
    cy.get('[data-cy="rapid-tab-tab_editor"]').contains('VALUE={{ value }}').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  add new scatter settingボタン表示確認
  試験確認内容：scatter設定ダイアログが表示されることを確認
  */
  it("04-01-232:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-プロパティ設定確認-add new scatter settingボタン表示確認-scatter設定ダイアログが表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('parameterSetting.json').click();
    cy.get('[data-cy="workflow-document_edit-btn"]').click();
    cy.get('[data-cy="gather_scatter-add_new_setting_btn"]').eq(0).click();
    cy.contains('destination node').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  scatter-> srcName表示確認
  試験確認内容：srcNameテキストボックスが表示されていることを確認
  */
  it("04-01-233:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-プロパティ設定確認-scatter-> srcName表示確認-srcNameテキストボックスが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('parameterSetting.json').click();
    cy.get('[data-cy="workflow-document_edit-btn"]').click();
    cy.get('[data-cy="gather_scatter-add_new_setting_btn"]').eq(0).click();
    cy.get('[data-cy="gather_scatter-srcName_text_field"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  scatter->srcName入力確認
  試験確認内容：srcNameテキストボックスに入力した値が表示されていることを確認
  */
  it("04-01-234:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-プロパティ設定確認-scatter->srcName入力確認-srcNameテキストボックスに入力した値が表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('parameterSetting.json').click();
    cy.get('[data-cy="workflow-document_edit-btn"]').click();
    cy.get('[data-cy="gather_scatter-add_new_setting_btn"]').eq(0).click();
    cy.get('[data-cy="gather_scatter-srcName_text_field"]').type('testSrcName').find('input').should('have.value', 'testSrcName');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  scatter->dstName表示確認
  試験確認内容：dstNameテキストボックスが表示されていることを確認
  */
  it("04-01-235:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-プロパティ設定確認-scatter->dstName表示確認-dstNameテキストボックスが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('parameterSetting.json').click();
    cy.get('[data-cy="workflow-document_edit-btn"]').click();
    cy.get('[data-cy="gather_scatter-add_new_setting_btn"]').eq(0).click();
    cy.get('[data-cy="gather_scatter-dstName_text_field"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  scatter->dstName入力確認
  試験確認内容：dstNameテキストボックスに入力した値が表示されていることを確認
  */
  it("04-01-236:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-プロパティ設定確認-scatter->dstName入力確認-dstNameテキストボックスに入力した値が表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('parameterSetting.json').click();
    cy.get('[data-cy="workflow-document_edit-btn"]').click();
    cy.get('[data-cy="gather_scatter-add_new_setting_btn"]').eq(0).click();
    cy.get('[data-cy="gather_scatter-dstName_text_field"]').type('testDstName').find('input').should('have.value', 'testDstName');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  scatter入力反映確認
  試験確認内容：srcName、dstNameテキストボックスに入力した値が反映されていることを確認
  */
  it("04-01-237:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-プロパティ設定確認-scatter入力反映確認-srcName、dstNameテキストボックスに入力した値が反映されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('parameterSetting.json').click();
    cy.get('[data-cy="workflow-document_edit-btn"]').click();
    cy.get('[data-cy="gather_scatter-add_new_setting_btn"]').eq(0).click();
    cy.get('[data-cy="gather_scatter-srcName_text_field"]').type('testSrcName');
    cy.get('[data-cy="gather_scatter-dstName_text_field"]').type('testDstName');
    cy.get('[data-cy="gather_scatter-ok-btn"]').click();
    cy.get('[data-cy="parameter_editor-scatter-gather_scatter"]').contains('testSrcName').should('exist');
    cy.get('[data-cy="parameter_editor-scatter-gather_scatter"]').contains('testDstName').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  add new gather settingボタン表示確認
  試験確認内容：gather設定ダイアログが表示されることを確認
  */
  it("04-01-238:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-プロパティ設定確認-add new scatter settingボタン表示確認-scatter設定ダイアログが表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('parameterSetting.json').click();
    cy.get('[data-cy="workflow-document_edit-btn"]').click();
    cy.get('[data-cy="gather_scatter-add_new_setting_btn"]').eq(1).click();
    cy.contains('source node').should('exist');
  });

   /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  gather-> srcName表示確認
  試験確認内容：srcNameテキストボックスが表示されていることを確認
  */
  it("04-01-239:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-プロパティ設定確認-gather-> srcName表示確認-srcNameテキストボックスが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('parameterSetting.json').click();
    cy.get('[data-cy="workflow-document_edit-btn"]').click();
    cy.get('[data-cy="gather_scatter-add_new_setting_btn"]').eq(1).click();
    cy.get('[data-cy="gather_scatter-srcName_text_field"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  gather->srcName入力確認
  試験確認内容：srcNameテキストボックスに入力した値が表示されていることを確認
  */
  it("04-01-240:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-プロパティ設定確認-scatter->srcName入力確認-srcNameテキストボックスに入力した値が表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('parameterSetting.json').click();
    cy.get('[data-cy="workflow-document_edit-btn"]').click();
    cy.get('[data-cy="gather_scatter-add_new_setting_btn"]').eq(1).click();
    cy.get('[data-cy="gather_scatter-srcName_text_field"]').type('testSrcName').find('input').should('have.value', 'testSrcName');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  gather->dstName表示確認
  試験確認内容：dstNameテキストボックスが表示されていることを確認
  */
  it("04-01-241:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-プロパティ設定確認-gather->dstName表示確認-dstNameテキストボックスが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('parameterSetting.json').click();
    cy.get('[data-cy="workflow-document_edit-btn"]').click();
    cy.get('[data-cy="gather_scatter-add_new_setting_btn"]').eq(1).click();
    cy.get('[data-cy="gather_scatter-dstName_text_field"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  gather->dstName入力確認
  試験確認内容：dstNameテキストボックスに入力した値が表示されていることを確認
  */
  it("04-01-242:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-プロパティ設定確認-gather->dstName入力確認-dstNameテキストボックスに入力した値が表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('parameterSetting.json').click();
    cy.get('[data-cy="workflow-document_edit-btn"]').click();
    cy.get('[data-cy="gather_scatter-add_new_setting_btn"]').eq(1).click();
    cy.get('[data-cy="gather_scatter-dstName_text_field"]').type('testDstName').find('input').should('have.value', 'testDstName');
  });

  /** 
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  gather入力反映確認
  試験確認内容：srcName、dstNameテキストボックスに入力した値が反映されていることを確認
  */
  it("04-01-243:コンポーネントの基本機能動作確認-psコンポーネント共通機能確認-プロパティ設定確認-gather入力反映確認-srcName、dstNameテキストボックスに入力した値が反映されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('parameterSetting.json').click();
    cy.get('[data-cy="workflow-document_edit-btn"]').click();
    cy.get('[data-cy="gather_scatter-add_new_setting_btn"]').eq(1).click();
    cy.get('[data-cy="gather_scatter-srcName_text_field"]').type('testSrcName');
    cy.get('[data-cy="gather_scatter-dstName_text_field"]').type('testDstName');
    cy.get('[data-cy="gather_scatter-ok-btn"]').click();
    cy.get('[data-cy="parameter_editor-gather-gather_scatter"]').contains('testSrcName').should('exist');
    cy.get('[data-cy="parameter_editor-gather-gather_scatter"]').contains('testDstName').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  試験確認内容：プロパティが表示されることを確認
  */
  it("04-01-252:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-プロパティが表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-property-navigation_drawer"]';
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  試験確認内容：name入力テキストエリアが表示されていることを確認
  */
  it("04-01-253:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-name入力テキストエリアが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-name-text_field"]'
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  name入力
  試験確認内容：nameが入力できることを確認
  */
  it("04-01-254:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-name入力-nameが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    const INPUT_OBJ_CY = '[data-cy="component_property-name-text_field"]';
    cy.confirmInputValueReflection(INPUT_OBJ_CY, '-Test_Task', TAG_TYPE_INPUT);
  });

  /** 
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  name入力（使用可能文字確認）
  試験確認内容：nameが入力できないことを確認
  */
  it("04-01-255:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-name入力（使用可能文字確認）-nameが入力できないことを確認", () => {
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    const INPUT_OBJ_CY = '[data-cy="component_property-name-text_field"]';
    cy.confirmInputValueNotReflection(INPUT_OBJ_CY, 'Test*Task', TAG_TYPE_INPUT);
  });

  /** 
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  試験確認内容：説明入力テキストエリアが表示されていることを確認
  */
  it("04-01-256:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-description入力テキストエリアが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-description-textarea"]'
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  description入力
  試験確認内容：descriptionが入力できることを確認
  */
  it("04-01-257:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-description入力-descriptionが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    const INPUT_OBJ_CY = '[data-cy="component_property-description-textarea"]';
    cy.confirmInputValueReflection(INPUT_OBJ_CY, 'descriptionTest', TAG_TYPE_TEXT_AREA);
  });

  /** 
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  input files表示
  試験確認内容：input files入力テキストエリアが表示されていることを確認
  */
  it("04-01-258:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-input files表示-input files入力テキストエリアが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-input_files-list_form"]';
    const CLICK_AREA_CY = '[data-cy="component_property-in_out_files-panel_title"]';
    cy.confirmDisplayInPropertyByDetailsArea(DATA_CY_STR, CLICK_AREA_CY, null);
  });

  /** 
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  input files入力
  試験確認内容：input filesが入力できることを確認
  */
  it("04-01-259:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-input files入力-input filesが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true, false);
    cy.get('[data-cy="component_property-input_files-list_form"]').find('input').should('have.value', 'testInputFile');
  });

  /** 
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  input files反映確認
  試験確認内容：input filesが反映されることを確認
  */
  it("04-01-260:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-input files反映確認-input filesが反映されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true, true);
    cy.get('[data-cy="graph-component-row"]').contains('testInputFile').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  output files表示
  試験確認内容：output files入力テキストエリアが表示されていることを確認
  */
  it("04-01-261:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-output files表示-output files入力テキストエリアが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-output_files-list_form"]';
    const CLICK_AREA_CY = '[data-cy="component_property-in_out_files-panel_title"]';
    cy.confirmDisplayInPropertyByDetailsArea(DATA_CY_STR, CLICK_AREA_CY, null);
  });

  /** 
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  output files入力
  試験確認内容：output filesが入力できることを確認
  */
  it("04-01-262:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-output files入力-output filesが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, false);
    cy.get('[data-cy="component_property-output_files-list_form"]').find('input').should('have.value', 'testOutputFile');
  });

  /** 
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  output files反映確認
  試験確認内容：output filesが反映されることを確認
  */
  it("04-01-263:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-output files反映確認-output filesが反映されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, true);
    cy.get('[data-cy="graph-component-row"]').contains('testOutputFile').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  構成要素の機能確認
  closeボタン押下
  試験確認内容：プロパティが表示されていないことを確認
  */
  it("04-01-264:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-構成要素の機能確認-closeボタン押下-プロパティが表示されていないことを確認", () => {
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    cy.closeProperty();
    cy.get('[data-cy="component_property-property-navigation_drawer"]').should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  構成要素の機能確認
  cleanボタン押下
  試験確認内容：最新の保存状態に戻っていることを確認
  */
  it.skip("04-01-265:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-構成要素の機能確認-cleanボタン押下-最新の保存状態に戻っていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test-a', true);
    cy.get('[data-cy="component_property-loop_set_for-panel_title"]').click();
    cy.get('[data-cy="component_property-start_for-text_field"]').type('1');
    cy.get('[data-cy="component_property-end_for-text_field"]').type('5');
    cy.get('[data-cy="component_property-step_for-text_field"]').type('5');
    cy.get('[data-cy="workflow-play-btn"]').click();
    cy.clickComponentName(WORKFLOW_NAME_0);
    cy.get('[data-cy="component_property-name-text_field"]').find('input').clear();
    cy.get('[data-cy="component_property-name-text_field"]').type('changeName');
    cy.get('[data-cy="component_property-description-textarea"]').find('textarea').focus();
    cy.get('[data-cy="component_property-clean-btn"]').click();
    cy.get('[data-cy="component_property-name-text_field"]').find('input').should('have.value', 'test-a');
  });

  /** 
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  接続確認
  試験確認内容：コンポーネントが接続されていることを確認
  */
  it("04-01-267:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-ファイル転送設定の各パターンの確認-接続確認-コンポーネントが接続されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, true);
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_1, 300, 600);
    cy.connectComponent(WORKFLOW_NAME_1);  // コンポーネント同士を接続
    cy.checkConnectionLine(WORKFLOW_NAME_0, WORKFLOW_NAME_1);  // 作成したコンポーネントの座標を取得して接続線の座標と比較
  });

  /** 
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  シンポリックリンク確認（outputFile、inputFile一致）
  試験確認内容：シンポリックリンクが作成されていることを確認
  */
  it("04-01-268:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-ファイル転送設定の各パターンの確認-シンポリックリンク確認（outputFile、inputFile一致）-シンポリックリンクが作成されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    // ps0
    cy.createDirOrFile(TYPE_FILE, 'run.sh', true);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'run.sh', true, true);
    // ps1
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_1, 300, 600);
    cy.clickComponentName(WORKFLOW_NAME_1);
    cy.enterInputOrOutputFile(TYPE_INPUT, 'run.sh', true, true);
    cy.connectComponent(WORKFLOW_NAME_1);  // コンポーネント同士を接続
    cy.get('[data-cy="workflow-play-btn"]').click(); // 実行する
    cy.checkProjectStatus("finished");
    cy.clickComponentName(WORKFLOW_NAME_1);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('run.sh').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  シンポリックリンク確認（outputFileが通常、inputFileが空白）
  試験確認内容：シンポリックリンクが作成されていることを確認
  */
  it("04-01-269:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-シンポリックリンク確認（outputFileが通常、inputFileが空白）-シンポリックリンクが作成されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    // ps0
    cy.createDirOrFile(TYPE_FILE, 'run.sh', true);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'run.sh', true, true);
    // ps1
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_1, 300, 600);
    cy.clickComponentName(WORKFLOW_NAME_1);
    cy.connectComponent(WORKFLOW_NAME_1);  // コンポーネント同士を接続
    cy.get('[data-cy="workflow-play-btn"]').click(); // 実行する
    cy.checkProjectStatus("finished");
    cy.clickComponentName(WORKFLOW_NAME_1);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('run.sh').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  シンポリックリンク確認（outputFileが通常、inputFileが「/」で終わらない文字列）
  試験確認内容：シンポリックリンクが作成されていることを確認
  */
  it("04-01-270:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-シンポリックリンク確認（outputFileが通常、inputFileが「/」で終わらない文字列）-シンポリックリンクが作成されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    // ps0
    cy.createDirOrFile(TYPE_FILE, 'run.sh', true);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'run.sh', true, true);
    // ps1
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_1, 300, 600);
    cy.clickComponentName(WORKFLOW_NAME_1);
    cy.connectComponent(WORKFLOW_NAME_1);  // コンポーネント同士を接続
    cy.get('[data-cy="component_property-in_out_files-panel_title"]').click();
    cy.get('[data-cy="component_property-input_files-list_form"]').contains('run.sh').click();
    cy.get('[data-cy="list_form_property-edit-text_field"]').find('input').clear().type('while1.sh{enter}'); // inputFileの値を変更
    cy.closeProperty();
    cy.get('[data-cy="workflow-play-btn"]').click(); // 実行する
    cy.checkProjectStatus("finished");
    cy.clickComponentName(WORKFLOW_NAME_1);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('while1.sh').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  シンポリックリンク確認（outputFileがglob(*や\?など)を含むパス、inputFileが「/」で終わらない文字列）
  試験確認内容：シンポリックリンクが作成されていることを確認
  */
  it("04-01-271:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-シンポリックリンク確認（outputFileがglob(*や\?など)を含むパス、inputFileが「/」で終わらない文字列）-シンポリックリンクが作成されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    // Workflow0
    cy.createDirOrFile(TYPE_FILE, 'run-a.sh', true);
    cy.createDirOrFile(TYPE_FILE, 'run-b.sh', false);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'run*', true, true);
    // Workflow1
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_1, 300, 600);
    cy.clickComponentName(WORKFLOW_NAME_1);
    cy.connectComponent(WORKFLOW_NAME_1);  // コンポーネント同士を接続
    cy.get('[data-cy="component_property-in_out_files-panel_title"]').click();
    cy.get('[data-cy="component_property-input_files-list_form"]').contains('run*').click();
    cy.get('[data-cy="list_form_property-edit-text_field"]').find('input').clear().type('while1-run{enter}'); // inputFileの値を変更
    cy.closeProperty();
    cy.get('[data-cy="workflow-play-btn"]').click(); // 実行する
    cy.checkProjectStatus("finished");
    cy.clickComponentName(WORKFLOW_NAME_1);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('while1-run').should('exist').click();   
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('run-a.sh').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('run-b.sh').should('exist'); 
  });

   /** 
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  シンポリックリンク確認（input filesが’/’で終わる文字列のとき）
  試験確認内容：シンポリックリンクが作成されていることを確認
  */
  it("04-01-272:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-シンポリックリンク確認（input filesが’/’で終わる文字列のとき）-シンポリックリンクが作成されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    // Workflow0
    cy.createDirOrFile(TYPE_FILE, 'run-a.sh', true);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'run-a.sh', true, true);
    // Workflow1
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_1, 300, 600);
    cy.clickComponentName(WORKFLOW_NAME_1);
    cy.connectComponent(WORKFLOW_NAME_1);  // コンポーネント同士を接続
    cy.get('[data-cy="component_property-in_out_files-panel_title"]').click();
    cy.get('[data-cy="component_property-input_files-list_form"]').contains('run-a.sh').click();
    cy.get('[data-cy="list_form_property-edit-text_field"]').find('input').clear().type('while1-run/{enter}'); // inputFileの値を変更
    cy.closeProperty();
    cy.get('[data-cy="workflow-play-btn"]').click(); // 実行する
    cy.checkProjectStatus("finished");
    cy.clickComponentName(WORKFLOW_NAME_1);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('while1-run').should('exist').click();   
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('run-a.sh').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除ボタン表示確認（input file）
  試験確認内容：削除ボタンが表示されることを確認
  */
  it("04-01-273:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除ボタン表示確認（input file）-削除ボタンが表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true, true);
    cy.get('[data-cy="action_row-delete-btn"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除ボタン表示確認（output file）
  試験確認内容：削除ボタンが表示されることを確認
  */
  it("04-01-274:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除ボタン表示確認（output file）-削除ボタンが表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, true);
    cy.get('[data-cy="action_row-delete-btn"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除反映確認（input file）
  試験確認内容：input fileが削除されていることを確認
  skip:issue#942
  */
  it.skip("04-01-275:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除反映確認（input file）-input fileが削除されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true, true);
    cy.get('[data-cy="action_row-delete-btn"]').click();
    cy.get('[data-cy="graph-component-row"]').contains('testInputFile').should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除反映確認（output file）
  試験確認内容：output fileが削除されていることを確認
  skip:issue#942
  */
  it.skip("04-01-276:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除反映確認（output file）-output fileが削除されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, true);
    cy.get('[data-cy="action_row-delete-btn"]').click();
    cy.get('[data-cy="graph-component-row"]').contains('testOutputFile').should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ単体表示
  試験確認内容：ディレクトリが単体表示されることを確認
  */
  it("04-01-277:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ単体表示-ディレクトリが単体表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test-a', true);
    cy.createDirOrFile(TYPE_DIR, 'test-b', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-b').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ複数表示（リロード前）
  試験確認内容：ディレクトリが単体表示されることを確認
  */
  it("04-01-278:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ複数表示（リロード前）-ディレクトリが単体表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test1', true);
    cy.createDirOrFile(TYPE_DIR, 'test2', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test1').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test2').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ複数表示（リロード後）
  試験確認内容：ディレクトリが複数表示されることを確認
  */
  it("04-01-279:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ複数表示（リロード後）-ディレクトリが複数表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test1', true);
    cy.createDirOrFile(TYPE_DIR, 'test2', false);
    cy.closeProperty();
    cy.clickComponentName(WORKFLOW_NAME_0);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test*').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  ファイル操作エリア
  ファイル単体表示
  試験確認内容：ファイルが単体表示されることを確認
  */
  it("04-01-280:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-ファイル操作エリア-ファイル単体表示-ファイルが単体表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test-a', true);
    cy.createDirOrFile(TYPE_FILE, 'test-b', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-b').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  ファイル操作エリア
  ファイル複数表示（リロード前）
  試験確認内容：ファイルが単体表示されることを確認
  */
  it("04-01-281:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-ファイル操作エリア-ファイル複数表示（リロード前）-ファイルが単体表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test1', true);
    cy.createDirOrFile(TYPE_FILE, 'test2', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test1').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test2').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  ファイル操作エリア
  ファイル複数表示（リロード後）
  試験確認内容：ファイルが複数表示されることを確認
  */
  it("04-01-282:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-ファイル操作エリア-ファイル複数表示（リロード後）-ファイルが複数表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test1', true);
    cy.createDirOrFile(TYPE_FILE, 'test2', false);
    cy.closeProperty();
    cy.clickComponentName(WORKFLOW_NAME_0);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test*').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ディレクトリ表示
  試験確認内容：ディレクトリ内にディレクトリが作成されることを確認
  */
  it("04-01-283:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ内ディレクトリ表示-ディレクトリ内にディレクトリが作成されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test-a', true);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').click();
    cy.createDirOrFile(TYPE_DIR, 'test-b', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-b').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ファイル表示
  試験確認内容：ディレクトリ内にファイルが作成されることを確認
  */
  it("04-01-284:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ内ファイル表示-ディレクトリ内にファイルが作成されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test-a', true);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').click();
    cy.createDirOrFile(TYPE_FILE, 'test.txt', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test.txt').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Workflowコンポーネント共通機能確認
  各コンポーネントの追加/削除確認
  該当コンポーネント削除確認
  試験確認内容：コンポーネントが削除されていることを確認
  */
  it("04-01-285:コンポーネントの基本機能動作確認-Workflowコンポーネント共通機能確認-各コンポーネントの追加/削除確認-該当コンポーネント削除確認-コンポーネントが削除されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 500);
    cy.deleteComponent(WORKFLOW_NAME_0);
    cy.get('[data-cy="graph-component-row"]').contains(WORKFLOW_NAME_0).should('not.exist');
  });

  /** 
    コンポーネントの基本機能動作確認
    Storageコンポーネント共通機能確認
    試験確認内容：プロパティが表示されることを確認
    */
  it("04-01-286:コンポーネントの基本機能動作確認-Storageコンポーネント共通機能確認-プロパティが表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STORAGE, STORAGE_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-property-navigation_drawer"]';
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  Storageコンポーネント共通機能確認
  試験確認内容：name入力テキストエリアが表示されていることを確認
  */
  it("04-01-287:コンポーネントの基本機能動作確認-Storageコンポーネント共通機能確認-name入力テキストエリアが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STORAGE, STORAGE_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-name-text_field"]'
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  Storageコンポーネント共通機能確認
  name入力
  試験確認内容：nameが入力できることを確認
  */
  it("04-01-288:コンポーネントの基本機能動作確認-Storageコンポーネント共通機能確認-name入力-nameが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STORAGE, STORAGE_NAME_0, 300, 500);
    const INPUT_OBJ_CY = '[data-cy="component_property-name-text_field"]';
    cy.confirmInputValueReflection(INPUT_OBJ_CY, '-Test_Task', TAG_TYPE_INPUT);
  });

  /** 
  コンポーネントの基本機能動作確認
  Storageコンポーネント共通機能確認
  name入力（使用可能文字確認）
  試験確認内容：nameが入力できないことを確認
  */
  it("04-01-289:コンポーネントの基本機能動作確認-Storageコンポーネント共通機能確認-name入力（使用可能文字確認）-nameが入力できないことを確認", () => {
    cy.createComponent(DEF_COMPONENT_STORAGE, STORAGE_NAME_0, 300, 500);
    const INPUT_OBJ_CY = '[data-cy="component_property-name-text_field"]';
    cy.confirmInputValueNotReflection(INPUT_OBJ_CY, 'Test*Task', TAG_TYPE_INPUT);
  });

  /** 
    コンポーネントの基本機能動作確認
    Storageコンポーネント共通機能確認
    試験確認内容：説明入力テキストエリアが表示されていることを確認
    */
  it("04-01-290:コンポーネントの基本機能動作確認-Storageコンポーネント共通機能確認-description入力テキストエリアが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STORAGE, STORAGE_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-description-textarea"]'
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  Storageコンポーネント共通機能確認
  description入力
  試験確認内容：descriptionが入力できることを確認
  */
  it("04-01-291:コンポーネントの基本機能動作確認-Storageコンポーネント共通機能確認-description入力-descriptionが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STORAGE, STORAGE_NAME_0, 300, 500);
    const INPUT_OBJ_CY = '[data-cy="component_property-description-textarea"]';
    cy.confirmInputValueReflection(INPUT_OBJ_CY, 'descriptionTest', TAG_TYPE_TEXT_AREA);
  });

  /** 
  コンポーネントの基本機能動作確認
  Storageコンポーネント共通機能確認
  input files表示
  試験確認内容：input files入力テキストエリアが表示されていることを確認
  */
  it("04-01-292:コンポーネントの基本機能動作確認-Storageコンポーネント共通機能確認-input files表示-input files入力テキストエリアが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STORAGE, STORAGE_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-input_files-list_form"]';
    const CLICK_AREA_CY = '[data-cy="component_property-in_out_files-panel_title"]';
    cy.confirmDisplayInPropertyByDetailsArea(DATA_CY_STR, CLICK_AREA_CY, null);
  });

  /** 
  コンポーネントの基本機能動作確認
  Storageコンポーネント共通機能確認
  input files入力
  試験確認内容：input filesが入力できることを確認
  */
  it("04-01-293:コンポーネントの基本機能動作確認-Storageコンポーネント共通機能確認-input files入力-input filesが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STORAGE, STORAGE_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true, false);
    cy.get('[data-cy="component_property-input_files-list_form"]').find('input').should('have.value', 'testInputFile');
  });

  /** 
  コンポーネントの基本機能動作確認
  Storageコンポーネント共通機能確認
  input files反映確認
  試験確認内容：input filesが反映されることを確認
  */
  it("04-01-294:コンポーネントの基本機能動作確認-Storageコンポーネント共通機能確認-input files反映確認-input filesが反映されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STORAGE, STORAGE_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true, true);
    cy.get('[data-cy="graph-component-row"]').contains('testInputFile').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Storageコンポーネント共通機能確認
  output files表示
  試験確認内容：output files入力テキストエリアが表示されていることを確認
  */
  it("04-01-295:コンポーネントの基本機能動作確認-Storageコンポーネント共通機能確認-output files表示-output files入力テキストエリアが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STORAGE, STORAGE_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-output_files-list_form"]';
    const CLICK_AREA_CY = '[data-cy="component_property-in_out_files-panel_title"]';
    cy.confirmDisplayInPropertyByDetailsArea(DATA_CY_STR, CLICK_AREA_CY, null);
  });

  /** 
  コンポーネントの基本機能動作確認
  Storageコンポーネント共通機能確認
  output files入力
  試験確認内容：output filesが入力できることを確認
  */
  it("04-01-296:コンポーネントの基本機能動作確認-Storageコンポーネント共通機能確認-output files入力-output filesが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STORAGE, STORAGE_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, false);
    cy.get('[data-cy="component_property-output_files-list_form"]').find('input').should('have.value', 'testOutputFile');
  });

  /** 
  コンポーネントの基本機能動作確認
  Storageコンポーネント共通機能確認
  output files反映確認
  試験確認内容：output filesが反映されることを確認
  */
  it("04-01-297:コンポーネントの基本機能動作確認-Storageコンポーネント共通機能確認-output files反映確認-output filesが反映されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STORAGE, STORAGE_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, true);
    cy.get('[data-cy="graph-component-row"]').contains('testOutputFile').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Storageコンポーネント共通機能確認
  構成要素の機能確認
  closeボタン押下
  試験確認内容：プロパティが表示されていないことを確認
  */
  it("04-01-298:コンポーネントの基本機能動作確認-Storageコンポーネント共通機能確認-構成要素の機能確認-closeボタン押下-プロパティが表示されていないことを確認", () => {
    cy.createComponent(DEF_COMPONENT_STORAGE, STORAGE_NAME_0, 300, 500);
    cy.closeProperty();
    cy.get('[data-cy="component_property-property-navigation_drawer"]').should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Storageコンポーネント共通機能確認
  構成要素の機能確認
  cleanボタン押下
  試験確認内容：最新の保存状態に戻っていることを確認
  */
  it.skip("04-01-299:コンポーネントの基本機能動作確認-Storageコンポーネント共通機能確認-構成要素の機能確認-cleanボタン押下-最新の保存状態に戻っていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STORAGE, STORAGE_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test-a', true);
    cy.get('[data-cy="component_property-loop_set_for-panel_title"]').click();
    cy.get('[data-cy="component_property-start_for-text_field"]').type('1');
    cy.get('[data-cy="component_property-end_for-text_field"]').type('5');
    cy.get('[data-cy="component_property-step_for-text_field"]').type('5');
    cy.get('[data-cy="workflow-play-btn"]').click();
    cy.clickComponentName(STORAGE_NAME_0);
    cy.get('[data-cy="component_property-name-text_field"]').find('input').clear();
    cy.get('[data-cy="component_property-name-text_field"]').type('changeName');
    cy.get('[data-cy="component_property-description-textarea"]').find('textarea').focus();
    cy.get('[data-cy="component_property-clean-btn"]').click();
    cy.get('[data-cy="component_property-name-text_field"]').find('input').should('have.value', 'test-a');
  });

  /** 
  コンポーネントの基本機能動作確認
  Storageコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  接続確認
  試験確認内容：コンポーネントが接続されていることを確認
  */
  it("04-01-301:コンポーネントの基本機能動作確認-Storageコンポーネント共通機能確認-ファイル転送設定の各パターンの確認-接続確認-コンポーネントが接続されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STORAGE, STORAGE_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, true);
    cy.createComponent(DEF_COMPONENT_STORAGE, STORAGE_NAME_1, 300, 600);
    cy.connectComponent(STORAGE_NAME_1);  // コンポーネント同士を接続
    cy.checkConnectionLine(STORAGE_NAME_0, STORAGE_NAME_1);  // 作成したコンポーネントの座標を取得して接続線の座標と比較
  });

  /** 
  コンポーネントの基本機能動作確認
  Storageコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除ボタン表示確認（input file）
  試験確認内容：削除ボタンが表示されることを確認
  */
  it("04-01-307:コンポーネントの基本機能動作確認-Storageコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除ボタン表示確認（input file）-削除ボタンが表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STORAGE, STORAGE_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true, true);
    cy.get('[data-cy="action_row-delete-btn"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  Storageコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除ボタン表示確認（output file）
  試験確認内容：削除ボタンが表示されることを確認
  */
  it("04-01-308:コンポーネントの基本機能動作確認-Storageコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除ボタン表示確認（output file）-削除ボタンが表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STORAGE, STORAGE_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, true);
    cy.get('[data-cy="action_row-delete-btn"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  Storageコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除反映確認（input file）
  試験確認内容：input fileが削除されていることを確認
  skip:issue#942
  */
  it.skip("04-01-309:コンポーネントの基本機能動作確認-Storageコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除反映確認（input file）-input fileが削除されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STORAGE, STORAGE_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true, true);
    cy.get('[data-cy="action_row-delete-btn"]').click();
    cy.get('[data-cy="graph-component-row"]').contains('testInputFile').should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Storageコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除反映確認（output file）
  試験確認内容：output fileが削除されていることを確認
  skip:issue#942
  */
  it.skip("04-01-310:コンポーネントの基本機能動作確認-Storageコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除反映確認（output file）-output fileが削除されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STORAGE, STORAGE_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, true);
    cy.get('[data-cy="action_row-delete-btn"]').click();
    cy.get('[data-cy="graph-component-row"]').contains('testOutputFile').should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Storageコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ単体表示
  試験確認内容：ディレクトリが単体表示されることを確認
  */
  it("04-01-311:コンポーネントの基本機能動作確認-Storageコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ単体表示-ディレクトリが単体表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STORAGE, STORAGE_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-directory_path-text_field"]').type(wheelPath);
    cy.createDirOrFile(TYPE_DIR, 'test-a', true);
    cy.createDirOrFile(TYPE_DIR, 'test-b', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-b').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').click();
    cy.get('[data-cy="file_browser-remove_file-btn"]').click();
    cy.get('[data-cy="file_browser-dialog-dialog"]').find('button').first().click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-b').click();
    cy.get('[data-cy="file_browser-remove_file-btn"]').click();
    cy.get('[data-cy="file_browser-dialog-dialog"]').find('button').first().click();
  });

  /** 
  コンポーネントの基本機能動作確認
  Storageコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ複数表示（リロード前）
  試験確認内容：ディレクトリが単体表示されることを確認
  */
  it("04-01-312:コンポーネントの基本機能動作確認-Storageコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ複数表示（リロード前）-ディレクトリが単体表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STORAGE, STORAGE_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-directory_path-text_field"]').type(wheelPath);
    cy.createDirOrFile(TYPE_DIR, 'test1', true);
    cy.createDirOrFile(TYPE_DIR, 'test2', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test1').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test2').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test1').click();
    cy.get('[data-cy="file_browser-remove_file-btn"]').click();
    cy.get('[data-cy="file_browser-dialog-dialog"]').find('button').first().click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test2').click();
    cy.get('[data-cy="file_browser-remove_file-btn"]').click();
    cy.get('[data-cy="file_browser-dialog-dialog"]').find('button').first().click();
  });

  /** 
  コンポーネントの基本機能動作確認
  Storageコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ複数表示（リロード後）
  試験確認内容：ディレクトリが複数表示されることを確認
  */
  it("04-01-313:コンポーネントの基本機能動作確認-Storageコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ複数表示（リロード後）-ディレクトリが複数表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STORAGE, STORAGE_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-directory_path-text_field"]').type(wheelPath);
    cy.createDirOrFile(TYPE_DIR, 'test1', true);
    cy.createDirOrFile(TYPE_DIR, 'test2', false);
    cy.closeProperty();
    cy.clickComponentName(STORAGE_NAME_0);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test*').should('exist').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test1').click();
    cy.get('[data-cy="file_browser-remove_file-btn"]').click();
    cy.get('[data-cy="file_browser-dialog-dialog"]').find('button').first().click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test2').click();
    cy.get('[data-cy="file_browser-remove_file-btn"]').click();
    cy.get('[data-cy="file_browser-dialog-dialog"]').find('button').first().click();
  });

  /** 
  コンポーネントの基本機能動作確認
  Storageコンポーネント共通機能確認
  ファイル操作エリア
  ファイル単体表示
  試験確認内容：ファイルが単体表示されることを確認
  */
  it("04-01-314:コンポーネントの基本機能動作確認-Storageコンポーネント共通機能確認-ファイル操作エリア-ファイル単体表示-ファイルが単体表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STORAGE, STORAGE_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-directory_path-text_field"]').type(wheelPath);
    cy.createDirOrFile(TYPE_FILE, 'test-a', true);
    cy.createDirOrFile(TYPE_FILE, 'test-b', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-b').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').click();
    cy.get('[data-cy="file_browser-remove_file-btn"]').click();
    cy.get('[data-cy="file_browser-dialog-dialog"]').find('button').first().click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-b').click();
    cy.get('[data-cy="file_browser-remove_file-btn"]').click();
    cy.get('[data-cy="file_browser-dialog-dialog"]').find('button').first().click();
  });

  /** 
  コンポーネントの基本機能動作確認
  Storageコンポーネント共通機能確認
  ファイル操作エリア
  ファイル複数表示（リロード前）
  試験確認内容：ファイルが単体表示されることを確認
  */
  it("04-01-315:コンポーネントの基本機能動作確認-Storageコンポーネント共通機能確認-ファイル操作エリア-ファイル複数表示（リロード前）-ファイルが単体表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STORAGE, STORAGE_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-directory_path-text_field"]').type(wheelPath);
    cy.createDirOrFile(TYPE_FILE, 'test1', true);
    cy.createDirOrFile(TYPE_FILE, 'test2', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test1').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test2').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test1').click();
    cy.get('[data-cy="file_browser-remove_file-btn"]').click();
    cy.get('[data-cy="file_browser-dialog-dialog"]').find('button').first().click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test2').click();
    cy.get('[data-cy="file_browser-remove_file-btn"]').click();
    cy.get('[data-cy="file_browser-dialog-dialog"]').find('button').first().click();
  });

  /** 
  コンポーネントの基本機能動作確認
  Storageコンポーネント共通機能確認
  ファイル操作エリア
  ファイル複数表示（リロード後）
  試験確認内容：ファイルが複数表示されることを確認
  */
  it("04-01-316:コンポーネントの基本機能動作確認-Storageコンポーネント共通機能確認-ファイル操作エリア-ファイル複数表示（リロード後）-ファイルが複数表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STORAGE, STORAGE_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-directory_path-text_field"]').type(wheelPath);
    cy.createDirOrFile(TYPE_FILE, 'test1', true);
    cy.createDirOrFile(TYPE_FILE, 'test2', false);
    cy.closeProperty();
    cy.clickComponentName(STORAGE_NAME_0);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test*').should('exist').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test1').click();
    cy.get('[data-cy="file_browser-remove_file-btn"]').click();
    cy.get('[data-cy="file_browser-dialog-dialog"]').find('button').first().click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test2').click();
    cy.get('[data-cy="file_browser-remove_file-btn"]').click();
    cy.get('[data-cy="file_browser-dialog-dialog"]').find('button').first().click();
  });

  /** 
  コンポーネントの基本機能動作確認
  Storageコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ディレクトリ表示
  試験確認内容：ディレクトリ内にディレクトリが作成されることを確認
  */
  it("04-01-317:コンポーネントの基本機能動作確認-Storageコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ内ディレクトリ表示-ディレクトリ内にディレクトリが作成されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STORAGE, STORAGE_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-directory_path-text_field"]').type(wheelPath);
    cy.createDirOrFile(TYPE_DIR, 'test-a', true);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').click();
    cy.createDirOrFile(TYPE_DIR, 'test-b', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-b').should('exist').click();
    cy.get('[data-cy="file_browser-remove_file-btn"]').click();
    cy.get('[data-cy="file_browser-dialog-dialog"]').find('button').first().click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').click();
    cy.get('[data-cy="file_browser-remove_file-btn"]').click();
    cy.get('[data-cy="file_browser-dialog-dialog"]').find('button').first().click();
  });

  /** 
  コンポーネントの基本機能動作確認
  Storageコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ファイル表示
  試験確認内容：ディレクトリ内にファイルが作成されることを確認
  */
  it("04-01-318:コンポーネントの基本機能動作確認-Storageコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ内ファイル表示-ディレクトリ内にファイルが作成されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STORAGE, STORAGE_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-directory_path-text_field"]').type(wheelPath);
    cy.createDirOrFile(TYPE_DIR, 'test-a', true);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').click();
    cy.createDirOrFile(TYPE_FILE, 'test.txt', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test.txt').should('exist').click();
    cy.get('[data-cy="file_browser-remove_file-btn"]').click();
    cy.get('[data-cy="file_browser-dialog-dialog"]').find('button').first().click();
  });

  /** 
  コンポーネントの基本機能動作確認
  Storageコンポーネント共通機能確認
  各コンポーネントの追加/削除確認
  該当コンポーネント削除確認
  試験確認内容：コンポーネントが削除されていることを確認
  */
  it("04-01-319:コンポーネントの基本機能動作確認-Storageコンポーネント共通機能確認-各コンポーネントの追加/削除確認-該当コンポーネント削除確認-コンポーネントが削除されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STORAGE, STORAGE_NAME_0, 300, 500);
    cy.deleteComponent(STORAGE_NAME_0);
    cy.get('[data-cy="graph-component-row"]').contains(STORAGE_NAME_0).should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Storageコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  host表示確認
  試験確認内容：hostセレクトボックスが表示されていることを確認
  */
  it("04-01-320:コンポーネントの基本機能動作確認-Storageコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-host表示確認-hostセレクトボックスが表示されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STORAGE, STORAGE_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-host-select"]'
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  Storageコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  host選択確認（localhost以外を選択）
  試験確認内容：hostセレクトボックスで選択した値が表示されていることを確認
  */
  it("04-01-321:コンポーネントの基本機能動作確認-Storageコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-host選択確認（localhost以外を選択）-hostセレクトボックスで選択した値が表示されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STORAGE, STORAGE_NAME_0, 300, 500);
    // 新規リモートホスト設定を作成
    cy.visit("/remotehost");
    cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
    cy.enterRequiredRemoteHost('TestLabel', 'TestHostname', 8000, 'testUser');
    cy.get('[data-cy="add_new_host-ok-btn"]').click();
    // ホーム画面からプロジェクトを開き検証を行う
    cy.visit("/");
    cy.openProject();
    cy.clickComponentName(STORAGE_NAME_0);
    cy.get('[data-cy="component_property-host-select"]').type('TestLabel');
    cy.get('[data-cy="component_property-host-select"]').contains('TestLabel').should('exist');
    cy.removeRemoteHost('TestLabel');
  });

  /** 
  コンポーネントの基本機能動作確認
  Storageコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  host選択確認（localhost以外を選択）
  試験確認内容：hostセレクトボックスで選択した値が反映されていることを確認
  */
  it("04-01-322:コンポーネントの基本機能動作確認-Storageコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-hostファイル選択表示確認-hostセレクトボックスで選択したファイルが表示されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STORAGE, STORAGE_NAME_0, 300, 500);
    // 新規リモートホスト設定を作成
    cy.visit("/remotehost");
    cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
    cy.enterRequiredRemoteHost('TestLabel', 'TestHostname', 8000, 'testUser');
    cy.get('[data-cy="add_new_host-ok-btn"]').click();
    // ホーム画面からプロジェクトを開き検証を行う
    cy.visit("/");
    cy.openProject();
    cy.clickComponentName(STORAGE_NAME_0);
    cy.get('[data-cy="component_property-host-select"]').type('TestLabel');
    cy.saveProperty();
    cy.get('[data-cy="component_property-host-select"]').contains('TestLabel').should('exist');
    cy.removeRemoteHost('TestLabel');
  });

  /** 
  コンポーネントの基本機能動作確認
  Storageコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  directory path表示確認
  試験確認内容：directory pathテキストボックスが表示されていることを確認
  */
  it("04-01-323:コンポーネントの基本機能動作確認-Storageコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-directory path表示確認-directory pathテキストボックスが表示されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STORAGE, STORAGE_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-directory_path-text_field"]'
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  Storageコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  directory path入力確認
  試験確認内容：directory pathが入力できることを確認
  */
  it("04-01-324:コンポーネントの基本機能動作確認-Storageコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-directory path入力確認-directory pathが入力できることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STORAGE, STORAGE_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-directory_path-text_field"]').type('test/test');
    cy.get('[data-cy="component_property-directory_path-text_field"]').find('input').should('have.value', 'test/test');
  });

  /** 
  コンポーネントの基本機能動作確認
  Storageコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  directory path入力反映確認
  試験確認内容：directory pathが反映されることを確認
  */
  it("04-01-325:コンポーネントの基本機能動作確認-Storageコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-directory path入力反映確認-directory pathが反映されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STORAGE, STORAGE_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-directory_path-text_field"]').type('test/test');
    cy.closeProperty();
    cy.clickComponentName(STORAGE_NAME_0);
    cy.get('[data-cy="component_property-directory_path-text_field"]').find('input').should('have.value', 'test/test');
  });

  /** 
  コンポーネントの基本機能動作確認
  Sourceコンポーネント共通機能確認
  試験確認内容：プロパティが表示されることを確認
  */
  it("04-01-326:コンポーネントの基本機能動作確認-Sourceコンポーネント共通機能確認-プロパティが表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_SOURCE, SOURCE_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-property-navigation_drawer"]';
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  Sourceコンポーネント共通機能確認
  試験確認内容：name入力テキストエリアが表示されていることを確認
  */
  it("04-01-327:コンポーネントの基本機能動作確認-Sourceコンポーネント共通機能確認-name入力テキストエリアが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_SOURCE, SOURCE_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-name-text_field"]'
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  Sourceコンポーネント共通機能確認
  name入力
  試験確認内容：nameが入力できることを確認
  */
  it("04-01-328:コンポーネントの基本機能動作確認-Sourceコンポーネント共通機能確認-name入力-nameが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_SOURCE, SOURCE_NAME_0, 300, 500);
    const INPUT_OBJ_CY = '[data-cy="component_property-name-text_field"]';
    cy.confirmInputValueReflection(INPUT_OBJ_CY, '-Test_Task', TAG_TYPE_INPUT);
  });

  /** 
  コンポーネントの基本機能動作確認
  Sourceコンポーネント共通機能確認
  name入力（使用可能文字確認）
  試験確認内容：nameが入力できないことを確認
  */
  it("04-01-329:コンポーネントの基本機能動作確認-Sourceコンポーネント共通機能確認-name入力（使用可能文字確認）-nameが入力できないことを確認", () => {
    cy.createComponent(DEF_COMPONENT_SOURCE, SOURCE_NAME_0, 300, 500);
    const INPUT_OBJ_CY = '[data-cy="component_property-name-text_field"]';
    cy.confirmInputValueNotReflection(INPUT_OBJ_CY, 'Test*Task', TAG_TYPE_INPUT);
  });

  /** 
  コンポーネントの基本機能動作確認
  Sourceコンポーネント共通機能確認
  試験確認内容：説明入力テキストエリアが表示されていることを確認
  */
  it("04-01-330:コンポーネントの基本機能動作確認-Sourceコンポーネント共通機能確認-description入力テキストエリアが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_SOURCE, SOURCE_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-description-textarea"]'
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  Sourceコンポーネント共通機能確認
  description入力
  試験確認内容：descriptionが入力できることを確認
  */
  it("04-01-331:コンポーネントの基本機能動作確認-Sourceコンポーネント共通機能確認-description入力-descriptionが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_SOURCE, SOURCE_NAME_0, 300, 500);
    const INPUT_OBJ_CY = '[data-cy="component_property-description-textarea"]';
    cy.confirmInputValueReflection(INPUT_OBJ_CY, 'descriptionTest', TAG_TYPE_TEXT_AREA);
  });

  /** 
  コンポーネントの基本機能動作確認
  Sourceコンポーネント共通機能確認
  構成要素の機能確認
  closeボタン押下
  試験確認内容：プロパティが表示されていないことを確認
  */
  it("04-01-332:コンポーネントの基本機能動作確認-Sourceコンポーネント共通機能確認-構成要素の機能確認-closeボタン押下-プロパティが表示されていないことを確認", () => {
    cy.createComponent(DEF_COMPONENT_SOURCE, SOURCE_NAME_0, 300, 500);
    cy.closeProperty();
    cy.get('[data-cy="component_property-property-navigation_drawer"]').should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Sourceコンポーネント共通機能確認
  構成要素の機能確認
  cleanボタン押下
  試験確認内容：最新の保存状態に戻っていることを確認
  */
  it.skip("04-01-333:コンポーネントの基本機能動作確認-Sourceコンポーネント共通機能確認-構成要素の機能確認-cleanボタン押下-最新の保存状態に戻っていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_SOURCE, SOURCE_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test-a', true);
    cy.get('[data-cy="component_property-loop_set_for-panel_title"]').click();
    cy.get('[data-cy="component_property-start_for-text_field"]').type('1');
    cy.get('[data-cy="component_property-end_for-text_field"]').type('5');
    cy.get('[data-cy="component_property-step_for-text_field"]').type('5');
    cy.get('[data-cy="workflow-play-btn"]').click();
    cy.clickComponentName(SOURCE_NAME_0);
    cy.get('[data-cy="component_property-name-text_field"]').find('input').clear();
    cy.get('[data-cy="component_property-name-text_field"]').type('changeName');
    cy.get('[data-cy="component_property-description-textarea"]').find('textarea').focus();
    cy.get('[data-cy="component_property-clean-btn"]').click();
    cy.get('[data-cy="component_property-name-text_field"]').find('input').should('have.value', 'test-a');
  });

  /** 
  コンポーネントの基本機能動作確認
  Sourceコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  接続確認
  試験確認内容：コンポーネントが接続されていることを確認
  */
  it("04-01-334:コンポーネントの基本機能動作確認-Storageコンポーネント共通機能確認-ファイル転送設定の各パターンの確認-接続確認-コンポーネントが接続されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_SOURCE, SOURCE_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-upload_setting-panel_title"]').click();
    cy.createDirOrFile(TYPE_FILE, 'test-a', true);
    let targetDropBoxCy = '[data-cy="component_property-source_file_name-autocomplete"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 3, 'test-a');
    cy.createComponent(DEF_COMPONENT_TASK, TASK_NAME_0, 300, 600);
    cy.connectComponent(TASK_NAME_0);  // コンポーネント同士を接続
    cy.checkConnectionLine(SOURCE_NAME_0, TASK_NAME_0);  // 作成したコンポーネントの座標を取得して接続線の座標と比較
  });

  /** 
  コンポーネントの基本機能動作確認
  Sourceコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ複数表示
  試験確認内容：ディレクトリが単体表示されることを確認
  */
  it("04-01-335:コンポーネントの基本機能動作確認-Sourceコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ複数表示-ディレクトリが単体表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_SOURCE, SOURCE_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test1', true);
    cy.createDirOrFile(TYPE_DIR, 'test2', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test1').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test2').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Sourceコンポーネント共通機能確認
  ファイル操作エリア
  ファイル複数表示
  試験確認内容：ファイルが単体表示されることを確認
  */
  it("04-01-336:コンポーネントの基本機能動作確認-Sourceコンポーネント共通機能確認-ファイル操作エリア-ファイル複数表示-ファイルが単体表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_SOURCE, SOURCE_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test1', true);
    cy.createDirOrFile(TYPE_FILE, 'test2', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test1').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test2').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Sourceコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ディレクトリ表示
  試験確認内容：ディレクトリ内にディレクトリが作成されることを確認
  */
  it("04-01-337:コンポーネントの基本機能動作確認-Sourceコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ内ディレクトリ表示-ディレクトリ内にディレクトリが作成されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_SOURCE, SOURCE_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test-a', true);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').click();
    cy.createDirOrFile(TYPE_DIR, 'test-b', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-b').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Sourceコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ファイル表示
  試験確認内容：ディレクトリ内にファイルが作成されることを確認
  */
  it("04-01-338:コンポーネントの基本機能動作確認-Sourceコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ内ファイル表示-ディレクトリ内にファイルが作成されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_SOURCE, SOURCE_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test-a', true);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').click();
    cy.createDirOrFile(TYPE_FILE, 'test.txt', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test.txt').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Sourceコンポーネント共通機能確認
  各コンポーネントの追加/削除確認
  該当コンポーネント削除確認
  試験確認内容：コンポーネントが削除されていることを確認
  */
  it("04-01-339:コンポーネントの基本機能動作確認-Sourceコンポーネント共通機能確認-各コンポーネントの追加/削除確認-該当コンポーネント削除確認-コンポーネントが削除されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_SOURCE, SOURCE_NAME_0, 300, 500);
    cy.deleteComponent(SOURCE_NAME_0);
    cy.get('[data-cy="graph-component-row"]').contains(SOURCE_NAME_0).should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Sourceコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  upload on demandスイッチボタン表示確認
  試験確認内容：upload on demandスイッチボタン表示確認が表示されていることを確認
  */
  it("04-01-340:コンポーネントの基本機能動作確認-Sourceコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-upload on demandスイッチボタン表示確認-upload on demandスイッチボタン表示確認が表示されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_SOURCE, SOURCE_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-upload_setting-panel_title"]').click();
    const DATA_CY_STR = '[data-cy="component_property-upload_on_demand-switch"]'
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  Sourceコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  upload on demandスイッチボタン入力確認
  試験確認内容：upload on demandスイッチボタン表示確認が表示されていることを確認
  */
  it("04-01-341:コンポーネントの基本機能動作確認-Sourceコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-upload on demandスイッチボタン表示確認-upload on demandスイッチボタン表示確認が表示されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_SOURCE, SOURCE_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-upload_setting-panel_title"]').click();
    cy.get('[data-cy="component_property-upload_on_demand-switch"]').find('input').click();
    cy.get('[data-cy="component_property-source_file_name-autocomplete"]').should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Sourceコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  source file name表示確認
  試験確認内容：source file nameテキストボックスが表示されていることを確認
  */
  it("04-01-342:コンポーネントの基本機能動作確認-Sourceコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-source file name表示確認-source file nameテキストボックスが表示されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_SOURCE, SOURCE_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-upload_setting-panel_title"]').click();
    const DATA_CY_STR = '[data-cy="component_property-source_file_name-autocomplete"]'
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  Sourceコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  source file name入力確認
  試験確認内容：source file nameが入力できることを確認
  */
  it("04-01-343:コンポーネントの基本機能動作確認-Sourceコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-source file name入力確認-source file nameが入力できることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_SOURCE, SOURCE_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-upload_setting-panel_title"]').click();
    cy.createDirOrFile(TYPE_FILE, 'test-a', true);
    let targetDropBoxCy = '[data-cy="component_property-source_file_name-autocomplete"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 3, 'test-a');
    cy.get('[data-cy="component_property-source_file_name-autocomplete"]').find('input').should('have.value', 'test-a');
  });

  /** 
  コンポーネントの基本機能動作確認
  Sourceコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  source file name入力反映確認
  試験確認内容：source file nameが反映されることを確認
  */
  it("04-01-344:コンポーネントの基本機能動作確認-Sourceコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-source file name入力反映確認-source file nameが反映されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_SOURCE, SOURCE_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-upload_setting-panel_title"]').click();
    cy.createDirOrFile(TYPE_FILE, 'test-a', true);
    let targetDropBoxCy = '[data-cy="component_property-source_file_name-autocomplete"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 3, 'test-a');
    cy.closeProperty();
    cy.clickComponentName(SOURCE_NAME_0);
    cy.get('[data-cy="component_property-upload_setting-panel_title"]').click();
    cy.get('[data-cy="component_property-source_file_name-autocomplete"]').contains('test-a').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  試験確認内容：プロパティが表示されることを確認
  */
  it("04-01-345:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-プロパティが表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-property-navigation_drawer"]';
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  試験確認内容：name入力テキストエリアが表示されていることを確認
  */
  it("04-01-346:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-name入力テキストエリアが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-name-text_field"]'
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  name入力
  試験確認内容：nameが入力できることを確認
  */
  it("04-01-347:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-name入力-nameが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    const INPUT_OBJ_CY = '[data-cy="component_property-name-text_field"]';
    cy.confirmInputValueReflection(INPUT_OBJ_CY, '-Test_Task', TAG_TYPE_INPUT);
  });

  /** 
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  name入力（使用可能文字確認）
  試験確認内容：nameが入力できないことを確認
  */
  it("04-01-348:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-name入力（使用可能文字確認）-nameが入力できないことを確認", () => {
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    const INPUT_OBJ_CY = '[data-cy="component_property-name-text_field"]';
    cy.confirmInputValueNotReflection(INPUT_OBJ_CY, 'Test*Task', TAG_TYPE_INPUT);
  });

  /** 
    コンポーネントの基本機能動作確認
    Viewerコンポーネント共通機能確認
    試験確認内容：説明入力テキストエリアが表示されていることを確認
    */
  it("04-01-349:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-description入力テキストエリアが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-description-textarea"]'
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  description入力
  試験確認内容：descriptionが入力できることを確認
  */
  it("04-01-350:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-description入力-descriptionが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    const INPUT_OBJ_CY = '[data-cy="component_property-description-textarea"]';
    cy.confirmInputValueReflection(INPUT_OBJ_CY, 'descriptionTest', TAG_TYPE_TEXT_AREA);
  });

  /** 
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  input files表示
  試験確認内容：input files入力テキストエリアが表示されていることを確認
  */
  it("04-01-351:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-input files表示-input files入力テキストエリアが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-input_files_viewer-list_form"]';
    const CLICK_AREA_CY = '[data-cy="component_property-input_file_setting-panel_title"]';
    cy.confirmDisplayInPropertyByDetailsArea(DATA_CY_STR, CLICK_AREA_CY, null);
  });

  /** 
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  input files入力
  試験確認内容：input filesが入力できることを確認
  */
  it("04-01-352:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-input files入力-input filesが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-input_file_setting-panel_title"]').click();
    cy.get('[data-cy="component_property-input_files_viewer-list_form"]').find('input').type('testInputFile');
    cy.get('[data-cy="component_property-input_files_viewer-list_form"]').find('input').should('have.value', 'testInputFile');
  });

  /** 
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  input files反映確認
  試験確認内容：input filesが反映されることを確認
  */
  it("04-01-353:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-input files反映確認-input filesが反映されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-input_file_setting-panel_title"]').click();
    cy.get('[data-cy="component_property-input_files_viewer-list_form"]').find('input').type('testInputFile');
    cy.get('[data-cy="list_form-add-text_field"]').find('[role="button"]').eq(1).click();
    cy.get('[data-cy="graph-component-row"]').contains('testInputFile').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  構成要素の機能確認
  closeボタン押下
  試験確認内容：プロパティが表示されていないことを確認
  */
  it("04-01-354:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-構成要素の機能確認-closeボタン押下-プロパティが表示されていないことを確認", () => {
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    cy.closeProperty();
    cy.get('[data-cy="component_property-property-navigation_drawer"]').should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  構成要素の機能確認
  cleanボタン押下
  試験確認内容：最新の保存状態に戻っていることを確認
  */
  it.skip("04-01-355:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-構成要素の機能確認-cleanボタン押下-最新の保存状態に戻っていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test-a', true);
    cy.get('[data-cy="component_property-loop_set_for-panel_title"]').click();
    cy.get('[data-cy="component_property-start_for-text_field"]').type('1');
    cy.get('[data-cy="component_property-end_for-text_field"]').type('5');
    cy.get('[data-cy="component_property-step_for-text_field"]').type('5');
    cy.get('[data-cy="workflow-play-btn"]').click();
    cy.clickComponentName(VIEWER_NAME_0);
    cy.get('[data-cy="component_property-name-text_field"]').find('input').clear();
    cy.get('[data-cy="component_property-name-text_field"]').type('changeName');
    cy.get('[data-cy="component_property-description-textarea"]').find('textarea').focus();
    cy.get('[data-cy="component_property-clean-btn"]').click();
    cy.get('[data-cy="component_property-name-text_field"]').find('input').should('have.value', 'test-a');
  });

  /** 
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  接続確認
  試験確認内容：コンポーネントが接続されていることを確認
  */
  it("04-01-357:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-ファイル転送設定の各パターンの確認-接続確認-コンポーネントが接続されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, true);
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 600);
    cy.connectComponent(VIEWER_NAME_0);  // コンポーネント同士を接続
    cy.checkConnectionLine(IF_NAME_0, VIEWER_NAME_0);  // 作成したコンポーネントの座標を取得して接続線の座標と比較
  });

  /** 
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除ボタン表示確認（input file）
  試験確認内容：削除ボタンが表示されることを確認
  */
  it("04-01-359:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除ボタン表示確認（input file）-削除ボタンが表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-input_file_setting-panel_title"]').click();
    cy.get('[data-cy="component_property-input_files_viewer-list_form"]').find('input').type('testInputFile');
    cy.get('[data-cy="list_form-add-text_field"]').find('[role="button"]').eq(1).click();
    cy.get('[data-cy="action_row-delete-btn"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除反映確認（input file）
  試験確認内容：input fileが削除されていることを確認
  skip:issue#942
  */
  it.skip("04-01-360:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除反映確認（input file）-input fileが削除されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-input_file_setting-panel_title"]').click();
    cy.get('[data-cy="component_property-input_files_viewer-list_form"]').find('input').type('testInputFile');
    cy.get('[data-cy="list_form-add-text_field"]').find('[role="button"]').eq(1).click();
    cy.get('[data-cy="action_row-delete-btn"]').click();
    cy.get('[data-cy="graph-component-row"]').contains('testInputFile').should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ単体表示
  試験確認内容：ディレクトリが単体表示されることを確認
  */
  it("04-01-361:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ単体表示-ディレクトリが単体表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test-a', true);
    cy.createDirOrFile(TYPE_DIR, 'test-b', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-b').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ複数表示（リロード前）
  試験確認内容：ディレクトリが単体表示されることを確認
  */
  it("04-01-362:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ複数表示（リロード前）-ディレクトリが単体表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test1', true);
    cy.createDirOrFile(TYPE_DIR, 'test2', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test1').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test2').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ複数表示（リロード後）
  試験確認内容：ディレクトリが複数表示されることを確認
  */
  it("04-01-363:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ複数表示（リロード後）-ディレクトリが複数表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test1', true);
    cy.createDirOrFile(TYPE_DIR, 'test2', false);
    cy.closeProperty();
    cy.clickComponentName(VIEWER_NAME_0);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test*').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  ファイル操作エリア
  ファイル単体表示
  試験確認内容：ファイルが単体表示されることを確認
  */
  it("04-01-364:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-ファイル操作エリア-ファイル単体表示-ファイルが単体表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test-a', true);
    cy.createDirOrFile(TYPE_FILE, 'test-b', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-b').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  ファイル操作エリア
  ファイル複数表示（リロード前）
  試験確認内容：ファイルが単体表示されることを確認
  */
  it("04-01-365:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-ファイル操作エリア-ファイル複数表示（リロード前）-ファイルが単体表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test1', true);
    cy.createDirOrFile(TYPE_FILE, 'test2', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test1').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test2').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  ファイル操作エリア
  ファイル複数表示（リロード後）
  試験確認内容：ファイルが複数表示されることを確認
  */
  it("04-01-366:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-ファイル操作エリア-ファイル複数表示（リロード後）-ファイルが複数表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test1', true);
    cy.createDirOrFile(TYPE_FILE, 'test2', false);
    cy.closeProperty();
    cy.clickComponentName(VIEWER_NAME_0);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test*').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ディレクトリ表示
  試験確認内容：ディレクトリ内にディレクトリが作成されることを確認
  */
  it("04-01-367:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ内ディレクトリ表示-ディレクトリ内にディレクトリが作成されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test-a', true);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').click();
    cy.createDirOrFile(TYPE_DIR, 'test-b', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-b').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ファイル表示
  試験確認内容：ディレクトリ内にファイルが作成されることを確認
  */
  it("04-01-368:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ内ファイル表示-ディレクトリ内にファイルが作成されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test-a', true);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').click();
    cy.createDirOrFile(TYPE_FILE, 'test.txt', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test.txt').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  各コンポーネントの追加/削除確認
  該当コンポーネント削除確認
  試験確認内容：コンポーネントが削除されていることを確認
  */
  it("04-01-369:コンポーネントの基本機能動作確認-Viewerコンポーネント共通機能確認-各コンポーネントの追加/削除確認-該当コンポーネント削除確認-コンポーネントが削除されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 500);
    cy.deleteComponent(VIEWER_NAME_0);
    cy.get('[data-cy="graph-component-row"]').contains(VIEWER_NAME_0).should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Viewerコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  open viewer screenボタン表示確認
  試験確認内容：open viewer screenボタンが有効となっていることを確認
  */
  it.skip("04-01-370:コンポーネントの基本機能動作確認-Sourceコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-open viewer screenボタン表示確認-open viewer screenボタンが有効となっていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test-a', true);
    cy.get('[data-cy="component_property-condition-setting_title"]').click();
    let targetDropBoxCy = '[data-cy="component_property-condition_use_javascript-autocomplete"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 3, 'test-a');
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, true);
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 300, 600);
    cy.connectComponent(VIEWER_NAME_0);  // コンポーネント同士を接続
    cy.get('[data-cy="workflow-open_viewer_screen-btn"]').should('be.disabled');
  });

  /** 
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  試験確認内容：プロパティが表示されることを確認
  */
  it("04-01-371:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-プロパティが表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-property-navigation_drawer"]';
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  試験確認内容：name入力テキストエリアが表示されていることを確認
  */
  it("04-01-372:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-name入力テキストエリアが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-name-text_field"]'
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  name入力
  試験確認内容：nameが入力できることを確認
  */
  it("04-01-373:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-name入力-nameが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    const INPUT_OBJ_CY = '[data-cy="component_property-name-text_field"]';
    cy.confirmInputValueReflection(INPUT_OBJ_CY, '-Test_Task', TAG_TYPE_INPUT);
  });

  /** 
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  name入力（使用可能文字確認）
  試験確認内容：nameが入力できないことを確認
  */
  it("04-01-374:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-name入力（使用可能文字確認）-nameが入力できないことを確認", () => {
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    const INPUT_OBJ_CY = '[data-cy="component_property-name-text_field"]';
    cy.confirmInputValueNotReflection(INPUT_OBJ_CY, 'Test*Task', TAG_TYPE_INPUT);
  });

  /** 
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  試験確認内容：説明入力テキストエリアが表示されていることを確認
  */
  it("04-01-375:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-description入力テキストエリアが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-description-textarea"]'
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  description入力
  試験確認内容：descriptionが入力できることを確認
  */
  it("04-01-376:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-description入力-descriptionが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    const INPUT_OBJ_CY = '[data-cy="component_property-description-textarea"]';
    cy.confirmInputValueReflection(INPUT_OBJ_CY, 'descriptionTest', TAG_TYPE_TEXT_AREA);
  });

  /** 
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  input files表示
  試験確認内容：input files入力テキストエリアが表示されていることを確認
  */
  it("04-01-377:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-input files表示-input files入力テキストエリアが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-input_files-list_form"]';
    const CLICK_AREA_CY = '[data-cy="component_property-in_out_files-panel_title"]';
    cy.confirmDisplayInPropertyByDetailsArea(DATA_CY_STR, CLICK_AREA_CY, null);
  });

  /** 
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  input files入力
  試験確認内容：input filesが入力できることを確認
  */
  it("04-01-378:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-input files入力-input filesが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true, false);
    cy.get('[data-cy="component_property-input_files-list_form"]').find('input').should('have.value', 'testInputFile');
  });

  /** 
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  input files反映確認
  試験確認内容：input filesが反映されることを確認
  */
  it("04-01-379:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-input files反映確認-input filesが反映されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true, true);
    cy.get('[data-cy="graph-component-row"]').contains('testInputFile').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  output files表示
  試験確認内容：output files入力テキストエリアが表示されていることを確認
  */
  it("04-01-380:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-output files表示-output files入力テキストエリアが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-in_out_files-panel_title"]').click();
    cy.get('[data-cy="component_property-output_files-list_form"]').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  output files入力
  試験確認内容：output filesが入力できることを確認
  */
  it("04-01-381:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-output files入力-output filesが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, false);
    cy.get('[data-cy="component_property-output_files-list_form"]').find('input').should('have.value', 'testOutputFile');
  });

  /** 
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  output files反映確認
  試験確認内容：output filesが反映されることを確認
  */
  it("04-01-382:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-output files反映確認-output filesが反映されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, true);
    cy.get('[data-cy="graph-component-row"]').contains('testOutputFile').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  構成要素の機能確認
  closeボタン押下
  試験確認内容：プロパティが表示されていないことを確認
  */
  it("04-01-383:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-構成要素の機能確認-closeボタン押下-プロパティが表示されていないことを確認", () => {
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.closeProperty();
    cy.get('[data-cy="component_property-property-navigation_drawer"]').should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  接続確認
  試験確認内容：コンポーネントが接続されていることを確認
  */
  it("04-01-386:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-ファイル転送設定の各パターンの確認-接続確認-コンポーネントが接続されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, true);
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_1, 300, 600);
    cy.connectComponent(STEPJOB_NAME_1);  // コンポーネント同士を接続
    cy.checkConnectionLine(STEPJOB_NAME_0, STEPJOB_NAME_1);  // 作成したコンポーネントの座標を取得して接続線の座標と比較
  });

  /** 
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除ボタン表示確認（input file）
  試験確認内容：削除ボタンが表示されることを確認
  */
  it("04-01-388:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除ボタン表示確認（input file）-削除ボタンが表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true, true);
    cy.get('[data-cy="action_row-delete-btn"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除ボタン表示確認（output file）
  試験確認内容：削除ボタンが表示されることを確認
  */
  it("04-01-389:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除ボタン表示確認（output file）-削除ボタンが表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, true);
    cy.get('[data-cy="action_row-delete-btn"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除反映確認（input file）
  試験確認内容：input fileが削除されていることを確認
  skip:issue#942
  */
  it.skip("04-01-390:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除反映確認（input file）-input fileが削除されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true, true);
    cy.get('[data-cy="action_row-delete-btn"]').click();
    cy.get('[data-cy="graph-component-row"]').contains('testInputFile').should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除反映確認（output file）
  試験確認内容：output fileが削除されていることを確認
  skip:issue#942
  */
  it.skip("04-01-391:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除反映確認（output file）-output fileが削除されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, true);
    cy.get('[data-cy="action_row-delete-btn"]').click();
    cy.get('[data-cy="graph-component-row"]').contains('testOutputFile').should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ単体表示
  試験確認内容：ディレクトリが単体表示されることを確認
  */
  it("04-01-392:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ単体表示-ディレクトリが単体表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test-a', true);
    cy.createDirOrFile(TYPE_DIR, 'test-b', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-b').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ複数表示（リロード前）
  試験確認内容：ディレクトリが単体表示されることを確認
  */
  it("04-01-393:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ複数表示（リロード前）-ディレクトリが単体表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test1', true);
    cy.createDirOrFile(TYPE_DIR, 'test2', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test1').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test2').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ複数表示（リロード後）
  試験確認内容：ディレクトリが複数表示されることを確認
  */
  it("04-01-394:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ複数表示（リロード後）-ディレクトリが複数表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test1', true);
    cy.createDirOrFile(TYPE_DIR, 'test2', false);
    cy.closeProperty();
    cy.clickComponentName(STEPJOB_NAME_0);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test*').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  ファイル操作エリア
  ファイル単体表示
  試験確認内容：ファイルが単体表示されることを確認
  */
  it("04-01-395:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-ファイル操作エリア-ファイル単体表示-ファイルが単体表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test-a', true);
    cy.createDirOrFile(TYPE_FILE, 'test-b', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-b').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  ファイル操作エリア
  ファイル複数表示（リロード前）
  試験確認内容：ファイルが単体表示されることを確認
  */
  it("04-01-396:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-ファイル操作エリア-ファイル複数表示（リロード前）-ファイルが単体表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test1', true);
    cy.createDirOrFile(TYPE_FILE, 'test2', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test1').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test2').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  ファイル操作エリア
  ファイル複数表示（リロード後）
  試験確認内容：ファイルが複数表示されることを確認
  */
  it("04-01-397:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-ファイル操作エリア-ファイル複数表示（リロード後）-ファイルが複数表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test1', true);
    cy.createDirOrFile(TYPE_FILE, 'test2', false);
    cy.closeProperty();
    cy.clickComponentName(STEPJOB_NAME_0);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test*').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ディレクトリ表示
  試験確認内容：ディレクトリ内にディレクトリが作成されることを確認
  */
  it("04-01-398:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ内ディレクトリ表示-ディレクトリ内にディレクトリが作成されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test-a', true);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').click();
    cy.createDirOrFile(TYPE_DIR, 'test-b', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-b').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ファイル表示
  試験確認内容：ディレクトリ内にファイルが作成されることを確認
  */
  it("04-01-399:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ内ファイル表示-ディレクトリ内にファイルが作成されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test-a', true);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').click();
    cy.createDirOrFile(TYPE_FILE, 'test.txt', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test.txt').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  各コンポーネントの追加/削除確認
  該当コンポーネント削除確認
  試験確認内容：コンポーネントが削除されていることを確認
  */
  it("04-01-400:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-各コンポーネントの追加/削除確認-該当コンポーネント削除確認-コンポーネントが削除されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.deleteComponent(STEPJOB_NAME_0);
    cy.get('[data-cy="graph-component-row"]').contains(STEPJOB_NAME_0).should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  host表示確認
  試験確認内容：hostセレクトボックスが表示されていることを確認
  */
  it("04-01-401:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-host表示確認-hostセレクトボックスが表示されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-host-select"]'
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  host選択確認（localhost以外を選択）
  試験確認内容：hostセレクトボックスで選択した値が表示されていることを確認
  */
  it("04-01-402:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-host選択確認（localhost以外を選択）-hostセレクトボックスで選択した値が表示されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    // 新規リモートホスト設定を作成
    cy.visit("/remotehost");
    cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
    cy.enterRequiredRemoteHost('TestLabel', 'TestHostname', 8000, 'testUser');
    cy.get('[data-cy="add_new_host-ok-btn"]').click();
    // ホーム画面からプロジェクトを開き検証を行う
    cy.visit("/");
    cy.openProject();
    cy.clickComponentName(STEPJOB_NAME_0);
    cy.get('[data-cy="component_property-host-select"]').type('TestLabel');
    cy.get('[data-cy="component_property-host-select"]').contains('TestLabel').should('exist');
    cy.removeRemoteHost('TestLabel');
  });

  /** 
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  host選択確認（localhost以外を選択）
  試験確認内容：hostセレクトボックスで選択した値が反映されていることを確認
  */
  it("04-01-403:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-hostファイル選択表示確認-hostセレクトボックスで選択したファイルが表示されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    // 新規リモートホスト設定を作成
    cy.visit("/remotehost");
    cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
    cy.enterRequiredRemoteHost('TestLabel', 'TestHostname', 8000, 'testUser');
    cy.get('[data-cy="add_new_host-ok-btn"]').click();
    // ホーム画面からプロジェクトを開き検証を行う
    cy.visit("/");
    cy.openProject();
    cy.clickComponentName(STEPJOB_NAME_0);
    cy.get('[data-cy="component_property-host-select"]').type('TestLabel');
    cy.saveProperty();
    cy.get('[data-cy="component_property-host-select"]').contains('TestLabel').should('exist');
    cy.removeRemoteHost('TestLabel');
  });

  /** 
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  use job schedulerスイッチボタン表示確認
  試験確認内容：use job schedulerスイッチボタンが表示されていることを確認
  */
  it("04-01-404:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認use job schedulerスイッチボタン表示確認-use job schedulerスイッチボタンが表示されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-job_scheduler-switch"]'
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  queue表示確認（無効）
  試験確認内容：queueセレクトボックスが無効となっていることを確認
  */
  it("04-01-405:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-queue表示確認（無効）-queueセレクトボックスが無効となっていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-job_scheduler-switch"]').find('input').click();
    cy.get('[data-cy="component_property-queue-select"]').find('input').should('be.disabled');
  });

  /** 
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  queue表示確認（有効）
  試験確認内容：queueセレクトボックスが有効となっていることを確認
  */
  it("04-01-406:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-queue表示確認（有効）-queueセレクトボックスが有効となっていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-queue-select"]').find('input').should('be.not.disabled');
  });

  /** 
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  queue選択確認
  試験確認内容：queueセレクトボックスに選択した値が表示されていることを確認
  */
  it("04-01-407:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-queue選択確認-queueセレクトボックスに選択した値が表示されていることを確認", ()=>{
    // 新規リモートホスト設定を作成
    cy.visit("/remotehost");
    cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
    cy.enterRequiredRemoteHost('TestLabel', 'TestHostname', 8000, 'testUser');
    cy.get('[data-cy="add_new_host-available_queues-text_field"]').type('testQueues');
    cy.get('[data-cy="add_new_host-ok-btn"]').click();
    // ホーム画面からプロジェクトを開き検証を行う
    cy.visit("/");
    cy.openProject();
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    let targetDropBoxCy = '[data-cy="component_property-host-select"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 2, 'TestLabel');
    targetDropBoxCy = '[data-cy="component_property-queue-select"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 2, 'testQueues');
    cy.get('[data-cy="component_property-queue-select"]').find('input').should('have.value', 'testQueues');
    cy.removeRemoteHost('TestLabel');
  });

  /** 
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  queue選択反映確認
  試験確認内容：queueセレクトボックスに選択した値が反映されていることを確認
  */
  it("04-01-408:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-queue選択反映確認-queueセレクトボックスに選択した値が反映されていることを確認", ()=>{
    // 新規リモートホスト設定を作成
    cy.visit("/remotehost");
    cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
    cy.enterRequiredRemoteHost('TestLabel', 'TestHostname', 8000, 'testUser');
    cy.get('[data-cy="add_new_host-available_queues-text_field"]').type('testQueues');
    cy.get('[data-cy="add_new_host-ok-btn"]').click();
    // ホーム画面からプロジェクトを開き検証を行う
    cy.visit("/");
    cy.openProject();
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    let targetDropBoxCy = '[data-cy="component_property-host-select"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 2, 'TestLabel');
    targetDropBoxCy = '[data-cy="component_property-queue-select"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 2, 'testQueues');
    cy.closeProperty();
    cy.clickComponentName(STEPJOB_NAME_0);
    cy.get('[data-cy="component_property-queue-select"]').find('input').should('have.value', 'testQueues');
    cy.removeRemoteHost('TestLabel');
  });

  /** 
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  submit command表示確認（無効）
  試験確認内容：submit commandテキストボックスが無効となっていることを確認
  */
  it("04-01-409:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-submit command表示確認（無効）-submit commandテキストボックスが無効となっていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-job_scheduler-switch"]').find('input').click();
    cy.get('[data-cy="component_property-submit_command-text_field"]').find('input').should('be.disabled');
  });
  
  /** 
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  submit command表示確認（有効）
  試験確認内容：submit commandテキストボックスが有効となっていることを確認
  */
  it("04-01-410:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-プロパティ設定確認-submit command表示確認（有効）-submit commandテキストボックスが有効となっていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-submit_command-text_field"]').find('input').should('be.not.disabled');
  });

  /** 
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  submit command反映確認
  試験確認内容：リモートホストのジョブ投入コマンドが表示されていることを確認
  */
  it("04-01-411:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-submit command反映確認-リモートホストのジョブ投入コマンドが表示されていることを確認", ()=>{
    // 新規リモートホスト設定を作成
    cy.visit("/remotehost");
    cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
    cy.enterRequiredRemoteHost('TestLabel', 'TestHostname', 8000, 'testUser');
    cy.get('[data-cy="add_new_host-job_schedulers-select"]').type('PBSPro');
    cy.get('[data-cy="add_new_host-ok-btn"]').click();
    // ホーム画面からプロジェクトを開き検証を行う
    cy.visit("/");
    cy.openProject();
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.clickComponentName(STEPJOB_NAME_0);
    let targetDropBoxCy = '[data-cy="component_property-host-select"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 2, 'TestLabel');
    cy.closeProperty();
    cy.clickComponentName(STEPJOB_NAME_0);
    cy.get('[data-cy="component_property-submit_command-text_field"]').find('input').should('have.value', 'qsub');
    cy.removeRemoteHost('TestLabel');
  });

  /** 
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  submit option表示確認（無効）
  試験確認内容：submit optionテキストボックスが無効となっていることを確認
  */
  it("04-01-412:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-submit option表示確認（無効）-submit optionテキストボックスが無効となっていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-job_scheduler-switch"]').find('input').click();
    cy.get('[data-cy="component_property-submit_option-text_field"]').find('input').should('be.disabled');
  });

  /** 
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  submit option表示確認（有効）
  試験確認内容：submit optionテキストボックスが有効となっていることを確認
  */
  it("04-01-413:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-submit option表示確認（有効）-submit optionテキストボックスが有効となっていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-submit_option-text_field"]').find('input').should('be.not.disabled');
  });

  /** 
  コンポーネントの基本機能動作確認
  Stepjobコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  submit option反映確認
  試験確認内容：submit optionテキストボックスに入力した値が設定されていることを確認
  */
  it.skip("04-01-414:コンポーネントの基本機能動作確認-Stepjobコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-submit option反映確認-submit optionテキストボックスに入力した値が設定されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-submit_option-text_field"]').find('input').type('testSubmitCommand');
    cy.closeProperty();
    cy.clickComponentName(STEPJOB_NAME_0);
    cy.get('[data-cy="component_property-submit_option-text_field"]').find('input').should('have.value', 'testSubmitCommand');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  試験確認内容：プロパティが表示されることを確認
  */
  it("04-01-415:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-プロパティが表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-property-navigation_drawer"]';
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  試験確認内容：name入力テキストエリアが表示されていることを確認
  */
  it("04-01-416:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-name入力テキストエリアが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-name-text_field"]'
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  name入力
  試験確認内容：nameが入力できることを確認
  */
  it("04-01-417:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-name入力-nameが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    const INPUT_OBJ_CY = '[data-cy="component_property-name-text_field"]';
    cy.confirmInputValueReflection(INPUT_OBJ_CY, '-Test_Task', TAG_TYPE_INPUT);
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  name入力（使用可能文字確認）
  試験確認内容：nameが入力できないことを確認
  */
  it("04-01-418:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-name入力（使用可能文字確認）-nameが入力できないことを確認", () => {
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    const INPUT_OBJ_CY = '[data-cy="component_property-name-text_field"]';
    cy.confirmInputValueNotReflection(INPUT_OBJ_CY, 'Test*Task', TAG_TYPE_INPUT);
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  試験確認内容：説明入力テキストエリアが表示されていることを確認
  */
  it("04-01-419:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-description入力テキストエリアが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-description-textarea"]'
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  description入力
  試験確認内容：descriptionが入力できることを確認
  */
  it("04-01-420:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-description入力-descriptionが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    const INPUT_OBJ_CY = '[data-cy="component_property-description-textarea"]';
    cy.confirmInputValueReflection(INPUT_OBJ_CY, 'descriptionTest', TAG_TYPE_TEXT_AREA);
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  input files表示
  試験確認内容：input files入力テキストエリアが表示されていることを確認
  */
  it("04-01-421:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-input files表示-input files入力テキストエリアが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-input_files-list_form"]';
    const CLICK_AREA_CY = '[data-cy="component_property-in_out_files-panel_title"]';
    cy.confirmDisplayInPropertyByDetailsArea(DATA_CY_STR, CLICK_AREA_CY, null);
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  input files入力
  試験確認内容：input filesが入力できることを確認
  */
  it("04-01-422:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-input files入力-input filesが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true, false);
    cy.get('[data-cy="component_property-input_files-list_form"]').find('input').should('have.value', 'testInputFile');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  input files反映確認
  試験確認内容：input filesが反映されることを確認
  */
  it("04-01-423:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-input files反映確認-input filesが反映されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true, true);
    cy.get('[data-cy="graph-component-row"]').contains('testInputFile').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  output files表示
  試験確認内容：output files入力テキストエリアが表示されていることを確認
  */
  it("04-01-424:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-output files表示-output files入力テキストエリアが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-in_out_files-panel_title"]').click();
    cy.get('[data-cy="component_property-output_files-list_form"]').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  output files入力
  試験確認内容：output filesが入力できることを確認
  */
  it("04-01-425:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-output files入力-output filesが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, false);
    cy.get('[data-cy="component_property-output_files-list_form"]').find('input').should('have.value', 'testOutputFile');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  output files反映確認
  試験確認内容：output filesが反映されることを確認
  */
  it("04-01-426:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-output files反映確認-output filesが反映されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, true);
    cy.get('[data-cy="graph-component-row"]').contains('testOutputFile').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  構成要素の機能確認
  closeボタン押下
  試験確認内容：プロパティが表示されていないことを確認
  */
  it("04-01-427:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-構成要素の機能確認-closeボタン押下-プロパティが表示されていないことを確認", () => {
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.closeProperty();
    cy.get('[data-cy="component_property-property-navigation_drawer"]').should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  接続確認
  試験確認内容：コンポーネントが接続されていることを確認
  */
  it("04-01-430:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-ファイル転送設定の各パターンの確認-接続確認-コンポーネントが接続されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, true);
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_1, 300, 600);
    cy.connectComponent(BJ_TASK_NAME_1);  // コンポーネント同士を接続
    cy.checkConnectionLine(BJ_TASK_NAME_0, BJ_TASK_NAME_1);  // 作成したコンポーネントの座標を取得して接続線の座標と比較
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除ボタン表示確認（input file）
  試験確認内容：削除ボタンが表示されることを確認
  */
  it("04-01-432:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除ボタン表示確認（input file）-削除ボタンが表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true, true);
    cy.get('[data-cy="action_row-delete-btn"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除ボタン表示確認（output file）
  試験確認内容：削除ボタンが表示されることを確認
  */
  it("04-01-433:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除ボタン表示確認（output file）-削除ボタンが表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, true);
    cy.get('[data-cy="action_row-delete-btn"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除反映確認（input file）
  試験確認内容：input fileが削除されていることを確認
  skip:issue#942
  */
  it.skip("04-01-434:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除反映確認（input file）-input fileが削除されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true, true);
    cy.get('[data-cy="action_row-delete-btn"]').click();
    cy.get('[data-cy="graph-component-row"]').contains('testInputFile').should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除反映確認（output file）
  試験確認内容：output fileが削除されていることを確認
  skip:issue#942
  */
  it.skip("04-01-435:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除反映確認（output file）-output fileが削除されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, true);
    cy.get('[data-cy="action_row-delete-btn"]').click();
    cy.get('[data-cy="graph-component-row"]').contains('testOutputFile').should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ単体表示
  試験確認内容：ディレクトリが単体表示されることを確認
  */
  it("04-01-436:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ単体表示-ディレクトリが単体表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test-a', true);
    cy.createDirOrFile(TYPE_DIR, 'test-b', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-b').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ複数表示（リロード前）
  試験確認内容：ディレクトリが単体表示されることを確認
  */
  it("04-01-437:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ複数表示（リロード前）-ディレクトリが単体表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test1', true);
    cy.createDirOrFile(TYPE_DIR, 'test2', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test1').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test2').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ複数表示（リロード後）
  試験確認内容：ディレクトリが複数表示されることを確認
  */
  it("04-01-438:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ複数表示（リロード後）-ディレクトリが複数表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test1', true);
    cy.createDirOrFile(TYPE_DIR, 'test2', false);
    cy.closeProperty();
    cy.clickComponentName(BJ_TASK_NAME_0);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test*').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  ファイル操作エリア
  ファイル単体表示
  試験確認内容：ファイルが単体表示されることを確認
  */
  it("04-01-439:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-ファイル操作エリア-ファイル単体表示-ファイルが単体表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test-a', true);
    cy.createDirOrFile(TYPE_FILE, 'test-b', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-b').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  ファイル操作エリア
  ファイル複数表示（リロード前）
  試験確認内容：ファイルが単体表示されることを確認
  */
  it("04-01-440:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-ファイル操作エリア-ファイル複数表示（リロード前）-ファイルが単体表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test1', true);
    cy.createDirOrFile(TYPE_FILE, 'test2', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test1').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test2').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  ファイル操作エリア
  ファイル複数表示（リロード後）
  試験確認内容：ファイルが複数表示されることを確認
  */
  it("04-01-441:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-ファイル操作エリア-ファイル複数表示（リロード後）-ファイルが複数表示されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test1', true);
    cy.createDirOrFile(TYPE_FILE, 'test2', false);
    cy.closeProperty();
    cy.clickComponentName(BJ_TASK_NAME_0);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test*').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ディレクトリ表示
  試験確認内容：ディレクトリ内にディレクトリが作成されることを確認
  */
  it("04-01-442:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ内ディレクトリ表示-ディレクトリ内にディレクトリが作成されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test-a', true);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').click();
    cy.createDirOrFile(TYPE_DIR, 'test-b', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-b').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ファイル表示
  試験確認内容：ディレクトリ内にファイルが作成されることを確認
  */
  it("04-01-443:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ内ファイル表示-ディレクトリ内にファイルが作成されることを確認", () => {
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_DIR, 'test-a', true);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').click();
    cy.createDirOrFile(TYPE_FILE, 'test.txt', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test.txt').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  各コンポーネントの追加/削除確認
  該当コンポーネント削除確認
  試験確認内容：コンポーネントが削除されていることを確認
  */
  it("04-01-444:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-各コンポーネントの追加/削除確認-該当コンポーネント削除確認-コンポーネントが削除されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.deleteComponent(BJ_TASK_NAME_0);
    cy.get('[data-cy="graph-component-row"]').contains(BJ_TASK_NAME_0).should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  host表示確認
  試験確認内容：hostセレクトボックスが表示されていることを確認
  */
  it("04-01-445:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-host表示確認-hostセレクトボックスが表示されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-host-select"]'
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  host選択確認（localhost以外を選択）
  試験確認内容：hostセレクトボックスで選択した値が表示されていることを確認
  */
  it("04-01-446:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-host選択確認（localhost以外を選択）-hostセレクトボックスで選択した値が表示されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    // 新規リモートホスト設定を作成
    cy.visit("/remotehost");
    cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
    cy.enterRequiredRemoteHost('TestLabel', 'TestHostname', 8000, 'testUser');
    cy.get('[data-cy="add_new_host-ok-btn"]').click();
    // ホーム画面からプロジェクトを開き検証を行う
    cy.visit("/");
    cy.openProject();
    cy.clickComponentName(BJ_TASK_NAME_0);
    cy.get('[data-cy="component_property-host-select"]').type('TestLabel');
    cy.get('[data-cy="component_property-host-select"]').contains('TestLabel').should('exist');
    cy.removeRemoteHost('TestLabel');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  host選択確認（localhost以外を選択）
  試験確認内容：hostセレクトボックスで選択した値が反映されていることを確認
  */
  it("04-01-447:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-hostファイル選択表示確認-hostセレクトボックスで選択したファイルが表示されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    // 新規リモートホスト設定を作成
    cy.visit("/remotehost");
    cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
    cy.enterRequiredRemoteHost('TestLabel', 'TestHostname', 8000, 'testUser');
    cy.get('[data-cy="add_new_host-ok-btn"]').click();
    // ホーム画面からプロジェクトを開き検証を行う
    cy.visit("/");
    cy.openProject();
    cy.clickComponentName(BJ_TASK_NAME_0);
    cy.get('[data-cy="component_property-host-select"]').type('TestLabel');
    cy.saveProperty();
    cy.get('[data-cy="component_property-host-select"]').contains('TestLabel').should('exist');
    cy.removeRemoteHost('TestLabel');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  use job schedulerスイッチボタン表示確認
  試験確認内容：use job schedulerスイッチボタンが表示されていることを確認
  */
  it("04-01-448:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認use job schedulerスイッチボタン表示確認-use job schedulerスイッチボタンが表示されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-job_scheduler-switch"]'
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  queue表示確認（無効）
  試験確認内容：queueセレクトボックスが無効となっていることを確認
  */
  it("04-01-449:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-queue表示確認（無効）-queueセレクトボックスが無効となっていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-job_scheduler-switch"]').find('input').click();
    cy.get('[data-cy="component_property-queue-select"]').find('input').should('be.disabled');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  queue表示確認（有効）
  試験確認内容：queueセレクトボックスが有効となっていることを確認
  */
  it("04-01-450:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-queue表示確認（有効）-queueセレクトボックスが有効となっていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-queue-select"]').find('input').should('be.not.disabled');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  queue選択確認
  試験確認内容：queueセレクトボックスに選択した値が表示されていることを確認
  */
  it("04-01-451:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-queue選択確認-queueセレクトボックスに選択した値が表示されていることを確認", ()=>{
    // 新規リモートホスト設定を作成
    cy.visit("/remotehost");
    cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
    cy.enterRequiredRemoteHost('TestLabel', 'TestHostname', 8000, 'testUser');
    cy.get('[data-cy="add_new_host-available_queues-text_field"]').type('testQueues');
    cy.get('[data-cy="add_new_host-ok-btn"]').click();
    // ホーム画面からプロジェクトを開き検証を行う
    cy.visit("/");
    cy.openProject();
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    let targetDropBoxCy = '[data-cy="component_property-host-select"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 2, 'TestLabel');
    targetDropBoxCy = '[data-cy="component_property-queue-select"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 2, 'testQueues');
    cy.get('[data-cy="component_property-queue-select"]').find('input').should('have.value', 'testQueues');
    cy.removeRemoteHost('TestLabel');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  queue選択反映確認
  試験確認内容：queueセレクトボックスに選択した値が反映されていることを確認
  */
  it("04-01-452:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-queue選択反映確認-queueセレクトボックスに選択した値が反映されていることを確認", ()=>{
    // 新規リモートホスト設定を作成
    cy.visit("/remotehost");
    cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
    cy.enterRequiredRemoteHost('TestLabel', 'TestHostname', 8000, 'testUser');
    cy.get('[data-cy="add_new_host-available_queues-text_field"]').type('testQueues');
    cy.get('[data-cy="add_new_host-ok-btn"]').click();
    // ホーム画面からプロジェクトを開き検証を行う
    cy.visit("/");
    cy.openProject();
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    let targetDropBoxCy = '[data-cy="component_property-host-select"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 2, 'TestLabel');
    targetDropBoxCy = '[data-cy="component_property-queue-select"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 2, 'testQueues');
    cy.closeProperty();
    cy.clickComponentName(BJ_TASK_NAME_0);
    cy.get('[data-cy="component_property-queue-select"]').find('input').should('have.value', 'testQueues');
    cy.removeRemoteHost('TestLabel');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  submit command表示確認（無効）
  試験確認内容：submit commandテキストボックスが無効となっていることを確認
  */
  it("04-01-453:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-submit command表示確認（無効）-submit commandテキストボックスが無効となっていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-job_scheduler-switch"]').find('input').click();
    cy.get('[data-cy="component_property-submit_command-text_field"]').find('input').should('be.disabled');
  });
  
  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  submit command表示確認（有効）
  試験確認内容：submit commandテキストボックスが有効となっていることを確認
  */
  it("04-01-454:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-プロパティ設定確認-submit command表示確認（有効）-submit commandテキストボックスが有効となっていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-submit_command-text_field"]').find('input').should('be.not.disabled');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  submit command反映確認
  試験確認内容：リモートホストのジョブ投入コマンドが表示されていることを確認
  */
  it("04-01-455:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-submit command反映確認-リモートホストのジョブ投入コマンドが表示されていることを確認", ()=>{
    // 新規リモートホスト設定を作成
    cy.visit("/remotehost");
    cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
    cy.enterRequiredRemoteHost('TestLabel', 'TestHostname', 8000, 'testUser');
    cy.get('[data-cy="add_new_host-job_schedulers-select"]').type('PBSPro');
    cy.get('[data-cy="add_new_host-ok-btn"]').click();
    // ホーム画面からプロジェクトを開き検証を行う
    cy.visit("/");
    cy.openProject();
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.clickComponentName(BJ_TASK_NAME_0);
    let targetDropBoxCy = '[data-cy="component_property-host-select"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 2, 'TestLabel');
    cy.closeProperty();
    cy.clickComponentName(BJ_TASK_NAME_0);
    cy.get('[data-cy="component_property-submit_command-text_field"]').find('input').should('have.value', 'qsub');
    cy.removeRemoteHost('TestLabel');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  submit option表示確認（無効）
  試験確認内容：submit optionテキストボックスが無効となっていることを確認
  */
  it("04-01-456:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-submit option表示確認（無効）-submit optionテキストボックスが無効となっていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-job_scheduler-switch"]').find('input').click();
    cy.get('[data-cy="component_property-submit_option-text_field"]').find('input').should('be.disabled');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  submit option表示確認（有効）
  試験確認内容：submit optionテキストボックスが有効となっていることを確認
  */
  it("04-01-457:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-submit option表示確認（有効）-submit optionテキストボックスが有効となっていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-submit_option-text_field"]').find('input').should('be.not.disabled');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  submit option反映確認
  試験確認内容：submit optionテキストボックスに入力した値が設定されていることを確認
  */
  it("04-01-458:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-submit option反映確認-submit optionテキストボックスに入力した値が設定されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-submit_option-text_field"]').find('input').type('testSubmitCommand');
    cy.closeProperty();
    cy.clickComponentName(BJ_TASK_NAME_0);
    cy.get('[data-cy="component_property-submit_option-text_field"]').find('input').should('have.value', 'testSubmitCommand');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  script表示確認
  試験確認内容：scriptセレクトボックスが表示されていることを確認
  */
  it("04-01-459:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-script表示確認-scriptセレクトボックスが表示されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    const DATA_CY_STR = '[data-cy="component_property-script-autocomplete"]'
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  scriptファイル選択表示確認
  試験確認内容：scriptセレクトボックスで選択したファイルが表示されていることを確認
  */
  it("04-01-460:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-scriptファイル選択表示確認-scriptセレクトボックスで選択したファイルが表示されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test-a', true);
    let targetDropBoxCy = '[data-cy="component_property-script-autocomplete"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 3, 'test-a');
    cy.get('[data-cy="component_property-script-autocomplete"]').find('input').should('have.value', 'test-a');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  scriptファイル選択反映確認
  試験確認内容：scriptセレクトボックスで選択したファイルが反映されていることを確認
  */
  it("04-01-461:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-scriptファイル選択反映確認-scriptセレクトボックスで選択したファイルが反映されていることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test-a', true);
    let targetDropBoxCy = '[data-cy="component_property-script-autocomplete"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 3, 'test-a');
    cy.closeProperty();
    cy.clickComponentName(BJ_TASK_NAME_0);
    cy.get('[data-cy="component_property-script-autocomplete"]').contains('test-a').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  start表示確認
  試験確認内容：startテキストボックスが表示されていることを確認
  */
  it("04-01-462:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-start表示確認-startテキストボックスが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-bulijob_task-panel_title"]').click();
    cy.get('[data-cy="component_property-bulk_number-switch"]').click();
    cy.get('[data-cy="component_property-start_bulkjob-text_field"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  start入力確認
  試験確認内容：startテキストボックスが入力できることを確認
  */
  it("04-01-463:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-start入力確認-startテキストボックスが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-bulijob_task-panel_title"]').click();
    cy.get('[data-cy="component_property-bulk_number-switch"]').click();
    cy.get('[data-cy="component_property-start_bulkjob-text_field"]').type('1');
    cy.get('[data-cy="component_property-start_bulkjob-text_field"]').find('input').should('have.value', 1);
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  start入力反映確認
  試験確認内容：startテキストボックスに入力した値が反映されていることを確認
  */
  it("04-01-464:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-start入力反映確認-startテキストボックスに入力した値が反映されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-bulijob_task-panel_title"]').click();
    cy.get('[data-cy="component_property-bulk_number-switch"]').click();
    cy.get('[data-cy="component_property-start_bulkjob-text_field"]').type('1');
    cy.closeProperty();
    cy.clickComponentName(BJ_TASK_NAME_0);
    cy.get('[data-cy="component_property-bulijob_task-panel_title"]').click();
    cy.get('[data-cy="component_property-start_bulkjob-text_field"]').find('input').should('have.value', 1);
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  end表示確認
  試験確認内容：endテキストボックスが表示されていることを確認
  */
  it("04-01-465:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-end表示確認-endテキストボックスが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-bulijob_task-panel_title"]').click();
    cy.get('[data-cy="component_property-bulk_number-switch"]').click();
    cy.get('[data-cy="component_property-end_bulkjob-text_field"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  end入力確認
  試験確認内容：endテキストボックスが入力できることを確認
  */
  it("04-01-466:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-end入力確認-endテキストボックスが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-bulijob_task-panel_title"]').click();
    cy.get('[data-cy="component_property-bulk_number-switch"]').click();
    cy.get('[data-cy="component_property-end_bulkjob-text_field"]').type('5');
    cy.get('[data-cy="component_property-end_bulkjob-text_field"]').find('input').should('have.value', 5);
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  end入力反映確認
  試験確認内容：endテキストボックスに入力した値が反映されていることを確認
  */
  it("04-01-467:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-end入力反映確認-endテキストボックスに入力した値が反映されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-bulijob_task-panel_title"]').click();
    cy.get('[data-cy="component_property-bulk_number-switch"]').click();
    cy.get('[data-cy="component_property-end_bulkjob-text_field"]').type('5');
    cy.closeProperty();
    cy.clickComponentName(BJ_TASK_NAME_0);
    cy.get('[data-cy="component_property-bulijob_task-panel_title"]').click();
    cy.get('[data-cy="component_property-end_bulkjob-text_field"]').find('input').should('have.value', 5);
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  parameter file表示確認
  試験確認内容：parameter fileセレクトボックスが表示されていることを確認
  */
  it("04-01-468:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-parameter file表示確認-parameter fileセレクトボックスが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-bulijob_task-panel_title"]').click();
    cy.get('[data-cy="component_property-parameter_file_bulkjob-autocomplete"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  parameter file入力確認
  試験確認内容：parameter fileセレクトボックスが入力できることを確認
  */
  it("04-01-469:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-parameter file入力確認-parameter fileセレクトボックスが入力できることを確認", () => {
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-bulijob_task-panel_title"]').click();
    cy.createDirOrFile(TYPE_FILE, 'test-a', true);
    let targetDropBoxCy = '[data-cy="component_property-parameter_file_bulkjob-autocomplete"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 3, 'test-a');
    cy.get('[data-cy="component_property-parameter_file_bulkjob-autocomplete"]').find('input').should('have.value', 'test-a');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  parameter file入力反映確認
  試験確認内容：parameter fileセレクトボックスに入力した値が反映されていることを確認
  */
  it("04-01-470:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-parameter file入力反映確認-parameter fileセレクトボックスに入力した値が反映されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-bulijob_task-panel_title"]').click();
    cy.createDirOrFile(TYPE_FILE, 'test-a', true);
    let targetDropBoxCy = '[data-cy="component_property-parameter_file_bulkjob-autocomplete"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 3, 'test-a');
    cy.closeProperty();
    cy.clickComponentName(BJ_TASK_NAME_0);
    cy.get('[data-cy="component_property-bulijob_task-panel_title"]').click();
    cy.get('[data-cy="component_property-parameter_file_bulkjob-autocomplete"]').contains('test-a').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  プロパティ設定確認
  シェルスクリプト選択セレクトボックス表示確認
  試験確認内容：シェルスクリプト選択セレクトボックスが表示されていることを確認
  */
  it("04-01-471:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-プロパティ設定確認-シェルスクリプト選択セレクトボックス表示確認-シェルスクリプト選択セレクトボックスが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-bulijob_task-panel_title"]').click();
    cy.get('[data-cy="component_property-manual_finish_condition-switch"]').find('input').click();
    cy.get('[data-cy="component_property-balkjob_use_javascript-autocomplete"]').find('input').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  プロパティ設定確認
  シェルスクリプト選択セレクトボックス選択確認
  試験確認内容：選択した値が表示されていることを確認
  */
  it("04-01-472:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-プロパティ設定確認-シェルスクリプト選択セレクトボックス選択確認-選択した値が表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test-a', true);
    cy.get('[data-cy="component_property-bulijob_task-panel_title"]').click();
    cy.get('[data-cy="component_property-manual_finish_condition-switch"]').find('input').click();
    let targetDropBoxCy = '[data-cy="component_property-balkjob_use_javascript-autocomplete"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 3, 'test-a');
    cy.get('[data-cy="component_property-balkjob_use_javascript-autocomplete"]').find('input').should('have.value', 'test-a');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  プロパティ設定確認
  シェルスクリプト選択セレクトボックス選択反映確認
  試験確認内容：選択した値が表示されていることを確認
  */
  it("04-01-473:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-プロパティ設定確認-シェルスクリプト選択セレクトボックス選択反映確認-選択した値が反映されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.createDirOrFile(TYPE_FILE, 'test-a', true);
    cy.get('[data-cy="component_property-bulijob_task-panel_title"]').click();
    cy.get('[data-cy="component_property-manual_finish_condition-switch"]').find('input').click();
    let targetDropBoxCy = '[data-cy="component_property-balkjob_use_javascript-autocomplete"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 3, 'test-a');
    cy.closeProperty();
    cy.clickComponentName(BJ_TASK_NAME_0);
    cy.get('[data-cy="component_property-bulijob_task-panel_title"]').click();
    cy.get('[data-cy="component_property-balkjob_use_javascript-autocomplete"]').contains('test-a').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  プロパティ設定確認
  javascriptテキストボックス表示確認
  試験確認内容：javascriptテキストボックスが表示されていることを確認
  */
  it("04-01-474:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-プロパティ設定確認-javascriptテキストボックス表示確認-javascriptテキストボックスが表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-bulijob_task-panel_title"]').click();
    cy.get('[data-cy="component_property-manual_finish_condition-switch"]').find('input').click();
    cy.get('[data-cy="component_property-balkjob_use_javascript-switch"]').find('input').click();
    cy.get('[data-cy="component_property-balkjob_use_javascript-textarea"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  プロパティ設定確認
  javascriptテキストボックス入力確認
  試験確認内容：入力した値が表示されていることを確認
  */
  it("04-01-475:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-プロパティ設定確認-javascriptテキストボックス入力確認-入力した値が表示されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-bulijob_task-panel_title"]').click();
    cy.get('[data-cy="component_property-manual_finish_condition-switch"]').find('input').click();
    cy.get('[data-cy="component_property-balkjob_use_javascript-switch"]').find('input').click();
    cy.get('[data-cy="component_property-balkjob_use_javascript-textarea"]').type('testJavaScript');
    cy.get('[data-cy="component_property-balkjob_use_javascript-textarea"]').find('textarea').should('have.value', 'testJavaScript');
  });

  /** 
  コンポーネントの基本機能動作確認
  BulkjobTaskコンポーネント共通機能確認
  プロパティ設定確認
  javascriptテキストボックス反映確認
  試験確認内容：入力した値が反映されていることを確認
  */
  it("04-01-476:コンポーネントの基本機能動作確認-BulkjobTaskコンポーネント共通機能確認-プロパティ設定確認-javascriptテキストボックス反映確認-入力した値が反映されていることを確認", () => {
    cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-bulijob_task-panel_title"]').click();
    cy.get('[data-cy="component_property-manual_finish_condition-switch"]').find('input').click();
    cy.get('[data-cy="component_property-balkjob_use_javascript-switch"]').find('input').click();
    cy.get('[data-cy="component_property-balkjob_use_javascript-textarea"]').type('testJavaScript');
    cy.closeProperty();
    cy.clickComponentName(BJ_TASK_NAME_0);
    cy.get('[data-cy="component_property-bulijob_task-panel_title"]').click();
    cy.get('[data-cy="component_property-balkjob_use_javascript-textarea"]').find('textarea').should('have.value', 'testJavaScript');
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  試験確認内容：プロパティが表示されることを確認
  */
  it("04-01-477:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-プロパティが表示されることを確認", () => {
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    const DATA_CY_STR = '[data-cy="component_property-property-navigation_drawer"]';
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  試験確認内容：name入力テキストエリアが表示されていることを確認
  */
  it("04-01-478:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-name入力テキストエリアが表示されていることを確認", () => {
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    const DATA_CY_STR = '[data-cy="component_property-name-text_field"]'
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  name入力
  試験確認内容：nameが入力できることを確認
  */
  it("04-01-479:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-name入力-nameが入力できることを確認", () => {
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    const INPUT_OBJ_CY = '[data-cy="component_property-name-text_field"]';
    cy.get(INPUT_OBJ_CY).find('input').clear();
    cy.get(INPUT_OBJ_CY).type('-Test_Task');
    cy.get('[data-cy="workflow-save-text"]').click();
    cy.clickComponentName('-Test_Task');
    cy.get(INPUT_OBJ_CY).find(TAG_TYPE_INPUT).should('have.value', '-Test_Task');
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  name入力（使用可能文字確認）
  試験確認内容：nameが入力できないことを確認
  */
  it("04-01-480:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-name入力（使用可能文字確認）-nameが入力できないことを確認", () => {
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    const INPUT_OBJ_CY = '[data-cy="component_property-name-text_field"]';
    cy.get(INPUT_OBJ_CY).find('input').clear();
    cy.get(INPUT_OBJ_CY).type('Test*Task');
    cy.get('[data-cy="workflow-save-text"]').click();
    cy.clickComponentName(STEPJOB_TASK_NAME_0);
    cy.get(INPUT_OBJ_CY).find(TAG_TYPE_INPUT).should('have.not.value', 'Test*Task');
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  試験確認内容：説明入力テキストエリアが表示されていることを確認
  */
  it("04-01-481:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-description入力テキストエリアが表示されていることを確認", () => {
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    const DATA_CY_STR = '[data-cy="component_property-description-textarea"]'
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  description入力
  試験確認内容：descriptionが入力できることを確認
  */
  it("04-01-482:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-description入力-descriptionが入力できることを確認", () => {
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    const INPUT_OBJ_CY = '[data-cy="component_property-description-textarea"]';
    cy.confirmInputValueReflection(INPUT_OBJ_CY, 'descriptionTest', TAG_TYPE_TEXT_AREA);
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  input files表示
  試験確認内容：input files入力テキストエリアが表示されていることを確認
  */
  it("04-01-483:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-input files表示-input files入力テキストエリアが表示されていることを確認", () => {
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    const DATA_CY_STR = '[data-cy="component_property-input_files-list_form"]';
    const CLICK_AREA_CY = '[data-cy="component_property-in_out_files-panel_title"]';
    cy.confirmDisplayInPropertyByDetailsArea(DATA_CY_STR, CLICK_AREA_CY, null);
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  input files入力
  試験確認内容：input filesが入力できることを確認
  */
  it("04-01-484:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-input files入力-input filesが入力できることを確認", () => {
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true, false);
    cy.get('[data-cy="component_property-input_files-list_form"]').find('input').should('have.value', 'testInputFile');
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  input files反映確認
  試験確認内容：input filesが反映されることを確認
  */
  it("04-01-485:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-input files反映確認-input filesが反映されることを確認", () => {
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true, true);
    cy.get('[data-cy="graph-component-row"]').contains('testInputFile').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  output files表示
  試験確認内容：output files入力テキストエリアが表示されていることを確認
  */
  it("04-01-486:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-output files表示-output files入力テキストエリアが表示されていることを確認", () => {
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    cy.get('[data-cy="component_property-in_out_files-panel_title"]').click();
    cy.get('[data-cy="component_property-output_files-list_form"]').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  output files入力
  試験確認内容：output filesが入力できることを確認
  */
  it("04-01-487:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-output files入力-output filesが入力できることを確認", () => {
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, false);
    cy.get('[data-cy="component_property-output_files-list_form"]').find('input').should('have.value', 'testOutputFile');
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  output files反映確認
  試験確認内容：output filesが反映されることを確認
  */
  it("04-01-488:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-output files反映確認-output filesが反映されることを確認", () => {
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, true);
    cy.get('[data-cy="graph-component-row"]').contains('testOutputFile').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  構成要素の機能確認
  closeボタン押下
  試験確認内容：プロパティが表示されていないことを確認
  */
  it("04-01-489:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-構成要素の機能確認-closeボタン押下-プロパティが表示されていないことを確認", () => {
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    cy.closeProperty();
    cy.get('[data-cy="component_property-property-navigation_drawer"]').should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  接続確認
  試験確認内容：コンポーネントが接続されていることを確認
  */
  it("04-01-492:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-ファイル転送設定の各パターンの確認-接続確認-コンポーネントが接続されていることを確認", () => {
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, true);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_1, 300, 600);
    cy.connectComponent(STEPJOB_TASK_NAME_1);  // コンポーネント同士を接続
    cy.checkConnectionLine(STEPJOB_TASK_NAME_0, STEPJOB_TASK_NAME_1);  // 作成したコンポーネントの座標を取得して接続線の座標と比較
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除ボタン表示確認（input file）
  試験確認内容：削除ボタンが表示されることを確認
  */
  it("04-01-494:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除ボタン表示確認（input file）-削除ボタンが表示されることを確認", () => {
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true, true);
    cy.get('[data-cy="action_row-delete-btn"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除ボタン表示確認（output file）
  試験確認内容：削除ボタンが表示されることを確認
  */
  it("04-01-495:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除ボタン表示確認（output file）-削除ボタンが表示されることを確認", () => {
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, true);
    cy.get('[data-cy="action_row-delete-btn"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除反映確認（input file）
  試験確認内容：input fileが削除されていることを確認
  skip:issue#942
  */
  it.skip("04-01-496:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除反映確認（input file）-input fileが削除されていることを確認", () => {
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    cy.get('[data-cy="action_row-delete-btn"]').click();
    cy.get('[data-cy="graph-component-row"]').contains('testInputFile').should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除反映確認（output file）
  試験確認内容：output fileが削除されていることを確認
  skip:issue#942
  */
  it.skip("04-01-497:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除反映確認（output file）-output fileが削除されていることを確認", () => {
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    cy.get('[data-cy="action_row-delete-btn"]').click();
    cy.get('[data-cy="graph-component-row"]').contains('testOutputFile').should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ単体表示
  試験確認内容：ディレクトリが単体表示されることを確認
  */
  it("04-01-498:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ単体表示-ディレクトリが単体表示されることを確認", () => {
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    cy.createDirOrFile(TYPE_DIR, 'test-a', true);
    cy.createDirOrFile(TYPE_DIR, 'test-b', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-b').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ複数表示（リロード前）
  試験確認内容：ディレクトリが単体表示されることを確認
  */
  it("04-01-499:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ複数表示（リロード前）-ディレクトリが単体表示されることを確認", () => {
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    cy.createDirOrFile(TYPE_DIR, 'test1', true);
    cy.createDirOrFile(TYPE_DIR, 'test2', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test1').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test2').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ複数表示（リロード後）
  試験確認内容：ディレクトリが複数表示されることを確認
  */
  it("04-01-500:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ複数表示（リロード後）-ディレクトリが複数表示されることを確認", () => {
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    cy.createDirOrFile(TYPE_DIR, 'test1', true);
    cy.createDirOrFile(TYPE_DIR, 'test2', false);
    cy.closeProperty();
    cy.clickComponentName(STEPJOB_TASK_NAME_0);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test*').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  ファイル操作エリア
  ファイル単体表示
  試験確認内容：ファイルが単体表示されることを確認
  */
  it("04-01-501:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-ファイル操作エリア-ファイル単体表示-ファイルが単体表示されることを確認", () => {
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    cy.createDirOrFile(TYPE_FILE, 'test-a', true);
    cy.createDirOrFile(TYPE_FILE, 'test-b', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-b').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  ファイル操作エリア
  ファイル複数表示（リロード前）
  試験確認内容：ファイルが単体表示されることを確認
  */
  it("04-01-502:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-ファイル操作エリア-ファイル複数表示（リロード前）-ファイルが単体表示されることを確認", () => {
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    cy.createDirOrFile(TYPE_FILE, 'test1', true);
    cy.createDirOrFile(TYPE_FILE, 'test2', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test1').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test2').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  ファイル操作エリア
  ファイル複数表示（リロード後）
  試験確認内容：ファイルが複数表示されることを確認
  */
  it("04-01-503:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-ファイル操作エリア-ファイル複数表示（リロード後）-ファイルが複数表示されることを確認", () => {
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    cy.createDirOrFile(TYPE_FILE, 'test1', true);
    cy.createDirOrFile(TYPE_FILE, 'test2', false);
    cy.closeProperty();
    cy.clickComponentName(STEPJOB_TASK_NAME_0);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test*').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ディレクトリ表示
  試験確認内容：ディレクトリ内にディレクトリが作成されることを確認
  */
  it("04-01-504:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ内ディレクトリ表示-ディレクトリ内にディレクトリが作成されることを確認", () => {
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    cy.createDirOrFile(TYPE_DIR, 'test-a', true);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').click();
    cy.createDirOrFile(TYPE_DIR, 'test-b', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-b').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ファイル表示
  試験確認内容：ディレクトリ内にファイルが作成されることを確認
  */
  it("04-01-505:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ内ファイル表示-ディレクトリ内にファイルが作成されることを確認", () => {
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    cy.createDirOrFile(TYPE_DIR, 'test-a', true);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').click();
    cy.createDirOrFile(TYPE_FILE, 'test.txt', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test.txt').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  各コンポーネントの追加/削除確認
  該当コンポーネント削除確認
  試験確認内容：コンポーネントが削除されていることを確認
  */
  it("04-01-506:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-各コンポーネントの追加/削除確認-該当コンポーネント削除確認-コンポーネントが削除されていることを確認", () => {
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    cy.deleteComponent(STEPJOB_TASK_NAME_0);
    cy.get('[data-cy="graph-component-row"]').contains(STEPJOB_TASK_NAME_0).should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  script表示確認
  試験確認内容：scriptセレクトボックスが表示されていることを確認
  */
  it("04-01-507:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-script表示確認-scriptセレクトボックスが表示されていることを確認", ()=>{
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    const DATA_CY_STR = '[data-cy="component_property-script-autocomplete"]'
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  scriptファイル選択表示確認
  試験確認内容：scriptセレクトボックスで選択したファイルが表示されていることを確認
  */
  it("04-01-508:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-scriptファイル選択表示確認-scriptセレクトボックスで選択したファイルが表示されていることを確認", ()=>{
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    cy.createDirOrFile(TYPE_FILE, 'test-a', true);
    let targetDropBoxCy = '[data-cy="component_property-script-autocomplete"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 3, 'test-a');
    cy.get('[data-cy="component_property-script-autocomplete"]').find('input').should('have.value', 'test-a');
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  scriptファイル選択反映確認
  試験確認内容：scriptセレクトボックスで選択したファイルが反映されていることを確認
  */
  it("04-01-509:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-scriptファイル選択反映確認-scriptセレクトボックスで選択したファイルが反映されていることを確認", ()=>{
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    cy.createDirOrFile(TYPE_FILE, 'test-a', true);
    let targetDropBoxCy = '[data-cy="component_property-script-autocomplete"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 3, 'test-a');
    cy.closeProperty();
    cy.clickComponentName(STEPJOB_TASK_NAME_0);
    cy.get('[data-cy="component_property-script-autocomplete"]').contains('test-a').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  script表示確認
  試験確認内容：scriptセレクトボックスが表示されていることを確認
  */
  it("04-01-510:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-script表示確認-scriptセレクトボックスが表示されていることを確認", ()=>{
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    cy.get('[data-cy="component_property-stepjob_task-panel_title"]').click();
    cy.get('[data-cy="component_property-use_dependency-switch"]').click();
    const DATA_CY_STR = '[data-cy="component_property-step_number-text_field"]'
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  script入力反映確認
  試験確認内容：scriptセレクトボックスが入力されていることを確認
  */
  it("04-01-511:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-script入力反映確認-scriptセレクトボックスが入力されていることを確認", ()=>{
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true, true);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_1, 300, 600);
    // コンポーネント同士を接続
    cy.get('[data-cy="graph-component-row"]').find("polygon")
    .eq(1)
    .trigger("mousedown", { screenX: 100, screenY: 100 })
    cy.get('[data-cy="graph-component-row"]').contains(STEPJOB_TASK_NAME_1)
    .trigger("mouseup", { screenX: 300, screenY: 600 })
    cy.clickComponentName(STEPJOB_TASK_NAME_1);
    cy.get('[data-cy="component_property-stepjob_task-panel_title"]').click();
    cy.get('[data-cy="component_property-use_dependency-switch"]').find('input').click();
    cy.get('[data-cy="component_property-step_number-text_field"]').find('input').should('have.value', 1);
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  dependencyForm表示確認
  試験確認内容：dependencyFormテキストボックスが表示されていることを確認
  */
  it("04-01-512:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-dependencyForm表示確認-dependencyFormテキストボックスが表示されていることを確認", ()=>{
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    cy.get('[data-cy="component_property-stepjob_task-panel_title"]').click();
    cy.get('[data-cy="component_property-use_dependency-switch"]').find('input').click();
    const DATA_CY_STR = '[data-cy="component_property-dependency_form-text_field"]'
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  dependencyForm入力確認
  試験確認内容：dependencyFormテキストボックスが入力できることを確認
  */
  it("04-01-513:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-dependencyForm入力確認-dependencyFormテキストボックスが入力できることを確認", ()=>{
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    cy.get('[data-cy="component_property-stepjob_task-panel_title"]').click();
    cy.get('[data-cy="component_property-use_dependency-switch"]').find('input').click();
    cy.get('[data-cy="component_property-dependency_form-text_field"]').type('testDependency');
    cy.get('[data-cy="component_property-dependency_form-text_field"]').find('input').should('have.value', 'testDependency');
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  dependencyForm入力反映確認
  試験確認内容：dependencyFormテキストボックスに入力した値が反映されることを確認
  */
  it("04-01-514:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-dependencyForm入力反映確認-dependencyFormテキストボックスに入力した値が反映されることを確認", ()=>{
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    cy.get('[data-cy="component_property-stepjob_task-panel_title"]').click();
    cy.get('[data-cy="component_property-use_dependency-switch"]').find('input').click();
    cy.get('[data-cy="component_property-dependency_form-text_field"]').type('testDependency');
    cy.closeProperty();
    cy.clickComponentName(STEPJOB_TASK_NAME_0);
    cy.get('[data-cy="component_property-stepjob_task-panel_title"]').click();
    cy.get('[data-cy="component_property-use_dependency-switch"]').find('input').click();
    cy.get('[data-cy="component_property-dependency_form-text_field"]').find('input').should('have.value', 'testDependency');
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  include表示確認
  試験確認内容：includeテキストボックスが表示されていることを確認
  */
  it("04-01-515:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-include表示確認-includeテキストボックスが表示されていることを確認", ()=>{
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    cy.get('[data-cy="component_property-remote_file-panel_title"]').click();
    cy.get('[data-cy="component_property-include-list_form"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  include入力確認
  試験確認内容：入力した値が表示されていることを確認
  */
  it("04-01-516:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-include入力確認-入力した値が表示されていることを確認", ()=>{
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    cy.get('[data-cy="component_property-remote_file-panel_title"]').click();
    cy.get('[data-cy="component_property-include-list_form"]').find('input').type('includeTest');
    cy.get('[data-cy="component_property-include-list_form"]').find('input').should('have.value', 'includeTest');
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  include入力反映確認
  試験確認内容：入力した値が反映されていることを確認
  */
  it("04-01-517:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-include入力反映確認-入力した値が反映されていることを確認", ()=>{
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    cy.get('[data-cy="component_property-remote_file-panel_title"]').click();
    cy.get('[data-cy="component_property-include-list_form"]').find('input').type('includeTest{enter}');
    cy.closeProperty();
    cy.clickComponentName(STEPJOB_TASK_NAME_0);
    cy.get('[data-cy="component_property-remote_file-panel_title"]').click();
    cy.get('[data-cy="component_property-include-list_form"]').contains('includeTest').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  exclude表示確認
  試験確認内容：excludeテキストボックスが表示されていることを確認
  */
  it("04-01-518:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-exclude表示確認-excludeテキストボックスが表示されていることを確認", ()=>{
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    cy.get('[data-cy="component_property-remote_file-panel_title"]').click();
    cy.get('[data-cy="component_property-exclude-list_form"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  exclude入力確認
  試験確認内容：入力した値が表示されていることを確認
  */
  it("04-01-519:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-exclude入力確認-入力した値が表示されていることを確認", ()=>{
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    cy.get('[data-cy="component_property-remote_file-panel_title"]').click();
    cy.get('[data-cy="component_property-exclude-list_form"]').find('input').type('excludeTest');
    cy.get('[data-cy="component_property-exclude-list_form"]').find('input').should('have.value', 'excludeTest');
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  exclude入力反映確認
  試験確認内容：入力した値が反映されていることを確認
  */
  it("04-01-520:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-exclude入力反映確認-入力した値が反映されていることを確認", ()=>{
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    cy.get('[data-cy="component_property-remote_file-panel_title"]').click();
    cy.get('[data-cy="component_property-exclude-list_form"]').find('input').type('excludeTest{enter}');
    cy.closeProperty();
    cy.clickComponentName(STEPJOB_TASK_NAME_0);
    cy.get('[data-cy="component_property-remote_file-panel_title"]').click();
    cy.get('[data-cy="component_property-exclude-list_form"]').contains('excludeTest').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  clean up flag表示確認
  試験確認内容：各ラジオボタンが表示されていることを確認
  */
  it("04-01-521:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-clean up flag表示確認-各ラジオボタンが表示されていることを確認", ()=>{
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    cy.get('[data-cy="component_property-remote_file-panel_title"]').click();
    cy.get('[data-cy="component_property-remove-radio"]').find('input').should('exist');
    cy.get('[data-cy="component_property-keep-radio"]').find('input').should('exist');
    cy.get('[data-cy="component_property-same-radio"]').find('input').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  clean up flag入力確認
  試験確認内容：各ラジオボタンが選択できることを確認
  */
  it("04-01-522:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-clean up flag入力確認-各ラジオボタンが選択できることを確認", ()=>{
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    cy.get('[data-cy="component_property-remote_file-panel_title"]').click();
    cy.get('[data-cy="component_property-remove-radio"]').find('input').click();
    cy.get('[data-cy="component_property-remove-radio"]').find('input').should('be.checked');
    cy.get('[data-cy="component_property-keep-radio"]').find('input').click();
    cy.get('[data-cy="component_property-keep-radio"]').find('input').should('be.checked');
    cy.get('[data-cy="component_property-same-radio"]').find('input').click();
    cy.get('[data-cy="component_property-same-radio"]').find('input').should('be.checked');
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  clean up flag入力反映確認（remove files）
  試験確認内容：remove filesが設定されていることを確認
  */
  it("04-01-523:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-clean up flag入力反映確認（remove files）-remove filesが設定されていることを確認", ()=>{
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    cy.get('[data-cy="component_property-remote_file-panel_title"]').click();
    cy.get('[data-cy="component_property-remove-radio"]').find('input').click();
    cy.closeProperty();
    cy.clickComponentName(STEPJOB_TASK_NAME_0);
    cy.get('[data-cy="component_property-remote_file-panel_title"]').click();
    cy.get('[data-cy="component_property-remove-radio"]').find('input').should('be.checked');
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  clean up flag入力反映確認（keep files）
  試験確認内容：keep filesが設定されていることを確認
  */
  it("04-01-524:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-clean up flag入力反映確認（keep files）-keep filesが設定されていることを確認", ()=>{
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    cy.get('[data-cy="component_property-remote_file-panel_title"]').click();
    cy.get('[data-cy="component_property-keep-radio"]').find('input').click();
    cy.closeProperty();
    cy.clickComponentName(STEPJOB_TASK_NAME_0);
    cy.get('[data-cy="component_property-remote_file-panel_title"]').click();
    cy.get('[data-cy="component_property-keep-radio"]').find('input').should('be.checked');
  });

  /** 
  コンポーネントの基本機能動作確認
  StepjobTaskコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  clean up flag入力反映確認（same as parent）
  試験確認内容：same as parentが設定されていることを確認
  */
  it("04-01-525:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-clean up flag入力反映確認（same as parent）-same as parentが設定されていることを確認", ()=>{
    cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
    cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
    cy.get('[data-cy="component_property-property-navigation_drawer"]', { timeout: 30000 }).should('be.visible'); // プロパティ表示まで待機
    cy.get('[data-cy="component_property-remote_file-panel_title"]').click();
    cy.get('[data-cy="component_property-same-radio"]').find('input').click();
    cy.closeProperty();
    cy.clickComponentName(STEPJOB_TASK_NAME_0);
    cy.get('[data-cy="component_property-remote_file-panel_title"]').click();
    cy.get('[data-cy="component_property-same-radio"]').find('input').should('be.checked');
  });
})


