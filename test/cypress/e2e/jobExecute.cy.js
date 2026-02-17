describe("jobExecute", ()=>{
  const TYPE_INPUT = "input";
  const TYPE_OUTPUT = "output";
  const DEF_COMPONENT_TASK = "task";
  const TASK_NAME_0 = "task0";
  const TASK_NAME_1 = "task1";
  const DEF_COMPONENT_FOREACH = "foreach";
  const FOREACH_NAME_0 = "foreach0";

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
   * 現状実行完了までを確認
   * ファイルの生成の確認方法を検討中
   */
  it("localhostでのタスク実行", ()=>{
    const fileNameTask1 = "task1.sh";
    const fileNameTask2 = "task2.sh";
    const codeTask1 = `echo "test" > message.txt`;
    const codeTask2 = `cat message.txt >/dev/null 2>&1`;

    //foreach作成
    cy.createComponent(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 501, 500);

    //loop設定
    cy.get("[data-cy=\"component_property-loop_set_foreach-panel_title\"]").scrollIntoView()
      .click();
    cy.get("[data-cy=\"component_property-index_foreach-list_form\"]").find("input")
      .type(1);
    cy.get("[data-cy=\"list_form-add-text_field\"]").find("[role=\"button\"]")
      .eq(1)
      .click();

    //プロパティを閉じる
    cy.closeProperty();

    //foreach作成
    cy.doubleClickComponentName(FOREACH_NAME_0);

    //task 1つ目
    cy.createComponent(DEF_COMPONENT_TASK, TASK_NAME_0, 501, 500);

    //シェル作成
    cy.setupTaskWithScriptAndIO(fileNameTask1, codeTask1, TYPE_OUTPUT, "message.txt", "localhost");

    //プロパティを閉じる
    cy.closeProperty();

    //task 2つ目
    cy.createComponent(DEF_COMPONENT_TASK, TASK_NAME_1, 501, 700);

    //シェル作成
    cy.setupTaskWithScriptAndIO(fileNameTask2, codeTask2, TYPE_INPUT, "message.txt", "localhost");

    //プロパティを閉じる
    cy.closeProperty();

    //コンポーネント同士を接続
    cy.connectComponentMultiple(TASK_NAME_0, TASK_NAME_1);

    //待機
    cy.wait(300);

    //タスク実行
    cy.get("[data-cy=\"workflow-play-btn\"]").click();

    //完了まち
    cy.checkProjectStatus("finished");
  });
});
