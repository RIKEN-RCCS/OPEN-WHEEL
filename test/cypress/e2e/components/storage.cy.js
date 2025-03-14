describe("04:コンポーネントの基本機能動作確認", () => {
    const wheelPath = Cypress.env("WHEEL_PATH")
    const PROJECT_NAME = `WHEEL_TEST_${Date.now().toString()}`
    const PROJECT_DESCRIPTION = "TestDescription"
    const TYPE_INPUT = "input"
    const TYPE_OUTPUT = "output"
    const TYPE_DIR = "dir"
    const TYPE_FILE = "file"
    const DEF_COMPONENT_STORAGE = "storage"
    const STORAGE_NAME_0 = "storage0"
    const STORAGE_NAME_1 = "storage1"
    const TAG_TYPE_INPUT = "input"
    const TAG_TYPE_TEXT_AREA = "textarea"

    beforeEach(() => {
        cy.createProject(PROJECT_NAME, PROJECT_DESCRIPTION);
        cy.projectOpen(PROJECT_NAME);
        cy.viewport("macbook-16");
    })

    afterEach(() => {
        cy.removeAllProjects();
    })

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
        cy.confirmInputValueReflection(INPUT_OBJ_CY, '-Test_Task', TAG_TYPE_INPUT, '-Test_Task');
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
        cy.confirmInputValueNotReflection(INPUT_OBJ_CY, 'Test*Task', TAG_TYPE_INPUT, STORAGE_NAME_0);
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
        cy.confirmInputValueReflection(INPUT_OBJ_CY, 'descriptionTest', TAG_TYPE_TEXT_AREA, STORAGE_NAME_0);
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
    it("04-01-320:コンポーネントの基本機能動作確認-Storageコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-host表示確認-hostセレクトボックスが表示されていることを確認", () => {
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
    it("04-01-321:コンポーネントの基本機能動作確認-Storageコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-host選択確認（localhost以外を選択）-hostセレクトボックスで選択した値が表示されていることを確認", () => {
        cy.createComponent(DEF_COMPONENT_STORAGE, STORAGE_NAME_0, 300, 500);
        // 新規リモートホスト設定を作成
        cy.visit("/remotehost");
        cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
        cy.enterRequiredRemoteHost('TestLabel', 'TestHostname', 8000, 'testUser');
        cy.get('[data-cy="add_new_host-ok-btn"]').click();
        // ホーム画面からプロジェクトを開き検証を行う
        cy.visit("/");
        cy.projectOpen(PROJECT_NAME);
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
    it("04-01-322:コンポーネントの基本機能動作確認-Storageコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-hostファイル選択表示確認-hostセレクトボックスで選択したファイルが表示されていることを確認", () => {
        cy.createComponent(DEF_COMPONENT_STORAGE, STORAGE_NAME_0, 300, 500);
        // 新規リモートホスト設定を作成
        cy.visit("/remotehost");
        cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
        cy.enterRequiredRemoteHost('TestLabel', 'TestHostname', 8000, 'testUser');
        cy.get('[data-cy="add_new_host-ok-btn"]').click();
        // ホーム画面からプロジェクトを開き検証を行う
        cy.visit("/");
        cy.projectOpen(PROJECT_NAME);
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
    it("04-01-323:コンポーネントの基本機能動作確認-Storageコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-directory path表示確認-directory pathテキストボックスが表示されていることを確認", () => {
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
    it("04-01-324:コンポーネントの基本機能動作確認-Storageコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-directory path入力確認-directory pathが入力できることを確認", () => {
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
    it("04-01-325:コンポーネントの基本機能動作確認-Storageコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-directory path入力反映確認-directory pathが反映されることを確認", () => {
        cy.createComponent(DEF_COMPONENT_STORAGE, STORAGE_NAME_0, 300, 500);
        cy.get('[data-cy="component_property-directory_path-text_field"]').type('test/test');
        cy.closeProperty();
        cy.clickComponentName(STORAGE_NAME_0);
        cy.get('[data-cy="component_property-directory_path-text_field"]').find('input').should('have.value', 'test/test');
    });
})


