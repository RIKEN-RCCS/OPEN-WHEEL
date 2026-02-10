describe("jobExecute", ()=>{
  //仮実装中なのでコマンドもここに書いておく
  Cypress.Commands.add(
    "selectDropdownOptionExactScoped",
    (targetDropBoxCy, dropBoxNo, selectVal, options = {})=>{
      const timeout = options.timeout ?? 10000;
      const index = dropBoxNo ?? 0;

      //1) 対象外枠を index で 1 件に限定
      cy.get(targetDropBoxCy, { timeout })
        .should("have.length.at.least", index + 1)
        .eq(index)
        .as("root");

      //2) combobox を 1 件に限定して開く
      cy.get("@root")
        .find(".v-field[role=\"combobox\"], [role=\"combobox\"]", { timeout })
        .first() //← 念のため 1 件化
        .as("combo")
        .click({ force: true });

      //3) 自分の listbox を :visible で 1 件に限定
      cy.get("@combo").invoke("attr", "aria-controls")
        .then((menuId)=>{
          expect(menuId, "aria-controls").to.be.a("string").and.not.be.empty;

          const listboxSel = `#${menuId} [role="listbox"]:visible, #${menuId}[role="listbox"]:visible`;
          cy.get(listboxSel, { timeout }).should("have.length", 1);

          //4) 完全一致で候補を 1 件に限定してクリック
          cy.get(listboxSel)
            .find(".v-list-item, .v-list-item-title, .v-list-item__content")
            .filter((_, el)=>{ return el.textContent?.trim() === selectVal; })
            .should("have.length.at.least", 1)
            .first()
            .scrollIntoView()
            .should("be.visible")
            .click({ force: true });
        });

      //5) 選択表示の反映（autocomplete と select の両対応）
      cy.get("@root").within(()=>{
        cy.get(".v-autocomplete__selection-text, .v-select__selection-text", { timeout })
          .should("have.length.at.least", 1)
          .first()
          .should("have.text", selectVal);
      });
    }
  );

  const DEF_COMPONENT_TASK = "task";
  const TASK_NAME_0 = "task0";

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
    localhostでのタスク実行
    現状実行完了までを確認
    ファイルの生成の確認方法を検討中
   */
  it("localhostでのタスク実行", ()=>{
    cy.createComponent(DEF_COMPONENT_TASK, TASK_NAME_0, 501, 500);

    //シェルファイル作成
    const filename = "test.sh";
    //シェルファイル作成 - Files展開
    cy.get("[data-cy=\"component_property-files-panel_title\"]", { timeout: 10000 })
      .scrollIntoView()
      .click({ force: true });
    //シェルファイル作成 - New File クリック
    cy.get("[data-cy=\"file_browser-new_file-btn\"]", { timeout: 10000 })
      .scrollIntoView()
      .click({ force: true });
    //シェルファイル作成 - ファイル名入力
    cy.get("[data-cy=\"file_browser-input-text_field\"]").type(filename);
    //シェルファイル作成 - OK押下
    cy.get("[data-cy=\"versatile_dialog_Create_new_File-ok-btn\"]", { timeout: 10000 }).click({ force: true });
    //シェルファイル作成 - シェルファイル選択
    cy.contains(".v-list-item__content", filename, { timeout: 10000 })
      .scrollIntoView()
      .should("be.visible")
      .click();
    //シェルファイル作成 - edit 押下
    cy.get("[data-cy=\"file_browser-edit_files-btn\"]").click({ force: true });
    //シェルファイル作成 - シェルの実行内容入力
    const text = `echo "hello" > ~/test_output_pbs.txt && hostname >> ~/test_output_pbs.txt`;
    cy.get("#editor", { timeout: 10000 })
      .should("have.class", "ace_editor")
      .click()
      .find("textarea.ace_text-input")
      .should("exist")
      .type("{selectall}{backspace}", { force: true })
      .type(text, { force: true });
    //シェルファイル作成 - 閉じるボタン押下
    cy.get("[data-cy=\"workflow-text_editor_close-btn\"]").click();
    //シェルファイル作成 - 変更内容を保存
    cy.contains("button", /^keep changes$/i, { timeout: 1000 })
      .scrollIntoView()
      .should("be.visible")
      .and("not.be.disabled")
      .click();

    //script でシェルファイル選択
    const scriptEle = "[data-cy=\"component_property-script-autocomplete\"]";
    cy.selectDropdownOptionExactScoped(scriptEle, 0, filename);

    //ローカルホスト選択
    const hostEle = "[data-cy=\"component_property-host-select\"]";
    cy.selectDropdownOptionExactScoped(hostEle, 0, "localhost");

    //プロパティを閉じる
    cy.get("[data-cy=\"component_property-close-btn\"]").scrollIntoView();

    //タスク実行
    cy.get("[data-cy=\"workflow-play-btn\"]").click();

    //完了まち
    cy.get("[data-cy=\"workflow-project_state-btn\"] .v-btn__content", { timeout: 30000 })
      .should(($el)=>{
        const text = $el.text().trim()
          .replace(/\s+/g, " ");
        expect(text).to.eq("status: finished");
      });
  });
});
