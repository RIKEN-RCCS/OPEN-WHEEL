//screen transitions
Cypress.Commands.add("goToScreen", (screenName)=>{
  cy.visit("/" + screenName);
})