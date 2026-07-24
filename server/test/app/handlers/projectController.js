/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import path from "path";
import fs from "fs-extra";
import sinon from "sinon";

//setup test framework
import * as chai from "chai";
const expect = chai.expect;
import sinonChai from "sinon-chai";
chai.use(sinonChai);
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);

//testee
import { _internal } from "../../../app/handlers/projectController.js";

//helper functions
import { _internal as coreProjectControllerInternal } from "../../../app/core/projectController.js";
import { getProjectState, getProjectJson } from "../../../app/core/projectJsonFileOperator.js";
import { createNewProject } from "../../../app/core/projectOperations.js";
import { createNewComponent } from "../../../app/core/componentOperations.js";
import { addLink } from "../../../app/core/componentLinks.js";
import { updateComponentPos } from "../../../app/core/updateComponent.js";
import { getComponentDir, readComponentJson } from "../../../app/core/componentJsonIO.js";
import { updateComponentProperty } from "../../testUtil.js";
import { eventEmitters } from "../../../app/core/global.js";
import { scriptName, scriptHeader, pwdCmd, exit } from "../../testScript.js";
import { onUpdateComponent } from "../../../app/handlers/workflowEditor.js";

const scriptPwd = `${scriptHeader}\n${pwdCmd}`;

//test data
const testDirRoot = "WHEEL_TEST_TMP";
const projectRootDir = path.resolve(testDirRoot, "testProject.wheel");

