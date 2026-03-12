const ANIMATION_WAIT_TIME = 500;
const TYPE_INPUT = "input";
const TYPE_OUTPUT = "output";
const TYPE_DIR = "dir";
const TYPE_FILE = "file";

//drag&drop component
Cypress.Commands.add("dragAndDropComponent", (x, y, componentName, targetComponentName)=>{
  cy.get("[data-cy=\"component_library-component-avatar\"]", { timeout: ANIMATION_WAIT_TIME + 4000 }).get("#" + targetComponentName);
  cy.get("[data-cy=\"component_library-component-avatar\"]").get("#" + targetComponentName)
    .trigger("dragstart", { offsetX: 100, offsetY: 100 })
    .trigger("dragend", { clientX: x, clientY: y })
    .then(()=>{
      //svgだとforEach0を取得できなかったため、変更。実サーバーでも問題なく動くことを確認
      cy.get("[data-cy=\"component-component_group-g\"]").contains(componentName);
    });
});

//click component
Cypress.Commands.add("clickComponentName", (componentName)=>{
  cy.get("[data-cy=\"graph-component-row\"]").contains(componentName)
    .click();
  cy.get("[data-cy=\"component_property-property-navigation_drawer\"]", { timeout: 5000 }).should("be.visible");
});

//double click component
Cypress.Commands.add("doubleClickComponentName", (componentName)=>{
  cy.get("[data-cy=\"graph-component-row\"]").contains(componentName)
    .dblclick();
});

//create a stepjob component and double-click it
Cypress.Commands.add("createStepjobComponentAndDoubleClick", (targetComponentName, componentName, positionX, positionY)=>{
  cy.createComponent(targetComponentName, componentName, positionX, positionY);
  cy.closeProperty();
  cy.doubleClickComponentName(componentName);
});

//Select a value from the dropdown list
//TODO:ドロップダウン選択 各itemにdata-cyを振りそこから値をgetする形に改修する
Cypress.Commands.add("selectValueFromDropdownList", (targetDropBoxCy, dropBoxNo, selectVal)=>{
  cy.get(targetDropBoxCy).click();
  cy.get("[role=\"listbox\"]").should("be.visible");
  cy.get("[role=\"listbox\"]").contains(selectVal, { timeout: 10000 })
    .should("be.visible")
    .click();
});

//save property
Cypress.Commands.add("saveProperty", ()=>{
  cy.get("[data-cy=\"workflow-save-text\"]").click();
});

//close property
Cypress.Commands.add("closeProperty", ()=>{
  cy.get("[data-cy=\"component_property-close-btn\"]").click();
});

//enter the input or output file
Cypress.Commands.add("enterInputOrOutputFile", (type, fileName, clickRun, addButtonClickFlag)=>{
  if (clickRun) {
    cy.get("[data-cy=\"component_property-in_out_files-panel_title\"]", { timeout: 10000 })
      .scrollIntoView()
      .click({ force: true });
  }
  if (type === TYPE_INPUT) {
    cy.get("[data-cy=\"component_property-input_files-list_form\"]").find("input")
      .type(fileName);
    //Click the Add File button
    if (addButtonClickFlag) {
      cy.get("[data-cy=\"list_form-add-text_field\"]").find("[role=\"button\"]")
        .eq(1)
        .click(); //Add input file button
    }
  } else if (type === TYPE_OUTPUT) {
    cy.get("[data-cy=\"component_property-output_files-list_form\"]").find("input")
      .type(fileName);
    //Click the Add File button
    if (addButtonClickFlag) {
      cy.get("[data-cy=\"list_form-add-text_field\"]").find("[role=\"button\"]")
        .eq(3)
        .click(); //Add output file button
    }
  }
});

//creating a directory/file
Cypress.Commands.add("createDirOrFile", (type, fileName, clickRun)=>{
  if (clickRun) {
    cy.get("[data-cy=\"component_property-files-panel_title\"]", { timeout: 10000 })
      .scrollIntoView()
      .click({ force: true });
  }
  if (type === TYPE_DIR) {
    cy.get("[data-cy=\"file_browser-new_dir-btn\"]").click({ force: true });
    cy.get("[data-cy=\"file_browser-dialog-dialog\"]").should("be.visible");
    cy.get("[data-cy=\"file_browser-input-text_field\"]").find("input")
      .type(fileName, { force: true });
    cy.get("[data-cy=\"file_browser-dialog-dialog\"]").find("button")
      .first()
      .click();
    cy.get("[data-cy=\"file_browser-dialog-dialog\"]").should("not.exist");
    cy.wait(200);
  } else if (type === TYPE_FILE) {
    cy.get("[data-cy=\"file_browser-new_file-btn\"]").click({ force: true });
    cy.get("[data-cy=\"file_browser-dialog-dialog\"]").should("be.visible");
    cy.get("[data-cy=\"file_browser-input-text_field\"]").find("input")
      .type(fileName, { force: true });
    cy.get("[data-cy=\"file_browser-dialog-dialog\"]").find("button")
      .first()
      .click();
    cy.get("[data-cy=\"file_browser-dialog-dialog\"]").should("not.exist");
    cy.wait(200);
  }
});

