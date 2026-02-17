/**
 * エスケープ
 * @param {string} s - 対象文字列
 * @returns {string} 修正文字列
 */
function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * タスクにスクリプトファイルを作成 i/oファイルにセット
 */
Cypress.Commands.add("setupTaskWithScriptAndIO", (scriptName, shellText, inputType, ioFileName, target)=>{
  const scriptEle = "[data-cy=\"component_property-script-autocomplete\"]";
  const hostEle = "[data-cy=\"component_property-host-select\"]";

  //シェル作成
  cy.scriptMakeFixed(scriptName, shellText);

  //script でシェル選択
  cy.selectValueFromDropdownList(scriptEle, 3, scriptName);

  //ローカルホスト選択
  cy.selectValueFromDropdownList(hostEle, 3, target);

  //インプットファイル指定
  cy.enterInputOrOutputFile(inputType, ioFileName, true, true);

  //保存確認
  cy.waitForSnackbar(new RegExp(`${escapeRegExp(scriptName)}\\s+saved\\s*$`, "i"));
});

Cypress.Commands.add("waitForSnackbar", (messageRe, options = {})=>{
  const timeout = options.timeout ?? 15000;
  return cy
    .contains("div.v-snackbar__content", messageRe, { timeout })
    .should("be.visible");
});

/**
 * テストで使用するremotehost情報の設定
 */
Cypress.Commands.add("setupRemotehost", (label, hostName)=>{
  const PORT_NUMBER = 22;
  const TEST_USER = "testuser";

  cy.get("[data-cy=\"tool_bar-navi-icon\"]").click();
  cy.get("[data-cy=\"navigation-manage_remote_host-btn\"]").click();
  cy.get("[data-cy=\"remotehost-new_remote_host_setting-btn\"]").click();
  cy.get("[data-cy=\"add_new_host-label-text_field\"]").type(label);
  cy.get("[data-cy=\"add_new_host-hostname-text_field\"]").type(hostName);
  cy.get("[data-cy=\"add_new_host-port_number_label-text_field\"]").type(`{selectall}{backspace}${PORT_NUMBER}`);
  cy.get("[data-cy=\"add_new_host-user_id-text_field\"]").type(TEST_USER);
  //Click on dialog title to trigger blur from all fields
  cy.get("[data-cy=\"add_new_host-add_new_host-card_title\"]").click();
  //Wait for OK button to be enabled
  cy.get("[data-cy=\"add_new_host-ok-btn\"]", { timeout: 1000 }).should("not.be.disabled")
    .click();
  cy.contains("tr", label).find("[data-cy=\"action_row-edit-btn\"]")
    .click();
  cy.get("[data-cy=\"add_new_host-add_new_host-card_title\"]").should("be.visible");
  //ダイアログ内のテキスト確認
  cy.get("[data-cy=\"add_new_host-label-text_field\"]").find("input")
    .should("have.value", label);
  //ダイアログ内のOKボタン
  cy.get("[data-cy=\"add_new_host-ok-btn\"]").click();
});

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
