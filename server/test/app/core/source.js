/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import path from "path";
import fs from "fs-extra";

//setup test framework
import * as chai from "chai";
const expect = chai.expect;
import sinon from "sinon";
import sinonChai from "sinon-chai";
chai.use(sinonChai);
import Ajv from "ajv";
const ajv = new Ajv({ strict: false });

//testee
import { runProject, _internal } from "../../../app/core/projectController.js";

//test data
const testDirRoot = "WHEEL_TEST_TMP";
const projectRootDir = path.resolve(testDirRoot, "testProject.wheel");

//helper functions
import { projectJsonFilename, componentJsonFilename } from "../../../app/db/db.js";
import { createNewProject } from "../../../app/core/projectOperations.js";
import { updateComponentProperty } from "../../testUtil.js";
import { createNewComponent } from "../../../app/core/componentOperations.js";
import { addInputFile, renameOutputFile } from "../../../app/core/componentFiles.js";
import { addFileLink } from "../../../app/core/componentLinks.js";
import { eventEmitters } from "../../../app/core/global.js";

import { scriptName, pwdCmd, scriptHeader } from "../../testScript.js";
const scriptPwd = `${scriptHeader}\n${pwdCmd}`;

describe("UT for source component", function () {
  this.timeout(0);
  beforeEach(async ()=>{
    await fs.remove(testDirRoot);
    await createNewProject(projectRootDir, "test project", null, "test", "test@example.com");
    const source0 = await createNewComponent(projectRootDir, projectRootDir, "source", { x: 11, y: 11 });
    await fs.outputFile(path.join(projectRootDir, "source0", "foo"), "foo");
    await renameOutputFile(projectRootDir, source0.ID, 0, "foo");
    const task0 = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 10, y: 10 });
    await updateComponentProperty(projectRootDir, task0.ID, "script", scriptName);
    await addInputFile(projectRootDir, task0.ID, "bar");
    await fs.outputFile(path.join(projectRootDir, "task0", scriptName), scriptPwd);
    await addFileLink(projectRootDir, source0.ID, "foo", task0.ID, "bar");

    //Setup mock event emitter for the project
    eventEmitters.set(projectRootDir, { emit: sinon.stub() });

    //Clear any existing dispatchers
    _internal.rootDispatchers.clear();
  });
  afterEach(()=>{
    //Clean up event emitter
    eventEmitters.delete(projectRootDir);
    //Clear dispatchers
    _internal.rootDispatchers.clear();
  });
  after(async ()=>{
    //await fs.remove(testDirRoot);
  });
  describe("#runProject", ()=>{
    it("should copy foo to task0/bar", async ()=>{
      const state = await runProject(projectRootDir);
      expect(state).to.equal("finished");
      expect(fs.statSync(path.resolve(projectRootDir, "task0", "bar")).isFile()).to.be.true;
      expect(fs.readFileSync(path.resolve(projectRootDir, "task0", "bar"), "utf-8")).to.equal("foo");

      const projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
      const projectJsonSchema = {
        required: ["state"],
        properties: {
          state: { enum: ["finished"] }
        }
      };
      const validateProjectJson = ajv.compile(projectJsonSchema);
      expect(validateProjectJson(projectJson)).to.be.true;
      const rootWFJson = await fs.readJson(path.resolve(projectRootDir, componentJsonFilename));
      const rootWFJsonSchema = {
        required: ["state"],
        properties: {
          state: { enum: ["finished"] }
        }
      };
      const validateRootWFJson = ajv.compile(rootWFJsonSchema);
      expect(validateRootWFJson(rootWFJson)).to.be.true;
      const task0Json = await fs.readJson(path.resolve(projectRootDir, "task0", componentJsonFilename));
      const task0JsonSchema = {
        required: ["state", "ancestorsName"],
        properties: {
          state: { enum: ["finished"] },
          ancestorsName: { enum: [""] }
        }
      };
      const validateTask0Json = ajv.compile(task0JsonSchema);
      expect(validateTask0Json(task0Json)).to.be.true;
    });
  });
});
