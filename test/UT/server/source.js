const path = require("path");
const fs = require("fs-extra");
const os = require("os");

//setup test framework
const chai = require("chai");
const expect = chai.expect;
const sinon = require("sinon");
chai.use(require("sinon-chai"));
chai.use(require("chai-fs"));
chai.use(require("chai-json-schema"));

//display detailed information of unhandled rejection
process.on("unhandledRejection", console.dir);

//testee
const { runProject, setLogger } = require("../../../app/core/projectResource");

//test data
const testDirRoot = "WHEEL_TEST_TMP";
const projectRootDir = path.resolve(testDirRoot, "testProject.wheel");

//helper functions
const { projectJsonFilename, componentJsonFilename } = require("../../../app/db/db");
const { createNewProject } = require("../../../app/core/projectFilesOperator");
const { updateComponent, createNewComponent, addInputFile, addOutputFile, addFileLink, renameOutputFile } = require("../../../app/core/componentFilesOperator");

const { scriptName, pwdCmd, scriptHeader } = require("./testScript");
const scriptPwd = `${scriptHeader}\n${pwdCmd}`;

//stubs
const dummyLogger = {
  error: ()=>{},
  warn: ()=>{},
  info: ()=>{},
  debug: ()=>{},
  trace: ()=>{},
  stdout: sinon.stub(),
  stderr: sinon.stub(),
  sshout: sinon.stub(),
  ssherr: sinon.stub()
};
// dummyLogger.error = console.log;
// dummyLogger.warn = console.log;
// dummyLogger.info = console.log;
// dummyLogger.debug = console.log;
// dummyLogger.trace = console.log;


describe("UT for source component", function() {
  this.timeout(0);
  beforeEach(async()=>{
    await fs.remove(testDirRoot);
    dummyLogger.stdout.reset();
    dummyLogger.stderr.reset();
    dummyLogger.sshout.reset();
    dummyLogger.ssherr.reset();
    setLogger(projectRootDir, dummyLogger);
    await createNewProject(projectRootDir, "test project", null, "test", "test@example.com");
    const source0 = await createNewComponent(projectRootDir, projectRootDir, "source", { x: 11, y: 11 });
    await fs.outputFile(path.join(projectRootDir, "source0", "foo"), "foo");
    await renameOutputFile(projectRootDir, source0.ID, 0, "foo");
    const task0 = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 10, y: 10 });
    await updateComponent(projectRootDir, task0.ID, "script", scriptName);
    await addInputFile(projectRootDir, task0.ID, "bar");
    await fs.outputFile(path.join(projectRootDir, "task0", scriptName), scriptPwd);
    await addFileLink(projectRootDir,source0.ID, "foo", task0.ID, "bar");
  });
  after(async()=>{
    await fs.remove(testDirRoot);
  });
  describe("#runProject", ()=>{
    it("should copy foo to task0/bar", async ()=>{
      await runProject(projectRootDir);
      expect(path.resolve(projectRootDir, "task0", "bar")).to.be.a.file().with.contents("foo");
        expect(dummyLogger.stdout).to.have.been.calledOnce;
        expect(dummyLogger.stdout).to.have.been.calledWithMatch(path.resolve(projectRootDir, "task0"));
        expect(dummyLogger.stderr).not.to.have.been.called;
        expect(dummyLogger.sshout).not.to.have.been.called;
        expect(dummyLogger.ssherr).not.to.have.been.called;
        expect(path.resolve(projectRootDir, projectJsonFilename)).to.be.a.file().with.json.using.schema({
          required: ["state"],
          properties: {
            state: { enum: ["finished"] }
          }
        });
        expect(path.resolve(projectRootDir, componentJsonFilename)).to.be.a.file().with.json.using.schema({
          required: ["state"],
          properties: {
            state: { enum: ["finished"] }
          }
        });
        expect(path.resolve(projectRootDir, "task0", componentJsonFilename)).to.be.a.file().with.json.using.schema({
          required: ["state", "ancestorsName"],
          properties: {
            state: { enum: ["finished"] },
            ancestorsName: { enum: [""] }
          }
        });
    });
  });
});

