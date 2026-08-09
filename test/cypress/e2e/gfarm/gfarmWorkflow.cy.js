/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 *
 * Gfarm attribute viewer E2E test
 *
 * Required environment variables (pass via gfarm-e2e.env loaded by the npm script):
 *   WHEEL_GFARM_CSGW_HOSTNAME   - CSGW hostname
 *   WHEEL_GFARM_CSGW_USERNAME   - CSGW SSH user
 *   WHEEL_GFARM_CSGW_PORT       - CSGW SSH port (default 22)
 *   WHEEL_GFARM_JWT_USERNAME     - JWT server username
 *   WHEEL_GFARM_JWT_URL          - JWT server URL (blank = WHEEL default)
 *   WHEEL_GFARM_STORAGE_ROOT     - Gfarm root path for test files
 *   WHEEL_GFARM_REMOTE_LABEL     - Label for the remote HPC host in WHEEL
 *   WHEEL_GFARM_REMOTE_HOSTNAME  - Remote HPC login node hostname
 *   WHEEL_GFARM_REMOTE_USERNAME  - Remote HPC SSH user
 *   WHEEL_GFARM_REMOTE_PORT      - Remote HPC SSH port (default 22)
 *   WHEEL_GFARM_REMOTE_WORKDIR   - Working directory on the remote host
 */
import "cypress-wait-until";

//Component type IDs used in the component library drag-and-drop
const TYPE_TASK = "task";
const TYPE_HPCISS = "storage";
const TYPE_HPCISSTAR = "storage";

//Component names used in the workflow
const TASK_NAME = "localTask";
const REMOTE_JOB_NAME = "remoteJob";
const HPCISS_NAME = "gfarmStorage";
const HPCISSTAR_NAME = "gfarmStorageTar";

//Shared file names transferred between components
const TASK_OUTPUT_FILE = "output.txt";
const JOB_OUTPUT_FILE = "result.txt";

//Timeout for project execution (ms)
const EXEC_TIMEOUT = 120000;
const EXEC_INTERVAL = 2000;

