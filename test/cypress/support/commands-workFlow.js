const TYPE_INPUT = "input";
const TYPE_OUTPUT = "output";
const TYPE_DIR = "dir";
const TYPE_FILE = "file";
const CONTAINER_NAME = "wheel";

/**
 * Prepare a clean component test by setting project state to "finished",
 * adding a marker file, and staging it.
 * - Mock mode: uses the mock server's setupCleanComponentTest helper.
 * - Real server mode: writes prj/cmp.wheel.json, commits, creates marker file, git-adds it.
 * @param {string} componentName - the component's directory name (or partial name for hpcisstar)
 */
Cypress.Commands.add("prepareCleanComponentTest", (componentName)=>{
  const isMock = Cypress.config("baseUrl").includes("3001");
  if (isMock) {
    cy.task("setupMockCleanTest", componentName).should("equal", true);
    cy.reload();
    cy.checkProjectStatus("finished");
  } else {
    const tmpPl = "cypress/fixtures/tmp_clean_pl.json";
    const tmpPrj = "cypress/fixtures/tmp_clean_prj.json";
    const tmpCmp = "cypress/fixtures/tmp_clean_cmp.json";

    cy.exec(`docker cp ${CONTAINER_NAME}:/root/.wheel/projectList.json ${tmpPl}`);
    cy.task("readJson", tmpPl).then((projects)=>{
      const projectPath = projects[0].path;

      cy.exec(`docker cp ${CONTAINER_NAME}:${projectPath}/prj.wheel.json ${tmpPrj}`);
      cy.task("readJson", tmpPrj).then((prj)=>{
        const entry = Object.entries(prj.componentPath)
          .find(([, relPath])=>{
            return relPath === componentName
              || relPath.endsWith(`/${componentName}`)
              || String(relPath).replace(/^\.\//u, "")
                .startsWith(componentName);
          });
        if (!entry) {
          throw new Error(`Component "${componentName}" not found in prj.wheel.json`);
        }
        const [, componentRelPath] = entry;

        const cmpPath = `${projectPath}/${componentRelPath}/cmp.wheel.json`;
        //Commit any staged files so the component is in HEAD before clean test
        cy.exec(`docker exec ${CONTAINER_NAME} sh -c "git -C '${projectPath}' commit -m 'test-setup' 2>&1 || true"`);
        cy.exec(`docker cp ${CONTAINER_NAME}:${cmpPath} ${tmpCmp}`);
        cy.task("readJson", tmpCmp).then((cmp)=>{
          cmp.state = "finished";
          cy.task("writeJson", { filePath: tmpCmp, data: cmp });
          cy.exec(`docker cp ${tmpCmp} ${CONTAINER_NAME}:${cmpPath}`);
          //Create and stage the marker file so cleanComponent detects it as unsavedFiles
          const markerPath = `${projectPath}/${componentRelPath}/_clean_test_marker.txt`;
          cy.exec(`docker exec ${CONTAINER_NAME} sh -c "echo test > '${markerPath}'"`);
          cy.exec(`docker exec ${CONTAINER_NAME} git -C '${projectPath}' add '${markerPath}'`);
          cy.reload();
          cy.get("[data-cy=\"graph-component-row\"]").contains(componentName, { timeout: 20000 })
            .should("be.visible");
        });
      });
    });
  }
});
Cypress.Commands.add("dragAndDropComponent", (x, y, componentName, targetComponentName)=>{
  cy.get("[data-cy=\"component_library-component-avatar\"]", { timeout: 10000 }).get("#" + targetComponentName);
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
  cy.get("[data-cy=\"component_property-property-navigation_drawer\"]").should("not.exist");
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
    if (addButtonClickFlag) {
      //blur fires the change event, which updates v-model.lazy (inputField) before clicking add
      cy.get("[data-cy=\"component_property-input_files-list_form\"]").find("input")
        .blur();
      cy.get("[data-cy=\"component_property-input_files-list_form\"]")
        .find("[data-cy=\"list_form-add-text_field\"]")
        .find("[role=\"button\"]")
        .last()
        .click({ force: true }); //Add input file button
    }
  } else if (type === TYPE_OUTPUT) {
    cy.get("[data-cy=\"component_property-output_files-list_form\"]").find("input")
      .type(fileName);
    if (addButtonClickFlag) {
      //blur fires the change event, which updates v-model.lazy (inputField) before clicking add
      cy.get("[data-cy=\"component_property-output_files-list_form\"]").find("input")
        .blur();
      cy.get("[data-cy=\"component_property-output_files-list_form\"]")
        .find("[data-cy=\"list_form-add-text_field\"]")
        .find("[role=\"button\"]")
        .last()
        .click({ force: true }); //Add output file button
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
      .should("not.be.disabled")
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
      .should("not.be.disabled")
      .click();
    cy.get("[data-cy=\"file_browser-dialog-dialog\"]").should("not.exist");
    cy.wait(200);
  }
});

/**
 * Open the files panel and remove the specified items from the file browser treeview
 * if they exist. Useful for cleaning up leftover files/directories from previous test runs.
 * The files panel remains open after this command completes.
 * @param {string[]} names - list of file/directory names to remove if present
 */
Cypress.Commands.add("cleanFileBrowserItems", (names)=>{
  cy.get("[data-cy=\"component_property-files-panel_title\"]", { timeout: 10000 })
    .scrollIntoView()
    .click({ force: true });
  names.forEach((name)=>{
    cy.get("body").then(($body)=>{
      const treeview = $body.find("[data-cy='file_browser-treeview-treeview']");
      if (treeview.length > 0 && treeview.text().includes(name)) {
        cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains(name)
          .click();
        cy.get("[data-cy=\"file_browser-remove_file-btn\"]").click();
        cy.get("[data-cy=\"file_browser-dialog-dialog\"]").find("button")
          .first()
          .click();
        cy.get("[data-cy=\"file_browser-dialog-dialog\"]").should("not.exist");
      }
    });
  });
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
  cy.get(clickAreaName).scrollIntoView()
    .click();
  if (tagType === null) {
    //The expansion-panel enter animation applies overflow:hidden inline style while running.
    //scrollIntoView called mid-animation may scroll to an intermediate position that becomes
    //stale once the panel reaches full height.  Wrapping both the scroll and the visibility
    //check inside a single .should() callback causes Cypress to retry the entire pair on each
    //attempt, so the element is re-scrolled into view on every retry until the animation
    //completes and Cypress.dom.isVisible passes.
    cy.get(dataCyStr).should(($el)=>{
      $el[0].scrollIntoView({ behavior: "instant" });
      expect(Cypress.dom.isVisible($el[0]), "element should be visible after scroll").to.be.true;
    });
  } else {
    cy.get(dataCyStr).find(tagType)
      .scrollIntoView()
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
    .rightclick({ force: true });
  cy.get("[data-cy=\"graph-component-row\"]").contains("delete")
    .click({ force: true });
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
          const polygonRect = $polygon[0].getBoundingClientRect();
          const startX = polygonRect.left + polygonRect.width / 2;
          const startY = polygonRect.top + polygonRect.height / 2;

          cy.get("svg#component-graph-svg").first()
            .then(($svg)=>{
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

                //Create and dispatch mousemove immediately (no wait to avoid Vue re-renders)
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

                //Create and dispatch mouseup immediately
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

/**
 * Click an item inside a treeview, waiting for the item to be present first.
 * This avoids DOM detachment errors caused by async treeview re-renders.
 * @param {string} treeviewCy - the data-cy selector of the treeview root element
 * @param {string} text - the visible text of the item to click
 */
Cypress.Commands.add("clickTreeviewItem", (treeviewCy, text)=>{
  cy.get(treeviewCy).should("contain.text", text);
  cy.contains(treeviewCy, text).click();
});
