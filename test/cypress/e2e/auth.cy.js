describe("wheel authorization test", ()=>{
  const authUrl = Cypress.env("WHEEL_TEST_AUTH_URL");
  const password = Cypress.env("WHEEL_TEST_LOGIN_PASSWORD");
  const user = "anonymous";
  before(()=>{
    cy.visit(authUrl + "/");
  });

  beforeEach(()=>{
    cy.viewport("macbook-16");
  });

  it("can access to login page (auth test 1)", ()=>{
    cy.visit(authUrl + "/");
    cy.loginPageDisplayed();
  });
  it("should be redirected to login page after attempting login with illegal user (auth test2)", ()=>{
    cy.visit(authUrl + "/");
    cy.loginPageDisplayed();
    cy.get("[data-cy=\"username\"]").type("hoge");
    cy.get("[data-cy=\"password\"]").type("huga");
    cy.get("[data-cy=\"submit\"]").click();
    cy.loginPageDisplayed();
  });
  it("should be redirected to login page after attempting login with illegal password (auth test3)", ()=>{
    cy.visit(authUrl + "/");
    cy.loginPageDisplayed();
    cy.get("[data-cy=\"username\"]").type(user);
    cy.get("[data-cy=\"password\"]").type("huga");
    cy.get("[data-cy=\"submit\"]").click();
    cy.loginPageDisplayed();
  });
  it("should be redirected to home page after successful login (auth test4)", ()=>{
    cy.visit(authUrl + "/");
    cy.loginPageDisplayed();
    cy.get("[data-cy=\"username\"]").type(user);
    cy.get("[data-cy=\"password\"]").type(password);
    cy.get("[data-cy=\"submit\"]").click();
    cy.homePageDisplayed();
  });
  it("should be redirected to home page after successful login (auth test5)", ()=>{
    cy.visit(authUrl + "/login");
    cy.loginPageDisplayed();
    cy.get("[data-cy=\"username\"]").type(user);
    cy.get("[data-cy=\"password\"]").type(password);
    cy.get("[data-cy=\"submit\"]").click();
    cy.homePageDisplayed();
  });
  it("should be redirected to home page after successful login (auth test6)", ()=>{
    cy.visit(authUrl + "/home");
    cy.loginPageDisplayed();
    cy.get("[data-cy=\"username\"]").type(user);
    cy.get("[data-cy=\"password\"]").type(password);
    cy.get("[data-cy=\"submit\"]").click();
    cy.homePageDisplayed();
  });
  describe("create new project and access to workflow page", ()=>{
    const projectName = "WHEEL_TEST_PROJECT_FOR_AUTH_E2E";
    beforeEach(()=>{
      //create new project
      cy.visit(authUrl + "/home");
      cy.loginPageDisplayed();
      cy.get("[data-cy=\"username\"]").type(user);
      cy.get("[data-cy=\"password\"]").type(password);
      cy.get("[data-cy=\"submit\"]").click();
      cy.homePageDisplayed();
      cy.get("[data-cy=\"home-new-btn\"]").click({ force: true });
      cy.get("[data-cy=\"home-project_name-text_field\"]").find("input")
        .type(projectName, { force: true });
      cy.get("[data-cy=\"buttons-create-btn\"]").click({ force: true });
    });
    after(()=>{
      //remove project
      cy.visit(authUrl + "/home");
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
