describe("04:コンポーネントの基本機能動作確認", ()=>{
    const projectName = "TestProject"
    const projectDescription = "TestDescription"
    const typeInput = "input"
    const typeOutput = "output"
    const typeDir = "dir"
    const typeFile = "file"
    const defComponentIf = "if"
    const ifName0 = "if0"
    const ifName1 = "if1"
    const tagTypeInput = "input"
    const tagTypeTextArea = "textarea"
  
    beforeEach(()=>{
      cy.createProject(projectName, projectDescription);
      cy.openProject();
      cy.viewport("macbook-16");
    })

    afterEach(()=>{
      cy.removeProject();
    })
    
    /** 
    コンポーネントの基本機能動作確認
    ifコンポーネント共通機能確認
    試験確認内容：プロパティが表示されることを確認
    */
    it("04-01-001:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-プロパティが表示されることを確認", ()=>{
        cy.createComponent(defComponentIf, ifName0, 300, 500);
        const dataCyStr = '[data-cy="component_property-property-navigation_drawer"]';
        cy.dispPropety(dataCyStr, true);        
    });

    /** 
    コンポーネントの基本機能動作確認
    ifコンポーネント共通機能確認
    試験確認内容：name入力テキストエリアが表示されていることを確認
    */
    it("04-01-002:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-name入力テキストエリアが表示されていることを確認", ()=>{
      cy.createComponent(defComponentIf, ifName0, 300, 500);
      const dataCyStr = '[data-cy="component_property-name-text_field"]'
      cy.dispPropety(dataCyStr, true);
    });

    /** 
    コンポーネントの基本機能動作確認
    ifコンポーネント共通機能確認
    name入力
    試験確認内容：nameが入力できることを確認
    */
    it("04-01-003:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-name入力-nameが入力できることを確認", ()=>{
      cy.createComponent(defComponentIf, ifName0, 300, 500);
      const inputObjCy = '[data-cy="component_property-name-text_field"]';
      cy.propetyInputReflected(inputObjCy, '-Test_Task', tagTypeInput);
    });

    /** 
    コンポーネントの基本機能動作確認
    ifコンポーネント共通機能確認
    name入力（使用可能文字確認）
    試験確認内容：nameが入力できないことを確認
    */
    it("04-01-004:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-name入力（使用可能文字確認）-nameが入力できないことを確認", ()=>{
      cy.createComponent(defComponentIf, ifName0, 300, 500);
      const inputObjCy = '[data-cy="component_property-name-text_field"]';
      cy.propetyInputNotConfirmation(inputObjCy, 'Test*Task', tagTypeInput);
    });

   /** 
    コンポーネントの基本機能動作確認
    ifコンポーネント共通機能確認
    試験確認内容：説明入力テキストエリアが表示されていることを確認
    */
    it("04-01-005:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-description入力テキストエリアが表示されていることを確認", ()=>{
      cy.createComponent(defComponentIf, ifName0, 300, 500);
      const dataCyStr = '[data-cy="component_property-description-textarea"]'
      cy.dispPropety(dataCyStr, true);
    });

    /** 
    コンポーネントの基本機能動作確認
    ifコンポーネント共通機能確認
    description入力
    試験確認内容：descriptionが入力できることを確認
    */
    it("04-01-006:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-description入力-descriptionが入力できることを確認", ()=>{
      cy.createComponent(defComponentIf, ifName0, 300, 500);
      const inputObjCy = '[data-cy="component_property-description-textarea"]';
      cy.propetyInputReflected(inputObjCy, 'descriptionTest', tagTypeTextArea);
    });

    /** 
    コンポーネントの基本機能動作確認
    ifコンポーネント共通機能確認
    input files表示
    試験確認内容：input files入力テキストエリアが表示されていることを確認
    */
    it("04-01-007:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-input files表示-input files入力テキストエリアが表示されていることを確認", ()=>{
      cy.createComponent(defComponentIf, ifName0, 300, 500);
      const dataCyStr = '[data-cy="component_property-input_files-list_form"]';
      const clickAreaCy = '[data-cy="component_property-in_out_files-panel_title"]';
      cy.dispPropetyByArea(dataCyStr, clickAreaCy, null);
    });

    /** 
    コンポーネントの基本機能動作確認
    ifコンポーネント共通機能確認
    input files入力
    試験確認内容：input filesが入力できることを確認
    */
    it("04-01-008:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-input files入力-input filesが入力できることを確認", ()=>{
      cy.createComponent(defComponentIf, ifName0, 300, 500);
      cy.inputOrOutputFileInput(typeInput, 'testInputFile', true);
      cy.get('[data-cy="component_property-input_files-list_form"]').find('input').should('have.value', 'testInputFile');
    });

    /** 
    コンポーネントの基本機能動作確認
    ifコンポーネント共通機能確認
    input files反映確認
    試験確認内容：input filesが反映されることを確認
    */
    it("04-01-009:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-input files反映確認-input filesが反映されることを確認", ()=>{
      cy.createComponent(defComponentIf, ifName0, 300, 500);
      cy.inputOrOutputFileInput(typeInput, 'testInputFile', true);
      cy.get('[data-cy="list_form-add-text_field"]').find('[role="button"]').eq(1).click();
      cy.saveProperty();
      cy.get('[data-cy="graph-component-row"]').contains('testInputFile').should('exist');
    });

    /** 
    コンポーネントの基本機能動作確認
    ifコンポーネント共通機能確認
    output files表示
    試験確認内容：output files入力テキストエリアが表示されていることを確認
    */
    it("04-01-0010:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-output files表示-output files入力テキストエリアが表示されていることを確認", ()=>{
      cy.createComponent(defComponentIf, ifName0, 300, 500);
      cy.get('[data-cy="component_property-in_out_files-panel_title"]').click();
      cy.get('[data-cy="component_property-output_files-list_form"]').find('input').should('exist');
    });

    /** 
    コンポーネントの基本機能動作確認
    ifコンポーネント共通機能確認
    output files入力
    試験確認内容：output filesが入力できることを確認
    */
    it("04-01-011:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-output files入力-output filesが入力できることを確認", ()=>{
      cy.createComponent(defComponentIf, ifName0, 300, 500);
      cy.inputOrOutputFileInput(typeOutput, 'testOutputFile', true);
      cy.get('[data-cy="component_property-output_files-list_form"]').find('input').should('have.value', 'testOutputFile');
    });

    /** 
    コンポーネントの基本機能動作確認
    ifコンポーネント共通機能確認
    output files反映確認
    試験確認内容：output filesが反映されることを確認
    */
    it("04-01-012:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-output files反映確認-output filesが反映されることを確認", ()=>{
      cy.createComponent(defComponentIf, ifName0, 300, 500);
      cy.inputOrOutputFileInput(typeOutput, 'testOutputFile', true);
      cy.get('[data-cy="list_form-add-text_field"]').find('[role="button"]').eq(3).click();
      cy.saveProperty();
      cy.get('[data-cy="graph-component-row"]').contains('testOutputFile').should('exist');
    });

    /** 
    コンポーネントの基本機能動作確認
    ifコンポーネント共通機能確認
    構成要素の機能確認
    closeボタン押下
    試験確認内容：プロパティが表示されていないことを確認
    */
    it("04-01-013:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-構成要素の機能確認-closeボタン押下-プロパティが表示されていないことを確認", ()=>{
      cy.createComponent(defComponentIf, ifName0, 300, 500);
      cy.closeProperty();
      cy.get('[data-cy="component_property-property-navigation_drawer"]').should('not.exist');
    });

    /** 
    コンポーネントの基本機能動作確認
    ifコンポーネント共通機能確認
    構成要素の機能確認
    cleanボタン押下
    試験確認内容：最新の保存状態に戻っていることを確認
    */
    it("04-01-014:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-構成要素の機能確認-cleanボタン押下-最新の保存状態に戻っていることを確認", ()=>{
      cy.createComponent(defComponentIf, ifName0, 300, 500);
      cy.dirOrFileInput(typeFile, 'test-a', true);
      cy.get('[data-cy="component_property-condition-setting_title"]').click()
      cy.get('[data-cy="component_property-condition_use_javascript-autocomplete"]').click()
      cy.get("[role=\"listbox\"]").eq(3).contains('test-a').click()
      cy.saveProperty();
      cy.get('[data-cy="workflow-play-btn"]').click();
      cy.clickComponentName(ifName0);
      cy.get('[data-cy="component_property-name-text_field"]').find('input').clear();
      cy.get('[data-cy="component_property-name-text_field"]').type('changeName');
      cy.get('[data-cy="component_property-description-textarea"]').find('textarea').focus();
      cy.get('[data-cy="component_property-clean-btn"]').click();
      cy.get('[data-cy="component_property-name-text_field"]').find('input').should('have.value', 'test-a');
    });

    /** 
    コンポーネントの基本機能動作確認
    ifコンポーネント共通機能確認
    ファイル転送設定の各パターンの確認
    接続確認
    試験確認内容：コンポーネントが接続されていることを確認
    */
    it("04-01-016:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-ファイル転送設定の各パターンの確認-接続確認-コンポーネントが接続されていることを確認", ()=>{
      cy.createComponent(defComponentIf, ifName0, 300, 500);
      cy.get('[data-cy="component_property-in_out_files-panel_title"]').click();
      cy.get('[data-cy="component_property-output_files-list_form"]').find('input').type('testOutputFile');
      cy.get('[data-cy="list_form-add-text_field"]').find('[role="button"]').eq(3).click();
      cy.createComponent(defComponentIf, ifName1, 300, 600);
      cy.get('[data-cy="graph-component-row"]').find("polygon")
      .eq(0)
      .trigger("mousedown", { screenX: 100, screenY: 100 })
      cy.get('[data-cy="graph-component-row"]').contains(ifName1)
      .trigger("mouseup", { screenX: 300, screenY: 600 })
      cy.clickComponentName(ifName1);
      cy.get('[data-cy="component_property-in_out_files-panel_title"]').click();
      cy.get('[data-cy="component-component_group-g"]').filter(':contains(' + ifName0 + ')').find('[data-cy="iofilebox-rect-rect"]').as("start_rect");
      cy.get('@start_rect').invoke('attr', 'x').as("start_x");
      cy.get('@start_rect').invoke('attr', 'y').as("start_y");
      cy.get('@start_rect').invoke('attr', 'width').as("start_width");
      cy.get('@start_rect').invoke('attr', 'height').as("start_height");
      cy.get('[data-cy="component-component_group-g"]').filter(':contains(' + ifName1 + ')').find('[data-cy="iofilebox-rect-rect"]').as("end_rect");
      cy.get('@end_rect').invoke('attr', 'x').as("end_x");
      cy.get('@end_rect').invoke('attr', 'y').as("end_y");
      cy.get('@end_rect').invoke('attr', 'width').as("end_width");
      cy.get('@end_rect').invoke('attr', 'height').as("end_height");
      cy.get("@start_x").then((start_x_text) =>{
        cy.get("@start_y").then((start_y_text)=>{
          cy.get("@start_width").then((start_width_text)=>{
            cy.get("@start_height").then((start_height_text)=>{
              cy.get("@end_x").then((end_x_text)=>{
                cy.get("@end_y").then((end_y_text)=>{
                  cy.get("@end_width").then((end_width_text)=>{
                    cy.get("@end_height").then((end_height_text)=>{
                      const start_x = Number(start_x_text);
                      const start_y = Number(start_y_text);
                      const start_width = Number(start_width_text);
                      const start_height = Number(start_height_text);
                      const end_x = Number(end_x_text);
                      const end_y = Number(end_y_text);
                      const end_height = Number(end_height_text);                  
                      const expected_start_x =start_x + start_width;
                      const expected_start_y =start_y + start_height/2;
                      const expected_end_x =end_x;
                      const expected_end_y =end_y + end_height/2;
                      const regStart = new RegExp(`^M\\s+${expected_start_x}+,+${expected_start_y}\n\\s+C`)
                      const regEnd = new RegExp(`\\s+${expected_end_x}+,+${expected_end_y}`)
                      cy.get('[data-cy="cubic-bezier-path"]').should("have.attr", "d").and("match",regStart).and("match",regEnd)
                    })
                  })
                })
              })
            })
          })
        })
    } );
  });

    /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除ボタン表示確認（input file）
  試験確認内容：削除ボタンが表示されることを確認
  */
  it("04-01-022:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除ボタン表示確認（input file）-削除ボタンが表示されることを確認", ()=>{
    cy.createComponent(defComponentIf, ifName0, 300, 500);
    cy.get('[data-cy="component_property-in_out_files-panel_title"]').click();
    cy.get('[data-cy="component_property-input_files-list_form"]').find('input').type('testInputFile');
    cy.get('[data-cy="list_form-add-text_field"]').find('[role="button"]').eq(1).click();
    cy.get('[data-cy="action_row-delete-btn"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除ボタン表示確認（output file）
  試験確認内容：削除ボタンが表示されることを確認
  */
  it("04-01-023:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除ボタン表示確認（output file）-削除ボタンが表示されることを確認", ()=>{
    cy.createComponent(defComponentIf, ifName0, 300, 500);
    cy.get('[data-cy="component_property-in_out_files-panel_title"]').click();
    cy.get('[data-cy="component_property-output_files-list_form"]').find('input').type('testOutputFile');
    cy.get('[data-cy="list_form-add-text_field"]').find('[role="button"]').eq(3).click();
    cy.get('[data-cy="action_row-delete-btn"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除反映確認（input file）
  試験確認内容：input fileが削除されていることを確認
  */
  it("04-01-024:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除反映確認（input file）-input fileが削除されていることを確認", ()=>{
    cy.createComponent(defComponentIf, ifName0, 300, 500);
    cy.get('[data-cy="component_property-in_out_files-panel_title"]').click();
    cy.get('[data-cy="component_property-input_files-list_form"]').find('input').type('testInputFile');
    cy.get('[data-cy="list_form-add-text_field"]').find('[role="button"]').eq(1).click();
    cy.get('[data-cy="action_row-delete-btn"]').click();
    cy.get('[data-cy="graph-component-row"]').contains('testInputFile').should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  転送対象ファイル・フォルダの設定
  削除反映確認（output file）
  試験確認内容：output fileが削除されていることを確認
  */
  it("04-01-025:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除反映確認（output file）-output fileが削除されていることを確認", ()=>{
    cy.createComponent(defComponentIf, ifName0, 300, 500);
    cy.get('[data-cy="component_property-in_out_files-panel_title"]').click();
    cy.get('[data-cy="component_property-output_files-list_form"]').find('input').type('testOutputFile');
    cy.get('[data-cy="list_form-add-text_field"]').find('[role="button"]').eq(3).click();
    cy.get('[data-cy="action_row-delete-btn"]').click();
    cy.get('[data-cy="graph-component-row"]').contains('testOutputFile').should('not.exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ単体表示
  試験確認内容：ディレクトリが単体表示されることを確認
  */
  it("04-01-026:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ単体表示-ディレクトリが単体表示されることを確認", ()=>{
    cy.createComponent(defComponentIf, ifName0, 300, 500);
    cy.dirOrFileInput(typeDir, 'test-a', true);
    cy.dirOrFileInput(typeDir, 'test-b', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-b').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ複数表示（リロード前）
  試験確認内容：ディレクトリが単体表示されることを確認
  */
  it("04-01-027:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ複数表示（リロード前）-ディレクトリが単体表示されることを確認", ()=>{
    cy.createComponent(defComponentIf, ifName0, 300, 500);
    cy.dirOrFileInput(typeDir, 'test1', true);
    cy.dirOrFileInput(typeDir, 'test2', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test1').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test2').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ複数表示（リロード後）
  試験確認内容：ディレクトリが複数表示されることを確認
  */
  it("04-01-028:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ複数表示（リロード後）-ディレクトリが複数表示されることを確認", ()=>{
    cy.createComponent(defComponentIf, ifName0, 300, 500);
    cy.dirOrFileInput(typeDir, 'test1', true);
    cy.dirOrFileInput(typeDir, 'test2', false);
    cy.closeProperty();
    cy.clickComponentName(ifName0);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test*').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  ファイル操作エリア
  ファイル単体表示
  試験確認内容：ファイルが単体表示されることを確認
  */
  it("04-01-029:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-ファイル操作エリア-ファイル単体表示-ファイルが単体表示されることを確認", ()=>{
    cy.createComponent(defComponentIf, ifName0, 300, 500);
    cy.dirOrFileInput(typeFile, 'test-a', true);
    cy.dirOrFileInput(typeFile, 'test-b', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-b').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  ファイル操作エリア
  ファイル複数表示（リロード前）
  試験確認内容：ファイルが単体表示されることを確認
  */
  it("04-01-030:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-ファイル操作エリア-ファイル複数表示（リロード前）-ファイルが単体表示されることを確認", ()=>{
    cy.createComponent(defComponentIf, ifName0, 300, 500);
    cy.dirOrFileInput(typeFile, 'test1', true);
    cy.dirOrFileInput(typeFile, 'test2', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test1').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test2').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  ファイル操作エリア
  ファイル複数表示（リロード後）
  試験確認内容：ファイルが複数表示されることを確認
  */
  it("04-01-031:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-ファイル操作エリア-ファイル複数表示（リロード後）-ファイルが複数表示されることを確認", ()=>{
    cy.createComponent(defComponentIf, ifName0, 300, 500);
    cy.dirOrFileInput(typeFile, 'test1', true);
    cy.dirOrFileInput(typeFile, 'test2', false);
    cy.closeProperty();
    cy.clickComponentName(ifName0);
    cy.get('[data-cy="component_property-files-panel_title"]').click();
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test*').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ディレクトリ表示
  試験確認内容：ディレクトリ内にディレクトリが作成されることを確認
  */
  it("04-01-032:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ内ディレクトリ表示-ディレクトリ内にディレクトリが作成されることを確認", ()=>{
    cy.createComponent(defComponentIf, ifName0, 300, 500);
    cy.dirOrFileInput(typeDir, 'test-a', true);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').click();
    cy.dirOrFileInput(typeDir, 'test-b', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').should('exist');
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-b').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  ファイル操作エリア
  ディレクトリ内ファイル表示
  試験確認内容：ディレクトリ内にファイルが作成されることを確認
  */
  it("04-01-033:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-ファイル操作エリア-ディレクトリ内ファイル表示-ディレクトリ内にファイルが作成されることを確認", ()=>{
    cy.createComponent(defComponentIf, ifName0, 300, 500);
    cy.dirOrFileInput(typeDir, 'test-a', true);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test-a').click();
    cy.dirOrFileInput(typeFile, 'test.txt', false);
    cy.get('[data-cy="file_browser-treeview-treeview"]').contains('test.txt').should('exist');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  プロパティ設定確認
  シェルスクリプト選択セレクトボックス表示確認
  試験確認内容：シェルスクリプト選択セレクトボックスが表示されていることを確認
  */
  it("04-01-034:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-プロパティ設定確認-シェルスクリプト選択セレクトボックス表示確認-シェルスクリプト選択セレクトボックスが表示されていることを確認", ()=>{
    cy.createComponent(defComponentIf, ifName0, 300, 500);
    cy.get('[data-cy="component_property-condition-setting_title"]').click();
    cy.get('[data-cy="component_property-condition_use_javascript-autocomplete"]').find('input').should('be.not.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  プロパティ設定確認
  シェルスクリプト選択セレクトボックス選択確認
  試験確認内容：選択した値が表示されていることを確認
  */
  it("04-01-035:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-プロパティ設定確認-シェルスクリプト選択セレクトボックス選択確認-選択した値が表示されていることを確認", ()=>{
    cy.createComponent(defComponentIf, ifName0, 300, 500);
    cy.dirOrFileInput(typeFile, 'test-a', true);
    cy.get('[data-cy="component_property-condition-setting_title"]').click();
    cy.get('[data-cy="component_property-condition_use_javascript-autocomplete"]').find('input').type('test-a');
    cy.get('[data-cy="component_property-condition_use_javascript-autocomplete"]').find('input').should('have.value', 'test-a');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  プロパティ設定確認
  シェルスクリプト選択セレクトボックス選択反映確認
  試験確認内容：選択した値が表示されていることを確認
  */
  it("04-01-036:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-プロパティ設定確認-シェルスクリプト選択セレクトボックス選択反映確認-選択した値が反映されていることを確認", ()=>{
    cy.createComponent(defComponentIf, ifName0, 300, 500);
    cy.dirOrFileInput(typeFile, 'test-a', true);
    cy.get('[data-cy="component_property-condition-setting_title"]').click();
    let targetDropBoxCy = '[data-cy="component_property-condition_use_javascript-autocomplete"]';
    cy.selectByList(targetDropBoxCy, 3, 'test-a');
    cy.saveProperty();
    cy.get('[data-cy="component_property-condition-setting_title"]').click();
    cy.get('[data-cy="component_property-condition_use_javascript-autocomplete"]').find('input').should('have.value', 'test-a');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  プロパティ設定確認
  javascriptテキストボックス表示確認
  試験確認内容：javascriptテキストボックスが表示されていることを確認
  */
  it("04-01-037:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-プロパティ設定確認-javascriptテキストボックス表示確認-javascriptテキストボックスが表示されていることを確認", ()=>{
    cy.createComponent(defComponentIf, ifName0, 300, 500);
    cy.get('[data-cy="component_property-condition-setting_title"]').click();
    cy.get('[data-cy="component_property-condition_use_javascript-switch"]').click();
    cy.get('[data-cy="component_property-condition_use_javascript-textarea"]').should('be.visible');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  プロパティ設定確認
  javascriptテキストボックス入力確認
  試験確認内容：入力した値が表示されていることを確認
  */
  it("04-01-038:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-プロパティ設定確認-javascriptテキストボックス入力確認-入力した値が表示されていることを確認", ()=>{
    cy.createComponent(defComponentIf, ifName0, 300, 500);
    cy.get('[data-cy="component_property-condition-setting_title"]').click();
    cy.get('[data-cy="component_property-condition_use_javascript-switch"]').click();
    cy.get('[data-cy="component_property-condition_use_javascript-textarea"]').type('testJavaScript');
    cy.get('[data-cy="component_property-condition_use_javascript-textarea"]').find('textarea').should('have.value', 'testJavaScript');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  プロパティ設定確認
  javascriptテキストボックス反映確認
  試験確認内容：入力した値が反映されていることを確認
  */
  it("04-01-039:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-プロパティ設定確認-javascriptテキストボックス反映確認-入力した値が反映されていることを確認", ()=>{
    cy.createComponent(defComponentIf, ifName0, 300, 500);
    cy.get('[data-cy="component_property-condition-setting_title"]').click();
    cy.get('[data-cy="component_property-condition_use_javascript-switch"]').click();
    cy.get('[data-cy="component_property-condition_use_javascript-textarea"]').type('testJavaScript');
    cy.saveProperty();
    cy.get('[data-cy="component_property-condition_use_javascript-textarea"]').find('textarea').should('have.value', 'testJavaScript');
  });

  /** 
  コンポーネントの基本機能動作確認
  ifコンポーネント共通機能確認
  プロパティ設定確認
  javascriptテキストボックス反映確認
  試験確認内容：入力した値が反映されていることを確認
  */
  it("04-01-040:コンポーネントの基本機能動作確認-ifコンポーネント共通機能確認-プロパティ設定確認-javascriptテキストボックス反映確認-入力した値が反映されていることを確認", ()=>{
    cy.createComponent(defComponentIf, ifName0, 300, 500);
    cy.get('[data-cy="graph-component-row"]').contains(ifName0).rightclick();
    cy.get('[data-cy="graph-component-row"]').contains('delete').click();
    cy.get('[data-cy="graph-component-row"]').contains(ifName0).should('not.exist');
  });
})


  