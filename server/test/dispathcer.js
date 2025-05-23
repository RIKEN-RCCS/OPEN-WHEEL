/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path = require("path");
const fs = require("fs-extra");
const SshClientWrapper = require("ssh-client-wrapper");

//setup test framework
const chai = require("chai");
const expect = chai.expect;
const sinon = require("sinon");
chai.use(require("sinon-chai"));
chai.use(require("chai-fs"));
chai.use(require("chai-json-schema"));

//test data
const testDirRoot = "WHEEL_TEST_TMP";
const projectRootDir = path.resolve(testDirRoot, "testProject.wheel");
//testee
const Dispatcher = require("../app/core/dispatcher");
const { eventEmitters } = require("../app/core/global.js");
eventEmitters.set(projectRootDir, { emit: sinon.stub() });

//helper functions
const { projectJsonFilename, componentJsonFilename } = require("../app/db/db");
const { createNewProject, updateComponent, createNewComponent, addInputFile, addOutputFile, addLink, addFileLink, renameOutputFile } = require("../app/core/projectFilesOperator");
const { scriptName, pwdCmd, scriptHeader } = require("./testScript");
const scriptPwd = `${scriptHeader}\n${pwdCmd}`;
const wait = ()=>{
  return new Promise((resolve)=>{
    setTimeout(resolve, 10);
  });
};

const { remoteHost } = require("../app/db/db");
const { addSsh } = require("../app/core/sshManager");

