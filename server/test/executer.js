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
const rewire = require("rewire");

//testee
const { exec } = require("../app/core/executer");
const executer = rewire("../app/core/executer");
const gatherFiles = executer.__get__("gatherFiles");

//test data
const testDirRoot = "WHEEL_TEST_TMP";
const projectRootDir = path.resolve(testDirRoot, "testProject.wheel");
const remoteHome = "/home/testuser";

//helper functions
const { componentJsonFilename, statusFilename, jobManagerJsonFilename } = require("../app/db/db");
const { createNewProject, updateComponent, createNewComponent  } = require("../app/core/projectFilesOperator");
const { replacePathsep } = require("../app/core/pathUtils");

const { scriptName, pwdCmd, scriptHeader, exit } = require("./testScript");
const scriptPwd = `${scriptHeader}\n${pwdCmd}`;

const { remoteHost } = require("../app/db/db");
const { addSsh } = require("../app/core/sshManager");


describe("UT for executer class", function() {
  this.timeout(0);
  let task0;
  beforeEach(async ()=>{
    await fs.remove(testDirRoot);
    await createNewProject(projectRootDir, "test project", null, "test", "test@example.com");
    task0 = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 10, y: 10 });
    await fs.outputFile(path.join(projectRootDir, task0.name, scriptName), `${scriptPwd}\n${exit(0)}`);
    task0 = await updateComponent(projectRootDir, task0.ID, "script", scriptName);
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
  });
  after(async ()=>{
    await fs.remove(testDirRoot);
  });
  describe("#local exec", ()=>{
    it("run shell script which returns 0 and status should be Finished", async ()=>{
      await exec(task0);
      expect(path.join(task0.workingDir, statusFilename)).to.be.a.file().with.content("finished\n0\nundefined");
      expect(task0.emitForDispatcher).to.be.calledOnceWith("taskCompleted", "finished");
    });
    it("run shell script which returns 1 and status should be failed", async ()=>{
      await fs.outputFile(path.join(projectRootDir, task0.name, scriptName), `${scriptPwd}\n${exit(1)}`);
      await exec(task0);
      expect(path.join(task0.workingDir, statusFilename)).to.be.a.file().with.content("failed\n1\nundefined");
      expect(task0.emitForDispatcher).to.be.calledOnceWith("taskCompleted", "failed");
    });
  });
  describe("run on remote host", ()=>{
    let ssh;
    const remotehostName = process.env.WHEEL_TEST_REMOTEHOST;
    const password = process.env.WHEEL_TEST_REMOTE_PASSWORD;
    before(async function() {
      if (!remotehostName) {
        console.log("remote exec test will be skipped because WHEEL_TEST_REMOTEHOST is not set");
        this.skip();
      }

      if (!password) {
        console.log("remote exec test will be done without password because WHEEL_TEST_REMOTE_PASSWORD is not set");
      }
      const hostInfo = remoteHost.query("name", remotehostName);
      hostInfo.password = password;
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

    describe("#gatherFiles", ()=>{
      beforeEach(async ()=>{
        await ssh.exec(`mkdir -p ${task0.remoteWorkingDir}`);
        await ssh.exec(`echo -n foo > ${task0.remoteWorkingDir}/foo`);
        await ssh.exec(`echo -n bar > ${task0.remoteWorkingDir}/bar`);
        await ssh.exec(`echo -n baz > ${task0.remoteWorkingDir}/baz`);
      });
      it("issue 462", async ()=>{
        task0.outputFiles = [{ name: "hu/ga", dst: [] }, { name: "ho/ge", dst: [] }];
        await gatherFiles(task0, ssh);
        expect(path.join(task0.workingDir, "hu/ga")).not.to.be.a.path();
        expect(path.join(task0.workingDir, "ho/ge")).not.to.be.a.path();
      });
    });
    describe("#remote exec", ()=>{
      it("run shell script which returns 0 and status should be Finished", async ()=>{
        await exec(task0);
        expect(path.join(task0.workingDir, statusFilename)).to.be.a.file().with.content("finished\n0\nundefined");
        expect(await ssh.ls(path.posix.join(remoteHome, task0.projectStartTime)))
          .to.have.members([task0.name]);
        expect(await ssh.ls(path.posix.join(remoteHome, task0.projectStartTime, task0.name))).to.have.members(["run.sh", componentJsonFilename]);
      });
      it("cleanup remote directory after successfully run", async ()=>{
        task0.doCleanup = true;
        await exec(task0);
        expect(path.join(task0.workingDir, statusFilename)).to.be.a.file().with.content("finished\n0\nundefined");
        expect(await ssh.ls(path.posix.join(remoteHome, task0.projectStartTime))).to.be.an("array").that.is.empty;
      });
      it("get outputFiles after successfully run", async ()=>{
        const task1 = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 10, y: 10 });
        task1.inputFiles = [{ name: "dummy", src: [{ srcNode: task0.ID, srcName: "hoge" }] }];
        task0.outputFiles = [{ name: "hoge", dst: [{ dstNode: task1.ID, dstName: "dummy" }] }];
        await fs.outputFile(path.join(projectRootDir, task0.name, scriptName), `${scriptPwd}\necho -n hoge > hoge\n${exit(0)}`);
        await exec(task0);
        expect(path.join(task0.workingDir, statusFilename)).to.be.a.file().with.content("finished\n0\nundefined");
        expect(path.join(task0.workingDir, "hoge")).to.be.a.file().with.content("hoge");
      });
      it("do nothing if outputFile is not found", async ()=>{
        task0.outputFiles = [{ name: "huga", dst: [] }];
        await fs.outputFile(path.join(projectRootDir, task0.name, scriptName), `${scriptPwd}\necho -n hoge > hoge\n${exit(0)}`);
        await exec(task0);
        expect(path.join(task0.workingDir, statusFilename)).to.be.a.file().with.content("finished\n0\nundefined");
        expect(path.join(task0.workingDir, "huga")).not.to.be.a.path();
      });
      it("run shell script which returns 1 and status should be failed", async ()=>{
        await fs.outputFile(path.join(projectRootDir, task0.name, scriptName), `${scriptPwd}\n${exit(1)}`);
        await exec(task0);
        expect(path.join(task0.workingDir, statusFilename)).to.be.a.file().with.content("failed\n1\nundefined");
      });
      it("do not cleanup remote directory after failed run", async ()=>{
        task0.doCleanup = true;
        await fs.outputFile(path.join(projectRootDir, task0.name, scriptName), `${scriptPwd}\n${exit(1)}`);
        await exec(task0);
        expect(path.join(task0.workingDir, statusFilename)).to.be.a.file().with.content("failed\n1\nundefined");
        expect(await ssh.ls(path.posix.join(remoteHome, task0.projectStartTime)))
          .to.have.members([task0.name]);
        expect(await ssh.ls(path.posix.join(remoteHome, task0.projectStartTime, task0.name))).to.have.members(["run.sh", componentJsonFilename]);
      });
      it("do not get outputFiles after failed run", async ()=>{
        task0.outputFiles = [{ name: "hoge" }];
        await fs.outputFile(path.join(projectRootDir, task0.name, scriptName), `${scriptPwd}\necho -n hoge > hoge\n${exit(1)}`);
        await exec(task0);
        expect(path.join(task0.workingDir, statusFilename)).to.be.a.file().with.content("failed\n1\nundefined");
        expect(path.join(task0.workingDir, "hoge")).not.to.be.a.path();
      });
    });
    describe.skip("#remote job (test bed has some trouble never run jobs on it)", ()=>{
      beforeEach(()=>{
        task0.useJobScheduler = true;
      });
      it("run shell script which returns 0 and status should be Finished", async ()=>{
        await exec(task0);
        //92 means job was successfully finished on PBS Pro
        expect(path.join(task0.workingDir, statusFilename)).to.be.a.file().with.content("finished\n0\n92");
        const remotehostID = process.env.WHEEL_TEST_REMOTEHOST;
        const hostInfo = remoteHost.query("name", remotehostID);
        const hostname = hostInfo.host;
        const JS = hostInfo.jobScheduler;
        expect(path.resolve(projectRootDir, `${hostname}-${JS}.${jobManagerJsonFilename}`)).not.to.be.a.path();
      });
      it("run shell script which returns 1 and status should be failed", async ()=>{
        await fs.outputFile(path.join(projectRootDir, task0.name, scriptName), `${scriptPwd}\n${exit(1)}`);
        await exec(task0);
        //93 means job was finished but failed on PBS Pro
        expect(path.join(task0.workingDir, statusFilename)).to.be.a.file().with.content("failed\n1\n93");
        const remotehostID = process.env.WHEEL_TEST_REMOTEHOST;
        const hostInfo = remoteHost.query("name", remotehostID);
        const hostname = hostInfo.host;
        const JS = hostInfo.jobScheduler;
        expect(path.resolve(projectRootDir, `${hostname}-${JS}.${jobManagerJsonFilename}`)).not.to.be.a.path();
      });
      it("add submit option", async ()=>{
        task0.submitOption = "-N testjob";
        await exec(task0);
        //92 means job was successfully finished on PBS Pro
        expect(path.join(task0.workingDir, statusFilename)).to.be.a.file().with.content("finished\n0\n92");
        const remotehostID = process.env.WHEEL_TEST_REMOTEHOST;
        const hostInfo = remoteHost.query("name", remotehostID);
        const hostname = hostInfo.host;
        const JS = hostInfo.jobScheduler;
        expect(path.resolve(projectRootDir, `${hostname}-${JS}.${jobManagerJsonFilename}`)).not.to.be.a.path();
      });
    });
  });
});
