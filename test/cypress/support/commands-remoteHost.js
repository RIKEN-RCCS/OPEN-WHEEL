const ANIMATION_WAIT_TIME = 500;

//remove remote host setting
Cypress.Commands.add("removeRemoteHost", (remotoHostName)=>{
  cy.visit("/remotehost").wait(ANIMATION_WAIT_TIME)
    .then(()=>{
      const REMOTE_HOST_ROW = cy.contains("tr", remotoHostName, { timeout: 5000 });
      if (REMOTE_HOST_ROW) {
        cy.wait(2000);
        cy.contains("tr", remotoHostName).find("[data-cy=\"action_row-delete-btn\"]")
          .click();
        cy.get("[data-cy=\"buttons-remove-btn\"]", { timeout: 5000 }).click();
      }
    });
});

//enter required fields on the remote host screen
Cypress.Commands.add("enterRequiredRemoteHost", (label, hostname, portNumber, testUser)=>{
  cy.get("[data-cy=\"add_new_host-label-text_field\"]").type(label);
  cy.get("[data-cy=\"add_new_host-hostname-text_field\"]").type(hostname);
  cy.get("[data-cy=\"add_new_host-port_number_label-text_field\"]").type(portNumber);
  cy.get("[data-cy=\"add_new_host-user_id-text_field\"]").type(testUser);
});

//enter any items on the remote host screen
Cypress.Commands.add("enterRemoteHost", (hostWorkDir, privateKyeFile, jobSchedulers, maxNumber, availableQueues, bulkjobChk, stepjobChk, sharedHost)=>{
  cy.get("[data-cy=\"add_new_host-work_dir_label-text_field\"]").type(hostWorkDir);
  cy.get("[data-cy=\"add_new_host-private_key_path-text_field\"]").type(privateKyeFile);
  cy.get("[data-cy=\"add_new_host-job_schedulers-select\"]").type(jobSchedulers);
  cy.get("[data-cy=\"add_new_host-max_number_of_jobs-text_field\"]").type(maxNumber);
  cy.get("[data-cy=\"add_new_host-available_queues-text_field\"]").type(availableQueues);
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
  cy.get("[data-cy=\"add_new_host-shared_path_on_shared_host-text_field\"]").type(sharedHost);
});

//enter advanced settings for the remote host screen
Cypress.Commands.add("enterAdvancedRemoteHost", (intervalMin, statusCheckSec, hostMaxNumber, executionInterval, timeoutDuring)=>{
  cy.get("[data-cy=\"add_new_host-advanced_settings-title\"]").click();
  cy.get("[data-cy=\"add_new_host-connection_renewal-text_field\"]").type(intervalMin);
  cy.get("[data-cy=\"add_new_host-status_check-text_field\"]").type(statusCheckSec);
  cy.get("[data-cy=\"add_new_host-max_number-text_field\"]").type(hostMaxNumber);
  cy.get("[data-cy=\"add_new_host-execution_interval-text_field\"]").type(executionInterval);
  cy.get("[data-cy=\"add_new_host-timeout_during-text_field\"]").type(timeoutDuring);
});
