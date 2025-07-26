//create a project
Cypress.Commands.add("createProject", (projectName, projectDescription)=>{
  cy.visit("/");
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

//remove a project
Cypress.Commands.add("removeAllProjects", ()=>{
  cy.visit("/");
  cy.get("[data-cy=\"home-project_list-progress_bar\"]", { timeout: 5000 }).should("not.be.visible");
  cy.get("[data-cy=\"home-project_list-data_table\"]", { timeout: 5000 }).then(($el)=>{
    if ($el.is(":visible")) {
      cy.get("[data-cy=\"home-batch_mode-btn\"]").find("input[type=\"checkbox\"]")
        .first()
        .click({ force: true });
      cy.contains("th", "Project Name").parent()
        .find("input[type=\"checkbox\"]")
        .first()
        .click({ force: true }); //check all projects
      cy.get("[data-cy=\"home-remove-btn\"]").click({ force: true });
      cy.get("[data-cy=\"buttons-remove-btn\"]").click({ force: true });
    } else {
      cy.log("no project found");
    }
  });
});
