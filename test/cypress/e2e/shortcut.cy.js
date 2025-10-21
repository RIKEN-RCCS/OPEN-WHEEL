/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
describe("test for shortcut key", ()=>{
  const PROJECT_NAME = `WHEEL_TEST_${Date.now().toString()}`;
  const TASK_NAME = "task";
  beforeEach(()=>{
    cy.viewport("macbook-16");
    cy.login();
    cy.createProject(PROJECT_NAME);
    cy.wait(5000);
    cy.openProject(PROJECT_NAME);
    cy.createComponent(TASK_NAME, 300, 500);
  });
  afterEach(()=>{
    cy.removeProject(PROJECT_NAME);
    cy.logout();
  });
  it("copy and paste", ()=>{
    cy.selectComponent(TASK_NAME);
    cy.get("body").type("{ctrl}c");
    cy.get("body").type("{ctrl}v");
    cy.get("@vue").its("store.state.copyInfo.type")
      .should("eq", "copy");
  });
  it("cut and paste", ()=>{
    cy.selectComponent(TASK_NAME);
    cy.get("body").type("{ctrl}x");
    cy.get("body").type("{ctrl}v");
    cy.get("@vue").its("store.state.copyInfo.type")
      .should("eq", "cut");
  });
});
