/**
 * Source&Viewerコンポーネント機能正常動作確認
 */

describe("source and viewer", ()=>{
  const PROJECT_NAME = `WHEEL_TEST_${Date.now().toString()}`;
  const PROJECT_DESCRIPTION = "TestDescription";
  const TYPE_OUTPUT = "output";
  const TYPE_FILE = "file";
  const DEF_COMPONENT_IF = "if";
  const DEF_COMPONENT_VIEWER = "viewer";
  const IF_NAME_0 = "if0";
  const VIEWER_NAME_0 = "viewer0";

  before(()=>{
    return cy.removeAllProjects();
  });

  beforeEach(()=>{
    cy.removeAllProjects();
    cy.viewport("macbook-16");
    cy.createProject(PROJECT_NAME, PROJECT_DESCRIPTION);
    return cy.createAndOpenProject();
  });

  after(()=>{
    return cy.removeAllProjects();
  });

  /**
  Source&Viewerコンポーネント機能正常動作確認
  Viewerコンポーネントの機能確認
  Viewerコンポーネントの挙動確認
  ダイアログ表示確認
  試験確認内容：open viewer screenダイアログが表示されることを確認
   */
  it("Viewerコンポーネントの挙動確認-ダイアログ表示確認-open viewer screenダイアログが表示されることを確認", ()=>{
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 501, 500);
    cy.createDirOrFile(TYPE_FILE, "test-a", true);
    cy.get("[data-cy=\"component_property-condition-setting_title\"]").click();
    let targetDropBoxCy = "[data-cy=\"component_property-condition_use_javascript-autocomplete\"]";
    cy.selectValueFromDropdownList(targetDropBoxCy, 3, "test-a");
    cy.enterInputOrOutputFile(TYPE_OUTPUT, "testOutputFile", true, true);
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 501, 600);
    cy.connectComponent(VIEWER_NAME_0); //コンポーネント同士を接続
    cy.get("[data-cy=\"workflow-play-btn\"]").click(); //実行する
    cy.checkProjectStatus("finished", 10000);
    cy.contains("open viewer screen").should("exist");
  });
  it.skip("should not open old viewer component's result after re-creating project with same name (reproduction test of #948)", ()=>{ //TODO:テストで失敗しているため一時的にskip.修正後復帰すること.
    cy.createComponent(DEF_COMPONENT_IF, IF_NAME_0, 501, 500);
    cy.createDirOrFile(TYPE_FILE, "test-a", true);
    cy.get("[data-cy=\"component_property-condition-setting_title\"]").click();
    let targetDropBoxCy = "[data-cy=\"component_property-condition_use_javascript-autocomplete\"]";
    cy.selectValueFromDropdownList(targetDropBoxCy, 3, "test-a");
    cy.enterInputOrOutputFile(TYPE_OUTPUT, "testOutputFile", true, true);
    cy.createComponent(DEF_COMPONENT_VIEWER, VIEWER_NAME_0, 501, 600);
    cy.connectComponent(VIEWER_NAME_0); //コンポーネント同士を接続
    cy.get("[data-cy=\"workflow-play-btn\"]").click(); //実行する
    cy.checkProjectStatus("finished", 10000);
    cy.visit("/");
    cy.waitProjectAppear(PROJECT_NAME);
    //REMOVE EXISTING PROJECT HERE
    cy.removeProject(PROJECT_NAME);
    cy.wait(1000); //Wait for page to stabilize
    cy.createProject(PROJECT_NAME, PROJECT_DESCRIPTION);
    cy.projectOpen(PROJECT_NAME);
    cy.wait(500); //Wait for project to fully load

    cy.get("[data-cy=\"workflow-open_viewer_screen-btn\"]").should("exist")
      .and("be.disabled");
    cy.get("[data-cy=\"workflow-viewer_screen-dialog\"]").should("not.exist");
  });
});
