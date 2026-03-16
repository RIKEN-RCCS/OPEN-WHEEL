/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path = require("path");
const fs = require("fs-extra");
const tar = require("tar");
const { EventEmitter } = require("events");

//setup test framework
const chai = require("chai");
const expect = chai.expect;
chai.use(require("sinon-chai"));
chai.use(require("chai-fs"));

//testee
const { runProject } = require("../../../app/core/projectController.js");
const { statusFilename } = require("../../../app/db/db.js");
const { eventEmitters } = require("../../../app/core/global.js");

//test data
const testDirRoot = "WHEEL_TEST_TMP";
const projectRootDir = path.resolve(testDirRoot, "testProject.wheel");

//helper functions
const testFileDir = path.resolve(__dirname, "../../testFiles");
describe("restart UT", function () {
  this.timeout(0);
  beforeEach(async ()=>{
    await fs.remove(testDirRoot);
    await fs.ensureDir(projectRootDir);
  });
  after(async ()=>{
    if (!process.env.WHEEL_KEEP_FILES_AFTER_LAST_TEST) {
      await fs.remove(testDirRoot);
    }
  });
  it("can restart for component from second loop with updated files", async ()=>{
    await tar.x({
      file: path.resolve(testFileDir, "restart_for.tgz"),
      preserveOwner: false,
      cwd: projectRootDir
    });
    await runProject(projectRootDir);

    expect(path.resolve(projectRootDir, "for0_1/task0/output.txt")).to.be.a.file().with.contents.that.match(/for0_1\/task0/);
    expect(path.resolve(projectRootDir, "for0_1/task0/hoge.txt")).not.to.be.a.path();
    expect(path.resolve(projectRootDir, "for0_2/task0/hoge.txt")).to.be.a.file().with.contents.that.match(/for0_2\/task0/);
    expect(path.resolve(projectRootDir, "for0_3/task0/hoge.txt")).to.be.a.file().with.contents.that.match(/for0_3\/task0/);
  });
  it("can restart for component from second loop when for component state is running (stopped without save)", async ()=>{
    await tar.x({
      file: path.resolve(testFileDir, "restart_for_running_state.tgz"),
      preserveOwner: false,
      cwd: projectRootDir
    });
    await runProject(projectRootDir);

    expect(path.resolve(projectRootDir, "for0_1/task0/output.txt")).to.be.a.file().with.contents.that.match(/for0_1\/task0/);
    expect(path.resolve(projectRootDir, "for0_1/task0/hoge.txt")).not.to.be.a.path();
    expect(path.resolve(projectRootDir, "for0_2/task0/hoge.txt")).to.be.a.file().with.contents.that.match(/for0_2\/task0/);
    expect(path.resolve(projectRootDir, "for0_3/task0/hoge.txt")).to.be.a.file().with.contents.that.match(/for0_3\/task0/);
  });
  it("can restart for component from first loop with updated files", async ()=>{
    await tar.x({
      file: path.resolve(testFileDir, "restart_for_stop_at_first_loop.tgz"),
      preserveOwner: false,
      cwd: projectRootDir
    });
    await runProject(projectRootDir);

    expect(path.resolve(projectRootDir, "for0_1/task0/hoge.txt")).to.be.a.file().with.contents.that.match(/for0_1\/task0/);
    expect(path.resolve(projectRootDir, "for0_2/task0/hoge.txt")).to.be.a.file().with.contents.that.match(/for0_2\/task0/);
    expect(path.resolve(projectRootDir, "for0_3/task0/hoge.txt")).to.be.a.file().with.contents.that.match(/for0_3\/task0/);
  });
  it("can restart foreach component from second loop with updated files", async ()=>{
    await tar.x({
      file: path.resolve(testFileDir, "restart_foreach.tgz"),
      preserveOwner: false,
      cwd: projectRootDir
    });
    await runProject(projectRootDir);

    expect(path.resolve(projectRootDir, "foreach0_1/task0/output.txt")).to.be.a.file().with.contents.that.match(/foreach0_1\/task0/);
    expect(path.resolve(projectRootDir, "foreach0_1/task0/hoge.txt")).not.to.be.a.path();
    expect(path.resolve(projectRootDir, "foreach0_2/task0/hoge.txt")).to.be.a.file().with.contents.that.match(/foreach0_2\/task0/);
    expect(path.resolve(projectRootDir, "foreach0_3/task0/hoge.txt")).to.be.a.file().with.contents.that.match(/foreach0_3\/task0/);
  });
  it("can restart foreach component from first loop with updated files", async ()=>{
    await tar.x({
      file: path.resolve(testFileDir, "restart_foreach_stop_at_first_loop.tgz"),
      preserveOwner: false,
      cwd: projectRootDir
    });
    await runProject(projectRootDir);

    expect(path.resolve(projectRootDir, "foreach0_1/task0/hoge.txt")).to.be.a.file().with.contents.that.match(/foreach0_1\/task0/);
    expect(path.resolve(projectRootDir, "foreach0_2/task0/hoge.txt")).to.be.a.file().with.contents.that.match(/foreach0_2\/task0/);
    expect(path.resolve(projectRootDir, "foreach0_3/task0/hoge.txt")).to.be.a.file().with.contents.that.match(/foreach0_3\/task0/);
  });
  it("can restart foreach component from second loop with updated files even if indexList is updated", async ()=>{
    await tar.x({
      file: path.resolve(testFileDir, "restart_foreach_with_modified_indexList.tgz"),
      preserveOwner: false,
      cwd: projectRootDir
    });
    await runProject(projectRootDir);

    expect(path.resolve(projectRootDir, "foreach0_1/task0/output.txt")).to.be.a.file().with.contents.that.match(/foreach0_1\/task0/);
    expect(path.resolve(projectRootDir, "foreach0_1/task0/hoge.txt")).not.to.be.a.path();
    expect(path.resolve(projectRootDir, "foreach0_2/task0/hoge.txt")).not.to.be.a.path();
    expect(path.resolve(projectRootDir, "foreach0_3/task0/hoge.txt")).not.to.be.a.path();
    expect(path.resolve(projectRootDir, "foreach0_foo/task0/hoge.txt")).to.be.a.file().with.contents.that.match(/foreach0_foo\/task0/);
    expect(path.resolve(projectRootDir, "foreach0_bar/task0/hoge.txt")).to.be.a.file().with.contents.that.match(/foreach0_bar\/task0/);
    expect(path.resolve(projectRootDir, "foreach0_baz/task0/hoge.txt")).to.be.a.file().with.contents.that.match(/foreach0_baz\/task0/);
  });
  it("can restart while component from second loop with updated files", async ()=>{
    await tar.x({
      file: path.resolve(testFileDir, "restart_while.tgz"),
      preserveOwner: false,
      cwd: projectRootDir
    });
    await runProject(projectRootDir);

    expect(path.resolve(projectRootDir, "while0_0/task0/output.txt")).to.be.a.file().with.contents.that.match(/while0_0\/task0/);
    expect(path.resolve(projectRootDir, "while0_0/task0/hoge.txt")).not.to.be.a.path();
    expect(path.resolve(projectRootDir, "while0_1/task0/hoge.txt")).to.be.a.file().with.contents.that.match(/while0_1\/task0/);
    expect(path.resolve(projectRootDir, "while0_2/task0/hoge.txt")).to.be.a.file().with.contents.that.match(/while0_2\/task0/);
  });
  it("can restart while component from first loop with updated files", async ()=>{
    await tar.x({
      file: path.resolve(testFileDir, "restart_while_stop_at_first_loop.tgz"),
      preserveOwner: false,
      cwd: projectRootDir
    });
    await runProject(projectRootDir);

    expect(path.resolve(projectRootDir, "while0_0/task0/hoge.txt")).to.be.a.file().with.contents.that.match(/while0_0\/task0/);
    expect(path.resolve(projectRootDir, "while0_1/task0/hoge.txt")).to.be.a.file().with.contents.that.match(/while0_1\/task0/);
    expect(path.resolve(projectRootDir, "while0_2/task0/hoge.txt")).to.be.a.file().with.contents.that.match(/while0_2\/task0/);
  });
  it("can restart PS component and re-run only not finished instances", async ()=>{
    await tar.x({
      file: path.resolve(testFileDir, "restart_PS.tgz"),
      preserveOwner: false,
      cwd: projectRootDir
    });
    await runProject(projectRootDir);

    expect(path.resolve(projectRootDir, "PS0_time_0/task0/output.txt")).to.be.a.file().with.contents.that.match(/PS0_time_0\/task0/);
    expect(path.resolve(projectRootDir, "PS0_time_5/task0/output.txt")).to.be.a.file().with.contents.that.match(/PS0_time_5\/task0/);
    expect(path.resolve(projectRootDir, "PS0_time_10/task0/output.txt")).to.be.a.file().with.contents.that.match(/PS0_time_10\/task0/);
    expect(path.resolve(projectRootDir, "PS0_time_15/task0/output.txt")).to.be.a.file().with.contents.that.match(/hoge/);
    expect(path.resolve(projectRootDir, "PS0_time_20/task0/output.txt")).to.be.a.file().with.contents.that.match(/hoge/);
    expect(path.resolve(projectRootDir, "PS0_time_0/task0/hoge.txt")).not.to.be.a.path();
    expect(path.resolve(projectRootDir, "PS0_time_5/task0/hoge.txt")).not.to.be.a.path();
    expect(path.resolve(projectRootDir, "PS0_time_10/task0/hoge.txt")).not.to.be.a.path();
    expect(path.resolve(projectRootDir, "PS0_time_15/task0/hoge.txt")).to.be.a.file().with.contents.that.match(/PS0_time_15\/task0/);
    expect(path.resolve(projectRootDir, "PS0_time_20/task0/hoge.txt")).to.be.a.file().with.contents.that.match(/PS0_time_20\/task0/);
    expect(path.resolve(projectRootDir, "PS0/15_hoge.txt")).to.be.a.file().with.contents.that.match(/PS0_time_15\/task0/);
    expect(path.resolve(projectRootDir, "PS0/20_hoge.txt")).to.be.a.file().with.contents.that.match(/PS0_time_20\/task0/);
  });
  it("can restart and skip already finished component while completing remaining tasks with dependency", async ()=>{
    await tar.x({
      file: path.resolve(testFileDir, "restart_with_dependency.tgz"),
      preserveOwner: false,
      cwd: projectRootDir
    });
    const projectDir = path.resolve(projectRootDir, "restart_with_dependency.wheel");

    const ee = new EventEmitter();
    eventEmitters.set(projectDir, ee);

    try {
      await runProject(projectDir);
    } finally {
      eventEmitters.delete(projectDir);
    }

    //task0 must not run again: state stays "finished" and no dispatchedTime is added
    const task0Json = await fs.readJson(path.resolve(projectDir, "task0/cmp.wheel.json"));
    expect(task0Json.state).to.equal("finished");
    expect(task0Json.dispatchedTime).to.be.undefined;

    //task1 must finish
    const task1Json = await fs.readJson(path.resolve(projectDir, "task1/cmp.wheel.json"));
    expect(task1Json.state).to.equal("finished");

    //task2 must finish
    const task2Json = await fs.readJson(path.resolve(projectDir, "task2/cmp.wheel.json"));
    expect(task2Json.state).to.equal("finished");

    //task2's output: status file must exist and report successful execution
    expect(path.resolve(projectDir, `task2/${statusFilename}`))
      .to.be.a.file()
      .with.contents.that.match(/^finished\n0/);
  });
  it("can restart PS component and re-run only not finished instances", async ()=>{
    await tar.x({
      file: path.resolve(testFileDir, "restart_PS_stop_before_actual_run.tgz"),
      preserveOwner: false,
      cwd: projectRootDir
    });
    await runProject(projectRootDir);

    expect(path.resolve(projectRootDir, "PS0_time_0/task0/output.txt")).to.be.a.file().with.contents.that.match(/hoge/);
    expect(path.resolve(projectRootDir, "PS0_time_5/task0/output.txt")).to.be.a.file().with.contents.that.match(/hoge/);
    expect(path.resolve(projectRootDir, "PS0_time_10/task0/output.txt")).to.be.a.file().with.contents.that.match(/hoge/);
    expect(path.resolve(projectRootDir, "PS0_time_15/task0/output.txt")).to.be.a.file().with.contents.that.match(/hoge/);
    expect(path.resolve(projectRootDir, "PS0_time_20/task0/output.txt")).to.be.a.file().with.contents.that.match(/hoge/);
    expect(path.resolve(projectRootDir, "PS0_time_0/task0/hoge.txt")).to.be.a.file().with.contents.that.match(/PS0_time_0\/task0/);
    expect(path.resolve(projectRootDir, "PS0_time_5/task0/hoge.txt")).to.be.a.file().with.contents.that.match(/PS0_time_5\/task0/);
    expect(path.resolve(projectRootDir, "PS0_time_10/task0/hoge.txt")).to.be.a.file().with.contents.that.match(/PS0_time_10\/task0/);
    expect(path.resolve(projectRootDir, "PS0_time_15/task0/hoge.txt")).to.be.a.file().with.contents.that.match(/PS0_time_15\/task0/);
    expect(path.resolve(projectRootDir, "PS0_time_20/task0/hoge.txt")).to.be.a.file().with.contents.that.match(/PS0_time_20\/task0/);
    expect(path.resolve(projectRootDir, "PS0/0_hoge.txt")).to.be.a.file().with.contents.that.match(/PS0_time_0\/task0/);
    expect(path.resolve(projectRootDir, "PS0/5_hoge.txt")).to.be.a.file().with.contents.that.match(/PS0_time_5\/task0/);
    expect(path.resolve(projectRootDir, "PS0/10_hoge.txt")).to.be.a.file().with.contents.that.match(/PS0_time_10\/task0/);
    expect(path.resolve(projectRootDir, "PS0/15_hoge.txt")).to.be.a.file().with.contents.that.match(/PS0_time_15\/task0/);
    expect(path.resolve(projectRootDir, "PS0/20_hoge.txt")).to.be.a.file().with.contents.that.match(/PS0_time_20\/task0/);
  });
});
