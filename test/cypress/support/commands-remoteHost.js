const ANIMATION_WAIT_TIME = 500;

//remove remote host setting
Cypress.Commands.add("removeRemoteHost", (remotoHostName)=>{
  cy.visit("/remotehost").wait(ANIMATION_WAIT_TIME);
  cy.get("body").then(($body)=>{
    if ($body.text().includes(remotoHostName)) {
      cy.contains("tr", remotoHostName).find("[data-cy=\"action_row-delete-btn\"]")
        .click();
      cy.get("[data-cy=\"buttons-remove-btn\"]", { timeout: 1000 }).click();
    }
  });
});

//enter required fields on the remote host screen
Cypress.Commands.add("enterRequiredRemoteHost", (label, hostname, portNumber, testUser)=>{
  cy.get("[data-cy=\"add_new_host-label-text_field\"]").find("input").type(label, { force: true });
  cy.get("[data-cy=\"add_new_host-hostname-text_field\"]").find("input").type(hostname, { force: true });
  cy.get("[data-cy=\"add_new_host-port_number_label-text_field\"]").find("input").type(portNumber.toString(), { force: true });
  cy.get("[data-cy=\"add_new_host-user_id-text_field\"]").find("input").type(testUser, { force: true });
  //Click on dialog title to trigger blur from all fields
  cy.get("[data-cy=\"add_new_host-add_new_host-card_title\"]").click();
});

//enter any items on the remote host screen
Cypress.Commands.add("enterRemoteHost", (hostWorkDir, privateKyeFile, jobSchedulers, maxNumber, availableQueues, bulkjobChk, stepjobChk, sharedHost)=>{
  cy.get("[data-cy=\"add_new_host-work_dir_label-text_field\"]").find("input").type(hostWorkDir, { force: true });
  cy.get("[data-cy=\"add_new_host-private_key_path-text_field\"]").find("input").type(privateKyeFile, { force: true });
  cy.get("[data-cy=\"add_new_host-job_schedulers-select\"]").type(jobSchedulers);

  cy.get("[data-cy=\"add_new_host-max_number_of_jobs-text_field\"]").find("input").type(maxNumber, { force: true });
  cy.get("[data-cy=\"add_new_host-available_queues-text_field\"]").find("input").type(availableQueues, { force: true });
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
  cy.get("[data-cy=\"add_new_host-shared_path_on_shared_host-text_field\"]").find("input").type(sharedHost, { force: true });
});

//enter advanced settings for the remote host screen
Cypress.Commands.add("enterAdvancedRemoteHost", (intervalMin, statusCheckSec, hostMaxNumber, executionInterval, timeoutDuring)=>{
  cy.get("[data-cy=\"add_new_host-advanced_settings-title\"]").click();
  cy.get("[data-cy=\"add_new_host-connection_renewal-text_field\"]").find("input").type(intervalMin, { force: true });
  cy.get("[data-cy=\"add_new_host-status_check-text_field\"]").find("input").type(statusCheckSec, { force: true });
  cy.get("[data-cy=\"add_new_host-max_number-text_field\"]").find("input").type(hostMaxNumber, { force: true });
  cy.get("[data-cy=\"add_new_host-execution_interval-text_field\"]").find("input").type(executionInterval, { force: true });
  cy.get("[data-cy=\"add_new_host-timeout_during-text_field\"]").find("input").type(timeoutDuring, { force: true });
});
