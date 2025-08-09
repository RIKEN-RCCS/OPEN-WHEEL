import "cypress-wait-until";
const path = require("path");
describe("export project e2e test", ()=>{
  const PROJECT_NAME = `WHEEL_TEST_${Date.now().toString()}`;
  const PROJECT_DESCRIPTION = "TestDescription";
  const TEST_NAME = "test name";
  const TEST_EMAIL = "test email";
  const TEST_MEMO = "test memo";
  const downloadsFolder = Cypress.config("downloadsFolder");
  const DEF_COMPONENT_TASK = "task";
  const TASK_NAME_0 = "task0";

  beforeEach(()=>{
    cy.viewport("macbook-16");
    return cy.createProject(PROJECT_NAME, PROJECT_DESCRIPTION)
      .projectOpen(PROJECT_NAME)
      .createComponent(DEF_COMPONENT_TASK, TASK_NAME_0, 300, 500)
      .saveProperty();
  });
  afterEach(()=>{
    return cy.removeAllProjects().task("removeDirectory", downloadsFolder);
  });
  it("should export project as tar archive", ()=>{
    cy.visit("/");
    cy.contains("td", PROJECT_NAME).parent()
      .find("input[type=\"checkbox\"]")
      .first()
      .click({ force: true });
    cy.get("[data-cy=\"home-export-btn\"]").click();
    cy.contains("div", `export project [${PROJECT_NAME}]`).should("be.visible");
    cy.get("[data-cy=\"export-dialog-name-field\"]").type(TEST_NAME);
    cy.get("[data-cy=\"export-dialog-email-field\"]").type(TEST_EMAIL);
    cy.get("[data-cy=\"export-dialog-memo-field\"]").type(TEST_MEMO);
    cy.get("[data-cy=\"buttons-ok-btn\"]").click();
    const filename = `WHEEL_project_${PROJECT_NAME}.tgz`;
    const filePath = path.join(downloadsFolder, filename);
    cy.waitUntil(()=>{
      return cy.task("fileExists", filePath);
    },
    { timeout: 10000, interval: 500 }
    );

    cy.task("extractTarArchive", { file: filePath, cwd: downloadsFolder }).then((files)=>{
      expect(files).to.includes(`${PROJECT_NAME}.wheel`);

      //prj.wheel.json should be read from db.js
      cy.readFile(path.join(downloadsFolder, `${PROJECT_NAME}.wheel`, "prj.wheel.json")).then((projectJson)=>{
        expect(projectJson.exportInfo.notChanged).to.be.true;
        expect(projectJson.exportInfo.exporter.name).to.eql(TEST_NAME);
        expect(projectJson.exportInfo.exporter.mail).to.eql(TEST_EMAIL);
        expect(projectJson.exportInfo.exporter.memo).to.eql(TEST_MEMO);
      });
    });
  });
});
