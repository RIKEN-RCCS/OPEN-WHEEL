describe("jobExecute", ()=>{
  //仮実装中なのでコマンドもここに書いておく
  Cypress.Commands.add(
    "selectDropdownOptionExactScoped",
    (targetDropBoxCy, dropBoxNo, selectVal, options = {})=>{
      const timeout = options.timeout ?? 10000;
      const index = dropBoxNo ?? 0;
      const caseSensitive = options.caseSensitive ?? true;
      const partial = options.partial ?? false;
      const verifyMode = options.verifyMode ?? "auto";
      const nthMatch = options.nthMatch ?? 0;

      const norm = (s)=>{ return (s ?? "").replace(/\s+/g, " ").trim(); };
      const escapeRegExp = (s)=>{ return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); };

      const pattern = partial
        ? new RegExp(escapeRegExp(norm(selectVal)), caseSensitive ? "" : "i")
        : new RegExp(`^${escapeRegExp(norm(selectVal))}$`, caseSensitive ? "" : "i");

      //1) 対象外枠を index で 1 件に限定
      cy.get(targetDropBoxCy, { timeout })
        .should("have.length.at.least", index + 1)
        .eq(index)
        .as("root");

      //2) combobox を 1 件に限定して開く（aria-expanded 同期）
      cy.get("@root")
        .find("[role=\"combobox\"]", { timeout })
        .should("have.length.at.least", 1)
        .first()
        .as("combo")
        .click();

      cy.get("@combo")
        .should("have.attr", "aria-expanded")
        .and("match", /true/i);

      //3) 自分の listbox を aria-controls から特定（1件化）
      cy.get("@combo")
        .invoke("attr", "aria-controls")
        .then((menuId)=>{
          expect(menuId, "aria-controls").to.be.a("string").and.not.be.empty;
          const baseSel = `#${menuId}`;
          const listboxSel = `${baseSel} [role="listbox"], ${baseSel}[role="listbox"]`;

          cy.get(listboxSel, { timeout })
            .should("have.length", 1)
            .as("listbox");

          //4) 完全一致/部分一致で候補を抽出 → .v-list-item をクリック
          cy.get("@listbox")
            .find(".v-list-item, [role=\"option\"]", { timeout })
            .filter((_, el)=>{
              //テキストは .v-list-item-title 優先、なければ el.textContent
              const title
                = el.querySelector(".v-list-item-title")?.textContent
                  ?? el.textContent;
              return pattern.test(norm(title));
            })
            .should("have.length.at.least", nthMatch + 1)
            .eq(nthMatch)
            .scrollIntoView()
            .should("be.visible")
            .click();

          //5) メニューが閉じたことを同期（必要なら）
          cy.get("@combo")
            .should("have.attr", "aria-expanded")
            .and("match", /false/i);
        });

      //6) 選択表示の反映（autocomplete と select の両対応）
      cy.get("@root").within(()=>{
        const verifyAuto = ()=>{
          //a) input[role="combobox"] の value で一致
          cy.get("input[role=\"combobox\"]", { timeout })
            .should("have.length.at.least", 1)
            .first()
            .invoke("val")
            .then((val)=>{ return expect(pattern.test(norm(String(val)))).to.be.true; });
        };

        const verifySelectionText = ()=>{
          cy.get(".v-autocomplete__selection-text, .v-select__selection-text", { timeout })
            .should("have.length.at.least", 1)
            .first()
            .invoke("text")
            .then((txt)=>{ return expect(pattern.test(norm(txt))).to.be.true; });
        };

        if (verifyMode === "input") {
          verifyAuto();
        } else if (verifyMode === "selectionText") {
          verifySelectionText();
        } else {
          //auto: どちらでも通るよう二段構え
          cy.wrap(null).then(()=>{
            let verified = false;
            return cy
              .get("input[role=\"combobox\"]", { timeout })
              .then(($ins)=>{
                if ($ins.length) {
                  const val = ($ins[0]).value;
                  verified = pattern.test(norm(val));
                }
              })
              .then(()=>{
                if (!verified) {
                  return cy
                    .get(".v-autocomplete__selection-text, .v-select__selection-text", { timeout })
                    .then(($nodes)=>{
                      if ($nodes.length) {
                        const txt = $nodes.eq(0).text();
                        verified = pattern.test(norm(txt));
                      }
                    });
                }
              })
              .then(()=>{
                expect(
                  verified,
                  "selected value reflected either in input value or selection text"
                ).to.be.true;
              });
          });
        }
      });
    }
  );

  //ヘルパー: 正規表現エスケープ
  const escapeRegExp = (s)=>{ return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); };

  Cypress.Commands.add("waitForSnackbar", (messageRe, options = {})=>{
    const timeout = options.timeout ?? 15000;
    return cy
      .contains("div.v-snackbar__content", messageRe, { timeout })
      .should("be.visible");
  });

  Cypress.Commands.add(
    "createShellScript",
    (filename, text)=>{
      //シェルファイル作成 - Files展開
      cy.get("[data-cy=\"component_property-files-panel_title\"]")
        .scrollIntoView()
        .click();
      //シェルファイル作成 - New File クリック
      cy.get("[data-cy=\"file_browser-new_file-btn\"]")
        .scrollIntoView()
        .click();
      //シェルファイル作成 - ファイル名入力
      cy.get("[data-cy=\"file_browser-input-text_field\"]").type(filename);
      //シェルファイル作成 - OK押下
      cy.get("[data-cy=\"versatile_dialog_Create_new_File-ok-btn\"]").click();
      //シェルファイル作成 - シェルファイル選択
      cy.contains(".v-list-item__content", filename)
        .scrollIntoView()
        .should("be.visible")
        .click();
      //シェルファイル作成 - edit 押下
      cy.get("[data-cy=\"file_browser-edit_files-btn\"]").click();
      //シェルファイル作成 - シェルの実行内容入力
      cy.get("#editor")
        .should("have.class", "ace_editor")
        .click()
        .find("textarea.ace_text-input")
        .should("exist")
        .type("{selectall}{backspace}", { force: true })
        .type(text, { force: true });
      //シェルファイル作成 - 閉じるボタン押下
      cy.get("[data-cy=\"workflow-text_editor_close-btn\"]").click();
      //シェルファイル作成 - 変更内容を保存
      cy.contains("button", /^keep changes$/i)
        .scrollIntoView()
        .should("be.visible")
        .and("not.be.disabled")
        .click();

      //保存確認
      cy.waitForSnackbar(new RegExp(`${escapeRegExp(filename)}\\s+saved\\s*$`, "i"));

      //待機
      cy.wait(300);
    }
  );

  const DEF_COMPONENT_TASK = "task";
  const TASK_NAME_0 = "task0";
  const TASK_NAME_1 = "task1";

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
    const text = `echo "hello" > ~/test_output_pbs.txt && hostname >> ~/test_output_pbs.txt`;

    cy.createShellScript(filename, text);

    //script でシェルファイル選択
    const scriptEle = "[data-cy=\"component_property-script-autocomplete\"]";
    cy.selectDropdownOptionExactScoped(scriptEle, 0, filename);

    //ローカルホスト選択
    const hostEle = "[data-cy=\"component_property-host-select\"]";
    cy.selectDropdownOptionExactScoped(hostEle, 0, "localhost");

    //プロパティを閉じる
    cy.closeProperty();

    //　2つ目
    cy.createComponent(DEF_COMPONENT_TASK, TASK_NAME_1, 501, 700);

    cy.createShellScript(filename, text);

    //script でシェルファイル選択
    cy.selectDropdownOptionExactScoped(scriptEle, 0, filename);

    //ローカルホスト選択
    cy.selectDropdownOptionExactScoped(hostEle, 0, "localhost");

    ////プロパティを閉じる
    cy.closeProperty();

    cy.connectComponentMultiple(TASK_NAME_0, TASK_NAME_1); //コンポーネント同士を接続

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
