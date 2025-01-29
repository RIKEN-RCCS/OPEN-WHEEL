describe("01:リモートホスト画面基本動作確認", ()=>{
    const label = "TestLabel"
    const hostname = "TestHostName"
    const portNumber = 20
    const testUser = "TestUser"
    const hostWorkDir = "$TESTHOME"
    const privateKyeFile = "TestPrivate.key"
    const jobScheduler = "PBSPro"
    const maxNumber = 100
    const availableQueues = "TestQueues"
    const sharedHost = "TestSharedHost"
    const intervalMin = 5
    const statusCheckSec = 100
    const hostMaxNumber = 11
    const executionInterval = 6
    const timeoutDuring = 7
    
    before(()=>{
      cy.visit("/remotehost")
    })
  
    beforeEach(()=>{
      cy.visit("/remotehost")
    })
    
    /** 
    リモートホスト設定画面への遷移
    試験確認内容：リモートホスト設定画面に遷移することを確認
    */
    it("01-01-001:リモートホスト設定画面に遷移することを確認", ()=>{
      cy.visit("/")
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
      cy.get('[data-cy="home-open-btn"]').should('be.visible')
    });

    /**
    構成要素の機能動作確認
    「NEW REMOTE HOST SETTINGS」ボタン押下
    試験確認内容：リモートホスト設定作成ダイアログが表示されていることを確認
    */
    it("01-01-003:構成要素の機能動作確認-「NEW REMOTE HOST SETTINGS」ボタン押下-リモートホスト設定作成ダイアログが表示されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.get('[data-cy="add_new_host-add_new_host-title"]').should('be.visible');
    });

    /**
    構成要素の機能動作確認
    「編集」ボタン押下
    試験確認内容：リモートホスト設定作成ダイアログが表示されていることを確認
    */
    it("01-01-006:構成要素の機能動作確認-「編集」ボタン押下-リモートホスト設定作成ダイアログが表示されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.get('[data-cy="add_new_host-label-textarea"]').type(label);
      cy.get('[data-cy="add_new_host-hostname-textarea"]').type(hostname);
      cy.get('[data-cy="add_new_host-port_number_label-textarea"]').type(8000);
      cy.get('[data-cy="add_new_host-user_id-textarea"]').type(testUser);
      cy.get('[data-cy="add_new_host-ok-btn"]').click();
      cy.get('.mdi-pencil').click();
      cy.get('[data-cy="add_new_host-add_new_host-title"]').should('be.visible');
      // ダイアログ内のテキスト確認
      cy.get('#input-52').should('have.value', 'TestHostName');
      // ダイアログ内のOKボタン
      cy.get('[data-cy="add_new_host-ok-btn"]').click();
      // 削除ボタン
      cy.get('.mdi-delete').click();
      // 削除確認ダイアログ内OKボタン
      cy.get('[data-cy="buttons-ok_or_cancel-buttons"]').first().click();
    });

    /**
    構成要素の機能動作確認
    「削除」ボタン押下
    削除キャンセル
    試験確認内容：該当データの削除が行われていないことを確認
    */
    it("01-01-007:構成要素の機能動作確認-「削除」ボタン押下-削除キャンセル-該当データの削除が行われていないことを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.get('[data-cy="add_new_host-label-textarea"]').type(label);
      cy.get('[data-cy="add_new_host-hostname-textarea"]').type(hostname);
      cy.get('[data-cy="add_new_host-port_number_label-textarea"]').type(8000);
      cy.get('[data-cy="add_new_host-user_id-textarea"]').type(testUser);
      cy.get('[data-cy="add_new_host-ok-btn"]').click();
      // 削除ボタン
      cy.get('.mdi-delete').click();
      // 削除確認ダイアログ内CANCELCANCELボタン
      cy.get('[data-cy="buttons-ok_or_cancel-buttons"]').eq(1).click();

      cy.remoteHostRemove(label);
    });

    /**
    構成要素の機能動作確認
    「削除」ボタン押下
    削除実行
    試験確認内容：該当データの削除が行われていることを確認
    */
    it("01-01-008:構成要素の機能動作確認-「削除」ボタン押下-削除実行-該当データの削除が行われていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.get('[data-cy="add_new_host-label-textarea"]').type(label);
      cy.get('[data-cy="add_new_host-hostname-textarea"]').type(hostname);
      cy.get('[data-cy="add_new_host-port_number_label-textarea"]').type(8000);
      cy.get('[data-cy="add_new_host-user_id-textarea"]').type(testUser);
      cy.get('[data-cy="add_new_host-ok-btn"]').click();
      // 削除ボタン
      cy.get('.mdi-delete').click();
      // 削除確認ダイアログ内OKボタン
      cy.get('[data-cy="buttons-ok_or_cancel-buttons"]').first().click();
    });

    /**
    構成要素の設定入力確認
    テキスト入力
    「label」テキストエリア
    試験確認内容：テキストが正しく入力されていることを確認
    */
    it("01-01-009:構成要素の設定入力確認-テキスト入力-「label」テキストエリア-テキストが正しく入力されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.get('[data-cy="add_new_host-label-textarea"]').type(label);
      cy.get('[data-cy="add_new_host-label-textarea"]').find('input').should('have.value', 'TestLabel');
   });

   /**
    構成要素の設定入力確認
    テキスト入力
    「Hostname」テキストエリア
    試験確認内容：テキストが正しく入力されていることを確認
    */
    it("01-01-010:構成要素の設定入力確認-テキスト入力-「Hostname」テキストエリア-テキストが正しく入力されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.remoteHostEnterRequired();
      cy.get('[data-cy="add_new_host-hostname-textarea"]').clear();
      cy.get('[data-cy="add_new_host-hostname-textarea"]').type(hostname);
      cy.get('[data-cy="add_new_host-hostname-textarea"]').find('input').should('have.value', 'TestHostName'); 
    });

    /**
    構成要素の設定入力確認
    テキスト入力
    「Port number」テキストエリア
    試験確認内容：テキストが正しく入力されていることを確認
    */
    it("01-01-011:構成要素の設定入力確認-テキスト入力-「Port number」テキストエリア-テキストが正しく入力されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.remoteHostEnterRequired();
      cy.get('[data-cy="add_new_host-port_number_label-textarea"]').clear();
      cy.get('[data-cy="add_new_host-port_number_label-textarea"]').type(portNumber);
      cy.get('[data-cy="add_new_host-port_number_label-textarea"]').find('input').should('have.value', 20); 
    });

    /**
    構成要素の設定入力確認
    テキスト入力
    「User ID」テキストエリア
    試験確認内容：テキストが正しく入力されていることを確認
    */
    it("01-01-012:構成要素の設定入力確認-テキスト入力-「User ID」テキストエリア-テキストが正しく入力されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.remoteHostEnterRequired();
      cy.get('#input-20').clear();
      cy.get('[data-cy="add_new_host-user_id-textarea"]').type(testUser);
      cy.get('[data-cy="add_new_host-user_id-textarea"]').find('input').should('have.value', 'TestUser'); 
    });

    /**
    構成要素の設定入力確認
    テキスト入力
    「Host work dir」テキストエリア
    試験確認内容：テキストが正しく入力されていることを確認
    */
    it("01-01-013:構成要素の設定入力確認-テキスト入力-「Host work dir」テキストエリア-テキストが正しく入力されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.remoteHostEnterRequired();
      cy.get('#input-22').clear();
      cy.get('[data-cy="add_new_host-work_dir_label-textarea"]').type(hostWorkDir);
      cy.get('[data-cy="add_new_host-work_dir_label-textarea"]').find('input').should('have.value', '$TESTHOME'); 
    });

    /**
    構成要素の設定入力確認
    テキスト入力
    「private key path」テキストエリア
    試験確認内容：テキストが正しく入力されていることを確認
    */
    it("01-01-014:構成要素の設定入力確認-テキスト入力-「private key path」テキストエリア-テキストが正しく入力されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.remoteHostEnterRequired();
      cy.remoteHostEnter();
      cy.get('[data-cy="add_new_host-private_key_path-textarea"]').find('input').clear();
      cy.get('[data-cy="add_new_host-private_key_path-textarea"]').type(privateKyeFile);
      cy.get('[data-cy="add_new_host-private_key_path-textarea"]').find('input').should('have.value', 'TestPrivate.key');
    });

    /**
    構成要素の設定入力確認
    セレクトボックス選択
    「job scheduler」セレクトボックス
    試験確認内容：選択した値が正しく反映されていることを確認
    */
    it("01-01-016:構成要素の設定入力確認-テキスト入力-「job scheduler」テキストエリア-選択した値が正しく反映されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.remoteHostEnterRequired();
      cy.remoteHostEnter();
      cy.get('[data-cy="add_new_host-private_key_path-textarea"]').click();
      cy.get('[data-cy="add_new_host-job_schedulers-textarea"]').find('input').should('have.value', 'PBSPro');
    });

    /**
    構成要素の設定入力確認
    テキスト入力
    「max number of jobs」テキストエリア
    試験確認内容：テキストが正しく入力されていることを確認
    */
    it("01-01-017:構成要素の設定入力確認-テキスト入力-「max number of jobs」テキストエリア-テキストが正しく入力されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.remoteHostEnterRequired();
      cy.remoteHostEnter();
      cy.get('[data-cy="add_new_host-max_number_of_jobs-textarea"]').find('input').clear();
      cy.get('[data-cy="add_new_host-max_number_of_jobs-textarea"]').type(maxNumber);
      cy.get('[data-cy="add_new_host-max_number_of_jobs-textarea"]').find('input').should('have.value', 100);
    });

    /**
    構成要素の設定入力確認
    テキスト入力
    「available queues」テキストエリア
    試験確認内容：テキストが正しく入力されていることを確認
    */
    it("01-01-018:構成要素の設定入力確認-テキスト入力-「available queues」テキストエリア-テキストが正しく入力されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.remoteHostEnterRequired();
      cy.remoteHostEnter();
      cy.get('[data-cy="add_new_host-available_queues-textarea"]').find('input').clear();
      cy.get('[data-cy="add_new_host-available_queues-textarea"]').type(availableQueues);
      cy.get('[data-cy="add_new_host-available_queues-textarea"]').find('input').should('have.value', 'TestQueues');
    });

    /**
    構成要素の設定入力確認
    チェックボックス選択
    「use bulkjob」チェックボックス
    試験確認内容：正しくチェックが行われていることを確認
    */
    it("01-01-019:構成要素の設定入力確認-テキスト入力-「use bulkjob」チェックボックス-正しくチェックが行われていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.remoteHostEnterRequired();
      cy.remoteHostEnter();
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
      cy.remoteHostEnterRequired();
      cy.remoteHostEnter();
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
      cy.remoteHostEnterRequired();
      cy.get('[data-cy="add_new_host-ok-btn"]').click();
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.get('[data-cy="add_new_host-shared_host-selectbox"]').type('TestLabel');
      cy.get('[data-cy="add_new_host-shared_host-selectbox"]').click();
      cy.get('[data-cy="add_new_host-shared_host-selectbox"]').find('input').should('have.value', 'TestLabel');
      cy.visit("/remotehost");
      cy.get('.mdi-delete').click();
      cy.get('[data-cy="buttons-ok_or_cancel-buttons"]').first().click();
    });

    /**
    構成要素の設定入力確認
    テキスト入力
    「shared path on shared host」テキストエリア
    試験確認内容：テキストが正しく入力されていることを確認
    */
    it("01-01-022:構成要素の設定入力確認-テキスト入力-「shared path on shared host」テキストエリア-テキストが正しく入力されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.remoteHostEnterRequired();
      cy.remoteHostEnter();
      cy.get('[data-cy="add_new_host-shared_path_on_shared_host-textarea"]').find('input').clear();
      cy.get('[data-cy="add_new_host-shared_path_on_shared_host-textarea"]').find('input').type(sharedHost);
      cy.get('[data-cy="add_new_host-shared_path_on_shared_host-textarea"]').find('input').should('have.value', 'TestSharedHost');
    });

    /**
    構成要素の設定入力確認
    テキスト入力
    「connection renewal interval (min.)」テキストエリア
    試験確認内容：テキストが正しく入力されていることを確認
    */
    it("01-01-023:構成要素の設定入力確認-テキスト入力-「connection renewal interval (min.)」テキストエリア-テキストが正しく入力されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.remoteHostEnterRequired();
      cy.remoteHostEnter();
      cy.remoteHostEnterAdvanced();
      cy.get('[data-cy="add_new_host-connection_renewal-textarea"]').find('input').clear();
      cy.get('[data-cy="add_new_host-connection_renewal-textarea"]').find('input').type(intervalMin);
      cy.get('[data-cy="add_new_host-connection_renewal-textarea"]').find('input').should('have.value', 5);
    });

    /**
    構成要素の設定入力確認
    テキスト入力
    「status check interval (sec.)」テキストエリア
    試験確認内容：テキストが正しく入力されていることを確認
    */
    it("01-01-024:構成要素の設定入力確認-テキスト入力-「status check interval (sec.)」テキストエリア-テキストが正しく入力されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.remoteHostEnterRequired();
      cy.remoteHostEnter();
      cy.remoteHostEnterAdvanced();
      cy.get('[data-cy="add_new_host-status_check-textarea"]').find('input').clear();
      cy.get('[data-cy="add_new_host-status_check-textarea"]').find('input').type(statusCheckSec);
      cy.get('[data-cy="add_new_host-status_check-textarea"]').find('input').should('have.value', 100);
    });

    /**
    構成要素の設定入力確認
    テキスト入力
    「max number of status check error allowed」テキストエリア
    試験確認内容：テキストが正しく入力されていることを確認
    */
    it("01-01-025:構成要素の設定入力確認-テキスト入力-「max number of status check error allowed」テキストエリア-テキストが正しく入力されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.remoteHostEnterRequired();
      cy.remoteHostEnter();
      cy.remoteHostEnterAdvanced();
      cy.get('[data-cy="add_new_host-max_number-textarea"]').find('input').clear();
      cy.get('[data-cy="add_new_host-max_number-textarea"]').find('input').type(hostMaxNumber);
      cy.get('[data-cy="add_new_host-max_number-textarea"]').find('input').should('have.value', 11);
    });

    /**
    構成要素の設定入力確認
    テキスト入力
    「execution interval」テキストエリア
    試験確認内容：テキストが正しく入力されていることを確認
    */
    it("01-01-026:構成要素の設定入力確認-テキスト入力-「execution interval」テキストエリア-テキストが正しく入力されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.remoteHostEnterRequired();
      cy.remoteHostEnter();
      cy.remoteHostEnterAdvanced();
      cy.get('[data-cy="add_new_host-execution_interval-textarea"]').find('input').clear();
      cy.get('[data-cy="add_new_host-execution_interval-textarea"]').find('input').type(executionInterval);
      cy.get('[data-cy="add_new_host-execution_interval-textarea"]').find('input').should('have.value', 6);
    });

    /**
    構成要素の設定入力確認
    テキスト入力
    「timeout during handshake phase」テキストエリア
    試験確認内容：テキストが正しく入力されていることを確認
    */
    it("01-01-027:構成要素の設定入力確認-テキスト入力-「timeout during handshake phase」テキストエリア-テキストが正しく入力されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.remoteHostEnterRequired();
      cy.remoteHostEnter();
      cy.remoteHostEnterAdvanced();
      cy.get('[data-cy="add_new_host-timeout_during-textarea"]').find('input').clear();
      cy.get('[data-cy="add_new_host-timeout_during-textarea"]').find('input').type(timeoutDuring);
      cy.get('[data-cy="add_new_host-timeout_during-textarea"]').find('input').should('have.value', 7);
    });

    /**
    設定入力後の反映確認
    一覧から確認
    試験確認内容：値が正しく反映されていることを確認
    */
    it("01-01-028:設定入力後の反映確認-一覧から確認-値が正しく反映されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.remoteHostEnterRequired();
      cy.get('[data-cy="add_new_host-ok-btn"]').click();
      cy.contains('.v-data-table__td', 'TestLabel'); 
      cy.contains('.v-data-table__td', 'TestHostName');
      cy.contains('.v-data-table__td', 20);
      cy.contains('.v-data-table__td', 'TestUser');
      // 削除ボタン
      cy.get('.mdi-delete').click();
      // 削除確認ダイアログ内OKボタン
      cy.get('[data-cy="buttons-ok_or_cancel-buttons"]').first().click();
    });

    /**
    設定入力後の反映確認
    編集ダイアログから確認
    基本設定確認
    試験確認内容：値が正しく反映されていることを確認
    */
    it("01-01-029:設定入力後の反映確認-編集ダイアログから確認-基本設定確認-値が正しく反映されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.remoteHostEnterRequired();
      cy.remoteHostEnter();
      cy.get('[data-cy="add_new_host-ok-btn"]').click();
      cy.get('.mdi-pencil').click();
      cy.get('[data-cy="add_new_host-label-textarea"]').find('input').should('have.value', 'TestLabel');
      cy.get('[data-cy="add_new_host-hostname-textarea"]').find('input').should('have.value', 'TestHostName'); 
      cy.get('[data-cy="add_new_host-port_number_label-textarea"]').find('input').should('have.value', 20); 
      cy.get('[data-cy="add_new_host-user_id-textarea"]').find('input').should('have.value', 'TestUser'); 
      cy.get('[data-cy="add_new_host-work_dir_label-textarea"]').find('input').should('have.value', '$TESTHOME'); 
      cy.get('[data-cy="add_new_host-private_key_path-textarea"]').find('input').should('have.value', 'TestPrivate.key');
      cy.get('[data-cy="add_new_host-job_schedulers-textarea"]').find('input').should('have.value', 'PBSPro');
      cy.get('[data-cy="add_new_host-max_number_of_jobs-textarea"]').find('input').should('have.value', 100);
      cy.get('[data-cy="add_new_host-available_queues-textarea"]').find('input').should('have.value', 'TestQueues');
      cy.get('[data-cy="add_new_host-use_bulkjob-checkbox"]').find('[type="checkbox"]').should('be.checked');
      cy.get('[data-cy="add_new_host-use_stepjob-checkbox"]').find('[type="checkbox"]').should('be.checked');
      cy.get('[data-cy="add_new_host-shared_path_on_shared_host-textarea"]').find('input').should('have.value', 'TestSharedHost');
      cy.visit("/remotehost")
      // 削除ボタン
      cy.get('.mdi-delete').click();
      // 削除確認ダイアログ内OKボタン
      cy.get('[data-cy="buttons-ok_or_cancel-buttons"]').first().click(); 
    });

    /**
    設定入力後の反映確認
    編集ダイアログから確認
    詳細設定確認
    試験確認内容：値が正しく反映されていることを確認
    */
    it("01-01-029:設定入力後の反映確認-編集ダイアログから確認-詳細設定確認-値が正しく反映されていることを確認", ()=>{
      cy.get('[data-cy="remotehost-new_remote_host_setting-btn"]').click();
      cy.remoteHostEnterRequired();
      cy.remoteHostEnter();
      cy.remoteHostEnterAdvanced();
      cy.get('[data-cy="add_new_host-ok-btn"]').click();
      cy.get('.mdi-pencil').click();
      cy.get('[data-cy="add_new_host-advanced_settings-title"]').click();
      cy.get('[data-cy="add_new_host-connection_renewal-textarea"]').find('input').should('have.value', 5);
      cy.get('[data-cy="add_new_host-status_check-textarea"]').find('input').should('have.value', 100);
      cy.get('[data-cy="add_new_host-max_number-textarea"]').find('input').should('have.value', 11);
      cy.get('[data-cy="add_new_host-execution_interval-textarea"]').find('input').should('have.value', 6);
      cy.get('[data-cy="add_new_host-timeout_during-textarea"]').find('input').should('have.value', 7);
      cy.visit("/remotehost")
      // 削除ボタン
      cy.get('.mdi-delete').click();
      // 削除確認ダイアログ内OKボタン
      cy.get('[data-cy="buttons-ok_or_cancel-buttons"]').first().click(); 
    });
  })
  