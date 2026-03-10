const MOCK_URL = Cypress.env("USE_MOCK")
  ? { baseUrl: "http://localhost:3001" }
  : {};
describe("components", ()=>{
  describe("while", MOCK_URL, ()=>{
    const TYPE_INPUT = "input";
    const TYPE_OUTPUT = "output";
    const TYPE_DIR = "dir";
    const TYPE_FILE = "file";
    const DEF_COMPONENT_WHILE = "while";
    const WHILE_NAME_0 = "while0";
    const WHILE_NAME_1 = "while1";
    const TAG_TYPE_INPUT = "input";
    const TAG_TYPE_TEXT_AREA = "textarea";
    const MOCK_PORT = 3101;

    before(()=>{
      //socketIOサーバの起動
      cy.task("start:mock-server", MOCK_PORT);
      return cy.removeAllProjects();
    });

    beforeEach(()=>{
      cy.viewport("macbook-16");
      return cy.createAndOpenProject();
    });

    after(()=>{
      //socketIOサーバの停止
      cy.task("stop:mock-server");
      return cy.removeAllProjects();
    });

    /**
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  試験確認内容：プロパティが表示されることを確認
  分離対象外
     */
    it("プロパティが表示されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 501, 500);
      const DATA_CY_STR = "[data-cy=\"component_property-property-navigation_drawer\"]";
      cy.confirmDisplayInProperty(DATA_CY_STR, true);
    });

    /**
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  name入力
  試験確認内容：nameが入力できることを確認
  分離対象
     */
    it("name入力-nameが入力できることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 501, 500);
      const INPUT_OBJ_CY = "[data-cy=\"component_property-name-text_field\"]";
      //name入力テキストエリアが表示されていることを確認
      cy.confirmDisplayInProperty(INPUT_OBJ_CY, true);
      //nameが入力できることを確認
      cy.confirmInputValueReflection(INPUT_OBJ_CY, "-Test_Task", TAG_TYPE_INPUT, "-Test_Task");
    });

    /**
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  name入力（使用可能文字確認）
  試験確認内容：nameが入力できないことを確認
  分離対象
     */
    it("name入力（使用可能文字確認）-nameが入力できないことを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 501, 500);
      const INPUT_OBJ_CY = "[data-cy=\"component_property-name-text_field\"]";
      cy.confirmInputValueNotReflection(INPUT_OBJ_CY, "Test*Task", TAG_TYPE_INPUT, WHILE_NAME_0);
    });

    /**
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  試験確認内容：説明入力テキストエリアが表示、及び入力ができる事を確認
  分離対象
     */
    it("descriptionが入力できることを確認-テキストエリアが表されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 501, 500);
      const DATA_CY_STR = "[data-cy=\"component_property-description-textarea\"]";
      //説明入力テキストエリアが表示されていることを確認
      cy.confirmDisplayInProperty(DATA_CY_STR, true);
      //descriptionが入力できることを確認
      cy.confirmInputValueReflection(DATA_CY_STR, "descriptionTest", TAG_TYPE_TEXT_AREA, WHILE_NAME_0);
    });

    /**
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  input files表示
  試験確認内容：input files入力テキストエリアが表示されていることを確認
  分離対象
     */
    it("input files表示-input files入力テキストエリアが表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 501, 500);
      const DATA_CY_STR = "[data-cy=\"component_property-input_files-list_form\"]";
      const CLICK_AREA_CY = "[data-cy=\"component_property-in_out_files-panel_title\"]";
      cy.confirmDisplayInPropertyByDetailsArea(DATA_CY_STR, CLICK_AREA_CY, null);
    });

    /**
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  input files入力
  試験確認内容：input filesが入力できることを確認
  分離対象
     */
    it("input files入力-input filesが入力できることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 501, 500);
      cy.enterInputOrOutputFile(TYPE_INPUT, "testInputFile", true, false);
      cy.get("[data-cy=\"component_property-input_files-list_form\"]").find("input")
        .should("have.value", "testInputFile");
    });

    /**
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  input files反映確認
  試験確認内容：input filesが反映されることを確認
  分離対象外
     */
    it("input files反映確認-input filesが反映されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 501, 500);
      cy.enterInputOrOutputFile(TYPE_INPUT, "testInputFile", true, true);
      cy.get("[data-cy=\"graph-component-row\"]").contains("testInputFile")
        .should("exist");
    });

    /**
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  output files表示
  試験確認内容：output files入力テキストエリアが表示されていることを確認
  分離対象
     */
    it("output files表示-output files入力テキストエリアが表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 501, 500);
      const DATA_CY_STR = "[data-cy=\"component_property-output_files-list_form\"]";
      const CLICK_AREA_CY = "[data-cy=\"component_property-in_out_files-panel_title\"]";
      cy.confirmDisplayInPropertyByDetailsArea(DATA_CY_STR, CLICK_AREA_CY, null);
    });

    /**
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  output files入力
  試験確認内容：output filesが入力できることを確認
  分離対象
     */
    it("output files入力-output filesが入力できることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 501, 500);
      cy.enterInputOrOutputFile(TYPE_OUTPUT, "testOutputFile", true, false);
      cy.get("[data-cy=\"component_property-output_files-list_form\"]").find("input")
        .should("have.value", "testOutputFile");
    });

    /**
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  output files反映確認
  試験確認内容：output filesが反映されることを確認
  分離対象外
     */
    it("output files反映確認-output filesが反映されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 501, 500);
      cy.enterInputOrOutputFile(TYPE_OUTPUT, "testOutputFile", true, true);
      cy.get("[data-cy=\"graph-component-row\"]").contains("testOutputFile")
        .should("exist");
    });

    /**
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  構成要素の機能確認
  closeボタン押下
  試験確認内容：プロパティが表示されていないことを確認
  分離対象外
     */
    it("構成要素の機能確認-closeボタン押下-プロパティが表示されていないことを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 501, 500);
      cy.closeProperty();
      cy.get("[data-cy=\"component_property-property-navigation_drawer\"]").should("not.exist");
    });

    /**
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  構成要素の機能確認
  cleanボタン押下
  試験確認内容：最新の保存状態に戻っていることを確認
  skip:issue#948
  分離対象外
     */
    it.skip("構成要素の機能確認-cleanボタン押下-最新の保存状態に戻っていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 501, 500);
      cy.createDirOrFile(TYPE_FILE, "test-a", true);
      cy.get("[data-cy=\"component_property-condition-setting_title\"]").click();
      let targetDropBoxCy = "[data-cy=\"component_property-condition_use_javascript-autocomplete\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 3, "test-a");
      cy.get("[data-cy=\"workflow-play-btn\"]").click();
      cy.clickComponentName(WHILE_NAME_0);
      cy.get("[data-cy=\"component_property-name-text_field\"]").find("input")
        .clear();
      cy.get("[data-cy=\"component_property-name-text_field\"]").type("changeName");
      cy.get("[data-cy=\"component_property-description-textarea\"]").find("textarea")
        .focus();
      cy.get("[data-cy=\"component_property-clean-btn\"]").click();
      cy.get("[data-cy=\"component_property-name-text_field\"]").find("input")
        .should("have.value", WHILE_NAME_0);
    });

    /**
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  接続確認
  試験確認内容：コンポーネントが接続されていることを確認
  分離対象外
     */
    it("ファイル転送設定の各パターンの確認-接続確認-コンポーネントが接続されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 501, 500);
      cy.enterInputOrOutputFile(TYPE_OUTPUT, "testOutputFile", true, true);
      cy.get("[data-cy=\"component_property-close-btn\"]").click(); //Close property panel
      cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_1, 501, 600);
      cy.get("[data-cy=\"component_property-close-btn\"]").click(); //Close second component property panel
      cy.connectComponentMultiple(WHILE_NAME_0, WHILE_NAME_1); //コンポーネント同士を接続
      cy.checkConnectionLine(WHILE_NAME_0, WHILE_NAME_1); //作成したコンポーネントの座標を取得して接続線の座標と比較
    });

    /**
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除ボタン表示確認（input file）
  試験確認内容：削除ボタンが表示されることを確認
  分離対象
     */
    it("転送対象ファイル・フォルダの設定-削除ボタン表示確認（input file）-削除ボタンが表示されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 501, 500);
      cy.enterInputOrOutputFile(TYPE_INPUT, "testInputFile", true, true);
      cy.get("[data-cy=\"action_row-delete-btn\"]").should("be.visible");
    });

    /**
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除ボタン表示確認（output file）
  試験確認内容：削除ボタンが表示されることを確認
  分離対象
     */
    it("転送対象ファイル・フォルダの設定-削除ボタン表示確認（output file）-削除ボタンが表示されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 501, 500);
      cy.enterInputOrOutputFile(TYPE_OUTPUT, "testOutputFile", true, true);
      cy.get("[data-cy=\"action_row-delete-btn\"]").should("be.visible");
    });

    /**
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除反映確認（input file）
  試験確認内容：input fileが削除されていることを確認
  分離対象外
     */
    it("転送対象ファイル・フォルダの設定-削除反映確認（input file）-input fileが削除されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 501, 500);
      cy.enterInputOrOutputFile(TYPE_INPUT, "testInputFile", true, true);
      cy.get("[data-cy=\"action_row-delete-btn\"]").click();
      cy.get("[data-cy=\"graph-component-row\"]").contains("testInputFile")
        .should("not.exist");
    });

    /**
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除反映確認（output file）
  試験確認内容：output fileが削除されていることを確認
  分離対象外
     */
    it("転送対象ファイル・フォルダの設定-削除反映確認（output file）-output fileが削除されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 501, 500);
      cy.enterInputOrOutputFile(TYPE_OUTPUT, "testOutputFile", true, true);
      cy.get("[data-cy=\"action_row-delete-btn\"]").click();
      cy.get("[data-cy=\"graph-component-row\"]").contains("testOutputFile")
        .should("not.exist");
    });

    /**
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ単体表示
  試験確認内容：ディレクトリが単体表示されることを確認
  分離対象外
     */
    it("ファイル操作エリア-ディレクトリ単体表示-ディレクトリが単体表示されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 501, 500);
      cy.createDirOrFile(TYPE_DIR, "test-a", true);
      cy.createDirOrFile(TYPE_DIR, "test-b", false);
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-a")
        .should("exist");
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-b")
        .should("exist");
    });

    /**
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ複数表示（リロード前）
  試験確認内容：ディレクトリが単体表示されることを確認
  分離対象外
     */
    it("ファイル操作エリア-ディレクトリ複数表示（リロード前）-ディレクトリが単体表示されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 501, 500);
      cy.createDirOrFile(TYPE_DIR, "test1", true);
      cy.createDirOrFile(TYPE_DIR, "test2", false);
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test1")
        .should("exist");
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test2")
        .should("exist");
    });

    /**
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ複数表示（リロード後）
  試験確認内容：ディレクトリが複数表示されることを確認
  分離対象外
     */
    it("ファイル操作エリア-ディレクトリ複数表示（リロード後）-ディレクトリが複数表示されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 501, 500);
      cy.createDirOrFile(TYPE_DIR, "test1", true);
      cy.createDirOrFile(TYPE_DIR, "test2", false);
      cy.closeProperty();
      cy.clickComponentName(WHILE_NAME_0);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test*")
        .should("exist");
      cy.closeProperty();
    });

    /**
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  ファイル操作エリア
  ファイル単体表示
  試験確認内容：ファイルが単体表示されることを確認
  分離対象外
     */
    it("ファイル操作エリア-ファイル単体表示-ファイルが単体表示されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 501, 500);
      cy.createDirOrFile(TYPE_FILE, "test-a", true);
      cy.createDirOrFile(TYPE_FILE, "test-b", false);
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-a")
        .should("exist");
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-b")
        .should("exist");
    });

    /**
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  ファイル操作エリア
  ファイル複数表示（リロード前）
  試験確認内容：ファイルが単体表示されることを確認
  分離対象外
     */
    it("ファイル操作エリア-ファイル複数表示（リロード前）-ファイルが単体表示されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 501, 500);
      cy.createDirOrFile(TYPE_FILE, "test1", true);
      cy.createDirOrFile(TYPE_FILE, "test2", false);
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test1")
        .should("exist");
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test2")
        .should("exist");
    });

    /**
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  ファイル操作エリア
  ファイル複数表示（リロード後）
  試験確認内容：ファイルが複数表示されることを確認
  分離対象外
     */
    it("ファイル操作エリア-ファイル複数表示（リロード後）-ファイルが複数表示されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 501, 500);
      cy.createDirOrFile(TYPE_FILE, "test1", true);
      cy.createDirOrFile(TYPE_FILE, "test2", false);
      cy.closeProperty();
      cy.clickComponentName(WHILE_NAME_0);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test*")
        .should("exist");
      cy.closeProperty();
    });

    /**
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ディレクトリ表示
  試験確認内容：ディレクトリ内にディレクトリが作成されることを確認
  分離対象外
     */
    it("ファイル操作エリア-ディレクトリ内ディレクトリ表示-ディレクトリ内にディレクトリが作成されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 501, 500);
      cy.createDirOrFile(TYPE_DIR, "test-a", true);
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-a")
        .click();
      cy.createDirOrFile(TYPE_DIR, "test-b", false);
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").within(($treeview)=>{
        cy.wrap($treeview).contains("test-a")
          .should("exist");
        cy.wrap($treeview).contains("test-b")
          .should("exist");
      });
    });

    /**
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ファイル表示
  試験確認内容：ディレクトリ内にファイルが作成されることを確認
  分離対象外
     */
    it("ファイル操作エリア-ディレクトリ内ファイル表示-ディレクトリ内にファイルが作成されることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 501, 500);
      cy.createDirOrFile(TYPE_DIR, "test-a", true);
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-a")
        .click();
      cy.createDirOrFile(TYPE_FILE, "test.txt", false);
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test.txt")
        .should("exist");
    });

    /**
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  各コンポーネントの追加/削除確認
  該当コンポーネント削除確認
  試験確認内容：コンポーネントが削除されていることを確認
  ※削除ダイアログ表示後にエラー
  分離対象外
     */
    it("各コンポーネントの追加/削除確認-該当コンポーネント削除確認-コンポーネントが削除されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 501, 500);
      cy.deleteComponent(WHILE_NAME_0);
      cy.get("[data-cy=\"graph-component-row\"]").contains(WHILE_NAME_0)
        .should("not.exist");
    });

    /**
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  プロパティ設定確認
  シェルスクリプト選択セレクトボックス表示確認
  試験確認内容：シェルスクリプト選択セレクトボックスが表示されていることを確認
  分離対象
     */
    it("プロパティ設定確認-シェルスクリプト選択セレクトボックス表示確認-シェルスクリプト選択セレクトボックスが表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-condition-setting_title\"]").click();
      cy.get("[data-cy=\"component_property-condition_use_javascript-autocomplete\"]").find("input")
        .should("exist");
    });

    /**
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  プロパティ設定確認
  シェルスクリプト選択セレクトボックス選択確認
  試験確認内容：選択した値が表示されていることを確認
  ※test-aの存在確認で失敗。itemの4つ目を確認しているから(?)
  分離対象外
     
     */
    it("プロパティ設定確認-シェルスクリプト選択セレクトボックス選択確認-選択した値が表示されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 501, 500);
      cy.createDirOrFile(TYPE_FILE, "test-a", true);
      cy.get("[data-cy=\"component_property-condition-setting_title\"]").click();
      let targetDropBoxCy = "[data-cy=\"component_property-condition_use_javascript-autocomplete\"]";
      cy.get(targetDropBoxCy).find("input")
        .click();
      cy.get("[role=\"listbox\"]").eq(0)
        .contains("test-a")
        .click();
      cy.get("[data-cy=\"component_property-condition_use_javascript-autocomplete\"]").contains("test-a")
        .should("exist");
    });

    /**
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  プロパティ設定確認
  シェルスクリプト選択セレクトボックス選択反映確認
  試験確認内容：選択した値が表示されていることを確
  ※test-aの存在確認で失敗。itemの4つ目を確認しているから(?)認
  分離対象外
     */
    it("プロパティ設定確認-シェルスクリプト選択セレクトボックス選択反映確認-選択した値が反映されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 501, 500);
      cy.createDirOrFile(TYPE_FILE, "test-a", true);
      cy.get("[data-cy=\"component_property-condition-setting_title\"]");
      cy.get("[data-cy=\"component_property-condition-setting_title\"]").click();
      let targetDropBoxCy = "[data-cy=\"component_property-condition_use_javascript-autocomplete\"]";
      cy.get(targetDropBoxCy).find("input")
        .click();
      cy.get("[role=\"listbox\"]").eq(0)
        .contains("test-a")
        .click();
      cy.closeProperty();
      cy.clickComponentName(WHILE_NAME_0);
      cy.get("[data-cy=\"component_property-condition-setting_title\"]").click();
      cy.get("[data-cy=\"component_property-condition_use_javascript-autocomplete\"]").contains("test-a")
        .should("exist");
      cy.closeProperty();
    });

    /**
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  プロパティ設定確認
  javascriptテキストボックス入力確認
  試験確認内容：入力した値が表示されていることを確認
  分離対象
     */
    it("プロパティ設定確認-javascriptテキストボックス表示、入力確認-入力した値が表示、入力できること確認", ()=>{
      cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-condition-setting_title\"]").click();
      cy.get("[data-cy=\"component_property-condition_use_javascript-switch\"]").click();
      cy.get("[data-cy=\"component_property-condition_use_javascript-textarea\"]").within(($textarea)=>{
        //javascriptテキストボックスが表示されていることを確認
        cy.wrap($textarea).should("be.visible");
        //入力した値が表示されていることを確認
        cy.wrap($textarea).type("testJavaScript");
        cy.wrap($textarea).find("textarea")
          .should("have.value", "testJavaScript");
      });
    });

    /**
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  プロパティ設定確認
  javascriptテキストボックス反映確認
  試験確認内容：入力した値が反映されていることを確認
  分離対象外
     */
    it("プロパティ設定確認-javascriptテキストボックス反映確認-入力した値が反映されていることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-condition-setting_title\"]").click();
      cy.get("[data-cy=\"component_property-condition_use_javascript-switch\"]").click();
      cy.get("[data-cy=\"component_property-condition_use_javascript-textarea\"]").type("testJavaScript");
      cy.closeProperty();
      cy.clickComponentName(WHILE_NAME_0);
      cy.get("[data-cy=\"component_property-condition-setting_title\"]").click();
      cy.get("[data-cy=\"component_property-condition_use_javascript-textarea\"]").find("textarea")
        .should("have.value", "testJavaScript");
      cy.closeProperty();
    });

    /**
  コンポーネントの基本機能動作確認
  whileコンポーネント共通機能確認
  各コンポーネント特有のプロパティ確認
  number of instances to keep入力確認
  試験確認内容：number of instances to keepテキストボックスが表示、入力できることを確認
  分離対象外
     */
    it("各コンポーネント特有のプロパティ確認-keep入力確認-keepテキストボックスが表示、入力できることを確認", ()=>{
      cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 501, 500);
      cy.get("[data-cy=\"component_property-condition-setting_title\"]").click();
      cy.get("[data-cy=\"component_property-keep_while-text_field\"]").within(($textfield)=>{
        //keepテキストボックスが表示されていることを確認
        cy.wrap($textfield).should("be.visible");
        //keepテキストボックスが入力できることを確認
        cy.wrap($textfield).type(10);
        cy.wrap($textfield).find("input")
          .should("have.value", 10);
      });

      //プロパティ画面を閉じ、再度開いた時に値が反映されている事を確認する。
      cy.closeProperty();
      cy.clickComponentName(WHILE_NAME_0);
      cy.get("[data-cy=\"component_property-condition-setting_title\"]").click();
      cy.get("[data-cy=\"component_property-keep_while-text_field\"]").find("input")
        .should("have.value", 10);
      cy.closeProperty();
    });
  });
});
