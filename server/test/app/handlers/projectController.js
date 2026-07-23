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
import { getProjectState } from "../../../app/core/projectJsonFileOperator.js";
import { createNewProject } from "../../../app/core/projectOperations.js";
import { createNewComponent } from "../../../app/core/componentOperations.js";
import { updateComponentProperty } from "../../testUtil.js";
import { eventEmitters } from "../../../app/core/global.js";
import { scriptName, scriptHeader, pwdCmd, exit } from "../../testScript.js";

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
});
