/**
 * Demo replay of documentMD/user_guide/_tutorial/2_advanced_tutorial, section 4
 * (Input File / source). Runs against the REAL server so the upload dialog is
 * genuinely triggered - see the project's approved plan for tutorial-demo tests
 * for why.
 *
 * Split into its own file - see tutorialAdvancedIf.cy.js for why.
 *
 * Three ways to run (see plan doc / --env DEMO_MODE):
 *   cypress open --env DEMO_MODE=pause  -> live presenter demo (stop-motion)
 *   cypress run --headed --config video=true --env DEMO_MODE=video -> recorded demo video
 *   cypress open (DEMO_MODE unset)      -> GUI run-through test, full speed
 */
describe("tutorial advanced - 4. Input File (source)", ()=>{
  const LOCAL_HOST = "localhost";
  const SOURCE_NAME = "source0";

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

  it("source uploads a file on demand into a task", ()=>{
    cy.demoStep("Create source0 with upload on demand enabled");
    cy.createComponent("source", SOURCE_NAME, 501, 500);
    cy.get("[data-cy=\"component_property-upload_setting-panel_title\"]").click();
    cy.get("[data-cy=\"component_property-upload_on_demand-switch\"]").find("input")
      .check({ force: true });
    cy.closeProperty();

    //Task's input filename matches source's fixed "UPLOAD_ONDEMAND" output name
    //directly, avoiding the need for a rename-capable file link (no existing
    //Cypress precedent for that lower-level drag in this suite).
    cy.demoStep("Create task0 that reads the uploaded file");
    cy.createComponent("task", "task0", 501, 650);
    cy.setupTaskWithScriptAndIO("run.sh", "cat UPLOAD_ONDEMAND > result.txt", "input", "UPLOAD_ONDEMAND", LOCAL_HOST);
    cy.closeProperty();

    cy.demoStep("Connect source0 to task0");
    cy.connectComponentMultiple(SOURCE_NAME, "task0");

    cy.demoStep("Run the project");
    cy.demoClick("[data-cy=\"workflow-play-btn\"]");

    cy.demoStep("Upload a local file when prompted");
    const dialogPrefix = `versatile_dialog_upload_source_file_for_${SOURCE_NAME}`;
    cy.get(`[data-cy="${dialogPrefix}-title"]`, { timeout: 30000 }).should("be.visible");
    cy.window().then((win)=>{
      const file = new win.File(["Hello from an uploaded source file"], "uploaded.txt", { type: "text/plain" });
      const dataTransfer = new win.DataTransfer();
      dataTransfer.items.add(file);
      cy.get("#droparea").trigger("drop", { force: true, dataTransfer });
    });
    cy.contains("#droparea", "uploaded.txt", { timeout: 10000 }).should("exist");
    cy.get(`[data-cy="${dialogPrefix}-ok-btn"]`).click();

    cy.checkProjectStatus("finished", 30000);

    cy.demoStep("Verify the uploaded file's content was read");
    cy.reload();
    cy.checkProjectStatus("finished", 30000);
    cy.clickComponentName("task0");
    cy.get("[data-cy=\"component_property-files-panel_title\"]").scrollIntoView()
      .click();
    cy.clickTreeviewItem("[data-cy=\"file_browser-treeview-treeview\"]", "result.txt");
    cy.get("[data-cy=\"file_browser-edit_files-btn\"]").click();
    cy.get("[data-cy=\"rapid-tab-tab_editor\"]").contains("Hello from an uploaded source file");
    cy.get("[data-cy=\"workflow-text_editor_close-btn\"]").click();
  });
});
