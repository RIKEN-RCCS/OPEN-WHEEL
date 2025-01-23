describe("01:リモートホスト画面基本動作確認", ()=>{
    const testProject = `WHEEL_TEST_${window.crypto.randomUUID()}`
    const remotehost = Cypress.env("WHEEL_TEST_REMOTEHOST")
    const password = Cypress.env("WHEEL_TEST_REMOTE_PASSWORD")
    const hostname = Cypress.env("WHEEL_TEST_HOSTNAME")
    const testPort = Cypress.env("WHEEL_TEST_PORT")
    const testUser = Cypress.env("WHEEL_TEST_USER")
    const wheelPath = Cypress.env("WHEEL_PATH")
    before(()=>{
      cy.visit("/remotehost")
    })
  
    beforeEach(()=>{
      cy.visit("/remotehost")
    //   cy.projectMake(testProject)
    //   cy.projectOpen(testProject)
    //   cy.viewport("macbook-16")
    })
  
    //afterEach(()=>{
    //  cy.projectRemove(testProject)
    //})
  
    // リモートホスト設定画面への遷移
    // 試験確認内容：リモートホスト設定画面に遷移することを確認
    it("01-01-001:リモートホスト設定画面に遷移することを確認", ()=>{
      cy.visit("/")
      cy.get('[data-cy="navIcon"]').click();
      cy.get('[data-cy="remotehostEditor"]').invoke('removeAttr', 'target').click();  //別タブで開かないように指定
      cy.get('[data-cy="btn_newRemoteHostSetting"]').should('be.visible')
    });

    // 構成要素の機能動作確認
    // タイトル(WHEEL) ボタン押下
    // 試験確認内容：リモートホスト設定画面に遷移することを確認
    it("01-01-002:構成要素の機能動作確認-ホーム画面が表示されていることを確認", ()=>{
      cy.get('[data-cy="logo_wheelTitleLogo"]').click();
      cy.get('[data-cy="btn_open"]').should('be.visible')
    });

    // 構成要素の機能動作確認
    // 「NEW REMOTE HOST SETTINGS」ボタン押下
    // 試験確認内容：リモートホスト設定作成ダイアログが表示されていることを確認
    it("01-01-003:構成要素の機能動作確認-「NEW REMOTE HOST SETTINGS」ボタン押下-リモートホスト設定作成ダイアログが表示されていることを確認", ()=>{
      cy.get('[data-cy="btn_newRemoteHostSetting"]').click();
      cy.get('[data-cy="title_addNewHost"]').should('be.visible')
    });

    // 構成要素の機能動作確認
    // 「編集」ボタン押下
    // 試験確認内容：リモートホスト設定作成ダイアログが表示されていることを確認
    it("01-01-006:構成要素の機能動作確認-「編集」ボタン押下-リモートホスト設定作成ダイアログが表示されていることを確認", ()=>{
      cy.get('[data-cy="btn_newRemoteHostSetting"]').click();
      cy.get('[data-cy="title_addNewHost"]').should('be.visible')
    });
  })
  