/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import path from "path";
import fs from "fs-extra";
import SshClientWrapper from "ssh-client-wrapper";

//setup test framework
import * as chai from "chai";
const expect = chai.expect;
import sinon from "sinon";
import sinonChai from "sinon-chai";
chai.use(sinonChai);
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
import Ajv from "ajv";
const ajv = new Ajv({ strict: false });

//test data
const testDirRoot = "WHEEL_TEST_TMP";
const projectRootDir = path.resolve(testDirRoot, "testProject.wheel");
//testee
import Dispatcher, { replaceByNunjucksForBulkjob, writeParameterSetFile, addGatherFilesToRemoteTasks } from "../../../app/core/dispatcher.js";
import { eventEmitters } from "../../../app/core/global.js";

//helper functions
import { projectJsonFilename, componentJsonFilename } from "../../../app/db/db.js";
import { createNewProject } from "../../../app/core/projectOperations.js";
import { updateComponentProperty } from "../../testUtil.js";
import { createNewComponent } from "../../../app/core/componentOperations.js";
import { removeExecuters } from "../../../app/core/executerManager.js";
import { removeTransferrers } from "../../../app/core/transferManager.js";
import { addInputFile, addOutputFile, renameOutputFile, toggleInputFileMandatory } from "../../../app/core/componentFiles.js";
import { addLink, addFileLink } from "../../../app/core/componentLinks.js";
import { validateComponents } from "../../../app/core/validateComponents.js";
import { scriptName, pwdCmd, scriptHeader } from "../../testScript.js";
const scriptPwd = `${scriptHeader}\n${pwdCmd}`;
const wait = ()=>{
  return new Promise((resolve)=>{
    setTimeout(resolve, 10);
  });
};

import { remoteHost } from "../../../app/db/db.js";
import { addSsh } from "../../../app/core/sshManager.js";
import { _internal } from "../../../app/logSettings.js";
import { _internal as deliverFileInternal } from "../../../app/core/deliverFile.js";