describe("project Controller handler UT", function () {
  this.timeout(60000);

  beforeEach(async ()=>{
    await fs.remove(testDirRoot);
    await createNewProject(projectRootDir, "test project", null, "test", "test@example.com");
    coreProjectControllerInternal.rootDispatchers.clear();
    eventEmitters.delete(projectRootDir);
  });

  afterEach(()=>{
    sinon.restore();
    coreProjectControllerInternal.rootDispatchers.clear();
    eventEmitters.delete(projectRootDir);
  });

  after(async ()=>{
    if (!process.env.WHEEL_KEEP_FILES_AFTER_LAST_TEST) {
      await fs.remove(testDirRoot);
    }
  });

  describe("[reproduction] a task fails and the project stops as a result", ()=>{
    let task0;
    beforeEach(async ()=>{
      task0 = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 10, y: 10 });
      await updateComponentProperty(projectRootDir, task0.ID, "script", scriptName);
      await fs.outputFile(path.join(projectRootDir, task0.name, scriptName), `${scriptPwd}\n${exit(1)}`);
    });

    it("should conclude the project as 'failed' and must not have prj.wheel.json's staged state clobbered back to 'stopped' by the redundant taskStateChanged listener", async ()=>{
      const ack = sinon.stub();

      //this exercises the real production code path: handlers/projectController.js#onRunProject
      //registers a "taskStateChanged" listener which forcibly stops the whole project as soon as
      //any task fails. that listener races against the dispatcher's own natural completion, which
      //already concludes the project as "failed" and stages prj.wheel.json accordingly. the
      //listener used to unconditionally overwrite that already-concluded state with "stopped" and
      //re-stage prj.wheel.json a second, redundant time.
      await _internal.onRunProject("test-client-id", projectRootDir, ack);

      const state = await getProjectState(projectRootDir);
      expect(state).to.equal("failed");
    });
  });

  describe("[reproduction] issue #979 - a component disabled after run finished can not be cleaned up", ()=>{
    let task0, task1;
    beforeEach(async ()=>{
      task0 = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 10, y: 10 });
      await updateComponentProperty(projectRootDir, task0.ID, "script", scriptName);
      await fs.outputFile(path.join(projectRootDir, task0.name, scriptName), `${scriptPwd}\n${exit(0)}`);

      task1 = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 10, y: 100 });
      await updateComponentProperty(projectRootDir, task1.ID, "script", scriptName);
      await fs.outputFile(path.join(projectRootDir, task1.name, scriptName), `${scriptPwd}\n${exit(0)}`);

      await addLink(projectRootDir, task0.ID, task1.ID);
    });

    it("should discard the post-run 'disable' flag and return the component to an editable not-started state after cleanProject", async ()=>{
      const runAck = sinon.stub();

      //1. run the project to completion (this is what commits the pre-run state to HEAD)
      await _internal.onRunProject("test-client-id", projectRootDir, runAck);
      const stateAfterRun = await getProjectState(projectRootDir);
      expect(stateAfterRun).to.equal("finished");

      //2. after the run finished, disable one of the two components
      //(this mirrors what the client does through the "updateComponent" handler:
      //it writes cmp.wheel.json and stages it with git add, without committing)
      await updateComponentProperty(projectRootDir, task1.ID, "disable", true);

      const task1DirBeforeCleanup = await getComponentDir(projectRootDir, task1.ID, true);
      const task1JsonBeforeCleanup = await readComponentJson(task1DirBeforeCleanup);
      expect(task1JsonBeforeCleanup.disable).to.equal(true);

      //3. clean-up the project - this must discard everything that happened since the
      //last commit (the whole run AND the post-run "disable" edit), bringing the
      //project back to the pre-run, not-started, editable state.
      const cleanAck = sinon.stub();
      await _internal.onCleanProject("test-client-id", projectRootDir, cleanAck);

      const projectJson = await getProjectJson(projectRootDir);
      expect(projectJson.state).to.equal("not-started");

      const task1Dir = await getComponentDir(projectRootDir, task1.ID, true);
      const task1Json = await readComponentJson(task1Dir);
      expect(task1Json.disable, "'disable' flag set after the run must be discarded by cleanProject").to.not.equal(true);
      expect(task1Json.state).to.equal("not-started");

      const task0Dir = await getComponentDir(projectRootDir, task0.ID, true);
      const task0Json = await readComponentJson(task0Dir);
      expect(task0Json.state).to.equal("not-started");

      //4. the project must be editable again after cleanup (e.g. re-running must be possible)
      expect(await getProjectState(projectRootDir)).to.equal("not-started");
      expect(projectJson.readOnly).to.not.equal(true);

      //5. and it must actually be possible to edit the component again (this is the other
      //half of the reported symptom: "clean-up後に変更ができない状態になる" - after
      //clean-up, further changes can not be made)
      const rootWFJson = await readComponentJson(projectRootDir);
      const updated = { ...task1Json, description: "edited after cleanup" };
      const updateResult = await new Promise((resolve, reject)=>{
        onUpdateComponent(projectRootDir, task1.ID, updated, rootWFJson.ID, (rt)=>{
          if (rt instanceof Error) {
            reject(rt);
          } else {
            resolve(rt);
          }
        });
      });
      expect(updateResult).to.not.be.an.instanceof(Error);
      const task1JsonAfterEdit = await readComponentJson(task1Dir);
      expect(task1JsonAfterEdit.description).to.equal("edited after cleanup");
    });
  });

  describe("[reproduction] issue #978 - project can not be reverted after moving a component post-run and clean", ()=>{
    let task0;
    let originalPos;
    beforeEach(async ()=>{
      task0 = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 10, y: 10 });
      originalPos = { ...task0.pos };
      await updateComponentProperty(projectRootDir, task0.ID, "script", scriptName);
      await fs.outputFile(path.join(projectRootDir, task0.name, scriptName), `${scriptPwd}\n${exit(0)}`);
    });

    it("should end up 'not-started' and NOT readOnly after cleanProject, even though a component was moved after the run finished, and saveProject must succeed afterwards", async ()=>{
      const clientID = "test-client-id";
      const runAck = sinon.stub();

      //1. run the project to completion ("finished")
      await _internal.onRunProject(clientID, projectRootDir, runAck);
      let projectJson = await getProjectJson(projectRootDir);
      expect(projectJson.state).to.equal("finished");
      expect(projectJson.readOnly).to.equal(false);

      //2. move the task component (position change only) after the run has finished
      await updateComponentPos(projectRootDir, task0.ID, { x: 999, y: 999 });
      const componentDir = await getComponentDir(projectRootDir, task0.ID, true);
      const movedComponent = await readComponentJson(componentDir);
      expect(movedComponent.pos).to.deep.equal({ x: 999, y: 999 });

      //3. click "cleanup project"
      await _internal.onCleanProject(clientID, projectRootDir);

      //4. project must be back to a fully editable "not-started" state, and the position
      //change from step 2 must have been discarded. NOTE: readOnly is checked for falsiness
      //(not strict `false`) because cleanProject reverts prj.wheel.json to the pre-run git
      //commit, which (on a project's first run) never had a "readOnly" key staged into it at
      //all - so the reverted file legitimately has readOnly === undefined rather than false.
      //Both are treated as "not read-only" by onSaveProject's `if (readOnly)` check and by the
      //client, so undefined is an acceptable - if slightly untidy - outcome here.
      projectJson = await getProjectJson(projectRootDir);
      expect(projectJson.state).to.equal("not-started");
      expect(projectJson.readOnly).to.not.equal(true);
      const revertedComponent = await readComponentJson(componentDir);
      expect(revertedComponent.pos).to.deep.equal(originalPos);

      //5. saving after clean must succeed - it must NOT be rejected as read-only
      const saveAck = sinon.stub();
      await _internal.onSaveProject(projectRootDir, saveAck);
      expect(saveAck).to.not.have.been.calledWith(sinon.match.instanceOf(Error));

      projectJson = await getProjectJson(projectRootDir);
      expect(projectJson.state).to.equal("not-started");
      expect(projectJson.readOnly).to.not.equal(true);
    });
  });
});
