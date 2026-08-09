/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import * as chai from "chai";
const { expect } = chai;
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
import sinon from "sinon";

//testee
import {
  checkRunningJobs,
  _internal
} from "../../../app/core/checkRunningJobs.js";

describe("#checkRunningJobs", ()=>{
  let globStub;
  let getLoggerStub;
  let fsReadJsonStub;

  beforeEach(()=>{
    globStub = sinon.stub();
    getLoggerStub = {
      warn: sinon.spy()
    };

    globStub = sinon.stub();
    sinon.stub(_internal, "glob").callsFake(globStub);
    fsReadJsonStub = sinon.stub(_internal.fs, "readJson");
    sinon.stub(_internal, "getLogger").returns(getLoggerStub);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return tasks and jmFiles when all job manager files are valid", async ()=>{
    const projectRootDir = "/mock/project/root";
    const mockFiles = ["job1.json", "job2.json"];
    const mockTask1 = [{ id: 1, name: "Task1" }];
    const mockTask2 = [{ id: 2, name: "Task2" }];

    globStub.resolves(mockFiles);
    fsReadJsonStub.onFirstCall().resolves(mockTask1);
    fsReadJsonStub.onSecondCall().resolves(mockTask2);

    const result = await checkRunningJobs(projectRootDir);

    expect(result.tasks).to.deep.equal([...mockTask1, ...mockTask2]);
    expect(result.jmFiles).to.deep.equal(mockFiles);
    expect(getLoggerStub.warn.notCalled).to.be.true;
  });

  it("should handle and log errors for invalid job manager files", async ()=>{
    const projectRootDir = "/mock/project/root";
    const mockFiles = ["job1.json", "job2.json"];
    const mockTask = [{ id: 1, name: "Task1" }];

    globStub.resolves(mockFiles);
    fsReadJsonStub.onFirstCall().resolves(mockTask);
    fsReadJsonStub.onSecondCall().rejects(new Error("Invalid JSON"));

    const result = await checkRunningJobs(projectRootDir);

    expect(result.tasks).to.deep.equal(mockTask);
    expect(result.jmFiles).to.deep.equal(["job1.json"]);
    expect(getLoggerStub.warn.calledOnce).to.be.true;
    expect(getLoggerStub.warn.firstCall.args[0]).to.equal("read job manager file failed");
  });

  it("should return empty tasks and jmFiles when no job manager files are found", async ()=>{
    const projectRootDir = "/mock/project/root";

    globStub.resolves([]);

    const result = await checkRunningJobs(projectRootDir);

    expect(result.tasks).to.deep.equal([]);
    expect(result.jmFiles).to.deep.equal([]);
    expect(getLoggerStub.warn.notCalled).to.be.true;
  });

  it("should skip files without valid task arrays", async ()=>{
    const projectRootDir = "/mock/project/root";
    const mockFiles = ["job1.json", "job2.json"];
    const mockInvalidContent = { notArray: true };

    globStub.resolves(mockFiles);
    fsReadJsonStub.onFirstCall().resolves([]);
    fsReadJsonStub.onSecondCall().resolves(mockInvalidContent);

    const result = await checkRunningJobs(projectRootDir);

    expect(result.tasks).to.deep.equal([]);
    expect(result.jmFiles).to.deep.equal([]);
    expect(getLoggerStub.warn.notCalled).to.be.true;
  });
});