describe("UT for Dispatcher class", function () {
  this.timeout(0);
  let rootWF;
  let projectJson;

  beforeEach(async ()=>{
    await fs.remove(testDirRoot);
    await createNewProject(projectRootDir, "test project", null, "test", "test@example.com");
    rootWF = await fs.readJson(path.resolve(projectRootDir, componentJsonFilename));
    eventEmitters.set(projectRootDir, { emit: sinon.stub() });
  });
  afterEach(()=>{
    eventEmitters.delete(projectRootDir);
  });
  after(async ()=>{
    if (!process.env.WHEEL_KEEP_FILES_AFTER_LAST_TEST) {
      await fs.remove(testDirRoot);
    }
  });

  describe("#replaceByNunjucksForBulkjob test", async ()=>{
    const templateRoot = path.resolve(testDirRoot, "templates");
    const targetFiles = ["template1.txt", "template2.txt"];
    const params = { key1: "value1", key2: "value2" };
    const bulkNumber = 42;
    const templates = {
      "template1.txt": "Hello, {{ key1 }}!",
      "template2.txt": "Goodbye, {{ key2 }}!"
    };

    beforeEach(async function () {
      await fs.ensureDir(templateRoot);

      for (const [file, content] of Object.entries(templates)) {
        await fs.outputFile(path.join(templateRoot, file), content);
      }
    });
    afterEach(async function () {
      await fs.remove(testDirRoot);
    });
    it("should replace target files and save with new filenames", async function () {
      await replaceByNunjucksForBulkjob(templateRoot, targetFiles, params, bulkNumber);
      const newFile1 = path.resolve(templateRoot, `${bulkNumber}.template1.txt`);
      const newFile2 = path.resolve(templateRoot, `${bulkNumber}.template2.txt`);
      expect(fs.statSync(newFile1).isFile()).to.be.true;
      expect(fs.readFileSync(newFile1, "utf-8")).to.equal("Hello, value1!");
      expect(fs.statSync(newFile2).isFile()).to.be.true;
      expect(fs.readFileSync(newFile2, "utf-8")).to.equal("Goodbye, value2!");
    });
    it("should throw an error if a target file does not exist", async function () {
      const invalidFiles = ["template1.txt", "nonexistent.txt"];
      try {
        await replaceByNunjucksForBulkjob(templateRoot, invalidFiles, params, bulkNumber);
      } catch (err) {
        expect(err).to.be.an.instanceof(Error);
        return;
      }
      expect.fail("should have thrown an error");
    });
    it("should handle empty targetFiles gracefully", async function () {
      await replaceByNunjucksForBulkjob(templateRoot, [], params, bulkNumber);
      //ファイルが作成されていないことを確認
      const files = await fs.readdir(templateRoot);
      expect(files).to.have.members(Object.keys(templates));
    });
  });

  describe("writeParameterSetFile test", function () {
    const templateRoot = path.resolve(testDirRoot, "templates");
    const targetFiles = ["file1.txt", "file2.txt"];
    const params = { key1: "value1", key2: "value2" };
    const bulkNumber = 42;
    beforeEach(async function () {
      await fs.ensureDir(templateRoot);

      for (const file of targetFiles) {
        await fs.outputFile(path.join(templateRoot, file), "content");
      }
    });
    afterEach(async function () {
      await fs.remove(testDirRoot);
    });
    it("should write parameters to parameterSet.wheel.txt", async function () {
      const parameterSetFilePath = path.resolve(templateRoot, "parameterSet.wheel.txt");
      await writeParameterSetFile(templateRoot, targetFiles, params, bulkNumber);
      expect(fs.statSync(parameterSetFilePath).isFile()).to.be.true;
      const expectedContent = [
        `BULKNUM_${bulkNumber}_TARGETNUM_0_FILE="./file1.txt"`,
        `BULKNUM_${bulkNumber}_TARGETNUM_0_KEY="key1"`,
        `BULKNUM_${bulkNumber}_TARGETNUM_0_VALUE="value1"`,
        `BULKNUM_${bulkNumber}_TARGETNUM_1_FILE="./file2.txt"`,
        `BULKNUM_${bulkNumber}_TARGETNUM_1_KEY="key2"`,
        `BULKNUM_${bulkNumber}_TARGETNUM_1_VALUE="value2"`
      ].join("\n") + "\n";
      const actualContent = await fs.readFile(parameterSetFilePath, "utf-8");
      expect(actualContent).to.equal(expectedContent);
    });
    it("should handle empty targetFiles gracefully", async function () {
      const parameterSetFilePath = path.resolve(templateRoot, "parameterSet.wheel.txt");
      await writeParameterSetFile(templateRoot, [], {}, bulkNumber);
      expect(fs.existsSync(parameterSetFilePath)).to.be.false;
    });
    it("should append parameters to an existing file", async function () {
      const parameterSetFilePath = path.resolve(templateRoot, "parameterSet.wheel.txt");
      await fs.outputFile(parameterSetFilePath, "Initial content\n");
      await writeParameterSetFile(templateRoot, targetFiles, params, bulkNumber);
      const expectedContent = [
        `BULKNUM_${bulkNumber}_TARGETNUM_0_FILE="./file1.txt"`,
        `BULKNUM_${bulkNumber}_TARGETNUM_0_KEY="key1"`,
        `BULKNUM_${bulkNumber}_TARGETNUM_0_VALUE="value1"`,
        `BULKNUM_${bulkNumber}_TARGETNUM_1_FILE="./file2.txt"`,
        `BULKNUM_${bulkNumber}_TARGETNUM_1_KEY="key2"`,
        `BULKNUM_${bulkNumber}_TARGETNUM_1_VALUE="value2"`
      ].join("\n") + "\n";
      const actualContent = await fs.readFile(parameterSetFilePath, "utf-8");
      expect(actualContent).to.equal(expectedContent);
    });
    it("should throw an error if a file cannot be written", async function () {
      const nonWritableDir = path.resolve(testDirRoot, "nonWritable");
      await fs.ensureDir(nonWritableDir);
      await fs.chmod(nonWritableDir, 0o400); //読み取り専用に設定
      const invalidTemplateRoot = path.join(nonWritableDir, "templates");
      try {
        await writeParameterSetFile(invalidTemplateRoot, targetFiles, params, bulkNumber);
      } catch (err) {
        expect(err).to.be.an.instanceof(Error);
        return;
      }
      expect.fail("should have thrown an error");
      //権限を元に戻してディレクトリを削除
      await fs.chmod(nonWritableDir, 0o700);
      await fs.remove(nonWritableDir);
    });
  });

  describe("addGatherFilesToRemoteTasks test", function () {
    const instanceRoot = path.resolve(testDirRoot, "instance");
    const taskRelDir = "task0";
    const taskDir = path.join(instanceRoot, taskRelDir);
    const logger = ()=>{};

    beforeEach(async function () {
      await fs.ensureDir(taskDir);
    });
    afterEach(async function () {
      await fs.remove(testDirRoot);
    });

    /**
     * Write a minimal task component JSON to taskDir.
     * @param {object} overrides - properties to merge into the default task JSON
     */
    async function writeTaskJson(overrides = {}) {
      const base = {
        type: "task",
        name: "task0",
        host: "remoteServer",
        include: [],
        exclude: [],
        outputFiles: []
      };
      await fs.writeJson(path.join(taskDir, "cmp.wheel.json"), { ...base, ...overrides });
    }

    it("should add rendered srcName to include for a remote task", async function () {
      await writeTaskJson();
      const gatherRecipe = [{ srcNode: taskRelDir, srcName: "result_{{ N }}", dstName: "out/result_{{ N }}" }];
      const params = { N: 1 };
      await addGatherFilesToRemoteTasks(projectRootDir, instanceRoot, gatherRecipe, params, logger);
      const updated = await fs.readJson(path.join(taskDir, "cmp.wheel.json"));
      expect(updated.include).to.include("result_1");
    });

    it("should remove the rendered srcName from exclude if present", async function () {
      await writeTaskJson({ exclude: ["result_1", "other.dat"] });
      const gatherRecipe = [{ srcNode: taskRelDir, srcName: "result_{{ N }}", dstName: "out/" }];
      const params = { N: 1 };
      await addGatherFilesToRemoteTasks(projectRootDir, instanceRoot, gatherRecipe, params, logger);
      const updated = await fs.readJson(path.join(taskDir, "cmp.wheel.json"));
      expect(updated.exclude).to.not.include("result_1");
      expect(updated.exclude).to.include("other.dat");
      expect(updated.include).to.include("result_1");
    });

    it("should skip entries without srcNode", async function () {
      await writeTaskJson();
      const gatherRecipe = [{ srcName: "result.dat", dstName: "out/result.dat" }];
      const params = {};
      await addGatherFilesToRemoteTasks(projectRootDir, instanceRoot, gatherRecipe, params, logger);
      const updated = await fs.readJson(path.join(taskDir, "cmp.wheel.json"));
      expect(updated.include).to.be.empty;
    });

    it("should skip local tasks", async function () {
      await writeTaskJson({ host: "localhost" });
      const gatherRecipe = [{ srcNode: taskRelDir, srcName: "result.dat", dstName: "out/result.dat" }];
      const params = {};
      await addGatherFilesToRemoteTasks(projectRootDir, instanceRoot, gatherRecipe, params, logger);
      const updated = await fs.readJson(path.join(taskDir, "cmp.wheel.json"));
      expect(updated.include).to.be.empty;
    });

    it("should skip if srcName is already in outputFiles", async function () {
      await writeTaskJson({ outputFiles: [{ name: "result.dat", dst: [] }] });
      const gatherRecipe = [{ srcNode: taskRelDir, srcName: "result.dat", dstName: "out/result.dat" }];
      const params = {};
      await addGatherFilesToRemoteTasks(projectRootDir, instanceRoot, gatherRecipe, params, logger);
      const updated = await fs.readJson(path.join(taskDir, "cmp.wheel.json"));
      expect(updated.include).to.be.empty;
    });

    it("should not duplicate if srcName is already in include", async function () {
      await writeTaskJson({ include: ["result.dat"] });
      const gatherRecipe = [{ srcNode: taskRelDir, srcName: "result.dat", dstName: "out/result.dat" }];
      const params = {};
      await addGatherFilesToRemoteTasks(projectRootDir, instanceRoot, gatherRecipe, params, logger);
      const updated = await fs.readJson(path.join(taskDir, "cmp.wheel.json"));
      expect(updated.include.filter((e)=>{
        return e === "result.dat";
      })).to.have.lengthOf(1);
    });

    it("should handle an empty gatherRecipe without error", async function () {
      await writeTaskJson();
      await addGatherFilesToRemoteTasks(projectRootDir, instanceRoot, [], {}, logger);
      const updated = await fs.readJson(path.join(taskDir, "cmp.wheel.json"));
      expect(updated.include).to.be.empty;
    });
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
      await updateComponentProperty(projectRootDir, storage.ID, "storagePath", storageArea);
      projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
    });
    it("should make link from outputFile to inputFile", async ()=>{
      await addOutputFile(projectRootDir, previous.ID, "a");
      await addInputFile(projectRootDir, next.ID, "b");
      await addFileLink(projectRootDir, previous.ID, "a", next.ID, "b");
      await fs.outputFile(path.resolve(projectRootDir, previous.name, "a"), "hoge");
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      expect(fs.existsSync(path.resolve(projectRootDir, next.name, "a"))).to.be.false;
      expect(fs.statSync(path.resolve(projectRootDir, next.name, "b")).isFile()).to.be.true;
      expect(fs.readFileSync(path.resolve(projectRootDir, next.name, "b"), "utf-8")).to.equal(fs.readFileSync(path.resolve(projectRootDir, previous.name, "a"), "utf-8"));
    });
    it("should do nothing if outputFile has glob which match nothing", async ()=>{
      await addOutputFile(projectRootDir, previous.ID, "a*");
      await addInputFile(projectRootDir, next.ID, "b");
      await addFileLink(projectRootDir, previous.ID, "a*", next.ID, "b");
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      expect(fs.existsSync(path.resolve(projectRootDir, next.name, "b"))).to.be.false;
      expect(fs.existsSync(path.resolve(projectRootDir, next.name, "a*"))).to.be.false;
    });
    it("should accept environment variable as part of outputFile name ", async ()=>{
      await addOutputFile(projectRootDir, previous.ID, "{{ WHEEL_CURRENT_INDEX }}a");
      await addInputFile(projectRootDir, next.ID, "b");
      await addFileLink(projectRootDir, previous.ID, "{{ WHEEL_CURRENT_INDEX }}a", next.ID, "b");
      await fs.outputFile(path.resolve(projectRootDir, previous.name, "3a"), "hoge");
      projectJson.env = { WHEEL_CURRENT_INDEX: 3 };
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, projectJson.env, "");
      expect(await DP.start()).to.be.equal("finished");
      expect(fs.existsSync(path.resolve(projectRootDir, next.name, "3a"))).to.be.false;
      expect(fs.statSync(path.resolve(projectRootDir, next.name, "b")).isFile()).to.be.true;
      expect(fs.readFileSync(path.resolve(projectRootDir, next.name, "b"), "utf-8")).to.equal(fs.readFileSync(path.resolve(projectRootDir, previous.name, "3a"), "utf-8"));
    });
    it("should accept environment variable as part of inputFile name ", async ()=>{
      await addOutputFile(projectRootDir, previous.ID, "a");
      await addInputFile(projectRootDir, next.ID, "b{{ WHEEL_CURRENT_INDEX }}");
      await addFileLink(projectRootDir, previous.ID, "a", next.ID, "b{{ WHEEL_CURRENT_INDEX }}");
      await fs.outputFile(path.resolve(projectRootDir, previous.name, "a"), "hoge");
      projectJson.env = { WHEEL_CURRENT_INDEX: "hoge" };
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, projectJson.env, "");
      expect(await DP.start()).to.be.equal("finished");
      expect(fs.existsSync(path.resolve(projectRootDir, next.name, "a"))).to.be.false;
      expect(fs.statSync(path.resolve(projectRootDir, next.name, "bhoge")).isFile()).to.be.true;
      expect(fs.readFileSync(path.resolve(projectRootDir, next.name, "bhoge"), "utf-8")).to.equal(fs.readFileSync(path.resolve(projectRootDir, previous.name, "a"), "utf-8"));
    });
    it("should copy files from storage component's outputFile to inputFile", async ()=>{
      await addOutputFile(projectRootDir, storage.ID, "a");
      await addInputFile(projectRootDir, next.ID, "b");
      await addFileLink(projectRootDir, storage.ID, "a", next.ID, "b");
      await fs.outputFile(path.join(storageArea, "a"), "hoge");
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      expect(fs.existsSync(path.resolve(projectRootDir, next.name, "a"))).to.be.false;
      expect(fs.statSync(path.resolve(projectRootDir, next.name, "b")).isFile()).to.be.true;
      expect(fs.readFileSync(path.resolve(projectRootDir, next.name, "b"), "utf-8")).to.equal(fs.readFileSync(path.resolve(storageArea, "a"), "utf-8"));
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
      expect(fs.existsSync(path.resolve(projectRootDir, storage.name, "a"))).to.be.false;
      expect(fs.existsSync(path.resolve(projectRootDir, storage.name, "b"))).to.be.false;
      expect(fs.statSync(path.resolve(storageArea, "b")).isFile()).to.be.true;
      expect(fs.readFileSync(path.resolve(storageArea, "b"), "utf-8")).to.equal(fs.readFileSync(path.resolve(projectRootDir, previous.name, "a"), "utf-8"));
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
        if (!hostInfo) {
          console.log(`remote exec test will be skipped because host '${remotehostName}' is not found in remoteHost database`);
          this.skip();
        }
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
          await updateComponentProperty(projectRootDir, storage.ID, "host", remotehostName);
          await updateComponentProperty(projectRootDir, storage.ID, "storagePath", remoteStorageArea);
          await addOutputFile(projectRootDir, storage.ID, "a");
          await addInputFile(projectRootDir, next.ID, "b");
          await addFileLink(projectRootDir, storage.ID, "a", next.ID, "b");
          await ssh.exec(`mkdir -p ${remoteStorageArea} && echo hoge > ${remoteStorageArea}/a`);
        });
        it("should deliver file as real file", async ()=>{
          const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
          expect(await DP.start()).to.be.equal("finished");
          expect(fs.existsSync(path.resolve(projectRootDir, next.name, "a"))).to.be.false;
          expect(fs.statSync(path.resolve(projectRootDir, next.name, "b")).isFile()).to.be.true;
          const stats = await fs.lstat(path.resolve(projectRootDir, next.name, "b"));
          expect(stats.isSymbolicLink()).to.be.false;
        });
      });
      describe("shared storage between localhost and remote host", function () {
        const sharedStorageOnRemote = "/data/shared";
        //Use /mnt/shared in Docker container, /tmp/WHEEL_TEST/shared on native host
        //Both are mounted to the same host directory via compose.yml
        const sharedStorageOnLocal = fs.existsSync("/mnt/shared") ? "/mnt/shared" : "/tmp/WHEEL_TEST/shared";

        const storageArea0 = path.resolve(sharedStorageOnLocal, "storage0");
        const storageArea2 = path.resolve(sharedStorageOnLocal, "storage2");
        let storage0;
        let task1;
        let storage2;

        beforeEach(async ()=>{
          //Pre-cleanup: ensure clean state even if a previous afterEach failed silently.
          //Must handle cross-ownership: testuser (SSH) creates dirs owned by UID 1000, runner creates dirs owned by UID 1001.
          //SSH: chmod testuser-owned dirs to 777 so runner can delete their contents, then delete what testuser can.
          await ssh.exec(`find ${sharedStorageOnRemote} -mindepth 1 -type d -exec chmod 777 {} \\; 2>/dev/null; find ${sharedStorageOnRemote} -mindepth 1 -delete 2>/dev/null; rm -rf /home/testuser/dummy_start_time 2>/dev/null`);
          //Local: clean up runner-owned files and testuser dirs that are now world-writable.
          await fs.emptyDir(sharedStorageOnLocal);

          storage0 = await createNewComponent(projectRootDir, projectRootDir, "storage", { x: 0, y: 0 });
          task1 = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 10, y: 0 });
          storage2 = await createNewComponent(projectRootDir, projectRootDir, "storage", { x: 20, y: 0 });
          projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
          await updateComponentProperty(projectRootDir, storage0.ID, "storagePath", storageArea0);
          await updateComponentProperty(projectRootDir, storage2.ID, "storagePath", storageArea2);
          //Create script that produces output file
          const script = `${scriptHeader}\ncat in0.txt > out1.txt`;
          await fs.outputFile(path.resolve(projectRootDir, task1.name, scriptName), script);
          await updateComponentProperty(projectRootDir, task1.ID, "script", scriptName);
          await addOutputFile(projectRootDir, storage0.ID, "out0.txt");
          await addInputFile(projectRootDir, task1.ID, "in0.txt");
          await addFileLink(projectRootDir, storage0.ID, "out0.txt", task1.ID, "in0.txt");
          await addOutputFile(projectRootDir, task1.ID, "out1.txt");
          await addInputFile(projectRootDir, storage2.ID, "in1.txt");
          await addFileLink(projectRootDir, task1.ID, "out1.txt", storage2.ID, "in1.txt");

          //Create shared storage directory
          await fs.ensureDir(sharedStorageOnLocal);
          await ssh.exec(`mkdir -p ${sharedStorageOnRemote}`);

          //Setup remotehost with sharedWithLocalhost (already configured in remotehost.json)
          const hostInfo = remoteHost.query("name", remotehostName);
          hostInfo.sharedWithLocalhost = true;
          hostInfo.localSharedPath = sharedStorageOnLocal; //Use the actual local path
          hostInfo.sharedPath = sharedStorageOnRemote;
        });

        afterEach(async ()=>{
          //Cross-ownership cleanup: chmod testuser-owned dirs to 777 so runner can delete contents,
          //then SSH delete testuser files, then local delete runner files.
          const remoteHostInfo = remoteHost.query("name", remotehostName);
          const remoteTaskBaseDir = remoteHostInfo ? `${remoteHostInfo.path}/dummy_start_time` : "/home/testuser/dummy_start_time";
          await ssh.exec(`find ${sharedStorageOnRemote} -mindepth 1 -type d -exec chmod 777 {} \\; 2>/dev/null; find ${sharedStorageOnRemote} -mindepth 1 -delete 2>/dev/null; rm -rf ${remoteTaskBaseDir} 2>/dev/null`);
          await fs.emptyDir(sharedStorageOnLocal);

          //Clean up global state to prevent interference with other tests
          removeExecuters(projectRootDir);
          removeTransferrers(projectRootDir);

          //Reset hostInfo to clean state
          const hostInfo = remoteHost.query("name", remotehostName);
          if (hostInfo) {
            delete hostInfo.sharedWithLocalhost;
            delete hostInfo.localSharedPath;
            delete hostInfo.sharedPath;
          }
        });

        it("should deliver files from localhost storage to remote via shared storage", async ()=>{
          //Setup: storage0 on localhost (shared), task1 on remote, storage2 on remote (shared)
          await updateComponentProperty(projectRootDir, task1.ID, "host", remotehostName);
          await updateComponentProperty(projectRootDir, storage2.ID, "host", remotehostName);
          await updateComponentProperty(projectRootDir, storage2.ID, "storagePath", `${sharedStorageOnRemote}/storage2`);
          await fs.ensureDir(storageArea0);
          await fs.chmod(storageArea0, 0o777); //Allow testuser (container) to delete this directory during cleanup
          await fs.outputFile(path.resolve(storageArea0, "out0.txt"), "test data from localhost");

          const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy_start_time", projectJson.componentPath, {}, "");
          expect(await DP.start()).to.be.equal("finished");

          //Verify storage2 received file via shared storage (symlink on remote)
          const testCmd = `test -f /data/shared/storage2/in1.txt`;
          const rt = await ssh.exec(testCmd);
          expect(rt).to.equal(0);
        });

        it("should deliver files from remote storage to localhost via shared storage", async ()=>{
          //Setup: storage0 on remote, task1 on localhost, storage2 on localhost
          await updateComponentProperty(projectRootDir, storage0.ID, "host", remotehostName);
          await updateComponentProperty(projectRootDir, storage0.ID, "storagePath", `${sharedStorageOnRemote}/storage0`);
          await ssh.exec(`mkdir -p ${sharedStorageOnRemote}/storage0 && echo "test data from remote" > ${sharedStorageOnRemote}/storage0/out0.txt`);

          const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy_start_time", projectJson.componentPath, {}, "");
          expect(await DP.start()).to.be.equal("finished");

          //Verify task1 received file via symlink
          const task1InputPath = path.resolve(projectRootDir, task1.name, "in0.txt");
          expect(fs.existsSync(task1InputPath)).to.be.true;
        });

        it("should handle localhost storage -> remote task -> remote storage chain", async ()=>{
          //Setup: storage0 localhost (shared), task1 remote, storage2 remote (shared)
          await updateComponentProperty(projectRootDir, task1.ID, "host", remotehostName);
          await updateComponentProperty(projectRootDir, storage2.ID, "host", remotehostName);
          await updateComponentProperty(projectRootDir, storage2.ID, "storagePath", `${sharedStorageOnRemote}/storage2`);
          await fs.ensureDir(storageArea0);
          await fs.chmod(storageArea0, 0o777); //Allow testuser (container) to delete this directory during cleanup
          await fs.outputFile(path.resolve(storageArea0, "out0.txt"), "chain test");

          const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy_start_time", projectJson.componentPath, {}, "");
          expect(await DP.start()).to.be.equal("finished");

          //Verify storage2 received file via shared storage (remote to remote symlink)
          const testCmd = `test -f /data/shared/storage2/in1.txt`;
          const rt = await ssh.exec(testCmd);
          expect(rt).to.equal(0);
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
      await updateComponentProperty(projectRootDir, for0.ID, "start", 0);
      await updateComponentProperty(projectRootDir, for0.ID, "end", 2);
      await updateComponentProperty(projectRootDir, for0.ID, "step", 1);
      await updateComponentProperty(projectRootDir, for0.ID, "keep", 0);
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      await wait();
      expect(fs.existsSync(path.resolve(projectRootDir, `${for0.name}_0`))).to.be.false;
      expect(fs.existsSync(path.resolve(projectRootDir, `${for0.name}_1`))).to.be.false;
      expect(fs.existsSync(path.resolve(projectRootDir, `${for0.name}_2`))).to.be.false;
      expect(fs.existsSync(path.resolve(projectRootDir, `${for0.name}_3`))).to.be.false;
      const for0Json = await fs.readJson(path.resolve(projectRootDir, for0.name, componentJsonFilename));
      const schema = {
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
      };
      const validate = ajv.compile(schema);
      expect(validate(for0Json)).to.be.true;
    });

    it("should work with negative step number", async ()=>{
      await updateComponentProperty(projectRootDir, for0.ID, "end", 0);
      await updateComponentProperty(projectRootDir, for0.ID, "start", 2);
      await updateComponentProperty(projectRootDir, for0.ID, "step", -1);
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      expect(fs.statSync(path.resolve(projectRootDir, `${for0.name}_0`)).isDirectory()).to.be.true;
      expect(fs.statSync(path.resolve(projectRootDir, `${for0.name}_1`)).isDirectory()).to.be.true;
      expect(fs.statSync(path.resolve(projectRootDir, `${for0.name}_2`)).isDirectory()).to.be.true;
      expect(fs.existsSync(path.resolve(projectRootDir, `${for0.name}_3`))).to.be.false;
      const for0Json = await fs.readJson(path.resolve(projectRootDir, for0.name, componentJsonFilename));
      const schema = {
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
      };
      const validate = ajv.compile(schema);
      expect(validate(for0Json)).to.be.true;
    });
    it("should work with step number which is greater than 1", async ()=>{
      await updateComponentProperty(projectRootDir, for0.ID, "start", 1);
      await updateComponentProperty(projectRootDir, for0.ID, "end", 3);
      await updateComponentProperty(projectRootDir, for0.ID, "step", 2);
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      expect(fs.statSync(path.resolve(projectRootDir, `${for0.name}_1`)).isDirectory()).to.be.true;
      expect(fs.existsSync(path.resolve(projectRootDir, `${for0.name}_2`))).to.be.false;
      expect(fs.statSync(path.resolve(projectRootDir, `${for0.name}_3`)).isDirectory()).to.be.true;
      expect(fs.existsSync(path.resolve(projectRootDir, `${for0.name}_4`))).to.be.false;
      expect(fs.existsSync(path.resolve(projectRootDir, `${for0.name}_5`))).to.be.false;
      const for0Json = await fs.readJson(path.resolve(projectRootDir, for0.name, componentJsonFilename));
      const schema = {
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
      };
      const validate = ajv.compile(schema);
      expect(validate(for0Json)).to.be.true;
    });
    it("should work beyond 0", async ()=>{
      await updateComponentProperty(projectRootDir, for0.ID, "start", -1);
      await updateComponentProperty(projectRootDir, for0.ID, "end", 1);
      await updateComponentProperty(projectRootDir, for0.ID, "step", 1);
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      expect(fs.statSync(path.resolve(projectRootDir, `${for0.name}_-1`)).isDirectory()).to.be.true;
      expect(fs.statSync(path.resolve(projectRootDir, `${for0.name}_0`)).isDirectory()).to.be.true;
      expect(fs.statSync(path.resolve(projectRootDir, `${for0.name}_1`)).isDirectory()).to.be.true;
      expect(fs.existsSync(path.resolve(projectRootDir, `${for0.name}_2`))).to.be.false;
      const for0Json = await fs.readJson(path.resolve(projectRootDir, for0.name, componentJsonFilename));
      const schema = {
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
      };
      const validate = ajv.compile(schema);
      expect(validate(for0Json)).to.be.true;
    });
    it("should copy 3 times and back to original component", async ()=>{
      await updateComponentProperty(projectRootDir, for0.ID, "start", 0);
      await updateComponentProperty(projectRootDir, for0.ID, "end", 2);
      await updateComponentProperty(projectRootDir, for0.ID, "step", 1);
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      expect(fs.statSync(path.resolve(projectRootDir, `${for0.name}_0`)).isDirectory()).to.be.true;
      expect(fs.statSync(path.resolve(projectRootDir, `${for0.name}_1`)).isDirectory()).to.be.true;
      expect(fs.statSync(path.resolve(projectRootDir, `${for0.name}_2`)).isDirectory()).to.be.true;
      expect(fs.existsSync(path.resolve(projectRootDir, `${for0.name}_3`))).to.be.false;
      const for0Json = await fs.readJson(path.resolve(projectRootDir, for0.name, componentJsonFilename));
      const schema = {
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
      };
      const validate = ajv.compile(schema);
      expect(validate(for0Json)).to.be.true;
    });
    it("should copy 3 times and delete all", async ()=>{
      await updateComponentProperty(projectRootDir, for0.ID, "start", 0);
      await updateComponentProperty(projectRootDir, for0.ID, "end", 2);
      await updateComponentProperty(projectRootDir, for0.ID, "step", 1);
      await updateComponentProperty(projectRootDir, for0.ID, "keep", 0);
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      expect(fs.existsSync(path.resolve(projectRootDir, `${for0.name}_0`))).to.be.false;
      expect(fs.existsSync(path.resolve(projectRootDir, `${for0.name}_1`))).to.be.false;
      expect(fs.existsSync(path.resolve(projectRootDir, `${for0.name}_2`))).to.be.false;
      expect(fs.existsSync(path.resolve(projectRootDir, `${for0.name}_3`))).to.be.false;
      const for0Json = await fs.readJson(path.resolve(projectRootDir, for0.name, componentJsonFilename));
      const schema = {
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
      };
      const validate = ajv.compile(schema);
      expect(validate(for0Json)).to.be.true;
    });
    it("should copy 3 times and keep last", async ()=>{
      await updateComponentProperty(projectRootDir, for0.ID, "start", 0);
      await updateComponentProperty(projectRootDir, for0.ID, "end", 2);
      await updateComponentProperty(projectRootDir, for0.ID, "step", 1);
      await updateComponentProperty(projectRootDir, for0.ID, "keep", 1);
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      expect(fs.existsSync(path.resolve(projectRootDir, `${for0.name}_0`))).to.be.false;
      expect(fs.existsSync(path.resolve(projectRootDir, `${for0.name}_1`))).to.be.false;
      expect(fs.statSync(path.resolve(projectRootDir, `${for0.name}_2`)).isDirectory()).to.be.true;
      expect(fs.existsSync(path.resolve(projectRootDir, `${for0.name}_3`))).to.be.false;
      const for0Json = await fs.readJson(path.resolve(projectRootDir, for0.name, componentJsonFilename));
      const schema = {
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
      };
      const validate = ajv.compile(schema);
      expect(validate(for0Json)).to.be.true;
    });
    it("should copy 3 times and keep last 2", async ()=>{
      await updateComponentProperty(projectRootDir, for0.ID, "start", 0);
      await updateComponentProperty(projectRootDir, for0.ID, "end", 2);
      await updateComponentProperty(projectRootDir, for0.ID, "step", 1);
      await updateComponentProperty(projectRootDir, for0.ID, "keep", 2);
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      expect(fs.existsSync(path.resolve(projectRootDir, `${for0.name}_0`))).to.be.false;
      expect(fs.statSync(path.resolve(projectRootDir, `${for0.name}_1`)).isDirectory()).to.be.true;
      expect(fs.statSync(path.resolve(projectRootDir, `${for0.name}_2`)).isDirectory()).to.be.true;
      expect(fs.existsSync(path.resolve(projectRootDir, `${for0.name}_3`))).to.be.false;
      const for0Json = await fs.readJson(path.resolve(projectRootDir, for0.name, componentJsonFilename));
      const schema = {
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
      };
      const validate = ajv.compile(schema);
      expect(validate(for0Json)).to.be.true;
    });
  });

  describe("#Parameter Study", ()=>{
    let PS0;
    beforeEach(async ()=>{
      PS0 = await createNewComponent(projectRootDir, projectRootDir, "PS", { x: 10, y: 10 });
      await updateComponentProperty(projectRootDir, PS0.ID, "parameterFile", "input.txt.json");
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
      await updateComponentProperty(projectRootDir, PS0.ID, "deleteLoopInstance", true);
    });
    it("should delete all loop instance", async ()=>{
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      await wait();
      expect(fs.existsSync(path.resolve(projectRootDir, `${PS0.name}_KEYWORD1_1`))).to.be.false;
      expect(fs.existsSync(path.resolve(projectRootDir, `${PS0.name}_KEYWORD1_2`))).to.be.false;
      expect(fs.existsSync(path.resolve(projectRootDir, `${PS0.name}_KEYWORD1_3`))).to.be.false;
      const ps0Json = await fs.readJson(path.resolve(projectRootDir, PS0.name, componentJsonFilename));
      const schema = {
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
      };
      const validate = ajv.compile(schema);
      expect(validate(ps0Json)).to.be.true;
    });
  });
  describe("#Foreach component", ()=>{
    let foreach0;
    beforeEach(async ()=>{
      foreach0 = await createNewComponent(projectRootDir, projectRootDir, "foreach", { x: 10, y: 10 });
      projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
      await updateComponentProperty(projectRootDir, foreach0.ID, "indexList", ["foo", "bar", "baz", "fizz"]);
    });
    it("should copy 3 times and delete all component", async ()=>{
      await updateComponentProperty(projectRootDir, foreach0.ID, "keep", 0);
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      await wait();
      expect(fs.existsSync(path.resolve(projectRootDir, `${foreach0.name}_foo`))).to.be.false;
      expect(fs.existsSync(path.resolve(projectRootDir, `${foreach0.name}_bar`))).to.be.false;
      expect(fs.existsSync(path.resolve(projectRootDir, `${foreach0.name}_baz`))).to.be.false;
      expect(fs.existsSync(path.resolve(projectRootDir, `${foreach0.name}_fizz`))).to.be.false;
    });
    it("should copy 3 times and keep last component", async ()=>{
      await updateComponentProperty(projectRootDir, foreach0.ID, "keep", 1);
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      await wait();
      expect(fs.existsSync(path.resolve(projectRootDir, `${foreach0.name}_foo`))).to.be.false;
      expect(fs.existsSync(path.resolve(projectRootDir, `${foreach0.name}_bar`))).to.be.false;
      expect(fs.existsSync(path.resolve(projectRootDir, `${foreach0.name}_baz`))).to.be.false;
      expect(fs.statSync(path.resolve(projectRootDir, `${foreach0.name}_fizz`)).isDirectory()).to.be.true;
    });
    it("should copy 3 times and keep last 2 component", async ()=>{
      await updateComponentProperty(projectRootDir, foreach0.ID, "keep", 2);
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      await wait();
      expect(fs.existsSync(path.resolve(projectRootDir, `${foreach0.name}_foo`))).to.be.false;
      expect(fs.existsSync(path.resolve(projectRootDir, `${foreach0.name}_bar`))).to.be.false;
      expect(fs.statSync(path.resolve(projectRootDir, `${foreach0.name}_baz`)).isDirectory()).to.be.true;
      expect(fs.statSync(path.resolve(projectRootDir, `${foreach0.name}_fizz`)).isDirectory()).to.be.true;
    });
  });

  describe("#While component", ()=>{
    let while0;
    beforeEach(async ()=>{
      while0 = await createNewComponent(projectRootDir, projectRootDir, "while", { x: 10, y: 10 });
      projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
      await updateComponentProperty(projectRootDir, while0.ID, "condition", "WHEEL_CURRENT_INDEX < 3");
    });
    it("should copy 3 times and delete all component", async ()=>{
      await updateComponentProperty(projectRootDir, while0.ID, "keep", 0);
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      await wait();
      expect(fs.existsSync(path.resolve(projectRootDir, `${while0.name}_0`))).to.be.false;
      expect(fs.existsSync(path.resolve(projectRootDir, `${while0.name}_1`))).to.be.false;
      expect(fs.existsSync(path.resolve(projectRootDir, `${while0.name}_2`))).to.be.false;
      expect(fs.existsSync(path.resolve(projectRootDir, `${while0.name}_3`))).to.be.false;
    });
    it("should copy 3 times and keep last component", async ()=>{
      await updateComponentProperty(projectRootDir, while0.ID, "keep", 1);
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      await wait();
      expect(fs.existsSync(path.resolve(projectRootDir, `${while0.name}_0`))).to.be.false;
      expect(fs.existsSync(path.resolve(projectRootDir, `${while0.name}_1`))).to.be.false;
      expect(fs.statSync(path.resolve(projectRootDir, `${while0.name}_2`)).isDirectory()).to.be.true;
      expect(fs.existsSync(path.resolve(projectRootDir, `${while0.name}_3`))).to.be.false;
    });
    it("should copy 3 times and keep last 2 component", async ()=>{
      await updateComponentProperty(projectRootDir, while0.ID, "keep", 2);
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      await wait();
      expect(fs.existsSync(path.resolve(projectRootDir, `${while0.name}_0`))).to.be.false;
      expect(fs.statSync(path.resolve(projectRootDir, `${while0.name}_1`)).isDirectory()).to.be.true;
      expect(fs.statSync(path.resolve(projectRootDir, `${while0.name}_2`)).isDirectory()).to.be.true;
      expect(fs.existsSync(path.resolve(projectRootDir, `${while0.name}_3`))).to.be.false;
    });
    //reproduction test for issue #976
    //"whileコンポーネントのloop条件が機能しない" (while component's loop condition set by
    //a JavaScript expression does not work)
    //repro steps: 1. set while component's loop condition with a JavaScript expression
    //2. try to run the project
    //this test follows the exact repro steps: it first runs validateComponents() (which is
    //what the server calls when the user tries to run a project, see onRunProject in
    //projectController.js) to confirm the JS expression condition does not get rejected as an
    //invalid condition, and then actually executes the project via Dispatcher to confirm the
    //while loop honors the JavaScript condition instead of e.g. looping forever, not looping at
    //all, or being (mis)treated as a script file path.
    it("should accept and honor a JavaScript expression as the loop condition when the project is run", async ()=>{
      //condition intentionally re-set here (beforeEach already sets "WHEEL_CURRENT_INDEX < 3")
      //to make this test self-contained and explicit about what is being reproduced
      await updateComponentProperty(projectRootDir, while0.ID, "condition", "WHEEL_CURRENT_INDEX < 3");
      await updateComponentProperty(projectRootDir, while0.ID, "keep", 1);

      //step 2 of the repro: "try to run the project" - the real server code path validates
      //the whole project first (see onRunProject() -> validateComponents())
      const report = await validateComponents(projectRootDir);
      expect(report).to.be.an("array").that.is.empty;

      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      await wait();

      //if the JS expression condition were not honored (e.g. always treated as false, or the
      //loop ran unboundedly) these directories would not match a 3-iteration while loop that
      //keeps only the last instance
      expect(fs.existsSync(path.resolve(projectRootDir, `${while0.name}_0`))).to.be.false;
      expect(fs.existsSync(path.resolve(projectRootDir, `${while0.name}_1`))).to.be.false;
      expect(fs.statSync(path.resolve(projectRootDir, `${while0.name}_2`)).isDirectory()).to.be.true;
      expect(fs.existsSync(path.resolve(projectRootDir, `${while0.name}_3`))).to.be.false;
    });
  });
  describe("#Break", ()=>{
    let for0;
    let task0;
    let task1;
    let break0;
    beforeEach(async ()=>{
      for0 = await createNewComponent(projectRootDir, projectRootDir, "for", { x: 10, y: 10 });
      await updateComponentProperty(projectRootDir, for0.ID, "start", 0);
      await updateComponentProperty(projectRootDir, for0.ID, "end", 3);
      await updateComponentProperty(projectRootDir, for0.ID, "step", 1);
      task0 = await createNewComponent(projectRootDir, path.join(projectRootDir, for0.name), "task", { x: 10, y: 10 });
      task1 = await createNewComponent(projectRootDir, path.join(projectRootDir, for0.name), "task", { x: 10, y: 10 });
      await updateComponentProperty(projectRootDir, task0.ID, "script", scriptName);
      await updateComponentProperty(projectRootDir, task1.ID, "script", scriptName);
      await fs.outputFile(path.join(projectRootDir, for0.name, task0.name, scriptName), "echo task0 ${WHEEL_CURRENT_INDEX} >hoge");
      await fs.outputFile(path.join(projectRootDir, for0.name, task1.name, scriptName), "echo task1 ${WHEEL_CURRENT_INDEX} >hoge");
      break0 = await createNewComponent(projectRootDir, path.join(projectRootDir, for0.name), "break", { x: 10, y: 10 });
      await updateComponentProperty(projectRootDir, break0.ID, "condition", "WHEEL_CURRENT_INDEX == 2");
      await addLink(projectRootDir, task0.ID, break0.ID);
      await addLink(projectRootDir, break0.ID, task1.ID);
      projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
    });
    it("should run from 0 to 2 and task1 under for0_2 should not run", async ()=>{
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      expect(fs.statSync(path.resolve(projectRootDir, `${for0.name}_0`)).isDirectory()).to.be.true;
      expect(fs.statSync(path.resolve(projectRootDir, `${for0.name}_1`)).isDirectory()).to.be.true;
      expect(fs.statSync(path.resolve(projectRootDir, `${for0.name}_2`)).isDirectory()).to.be.true;
      expect(fs.existsSync(path.resolve(projectRootDir, `${for0.name}_3`))).to.be.false;
      expect(fs.readFileSync(path.resolve(projectRootDir, `${for0.name}`, task0.name, "hoge"), "utf-8")).to.equal("task0 2\n");
      expect(fs.readFileSync(path.resolve(projectRootDir, `${for0.name}`, task1.name, "hoge"), "utf-8")).to.equal("task1 1\n");
      expect(fs.readFileSync(path.resolve(projectRootDir, `${for0.name}_0`, task0.name, "hoge"), "utf-8")).to.equal("task0 0\n");
      expect(fs.readFileSync(path.resolve(projectRootDir, `${for0.name}_0`, task1.name, "hoge"), "utf-8")).to.equal("task1 0\n");
      expect(fs.readFileSync(path.resolve(projectRootDir, `${for0.name}_1`, task0.name, "hoge"), "utf-8")).to.equal("task0 1\n");
      expect(fs.readFileSync(path.resolve(projectRootDir, `${for0.name}_1`, task1.name, "hoge"), "utf-8")).to.equal("task1 1\n");
      expect(fs.readFileSync(path.resolve(projectRootDir, `${for0.name}_2`, task0.name, "hoge"), "utf-8")).to.equal("task0 2\n");
      expect(fs.readFileSync(path.resolve(projectRootDir, `${for0.name}_2`, task1.name, "hoge"), "utf-8")).to.equal("task1 1\n");

      for (const dir of ["for0_0", "for0_1"]) {
        const componentJsonContent = await fs.readJson(path.resolve(projectRootDir, dir, componentJsonFilename));
        const schema = {
          required: ["state"],
          properties: {
            state: { enum: ["finished"] }
          }
        };
        expect(ajv.validate(schema, componentJsonContent)).to.be.true;
        const task0JsonContent = await fs.readJson(path.resolve(projectRootDir, dir, task0.name, componentJsonFilename));
        expect(ajv.validate(schema, task0JsonContent)).to.be.true;
        const task1JsonContent = await fs.readJson(path.resolve(projectRootDir, dir, task1.name, componentJsonFilename));
        expect(ajv.validate(schema, task1JsonContent)).to.be.true;
      }
      for (const dir of ["for0", "for0_2"]) {
        const componentJsonContent = await fs.readJson(path.resolve(projectRootDir, dir, componentJsonFilename));
        const schema = {
          required: ["state"],
          properties: {
            state: { enum: ["finished"] }
          }
        };
        expect(ajv.validate(schema, componentJsonContent)).to.be.true;
        const task0JsonContent = await fs.readJson(path.resolve(projectRootDir, dir, task0.name, componentJsonFilename));
        expect(ajv.validate(schema, task0JsonContent)).to.be.true;
        const task1JsonContent = await fs.readJson(path.resolve(projectRootDir, dir, task1.name, componentJsonFilename));
        const schema2 = {
          required: ["state"],
          properties: {
            state: { enum: ["not-started"] }
          }
        };
        expect(ajv.validate(schema2, task1JsonContent)).to.be.true;
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
      await updateComponentProperty(projectRootDir, for0.ID, "start", 0);
      await updateComponentProperty(projectRootDir, for0.ID, "end", 3);
      await updateComponentProperty(projectRootDir, for0.ID, "step", 1);
      task0 = await createNewComponent(projectRootDir, path.join(projectRootDir, for0.name), "task", { x: 10, y: 10 });
      task1 = await createNewComponent(projectRootDir, path.join(projectRootDir, for0.name), "task", { x: 10, y: 10 });
      await updateComponentProperty(projectRootDir, task0.ID, "script", scriptName);
      await updateComponentProperty(projectRootDir, task1.ID, "script", scriptName);
      await fs.outputFile(path.join(projectRootDir, for0.name, task0.name, scriptName), "echo task0 ${WHEEL_CURRENT_INDEX} >hoge");
      await fs.outputFile(path.join(projectRootDir, for0.name, task1.name, scriptName), "echo task1 ${WHEEL_CURRENT_INDEX} >hoge");
      continue0 = await createNewComponent(projectRootDir, path.join(projectRootDir, for0.name), "continue", { x: 10, y: 10 });
      await updateComponentProperty(projectRootDir, continue0.ID, "condition", "WHEEL_CURRENT_INDEX == 2");
      await addLink(projectRootDir, task0.ID, continue0.ID);
      await addLink(projectRootDir, continue0.ID, task1.ID);
      projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
    });
    it("should run from 0 to 3 but task1 should be skipped when index=2", async ()=>{
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      expect(fs.statSync(path.resolve(projectRootDir, `${for0.name}_0`)).isDirectory()).to.be.true;
      expect(fs.statSync(path.resolve(projectRootDir, `${for0.name}_1`)).isDirectory()).to.be.true;
      expect(fs.statSync(path.resolve(projectRootDir, `${for0.name}_2`)).isDirectory()).to.be.true;
      expect(fs.statSync(path.resolve(projectRootDir, `${for0.name}_3`)).isDirectory()).to.be.true;
      expect(fs.readFileSync(path.resolve(projectRootDir, `${for0.name}`, task0.name, "hoge"), "utf-8")).to.equal("task0 3\n");
      expect(fs.readFileSync(path.resolve(projectRootDir, `${for0.name}`, task1.name, "hoge"), "utf-8")).to.equal("task1 3\n");
      expect(fs.readFileSync(path.resolve(projectRootDir, `${for0.name}_0`, task0.name, "hoge"), "utf-8")).to.equal("task0 0\n");
      expect(fs.readFileSync(path.resolve(projectRootDir, `${for0.name}_0`, task1.name, "hoge"), "utf-8")).to.equal("task1 0\n");
      expect(fs.readFileSync(path.resolve(projectRootDir, `${for0.name}_1`, task0.name, "hoge"), "utf-8")).to.equal("task0 1\n");
      expect(fs.readFileSync(path.resolve(projectRootDir, `${for0.name}_1`, task1.name, "hoge"), "utf-8")).to.equal("task1 1\n");
      expect(fs.readFileSync(path.resolve(projectRootDir, `${for0.name}_2`, task0.name, "hoge"), "utf-8")).to.equal("task0 2\n");
      expect(fs.readFileSync(path.resolve(projectRootDir, `${for0.name}_2`, task1.name, "hoge"), "utf-8")).to.equal("task1 1\n");
      expect(fs.readFileSync(path.resolve(projectRootDir, `${for0.name}_3`, task0.name, "hoge"), "utf-8")).to.equal("task0 3\n");
      expect(fs.readFileSync(path.resolve(projectRootDir, `${for0.name}_3`, task1.name, "hoge"), "utf-8")).to.equal("task1 3\n");

      for (const dir of ["for0", "for0_0", "for0_1", "for0_2", "for0_3"]) {
        const componentJsonContent = await fs.readJson(path.resolve(projectRootDir, dir, componentJsonFilename));
        const schema = {
          required: ["state"],
          properties: {
            state: { enum: ["finished"] }
          }
        };
        expect(ajv.validate(schema, componentJsonContent)).to.be.true;
        const task0JsonContent = await fs.readJson(path.resolve(projectRootDir, dir, task0.name, componentJsonFilename));
        expect(ajv.validate(schema, task0JsonContent)).to.be.true;
      }
      for (const dir of ["for0", "for0_0", "for0_1", "for0_3"]) {
        const task1JsonContent = await fs.readJson(path.resolve(projectRootDir, dir, task1.name, componentJsonFilename));
        const schema = {
          required: ["state"],
          properties: {
            state: { enum: ["finished"] }
          }
        };
        expect(ajv.validate(schema, task1JsonContent)).to.be.true;
      }
      const task1JsonContent = await fs.readJson(path.resolve(projectRootDir, "for0_2", task1.name, componentJsonFilename));
      const schema = {
        required: ["state"],
        properties: {
          state: { enum: ["not-started"] }
        }
      };
      expect(ajv.validate(schema, task1JsonContent)).to.be.true;
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
      await updateComponentProperty(projectRootDir, for0.ID, "start", 0);
      await updateComponentProperty(projectRootDir, for0.ID, "end", 2);
      await updateComponentProperty(projectRootDir, for0.ID, "step", 1);
      await addInputFile(projectRootDir, for0.ID, "foo");

      task0 = await createNewComponent(projectRootDir, path.join(projectRootDir, for0.name), "task", { x: 10, y: 10 });
      await updateComponentProperty(projectRootDir, task0.ID, "script", scriptName);
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
      expect(fs.readFileSync(path.resolve(projectRootDir, for0.name, task0.name, "hoge"), "utf-8")).to.equal("hoge 2\n");
      expect(fs.readFileSync(path.resolve(projectRootDir, `${for0.name}_0`, task0.name, "hoge"), "utf-8")).to.equal("hoge 0\n");
      expect(fs.readFileSync(path.resolve(projectRootDir, `${for0.name}_1`, task0.name, "hoge"), "utf-8")).to.equal("hoge 1\n");
      expect(fs.readFileSync(path.resolve(projectRootDir, `${for0.name}_2`, task0.name, "hoge"), "utf-8")).to.equal("hoge 2\n");
    });
  });
  describe("[reproduction test] task with sub directory in a for loop", ()=>{
    beforeEach(async ()=>{
      const for0 = await createNewComponent(projectRootDir, projectRootDir, "for", { x: 10, y: 10 });
      await updateComponentProperty(projectRootDir, for0.ID, "start", 0);
      await updateComponentProperty(projectRootDir, for0.ID, "end", 2);
      await updateComponentProperty(projectRootDir, for0.ID, "step", 1);
      const task0 = await createNewComponent(projectRootDir, path.join(projectRootDir, "for0"), "task", { x: 10, y: 10 });
      await updateComponentProperty(projectRootDir, task0.ID, "script", scriptName);
      await fs.outputFile(path.join(projectRootDir, "for0", "task0", scriptName), scriptPwd);
      await fs.mkdir(path.join(projectRootDir, "for0", "task0", "empty_dir"));
      projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
    });
    it("should run and successfully finished", async ()=>{
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      await wait();
      const for0Json = await fs.readJson(path.resolve(projectRootDir, "for0", componentJsonFilename));
      const schema = {
        required: ["state"],
        properties: {
          state: { enum: ["finished"] }
        }
      };
      expect(ajv.validate(schema, for0Json)).to.be.true;
      const for0Task0Json = await fs.readJson(path.resolve(projectRootDir, "for0_0", "task0", componentJsonFilename));
      expect(ajv.validate(schema, for0Task0Json)).to.be.true;
      const for1Task0Json = await fs.readJson(path.resolve(projectRootDir, "for0_1", "task0", componentJsonFilename));
      expect(ajv.validate(schema, for1Task0Json)).to.be.true;
      const for2Task0Json = await fs.readJson(path.resolve(projectRootDir, "for0_2", "task0", componentJsonFilename));
      expect(ajv.validate(schema, for2Task0Json)).to.be.true;
      const forTask0Json = await fs.readJson(path.resolve(projectRootDir, "for0", "task0", componentJsonFilename));
      expect(ajv.validate(schema, forTask0Json)).to.be.true;
    });
  });
  describe("[reproduction test] PS in loop", ()=>{
    let for0;
    let PS0;
    let task0;
    beforeEach(async ()=>{
      for0 = await createNewComponent(projectRootDir, projectRootDir, "for", { x: 10, y: 10 });
      await updateComponentProperty(projectRootDir, for0.ID, "start", 0);
      await updateComponentProperty(projectRootDir, for0.ID, "end", 3);
      await updateComponentProperty(projectRootDir, for0.ID, "step", 1);

      PS0 = await createNewComponent(projectRootDir, path.resolve(projectRootDir, for0.name), "PS", { x: 10, y: 10 });
      await updateComponentProperty(projectRootDir, PS0.ID, "parameterFile", "input.txt.json");
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
      await updateComponentProperty(projectRootDir, task0.ID, "script", scriptName);
      await fs.outputFile(path.join(projectRootDir, for0.name, PS0.name, task0.name, scriptName), "if [ ${WHEEL_CURRENT_INDEX} -eq 0 ];then echo hoge ${WHEEL_CURRENT_INDEX} > hoge;fi");

      projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
    });
    it("should run project and successfully finish", async ()=>{
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      expect(await DP.start()).to.be.equal("finished");
      const for0Json = await fs.readJson(path.resolve(projectRootDir, for0.name, componentJsonFilename));
      const schema = {
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
      };
      expect(ajv.validate(schema, for0Json)).to.be.true;
      const ps0Json = await fs.readJson(path.resolve(projectRootDir, for0.name, PS0.name, componentJsonFilename));
      const schema2 = {
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
      };
      expect(ajv.validate(schema2, ps0Json)).to.be.true;
      const ps0Keyword1Task0Json = await fs.readJson(path.resolve(projectRootDir, for0.name, "PS0_KEYWORD1_1", task0.name, componentJsonFilename));
      const schema3 = {
        properties: {
          state: {
            type: "string",
            pattern: "^finished$"
          }
        }
      };
      expect(ajv.validate(schema3, ps0Keyword1Task0Json)).to.be.true;
      const ps0Keyword2Task0Json = await fs.readJson(path.resolve(projectRootDir, for0.name, "PS0_KEYWORD1_2", task0.name, componentJsonFilename));
      expect(ajv.validate(schema3, ps0Keyword2Task0Json)).to.be.true;
      const ps0Keyword3Task0Json = await fs.readJson(path.resolve(projectRootDir, for0.name, "PS0_KEYWORD1_3", task0.name, componentJsonFilename));
      expect(ajv.validate(schema3, ps0Keyword3Task0Json)).to.be.true;
      expect(fs.readFileSync(path.resolve(projectRootDir, "for0_0", "PS0_KEYWORD1_1", task0.name, "hoge"), "utf-8")).to.equal("hoge 0\n");
      expect(fs.readFileSync(path.resolve(projectRootDir, "for0_0", "PS0_KEYWORD1_2", task0.name, "hoge"), "utf-8")).to.equal("hoge 0\n");
      expect(fs.readFileSync(path.resolve(projectRootDir, "for0_0", "PS0_KEYWORD1_3", task0.name, "hoge"), "utf-8")).to.equal("hoge 0\n");
      expect(fs.existsSync(path.resolve(projectRootDir, "for0_1", "PS0_KEYWORD1_1", task0.name, "hoge"))).to.be.false;
      expect(fs.existsSync(path.resolve(projectRootDir, "for0_1", "PS0_KEYWORD1_2", task0.name, "hoge"))).to.be.false;
      expect(fs.existsSync(path.resolve(projectRootDir, "for0_1", "PS0_KEYWORD1_3", task0.name, "hoge"))).to.be.false;
      expect(fs.existsSync(path.resolve(projectRootDir, "for0_2", "PS0_KEYWORD1_1", task0.name, "hoge"))).to.be.false;
      expect(fs.existsSync(path.resolve(projectRootDir, "for0_2", "PS0_KEYWORD1_2", task0.name, "hoge"))).to.be.false;
      expect(fs.existsSync(path.resolve(projectRootDir, "for0_2", "PS0_KEYWORD1_3", task0.name, "hoge"))).to.be.false;
      expect(fs.existsSync(path.resolve(projectRootDir, "for0_3", "PS0_KEYWORD1_1", task0.name, "hoge"))).to.be.false;
      expect(fs.existsSync(path.resolve(projectRootDir, "for0_3", "PS0_KEYWORD1_2", task0.name, "hoge"))).to.be.false;
      expect(fs.existsSync(path.resolve(projectRootDir, "for0_3", "PS0_KEYWORD1_3", task0.name, "hoge"))).to.be.false;
    });
  });
  describe("skipCopy functionality", ()=>{
    describe("for component with skipCopy", ()=>{
      let for0;
      let task0;
      beforeEach(async ()=>{
        for0 = await createNewComponent(projectRootDir, projectRootDir, "for", { x: 10, y: 10 });
        await updateComponentProperty(projectRootDir, for0.ID, "start", 0);
        await updateComponentProperty(projectRootDir, for0.ID, "end", 2);
        await updateComponentProperty(projectRootDir, for0.ID, "step", 1);
        await updateComponentProperty(projectRootDir, for0.ID, "skipCopy", ["skip_this.txt", "skip_dir"]);

        task0 = await createNewComponent(projectRootDir, path.resolve(projectRootDir, for0.name), "task", { x: 10, y: 10 });
        await updateComponentProperty(projectRootDir, task0.ID, "script", scriptName);
        await fs.outputFile(path.join(projectRootDir, for0.name, task0.name, scriptName), scriptPwd);
        await fs.outputFile(path.join(projectRootDir, for0.name, "keep_this.txt"), "keep");
        await fs.outputFile(path.join(projectRootDir, for0.name, "skip_this.txt"), "skip");
        await fs.outputFile(path.join(projectRootDir, for0.name, "skip_dir", "file.txt"), "skip dir content");

        projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
      });
      it("should skip specified files and directories during loop copy", async ()=>{
        const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
        expect(await DP.start()).to.be.equal("finished");

        //Check that keep_this.txt is copied to all instances
        expect(fs.existsSync(path.resolve(projectRootDir, "for0_0", "keep_this.txt"))).to.be.true;
        expect(fs.existsSync(path.resolve(projectRootDir, "for0_1", "keep_this.txt"))).to.be.true;
        expect(fs.existsSync(path.resolve(projectRootDir, "for0_2", "keep_this.txt"))).to.be.true;

        //Check that skip_this.txt is NOT copied from template to instances
        expect(fs.existsSync(path.resolve(projectRootDir, for0.name, "skip_this.txt"))).to.be.true;
        expect(fs.existsSync(path.resolve(projectRootDir, "for0_0", "skip_this.txt"))).to.be.false;
        expect(fs.existsSync(path.resolve(projectRootDir, "for0_1", "skip_this.txt"))).to.be.false;
        expect(fs.existsSync(path.resolve(projectRootDir, "for0_2", "skip_this.txt"))).to.be.false;

        //Check that skip_dir is NOT copied
        expect(fs.existsSync(path.resolve(projectRootDir, for0.name, "skip_dir"))).to.be.true;
        expect(fs.existsSync(path.resolve(projectRootDir, "for0_0", "skip_dir"))).to.be.false;
        expect(fs.existsSync(path.resolve(projectRootDir, "for0_1", "skip_dir"))).to.be.false;
        expect(fs.existsSync(path.resolve(projectRootDir, "for0_2", "skip_dir"))).to.be.false;
      });
    });
    describe("foreach component with skipCopy glob pattern", ()=>{
      let foreach0;
      let task0;
      beforeEach(async ()=>{
        foreach0 = await createNewComponent(projectRootDir, projectRootDir, "foreach", { x: 10, y: 10 });
        await updateComponentProperty(projectRootDir, foreach0.ID, "indexList", ["a", "b", "c"]);
        await updateComponentProperty(projectRootDir, foreach0.ID, "skipCopy", ["*.log", "temp_*"]);

        task0 = await createNewComponent(projectRootDir, path.resolve(projectRootDir, foreach0.name), "task", { x: 10, y: 10 });
        await updateComponentProperty(projectRootDir, task0.ID, "script", scriptName);
        await fs.outputFile(path.join(projectRootDir, foreach0.name, task0.name, scriptName), scriptPwd);
        await fs.outputFile(path.join(projectRootDir, foreach0.name, "data.txt"), "data");
        await fs.outputFile(path.join(projectRootDir, foreach0.name, "output.log"), "log content");
        await fs.outputFile(path.join(projectRootDir, foreach0.name, "temp_file.dat"), "temp data");
        await fs.outputFile(path.join(projectRootDir, foreach0.name, "temp_dir", "info.txt"), "temp info");

        projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
      });
      it("should skip files matching glob patterns during loop copy", async ()=>{
        const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
        expect(await DP.start()).to.be.equal("finished");

        //Check that data.txt is copied
        expect(fs.existsSync(path.resolve(projectRootDir, "foreach0_a", "data.txt"))).to.be.true;
        expect(fs.existsSync(path.resolve(projectRootDir, "foreach0_b", "data.txt"))).to.be.true;
        expect(fs.existsSync(path.resolve(projectRootDir, "foreach0_c", "data.txt"))).to.be.true;

        //Check that *.log files are NOT copied
        expect(fs.existsSync(path.resolve(projectRootDir, foreach0.name, "output.log"))).to.be.true;
        expect(fs.existsSync(path.resolve(projectRootDir, "foreach0_a", "output.log"))).to.be.false;
        expect(fs.existsSync(path.resolve(projectRootDir, "foreach0_b", "output.log"))).to.be.false;
        expect(fs.existsSync(path.resolve(projectRootDir, "foreach0_c", "output.log"))).to.be.false;

        //Check that temp_* files and directories are NOT copied
        expect(fs.existsSync(path.resolve(projectRootDir, foreach0.name, "temp_file.dat"))).to.be.true;
        expect(fs.existsSync(path.resolve(projectRootDir, "foreach0_a", "temp_file.dat"))).to.be.false;
        expect(fs.existsSync(path.resolve(projectRootDir, "foreach0_b", "temp_file.dat"))).to.be.false;
        expect(fs.existsSync(path.resolve(projectRootDir, "foreach0_c", "temp_file.dat"))).to.be.false;

        expect(fs.existsSync(path.resolve(projectRootDir, foreach0.name, "temp_dir"))).to.be.true;
        expect(fs.existsSync(path.resolve(projectRootDir, "foreach0_a", "temp_dir"))).to.be.false;
        expect(fs.existsSync(path.resolve(projectRootDir, "foreach0_b", "temp_dir"))).to.be.false;
        expect(fs.existsSync(path.resolve(projectRootDir, "foreach0_c", "temp_dir"))).to.be.false;
      });
    });
    describe("while component with skipCopy", ()=>{
      let while0;
      let task0;
      beforeEach(async ()=>{
        while0 = await createNewComponent(projectRootDir, projectRootDir, "while", { x: 10, y: 10 });
        await updateComponentProperty(projectRootDir, while0.ID, "condition", "WHEEL_CURRENT_INDEX < 2");
        await updateComponentProperty(projectRootDir, while0.ID, "skipCopy", ["cache.dat"]);

        task0 = await createNewComponent(projectRootDir, path.resolve(projectRootDir, while0.name), "task", { x: 10, y: 10 });
        await updateComponentProperty(projectRootDir, task0.ID, "script", scriptName);
        await fs.outputFile(path.join(projectRootDir, while0.name, task0.name, scriptName), scriptPwd);
        await fs.outputFile(path.join(projectRootDir, while0.name, "config.txt"), "config");
        await fs.outputFile(path.join(projectRootDir, while0.name, "cache.dat"), "cache data");

        projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
      });
      it("should skip specified files during while loop copy", async ()=>{
        const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
        expect(await DP.start()).to.be.equal("finished");

        //Check that config.txt is copied
        expect(fs.existsSync(path.resolve(projectRootDir, "while0_0", "config.txt"))).to.be.true;
        expect(fs.existsSync(path.resolve(projectRootDir, "while0_1", "config.txt"))).to.be.true;

        //Check that cache.dat is NOT copied
        expect(fs.existsSync(path.resolve(projectRootDir, while0.name, "cache.dat"))).to.be.true;
        expect(fs.existsSync(path.resolve(projectRootDir, "while0_0", "cache.dat"))).to.be.false;
        expect(fs.existsSync(path.resolve(projectRootDir, "while0_1", "cache.dat"))).to.be.false;
      });
    });
  });
  describe("#_warnMissingInputFiles", ()=>{
    let task;
    let emitAllStub;
    beforeEach(async ()=>{
      emitAllStub = sinon.stub(_internal, "emitAll").resolves();
      task = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 10, y: 10 });
      projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
    });
    afterEach(()=>{
      sinon.restore();
    });
    it("should emit showMessage when non-mandatory inputFile is missing", async ()=>{
      await addInputFile(projectRootDir, task.ID, "missing.txt");
      const updatedTask = await fs.readJson(path.resolve(projectRootDir, task.name, componentJsonFilename));
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      await DP._warnMissingInputFiles(updatedTask);
      expect(emitAllStub).to.have.been.calledOnce;
      expect(emitAllStub).to.have.been.calledWith(projectRootDir, "showMessage", sinon.match(/missing\.txt/));
    });
    it("should not emit showMessage when non-mandatory inputFile exists", async ()=>{
      await addInputFile(projectRootDir, task.ID, "present.txt");
      await fs.outputFile(path.resolve(projectRootDir, task.name, "present.txt"), "content");
      const updatedTask = await fs.readJson(path.resolve(projectRootDir, task.name, componentJsonFilename));
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      await DP._warnMissingInputFiles(updatedTask);
      expect(emitAllStub).to.not.have.been.called;
    });
    it("should not emit showMessage for mandatory inputFile even if missing", async ()=>{
      await addInputFile(projectRootDir, task.ID, "mandatory.txt");
      await toggleInputFileMandatory(projectRootDir, task.ID, 0, true);
      const updatedTask = await fs.readJson(path.resolve(projectRootDir, task.name, componentJsonFilename));
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      await DP._warnMissingInputFiles(updatedTask);
      expect(emitAllStub).to.not.have.been.called;
    });
    it("should do nothing when component has no inputFiles", async ()=>{
      const updatedTask = await fs.readJson(path.resolve(projectRootDir, task.name, componentJsonFilename));
      updatedTask.inputFiles = null;
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      await DP._warnMissingInputFiles(updatedTask);
      expect(emitAllStub).to.not.have.been.called;
    });
    it("should emit showMessage for each missing non-mandatory inputFile", async ()=>{
      await addInputFile(projectRootDir, task.ID, "fileA.txt");
      await addInputFile(projectRootDir, task.ID, "fileB.txt");
      const updatedTask = await fs.readJson(path.resolve(projectRootDir, task.name, componentJsonFilename));
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      await DP._warnMissingInputFiles(updatedTask);
      expect(emitAllStub).to.have.been.calledTwice;
      expect(emitAllStub).to.have.been.calledWith(projectRootDir, "showMessage", sinon.match(/fileA\.txt/));
      expect(emitAllStub).to.have.been.calledWith(projectRootDir, "showMessage", sinon.match(/fileB\.txt/));
    });
  });

  describe("#_getInputFiles mandatory-aware error handling", ()=>{
    let previous;
    let next;
    let ensureSymlinkStub;

    beforeEach(async ()=>{
      previous = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 0, y: 0 });
      next = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 100, y: 0 });
      projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
    });

    afterEach(()=>{
      if (ensureSymlinkStub) {
        ensureSymlinkStub.restore();
        ensureSymlinkStub = null;
      }
    });

    it("should succeed when all mandatory inputFiles are delivered", async ()=>{
      await addOutputFile(projectRootDir, previous.ID, "out.txt");
      await addInputFile(projectRootDir, next.ID, "out.txt");
      await toggleInputFileMandatory(projectRootDir, next.ID, 0, true);
      await addFileLink(projectRootDir, previous.ID, "out.txt", next.ID, "out.txt");
      const srcFile = path.resolve(projectRootDir, previous.name, "out.txt");
      await fs.outputFile(srcFile, "content");
      const updatedNext = await fs.readJson(path.resolve(projectRootDir, next.name, componentJsonFilename));
      projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      await DP._getInputFiles(updatedNext);
      const delivered = path.resolve(projectRootDir, next.name, "out.txt");
      expect(await fs.pathExists(delivered)).to.be.true;
    });

    it("should not throw when non-mandatory inputFile delivery fails", async ()=>{
      await addOutputFile(projectRootDir, previous.ID, "out.txt");
      await addInputFile(projectRootDir, next.ID, "out.txt");
      await addFileLink(projectRootDir, previous.ID, "out.txt", next.ID, "out.txt");
      const srcFile = path.resolve(projectRootDir, previous.name, "out.txt");
      await fs.outputFile(srcFile, "content");
      const updatedNext = await fs.readJson(path.resolve(projectRootDir, next.name, componentJsonFilename));
      projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
      //Stub ensureSymlink to force delivery failure without corrupting the component directory
      ensureSymlinkStub = sinon.stub(deliverFileInternal.fs, "ensureSymlink").rejects(new Error("forced delivery failure"));
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      //non-mandatory (default): should NOT throw
      await DP._getInputFiles(updatedNext);
    });

    it("should throw when mandatory inputFile delivery fails", async ()=>{
      await addOutputFile(projectRootDir, previous.ID, "out.txt");
      await addInputFile(projectRootDir, next.ID, "out.txt");
      await toggleInputFileMandatory(projectRootDir, next.ID, 0, true);
      await addFileLink(projectRootDir, previous.ID, "out.txt", next.ID, "out.txt");
      const srcFile = path.resolve(projectRootDir, previous.name, "out.txt");
      await fs.outputFile(srcFile, "content");
      const updatedNext = await fs.readJson(path.resolve(projectRootDir, next.name, componentJsonFilename));
      projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
      //Stub ensureSymlink to force delivery failure without corrupting the component directory
      ensureSymlinkStub = sinon.stub(deliverFileInternal.fs, "ensureSymlink").rejects(new Error("forced delivery failure"));
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      //mandatory: should throw
      await expect(DP._getInputFiles(updatedNext)).to.be.rejectedWith(/mandatory inputFile transfer failed/);
    });

    it("should throw only due to mandatory failures when both mandatory and non-mandatory deliveries fail", async ()=>{
      await addOutputFile(projectRootDir, previous.ID, "mand.txt");
      await addOutputFile(projectRootDir, previous.ID, "opt.txt");
      await addInputFile(projectRootDir, next.ID, "mand.txt");
      await addInputFile(projectRootDir, next.ID, "opt.txt");
      await toggleInputFileMandatory(projectRootDir, next.ID, 0, true);
      await addFileLink(projectRootDir, previous.ID, "mand.txt", next.ID, "mand.txt");
      await addFileLink(projectRootDir, previous.ID, "opt.txt", next.ID, "opt.txt");
      await fs.outputFile(path.resolve(projectRootDir, previous.name, "mand.txt"), "mandatory content");
      await fs.outputFile(path.resolve(projectRootDir, previous.name, "opt.txt"), "optional content");
      const updatedNext = await fs.readJson(path.resolve(projectRootDir, next.name, componentJsonFilename));
      projectJson = await fs.readJson(path.resolve(projectRootDir, projectJsonFilename));
      //Stub ensureSymlink to force both deliveries to fail
      ensureSymlinkStub = sinon.stub(deliverFileInternal.fs, "ensureSymlink").rejects(new Error("forced delivery failure"));
      const DP = new Dispatcher(projectRootDir, rootWF.ID, projectRootDir, "dummy start time", projectJson.componentPath, {}, "");
      //Should throw (because mandatory failed), not silent
      await expect(DP._getInputFiles(updatedNext)).to.be.rejectedWith(/mandatory inputFile transfer failed/);
    });
  });
});
