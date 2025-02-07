//create a project
Cypress.Commands.add("createProject", (projectName, projectDescription)=>{
  cy.visit("/");
  cy.get('[data-cy="home-new-btn"]').click();
  cy.get('[data-cy="home-project_name-text_field"]').type(projectName); 
  cy.get('[data-cy="home-project_description-textarea"]').type(projectDescription);
  cy.get('[data-cy="buttons-ok_or_cancel-btn"]').first().click();
})

//remove a project
Cypress.Commands.add("removeProject", (lineNo)=>{
  cy.visit("/");
  cy.get('[data-cy="home-batch_mode-btn"]').click();
  cy.get('[type="checkbox"]').eq(lineNo).check();
  cy.get('[data-cy="home-remove-btn"]').click();
  cy.get('[data-cy="buttons-ok_or_cancel-btn"]').first().click();
})