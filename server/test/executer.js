"use strict";
const path = require("path");
const fs = require("fs-extra");
const ARssh2 = require("arssh2-client");

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
const { createNewProject } = require("../app/core/projectFilesOperator");
const { updateComponent, createNewComponent } = require("../app/core/componentFilesOperator");
const { replacePathsep } = require("../app/core/pathUtils");

const { scriptName, pwdCmd, scriptHeader, exit } = require("./testScript");
const scriptPwd = `${scriptHeader}\n${pwdCmd}`;

const { remoteHost } = require("../app/db/db");
const { addSsh, createSshConfig } = require("../app/core/sshManager");


describe("UT for executer class", function() {
  this.timeout(0);
  let task0;
  beforeEach(async()=>{
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
    //task0.doCleanup = task0.cleanupFlag === "0";
    //task0.ancestorsType = this.ancestorsType;
    //task.parentType = this.cwfJson.type;
  });
  after(async()=>{
    await fs.remove(testDirRoot);
  });
  describe("#local exec", ()=>{
    it("run shell script which returns 0 and status should be Finished", async()=>{
      await exec(task0);
      expect(path.join(task0.workingDir, statusFilename)).to.be.a.file().with.content("finished\n0\nundefined");
    });
    it("run shell script which returns 1 and status should be failed", async()=>{
      await fs.outputFile(path.join(projectRootDir, task0.name, scriptName), `${scriptPwd}\n${exit(1)}`);
      await exec(task0);
      expect(path.join(task0.workingDir, statusFilename)).to.be.a.file().with.content("failed\n1\nundefined");
    });
  });
  describe("run on remote host", ()=>{
    let arssh;
    before(async function() {
      const remotehostID = process.env.WHEEL_TEST_REMOTEHOST;
      const password = process.env.WHEEL_TEST_REMOTE_PASSWORD;
      if (!remotehostID) {
        console.log("WHEEL_TEST_REMOTEHOST is not set so remote exec test is skipped");
        this.skip();
      }
      if (!password) {
        console.log("WHEEL_TEST_REMOTE_PASSWORD is not set so remote exec test is skipped");
        this.skip();
      }
      const hostInfo = remoteHost.query("name", remotehostID);
      const sshConfig = await createSshConfig(hostInfo, password);
      arssh = new ARssh2(sshConfig, { connectionRetry: 1, connectionRetryDelay: 2000 });

      try {
        await arssh.canConnect();
        addSsh(projectRootDir, hostInfo, arssh);
      } catch (e) {
        console.log(`ssh connection failed to ${remotehostID} due to ${e} so remote exec test is skiiped`);
        this.skip();
      } finally {
        await arssh.disconnect();
      }
    });
    beforeEach(()=>{
      task0.host = "testServer";
      //following lines are from Executer.exec but planning to move to Dispatcher._dispatchTask()
      task0.remotehostID = remoteHost.getID("name", task0.host) || "localhost";
      task0.remoteWorkingDir = path.posix.join(remoteHome, task0.projectStartTime);
    });
    afterEach(async()=>{
      await arssh.exec(`rm -fr ${path.posix.join(remoteHome, task0.projectStartTime)}`);
    });
    after(async()=>{
      if (arssh) {
        await arssh.disconnect();
      }
    });

    describe("#gatherFiles", ()=>{
      beforeEach(async()=>{
        await arssh.mkdir_p(task0.remoteWorkingDir);
        await arssh.exec(`cd ${task0.remoteWorkingDir};(echo -n foo > foo && echo -n bar > bar && echo baz > baz)`);
      });
      it("issue 462", async()=>{
        task0.outputFiles = [{ name: "hu/ga" }, { name: "ho/ge" }];
        await gatherFiles(task0, arssh);
        expect(path.join(task0.workingDir, "hu/ga")).not.to.be.a.path();
        expect(path.join(task0.workingDir, "ho/ge")).not.to.be.a.path();
      });
    });
    describe("#remote exec", ()=>{
      it("run shell script which returns 0 and status should be Finished", async()=>{
        await exec(task0);
        expect(path.join(task0.workingDir, statusFilename)).to.be.a.file().with.content("finished\n0\nundefined");
        expect(await arssh.ls(path.posix.join(remoteHome, task0.projectStartTime)))
          .to.have.members([path.posix.join(remoteHome, task0.projectStartTime, task0.name)]);
        expect(await arssh.ls(path.posix.join(remoteHome, task0.projectStartTime, task0.name))).to.have.members([
          path.posix.join(remoteHome, task0.projectStartTime, task0.name, "run.sh"),
          path.posix.join(remoteHome, task0.projectStartTime, task0.name, componentJsonFilename)
        ]);
      });
      it("cleanup remote directory after successfully run", async()=>{
        task0.doCleanup = true;
        await exec(task0);
        expect(path.join(task0.workingDir, statusFilename)).to.be.a.file().with.content("finished\n0\nundefined");
        expect(await arssh.ls(path.posix.join(remoteHome, task0.projectStartTime))).to.be.an("array").that.is.empty;
      });
      it("get outputFiles after successfully run", async()=>{
        task0.outputFiles = [{ name: "hoge" }];
        await fs.outputFile(path.join(projectRootDir, task0.name, scriptName), `${scriptPwd}\necho -n hoge > hoge\n${exit(0)}`);
        await exec(task0);
        expect(path.join(task0.workingDir, statusFilename)).to.be.a.file().with.content("finished\n0\nundefined");
        expect(path.join(task0.workingDir, "hoge")).to.be.a.file().with.content("hoge");
      });
      it("do nothing if outputFile is not found", async()=>{
        task0.outputFiles = [{ name: "huga" }];
        await fs.outputFile(path.join(projectRootDir, task0.name, scriptName), `${scriptPwd}\necho -n hoge > hoge\n${exit(0)}`);
        await exec(task0);
        expect(path.join(task0.workingDir, statusFilename)).to.be.a.file().with.content("finished\n0\nundefined");
        expect(path.join(task0.workingDir, "huga")).not.to.be.a.path();
      });
      it("run shell script which returns 1 and status should be failed", async()=>{
        await fs.outputFile(path.join(projectRootDir, task0.name, scriptName), `${scriptPwd}\n${exit(1)}`);
        await exec(task0);
        expect(path.join(task0.workingDir, statusFilename)).to.be.a.file().with.content("failed\n1\nundefined");
      });
      it("do not cleanup remote directory after failed run", async()=>{
        task0.doCleanup = true;
        await fs.outputFile(path.join(projectRootDir, task0.name, scriptName), `${scriptPwd}\n${exit(1)}`);
        await exec(task0);
        expect(path.join(task0.workingDir, statusFilename)).to.be.a.file().with.content("failed\n1\nundefined");
        expect(await arssh.ls(path.posix.join(remoteHome, task0.projectStartTime)))
          .to.have.members([path.posix.join(remoteHome, task0.projectStartTime, task0.name)]);
        expect(await arssh.ls(path.posix.join(remoteHome, task0.projectStartTime, task0.name))).to.have.members([
          path.posix.join(remoteHome, task0.projectStartTime, task0.name, "run.sh"),
          path.posix.join(remoteHome, task0.projectStartTime, task0.name, componentJsonFilename)
        ]);
      });
      it("do not get outputFiles after failed run", async()=>{
        task0.outputFiles = [{ name: "hoge" }];
        await fs.outputFile(path.join(projectRootDir, task0.name, scriptName), `${scriptPwd}\necho -n hoge > hoge\n${exit(1)}`);
        await exec(task0);
        expect(path.join(task0.workingDir, statusFilename)).to.be.a.file().with.content("failed\n1\nundefined");
        expect(path.join(task0.workingDir, "hoge")).not.to.be.a.path();
      });
    });
    describe("#remote job", ()=>{
      beforeEach(()=>{
        task0.useJobScheduler = true;
      });
      it("run shell script which returns 0 and status should be Finished", async()=>{
        await exec(task0);
        //92 means job was successfully finished on PBS Pro
        expect(path.join(task0.workingDir, statusFilename)).to.be.a.file().with.content("finished\n0\n92");
        const remotehostID = process.env.WHEEL_TEST_REMOTEHOST;
        const hostInfo = remoteHost.query("name", remotehostID);
        const hostname = hostInfo.host;
        const JS = hostInfo.jobScheduler;
        expect(path.resolve(projectRootDir, `${hostname}-${JS}.${jobManagerJsonFilename}`)).not.to.be.a.path();
      });
      it("run shell script which returns 1 and status should be failed", async()=>{
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
      it("add submit option", async()=>{
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
