/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import path from "path";
import fs from "fs-extra";
//eslint-disable-next-line no-unused-vars
import EventEmitter from "events";

//setup test framework
import * as chai from "chai";
const expect = chai.expect;
import sinon from "sinon";
import sinonChai from "sinon-chai";
chai.use(sinonChai);
import Ajv from "ajv";
//eslint-disable-next-line no-unused-vars
const ajv = new Ajv({ strict: false });

//testee
import { exec, execStageOut } from "../../../app/core/executer.js";

//test data
const testDirRoot = "WHEEL_TEST_TMP";
const projectRootDir = path.resolve(testDirRoot, "testProject.wheel");
const remoteHome = "/home/testuser";

//helper functions
import { componentJsonFilename, statusFilename, jobManagerJsonFilename } from "../../../app/db/db.js";
import { createNewProject } from "../../../app/core/projectOperations.js";
import { updateComponentProperty } from "../../testUtil.js";
import { createNewComponent } from "../../../app/core/componentOperations.js";
import { replacePathsep } from "../../../app/core/pathUtils.js";

import { scriptName, pwdCmd, scriptHeader, exit } from "../../testScript.js";
const scriptPwd = `${scriptHeader}\n${pwdCmd}`;

import { remoteHost } from "../../../app/db/db.js";
import { createSsh } from "../../../app/core/sshManager.js";
import { eventEmitters } from "../../../app/core/global.js";

