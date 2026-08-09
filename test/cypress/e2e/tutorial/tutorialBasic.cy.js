/**
 * Demo replay of documentMD/user_guide/_tutorial/1_basic_tutorial.
 *
 * Runs against the REAL server (not mock) so scripts genuinely execute and
 * their output can be verified for real - see test/README.md / the project's
 * approved plan for tutorial-demo tests for why.
 *
 * Three ways to run (see plan doc / --env DEMO_MODE):
 *   cypress open --env DEMO_MODE=pause  -> live presenter demo (stop-motion)
 *   cypress run --headed --config video=true --env DEMO_MODE=video -> recorded demo video
 *   cypress open (DEMO_MODE unset)      -> GUI run-through test, full speed
 */
describe("tutorial basic", ()=>{
  const TASK = "task";
  const TASK0 = "task0";
  const TASK1 = "task1";
  const TASK2 = "task2";
  const TASK3 = "task3";
  const LOCAL_HOST = "localhost";
  const REMOTE_HOST = "wheel_release_test_server";
  const REMOTE_PASSWORD = "passw0rd";
  const SCRIPT_DROPDOWN = "[data-cy=\"component_property-script-autocomplete\"]";
  const HOST_DROPDOWN = "[data-cy=\"component_property-host-select\"]";

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

  it("Part 1: single task, hello world, run on localhost", ()=>{
    cy.demoStep("Drag a Task component onto the graph");
    cy.demoMoveTo("[data-cy=\"component_library-component-avatar\"]#task");
    cy.createComponent(TASK, TASK0, 501, 500);

    cy.demoStep("Create hello.sh and write: echo Hello WHEEL > hello.txt");
    cy.scriptMake("hello.sh", "echo Hello WHEEL > hello.txt");
    //Wait for the async file save to actually reach disk before running - otherwise
    //"run project" can race the save and execute an empty script (confirmed via
    //server-side instrumentation while debugging this spec).
    cy.waitForSnackbar(/hello\.sh\s+saved/i);

    cy.demoStep("Select hello.sh as the task's script");
    cy.selectValueFromDropdownList(SCRIPT_DROPDOWN, 3, "hello.sh");

    cy.demoStep("Declare hello.txt as this task's output file");
    cy.enterInputOrOutputFile("output", "hello.txt", true, true);

    cy.demoStep("Save the project");
    cy.demoClick("[data-cy=\"workflow-save-text\"]");

    cy.demoStep("Run the project");
    cy.demoClick("[data-cy=\"workflow-play-btn\"]");
    cy.checkProjectStatus("finished", 30000);

    cy.demoStep("Open hello.txt in the text editor to verify its content");
    //Force a fresh fetch of the component's file listing: the file browser only
    //refetches on (re)mount or when the workflow's descendant tree changes, not
    //simply because a script wrote a new file - see fileBrowser.vue's mounted()
    //hook and its "currentComponent" watcher.
    cy.reload();
    cy.checkProjectStatus("finished", 30000);
    cy.clickComponentName(TASK0);
    cy.get("[data-cy=\"component_property-files-panel_title\"]").scrollIntoView()
      .click();
    cy.clickTreeviewItem("[data-cy=\"file_browser-treeview-treeview\"]", "hello.txt");
    cy.get("[data-cy=\"file_browser-edit_files-btn\"]").click();
    cy.get("[data-cy=\"rapid-tab-tab_editor\"]").contains("Hello WHEEL");
    //Return from the full-screen Text Editor overlay to the graph view so the
    //property drawer's close button is clickable again.
    cy.get("[data-cy=\"workflow-text_editor_close-btn\"]").click();

    cy.demoStep("Cleanup the project");
    cy.closeProperty();
    cy.demoClick("[data-cy=\"workflow-cleanup_project-btn\"]");
    cy.get("[data-cy=\"versatile_dialog_cleanProject-ok-btn\"]").click();
  });

  it("Part 2: remote host + PBS job scheduler execution", ()=>{
    cy.demoStep("Drag a Task component onto the graph");
    cy.createComponent(TASK, TASK0, 501, 500);

    //PBS Pro jobs execute with cwd=$HOME by default regardless of where `qsub`
    //was invoked from, unless the script itself cds into $PBS_O_WORKDIR (or
    //qsub is passed -d). WHEEL's job submission doesn't pass -d, so the script
    //does it explicitly - this is standard PBS practice, not a workaround.
    cy.demoStep("Create hello.sh and write: cd $PBS_O_WORKDIR; echo Hello WHEEL > hello.txt");
    cy.scriptMake("hello.sh", "cd $PBS_O_WORKDIR\necho Hello WHEEL > hello.txt");
    cy.waitForSnackbar(/hello\.sh\s+saved/i);
    cy.selectValueFromDropdownList(SCRIPT_DROPDOWN, 3, "hello.sh");
    cy.enterInputOrOutputFile("output", "hello.txt", true, true);

    cy.demoStep("Switch host to the real remote PBS host");
    cy.selectValueFromDropdownList(HOST_DROPDOWN, 3, REMOTE_HOST);

    cy.demoStep("Enable use job scheduler");
    cy.switchUseJobScheduler("on");

    //For job-scheduler/batch execution, declaring an output file alone does not
    //stage it back from the remote host - the tutorial's own "batch system
    //execution" section calls out "remote file setting" -> include as a separate,
    //required step. Without it hello.txt never comes back to the local task
    //directory even though the job itself finishes successfully.
    cy.demoStep("Add hello.txt to remote file setting include list");
    cy.get("[data-cy=\"component_property-remote_file-panel_title\"]").click();
    cy.get("[data-cy=\"component_property-include-list_form\"]").find("input")
      .type("hello.txt");
    cy.get("[data-cy=\"component_property-include-list_form\"]")
      .find("[data-cy=\"list_form-add-text_field\"]")
      .find("[role=\"button\"]")
      .last()
      .click({ force: true });

    cy.demoStep("Save the project");
    cy.demoClick("[data-cy=\"workflow-save-text\"]");
    cy.closeProperty();

    cy.demoStep("Run the project");
    cy.demoClick("[data-cy=\"workflow-play-btn\"]");

    cy.demoStep("Enter the SSH password");
    cy.get("[data-cy=\"buttons-ok-btn\"]", { timeout: 60000 }).should("be.visible");
    cy.passwordType(REMOTE_PASSWORD);

    //The configured remote host (test/wheel_config/remotehost.json) uses
    //statusCheckInterval: 60 (seconds) - WHEEL only polls PBS job status once a
    //minute by design (avoids hammering the scheduler on a real cluster), so a
    //60000ms timeout here races the server's own poll cycle and can time out
    //right before the next poll would have caught the finished job. Confirmed via
    //server trace logging: job submitted, PBS finished it in ~2s, but WHEEL's own
    //poll didn't observe job_state=F/Exit_status=0 until ~62s after submission.
    //Give it two full poll cycles of headroom.
    cy.checkProjectStatus("finished", 130000);

    cy.demoStep("Open hello.txt in the text editor to verify its content");
    //Force a fresh fetch of the component's file listing: the file browser only
    //refetches on (re)mount or when the workflow's descendant tree changes, not
    //simply because a script wrote a new file - see fileBrowser.vue's mounted()
    //hook and its "currentComponent" watcher.
    cy.reload();
    cy.checkProjectStatus("finished", 30000);
    cy.clickComponentName(TASK0);
    cy.get("[data-cy=\"component_property-files-panel_title\"]").scrollIntoView()
      .click();
    cy.clickTreeviewItem("[data-cy=\"file_browser-treeview-treeview\"]", "hello.txt");
    cy.get("[data-cy=\"file_browser-edit_files-btn\"]").click();
    cy.get("[data-cy=\"rapid-tab-tab_editor\"]").contains("Hello WHEEL");
    //Return from the full-screen Text Editor overlay to the graph view so the
    //property drawer's close button is clickable again.
    cy.get("[data-cy=\"workflow-text_editor_close-btn\"]").click();

    cy.demoStep("Cleanup the project");
    cy.closeProperty();
    cy.demoClick("[data-cy=\"workflow-cleanup_project-btn\"]");
    cy.get("[data-cy=\"versatile_dialog_cleanProject-ok-btn\"]").click();
  });

  it("Part 3: multi-component I/O and execution order", ()=>{
    cy.demoStep("Create task0, output stdout.txt");
    cy.createComponent(TASK, TASK0, 501, 400);
    cy.setupTaskWithScriptAndIO("run0.sh", "echo Hello WHEEL > stdout.txt", "output", "stdout.txt", LOCAL_HOST);
    cy.closeProperty();

    cy.demoStep("Create task1, input stdout.txt");
    cy.createComponent(TASK, TASK1, 501, 550);
    cy.setupTaskWithScriptAndIO("run1.sh", "ls -l stdout.txt > result.txt", "input", "stdout.txt", LOCAL_HOST);
    cy.enterInputOrOutputFile("output", "result.txt", false, true);
    cy.closeProperty();

    cy.demoStep("Wire the file dependency between task0 and task1");
    cy.connectComponentMultiple(TASK0, TASK1);

    cy.demoStep("Run the project");
    cy.demoClick("[data-cy=\"workflow-play-btn\"]");
    cy.checkProjectStatus("finished", 30000);

    cy.demoStep("Verify result.txt shows the passed-in stdout.txt");
    cy.reload();
    cy.checkProjectStatus("finished", 30000);
    cy.clickComponentName(TASK1);
    cy.get("[data-cy=\"component_property-files-panel_title\"]").scrollIntoView()
      .click();
    cy.clickTreeviewItem("[data-cy=\"file_browser-treeview-treeview\"]", "result.txt");
    cy.get("[data-cy=\"file_browser-edit_files-btn\"]").click();
    cy.get("[data-cy=\"rapid-tab-tab_editor\"]").contains("stdout.txt");
    cy.get("[data-cy=\"workflow-text_editor_close-btn\"]").click();

    cy.demoStep("Cleanup the project");
    cy.closeProperty();
    cy.demoClick("[data-cy=\"workflow-cleanup_project-btn\"]");
    cy.get("[data-cy=\"versatile_dialog_cleanProject-ok-btn\"]").click();

    cy.demoStep("Create task2 and task3 to demonstrate execution order control");
    cy.createComponent(TASK, TASK2, 501, 700);
    cy.setupTaskWithScriptAndIO("run2.sh", "echo task2 > order.txt", "output", "order.txt", LOCAL_HOST);
    cy.closeProperty();
    cy.createComponent(TASK, TASK3, 501, 850);
    cy.setupTaskWithScriptAndIO("run3.sh", "echo task3 >> order.txt", "input", "order.txt", LOCAL_HOST);
    cy.closeProperty();

    cy.demoStep("Drag the execution-order handle from task2 to task3");
    cy.connectComponentMultiple(TASK2, TASK3);

    cy.demoStep("Run the project");
    cy.demoClick("[data-cy=\"workflow-play-btn\"]");
    cy.checkProjectStatus("finished", 30000);

    cy.demoStep("Verify order.txt shows task2 finished before task3 ran");
    cy.reload();
    cy.checkProjectStatus("finished", 30000);
    cy.clickComponentName(TASK2);
    cy.get("[data-cy=\"component_property-files-panel_title\"]").scrollIntoView()
      .click();
    cy.clickTreeviewItem("[data-cy=\"file_browser-treeview-treeview\"]", "order.txt");
    cy.get("[data-cy=\"file_browser-edit_files-btn\"]").click();
    cy.get("[data-cy=\"rapid-tab-tab_editor\"]").contains(/task2[\s\S]*task3/);
    cy.get("[data-cy=\"workflow-text_editor_close-btn\"]").click();
  });
});
