/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path = require("path");
const fs = require("fs-extra");

//setup test framework
const chai = require("chai");
const expect = chai.expect;
const sinon = require("sinon");
chai.use(require("sinon-chai"));
chai.use(require("chai-fs"));
chai.use(require("chai-json-schema"));

//testee
const { runProject } = require("../app/core/projectController");

//test data
const testDirRoot = "WHEEL_TEST_TMP";
const projectRootDir = path.resolve(testDirRoot, "testProject.wheel");
const { eventEmitters } = require("../app/core/global.js");
eventEmitters.set(projectRootDir, { emit: sinon.stub() });

//helper functions
const { readComponentJson} = require("../app/core/componentJsonIO.js");
const { replaceEnv, updateComponent, createNewComponent , createNewProject } = require("../app/core/projectFilesOperator");

const { scriptName, scriptHeader } = require("./testScript");
const logfilename = "env.log";
const scriptEcho = `${scriptHeader}
{
echo WHEEL_CURRENT_INDEX=$WHEEL_CURRENT_INDEX
echo WHEEL_PREV_INDEX=$WHEEL_PREV_INDEX
echo WHEEL_NEXT_INDEX=$WHEEL_NEXT_INDEX
echo WHEEL_FOR_START=$WHEEL_FOR_START
echo WHEEL_FOR_END=$WHEEL_FOR_END
echo WHEEL_FOR_STEP=$WHEEL_FOR_STEP
echo WHEEL_PS_PARAM=$WHEEL_PS_PARAM
echo WHEEL_FOREACH_LEN=$WHEEL_FOREACH_LEN
echo WHEEL_REMOTE_WORK=$WHEEL_REMOTE_WORK
echo WHEEL_REMOTE_CWD=$WHEEL_REMOTE_CWD
echo USER_DEFINED_VALUE=$USER_DEFINED_VALUE
} > ${logfilename}
`;

