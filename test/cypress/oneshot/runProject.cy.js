/**
 * 任意のプロジェクトアーカイブをimportして実行し、プロジェクトの最終状態を確認する単発のE2Eテスト
 *
 * 通常のE2E(cypress/e2e)には含めず、--specで明示的に指定して実行する。
 *
 * 使い方(WHEELコンテナ起動済みの状態で):
 *   npx cypress run --browser chrome --spec cypress/oneshot/runProject.cy.js \
 *     --config requestTimeout=300000,defaultCommandTimeout=300000 \
 *     --env USE_MOCK=false,PROJECT_ARCHIVE=/path/to/project.tgz,PROJECT_NAME=name_in_archive
 *
 * env:
 *   PROJECT_ARCHIVE  importするアーカイブのパス(必須)
 *   PROJECT_NAME     アーカイブ中のプロジェクト名(必須。import後の一覧での確認に使う)
 *   EXPECT_STATUS    実行後に期待するプロジェクト状態(default: finished)
 *   RUN_TIMEOUT      実行完了を待つ時間[ms] (default: 120000)
 *   KEEP_PROJECT     trueのとき、テスト終了後にプロジェクトを削除しない(失敗の調査用)
 */
describe("run arbitrary project", { testIsolation: false }, ()=>{
  const ARCHIVE = Cypress.env("PROJECT_ARCHIVE");
  const PROJECT_NAME = Cypress.env("PROJECT_NAME");
  const EXPECT_STATUS = Cypress.env("EXPECT_STATUS") || "finished";
  const RUN_TIMEOUT = Number(Cypress.env("RUN_TIMEOUT")) || 120000;
  const KEEP_PROJECT = String(Cypress.env("KEEP_PROJECT")) === "true";

  before(()=>{
    expect(ARCHIVE, "env PROJECT_ARCHIVE").to.be.a("string").and.not.empty;
    expect(PROJECT_NAME, "env PROJECT_NAME").to.be.a("string").and.not.empty;
    cy.viewport("macbook-16");
    return cy.removeAllProjects();
  });
  after(()=>{
    if (KEEP_PROJECT) {
      return;
    }
    return cy.removeAllProjects();
  });

  it("import the project", ()=>{
    cy.goHome();
    cy.get("[data-cy=\"home-import-btn\"]").click();
    cy.get("[data-cy=\"import_dialog-file_browser\"]").contains("div", "./")
      .click({ force: true });
    cy.get("[data-cy=\"import_dialog-upload_file-input\"]").find("input")
      .selectFile(ARCHIVE, { force: true });
    cy.get("[data-cy=\"import_dialog-ok-btn\"]").click();
    cy.get("[data-cy=\"versatile_dialog_IMPORTED_PROJECT_WARNING-ok-btn\"]").click();
    //アーカイブ中でlocalhost以外のホストを使っている場合のみhostmap dialogが表示される
    cy.get("body").then(($body)=>{
      if ($body.find("[data-cy=\"hostmap_dialog-dialog\"]").length > 0) {
        cy.get("[data-cy=\"hostmap_dialog-dialog\"]").find("input")
          .eq(1)
          .type("localhost");
        cy.get("[data-cy=\"versatile_dialog_Hostmapping-ok-btn\"]").click();
      }
    });
    cy.get("[data-cy=\"home-project_name-btn\"]").contains(PROJECT_NAME);
  });

  it("run the project and check its final status", ()=>{
    cy.projectOpen(PROJECT_NAME);
    cy.get("[data-cy=\"versatile_dialog_IMPORTED_PROJECT_WARNING-ok-btn\"]").click();
    cy.get("[data-cy=\"workflow-play-btn\"]", { timeout: 10000 }).click();
    cy.checkProjectStatus(EXPECT_STATUS, RUN_TIMEOUT);
  });
});
