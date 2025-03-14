describe("04:コンポーネントの基本機能動作確認", () => {
    const PROJECT_NAME = `WHEEL_TEST_${Date.now().toString()}`
    const PROJECT_DESCRIPTION = "TestDescription"
    const TYPE_INPUT = "input"
    const TYPE_OUTPUT = "output"
    const TYPE_DIR = "dir"
    const TYPE_FILE = "file"
    const DEF_COMPONENT_STEPJOB = "stepjob"
    const DEF_COMPONENT_STEPJOB_TASK = "stepjobTask"
    const STEPJOB_NAME_0 = "stepjob0"
    const STEPJOB_TASK_NAME_0 = "sjTask0"
    const STEPJOB_TASK_NAME_1 = "sjTask1"
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
    StepjobTaskコンポーネント共通機能確認
    試験確認内容：プロパティが表示されることを確認
    */
    it("04-01-477:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-プロパティが表示されることを確認", () => {
        cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
        cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
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
        const INPUT_OBJ_CY = '[data-cy="component_property-name-text_field"]';
        cy.get(INPUT_OBJ_CY).find('input').clear();
        cy.get(INPUT_OBJ_CY).type('-Test_Task');
        cy.closeProperty();
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
        const INPUT_OBJ_CY = '[data-cy="component_property-name-text_field"]';
        cy.get(INPUT_OBJ_CY).find('input').clear();
        cy.get(INPUT_OBJ_CY).type('Test*Task');
        cy.closeProperty();
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
        const INPUT_OBJ_CY = '[data-cy="component_property-description-textarea"]';
        cy.confirmInputValueReflection(INPUT_OBJ_CY, 'descriptionTest', TAG_TYPE_TEXT_AREA, STEPJOB_TASK_NAME_0);
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
    it("04-01-507:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-script表示確認-scriptセレクトボックスが表示されていることを確認", () => {
        cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
        cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
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
    it("04-01-508:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-scriptファイル選択表示確認-scriptセレクトボックスで選択したファイルが表示されていることを確認", () => {
        cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
        cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
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
    it("04-01-509:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-scriptファイル選択反映確認-scriptセレクトボックスで選択したファイルが反映されていることを確認", () => {
        cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
        cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
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
    it("04-01-510:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-script表示確認-scriptセレクトボックスが表示されていることを確認", () => {
        cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
        cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
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
    it("04-01-511:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-script入力反映確認-scriptセレクトボックスが入力されていることを確認", () => {
        cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
        cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
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
    it("04-01-512:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-dependencyForm表示確認-dependencyFormテキストボックスが表示されていることを確認", () => {
        cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
        cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
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
    it("04-01-513:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-dependencyForm入力確認-dependencyFormテキストボックスが入力できることを確認", () => {
        cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
        cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
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
    it("04-01-514:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-dependencyForm入力反映確認-dependencyFormテキストボックスに入力した値が反映されることを確認", () => {
        cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
        cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
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
    it("04-01-515:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-include表示確認-includeテキストボックスが表示されていることを確認", () => {
        cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
        cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
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
    it("04-01-516:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-include入力確認-入力した値が表示されていることを確認", () => {
        cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
        cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
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
    it("04-01-517:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-include入力反映確認-入力した値が反映されていることを確認", () => {
        cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
        cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
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
    it("04-01-518:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-exclude表示確認-excludeテキストボックスが表示されていることを確認", () => {
        cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
        cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
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
    it("04-01-519:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-exclude入力確認-入力した値が表示されていることを確認", () => {
        cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
        cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
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
    it("04-01-520:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-exclude入力反映確認-入力した値が反映されていることを確認", () => {
        cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
        cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
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
    it("04-01-521:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-clean up flag表示確認-各ラジオボタンが表示されていることを確認", () => {
        cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
        cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
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
    it("04-01-522:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-clean up flag入力確認-各ラジオボタンが選択できることを確認", () => {
        cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
        cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
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
    it("04-01-523:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-clean up flag入力反映確認（remove files）-remove filesが設定されていることを確認", () => {
        cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
        cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
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
    it("04-01-524:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-clean up flag入力反映確認（keep files）-keep filesが設定されていることを確認", () => {
        cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
        cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
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
    it("04-01-525:コンポーネントの基本機能動作確認-StepjobTaskコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-clean up flag入力反映確認（same as parent）-same as parentが設定されていることを確認", () => {
        cy.createStepjobComponentAndDoubleClick(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 500);
        cy.createComponent(DEF_COMPONENT_STEPJOB_TASK, STEPJOB_TASK_NAME_0, 300, 500);
        cy.get('[data-cy="component_property-remote_file-panel_title"]').click();
        cy.get('[data-cy="component_property-same-radio"]').find('input').click();
        cy.closeProperty();
        cy.clickComponentName(STEPJOB_TASK_NAME_0);
        cy.get('[data-cy="component_property-remote_file-panel_title"]').click();
        cy.get('[data-cy="component_property-same-radio"]').find('input').should('be.checked');
    });
})