describe("UT for environment variables", function () {
  this.timeout(0);
  let state;
  before(async ()=>{
    await fs.remove(testDirRoot);
    await createNewProject(projectRootDir, "test project", null, "test", "test@example.com");
    const rootWF = await readComponentJson(projectRootDir);
    await replaceEnv(projectRootDir, rootWF.ID, { USER_DEFINED_VALUE: "hoge" });

    const for0 = await createNewComponent(projectRootDir, projectRootDir, "for", { x: 11, y: 11 });
    await updateComponent(projectRootDir, for0.ID, "start", 0);
    await updateComponent(projectRootDir, for0.ID, "end", 3);
    await updateComponent(projectRootDir, for0.ID, "step", 2);
    const forTask = await createNewComponent(projectRootDir, path.join(projectRootDir, "for0"), "task", { x: 10, y: 10 });
    await updateComponent(projectRootDir, forTask.ID, "script", scriptName);
    await fs.outputFile(path.join(projectRootDir, "for0", "task0", scriptName), scriptEcho);

    const forUnderFor = await createNewComponent(projectRootDir, path.join(projectRootDir, "for0"), "for", { x: 10, y: 10 });
    await updateComponent(projectRootDir, forUnderFor.ID, "start", 5);
    await updateComponent(projectRootDir, forUnderFor.ID, "end", 1);
    await updateComponent(projectRootDir, forUnderFor.ID, "step", -2);
    const forUnderForTask = await createNewComponent(projectRootDir, path.join(projectRootDir, "for0", "for0"), "task", { x: 10, y: 10 });
    await updateComponent(projectRootDir, forUnderForTask.ID, "script", scriptName);
    await fs.outputFile(path.join(projectRootDir, "for0", "for0", "task0", scriptName), scriptEcho);

    const whileUnderFor = await createNewComponent(projectRootDir, path.join(projectRootDir, "for0"), "while", { x: 11, y: 11 });
    await updateComponent(projectRootDir, whileUnderFor.ID, "condition", "WHEEL_CURRENT_INDEX < 2");
    const whileUnderForTask = await createNewComponent(projectRootDir, path.join(projectRootDir, "for0", "while0"), "task", { x: 10, y: 10 });
    await updateComponent(projectRootDir, whileUnderForTask.ID, "script", scriptName);
    await fs.outputFile(path.join(projectRootDir, "for0", "while0", "task0", scriptName), scriptEcho);

    const foreachUnderFor = await createNewComponent(projectRootDir, path.join(projectRootDir, "for0"), "foreach", { x: 11, y: 11 });
    await updateComponent(projectRootDir, foreachUnderFor.ID, "indexList", ["foo", "bar"]);
    const foreachUnderForTask = await createNewComponent(projectRootDir, path.join(projectRootDir, "for0", "foreach0"), "task", { x: 10, y: 10 });
    await updateComponent(projectRootDir, foreachUnderForTask.ID, "script", scriptName);
    await fs.outputFile(path.join(projectRootDir, "for0", "foreach0", "task0", scriptName), scriptEcho);

    const while0 = await createNewComponent(projectRootDir, projectRootDir, "while", { x: 11, y: 11 });
    await updateComponent(projectRootDir, while0.ID, "condition", "WHEEL_CURRENT_INDEX < 2");
    const whileTask = await createNewComponent(projectRootDir, path.join(projectRootDir, "while0"), "task", { x: 10, y: 10 });
    await updateComponent(projectRootDir, whileTask.ID, "script", scriptName);
    await fs.outputFile(path.join(projectRootDir, "while0", "task0", scriptName), scriptEcho);

    const foreach0 = await createNewComponent(projectRootDir, projectRootDir, "foreach", { x: 11, y: 11 });
    await updateComponent(projectRootDir, foreach0.ID, "indexList", ["foo", "bar"]);
    const foreachTask = await createNewComponent(projectRootDir, path.join(projectRootDir, "foreach0"), "task", { x: 10, y: 10 });
    await updateComponent(projectRootDir, foreachTask.ID, "script", scriptName);
    await fs.outputFile(path.join(projectRootDir, "foreach0", "task0", scriptName), scriptEcho);

    const ps0 = await createNewComponent(projectRootDir, projectRootDir, "PS", { x: 11, y: 11 });
    await updateComponent(projectRootDir, ps0.ID, "parameterFile", "input.txt.json");
    await fs.outputFile(path.join(projectRootDir, "PS0", "input.txt"), "%%KEYWORD1%%");
    const parameterSetting = {
      target_file: "input.txt",
      target_param: [
        {
          target: "hoge",
          keyword: "KEYWORD1",
          type: "integer",
          min: "1",
          max: "2",
          step: "1",
          list: ""
        }
      ]
    };
    await fs.writeJson(path.join(projectRootDir, "PS0", "input.txt.json"), parameterSetting, { spaces: 4 });
    const psTask = await createNewComponent(projectRootDir, path.join(projectRootDir, "PS0"), "task", { x: 10, y: 10 });
    await updateComponent(projectRootDir, psTask.ID, "script", scriptName);
    await fs.outputFile(path.join(projectRootDir, "PS0", "task0", scriptName), scriptEcho);

    const task0 = await createNewComponent(projectRootDir, projectRootDir, "task", { x: 10, y: 10 });
    await updateComponent(projectRootDir, task0.ID, "script", scriptName);
    await fs.outputFile(path.join(projectRootDir, "task0", scriptName), scriptEcho);

    const forUnderPS = await createNewComponent(projectRootDir, path.join(projectRootDir, ps0.name), "for", { x: 10, y: 10 });
    await updateComponent(projectRootDir, forUnderPS.ID, "start", 5);
    await updateComponent(projectRootDir, forUnderPS.ID, "end", 1);
    await updateComponent(projectRootDir, forUnderPS.ID, "step", -2);
    const forUnderPSTask = await createNewComponent(projectRootDir, path.join(projectRootDir, ps0.name, "for0"), "task", { x: 10, y: 10 });
    await updateComponent(projectRootDir, forUnderPSTask.ID, "script", scriptName);
    await fs.outputFile(path.join(projectRootDir, ps0.name, "for0", "task0", scriptName), scriptEcho);

    const whileUnderPS = await createNewComponent(projectRootDir, path.join(projectRootDir, ps0.name), "while", { x: 11, y: 11 });
    await updateComponent(projectRootDir, whileUnderPS.ID, "condition", "WHEEL_CURRENT_INDEX < 2");
    const whileUnderPSTask = await createNewComponent(projectRootDir, path.join(projectRootDir, ps0.name, "while0"), "task", { x: 10, y: 10 });
    await updateComponent(projectRootDir, whileUnderPSTask.ID, "script", scriptName);
    await fs.outputFile(path.join(projectRootDir, ps0.name, "while0", "task0", scriptName), scriptEcho);

    const foreachUnderPS = await createNewComponent(projectRootDir, path.join(projectRootDir, ps0.name), "foreach", { x: 11, y: 11 });
    await updateComponent(projectRootDir, foreachUnderPS.ID, "indexList", ["foo", "bar"]);
    const foreachUnderPSTask = await createNewComponent(projectRootDir, path.join(projectRootDir, ps0.name, "foreach0"), "task", { x: 10, y: 10 });
    await updateComponent(projectRootDir, foreachUnderPSTask.ID, "script", scriptName);
    await fs.outputFile(path.join(projectRootDir, ps0.name, "foreach0", "task0", scriptName), scriptEcho);

    state = await runProject(projectRootDir);
  });
  after(async ()=>{
    if (!process.env.WHEEL_KEEP_FILES_AFTER_LAST_TEST) {
      await fs.remove(testDirRoot);
    }
  });
  it("should be successfully finished", async ()=>{
    expect(state).to.equal("finished");
  });
  it("should hvae USER_DEFINED_VALUE", async ()=>{
    expect(path.join(projectRootDir, "task0", logfilename)).to.be.a.file().with.contents.that.match(/^USER_DEFINED_VALUE=hoge$/m);
  });
  it("should have WHEEL_CURRENT_INDEX , WHEEL_PREV_INDEX, WHEEL_NEXT_INDEX, WHEEL_FOR_START, WHEEL_FOR_END, and WHEEL_FOR_STEP in task under for component", async ()=>{
    const logfile = path.join(projectRootDir, "for0_0", "task0", logfilename);
    expect(logfile).to.be.a.file();
    const log = await fs.readFile(logfile)
      .then((e)=>{ return e.toString(); });
    expect(log).to.match(/^WHEEL_FOR_START=0$/m);
    expect(log).to.match(/^WHEEL_FOR_END=3$/m);
    expect(log).to.match(/^WHEEL_FOR_STEP=2$/m);
    expect(log).to.match(/^WHEEL_CURRENT_INDEX=0$/m);
    expect(log).to.match(/^WHEEL_NEXT_INDEX=2$/m);
    expect(log).to.match(/^WHEEL_PREV_INDEX=null$/m);
  });
  it("should have WHEEL_CURRENT_INDEX , WHEEL_PREV_INDEX, WHEEL_NEXT_INDEX, WHEEL_FOR_START, WHEEL_FOR_END, and WHEEL_FOR_STEP in task under for component", async ()=>{
    const logfile = path.join(projectRootDir, "for0_2", "task0", logfilename);
    expect(logfile).to.be.a.file();
    const log = await fs.readFile(logfile)
      .then((e)=>{ return e.toString(); });
    expect(log).to.match(/^WHEEL_FOR_START=0$/m);
    expect(log).to.match(/^WHEEL_FOR_END=3$/m);
    expect(log).to.match(/^WHEEL_FOR_STEP=2$/m);
    expect(log).to.match(/^WHEEL_CURRENT_INDEX=2$/m);
    expect(log).to.match(/^WHEEL_NEXT_INDEX=4$/m);
    expect(log).to.match(/^WHEEL_PREV_INDEX=0$/m);
  });
  it("should have WHEEL_CURRENT_INDEX , WHEEL_PREV_INDEX, WHEEL_NEXT_INDEX, WHEEL_FOR_START, WHEEL_FOR_END, and WHEEL_FOR_STEP in task under inner for component", ()=>{
    expect(path.join(projectRootDir, "for0_2", "for0_3", "task0", logfilename)).to.be.a.file().with.contents.that.match(/^WHEEL_FOR_START=5$/m);
    expect(path.join(projectRootDir, "for0_2", "for0_3", "task0", logfilename)).to.be.a.file().with.contents.that.match(/^WHEEL_FOR_END=1$/m);
    expect(path.join(projectRootDir, "for0_2", "for0_3", "task0", logfilename)).to.be.a.file().with.contents.that.match(/^WHEEL_FOR_STEP=-2$/m);
    expect(path.join(projectRootDir, "for0_2", "for0_3", "task0", logfilename)).to.be.a.file().with.contents.that.match(/^WHEEL_CURRENT_INDEX=3$/m);
    expect(path.join(projectRootDir, "for0_2", "for0_3", "task0", logfilename)).to.be.a.file().with.contents.that.match(/^WHEEL_NEXT_INDEX=1$/m);
    expect(path.join(projectRootDir, "for0_2", "for0_3", "task0", logfilename)).to.be.a.file().with.contents.that.match(/^WHEEL_PREV_INDEX=5$/m);
  });
  it("should have WHEEL_CURRENT_INDEX , WHEEL_PREV_INDEX, WHEEL_NEXT_INDEX, WHEEL_FOR_START, WHEEL_FOR_END, and WHEEL_FOR_STEP in task under inner while component", ()=>{
    expect(path.join(projectRootDir, "for0_2", "while0_1", "task0", logfilename)).to.be.a.file().with.contents.that.match(/^WHEEL_FOR_START=0$/m);
    expect(path.join(projectRootDir, "for0_2", "while0_1", "task0", logfilename)).to.be.a.file().with.contents.that.match(/^WHEEL_FOR_END=3$/m);
    expect(path.join(projectRootDir, "for0_2", "while0_1", "task0", logfilename)).to.be.a.file().with.contents.that.match(/^WHEEL_FOR_STEP=2$/m);
    expect(path.join(projectRootDir, "for0_2", "while0_1", "task0", logfilename)).to.be.a.file().with.contents.that.match(/^WHEEL_CURRENT_INDEX=1$/m);
    expect(path.join(projectRootDir, "for0_2", "while0_1", "task0", logfilename)).to.be.a.file().with.contents.that.match(/^WHEEL_NEXT_INDEX=2$/m);
    expect(path.join(projectRootDir, "for0_2", "while0_1", "task0", logfilename)).to.be.a.file().with.contents.that.match(/^WHEEL_PREV_INDEX=0$/m);
  });
  it("should have WHEEL_CURRENT_INDEX , WHEEL_PREV_INDEX, WHEEL_NEXT_INDEX, WHEEL_FOR_START, WHEEL_FOR_END, and WHEEL_FOR_STEP in task under inner foreach component", ()=>{
    expect(path.join(projectRootDir, "for0_2", "foreach0_bar", "task0", logfilename)).to.be.a.file().with.contents.that.match(/^WHEEL_FOR_START=0$/m);
    expect(path.join(projectRootDir, "for0_2", "foreach0_bar", "task0", logfilename)).to.be.a.file().with.contents.that.match(/^WHEEL_FOR_END=3$/m);
    expect(path.join(projectRootDir, "for0_2", "foreach0_bar", "task0", logfilename)).to.be.a.file().with.contents.that.match(/^WHEEL_FOR_STEP=2$/m);
    expect(path.join(projectRootDir, "for0_2", "foreach0_bar", "task0", logfilename)).to.be.a.file().with.contents.that.match(/^WHEEL_CURRENT_INDEX=bar$/m);
    expect(path.join(projectRootDir, "for0_2", "foreach0_bar", "task0", logfilename)).to.be.a.file().with.contents.that.match(/^WHEEL_NEXT_INDEX=$/m);
    expect(path.join(projectRootDir, "for0_2", "foreach0_bar", "task0", logfilename)).to.be.a.file().with.contents.that.match(/^WHEEL_PREV_INDEX=foo$/m);
  });
  it("should have WHEEL_CURRENT_INDEX , WHEEL_PREV_INDEX, WHEEL_NEXT_INDEX, WHEEL_FOR_START, WHEEL_FOR_END, and WHEEL_FOR_STEP in task under inner for component", ()=>{
    expect(path.join(projectRootDir, "PS0_KEYWORD1_2", "for0_3", "task0", logfilename)).to.be.a.file().with.contents.that.match(/^WHEEL_FOR_START=5$/m);
    expect(path.join(projectRootDir, "PS0_KEYWORD1_2", "for0_3", "task0", logfilename)).to.be.a.file().with.contents.that.match(/^WHEEL_FOR_END=1$/m);
    expect(path.join(projectRootDir, "PS0_KEYWORD1_2", "for0_3", "task0", logfilename)).to.be.a.file().with.contents.that.match(/^WHEEL_FOR_STEP=-2$/m);
    expect(path.join(projectRootDir, "PS0_KEYWORD1_2", "for0_3", "task0", logfilename)).to.be.a.file().with.contents.that.match(/^WHEEL_CURRENT_INDEX=3$/m);
    expect(path.join(projectRootDir, "PS0_KEYWORD1_2", "for0_3", "task0", logfilename)).to.be.a.file().with.contents.that.match(/^WHEEL_NEXT_INDEX=1$/m);
    expect(path.join(projectRootDir, "PS0_KEYWORD1_2", "for0_3", "task0", logfilename)).to.be.a.file().with.contents.that.match(/^WHEEL_PREV_INDEX=5$/m);
  });
  it("should have WHEEL_CURRENT_INDEX , WHEEL_PREV_INDEX, WHEEL_NEXT_INDEX, WHEEL_FOR_START, WHEEL_FOR_END, and WHEEL_FOR_STEP in task under inner while component", ()=>{
    expect(path.join(projectRootDir, "PS0_KEYWORD1_2", "while0_1", "task0", logfilename)).to.be.a.file().with.contents.that.match(/^WHEEL_FOR_START=$/m);
    expect(path.join(projectRootDir, "PS0_KEYWORD1_2", "while0_1", "task0", logfilename)).to.be.a.file().with.contents.that.match(/^WHEEL_FOR_END=$/m);
    expect(path.join(projectRootDir, "PS0_KEYWORD1_2", "while0_1", "task0", logfilename)).to.be.a.file().with.contents.that.match(/^WHEEL_FOR_STEP=$/m);
    expect(path.join(projectRootDir, "PS0_KEYWORD1_2", "while0_1", "task0", logfilename)).to.be.a.file().with.contents.that.match(/^WHEEL_CURRENT_INDEX=1$/m);
    expect(path.join(projectRootDir, "PS0_KEYWORD1_2", "while0_1", "task0", logfilename)).to.be.a.file().with.contents.that.match(/^WHEEL_NEXT_INDEX=2$/m);
    expect(path.join(projectRootDir, "PS0_KEYWORD1_2", "while0_1", "task0", logfilename)).to.be.a.file().with.contents.that.match(/^WHEEL_PREV_INDEX=0$/m);
  });
  it("should have WHEEL_CURRENT_INDEX , WHEEL_PREV_INDEX, WHEEL_NEXT_INDEX, WHEEL_FOR_START, WHEEL_FOR_END, and WHEEL_FOR_STEP in task under inner foreach component", ()=>{
    expect(path.join(projectRootDir, "PS0_KEYWORD1_2", "foreach0_bar", "task0", logfilename)).to.be.a.file().with.contents.that.match(/^WHEEL_FOR_START=$/m);
    expect(path.join(projectRootDir, "PS0_KEYWORD1_2", "foreach0_bar", "task0", logfilename)).to.be.a.file().with.contents.that.match(/^WHEEL_FOR_END=$/m);
    expect(path.join(projectRootDir, "PS0_KEYWORD1_2", "foreach0_bar", "task0", logfilename)).to.be.a.file().with.contents.that.match(/^WHEEL_FOR_STEP=$/m);
    expect(path.join(projectRootDir, "PS0_KEYWORD1_2", "foreach0_bar", "task0", logfilename)).to.be.a.file().with.contents.that.match(/^WHEEL_CURRENT_INDEX=bar$/m);
    expect(path.join(projectRootDir, "PS0_KEYWORD1_2", "foreach0_bar", "task0", logfilename)).to.be.a.file().with.contents.that.match(/^WHEEL_NEXT_INDEX=$/m);
    expect(path.join(projectRootDir, "PS0_KEYWORD1_2", "foreach0_bar", "task0", logfilename)).to.be.a.file().with.contents.that.match(/^WHEEL_PREV_INDEX=foo$/m);
  });
});
