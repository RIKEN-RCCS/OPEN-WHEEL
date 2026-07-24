/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
/**
 * パン屑リストテスト
 */
describe("breadcrumb", ()=>{
  const DEF_COMPONENT_FOR = "for";
  const DEF_COMPONENT_TASK = "task";
  const FOR_NAME_0 = "for0";
  const TASK_NAME_0 = "task0";

  before(()=>{
    return cy.removeAllProjects();
  });

  beforeEach(()=>{
    cy.viewport("macbook-16");
    return cy.createAndOpenProject();
  });

  after(()=>{
    return cy.removeAllProjects();
  });

  /**
   * パン屑リストをクリックすると階層が移動できることを確認
   * issue#1001
   */
  it("パン屑リストの上位階層をクリックすると上位階層に移動できることを確認", ()=>{
    //ルート階層にforコンポーネントを作成
    cy.createComponent(DEF_COMPONENT_FOR, FOR_NAME_0, 501, 500);
    cy.closeProperty();
    //forコンポーネント内に移動
    cy.doubleClickComponentName(FOR_NAME_0);
    //forコンポーネント内にtaskコンポーネントを作成
    cy.createComponent(DEF_COMPONENT_TASK, TASK_NAME_0, 501, 500);
    cy.closeProperty();
    //taskコンポーネントが表示され、パン屑リストが2階層になっていることを確認
    cy.get("[data-cy=\"graph-component-row\"]").contains(TASK_NAME_0)
      .should("exist");
    cy.get(".v-breadcrumbs-item").should("have.length", 2);
    //パン屑リストの上位階層(ルート)をクリック
    cy.get(".v-breadcrumbs-item").eq(0)
      .find(".v-btn")
      .click();
    //ルート階層に戻り、forコンポーネントが表示され、taskコンポーネントは表示されないことを確認
    cy.get("[data-cy=\"graph-component-row\"]").contains(FOR_NAME_0)
      .should("exist");
    cy.get("[data-cy=\"graph-component-row\"]").contains(TASK_NAME_0)
      .should("not.exist");
    cy.get(".v-breadcrumbs-item").should("have.length", 1);
  });
});
