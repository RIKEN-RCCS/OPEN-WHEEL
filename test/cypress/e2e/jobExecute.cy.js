describe("jobExecute", ()=>{
  /**
   * エスケープ
   * @param {string} s - 対象文字列
   * @returns {string} 修正文字列
   */
  function escapeRegExp(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  const animationWaitTime = 500;

  //open file editer fixed
  Cypress.Commands.add("clickFileEditerFixed", ()=>{
    cy.get("[data-cy=\"file_browser-edit_files-btn\"]").click()
      .wait(animationWaitTime);
  });

  //edit script fixed
  Cypress.Commands.add("scriptEditFixed", (scriptName, script)=>{
    cy.contains(scriptName).click();
    cy.clickFileEditerFixed();
    cy.get("#editor").find("textarea")
      .type(script, { force: true });
    //閉じるボタン
    cy.get("[data-cy=\"workflow-text_editor_close-btn\"]").click();
    //変更内容を保存
    cy.contains("button", /^keep changes$/i)
      .scrollIntoView()
      .should("be.visible")
      .and("not.be.disabled")
      .click()
      .wait(animationWaitTime);
  });

  //make script fixed
  Cypress.Commands.add("scriptMakeFixed", (scriptName, script)=>{
    cy.clickFilesTab();
    cy.fileFolderMake("file", scriptName);

    cy.scriptEditFixed(scriptName, script);
    cy.clickFilesTab();
  });

  Cypress.Commands.add("setupTaskWithScriptAndIO", (scriptName, shellText, inputType, ioFileName, target)=>{
    const scriptEle = "[data-cy=\"component_property-script-autocomplete\"]";
    const hostEle = "[data-cy=\"component_property-host-select\"]";

    cy.scriptMakeFixed(scriptName, shellText);

    //保存確認
    cy.waitForSnackbar(new RegExp(`${escapeRegExp(filename)}\\s+saved\\s*$`, "i"));

    //script でシェルファイル選択
    cy.selectValueFromDropdownList(scriptEle, 3, scriptName);

    //ローカルホスト選択
    cy.selectValueFromDropdownList(hostEle, 3, target);

    //インプットファイル指定
    cy.enterInputOrOutputFile(inputType, ioFileName, true, true);
  });

  Cypress.Commands.add("waitForSnackbar", (messageRe, options = {})=>{
    const timeout = options.timeout ?? 15000;
    return cy
      .contains("div.v-snackbar__content", messageRe, { timeout })
      .should("be.visible");
  });

  const TYPE_INPUT = "input";
  const TYPE_OUTPUT = "output";
  const DEF_COMPONENT_TASK = "task";
  const TASK_NAME_0 = "task0";
  const TASK_NAME_1 = "task1";
  const DEF_COMPONENT_FOREACH = "foreach";
  const FOREACH_NAME_0 = "foreach0";

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
         テストで使用するremotehost情報の設定
         事前に設定しておけばよいため自動化は不要の可能性あり
   */
  it.skip("リモートホスト設定作成", ()=>{
    const LABEL = Math.random().toString(36)
      .substring(2, 10);
    const HOST_NAME = "wheel_release_test_server";
    const PORT_NUMBER = 22;
    const TEST_USER = "testuser";

    cy.get("[data-cy=\"tool_bar-navi-icon\"]").click();
    cy.get("[data-cy=\"navigation-manage_remote_host-btn\"]").click();
    cy.get("[data-cy=\"remotehost-new_remote_host_setting-btn\"]").click();
    cy.get("[data-cy=\"add_new_host-label-text_field\"]").type(LABEL);
    cy.get("[data-cy=\"add_new_host-hostname-text_field\"]").type(HOST_NAME);
    cy.get("[data-cy=\"add_new_host-port_number_label-text_field\"]").type(`{selectall}{backspace}${PORT_NUMBER}`);
    cy.get("[data-cy=\"add_new_host-user_id-text_field\"]").type(TEST_USER);
    //Click on dialog title to trigger blur from all fields
    cy.get("[data-cy=\"add_new_host-add_new_host-card_title\"]").click();
    //Wait for OK button to be enabled
    cy.get("[data-cy=\"add_new_host-ok-btn\"]", { timeout: 1000 }).should("not.be.disabled")
      .click();
    cy.contains("tr", LABEL).find("[data-cy=\"action_row-edit-btn\"]")
      .click();
    cy.get("[data-cy=\"add_new_host-add_new_host-card_title\"]").should("be.visible");
    //ダイアログ内のテキスト確認
    cy.get("[data-cy=\"add_new_host-label-text_field\"]").find("input")
      .should("have.value", LABEL);
    //ダイアログ内のOKボタン
    cy.get("[data-cy=\"add_new_host-ok-btn\"]").click();
  });

  /**
   * localhostでのタスク実行
   * 現状実行完了までを確認
   * ファイルの生成の確認方法を検討中
   */
  it("localhostでのタスク実行", ()=>{
    const fileNameTask1 = "task1.sh";
    const fileNameTask2 = "task2.sh";
    const codeTask1 = `echo "test" > message.txt`;
    const codeTask2 = `cat message.txt >/dev/null 2>&1`;

    //foreach作成
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 501, 500);

    //loop設定
    cy.get("[data-cy=\"component_property-loop_set_foreach-panel_title\"]").scrollIntoView()
      .click();
    cy.get("[data-cy=\"component_property-index_foreach-list_form\"]").find("input")
      .type(1);
    cy.get("[data-cy=\"list_form-add-text_field\"]").find("[role=\"button\"]")
      .eq(1)
      .click(); //Add input file button

    //プロパティを閉じる
    cy.closeProperty();

    //foreach作成
    cy.doubleClickComponentName(FOREACH_NAME_0);

    //task 1つ目
    cy.createComponent(DEF_COMPONENT_TASK, TASK_NAME_0, 501, 500);

    //シェル作成
    cy.setupTaskWithScriptAndIO(fileNameTask1, codeTask1, TYPE_OUTPUT, "message.txt", "localhost");

    //プロパティを閉じる
    cy.closeProperty();

    //task 2つ目
    cy.createComponent(DEF_COMPONENT_TASK, TASK_NAME_1, 501, 700);

    //シェル作成
    cy.setupTaskWithScriptAndIO(fileNameTask2, codeTask2, TYPE_INPUT, "message.txt", "localhost");

    //プロパティを閉じる
    cy.closeProperty();

    //コンポーネント同士を接続
    cy.connectComponentMultiple(TASK_NAME_0, TASK_NAME_1);

    //待機
    cy.wait(300);

    //タスク実行
    cy.get("[data-cy=\"workflow-play-btn\"]").click();

    //完了まち
    cy.get("[data-cy=\"workflow-project_state-btn\"]", { timeout: 30000 })
      .should(($el)=>{
        const text = $el.text().trim()
          .replace(/\s+/g, " ");
        expect(text).to.eq("status: finished");
      });
  });
});