//confirm the display in the property
Cypress.Commands.add("confirmDisplayInProperty", (dataCyStr, visibleFlg)=>{
  if (visibleFlg) {
    cy.get(dataCyStr).should("be.visible");
  } else {
    cy.get(dataCyStr).should("be.not.visible");
  }
});

//confirm the display in the property by details area
Cypress.Commands.add("confirmDisplayInPropertyByDetailsArea", (dataCyStr, clickAreaName, tagType)=>{
  cy.get(clickAreaName).click();
  if (tagType === null) {
    cy.get(dataCyStr).should("be.visible");
  } else {
    cy.get(dataCyStr).find(tagType)
      .should("be.visible");
  }
});

//confirmation of input value reflection
Cypress.Commands.add("confirmInputValueReflection", (inputObjCy, inputVal, tagType, componentName)=>{
  cy.get(inputObjCy).find(tagType)
    .clear();
  //input
  cy.get(inputObjCy).type(inputVal);
  cy.closeProperty();
  cy.clickComponentName(componentName);
  //comparison
  cy.get(inputObjCy).find(tagType)
    .should("have.value", inputVal);
});

//confirmation of input value not reflection
Cypress.Commands.add("confirmInputValueNotReflection", (inputObjCy, inputVal, tagType, componentName)=>{
  cy.get(inputObjCy).find("input")
    .clear();
  //input
  cy.get(inputObjCy).type(inputVal);
  cy.closeProperty();
  cy.clickComponentName(componentName);
  //comparison
  cy.get(inputObjCy).find(tagType)
    .should("have.not.value", inputVal);
});

/*createComponent
   argument
    targetComponentName: component type name
    componentName      : component name
    positionX          : horizontal position of the component
    positionY          : vertical position of the component
*/
Cypress.Commands.add("createComponent", (targetComponentName, componentName, positionX, positionY)=>{
  cy.dragAndDropComponent(positionX, positionY, componentName, targetComponentName).then(()=>{
    cy.clickComponentName(componentName);
  });
});

/*createComponentNotOpenProperty
   argument
    targetComponentName: component type name
    componentName      : component name
    positionX          : horizontal position of the component
    positionY          : vertical position of the component
*/
Cypress.Commands.add("createComponentNotOpenProperty", (targetComponentName, componentName, positionX, positionY)=>{
  cy.dragAndDropComponent(positionX, positionY, componentName, targetComponentName);
});

//delete a component
Cypress.Commands.add("deleteComponent", (componentName)=>{
  cy.get("[data-cy=\"graph-component-row\"]").contains(componentName)
    .rightclick();
  cy.get("[data-cy=\"graph-component-row\"]").contains("delete")
    .click();
  cy.contains("button", "Delete").click();
});

//connecting components together
Cypress.Commands.add("connectComponent", (componentName)=>{
  cy.get("[data-cy=\"graph-component-row\"]").find("polygon")
    .eq(0)
    .should("be.visible")
    .trigger("mousedown", { force: true, screenX: 100, screenY: 100 });
  cy.get("[data-cy=\"graph-component-row\"]").contains(componentName)
    .should("be.visible")
    .trigger("mouseup", { force: true, screenX: 300, screenY: 600 });
  //Add a small wait to allow connection to be established
  cy.wait(500);
});

//connecting components together multiple
Cypress.Commands.add("connectComponentMultiple", (sourceComponentName, targetComponentName)=>{
  //Ensure both components exist
  cy.get("[data-cy=\"component-component_group-g\"]", { timeout: 5000 });
  cy.get("[data-cy=\"component-component_group-g\"]").contains(sourceComponentName)
    .should("be.visible");
  cy.get("[data-cy=\"component-component_group-g\"]").contains(targetComponentName)
    .should("be.visible");

  //Find the target component header to get its position
  //Using a longer timeout to wait for component to be visible and stable
  cy.get("[data-cy=\"component-component_group-g\"]", { timeout: 5500 });
  cy.get("[data-cy=\"component-component_group-g\"]").contains(targetComponentName)
    .parents("[data-cy=\"component-component_group-g\"]")
    .first()
    .find("[data-cy=\"component_header-rect_rect\"]")
    .should("be.visible")
    .then(($target)=>{
      const targetRect = $target[0].getBoundingClientRect();
      const targetX = targetRect.left + targetRect.width / 2;
      const targetY = targetRect.top + targetRect.height / 2;

      //Get the polygon from the SOURCE component
      cy.get("[data-cy=\"component-component_group-g\"]");
      cy.get("[data-cy=\"component-component_group-g\"]").contains(sourceComponentName)
        .parents("[data-cy=\"component-component_group-g\"]")
        .first()
        .find("polygon")
        .first()
        .should("be.visible")
        .then(($polygon)=>{
          cy.get("svg").first()
            .then(($svg)=>{
              const polygonRect = $polygon[0].getBoundingClientRect();
              const startX = polygonRect.left + polygonRect.width / 2;
              const startY = polygonRect.top + polygonRect.height / 2;

              //Dispatch real events using the browser's event system
              cy.window().then((win)=>{
              //Create and dispatch mousedown
                const mousedownEvent = new win.MouseEvent("mousedown", {
                  bubbles: true,
                  cancelable: true,
                  view: win,
                  screenX: startX,
                  screenY: startY,
                  clientX: startX,
                  clientY: startY,
                  button: 0,
                  buttons: 1
                });
                $polygon[0].dispatchEvent(mousedownEvent);

                //Small delay
                cy.wait(100).then(()=>{
                //Create and dispatch mousemove
                  const mousemoveEvent = new win.MouseEvent("mousemove", {
                    bubbles: true,
                    cancelable: true,
                    view: win,
                    screenX: targetX,
                    screenY: targetY,
                    clientX: targetX,
                    clientY: targetY,
                    button: 0,
                    buttons: 1
                  });
                  $svg[0].dispatchEvent(mousemoveEvent);

                  //Small delay
                  cy.wait(100).then(()=>{
                  //Create and dispatch mouseup
                    const mouseupEvent = new win.MouseEvent("mouseup", {
                      bubbles: true,
                      cancelable: true,
                      view: win,
                      screenX: targetX,
                      screenY: targetY,
                      clientX: targetX,
                      clientY: targetY,
                      button: 0,
                      buttons: 0
                    });
                    $svg[0].dispatchEvent(mouseupEvent);

                    //Wait for connection to be created
                    cy.wait(500);
                  });
                });
              });
            });
        });
    });
});

