import "cypress-wait-until";
describe.skip("HPCI-SS and HPCI-SS-tar E2E test", ()=>{
  const LABEL = "WHEEL_TEST_CSGW";
  const HOST_NAME = Cypress.env("WHEEL_TEST_CSGW_HOSTNAME");
  const TEST_USER = Cypress.env("WHEEL_TEST_CSGW_USERNAME");
  const PORT_NUMBER = 22;
  const JWT_SERVER_USERNAME = Cypress.env("WHEEL_TEST_JWTServer_USERNAME");
  const HPCI_GROUP_NAME = Cypress.env("WHEEL_TEST_GROUPNAME");
  const GFARM_TEST_ROOT = `/home/${HPCI_GROUP_NAME}/${JWT_SERVER_USERNAME}/WHEEL_E2E_TEST`;
  const ARCHIVE_FILENAME = "cypress/fixtures/hpcissE2Etest.tgz";
  const PROJECT_NAME = "WHEEL_HPCISS_TEST_PROJECT";

  before(()=>{
    cy.viewport("macbook-16");
    //CSGWのリモートホスト設定を作成
    cy.goToScreen("remotehost");
    //cy.removeRemoteHost(LABEL); //removeRemoteHostで存在しない時に何もしないように変更したらコメントアウトを外す
    cy.get("[data-cy=\"remotehost-new_remote_host_setting-btn\"]").click();
    cy.get("[data-cy=\"add_new_host-add_new_host-card_title\"]").should("be.visible");
    cy.get("[data-cy=\"add_new_host-label-text_field\"]").type(LABEL);
    cy.get("[data-cy=\"add_new_host-hostname-text_field\"]").type(HOST_NAME);
    cy.get("[data-cy=\"add_new_host-port_number_label-text_field\"]").type(PORT_NUMBER);
    cy.get("[data-cy=\"add_new_host-user_id-text_field\"]").type(TEST_USER);
    cy.get("[data-cy=\"add_new_host-use_gfarm-checkbox\"]").find("[type=\"checkbox\"]")
      .check();
    cy.get("[data-cy=\"add_new_host-JWT_server_user-text_field\"]").type(JWT_SERVER_USERNAME);
    //do not type JWT_SERVER_URL because nii's server is default value for now
    //cy.get("[data-cy=\"add_new_host-JWT_server_URL-text_field\"]").type(JWT_SERVER_URL);
    return cy.get("[data-cy=\"add_new_host-ok-btn\"]").click();
  });
  beforeEach(()=>{
    cy.goToScreen("home");
    cy.get("[data-cy=\"home-import-btn\"]").click();
    cy.get("[data-cy=\"import_dialog-upload_file-input\"]").find("input")
      .selectFile(ARCHIVE_FILENAME);
    cy.get("[data-cy=\"import_dialog-file_browser\"]").contains("div", "./")
      .click();
    cy.get("[data-cy=\"import_dialog-ok-btn\"]").click();

    cy.get("[data-cy=\"versatile_dialog_IMPORTED_PROJECT_WARNING-title\"]").contains("IMPORTED PROJECT WARNING");
    cy.get("[data-cy=\"versatile_dialog_IMPORTED_PROJECT_WARNING-message\"]").contains("Depending on");
    cy.get("[data-cy=\"versatile_dialog_IMPORTED_PROJECT_WARNING-ok-btn\"]").click();
    //cy.get("[data-cy=\"hostmap_dialog-dialog\"]").should("be.visible");
    //cy.get("[data-cy=\"hostmap_dialog-header_oldname-text_field\"]").contains("hostname in project archive");
    //cy.get("[data-cy=\"hostmap_dialog-header_newname-text_field\"]").contains("newly assigned host");
    //cy.get("[data-cy=\"hostmap_dialog-dialog\"]").find("input")
    //.eq(0)
    //.should("have.value", OLD_LABEL);
    //cy.get("[data-cy=\"hostmap_dialog-dialog\"]").find("input")
    //.eq(1)
    //.type(LABEL);
    //cy.get("[data-cy=\"versatile_dialog_Hostmapping-ok-btn\"]").click();
    cy.get("[data-cy=\"home-project_name-btn\"]").contains(PROJECT_NAME);
    cy.projectOpen(PROJECT_NAME);
    cy.get("[data-cy=\"versatile_dialog_IMPORTED_PROJECT_WARNING-title\"]").contains("IMPORTED PROJECT WARNING");
    return cy.get("[data-cy=\"versatile_dialog_IMPORTED_PROJECT_WARNING-ok-btn\"]").click();
  });
  afterEach(()=>{
    return cy.removeAllProjects();
  });
  after(()=>{
    return cy.removeRemoteHost(LABEL);
  });
  describe("E2E test for HPCI-SS", ()=>{
    beforeEach(()=>{
      cy.clickComponentName("hpciss");
      cy.get("[data-cy=\"component_property-directory_path-text_field\"]").type(GFARM_TEST_ROOT);
      cy.get("[data-cy=\"component_property-disable-switch\"]").click();
    });
    afterEach(()=>{
      cy.clickComponentName("hpciss");
      cy.get("[data-cy=\"component_property-close-btn\"]").click();
      cy.wait(500);
      cy.clickComponentName("hpciss");
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"remote_file_browser-request_remote_connection-btn\"]", { timeout: 3000 }).click();

      return cy.waitUntil(()=>{
        return cy.get("[data-cy=\"remote_file_browser-remove_storage_directory-btn\"]")
          .then(()=>{
            return cy.get("[data-cy=\"remote_file_browser-remove_storage_directory-btn\"]").click()
              .get("[data-cy=\"versatile_dialog_remove_remote_storage_directory-ok-btn\"]", { timeout: 3000 })
              .click()
              .then(()=>{ return true; });
          });
      }, {
        timeout: 30000,
        interval: 1000,
        errorMsg: "remove remote storage directory failed"
      });
    });
    it("should copy files to HPCI-SS", ()=>{
      cy.get("[data-cy=\"workflow-play-btn\"]").click();
      cy.waitUntil(()=>{
        return cy.get("[data-cy=\"workflow-project_state-btn\"]")
          .invoke("text")
          .then((text)=>{
            if (text.includes("failed")) {
              throw new Error("project failed");
            }
            return text.includes("finished");
          });
      }, {
        timeout: 30000,
        interval: 1000,
        errorMsg: "project does not finished within 30 sec"
      });

      cy.clickComponentName("hpciss");
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"remote_file_browser-request_remote_connection-btn\"]", { timeout: 3000 }).click();
      cy.waitUntil(()=>{
        return cy.get("[data-cy=\"remote_file_browser-treeview\"]").within(()=>{
          cy.contains("file1").should("be.visible");
          cy.contains("file2").should("be.visible");
          cy.contains("dir").should("be.visible");
          cy.contains("run.sh").should("be.visible");
        });
      }, {
        timeout: 30000,
        interval: 1000,
        errorMsg: "files not found on gfarm storage"
      });
    });
  });
  describe("E2E test for HPCI-SS-tar", ()=>{
    beforeEach(()=>{
      cy.clickComponentName("hpcisstar");
      cy.get("[data-cy=\"component_property-directory_path-text_field\"]").type(GFARM_TEST_ROOT);
      cy.get("[data-cy=\"component_property-disable-switch\"]").click();
    });
    afterEach(()=>{
      cy.clickComponentName("hpcisstar");
      cy.get("[data-cy=\"component_property-close-btn\"]").click();
      cy.wait(500);
      cy.clickComponentName("hpcisstar");
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"gfarm_tar_browser-request_remote_connection-btn\"]", { timeout: 3000 }).click();

      return cy.waitUntil(()=>{
        return cy.get("[data-cy=\"gfarm_tar_browser-remove_storage_directory-btn\"]")
          .then(()=>{
            return cy.get("[data-cy=\"gfarm_tar_browser-remove_storage_directory-btn\"]").click()
              .get("[data-cy=\"versatile_dialog_remove_hpciss_tar_archive-ok-btn\"]", { timeout: 3000 })
              .click()
              .then(()=>{ return true; });
          });
      }, {
        timeout: 30000,
        interval: 1000,
        errorMsg: "remove remote storage directory failed"
      });
    });
    it("should copy files to HPCI-SS-tar", ()=>{
      cy.get("[data-cy=\"workflow-play-btn\"]").click();
      cy.waitUntil(()=>{
        return cy.get("[data-cy=\"workflow-project_state-btn\"]")
          .invoke("text")
          .then((text)=>{
            if (text.includes("failed")) {
              throw new Error("project failed");
            }
            return text.includes("finished");
          });
      }, {
        timeout: 30000,
        interval: 1000,
        errorMsg: "project does not finished within 30 sec"
      });

      cy.clickComponentName("hpcisstar");
      cy.get("[data-cy=\"component_property-files-panel_title\"]").click();
      cy.get("[data-cy=\"gfarm_tar_browser-request_remote_connection-btn\"]", { timeout: 3000 }).click();
      cy.waitUntil(()=>{
        return cy.get("[data-cy=\"gfarm_tar_browser-file-table\"]").within(()=>{
          cy.contains("file1").should("be.visible");
          cy.contains("file2").should("be.visible");
          cy.contains("dir/file_in_dir").should("be.visible");
          cy.contains("run.sh").should("be.visible");
        });
      }, {
        timeout: 30000,
        interval: 1000,
        errorMsg: "files not found on gfarm storage"
      });
    });
  });
});
