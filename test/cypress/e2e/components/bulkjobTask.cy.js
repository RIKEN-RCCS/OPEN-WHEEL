describe("components", ()=>{
  describe("BulkjobTask", ()=>{ //TODO:テスト実行でクラッシュする場合があるため一時的にskip.修正後復帰すること.
    const TYPE_INPUT = "input";
    const TYPE_OUTPUT = "output";
    const TYPE_DIR = "dir";
    const TYPE_FILE = "file";
    const DEF_COMPONENT_BJ_TASK = "bulkjobTask";
    const BJ_TASK_NAME_0 = "bjTask0";
    const BJ_TASK_NAME_1 = "bjTask1";
    const TAG_TYPE_INPUT = "input";
    const TAG_TYPE_TEXT_AREA = "textarea";
    const TEST_LABEL = "componentTestLabel";

    before(()=>{
      return cy.removeAllProjects();
    });

    beforeEach(()=>{
      cy.viewport("macbook-16");
      return cy.createAndOpenProject();
    });

    after(()=>{
      return cy.removeAllProjects();
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    試験確認内容：プロパティが表示されることを確認
     */
    it("プロパティが表示されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      const DATA_CY_STR = "[data-cy=\"component_property-property-navigation_drawer\"]";
      cy.confirmDisplayInProperty(DATA_CY_STR, true);
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    試験確認内容：name入力テキストエリアが表示されていることを確認
     */
    it("name入力テキストエリアが表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      const DATA_CY_STR = "[data-cy=\"component_property-name-text_field\"]";
      cy.confirmDisplayInProperty(DATA_CY_STR, true);
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    name入力
    試験確認内容：nameが入力できることを確認
     */
    it("name入力-nameが入力できることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      const INPUT_OBJ_CY = "[data-cy=\"component_property-name-text_field\"]";
      cy.confirmInputValueReflection(INPUT_OBJ_CY, "-Test_Task", TAG_TYPE_INPUT, "-Test_Task");
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    name入力（使用可能文字確認）
    試験確認内容：nameが入力できないことを確認
     */
    it("name入力（使用可能文字確認）-nameが入力できないことを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      const INPUT_OBJ_CY = "[data-cy=\"component_property-name-text_field\"]";
      cy.confirmInputValueNotReflection(INPUT_OBJ_CY, "Test*Task", TAG_TYPE_INPUT, BJ_TASK_NAME_0);
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    試験確認内容：説明入力テキストエリアが表示されていることを確認
     */
    it("description入力テキストエリアが表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      const DATA_CY_STR = "[data-cy=\"component_property-description-textarea\"]";
      cy.confirmDisplayInProperty(DATA_CY_STR, true);
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    description入力
    試験確認内容：descriptionが入力できることを確認
     */
    it("description入力-descriptionが入力できることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      const INPUT_OBJ_CY = "[data-cy=\"component_property-description-textarea\"]";
      cy.confirmInputValueReflection(INPUT_OBJ_CY, "descriptionTest", TAG_TYPE_TEXT_AREA, BJ_TASK_NAME_0);
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    input files表示
    試験確認内容：input files入力テキストエリアが表示されていることを確認
     */
    it("input files表示-input files入力テキストエリアが表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      const DATA_CY_STR = "[data-cy=\"component_property-input_files-list_form\"]";
      const CLICK_AREA_CY = "[data-cy=\"component_property-in_out_files-panel_title\"]";
      cy.confirmDisplayInPropertyByDetailsArea(DATA_CY_STR, CLICK_AREA_CY, null);
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    input files入力
    試験確認内容：input filesが入力できることを確認
     */
    it("input files入力-input filesが入力できることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      cy.enterInputOrOutputFile(TYPE_INPUT, "testInputFile", true, false);
      cy.get("[data-cy=\"component_property-input_files-list_form\"]").find("input")
        .should("have.value", "testInputFile");
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    input files反映確認
    試験確認内容：input filesが反映されることを確認
     */
    it("input files反映確認-input filesが反映されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      cy.enterInputOrOutputFile(TYPE_INPUT, "testInputFile", true, true);
      cy.get("[data-cy=\"graph-component-row\"]").contains("testInputFile")
        .should("exist");
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    output files表示
    試験確認内容：output files入力テキストエリアが表示されていることを確認
     */
    it("output files表示-output files入力テキストエリアが表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-in_out_files-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-output_files-list_form\"]").should("exist");
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    output files入力
    試験確認内容：output filesが入力できることを確認
     */
    it("output files入力-output filesが入力できることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      cy.enterInputOrOutputFile(TYPE_OUTPUT, "testOutputFile", true, false);
      cy.get("[data-cy=\"component_property-output_files-list_form\"]").find("input")
        .should("have.value", "testOutputFile");
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    output files反映確認
    試験確認内容：output filesが反映されることを確認
     */
    it("output files反映確認-output filesが反映されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      cy.enterInputOrOutputFile(TYPE_OUTPUT, "testOutputFile", true, true);
      cy.get("[data-cy=\"graph-component-row\"]").contains("testOutputFile")
        .should("exist");
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    構成要素の機能確認
    closeボタン押下
    試験確認内容：プロパティが表示されていないことを確認
     */
    it("構成要素の機能確認-closeボタン押下-プロパティが表示されていないことを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      cy.closeProperty();
      cy.get("[data-cy=\"component_property-property-navigation_drawer\"]").should("not.exist");
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    ファイル転送設定の各パターンの確認
    接続確認
    試験確認内容：コンポーネントが接続されていることを確認
     */
    it("ファイル転送設定の各パターンの確認-接続確認-コンポーネントが接続されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      cy.enterInputOrOutputFile(TYPE_OUTPUT, "testOutputFile", true, true);
      cy.get("[data-cy=\"component_property-close-btn\"]").click(); //Close first component property panel
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_1, 501, 600);
      cy.get("[data-cy=\"component_property-close-btn\"]").click(); //Close second component property panel
      cy.connectComponentMultiple(BJ_TASK_NAME_0, BJ_TASK_NAME_1); //コンポーネント同士を接続
      cy.checkConnectionLine(BJ_TASK_NAME_0, BJ_TASK_NAME_1); //作成したコンポーネントの座標を取得して接続線の座標と比較
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    転送対象ファイル・フォルダの設定
    削除ボタン表示確認（input file）
    試験確認内容：削除ボタンが表示されることを確認
     */
    it("転送対象ファイル・フォルダの設定-削除ボタン表示確認（input file）-削除ボタンが表示されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      cy.enterInputOrOutputFile(TYPE_INPUT, "testInputFile", true, true);
      cy.get("[data-cy=\"action_row-delete-btn\"]").should("be.visible");
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    転送対象ファイル・フォルダの設定
    削除ボタン表示確認（output file）
    試験確認内容：削除ボタンが表示されることを確認
     */
    it("転送対象ファイル・フォルダの設定-削除ボタン表示確認（output file）-削除ボタンが表示されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      cy.enterInputOrOutputFile(TYPE_OUTPUT, "testOutputFile", true, true);
      cy.get("[data-cy=\"action_row-delete-btn\"]").should("be.visible");
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    転送対象ファイル・フォルダの設定
    削除反映確認（input file）
    試験確認内容：input fileが削除されていることを確認
     */
    it("転送対象ファイル・フォルダの設定-削除反映確認（input file）-input fileが削除されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      cy.enterInputOrOutputFile(TYPE_INPUT, "testInputFile", true, true);
      cy.get("[data-cy=\"action_row-delete-btn\"]").click();
      cy.get("[data-cy=\"graph-component-row\"]").contains("testInputFile")
        .should("not.exist");
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    転送対象ファイル・フォルダの設定
    削除反映確認（output file）
    試験確認内容：output fileが削除されていることを確認
     */
    it("転送対象ファイル・フォルダの設定-削除反映確認（output file）-output fileが削除されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      cy.enterInputOrOutputFile(TYPE_OUTPUT, "testOutputFile", true, true);
      cy.get("[data-cy=\"action_row-delete-btn\"]").click();
      cy.get("[data-cy=\"graph-component-row\"]").contains("testOutputFile")
        .should("not.exist");
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    ファイル操作エリア
    ディレクトリ単体表示
    試験確認内容：ディレクトリが単体表示されることを確認
     */
    it("ファイル操作エリア-ディレクトリ単体表示-ディレクトリが単体表示されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      cy.createDirOrFile(TYPE_DIR, "test-a", true);
      cy.createDirOrFile(TYPE_DIR, "test-b", false);
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-a")
        .should("exist");
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-b")
        .should("exist");
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    ファイル操作エリア
    ディレクトリ複数表示（リロード前）
    試験確認内容：ディレクトリが単体表示されることを確認
     */
    it("ファイル操作エリア-ディレクトリ複数表示（リロード前）-ディレクトリが単体表示されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      cy.createDirOrFile(TYPE_DIR, "test1", true);
      cy.createDirOrFile(TYPE_DIR, "test2", false);
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test1")
        .should("exist");
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test2")
        .should("exist");
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    ファイル操作エリア
    ディレクトリ複数表示（リロード後）
    試験確認内容：ディレクトリが複数表示されることを確認
     */
    it("ファイル操作エリア-ディレクトリ複数表示（リロード後）-ディレクトリが複数表示されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      cy.createDirOrFile(TYPE_DIR, "test1", true);
      cy.createDirOrFile(TYPE_DIR, "test2", false);
      cy.closeProperty();
      cy.clickComponentName(BJ_TASK_NAME_0);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test*")
        .should("exist");
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    ファイル操作エリア
    ファイル単体表示
    試験確認内容：ファイルが単体表示されることを確認
     */
    it("ファイル操作エリア-ファイル単体表示-ファイルが単体表示されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      cy.createDirOrFile(TYPE_FILE, "test-a", true);
      cy.createDirOrFile(TYPE_FILE, "test-b", false);
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-a")
        .should("exist");
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-b")
        .should("exist");
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    ファイル操作エリア
    ファイル複数表示（リロード前）
    試験確認内容：ファイルが単体表示されることを確認
     */
    it("ファイル操作エリア-ファイル複数表示（リロード前）-ファイルが単体表示されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      cy.createDirOrFile(TYPE_FILE, "test1", true);
      cy.createDirOrFile(TYPE_FILE, "test2", false);
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test1")
        .should("exist");
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test2")
        .should("exist");
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    ファイル操作エリア
    ファイル複数表示（リロード後）
    試験確認内容：ファイルが複数表示されることを確認
     */
    it("ファイル操作エリア-ファイル複数表示（リロード後）-ファイルが複数表示されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      cy.createDirOrFile(TYPE_FILE, "test1", true);
      cy.createDirOrFile(TYPE_FILE, "test2", false);
      cy.closeProperty();
      cy.clickComponentName(BJ_TASK_NAME_0);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test*")
        .should("exist");
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    ファイル操作エリア
    ディレクトリ内ディレクトリ表示
    試験確認内容：ディレクトリ内にディレクトリが作成されることを確認
     */
    it("ファイル操作エリア-ディレクトリ内ディレクトリ表示-ディレクトリ内にディレクトリが作成されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
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
    BulkjobTaskコンポーネント共通機能確認
    ファイル操作エリア
    ディレクトリ内ファイル表示
    試験確認内容：ディレクトリ内にファイルが作成されることを確認
     */
    it("ファイル操作エリア-ディレクトリ内ファイル表示-ディレクトリ内にファイルが作成されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      cy.createDirOrFile(TYPE_DIR, "test-a", true);
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-a")
        .click();
      cy.createDirOrFile(TYPE_FILE, "test.txt", false);
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test.txt")
        .should("exist");
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    各コンポーネントの追加/削除確認
    該当コンポーネント削除確認
    試験確認内容：コンポーネントが削除されていることを確認
     */
    it("各コンポーネントの追加/削除確認-該当コンポーネント削除確認-コンポーネントが削除されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      cy.deleteComponent(BJ_TASK_NAME_0);
      cy.get("[data-cy=\"graph-component-row\"]").contains(BJ_TASK_NAME_0)
        .should("not.exist");
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    各コンポーネント特有のプロパティ確認
    host表示確認
    試験確認内容：hostセレクトボックスが表示されていることを確認
     */
    it("各コンポーネント特有のプロパティ確認-host表示確認-hostセレクトボックスが表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      const DATA_CY_STR = "[data-cy=\"component_property-host-select\"]";
      cy.confirmDisplayInProperty(DATA_CY_STR, true);
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    各コンポーネント特有のプロパティ確認
    host選択確認（localhost以外を選択）
    試験確認内容：hostセレクトボックスで選択した値が表示されていることを確認
     */
    it("各コンポーネント特有のプロパティ確認-host選択確認（localhost以外を選択）-hostセレクトボックスで選択した値が表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      cy.selectValueFromDropdownList("[data-cy=\"component_property-host-select\"]", 0, TEST_LABEL);
      cy.get("[data-cy=\"component_property-host-select\"]").should("exist");
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    各コンポーネント特有のプロパティ確認
    host選択確認（localhost以外を選択）
    試験確認内容：hostセレクトボックスで選択した値が反映されていることを確認
     */
    it("各コンポーネント特有のプロパティ確認-hostファイル選択表示確認-hostセレクトボックスで選択したファイルが表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      cy.selectValueFromDropdownList("[data-cy=\"component_property-host-select\"]", 2, TEST_LABEL);
      cy.saveProperty();
      cy.get("[data-cy=\"component_property-host-select\"]").find("input")
        .should("have.value", TEST_LABEL);
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    各コンポーネント特有のプロパティ確認
    use job schedulerスイッチボタン表示確認
    試験確認内容：use job schedulerスイッチボタンが表示されていることを確認
     */
    it("各コンポーネント特有のプロパティ確認use job schedulerスイッチボタン表示確認-use job schedulerスイッチボタンが表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      const DATA_CY_STR = "[data-cy=\"component_property-job_scheduler-switch\"]";
      cy.confirmDisplayInProperty(DATA_CY_STR, true);
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    各コンポーネント特有のプロパティ確認
    queue表示確認（有効）
    試験確認内容：queueセレクトボックスが有効となっていることを確認
     */
    it("各コンポーネント特有のプロパティ確認-queue表示確認（有効）-queueセレクトボックスが有効となっていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      const targetDropBoxCy = "[data-cy=\"component_property-host-select\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 2, TEST_LABEL);
      cy.get(targetDropBoxCy).find("input")
        .should("have.value", TEST_LABEL);
      //Check if job scheduler is already enabled (it should be for TestLabelBulk)
      cy.get("[data-cy=\"component_property-job_scheduler-switch\"]").find("input")
        .then(($switch)=>{
          if (!$switch.is(":checked")) {
            cy.wrap($switch).click();
          }
        });
      cy.get("[data-cy=\"component_property-queue-select\"]").find("input")
        .should("not.be.disabled");
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    各コンポーネント特有のプロパティ確認
    queue選択確認
    試験確認内容：queueセレクトボックスに選択した値が表示されていることを確認
     */
    it("各コンポーネント特有のプロパティ確認-queue選択確認-queueセレクトボックスに選択した値が表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      let targetDropBoxCy = "[data-cy=\"component_property-host-select\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 2, TEST_LABEL);
      cy.get(targetDropBoxCy).find("input")
        .should("have.value", TEST_LABEL);
      //Check if job scheduler is already enabled
      cy.get("[data-cy=\"component_property-job_scheduler-switch\"]").find("input")
        .then(($switch)=>{
          if (!$switch.is(":checked")) {
            cy.wrap($switch).click();
          }
        });
      cy.get("[data-cy=\"component_property-queue-select\"]").find("input")
        .should("not.be.disabled");
      targetDropBoxCy = "[data-cy=\"component_property-queue-select\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 2, "testQueues");
      cy.get("[data-cy=\"component_property-queue-select\"]").find("input")
        .should("have.value", "testQueues");
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    各コンポーネント特有のプロパティ確認
    queue選択反映確認
    試験確認内容：queueセレクトボックスに選択した値が反映されていることを確認
     */
    it("各コンポーネント特有のプロパティ確認-queue選択反映確認-queueセレクトボックスに選択した値が反映されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      let targetDropBoxCy = "[data-cy=\"component_property-host-select\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 2, TEST_LABEL);
      cy.get(targetDropBoxCy).find("input")
        .should("have.value", TEST_LABEL);
      //Check if job scheduler is already enabled
      cy.get("[data-cy=\"component_property-job_scheduler-switch\"]").find("input")
        .then(($switch)=>{
          if (!$switch.is(":checked")) {
            cy.wrap($switch).click();
          }
        });
      targetDropBoxCy = "[data-cy=\"component_property-queue-select\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 2, "testQueues");
      cy.closeProperty();
      cy.clickComponentName(BJ_TASK_NAME_0);
      cy.get("[data-cy=\"component_property-queue-select\"]").find("input")
        .should("have.value", "testQueues");
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    各コンポーネント特有のプロパティ確認
    submit command表示確認（有効）
    試験確認内容：submit commandテキストボックスが有効となっていることを確認
     */
    it("各コンポーネント特有のプロパティ確認-プロパティ設定確認-submit command表示確認（有効）-submit commandテキストボックスが有効となっていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-submit_command-text_field\"]").find("input")
        .should("be.not.disabled");
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    各コンポーネント特有のプロパティ確認
    submit command反映確認
    試験確認内容：リモートホストのジョブ投入コマンドが表示されていることを確認
     */
    it("各コンポーネント特有のプロパティ確認-submit command反映確認-リモートホストのジョブ投入コマンドが表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      cy.clickComponentName(BJ_TASK_NAME_0);
      const targetDropBoxCy = "[data-cy=\"component_property-host-select\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 2, TEST_LABEL);
      cy.closeProperty();
      cy.clickComponentName(BJ_TASK_NAME_0);
      cy.get("[data-cy=\"component_property-submit_command-text_field\"]").find("input")
        .should("have.value", "qsub");
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    各コンポーネント特有のプロパティ確認
    submit option表示確認（有効）
    試験確認内容：submit optionテキストボックスが有効となっていることを確認
     */
    it("各コンポーネント特有のプロパティ確認-submit option表示確認（有効）-submit optionテキストボックスが有効となっていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-submit_option-text_field\"]").find("input")
        .should("be.not.disabled");
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    各コンポーネント特有のプロパティ確認
    submit option反映確認
    試験確認内容：submit optionテキストボックスに入力した値が設定されていることを確認
     */
    it("各コンポーネント特有のプロパティ確認-submit option反映確認-submit optionテキストボックスに入力した値が設定されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-submit_option-text_field\"]").find("input")
        .type("testSubmitCommand");
      cy.closeProperty();
      cy.clickComponentName(BJ_TASK_NAME_0);
      cy.get("[data-cy=\"component_property-submit_option-text_field\"]").find("input")
        .should("have.value", "testSubmitCommand");
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    各コンポーネント特有のプロパティ確認
    script表示確認
    試験確認内容：scriptセレクトボックスが表示されていることを確認
     */
    it("各コンポーネント特有のプロパティ確認-script表示確認-scriptセレクトボックスが表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      const DATA_CY_STR = "[data-cy=\"component_property-script-autocomplete\"]";
      cy.confirmDisplayInProperty(DATA_CY_STR, true);
    });

    /**
    BulkjobTask コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント機能確認
    プロパティ設定確認
    checker script非表示確認
    試験確認内容：checker scriptセレクトボックスが表示されていないことを確認
     */
    it("プロパティ設定確認-checker script非表示確認-checker scriptセレクトボックスが表示されていないことを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      const DATA_CY_STR = "[data-cy=\"component_property-checker-autocomplete\"]";
      cy.get(DATA_CY_STR).should("not.exist");
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    各コンポーネント特有のプロパティ確認
    scriptファイル選択表示確認
    試験確認内容：scriptセレクトボックスで選択したファイルが表示されていることを確認
     */
    it("各コンポーネント特有のプロパティ確認-scriptファイル選択表示確認-scriptセレクトボックスで選択したファイルが表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      cy.createDirOrFile(TYPE_FILE, "test-a", true);
      let targetDropBoxCy = "[data-cy=\"component_property-script-autocomplete\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 3, "test-a");
      cy.get("[data-cy=\"component_property-script-autocomplete\"]").find("input")
        .should("have.value", "test-a");
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    各コンポーネント特有のプロパティ確認
    scriptファイル選択反映確認
    試験確認内容：scriptセレクトボックスで選択したファイルが反映されていることを確認
     */
    it("各コンポーネント特有のプロパティ確認-scriptファイル選択反映確認-scriptセレクトボックスで選択したファイルが反映されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      cy.createDirOrFile(TYPE_FILE, "test-a", true);
      let targetDropBoxCy = "[data-cy=\"component_property-script-autocomplete\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 3, "test-a");
      cy.closeProperty();
      cy.clickComponentName(BJ_TASK_NAME_0);
      cy.get("[data-cy=\"component_property-script-autocomplete\"]").contains("test-a")
        .should("exist");
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    各コンポーネント特有のプロパティ確認
    start表示確認
    試験確認内容：startテキストボックスが表示されていることを確認
     */
    it("各コンポーネント特有のプロパティ確認-start表示確認-startテキストボックスが表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-bulijob_task-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-bulk_number-switch\"]").click();
      cy.get("[data-cy=\"component_property-start_bulkjob-text_field\"]").should("be.visible");
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    各コンポーネント特有のプロパティ確認
    start入力確認
    試験確認内容：startテキストボックスが入力できることを確認
     */
    it("各コンポーネント特有のプロパティ確認-start入力確認-startテキストボックスが入力できることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-bulijob_task-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-bulk_number-switch\"]").click();
      cy.get("[data-cy=\"component_property-start_bulkjob-text_field\"]").type("1");
      cy.get("[data-cy=\"component_property-start_bulkjob-text_field\"]").find("input")
        .should("have.value", 1);
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    各コンポーネント特有のプロパティ確認
    start入力反映確認
    試験確認内容：startテキストボックスに入力した値が反映されていることを確認
     */
    it("各コンポーネント特有のプロパティ確認-start入力反映確認-startテキストボックスに入力した値が反映されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-bulijob_task-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-bulk_number-switch\"]").click();
      cy.get("[data-cy=\"component_property-start_bulkjob-text_field\"]").type("1");
      cy.closeProperty();
      cy.clickComponentName(BJ_TASK_NAME_0);
      cy.get("[data-cy=\"component_property-bulijob_task-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-start_bulkjob-text_field\"]").find("input")
        .should("have.value", 1);
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    各コンポーネント特有のプロパティ確認
    end表示確認
    試験確認内容：endテキストボックスが表示されていることを確認
     */
    it("各コンポーネント特有のプロパティ確認-end表示確認-endテキストボックスが表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-bulijob_task-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-bulk_number-switch\"]").click();
      cy.get("[data-cy=\"component_property-end_bulkjob-text_field\"]").should("be.visible");
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    各コンポーネント特有のプロパティ確認
    end入力確認
    試験確認内容：endテキストボックスが入力できることを確認
     */
    it("各コンポーネント特有のプロパティ確認-end入力確認-endテキストボックスが入力できることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-bulijob_task-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-bulk_number-switch\"]").click();
      cy.get("[data-cy=\"component_property-end_bulkjob-text_field\"]").type("5");
      cy.get("[data-cy=\"component_property-end_bulkjob-text_field\"]").find("input")
        .should("have.value", 5);
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    各コンポーネント特有のプロパティ確認
    end入力反映確認
    試験確認内容：endテキストボックスに入力した値が反映されていることを確認
     */
    it("各コンポーネント特有のプロパティ確認-end入力反映確認-endテキストボックスに入力した値が反映されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-bulijob_task-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-bulk_number-switch\"]").click();
      cy.get("[data-cy=\"component_property-end_bulkjob-text_field\"]").type("5");
      cy.closeProperty();
      cy.clickComponentName(BJ_TASK_NAME_0);
      cy.get("[data-cy=\"component_property-bulijob_task-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-end_bulkjob-text_field\"]").find("input")
        .should("have.value", 5);
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    各コンポーネント特有のプロパティ確認
    parameter file表示確認
    試験確認内容：parameter fileセレクトボックスが表示されていることを確認
     */
    it("各コンポーネント特有のプロパティ確認-parameter file表示確認-parameter fileセレクトボックスが表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-bulijob_task-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-parameter_file_bulkjob-autocomplete\"]").should("be.visible");
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    各コンポーネント特有のプロパティ確認
    parameter file入力確認
    試験確認内容：parameter fileセレクトボックスが入力できることを確認
     */
    it("各コンポーネント特有のプロパティ確認-parameter file入力確認-parameter fileセレクトボックスが入力できることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-bulijob_task-panel_title\"]").click();
      cy.createDirOrFile(TYPE_FILE, "test-a", true);
      let targetDropBoxCy = "[data-cy=\"component_property-parameter_file_bulkjob-autocomplete\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 3, "test-a");
      cy.get("[data-cy=\"component_property-parameter_file_bulkjob-autocomplete\"]").find("input")
        .should("have.value", "test-a");
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    各コンポーネント特有のプロパティ確認
    parameter file入力反映確認
    試験確認内容：parameter fileセレクトボックスに入力した値が反映されていることを確認
     */
    it("各コンポーネント特有のプロパティ確認-parameter file入力反映確認-parameter fileセレクトボックスに入力した値が反映されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-bulijob_task-panel_title\"]").click();
      cy.createDirOrFile(TYPE_FILE, "test-a", true);
      let targetDropBoxCy = "[data-cy=\"component_property-parameter_file_bulkjob-autocomplete\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 3, "test-a");
      cy.closeProperty();
      cy.clickComponentName(BJ_TASK_NAME_0);
      cy.get("[data-cy=\"component_property-bulijob_task-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-parameter_file_bulkjob-autocomplete\"]").contains("test-a")
        .should("exist");
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    プロパティ設定確認
    シェルスクリプト選択セレクトボックス表示確認
    試験確認内容：シェルスクリプト選択セレクトボックスが表示されていることを確認
     */
    it("プロパティ設定確認-シェルスクリプト選択セレクトボックス表示確認-シェルスクリプト選択セレクトボックスが表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-bulijob_task-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-manual_finish_condition-switch\"]").find("input")
        .click();
      cy.get("[data-cy=\"component_property-balkjob_use_javascript-autocomplete\"]").find("input")
        .should("exist");
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    プロパティ設定確認
    シェルスクリプト選択セレクトボックス選択確認
    試験確認内容：選択した値が表示されていることを確認
     */
    it("プロパティ設定確認-シェルスクリプト選択セレクトボックス選択確認-選択した値が表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      cy.createDirOrFile(TYPE_FILE, "test-a", true);
      cy.get("[data-cy=\"component_property-bulijob_task-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-manual_finish_condition-switch\"]").find("input")
        .click();
      let targetDropBoxCy = "[data-cy=\"component_property-balkjob_use_javascript-autocomplete\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 3, "test-a");
      cy.get("[data-cy=\"component_property-balkjob_use_javascript-autocomplete\"]").find("input")
        .should("have.value", "test-a");
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    プロパティ設定確認
    シェルスクリプト選択セレクトボックス選択反映確認
    試験確認内容：選択した値が表示されていることを確認
     */
    it("プロパティ設定確認-シェルスクリプト選択セレクトボックス選択反映確認-選択した値が反映されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      cy.createDirOrFile(TYPE_FILE, "test-a", true);
      cy.get("[data-cy=\"component_property-bulijob_task-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-manual_finish_condition-switch\"]").find("input")
        .click();
      let targetDropBoxCy = "[data-cy=\"component_property-balkjob_use_javascript-autocomplete\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 3, "test-a");
      cy.closeProperty();
      cy.clickComponentName(BJ_TASK_NAME_0);
      cy.get("[data-cy=\"component_property-bulijob_task-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-balkjob_use_javascript-autocomplete\"]").contains("test-a")
        .should("exist");
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    プロパティ設定確認
    javascriptテキストボックス表示確認
    試験確認内容：javascriptテキストボックスが表示されていることを確認
     */
    it("プロパティ設定確認-javascriptテキストボックス表示確認-javascriptテキストボックスが表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-bulijob_task-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-manual_finish_condition-switch\"]").find("input")
        .click();
      cy.get("[data-cy=\"component_property-balkjob_use_javascript-switch\"]").find("input")
        .click();
      cy.get("[data-cy=\"component_property-balkjob_use_javascript-textarea\"]").should("be.visible");
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    プロパティ設定確認
    javascriptテキストボックス入力確認
    試験確認内容：入力した値が表示されていることを確認
     */
    it("プロパティ設定確認-javascriptテキストボックス入力確認-入力した値が表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-bulijob_task-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-manual_finish_condition-switch\"]").find("input")
        .click();
      cy.get("[data-cy=\"component_property-balkjob_use_javascript-switch\"]").find("input")
        .click();
      cy.get("[data-cy=\"component_property-balkjob_use_javascript-textarea\"]").type("testJavaScript");
      cy.get("[data-cy=\"component_property-balkjob_use_javascript-textarea\"]").find("textarea")
        .should("have.value", "testJavaScript");
    });

    /**
    コンポーネントの基本機能動作確認
    BulkjobTaskコンポーネント共通機能確認
    プロパティ設定確認
    javascriptテキストボックス反映確認
    試験確認内容：入力した値が反映されていることを確認
     */
    it("プロパティ設定確認-javascriptテキストボックス反映確認-入力した値が反映されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-bulijob_task-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-manual_finish_condition-switch\"]").find("input")
        .click();
      cy.get("[data-cy=\"component_property-balkjob_use_javascript-switch\"]").find("input")
        .click();
      cy.get("[data-cy=\"component_property-balkjob_use_javascript-textarea\"]").type("testJavaScript");
      cy.closeProperty();
      cy.clickComponentName(BJ_TASK_NAME_0);
      cy.get("[data-cy=\"component_property-bulijob_task-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-balkjob_use_javascript-textarea\"]").find("textarea")
        .should("have.value", "testJavaScript");
    });
  });
});
