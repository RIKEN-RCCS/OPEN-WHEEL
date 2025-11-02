//create a project
Cypress.Commands.add("createProject", (projectName, projectDescription)=>{
  cy.visit("/");
  cy.waitProjectList();
  cy.get("[data-cy=\"home-new-btn\"]")
    .click();
  cy.get("[data-cy=\"home-project_name-text_field\"]")
    .type(projectName);
  cy.get("[data-cy=\"home-project_description-textarea\"]")
    .type(projectDescription);
  cy.get("[data-cy=\"buttons-create-btn\"]")
    .click();
  cy.waitProjectList();
  return cy.waitProjectAppear(projectName);
});

//create multiple projects
Cypress.Commands.add("createProjectMultiple", (projectName, projectDescription, quantity)=>{
  cy.visit("/");

  for (var i = 1; i <= quantity; i++) {
    cy.get("[data-cy=\"home-new-btn\"]").click();
    cy.get("[data-cy=\"home-project_name-text_field\"]").type(projectName + i.toString());
    cy.get("[data-cy=\"home-project_description-textarea\"]").type(projectDescription + i.toString());
    cy.get("[data-cy=\"buttons-create-btn\"]").click();
  }
});

Cypress.Commands.add("waitProjectList", (timeout = 20000)=>{
  return cy.get("[data-cy=\"home-project_list-data_table\"]", { timeout })
    .should("be.visible")
    .should("contain.text", "Items per page:");
});

Cypress.Commands.add("waitProjectAppear", (projectName, timeout = 20000)=>{
  return cy.get("[data-cy=\"home-project_name-btn\"]", { timeout })
    .contains(projectName)
    .should("be.visible");
});

//remove a project by name
Cypress.Commands.add("removeProject", (projectName)=>{
  cy.get("[data-cy=\"home-project_name-btn\"]").contains(projectName)
    .parents("tr")
    .find("[type=\"checkbox\"]")
    .check();
  cy.get("[data-cy=\"home-remove-btn\"]").click();
  cy.get("[data-cy=\"buttons-remove-btn\"]").click();
  return cy.contains(projectName).should("not.be.visible");
});

const projectListFilename = "/root/.wheel/projectList.json";
const containerName = "test-wheel_release_test-1";

Cypress.Commands.add("removeAllProjects", ()=>{
  const tmpFilename = `cypress/fixtures/projectList.json`;
  cy.exec(`docker cp ${containerName}:${projectListFilename} ${tmpFilename}`);
  cy.task("readJson", tmpFilename).then((projects)=>{
    if (!projects) {
      return;
    }
    projects.forEach((project)=>{
      cy.exec(`docker exec ${containerName} rm -fr ${project.path}`);
    });
  });
  //Update the file inside the container only
  cy.exec(`docker exec ${containerName} sh -c 'echo [] > ${projectListFilename}'`);
  cy.task("deleteFile", tmpFilename);
});
