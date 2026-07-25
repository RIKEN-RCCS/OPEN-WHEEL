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
 * @param {string} scriptName - 作成するスクリプトファイル名
 * @param {string} shellText - スクリプトの内容
 */
Cypress.Commands.add("setupWhileWithScriptAndCondition", (scriptName, shellText)=>{
  const scriptEle = "[data-cy=\"component_property-condition_use_javascript-autocomplete\"]";
  //スクリプトファイルを作成・編集（fileBrowserのupdate-itemsイベントでscriptCandidatesが即時更新される）
  cy.scriptMake(scriptName, shellText);
  //saveFileのサーバー応答が完了するまで待機（debounce後のスナックバーで確認）
  cy.waitForSnackbar(new RegExp(`${escapeRegExp(scriptName)}\\s+saved\\s*$`, "i"));
  //Conditionをクリック（プロパティを閉じて再オープン不要）
  cy.get("[data-cy=\"component_property-condition-setting_title\"]").click();
  //v-comboboxの準備完了を待機
  cy.get(scriptEle).find("[role=\"combobox\"]", { timeout: 10000 })
    .should("exist");
  //Conditionにセット
  cy.selectValueFromDropdownList(scriptEle, 3, scriptName);
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
 * ifにスクリプトファイルを作成 condition setting にセット
 * (hasCondition パネルは if/while で共有されているため setupWhileWithScriptAndCondition と同一実装)
 * @param {string} scriptName - 作成するスクリプトファイル名
 * @param {string} shellText - スクリプトの内容
 */
Cypress.Commands.add("setupIfWithConditionScript", (scriptName, shellText)=>{
  const scriptEle = "[data-cy=\"component_property-condition_use_javascript-autocomplete\"]";
  cy.scriptMake(scriptName, shellText);
  cy.waitForSnackbar(new RegExp(`${escapeRegExp(scriptName)}\\s+saved\\s*$`, "i"));
  cy.get("[data-cy=\"component_property-condition-setting_title\"]").click();
  cy.get(scriptEle).find("[role=\"combobox\"]", { timeout: 10000 })
    .should("exist");
  cy.selectValueFromDropdownList(scriptEle, 3, scriptName);
});

/**
 * for 繰り返し設定 (start/end/step)
 */
Cypress.Commands.add("setForLoop", (start, end, step)=>{
  cy.get("[data-cy=\"component_property-loop_set_for-panel_title\"]").scrollIntoView()
    .click();
  cy.get("[data-cy=\"component_property-start_for-text_field\"]").type(start);
  cy.get("[data-cy=\"component_property-end_for-text_field\"]").type(end);
  cy.get("[data-cy=\"component_property-step_for-text_field\"]").type(step);
});

/**
 * ParameterStudy component's "add new target file" dialog: select the nested
 * component in the tree (so the file is associated with it, not with PS itself),
 * type the filename, and confirm.
 * @param {string} componentNameInTree - name of the nested component that owns the file
 * @param {string} filename - target file name (e.g. "run.sh")
 */
Cypress.Commands.add("addTargetFileToPs", (componentNameInTree, filename)=>{
  cy.get("[data-cy=\"target_files-add_target_file-btn\"]").click();
  cy.get(".v-overlay__content").contains("button", componentNameInTree)
    .click({ force: true });
  cy.get("[data-cy=\"target_files-target_file_name-text_field\"]").type(filename);
  cy.get("[data-cy=\"target_files-ok-btn\"]").click();
});

/**
 * Selects `word` inside the target file's text editor tab and adds it as a
 * "list" type PS parameter with the given values.
 * @param {string} word - the literal word already present in the target file to templatize
 * @param {string[]} values - list of values to add for this parameter
 */
Cypress.Commands.add("addListParameter", (word, values)=>{
  //Ace renders each line as one oversized (~1,000,000px wide) .ace_line div with
  //pointer-events:none on its text layer, so neither a plain contains(word).dblclick()
  //(lands on the disabled text layer) nor proportional width math (the line's
  //reported width is bogus) will target the word correctly. Measure the word's
  //real on-screen rect via a DOM Range instead, then dblclick those coordinates
  //without {force:true} so Cypress's real elementFromPoint hit-testing resolves
  //past the disabled text layer to the interactive layer beneath - a raw/forced
  //synthetic dispatch was observed to crash the Ace renderer entirely.
  cy.get("[data-cy=\"rapid-tab-tab_editor\"]").then(($editor)=>{
    cy.window().then((win)=>{
      const editorRect = $editor[0].getBoundingClientRect();
      const lines = [...$editor[0].querySelectorAll(".ace_line")];
      const line = lines.find(($l)=>{
        return $l.textContent.includes(word);
      });
      const textNode = [...line.childNodes].find((n)=>{
        return n.nodeType === win.Node.TEXT_NODE && n.textContent.includes(word);
      });
      const text = textNode.textContent;
      const idx = text.indexOf(word);
      const range = win.document.createRange();
      range.setStart(textNode, idx);
      range.setEnd(textNode, idx + word.length);
      const wordRect = range.getBoundingClientRect();
      const relX = (wordRect.left - editorRect.left) + wordRect.width / 2;
      const relY = (wordRect.top - editorRect.top) + wordRect.height / 2;
      cy.wrap($editor).dblclick(relX, relY);
    });
  });
  cy.get("[data-cy=\"parameter-selected_text-text_field\"]").find("input")
    .should("have.value", word);
  cy.get("[data-cy=\"parameter-add_new_parameter_btn\"]").click();
  cy.selectValueFromDropdownList("[data-cy=\"parameter-parameter_setting-select\"]", 1, "list");
  values.forEach((value)=>{
    cy.get("[data-cy=\"parameter-list-list_form\"]").find("input")
      .type(value);
    cy.get("[data-cy=\"parameter-list-list_form\"]")
      .find("[data-cy=\"list_form-add-text_field\"]")
      .find("[role=\"button\"]")
      .last()
      .click({ force: true });
  });
  cy.get("[data-cy=\"parameter-ok-btn\"]").click();
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
