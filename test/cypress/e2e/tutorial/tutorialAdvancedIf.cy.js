/**
 * Demo replay of documentMD/user_guide/_tutorial/2_advanced_tutorial, section 1
 * (Conditional Branch). Runs against the REAL server so check.sh is genuinely
 * evaluated - see the project's approved plan for tutorial-demo tests for why.
 *
 * Split into its own file (like the other tutorialAdvanced*.cy.js specs) so
 * each section's real script execution runs in a fresh browser process,
 * avoiding the Chrome renderer memory crash observed when many real-execution
 * sections ran back-to-back in a single spec file.
 *
 * Three ways to run (see plan doc / --env DEMO_MODE):
 *   cypress open --env DEMO_MODE=pause  -> live presenter demo (stop-motion)
 *   cypress run --headed --config video=true --env DEMO_MODE=video -> recorded demo video
 *   cypress open (DEMO_MODE unset)      -> GUI run-through test, full speed
 */
describe("tutorial advanced - 1. Conditional Branch (if)", ()=>{
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

  it("check.sh exits 0: only the if-branch (task1) runs", ()=>{
    cy.demoStep("Create task0 (else-branch)");
    cy.createComponent("task", "task0", 501, 700);
    cy.scriptMake("t0.sh", "echo task0 > task0_ran.txt");
    cy.waitForSnackbar(/t0\.sh\s+saved/i);
    cy.selectValueFromDropdownList(SCRIPT_DROPDOWN, 3, "t0.sh");
    cy.closeProperty();

    cy.demoStep("Create task1 (if-branch)");
    cy.createComponent("task", "task1", 501, 850);
    cy.scriptMake("t1.sh", "echo task1 > task1_ran.txt");
    cy.waitForSnackbar(/t1\.sh\s+saved/i);
    cy.selectValueFromDropdownList(SCRIPT_DROPDOWN, 3, "t1.sh");
    cy.closeProperty();

    cy.demoStep("Create if0 with check.sh (exit 0)");
    cy.createComponent("if", "if0", 501, 500);
    cy.setupIfWithConditionScript("check.sh", "exit 0");
    cy.closeProperty();

    cy.demoStep("Connect if0's else output to task0, if output to task1");
    cy.connectComponentElse("if0", "task0");
    cy.connectComponentMultiple("if0", "task1");

    cy.demoStep("Run the project");
    cy.demoClick("[data-cy=\"workflow-play-btn\"]");
    cy.checkProjectStatus("finished", 30000);

    cy.demoStep("Verify only task1 ran");
    cy.reload();
    cy.checkProjectStatus("finished", 30000);
    cy.clickComponentName("task1");
    cy.get("[data-cy=\"component_property-files-panel_title\"]").scrollIntoView()
      .click();
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("task1_ran.txt")
      .should("exist");
    cy.closeProperty();
    cy.clickComponentName("task0");
    cy.get("[data-cy=\"component_property-files-panel_title\"]").scrollIntoView()
      .click();
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("task0_ran.txt")
      .should("not.exist");
  });

  it("check.sh exits 1: only the else-branch (task0) runs", ()=>{
    cy.demoStep("Create task0 (else-branch)");
    cy.createComponent("task", "task0", 501, 700);
    cy.scriptMake("t0.sh", "echo task0 > task0_ran.txt");
    cy.waitForSnackbar(/t0\.sh\s+saved/i);
    cy.selectValueFromDropdownList(SCRIPT_DROPDOWN, 3, "t0.sh");
    cy.closeProperty();

    cy.demoStep("Create task1 (if-branch)");
    cy.createComponent("task", "task1", 501, 850);
    cy.scriptMake("t1.sh", "echo task1 > task1_ran.txt");
    cy.waitForSnackbar(/t1\.sh\s+saved/i);
    cy.selectValueFromDropdownList(SCRIPT_DROPDOWN, 3, "t1.sh");
    cy.closeProperty();

    cy.demoStep("Create if0 with check.sh (exit 1)");
    cy.createComponent("if", "if0", 501, 500);
    cy.setupIfWithConditionScript("check.sh", "exit 1");
    cy.closeProperty();

    cy.demoStep("Connect if0's else output to task0, if output to task1");
    cy.connectComponentElse("if0", "task0");
    cy.connectComponentMultiple("if0", "task1");

    cy.demoStep("Run the project");
    cy.demoClick("[data-cy=\"workflow-play-btn\"]");
    cy.checkProjectStatus("finished", 30000);

    cy.demoStep("Verify only task0 ran");
    cy.reload();
    cy.checkProjectStatus("finished", 30000);
    cy.clickComponentName("task0");
    cy.get("[data-cy=\"component_property-files-panel_title\"]").scrollIntoView()
      .click();
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("task0_ran.txt")
      .should("exist");
    cy.closeProperty();
    cy.clickComponentName("task1");
    cy.get("[data-cy=\"component_property-files-panel_title\"]").scrollIntoView()
      .click();
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("task1_ran.txt")
      .should("not.exist");
  });
});
