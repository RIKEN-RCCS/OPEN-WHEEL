describe("02:ホーム画面基本動作確認", ()=>{
    const projectName = "TestProject"
    const projectDescription = "TestDescription"
    const extension = ".wheel"
    
    before(()=>{
      cy.goToScreen("home")
    })
  
    beforeEach(()=>{
      cy.goToScreen("home")
    })
    
    /** 
    構成要素の機能動作確認
    OPENボタン押下
    試験確認内容：ワークフロー画面が表示されることを確認
    */
    it("02-01-001:構成要素の機能動作確認-ボタン押下時の確認-OPENボタン押下-ワークフロー画面が表示されることを確認", ()=>{
      cy.createProject(projectName, projectDescription);
      cy.get('[type="checkbox"]').eq(1).check();
      cy.get('[data-cy="home-open-btn"]').click();
      cy.contains('workflow').should('exist');
      cy.get('[data-cy="workflow-project_name-text"]').should('have.text', projectName);
      cy.removeAllProjects();
    });

    /** 
    構成要素の機能動作確認
    NEWボタン押下
    試験確認内容：新規プロジェクト作成ダイアログが表示されることを確認
    */
    it("02-01-002:構成要素の機能動作確認-ボタン押下時の確認-NEWボタン押下-新規プロジェクト作成ダイアログが表示されることを確認", ()=>{
      cy.get('[data-cy="home-new-btn"]').click();
      cy.get('[data-cy="home-create_new_project-title"]').should('have.text', 'create new project');
    });

    /** 
    構成要素の機能動作確認
    BATCH MODE押下
    試験確認内容：複数プロジェクトが選択可能であることを確認
    */
    it("02-01-005:構成要素の機能動作確認-ボタン押下時の確認-BATCH MODE押下-複数プロジェクトが選択可能であることを確認", ()=>{
      cy.createProject(projectName, projectDescription);
      cy.createProject('TestProject2', 'TestDescription2');
      cy.get('[data-cy="home-batch_mode-btn"]').click();
      cy.get('[type="checkbox"]').eq(2).check().get('[type="checkbox"]').eq(2).should('be.checked');
      cy.get('[type="checkbox"]').eq(3).check().get('[type="checkbox"]').eq(3).should('be.checked');
      cy.removeAllProjects();
    });

    /** 
    構成要素の機能動作確認
    ハンバーガーボタン押下
    試験確認内容：ドロワーが表示されることを確認
    */
    it("02-01-006:構成要素の機能動作確認-ボタン押下時の確認-ハンバーガーボタン押下-ドロワーが表示されることを確認", ()=>{
      cy.get('[data-cy="tool_bar-navi-icon"]').click();
      cy.get('[data-cy="navigation-remote_host_editor-btn"]').should('be.visible');
      cy.get('[data-cy="navigation-user_guide_editor-btn"]').should('be.visible');
    });

    /** 
    構成要素の機能動作確認
    プロジェクト名押下
    試験確認内容：プロジェクト名変更ダイアログが表示されることを確認
    */
    it("02-01-007:構成要素の機能動作確認-プロジェクト名押下-プロジェクト名変更ダイアログが表示されることを確認", ()=>{
      cy.createProject(projectName, projectDescription);
      cy.get('[data-cy="home-project_name-btn"]').click();
      cy.get('[data-cy="home-project_rename-text_field"]').should('be.visible');
      cy.removeAllProjects();
    });

    /** 
    機能利用フローの確認
    新規プロジェクトの作成
    プロジェクトデータ作成場所選択
    試験確認内容：ディレクトリツリーでプロジェクトデータ作成場所が選択できることを確認
    */
    it("02-01-008:機能利用フローの確認-新規プロジェクトの作成-プロジェクトデータ作成場所選択-ディレクトリツリーでプロジェクトデータ作成場所が選択できることを確認", ()=>{
      cy.createProject(projectName, projectDescription);
      cy.get('[data-cy="home-new-btn"]').click();
      cy.get('[data-cy="home-file_browser-file_browser"]').contains(projectName + extension).click();
      cy.get('[data-cy="home-file_browser-file_browser"]').contains('prj.wheel.json').should('exist');
      cy.removeAllProjects();
    });

    /** 
    機能利用フローの確認
    新規プロジェクトの作成
    プロジェクト名入力
    試験確認内容：プロジェクト名が入力できることを確認
    */
    it("02-01-009:機能利用フローの確認-新規プロジェクトの作成-プロジェクト名入力-プロジェクト名が入力できることを確認", ()=>{
      cy.get('[data-cy="home-new-btn"]').click();
      cy.get('[data-cy="home-project_name-text_field"]').type(projectName);
      cy.get('[data-cy="home-project_name-text_field"]').find('input').should('have.value', projectName);
    });

    /** 
    機能利用フローの確認
    新規プロジェクトの作成
    プロジェクト説明入力
    試験確認内容：プロジェクト説明が入力できることを確認
    */
    it("02-01-010:機能利用フローの確認-新規プロジェクトの作成-プロジェクト説明入力-プロジェクト説明が入力できることを確認", ()=>{
      cy.get('[data-cy="home-new-btn"]').click();
      cy.get('[data-cy="home-project_description-textarea"]').type(projectDescription);
      cy.get('[data-cy="home-project_description-textarea"]').find('textarea').should('have.value', projectDescription);
    });

    /** 
    機能利用フローの確認
    新規プロジェクトの作成
    createボタン押下
    試験確認内容：プロジェクトが作成できていることを確認
    */
    it("02-01-011:機能利用フローの確認-新規プロジェクトの作成-createボタン押下-プロジェクトが作成できていることを確認", ()=>{
      cy.createProject(projectName, projectDescription);
      cy.get('[data-cy="home-project_name-btn"]').contains(projectName).should('exist');
      cy.get('[data-cy="home-project_description-btn"]').contains(projectDescription).should('exist');
      cy.get('[data-cy="home-path-span"]').contains(projectName + extension).should('exist');
      cy.removeAllProjects();
    });

    /** 
    機能利用フローの確認
    プロジェクトを開く
    プロジェクト名チェックボックス押下
    試験確認内容：複数プロジェクトを選択できないことを確認
    */
    it("02-01-012:機能利用フローの確認-プロジェクトを開く-プロジェクト名チェックボックス押下-複数プロジェクトを選択できないことを確認", ()=>{
      cy.createProjectMultiple(projectName, projectDescription, 2);
      cy.get('[data-cy="home-project_list-data_table"]').find('[type="checkbox"]').first().check();
      cy.get('[data-cy="home-project_list-data_table"]').find('[type="checkbox"]').eq(1).check();
      cy.get('[data-cy="home-project_list-data_table"]').find('[type="checkbox"]').first().should('not.be.checked');
      cy.get('[data-cy="home-project_list-data_table"]').find('[type="checkbox"]').eq(1).should('be.checked');
      cy.removeAllProjects();
    });

    /** 
    機能利用フローの確認
    プロジェクト名変更
    プロジェクト名押下
    試験確認内容：プロジェクト名変更ダイアログが表示されることを確認
    */
    it("02-01-013:機能利用フローの確認-プロジェクト名変更-プロジェクト名押下-プロジェクト名変更ダイアログが表示されることを確認", ()=>{
      cy.createProject(projectName, projectDescription);
      cy.get('[data-cy="home-project_name-btn"]').contains(projectName).click();
      cy.get('[data-cy="home-project_rename-text_field"]').should('not.be.visible');
      cy.removeAllProjects();
    });

    /** 
    機能利用フローの確認
    プロジェクト名変更
    プロジェクト名押下
    試験確認内容：プロジェクト名が入力できることを確認
    */
    it("02-01-014:機能利用フローの確認-プロジェクト名変更-プロジェクト名押下-プロジェクト名が入力できることを確認", ()=>{
      cy.createProject(projectName, projectDescription);
      cy.get('[data-cy="home-project_name-btn"]').contains(projectName).click();
      cy.get('[data-cy="home-project_rename-text_field"]').clear();
      cy.get('[data-cy="home-project_rename-text_field"]').type('change-' + projectName);
      cy.get('[data-cy="home-project_rename-text_field"]').find('input').should('have.value', 'change-' + projectName);
      cy.removeAllProjects();
    });

    /** 
    機能利用フローの確認
    プロジェクト名変更
    プロジェクト名押下
    試験確認内容：変更後のプロジェクト名で一覧に表示されていることを確認
    */
    it("02-01-015:機能利用フローの確認-プロジェクト名変更-プロジェクト名押下-変更後のプロジェクト名で一覧に表示されていることを確認", ()=>{
      cy.createProject(projectName, projectDescription);
      cy.get('[data-cy="home-project_name-btn"]').contains(projectName).click();
      cy.get('[data-cy="home-project_rename-text_field"]').clear();
      cy.get('[data-cy="home-project_rename-text_field"]').type('changeProjectName {enter}');
      cy.get('[data-cy="home-project_name-btn"]').contains('changeProjectName').should('exist');
      cy.removeAllProjects();
    });

    /** 
    機能利用フローの確認
    プロジェクト名変更
    プロジェクト説明押下
    試験確認内容：プロジェクト説明変更ダイアログが表示されることを確認
    */
    it("02-01-016:機能利用フローの確認-プロジェクト名変更-プロジェクト説明押下-プロジェクト説明変更ダイアログが表示されることを確認", ()=>{
      cy.createProject(projectName, projectDescription);
      cy.get('[data-cy="home-project_description-btn"]').contains(projectDescription).click();
      cy.get('[data-cy="home-description_change-textarea"]').should('not.be.visible');
      cy.removeAllProjects();
    });

    /** 
    機能利用フローの確認
    プロジェクト名変更
    プロジェクト説明押下
    試験確認内容：プロジェクト説明が入力できることを確認
    */
    it("02-01-017:機能利用フローの確認-プロジェクト名変更-プロジェクト説明押下-プロジェクト説明が入力できることを確認", ()=>{
      cy.createProject(projectName, projectDescription);
      cy.get('[data-cy="home-project_description-btn"]').contains(projectDescription).click();
      cy.get('[data-cy="home-description_change-textarea"]').clear();
      cy.get('[data-cy="home-description_change-textarea"]').type('change-' + projectDescription);
      cy.get('[data-cy="home-description_change-textarea"]').find('textarea').should('have.value', 'change-' + projectDescription);
      cy.removeAllProjects();
    });

    /** 
    機能利用フローの確認
    プロジェクト名変更
    プロジェクト説明押下
    試験確認内容：変更後のプロジェクト説明で一覧に表示されていることを確認
    */
    it("02-01-018:機能利用フローの確認-プロジェクト名変更-プロジェクト説明押下-変更後のプロジェクト説明で一覧に表示されていることを確認", ()=>{
      cy.createProject(projectName, projectDescription);
      cy.get('[data-cy="home-project_description-btn"]').contains(projectDescription).click();
      cy.get('[data-cy="home-description_change-textarea"]').clear();
      cy.get('[data-cy="home-description_change-textarea"]').type('change-' + projectDescription);
      cy.get('[data-cy="home-project_description-btn"]').contains('change-' + projectDescription).should('exist');
      cy.removeAllProjects();
    });

    /** 
    機能利用フローの確認
    プロジェクトを削除
    REMOVEボタン押下
    試験確認内容：一覧にプロジェクトが表示されていない且つ、実体ファイルが削除されていることを確認
    */
    it("02-01-019:機能利用フローの確認-プロジェクトを削除-REMOVEボタン押下-一覧にプロジェクトが表示されていない且つ、実体ファイルが削除されていることを確認", ()=>{
      cy.createProject(projectName, projectDescription);
      cy.get('[data-cy="home-project_list-data_table"]').find('[type="checkbox"]').first().check();
      cy.get('[data-cy="home-remove-btn"]').click();
      cy.get('[data-cy="buttons-ok_or_cancel-btn"]').first().click();
      cy.contains(projectName).should('not.be.visible');
      cy.get('[data-cy="home-new-btn"]').click();
      cy.get('[data-cy="home-file_browser-file_browser"]').contains(projectName + extension).should('not.exist');
    });

    /** 
    機能利用フローの確認
    プロジェクトを削除
    REMOVE FROM LISTボタン押下
    試験確認内容：一覧にプロジェクトが表示されていない且つ、実体ファイルは削除されていないことを確認
    */
    it("02-01-020:機能利用フローの確認-プロジェクトを削除-REMOVE FROM LISTボタン押下-一覧にプロジェクトが表示されていない且つ、実体ファイルは削除されていないことを確認", ()=>{
      const projectnameRandom = Math.random().toString(32).substring(2);
      cy.createProject(projectnameRandom, projectDescription);
      cy.get('[data-cy="home-project_list-data_table"]').find('[type="checkbox"]').first().check();
      cy.get('[data-cy="home-remove_from_list-btn"]').click();
      cy.get('[data-cy="buttons-ok_or_cancel-btn"]').first().click();
      cy.contains(projectnameRandom).should('not.be.visible');
      cy.get('[data-cy="home-new-btn"]').click();
      cy.get('[data-cy="home-file_browser-file_browser"]').contains(projectnameRandom + extension).should('exist');
    });

    /** 
    機能利用フローの確認
    プロジェクトを削除
    REMOVEボタン押下
    BATCH MODE選択
    試験確認内容：一覧にプロジェクトが表示されていない且つ、実体ファイルは削除されていないことを確認
    */
    it("02-01-021:機能利用フローの確認-プロジェクトを削除-REMOVEボタン押下-BATCH MODE選択-一覧にプロジェクトが表示されていない且つ、実体ファイルが削除されていることを確認", ()=>{
      cy.createProject(projectName, projectDescription);
      cy.get('[data-cy="home-batch_mode-btn"]').click();
      cy.get('[data-cy="home-project_list-data_table"]').find('[type="checkbox"]').first().check();
      cy.get('[data-cy="home-remove-btn"]').click();
      cy.get('[data-cy="buttons-ok_or_cancel-btn"]').first().click();
      cy.contains(projectName).should('not.be.visible');
      cy.get('[data-cy="home-batch_mode-btn"]').click();
      cy.get('[data-cy="home-new-btn"]').click();
      cy.get('[data-cy="home-file_browser-file_browser"]').contains(projectName + extension).should('not.exist');
    });

    /** 
    機能利用フローの確認
    プロジェクトを削除
    REMOVE FROM LISTボタン押下
    BATCH MODE選択
    試験確認内容：一覧にプロジェクトが表示されていない且つ、実体ファイルは削除されていないことを確認
    */
    it("02-01-022:機能利用フローの確認-プロジェクトを削除-REMOVE FROM LISTボタン押下-BATCH MODE選択-一覧にプロジェクトが表示されていない且つ、実体ファイルは削除されていないことを確認", ()=>{
      const projectnameRandom = Math.random().toString(32).substring(2);
      cy.createProject(projectnameRandom, projectDescription);
      cy.get('[data-cy="home-batch_mode-btn"]').click();
      cy.get('[data-cy="home-project_list-data_table"]').find('[type="checkbox"]').first().check();
      cy.get('[data-cy="home-remove_from_list-btn"]').click();
      cy.get('[data-cy="buttons-ok_or_cancel-btn"]').first().click();
      cy.contains(projectnameRandom).should('not.be.visible');
      cy.get('[data-cy="home-batch_mode-btn"]').click();
      cy.get('[data-cy="home-new-btn"]').click();
      cy.get('[data-cy="home-file_browser-file_browser"]').contains(projectnameRandom + extension).should('exist');
    });

  })
  