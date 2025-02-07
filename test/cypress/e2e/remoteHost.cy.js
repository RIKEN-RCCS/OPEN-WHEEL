describe("01:リモートホスト画面基本動作確認", ()=>{
    const label = "TestLabel"
    const hostname = "TestHostName"
    const portNumber = 20
    const testUser = "TestUser"
    const hostWorkDir = "$TESTHOME"
    const privateKyeFile = "TestPrivate.key"
    const jobSchedulers = "PBSPro"
    const maxNumber = 100
    const availableQueues = "TestQueues"
    const bulkjobChkYes = true
    const bulkjobChkNo = false
    const stepjobChkYes = true
    const stepjobChkNo = false
    const sharedHost = "TestSharedHost"
    const intervalMin = 5
    const statusCheckSec = 200
    const hostMaxNumber = 11
    const executionInterval = 6
    const timeoutDuring = 7
    
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
      cy.get('[data-cy="add_new_host-add_new_host-cardtitle"]').should('be.visible');
    });

    /**
    構成要素の機能動作確認
    「編集」ボタン押下
    試験確認内容：リモートホスト設定作成ダイアログが表示されていることを確認
    */
    it("01-01-006:構成要素の機能動作確認-「編集」ボタン押下-リモートホスト設定作成ダイアログが表示されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.get('[data-cy="add_new_host-label-text_field"]').type(label);
      cy.get('[data-cy="add_new_host-hostname-text_field"]').type(hostname);
      cy.get('[data-cy="add_new_host-port_number_label-text_field"]').type(portNumber);
      cy.get('[data-cy="add_new_host-user_id-text_field"]').type(testUser);
      cy.get('[data-cy="add_new_host-ok-btn"]').click();
      cy.get('[data-cy="action_row-edit-btn"]').click();
      cy.get('[data-cy="add_new_host-add_new_host-cardtitle"]').should('be.visible');
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
      cy.get('[data-cy="add_new_host-label-text_field"]').type(label);
      cy.get('[data-cy="add_new_host-hostname-text_field"]').type(hostname);
      cy.get('[data-cy="add_new_host-port_number_label-text_field"]').type(portNumber);
      cy.get('[data-cy="add_new_host-user_id-text_field"]').type(testUser);
      cy.get('[data-cy="add_new_host-ok-btn"]').click();
      // 削除ボタン
      cy.get('[data-cy="action_row-delete-btn"]').click();
      // 削除確認ダイアログ内CANCELボタン
      cy.get('[data-cy="buttons-ok_or_cancel-btn"]').eq(1).click();
      cy.get('[data-cy="remotehost-items-data_table"]').contains(label);
      cy.removeRemoteHost(label);
    });

    /**
    構成要素の機能動作確認
    「削除」ボタン押下
    削除実行
    試験確認内容：該当データの削除が行われていることを確認
    */
    it("01-01-008:構成要素の機能動作確認-「削除」ボタン押下-削除実行-該当データの削除が行われていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.get('[data-cy="add_new_host-label-text_field"]').type(label);
      cy.get('[data-cy="add_new_host-hostname-text_field"]').type(hostname);
      cy.get('[data-cy="add_new_host-port_number_label-text_field"]').type(portNumber);
      cy.get('[data-cy="add_new_host-user_id-text_field"]').type(testUser);
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
      cy.get('[data-cy="add_new_host-label-text_field"]').type(label);
      cy.get('[data-cy="add_new_host-label-text_field"]').find('input').should('have.value', label);
   });

   /**
    構成要素の設定入力確認
    テキスト入力
    「Hostname」テキストエリア
    試験確認内容：テキストが正しく入力されていることを確認
    */
    it("01-01-010:構成要素の設定入力確認-テキスト入力-「Hostname」テキストエリア-テキストが正しく入力されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.enterRequiredRemoteHost(label, hostname, portNumber, testUser);
      cy.get('[data-cy="add_new_host-hostname-text_field"]').find('input').should('have.value', hostname); 
    });

    /**
    構成要素の設定入力確認
    テキスト入力
    「Port number」テキストエリア
    試験確認内容：テキストが正しく入力されていることを確認
    */
    it("01-01-011:構成要素の設定入力確認-テキスト入力-「Port number」テキストエリア-テキストが正しく入力されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.enterRequiredRemoteHost(label, hostname, portNumber, testUser);
      cy.get('[data-cy="add_new_host-port_number_label-text_field"]').find('input').should('have.value', portNumber); 
    });

    /**
    構成要素の設定入力確認
    テキスト入力
    「User ID」テキストエリア
    試験確認内容：テキストが正しく入力されていることを確認
    */
    it("01-01-012:構成要素の設定入力確認-テキスト入力-「User ID」テキストエリア-テキストが正しく入力されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.enterRequiredRemoteHost(label, hostname, portNumber, testUser);
      cy.get('[data-cy="add_new_host-user_id-text_field"]').find('input').should('have.value', testUser); 
    });

    /**
    構成要素の設定入力確認
    テキスト入力
    「Host work dir」テキストエリア
    試験確認内容：テキストが正しく入力されていることを確認
    */
    it("01-01-013:構成要素の設定入力確認-テキスト入力-「Host work dir」テキストエリア-テキストが正しく入力されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.enterRequiredRemoteHost(label, hostname, portNumber, testUser);
      cy.enterRemoteHost(hostWorkDir, privateKyeFile, jobSchedulers, maxNumber, availableQueues, bulkjobChkYes, stepjobChkYes, sharedHost);
      cy.get('[data-cy="add_new_host-work_dir_label-text_field"]').find('input').should('have.value', hostWorkDir); 
    });

    /**
    構成要素の設定入力確認
    テキスト入力
    「private key path」テキストエリア
    試験確認内容：テキストが正しく入力されていることを確認
    */
    it("01-01-014:構成要素の設定入力確認-テキスト入力-「private key path」テキストエリア-テキストが正しく入力されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.enterRequiredRemoteHost(label, hostname, portNumber, testUser);
      cy.enterRemoteHost(hostWorkDir, privateKyeFile, jobSchedulers, maxNumber, availableQueues, bulkjobChkYes, stepjobChkYes, sharedHost);
      cy.get('[data-cy="add_new_host-private_key_path-text_field"]').find('input').should('have.value', privateKyeFile);
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
      cy.enterRequiredRemoteHost(label, hostname, portNumber, testUser);
      cy.enterRemoteHost(hostWorkDir, privateKyeFile, jobSchedulers, maxNumber, availableQueues, bulkjobChkYes, stepjobChkYes, sharedHost);
      cy.get('[data-cy="add_new_host-private_key_path-text_field"]').click();
      cy.get('[data-cy="add_new_host-job_schedulers-select"]').find('input').should('have.value', jobSchedulers);
    });

    /**
    構成要素の設定入力確認
    テキスト入力
    「max number of jobs」テキストエリア
    試験確認内容：テキストが正しく入力されていることを確認
    */
    it("01-01-017:構成要素の設定入力確認-テキスト入力-「max number of jobs」テキストエリア-テキストが正しく入力されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.enterRequiredRemoteHost(label, hostname, portNumber, testUser);
      cy.enterRemoteHost(hostWorkDir, privateKyeFile, jobSchedulers, maxNumber, availableQueues, bulkjobChkYes, stepjobChkYes, sharedHost);
      cy.get('[data-cy="add_new_host-max_number_of_jobs-text_field"]').find('input').should('have.value', maxNumber);
    });

    /**
    構成要素の設定入力確認
    テキスト入力
    「available queues」テキストエリア
    試験確認内容：テキストが正しく入力されていることを確認
    */
    it("01-01-018:構成要素の設定入力確認-テキスト入力-「available queues」テキストエリア-テキストが正しく入力されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.enterRequiredRemoteHost(label, hostname, portNumber, testUser);
      cy.enterRemoteHost(hostWorkDir, privateKyeFile, jobSchedulers, maxNumber, availableQueues, bulkjobChkYes, stepjobChkYes, sharedHost);
      cy.get('[data-cy="add_new_host-available_queues-text_field"]').find('input').should('have.value', availableQueues);
    });

    /**
    構成要素の設定入力確認
    チェックボックス選択
    「use bulkjob」チェックボックス
    試験確認内容：正しくチェックが行われていることを確認
    */
    it("01-01-019:構成要素の設定入力確認-テキスト入力-「use bulkjob」チェックボックス-正しくチェックが行われていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.enterRequiredRemoteHost(label, hostname, portNumber, testUser);
      cy.enterRemoteHost(hostWorkDir, privateKyeFile, jobSchedulers, maxNumber, availableQueues, bulkjobChkYes, stepjobChkYes, sharedHost);
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
      cy.enterRequiredRemoteHost(label, hostname, portNumber, testUser);
      cy.enterRemoteHost(hostWorkDir, privateKyeFile, jobSchedulers, maxNumber, availableQueues, bulkjobChkYes, stepjobChkYes, sharedHost);
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
      cy.enterRequiredRemoteHost(label, hostname, portNumber, testUser);
      cy.get('[data-cy="add_new_host-ok-btn"]').click();
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.get('[data-cy="add_new_host-shared_host-select"]').type(label);
      cy.get('[data-cy="add_new_host-shared_host-select"]').click();
      cy.get('[data-cy="add_new_host-shared_host-select"]').find('input').should('have.value', label);
      cy.goToScreen('remotehost');
      cy.removeRemoteHost(label);
    });

    /**
    構成要素の設定入力確認
    テキスト入力
    「shared path on shared host」テキストエリア
    試験確認内容：テキストが正しく入力されていることを確認
    */
    it("01-01-022:構成要素の設定入力確認-テキスト入力-「shared path on shared host」テキストエリア-テキストが正しく入力されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.enterRequiredRemoteHost(label, hostname, portNumber, testUser);
      cy.enterRemoteHost(hostWorkDir, privateKyeFile, jobSchedulers, maxNumber, availableQueues, bulkjobChkYes, stepjobChkYes, sharedHost);
      cy.get('[data-cy="add_new_host-shared_path_on_shared_host-text_field"]').find('input').should('have.value', sharedHost);
    });

    /**
    構成要素の設定入力確認
    テキスト入力
    「connection renewal interval (min.)」テキストエリア
    試験確認内容：テキストが正しく入力されていることを確認
    */
    it("01-01-023:構成要素の設定入力確認-テキスト入力-「connection renewal interval (min.)」テキストエリア-テキストが正しく入力されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.enterRequiredRemoteHost(label, hostname, portNumber, testUser);
      cy.enterRemoteHost(hostWorkDir, privateKyeFile, jobSchedulers, maxNumber, availableQueues, bulkjobChkYes, stepjobChkYes, sharedHost);
      cy.enterAdvancedRemoteHost(intervalMin, statusCheckSec, hostMaxNumber, executionInterval, timeoutDuring);
      cy.get('[data-cy="add_new_host-connection_renewal-text_field"]').find('input').should('have.value', intervalMin);
    });

    /**
    構成要素の設定入力確認
    テキスト入力
    「status check interval (sec.)」テキストエリア
    試験確認内容：テキストが正しく入力されていることを確認
    */
    it("01-01-024:構成要素の設定入力確認-テキスト入力-「status check interval (sec.)」テキストエリア-テキストが正しく入力されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.enterRequiredRemoteHost(label, hostname, portNumber, testUser);
      cy.enterRemoteHost(hostWorkDir, privateKyeFile, jobSchedulers, maxNumber, availableQueues, bulkjobChkYes, stepjobChkYes, sharedHost);
      cy.enterAdvancedRemoteHost(intervalMin, statusCheckSec, hostMaxNumber, executionInterval, timeoutDuring);
      cy.get('[data-cy="add_new_host-status_check-text_field"]').find('input').should('have.value', statusCheckSec);
    });

    /**
    構成要素の設定入力確認
    テキスト入力
    「max number of status check error allowed」テキストエリア
    試験確認内容：テキストが正しく入力されていることを確認
    */
    it("01-01-025:構成要素の設定入力確認-テキスト入力-「max number of status check error allowed」テキストエリア-テキストが正しく入力されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.enterRequiredRemoteHost(label, hostname, portNumber, testUser);
      cy.enterRemoteHost(hostWorkDir, privateKyeFile, jobSchedulers, maxNumber, availableQueues, bulkjobChkYes, stepjobChkYes, sharedHost);
      cy.enterAdvancedRemoteHost(intervalMin, statusCheckSec, hostMaxNumber, executionInterval, timeoutDuring);
      cy.get('[data-cy="add_new_host-max_number-text_field"]').find('input').should('have.value', hostMaxNumber);
    });

    /**
    構成要素の設定入力確認
    テキスト入力
    「execution interval」テキストエリア
    試験確認内容：テキストが正しく入力されていることを確認
    */
    it("01-01-026:構成要素の設定入力確認-テキスト入力-「execution interval」テキストエリア-テキストが正しく入力されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.enterRequiredRemoteHost(label, hostname, portNumber, testUser);
      cy.enterRemoteHost(hostWorkDir, privateKyeFile, jobSchedulers, maxNumber, availableQueues, bulkjobChkYes, stepjobChkYes, sharedHost);
      cy.enterAdvancedRemoteHost(intervalMin, statusCheckSec, hostMaxNumber, executionInterval, timeoutDuring);
      cy.get('[data-cy="add_new_host-execution_interval-text_field"]').find('input').should('have.value', executionInterval);
    });

    /**
    構成要素の設定入力確認
    テキスト入力
    「timeout during handshake phase」テキストエリア
    試験確認内容：テキストが正しく入力されていることを確認
    */
    it("01-01-027:構成要素の設定入力確認-テキスト入力-「timeout during handshake phase」テキストエリア-テキストが正しく入力されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.enterRequiredRemoteHost(label, hostname, portNumber, testUser);
      cy.enterRemoteHost(hostWorkDir, privateKyeFile, jobSchedulers, maxNumber, availableQueues, bulkjobChkYes, stepjobChkYes, sharedHost);
      cy.enterAdvancedRemoteHost(intervalMin, statusCheckSec, hostMaxNumber, executionInterval, timeoutDuring);
      cy.get('[data-cy="add_new_host-timeout_during-text_field"]').find('input').should('have.value', timeoutDuring);
    });

    /**
    設定入力後の反映確認
    一覧から確認
    試験確認内容：値が正しく反映されていることを確認
    */
    it("01-01-028:設定入力後の反映確認-一覧から確認-値が正しく反映されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.enterRequiredRemoteHost(label, hostname, portNumber, testUser);
      cy.enterRemoteHost(hostWorkDir, privateKyeFile, jobSchedulers, maxNumber, availableQueues, bulkjobChkNo, stepjobChkNo, sharedHost);
      cy.get('[data-cy="add_new_host-ok-btn"]').click();
      cy.get('[data-cy="remotehost-items-data_table"]').contains(label);
      cy.get('[data-cy="remotehost-items-data_table"]').contains(hostname);
      cy.get('[data-cy="remotehost-items-data_table"]').contains(portNumber);
      cy.get('[data-cy="remotehost-items-data_table"]').contains(testUser);     
      cy.get('[data-cy="remotehost-items-data_table"]').contains(privateKyeFile);
      cy.removeRemoteHost(label);
    });

    /**
    設定入力後の反映確認
    編集ダイアログから確認
    基本設定確認
    試験確認内容：値が正しく反映されていることを確認
    */
    it("01-01-029:設定入力後の反映確認-編集ダイアログから確認-基本設定確認-値が正しく反映されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.enterRequiredRemoteHost(label, hostname, portNumber, testUser);
      cy.enterRemoteHost(hostWorkDir, privateKyeFile, jobSchedulers, maxNumber, availableQueues, bulkjobChkYes, stepjobChkYes, sharedHost);
      cy.get('[data-cy="add_new_host-ok-btn"]').click();
      cy.get('[data-cy="action_row-edit-btn"]').click();
      cy.get('[data-cy="add_new_host-label-text_field"]').find('input').should('have.value', label);
      cy.get('[data-cy="add_new_host-hostname-text_field"]').find('input').should('have.value', hostname); 
      cy.get('[data-cy="add_new_host-port_number_label-text_field"]').find('input').should('have.value', portNumber); 
      cy.get('[data-cy="add_new_host-user_id-text_field"]').find('input').should('have.value', testUser); 
      cy.get('[data-cy="add_new_host-work_dir_label-text_field"]').find('input').should('have.value', hostWorkDir); 
      cy.get('[data-cy="add_new_host-private_key_path-text_field"]').find('input').should('have.value', privateKyeFile);
      cy.get('[data-cy="add_new_host-job_schedulers-select"]').find('input').should('have.value', jobSchedulers);
      cy.get('[data-cy="add_new_host-max_number_of_jobs-text_field"]').find('input').should('have.value', maxNumber);
      cy.get('[data-cy="add_new_host-available_queues-text_field"]').find('input').should('have.value', availableQueues);
      cy.get('[data-cy="add_new_host-use_bulkjob-checkbox"]').find('[type="checkbox"]').should('be.checked');
      cy.get('[data-cy="add_new_host-use_stepjob-checkbox"]').find('[type="checkbox"]').should('be.checked');
      cy.get('[data-cy="add_new_host-shared_path_on_shared_host-text_field"]').find('input').should('have.value', sharedHost);
      cy.goToScreen('remotehost');
      cy.removeRemoteHost(label);
    });

    /**
    設定入力後の反映確認
    編集ダイアログから確認
    詳細設定確認
    試験確認内容：値が正しく反映されていることを確認
    */
    it("01-01-030:設定入力後の反映確認-編集ダイアログから確認-詳細設定確認-値が正しく反映されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.enterRequiredRemoteHost(label, hostname, portNumber, testUser);
      cy.enterRemoteHost(hostWorkDir, privateKyeFile, jobSchedulers, maxNumber, availableQueues, bulkjobChkYes, stepjobChkYes, sharedHost);
      cy.enterAdvancedRemoteHost(intervalMin, statusCheckSec, hostMaxNumber, executionInterval, timeoutDuring);
      cy.get('[data-cy="add_new_host-ok-btn"]').click();
      cy.get('[data-cy="action_row-edit-btn"]').click();
      cy.get('[data-cy="add_new_host-advanced_settings-title"]').click();
      cy.get('[data-cy="add_new_host-connection_renewal-text_field"]').find('input').should('have.value', intervalMin);
      cy.get('[data-cy="add_new_host-status_check-text_field"]').find('input').should('have.value', statusCheckSec);
      cy.get('[data-cy="add_new_host-max_number-text_field"]').find('input').should('have.value', hostMaxNumber);
      cy.get('[data-cy="add_new_host-execution_interval-text_field"]').find('input').should('have.value', executionInterval);
      cy.get('[data-cy="add_new_host-timeout_during-text_field"]').find('input').should('have.value', timeoutDuring);
      cy.goToScreen('remotehost');
      cy.removeRemoteHost(label);
    });
  })
  