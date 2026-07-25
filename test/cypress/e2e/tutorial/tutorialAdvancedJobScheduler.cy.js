/**
 * Demo replay of documentMD/user_guide/_tutorial/2_advanced_tutorial, sections
 * 7-8 (Bulk Job, Step Job).
 *
 * Unlike tutorialBasic.cy.js/tutorialAdvanced.cy.js, this spec runs against the
 * MOCK server, not the real one: bulkjobTask/stepJob require a Fujitsu
 * TCS-style batch scheduler (pjsub bulk/step jobs), and the real test host
 * available to this suite is plain OpenPBS, which doesn't support them. The
 * mock server's "componentTestLabel" host (jobScheduler: PBSPro, useBulkjob:
 * true, useStepjob: true) lets the project reach "finished" so the UI
 * configuration flow can still be demoed end-to-end, but it does not validate
 * genuine bulk/step scheduling behavior.
 *
 * Only one representative case is implemented per component (not the
 * tutorial's full success/failure matrix).
 *
 * Run with: npm run -w test test:e2e:mock:start, then cypress open (see
 * tutorialBasic.cy.js for the DEMO_MODE modes - same three modes apply here).
 */
const MOCK_URL = Cypress.env("USE_MOCK")
  ? { baseUrl: "http://localhost:3001" }
  : {};

describe("tutorial advanced - job scheduler", MOCK_URL, ()=>{
  const TEST_LABEL = "componentTestLabel";
  const HOST_DROPDOWN = "[data-cy=\"component_property-host-select\"]";
  const SCRIPT_DROPDOWN = "[data-cy=\"component_property-script-autocomplete\"]";

  before(()=>{
    return cy.removeAllProjects();
  });

  after(()=>{
    return cy.removeAllProjects();
  });

  describe("7. Bulk Job", ()=>{
    beforeEach(()=>{
      cy.viewport("macbook-16");
      return cy.createAndOpenProject();
    });

    afterEach(()=>{
      return cy.goHome();
    });

    it("bulkjobTask runs across a bulk number range on a job-scheduler host", ()=>{
      cy.demoStep("Create a bulkjobTask component");
      cy.createComponent("bulkjobTask", "bjTask0", 501, 500);

      cy.demoStep("Switch host to the job-scheduler-capable test host");
      cy.selectValueFromDropdownList(HOST_DROPDOWN, 2, TEST_LABEL);

      cy.demoStep("Create run.sh: echo ${PJM_BULKNUM}");
      cy.createDirOrFile("file", "run.sh", true);
      cy.selectValueFromDropdownList(SCRIPT_DROPDOWN, 3, "run.sh");

      cy.demoStep("Uncheck 'use parameter setting file' and set bulk number range 0-5");
      cy.get("[data-cy=\"component_property-bulijob_task-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-bulk_number-switch\"]").find("input")
        .uncheck({ force: true });
      cy.get("[data-cy=\"component_property-start_bulkjob-text_field\"]").type(0);
      cy.get("[data-cy=\"component_property-end_bulkjob-text_field\"]").type(5);

      cy.demoStep("Set remote file setting include: run.sh*");
      cy.get("[data-cy=\"component_property-remote_file-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-include-list_form\"]").find("input")
        .type("run.sh*");
      cy.get("[data-cy=\"component_property-include-list_form\"]")
        .find("[data-cy=\"list_form-add-text_field\"]")
        .find("[role=\"button\"]")
        .last()
        .click({ force: true });
      cy.closeProperty();

      cy.demoStep("Run the project");
      cy.demoClick("[data-cy=\"workflow-play-btn\"]");

      cy.demoStep("Enter the (mock) SSH password");
      cy.get("[data-cy=\"buttons-ok-btn\"]", { timeout: 30000 }).should("be.visible");
      cy.passwordType("test");

      cy.checkProjectStatus("finished", 30000);
    });
  });

  describe("8. Step Job", ()=>{
    beforeEach(()=>{
      cy.viewport("macbook-16");
      return cy.createAndOpenProject();
    });

    afterEach(()=>{
      return cy.goHome();
    });

    it("stepJob runs two dependent stepJobTasks (dependencyForm sd=ec==1) to finished", ()=>{
      cy.demoStep("Create a stepjob component on the job-scheduler-capable test host");
      cy.createComponent("stepjob", "stepjob0", 501, 500);
      cy.selectValueFromDropdownList(HOST_DROPDOWN, 2, TEST_LABEL);
      cy.closeProperty();

      cy.demoStep("Enter stepjob0");
      cy.doubleClickComponentName("stepjob0");

      cy.demoStep("Create sjTask0");
      cy.createComponent("stepjobTask", "sjTask0", 501, 500);
      cy.createDirOrFile("file", "run0.sh", true);
      cy.selectValueFromDropdownList(SCRIPT_DROPDOWN, 3, "run0.sh");
      cy.closeProperty();

      cy.demoStep("Create sjTask1 with a dependency on sjTask0's exit code");
      cy.createComponent("stepjobTask", "sjTask1", 501, 650);
      cy.createDirOrFile("file", "run1.sh", true);
      cy.selectValueFromDropdownList(SCRIPT_DROPDOWN, 3, "run1.sh");
      cy.get("[data-cy=\"component_property-stepjob_task-panel_title\"]").click();
      cy.get("[data-cy=\"component_property-use_dependency-switch\"]").find("input")
        .click();
      cy.get("[data-cy=\"component_property-dependency_form-text_field\"]").type("sd=ec==1");
      cy.closeProperty();

      cy.demoStep("Connect sjTask0 to sjTask1 (execution order)");
      cy.connectComponentMultiple("sjTask0", "sjTask1");

      cy.demoStep("Run the project");
      cy.demoClick("[data-cy=\"workflow-play-btn\"]");

      cy.demoStep("Enter the (mock) SSH password");
      cy.get("[data-cy=\"buttons-ok-btn\"]", { timeout: 30000 }).should("be.visible");
      cy.passwordType("test");

      cy.checkProjectStatus("finished", 30000);
    });
  });
});