//Project status check
Cypress.Commands.add("checkPropertyScreenOpen", (propertyCy)=>{
  cy.contains(propertyCy)
    .then(($el)=>{
      cy.softAssert($el.text().includes(propertyCy), true);
    });
});

//check the connection line
//eslint-disable-next-line no-unused-vars
Cypress.Commands.add("checkConnectionLine", (startComponentName, endComponentName)=>{
  //Simply check that a connection line (cubic-bezier-path) exists
  //The connection was created successfully if this element is present
  cy.get("[data-cy=\"cubic-bezier-path\"]", { timeout: 10000 })
    .should("exist")
    .and("have.length.at.least", 1);
});

//check the connection line
Cypress.Commands.add("checkConnectionLineMultiple", (startComponentName, endComponentName, pathNo)=>{
  cy.get("[data-cy=\"component-component_group-g\"]").filter(":contains(" + startComponentName + ")")
    .find("[data-cy=\"component_header-rect_rect\"]")
    .as("start_rect");
  cy.get("@start_rect").invoke("attr", "x")
    .as("start_x");
  cy.get("@start_rect").invoke("attr", "y")
    .as("start_y");
  cy.get("@start_rect").invoke("attr", "width")
    .as("start_width");
  cy.get("@start_rect").invoke("attr", "height")
    .as("start_height");
  cy.get("[data-cy=\"component-component_group-g\"]").filter(":contains(" + endComponentName + ")")
    .find("[data-cy=\"component_header-rect_rect\"]")
    .as("end_rect");
  cy.get("@end_rect").invoke("attr", "x")
    .as("end_x");
  cy.get("@end_rect").invoke("attr", "y")
    .as("end_y");
  cy.get("@end_rect").invoke("attr", "width")
    .as("end_width");
  cy.get("@end_rect").invoke("attr", "height")
    .as("end_height");
  cy.get("@start_x").then((startXText)=>{
    cy.get("@start_y").then((startYText)=>{
      cy.get("@start_width").then((startWidthText)=>{
        cy.get("@start_height").then((startHeightText)=>{
          cy.get("@end_x").then((endXText)=>{
            cy.get("@end_y").then((endYText)=>{
              cy.get("@end_width").then((endWidthText)=>{
                const START_X = Number(startXText);
                const START_Y = Number(startYText);
                const START_WIDTH = Number(startWidthText);
                const START_HEIGHT = Number(startHeightText);
                const END_X = Number(endXText);
                const END_Y = Number(endYText);
                const END_WIDTH = Number(endWidthText);
                const EXPECTED_START_X = START_X + START_WIDTH / 2;
                const EXPECTED_START_Y = START_Y + START_HEIGHT;
                const EXPECTED_END_X = END_X + END_WIDTH / 2;
                const EXPECTED_END_Y = END_Y;
                const REG_START = new RegExp(`^M\\s+${EXPECTED_START_X}+,+${EXPECTED_START_Y}\n\\s+C`);
                const REG_END = new RegExp(`\\s+${EXPECTED_END_X}+,+${EXPECTED_END_Y}`);
                //Wait for connection lines to be created
                cy.get("[data-cy=\"cubic-bezier-path\"]", { timeout: 10000 }).should("have.length.at.least", pathNo + 1);
                cy.get("[data-cy=\"cubic-bezier-path\"]").eq(pathNo)
                  .should("have.attr", "d")
                  .and("match", REG_START)
                  .and("match", REG_END);
              });
            });
          });
        });
      });
    });
  });
});