describe("UT for executer class", function () {
  this.timeout(0);
  let task0;
  beforeEach(async ()=>{
    await fs.remove(testDirRoot);
    await createNewProject(projectRootDir, "test project", null, "test", "test@example.com");
    task0 = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 10, y: 10 });
    await fs.outputFile(path.join(projectRootDir, task0.name, scriptName), `${scriptPwd}\n${exit(0)}`);
    task0 = await updateComponentProperty(projectRootDir, task0.ID, "script", scriptName);
    task0.emitEvent = sinon.stub();
    //copy from Dispatcher._dispatchTask().
    //refactoring needed !!
    task0.dispatchedTime = "dummy dispatched time";
    task0.startTime = "not started"; //to be assigned in executer
    task0.endTime = "not finished"; //to be assigned in executer
    task0.preparedTime = null; //to be assigned in executer
    task0.jobSubmittedTime = null; //to be assigned in executer
    task0.jobStartTime = null; //to be assigned in executer
    task0.jobEndTime = null; //to be assigned in executer
    task0.projectStartTime = "dummy-project-start-time";
    task0.projectRootDir = projectRootDir;
    task0.workingDir = path.resolve(projectRootDir, task0.name);

    task0.ancestorsName = replacePathsep(path.relative(task0.projectRootDir, path.dirname(task0.workingDir)));
    task0.doCleanup = false;
    task0.emitForDispatcher = sinon.stub();

    //Setup mock event emitter for the project
    eventEmitters.set(projectRootDir, { emit: sinon.stub() });
  });
  afterEach(()=>{
    //Clean up event emitter
    eventEmitters.delete(projectRootDir);
  });
  after(async ()=>{
    await fs.remove(testDirRoot);
  });
  describe("#local exec", ()=>{
    it("run shell script which returns 0 and status should be Finished", async ()=>{
      await exec(task0);
      const statusFile = path.join(task0.workingDir, statusFilename);
      expect(fs.statSync(statusFile).isFile()).to.be.true;
      expect(fs.readFileSync(statusFile, "utf-8")).to.equal("finished\n0\nundefined");
      expect(task0.emitForDispatcher).to.be.calledOnceWith("taskCompleted", "finished");
    });
    it("run shell script which returns 1 and status should be failed", async ()=>{
      await fs.outputFile(path.join(projectRootDir, task0.name, scriptName), `${scriptPwd}\n${exit(1)}`);

      try {
        await exec(task0);
      } catch (e) {
        expect(e.rt).to.equal(1);
      }
      const statusFile = path.join(task0.workingDir, statusFilename);
      expect(fs.statSync(statusFile).isFile()).to.be.true;
      expect(fs.readFileSync(statusFile, "utf-8")).to.equal("failed\n1\nundefined");
      expect(task0.emitForDispatcher).to.be.calledOnceWith("taskCompleted", "failed");
    });
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
      const hostinfo = remoteHost.query("name", remotehostName);
      if (!hostinfo) {
        console.log(`remote exec test will be skipped because host '${remotehostName}' is not found in remoteHost database`);
        this.skip();
      }
      hostinfo.password = password;

      try {
        ssh = await createSsh(projectRootDir, remotehostName, hostinfo, "dummy-clientID");
      } catch (e) {
        console.log(`ssh connection failed to ${remotehostName} due to "${e}" so remote exec test is skipped`);
        this.skip();
      }
    });
    beforeEach(()=>{
      task0.host = remotehostName;
      //following lines are from Executer.exec but planning to move to Dispatcher._dispatchTask()
      task0.remotehostID = remoteHost.getID("name", task0.host) || "localhost";
      task0.remoteWorkingDir = path.posix.join(remoteHome, task0.projectStartTime);
    });
    afterEach(async ()=>{
      await ssh.exec(`rm -fr ${path.posix.join(remoteHome, task0.projectStartTime)}`);
    });
    after(async ()=>{
      if (ssh) {
        await ssh.disconnect();
      }
    });

    describe("#remote exec", ()=>{
      it("run shell script which returns 0 and status should be Finished", async ()=>{
        await exec(task0);
        const statusFile = path.join(task0.workingDir, statusFilename);
        expect(fs.statSync(statusFile).isFile()).to.be.true;
        expect(fs.readFileSync(statusFile, "utf-8")).to.equal("finished\n0\nundefined");
        expect(await ssh.ls(path.posix.join(remoteHome, task0.projectStartTime)))
          .to.have.members([task0.name]);
        expect(await ssh.ls(path.posix.join(remoteHome, task0.projectStartTime, task0.name))).to.have.members(["run.sh", componentJsonFilename]);
      });
      it("cleanup remote directory after successfully run", async ()=>{
        task0.doCleanup = true;
        await exec(task0);
        const statusFile = path.join(task0.workingDir, statusFilename);
        expect(fs.statSync(statusFile).isFile()).to.be.true;
        expect(fs.readFileSync(statusFile, "utf-8")).to.equal("finished\n0\nundefined");
        expect(await ssh.ls(path.posix.join(remoteHome, task0.projectStartTime))).to.be.an("array").that.is.empty;
      });
      it("get outputFiles after successfully run", async ()=>{
        const task1 = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 10, y: 10 });
        task1.inputFiles = [{ name: "dummy", src: [{ srcNode: task0.ID, srcName: "hoge" }] }];
        task0.outputFiles = [{ name: "hoge", dst: [{ dstNode: task1.ID, dstName: "dummy" }] }];
        await updateComponentProperty(projectRootDir, task1.ID, "inputFiles", task1.inputFiles);
        await updateComponentProperty(projectRootDir, task0.ID, "host", task0.host);
        await updateComponentProperty(projectRootDir, task0.ID, "outputFiles", task0.outputFiles);
        await fs.outputFile(path.join(projectRootDir, task0.name, scriptName), `${scriptPwd}\necho -n hoge > hoge\n${exit(0)}`);
        await exec(task0);
        const statusFile = path.join(task0.workingDir, statusFilename);
        expect(fs.statSync(statusFile).isFile()).to.be.true;
        expect(fs.readFileSync(statusFile, "utf-8")).to.equal("finished\n0\nundefined");
        const outputFile = path.join(task0.workingDir, "hoge");
        expect(fs.statSync(outputFile).isFile()).to.be.true;
        expect(fs.readFileSync(outputFile, "utf-8")).to.equal("hoge");
      });
      it("do nothing if outputFile is not found", async ()=>{
        task0.outputFiles = [{ name: "huga", dst: [] }];
        await fs.outputFile(path.join(projectRootDir, task0.name, scriptName), `${scriptPwd}\necho -n hoge > hoge\n${exit(0)}`);
        await exec(task0);
        const statusFile = path.join(task0.workingDir, statusFilename);
        expect(fs.statSync(statusFile).isFile()).to.be.true;
        expect(fs.readFileSync(statusFile, "utf-8")).to.equal("finished\n0\nundefined");
        expect(fs.existsSync(path.join(task0.workingDir, "huga"))).to.be.false;
      });
      it("run shell script which returns 1 and status should be failed", async ()=>{
        await fs.outputFile(path.join(projectRootDir, task0.name, scriptName), `${scriptPwd}\n${exit(1)}`);

        try {
          await exec(task0);
        } catch (e) {
          expect(e.rt).to.equal(1);
        }
        const statusFile = path.join(task0.workingDir, statusFilename);
        expect(fs.statSync(statusFile).isFile()).to.be.true;
        expect(fs.readFileSync(statusFile, "utf-8")).to.equal("failed\n1\nundefined");
      });
      it("do not cleanup remote directory after failed run", async ()=>{
        task0.doCleanup = true;
        await fs.outputFile(path.join(projectRootDir, task0.name, scriptName), `${scriptPwd}\n${exit(1)}`);

        try {
          await exec(task0);
        } catch (e) {
          expect(e.rt).to.equal(1);
        }
        const statusFile = path.join(task0.workingDir, statusFilename);
        expect(fs.statSync(statusFile).isFile()).to.be.true;
        expect(fs.readFileSync(statusFile, "utf-8")).to.equal("failed\n1\nundefined");
        expect(await ssh.ls(path.posix.join(remoteHome, task0.projectStartTime)))
          .to.have.members([task0.name]);
        expect(await ssh.ls(path.posix.join(remoteHome, task0.projectStartTime, task0.name))).to.have.members(["run.sh", componentJsonFilename]);
      });
      it("do not get outputFiles after failed run", async ()=>{
        task0.outputFiles = [{ name: "hoge" }];
        await fs.outputFile(path.join(projectRootDir, task0.name, scriptName), `${scriptPwd}\necho -n hoge > hoge\n${exit(1)}`);

        try {
          await exec(task0);
        } catch (e) {
          expect(e.rt).to.equal(1);
        }
        const statusFile = path.join(task0.workingDir, statusFilename);
        expect(fs.statSync(statusFile).isFile()).to.be.true;
        expect(fs.readFileSync(statusFile, "utf-8")).to.equal("failed\n1\nundefined");
        expect(fs.existsSync(path.join(task0.workingDir, "hoge"))).to.be.false;
      });
    });
    describe("#remote job", ()=>{
      beforeEach(()=>{
        task0.useJobScheduler = true;
      });
      it("run shell script which returns 0 and status should be Finished", async ()=>{
        await exec(task0);
        //92 means job was successfully finished on PBS Pro
        const statusFile = path.join(task0.workingDir, statusFilename);
        expect(fs.statSync(statusFile).isFile()).to.be.true;
        expect(fs.readFileSync(statusFile, "utf-8")).to.equal("finished\n0\n92");
        const remotehostID = process.env.WHEEL_TEST_REMOTEHOST;
        const hostinfo = remoteHost.query("name", remotehostID);
        const hostname = hostinfo.host;
        const JS = hostinfo.jobScheduler;
        expect(fs.existsSync(path.resolve(projectRootDir, `${hostname}-${JS}.${jobManagerJsonFilename}`))).to.be.false;
      });
      it("run shell script which returns 1 and status should be failed", async ()=>{
        await fs.outputFile(path.join(projectRootDir, task0.name, scriptName), `${scriptPwd}\n${exit(1)}`);
        await exec(task0);
        //93 means job was finished but failed on PBS Pro
        const statusFile = path.join(task0.workingDir, statusFilename);
        expect(fs.statSync(statusFile).isFile()).to.be.true;
        expect(fs.readFileSync(statusFile, "utf-8")).to.equal("failed\n1\n93");
        const remotehostID = process.env.WHEEL_TEST_REMOTEHOST;
        const hostinfo = remoteHost.query("name", remotehostID);
        const hostname = hostinfo.host;
        const JS = hostinfo.jobScheduler;
        expect(fs.existsSync(path.resolve(projectRootDir, `${hostname}-${JS}.${jobManagerJsonFilename}`))).to.be.false;
      });
      it("add submit option", async ()=>{
        task0.submitOption = "-N testjob";
        await exec(task0);
        //92 means job was successfully finished on PBS Pro
        const statusFile = path.join(task0.workingDir, statusFilename);
        expect(fs.statSync(statusFile).isFile()).to.be.true;
        expect(fs.readFileSync(statusFile, "utf-8")).to.equal("finished\n0\n92");
        const remotehostID = process.env.WHEEL_TEST_REMOTEHOST;
        const hostinfo = remoteHost.query("name", remotehostID);
        const hostname = hostinfo.host;
        const JS = hostinfo.jobScheduler;
        expect(fs.existsSync(path.resolve(projectRootDir, `${hostname}-${JS}.${jobManagerJsonFilename}`))).to.be.false;
      });
    });
  });
});

