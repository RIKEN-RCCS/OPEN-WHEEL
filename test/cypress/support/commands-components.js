//confirm the display in the property
Cypress.Commands.add("confirmDisplayInProperty_comp", (dataCyStr, visibleFlg)=>{
  if (visibleFlg) {
    cy.get(dataCyStr).should("be.visible");
  } else {
    cy.get(dataCyStr).should("be.not.visible");
  }
});


//confirmation of input value reflection
Cypress.Commands.add("confirmInputValueReflection_comp", (inputObjCy, inputVal, tagType)=>{
  cy.get(inputObjCy).find(tagType)
    .clear();
  //input
  cy.get(inputObjCy).type(inputVal);
  //comparison
  cy.get(inputObjCy).find(tagType)
    .should("have.value", inputVal);
});