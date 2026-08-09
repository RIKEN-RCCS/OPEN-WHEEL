/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
/**
 * cleanup project ボタン操作テスト
 */
describe("cleanProject", ()=>{
  before(()=>{
    return cy.removeAllProjects();
  });

  beforeEach(()=>{
    cy.viewport("macbook-16");
    return cy.createAndOpenProject();
  });

  afterEach(()=>{
    return cy.goHome();
  });

  after(()=>{
    return cy.removeAllProjects();
  });

  /**
   * cleanup project 実行時にトーストメッセージがクリアされることを確認
   * 試験手順：
   *   1. プロジェクト状態を finished に設定してcleanupボタンを有効化
   *   2. スナックバーにテストメッセージを表示
   *   3. cleanup project ボタンをクリックして確認ダイアログを承認
   * 試験確認内容：スナックバーが非表示になること
   */
  it("cleanup project実行時-トーストメッセージがクリアされることを確認", ()=>{
    //wait for workflow initialization: SIO sends projectState "not-started" after getProjectJson
    cy.get("[data-cy=\"workflow-project_state-btn\"]").should("contain", "not-started");

    //enable the cleanup button by setting project state to finished
    cy.window().then((win)=>{
      const store = win.document.querySelector("#app").__vue_app__.config.globalProperties.$store;
      store.commit("projectState", "finished");
    });

    //show a snackbar toast message
    cy.window().then((win)=>{
      const store = win.document.querySelector("#app").__vue_app__.config.globalProperties.$store;
      store.dispatch("showSnackbar", { message: "test toast message for clean", timeout: -1 });
    });

    //verify snackbar is visible before clicking clean
    cy.contains("div.v-snackbar__content", "test toast message for clean")
      .should("be.visible");

    //wait for the button to be enabled (Vue re-render after state commit) then click
    cy.get("[data-cy=\"workflow-cleanup_project-btn\"]")
      .should("not.be.disabled")
      .click();
    cy.get("[data-cy=\"versatile_dialog_cleanProject-ok-btn\"]").click();

    //verify snackbar is dismissed via store state (Vuetify removes the DOM element when closed)
    cy.window().then((win)=>{
      const store = win.document.querySelector("#app").__vue_app__.config.globalProperties.$store;
      expect(store.state.openSnackbar).to.be.false;
      expect(store.state.snackbarMessage).to.equal("");
    });
  });

  /**
   * cleanup project 実行時にトーストキューがクリアされることを確認
   * 試験手順：
   *   1. プロジェクト状態を finished に設定してcleanupボタンを有効化
   *   2. 複数のトーストメッセージをキューに追加
   *   3. cleanup project ボタンをクリックして確認ダイアログを承認
   * 試験確認内容：クリーン後に次のトーストが表示されないこと
   */
  it("cleanup project実行時-キュー内のトーストメッセージがクリアされることを確認", ()=>{
    //wait for workflow initialization: SIO sends projectState "not-started" after getProjectJson
    cy.get("[data-cy=\"workflow-project_state-btn\"]").should("contain", "not-started");

    //enable the cleanup button
    cy.window().then((win)=>{
      const store = win.document.querySelector("#app").__vue_app__.config.globalProperties.$store;
      store.commit("projectState", "finished");
    });

    //show a first snackbar and enqueue a second one directly into the queue
    cy.window().then((win)=>{
      const store = win.document.querySelector("#app").__vue_app__.config.globalProperties.$store;
      store.dispatch("showSnackbar", { message: "first toast message", timeout: -1 });
      //push additional messages directly into the queue to simulate a backlog
      store.state.snackbarQueue.push({ message: "queued toast message 1", timeout: -1 });
      store.state.snackbarQueue.push({ message: "queued toast message 2", timeout: -1 });
    });

    //verify first snackbar is visible
    cy.contains("div.v-snackbar__content", "first toast message")
      .should("be.visible");

    //click cleanup project button and confirm
    cy.get("[data-cy=\"workflow-cleanup_project-btn\"]")
      .should("not.be.disabled")
      .click();
    cy.get("[data-cy=\"versatile_dialog_cleanProject-ok-btn\"]").click();

    //verify snackbar and queue are cleared via store state
    cy.window().then((win)=>{
      const store = win.document.querySelector("#app").__vue_app__.config.globalProperties.$store;
      expect(store.state.snackbarQueue).to.have.length(0);
      expect(store.state.openSnackbar).to.be.false;
    });
  });
});
