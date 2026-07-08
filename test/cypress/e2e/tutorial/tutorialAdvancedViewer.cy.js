/**
 * Demo replay of documentMD/user_guide/_tutorial/2_advanced_tutorial, section 5
 * (Result Display / viewer). Runs against the REAL server - see the project's
 * approved plan for tutorial-demo tests for why.
 *
 * Split into its own file - see tutorialAdvancedIf.cy.js for why.
 *
 * Three ways to run (see plan doc / --env DEMO_MODE):
 *   cypress open --env DEMO_MODE=pause  -> live presenter demo (stop-motion)
 *   cypress run --headed --config video=true --env DEMO_MODE=video -> recorded demo video
 *   cypress open (DEMO_MODE unset)      -> GUI run-through test, full speed
 */
describe("tutorial advanced - 5. Result Display (viewer)", ()=>{
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

  it("task output feeds a viewer, 'open viewer screen' dialog appears", ()=>{
    cy.demoStep("Create task0 that writes photo.jpg (stand-in for an image)");
    cy.createComponent("task", "task0", 501, 500);
    cy.scriptMake("run.sh", "echo fake image content > photo.jpg");
    cy.waitForSnackbar(/run\.sh\s+saved/i);
    cy.selectValueFromDropdownList(SCRIPT_DROPDOWN, 3, "run.sh");

    cy.demoStep("Declare photo.jpg as task0's output file");
    cy.enterInputOrOutputFile("output", "photo.jpg", true, true);
    cy.closeProperty();

    cy.demoStep("Create viewer0 with input files ./");
    cy.createComponent("viewer", "viewer0", 501, 650);
    //viewer's input files use a dedicated list-form panel, not the shared
    //in_out_files panel that enterInputOrOutputFile targets for task/storage.
    cy.get("[data-cy=\"component_property-input_file_setting-panel_title\"]").click();
    cy.get("[data-cy=\"component_property-input_files_viewer-list_form\"]").find("input")
      .type("./");
    cy.get("[data-cy=\"list_form-add-text_field\"]").find("[role=\"button\"]")
      .eq(1)
      .click();
    cy.closeProperty();

    cy.demoStep("Connect task0 to viewer0");
    cy.connectComponentMultiple("task0", "viewer0");

    cy.demoStep("Run the project");
    cy.demoClick("[data-cy=\"workflow-play-btn\"]");
    cy.checkProjectStatus("finished", 30000);

    cy.demoStep("Verify the 'open viewer screen' dialog appears");
    cy.contains("open viewer screen").should("exist");
  });
});
