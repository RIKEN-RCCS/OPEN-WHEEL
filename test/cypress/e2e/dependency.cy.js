describe("06:ディペンデンシー&データリンク接続状態のワークフロー作成動作確認", ()=>{
  const PROJECT_NAME = `WHEEL_TEST_${Date.now().toString()}`;
  const PROJECT_DESCRIPTION = "TestDescription";
  const DEF_COMPONENT_TASK = "task";
  const DEF_COMPONENT_IF = "if";
  const DEF_COMPONENT_FOR = "for";
  const DEF_COMPONENT_WHILE = "while";
  const DEF_COMPONENT_FOREACH = "foreach";
  const DEF_COMPONENT_PS = "parameterStudy";
  const DEF_COMPONENT_WORKFLOW = "workflow";
  const DEF_COMPONENT_STEPJOB = "stepjob";
  const DEF_COMPONENT_BJ_TASK = "bulkjobTask";
  const TASK_NAME_0 = "task0";
  const IF_NAME_0 = "if0";
  const FOR_NAME_0 = "for0";
  const WHILE_NAME_0 = "while0";
  const FOREACH_NAME_0 = "foreach0";
  const PS_NAME_0 = "PS0";
  const WORKFLOW_NAME_0 = "workflow0";
  const STEPJOB_NAME_0 = "stepjob0";
  const BJ_TASK_NAME_0 = "bjTask0";

  beforeEach(()=>{
    cy.createProject(PROJECT_NAME, PROJECT_DESCRIPTION);
    cy.projectOpen(PROJECT_NAME);
    cy.viewport("macbook-16");
  });

  afterEach(()=>{
    cy.removeAllProjects();
  });

  /**
  ディペンデンシー&データリンク接続状態のワークフロー作成動作確認
  ワークフロー作成動作確認
  全コンポーネントを接続させたワークフロー作成時の動作確認
  Viewer/Source/Storage/StepJobTaskを除く全コンポーネントの接続確認
  試験確認内容：コンポーネントが接続されていることを確認
   */
  it("06-01-001:ディペンデンシー&データリンク接続状態のワークフロー作成動作確認-ワークフロー作成動作確認-全コンポーネントを接続させたワークフロー作成時の動作確認-Viewer/Source/Storage/StepJobTaskを除く全コンポーネントの接続確認-コンポーネントが接続されていることを確認", ()=>{
    cy.createComponentNotOpenProperty(DEF_COMPONENT_TASK, TASK_NAME_0, 300, 300);
    cy.createComponentNotOpenProperty(DEF_COMPONENT_IF, IF_NAME_0, 300, 350);
    cy.connectComponentMultiple(IF_NAME_0, 2); //TASKとIFを接続
    cy.checkConnectionLineMultiple(TASK_NAME_0, IF_NAME_0, 0); //作成したコンポーネントの座標を取得して接続線の座標と比較
    cy.createComponentNotOpenProperty(DEF_COMPONENT_FOR, FOR_NAME_0, 300, 400);
    cy.connectComponentMultiple(FOR_NAME_0, 3); //IFとFORを接続
    cy.checkConnectionLineMultiple(TASK_NAME_0, FOR_NAME_0, 1); //作成したコンポーネントの座標を取得して接続線の座標と比較
    cy.createComponentNotOpenProperty(DEF_COMPONENT_WHILE, WHILE_NAME_0, 300, 480);
    cy.connectComponentMultiple(WHILE_NAME_0, 3); //FORとWHILEを接続
    cy.checkConnectionLineMultiple(TASK_NAME_0, WHILE_NAME_0, 2); //作成したコンポーネントの座標を取得して接続線の座標と比較
    cy.createComponentNotOpenProperty(DEF_COMPONENT_FOREACH, FOREACH_NAME_0, 300, 550);
    cy.connectComponentMultiple(FOREACH_NAME_0, 4); //WHILEとFOREACHを接続
    cy.checkConnectionLineMultiple(TASK_NAME_0, FOREACH_NAME_0, 3); //作成したコンポーネントの座標を取得して接続線の座標と比較
    cy.createComponentNotOpenProperty(DEF_COMPONENT_PS, PS_NAME_0, 300, 650);
    cy.connectComponentMultiple(PS_NAME_0, 5); //PSとWHILEを接続
    cy.checkConnectionLineMultiple(TASK_NAME_0, PS_NAME_0, 4); //作成したコンポーネントの座標を取得して接続線の座標と比較
    cy.createComponentNotOpenProperty(DEF_COMPONENT_WORKFLOW, WORKFLOW_NAME_0, 300, 720);
    cy.connectComponentMultiple(WORKFLOW_NAME_0, 5); //WORKFLOWとPSを接続
    cy.checkConnectionLineMultiple(TASK_NAME_0, WORKFLOW_NAME_0, 5); //作成したコンポーネントの座標を取得して接続線の座標と比較
    cy.createComponentNotOpenProperty(DEF_COMPONENT_STEPJOB, STEPJOB_NAME_0, 300, 820);
    cy.connectComponentMultiple(STEPJOB_NAME_0, 6); //STEPJOBとWORKFLOWを接続
    cy.checkConnectionLineMultiple(TASK_NAME_0, STEPJOB_NAME_0, 6); //作成したコンポーネントの座標を取得して接続線の座標と比較
    cy.createComponentNotOpenProperty(DEF_COMPONENT_BJ_TASK, BJ_TASK_NAME_0, 300, 900);
    cy.connectComponentMultiple(BJ_TASK_NAME_0, 7); //BJ_TASKとSTEPJOBを接続
    cy.checkConnectionLineMultiple(TASK_NAME_0, BJ_TASK_NAME_0, 7); //作成したコンポーネントの座標を取得して接続線の座標と比較
  });
});
