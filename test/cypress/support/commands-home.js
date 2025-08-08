//create a project
Cypress.Commands.add("createProject", (projectName, projectDescription)=>{
  cy.visit("/");
  cy.waitProjectList();
  cy.get("[data-cy=\"home-new-btn\"]").click();
  cy.get("[data-cy=\"home-project_name-text_field\"]").type(projectName);
  cy.get("[data-cy=\"home-project_description-textarea\"]").type(projectDescription);
  cy.get("[data-cy=\"buttons-create-btn\"]").click();
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

Cypress.Commands.add("waitProjectList", (timeout = 5000)=>{
  return cy
    .get("[data-cy=\"home-project_list-data_table\"]", { timeout })
    .should("be.visible")
    .should("contain.text", "Items per page:");
});

Cypress.Commands.add("waitProjectAppear", (projectName, timeout = 10000)=>{
  return cy.waitProjectList()
    .get("[data-cy=\"home-project_name-btn\"]", { timeout })
    .should("be.visible")
    .should(($els)=>{
      //$els is jQuery object
      //it turns into array to avoid error raise from only one element on the page
      const found = Array.from($els).some((el)=>{
        return el.innerText.includes(projectName);
      });
      expect(found).to.be.true;
    });
});

//remove a project
Cypress.Commands.add("removeAllProjects", ()=>{
  cy.visit("/");
  return cy.waitProjectList()
    .get("[data-cy=\"home-batch_mode-btn\"]")
    .find("input[type=\"checkbox\"]")
    .first()
    .click({ force: true })
    .get("[data-cy=\"home-project_list-data_table\"]")
    .contains("th", "Project Name")
    .parent() //select all project
    .find("input[type=\"checkbox\"]")
    .first()
    .click({ force: true })
    .get("[data-cy=\"home-remove-btn\"]")
    .click({ force: true })
    .get("[data-cy=\"buttons-remove-btn\"]")
    .click({ force: true });
});
