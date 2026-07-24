/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
/**
 * issue #935 - reproduction test
 * 実行終了時(finishedになった時)にコンポーネントのステータスが正しく表示されない
 * (PS component shows "running" forever, nested task's icon never shows up)
 */
describe("issue935 - PS + task status icons after project finished", ()=>{
  const DEF_COMPONENT_PS = "parameterStudy";
  const DEF_COMPONENT_TASK = "task";
  const PS_NAME = "PS0";
  const TASK_NAME = "task0";
  const LOCAL_HOST = "localhost";
  const SCRIPT_NAME = "task0.sh";
  const SCRIPT_BODY = "echo \"hello\" > result.txt";
  const TARGET_FILE = "run.sh";

  before(()=>{
    return cy.removeAllProjects();
  });

  after(()=>{
    return cy.removeAllProjects();
  });

  beforeEach(()=>{
    cy.viewport("macbook-16");
    return cy.createAndOpenProject();
  });

  function getStoreState() {
    return cy.window().then((win)=>{
      const store = win.document.querySelector("#app").__vue_app__.config.globalProperties.$store;
      return store.state;
    });
  }

  //retries (like a normal cy .should()) until the named component reaches "finished",
  //or times out - so we are not racing our own read against the async socket.io update
  function waitForComponentState(name, expectedState, timeout = 20000) {
    return cy.window({ timeout }).should((win)=>{
      const store = win.document.querySelector("#app").__vue_app__.config.globalProperties.$store;
      const target = store.state.currentComponent && store.state.currentComponent.descendants
        ? store.state.currentComponent.descendants.find((c)=>{
          return c.name === name;
        })
        : null;
      expect(target, `${name} present in currentComponent.descendants`).to.exist;
      expect(target.state, `${name} component state`).to.equal(expectedState);
    }).then(()=>{
      return getStoreState().then((state)=>{
        return state.currentComponent.descendants.find((c)=>{
          return c.name === name;
        });
      });
    });
  }

  it("PS component and the task inside it both show \"finished\" status after the project reaches finished", ()=>{
    //create PS0 at root - property panel opens automatically
    cy.createComponent(DEF_COMPONENT_PS, PS_NAME, 501, 500);

    //create a real file "run.sh" inside PS0 so the PS-config target file substitution
    //has something to read from during real execution
    cy.createDirOrFile("file", TARGET_FILE, true);

    //configure a single-value parameter (min=max=step=1 => exactly one instance) so the
    //PS actually iterates once instead of finishing immediately with zero children
    cy.clickTreeviewItem("[data-cy=\"file_browser-treeview-treeview\"]", "parameterSetting.json");
    cy.get("[data-cy=\"file_browser-edit_files-btn\"]").click();
    cy.get("[data-cy=\"target_files-add_target_file-btn\"]").click();
    cy.get("[data-cy=\"target_files-target_file_name-text_field\"]").type(TARGET_FILE);
    cy.get("[data-cy=\"target_files-ok-btn\"]").click();
    cy.get("[data-cy=\"rapid-tab-tab_editor\"]").type("VALUE=value");
    cy.get("[data-cy=\"rapid-tab-tab_editor\"]").dblclick();
    cy.get("[data-cy=\"parameter-add_new_parameter_btn\"]").click();
    cy.get("[data-cy=\"parameter-min-text_field\"]").clear()
      .type(1);
    cy.get("[data-cy=\"parameter-max-text_field\"]").clear()
      .type(1);
    cy.get("[data-cy=\"parameter-step-text_field\"]").clear()
      .type(1);
    cy.get("[data-cy=\"parameter-ok-btn\"]").click();

    //save & close the PS-config editor
    cy.get("[data-cy=\"workflow-text_editor_close-btn\"]").click();
    cy.get("body").then(($body)=>{
      if ($body.find("button:contains(\"Keep changes\")").length) {
        cy.contains("button", /Keep changes/i).click();
      }
    });
    cy.get("[data-cy=\"workflow-text_editor_close-btn\"]").should("not.exist");
    cy.closeProperty();

    //enter PS0 and create a real task inside it (this is the "template" that gets copied
    //into a fresh instance directory for every parameter combination at run time)
    cy.doubleClickComponentName(PS_NAME);
    cy.createComponent(DEF_COMPONENT_TASK, TASK_NAME, 501, 500);
    cy.setupTaskWithScriptAndIO(SCRIPT_NAME, SCRIPT_BODY, "output", "result.txt", LOCAL_HOST);
    cy.closeProperty();

    //back to root
    cy.get(".v-breadcrumbs-item").eq(0)
      .find(".v-btn")
      .click();
    cy.get("[data-cy=\"graph-component-row\"]").contains(PS_NAME)
      .should("exist");

    //run the project to completion
    cy.get("[data-cy=\"workflow-play-btn\"]", { timeout: 10000 }).click();
    cy.checkProjectStatus("finished", 60000);

    //--- assertion 1: PS0's own status icon (visible at root, without navigating in) ---
    //statusIcon.vue only renders its <image> once state !== "not-started", so if the icon
    //never renders (or the state field is stuck on "running"), it means the client never
    //received/applied the PS's own final "finished" componentStateChanged update.
    waitForComponentState(PS_NAME, "finished").then((ps)=>{
      cy.log(`PS0 state on client = ${JSON.stringify({ state: ps.state, numTotal: ps.numTotal, numFinished: ps.numFinished, numFailed: ps.numFailed })}`);
      expect(ps.numFinished, "PS0 numFinished").to.equal(1);
      expect(ps.numFailed, "PS0 numFailed").to.equal(0);
    });

    cy.get("[data-cy=\"component-component_group-g\"]").contains(PS_NAME)
      .parents("[data-cy=\"component-component_group-g\"]")
      .first()
      .find("[data-cy=\"component_header-rect_rect\"]")
      .parent()
      .find("image")
      .should("have.length", 2); //type icon + status icon (status icon only renders once state !== "not-started")

    //--- assertion 2: the task visible after navigating into PS0 ---
    cy.doubleClickComponentName(PS_NAME);
    cy.get("[data-cy=\"graph-component-row\"]").contains(TASK_NAME)
      .should("exist");

    waitForComponentState(TASK_NAME, "finished").then((task)=>{
      cy.log(`task0 state as seen inside PS0 = ${task.state}`);
    });

    cy.get("[data-cy=\"component-component_group-g\"]").contains(TASK_NAME)
      .parents("[data-cy=\"component-component_group-g\"]")
      .first()
      .find("[data-cy=\"component_header-rect_rect\"]")
      .parent()
      .find("image")
      .should("have.length", 2); //type icon + status icon
  });
});
