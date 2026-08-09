/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import * as chai from "chai";
const expect = chai.expect;
import sinon from "sinon";

//testee
import { reconcileProjectStates, _internal } from "../../../app/core/startupReconciliation.js";

describe("#reconcileProjectStates", ()=>{
  let checkRunningJobsStub;
  let getProjectStateStub;
  let setProjectStateStub;
  let loggerWarnStub;

  beforeEach(()=>{
    checkRunningJobsStub = sinon.stub(_internal, "checkRunningJobs");
    getProjectStateStub = sinon.stub(_internal, "getProjectState");
    setProjectStateStub = sinon.stub(_internal, "setProjectState");
    loggerWarnStub = sinon.stub();
    sinon.stub(_internal, "getLogger").returns({ warn: loggerWarnStub });
  });
  afterEach(()=>{
    sinon.restore();
  });

  it("flips a stale 'running' project (no leftover job manager files) to 'stopped'", async ()=>{
    const projectList = { getAll: ()=>{
      return [{ path: "/proj/a" }];
    } };
    checkRunningJobsStub.resolves({ jmFiles: [] });
    getProjectStateStub.resolves("running");

    await reconcileProjectStates(projectList);

    expect(setProjectStateStub.calledOnceWithExactly("/proj/a", "stopped")).to.be.true;
  });

  it("leaves a project alone if its persisted state is not 'running'", async ()=>{
    const projectList = { getAll: ()=>{
      return [{ path: "/proj/b" }];
    } };
    checkRunningJobsStub.resolves({ jmFiles: [] });
    getProjectStateStub.resolves("finished");

    await reconcileProjectStates(projectList);

    expect(setProjectStateStub.called).to.be.false;
  });

  it("still marks a project 'holding' when leftover job manager files exist, even if 'running'", async ()=>{
    const projectList = { getAll: ()=>{
      return [{ path: "/proj/c" }];
    } };
    checkRunningJobsStub.resolves({ jmFiles: ["host-scheduler.jm.wheel.json"] });
    getProjectStateStub.resolves("running");

    await reconcileProjectStates(projectList);

    expect(setProjectStateStub.calledOnceWithExactly("/proj/c", "holding")).to.be.true;
    expect(getProjectStateStub.called).to.be.false;
  });

  it("processes every project in the list independently", async ()=>{
    const projectList = { getAll: ()=>{
      return [{ path: "/proj/d" }, { path: "/proj/e" }];
    } };
    checkRunningJobsStub.resolves({ jmFiles: [] });
    getProjectStateStub.withArgs("/proj/d").resolves("running");
    getProjectStateStub.withArgs("/proj/e").resolves("not-started");

    await reconcileProjectStates(projectList);

    expect(setProjectStateStub.calledOnceWithExactly("/proj/d", "stopped")).to.be.true;
  });

  it("logs and skips a project whose state can't be read (e.g. stale/removed from disk), without affecting others", async ()=>{
    const projectList = { getAll: ()=>{
      return [{ path: "/proj/missing" }, { path: "/proj/f" }];
    } };
    checkRunningJobsStub.withArgs("/proj/missing").rejects(new Error("ENOENT"));
    checkRunningJobsStub.withArgs("/proj/f").resolves({ jmFiles: [] });
    getProjectStateStub.withArgs("/proj/f").resolves("running");

    await reconcileProjectStates(projectList);

    expect(loggerWarnStub.calledOnce).to.be.true;
    expect(setProjectStateStub.calledOnceWithExactly("/proj/f", "stopped")).to.be.true;
  });
});
