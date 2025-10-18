/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";

const { expect } = require("chai");
const sinon = require("sinon");
const workflowUtil = require("../../../app/core/workflowUtil.js");
const { _internal } = workflowUtil;

describe("#getThreeGenerationFamily", ()=>{
  let getThreeGenerationFamily;
  let readComponentJsonStub;
  let getChildrenStub;
  let hasChildStub;

  beforeEach(()=>{
    getThreeGenerationFamily = workflowUtil.getThreeGenerationFamily;
    readComponentJsonStub = sinon.stub(_internal, "readComponentJson");
    getChildrenStub = sinon.stub(_internal, "getChildren");
    hasChildStub = sinon.stub(_internal, "hasChild");
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return a root component with empty descendants if no children exist", async ()=>{
    readComponentJsonStub.resolves({
      ID: "rootID",
      type: "workflow"
    });
    getChildrenStub.resolves([]);

    const result = await getThreeGenerationFamily("/dummy/projectRoot", "/dummy/rootComponentDir");

    expect(result).to.have.property("ID", "rootID");
    expect(result).to.have.property("type", "workflow");
    expect(result).to.have.property("descendants").that.is.an("array").with.lengthOf(0);
    expect(readComponentJsonStub.calledOnceWithExactly("/dummy/rootComponentDir")).to.be.true;
    expect(getChildrenStub.calledOnceWithExactly("/dummy/projectRoot", "rootID")).to.be.true;
  });

  it("should remove handler from each child if present, but skip grandsons if hasChild is false", async ()=>{
    readComponentJsonStub.resolves({
      ID: "rootID",
      type: "workflow"
    });
    const child1 = { ID: "child1ID", type: "group", handler: "someHandlerValue" };
    const child2 = { ID: "child2ID", type: "other" };
    getChildrenStub.resolves([child1, child2]);
    hasChildStub.onCall(0).returns(false);
    hasChildStub.onCall(1).returns(false);

    const result = await getThreeGenerationFamily("/dummy/projectRoot", "/dummy/rootComponentDir");

    expect(result).to.have.property("ID", "rootID");
    expect(result).to.have.property("descendants").that.is.an("array").with.lengthOf(2);
    const [c1, c2] = result.descendants;
    expect(c1).to.have.property("ID", "child1ID");
    expect(c1).to.not.have.property("handler");
    expect(c2).to.have.property("ID", "child2ID");
    expect(c1).to.not.have.property("descendants");
    expect(c2).to.not.have.property("descendants");
  });

  it("should map grandsons when hasChild is true, and transform 'task' type differently", async ()=>{
    readComponentJsonStub.resolves({
      ID: "rootID",
      type: "workflow"
    });
    const childA = { ID: "childAID", type: "group" };
    getChildrenStub.onCall(0).resolves([childA]);
    hasChildStub.onCall(0).returns(true);
    const grandTask = { ID: "g1", type: "task", pos: { x: 100, y: 200 }, host: "someHost", useJobScheduler: true };
    const grandOther = { ID: "g2", type: "group", pos: { x: 300, y: 400 } };
    getChildrenStub.onCall(1).resolves([grandTask, grandOther]);

    const result = await getThreeGenerationFamily("/dummy/proj", "/dummy/rootComp");

    expect(result).to.have.property("ID", "rootID");
    expect(result).to.have.property("descendants").that.is.an("array").with.lengthOf(1);
    const cA = result.descendants[0];
    expect(cA).to.have.property("ID", "childAID");
    expect(cA).to.have.property("descendants").that.is.an("array").with.lengthOf(2);
    const [g1, g2] = cA.descendants;
    expect(g1).to.deep.equal({
      type: "task",
      pos: { x: 100, y: 200 },
      host: "someHost",
      useJobScheduler: true
    });
    expect(g2).to.deep.equal({
      type: "group",
      pos: { x: 300, y: 400 }
    });
  });
});

describe("#getChildren", ()=>{
  let getChildren;
  let getComponentDirStub;
  let readJsonGreedyStub;
  let promisifyStub;
  let globStub;
  let componentJsonFilename;

  beforeEach(()=>{
    getChildren = workflowUtil.getChildren;
    getComponentDirStub = sinon.stub(_internal, "getComponentDir");
    readJsonGreedyStub = sinon.stub(_internal, "readJsonGreedy");
    globStub = sinon.stub();
    promisifyStub = sinon.stub(_internal, "promisify").returns(globStub);
    componentJsonFilename = workflowUtil.componentJsonFilename;
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return an empty array if getComponentDir returns a falsy value", async ()=>{
    getComponentDirStub.resolves(null);

    const result = await getChildren("/some/project", "parentID");
    expect(result).to.be.an("array").that.is.empty;
    expect(getComponentDirStub.calledOnceWithExactly("/some/project", "parentID", true)).to.be.true;
    expect(promisifyStub.notCalled).to.be.true;
    expect(globStub.notCalled).to.be.true;
  });

  it("should return an empty array if no children are found by glob", async ()=>{
    getComponentDirStub.resolves("/path/to/component");
    globStub.resolves([]);

    const result = await getChildren("/projRoot", "someParent");
    expect(result).to.be.an("array").that.is.empty;
    const expectedGlobPath = require("path").join("/path/to/component", "*", componentJsonFilename);
    expect(promisifyStub.calledOnce).to.be.true;
    expect(globStub.calledOnceWithExactly(expectedGlobPath)).to.be.true;
  });

  it("should filter out subComponent objects and return the rest", async ()=>{
    getComponentDirStub.resolves("/my/component");
    globStub.resolves([
      "/my/component/child1/component.json",
      "/my/component/child2/component.json",
      "/my/component/child3/component.json"
    ]);
    readJsonGreedyStub.onCall(0).resolves({ ID: "child1", subComponent: false });
    readJsonGreedyStub.onCall(1).resolves({ ID: "child2", subComponent: true });
    readJsonGreedyStub.onCall(2).resolves({ ID: "child3" });

    const result = await getChildren("/projRoot", "myParentID");
    expect(result).to.have.lengthOf(2);
    expect(result).to.deep.include({ ID: "child1", subComponent: false });
    expect(result).to.deep.include({ ID: "child3" });
    const expectedGlobPath = require("path").join("/my/component", "*", componentJsonFilename);
    expect(globStub.calledOnceWithExactly(expectedGlobPath)).to.be.true;
    expect(readJsonGreedyStub.callCount).to.equal(3);
  });
});
