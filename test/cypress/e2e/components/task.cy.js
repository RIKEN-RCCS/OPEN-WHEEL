describe("components", ()=>{
  describe("task", ()=>{
    const TYPE_INPUT = "input";
    const TYPE_OUTPUT = "output";
    const TYPE_DIR = "dir";
    const TYPE_FILE = "file";
    const DEF_COMPONENT_TASK = "task";
    const TASK_NAME_0 = "task0";
    const TASK_NAME_1 = "task1";
    const TAG_TYPE_INPUT = "input";
    const TAG_TYPE_TEXT_AREA = "textarea";
    const COMPONENT_TEST_LABEL = "componentTestLabel";

    before(()=>{
      return cy.removeAllProjects();
    });

    beforeEach(()=>{
      cy.viewport("macbook-16");
      return cy.createAndOpenProject()
        .createComponent(DEF_COMPONENT_TASK, TASK_NAME_0, 501, 500);
    });

    afterEach(()=>{
      return cy.goHome();
    });

    after(()=>{
      return cy.removeAllProjects();
    });

    /**
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  試験確認内容：プロパティが表示されることを確認
     */
    it("プロパティが表示されることを確認", ()=>{
      const DATA_CY_STR = "[data-cy=\"component_property-property-navigation_drawer\"]";
      cy.confirmDisplayInProperty(DATA_CY_STR, true);
    });

    /**
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  試験確認内容：name入力テキストエリアが表示されていることを確認
     */
    it("name入力テキストエリアが表示されていることを確認", ()=>{
      const DATA_CY_STR = "[data-cy=\"component_property-name-text_field\"]";
      cy.confirmDisplayInProperty(DATA_CY_STR, true);
    });

    /**
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  name入力
  試験確認内容：nameが入力できることを確認
     */
    it("name入力-nameが入力できることを確認", ()=>{
      const INPUT_OBJ_CY = "[data-cy=\"component_property-name-text_field\"]";
      cy.confirmInputValueReflection(INPUT_OBJ_CY, "-Test_Task", TAG_TYPE_INPUT, "-Test_Task");
    });

    /**
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  name入力（使用可能文字確認）
  試験確認内容：nameが入力できないことを確認
     */
    it("name入力（使用可能文字確認）-nameが入力できないことを確認", ()=>{
      const INPUT_OBJ_CY = "[data-cy=\"component_property-name-text_field\"]";
      cy.confirmInputValueNotReflection(INPUT_OBJ_CY, "Test*Task", TAG_TYPE_INPUT, TASK_NAME_0);
    });

    /**
   Task コンポーネントの基本機能動作確認
   コンポーネント共通機能確認
   試験確認内容：説明入力テキストエリアが表示されていることを確認
     */
    it("description入力テキストエリアが表示されていることを確認", ()=>{
      const DATA_CY_STR = "[data-cy=\"component_property-description-textarea\"]";
      cy.confirmDisplayInProperty(DATA_CY_STR, true);
    });

    /**
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  description入力
  試験確認内容：descriptionが入力できることを確認
     */
    it("description入力-descriptionが入力できることを確認", ()=>{
      const INPUT_OBJ_CY = "[data-cy=\"component_property-description-textarea\"]";
      cy.confirmInputValueReflection(INPUT_OBJ_CY, "descriptionTest", TAG_TYPE_TEXT_AREA, TASK_NAME_0);
    });

    /**
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  input files表示
  試験確認内容：input files入力テキストエリアが表示されていることを確認
     */
    it("input files表示-input files入力テキストエリアが表示されていることを確認", ()=>{
      const DATA_CY_STR = "[data-cy=\"component_property-input_files-list_form\"]";
      const CLICK_AREA_CY = "[data-cy=\"component_property-in_out_files-panel_title\"]";
      cy.confirmDisplayInPropertyByDetailsArea(DATA_CY_STR, CLICK_AREA_CY, null);
    });

    /**
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  input files入力
  試験確認内容：input filesが入力できることを確認
     */
    it("input files入力-input filesが入力できることを確認", ()=>{
      cy.enterInputOrOutputFile(TYPE_INPUT, "testInputFile", true, false);
      cy.get("[data-cy=\"component_property-input_files-list_form\"]").find("input")
        .should("have.value", "testInputFile");
    });

    /**
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  input files反映確認
  試験確認内容：input filesが反映されることを確認
     */
    it("input files反映確認-input filesが反映されることを確認", ()=>{
      cy.enterInputOrOutputFile(TYPE_INPUT, "testInputFile", true, true);
      cy.get("[data-cy=\"graph-component-row\"]").contains("testInputFile")
        .should("exist");
    });

    /**
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  output files表示
  試験確認内容：output files入力テキストエリアが表示されていることを確認
     */
    it("output files表示-output files入力テキストエリアが表示されていることを確認", ()=>{
      cy.get("[data-cy=\"component_property-in_out_files-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-output_files-list_form\"]").find("input")
        .should("exist");
    });

    /**
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  output files入力
  試験確認内容：output filesが入力できることを確認
     */
    it("output files入力-output filesが入力できることを確認", ()=>{
      cy.enterInputOrOutputFile(TYPE_OUTPUT, "testOutputFile", true, false);
      cy.get("[data-cy=\"component_property-output_files-list_form\"]").find("input")
        .should("have.value", "testOutputFile");
    });

    /**
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  output files反映確認
  試験確認内容：output filesが反映されることを確認
     */
    it("output files反映確認-output filesが反映されることを確認", ()=>{
      cy.enterInputOrOutputFile(TYPE_OUTPUT, "testOutputFile", true, true);
      cy.get("[data-cy=\"graph-component-row\"]").contains("testOutputFile")
        .should("exist");
    });

    /**
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  input/outputラベル表示
  試験確認内容：input filesとoutput filesにそれぞれ見分けられるラベルが表示されていることを確認
     */
    it("input/outputラベル表示-input filesとoutput filesのラベルがそれぞれ表示されることを確認", ()=>{
      const CLICK_AREA_CY = "[data-cy=\"component_property-in_out_files-panel_title\"]";
      const INPUT_LABEL_CY = "[data-cy=\"component_property-input_files-label\"]";
      const OUTPUT_LABEL_CY = "[data-cy=\"component_property-output_files-label\"]";
      cy.get(CLICK_AREA_CY).scrollIntoView()
        .click();
      //the expansion-panel enter animation applies overflow:hidden while running,
      //so retry the scroll+visibility check together until the animation settles
      cy.get(INPUT_LABEL_CY).should(($el)=>{
        $el[0].scrollIntoView({ behavior: "instant" });
        expect(Cypress.dom.isVisible($el[0]), "input files label should be visible after scroll").to.be.true;
      });
      cy.get(INPUT_LABEL_CY).should("contain.text", "input file");
      cy.get(OUTPUT_LABEL_CY).should(($el)=>{
        $el[0].scrollIntoView({ behavior: "instant" });
        expect(Cypress.dom.isVisible($el[0]), "output files label should be visible after scroll").to.be.true;
      });
      cy.get(OUTPUT_LABEL_CY).should("contain.text", "output file");
    });

    /**
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  構成要素の機能確認
  closeボタン押下
  試験確認内容：プロパティが表示されていないことを確認
     */
    it("構成要素の機能確認-closeボタン押下-プロパティが表示されていないことを確認", ()=>{
      cy.closeProperty();
      cy.get("[data-cy=\"component_property-property-navigation_drawer\"]").should("not.exist");
    });

    /**
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  構成要素の機能確認
  clean component実行
  試験確認内容：最新の保存状態に戻っていることを確認
  skip:issue#948
     */
    it("構成要素の機能確認-clean component実行-最新の保存状態に戻っていることを確認", ()=>{
      cy.closeProperty();
      cy.prepareCleanComponentTest(TASK_NAME_0);
      cy.get("[data-cy=\"graph-component-row\"]").contains(TASK_NAME_0)
        .rightclick();
      cy.get("[data-cy=\"graph-component-row\"]").contains("clean")
        .click();
      cy.contains("button", "discard all changes").click();
      cy.clickComponentName(TASK_NAME_0);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").scrollIntoView()
        .click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").should("not.contain.text", "_clean_test_marker.txt");
      cy.closeProperty();
      cy.get("[data-cy=\"graph-component-row\"]").contains(TASK_NAME_0)
        .rightclick();
      cy.get("[data-cy=\"graph-component-row\"]").contains("delete")
        .should("be.visible");
      cy.get("body").type("{esc}");
    });

    /**
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  接続確認
  試験確認内容：コンポーネントが接続されていることを確認
     */
    it("ファイル転送設定の各パターンの確認-接続確認-コンポーネントが接続されていることを確認", ()=>{
      cy.enterInputOrOutputFile(TYPE_OUTPUT, "testOutputFile", true, true);
      cy.createComponent(DEF_COMPONENT_TASK, TASK_NAME_1, 501, 600);
      cy.closeProperty();
      cy.connectComponentMultiple(TASK_NAME_0, TASK_NAME_1); //コンポーネント同士を接続
      cy.checkConnectionLine(TASK_NAME_0, TASK_NAME_1); //作成したコンポーネントの座標を取得して接続線の座標と比較
    });

    /**
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  シンポリックリンク確認（outputFile、inputFile一致）
  試験確認内容：シンポリックリンクが作成されていることを確認
     */
    it("ファイル転送設定の各パターンの確認-シンポリックリンク確認（outputFile、inputFile一致）-シンポリックリンクが作成されていることを確認", ()=>{
      //task0
      cy.createDirOrFile(TYPE_FILE, "run.sh", true);
      let targetDropBoxCy = "[data-cy=\"component_property-script-autocomplete\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 3, "run.sh");
      cy.enterInputOrOutputFile(TYPE_OUTPUT, "run.sh", true, true);
      //task1
      cy.createComponent(DEF_COMPONENT_TASK, TASK_NAME_1, 501, 600);
      cy.closeProperty();
      cy.clickComponentName(TASK_NAME_1);
      cy.createDirOrFile(TYPE_FILE, "test-b", true);
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-b")
        .should("exist");
      cy.enterInputOrOutputFile(TYPE_INPUT, "run.sh", true, true);
      cy.selectValueFromDropdownList(targetDropBoxCy, 3, "test-b");
      cy.closeProperty();
      cy.connectComponentMultiple(TASK_NAME_0, TASK_NAME_1); //コンポーネント同士を接続
      cy.checkConnectionLine(TASK_NAME_0, TASK_NAME_1); //作成したコンポーネントの座標を取得して接続線の座標と比較
      cy.clickComponentName(TASK_NAME_1);
      cy.get("[data-cy=\"workflow-play-btn\"]").click(); //Taskコンポーネントを実行する
      cy.checkProjectStatus("finished");
      cy.clickComponentName(TASK_NAME_1);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("run.sh")
        .should("exist");
      cy.closeProperty();
    });

    /**
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  シンポリックリンク確認（outputFileが通常、inputFileが空白）
  試験確認内容：シンポリックリンクが作成されていることを確認
     */
    it("ファイル転送設定の各パターンの確認-シンポリックリンク確認（outputFileが通常、inputFileが空白）-シンポリックリンクが作成されていることを確認", ()=>{
      //task0
      cy.createDirOrFile(TYPE_FILE, "run.sh", true);
      let targetDropBoxCy = "[data-cy=\"component_property-script-autocomplete\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 3, "run.sh");
      cy.enterInputOrOutputFile(TYPE_OUTPUT, "run.sh", true, true);
      //task1
      cy.createComponent(DEF_COMPONENT_TASK, TASK_NAME_1, 501, 600);
      cy.closeProperty();
      cy.clickComponentName(TASK_NAME_1);
      cy.createDirOrFile(TYPE_FILE, "test-b", true);
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-b")
        .should("exist");
      cy.selectValueFromDropdownList(targetDropBoxCy, 3, "test-b");
      cy.closeProperty();
      cy.connectComponentMultiple(TASK_NAME_0, TASK_NAME_1); //コンポーネント同士を接続
      cy.checkConnectionLine(TASK_NAME_0, TASK_NAME_1); //作成したコンポーネントの座標を取得して接続線の座標と比較
      cy.clickComponentName(TASK_NAME_1);
      cy.get("[data-cy=\"workflow-play-btn\"]").click(); //Taskコンポーネントを実行する
      cy.checkProjectStatus("finished");
      cy.clickComponentName(TASK_NAME_1);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("run.sh")
        .should("exist");
      cy.closeProperty();
    });

    /**
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  シンポリックリンク確認（outputFileが通常、inputFileが「/」で終わらない文字列）
  試験確認内容：シンポリックリンクが作成されていることを確認
     */
    it("ファイル転送設定の各パターンの確認-シンポリックリンク確認（outputFileが通常、inputFileが「/」で終わらない文字列）-シンポリックリンクが作成されていることを確認", ()=>{
      //task0
      cy.createDirOrFile(TYPE_FILE, "run.sh", true);
      let targetDropBoxCy = "[data-cy=\"component_property-script-autocomplete\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 3, "run.sh");
      cy.enterInputOrOutputFile(TYPE_OUTPUT, "run.sh", true, true);
      //task1
      cy.createComponent(DEF_COMPONENT_TASK, TASK_NAME_1, 501, 600);
      cy.closeProperty();
      cy.clickComponentName(TASK_NAME_1);
      cy.createDirOrFile(TYPE_FILE, "test-b", true);
      cy.selectValueFromDropdownList(targetDropBoxCy, 3, "test-b");
      cy.closeProperty();
      cy.connectComponentMultiple(TASK_NAME_0, TASK_NAME_1); //コンポーネント同士を接続
      cy.checkConnectionLine(TASK_NAME_0, TASK_NAME_1); //作成したコンポーネントの座標を取得して接続線の座標と比較
      cy.clickComponentName(TASK_NAME_1);
      cy.get("[data-cy=\"component_property-in_out_files-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-input_files-list_form\"]").contains("run.sh")
        .click();
      cy.get("[data-cy=\"list_form_property-text_field\"]").find("input")
        .clear()
        .type("task1.sh{enter}"); //inputFileの値を変更
      cy.closeProperty();
      cy.get("[data-cy=\"workflow-play-btn\"]").click(); //Taskコンポーネントを実行する
      cy.checkProjectStatus("finished");
      cy.clickComponentName(TASK_NAME_1);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("task1.sh")
        .should("exist");
      cy.closeProperty();
    });

    /**
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  シンポリックリンク確認（outputFileがglob(*や?など)を含むパス、inputFileが「/」で終わらない文字列）
  試験確認内容：シンポリックリンクが作成されていることを確認
     */

    it("ファイル転送設定の各パターンの確認-シンポリックリンク確認（outputFileがglob(*や?など)を含むパス、inputFileが「/」で終わらない文字列）-シンポリックリンクが作成されていることを確認", ()=>{
      //task0
      cy.createDirOrFile(TYPE_FILE, "run-a.sh", true);
      cy.createDirOrFile(TYPE_FILE, "run-b.sh", false);
      let targetDropBoxCy = "[data-cy=\"component_property-script-autocomplete\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 3, "run-a.sh");
      cy.enterInputOrOutputFile(TYPE_OUTPUT, "run*", true, true);
      //task1
      cy.createComponent(DEF_COMPONENT_TASK, TASK_NAME_1, 501, 600);
      cy.closeProperty();
      cy.clickComponentName(TASK_NAME_1);
      cy.createDirOrFile(TYPE_FILE, "test-b", true);
      cy.selectValueFromDropdownList(targetDropBoxCy, 3, "test-b");
      cy.closeProperty();
      cy.connectComponentMultiple(TASK_NAME_0, TASK_NAME_1); //コンポーネント同士を接続
      cy.checkConnectionLine(TASK_NAME_0, TASK_NAME_1); //作成したコンポーネントの座標を取得して接続線の座標と比較
      cy.clickComponentName(TASK_NAME_1);
      cy.get("[data-cy=\"component_property-in_out_files-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-input_files-list_form\"]").contains("./")
        .click();
      cy.get("[data-cy=\"list_form_property-text_field\"]").find("input")
        .clear()
        .type("task1-run{enter}"); //inputFileの値を変更
      cy.closeProperty();
      cy.get("[data-cy=\"workflow-play-btn\"]").click(); //Taskコンポーネントを実行する
      cy.checkProjectStatus("finished");
      cy.clickComponentName(TASK_NAME_1);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("task1-run")
        .should("exist")
        .click();
      cy.contains("[data-cy=\"file_browser-treeview-treeview\"]", "run-a.sh", { timeout: 15000 })
        .should("exist");
      cy.contains("[data-cy=\"file_browser-treeview-treeview\"]", "run-b.sh", { timeout: 15000 })
        .should("exist");
      cy.closeProperty();
    });

    /**
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  ファイル転送設定の各パターンの確認
  シンポリックリンク確認（input filesが’/’で終わる文字列のとき）
  試験確認内容：シンポリックリンクが作成されていることを確認
     */
    it("ファイル転送設定の各パターンの確認-シンポリックリンク確認（input filesが’/’で終わる文字列のとき）-シンポリックリンクが作成されていることを確認", ()=>{
      //task0
      cy.createDirOrFile(TYPE_FILE, "run-a.sh", true);
      let targetDropBoxCy = "[data-cy=\"component_property-script-autocomplete\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 3, "run-a.sh");
      cy.enterInputOrOutputFile(TYPE_OUTPUT, "run-a.sh", true, true);
      //task1
      cy.createComponent(DEF_COMPONENT_TASK, TASK_NAME_1, 501, 600);
      cy.closeProperty();
      cy.clickComponentName(TASK_NAME_1);
      cy.createDirOrFile(TYPE_FILE, "test-b", true);
      cy.selectValueFromDropdownList(targetDropBoxCy, 3, "test-b");
      cy.closeProperty();
      cy.connectComponentMultiple(TASK_NAME_0, TASK_NAME_1); //コンポーネント同士を接続
      cy.checkConnectionLine(TASK_NAME_0, TASK_NAME_1); //作成したコンポーネントの座標を取得して接続線の座標と比較
      cy.clickComponentName(TASK_NAME_1);
      cy.get("[data-cy=\"component_property-in_out_files-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-input_files-list_form\"]").contains("run-a.sh")
        .click();
      cy.get("[data-cy=\"list_form_property-text_field\"]").find("input")
        .clear()
        .type("task1-run/{enter}"); //inputFileの値を変更
      cy.closeProperty();
      cy.get("[data-cy=\"workflow-play-btn\"]").click(); //Taskコンポーネントを実行する
      cy.checkProjectStatus("finished");
      cy.clickComponentName(TASK_NAME_1);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("task1-run")
        .should("exist")
        .click();
      cy.contains("[data-cy=\"file_browser-treeview-treeview\"]", "run-a.sh", { timeout: 15000 })
        .should("exist");
      cy.closeProperty();
    });

    /**
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除ボタン表示確認（input file）
  試験確認内容：削除ボタンが表示されることを確認
     */
    it("転送対象ファイル・フォルダの設定-削除ボタン表示確認（input file）-削除ボタンが表示されることを確認", ()=>{
      cy.enterInputOrOutputFile(TYPE_INPUT, "testInputFile", true, true);
      cy.get("[data-cy=\"action_row-delete-btn\"]").should("be.visible");
    });

    /**
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除ボタン表示確認（output file）
  試験確認内容：削除ボタンが表示されることを確認
     */
    it("転送対象ファイル・フォルダの設定-削除ボタン表示確認（output file）-削除ボタンが表示されることを確認", ()=>{
      cy.enterInputOrOutputFile(TYPE_OUTPUT, "testOutputFile", true, true);
      cy.get("[data-cy=\"action_row-delete-btn\"]").scrollIntoView()
        .should("be.visible");
    });

    /**
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除反映確認（input file）
  試験確認内容：input fileが削除されていることを確認
     */
    it("転送対象ファイル・フォルダの設定-削除反映確認（input file）-input fileが削除されていることを確認", ()=>{
      cy.enterInputOrOutputFile(TYPE_INPUT, "testInputFile", true, true);
      cy.get("[data-cy=\"action_row-delete-btn\"]").click();
      cy.get("[data-cy=\"graph-component-row\"]").contains("testInputFile")
        .should("not.exist");
    });

    /**
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除反映確認（output file）
  試験確認内容：output fileが削除されていることを確認
     */
    it("転送対象ファイル・フォルダの設定-削除反映確認（output file）-output fileが削除されていることを確認", ()=>{
      cy.enterInputOrOutputFile(TYPE_OUTPUT, "testOutputFile", true, true);
      cy.get("[data-cy=\"action_row-delete-btn\"]").click();
      cy.get("[data-cy=\"graph-component-row\"]").contains("testOutputFile")
        .should("not.exist");
    });

    /**
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ単体表示
  試験確認内容：ディレクトリが単体表示されることを確認
     */
    it("ファイル操作エリア-ディレクトリ単体表示-ディレクトリが単体表示されることを確認", ()=>{
      cy.createDirOrFile(TYPE_DIR, "test-a", true);
      cy.createDirOrFile(TYPE_DIR, "test-b", false);
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-a")
        .should("exist");
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-b")
        .should("exist");
    });

    /**
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ複数表示（リロード前）
  試験確認内容：ディレクトリが単体表示されることを確認
     */
    it("ファイル操作エリア-ディレクトリ複数表示（リロード前）-ディレクトリが単体表示されることを確認", ()=>{
      cy.createDirOrFile(TYPE_DIR, "test1", true);
      cy.createDirOrFile(TYPE_DIR, "test2", false);
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test1")
        .should("exist");
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test2")
        .should("exist");
    });

    /**
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ複数表示（リロード後）
  試験確認内容：ディレクトリが複数表示されることを確認
     */
    it("ファイル操作エリア-ディレクトリ複数表示（リロード後）-ディレクトリが複数表示されることを確認", ()=>{
      cy.createDirOrFile(TYPE_DIR, "test1", true);
      cy.createDirOrFile(TYPE_DIR, "test2", false);
      cy.closeProperty();
      cy.clickComponentName(TASK_NAME_0);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test*")
        .should("exist");
      cy.closeProperty();
    });

    /**
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  ファイル操作エリア
  ファイル単体表示
  試験確認内容：ファイルが単体表示されることを確認
     */
    it("ファイル操作エリア-ファイル単体表示-ファイルが単体表示されることを確認", ()=>{
      cy.createDirOrFile(TYPE_FILE, "test-a", true);
      cy.createDirOrFile(TYPE_FILE, "test-b", false);
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-a")
        .should("exist");
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-b")
        .should("exist");
    });

    /**
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  ファイル操作エリア
  ファイル複数表示（リロード前）
  試験確認内容：ファイルが単体表示されることを確認
     */
    it("ファイル操作エリア-ファイル複数表示（リロード前）-ファイルが単体表示されることを確認", ()=>{
      cy.createDirOrFile(TYPE_FILE, "test1", true);
      cy.createDirOrFile(TYPE_FILE, "test2", false);
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test1")
        .should("exist");
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test2")
        .should("exist");
    });

    /**
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  ファイル操作エリア
  ファイル複数表示（リロード後）
  試験確認内容：ファイルが複数表示されることを確認
     */
    it("ファイル操作エリア-ファイル複数表示（リロード後）-ファイルが複数表示されることを確認", ()=>{
      cy.createDirOrFile(TYPE_FILE, "test1", true);
      cy.createDirOrFile(TYPE_FILE, "test2", false);
      cy.closeProperty();
      cy.clickComponentName(TASK_NAME_0);
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test*")
        .should("exist");
      cy.closeProperty();
    });

    /**
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ディレクトリ表示
  試験確認内容：ディレクトリ内にディレクトリが作成されることを確認
     */
    it("ファイル操作エリア-ディレクトリ内ディレクトリ表示-ディレクトリ内にディレクトリが作成されることを確認", ()=>{
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
  Task コンポーネントの基本機能動作確認
  コンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ファイル表示
  試験確認内容：ディレクトリ内にファイルが作成されることを確認
     */
    it("ファイル操作エリア-ディレクトリ内ファイル表示-ディレクトリ内にファイルが作成されることを確認", ()=>{
      cy.createDirOrFile(TYPE_DIR, "test-a", true);
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test-a")
        .click();
      cy.createDirOrFile(TYPE_FILE, "test.txt", false);
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("test.txt")
        .should("exist");
    });

    /**
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  script表示確認
  試験確認内容：scriptセレクトボックスが表示されていることを確認
     */
    it("プロパティ設定確認-script表示確認-scriptセレクトボックスが表示されていることを確認", ()=>{
      const DATA_CY_STR = "[data-cy=\"component_property-script-autocomplete\"]";
      cy.confirmDisplayInProperty(DATA_CY_STR, true);
    });

    /**
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  scriptファイル選択表示確認
  試験確認内容：scriptセレクトボックスで選択したファイルが表示されていることを確認
     */
    it("プロパティ設定確認-scriptファイル選択表示確認-scriptセレクトボックスで選択したファイルが表示されていることを確認", ()=>{
      cy.createDirOrFile(TYPE_FILE, "test-a", true);
      let targetDropBoxCy = "[data-cy=\"component_property-script-autocomplete\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 3, "test-a");
      cy.get("[data-cy=\"component_property-script-autocomplete\"]").find("input")
        .should("have.value", "test-a");
    });

    /**
   Task コンポーネントの基本機能動作確認
   Taskコンポーネント機能確認
   プロパティ設定確認
   checker script表示確認
   試験確認内容：checker scriptセレクトボックスが表示されていることを確認
     */
    it("プロパティ設定確認-checker script表示確認-checker scriptセレクトボックスが表示されていることを確認", ()=>{
      cy.get("[data-cy=\"component_property-advanced-panel_title\"]").click();
      const DATA_CY_STR = "[data-cy=\"component_property-checker-autocomplete\"]";
      cy.confirmDisplayInProperty(DATA_CY_STR, true);
    });

    /**
   Task コンポーネントの基本機能動作確認
   Taskコンポーネント機能確認
   プロパティ設定確認
   checker scriptファイル選択表示確認
   試験確認内容：checker scriptセレクトボックスで選択したファイルが表示されていることを確認
     */
    it("プロパティ設定確認-checker scriptファイル選択表示確認-checker scriptセレクトボックスで選択したファイルが表示されていることを確認", ()=>{
      cy.get("[data-cy=\"component_property-advanced-panel_title\"]").click();
      cy.createDirOrFile(TYPE_FILE, "test-checker", true);
      let targetDropBoxCy = "[data-cy=\"component_property-checker-autocomplete\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 3, "test-checker");
      cy.get("[data-cy=\"component_property-checker-autocomplete\"]").find("input")
        .should("have.value", "test-checker");
    });

    /**
   Task コンポーネントの基本機能動作確認
   Taskコンポーネント機能確認
   プロパティ設定確認
   source script表示確認
   試験確認内容：source scriptセレクトボックスが表示されていることを確認
   不具合内容：プロパティのsource scriptテキストボックスが非活性となっていない(4-1.)
     */
    it("プロパティ設定確認-source script表示確認-source scriptセレクトボックスが表示されていることを確認", ()=>{
      cy.get("[data-cy=\"component_property-job_scheduler-switch\"]")
        .find("input[type=\"checkbox\"]")
        .click();
      const DATA_CY_STR = "[data-cy=\"component_property-source_script-text_field\"]";
      cy.confirmDisplayInProperty(DATA_CY_STR, true);
      cy.get(DATA_CY_STR).first()
        .find("input")
        .should("not.be.disabled");
    });

    /**
   Task コンポーネントの基本機能動作確認
   Taskコンポーネント機能確認
   プロパティ設定確認
   source scriptファイル選択表示確認
   試験確認内容：source scriptセレクトボックスで選択したファイルが表示されていることを確認
   不具合内容：プロパティのsource scriptリストボックスがテキストボックスとして実装されているためNG(4-3.)
     */
    it("プロパティ設定確認-source scriptファイル選択表示確認-source scriptセレクトボックスで選択したファイルが表示されていることを確認", ()=>{
      const SWITCH_CY = "[data-cy=\"component_property-job_scheduler-switch\"]";
      const FIELD_CY = "[data-cy=\"component_property-source_script-text_field\"]";
      cy.get(SWITCH_CY).find("input")
        .click({ force: true });
      cy.createDirOrFile(TYPE_FILE, "env.sh", true);
      cy.get(FIELD_CY).first()
        .find("input")
        .type("env.sh");
      cy.get(FIELD_CY).first()
        .find("input")
        .should("have.value", "env.sh");
      cy.get(SWITCH_CY).find("input")
        .click({ force: true });
      cy.get(FIELD_CY).should("not.exist");
    });

    /**
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  scriptファイル選択反映確認
  試験確認内容：scriptセレクトボックスで選択したファイルが反映されていることを確認
  skip: save処理中にテストが終了してafterEach内でプロジェクトを削除するためファイルが残り後続のテストがエラーになる
     */
    it("プロパティ設定確認-scriptファイル選択反映確認-scriptセレクトボックスで選択したファイルが反映されていることを確認", ()=>{
      cy.createDirOrFile(TYPE_FILE, "test-a", true);
      let targetDropBoxCy = "[data-cy=\"component_property-script-autocomplete\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 3, "test-a");
      cy.saveProperty();
      cy.get("[data-cy=\"component_property-script-autocomplete\"]").find("input")
        .should("have.value", "test-a");
    });

    /**
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  host表示確認
  試験確認内容：hostセレクトボックスが表示されていることを確認
     */
    it("プロパティ設定確認-host表示確認-hostセレクトボックスが表示されていることを確認", ()=>{
      const DATA_CY_STR = "[data-cy=\"component_property-host-select\"]";
      cy.confirmDisplayInProperty(DATA_CY_STR, true);
    });

    /**
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  host初期表示確認
  試験確認内容：localhostが表示されていることを確認
     */
    it("プロパティ設定確認-host初期表示確認-localhostが表示されていることを確認", ()=>{
      cy.get("[data-cy=\"component_property-host-select\"]").find("input")
        .should("have.value", "localhost");
    });

    /**
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  host選択確認（localhost以外を選択）
  試験確認内容：hostセレクトボックスで選択した値が表示されていることを確認
     */
    it("プロパティ設定確認-host選択確認（localhost以外を選択）-hostセレクトボックスで選択した値が表示されていることを確認", ()=>{
      cy.selectValueFromDropdownList("[data-cy=\"component_property-host-select\"]", 2, COMPONENT_TEST_LABEL);
      cy.get("[data-cy=\"component_property-host-select\"]").contains(COMPONENT_TEST_LABEL)
        .should("exist");
    });

    /**
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  host選択確認（localhost以外を選択）
  試験確認内容：hostセレクトボックスで選択した値が反映されていることを確認
     */
    it("プロパティ設定確認-hostファイル選択表示確認-hostセレクトボックスで選択したファイルが表示されていることを確認", ()=>{
      cy.selectValueFromDropdownList("[data-cy=\"component_property-host-select\"]", 2, COMPONENT_TEST_LABEL);
      cy.get("[data-cy=\"component_property-host-select\"]").contains(COMPONENT_TEST_LABEL)
        .should("exist");
    });

    /**
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  host選択反映確認（localhost選択）
  試験確認内容：localhostが設定されていることを確認
     */
    it("プロパティ設定確認-host選択反映確認（localhost選択）-localhostが設定されていることを確認", ()=>{
      cy.get("[data-cy=\"component_property-host-select\"]").type("localhost");
      cy.get("[data-cy=\"component_property-host-select\"]").contains("localhost")
        .should("exist");
    });

    /**
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  use job schedulerスイッチボタン表示確認
  試験確認内容：use job schedulerスイッチボタンが表示されていることを確認
     */
    it("プロパティ設定確認-use job schedulerスイッチボタン表示確認-use job schedulerスイッチボタンが表示されていることを確認", ()=>{
      const DATA_CY_STR = "[data-cy=\"component_property-job_scheduler-switch\"]";
      cy.confirmDisplayInProperty(DATA_CY_STR, true);
    });

    /**
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  queue表示確認（無効）
  試験確認内容：queueセレクトボックスが無効となっていることを確認
     */
    it("プロパティ設定確認-queue表示確認（無効）-queueセレクトボックスが無効となっていることを確認", ()=>{
      cy.get("[data-cy=\"component_property-queue-select\"]").should("not.exist");
    });

    /**
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  queue表示確認（有効）
  試験確認内容：queueセレクトボックスが有効となっていることを確認
     */
    it("プロパティ設定確認-queue表示確認（有効）-queueセレクトボックスが有効となっていることを確認", ()=>{
      cy.get("[data-cy=\"component_property-job_scheduler-switch\"]").find("input")
        .click();
      cy.get("[data-cy=\"component_property-queue-select\"]").find("input")
        .should("be.not.disabled");
    });

    /**
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  queue選択確認
  試験確認内容：queueセレクトボックスに選択した値が表示されていることを確認
     */
    it("プロパティ設定確認-queue選択確認-queueセレクトボックスに選択した値が表示されていることを確認", ()=>{
      let targetDropBoxCy = "[data-cy=\"component_property-host-select\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 2, COMPONENT_TEST_LABEL);
      cy.get("[data-cy=\"component_property-job_scheduler-switch\"]").find("input")
        .click();
      targetDropBoxCy = "[data-cy=\"component_property-queue-select\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 2, "testQueues");
      cy.get("[data-cy=\"component_property-queue-select\"]").find("input")
        .should("have.value", "testQueues");
    });

    /**
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  queue選択反映確認
  試験確認内容：queueセレクトボックスに選択した値が反映されていることを確認
     */
    it("プロパティ設定確認-queue選択反映確認-queueセレクトボックスに選択した値が反映されていることを確認", ()=>{
      let targetDropBoxCy = "[data-cy=\"component_property-host-select\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 2, COMPONENT_TEST_LABEL);
      cy.get("[data-cy=\"component_property-job_scheduler-switch\"]").find("input")
        .click();
      targetDropBoxCy = "[data-cy=\"component_property-queue-select\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 2, "testQueues");
      cy.saveProperty();
      cy.get("[data-cy=\"component_property-queue-select\"]").find("input")
        .should("have.value", "testQueues");
    });

    /**
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  submit command表示確認（無効）
  試験確認内容：submit commandテキストボックスが無効となっていることを確認
     */
    it("プロパティ設定確認-submit command表示確認（無効）-submit commandテキストボックスが無効となっていることを確認", ()=>{
      cy.get("[data-cy=\"component_property-submit_command-text_field\"]").should("not.exist");
    });

    /**
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  submit command表示確認（有効）
  試験確認内容：submit commandテキストボックスが有効となっていることを確認
     */
    it("プロパティ設定確認-submit command表示確認（有効）-submit commandテキストボックスが有効となっていることを確認", ()=>{
      cy.get("[data-cy=\"component_property-job_scheduler-switch\"]").find("input")
        .click();
      cy.get("[data-cy=\"component_property-submit_command-text_field\"]").find("input")
        .should("be.not.disabled");
    });

    /**
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  submit command反映確認
  試験確認内容：リモートホストのジョブ投入コマンドが表示されていることを確認
     */
    it("プロパティ設定確認-submit command反映確認-リモートホストのジョブ投入コマンドが表示されていることを確認", ()=>{
      cy.clickComponentName(TASK_NAME_0);
      let targetDropBoxCy = "[data-cy=\"component_property-host-select\"]";
      cy.get("[data-cy=\"component_property-job_scheduler-switch\"]")
        .find("input[type=\"checkbox\"]")
        .click();
      cy.selectValueFromDropdownList(targetDropBoxCy, 2, COMPONENT_TEST_LABEL);
      cy.saveProperty();
      cy.get("[data-cy=\"component_property-submit_command-text_field\"]").find("input")
        .should("have.value", "qsub");
      cy.closeProperty();
    });

    /**
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  submit option表示確認（無効）
  試験確認内容：submit optionテキストボックスが無効となっていることを確認
  不具合内容：プロパティのsubmit optionテキストボックスが非活性となっていない(4-2.)
     */
    it("プロパティ設定確認-submit option表示確認（無効）-submit optionテキストボックスが無効となっていることを確認", ()=>{
      cy.get("[data-cy=\"component_property-submit_option-text_field\"]")
        .should("not.exist");
    });

    /**
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  submit option表示確認（有効）
  試験確認内容：submit optionテキストボックスが有効となっていることを確認
     */
    it("プロパティ設定確認-submit option表示確認（有効）-submit optionテキストボックスが有効となっていることを確認", ()=>{
      cy.get("[data-cy=\"component_property-job_scheduler-switch\"]").find("input")
        .click();
      cy.get("[data-cy=\"component_property-submit_option-text_field\"]").find("input")
        .should("be.not.disabled");
    });

    /**
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  submit command反映確認
  試験確認内容：submit optionテキストボックスに入力した値が設定されていることを確認
  skip: save処理中にテストが終了してafterEach内でプロジェクトを削除するためファイルが残り後続のテストがエラーになる
     */
    it("プロパティ設定確認-submit command反映確認-submit optionテキストボックスに入力した値が設定されていることを確認", ()=>{
      cy.get("[data-cy=\"component_property-job_scheduler-switch\"]").find("input")
        .click();
      cy.get("[data-cy=\"component_property-submit_option-text_field\"]").type("testSubmitCommand");
      cy.saveProperty();
      cy.clickComponentName(TASK_NAME_0);
      cy.get("[data-cy=\"component_property-submit_option-text_field\"]").find("input")
        .should("have.value", "testSubmitCommand");
      cy.closeProperty();
    });

    /**
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  number of retry表示確認
  試験確認内容：number of retryテキストボックスが表示されていることを確認
     */
    it("プロパティ設定確認-number of retry表示確認-number of retryテキストボックスが表示されていることを確認", ()=>{
      cy.get("[data-cy=\"component_property-advanced-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-number_or_retry-text_field\"]").should("be.visible");
    });

    /**
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  number of retry入力確認
  試験確認内容：number of retryテキストボックスに入力した値が表示されていることを確認
     */
    it("プロパティ設定確認-number of retry入力確認-number of retryテキストボックスに入力した値が表示されていることを確認", ()=>{
      cy.get("[data-cy=\"component_property-advanced-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-number_or_retry-text_field\"]").type(10);
      cy.get("[data-cy=\"component_property-number_or_retry-text_field\"]").find("input")
        .should("have.value", 10);
    });

    /**
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  number of retry入力反映確認
  試験確認内容：number of retryテキストボックスに入力した値が反映されていることを確認
     */
    it("プロパティ設定確認-number of retry入力反映確認-number of retryテキストボックスに入力した値が反映されていることを確認", ()=>{
      cy.get("[data-cy=\"component_property-advanced-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-number_or_retry-text_field\"]").type(10);
      cy.saveProperty();
      cy.closeProperty();
      cy.clickComponentName(TASK_NAME_0);
      cy.get("[data-cy=\"component_property-advanced-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-number_or_retry-text_field\"]").find("input")
        .should("have.value", 10);
      cy.closeProperty();
    });

    /**
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  シェルスクリプト選択セレクトボックス表示確認
  試験確認内容：シェルスクリプト選択セレクトボックスが表示されていることを確認
     */
    it("プロパティ設定確認-シェルスクリプト選択セレクトボックス表示確認-シェルスクリプト選択セレクトボックスが表示されていることを確認", ()=>{
      cy.get("[data-cy=\"component_property-advanced-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-task_use_javascript-autocomplete\"]").find("input")
        .should("exist");
    });

    /**
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  シェルスクリプト選択セレクトボックス選択確認
  試験確認内容：選択した値が表示されていることを確認
     */
    it("プロパティ設定確認-シェルスクリプト選択セレクトボックス選択確認-選択した値が表示されていることを確認", ()=>{
      cy.createDirOrFile(TYPE_FILE, "test-a", true);
      cy.get("[data-cy=\"component_property-advanced-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-task_use_javascript-autocomplete\"]").find("input")
        .type("test-a");
      cy.get("[data-cy=\"component_property-task_use_javascript-autocomplete\"]").find("input")
        .should("have.value", "test-a");
    });

    /**
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  シェルスクリプト選択セレクトボックス選択反映確認
  試験確認内容：選択した値が表示されていることを確認
     */
    it("プロパティ設定確認-シェルスクリプト選択セレクトボックス選択反映確認-選択した値が反映されていることを確認", ()=>{
      cy.createDirOrFile(TYPE_FILE, "test-a", true);
      cy.get("[data-cy=\"component_property-files-panel_title\"]")
        .find(".v-expansion-panel-title__overlay")
        .click();
      cy.get("[data-cy=\"component_property-basic-panel_title\"]")
        .find(".v-expansion-panel-title__overlay")
        .click();
      cy.get("[data-cy=\"component_property-advanced-panel_title\"]").click();
      const targetDropBox = "[data-cy=\"component_property-task_use_javascript-autocomplete\"] input";
      cy.selectValueFromDropdownList(targetDropBox, 0, "test-a");
      cy.saveProperty();
      cy.closeProperty();
      cy.clickComponentName(TASK_NAME_0);
      cy.get("[data-cy=\"component_property-basic-panel_title\"]")
        .find(".v-expansion-panel-title__overlay")
        .click();
      cy.get("[data-cy=\"component_property-advanced-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-task_use_javascript-autocomplete\"]")
        .invoke("text")
        .then((text)=>{
          expect(text).to.include("test-a");
        });
      cy.closeProperty();
    });

    /**
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  javascriptテキストボックス表示確認
  試験確認内容：javascriptテキストボックスが表示されていることを確認
     */
    it("プロパティ設定確認-javascriptテキストボックス表示確認-javascriptテキストボックスが表示されていることを確認", ()=>{
      cy.get("[data-cy=\"component_property-advanced-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-task_use_javascript-switch\"]").click();
      cy.get("[data-cy=\"component_property-task_use_javascript-textarea\"]").should("be.visible");
    });

    /**
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  javascriptテキストボックス入力確認
  試験確認内容：入力した値が表示されていることを確認
     */
    it("プロパティ設定確認-javascriptテキストボックス入力確認-入力した値が表示されていることを確認", ()=>{
      cy.get("[data-cy=\"component_property-advanced-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-task_use_javascript-switch\"]").click();
      cy.get("[data-cy=\"component_property-task_use_javascript-textarea\"]").type("testJavaScript");
      cy.get("[data-cy=\"component_property-task_use_javascript-textarea\"]").find("textarea")
        .should("have.value", "testJavaScript");
    });

    /**
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  javascriptテキストボックス反映確認
  試験確認内容：入力した値が反映されていることを確認
     */
    it("プロパティ設定確認-javascriptテキストボックス反映確認-入力した値が反映されていることを確認", ()=>{
      cy.get("[data-cy=\"component_property-advanced-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-task_use_javascript-switch\"]").click();
      cy.get("[data-cy=\"component_property-task_use_javascript-textarea\"]").type("testJavaScript");
      cy.saveProperty();
      cy.closeProperty();
      cy.clickComponentName(TASK_NAME_0);
      cy.get("[data-cy=\"component_property-advanced-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-task_use_javascript-textarea\"]").find("textarea")
        .should("have.value", "testJavaScript");
      cy.closeProperty();
    });

    /**
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  include表示確認
  試験確認内容：includeテキストボックスが表示されていることを確認
     */
    it("プロパティ設定確認-include表示確認-includeテキストボックスが表示されていることを確認", ()=>{
      let targetDropBoxCy = "[data-cy=\"component_property-host-select\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 2, COMPONENT_TEST_LABEL);
      cy.get("[data-cy=\"component_property-remote_file-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-include-list_form\"]").should("be.visible");
    });

    /**
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  include入力確認
  試験確認内容：入力した値が表示されていることを確認
     */
    it("プロパティ設定確認-include入力確認-入力した値が表示されていることを確認", ()=>{
      let targetDropBoxCy = "[data-cy=\"component_property-host-select\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 2, COMPONENT_TEST_LABEL);
      cy.get("[data-cy=\"component_property-remote_file-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-include-list_form\"]").find("input")
        .type("includeTest");
      cy.get("[data-cy=\"component_property-include-list_form\"]").find("input")
        .should("have.value", "includeTest");
    });

    /**
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  include入力反映確認
  試験確認内容：入力した値が反映されていることを確認
     */
    it("プロパティ設定確認-include入力反映確認-入力した値が反映されていることを確認", ()=>{
      let targetDropBoxCy = "[data-cy=\"component_property-host-select\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 2, COMPONENT_TEST_LABEL);
      cy.get("[data-cy=\"component_property-remote_file-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-include-list_form\"]").find("input")
        .type("includeTest{enter}");
      cy.saveProperty();
      cy.closeProperty();
      cy.clickComponentName(TASK_NAME_0);
      cy.get("[data-cy=\"component_property-remote_file-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-include-list_form\"]").contains("includeTest")
        .should("exist");
      cy.closeProperty();
    });

    /**
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  exclude表示確認
  試験確認内容：includeテキストボックスが表示されていることを確認
     */
    it("プロパティ設定確認-exclude表示確認-excludeテキストボックスが表示されていることを確認", ()=>{
      let targetDropBoxCy = "[data-cy=\"component_property-host-select\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 2, COMPONENT_TEST_LABEL);
      cy.get("[data-cy=\"component_property-remote_file-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-exclude-list_form\"]").find("input").first().should("exist");
    });

    /**
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  exclude入力確認
  試験確認内容：入力した値が表示されていることを確認
     */
    it("プロパティ設定確認-exclude入力確認-入力した値が表示されていることを確認", ()=>{
      let targetDropBoxCy = "[data-cy=\"component_property-host-select\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 2, COMPONENT_TEST_LABEL);
      cy.get("[data-cy=\"component_property-remote_file-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-exclude-list_form\"]").find("input")
        .type("excludeTest");
      cy.get("[data-cy=\"component_property-exclude-list_form\"]").find("input")
        .should("have.value", "excludeTest");
    });

    /**
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  exclude入力反映確認
  試験確認内容：入力した値が反映されていることを確認
     */
    it("プロパティ設定確認-exclude入力反映確認-入力した値が反映されていることを確認", ()=>{
      let targetDropBoxCy = "[data-cy=\"component_property-host-select\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 2, COMPONENT_TEST_LABEL);
      cy.get("[data-cy=\"component_property-remote_file-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-exclude-list_form\"]").find("input")
        .type("excludeTest{enter}");
      cy.saveProperty();
      cy.closeProperty();
      cy.clickComponentName(TASK_NAME_0);
      cy.get("[data-cy=\"component_property-remote_file-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-exclude-list_form\"]").contains("excludeTest")
        .should("exist");
      cy.closeProperty();
    });

    /**
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  clean up flag表示確認
  試験確認内容：各ラジオボタンが表示されていることを確認
     */
    it("プロパティ設定確認-clean up flag表示確認-各ラジオボタンが表示されていることを確認", ()=>{
      let targetDropBoxCy = "[data-cy=\"component_property-host-select\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 2, COMPONENT_TEST_LABEL);
      cy.get("[data-cy=\"component_property-remote_file-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-remove-radio\"]").find("input")
        .should("exist");
      cy.get("[data-cy=\"component_property-keep-radio\"]").find("input")
        .should("exist");
      cy.get("[data-cy=\"component_property-same-radio\"]").find("input")
        .should("exist");
    });

    /**
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  clean up flag入力確認
  試験確認内容：各ラジオボタンが選択できることを確認
     */
    it("プロパティ設定確認-clean up flag入力確認-各ラジオボタンが選択できることを確認", ()=>{
      let targetDropBoxCy = "[data-cy=\"component_property-host-select\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 2, COMPONENT_TEST_LABEL);
      cy.get("[data-cy=\"component_property-remote_file-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-remove-radio\"]").find("input")
        .click();
      cy.get("[data-cy=\"component_property-remove-radio\"]").find("input")
        .should("be.checked");
      cy.get("[data-cy=\"component_property-keep-radio\"]").find("input")
        .click();
      cy.get("[data-cy=\"component_property-keep-radio\"]").find("input")
        .should("be.checked");
      cy.get("[data-cy=\"component_property-same-radio\"]").find("input")
        .click();
      cy.get("[data-cy=\"component_property-same-radio\"]").find("input")
        .should("be.checked");
    });

    /**
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  clean up flag入力反映確認（remove files）
  試験確認内容：remove filesが設定されていることを確認
     */
    it("プロパティ設定確認-clean up flag入力反映確認（remove files）-remove filesが設定されていることを確認", ()=>{
      let targetDropBoxCy = "[data-cy=\"component_property-host-select\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 2, COMPONENT_TEST_LABEL);
      cy.get("[data-cy=\"component_property-remote_file-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-remove-radio\"]").find("input")
        .click();
      cy.saveProperty();
      cy.closeProperty();
      cy.clickComponentName(TASK_NAME_0);
      cy.get("[data-cy=\"component_property-remote_file-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-remove-radio\"]").find("input")
        .should("be.checked");
      cy.closeProperty();
    });

    /**
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  clean up flag入力反映確認（keep files）
  試験確認内容：keep filesが設定されていることを確認
     */
    it("プロパティ設定確認-clean up flag入力反映確認（keep files）-keep filesが設定されていることを確認", ()=>{
      let targetDropBoxCy = "[data-cy=\"component_property-host-select\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 2, COMPONENT_TEST_LABEL);
      cy.get("[data-cy=\"component_property-remote_file-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-keep-radio\"]").find("input")
        .click();
      cy.saveProperty();
      cy.closeProperty();
      cy.clickComponentName(TASK_NAME_0);
      cy.get("[data-cy=\"component_property-remote_file-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-keep-radio\"]").find("input")
        .should("be.checked");
      cy.closeProperty();
    });

    /**
  Task コンポーネントの基本機能動作確認
  Taskコンポーネント機能確認
  プロパティ設定確認
  clean up flag入力反映確認（same as parent）
  試験確認内容：same as parentが設定されていることを確認
     */
    it("プロパティ設定確認-clean up flag入力反映確認（same as parent）-same as parentが設定されていることを確認", ()=>{
      let targetDropBoxCy = "[data-cy=\"component_property-host-select\"]";
      cy.selectValueFromDropdownList(targetDropBoxCy, 2, COMPONENT_TEST_LABEL);
      cy.get("[data-cy=\"component_property-remote_file-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-same-radio\"]").find("input")
        .click();
      cy.saveProperty();
      cy.closeProperty();
      cy.clickComponentName(TASK_NAME_0);
      cy.get("[data-cy=\"component_property-remote_file-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-same-radio\"]").find("input")
        .should("be.checked");
      cy.closeProperty();
    });
  });
});
