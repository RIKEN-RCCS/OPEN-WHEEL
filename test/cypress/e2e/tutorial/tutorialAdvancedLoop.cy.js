/**
 * Demo replay of documentMD/user_guide/_tutorial/2_advanced_tutorial, section 2
 * (Loop). Runs against the REAL server so the for-loop genuinely iterates -
 * see the project's approved plan for tutorial-demo tests for why.
 *
 * Split into its own file - see tutorialAdvancedIf.cy.js for why.
 *
 * Three ways to run (see plan doc / --env DEMO_MODE):
 *   cypress open --env DEMO_MODE=pause  -> live presenter demo (stop-motion)
 *   cypress run --headed --config video=true --env DEMO_MODE=video -> recorded demo video
 *   cypress open (DEMO_MODE unset)      -> GUI run-through test, full speed
 */
describe("tutorial advanced - 2. Loop (for)", ()=>{
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

  it("for loop (start=1, end=5, step=2) runs its inner task at indices 1, 3, 5", ()=>{
    cy.demoStep("Create for0 with start=1, end=5, step=2");
    cy.createComponent("for", "for0", 501, 500);
    cy.setForLoop(1, 5, 2);
    cy.closeProperty();

    cy.demoStep("Enter for0 and add a task that appends the loop index");
    cy.doubleClickComponentName("for0");
    cy.createComponent("task", "task0", 501, 500);
    cy.scriptMake("run.sh", "echo $WHEEL_CURRENT_INDEX >> indices.txt");
    cy.waitForSnackbar(/run\.sh\s+saved/i);
    cy.selectValueFromDropdownList(SCRIPT_DROPDOWN, 3, "run.sh");
    cy.closeProperty();

    cy.demoStep("Run the project");
    cy.demoClick("[data-cy=\"workflow-play-btn\"]");
    cy.checkProjectStatus("finished", 30000);

    cy.demoStep("Verify indices.txt records 1, 3 and 5");
    cy.reload();
    cy.checkProjectStatus("finished", 30000);
    //Reload resets the view back to the root graph, losing the "inside for0"
    //nested context - re-enter it before looking for task0.
    cy.doubleClickComponentName("for0");
    cy.clickComponentName("task0");
    cy.get("[data-cy=\"component_property-files-panel_title\"]").scrollIntoView()
      .click();
    cy.clickTreeviewItem("[data-cy=\"file_browser-treeview-treeview\"]", "indices.txt");
    cy.get("[data-cy=\"file_browser-edit_files-btn\"]").click();
    cy.get("[data-cy=\"rapid-tab-tab_editor\"]").contains("1");
    cy.get("[data-cy=\"rapid-tab-tab_editor\"]").contains("3");
    cy.get("[data-cy=\"rapid-tab-tab_editor\"]").contains("5");
    cy.get("[data-cy=\"workflow-text_editor_close-btn\"]").click();
  });
});
