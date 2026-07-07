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
    cy.demoStep("Create task0");
    cy.createComponent("task", "task0", 501, 500);
    cy.scriptMake("run.sh", "ls * > listing.txt");
    cy.waitForSnackbar(/run\.sh\s+saved/i);
    cy.selectValueFromDropdownList(SCRIPT_DROPDOWN, 3, "run.sh");

    cy.demoStep("Upload an image file into task0's Files area");
    cy.get("[data-cy=\"component_property-files-panel_title\"]").scrollIntoView()
      .click();
    cy.window().then((win)=>{
      const file = new win.File(["fake image content"], "photo.jpg", { type: "image/jpeg" });
      const dataTransfer = new win.DataTransfer();
      dataTransfer.items.add(file);
      cy.get("[data-cy=\"file_browser-treeview-treeview\"]").trigger("drop", { force: true, dataTransfer });
    });
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("photo.jpg", { timeout: 10000 })
      .should("exist");

    cy.demoStep("Declare photo.jpg as task0's output file");
    cy.enterInputOrOutputFile("output", "photo.jpg", true, true);
    cy.closeProperty();

    cy.demoStep("Create viewer0 with input files ./");
    cy.createComponent("viewer", "viewer0", 501, 650);
    cy.enterInputOrOutputFile("input", "./", true, true);
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
