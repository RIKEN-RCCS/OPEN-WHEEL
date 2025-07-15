//create a project
Cypress.Commands.add("createProject", (projectName, projectDescription)=>{
  cy.visit("/");
  cy.get('[data-cy="home-new-btn"]').click();
  cy.get('[data-cy="home-project_name-text_field"]').type(projectName); 
  cy.get('[data-cy="home-project_description-textarea"]').type(projectDescription);
  cy.get('[data-cy="buttons-create-btn"]').click();
})

//create multiple projects
Cypress.Commands.add("createProjectMultiple", (projectName, projectDescription, quantity)=>{
  cy.visit("/");
  for (var i = 1; i <= quantity; i++) {
    cy.get('[data-cy="home-new-btn"]').click();
    cy.get('[data-cy="home-project_name-text_field"]').type(projectName + i.toString()); 
    cy.get('[data-cy="home-project_description-textarea"]').type(projectDescription + i.toString());
    cy.get('[data-cy="buttons-create-btn"]').click();
  }
})

//remove a project
Cypress.Commands.add("removeAllProjects", ()=>{
  cy.visit("/");
  cy.get('[data-cy="home-batch_mode-btn"]', { timeout: 30000 }).should('be.visible'); // バッチモードスイッチボタンが表示されるまで待機
  cy.get('[data-cy="home-batch_mode-btn"]').click();
  cy.get('[type="checkbox"]').eq(1).check();
  cy.get('[data-cy="home-remove-btn"]').click();
  cy.get('[data-cy="buttons-remove-btn"]').click();
})
