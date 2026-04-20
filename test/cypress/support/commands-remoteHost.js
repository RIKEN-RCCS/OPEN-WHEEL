const ANIMATION_WAIT_TIME = 500;
//open remote host setting menu
Cypress.Commands.add("openRemoteHostMenu", ()=>{
  //Only reload the home page if we are not already there.
  //Skipping cy.visit() when already on home avoids a socket reconnect that can
  //cause the remote host dialog to close before the next test starts.
  cy.url().then((url)=>{
    if (!url.match(/^http:\/\/localhost:8089\/?$/)) {
      cy.visit("/");
      cy.wait(ANIMATION_WAIT_TIME);
    }
  });
  //If the remote host dialog is already fully open (button visible = data loaded + animation done),
  //skip navigation entirely to avoid the nav icon click race condition.
  //We check the NEW button visibility rather than the data table because:
  //- data table can briefly remain in DOM while the dialog is CLOSING (lazy unmount),
  //and Vuetify removes v-overlay--active immediately when modelValue becomes false.
  //- the NEW button being visible confirms the dialog is truly open AND data has loaded.
  cy.get("body").then(($body)=>{
    if ($body.find("[data-cy=\"remotehost-new_remote_host_setting-btn\"]").is(":visible")) {
      return;
    }
    //Wait for any in-progress nav drawer animation to settle before checking state.
    //A body snapshot taken during animation may show the button as invisible even
    //though the drawer is open, causing a spurious nav icon click that toggles it closed.
    cy.wait(ANIMATION_WAIT_TIME);
    //Check nav drawer state AFTER animation settled via cy.get().then() (live DOM, not snapshot).
    //Only click nav icon when the button is confirmed not visible post-animation.
    cy.get("[data-cy=\"navigation-manage_remote_host-btn\"]").then(($btn)=>{
      if (!$btn.is(":visible")) {
        cy.get("[data-cy=\"tool_bar-navi-icon\"]").click();
        cy.get("[data-cy=\"navigation-manage_remote_host-btn\"]").should("be.visible");
      }
      cy.get("[data-cy=\"navigation-manage_remote_host-btn\"]").click();
    });
  });
  //Wait for both socket responses (getHostList + getJobSchedulerLabelList) to complete.
  //When both are done, isLoaded becomes true and Vuetify removes the v-data-table--loading class.
  cy.get("[data-cy=\"remotehost-items-data_table\"]").should("not.have.class", "v-data-table--loading");
  //Wait for the NEW button to be visible (confirms dialog animation complete and data loaded).
  //The .v-overlay--active .v-overlay__content pointer-events check was removed because:
  //- test 3 uses native DOM click ($btn.get(0).click()), which bypasses pointer-events checks.
  //- checking v-overlay--active fails when the command runs during a dialog close animation
  //(Vuetify removes v-overlay--active immediately on modelValue=false, before lazy-unmount).
  cy.get("[data-cy=\"remotehost-new_remote_host_setting-btn\"]").should("be.visible");
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