describe("UT for execStageOut", function () {
  this.timeout(0);
  let task0;
  const testDirRoot2 = "WHEEL_TEST_TMP_STAGEOOUT";
  const projectRootDir2 = path.resolve(testDirRoot2, "testProject.wheel");

  beforeEach(async ()=>{
    await fs.remove(testDirRoot2);
    await createNewProject(projectRootDir2, "test project for execStageOut", null, "test", "test@example.com");
    task0 = await createNewComponent(projectRootDir2, projectRootDir2, "task", { x: 10, y: 10 });
    task0.projectStartTime = "dummy-project-start-time";
    task0.projectRootDir = projectRootDir2;
    task0.workingDir = path.resolve(projectRootDir2, task0.name);
    task0.emitForDispatcher = sinon.stub();
    task0.outputFiles = [];
    eventEmitters.set(projectRootDir2, { emit: sinon.stub() });
  });

  afterEach(()=>{
    eventEmitters.delete(projectRootDir2);
    sinon.restore();
  });

  after(async ()=>{
    await fs.remove(testDirRoot2);
  });

  describe("#local execStageOut", ()=>{
    it("should set task state to 'finished' and emit taskCompleted for local task", async ()=>{
      task0.state = "stage-out";
      await execStageOut(task0);
      expect(task0.state).to.equal("finished");
      expect(task0.emitForDispatcher).to.be.calledOnceWith("taskCompleted", "finished", task0);
    });
    it("should emit taskCompleted even if task has no host set", async ()=>{
      task0.state = "stage-out";
      task0.host = undefined;
      await execStageOut(task0);
      expect(task0.remotehostID).to.equal("localhost");
      expect(task0.emitForDispatcher).to.be.calledOnceWith("taskCompleted", "finished", task0);
    });
  });

  describe("run on remote host", ()=>{
    let ssh;
    const remotehostName = process.env.WHEEL_TEST_REMOTEHOST;
    const password = process.env.WHEEL_TEST_REMOTE_PASSWORD;
    before(async function () {
      if (!remotehostName) {
        console.log("remote execStageOut test will be skipped because WHEEL_TEST_REMOTEHOST is not set");
        this.skip();
      }
      if (!password) {
        console.log("remote execStageOut test will be done without password because WHEEL_TEST_REMOTE_PASSWORD is not set");
      }
      const hostinfo = remoteHost.query("name", remotehostName);
      if (!hostinfo) {
        console.log(`remote execStageOut test will be skipped because host '${remotehostName}' is not found in remoteHost database`);
        this.skip();
      }
      hostinfo.password = password;

      try {
        ssh = await createSsh(projectRootDir2, remotehostName, hostinfo, "dummy-clientID");
      } catch (e) {
        console.log(`ssh connection failed to ${remotehostName} due to "${e}" so remote execStageOut test is skipped`);
        this.skip();
      }
    });
    beforeEach(async ()=>{
      task0.host = remotehostName;
      task0.remotehostID = remoteHost.getID("name", task0.host) || "localhost";
      task0.remoteWorkingDir = path.posix.join(remoteHome, task0.projectStartTime, task0.name);
      await ssh.exec(`mkdir -p ${task0.remoteWorkingDir}`);
    });
    afterEach(async ()=>{
      await ssh.exec(`rm -fr ${path.posix.join(remoteHome, task0.projectStartTime)}`);
    });
    after(async ()=>{
      if (ssh) {
        await ssh.disconnect();
      }
    });

    it("should download outputFiles and emit taskCompleted with the task instance for a remote task", async ()=>{
      task0.state = "stage-out";
      task0.doCleanup = false;
      task0.include = [];
      task0.exclude = [];
      await execStageOut(task0);
      expect(task0.state).to.equal("finished");
      expect(task0.emitForDispatcher).to.be.calledOnceWith("taskCompleted", "finished", task0);
    });
  });
});
