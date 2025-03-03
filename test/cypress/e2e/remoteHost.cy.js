describe("01:リモートホスト画面基本動作確認", ()=>{
    const LABEL = "TestLabel"
    const HOST_NAME = "TestHostName"
    const PORT_NUMBER = 20
    const TEST_USER = "TestUser"
    const HOST_WORK_DIR = "$TESTHOME"
    const PRIVATE_KEY_FILE = "TestPrivate.key"
    const JOB_SCHEDULERS = "PBSPro"
    const MAX_NUMBER = 100
    const AVAILABLE_QUEUES = "TestQueues"
    const BULKJOB_CHK_YES = true
    const BULKJOB_CHK_NO = false
    const STEPJOB_CHK_YES = true
    const STEPJOB_CHK_NO = false
    const SHARED_HOST = "TestSharedHost"
    const INTERVAL_MIN = 5
    const STATUS_CHECK_SEC = 200
    const HOST_MAX_NUMBER = 11
    const EXECUTION_INTERVAL = 6
    const TIMEOUT_DURING = 7
    
    before(()=>{
      cy.goToScreen('remotehost')
    })
  
    beforeEach(()=>{
      cy.goToScreen('remotehost')
    })
    
    /** 
    リモートホスト設定画面への遷移
    試験確認内容：リモートホスト設定画面に遷移することを確認
    */
    it("01-01-001:リモートホスト設定画面に遷移することを確認", ()=>{
      cy.goToScreen('home');
      cy.get('[data-cy="tool_bar-navi-icon"]').click();
      cy.get('[data-cy="navigation-remote_host_editor-btn"]').invoke('removeAttr', 'target').click(); 
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').should('be.visible')
    });

    /**
    構成要素の機能動作確認
    タイトル(WHEEL) ボタン押下
    試験確認内容：リモートホスト設定画面に遷移することを確認
    */
    it("01-01-002:構成要素の機能動作確認-ホーム画面が表示されていることを確認", ()=>{
      cy.get('[data-cy="tool_bar-wheel_logo-logo"]').click();
      cy.get('[data-cy="home-open-btn"]').should('be.visible');
    });

    /**
    構成要素の機能動作確認
    「NEW REMOTE HOST SETTINGS」ボタン押下
    試験確認内容：リモートホスト設定作成ダイアログが表示されていることを確認
    */
    it("01-01-003:構成要素の機能動作確認-「NEW REMOTE HOST SETTINGS」ボタン押下-リモートホスト設定作成ダイアログが表示されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.get('[data-cy="add_new_host-add_new_host-card_title"]').should('be.visible');
    });

    /**
    構成要素の機能動作確認
    「編集」ボタン押下
    試験確認内容：リモートホスト設定作成ダイアログが表示されていることを確認
    */
    it("01-01-006:構成要素の機能動作確認-「編集」ボタン押下-リモートホスト設定作成ダイアログが表示されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.get('[data-cy="add_new_host-label-text_field"]').type(LABEL);
      cy.get('[data-cy="add_new_host-hostname-text_field"]').type(HOST_NAME);
      cy.get('[data-cy="add_new_host-port_number_label-text_field"]').type(PORT_NUMBER);
      cy.get('[data-cy="add_new_host-user_id-text_field"]').type(TEST_USER);
      cy.get('[data-cy="add_new_host-ok-btn"]').click();
      cy.get('[data-cy="action_row-edit-btn"]').click();
      cy.get('[data-cy="add_new_host-add_new_host-card_title"]').should('be.visible');
      // ダイアログ内のテキスト確認
      cy.get('[data-cy="add_new_host-label-text_field"]').find('input').should('have.value', 'TestLabel');
      // ダイアログ内のOKボタン
      cy.get('[data-cy="add_new_host-ok-btn"]').click();
      // 削除ボタン
      cy.get('[data-cy="action_row-delete-btn"]').click();
      // 削除確認ダイアログ内OKボタン
      cy.get('[data-cy="buttons-ok_or_cancel-btn"]').first().click();
    });

    /**
    構成要素の機能動作確認
    「削除」ボタン押下
    削除キャンセル
    試験確認内容：該当データの削除が行われていないことを確認
    */
    it("01-01-007:構成要素の機能動作確認-「削除」ボタン押下-削除キャンセル-該当データの削除が行われていないことを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.get('[data-cy="add_new_host-label-text_field"]').type(LABEL);
      cy.get('[data-cy="add_new_host-hostname-text_field"]').type(HOST_NAME);
      cy.get('[data-cy="add_new_host-port_number_label-text_field"]').type(PORT_NUMBER);
      cy.get('[data-cy="add_new_host-user_id-text_field"]').type(TEST_USER);
      cy.get('[data-cy="add_new_host-ok-btn"]').click();
      // 削除ボタン
      cy.get('[data-cy="action_row-delete-btn"]').click();
      // 削除確認ダイアログ内CANCELボタン
      cy.get('[data-cy="buttons-ok_or_cancel-btn"]').eq(1).click();
      cy.get('[data-cy="remotehost-items-data_table"]').contains(LABEL);
      cy.removeRemoteHost(LABEL);
    });

    /**
    構成要素の機能動作確認
    「削除」ボタン押下
    削除実行
    試験確認内容：該当データの削除が行われていることを確認
    */
    it("01-01-008:構成要素の機能動作確認-「削除」ボタン押下-削除実行-該当データの削除が行われていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.get('[data-cy="add_new_host-label-text_field"]').type(LABEL);
      cy.get('[data-cy="add_new_host-hostname-text_field"]').type(HOST_NAME);
      cy.get('[data-cy="add_new_host-port_number_label-text_field"]').type(PORT_NUMBER);
      cy.get('[data-cy="add_new_host-user_id-text_field"]').type(TEST_USER);
      cy.get('[data-cy="add_new_host-ok-btn"]').click();
      // 削除ボタン
      cy.get('[data-cy="action_row-delete-btn"]').click();
      // 削除確認ダイアログ内OKボタン
      cy.get('[data-cy="buttons-ok_or_cancel-btn"]').first().click();
      cy.get('[data-cy="remotehost-items-data_table"]').contains('No data available');
    });

    /**
    構成要素の設定入力確認
    テキスト入力
    「label」テキストエリア
    試験確認内容：テキストが正しく入力されていることを確認
    */
    it("01-01-009:構成要素の設定入力確認-テキスト入力-「label」テキストエリア-テキストが正しく入力されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.get('[data-cy="add_new_host-label-text_field"]').type(LABEL);
      cy.get('[data-cy="add_new_host-label-text_field"]').find('input').should('have.value', LABEL);
   });

   /**
    構成要素の設定入力確認
    テキスト入力
    「Hostname」テキストエリア
    試験確認内容：テキストが正しく入力されていることを確認
    */
    it("01-01-010:構成要素の設定入力確認-テキスト入力-「Hostname」テキストエリア-テキストが正しく入力されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.enterRequiredRemoteHost(LABEL, HOST_NAME, PORT_NUMBER, TEST_USER);
      cy.get('[data-cy="add_new_host-hostname-text_field"]').find('input').should('have.value', HOST_NAME); 
    });

    /**
    構成要素の設定入力確認
    テキスト入力
    「Port number」テキストエリア
    試験確認内容：テキストが正しく入力されていることを確認
    */
    it("01-01-011:構成要素の設定入力確認-テキスト入力-「Port number」テキストエリア-テキストが正しく入力されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.enterRequiredRemoteHost(LABEL, HOST_NAME, PORT_NUMBER, TEST_USER);
      cy.get('[data-cy="add_new_host-port_number_label-text_field"]').find('input').should('have.value', PORT_NUMBER); 
    });

    /**
    構成要素の設定入力確認
    テキスト入力
    「User ID」テキストエリア
    試験確認内容：テキストが正しく入力されていることを確認
    */
    it("01-01-012:構成要素の設定入力確認-テキスト入力-「User ID」テキストエリア-テキストが正しく入力されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.enterRequiredRemoteHost(LABEL, HOST_NAME, PORT_NUMBER, TEST_USER);
      cy.get('[data-cy="add_new_host-user_id-text_field"]').find('input').should('have.value', TEST_USER); 
    });

    /**
    構成要素の設定入力確認
    テキスト入力
    「Host work dir」テキストエリア
    試験確認内容：テキストが正しく入力されていることを確認
    */
    it("01-01-013:構成要素の設定入力確認-テキスト入力-「Host work dir」テキストエリア-テキストが正しく入力されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.enterRequiredRemoteHost(LABEL, HOST_NAME, PORT_NUMBER, TEST_USER);
      cy.enterRemoteHost(HOST_WORK_DIR, PRIVATE_KEY_FILE, JOB_SCHEDULERS, MAX_NUMBER, AVAILABLE_QUEUES, BULKJOB_CHK_YES, STEPJOB_CHK_YES, SHARED_HOST);
      cy.get('[data-cy="add_new_host-work_dir_label-text_field"]').find('input').should('have.value', HOST_WORK_DIR); 
    });

    /**
    構成要素の設定入力確認
    テキスト入力
    「private key path」テキストエリア
    試験確認内容：テキストが正しく入力されていることを確認
    */
    it("01-01-014:構成要素の設定入力確認-テキスト入力-「private key path」テキストエリア-テキストが正しく入力されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.enterRequiredRemoteHost(LABEL, HOST_NAME, PORT_NUMBER, TEST_USER);
      cy.enterRemoteHost(HOST_WORK_DIR, PRIVATE_KEY_FILE, JOB_SCHEDULERS, MAX_NUMBER, AVAILABLE_QUEUES, BULKJOB_CHK_YES, STEPJOB_CHK_YES, SHARED_HOST);
      cy.get('[data-cy="add_new_host-private_key_path-text_field"]').find('input').should('have.value', PRIVATE_KEY_FILE);
    });

    /**
    構成要素の設定入力確認
    ファイル選択
    「private key path」テキストエリア
    試験確認内容：選択したファイルのパスが正しく表示されていることを確認
    */
    it("01-01-015:構成要素の設定入力確認-ファイル選択-「private key path」テキストエリア-選択したファイルのパスが正しく表示されていることを確認", ()=>{
      cy.createProject('testProject', 'testDescription');
      cy.goToScreen('remotehost');
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.get('[data-cy="add_new_host-browse_btn"]').click();
      cy.get('[data-cy="add_new_host-select_private_key_file-card_text"]').contains('testProject.wheel').click();
      cy.get('[data-cy="add_new_host-select_private_key_file_ok-btn"]').click();
      cy.get('[data-cy="add_new_host-private_key_path-text_field"]').find('input').should('have.value', '/root/testProject.wheel');
      cy.removeProject(1);
    });

    /**
    構成要素の設定入力確認
    セレクトボックス選択
    「job scheduler」セレクトボックス
    試験確認内容：選択した値が正しく反映されていることを確認
    */
    it("01-01-016:構成要素の設定入力確認-テキスト入力-「job scheduler」テキストエリア-選択した値が正しく反映されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.enterRequiredRemoteHost(LABEL, HOST_NAME, PORT_NUMBER, TEST_USER);
      cy.enterRemoteHost(HOST_WORK_DIR, PRIVATE_KEY_FILE, JOB_SCHEDULERS, MAX_NUMBER, AVAILABLE_QUEUES, BULKJOB_CHK_YES, STEPJOB_CHK_YES, SHARED_HOST);
      cy.get('[data-cy="add_new_host-private_key_path-text_field"]').click();
      cy.get('[data-cy="add_new_host-job_schedulers-select"]').find('input').should('have.value', JOB_SCHEDULERS);
    });

    /**
    構成要素の設定入力確認
    テキスト入力
    「max number of jobs」テキストエリア
    試験確認内容：テキストが正しく入力されていることを確認
    */
    it("01-01-017:構成要素の設定入力確認-テキスト入力-「max number of jobs」テキストエリア-テキストが正しく入力されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.enterRequiredRemoteHost(LABEL, HOST_NAME, PORT_NUMBER, TEST_USER);
      cy.enterRemoteHost(HOST_WORK_DIR, PRIVATE_KEY_FILE, JOB_SCHEDULERS, MAX_NUMBER, AVAILABLE_QUEUES, BULKJOB_CHK_YES, STEPJOB_CHK_YES, SHARED_HOST);
      cy.get('[data-cy="add_new_host-max_number_of_jobs-text_field"]').find('input').should('have.value', MAX_NUMBER);
    });

    /**
    構成要素の設定入力確認
    テキスト入力
    「available queues」テキストエリア
    試験確認内容：テキストが正しく入力されていることを確認
    */
    it("01-01-018:構成要素の設定入力確認-テキスト入力-「available queues」テキストエリア-テキストが正しく入力されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.enterRequiredRemoteHost(LABEL, HOST_NAME, PORT_NUMBER, TEST_USER);
      cy.enterRemoteHost(HOST_WORK_DIR, PRIVATE_KEY_FILE, JOB_SCHEDULERS, MAX_NUMBER, AVAILABLE_QUEUES, BULKJOB_CHK_YES, STEPJOB_CHK_YES, SHARED_HOST);
      cy.get('[data-cy="add_new_host-available_queues-text_field"]').find('input').should('have.value', AVAILABLE_QUEUES);
    });

    /**
    構成要素の設定入力確認
    チェックボックス選択
    「use bulkjob」チェックボックス
    試験確認内容：正しくチェックが行われていることを確認
    */
    it("01-01-019:構成要素の設定入力確認-テキスト入力-「use bulkjob」チェックボックス-正しくチェックが行われていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.enterRequiredRemoteHost(LABEL, HOST_NAME, PORT_NUMBER, TEST_USER);
      cy.enterRemoteHost(HOST_WORK_DIR, PRIVATE_KEY_FILE, JOB_SCHEDULERS, MAX_NUMBER, AVAILABLE_QUEUES, BULKJOB_CHK_YES, STEPJOB_CHK_YES, SHARED_HOST);
      cy.get('[data-cy="add_new_host-use_bulkjob-checkbox"]').find('[type="checkbox"]').uncheck();
      cy.get('[data-cy="add_new_host-use_bulkjob-checkbox"]').find('[type="checkbox"]').check();
      cy.get('[data-cy="add_new_host-use_bulkjob-checkbox"]').find('[type="checkbox"]').should('be.checked');
    });

    /**
    構成要素の設定入力確認
    チェックボックス選択
    「use stepjob」チェックボックス
    試験確認内容：正しくチェックが行われていることを確認
    */
    it("01-01-020:構成要素の設定入力確認-テキスト入力-「use stepjob」チェックボックス-正しくチェックが行われていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.enterRequiredRemoteHost(LABEL, HOST_NAME, PORT_NUMBER, TEST_USER);
      cy.enterRemoteHost(HOST_WORK_DIR, PRIVATE_KEY_FILE, JOB_SCHEDULERS, MAX_NUMBER, AVAILABLE_QUEUES, BULKJOB_CHK_YES, STEPJOB_CHK_YES, SHARED_HOST);
      cy.get('[data-cy="add_new_host-use_stepjob-checkbox"]').find('[type="checkbox"]').uncheck();
      cy.get('[data-cy="add_new_host-use_stepjob-checkbox"]').find('[type="checkbox"]').check();
      cy.get('[data-cy="add_new_host-use_stepjob-checkbox"]').find('[type="checkbox"]').should('be.checked');
    });

    /**
    構成要素の設定入力確認
    セレクトボックス選択
    「shared host」セレクトボックス
    試験確認内容：選択した値が正しく反映されていることを確認
    */
    it("01-01-021:構成要素の設定入力確認-テキスト入力-「shared host」セレクトボックス-選択した値が正しく反映されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.enterRequiredRemoteHost(LABEL, HOST_NAME, PORT_NUMBER, TEST_USER);
      cy.get('[data-cy="add_new_host-ok-btn"]').click();
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.get('[data-cy="add_new_host-shared_host-select"]').type(LABEL);
      cy.get('[data-cy="add_new_host-shared_host-select"]').click();
      cy.get('[data-cy="add_new_host-shared_host-select"]').find('input').should('have.value', LABEL);
      cy.visit("/remotehost");
      cy.removeRemoteHost(LABEL);
    });

    /**
    構成要素の設定入力確認
    テキスト入力
    「shared path on shared host」テキストエリア
    試験確認内容：テキストが正しく入力されていることを確認
    */
    it("01-01-022:構成要素の設定入力確認-テキスト入力-「shared path on shared host」テキストエリア-テキストが正しく入力されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.enterRequiredRemoteHost(LABEL, HOST_NAME, PORT_NUMBER, TEST_USER);
      cy.enterRemoteHost(HOST_WORK_DIR, PRIVATE_KEY_FILE, JOB_SCHEDULERS, MAX_NUMBER, AVAILABLE_QUEUES, BULKJOB_CHK_YES, STEPJOB_CHK_YES, SHARED_HOST);
      cy.get('[data-cy="add_new_host-shared_path_on_shared_host-text_field"]').find('input').should('have.value', SHARED_HOST);
    });

    /**
    構成要素の設定入力確認
    テキスト入力
    「connection renewal interval (min.)」テキストエリア
    試験確認内容：テキストが正しく入力されていることを確認
    */
    it("01-01-023:構成要素の設定入力確認-テキスト入力-「connection renewal interval (min.)」テキストエリア-テキストが正しく入力されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.enterRequiredRemoteHost(LABEL, HOST_NAME, PORT_NUMBER, TEST_USER);
      cy.enterRemoteHost(HOST_WORK_DIR, PRIVATE_KEY_FILE, JOB_SCHEDULERS, MAX_NUMBER, AVAILABLE_QUEUES, BULKJOB_CHK_YES, STEPJOB_CHK_YES, SHARED_HOST);
      cy.enterAdvancedRemoteHost(INTERVAL_MIN, STATUS_CHECK_SEC, HOST_MAX_NUMBER, EXECUTION_INTERVAL, TIMEOUT_DURING);
      cy.get('[data-cy="add_new_host-connection_renewal-text_field"]').find('input').should('have.value', INTERVAL_MIN);
    });

    /**
    構成要素の設定入力確認
    テキスト入力
    「status check interval (sec.)」テキストエリア
    試験確認内容：テキストが正しく入力されていることを確認
    */
    it("01-01-024:構成要素の設定入力確認-テキスト入力-「status check interval (sec.)」テキストエリア-テキストが正しく入力されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.enterRequiredRemoteHost(LABEL, HOST_NAME, PORT_NUMBER, TEST_USER);
      cy.enterRemoteHost(HOST_WORK_DIR, PRIVATE_KEY_FILE, JOB_SCHEDULERS, MAX_NUMBER, AVAILABLE_QUEUES, BULKJOB_CHK_YES, STEPJOB_CHK_YES, SHARED_HOST);
      cy.enterAdvancedRemoteHost(INTERVAL_MIN, STATUS_CHECK_SEC, HOST_MAX_NUMBER, EXECUTION_INTERVAL, TIMEOUT_DURING);
      cy.get('[data-cy="add_new_host-status_check-text_field"]').find('input').should('have.value', STATUS_CHECK_SEC);
    });

    /**
    構成要素の設定入力確認
    テキスト入力
    「max number of status check error allowed」テキストエリア
    試験確認内容：テキストが正しく入力されていることを確認
    */
    it("01-01-025:構成要素の設定入力確認-テキスト入力-「max number of status check error allowed」テキストエリア-テキストが正しく入力されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.enterRequiredRemoteHost(LABEL, HOST_NAME, PORT_NUMBER, TEST_USER);
      cy.enterRemoteHost(HOST_WORK_DIR, PRIVATE_KEY_FILE, JOB_SCHEDULERS, MAX_NUMBER, AVAILABLE_QUEUES, BULKJOB_CHK_YES, STEPJOB_CHK_YES, SHARED_HOST);
      cy.enterAdvancedRemoteHost(INTERVAL_MIN, STATUS_CHECK_SEC, HOST_MAX_NUMBER, EXECUTION_INTERVAL, TIMEOUT_DURING);
      cy.get('[data-cy="add_new_host-max_number-text_field"]').find('input').should('have.value', HOST_MAX_NUMBER);
    });

    /**
    構成要素の設定入力確認
    テキスト入力
    「execution interval」テキストエリア
    試験確認内容：テキストが正しく入力されていることを確認
    */
    it("01-01-026:構成要素の設定入力確認-テキスト入力-「execution interval」テキストエリア-テキストが正しく入力されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.enterRequiredRemoteHost(LABEL, HOST_NAME, PORT_NUMBER, TEST_USER);
      cy.enterRemoteHost(HOST_WORK_DIR, PRIVATE_KEY_FILE, JOB_SCHEDULERS, MAX_NUMBER, AVAILABLE_QUEUES, BULKJOB_CHK_YES, STEPJOB_CHK_YES, SHARED_HOST);
      cy.enterAdvancedRemoteHost(INTERVAL_MIN, STATUS_CHECK_SEC, HOST_MAX_NUMBER, EXECUTION_INTERVAL, TIMEOUT_DURING);
      cy.get('[data-cy="add_new_host-execution_interval-text_field"]').find('input').should('have.value', EXECUTION_INTERVAL);
    });

    /**
    構成要素の設定入力確認
    テキスト入力
    「timeout during handshake phase」テキストエリア
    試験確認内容：テキストが正しく入力されていることを確認
    */
    it("01-01-027:構成要素の設定入力確認-テキスト入力-「timeout during handshake phase」テキストエリア-テキストが正しく入力されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.enterRequiredRemoteHost(LABEL, HOST_NAME, PORT_NUMBER, TEST_USER);
      cy.enterRemoteHost(HOST_WORK_DIR, PRIVATE_KEY_FILE, JOB_SCHEDULERS, MAX_NUMBER, AVAILABLE_QUEUES, BULKJOB_CHK_YES, STEPJOB_CHK_YES, SHARED_HOST);
      cy.enterAdvancedRemoteHost(INTERVAL_MIN, STATUS_CHECK_SEC, HOST_MAX_NUMBER, EXECUTION_INTERVAL, TIMEOUT_DURING);
      cy.get('[data-cy="add_new_host-timeout_during-text_field"]').find('input').should('have.value', TIMEOUT_DURING);
    });

    /**
    設定入力後の反映確認
    一覧から確認
    試験確認内容：値が正しく反映されていることを確認
    */
    it("01-01-028:設定入力後の反映確認-一覧から確認-値が正しく反映されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.enterRequiredRemoteHost(LABEL, HOST_NAME, PORT_NUMBER, TEST_USER);
      cy.enterRemoteHost(HOST_WORK_DIR, PRIVATE_KEY_FILE, JOB_SCHEDULERS, MAX_NUMBER, AVAILABLE_QUEUES, BULKJOB_CHK_NO, STEPJOB_CHK_NO, SHARED_HOST);
      cy.get('[data-cy="add_new_host-ok-btn"]').click();
      cy.get('[data-cy="remotehost-items-data_table"]').contains(LABEL);
      cy.get('[data-cy="remotehost-items-data_table"]').contains(HOST_NAME);
      cy.get('[data-cy="remotehost-items-data_table"]').contains(PORT_NUMBER);
      cy.get('[data-cy="remotehost-items-data_table"]').contains(TEST_USER);     
      cy.get('[data-cy="remotehost-items-data_table"]').contains(PRIVATE_KEY_FILE);
      cy.removeRemoteHost(LABEL);
    });

    /**
    設定入力後の反映確認
    編集ダイアログから確認
    基本設定確認
    試験確認内容：値が正しく反映されていることを確認
    */
    it("01-01-029:設定入力後の反映確認-編集ダイアログから確認-基本設定確認-値が正しく反映されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.enterRequiredRemoteHost(LABEL, HOST_NAME, PORT_NUMBER, TEST_USER);
      cy.enterRemoteHost(HOST_WORK_DIR, PRIVATE_KEY_FILE, JOB_SCHEDULERS, MAX_NUMBER, AVAILABLE_QUEUES, BULKJOB_CHK_YES, STEPJOB_CHK_YES, SHARED_HOST);
      cy.get('[data-cy="add_new_host-ok-btn"]').click();
      cy.get('[data-cy="action_row-edit-btn"]').click();
      cy.get('[data-cy="add_new_host-label-text_field"]').find('input').should('have.value', LABEL);
      cy.get('[data-cy="add_new_host-hostname-text_field"]').find('input').should('have.value', HOST_NAME); 
      cy.get('[data-cy="add_new_host-port_number_label-text_field"]').find('input').should('have.value', PORT_NUMBER); 
      cy.get('[data-cy="add_new_host-user_id-text_field"]').find('input').should('have.value', TEST_USER); 
      cy.get('[data-cy="add_new_host-work_dir_label-text_field"]').find('input').should('have.value', HOST_WORK_DIR); 
      cy.get('[data-cy="add_new_host-private_key_path-text_field"]').find('input').should('have.value', PRIVATE_KEY_FILE);
      cy.get('[data-cy="add_new_host-job_schedulers-select"]').find('input').should('have.value', JOB_SCHEDULERS);
      cy.get('[data-cy="add_new_host-max_number_of_jobs-text_field"]').find('input').should('have.value', MAX_NUMBER);
      cy.get('[data-cy="add_new_host-available_queues-text_field"]').find('input').should('have.value', AVAILABLE_QUEUES);
      cy.get('[data-cy="add_new_host-use_bulkjob-checkbox"]').find('[type="checkbox"]').should('be.checked');
      cy.get('[data-cy="add_new_host-use_stepjob-checkbox"]').find('[type="checkbox"]').should('be.checked');
      cy.get('[data-cy="add_new_host-shared_path_on_shared_host-text_field"]').find('input').should('have.value', SHARED_HOST);
      cy.visit("/remotehost")
      cy.removeRemoteHost(LABEL);
    });

    /**
    設定入力後の反映確認
    編集ダイアログから確認
    詳細設定確認
    試験確認内容：値が正しく反映されていることを確認
    */
    it("01-01-030:設定入力後の反映確認-編集ダイアログから確認-詳細設定確認-値が正しく反映されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.enterRequiredRemoteHost(LABEL, HOST_NAME, PORT_NUMBER, TEST_USER);
      cy.enterRemoteHost(HOST_WORK_DIR, PRIVATE_KEY_FILE, JOB_SCHEDULERS, MAX_NUMBER, AVAILABLE_QUEUES, BULKJOB_CHK_YES, STEPJOB_CHK_YES, SHARED_HOST);
      cy.enterAdvancedRemoteHost(INTERVAL_MIN, STATUS_CHECK_SEC, HOST_MAX_NUMBER, EXECUTION_INTERVAL, TIMEOUT_DURING);
      cy.get('[data-cy="add_new_host-ok-btn"]').click();
      cy.get('[data-cy="action_row-edit-btn"]').click();
      cy.get('[data-cy="add_new_host-advanced_settings-title"]').click();
      cy.get('[data-cy="add_new_host-connection_renewal-text_field"]').find('input').should('have.value', INTERVAL_MIN);
      cy.get('[data-cy="add_new_host-status_check-text_field"]').find('input').should('have.value', STATUS_CHECK_SEC);
      cy.get('[data-cy="add_new_host-max_number-text_field"]').find('input').should('have.value', HOST_MAX_NUMBER);
      cy.get('[data-cy="add_new_host-execution_interval-text_field"]').find('input').should('have.value', EXECUTION_INTERVAL);
      cy.get('[data-cy="add_new_host-timeout_during-text_field"]').find('input').should('have.value', TIMEOUT_DURING);
      cy.visit("/remotehost")
      cy.removeRemoteHost(LABEL);
    });
  })
  