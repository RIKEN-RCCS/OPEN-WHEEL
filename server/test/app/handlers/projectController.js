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
import allowedOperations from "../../../../common/allowedOperations.js";

//helper functions
import { _internal as coreProjectControllerInternal } from "../../../app/core/projectController.js";
import { createNewProject } from "../../../app/core/projectOperations.js";
import { createNewComponent } from "../../../app/core/componentOperations.js";
import { getProjectJson, getProjectState, setProjectState, updateProjectROStatus } from "../../../app/core/projectJsonFileOperator.js";
import { gitPromise } from "../../../app/core/gitOperator2.js";
import { updateComponentProperty } from "../../testUtil.js";
import { eventEmitters } from "../../../app/core/global.js";
import { scriptName, scriptHeader, pwdCmd, exit } from "../../testScript.js";

const scriptPwd = `${scriptHeader}\n${pwdCmd}`;

describe("UT for projectController handlers", function () {
  this.timeout(0);

  const testDirRoot = "WHEEL_TEST_TMP_PROJECTCONTROLLER";
  const projectRootDir = path.resolve(testDirRoot, "testProject.wheel");

  describe("common/allowedOperations.js", ()=>{
    it("allows runProject from stopped, failed, and unknown", ()=>{
      expect(allowedOperations.stopped).to.include("runProject");
      expect(allowedOperations.failed).to.include("runProject");
      expect(allowedOperations.unknown).to.include("runProject");
    });
    it("does not allow runProject from running", ()=>{
      expect(allowedOperations.running).to.not.include("runProject");
    });
  });

  describe("#selectRunHandler", ()=>{
    it("selects onRunProject for a fresh (not-started) project", ()=>{
      expect(_internal.selectRunHandler("not-started")).to.equal(_internal.onRunProject);
    });
    it("selects onContinueProject to resume a stopped project", ()=>{
      expect(_internal.selectRunHandler("stopped")).to.equal(_internal.onContinueProject);
    });
    it("selects onContinueProject to resume a failed project", ()=>{
      expect(_internal.selectRunHandler("failed")).to.equal(_internal.onContinueProject);
    });
    it("selects onContinueProject to resume an unknown-state project", ()=>{
      expect(_internal.selectRunHandler("unknown")).to.equal(_internal.onContinueProject);
    });
  });

  describe("#onContinueProject (real run on an empty workflow)", ()=>{
    beforeEach(async ()=>{
      await fs.remove(testDirRoot);
      await createNewProject(projectRootDir, "test project", null, "test", "test@example.com");
      await setProjectState(projectRootDir, "stopped");
    });
    after(async ()=>{
      await fs.remove(testDirRoot);
    });

    it("commits with 'project continuing' (not 'project starting') and finishes the (empty) run", async ()=>{
      await new Promise((resolve)=>{
        _internal.onContinueProject("client1", projectRootDir, resolve);
      });
      const output = await gitPromise(projectRootDir, ["log", "-1", "--pretty=%s"], projectRootDir);
      expect(output.trim()).to.equal("auto saved: project continuing");
      expect(await getProjectState(projectRootDir)).to.equal("finished");
    });

    it("unlocks the project for editing once the run finishes successfully", async ()=>{
      await new Promise((resolve)=>{
        _internal.onContinueProject("client1", projectRootDir, resolve);
      });
      const projectJson = await getProjectJson(projectRootDir);
      expect(projectJson.readOnly).to.be.false;
    });
  });

  describe("#unlockIfFinished", ()=>{
    beforeEach(async ()=>{
      await fs.remove(testDirRoot);
      await createNewProject(projectRootDir, "test project", null, "test", "test@example.com");
    });
    after(async ()=>{
      await fs.remove(testDirRoot);
    });

    it("unlocks readOnly when the project state is finished", async ()=>{
      await setProjectState(projectRootDir, "finished");
      await _internal.unlockIfFinished(projectRootDir);
      const projectJson = await getProjectJson(projectRootDir);
      expect(projectJson.readOnly).to.be.false;
    });

    it("keeps the project locked when the state is failed", async ()=>{
      await updateProjectROStatus(projectRootDir, true);
      await setProjectState(projectRootDir, "failed");
      await _internal.unlockIfFinished(projectRootDir);
      const projectJson = await getProjectJson(projectRootDir);
      expect(projectJson.readOnly).to.be.true;
    });

    it("keeps the project locked when the state is unknown (e.g. a stage-out that never completed)", async ()=>{
      await updateProjectROStatus(projectRootDir, true);
      await setProjectState(projectRootDir, "unknown");
      await _internal.unlockIfFinished(projectRootDir);
      const projectJson = await getProjectJson(projectRootDir);
      expect(projectJson.readOnly).to.be.true;
    });
  });

  describe("#onStopProject", ()=>{
    beforeEach(async ()=>{
      await fs.remove(testDirRoot);
      await createNewProject(projectRootDir, "test project", null, "test", "test@example.com");
    });
    after(async ()=>{
      await fs.remove(testDirRoot);
    });

    it("explicitly locks the project for editing", async ()=>{
      await _internal.onStopProject(projectRootDir);
      const projectJson = await getProjectJson(projectRootDir);
      expect(projectJson.readOnly).to.be.true;
      expect(projectJson.state).to.equal("stopped");
    });
  });
});

describe("project Controller handler UT", function () {
  this.timeout(60000);

  const testDirRoot = "WHEEL_TEST_TMP";
  const projectRootDir = path.resolve(testDirRoot, "testProject.wheel");

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
});