describe("UT for Dispatcher class", function () {
  this.timeout(0);
  let rootWF;
  let projectJson;
  beforeEach(async ()=>{
    await fs.remove(testDirRoot);
    await createNewProject(projectRootDir, "test project", null, "test", "test@example.com");
    rootWF = await fs.readJson(path.resolve(projectRootDir, componentJsonFilename));
  });
  after(async ()=>{
    if (!process.env.WHEEL_KEEP_FILES_AFTER_LAST_TEST) {
      await fs.remove(testDirRoot);
    }
  });

  describe("#outputFile delivery functionality", async ()=>{
    let previous;
    let next;
    let storage;
    const storageArea = path.resolve(testDirRoot, "storageArea");
    beforeEach(async ()=>{
      previous = await createNewComponent(projectRootDir, projectRootDir, "workflow", { x: 10, y: 10 });
      next = await createNewComponent(projectRootDir, projectRootDir, "workflow", { x: 10, y: 10 });
      storage = await createNewComponent(projectRootDir, projectRootDir, "storage", { x: 10, y: 10 });
      await updateComponent(projectRootDir, storage.ID, "storagePath", storageArea);
      projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
    });
    it("should make link from outputFile to inputFile", async ()=>{
      await addOutputFile(projectRootDir, previous.ID, "a");
      await addInputFile(projectRootDir, next.ID, "b");
      await addFileLink(projectRootDir, previous.ID, "a", next.ID, "b");
      await fs.outputFile(path.resolve(projectRootDir, previous.name, "a"), "hoge");
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      expect(path.resolve(projectRootDir, next.name, "a")).not.to.be.a.path();
      expect(path.resolve(projectRootDir, next.name, "b")).to.be.a.file().and.equal(path.resolve(projectRootDir, previous.name, "a"));
    });
    it("should do nothing if outputFile has glob which match nothing", async ()=>{
      await addOutputFile(projectRootDir, previous.ID, "a*");
      await addInputFile(projectRootDir, next.ID, "b");
      await addFileLink(projectRootDir, previous.ID, "a*", next.ID, "b");
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      expect(path.resolve(projectRootDir, next.name, "b")).not.to.be.a.path();
      expect(path.resolve(projectRootDir, next.name, "a*")).not.to.be.a.path();
    });
    it("should accept environment variable as part of outputFile name ", async ()=>{
      await addOutputFile(projectRootDir, previous.ID, "{{ WHEEL_CURRENT_INDEX }}a");
      await addInputFile(projectRootDir, next.ID, "b");
      await addFileLink(projectRootDir, previous.ID, "{{ WHEEL_CURRENT_INDEX }}a", next.ID, "b");
      await fs.outputFile(path.resolve(projectRootDir, previous.name, "3a"), "hoge");
      projectJson.env = { WHEEL_CURRENT_INDEX: 3 };
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, projectJson.env, "");
      expect(await DP.start()).to.be.equal("finished");
      expect(path.resolve(projectRootDir, next.name, "3a")).not.to.be.a.path();
      expect(path.resolve(projectRootDir, next.name, "b")).to.be.a.file().and.equal(path.resolve(projectRootDir, previous.name, "3a"));
    });
    it("should accept environment variable as part of inputFile name ", async ()=>{
      await addOutputFile(projectRootDir, previous.ID, "a");
      await addInputFile(projectRootDir, next.ID, "b{{ WHEEL_CURRENT_INDEX }}");
      await addFileLink(projectRootDir, previous.ID, "a", next.ID, "b{{ WHEEL_CURRENT_INDEX }}");
      await fs.outputFile(path.resolve(projectRootDir, previous.name, "a"), "hoge");
      projectJson.env = { WHEEL_CURRENT_INDEX: "hoge" };
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, projectJson.env, "");
      expect(await DP.start()).to.be.equal("finished");
      expect(path.resolve(projectRootDir, next.name, "a")).not.to.be.a.path();
      expect(path.resolve(projectRootDir, next.name, "bhoge")).to.be.a.file().and.equal(path.resolve(projectRootDir, previous.name, "a"));
    });
    it("should copy files from storage component's outputFile to inputFile", async ()=>{
      await addOutputFile(projectRootDir, storage.ID, "a");
      await addInputFile(projectRootDir, next.ID, "b");
      await addFileLink(projectRootDir, storage.ID, "a", next.ID, "b");
      await fs.outputFile(path.join(storageArea, "a"), "hoge");
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      expect(path.resolve(projectRootDir, next.name, "a")).not.to.be.a.path();
      expect(path.resolve(projectRootDir, next.name, "b")).to.be.a.file().and.equal(path.resolve(storageArea, "a"));
      const stats = await fs.lstat(path.resolve(projectRootDir, next.name, "b"));
      expect(stats.isSymbolicLink()).to.be.false;
    });
    it("should move storage component's inputFile to storagePath", async ()=>{
      await addOutputFile(projectRootDir, previous.ID, "a");
      await addInputFile(projectRootDir, storage.ID, "b");
      await addFileLink(projectRootDir, previous.ID, "a", storage.ID, "b");
      await fs.outputFile(path.resolve(projectRootDir, previous.name, "a"), "hoge");
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      expect(path.resolve(projectRootDir, storage.name, "a")).not.to.be.a.path();
      expect(path.resolve(projectRootDir, storage.name, "b")).not.to.be.a.path();
      expect(path.resolve(storageArea, "b")).to.be.a.file().and.equal(path.resolve(projectRootDir, previous.name, "a"));
    });
    describe("run on remote host", ()=>{
      let ssh;
      const remotehostName = process.env.WHEEL_TEST_REMOTEHOST;
      const password = process.env.WHEEL_TEST_REMOTE_PASSWORD;
      before(async function () {
        if (!remotehostName) {
          console.log("remote exec test will be skipped because WHEEL_TEST_REMOTEHOST is not set");
          this.skip();
        }

        if (!password) {
          console.log("remote exec test will be done without password because WHEEL_TEST_REMOTE_PASSWORD is not set");
        }
        const hostInfo = remoteHost.query("name", remotehostName);
        hostInfo.password = password;
        hostInfo.noStrictHostKeyChecking = true;
        ssh = new SshClientWrapper(hostInfo);

        try {
          const rt = await ssh.canConnect();

          if (!rt) {
            throw new Error("canConnect failed");
          }
          addSsh(projectRootDir, hostInfo, ssh);
        } catch (e) {
          console.log(`ssh connection failed to ${remotehostName} due to "${e}" so remote exec test is skipped`);
          this.skip();
        } finally {
          await ssh.disconnect();
        }
      });
      after(async ()=>{
        if (ssh) {
          await ssh.disconnect();
        }
      });
      describe("[reproduction test] subsequent component can get inputFile from remote storage component", ()=>{
        const remoteStorageArea = `/tmp/${storageArea}`;
        beforeEach(async ()=>{
          await updateComponent(projectRootDir, storage.ID, "host", remotehostName);
          await updateComponent(projectRootDir, storage.ID, "storagePath", remoteStorageArea);
          await addOutputFile(projectRootDir, storage.ID, "a");
          await addInputFile(projectRootDir, next.ID, "b");
          await addFileLink(projectRootDir, storage.ID, "a", next.ID, "b");
          await ssh.exec(`mkdir -p ${remoteStorageArea} && echo hoge > ${remoteStorageArea}/a`);
        });
        it("should deliver file as real file", async ()=>{
          const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
          expect(await DP.start()).to.be.equal("finished");
          expect(path.resolve(projectRootDir, next.name, "a")).not.to.be.a.path();
          expect(path.resolve(projectRootDir, next.name, "b")).to.be.a.file();
          const stats = await fs.lstat(path.resolve(projectRootDir, next.name, "b"));
          expect(stats.isSymbolicLink()).to.be.false;
        });
      });
    });
  });
  describe("#For component", ()=>{
    let for0;
    beforeEach(async ()=>{
      for0 = await createNewComponent(projectRootDir, projectRootDir, "for", { x: 10, y: 10 });
      projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
    });
    it("should copy 3 times and delete all component", async ()=>{
      await updateComponent(projectRootDir, for0.ID, "start", 0);
      await updateComponent(projectRootDir, for0.ID, "end", 2);
      await updateComponent(projectRootDir, for0.ID, "step", 1);
      await updateComponent(projectRootDir, for0.ID, "keep", 0);
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      await wait();
      expect(path.resolve(projectRootDir, `${for0.name}_0`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, `${for0.name}_1`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, `${for0.name}_2`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, `${for0.name}_3`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, for0.name, componentJsonFilename)).to.be.a.file().with.json.using.schema({
        properties: {
          numFinishd: {
            type: "integer",
            minimum: 3,
            maximum: 3

          },
          numTotal: {
            type: "integer",
            minimum: 3,
            maximum: 3
          }
        }
      });
    });

    it("should work with negative step number", async ()=>{
      await updateComponent(projectRootDir, for0.ID, "end", 0);
      await updateComponent(projectRootDir, for0.ID, "start", 2);
      await updateComponent(projectRootDir, for0.ID, "step", -1);
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      expect(path.resolve(projectRootDir, `${for0.name}_0`)).to.be.a.directory();
      expect(path.resolve(projectRootDir, `${for0.name}_1`)).to.be.a.directory();
      expect(path.resolve(projectRootDir, `${for0.name}_2`)).to.be.a.directory();
      expect(path.resolve(projectRootDir, `${for0.name}_3`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, for0.name, componentJsonFilename)).to.be.a.file().with.json.using.schema({
        properties: {
          numFinishd: {
            type: "integer",
            minimum: 3,
            maximum: 3

          },
          numTotal: {
            type: "integer",
            minimum: 3,
            maximum: 3
          }
        }
      });
    });
    it("should work with step number which is greater than 1", async ()=>{
      await updateComponent(projectRootDir, for0.ID, "start", 1);
      await updateComponent(projectRootDir, for0.ID, "end", 3);
      await updateComponent(projectRootDir, for0.ID, "step", 2);
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      expect(path.resolve(projectRootDir, `${for0.name}_1`)).to.be.a.directory();
      expect(path.resolve(projectRootDir, `${for0.name}_2`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, `${for0.name}_3`)).to.be.a.directory();
      expect(path.resolve(projectRootDir, `${for0.name}_4`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, `${for0.name}_5`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, for0.name, componentJsonFilename)).to.be.a.file().with.json.using.schema({
        properties: {
          numFinishd: {
            type: "integer",
            minimum: 2,
            maximum: 2

          },
          numTotal: {
            type: "integer",
            minimum: 2,
            maximum: 2
          }
        }
      });
    });
    it("should work beyond 0", async ()=>{
      await updateComponent(projectRootDir, for0.ID, "start", -1);
      await updateComponent(projectRootDir, for0.ID, "end", 1);
      await updateComponent(projectRootDir, for0.ID, "step", 1);
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      expect(path.resolve(projectRootDir, `${for0.name}_-1`)).to.be.a.directory();
      expect(path.resolve(projectRootDir, `${for0.name}_0`)).to.be.a.directory();
      expect(path.resolve(projectRootDir, `${for0.name}_1`)).to.be.a.directory();
      expect(path.resolve(projectRootDir, `${for0.name}_2`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, for0.name, componentJsonFilename)).to.be.a.file().with.json.using.schema({
        properties: {
          numFinishd: {
            type: "integer",
            minimum: 3,
            maximum: 3

          },
          numTotal: {
            type: "integer",
            minimum: 3,
            maximum: 3
          }
        }
      });
    });
    it("should copy 3 times and back to original component", async ()=>{
      await updateComponent(projectRootDir, for0.ID, "start", 0);
      await updateComponent(projectRootDir, for0.ID, "end", 2);
      await updateComponent(projectRootDir, for0.ID, "step", 1);
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      expect(path.resolve(projectRootDir, `${for0.name}_0`)).to.be.a.directory();
      expect(path.resolve(projectRootDir, `${for0.name}_1`)).to.be.a.directory();
      expect(path.resolve(projectRootDir, `${for0.name}_2`)).to.be.a.directory();
      expect(path.resolve(projectRootDir, `${for0.name}_3`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, for0.name, componentJsonFilename)).to.be.a.file().with.json.using.schema({
        properties: {
          numFinishd: {
            type: "integer",
            minimum: 3,
            maximum: 3

          },
          numTotal: {
            type: "integer",
            minimum: 3,
            maximum: 3
          }
        }
      });
    });
    it("should copy 3 times and delete all", async ()=>{
      await updateComponent(projectRootDir, for0.ID, "start", 0);
      await updateComponent(projectRootDir, for0.ID, "end", 2);
      await updateComponent(projectRootDir, for0.ID, "step", 1);
      await updateComponent(projectRootDir, for0.ID, "keep", 0);
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      expect(path.resolve(projectRootDir, `${for0.name}_0`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, `${for0.name}_1`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, `${for0.name}_2`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, `${for0.name}_3`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, for0.name, componentJsonFilename)).to.be.a.file().with.json.using.schema({
        properties: {
          numFinishd: {
            type: "integer",
            minimum: 3,
            maximum: 3

          },
          numTotal: {
            type: "integer",
            minimum: 3,
            maximum: 3
          }
        }
      });
    });
    it("should copy 3 times and keep last", async ()=>{
      await updateComponent(projectRootDir, for0.ID, "start", 0);
      await updateComponent(projectRootDir, for0.ID, "end", 2);
      await updateComponent(projectRootDir, for0.ID, "step", 1);
      await updateComponent(projectRootDir, for0.ID, "keep", 1);
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      expect(path.resolve(projectRootDir, `${for0.name}_0`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, `${for0.name}_1`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, `${for0.name}_2`)).to.be.a.directory();
      expect(path.resolve(projectRootDir, `${for0.name}_3`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, for0.name, componentJsonFilename)).to.be.a.file().with.json.using.schema({
        properties: {
          numFinishd: {
            type: "integer",
            minimum: 3,
            maximum: 3

          },
          numTotal: {
            type: "integer",
            minimum: 3,
            maximum: 3
          }
        }
      });
    });
    it("should copy 3 times and keep last 2", async ()=>{
      await updateComponent(projectRootDir, for0.ID, "start", 0);
      await updateComponent(projectRootDir, for0.ID, "end", 2);
      await updateComponent(projectRootDir, for0.ID, "step", 1);
      await updateComponent(projectRootDir, for0.ID, "keep", 2);
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      expect(path.resolve(projectRootDir, `${for0.name}_0`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, `${for0.name}_1`)).to.be.a.directory();
      expect(path.resolve(projectRootDir, `${for0.name}_2`)).to.be.a.directory();
      expect(path.resolve(projectRootDir, `${for0.name}_3`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, for0.name, componentJsonFilename)).to.be.a.file().with.json.using.schema({
        properties: {
          numFinishd: {
            type: "integer",
            minimum: 3,
            maximum: 3

          },
          numTotal: {
            type: "integer",
            minimum: 3,
            maximum: 3
          }
        }
      });
    });
  });

  describe("#Parameter Study", ()=>{
    let PS0;
    beforeEach(async ()=>{
      PS0 = await createNewComponent(projectRootDir, projectRootDir, "PS", { x: 10, y: 10 });
      await updateComponent(projectRootDir, PS0.ID, "parameterFile", "input.txt.json");
      projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
      await fs.outputFile(path.join(projectRootDir, "PS0", "input.txt"), "%%KEYWORD1%%");
      const parameterSetting = {
        version: 2,
        target_file: "input.txt",
        target_param: [
          {
            target: "hoge",
            keyword: "KEYWORD1",
            type: "integer",
            min: 1,
            max: 3,
            step: 1,
            list: ""
          }
        ]
      };
      await fs.writeJson(path.join(projectRootDir, "PS0", "input.txt.json"), parameterSetting, { spaces: 4 });
      await updateComponent(projectRootDir, PS0.ID, "deleteLoopInstance", true);
    });
    it("should delete all loop instance", async ()=>{
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      await wait();
      expect(path.resolve(projectRootDir, `${PS0.name}_KEYWORD1_1`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, `${PS0.name}_KEYWORD1_2`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, `${PS0.name}_KEYWORD1_3`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, PS0.name, componentJsonFilename)).to.be.a.file().with.json.using.schema({
        properties: {
          numFinishd: {
            type: "integer",
            minimum: 3,
            maximum: 3

          },
          numTotal: {
            type: "integer",
            minimum: 3,
            maximum: 3
          }
        }
      });
    });
  });
  describe("#Foreach component", ()=>{
    let foreach0;
    beforeEach(async ()=>{
      foreach0 = await createNewComponent(projectRootDir, projectRootDir, "foreach", { x: 10, y: 10 });
      projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
      await updateComponent(projectRootDir, foreach0.ID, "indexList", ["foo", "bar", "baz", "fizz"]);
    });
    it("should copy 3 times and delete all component", async ()=>{
      await updateComponent(projectRootDir, foreach0.ID, "keep", 0);
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      await wait();
      expect(path.resolve(projectRootDir, `${foreach0.name}_foo`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, `${foreach0.name}_bar`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, `${foreach0.name}_baz`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, `${foreach0.name}_fizz`)).not.to.be.a.path();
    });
    it("should copy 3 times and keep last component", async ()=>{
      await updateComponent(projectRootDir, foreach0.ID, "keep", 1);
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      await wait();
      expect(path.resolve(projectRootDir, `${foreach0.name}_foo`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, `${foreach0.name}_bar`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, `${foreach0.name}_baz`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, `${foreach0.name}_fizz`)).to.be.a.directory();
    });
    it("should copy 3 times and keep last 2 component", async ()=>{
      await updateComponent(projectRootDir, foreach0.ID, "keep", 2);
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      await wait();
      expect(path.resolve(projectRootDir, `${foreach0.name}_foo`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, `${foreach0.name}_bar`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, `${foreach0.name}_baz`)).to.be.a.directory();
      expect(path.resolve(projectRootDir, `${foreach0.name}_fizz`)).to.be.a.directory();
    });
  });

  describe("#While component", ()=>{
    let while0;
    beforeEach(async ()=>{
      while0 = await createNewComponent(projectRootDir, projectRootDir, "while", { x: 10, y: 10 });
      projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
      await updateComponent(projectRootDir, while0.ID, "condition", "WHEEL_CURRENT_INDEX < 3");
    });
    it("should copy 3 times and delete all component", async ()=>{
      await updateComponent(projectRootDir, while0.ID, "keep", 0);
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      await wait();
      expect(path.resolve(projectRootDir, `${while0.name}_0`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, `${while0.name}_1`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, `${while0.name}_2`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, `${while0.name}_3`)).not.to.be.a.path();
    });
    it("should copy 3 times and keep last component", async ()=>{
      await updateComponent(projectRootDir, while0.ID, "keep", 1);
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      await wait();
      expect(path.resolve(projectRootDir, `${while0.name}_0`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, `${while0.name}_1`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, `${while0.name}_2`)).to.be.a.directory();
      expect(path.resolve(projectRootDir, `${while0.name}_3`)).not.to.be.a.path();
    });
    it("should copy 3 times and keep last 2 component", async ()=>{
      await updateComponent(projectRootDir, while0.ID, "keep", 2);
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      await wait();
      expect(path.resolve(projectRootDir, `${while0.name}_0`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, `${while0.name}_1`)).to.be.a.directory();
      expect(path.resolve(projectRootDir, `${while0.name}_2`)).to.be.a.directory();
      expect(path.resolve(projectRootDir, `${while0.name}_3`)).not.to.be.a.path();
    });
  });
  describe("#Break", ()=>{
    let for0;
    let task0;
    let task1;
    let break0;
    beforeEach(async ()=>{
      for0 = await createNewComponent(projectRootDir, projectRootDir, "for", { x: 10, y: 10 });
      await updateComponent(projectRootDir, for0.ID, "start", 0);
      await updateComponent(projectRootDir, for0.ID, "end", 3);
      await updateComponent(projectRootDir, for0.ID, "step", 1);
      task0 = await createNewComponent(projectRootDir, path.join(projectRootDir, for0.name), "task", { x: 10, y: 10 });
      task1 = await createNewComponent(projectRootDir, path.join(projectRootDir, for0.name), "task", { x: 10, y: 10 });
      await updateComponent(projectRootDir, task0.ID, "script", scriptName);
      await updateComponent(projectRootDir, task1.ID, "script", scriptName);
      await fs.outputFile(path.join(projectRootDir, for0.name, task0.name, scriptName), "echo task0 ${WHEEL_CURRENT_INDEX} >hoge");
      await fs.outputFile(path.join(projectRootDir, for0.name, task1.name, scriptName), "echo task1 ${WHEEL_CURRENT_INDEX} >hoge");
      break0 = await createNewComponent(projectRootDir, path.join(projectRootDir, for0.name), "break", { x: 10, y: 10 });
      await updateComponent(projectRootDir, break0.ID, "condition", "WHEEL_CURRENT_INDEX == 2");
      await addLink(projectRootDir, task0.ID, break0.ID);
      await addLink(projectRootDir, break0.ID, task1.ID);
      projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
    });
    it("should run from 0 to 2 and task1 under for0_2 should not run", async ()=>{
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      expect(path.resolve(projectRootDir, `${for0.name}_0`)).to.be.a.directory();
      expect(path.resolve(projectRootDir, `${for0.name}_1`)).to.be.a.directory();
      expect(path.resolve(projectRootDir, `${for0.name}_2`)).to.be.a.directory();
      expect(path.resolve(projectRootDir, `${for0.name}_3`)).not.to.be.a.path();
      expect(path.resolve(projectRootDir, `${for0.name}`, task0.name, "hoge")).to.be.a.file().with.content("task0 2\n");
      expect(path.resolve(projectRootDir, `${for0.name}`, task1.name, "hoge")).to.be.a.file().with.content("task1 1\n");
      expect(path.resolve(projectRootDir, `${for0.name}_0`, task0.name, "hoge")).to.be.a.file().with.content("task0 0\n");
      expect(path.resolve(projectRootDir, `${for0.name}_0`, task1.name, "hoge")).to.be.a.file().with.content("task1 0\n");
      expect(path.resolve(projectRootDir, `${for0.name}_1`, task0.name, "hoge")).to.be.a.file().with.content("task0 1\n");
      expect(path.resolve(projectRootDir, `${for0.name}_1`, task1.name, "hoge")).to.be.a.file().with.content("task1 1\n");
      expect(path.resolve(projectRootDir, `${for0.name}_2`, task0.name, "hoge")).to.be.a.file().with.content("task0 2\n");
      expect(path.resolve(projectRootDir, `${for0.name}_2`, task1.name, "hoge")).to.be.a.file().with.content("task1 1\n");

      for (const dir of ["for0_0", "for0_1"]) {
        expect(path.resolve(projectRootDir, dir, componentJsonFilename)).to.be.a.file().with.json.using.schema({
          required: ["state"],
          properties: {
            state: { enum: ["finished"] }
          }
        });
        expect(path.resolve(projectRootDir, dir, task0.name, componentJsonFilename)).to.be.a.file().with.json.using.schema({
          required: ["state"],
          properties: {
            state: { enum: ["finished"] }
          }
        });
        expect(path.resolve(projectRootDir, dir, task1.name, componentJsonFilename)).to.be.a.file().with.json.using.schema({
          required: ["state"],
          properties: {
            state: { enum: ["finished"] }
          }
        });
      }
      for (const dir of ["for0", "for0_2"]) {
        expect(path.resolve(projectRootDir, dir, componentJsonFilename)).to.be.a.file().with.json.using.schema({
          required: ["state"],
          properties: {
            state: { enum: ["finished"] }
          }
        });
        expect(path.resolve(projectRootDir, dir, task0.name, componentJsonFilename)).to.be.a.file().with.json.using.schema({
          required: ["state"],
          properties: {
            state: { enum: ["finished"] }
          }
        });
        expect(path.resolve(projectRootDir, dir, task1.name, componentJsonFilename)).to.be.a.file().with.json.using.schema({
          required: ["state"],
          properties: {
            state: { enum: ["not-started"] }
          }
        });
      }
    });
  });
  describe("#Continue", ()=>{
    let for0;
    let task0;
    let task1;
    let continue0;
    beforeEach(async ()=>{
      for0 = await createNewComponent(projectRootDir, projectRootDir, "for", { x: 10, y: 10 });
      await updateComponent(projectRootDir, for0.ID, "start", 0);
      await updateComponent(projectRootDir, for0.ID, "end", 3);
      await updateComponent(projectRootDir, for0.ID, "step", 1);
      task0 = await createNewComponent(projectRootDir, path.join(projectRootDir, for0.name), "task", { x: 10, y: 10 });
      task1 = await createNewComponent(projectRootDir, path.join(projectRootDir, for0.name), "task", { x: 10, y: 10 });
      await updateComponent(projectRootDir, task0.ID, "script", scriptName);
      await updateComponent(projectRootDir, task1.ID, "script", scriptName);
      await fs.outputFile(path.join(projectRootDir, for0.name, task0.name, scriptName), "echo task0 ${WHEEL_CURRENT_INDEX} >hoge");
      await fs.outputFile(path.join(projectRootDir, for0.name, task1.name, scriptName), "echo task1 ${WHEEL_CURRENT_INDEX} >hoge");
      continue0 = await createNewComponent(projectRootDir, path.join(projectRootDir, for0.name), "continue", { x: 10, y: 10 });
      await updateComponent(projectRootDir, continue0.ID, "condition", "WHEEL_CURRENT_INDEX == 2");
      await addLink(projectRootDir, task0.ID, continue0.ID);
      await addLink(projectRootDir, continue0.ID, task1.ID);
      projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
    });
    it("should run from 0 to 3 but task1 should be skipped when index=2", async ()=>{
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      expect(path.resolve(projectRootDir, `${for0.name}_0`)).to.be.a.directory();
      expect(path.resolve(projectRootDir, `${for0.name}_1`)).to.be.a.directory();
      expect(path.resolve(projectRootDir, `${for0.name}_2`)).to.be.a.directory();
      expect(path.resolve(projectRootDir, `${for0.name}_3`)).to.be.a.directory();
      expect(path.resolve(projectRootDir, `${for0.name}`, task0.name, "hoge")).to.be.a.file().with.content("task0 3\n");
      expect(path.resolve(projectRootDir, `${for0.name}`, task1.name, "hoge")).to.be.a.file().with.content("task1 3\n");
      expect(path.resolve(projectRootDir, `${for0.name}_0`, task0.name, "hoge")).to.be.a.file().with.content("task0 0\n");
      expect(path.resolve(projectRootDir, `${for0.name}_0`, task1.name, "hoge")).to.be.a.file().with.content("task1 0\n");
      expect(path.resolve(projectRootDir, `${for0.name}_1`, task0.name, "hoge")).to.be.a.file().with.content("task0 1\n");
      expect(path.resolve(projectRootDir, `${for0.name}_1`, task1.name, "hoge")).to.be.a.file().with.content("task1 1\n");
      expect(path.resolve(projectRootDir, `${for0.name}_2`, task0.name, "hoge")).to.be.a.file().with.content("task0 2\n");
      expect(path.resolve(projectRootDir, `${for0.name}_2`, task1.name, "hoge")).to.be.a.file().with.content("task1 1\n");
      expect(path.resolve(projectRootDir, `${for0.name}_3`, task0.name, "hoge")).to.be.a.file().with.content("task0 3\n");
      expect(path.resolve(projectRootDir, `${for0.name}_3`, task1.name, "hoge")).to.be.a.file().with.content("task1 3\n");

      for (const dir of ["for0", "for0_0", "for0_1", "for0_2", "for0_3"]) {
        expect(path.resolve(projectRootDir, dir, componentJsonFilename)).to.be.a.file().with.json.using.schema({
          required: ["state"],
          properties: {
            state: { enum: ["finished"] }
          }
        });
        expect(path.resolve(projectRootDir, dir, task0.name, componentJsonFilename)).to.be.a.file().with.json.using.schema({
          required: ["state"],
          properties: {
            state: { enum: ["finished"] }
          }
        });
      }
      for (const dir of ["for0", "for0_0", "for0_1", "for0_3"]) {
        expect(path.resolve(projectRootDir, dir, task1.name, componentJsonFilename)).to.be.a.file().with.json.using.schema({
          required: ["state"],
          properties: {
            state: { enum: ["finished"] }
          }
        });
      }
      expect(path.resolve(projectRootDir, "for0_2", task1.name, componentJsonFilename)).to.be.a.file().with.json.using.schema({
        required: ["state"],
        properties: {
          state: { enum: ["not-started"] }
        }
      });
    });
  });

  describe("[reproduction test] root workflow has only source and connected for loop", ()=>{
    let task0;
    let for0;
    let source0;
    beforeEach(async ()=>{
      source0 = await createNewComponent(projectRootDir, projectRootDir, "source", { x: 10, y: 10 });
      await renameOutputFile(projectRootDir, source0.ID, 0, "foo");

      for0 = await createNewComponent(projectRootDir, projectRootDir, "for", { x: 10, y: 10 });
      await updateComponent(projectRootDir, for0.ID, "start", 0);
      await updateComponent(projectRootDir, for0.ID, "end", 2);
      await updateComponent(projectRootDir, for0.ID, "step", 1);
      await addInputFile(projectRootDir, for0.ID, "foo");

      task0 = await createNewComponent(projectRootDir, path.join(projectRootDir, for0.name), "task", { x: 10, y: 10 });
      await updateComponent(projectRootDir, task0.ID, "script", scriptName);
      await addInputFile(projectRootDir, task0.ID, "foo");
      await fs.outputFile(path.join(projectRootDir, for0.name, task0.name, scriptName), "echo hoge ${WHEEL_CURRENT_INDEX} > hoge");

      await addFileLink(projectRootDir, source0.ID, "foo", for0.ID, "foo");
      await addFileLink(projectRootDir, for0.ID, "foo", task0.ID, "foo");

      projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
    });
    it("should run task0", async ()=>{
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      await wait();
      expect(path.resolve(projectRootDir, for0.name, task0.name, "hoge")).to.be.a.file().with.content("hoge 2\n");
      expect(path.resolve(projectRootDir, `${for0.name}_0`, task0.name, "hoge")).to.be.a.file().with.content("hoge 0\n");
      expect(path.resolve(projectRootDir, `${for0.name}_1`, task0.name, "hoge")).to.be.a.file().with.content("hoge 1\n");
      expect(path.resolve(projectRootDir, `${for0.name}_2`, task0.name, "hoge")).to.be.a.file().with.content("hoge 2\n");
    });
  });
  describe("[reproduction test] task with sub directory in a for loop", ()=>{
    beforeEach(async ()=>{
      const for0 = await createNewComponent(projectRootDir, projectRootDir, "for", { x: 10, y: 10 });
      await updateComponent(projectRootDir, for0.ID, "start", 0);
      await updateComponent(projectRootDir, for0.ID, "end", 2);
      await updateComponent(projectRootDir, for0.ID, "step", 1);
      const task0 = await createNewComponent(projectRootDir, path.join(projectRootDir, "for0"), "task", { x: 10, y: 10 });
      await updateComponent(projectRootDir, task0.ID, "script", scriptName);
      await fs.outputFile(path.join(projectRootDir, "for0", "task0", scriptName), scriptPwd);
      await fs.mkdir(path.join(projectRootDir, "for0", "task0", "empty_dir"));
      projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
    });
    it("should run and successfully finished", async ()=>{
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      await wait();
      expect(path.resolve(projectRootDir, "for0", componentJsonFilename)).to.be.a.file().with.json.using.schema({
        required: ["state"],
        properties: {
          state: { enum: ["finished"] }
        }
      });
      expect(path.resolve(projectRootDir, "for0_0", "task0", componentJsonFilename)).to.be.a.file().with.json.using.schema({
        required: ["state"],
        properties: {
          state: { enum: ["finished"] }
        }
      });
      expect(path.resolve(projectRootDir, "for0_1", "task0", componentJsonFilename)).to.be.a.file().with.json.using.schema({
        required: ["state"],
        properties: {
          state: { enum: ["finished"] }
        }
      });
      expect(path.resolve(projectRootDir, "for0_2", "task0", componentJsonFilename)).to.be.a.file().with.json.using.schema({
        required: ["state"],
        properties: {
          state: { enum: ["finished"] }
        }
      });
      expect(path.resolve(projectRootDir, "for0", "task0", componentJsonFilename)).to.be.a.file().with.json.using.schema({
        required: ["state"],
        properties: {
          state: { enum: ["finished"] }
        }
      });
    });
  });
  describe("[reproduction test] PS in loop", ()=>{
    let for0;
    let PS0;
    let task0;
    beforeEach(async ()=>{
      for0 = await createNewComponent(projectRootDir, projectRootDir, "for", { x: 10, y: 10 });
      await updateComponent(projectRootDir, for0.ID, "start", 0);
      await updateComponent(projectRootDir, for0.ID, "end", 3);
      await updateComponent(projectRootDir, for0.ID, "step", 1);

      PS0 = await createNewComponent(projectRootDir, path.resolve(projectRootDir, for0.name), "PS", { x: 10, y: 10 });
      await updateComponent(projectRootDir, PS0.ID, "parameterFile", "input.txt.json");
      await fs.outputFile(path.join(projectRootDir, for0.name, PS0.name, "input.txt"), "%%KEYWORD1%%");
      const parameterSetting = {
        version: 2,
        target_file: "input.txt",
        target_param: [
          {
            target: "hoge",
            keyword: "KEYWORD1",
            type: "integer",
            min: 1,
            max: 3,
            step: 1,
            list: ""
          }
        ]
      };
      await fs.writeJson(path.join(projectRootDir, for0.name, PS0.name, "input.txt.json"), parameterSetting, { spaces: 4 });

      task0 = await createNewComponent(projectRootDir, path.resolve(projectRootDir, for0.name, PS0.name), "task", { x: 10, y: 10 });
      await updateComponent(projectRootDir, task0.ID, "script", scriptName);
      await fs.outputFile(path.join(projectRootDir, for0.name, PS0.name, task0.name, scriptName), "if [ ${WHEEL_CURRENT_INDEX} -eq 0 ];then echo hoge ${WHEEL_CURRENT_INDEX} > hoge;fi");

      projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
    });
    it("should run project and successfully finish", async ()=>{
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      expect(path.resolve(projectRootDir, for0.name, componentJsonFilename)).to.be.a.file().with.json.using.schema({
        properties: {
          numFinishd: {
            type: "integer",
            minimum: 4,
            maximum: 4
          },
          numTotal: {
            type: "integer",
            minimum: 4,
            maximum: 4
          }
        }
      });
      expect(path.resolve(projectRootDir, for0.name, PS0.name, componentJsonFilename)).to.be.a.file().with.json.using.schema({
        properties: {
          numFinishd: {
            type: "integer",
            minimum: 3,
            maximum: 3
          },
          numTotal: {
            type: "integer",
            minimum: 3,
            maximum: 3
          }
        }
      });
      expect(path.resolve(projectRootDir, for0.name, "PS0_KEYWORD1_1", task0.name, componentJsonFilename)).to.be.a.file().with.json.using.schema({
        properties: {
          state: {
            type: "string",
            pattern: "^finished$"
          }
        }
      });
      expect(path.resolve(projectRootDir, for0.name, "PS0_KEYWORD1_2", task0.name, componentJsonFilename)).to.be.a.file().with.json.using.schema({
        properties: {
          state: {
            type: "string",
            pattern: "^finished$"
          }
        }
      });
      expect(path.resolve(projectRootDir, for0.name, "PS0_KEYWORD1_3", task0.name, componentJsonFilename)).to.be.a.file().with.json.using.schema({
        properties: {
          state: {
            type: "string",
            pattern: "^finished$"
          }
        }
      });
      expect(path.resolve(projectRootDir, "for0_0", "PS0_KEYWORD1_1", task0.name, "hoge")).to.be.a.file().with.content("hoge 0\n");
      expect(path.resolve(projectRootDir, "for0_0", "PS0_KEYWORD1_2", task0.name, "hoge")).to.be.a.file().with.content("hoge 0\n");
      expect(path.resolve(projectRootDir, "for0_0", "PS0_KEYWORD1_3", task0.name, "hoge")).to.be.a.file().with.content("hoge 0\n");
      expect(path.resolve(projectRootDir, "for0_1", "PS0_KEYWORD1_1", task0.name, "hoge")).not.to.be.a.path();
      expect(path.resolve(projectRootDir, "for0_1", "PS0_KEYWORD1_2", task0.name, "hoge")).not.to.be.a.path();
      expect(path.resolve(projectRootDir, "for0_1", "PS0_KEYWORD1_3", task0.name, "hoge")).not.to.be.a.path();
      expect(path.resolve(projectRootDir, "for0_2", "PS0_KEYWORD1_1", task0.name, "hoge")).not.to.be.a.path();
      expect(path.resolve(projectRootDir, "for0_2", "PS0_KEYWORD1_2", task0.name, "hoge")).not.to.be.a.path();
      expect(path.resolve(projectRootDir, "for0_2", "PS0_KEYWORD1_3", task0.name, "hoge")).not.to.be.a.path();
      expect(path.resolve(projectRootDir, "for0_3", "PS0_KEYWORD1_1", task0.name, "hoge")).not.to.be.a.path();
      expect(path.resolve(projectRootDir, "for0_3", "PS0_KEYWORD1_2", task0.name, "hoge")).not.to.be.a.path();
      expect(path.resolve(projectRootDir, "for0_3", "PS0_KEYWORD1_3", task0.name, "hoge")).not.to.be.a.path();
    });
  });
});
