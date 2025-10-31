Cypress.Commands.add("login", ()=>{
  cy.visit("/login");
  cy.get("[data-cy=username]").type("user");
  cy.get("[data-cy=password]").type("password");
  cy.get("[data-cy=submit]").click();
});

Cypress.Commands.add("logout", ()=>{
  cy.get("[data-cy=logout]").click();
});

Cypress.Commands.add("openProject", (projectName)=>{
  cy.contains("tr", projectName)
    .find("[type=\"checkbox\"]")
    .click({ force: true });
  return cy.contains("button", "OPEN")
    .click({ force: true });
});

//eslint-disable-next-line no-unused-vars
Cypress.Commands.add("removeProject", (projectName)=>{
  cy.visit("/");
  cy.waitProjectList();
  cy.get("[data-cy=\"home-batch_mode-btn\"]")
    .should("be.visible")
    .click();
  cy.get("[data-cy=\"home-project_list-data_table\"]")
    .contains("th", "Project Name")
    .parent() //select all project
    .find("input[type=\"checkbox\"]")
    .first()
    .check();
  cy.get("[data-cy=\"home-remove-btn\"]")
    .should("be.visible")
    .click();
  cy.get("[data-cy=\"buttons-remove-btn\"]")
    .should("be.visible")
    .click();
  return cy.get("[data-cy=\"home-project_list-data_table\"]")
    .should("contain.text", "No data available");
});

Cypress.Commands.add("selectComponent", (componentName)=>{
  cy.get("[data-cy=\"graph-component-row\"]").contains(componentName)
    .click();
});

// Get the Vue store directly from window
Cypress.Commands.add("getVueStore", ()=>{
  return cy.window().then((win)=>{
    const appElement = win.document.querySelector("#app");
    if (appElement && appElement.__vue_app__) {
      const app = appElement.__vue_app__;
      const store = app.config.globalProperties.$store;
      return store;
    }
    return null;
  });
});

// Setup Vue app alias for accessing store in e2e tests
Cypress.Commands.add("setupVueAlias", ()=>{
  cy.getVueStore().then((store)=>{
    if (store) {
      cy.wrap(store).as("vueStore");
    }
  });
});



