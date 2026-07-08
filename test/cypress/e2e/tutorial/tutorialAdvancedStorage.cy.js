/**
 * Demo replay of documentMD/user_guide/_tutorial/2_advanced_tutorial, section 6
 * (File Save / storage). Runs against the REAL server so files genuinely
 * accumulate on disk - see the project's approved plan for tutorial-demo tests
 * for why.
 *
 * Split into its own file - see tutorialAdvancedIf.cy.js for why.
 *
 * Three ways to run (see plan doc / --env DEMO_MODE):
 *   cypress open --env DEMO_MODE=pause  -> live presenter demo (stop-motion)
 *   cypress run --headed --config video=true --env DEMO_MODE=video -> recorded demo video
 *   cypress open (DEMO_MODE unset)      -> GUI run-through test, full speed
 */
describe("tutorial advanced - 6. File Save (storage)", ()=>{
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

  it("task output accumulates into a storage directory across runs", ()=>{
    const storagePath = `/tmp/wheel_tutorial_storage_${Date.now()}`;
    //WHEEL's storage component validates that storagePath already exists on the
    //server before it will let a project run (componentTypeValidator.js
    //validateStorage - "specified path does not exist on localhost") - it never
    //auto-creates it. Create it directly in the container first.
    cy.exec(`docker exec wheel mkdir -p ${storagePath}`);

    cy.demoStep("Create task0 that writes foo.txt");
    cy.createComponent("task", "task0", 501, 500);
    cy.scriptMake("run.sh", "echo foo > foo.txt");
    cy.waitForSnackbar(/run\.sh\s+saved/i);
    cy.selectValueFromDropdownList(SCRIPT_DROPDOWN, 3, "run.sh");
    cy.enterInputOrOutputFile("output", "*.txt", true, true);
    cy.closeProperty();

    cy.demoStep("Create storage0 with a directory path outside the project");
    cy.createComponent("storage", "storage0", 501, 650);
    cy.get("[data-cy=\"component_property-directory_path-text_field\"]").type(storagePath);
    cy.enterInputOrOutputFile("input", "./", true, true);
    cy.closeProperty();

    cy.demoStep("Connect task0 to storage0");
    cy.connectComponentMultiple("task0", "storage0");

    cy.demoStep("Run the project");
    cy.demoClick("[data-cy=\"workflow-play-btn\"]");
    cy.checkProjectStatus("finished", 30000);

    cy.demoStep("Verify foo.txt landed in storage0");
    cy.reload();
    cy.checkProjectStatus("finished", 30000);
    cy.clickComponentName("storage0");
    cy.get("[data-cy=\"component_property-files-panel_title\"]").scrollIntoView()
      .click();
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("foo.txt")
      .should("exist");
    cy.closeProperty();

    cy.demoStep("Cleanup the project: task0's own copy is removed, storage0's persists");
    cy.demoClick("[data-cy=\"workflow-cleanup_project-btn\"]");
    cy.get("[data-cy=\"versatile_dialog_cleanProject-ok-btn\"]").click();
    cy.clickComponentName("task0");
    cy.get("[data-cy=\"component_property-files-panel_title\"]").scrollIntoView()
      .click();
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("foo.txt")
      .should("not.exist");
    cy.closeProperty();
    cy.clickComponentName("storage0");
    cy.get("[data-cy=\"component_property-files-panel_title\"]").scrollIntoView()
      .click();
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("foo.txt")
      .should("exist");
    cy.closeProperty();

    cy.demoStep("Change task0's script to output bar.txt and rerun");
    cy.clickComponentName("task0");
    cy.scriptMake("run2.sh", "echo bar > bar.txt");
    cy.waitForSnackbar(/run2\.sh\s+saved/i);
    cy.selectValueFromDropdownList(SCRIPT_DROPDOWN, 3, "run2.sh");
    cy.closeProperty();
    cy.demoClick("[data-cy=\"workflow-play-btn\"]");
    cy.checkProjectStatus("finished", 30000);

    cy.demoStep("Verify storage0 now holds both foo.txt and bar.txt");
    cy.reload();
    cy.checkProjectStatus("finished", 30000);
    cy.clickComponentName("storage0");
    cy.get("[data-cy=\"component_property-files-panel_title\"]").scrollIntoView()
      .click();
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("foo.txt")
      .should("exist");
    cy.get("[data-cy=\"file_browser-treeview-treeview\"]").contains("bar.txt")
      .should("exist");
  });
});
