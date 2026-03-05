/**
 * 正規表現で使えるようにメタ文字をエスケープする
 * @param {string} s - 対象文字列
 * @returns {string} エスケープ済み文字列
 */
function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * whileにスクリプトファイルを作成 Conditionにセット
 */
Cypress.Commands.add("setupWhileWithScriptAndCondition", (scriptName, shellText)=>{
  const scriptEle = "[data-cy=\"component_property-condition_use_javascript-autocomplete\"]";
  //シェル作成
  cy.scriptMake(scriptName, shellText);
  //Conditionをクリック
  cy.get("[data-cy=\"component_property-condition-setting_title\"]").click();
  //Conditionにセット
  cy.selectValueFromDropdownList(scriptEle, 3, scriptName);
  //保存確認
  cy.waitForSnackbar(new RegExp(`${escapeRegExp(scriptName)}\\s+saved\\s*$`, "i"));
});

/**
 * taskにスクリプトファイルを作成 i/oファイルにセット
 */
Cypress.Commands.add("setupTaskWithScriptAndIO", (scriptName, shellText, inputType, ioFileName, target)=>{
  const scriptEle = "[data-cy=\"component_property-script-autocomplete\"]";
  const hostEle = "[data-cy=\"component_property-host-select\"]";

  //シェル作成
  cy.scriptMake(scriptName, shellText);

  //script でシェル選択
  cy.selectValueFromDropdownList(scriptEle, 3, scriptName);

  //ローカルホスト選択
  cy.selectValueFromDropdownList(hostEle, 3, target);

  //インプットファイル指定
  cy.enterInputOrOutputFile(inputType, ioFileName, true, true);

  //保存確認
  cy.waitForSnackbar(new RegExp(`${escapeRegExp(scriptName)}\\s+saved\\s*$`, "i"));
});

/**
 * ファイル保存待機
 */
Cypress.Commands.add("waitForSnackbar", (messageRe, options = {})=>{
  const timeout = options.timeout ?? 15000;
  return cy
    .contains("div.v-snackbar__content", messageRe, { timeout })
    .should("be.visible");
});

/**
 * foreach 繰り返し設定
 */
Cypress.Commands.add("setForeachLoop", (length)=>{
  cy.get("[data-cy=\"component_property-loop_set_foreach-panel_title\"]").scrollIntoView()
    .click();

  for (let index = 0; index < length; index++) {
    cy.get("[data-cy=\"component_property-index_foreach-list_form\"]").find("input")
      .type(index);
    cy.get("[data-cy=\"list_form-add-text_field\"]").find("[role=\"button\"]")
      .eq(1)
      .click();
  }
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
