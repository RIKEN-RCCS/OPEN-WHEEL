describe("import project e2e test", ()=>{
  const PROJECT_NAME = "WHEEL_IMPORT_TEST_PROJECT";
  const PROJECT_DESCRIPTION = "TestDescription";
  const PROJECT_PATH = "/root/WHEEL_IMPORT_TEST_PROJECT.wheel";
  const ARCHIVE_FILENAME = "cypress/fixtures/importProjectE2Etest.tgz";

  beforeEach(()=>{
    return cy.goToScreen("home");
  });
  afterEach(()=>{
    return cy.removeAllProjects();
  });
  it("should import project from tar archive", ()=>{
    cy.get("[data-cy=\"home-import-btn\"]").click();
    cy.get("[data-cy=\"import_dialog-upload_file-input\"]").find("input")
      .selectFile(ARCHIVE_FILENAME);
    cy.get("[data-cy=\"import_dialog-file_browser\"]").contains("div", "./")
      .click();
    cy.get("[data-cy=\"import_dialog-ok-btn\"]").click();

    cy.get("[data-cy=\"versatile_dialog_IMPORTED_PROJECT_WARNING-title\"]").contains("IMPORTED PROJECT WARNING");
    cy.get("[data-cy=\"versatile_dialog_IMPORTED_PROJECT_WARNING-message\"]").contains("Depending on");
    cy.get("[data-cy=\"versatile_dialog_IMPORTED_PROJECT_WARNING-ok-btn\"]").click();
    cy.get("[data-cy=\"hostmap_dialog-dialog\"]").should("be.visible");
    cy.get("[data-cy=\"hostmap_dialog-header_oldname-text_field\"]").contains("hostname in project archive");
    cy.get("[data-cy=\"hostmap_dialog-header_newname-text_field\"]").contains("newly assigned host");
    cy.get("[data-cy=\"hostmap_dialog-dialog\"]").find("input")
      .eq(0)
      .should("have.value", "testServer");
    cy.get("[data-cy=\"hostmap_dialog-dialog\"]").find("input")
      .eq(1)
      .type("localhost");
    cy.get("[data-cy=\"versatile_dialog_Hostmapping-ok-btn\"]").click();
    cy.get("[data-cy=\"home-project_name-btn\"]").contains(PROJECT_NAME);
    cy.get("[data-cy=\"home-project_description-btn\"]").contains(PROJECT_DESCRIPTION);
    cy.get("[data-cy=\"home-path-span\"]").contains(PROJECT_PATH);
  });
});
