/**
 * ジョブ実行テスト
 */
describe("jobExecute", ()=>{
  const TYPE_INPUT = "input";
  const TYPE_OUTPUT = "output";
  const DEF_COMPONENT_TASK = "task";
  const DEF_COMPONENT_FOREACH = "foreach";
  const DEF_COMPONENT_WHILE = "while";
  const DEF_COMPONENT_WORKFLOW = "workflow";
  const TASK_NAME_0 = "task0";
  const TASK_NAME_1 = "task1";

  const FOREACH_NAME_0 = "foreach0";
  const WORKFLOW_NAME_0 = "workflow0";
  const WHILE_NAME_0 = "while0";
  const LOCAL_HOST = "localhost";
  const HOST_NAME = "wheel_release_test_server";
  const FILE_NAME_TASK1 = "task1.sh";
  const FILE_NAME_TASK2 = "task2.sh";
  const FILE_NAME_WHILE = "while.sh";

  const codeTask1 = `echo "test" > message.txt`;
  const codeTask2 = `cat message.txt >/dev/null 2>&1`;
  const codeWhile = [`set -eu`, `cnt=$(cat counter.txt)`, `if [ "$cnt" -lt 10 ]; then`, `  exit 0`, `else`, `  exit 1`].join("\n");

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
   * localhostでのタスク実行
   * 試験確認内容：ローカルホストに対するタスク実行ワークフローが
   * 完了(status:finished)となること
   */
  it("executeLocalhost", ()=>{
    //workflow作成
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 501, 500);
    //while 作成
    cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 501, 700);
    cy.setupWhileWithScriptAndCondition(FILE_NAME_WHILE, codeWhile);
    cy.closeProperty();
    //コンポーネント同士を接続
    cy.connectComponentMultiple(WORKFLOW_NAME_0, WHILE_NAME_0);
    //workflow選択
    cy.doubleClickComponentName(WORKFLOW_NAME_0);

    //foreach作成
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 501, 500);
    cy.setForeachLoop(2);
    cy.closeProperty();
    //foreach選択
    cy.doubleClickComponentName(FOREACH_NAME_0);
    //task 1つ目
    cy.createComponent(DEF_COMPONENT_TASK, TASK_NAME_0, 501, 500);
    cy.setupTaskWithScriptAndIO(FILE_NAME_TASK1, codeTask1, TYPE_OUTPUT, "message.txt", LOCAL_HOST);
    cy.closeProperty();
    //task 2つ目
    cy.createComponent(DEF_COMPONENT_TASK, TASK_NAME_1, 501, 700);
    cy.setupTaskWithScriptAndIO(FILE_NAME_TASK2, codeTask2, TYPE_INPUT, "message.txt", LOCAL_HOST);
    cy.closeProperty();
    //コンポーネント同士を接続
    cy.connectComponentMultiple(TASK_NAME_0, TASK_NAME_1);

    //タスク実行
    cy.get("[data-cy=\"workflow-play-btn\"]", { timeout: 3000 }).click();

    //完了まで待機
    cy.checkProjectStatus("finished");
  });

  /**
   * remoteHostでのタスク実行
   * 試験確認内容：リモートホストに対するタスク実行ワークフローが
   * 完了(status:finished)となること
   */
  it.skip("executeRemoteHost", ()=>{
    //workflow作成
    cy.createComponent(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 501, 500);
    //while 作成
    cy.createComponent(DEF_COMPONENT_WHILE, WHILE_NAME_0, 501, 700);
    cy.setupWhileWithScriptAndCondition(FILE_NAME_WHILE, codeWhile);
    cy.closeProperty();
    //コンポーネント同士を接続
    cy.connectComponentMultiple(WORKFLOW_NAME_0, WHILE_NAME_0);
    //workflow選択
    cy.doubleClickComponentName(WORKFLOW_NAME_0);
    //foreach作成
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 501, 500);
    cy.setForeachLoop(2);
    cy.closeProperty();
    //foreach選択
    cy.doubleClickComponentName(FOREACH_NAME_0);
    //task 1つ目
    cy.createComponent(DEF_COMPONENT_TASK, TASK_NAME_0, 501, 500);
    cy.setupTaskWithScriptAndIO(FILE_NAME_TASK1, codeTask1, TYPE_OUTPUT, "message.txt", HOST_NAME);
    cy.switchUseJobScheduler("on");
    cy.closeProperty();
    //task 2つ目
    cy.createComponent(DEF_COMPONENT_TASK, TASK_NAME_1, 501, 700);
    cy.setupTaskWithScriptAndIO(FILE_NAME_TASK2, codeTask2, TYPE_INPUT, "message.txt", HOST_NAME);
    cy.switchUseJobScheduler("on");
    cy.closeProperty();
    //コンポーネント同士を接続
    cy.connectComponentMultiple(TASK_NAME_0, TASK_NAME_1);

    //タスク実行
    cy.get("[data-cy=\"workflow-play-btn\"]", { timeout: 3000 }).click();

    //リモートアクセスパスワード
    cy.get("[data-cy=\"buttons-ok-btn\"]", { timeout: 3000 });
    cy.passwordType("passw0rd");

    //完了まで待機
    cy.checkProjectStatus("finished");
  });
});
