/**
 * Demo replay of documentMD/user_guide/_tutorial/2_advanced_tutorial, section 3
 * (Parameter Study). Runs against the REAL server so the PS component genuinely
 * fans its task out over the parameter space - see the project's approved plan
 * for tutorial-demo tests for why.
 *
 * Split into its own file - see tutorialAdvancedIf.cy.js for why.
 *
 * Three ways to run (see plan doc / --env DEMO_MODE):
 *   cypress open --env DEMO_MODE=pause  -> live presenter demo (stop-motion)
 *   cypress run --headed --config video=true --env DEMO_MODE=video -> recorded demo video
 *   cypress open (DEMO_MODE unset)      -> GUI run-through test, full speed
 */
describe("tutorial advanced - 3. Parameter Study (PS)", ()=>{
  const SCRIPT_DROPDOWN = "[data-cy=\"component_property-script-autocomplete\"]";

  before(()=>{
    return cy.removeAllProjects();
  });

  beforeEach(()=>{
    cy.viewport("macbook-16");
    return cy.createAndOpenProject();
  });

  afterEach(()=>{
    return cy.goHome();
  });

  after(()=>{
    return cy.removeAllProjects();
  });

  it("PS fans a task out over a list parameter (foo, bar, baz)", ()=>{
    cy.demoStep("Create PS0");
    cy.createComponent("parameterStudy", "PS0", 501, 500);
    cy.closeProperty();

    cy.demoStep("Enter PS0 and add a task that echoes 'number'");
    cy.doubleClickComponentName("PS0");
    cy.createComponent("task", "task0", 501, 500);
    cy.scriptMake("run.sh", "echo number > result.txt");
    cy.waitForSnackbar(/run\.sh\s+saved/i);
    cy.selectValueFromDropdownList(SCRIPT_DROPDOWN, 3, "run.sh");
    cy.closeProperty();

    cy.demoStep("Go back up and open PS0's parameterSetting.json");
    cy.get(".v-breadcrumbs").find("button")
      .first()
      .click({ force: true });
    cy.clickComponentName("PS0");
    cy.get("[data-cy=\"component_property-files-panel_title\"]").scrollIntoView()
      .click();
    cy.clickTreeviewItem("[data-cy=\"file_browser-treeview-treeview\"]", "parameterSetting.json");
    cy.get("[data-cy=\"file_browser-edit_files-btn\"]").click();

    cy.demoStep("Add task0/run.sh as a target file");
    cy.addTargetFileToPs("task0", "run.sh");

    cy.demoStep("Select 'number' and add a list parameter: foo, bar, baz");
    cy.addListParameter("number", ["foo", "bar", "baz"]);
    cy.get("[data-cy=\"workflow-text_editor_close-btn\"]").click();
    cy.contains("button", /Keep changes/i).click();

    cy.demoStep("Run the project");
    cy.demoClick("[data-cy=\"workflow-play-btn\"]");
    cy.checkProjectStatus("finished", 30000);

    cy.demoStep("Verify the parameter study fanned out into multiple task0 instances");
    cy.closeProperty();
    cy.doubleClickComponentName("PS0");
    cy.get("[data-cy=\"graph-component-row\"]").should("have.length.at.least", 3);
  });
});
