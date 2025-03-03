describe("03:ワークフロー画面基本動作確認", ()=>{
  const PROJECT_NAME = "TestProject"
  const PROJECT_DESCRIPTION = "TestDescription"
  const TYPE_INPUT = "input"
  const TYPE_OUTPUT = "output"
  const TYPE_DIR = "dir"
  const TYPE_FILE = "file"
  const DEF_COMPONENT_TASK = "task"
  const TASK_NAME_0 = "task0"
  const TASK_NAME_1 = "task1"
  const TAG_TYPE_INPUT = "input"
  const TAG_TYPE_TEXT_AREA = "textarea"

  beforeEach(()=>{
    cy.createProject(PROJECT_NAME, PROJECT_DESCRIPTION);
    cy.openProject();
    cy.viewport("macbook-16");
    cy.createComponent(DEF_COMPONENT_TASK, TASK_NAME_0, 300, 500);
  })

  afterEach(()=>{
    cy.removeAllProjects();
  })
  
  /** 
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  試験確認内容：プロパティが表示されることを確認
  */
  it("03-01-001:Task コンポーネントの基本機能動作確認-コンポーネント共通機能確認-プロパティが表示されることを確認", ()=>{
    const DATA_CY_STR = '[data-cy="component_property-property-navigation_drawer"]';
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  試験確認内容：name入力テキストエリアが表示されていることを確認
  */
  it("03-01-002:Task コンポーネントの基本機能動作確認-コンポーネント共通機能確認-name入力テキストエリアが表示されていることを確認", ()=>{
    const DATA_CY_STR = '[data-cy="component_property-name-text_field"]'
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  name入力
  試験確認内容：nameが入力できることを確認
  */
  it("03-01-003:Task コンポーネントの基本機能動作確認-コンポーネント共通機能確認-name入力-nameが入力できることを確認", ()=>{
    const INPUT_OBJ_CY = '[data-cy="component_property-name-text_field"]';
    cy.confirmInputValueReflection(INPUT_OBJ_CY, '-Test_Task', TAG_TYPE_INPUT);
  });

  /** 
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  name入力（使用可能文字確認）
  試験確認内容：nameが入力できないことを確認
  */
  it("03-01-004:Task コンポーネントの基本機能動作確認-コンポーネント共通機能確認-name入力（使用可能文字確認）-nameが入力できないことを確認", ()=>{
    const INPUT_OBJ_CY = '[data-cy="component_property-name-text_field"]';
    cy.confirmInputValueNotReflection(INPUT_OBJ_CY, 'Test*Task', TAG_TYPE_INPUT);
  });

 /** 
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  試験確認内容：説明入力テキストエリアが表示されていることを確認
  */
  it("03-01-005:Task コンポーネントの基本機能動作確認-コンポーネント共通機能確認-description入力テキストエリアが表示されていることを確認", ()=>{
    const DATA_CY_STR = '[data-cy="component_property-description-textarea"]'
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  description入力
  試験確認内容：descriptionが入力できることを確認
  */
  it("03-01-006:Task コンポーネントの基本機能動作確認-コンポーネント共通機能確認-description入力-descriptionが入力できることを確認", ()=>{
    const INPUT_OBJ_CY = '[data-cy="component_property-description-textarea"]';
    cy.confirmInputValueReflection(INPUT_OBJ_CY, 'descriptionTest', TAG_TYPE_TEXT_AREA);
  });

  /** 
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  input files表示
  試験確認内容：input files入力テキストエリアが表示されていることを確認
  */
  it("03-01-007:Task コンポーネントの基本機能動作確認-コンポーネント共通機能確認-input files表示-input files入力テキストエリアが表示されていることを確認", ()=>{
    const DATA_CY_STR = '[data-cy="component_property-input_files-list_form"]';
    const CLICK_AREA_CY = '[data-cy="component_property-in_out_files-panel_title"]';
    cy.confirmDisplayInPropertyByDetailsArea(DATA_CY_STR, CLICK_AREA_CY, null);
  });

  /** 
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  input files入力
  試験確認内容：input filesが入力できることを確認
  */
  it("03-01-008:Task コンポーネントの基本機能動作確認-コンポーネント共通機能確認-input files入力-input filesが入力できることを確認", ()=>{
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true);
    cy.get('[data-cy="component_property-input_files-list_form"]').find('input').should('have.value', 'testInputFile');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  input files反映確認
  試験確認内容：input filesが反映されることを確認
  */
  it("03-01-009:Task コンポーネントの基本機能動作確認-コンポーネント共通機能確認-input files反映確認-input filesが反映されることを確認", ()=>{
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true);
    cy.get('[data-cy="graph-component-row"]').contains('testInputFile').should('exist');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  output files表示
  試験確認内容：output files入力テキストエリアが表示されていることを確認
  */
  it("03-01-0010:Task コンポーネントの基本機能動作確認-コンポーネント共通機能確認-output files表示-output files入力テキストエリアが表示されていることを確認", ()=>{
    cy.get('[data-cy="component_property-in_out_files-panel_title"]').click();
    cy.get('[data-cy="component_property-output_files-list_form"]').find('input').should('exist');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  output files入力
  試験確認内容：output filesが入力できることを確認
  */
  it("03-01-011:Task コンポーネントの基本機能動作確認-コンポーネント共通機能確認-output files入力-output filesが入力できることを確認", ()=>{
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true);
    cy.get('[data-cy="component_property-output_files-list_form"]').find('input').should('have.value', 'testOutputFile');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  output files反映確認
  試験確認内容：output filesが反映されることを確認
  */
  it("03-01-012:Task コンポーネントの基本機能動作確認-コンポーネント共通機能確認-output files反映確認-output filesが反映されることを確認", ()=>{
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true);
    cy.get('[data-cy="list_form-add-text_field"]').find('[role="button"]').eq(3).click();
    cy.get('[data-cy="graph-component-row"]').contains('testOutputFile').should('exist');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  構成要素の機能確認
  closeボタン押下
  試験確認内容：プロパティが表示されていないことを確認
  */
  it("03-01-013:Task コンポーネントの基本機能動作確認-コンポーネント共通機能確認-構成要素の機能確認-closeボタン押下-プロパティが表示されていないことを確認", ()=>{
    cy.closeProperty();
    cy.get('[data-cy="component_property-property-navigation_drawer"]').should('not.exist');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  構成要素の機能確認
  cleanボタン押下
  試験確認内容：最新の保存状態に戻っていることを確認
  */
  it("03-01-014:Task コンポーネントの基本機能動作確認-コンポーネント共通機能確認-構成要素の機能確認-cleanボタン押下-最新の保存状態に戻っていることを確認", ()=>{
    cy.createDirOrFile(TYPE_FILE, 'test-a', true);
    cy.get('[data-cy="component_property-script-autocomplete"]').click()
    cy.get("[role=\"listbox\"]").eq(3).contains('test-a').click()
    cy.saveProperty();
    cy.get('[data-cy="workflow-play-btn"]').click(); // Taskコンポーネントを実行する
    cy.clickComponentName(TASK_NAME_0);
    cy.get('[data-cy="component_property-name-text_field"]').find('input').clear();
    cy.get('[data-cy="component_property-name-text_field"]').type('changeName');
    cy.get('[data-cy="component_property-description-textarea"]').find('textarea').focus();
    cy.get('[data-cy="component_property-clean-btn"]').click();
    cy.get('[data-cy="component_property-name-text_field"]').find('input').should('have.value', 'test-a');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  接続確認
  試験確認内容：コンポーネントが接続されていることを確認
  */
  it("03-01-016:Task コンポーネントの基本機能動作確認-コンポーネント共通機能確認-ファイル転送設定の各パターンの確認-接続確認-コンポーネントが接続されていることを確認", ()=>{
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true);
    cy.createComponent(DEF_COMPONENT_TASK, TASK_NAME_1, 300, 600); // 別のTaskコンポーネントを作成
    cy.get('[data-cy="graph-component-row"]').find("polygon") // Taskコンポーネントを接続
    .eq(0)
    .trigger("mousedown", { screenX: 100, screenY: 100 })
    cy.get('[data-cy="graph-component-row"]').contains(TASK_NAME_1)
    .trigger("mouseup", { screenX: 300, screenY: 600 })
    cy.clickComponentName(TASK_NAME_1);
    // 作成したコンポーネントの座標を取得して接続線の座標と比較
    cy.get('[data-cy="component-component_group-g"]').filter(':contains(' + TASK_NAME_0 + ')').find('[data-cy="iofilebox-rect-rect"]').as("start_rect");
    cy.get('@start_rect').invoke('attr', 'x').as("start_x");
    cy.get('@start_rect').invoke('attr', 'y').as("start_y");
    cy.get('@start_rect').invoke('attr', 'width').as("start_width");
    cy.get('@start_rect').invoke('attr', 'height').as("start_height");
    cy.get('[data-cy="component-component_group-g"]').filter(':contains(' + TASK_NAME_1 + ')').find('[data-cy="iofilebox-rect-rect"]').as("end_rect");
    cy.get('@end_rect').invoke('attr', 'x').as("end_x");
    cy.get('@end_rect').invoke('attr', 'y').as("end_y");
    cy.get('@end_rect').invoke('attr', 'width').as("end_width");
    cy.get('@end_rect').invoke('attr', 'height').as("end_height");
    cy.get("@start_x").then((start_x_text) =>{
      cy.get("@start_y").then((start_y_text)=>{
        cy.get("@start_width").then((start_width_text)=>{
          cy.get("@start_height").then((start_height_text)=>{
            cy.get("@end_x").then((end_x_text)=>{
              cy.get("@end_y").then((end_y_text)=>{
                cy.get("@end_width").then((end_width_text)=>{
                  cy.get("@end_height").then((end_height_text)=>{
                    const START_X = Number(start_x_text);
                    const START_Y = Number(start_y_text);
                    const START_WIDTH = Number(start_width_text);
                    const START_HEIGHT = Number(start_height_text);
                    const END_X = Number(end_x_text);
                    const END_Y = Number(end_y_text);
                    const END_HEIGHT = Number(end_height_text);                 
                    const EXPECTED_START_X =START_X + START_WIDTH;
                    const EXPECTED_START_Y =START_Y + START_HEIGHT/2;
                    const EXPECTED_END_X =END_X;
                    const EXPECTED_END_Y =END_Y + END_HEIGHT/2;
                    const REG_START = new RegExp(`^M\\s+${EXPECTED_START_X}+,+${EXPECTED_START_Y}\n\\s+C`)
                    const REG_END = new RegExp(`\\s+${EXPECTED_END_X}+,+${EXPECTED_END_Y}`)
                    cy.get('[data-cy="cubic-bezier-path"]').should("have.attr", "d").and("match",REG_START).and("match",REG_END)
                  })
                })
              })
            })
          })
        })
      })
    } );
  });

  /** 
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除ボタン表示確認（input file）
  試験確認内容：削除ボタンが表示されることを確認
  */
  it("03-01-022:Task コンポーネントの基本機能動作確認-コンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除ボタン表示確認（input file）-削除ボタンが表示されることを確認", ()=>{
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true);
    cy.get('[data-cy="action_row-delete-btn"]').should('be.visible');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除ボタン表示確認（output file）
  試験確認内容：削除ボタンが表示されることを確認
  */
  it("03-01-023:Task コンポーネントの基本機能動作確認-コンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除ボタン表示確認（output file）-削除ボタンが表示されることを確認", ()=>{
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true);
    cy.get('[data-cy="action_row-delete-btn"]').should('be.visible');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除反映確認（input file）
  試験確認内容：input fileが削除されていることを確認
  */
  it("03-01-024:Task コンポーネントの基本機能動作確認-コンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除反映確認（input file）-input fileが削除されていることを確認", ()=>{
    cy.enterInputOrOutputFile(TYPE_INPUT, 'testInputFile', true);
    cy.get('[data-cy="action_row-delete-btn"]').click();
    cy.get('[data-cy="graph-component-row"]').contains('testInputFile').should('not.exist');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除反映確認（output file）
  試験確認内容：output fileが削除されていることを確認
  */
  it("03-01-025:Task コンポーネントの基本機能動作確認-コンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除反映確認（output file）-output fileが削除されていることを確認", ()=>{
    cy.enterInputOrOutputFile(TYPE_OUTPUT, 'testOutputFile', true);
    cy.get('[data-cy="action_row-delete-btn"]').click();
    cy.get('[data-cy="graph-component-row"]').contains('testOutputFile').should('not.exist');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ単体表示
  試験確認内容：ディレクトリが単体表示されることを確認
  */
  it("03-01-026:Task コンポーネントの基本機能動作確認-コンポーネント共通機能確認-ファイル操作エリア-ディレクトリ単体表示-ディレクトリが単体表示されることを確認", ()=>{
    cy.createDirOrFile(TYPE_DIR, 'test-a', true);
    cy.createDirOrFile(TYPE_DIR, 'test-b', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-b').should('exist');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ複数表示（リロード前）
  試験確認内容：ディレクトリが単体表示されることを確認
  */
  it("03-01-027:Task コンポーネントの基本機能動作確認-コンポーネント共通機能確認-ファイル操作エリア-ディレクトリ複数表示（リロード前）-ディレクトリが単体表示されることを確認", ()=>{
    cy.createDirOrFile(TYPE_DIR, 'test1', true);
    cy.createDirOrFile(TYPE_DIR, 'test2', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test1').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test2').should('exist');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ複数表示（リロード後）
  試験確認内容：ディレクトリが複数表示されることを確認
  */
  it("03-01-028:Task コンポーネントの基本機能動作確認-コンポーネント共通機能確認-ファイル操作エリア-ディレクトリ複数表示（リロード後）-ディレクトリが複数表示されることを確認", ()=>{
    cy.createDirOrFile(TYPE_DIR, 'test1', true);
    cy.createDirOrFile(TYPE_DIR, 'test2', false);
    cy.closeProperty();
    cy.clickComponentName(TASK_NAME_0);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test*').should('exist');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  ファイル操作エリア
  ファイル単体表示
  試験確認内容：ファイルが単体表示されることを確認
  */
  it("03-01-029:Task コンポーネントの基本機能動作確認-コンポーネント共通機能確認-ファイル操作エリア-ファイル単体表示-ファイルが単体表示されることを確認", ()=>{
    cy.createDirOrFile(TYPE_FILE, 'test-a', true);
    cy.createDirOrFile(TYPE_FILE, 'test-b', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-b').should('exist');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  ファイル操作エリア
  ファイル複数表示（リロード前）
  試験確認内容：ファイルが単体表示されることを確認
  */
  it("03-01-030:Task コンポーネントの基本機能動作確認-コンポーネント共通機能確認-ファイル操作エリア-ファイル複数表示（リロード前）-ファイルが単体表示されることを確認", ()=>{
    cy.createDirOrFile(TYPE_FILE, 'test1', true);
    cy.createDirOrFile(TYPE_FILE, 'test2', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test1').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test2').should('exist');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  ファイル操作エリア
  ファイル複数表示（リロード後）
  試験確認内容：ファイルが複数表示されることを確認
  */
  it("03-01-031:Task コンポーネントの基本機能動作確認-コンポーネント共通機能確認-ファイル操作エリア-ファイル複数表示（リロード後）-ファイルが複数表示されることを確認", ()=>{
    cy.createDirOrFile(TYPE_FILE, 'test1', true);
    cy.createDirOrFile(TYPE_FILE, 'test2', false);
    cy.closeProperty();
    cy.clickComponentName(TASK_NAME_0);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test*').should('exist');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ディレクトリ表示
  試験確認内容：ディレクトリ内にディレクトリが作成されることを確認
  */
  it("03-01-032:Task コンポーネントの基本機能動作確認-コンポーネント共通機能確認-ファイル操作エリア-ディレクトリ内ディレクトリ表示-ディレクトリ内にディレクトリが作成されることを確認", ()=>{
    cy.createDirOrFile(TYPE_DIR, 'test-a', true);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').click();
    cy.createDirOrFile(TYPE_DIR, 'test-b', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-b').should('exist');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ファイル表示
  試験確認内容：ディレクトリ内にファイルが作成されることを確認
  */
  it("03-01-033:Task コンポーネントの基本機能動作確認-コンポーネント共通機能確認-ファイル操作エリア-ディレクトリ内ファイル表示-ディレクトリ内にファイルが作成されることを確認", ()=>{
    cy.createDirOrFile(TYPE_DIR, 'test-a', true);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').click();
    cy.createDirOrFile(TYPE_FILE, 'test.txt', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test.txt').should('exist');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  script表示確認
  試験確認内容：scriptセレクトボックスが表示されていることを確認
  */
  it("03-01-034:Task コンポーネントの基本機能動作確認-Taskコンポーネント機能確認-プロパティ設定確認-script表示確認-scriptセレクトボックスが表示されていることを確認", ()=>{
    const DATA_CY_STR = '[data-cy="component_property-script-autocomplete"]'
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  scriptファイル選択表示確認
  試験確認内容：scriptセレクトボックスで選択したファイルが表示されていることを確認
  */
  it("03-01-035:Task コンポーネントの基本機能動作確認-Taskコンポーネント機能確認-プロパティ設定確認-scriptファイル選択表示確認-scriptセレクトボックスで選択したファイルが表示されていることを確認", ()=>{
    cy.createDirOrFile(TYPE_FILE, 'test-a', true);
    cy.get('[data-cy="component_property-script-autocomplete"]').click();
    cy.get("[role=\"listbox\"]").eq(3).contains('test-a').click();
    cy.get('[data-cy="component_property-script-autocomplete"]').find('input').should('have.value', 'test-a');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  scriptファイル選択反映確認
  試験確認内容：scriptセレクトボックスで選択したファイルが反映されていることを確認
  */
  it("03-01-036:Task コンポーネントの基本機能動作確認-Taskコンポーネント機能確認-プロパティ設定確認-scriptファイル選択反映確認-scriptセレクトボックスで選択したファイルが反映されていることを確認", ()=>{
    cy.createDirOrFile(TYPE_FILE, 'test-a', true);
    cy.get('[data-cy="component_property-script-autocomplete"]').click();
    cy.get("[role=\"listbox\"]").eq(3).contains('test-a').click();
    cy.saveProperty();
    cy.get('[data-cy="component_property-script-autocomplete"]').find('input').should('have.value', 'test-a');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  host表示確認
  試験確認内容：hostセレクトボックスが表示されていることを確認
  */
  it("03-01-037:Task コンポーネントの基本機能動作確認-Taskコンポーネント機能確認-プロパティ設定確認-host表示確認-hostセレクトボックスが表示されていることを確認", ()=>{
    const DATA_CY_STR = '[data-cy="component_property-host-select"]'
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  host初期表示確認
  試験確認内容：localhostが表示されていることを確認
  */
  it("03-01-038:Task コンポーネントの基本機能動作確認-Taskコンポーネント機能確認-プロパティ設定確認-host初期表示確認-localhostが表示されていることを確認", ()=>{
    cy.get('[data-cy="component_property-host-select"]').find('input').should('have.value', 'localhost');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  host選択確認（localhost以外を選択）
  試験確認内容：hostセレクトボックスで選択した値が表示されていることを確認
  */
  it("03-01-039:Task コンポーネントの基本機能動作確認-Taskコンポーネント機能確認-プロパティ設定確認-host選択確認（localhost以外を選択）-hostセレクトボックスで選択した値が表示されていることを確認", ()=>{
    // 新規リモートホスト設定を作成
    cy.visit("/remotehost");
    cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
    cy.enterRequiredRemoteHost('TestLabel', 'TestHostname', 8000, 'testUser');
    cy.get('[data-cy="add_new_host-ok-btn"]').click();
    // ホーム画面からプロジェクトを開き検証を行う
    cy.visit("/");
    cy.openProject();
    cy.clickComponentName(TASK_NAME_0);
    cy.get('[data-cy="component_property-host-select"]').type('TestLabel');
    cy.get('[data-cy="component_property-host-select"]').contains('TestLabel').should('exist');
    cy.removeRemoteHost('TestLabel');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  host選択確認（localhost以外を選択）
  試験確認内容：hostセレクトボックスで選択した値が反映されていることを確認
  */
  it("03-01-040:Task コンポーネントの基本機能動作確認-Taskコンポーネント機能確認-プロパティ設定確認-hostファイル選択表示確認-hostセレクトボックスで選択したファイルが表示されていることを確認", ()=>{
    // 新規リモートホスト設定を作成
    cy.visit("/remotehost");
    cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
    cy.enterRequiredRemoteHost('TestLabel', 'TestHostname', 8000, 'testUser');
    cy.get('[data-cy="add_new_host-ok-btn"]').click();
    // ホーム画面からプロジェクトを開き検証を行う
    cy.visit("/");
    cy.openProject();
    cy.clickComponentName(TASK_NAME_0);
    cy.get('[data-cy="component_property-host-select"]').type('TestLabel');
    cy.saveProperty();
    cy.get('[data-cy="component_property-host-select"]').contains('TestLabel').should('exist');
    cy.removeRemoteHost('TestLabel');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  host選択反映確認（localhost選択）
  試験確認内容：localhostが設定されていることを確認
  */
  it("03-01-041:Task コンポーネントの基本機能動作確認-Taskコンポーネント機能確認-プロパティ設定確認-host選択反映確認（localhost選択）-localhostが設定されていることを確認", ()=>{
    // 新規リモートホスト設定を作成
    cy.visit("/remotehost");
    cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
    cy.enterRequiredRemoteHost('TestLabel', 'TestHostname', 8000, 'testUser');
    cy.get('[data-cy="add_new_host-ok-btn"]').click();
    // ホーム画面からプロジェクトを開き検証を行う
    cy.visit("/");
    cy.openProject();
    cy.clickComponentName(TASK_NAME_0);
    cy.get('[data-cy="component_property-host-select"]').type('localhost');
    cy.get('[data-cy="component_property-host-select"]').contains('localhost').should('exist');
    cy.removeRemoteHost('TestLabel');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  use job schedulerスイッチボタン表示確認
  試験確認内容：use job schedulerスイッチボタンが表示されていることを確認
  */
  it("03-01-042:Task コンポーネントの基本機能動作確認-Taskコンポーネント機能確認-プロパティ設定確認-use job schedulerスイッチボタン表示確認-use job schedulerスイッチボタンが表示されていることを確認", ()=>{
    const DATA_CY_STR = '[data-cy="component_property-job_scheduler-switch"]'
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /** 
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  queue表示確認（無効）
  試験確認内容：queueセレクトボックスが無効となっていることを確認
  */
  it("03-01-043:Task コンポーネントの基本機能動作確認-Taskコンポーネント機能確認-プロパティ設定確認-queue表示確認（無効）-queueセレクトボックスが無効となっていることを確認", ()=>{
    cy.get('[data-cy="component_property-queue-select"]').find('input').should('be.disabled');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  queue表示確認（有効）
  試験確認内容：queueセレクトボックスが有効となっていることを確認
  */
  it("03-01-044:Task コンポーネントの基本機能動作確認-Taskコンポーネント機能確認-プロパティ設定確認-queue表示確認（有効）-queueセレクトボックスが有効となっていることを確認", ()=>{
    cy.get('[data-cy="component_property-job_scheduler-switch"]').find('input').click();
    cy.get('[data-cy="component_property-queue-select"]').find('input').should('be.not.disabled');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  queue選択確認
  試験確認内容：queueセレクトボックスに選択した値が表示されていることを確認
  */
  it("03-01-045:Task コンポーネントの基本機能動作確認-Taskコンポーネント機能確認-プロパティ設定確認-queue選択確認-queueセレクトボックスに選択した値が表示されていることを確認", ()=>{
    // 新規リモートホスト設定を作成
    cy.visit("/remotehost");
    cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
    cy.enterRequiredRemoteHost('TestLabel', 'TestHostname', 8000, 'testUser');
    cy.get('[data-cy="add_new_host-available_queues-text_field"]').type('testQueues');
    cy.get('[data-cy="add_new_host-ok-btn"]').click();
    // ホーム画面からプロジェクトを開き検証を行う
    cy.visit("/");
    cy.openProject();
    cy.clickComponentName(TASK_NAME_0);
    let targetDropBoxCy = '[data-cy="component_property-host-select"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 2, 'TestLabel');
    cy.get('[data-cy="component_property-job_scheduler-switch"]').find('input').click();
    targetDropBoxCy = '[data-cy="component_property-queue-select"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 2, 'testQueues');
    cy.get('[data-cy="component_property-queue-select"]').find('input').should('have.value', 'testQueues');
    cy.removeRemoteHost('TestLabel');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  queue選択反映確認
  試験確認内容：queueセレクトボックスに選択した値が反映されていることを確認
  */
  it("03-01-046:Task コンポーネントの基本機能動作確認-Taskコンポーネント機能確認-プロパティ設定確認-queue選択反映確認-queueセレクトボックスに選択した値が反映されていることを確認", ()=>{
    // 新規リモートホスト設定を作成
    cy.visit("/remotehost");
    cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
    cy.enterRequiredRemoteHost('TestLabel', 'TestHostname', 8000, 'testUser');
    cy.get('[data-cy="add_new_host-available_queues-text_field"]').type('testQueues');
    cy.get('[data-cy="add_new_host-ok-btn"]').click();
    // ホーム画面からプロジェクトを開き検証を行う
    cy.visit("/");
    cy.openProject();
    cy.clickComponentName(TASK_NAME_0);
    let targetDropBoxCy = '[data-cy="component_property-host-select"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 2, 'TestLabel');
    cy.get('[data-cy="component_property-job_scheduler-switch"]').find('input').click();
    targetDropBoxCy = '[data-cy="component_property-queue-select"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 2, 'testQueues');
    cy.saveProperty();
    cy.get('[data-cy="component_property-queue-select"]').find('input').should('have.value', 'testQueues');
    cy.removeRemoteHost('TestLabel');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  submit command表示確認（無効）
  試験確認内容：submit commandテキストボックスが無効となっていることを確認
  */
  it("03-01-047:Task コンポーネントの基本機能動作確認-Taskコンポーネント機能確認-プロパティ設定確認-submit command表示確認（無効）-submit commandテキストボックスが無効となっていることを確認", ()=>{
    cy.get('[data-cy="component_property-submit_command-text_field"]').find('input').should('be.disabled');
  });
  
  /** 
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  submit command表示確認（有効）
  試験確認内容：submit commandテキストボックスが有効となっていることを確認
  */
  it("03-01-048:Task コンポーネントの基本機能動作確認-Taskコンポーネント機能確認-プロパティ設定確認-submit command表示確認（有効）-submit commandテキストボックスが有効となっていることを確認", ()=>{
    cy.get('[data-cy="component_property-job_scheduler-switch"]').find('input').click();
    cy.get('[data-cy="component_property-submit_command-text_field"]').find('input').should('be.not.disabled');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  submit command反映確認
  試験確認内容：リモートホストのジョブ投入コマンドが表示されていることを確認
  */
  it("03-01-049:Task コンポーネントの基本機能動作確認-Taskコンポーネント機能確認-プロパティ設定確認-submit command反映確認-リモートホストのジョブ投入コマンドが表示されていることを確認", ()=>{
    // 新規リモートホスト設定を作成
    cy.visit("/remotehost");
    cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
    cy.enterRequiredRemoteHost('TestLabel', 'TestHostname', 8000, 'testUser');
    cy.get('[data-cy="add_new_host-job_schedulers-select"]').type('PBSPro');
    cy.get('[data-cy="add_new_host-ok-btn"]').click();
    // ホーム画面からプロジェクトを開き検証を行う
    cy.visit("/");
    cy.openProject();
    cy.clickComponentName(TASK_NAME_0);
    let targetDropBoxCy = '[data-cy="component_property-host-select"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 2, 'TestLabel');
    cy.saveProperty();
    cy.get('[data-cy="component_property-submit_command-text_field"]').find('input').should('have.value', 'qsub');
    cy.removeRemoteHost('TestLabel');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  submit option表示確認（無効）
  試験確認内容：submit optionテキストボックスが無効となっていることを確認
  */
  it("03-01-050:Task コンポーネントの基本機能動作確認-Taskコンポーネント機能確認-プロパティ設定確認-submit option表示確認（無効）-submit optionテキストボックスが無効となっていることを確認", ()=>{
    cy.get('[data-cy="component_property-submit_option-text_field"]').find('input').should('be.disabled');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  submit option表示確認（有効）
  試験確認内容：submit optionテキストボックスが有効となっていることを確認
  */
  it("03-01-051:Task コンポーネントの基本機能動作確認-Taskコンポーネント機能確認-プロパティ設定確認-submit option表示確認（有効）-submit optionテキストボックスが有効となっていることを確認", ()=>{
    cy.get('[data-cy="component_property-job_scheduler-switch"]').find('input').click();
    cy.get('[data-cy="component_property-submit_option-text_field"]').find('input').should('be.not.disabled');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  submit command反映確認
  試験確認内容：submit optionテキストボックスに入力した値が設定されていることを確認
  */
  it("03-01-052:Task コンポーネントの基本機能動作確認-Taskコンポーネント機能確認-プロパティ設定確認-submit command反映確認-submit optionテキストボックスに入力した値が設定されていることを確認", ()=>{
    cy.get('[data-cy="component_property-job_scheduler-switch"]').find('input').click();
    cy.get('[data-cy="component_property-submit_option-text_field"]').type('testSubmitCommand');
    cy.saveProperty();
    cy.clickComponentName(TASK_NAME_0);
    cy.get('[data-cy="component_property-submit_option-text_field"]').find('input').should('have.value', 'testSubmitCommand');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  number of retry表示確認
  試験確認内容：number of retryテキストボックスが表示されていることを確認
  */
  it("03-01-053:Task コンポーネントの基本機能動作確認-Taskコンポーネント機能確認-プロパティ設定確認-number of retry表示確認-number of retryテキストボックスが表示されていることを確認", ()=>{
    cy.get('[data-cy="component_property-retry-panel_title"]').click();
    cy.get('[data-cy="component_property-number_or_retry-text_field"]').should('be.visible');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  number of retry入力確認
  試験確認内容：number of retryテキストボックスに入力した値が表示されていることを確認
  */
  it("03-01-054:Task コンポーネントの基本機能動作確認-Taskコンポーネント機能確認-プロパティ設定確認-number of retry入力確認-number of retryテキストボックスに入力した値が表示されていることを確認", ()=>{
    cy.get('[data-cy="component_property-retry-panel_title"]').click();
    cy.get('[data-cy="component_property-number_or_retry-text_field"]').type(10);
    cy.get('[data-cy="component_property-number_or_retry-text_field"]').find('input').should('have.value', 10);
  });

  /** 
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  number of retry入力反映確認
  試験確認内容：number of retryテキストボックスに入力した値が反映されていることを確認
  */
  it("03-01-055:Task コンポーネントの基本機能動作確認-Taskコンポーネント機能確認-プロパティ設定確認-number of retry入力反映確認-number of retryテキストボックスに入力した値が反映されていることを確認", ()=>{
    cy.get('[data-cy="component_property-retry-panel_title"]').click();
    cy.get('[data-cy="component_property-number_or_retry-text_field"]').type(10);
    cy.saveProperty();
    cy.closeProperty();
    cy.clickComponentName(TASK_NAME_0);
    cy.get('[data-cy="component_property-retry-panel_title"]').click();
    cy.get('[data-cy="component_property-number_or_retry-text_field"]').find('input').should('have.value', 10);
  });

  /** 
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  シェルスクリプト選択セレクトボックス表示確認
  試験確認内容：シェルスクリプト選択セレクトボックスが表示されていることを確認
  */
  it("03-01-056:Task コンポーネントの基本機能動作確認-Taskコンポーネント機能確認-プロパティ設定確認-シェルスクリプト選択セレクトボックス表示確認-シェルスクリプト選択セレクトボックスが表示されていることを確認", ()=>{
    cy.get('[data-cy="component_property-retry-panel_title"]').click();
    cy.get('[data-cy="component_property-task_use_javascript-autocomplete"]').find('input').should('be.not.visible');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  シェルスクリプト選択セレクトボックス選択確認
  試験確認内容：選択した値が表示されていることを確認
  */
  it("03-01-057:Task コンポーネントの基本機能動作確認-Taskコンポーネント機能確認-プロパティ設定確認-シェルスクリプト選択セレクトボックス選択確認-選択した値が表示されていることを確認", ()=>{
    cy.createDirOrFile(TYPE_FILE, 'test-a', true);
    cy.get('[data-cy="component_property-retry-panel_title"]').click();
    cy.get('[data-cy="component_property-task_use_javascript-autocomplete"]').find('input').type('test-a');
    cy.get('[data-cy="component_property-task_use_javascript-autocomplete"]').find('input').should('have.value', 'test-a');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  シェルスクリプト選択セレクトボックス選択反映確認
  試験確認内容：選択した値が表示されていることを確認
  */
  it("03-01-058:Task コンポーネントの基本機能動作確認-Taskコンポーネント機能確認-プロパティ設定確認-シェルスクリプト選択セレクトボックス選択反映確認-選択した値が反映されていることを確認", ()=>{
    cy.createDirOrFile(TYPE_FILE, 'test-a', true);
    cy.get('[data-cy="component_property-retry-panel_title"]').click();
    cy.get('[data-cy="component_property-task_use_javascript-autocomplete"]').find('input').type('test-a');
    cy.saveProperty();
    cy.closeProperty();
    cy.clickComponentName(TASK_NAME_0);
    cy.get('[data-cy="component_property-retry-panel_title"]').click();
    cy.get('[data-cy="component_property-task_use_javascript-autocomplete"]').find('input').should('have.value', 'test-a');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  javascriptテキストボックス表示確認
  試験確認内容：javascriptテキストボックスが表示されていることを確認
  */
  it("03-01-059:Task コンポーネントの基本機能動作確認-Taskコンポーネント機能確認-プロパティ設定確認-javascriptテキストボックス表示確認-javascriptテキストボックスが表示されていることを確認", ()=>{
    cy.get('[data-cy="component_property-retry-panel_title"]').click();
    cy.get('[data-cy="component_property-task_use_javascript-switch"]').click();
    cy.get('[data-cy="component_property-task_use_javascript-textarea"]').should('be.not.visible');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  javascriptテキストボックス入力確認
  試験確認内容：入力した値が表示されていることを確認
  */
  it("03-01-060:Task コンポーネントの基本機能動作確認-Taskコンポーネント機能確認-プロパティ設定確認-javascriptテキストボックス入力確認-入力した値が表示されていることを確認", ()=>{
    cy.get('[data-cy="component_property-retry-panel_title"]').click();
    cy.get('[data-cy="component_property-task_use_javascript-switch"]').click();
    cy.get('[data-cy="component_property-task_use_javascript-textarea"]').type('testJavaScript');
    cy.get('[data-cy="component_property-task_use_javascript-textarea"]').find('textarea').should('have.value', 'testJavaScript');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  javascriptテキストボックス反映確認
  試験確認内容：入力した値が反映されていることを確認
  */
  it("03-01-061:Task コンポーネントの基本機能動作確認-Taskコンポーネント機能確認-プロパティ設定確認-javascriptテキストボックス反映確認-入力した値が反映されていることを確認", ()=>{
    cy.get('[data-cy="component_property-retry-panel_title"]').click();
    cy.get('[data-cy="component_property-task_use_javascript-switch"]').click();
    cy.get('[data-cy="component_property-task_use_javascript-textarea"]').type('testJavaScript');
    cy.saveProperty();
    cy.closeProperty();
    cy.clickComponentName(TASK_NAME_0);
    cy.get('[data-cy="component_property-task_use_javascript-textarea"]').find('textarea').should('have.value', 'testJavaScript');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  include表示確認
  試験確認内容：includeテキストボックスが表示されていることを確認
  */
  it("03-01-062:Task コンポーネントの基本機能動作確認-Taskコンポーネント機能確認-プロパティ設定確認-include表示確認-includeテキストボックスが表示されていることを確認", ()=>{
    // 新規リモートホスト設定を作成
    cy.visit("/remotehost");
    cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
    cy.enterRequiredRemoteHost('TestLabel', 'TestHostname', 8000, 'testUser');
    cy.get('[data-cy="add_new_host-ok-btn"]').click();
    // ホーム画面からプロジェクトを開き検証を行う
    cy.visit("/");
    cy.openProject();
    cy.clickComponentName(TASK_NAME_0);
    let targetDropBoxCy = '[data-cy="component_property-host-select"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 2, 'TestLabel');
    cy.get('[data-cy="component_property-remote_file-panel_title"]').click();
    cy.get('[data-cy="component_property-include-list_form"]').should('be.visible');
    cy.removeRemoteHost('TestLabel');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  include入力確認
  試験確認内容：入力した値が表示されていることを確認
  */
  it("03-01-063:Task コンポーネントの基本機能動作確認-Taskコンポーネント機能確認-プロパティ設定確認-include入力確認-入力した値が表示されていることを確認", ()=>{
    // 新規リモートホスト設定を作成
    cy.visit("/remotehost");
    cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
    cy.enterRequiredRemoteHost('TestLabel', 'TestHostname', 8000, 'testUser');
    cy.get('[data-cy="add_new_host-ok-btn"]').click();
    // ホーム画面からプロジェクトを開き検証を行う
    cy.visit("/");
    cy.openProject();
    cy.clickComponentName(TASK_NAME_0);
    let targetDropBoxCy = '[data-cy="component_property-host-select"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 2, 'TestLabel');
    cy.get('[data-cy="component_property-remote_file-panel_title"]').click();
    cy.get('[data-cy="component_property-include-list_form"]').find('input').type('includeTest');
    cy.get('[data-cy="component_property-include-list_form"]').find('input').should('have.value', 'includeTest');
    cy.removeRemoteHost('TestLabel');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  include入力反映確認
  試験確認内容：入力した値が反映されていることを確認
  */
  it("03-01-064:Task コンポーネントの基本機能動作確認-Taskコンポーネント機能確認-プロパティ設定確認-include入力反映確認-入力した値が反映されていることを確認", ()=>{
    // 新規リモートホスト設定を作成
    cy.visit("/remotehost");
    cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
    cy.enterRequiredRemoteHost('TestLabel', 'TestHostname', 8000, 'testUser');
    cy.get('[data-cy="add_new_host-ok-btn"]').click();
    // ホーム画面からプロジェクトを開き検証を行う
    cy.visit("/");
    cy.openProject();
    cy.clickComponentName(TASK_NAME_0);
    let targetDropBoxCy = '[data-cy="component_property-host-select"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 2, 'TestLabel');
    cy.get('[data-cy="component_property-remote_file-panel_title"]').click();
    cy.get('[data-cy="component_property-include-list_form"]').find('input').type('includeTest{enter}');
    cy.saveProperty();
    cy.closeProperty();
    cy.clickComponentName(TASK_NAME_0);
    cy.get('[data-cy="component_property-remote_file-panel_title"]').click();
    cy.get('[data-cy="component_property-include-list_form"]').contains('includeTest').should('exist');
    cy.removeRemoteHost('TestLabel');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  exclude表示確認
  試験確認内容：includeテキストボックスが表示されていることを確認
  */
  it("03-01-065:Task コンポーネントの基本機能動作確認-Taskコンポーネント機能確認-プロパティ設定確認-exclude表示確認-excludeテキストボックスが表示されていることを確認", ()=>{
    // 新規リモートホスト設定を作成
    cy.visit("/remotehost");
    cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
    cy.enterRequiredRemoteHost('TestLabel', 'TestHostname', 8000, 'testUser');
    cy.get('[data-cy="add_new_host-ok-btn"]').click();
    // ホーム画面からプロジェクトを開き検証を行う
    cy.visit("/");
    cy.openProject();
    cy.clickComponentName(TASK_NAME_0);
    let targetDropBoxCy = '[data-cy="component_property-host-select"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 2, 'TestLabel');
    cy.get('[data-cy="component_property-remote_file-panel_title"]').click();
    cy.get('[data-cy="component_property-exclude-list_form"]').should('be.not.visible');
    cy.removeRemoteHost('TestLabel');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  exclude入力確認
  試験確認内容：入力した値が表示されていることを確認
  */
  it("03-01-066:Task コンポーネントの基本機能動作確認-Taskコンポーネント機能確認-プロパティ設定確認-exclude入力確認-入力した値が表示されていることを確認", ()=>{
    // 新規リモートホスト設定を作成
    cy.visit("/remotehost");
    cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
    cy.enterRequiredRemoteHost('TestLabel', 'TestHostname', 8000, 'testUser');
    cy.get('[data-cy="add_new_host-ok-btn"]').click();
    // ホーム画面からプロジェクトを開き検証を行う
    cy.visit("/");
    cy.openProject();
    cy.clickComponentName(TASK_NAME_0);
    let targetDropBoxCy = '[data-cy="component_property-host-select"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 2, 'TestLabel');
    cy.get('[data-cy="component_property-remote_file-panel_title"]').click();
    cy.get('[data-cy="component_property-exclude-list_form"]').find('input').type('excludeTest');
    cy.get('[data-cy="component_property-exclude-list_form"]').find('input').should('have.value', 'excludeTest');
    cy.removeRemoteHost('TestLabel');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  exclude入力反映確認
  試験確認内容：入力した値が反映されていることを確認
  */
  it("03-01-067:Task コンポーネントの基本機能動作確認-Taskコンポーネント機能確認-プロパティ設定確認-exclude入力反映確認-入力した値が反映されていることを確認", ()=>{
    // 新規リモートホスト設定を作成
    cy.visit("/remotehost");
    cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
    cy.enterRequiredRemoteHost('TestLabel', 'TestHostname', 8000, 'testUser');
    cy.get('[data-cy="add_new_host-ok-btn"]').click();
    // ホーム画面からプロジェクトを開き検証を行う
    cy.visit("/");
    cy.openProject();
    cy.clickComponentName(TASK_NAME_0);
    let targetDropBoxCy = '[data-cy="component_property-host-select"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 2, 'TestLabel');
    cy.get('[data-cy="component_property-remote_file-panel_title"]').click();
    cy.get('[data-cy="component_property-exclude-list_form"]').find('input').type('excludeTest{enter}');
    cy.saveProperty();
    cy.closeProperty();
    cy.clickComponentName(TASK_NAME_0);
    cy.get('[data-cy="component_property-remote_file-panel_title"]').click();
    cy.get('[data-cy="component_property-exclude-list_form"]').contains('excludeTest').should('exist');
    cy.removeRemoteHost('TestLabel');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  clean up flag表示確認
  試験確認内容：各ラジオボタンが表示されていることを確認
  */
  it("03-01-068:Task コンポーネントの基本機能動作確認-Taskコンポーネント機能確認-プロパティ設定確認-clean up flag表示確認-各ラジオボタンが表示されていることを確認", ()=>{
    // 新規リモートホスト設定を作成
    cy.visit("/remotehost");
    cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
    cy.enterRequiredRemoteHost('TestLabel', 'TestHostname', 8000, 'testUser');
    cy.get('[data-cy="add_new_host-ok-btn"]').click();
    // ホーム画面からプロジェクトを開き検証を行う
    cy.visit("/");
    cy.openProject();
    cy.clickComponentName(TASK_NAME_0);
    let targetDropBoxCy = '[data-cy="component_property-host-select"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 2, 'TestLabel');
    cy.get('[data-cy="component_property-remote_file-panel_title"]').click();
    cy.get('[data-cy="component_property-remove-radio"]').find('input').should('exist');
    cy.get('[data-cy="component_property-keep-radio"]').find('input').should('exist');
    cy.get('[data-cy="component_property-same-radio"]').find('input').should('exist');
    cy.removeRemoteHost('TestLabel');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  clean up flag入力確認
  試験確認内容：各ラジオボタンが選択できることを確認
  */
  it("03-01-069:Task コンポーネントの基本機能動作確認-Taskコンポーネント機能確認-プロパティ設定確認-clean up flag入力確認-各ラジオボタンが選択できることを確認", ()=>{
    // 新規リモートホスト設定を作成
    cy.visit("/remotehost");
    cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
    cy.enterRequiredRemoteHost('TestLabel', 'TestHostname', 8000, 'testUser');
    cy.get('[data-cy="add_new_host-ok-btn"]').click();
    // ホーム画面からプロジェクトを開き検証を行う
    cy.visit("/");
    cy.openProject();
    cy.clickComponentName(TASK_NAME_0);
    let targetDropBoxCy = '[data-cy="component_property-host-select"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 2, 'TestLabel');
    cy.get('[data-cy="component_property-remote_file-panel_title"]').click();
    cy.get('[data-cy="component_property-remove-radio"]').find('input').click();
    cy.get('[data-cy="component_property-remove-radio"]').find('input').should('be.checked');
    cy.get('[data-cy="component_property-keep-radio"]').find('input').click();
    cy.get('[data-cy="component_property-keep-radio"]').find('input').should('be.checked');
    cy.get('[data-cy="component_property-same-radio"]').find('input').click();
    cy.get('[data-cy="component_property-same-radio"]').find('input').should('be.checked');
    cy.removeRemoteHost('TestLabel');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  clean up flag入力反映確認（remove files）
  試験確認内容：remove filesが設定されていることを確認
  */
  it("03-01-070:Task コンポーネントの基本機能動作確認-Taskコンポーネント機能確認-プロパティ設定確認-clean up flag入力反映確認（remove files）-remove filesが設定されていることを確認", ()=>{
    // 新規リモートホスト設定を作成
    cy.visit("/remotehost");
    cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
    cy.enterRequiredRemoteHost('TestLabel', 'TestHostname', 8000, 'testUser');
    cy.get('[data-cy="add_new_host-ok-btn"]').click();
    // ホーム画面からプロジェクトを開き検証を行う
    cy.visit("/");
    cy.openProject();
    cy.clickComponentName(TASK_NAME_0);
    let targetDropBoxCy = '[data-cy="component_property-host-select"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 2, 'TestLabel');
    cy.get('[data-cy="component_property-remote_file-panel_title"]').click();
    cy.get('[data-cy="component_property-remove-radio"]').find('input').click();
    cy.saveProperty();
    cy.closeProperty();
    cy.clickComponentName(TASK_NAME_0);
    cy.get('[data-cy="component_property-remote_file-panel_title"]').click();
    cy.get('[data-cy="component_property-remove-radio"]').find('input').should('be.checked');
    cy.removeRemoteHost('TestLabel');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  clean up flag入力反映確認（keep files）
  試験確認内容：keep filesが設定されていることを確認
  */
  it("03-01-071:Task コンポーネントの基本機能動作確認-Taskコンポーネント機能確認-プロパティ設定確認-clean up flag入力反映確認（keep files）-keep filesが設定されていることを確認", ()=>{
    // 新規リモートホスト設定を作成
    cy.visit("/remotehost");
    cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
    cy.enterRequiredRemoteHost('TestLabel', 'TestHostname', 8000, 'testUser');
    cy.get('[data-cy="add_new_host-ok-btn"]').click();
    // ホーム画面からプロジェクトを開き検証を行う
    cy.visit("/");
    cy.openProject();
    cy.clickComponentName(TASK_NAME_0);
    let targetDropBoxCy = '[data-cy="component_property-host-select"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 2, 'TestLabel');
    cy.get('[data-cy="component_property-remote_file-panel_title"]').click();
    cy.get('[data-cy="component_property-keep-radio"]').find('input').click();
    cy.saveProperty();
    cy.closeProperty();
    cy.clickComponentName(TASK_NAME_0);
    cy.get('[data-cy="component_property-remote_file-panel_title"]').click();
    cy.get('[data-cy="component_property-keep-radio"]').find('input').should('be.checked');
    cy.removeRemoteHost('TestLabel');
  });

  /** 
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  clean up flag入力反映確認（same as parent）
  試験確認内容：same as parentが設定されていることを確認
  */
  it("03-01-072:Task コンポーネントの基本機能動作確認-Taskコンポーネント機能確認-プロパティ設定確認-clean up flag入力反映確認（same as parent）-same as parentが設定されていることを確認", ()=>{
    // 新規リモートホスト設定を作成
    cy.visit("/remotehost");
    cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
    cy.enterRequiredRemoteHost('TestLabel', 'TestHostname', 8000, 'testUser');
    cy.get('[data-cy="add_new_host-ok-btn"]').click();
    // ホーム画面からプロジェクトを開き検証を行う
    cy.visit("/");
    cy.openProject();
    cy.clickComponentName(TASK_NAME_0);
    let targetDropBoxCy = '[data-cy="component_property-host-select"]';
    cy.selectValueFromDropdownList(targetDropBoxCy, 2, 'TestLabel');
    cy.get('[data-cy="component_property-remote_file-panel_title"]').click();
    cy.get('[data-cy="component_property-same-radio"]').find('input').click();
    cy.saveProperty();
    cy.closeProperty();
    cy.clickComponentName(TASK_NAME_0);
    cy.get('[data-cy="component_property-remote_file-panel_title"]').click();
    cy.get('[data-cy="component_property-same-radio"]').find('input').should('be.checked');
    cy.removeRemoteHost('TestLabel');
  });
})