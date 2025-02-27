const ANIMATION_WAIT_TIME = 500
const TYPE_INPUT = "input"
const TYPE_OUTPUT = "output"
const TYPE_DIR = "dir"
const TYPE_FILE = "file"

//opening a project
Cypress.Commands.add("openProject", ()=>{
  cy.get('[type="checkbox"]').eq(1).check(); // The top project checkbox
  cy.get('[data-cy="home-open-btn"]').click();
})

//drag&drop component
Cypress.Commands.add("dragAndDropComponent", (x, y, componentName, targetComponentName)=>{
  cy.wait(ANIMATION_WAIT_TIME).then(()=>{
    cy.get('[data-cy="component_library-component-avatar"]').get('#' + targetComponentName)
  })
  cy.get('[data-cy="component_library-component-avatar"]').get('#' + targetComponentName)
    .trigger("dragstart", { offsetX: 100, offsetY: 100 })
    .trigger("dragend", { clientX: x, clientY: y })
    .then(()=>{
      cy.get("svg").contains(componentName)
    })
})

//click component
Cypress.Commands.add("clickComponentName", (componentName)=>{
  cy.get('[data-cy="graph-component-row"]').contains(componentName)
    .click()
})

//Select a value from the dropdown list
Cypress.Commands.add("selectValueFromDropdownList", (targetDropBoxCy, dropBoxNo, selectVal)=>{
  cy.get(targetDropBoxCy).click();
  cy.get("[role=\"listbox\"]").eq(dropBoxNo).contains(selectVal).click();
})

//save property
Cypress.Commands.add("saveProperty", ()=>{
  cy.get('[data-cy="workflow-save-text"]').click();
})

//close property
Cypress.Commands.add("closeProperty", ()=>{
  cy.get('[data-cy="component_property-close-btn"]').click();
})

//enter the input or output file
Cypress.Commands.add("enterInputOrOutputFile", (type, fileName, clickRun)=>{
  if(clickRun){
    cy.get('[data-cy="component_property-in_out_files-panel_title"]').click();
  }
  if(type == TYPE_INPUT){
    cy.get('[data-cy="component_property-input_files-list_form"]').find('input').type(fileName);
    cy.get('[data-cy="list_form-add-text_field"]').find('[role="button"]').eq(1).click(); // Add input file button
  }
  else if(type == TYPE_OUTPUT){
    cy.get('[data-cy="component_property-output_files-list_form"]').find('input').type('testOutputFile');
    cy.get('[data-cy="list_form-add-text_field"]').find('[role="button"]').eq(3).click(); // Add output file button
  }
})

//creating a directory/file
Cypress.Commands.add("createDirOrFile", (type, fileName, clickRun)=>{
  if(clickRun){
    cy.get('[data-cy="component_property-files-panel_title"]').click();
  }
  if(type == TYPE_DIR){
    cy.get('[data-cy="file_browser-new_dir-btn"]').click();
    cy.get('[data-cy="file_browser-input-text_field"]').find('input').type(fileName);
    cy.get('[data-cy="file_browser-dialog-dialog"]').find('button').first().click();
  }
  else if(type == TYPE_FILE){
    cy.get('[data-cy="file_browser-new_file-btn"]').click();
    cy.get('[data-cy="file_browser-input-text_field"]').find('input').type(fileName);
    cy.get('[data-cy="file_browser-dialog-dialog"]').find('button').first().click();
  }
})

// confirm the display in the property
Cypress.Commands.add("confirmDisplayInProperty", (dataCyStr, visibleFlg)=>{
  if(visibleFlg){
    cy.get(dataCyStr).should('be.visible');
  }
  else{
    cy.get(dataCyStr).should('be.not.visible');
  }
})

// confirm the display in the property by details area
Cypress.Commands.add("confirmDisplayInPropertyByDetailsArea", (dataCyStr, clickAreaName, tagType)=>{
  cy.get(clickAreaName).click();
  if(tagType == null){
    cy.get(dataCyStr).should('be.visible');
  }
  else{
    cy.get(dataCyStr).find(tagType).should('be.visible');
  }
})

// confirmation of input value reflection
Cypress.Commands.add("confirmInputValueReflection", (inputObjCy, inputVal, tagType)=>{
  cy.get(inputObjCy).find(tagType).clear();
  // input
  cy.get(inputObjCy).type(inputVal);
  // click the Save button
  cy.get('[data-cy="workflow-save-text"]').click();
  // comparison
  cy.get(inputObjCy).find(tagType).should('have.value', inputVal); 
})

// confirmation of input value not reflection
Cypress.Commands.add("confirmInputValueNotReflection", (inputObjCy, inputVal, tagType)=>{
  cy.get(inputObjCy).find('input').clear();
  // input
  cy.get(inputObjCy).type(inputVal);
  // click the Save button
  cy.get('[data-cy="workflow-save-text"]').click();
  // comparison
  cy.get(inputObjCy).find(tagType).should('have.not.value', inputVal);
})

/* createComponent
   argument
    targetComponentName: component type name
    componentName      : component name
    positionX          : horizontal position of the component
    positionY          : vertical position of the component
*/
Cypress.Commands.add("createComponent", (targetComponentName, componentName, positionX, positionY)=>{
  cy.dragAndDropComponent(positionX, positionY, componentName, targetComponentName).then(()=>{
    cy.clickComponentName(componentName).wait(ANIMATION_WAIT_TIME)
  })
})
