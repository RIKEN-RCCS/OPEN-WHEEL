const ANIMATION_WAIT_TIME = 500;
//open remote host setting menu
Cypress.Commands.add("openRemoteHostMenu", ()=>{
  cy.visit("/").wait(ANIMATION_WAIT_TIME);
  cy.get("[data-cy=\"tool_bar-navi-icon\"]").click();
  cy.get("[data-cy=\"navigation-manage_remote_host-btn\"]").click();
  //Wait for both socket responses (getHostList + getJobSchedulerLabelList) to complete.
  //When both are done, isLoaded becomes true and Vuetify removes the v-data-table--loading class.
  //This ensures all Vue re-renders triggered by the data updates have finished before we proceed.
  cy.get("[data-cy=\"remotehost-items-data_table\"]").should("not.have.class", "v-data-table--loading");
  //Wait for VDialogTransition opening animation to complete.
  //VDialogTransition.onBeforeEnter sets pointer-events:none on .v-overlay__content and
  //only removes it in onAfterEnter (after ~225ms animation). If we click while pointer-events
  //is still none, Cypress waits for actionability and a concurrent Vue re-render detaches the button.
  cy.get(".v-overlay--active .v-overlay__content").should("not.have.css", "pointer-events", "none");
});

//remove remote host setting
Cypress.Commands.add("removeRemoteHost", (remotoHostName)=>{
  cy.openRemoteHostMenu();
  cy.get("body").then(($body)=>{
    if ($body.text().includes(remotoHostName)) {
      cy.contains("tr", remotoHostName).find("[data-cy=\"action_row-delete-btn\"]")
        .click();
      cy.get("[data-cy=\"buttons-remove-btn\"]", { timeout: 1000 }).click();
    }
  });
});

/**
 * Remove a remote host entry from the current remote host settings page
 * without navigating away. Use this in afterEach to avoid extra page loads.
 * @param {string} remotoHostName - label of the remote host to remove
 */
Cypress.Commands.add("removeRemoteHostInPlace", (remotoHostName)=>{
  cy.get("body").then(($body)=>{
    if ($body.text().includes(remotoHostName)) {
      cy.contains("tr", remotoHostName).find("[data-cy=\"action_row-delete-btn\"]")
        .click();
      cy.get("[data-cy=\"buttons-remove-btn\"]", { timeout: 1000 }).click();
    }
  });
});

Cypress.Commands.add("enterRequiredRemoteHost", (label, hostname, portNumber, testUser)=>{
  cy.get("[data-cy=\"add_new_host-label-text_field\"]").find("input")
    .type(label, { force: true });
  cy.get("[data-cy=\"add_new_host-hostname-text_field\"]").find("input")
    .type(hostname, { force: true });
  cy.get("[data-cy=\"add_new_host-port_number_label-text_field\"]").find("input")
    .type(portNumber.toString(), { force: true });
  cy.get("[data-cy=\"add_new_host-user_id-text_field\"]").find("input")
    .type(testUser, { force: true });
  //Click on dialog title to trigger blur from all fields
  cy.get("[data-cy=\"add_new_host-add_new_host-card_title\"]").click();
});

//enter any items on the remote host screen
Cypress.Commands.add("enterRemoteHost", (hostWorkDir, privateKyeFile, jobSchedulers, maxNumber, availableQueues, bulkjobChk, stepjobChk, sharedHost)=>{
  cy.get("[data-cy=\"add_new_host-work_dir_label-text_field\"]").find("input")
    .type(hostWorkDir, { force: true });
  cy.get("[data-cy=\"add_new_host-private_key_path-text_field\"]").find("input")
    .type(privateKyeFile, { force: true });
  cy.get("[data-cy=\"add_new_host-job_schedulers-select\"]").type(jobSchedulers);

  cy.get("[data-cy=\"add_new_host-max_number_of_jobs-text_field\"]").find("input")
    .type(maxNumber, { force: true });
  cy.get("[data-cy=\"add_new_host-available_queues-combobox\"]").find("input")
    .type(availableQueues + "{enter}", { force: true });
  if (bulkjobChk) {
    cy.get("[data-cy=\"add_new_host-use_bulkjob-checkbox\"]").find("[type=\"checkbox\"]")
      .check();
  } else {
    cy.get("[data-cy=\"add_new_host-use_bulkjob-checkbox\"]").find("[type=\"checkbox\"]")
      .uncheck();
  }
  if (stepjobChk) {
    cy.get("[data-cy=\"add_new_host-use_stepjob-checkbox\"]").find("[type=\"checkbox\"]")
      .check();
  } else {
    cy.get("[data-cy=\"add_new_host-use_stepjob-checkbox\"]").find("[type=\"checkbox\"]")
      .uncheck();
  }
  cy.get("[data-cy=\"add_new_host-shared_path_on_shared_host-text_field\"]").find("input")
    .type(sharedHost, { force: true });
});

//enter advanced settings for the remote host screen
Cypress.Commands.add("enterAdvancedRemoteHost", (intervalMin, statusCheckSec, hostMaxNumber, executionInterval, timeoutDuring)=>{
  //Only open the Advanced settings panel if it's not already open
  cy.get("body").then(($body)=>{
    if (!$body.find("[data-cy=\"add_new_host-connection_renewal-text_field\"]").is(":visible")) {
      cy.get("[data-cy=\"add_new_host-advanced_settings-title\"]").click();
      cy.get("[data-cy=\"add_new_host-connection_renewal-text_field\"]").should("be.visible");
    }
  });
  cy.get("[data-cy=\"add_new_host-connection_renewal-text_field\"]").find("input")
    .type(intervalMin, { force: true });
  cy.get("[data-cy=\"add_new_host-status_check-text_field\"]").find("input")
    .type(statusCheckSec, { force: true });
  cy.get("[data-cy=\"add_new_host-max_number-text_field\"]").find("input")
    .type(hostMaxNumber, { force: true });
  cy.get("[data-cy=\"add_new_host-execution_interval-text_field\"]").find("input")
    .type(executionInterval, { force: true });
  cy.get("[data-cy=\"add_new_host-timeout_during-text_field\"]").find("input")
    .type(timeoutDuring, { force: true });
});
