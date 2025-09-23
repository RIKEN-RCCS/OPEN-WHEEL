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

//remove a project
Cypress.Commands.add("removeAllProjects", ()=>{
  cy.visit("/");
  cy.waitProjectList();
  cy.get("[data-cy=\"home-batch_mode-btn\"]")
    .should("be.visible")
    .click();
  cy.get("[data-cy=\"home-project_list-data_table\"]")
    .contains("th", "Project Name")
    .parent() //select all project
    .find("input[type=\"checkbox\"]")
    .first()
    .check();
  cy.get("[data-cy=\"home-remove-btn\"]")
    .should("be.visible")
    .click();
  cy.get("[data-cy=\"buttons-remove-btn\"]")
    .should("be.visible")
    .click();
  return cy.get("[data-cy=\"home-project_list-data_table\"]")
    .should("contain.text", "No data available");
});
