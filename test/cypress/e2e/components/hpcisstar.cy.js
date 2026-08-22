describe("components", ()=>{
  describe("hpcisstar", ()=>{
    const wheelPath = Cypress.env("WHEEL_PATH");
    const TYPE_INPUT = "input";
    const TYPE_OUTPUT = "output";
    const TYPE_DIR = "dir";
    const TYPE_FILE = "file";
    const DEF_COMPONENT_HPCISS = "hpcisstar";
    //2024年度版では、HPCISS-tarコンポーネントのデフォルト名は長すぎて一部省略されている
    //接続先を指定するためのワークアラウンド
    const HPCISS_NAME_0 = "HPCI-SS-ta";
    const HPCISS_NAME_1 = "HPCISStar1";
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
    HPCISS-tarコンポーネント共通機能確認
    試験確認内容：プロパティが表示されることを確認
     */
    it("tarコンポーネント共通機能確認-プロパティが表示されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_HPCISS, HPCISS_NAME_0, 501, 500);
      const DATA_CY_STR = "[data-cy=\"component_property-property-navigation_drawer\"]";
      cy.confirmDisplayInProperty(DATA_CY_STR, true);
    });

    /**
  コンポーネントの基本機能動作確認
  HPCISS-tarコンポーネント共通機能確認
  試験確認内容：name入力テキストエリアが表示されていることを確認
     */
    it("tarコンポーネント共通機能確認-name入力テキストエリアが表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_HPCISS, HPCISS_NAME_0, 501, 500);
      const DATA_CY_STR = "[data-cy=\"component_property-name-text_field\"]";
      cy.confirmDisplayInProperty(DATA_CY_STR, true);
    });

    /**
  コンポーネントの基本機能動作確認
  HPCISS-tarコンポーネント共通機能確認
  name入力
  試験確認内容：nameが入力できることを確認
     */
    it("tarコンポーネント共通機能確認-name入力-nameが入力できることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_HPCISS, HPCISS_NAME_0, 501, 500);
      const INPUT_OBJ_CY = "[data-cy=\"component_property-name-text_field\"]";
      cy.confirmInputValueReflection(INPUT_OBJ_CY, "-Test_Task", TAG_TYPE_INPUT, "-Test_Task");
    });

    /**
  コンポーネントの基本機能動作確認
  HPCISS-tarコンポーネント共通機能確認
  name入力（使用可能文字確認）
  試験確認内容：nameが入力できないことを確認
     */
    it("tarコンポーネント共通機能確認-name入力（使用可能文字確認）-nameが入力できないことを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_HPCISS, HPCISS_NAME_0, 501, 500);
      const INPUT_OBJ_CY = "[data-cy=\"component_property-name-text_field\"]";
      cy.confirmInputValueNotReflection(INPUT_OBJ_CY, "Test*Task", TAG_TYPE_INPUT, HPCISS_NAME_0);
    });

    /**
    コンポーネントの基本機能動作確認
    HPCISS-tarコンポーネント共通機能確認
    試験確認内容：説明入力テキストエリアが表示されていることを確認
     */
    it("tarコンポーネント共通機能確認-description入力テキストエリアが表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_HPCISS, HPCISS_NAME_0, 501, 500);
      const DATA_CY_STR = "[data-cy=\"component_property-description-textarea\"]";
      cy.confirmDisplayInProperty(DATA_CY_STR, true);
    });

    /**
  コンポーネントの基本機能動作確認
  HPCISS-tarコンポーネント共通機能確認
  description入力
  試験確認内容：descriptionが入力できることを確認
     */
    it("tarコンポーネント共通機能確認-description入力-descriptionが入力できることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_HPCISS, HPCISS_NAME_0, 501, 500);
      const INPUT_OBJ_CY = "[data-cy=\"component_property-description-textarea\"]";
      cy.confirmInputValueReflection(INPUT_OBJ_CY, "descriptionTest", TAG_TYPE_TEXT_AREA, HPCISS_NAME_0);
    });

    /**
  コンポーネントの基本機能動作確認
  HPCISS-tarコンポーネント共通機能確認
  input files表示
  試験確認内容：input files入力テキストエリアが表示されていることを確認
     */
    it("tarコンポーネント共通機能確認-input files表示-input files入力テキストエリアが表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_HPCISS, HPCISS_NAME_0, 501, 500);
      const DATA_CY_STR = "[data-cy=\"component_property-input_files-list_form\"]";
      const CLICK_AREA_CY = "[data-cy=\"component_property-in_out_files-panel_title\"]";
      cy.confirmDisplayInPropertyByDetailsArea(DATA_CY_STR, CLICK_AREA_CY, null);
    });

    /**
  コンポーネントの基本機能動作確認
  HPCISS-tarコンポーネント共通機能確認
  input files入力
  試験確認内容：input filesが入力できることを確認
     */
    it("tarコンポーネント共通機能確認-input files入力-input filesが入力できることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_HPCISS, HPCISS_NAME_0, 501, 500);
      cy.enterInputOrOutputFile(TYPE_INPUT, "testInputFile", true, false);
      cy.get("[data-cy=\"component_property-input_files-list_form\"]").find("input")
        .should("have.value", "testInputFile");
    });

    /**
  コンポーネントの基本機能動作確認
  HPCISS-tarコンポーネント共通機能確認
  input files反映確認
  試験確認内容：input filesが反映されることを確認
     */
    it("tarコンポーネント共通機能確認-input files反映確認-input filesが反映されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_HPCISS, HPCISS_NAME_0, 501, 500);
      cy.enterInputOrOutputFile(TYPE_INPUT, "testInputFile", true, true);
      cy.get("[data-cy=\"graph-component-row\"]").contains("testInputFile")
        .should("exist");
    });

    /**
  コンポーネントの基本機能動作確認
  HPCISS-tarコンポーネント共通機能確認
  output files表示
  試験確認内容：output files入力テキストエリアが表示されていることを確認
     */
    it("tarコンポーネント共通機能確認-output files表示-output files入力テキストエリアが表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_HPCISS, HPCISS_NAME_0, 501, 500);
      const DATA_CY_STR = "[data-cy=\"component_property-output_files-list_form\"]";
      const CLICK_AREA_CY = "[data-cy=\"component_property-in_out_files-panel_title\"]";
      cy.confirmDisplayInPropertyByDetailsArea(DATA_CY_STR, CLICK_AREA_CY, null);
    });

    /**
  コンポーネントの基本機能動作確認
  HPCISS-tarコンポーネント共通機能確認
  output files入力
  試験確認内容：output filesが入力できることを確認
     */
    it("tarコンポーネント共通機能確認-output files入力-output filesが入力できることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_HPCISS, HPCISS_NAME_0, 501, 500);
      cy.enterInputOrOutputFile(TYPE_OUTPUT, "testOutputFile", true, false);
      cy.get("[data-cy=\"component_property-output_files-list_form\"]").find("input")
        .should("have.value", "testOutputFile");
    });

    /**
  コンポーネントの基本機能動作確認
  HPCISS-tarコンポーネント共通機能確認
  output files反映確認
  試験確認内容：output filesが反映されることを確認
     */
    it("tarコンポーネント共通機能確認-output files反映確認-output filesが反映されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_HPCISS, HPCISS_NAME_0, 501, 500);
      cy.enterInputOrOutputFile(TYPE_OUTPUT, "testOutputFile", true, true);
      cy.get("[data-cy=\"graph-component-row\"]").contains("testOutputFile")
        .should("exist");
    });

    /**
  コンポーネントの基本機能動作確認
  HPCISS-tarコンポーネント共通機能確認
  構成要素の機能確認
  closeボタン押下
  試験確認内容：プロパティが表示されていないことを確認
     */
    it("tarコンポーネント共通機能確認-構成要素の機能確認-closeボタン押下-プロパティが表示されていないことを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_HPCISS, HPCISS_NAME_0, 501, 500);
      cy.closeProperty();
      cy.get("[data-cy=\"component_property-property-navigation_drawer\"]").should("not.exist");
    });

    /**
  コンポーネントの基本機能動作確認
  HPCISS-tarコンポーネント共通機能確認
  構成要素の機能確認
  clean component実行
  試験確認内容：最新の保存状態に戻っていることを確認
  skip:issue#948
     */
    it("tarコンポーネント共通機能確認-構成要素の機能確認-clean component実行-最新の保存状態に戻っていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_HPCISS, HPCISS_NAME_0, 501, 500);
      cy.closeProperty();
      cy.prepareCleanComponentTest(HPCISS_NAME_0);
      cy.get("[data-cy=\"graph-component-row\"]").contains(HPCISS_NAME_0)
        .rightclick();
      cy.get("[data-cy=\"graph-component-row\"]").contains("clean")
        .click();
      cy.contains("button", "discard all changes").click();
      cy.clickComponentName(HPCISS_NAME_0);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").scrollIntoView()
        .click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").should("not.contain.text", "_clean_test_marker.txt");
      cy.closeProperty();
      cy.get("[data-cy=\"graph-component-row\"]").contains(HPCISS_NAME_0)
        .rightclick();
      cy.get("[data-cy=\"graph-component-row\"]").contains("delete")
        .should("be.visible");
      cy.get("body").type("{esc}");
    });

    /**
  コンポーネントの基本機能動作確認
  HPCISS-tarコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  接続確認
  試験確認内容：コンポーネントが接続されていることを確認
     */
    it("tarコンポーネント共通機能確認-ファイル転送設定の各パターンの確認-接続確認-コンポーネントが接続されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_HPCISS, HPCISS_NAME_0, 501, 500);
      const INPUT_OBJ_CY = "[data-cy=\"component_property-name-text_field\"]";
      cy.confirmInputValueReflection(INPUT_OBJ_CY, HPCISS_NAME_1, TAG_TYPE_INPUT, HPCISS_NAME_1);
      cy.enterInputOrOutputFile(TYPE_OUTPUT, "testOutputFile", true, true);
      cy.createComponent(DEF_COMPONENT_HPCISS, HPCISS_NAME_0, 501, 600);
      cy.closeProperty();
      cy.connectComponentMultiple(HPCISS_NAME_1, HPCISS_NAME_0); //コンポーネント同士を接続
      cy.checkConnectionLine(HPCISS_NAME_1, HPCISS_NAME_0); //作成したコンポーネントの座標を取得して接続線の座標と比較
    });

    /**
  コンポーネントの基本機能動作確認
  HPCISS-tarコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除ボタン表示確認（input file）
  試験確認内容：削除ボタンが表示されることを確認
     */
    it("tarコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除ボタン表示確認（input file）-削除ボタンが表示されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_HPCISS, HPCISS_NAME_0, 501, 500);
      cy.enterInputOrOutputFile(TYPE_INPUT, "testInputFile", true, true);
      cy.get("[data-cy=\"action_row-delete-btn\"]").scrollIntoView()
        .should("be.visible");
    });

    /**
  コンポーネントの基本機能動作確認
  HPCISS-tarコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除ボタン表示確認（output file）
  試験確認内容：削除ボタンが表示されることを確認
     */
    it("tarコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除ボタン表示確認（output file）-削除ボタンが表示されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_HPCISS, HPCISS_NAME_0, 501, 500);
      cy.enterInputOrOutputFile(TYPE_OUTPUT, "testOutputFile", true, true);
      cy.get("[data-cy=\"action_row-delete-btn\"]").scrollIntoView()
        .should("be.visible");
    });

    /**
  コンポーネントの基本機能動作確認
  HPCISS-tarコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除反映確認（input file）
  試験確認内容：input fileが削除されていることを確認
     */
    it("tarコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除反映確認（input file）-input fileが削除されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_HPCISS, HPCISS_NAME_0, 501, 500);
      cy.enterInputOrOutputFile(TYPE_INPUT, "testInputFile", true, true);
      cy.get("[data-cy=\"action_row-delete-btn\"]").click();
      cy.get("[data-cy=\"graph-component-row\"]").contains("testInputFile")
        .should("not.exist");
    });

    /**
  コンポーネントの基本機能動作確認
  HPCISS-tarコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除反映確認（output file）
  試験確認内容：output fileが削除されていることを確認
     */
    it("tarコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除反映確認（output file）-output fileが削除されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_HPCISS, HPCISS_NAME_0, 501, 500);
      cy.enterInputOrOutputFile(TYPE_OUTPUT, "testOutputFile", true, true);
      cy.get("[data-cy=\"action_row-delete-btn\"]").click();
      cy.get("[data-cy=\"graph-component-row\"]").contains("testOutputFile")
        .should("not.exist");
    });

    /**
  コンポーネントの基本機能動作確認
  HPCISS-tarコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ単体表示
  試験確認内容：ディレクトリが単体表示されることを確認
     */
    it("tarコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ単体表示-ディレクトリが単体表示されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_HPCISS, HPCISS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-directory_path-text_field\"]").type(wheelPath);
      cy.createDirOrFile(TYPE_DIR, "test-a", true);
      cy.createDirOrFile(TYPE_DIR, "test-b", false);
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-a")
        .should("exist");
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-b")
        .should("exist");
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-a")
        .click();
      cy.get("[data-cy=\"file_browser-remove_file-btn\"]").click();
      cy.get("[data-cy=\"file_browser-dialog-dialog\"]").find("button")
        .first()
        .click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-b")
        .click();
      cy.get("[data-cy=\"file_browser-remove_file-btn\"]").click();
      cy.get("[data-cy=\"file_browser-dialog-dialog\"]").find("button")
        .first()
        .click();
    });

    /**
  コンポーネントの基本機能動作確認
  HPCISS-tarコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ複数表示（リロード前）
  試験確認内容：ディレクトリが単体表示されることを確認
     */
    it("tarコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ複数表示（リロード前）-ディレクトリが単体表示されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_HPCISS, HPCISS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-directory_path-text_field\"]").type(wheelPath);
      cy.createDirOrFile(TYPE_DIR, "test1", true);
      cy.createDirOrFile(TYPE_DIR, "test2", false);
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test1")
        .should("exist");
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test2")
        .should("exist");
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test1")
        .click();
      cy.get("[data-cy=\"file_browser-remove_file-btn\"]").click();
      cy.get("[data-cy=\"file_browser-dialog-dialog\"]").find("button")
        .first()
        .click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test2")
        .click();
      cy.get("[data-cy=\"file_browser-remove_file-btn\"]").click();
      cy.get("[data-cy=\"file_browser-dialog-dialog\"]").find("button")
        .first()
        .click();
    });

    /**
  コンポーネントの基本機能動作確認
  HPCISS-tarコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ複数表示（リロード後）
  試験確認内容：ディレクトリが複数表示されることを確認
     */
    it("tarコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ複数表示（リロード後）-ディレクトリが複数表示されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_HPCISS, HPCISS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-directory_path-text_field\"]").type(wheelPath);
      cy.createDirOrFile(TYPE_DIR, "test1", true);
      cy.createDirOrFile(TYPE_DIR, "test2", false);
      cy.closeProperty();
      cy.clickComponentName(HPCISS_NAME_0);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test*")
        .should("exist")
        .click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test1")
        .click();
      cy.get("[data-cy=\"file_browser-remove_file-btn\"]").click();
      cy.get("[data-cy=\"file_browser-dialog-dialog\"]").find("button")
        .first()
        .click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test2")
        .click();
      cy.get("[data-cy=\"file_browser-remove_file-btn\"]").click();
      cy.get("[data-cy=\"file_browser-dialog-dialog\"]").find("button")
        .first()
        .click();
    });

    /**
  コンポーネントの基本機能動作確認
  HPCISS-tarコンポーネント共通機能確認
  ファイル操作エリア
  ファイル単体表示
  試験確認内容：ファイルが単体表示されることを確認
     */
    it("tarコンポーネント共通機能確認-ファイル操作エリア-ファイル単体表示-ファイルが単体表示されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_HPCISS, HPCISS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-directory_path-text_field\"]").type(wheelPath);
      cy.createDirOrFile(TYPE_FILE, "test-a", true);
      cy.createDirOrFile(TYPE_FILE, "test-b", false);
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-a")
        .should("exist");
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-b")
        .should("exist");
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-a")
        .click();
      cy.get("[data-cy=\"file_browser-remove_file-btn\"]").click();
      cy.get("[data-cy=\"file_browser-dialog-dialog\"]").find("button")
        .first()
        .click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-b")
        .click();
      cy.get("[data-cy=\"file_browser-remove_file-btn\"]").click();
      cy.get("[data-cy=\"file_browser-dialog-dialog\"]").find("button")
        .first()
        .click();
    });

    /**
  コンポーネントの基本機能動作確認
  HPCISS-tarコンポーネント共通機能確認
  ファイル操作エリア
  ファイル複数表示（リロード前）
  試験確認内容：ファイルが単体表示されることを確認
     */
    it("tarコンポーネント共通機能確認-ファイル操作エリア-ファイル複数表示（リロード前）-ファイルが単体表示されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_HPCISS, HPCISS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-directory_path-text_field\"]").type(wheelPath);
      cy.createDirOrFile(TYPE_FILE, "test1", true);
      cy.createDirOrFile(TYPE_FILE, "test2", false);
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test1")
        .should("exist");
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test2")
        .should("exist");
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test1")
        .click();
      cy.get("[data-cy=\"file_browser-remove_file-btn\"]").click();
      cy.get("[data-cy=\"file_browser-dialog-dialog\"]").find("button")
        .first()
        .click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test2")
        .click();
      cy.get("[data-cy=\"file_browser-remove_file-btn\"]").click();
      cy.get("[data-cy=\"file_browser-dialog-dialog\"]").find("button")
        .first()
        .click();
    });

    /**
  コンポーネントの基本機能動作確認
  HPCISS-tarコンポーネント共通機能確認
  ファイル操作エリア
  ファイル複数表示（リロード後）
  試験確認内容：ファイルが複数表示されることを確認
     */
    it("tarコンポーネント共通機能確認-ファイル操作エリア-ファイル複数表示（リロード後）-ファイルが複数表示されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_HPCISS, HPCISS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-directory_path-text_field\"]").type(wheelPath);
      cy.createDirOrFile(TYPE_FILE, "test1", true);
      cy.createDirOrFile(TYPE_FILE, "test2", false);
      cy.closeProperty();
      cy.clickComponentName(HPCISS_NAME_0);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test*")
        .should("exist")
        .click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test1")
        .click();
      cy.get("[data-cy=\"file_browser-remove_file-btn\"]").click();
      cy.get("[data-cy=\"file_browser-dialog-dialog\"]").find("button")
        .first()
        .click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test2")
        .click();
      cy.get("[data-cy=\"file_browser-remove_file-btn\"]").click();
      cy.get("[data-cy=\"file_browser-dialog-dialog\"]").find("button")
        .first()
        .click();
    });

    /**
  コンポーネントの基本機能動作確認
  HPCISS-tarコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ディレクトリ表示
  試験確認内容：ディレクトリ内にディレクトリが作成されることを確認
     */
    it("tarコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ内ディレクトリ表示-ディレクトリ内にディレクトリが作成されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_HPCISS, HPCISS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-directory_path-text_field\"]").type(wheelPath);
      cy.createDirOrFile(TYPE_DIR, "test-a", true);
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-a")
        .click();
      cy.createDirOrFile(TYPE_DIR, "test-b", false);
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-a")
        .should("exist");
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-b")
        .should("exist")
        .click();
      cy.get("[data-cy=\"file_browser-remove_file-btn\"]").click();
      cy.get("[data-cy=\"file_browser-dialog-dialog\"]").find("button")
        .first()
        .click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-a")
        .click();
      cy.get("[data-cy=\"file_browser-remove_file-btn\"]").click();
      cy.get("[data-cy=\"file_browser-dialog-dialog\"]").find("button")
        .first()
        .click();
    });

    /**
  コンポーネントの基本機能動作確認
  HPCISS-tarコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ファイル表示
  試験確認内容：ディレクトリ内にファイルが作成されることを確認
     */
    it("tarコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ内ファイル表示-ディレクトリ内にファイルが作成されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_HPCISS, HPCISS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-directory_path-text_field\"]").type(wheelPath);
      cy.createDirOrFile(TYPE_DIR, "test-a", true);
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-a")
        .click();
      cy.createDirOrFile(TYPE_FILE, "test.txt", false);
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test.txt")
        .should("exist")
        .click();
      cy.get("[data-cy=\"file_browser-remove_file-btn\"]").click();
      cy.get("[data-cy=\"file_browser-dialog-dialog\"]").find("button")
        .first()
        .click();
    });

    /**
  コンポーネントの基本機能動作確認
  HPCISS-tarコンポーネント共通機能確認
  各コンポーネントの追加/削除確認
  該当コンポーネント削除確認
  試験確認内容：コンポーネントが削除されていることを確認
     */
    it("tarコンポーネント共通機能確認-各コンポーネントの追加/削除確認-該当コンポーネント削除確認-コンポーネントが削除されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_HPCISS, HPCISS_NAME_0, 501, 500);
      cy.deleteComponent(HPCISS_NAME_0);
      cy.get("[data-cy=\"graph-component-row\"]").contains(HPCISS_NAME_0)
        .should("not.exist");
    });

    /**
  コンポーネントの基本機能動作確認
  HPCISS-tarコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  host表示確認
  試験確認内容：hostセレクトボックスが表示されていることを確認
     */
    it("tarコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-host表示確認-hostセレクトボックスが表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_HPCISS, HPCISS_NAME_0, 501, 500);
      const DATA_CY_STR = "[data-cy=\"component_property-host-select\"]";
      cy.confirmDisplayInProperty(DATA_CY_STR, true);
    });

    /**
  コンポーネントの基本機能動作確認
  HPCISS-tarコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  host選択確認（localhost以外を選択）
  試験確認内容：hostセレクトボックスで選択した値が表示されていることを確認
     */
    it("tarコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-host選択確認（localhost以外を選択）-hostセレクトボックスで選択した値が表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_HPCISS, HPCISS_NAME_0, 501, 500);
      const targetDropBoxCy = "[data-cy=\"component_property-host-select\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 2, TEST_LABEL);
      cy.get("[data-cy=\"component_property-host-select\"]").find("input")
        .should("have.value", TEST_LABEL);
    });

    /**
  コンポーネントの基本機能動作確認
  HPCISS-tarコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  host選択確認（localhost以外を選択）
  試験確認内容：hostセレクトボックスで選択した値が反映されていることを確認
     */
    it("tarコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-hostファイル選択表示確認-hostセレクトボックスで選択したファイルが表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_HPCISS, HPCISS_NAME_0, 501, 500);
      const targetDropBoxCy = "[data-cy=\"component_property-host-select\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 2, TEST_LABEL);
      cy.saveProperty();
      cy.clickComponentName(HPCISS_NAME_0);
      cy.get("[data-cy=\"component_property-host-select\"]").find("input")
        .should("have.value", TEST_LABEL);
    });

    /**
  コンポーネントの基本機能動作確認
  HPCISS-tarコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  directory path表示確認
  試験確認内容：directory pathテキストボックスが表示されていることを確認
     */
    it("tarコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-directory path表示確認-directory pathテキストボックスが表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_HPCISS, HPCISS_NAME_0, 501, 500);
      const DATA_CY_STR = "[data-cy=\"component_property-directory_path-text_field\"]";
      cy.confirmDisplayInProperty(DATA_CY_STR, true);
    });

    /**
  コンポーネントの基本機能動作確認
  HPCISS-tarコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  directory path入力確認
  試験確認内容：directory pathが入力できることを確認
     */
    it("tarコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-directory path入力確認-directory pathが入力できることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_HPCISS, HPCISS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-directory_path-text_field\"]").type("test/test");
      cy.get("[data-cy=\"component_property-directory_path-text_field\"]").find("input")
        .should("have.value", "test/test");
    });

    /**
  コンポーネントの基本機能動作確認
  HPCISS-tarコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  directory path入力反映確認
  試験確認内容：directory pathが反映されることを確認
     */
    it("tarコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-directory path入力反映確認-directory pathが反映されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_HPCISS, HPCISS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-directory_path-text_field\"]").type("test/test");
      cy.closeProperty();
      cy.clickComponentName(HPCISS_NAME_0);
      cy.get("[data-cy=\"component_property-directory_path-text_field\"]").find("input")
        .should("have.value", "test/test");
    });

    /**
  コンポーネントの基本機能動作確認
  HPCISS-tarコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  memo表示確認
  試験確認内容：memo入力テキストエリアが表示されていることを確認
     */
    it("tarコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-memo表示確認-memo入力テキストエリアが表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_HPCISS, HPCISS_NAME_0, 501, 500);
      const DATA_CY_STR = "[data-cy=\"component_property-memo-textarea\"]";
      cy.confirmDisplayInProperty(DATA_CY_STR, true);
    });

    /**
  コンポーネントの基本機能動作確認
  HPCISS-tarコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  memo入力反映確認
  試験確認内容：memoが入力・反映されることを確認
     */
    it("tarコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-memo入力反映確認-memoが入力・反映されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_HPCISS, HPCISS_NAME_0, 501, 500);
      const INPUT_OBJ_CY = "[data-cy=\"component_property-memo-textarea\"]";
      cy.confirmInputValueReflection(INPUT_OBJ_CY, "memoTest", TAG_TYPE_TEXT_AREA, HPCISS_NAME_0);
    });
  });
});