describe("Gfarm attribute viewer E2E test", ()=>{
  //Read all secrets from Cypress env (populated by dotenv from gfarm-e2e.env)
  const CSGW_HOSTNAME = Cypress.env("WHEEL_GFARM_CSGW_HOSTNAME");
  const CSGW_USERNAME = Cypress.env("WHEEL_GFARM_CSGW_USERNAME");
  const CSGW_PORT = Cypress.env("WHEEL_GFARM_CSGW_PORT") || 22;
  const JWT_USERNAME = Cypress.env("WHEEL_GFARM_JWT_USERNAME");
  const JWT_URL = Cypress.env("WHEEL_GFARM_JWT_URL") || "";
  const STORAGE_ROOT = Cypress.env("WHEEL_GFARM_STORAGE_ROOT");
  const REMOTE_LABEL = Cypress.env("WHEEL_GFARM_REMOTE_LABEL");
  const REMOTE_HOSTNAME = Cypress.env("WHEEL_GFARM_REMOTE_HOSTNAME");
  const REMOTE_USERNAME = Cypress.env("WHEEL_GFARM_REMOTE_USERNAME");
  const REMOTE_PORT = Cypress.env("WHEEL_GFARM_REMOTE_PORT") || 22;
  const REMOTE_WORKDIR = Cypress.env("WHEEL_GFARM_REMOTE_WORKDIR") || "";

  before(()=>{
    cy.viewport("macbook-16");

    //-- Register CSGW (Gfarm) remote host --
    cy.goToScreen("remotehost");
    cy.get("[data-cy=\"remotehost-new_remote_host_setting-btn\"]").click();
    cy.get("[data-cy=\"add_new_host-add_new_host-card_title\"]").should("be.visible");
    cy.get("[data-cy=\"add_new_host-label-text_field\"]").find("input")
      .type("CSGW");
    cy.get("[data-cy=\"add_new_host-hostname-text_field\"]").find("input")
      .type(CSGW_HOSTNAME);
    cy.get("[data-cy=\"add_new_host-port_number_label-text_field\"]").find("input")
      .clear()
      .type(CSGW_PORT.toString());
    cy.get("[data-cy=\"add_new_host-user_id-text_field\"]").find("input")
      .type(CSGW_USERNAME);
    cy.get("[data-cy=\"add_new_host-use_gfarm-checkbox\"]").find("[type=\"checkbox\"]")
      .check();
    cy.get("[data-cy=\"add_new_host-JWT_server_user-text_field\"]").find("input")
      .type(JWT_USERNAME);
    if (JWT_URL) {
      cy.get("[data-cy=\"add_new_host-JWT_server_URL-text_field\"]").find("input")
        .type(JWT_URL);
    }
    cy.get("[data-cy=\"add_new_host-ok-btn\"]").click();

    //-- Register remote HPC job host --
    cy.get("[data-cy=\"remotehost-new_remote_host_setting-btn\"]").click();
    cy.get("[data-cy=\"add_new_host-add_new_host-card_title\"]").should("be.visible");
    cy.get("[data-cy=\"add_new_host-label-text_field\"]").find("input")
      .type(REMOTE_LABEL);
    cy.get("[data-cy=\"add_new_host-hostname-text_field\"]").find("input")
      .type(REMOTE_HOSTNAME);
    cy.get("[data-cy=\"add_new_host-port_number_label-text_field\"]").find("input")
      .clear()
      .type(REMOTE_PORT.toString());
    cy.get("[data-cy=\"add_new_host-user_id-text_field\"]").find("input")
      .type(REMOTE_USERNAME);
    if (REMOTE_WORKDIR) {
      cy.get("[data-cy=\"add_new_host-work_dir_label-text_field\"]").find("input")
        .type(REMOTE_WORKDIR);
    }
    cy.get("[data-cy=\"add_new_host-ok-btn\"]").click();
  });

  beforeEach(()=>{
    cy.viewport("macbook-16");
    cy.createAndOpenProject();
  });

  afterEach(()=>{
    return cy.removeAllProjects();
  });

  after(()=>{
    cy.removeRemoteHost("CSGW");
    cy.removeRemoteHost(REMOTE_LABEL);
  });

  it("should run workflow, upload to gfarm, and show correct attribute metadata", ()=>{
    //------------------------------------------------------------------
    //1. Create local task component (produces output.txt)
    //------------------------------------------------------------------
    cy.createComponent(TYPE_TASK, TASK_NAME, 400, 200);
    //Set script using JavaScript expression textarea
    cy.get("[data-cy=\"component_property-task_use_javascript-switch\"]").click();
    cy.get("[data-cy=\"component_property-task_use_javascript-textarea\"]")
      .find("textarea")
      .first()
      .type(`require('fs').writeFileSync('${TASK_OUTPUT_FILE}', 'hello from local task');`, { parseSpecialCharSequences: false });
    //Add outputFile
    cy.get("[data-cy=\"component_property-in_out_files-panel_title\"]").scrollIntoView()
      .click({ force: true });
    cy.get("[data-cy=\"component_property-output_files-list_form\"]").find("input")
      .type(TASK_OUTPUT_FILE);
    cy.get("[data-cy=\"list_form-add-text_field\"]").find("[role=\"button\"]")
      .last()
      .click();
    cy.closeProperty();

    //------------------------------------------------------------------
    //2. Create remote job component (reads output.txt, produces result.txt)
    //------------------------------------------------------------------
    cy.createComponent(TYPE_TASK, REMOTE_JOB_NAME, 700, 200);
    //Set remote host
    cy.get("[data-cy=\"component_property-host-select\"]").click();
    cy.get("[role=\"listbox\"]").contains(REMOTE_LABEL, { timeout: 5000 })
      .click();
    //Enable job scheduler
    cy.get("[data-cy=\"component_property-job_scheduler-switch\"]").click();
    //Set script using JavaScript expression textarea
    cy.get("[data-cy=\"component_property-task_use_javascript-switch\"]").click();
    cy.get("[data-cy=\"component_property-task_use_javascript-textarea\"]")
      .find("textarea")
      .first()
      .type(
        `const fs=require('fs');`
        + `const data=fs.readFileSync('${TASK_OUTPUT_FILE}','utf8');`
        + `fs.writeFileSync('${JOB_OUTPUT_FILE}','remote processed: '+data);`,
        { parseSpecialCharSequences: false }
      );
    //Add inputFile (receives output.txt from local task)
    cy.get("[data-cy=\"component_property-in_out_files-panel_title\"]").scrollIntoView()
      .click({ force: true });
    cy.get("[data-cy=\"component_property-input_files-list_form\"]").find("input")
      .type(TASK_OUTPUT_FILE);
    cy.get("[data-cy=\"list_form-add-text_field\"]").find("[role=\"button\"]")
      .first()
      .click();
    //Add outputFile (result.txt goes to hpciss components)
    cy.get("[data-cy=\"component_property-output_files-list_form\"]").find("input")
      .type(JOB_OUTPUT_FILE);
    cy.get("[data-cy=\"list_form-add-text_field\"]").find("[role=\"button\"]")
      .last()
      .click();
    cy.closeProperty();

    //------------------------------------------------------------------
    //3. Create hpciss component
    //------------------------------------------------------------------
    cy.createComponent(TYPE_HPCISS, HPCISS_NAME, 1000, 100);
    cy.get("[data-cy=\"component_property-directory_path-text_field\"]").find("input")
      .type(STORAGE_ROOT + "/hpciss");
    //Set CSGW host
    cy.get("[data-cy=\"component_property-host-select\"]").click();
    cy.get("[role=\"listbox\"]").contains("CSGW", { timeout: 5000 })
      .click();
    //Add inputFile (result.txt from remote job)
    cy.get("[data-cy=\"component_property-in_out_files-panel_title\"]").scrollIntoView()
      .click({ force: true });
    cy.get("[data-cy=\"component_property-input_files-list_form\"]").find("input")
      .type(JOB_OUTPUT_FILE);
    cy.get("[data-cy=\"list_form-add-text_field\"]").find("[role=\"button\"]")
      .first()
      .click();
    cy.closeProperty();

    //------------------------------------------------------------------
    //4. Create hpcisstar component
    //------------------------------------------------------------------
    cy.createComponent(TYPE_HPCISSTAR, HPCISSTAR_NAME, 1000, 350);
    cy.get("[data-cy=\"component_property-directory_path-text_field\"]").find("input")
      .type(STORAGE_ROOT + "/hpcisstar");
    cy.get("[data-cy=\"component_property-host-select\"]").click();
    cy.get("[role=\"listbox\"]").contains("CSGW", { timeout: 5000 })
      .click();
    //Enable tar archive mode
    cy.get("[data-cy=\"component_property-use_tar-switch\"]").click();
    //Add inputFile
    cy.get("[data-cy=\"component_property-in_out_files-panel_title\"]").scrollIntoView()
      .click({ force: true });
    cy.get("[data-cy=\"component_property-input_files-list_form\"]").find("input")
      .type(JOB_OUTPUT_FILE);
    cy.get("[data-cy=\"list_form-add-text_field\"]").find("[role=\"button\"]")
      .first()
      .click();
    cy.closeProperty();

    //------------------------------------------------------------------
    //5. Connect task → remoteJob (dependency + data link: output.txt → input.txt)
    //------------------------------------------------------------------
    cy.connectComponentMultiple(TASK_NAME, REMOTE_JOB_NAME);
    //Connect outputFile of task to inputFile of remoteJob
    cy.get("[data-cy=\"component-component_group-g\"]").contains(TASK_NAME)
      .parents("[data-cy=\"component-component_group-g\"]")
      .first()
      .find("[data-cy=\"component_header-output_file_area-g\"]")
      .first()
      .trigger("mousedown", { force: true });
    cy.get("[data-cy=\"component-component_group-g\"]").contains(REMOTE_JOB_NAME)
      .parents("[data-cy=\"component-component_group-g\"]")
      .first()
      .find("[data-cy=\"component_header-input_file_area-g\"]")
      .first()
      .trigger("mouseup", { force: true });
    cy.wait(500);

    //------------------------------------------------------------------
    //6. Connect remoteJob → hpciss (dependency + data link: result.txt → input.txt)
    //------------------------------------------------------------------
    cy.connectComponentMultiple(REMOTE_JOB_NAME, HPCISS_NAME);
    cy.get("[data-cy=\"component-component_group-g\"]").contains(REMOTE_JOB_NAME)
      .parents("[data-cy=\"component-component_group-g\"]")
      .first()
      .find("[data-cy=\"component_header-output_file_area-g\"]")
      .first()
      .trigger("mousedown", { force: true });
    cy.get("[data-cy=\"component-component_group-g\"]").contains(HPCISS_NAME)
      .parents("[data-cy=\"component-component_group-g\"]")
      .first()
      .find("[data-cy=\"component_header-input_file_area-g\"]")
      .first()
      .trigger("mouseup", { force: true });
    cy.wait(500);

    //------------------------------------------------------------------
    //7. Connect remoteJob → hpcisstar (dependency + data link: result.txt → input.txt)
    //------------------------------------------------------------------
    cy.connectComponentMultiple(REMOTE_JOB_NAME, HPCISSTAR_NAME);
    cy.get("[data-cy=\"component-component_group-g\"]").contains(REMOTE_JOB_NAME)
      .parents("[data-cy=\"component-component_group-g\"]")
      .first()
      .find("[data-cy=\"component_header-output_file_area-g\"]")
      .first()
      .trigger("mousedown", { force: true });
    cy.get("[data-cy=\"component-component_group-g\"]").contains(HPCISSTAR_NAME)
      .parents("[data-cy=\"component-component_group-g\"]")
      .first()
      .find("[data-cy=\"component_header-input_file_area-g\"]")
      .first()
      .trigger("mouseup", { force: true });
    cy.wait(500);

    //------------------------------------------------------------------
    //8. Save and run the project
    //------------------------------------------------------------------
    cy.saveProperty();
    cy.get("[data-cy=\"workflow-play-btn\"]").click();

    cy.waitUntil(()=>{
      return cy.get("[data-cy=\"workflow-project_state-btn\"]")
        .invoke("text")
        .then((text)=>{
          if (text.includes("failed")) {
            throw new Error("project execution failed");
          }
          return text.includes("finished");
        });
    }, {
      timeout: EXEC_TIMEOUT,
      interval: EXEC_INTERVAL,
      errorMsg: `project did not finish within ${EXEC_TIMEOUT / 1000} seconds`
    });

    //------------------------------------------------------------------
    //9. Open hpciss file browser and inspect gfarm attributes
    //------------------------------------------------------------------
    cy.clickComponentName(HPCISS_NAME);
    cy.get("[data-cy=\"component_property-files-panel_title\"]").scrollIntoView()
      .click({ force: true });
    cy.get("[data-cy=\"remote_file_browser-request_remote_connection-btn\"]", { timeout: 5000 }).click();

    //Wait for the result file to appear and select it
    cy.waitUntil(()=>{
      return cy.get("[data-cy=\"remote_file_browser-treeview\"]").then(($tree)=>{
        return $tree.text().includes(JOB_OUTPUT_FILE);
      });
    }, { timeout: 30000, interval: 1000, errorMsg: "result.txt not found in hpciss storage" });

    cy.get("[data-cy=\"remote_file_browser-treeview\"]").contains(JOB_OUTPUT_FILE)
      .click();

    //Open attribute viewer
    cy.get("[data-cy=\"remote_file_browser-inspect_attributes-btn\"]").click();
    cy.get("[data-cy=\"gfarm_attribute_viewer-dialog\"]", { timeout: 10000 }).should("be.visible");

    //Verify the component tree shows all 4 component names
    cy.get("[data-cy=\"gfarm_attribute_viewer-tree\"]").within(()=>{
      cy.contains(TASK_NAME).should("be.visible");
      cy.contains(REMOTE_JOB_NAME).should("be.visible");
      cy.contains(HPCISS_NAME).should("be.visible");
      cy.contains(HPCISSTAR_NAME).should("be.visible");
    });

    //Verify the uploader component (hpciss) is highlighted / shown
    cy.get("[data-cy=\"gfarm_attribute_viewer-tree\"]").contains(HPCISS_NAME)
      .should("be.visible");

    //Click the remoteJob component in the tree and check its detail card
    cy.get("[data-cy=\"gfarm_attribute_viewer-tree\"]").contains(REMOTE_JOB_NAME)
      .click();
    cy.get("[data-cy=\"gfarm_attribute_viewer-detail\"]").within(()=>{
      cy.contains(REMOTE_JOB_NAME).should("be.visible");
      cy.contains(REMOTE_HOSTNAME).should("be.visible");
    });

    //Close attribute viewer
    cy.get("[data-cy=\"gfarm_attribute_viewer-close-btn\"]").click();
    cy.get("[data-cy=\"gfarm_attribute_viewer-dialog\"]").should("not.exist");

    //------------------------------------------------------------------
    //10. Open hpcisstar file browser and inspect gfarm attributes on the tar archive
    //------------------------------------------------------------------
    cy.closeProperty();
    cy.clickComponentName(HPCISSTAR_NAME);
    cy.get("[data-cy=\"component_property-files-panel_title\"]").scrollIntoView()
      .click({ force: true });
    cy.get("[data-cy=\"gfarm_tar_browser-request_remote_connection-btn\"]", { timeout: 5000 }).click();

    cy.waitUntil(()=>{
      return cy.get("body").then(($body)=>{
        return $body.find("[data-cy=\"gfarm_tar_browser-file-table\"]").length > 0;
      });
    }, { timeout: 30000, interval: 1000, errorMsg: "gfarm tar browser did not load" });

    //Click inspect button (always enabled for tar archives)
    cy.get("[data-cy=\"gfarm_tar_browser-inspect_attributes-btn\"]").click();
    cy.get("[data-cy=\"gfarm_attribute_viewer-dialog\"]", { timeout: 10000 }).should("be.visible");

    //Verify same component names appear in the tree
    cy.get("[data-cy=\"gfarm_attribute_viewer-tree\"]").within(()=>{
      cy.contains(TASK_NAME).should("be.visible");
      cy.contains(REMOTE_JOB_NAME).should("be.visible");
      cy.contains(HPCISS_NAME).should("be.visible");
      cy.contains(HPCISSTAR_NAME).should("be.visible");
    });

    //The uploader for the tar archive should be hpcisstar
    cy.get("[data-cy=\"gfarm_attribute_viewer-tree\"]").contains(HPCISSTAR_NAME)
      .should("be.visible");

    //Close attribute viewer
    cy.get("[data-cy=\"gfarm_attribute_viewer-close-btn\"]").click();

    //------------------------------------------------------------------
    //11. Clean up gfarm storage directories
    //------------------------------------------------------------------
    cy.closeProperty();

    //Clean up hpciss storage
    cy.clickComponentName(HPCISS_NAME);
    cy.get("[data-cy=\"component_property-files-panel_title\"]").scrollIntoView()
      .click({ force: true });
    cy.get("[data-cy=\"remote_file_browser-request_remote_connection-btn\"]", { timeout: 5000 }).click();
    cy.waitUntil(()=>{
      return cy.get("body").then(($body)=>{
        return $body.find("[data-cy=\"remote_file_browser-remove_storage_directory-btn\"]").length > 0;
      });
    }, { timeout: 30000, interval: 1000, errorMsg: "remove storage directory button not found for hpciss" });
    cy.get("[data-cy=\"remote_file_browser-remove_storage_directory-btn\"]").click();
    cy.get("[data-cy=\"versatile_dialog_remove_remote_storage_directory-ok-btn\"]", { timeout: 5000 }).click();
    cy.closeProperty();

    //Clean up hpcisstar storage
    cy.clickComponentName(HPCISSTAR_NAME);
    cy.get("[data-cy=\"component_property-files-panel_title\"]").scrollIntoView()
      .click({ force: true });
    cy.get("[data-cy=\"gfarm_tar_browser-request_remote_connection-btn\"]", { timeout: 5000 }).click();
    cy.waitUntil(()=>{
      return cy.get("body").then(($body)=>{
        return $body.find("[data-cy=\"gfarm_tar_browser-remove_storage_directory-btn\"]").length > 0;
      });
    }, { timeout: 30000, interval: 1000, errorMsg: "remove storage directory button not found for hpcisstar" });
    cy.get("[data-cy=\"gfarm_tar_browser-remove_storage_directory-btn\"]").click();
    cy.get("[data-cy=\"versatile_dialog_remove_hpciss_tar_archive-ok-btn\"]", { timeout: 5000 }).click();
  });
});
