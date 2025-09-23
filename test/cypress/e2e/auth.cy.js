describe.skip("wheel authorization test", ()=>{
  const password = Cypress.env("WHEEL_TEST_LOGIN_PASSWORD");
  const user = "anonymous";
  before(()=>{
    cy.visit("/");
  });

  beforeEach(()=>{
    cy.viewport("macbook-16");
  });

  it("can access to login page (auth test 1)", ()=>{
    cy.visit("/");
    cy.loginPageDisplayed();
  });
  it("should be redirected to login page after attempting login with illegal user (auth test2)", ()=>{
    cy.visit("/");
    cy.loginPageDisplayed();
    cy.get("[data-cy=\"username\"]").type("hoge");
    cy.get("[data-cy=\"password\"]").type("huga");
    cy.get("[data-cy=\"submit\"]").click();
    cy.loginPageDisplayed();
  });
  it("should be redirected to login page after attempting login with illegal password (auth test3)", ()=>{
    cy.visit("/");
    cy.loginPageDisplayed();
    cy.get("[data-cy=\"username\"]").type(user);
    cy.get("[data-cy=\"password\"]").type("huga");
    cy.get("[data-cy=\"submit\"]").click();
    cy.loginPageDisplayed();
  });
  it("should be redirected to home page after successful login (auth test4)", ()=>{
    cy.visit("/");
    cy.loginPageDisplayed();
    cy.get("[data-cy=\"username\"]").type(user);
    cy.get("[data-cy=\"password\"]").type(password);
    cy.get("[data-cy=\"submit\"]").click();
    cy.homePageDisplayed();
  });
  it("should be redirected to home page after successful login (auth test5)", ()=>{
    cy.visit("/login");
    cy.loginPageDisplayed();
    cy.get("[data-cy=\"username\"]").type(user);
    cy.get("[data-cy=\"password\"]").type(password);
    cy.get("[data-cy=\"submit\"]").click();
    cy.homePageDisplayed();
  });
  it("should be redirected to home page after successful login (auth test6)", ()=>{
    cy.visit("/home");
    cy.loginPageDisplayed();
    cy.get("[data-cy=\"username\"]").type(user);
    cy.get("[data-cy=\"password\"]").type(password);
    cy.get("[data-cy=\"submit\"]").click();
    cy.homePageDisplayed();
  });
  it("should be redirected to remotehost page after successful login (auth test7)", ()=>{
    cy.visit("/remotehost");
    cy.loginPageDisplayed();
    cy.get("[data-cy=\"username\"]").type(user);
    cy.get("[data-cy=\"password\"]").type(password);
    cy.get("[data-cy=\"submit\"]").click();
    cy.remotehostPageDisplayed();
  });
  describe("create new project and access to workflow page", ()=>{
    const projectName = "WHEEL_TEST_PROJECT_FOR_AUTH_E2E";
    beforeEach(()=>{
      //create new project
      cy.visit("/home");
      cy.loginPageDisplayed();
      cy.get("[data-cy=\"username\"]").type(user);
      cy.get("[data-cy=\"password\"]").type(password);
      cy.get("[data-cy=\"submit\"]").click();
      cy.homePageDisplayed();
      cy.contains("button", "NEW").click({ force: true });
      cy.contains("label", "project name").siblings()
        .children("input")
        .type(projectName, { force: true });
      cy.contains("button", "create").click({ force: true });
    });
    after(()=>{
      //remove project
      cy.visit("/home");
      cy.homePageDisplayed();
      cy.contains("tr", projectName).find("[type=\"checkbox\"]")
        .check();
      cy.contains("button", /REMOVE$/).click({ force: true });
      cy.contains("button", "remove").click({ force: true });
    });
    it("should be redirected to workflow page after successful login (auth test8)", ()=>{
      cy.contains("tr", projectName)
        .find("[type=\"checkbox\"]")
        .click({ force: true });
      cy.contains("button", "OPEN").click({ force: true });
      cy.workflowPageDisplayed();
    });
  });
});
