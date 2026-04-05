describe("components", ()=>{
  describe("ps", ()=>{
    const TYPE_INPUT = "input";
    const TYPE_OUTPUT = "output";
    const TYPE_DIR = "dir";
    const TYPE_FILE = "file";
    const DEF_COMPONENT_PS = "parameterStudy";
    const PS_NAME_0 = "PS0";
    const PS_NAME_1 = "PS1";
    const TAG_TYPE_INPUT = "input";
    const TAG_TYPE_TEXT_AREA = "textarea";

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
  psコンポーネント共通機能確認
  試験確認内容：プロパティが表示されることを確認
     */
    it("プロパティが表示されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      const DATA_CY_STR = "[data-cy=\"component_property-property-navigation_drawer\"]";
      cy.confirmDisplayInProperty(DATA_CY_STR, true);
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  試験確認内容：name入力テキストエリアが表示されていることを確認
     */
    it("name入力テキストエリアが表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      const DATA_CY_STR = "[data-cy=\"component_property-name-text_field\"]";
      cy.confirmDisplayInProperty(DATA_CY_STR, true);
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  name入力
  試験確認内容：nameが入力できることを確認
     */
    it("name入力-nameが入力できることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      const INPUT_OBJ_CY = "[data-cy=\"component_property-name-text_field\"]";
      cy.confirmInputValueReflection(INPUT_OBJ_CY, "-Test_Task", TAG_TYPE_INPUT, "-Test_Task");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  name入力（使用可能文字確認）
  試験確認内容：nameが入力できないことを確認
     */
    it("name入力（使用可能文字確認）-nameが入力できないことを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      const INPUT_OBJ_CY = "[data-cy=\"component_property-name-text_field\"]";
      cy.confirmInputValueNotReflection(INPUT_OBJ_CY, "Test*Task", TAG_TYPE_INPUT, PS_NAME_0);
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  試験確認内容：説明入力テキストエリアが表示されていることを確認
     */
    it("description入力テキストエリアが表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      const DATA_CY_STR = "[data-cy=\"component_property-description-textarea\"]";
      cy.confirmDisplayInProperty(DATA_CY_STR, true);
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  description入力
  試験確認内容：descriptionが入力できることを確認
     */
    it("description入力-descriptionが入力できることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      const INPUT_OBJ_CY = "[data-cy=\"component_property-description-textarea\"]";
      cy.confirmInputValueReflection(INPUT_OBJ_CY, "descriptionTest", TAG_TYPE_TEXT_AREA, PS_NAME_0);
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  input files表示
  試験確認内容：input files入力テキストエリアが表示されていることを確認
     */
    it("input files表示-input files入力テキストエリアが表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      const DATA_CY_STR = "[data-cy=\"component_property-input_files-list_form\"]";
      const CLICK_AREA_CY = "[data-cy=\"component_property-in_out_files-panel_title\"]";
      cy.confirmDisplayInPropertyByDetailsArea(DATA_CY_STR, CLICK_AREA_CY, null);
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  input files入力
  試験確認内容：input filesが入力できることを確認
     */
    it("input files入力-input filesが入力できることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.enterInputOrOutputFile(TYPE_INPUT, "testInputFile", true, false);
      cy.get("[data-cy=\"component_property-input_files-list_form\"]").find("input")
        .should("have.value", "testInputFile");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  input files反映確認
  試験確認内容：input filesが反映されることを確認
     */
    it("input files反映確認-input filesが反映されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.enterInputOrOutputFile(TYPE_INPUT, "testInputFile", true, true);
      cy.get("[data-cy=\"graph-component-row\"]").contains("testInputFile")
        .should("exist");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  output files表示
  試験確認内容：output files入力テキストエリアが表示されていることを確認
     */
    it("output files表示-output files入力テキストエリアが表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      const DATA_CY_STR = "[data-cy=\"component_property-output_files-list_form\"]";
      const CLICK_AREA_CY = "[data-cy=\"component_property-in_out_files-panel_title\"]";
      cy.confirmDisplayInPropertyByDetailsArea(DATA_CY_STR, CLICK_AREA_CY, null);
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  output files入力
  試験確認内容：output filesが入力できることを確認
     */
    it("output files入力-output filesが入力できることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.enterInputOrOutputFile(TYPE_OUTPUT, "testOutputFile", true, false);
      cy.get("[data-cy=\"component_property-output_files-list_form\"]").find("input")
        .should("have.value", "testOutputFile");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  output files反映確認
  試験確認内容：output filesが反映されることを確認
     */
    it("output files反映確認-output filesが反映されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.enterInputOrOutputFile(TYPE_OUTPUT, "testOutputFile", true, true);
      cy.get("[data-cy=\"graph-component-row\"]").contains("testOutputFile")
        .should("exist");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  構成要素の機能確認
  closeボタン押下
  試験確認内容：プロパティが表示されていないことを確認
     */
    it("構成要素の機能確認-closeボタン押下-プロパティが表示されていないことを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.closeProperty();
      cy.get("[data-cy=\"component_property-property-navigation_drawer\"]").should("not.exist");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  構成要素の機能確認
  clean component実行
  試験確認内容：最新の保存状態に戻っていることを確認
  skip:issue#948
     */
    it("構成要素の機能確認-clean component実行-最新の保存状態に戻っていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.closeProperty();
      cy.prepareCleanComponentTest(PS_NAME_0);
      cy.get("[data-cy=\"graph-component-row\"]").contains(PS_NAME_0)
        .rightclick();
      cy.get("[data-cy=\"graph-component-row\"]").contains("clean")
        .click();
      cy.contains("button", "discard all changes").click();
      cy.clickComponentName(PS_NAME_0);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").scrollIntoView()
        .click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").should("not.contain.text", "_clean_test_marker.txt");
      cy.closeProperty();
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  接続確認
  試験確認内容：コンポーネントが接続されていることを確認
     */
    it("ファイル転送設定の各パターンの確認-接続確認-コンポーネントが接続されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.enterInputOrOutputFile(TYPE_OUTPUT, "testOutputFile", true, true);
      cy.get("[data-cy=\"component_property-close-btn\"]").click(); //Close property panel
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_1, 501, 600);
      cy.get("[data-cy=\"component_property-close-btn\"]").click(); //Close second component property panel
      cy.connectComponentMultiple(PS_NAME_0, PS_NAME_1); //コンポーネント同士を接続
      cy.checkConnectionLine(PS_NAME_0, PS_NAME_1); //作成したコンポーネントの座標を取得して接続線の座標と比較
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除ボタン表示確認（input file）
  試験確認内容：削除ボタンが表示されることを確認
     */
    it("転送対象ファイル・フォルダの設定-削除ボタン表示確認（input file）-削除ボタンが表示されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.enterInputOrOutputFile(TYPE_INPUT, "testInputFile", true, true);
      cy.get("[data-cy=\"action_row-delete-btn\"]").should("be.visible");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除ボタン表示確認（output file）
  試験確認内容：削除ボタンが表示されることを確認
     */
    it("転送対象ファイル・フォルダの設定-削除ボタン表示確認（output file）-削除ボタンが表示されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.enterInputOrOutputFile(TYPE_OUTPUT, "testOutputFile", true, true);
      cy.get("[data-cy=\"action_row-delete-btn\"]").should("be.visible");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除反映確認（input file）
  試験確認内容：input fileが削除されていることを確認
     */
    it("転送対象ファイル・フォルダの設定-削除反映確認（input file）-input fileが削除されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.enterInputOrOutputFile(TYPE_INPUT, "testInputFile", true, true);
      cy.get("[data-cy=\"action_row-delete-btn\"]").click();
      cy.get("[data-cy=\"graph-component-row\"]").contains("testInputFile")
        .should("not.exist");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除反映確認（output file）
  試験確認内容：output fileが削除されていることを確認
     */
    it("転送対象ファイル・フォルダの設定-削除反映確認（output file）-output fileが削除されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.enterInputOrOutputFile(TYPE_OUTPUT, "testOutputFile", true, true);
      cy.get("[data-cy=\"action_row-delete-btn\"]").click();
      cy.get("[data-cy=\"graph-component-row\"]").contains("testOutputFile")
        .should("not.exist");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ単体表示
  試験確認内容：ディレクトリが単体表示されることを確認
     */
    it("ファイル操作エリア-ディレクトリ単体表示-ディレクトリが単体表示されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.createDirOrFile(TYPE_DIR, "test-a", true);
      cy.createDirOrFile(TYPE_DIR, "test-b", false);
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-a")
        .should("exist");
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-b")
        .should("exist");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ複数表示（リロード前）
  試験確認内容：ディレクトリが単体表示されることを確認
     */
    it("ファイル操作エリア-ディレクトリ複数表示（リロード前）-ディレクトリが単体表示されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.createDirOrFile(TYPE_DIR, "test1", true);
      cy.createDirOrFile(TYPE_DIR, "test2", false);
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test1")
        .should("exist");
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test2")
        .should("exist");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ複数表示（リロード後）
  試験確認内容：ディレクトリが複数表示されることを確認
     */
    it("ファイル操作エリア-ディレクトリ複数表示（リロード後）-ディレクトリが複数表示されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.createDirOrFile(TYPE_DIR, "test1", true);
      cy.createDirOrFile(TYPE_DIR, "test2", false);
      cy.closeProperty();
      cy.clickComponentName(PS_NAME_0);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test*")
        .should("exist");
      cy.closeProperty();
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  ファイル操作エリア
  ファイル単体表示
  試験確認内容：ファイルが単体表示されることを確認
     */
    it("ファイル操作エリア-ファイル単体表示-ファイルが単体表示されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.createDirOrFile(TYPE_FILE, "test-a", true);
      cy.createDirOrFile(TYPE_FILE, "test-b", false);
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-a")
        .should("exist");
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-b")
        .should("exist");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  ファイル操作エリア
  ファイル複数表示（リロード前）
  試験確認内容：ファイルが単体表示されることを確認
     */
    it("ファイル操作エリア-ファイル複数表示（リロード前）-ファイルが単体表示されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.createDirOrFile(TYPE_FILE, "test1", true);
      cy.createDirOrFile(TYPE_FILE, "test2", false);
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test1")
        .should("exist");
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test2")
        .should("exist");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  ファイル操作エリア
  ファイル複数表示（リロード後）
  試験確認内容：ファイルが複数表示されることを確認
     */
    it("ファイル操作エリア-ファイル複数表示（リロード後）-ファイルが複数表示されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.createDirOrFile(TYPE_FILE, "test1", true);
      cy.createDirOrFile(TYPE_FILE, "test2", false);
      cy.closeProperty();
      cy.clickComponentName(PS_NAME_0);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test*")
        .should("exist");
      cy.closeProperty();
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ディレクトリ表示
  試験確認内容：ディレクトリ内にディレクトリが作成されることを確認
     */
    it("ファイル操作エリア-ディレクトリ内ディレクトリ表示-ディレクトリ内にディレクトリが作成されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
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
  psコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ファイル表示
  試験確認内容：ディレクトリ内にファイルが作成されることを確認
     */
    it("ファイル操作エリア-ディレクトリ内ファイル表示-ディレクトリ内にファイルが作成されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.createDirOrFile(TYPE_DIR, "test-a", true);
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-a")
        .click();
      cy.createDirOrFile(TYPE_FILE, "test.txt", false);
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test.txt")
        .should("exist");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネントの追加/削除確認
  該当コンポーネント削除確認
  試験確認内容：コンポーネントが削除されていることを確認
     */
    it("各コンポーネントの追加/削除確認-該当コンポーネント削除確認-コンポーネントが削除されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.deleteComponent(PS_NAME_0);
      cy.get("[data-cy=\"graph-component-row\"]").contains(PS_NAME_0)
        .should("not.exist");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  parameterFileテキストボックス表示確認
  試験確認内容：parameterFileテキストボックスが表示されていることを確認
     */
    it("プロパティ設定確認-parameterFileテキストボックス表示確認-parameterFileテキストボックスが表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-ps-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-parameter_file-autocomplete\"]").should("be.visible");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  parameterFileテキストボックス入力入力確認
  試験確認内容：parameterFileテキストボックスが入力できることを確認
     */
    it("プロパティ設定確認-parameterFileテキストボックス入力確認-parameterFileテキストボックスが入力できることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-ps-panel_title\"]").click();
      cy.createDirOrFile(TYPE_FILE, "test.json", true);
      let targetDropBoxCy = "[data-cy=\"component_property-parameter_file-autocomplete\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 3, "test.json");
      cy.get("[data-cy=\"component_property-parameter_file-autocomplete\"]").find("input")
        .should("have.value", "test.json");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  parameterFileテキストボックス入力反映確認
  試験確認内容：parameterFileテキストボックスが反映されていることを確認
     */
    it("プロパティ設定確認-parameterFileテキストボックス入力反映確認-parameterFileテキストボックスが反映されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-ps-panel_title\"]").click();
      cy.createDirOrFile(TYPE_FILE, "test.json", true);
      let targetDropBoxCy = "[data-cy=\"component_property-parameter_file-autocomplete\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 3, "test.json");
      cy.closeProperty();
      cy.clickComponentName(PS_NAME_0);
      cy.get("[data-cy=\"component_property-ps-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-parameter_file-autocomplete\"]").contains("test.json")
        .should("exist");
      cy.closeProperty();
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  force overwriteスイッチボタン表示確認
  試験確認内容：force overwriteスイッチボタンが表示されていることを確認
     */
    it("プロパティ設定確認-force overwriteスイッチボタン表示確認-force overwriteスイッチボタンが表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-ps-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-force_overwrite-switch\"]").should("be.visible");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  force overwriteスイッチボタン入力確認
  試験確認内容：force overwriteスイッチボタンが入力されていることを確認
     */
    it("プロパティ設定確認-force overwriteスイッチボタン入力確認-force overwriteスイッチボタンが入力されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-ps-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-force_overwrite-switch\"]").find("input")
        .click();
      cy.get("[data-cy=\"component_property-force_overwrite-switch\"]").find("input")
        .should("be.checked");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  force overwriteスイッチボタン入力反映確認
  試験確認内容：force overwriteスイッチボタンが入力反映されていることを確認
     */
    it("プロパティ設定確認-force overwriteスイッチボタン入力確認-force overwriteスイッチボタンが入力反映されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-ps-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-force_overwrite-switch\"]").find("input")
        .click();
      cy.closeProperty();
      cy.clickComponentName(PS_NAME_0);
      cy.get("[data-cy=\"component_property-ps-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-force_overwrite-switch\"]").find("input")
        .should("be.checked");
      cy.closeProperty();
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  delete all instancesスイッチボタン表示確認
  試験確認内容：delete all instancesスイッチボタンが表示されていることを確認
     */
    it("プロパティ設定確認-delete all instancesスイッチボタン表示確認-delete all instancesスイッチボタンが表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-ps-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-delete_all_instances-switch\"]").should("be.visible");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  delete all instancesスイッチボタン入力確認
  試験確認内容：delete all instancesスイッチボタンが入力されていることを確認
     */
    it("プロパティ設定確認-delete all instancesスイッチボタン入力確認-delete all instancesスイッチボタンが入力されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-ps-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-delete_all_instances-switch\"]").find("input")
        .click();
      cy.get("[data-cy=\"component_property-delete_all_instances-switch\"]").find("input")
        .should("be.checked");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  delete all instancesスイッチボタン入力反映確認
  試験確認内容：delete all instancesスイッチボタンが入力反映されていることを確認
     */
    it("プロパティ設定確認-delete all instancesスイッチボタン入力確認-delete all instancesスイッチボタンが入力反映されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-ps-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-delete_all_instances-switch\"]").find("input")
        .click();
      cy.closeProperty();
      cy.clickComponentName(PS_NAME_0);
      cy.get("[data-cy=\"component_property-ps-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-delete_all_instances-switch\"]").find("input")
        .should("be.checked");
      cy.closeProperty();
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  targetFiles入力テキストボックス表示確認
  試験確認内容：targetFiles入力テキストボックスが表示されていることを確認
     */
    it("プロパティ設定確認-targetFiles入力テキストボックス表示確認-targetFiles入力テキストボックスが表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("parameterSetting.json")
        .click();
      cy.get("[data-cy=\"file_browser-edit_files-btn\"]").click();
      cy.get("[data-cy=\"target_files-add_target_file-btn\"]").click();
      cy.get("[data-cy=\"target_files-target_file_name-text_field\"]").should("be.visible");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  targetFiles入力テキストボックス入力確認
  試験確認内容：targetFilesテキストボックスに入力した値が表示されていることを確認
     */
    it("プロパティ設定確認-targetFiles入力テキストボックス入力確認-targetFilesテキストボックスに入力した値が表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("parameterSetting.json")
        .click();
      cy.get("[data-cy=\"file_browser-edit_files-btn\"]").click();
      cy.get("[data-cy=\"target_files-add_target_file-btn\"]").click();
      cy.get("[data-cy=\"target_files-target_file_name-text_field\"]").type("run.sh");
      cy.get("[data-cy=\"target_files-target_file_name-text_field\"]").find("input")
        .should("have.value", "run.sh");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  targetFiles追加
  試験確認内容：targetFileが追加されていることを確認
  不具合内容：run.shファイルが見つからないため試験に失敗(2-1.)
     */
    it("プロパティ設定確認-targetFiles追加-targetFileが追加されていることを確認", ()=>{ //TODO:テストで失敗しているため一時的にskip.修正後復帰すること.
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("parameterSetting.json")
        .click();
      cy.get("[data-cy=\"file_browser-edit_files-btn\"]").click();
      cy.get("[data-cy=\"target_files-add_target_file-btn\"]").click();
      cy.get("[data-cy=\"target_files-target_file_name-text_field\"]").type("run.sh");
      cy.get("[data-cy=\"target_files-ok-btn\"]").click();
      cy.get("[data-cy=\"target_files-data-data_table\"]").contains("run.sh")
        .should("exist");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  targetFiles削除
  試験確認内容：targetFilesが削除されていることを確認
  不具合内容：run.shファイルが見つからないため試験に失敗(2-1.)
     */
    it("プロパティ設定確認-targetFiles削除-targetFilesが削除されていることを確認", ()=>{ //TODO:テストで失敗しているため一時的にskip.修正後復帰すること.
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("parameterSetting.json")
        .click();
      cy.get("[data-cy=\"file_browser-edit_files-btn\"]").click();
      cy.get("[data-cy=\"target_files-add_target_file-btn\"]").click();
      cy.get("[data-cy=\"target_files-target_file_name-text_field\"]").type("run.sh");
      cy.get("[data-cy=\"target_files-ok-btn\"]").click();
      cy.get("[data-cy=\"action_row-delete-btn\"]").click();
      cy.get("[data-cy=\"target_files-data-data_table\"]").contains("run.sh")
        .should("not.exist");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  targetFilesタブエディタ入力確認
  試験確認内容：入力した値が表示されていることを確認
  不具合内容：run.shファイルが見つからないため試験に失敗(2-1.)
     */
    it("プロパティ設定確認-delete all instancesスイッチボタン入力確認-入力した値が表示されていることを確認", ()=>{ //TODO:テストで失敗しているため一時的にskip.修正後復帰すること.
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("parameterSetting.json")
        .click();
      cy.get("[data-cy=\"file_browser-edit_files-btn\"]").click();
      cy.get("[data-cy=\"target_files-add_target_file-btn\"]").click();
      cy.get("[data-cy=\"target_files-target_file_name-text_field\"]").type("run.sh");
      cy.get("[data-cy=\"target_files-ok-btn\"]").click();
      cy.get("[data-cy=\"rapid-tab-tab_editor\"]").type("test");
      cy.get("[data-cy=\"rapid-tab-tab_editor\"]").contains("test")
        .should("exist");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  targetFiles反映確認
  試験確認内容：targetFilesが反映されていることを確認
  不具合内容：run.shファイルが見つからないため試験に失敗(2-1.)
     */
    it("プロパティ設定確認-targetFiles反映確認-targetFilesが反映されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("parameterSetting.json")
        .click();
      cy.get("[data-cy=\"file_browser-edit_files-btn\"]").click();
      cy.get("[data-cy=\"target_files-add_target_file-btn\"]").click();
      cy.get("[data-cy=\"target_files-target_file_name-text_field\"]").type("run.sh");
      cy.get("[data-cy=\"target_files-ok-btn\"]").click();
      cy.get("[data-cy=\"target_files-data-data_table\"]").contains("run.sh")
        .should("exist");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  parameters->current selected text 表示確認
  試験確認内容：current selected textテキストボックスが表示されていることを確認
     */
    it("プロパティ設定確認-parameters->current selected text 表示確認-current selected textテキストボックスが表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("parameterSetting.json")
        .click();
      cy.get("[data-cy=\"file_browser-edit_files-btn\"]").click();
      cy.get("[data-cy=\"parameter-selected_text-text_field\"]").should("be.visible");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  parameters->current selected text 入力確認
  試験確認内容：current selected textテキストボックスにドラッグした値が表示されていることを確認
  不具合内容：run.shファイルが見つからないため試験に失敗(2-1.)
     */
    it("プロパティ設定確認-parameters->current selected text 入力確認-current selected textテキストボックスにドラッグした値が表示されていることを確認", ()=>{ //TODO:テストで失敗しているため一時的にskip.修正後復帰すること.
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("parameterSetting.json")
        .click();
      cy.get("[data-cy=\"file_browser-edit_files-btn\"]").click();
      cy.get("[data-cy=\"target_files-add_target_file-btn\"]").click();
      cy.get("[data-cy=\"target_files-target_file_name-text_field\"]").type("run.sh");
      cy.get("[data-cy=\"target_files-ok-btn\"]").click();
      cy.get("[data-cy=\"rapid-tab-tab_editor\"]").type("VALUE=value");
      cy.get("[data-cy=\"rapid-tab-tab_editor\"]").dblclick();
      cy.get("[data-cy=\"parameter-selected_text-text_field\"]").find("input")
        .should("have.value", "value");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  parameters->+ add new parameter ボタン表示確認
  試験確認内容：parameter設定ダイアログが表示されることを確認
     */
    it("プロパティ設定確認-parameters->+ add new parameter ボタン表示確認-parameter設定ダイアログが表示されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("parameterSetting.json")
        .click();
      cy.get("[data-cy=\"file_browser-edit_files-btn\"]").click();
      cy.get("[data-cy=\"parameter-add_new_parameter_btn\"]").click();
      cy.get("[data-cy=\"parameter-parameter_setting-select\"]").should("be.visible");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  min-max-step表示確認
  試験確認内容：min-max-step入力フォームが表示されていることを確認
     */
    it("プロパティ設定確認-min-max-step表示確認-min-max-step入力フォームが表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("parameterSetting.json")
        .click();
      cy.get("[data-cy=\"file_browser-edit_files-btn\"]").click();
      cy.get("[data-cy=\"parameter-add_new_parameter_btn\"]").click();
      cy.get("[data-cy=\"parameter-min-text_field\"]").should("be.visible");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  min-max-step入力確認
  試験確認内容：min-max-step入力フォームに入力した値が表示されていることを確認
     */
    it("プロパティ設定確認-min-max-step入力確認-min-max-step入力フォームに入力した値が表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("parameterSetting.json")
        .click();
      cy.get("[data-cy=\"file_browser-edit_files-btn\"]").click();
      cy.get("[data-cy=\"parameter-add_new_parameter_btn\"]").click();
      cy.get("[data-cy=\"parameter-min-text_field\"]").clear()
        .type(1)
        .find("input")
        .should("have.value", 1);
      cy.get("[data-cy=\"parameter-max-text_field\"]").clear()
        .type(3)
        .find("input")
        .should("have.value", 3);
      cy.get("[data-cy=\"parameter-step-text_field\"]").clear()
        .type(2)
        .find("input")
        .should("have.value", 2);
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  min-max-step入力反映確認
  試験確認内容：min-max-step入力フォームに入力した値が反映されていることを確認
  不具合内容：run.shファイルが見つからないため試験に失敗(2-1.)
     */
    it("プロパティ設定確認-min-max-step入力反映確認-min-max-step入力フォームに入力した値が反映されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("parameterSetting.json")
        .click();
      cy.get("[data-cy=\"file_browser-edit_files-btn\"]").click();
      //ターゲットファイル設定
      cy.get("[data-cy=\"target_files-add_target_file-btn\"]").click();
      cy.get("[data-cy=\"target_files-target_file_name-text_field\"]").type("run.sh");
      cy.get("[data-cy=\"target_files-ok-btn\"]").click();
      cy.get("[data-cy=\"rapid-tab-tab_editor\"]").type("VALUE=value");
      cy.get("[data-cy=\"rapid-tab-tab_editor\"]").dblclick();
      //パラメータ設定
      cy.get("[data-cy=\"parameter-add_new_parameter_btn\"]").click();
      cy.get("[data-cy=\"parameter-min-text_field\"]").clear()
        .type(1);
      cy.get("[data-cy=\"parameter-max-text_field\"]").clear()
        .type(3);
      cy.get("[data-cy=\"parameter-step-text_field\"]").clear()
        .type(2);
      cy.get("[data-cy=\"parameter-ok-btn\"]").click();
      cy.get("[data-cy=\"rapid-tab-tab_editor\"]").contains("VALUE={{ value }}")
        .should("exist");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  list表示確認
  試験確認内容：list入力フォームが表示されていることを確認
     */
    it("プロパティ設定確認-list表示確認-list入力フォームが表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("parameterSetting.json")
        .click();
      cy.get("[data-cy=\"file_browser-edit_files-btn\"]").click();
      cy.get("[data-cy=\"parameter-add_new_parameter_btn\"]").click();
      let targetDropBoxCy = "[data-cy=\"parameter-parameter_setting-select\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 1, "list");
      cy.get("[data-cy=\"parameter-list-list_form\"]").should("be.visible");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  list入力確認
  試験確認内容：list入力フォームに入力した値が表示されていることを確認
     */
    it("プロパティ設定確認-list入力確認-list入力フォームに入力した値が表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("parameterSetting.json")
        .click();
      cy.get("[data-cy=\"file_browser-edit_files-btn\"]").click();
      cy.get("[data-cy=\"parameter-add_new_parameter_btn\"]").click();
      let targetDropBoxCy = "[data-cy=\"parameter-parameter_setting-select\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 1, "list");
      cy.get("[data-cy=\"parameter-list-list_form\"]").type(10)
        .find("input")
        .should("have.value", 10);
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  list入力反映確認
  試験確認内容：list入力フォームに入力した値が反映されていることを確認
  不具合内容：run.shファイルが見つからないため試験に失敗(2-1.)
     */
    it("プロパティ設定確認-list入力反映確認-list入力フォームに入力した値が反映されていることを確認", ()=>{ //TODO:テストで失敗しているため一時的にskip.修正後復帰すること.
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("parameterSetting.json")
        .click();
      cy.get("[data-cy=\"file_browser-edit_files-btn\"]").click();
      //ターゲットファイル設定
      cy.get("[data-cy=\"target_files-add_target_file-btn\"]").click();
      cy.get("[data-cy=\"target_files-target_file_name-text_field\"]").type("run.sh");
      cy.get("[data-cy=\"target_files-ok-btn\"]").click();
      cy.get("[data-cy=\"rapid-tab-tab_editor\"]").type("VALUE=value");
      cy.get("[data-cy=\"rapid-tab-tab_editor\"]").dblclick();
      cy.get("[data-cy=\"parameter-add_new_parameter_btn\"]").click();
      let targetDropBoxCy = "[data-cy=\"parameter-parameter_setting-select\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 1, "list");
      cy.get("[data-cy=\"parameter-list-list_form\"]").type(10);
      cy.get("[data-cy=\"parameter-ok-btn\"]").click();
      cy.get("[data-cy=\"rapid-tab-tab_editor\"]").contains("VALUE={{ value }}")
        .should("exist");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  files表示確認
  試験確認内容：files入力フォームが表示されていることを確認
     */
    it("プロパティ設定確認-files表示確認-files入力フォームが表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("parameterSetting.json")
        .click();
      cy.get("[data-cy=\"file_browser-edit_files-btn\"]").click();
      cy.get("[data-cy=\"parameter-add_new_parameter_btn\"]").click();
      let targetDropBoxCy = "[data-cy=\"parameter-parameter_setting-select\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 1, "files");
      cy.get("[data-cy=\"parameter-files-list_form\"]").should("be.visible");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  files入力確認
  試験確認内容：files入力フォームに入力した値が表示されていることを確認
     */
    it("プロパティ設定確認-files入力確認-files入力フォームに入力した値が表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("parameterSetting.json")
        .click();
      cy.get("[data-cy=\"file_browser-edit_files-btn\"]").click();
      cy.get("[data-cy=\"parameter-add_new_parameter_btn\"]").click();
      let targetDropBoxCy = "[data-cy=\"parameter-parameter_setting-select\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 1, "files");
      cy.get("[data-cy=\"parameter-files-list_form\"]").type(10)
        .find("input")
        .should("have.value", 10);
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  files入力反映確認
  試験確認内容：files入力フォームに入力した値が反映されていることを確認
  不具合内容：run.shファイルが見つからないため試験に失敗(2-1.)
     */
    it("プロパティ設定確認-files入力反映確認-files入力フォームに入力した値が反映されていることを確認", ()=>{ //TODO:テストで失敗しているため一時的にskip.修正後復帰すること.
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("parameterSetting.json")
        .click();
      cy.get("[data-cy=\"file_browser-edit_files-btn\"]").click();
      //ターゲットファイル設定
      cy.get("[data-cy=\"target_files-add_target_file-btn\"]").click();
      cy.get("[data-cy=\"target_files-target_file_name-text_field\"]").type("run.sh");
      cy.get("[data-cy=\"target_files-ok-btn\"]").click();
      cy.get("[data-cy=\"rapid-tab-tab_editor\"]").type("VALUE=value");
      cy.get("[data-cy=\"rapid-tab-tab_editor\"]").dblclick();
      cy.get("[data-cy=\"parameter-add_new_parameter_btn\"]").click();
      let targetDropBoxCy = "[data-cy=\"parameter-parameter_setting-select\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 1, "files");
      cy.get("[data-cy=\"parameter-files-list_form\"]").type(10);
      cy.get("[data-cy=\"parameter-ok-btn\"]").click();
      cy.get("[data-cy=\"rapid-tab-tab_editor\"]").contains("VALUE={{ value }}")
        .should("exist");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  add new scatter settingボタン表示確認
  試験確認内容：scatter設定ダイアログが表示されることを確認
     */
    it("プロパティ設定確認-add new scatter settingボタン表示確認-scatter設定ダイアログが表示されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("parameterSetting.json")
        .click();
      cy.get("[data-cy=\"file_browser-edit_files-btn\"]").click();
      cy.get("[data-cy=\"gather_scatter-add_new_setting_btn\"]").eq(0)
        .click();
      cy.contains("select component").should("exist");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  scatter-> srcName表示確認
  試験確認内容：srcNameテキストボックスが表示されていることを確認
     */
    it("プロパティ設定確認-scatter-> srcName表示確認-srcNameテキストボックスが表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("parameterSetting.json")
        .click();
      cy.get("[data-cy=\"file_browser-edit_files-btn\"]").click();
      cy.get("[data-cy=\"gather_scatter-add_new_setting_btn\"]").eq(0)
        .click();
      cy.get("[data-cy=\"gather_scatter-srcName_text_field\"]").should("be.visible");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  scatter->srcName入力確認
  試験確認内容：srcNameテキストボックスに入力した値が表示されていることを確認
     */
    it("プロパティ設定確認-scatter->srcName入力確認-srcNameテキストボックスに入力した値が表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("parameterSetting.json")
        .click();
      cy.get("[data-cy=\"file_browser-edit_files-btn\"]").click();
      cy.get("[data-cy=\"gather_scatter-add_new_setting_btn\"]").eq(0)
        .click();
      cy.get("[data-cy=\"gather_scatter-srcName_text_field\"]").type("testSrcName")
        .find("input")
        .should("have.value", "testSrcName");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  scatter->dstName表示確認
  試験確認内容：dstNameテキストボックスが表示されていることを確認
     */
    it("プロパティ設定確認-scatter->dstName表示確認-dstNameテキストボックスが表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("parameterSetting.json")
        .click();
      cy.get("[data-cy=\"file_browser-edit_files-btn\"]").click();
      cy.get("[data-cy=\"gather_scatter-add_new_setting_btn\"]").eq(0)
        .click();
      cy.get("[data-cy=\"gather_scatter-dstName_text_field\"]").should("be.visible");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  scatter->dstName入力確認
  試験確認内容：dstNameテキストボックスに入力した値が表示されていることを確認
     */
    it("プロパティ設定確認-scatter->dstName入力確認-dstNameテキストボックスに入力した値が表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("parameterSetting.json")
        .click();
      cy.get("[data-cy=\"file_browser-edit_files-btn\"]").click();
      cy.get("[data-cy=\"gather_scatter-add_new_setting_btn\"]").eq(0)
        .click();
      cy.get("[data-cy=\"gather_scatter-dstName_text_field\"]").type("testDstName")
        .find("input")
        .should("have.value", "testDstName");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  scatter入力反映確認
  試験確認内容：srcName、dstNameテキストボックスに入力した値が反映されていることを確認
  不具合内容："testSrcName","testDstName"が見つからないため試験に失敗(2-1.)
     */
    it("プロパティ設定確認-scatter入力反映確認-srcName、dstNameテキストボックスに入力した値が反映されていることを確認", ()=>{ //TODO:テストで失敗しているため一時的にskip.修正後復帰すること.
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("parameterSetting.json")
        .click();
      cy.get("[data-cy=\"file_browser-edit_files-btn\"]").click();
      cy.get("[data-cy=\"gather_scatter-add_new_setting_btn\"]").eq(0)
        .click();
      cy.get("[data-cy=\"gather_scatter-srcName_text_field\"]").type("testSrcName");
      cy.get("[data-cy=\"gather_scatter-dstName_text_field\"]").type("testDstName");
      cy.get("[data-cy=\"gather_scatter-ok-btn\"]").click();
      cy.get("[data-cy=\"parameter_editor-scatter-gather_scatter\"]").contains("testSrcName")
        .should("exist");
      cy.get("[data-cy=\"parameter_editor-scatter-gather_scatter\"]").contains("testDstName")
        .should("exist");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  add new gather settingボタン表示確認
  試験確認内容：gather設定ダイアログが表示されることを確認
     */
    it("プロパティ設定確認-add new scatter settingボタン表示確認-scatter設定ダイアログが表示されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("parameterSetting.json")
        .click();
      cy.get("[data-cy=\"file_browser-edit_files-btn\"]").click();
      cy.get("[data-cy=\"gather_scatter-add_new_setting_btn\"]").eq(1)
        .click();
      cy.contains("select component").should("exist");
    });

    /**
 コンポーネントの基本機能動作確認
 psコンポーネント共通機能確認
 各コンポーネント特有のプロパティ確認
 gather-> srcName表示確認
 試験確認内容：srcNameテキストボックスが表示されていることを確認
     */
    it("プロパティ設定確認-gather-> srcName表示確認-srcNameテキストボックスが表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("parameterSetting.json")
        .click();
      cy.get("[data-cy=\"file_browser-edit_files-btn\"]").click();
      cy.get("[data-cy=\"gather_scatter-add_new_setting_btn\"]").eq(1)
        .click();
      cy.get("[data-cy=\"gather_scatter-srcName_text_field\"]").should("be.visible");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  gather->srcName入力確認
  試験確認内容：srcNameテキストボックスに入力した値が表示されていることを確認
     */
    it("プロパティ設定確認-scatter->srcName入力確認-srcNameテキストボックスに入力した値が表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("parameterSetting.json")
        .click();
      cy.get("[data-cy=\"file_browser-edit_files-btn\"]").click();
      cy.get("[data-cy=\"gather_scatter-add_new_setting_btn\"]").eq(1)
        .click();
      cy.get("[data-cy=\"gather_scatter-srcName_text_field\"]").type("testSrcName")
        .find("input")
        .should("have.value", "testSrcName");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  gather->dstName表示確認
  試験確認内容：dstNameテキストボックスが表示されていることを確認
     */
    it("プロパティ設定確認-gather->dstName表示確認-dstNameテキストボックスが表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("parameterSetting.json")
        .click();
      cy.get("[data-cy=\"file_browser-edit_files-btn\"]").click();
      cy.get("[data-cy=\"gather_scatter-add_new_setting_btn\"]").eq(1)
        .click();
      cy.get("[data-cy=\"gather_scatter-dstName_text_field\"]").should("be.visible");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  gather->dstName入力確認
  試験確認内容：dstNameテキストボックスに入力した値が表示されていることを確認
     */
    it("プロパティ設定確認-gather->dstName入力確認-dstNameテキストボックスに入力した値が表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("parameterSetting.json")
        .click();
      cy.get("[data-cy=\"file_browser-edit_files-btn\"]").click();
      cy.get("[data-cy=\"gather_scatter-add_new_setting_btn\"]").eq(1)
        .click();
      cy.get("[data-cy=\"gather_scatter-dstName_text_field\"]").type("testDstName")
        .find("input")
        .should("have.value", "testDstName");
    });

    /**
  コンポーネントの基本機能動作確認
  psコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  gather入力反映確認
  試験確認内容：srcName、dstNameテキストボックスに入力した値が反映されていることを確認
     */
    it("プロパティ設定確認-gather入力反映確認-srcName、dstNameテキストボックスに入力した値が反映されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_PS, PS_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("parameterSetting.json")
        .click();
      cy.get("[data-cy=\"file_browser-edit_files-btn\"]").click();
      cy.get("[data-cy=\"gather_scatter-add_new_setting_btn\"]").eq(1)
        .click();
      cy.get("[data-cy=\"gather_scatter-srcName_text_field\"]").type("testSrcName");
      cy.get("[data-cy=\"gather_scatter-dstName_text_field\"]").type("testDstName");
      cy.get("[data-cy=\"gather_scatter-ok-btn\"]").click();
      cy.get("[data-cy=\"parameter_editor-gather-gather_scatter\"]").contains("testSrcName")
        .should("exist");
      cy.get("[data-cy=\"parameter_editor-gather-gather_scatter\"]").contains("testDstName")
        .should("exist");
    });
  });
});
