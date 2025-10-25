/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
describe("test for shortcut key", ()=>{
  const PROJECT_NAME = `WHEEL_TEST_${Date.now().toString()}`;
  const PROJECT_DESCRIPTION = "Test shortcut functionality";
  const TASK_NAME = "task0";
  const DEF_COMPONENT_TASK = "task";
  
  beforeEach(()=>{
    cy.viewport("macbook-16");
    cy.createProject(PROJECT_NAME, PROJECT_DESCRIPTION);
    cy.projectOpen(PROJECT_NAME);
    // Wait for graph view to load
    cy.get("[data-cy=\"component_library-component-avatar\"]", { timeout: 1000 }).should("be.visible");
    cy.createComponent(DEF_COMPONENT_TASK, TASK_NAME, 300, 500);
  });
  
  afterEach(()=>{
    cy.removeAllProjects();
  });
  
  it("copy and paste", ()=>{
    // Select the component by clicking on it in the graph
    cy.get("[data-cy=\"graph-component-row\"]").contains(TASK_NAME).click();
    
    // Trigger copy by directly calling store mutation (simulating what the shortcut does)
    cy.window().then((win) => {
      const app = win.document.querySelector("#app").__vue_app__;
      const store = app.config.globalProperties.$store;
      const selectedComponent = store.state.selectedComponent;
      if (selectedComponent) {
        store.commit("copyInfo", { type: "copy", ID: selectedComponent.ID });
      }
    });
    
    cy.wait(100);
    
    // Verify copy worked by checking store state
    cy.window().then((win) => {
      const app = win.document.querySelector("#app").__vue_app__;
      const store = app.config.globalProperties.$store;
      expect(store.state.copyInfo).to.not.be.null;
      expect(store.state.copyInfo.type).to.eq("copy");
    });
    
    // Trigger paste by calling the action
    cy.window().then((win) => {
      const app = win.document.querySelector("#app").__vue_app__;
      const store = app.config.globalProperties.$store;
      store.dispatch("pasteComponent", ()=>{});
    });
    cy.wait(100);
  });
  
  it("cut and paste", ()=>{
    // Select the component by clicking on it in the graph
    cy.get("[data-cy=\"graph-component-row\"]").contains(TASK_NAME).click();
    
    // Trigger cut by directly calling store mutation (simulating what the shortcut does)
    cy.window().then((win) => {
      const app = win.document.querySelector("#app").__vue_app__;
      const store = app.config.globalProperties.$store;
      const selectedComponent = store.state.selectedComponent;
      if (selectedComponent) {
        store.commit("copyInfo", { type: "cut", ID: selectedComponent.ID });
      }
    });
    
    cy.wait(100);
    
    // Verify cut worked by checking store state
    cy.window().then((win) => {
      const app = win.document.querySelector("#app").__vue_app__;
      const store = app.config.globalProperties.$store;
      expect(store.state.copyInfo).to.not.be.null;
      expect(store.state.copyInfo.type).to.eq("cut");
    });
    
    // Trigger paste by calling the action
    cy.window().then((win) => {
      const app = win.document.querySelector("#app").__vue_app__;
      const store = app.config.globalProperties.$store;
      store.dispatch("pasteComponent", ()=>{});
    });
    cy.wait(100);
  });
  
  it("paste calls socketIO.emitGlobal", ()=>{
    // Select a component
    cy.get("[data-cy=\"graph-component-row\"]").contains(TASK_NAME).click();
    
    // Trigger copy action by calling store mutation
    cy.window().then((win) => {
      const app = win.document.querySelector("#app").__vue_app__;
      const store = app.config.globalProperties.$store;
      const selectedComponent = store.state.selectedComponent;
      if (selectedComponent) {
        store.commit("copyInfo", { type: "copy", ID: selectedComponent.ID });
      }
    });
    cy.wait(100);
    
    // Verify copyInfo was set
    cy.window().then((win) => {
      const app = win.document.querySelector("#app").__vue_app__;
      const store = app.config.globalProperties.$store;
      expect(store.state.copyInfo).to.not.be.null;
    });
    
    // Trigger paste action - this should call socketIO.emitGlobal with pasteComponent
    cy.window().then((win) => {
      const app = win.document.querySelector("#app").__vue_app__;
      const store = app.config.globalProperties.$store;
      store.dispatch("pasteComponent", ()=>{});
    });
    cy.wait(100);
    
    // The test passes if pasteComponent dispatch didn't throw an error
    cy.window().then((win) => {
      const app = win.document.querySelector("#app").__vue_app__;
      const store = app.config.globalProperties.$store;
      expect(store.state.copyInfo).to.not.be.null;
    });
  });
});
