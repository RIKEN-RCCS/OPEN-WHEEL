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

//double click component
Cypress.Commands.add("doubleClickComponentName", (componentName)=>{
  cy.get('[data-cy="graph-component-row"]').contains(componentName)
    .dblclick()
})

//create a stepjob component and double-click it
Cypress.Commands.add("createStepjobComponentAndDoubleClick", (targetComponentName, componentName, positionX, positionY)=>{
  cy.createComponent(targetComponentName, componentName, positionX, positionY);
  cy.doubleClickComponentName(componentName);
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
Cypress.Commands.add("enterInputOrOutputFile", (type, fileName, clickRun, addButtonClickFlag)=>{
  if(clickRun){
    cy.get('[data-cy="component_property-in_out_files-panel_title"]').click();
  }
  if(type == TYPE_INPUT){
    cy.get('[data-cy="component_property-input_files-list_form"]').find('input').type(fileName);
    // Click the Add File button
    if(addButtonClickFlag){
      cy.get('[data-cy="list_form-add-text_field"]').find('[role="button"]').eq(1).click(); // Add input file button
    }
  }
  else if(type == TYPE_OUTPUT){
    cy.get('[data-cy="component_property-output_files-list_form"]').find('input').type(fileName);
    // Click the Add File button
    if(addButtonClickFlag){
      cy.get('[data-cy="list_form-add-text_field"]').find('[role="button"]').eq(3).click(); // Add output file button
    }
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

// delete a component
Cypress.Commands.add("deleteComponent", (componentName)=>{
  cy.get('[data-cy="graph-component-row"]').contains(componentName).rightclick();
  cy.get('[data-cy="graph-component-row"]').contains('delete').click();
})

// connecting components together
Cypress.Commands.add("connectComponent", (componentName)=>{
  cy.get('[data-cy="graph-component-row"]').find("polygon")
    .eq(0)
    .trigger("mousedown", { screenX: 100, screenY: 100 })
  cy.get('[data-cy="graph-component-row"]').contains(componentName)
    .trigger("mouseup", { screenX: 300, screenY: 600 })
})

// connecting components together multiple
Cypress.Commands.add("connectComponentMultiple", (componentName, polygonNo)=>{
  cy.get('[data-cy="graph-component-row"]').find("polygon")
    .eq(polygonNo)
    .trigger("mousedown", { screenX: 100, screenY: 100 })
  cy.get('[data-cy="graph-component-row"]').contains(componentName)
    .trigger("mouseup", { screenX: 300, screenY: 700 })
})

//Project status check
Cypress.Commands.add("checkPropertyScreenOpen", (propertyCy)=>{
  cy.contains(propertyCy)
    .then(($el)=>{
      cy.softAssert($el.text().includes(propertyCy), true)
    })
})

// check the connection line
Cypress.Commands.add("checkConnectionLine", (startComponentName, endComponentName)=>{
  cy.get('[data-cy="component-component_group-g"]').filter(':contains(' + startComponentName + ')').find('[data-cy="iofilebox-rect-rect"]').as("start_rect");
  cy.get('@start_rect').invoke('attr', 'x').as("start_x");
  cy.get('@start_rect').invoke('attr', 'y').as("start_y");
  cy.get('@start_rect').invoke('attr', 'width').as("start_width");
  cy.get('@start_rect').invoke('attr', 'height').as("start_height");
  cy.get('[data-cy="component-component_group-g"]').filter(':contains(' + endComponentName + ')').find('[data-cy="iofilebox-rect-rect"]').as("end_rect");
  cy.get('@end_rect').invoke('attr', 'x').as("end_x");
  cy.get('@end_rect').invoke('attr', 'y').as("end_y");
  cy.get('@end_rect').invoke('attr', 'width').as("end_width");
  cy.get('@end_rect').invoke('attr', 'height').as("end_height");
  cy.get("@start_x").then((start_x_text) =>{
    cy.get("@start_y").then((start_y_text)=>{
      cy.get("@start_width").then((start_width_text)=>{
        cy.get("@start_height").then((start_height_text)=>{
          cy.get("@end_x").then((end_x_text)=>{
            cy.get("@end_y").then((end_y_text)=>{
              cy.get("@end_width").then((end_width_text)=>{
                cy.get("@end_height").then((end_height_text)=>{
                  const START_X = Number(start_x_text);
                  const START_Y = Number(start_y_text);
                  const START_WIDTH = Number(start_width_text);
                  const START_HEIGHT = Number(start_height_text);
                  const END_X = Number(end_x_text);
                  const END_Y = Number(end_y_text);
                  const END_HEIGHT = Number(end_height_text);                 
                  const EXPECTED_START_X =START_X + START_WIDTH;
                  const EXPECTED_START_Y =START_Y + START_HEIGHT/2;
                  const EXPECTED_END_X =END_X;
                  const EXPECTED_END_Y =END_Y + END_HEIGHT/2;
                  const REG_START = new RegExp(`^M\\s+${EXPECTED_START_X}+,+${EXPECTED_START_Y}\n\\s+C`)
                  const REG_END = new RegExp(`\\s+${EXPECTED_END_X}+,+${EXPECTED_END_Y}`)
                  cy.get('[data-cy="cubic-bezier-path"]').should("have.attr", "d").and("match",REG_START).and("match",REG_END)
                })
              })
            })
          })
        })
      })
    })
  });
})

// check the connection line
Cypress.Commands.add("checkConnectionLineMultiple", (startComponentName, endComponentName, pathNo)=>{
  cy.get('[data-cy="component-component_group-g"]').filter(':contains(' + startComponentName + ')').find('[data-cy="component_header-rect_rect"]').as("start_rect");
  cy.get('@start_rect').invoke('attr', 'x').as("start_x");
  cy.get('@start_rect').invoke('attr', 'y').as("start_y");
  cy.get('@start_rect').invoke('attr', 'width').as("start_width");
  cy.get('@start_rect').invoke('attr', 'height').as("start_height");
  cy.get('[data-cy="component-component_group-g"]').filter(':contains(' + endComponentName + ')').find('[data-cy="component_header-rect_rect"]').as("end_rect");
  cy.get('@end_rect').invoke('attr', 'x').as("end_x");
  cy.get('@end_rect').invoke('attr', 'y').as("end_y");
  cy.get('@end_rect').invoke('attr', 'width').as("end_width");
  cy.get('@end_rect').invoke('attr', 'height').as("end_height");
  cy.get("@start_x").then((start_x_text) =>{
    cy.get("@start_y").then((start_y_text)=>{
      cy.get("@start_width").then((start_width_text)=>{
        cy.get("@start_height").then((start_height_text)=>{
          cy.get("@end_x").then((end_x_text)=>{
            cy.get("@end_y").then((end_y_text)=>{
              cy.get("@end_width").then((end_width_text)=>{
                cy.get("@end_height").then((end_height_text)=>{
                  const START_X = Number(start_x_text);
                  const START_Y = Number(start_y_text);
                  const START_WIDTH = Number(start_width_text);
                  const START_HEIGHT = Number(start_height_text);
                  const END_X = Number(end_x_text);
                  const END_Y = Number(end_y_text);
                  const END_WIDTH = Number(end_width_text);
                  const EXPECTED_START_X =START_X + START_WIDTH/2;
                  const EXPECTED_START_Y =START_Y + START_HEIGHT;
                  const EXPECTED_END_X =END_X + END_WIDTH/2;
                  const EXPECTED_END_Y =END_Y;
                  const REG_START = new RegExp(`^M\\s+${EXPECTED_START_X}+,+${EXPECTED_START_Y}\n\\s+C`)
                  const REG_END = new RegExp(`\\s+${EXPECTED_END_X}+,+${EXPECTED_END_Y}`)
                  cy.get('[data-cy="cubic-bezier-path"]').eq(pathNo).should("have.attr", "d").and("match",REG_START).and("match",REG_END)
                })
              })
            })
          })
        })
      })
    })
  });
})
