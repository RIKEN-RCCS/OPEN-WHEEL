/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */

import { expect } from "chai";
import sinon from "sinon";
import { getKey, register, removeTransferrers, _internal } from "../../../app/core/transferManager.js";
describe("#getKey", ()=>{
  beforeEach(()=>{
  });

  it("should return correct key string if task has projectRootDir and remotehostID", ()=>{
    const task = {
      projectRootDir: "/path/to/projectA",
      remotehostID: "remoteHost123"
    };

    const result = getKey(task);
    expect(result).to.equal("/path/to/projectA-remoteHost123");
  });

  it("should return a string even if remotehostID is undefined", ()=>{
    const task = {
      projectRootDir: "/path/to/projectB"
    };

    const result = getKey(task);
    expect(result).to.equal("/path/to/projectB-undefined");
  });
});

describe("#register", ()=>{
  let getSshStub;
  let getDateStringStub;
  //eslint-disable-next-line no-unused-vars
  let getLoggerStub;
  let loggerDebugStub;
  let SBSStub;
  let transferrersMap;
  let qsubAndWaitStub;
  let sshSendStub;
  let sshRecvStub;

  beforeEach(()=>{
    getSshStub = sinon.stub(_internal, "getSsh");
    getDateStringStub = sinon.stub(_internal, "getDateString");
    loggerDebugStub = sinon.stub();
    getLoggerStub = sinon.stub(_internal, "getLogger").returns({ debug: loggerDebugStub });
    sshSendStub = sinon.stub().resolves();
    sshRecvStub = sinon.stub().resolves();
    qsubAndWaitStub = sinon.stub().resolves("qsubResultMock");
    SBSStub = sinon.stub(_internal, "SBS").callsFake((options)=>{
      return {
        qsubAndWait: qsubAndWaitStub,
        exec: options.exec,
        maxConcurrent: options.maxConcurrent,
        name: options.name
      };
    });
    transferrersMap = new Map();
    sinon.stub(_internal, "transferrers").value(transferrersMap);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should create a new SBS instance if it does not exist, then call qsubAndWait", async ()=>{
    getSshStub.returns({
      send: sshSendStub,
      recv: sshRecvStub
    });
    getDateStringStub.returns("mockDateString");

    const hostinfo = {
      name: "testHost",
      user: "testUser",
      port: 2222,
      maxNumParallelTransfer: 2
    };
    const task = {
      projectRootDir: "/path/to/project",
      remotehostID: "remoteHostA",
      workingDir: "/local/dir",
      remoteWorkingDir: "/remote/dir"
    };
    const direction = "send";
    const src = ["/some/local/file.txt"];
    const dst = "/some/remote/dir/";
    const opt = ["-p", "optionX"];

    expect(transferrersMap.size).to.equal(0);

    const result = await register(hostinfo, task, direction, src, dst, opt);

    expect(result).to.equal("qsubResultMock");
    expect(SBSStub.calledOnce).to.be.true;
    expect(transferrersMap.size).to.equal(1);
    expect(qsubAndWaitStub.calledOnce).to.be.true;
    expect(qsubAndWaitStub.args[0][0]).to.deep.equal({
      direction,
      src,
      dst,
      task
    });

    const sbsOpts = SBSStub.args[0][0];
    expect(sbsOpts.maxConcurrent).to.equal(2);
    expect(sbsOpts.name).to.equal("transfer-testUser@testHost:2222");

    await sbsOpts.exec({ direction, src, dst, task });

    expect(sshSendStub.calledWith(src, dst, opt)).to.be.true;
    expect(task.preparedTime).to.equal("mockDateString");
    expect(loggerDebugStub.callCount).to.equal(2);
  });

  it("should reuse existing transferrer if it already exists", async ()=>{
    const existingTransferrer = {
      qsubAndWait: sinon.stub().resolves("existingTransferrerResult")
    };
    const key = "/path/to/project-remoteHostB";
    transferrersMap.set(key, existingTransferrer);

    const hostinfo = { name: "reuseTest" };
    const task = {
      projectRootDir: "/path/to/project",
      remotehostID: "remoteHostB"
    };
    const direction = "recv";
    const src = ["remote/file"];
    const dst = "/local/dir";
    const opt = [];

    const result = await register(hostinfo, task, direction, src, dst, opt);

    expect(SBSStub.notCalled).to.be.true;
    expect(existingTransferrer.qsubAndWait.calledOnce).to.be.true;
    expect(result).to.equal("existingTransferrerResult");
  });

  it("should handle direction=recv correctly", async ()=>{
    getSshStub.returns({
      send: sshSendStub,
      recv: sshRecvStub
    });
    getDateStringStub.returns("unusedDateString");

    const hostinfo = { name: "dummyHost" };
    const task = {
      projectRootDir: "/proj",
      remotehostID: "hostC",
      workingDir: "/local/dir",
      remoteWorkingDir: "/remote/dir"
    };
    const direction = "recv";
    const src = ["/some/remote/data"];
    const dst = "/local/destination/";
    const opt = [];

    const ret = await register(hostinfo, task, direction, src, dst, opt);
    expect(ret).to.equal("qsubResultMock");

    const sbsOpts = SBSStub.args[0][0];
    await sbsOpts.exec({ direction, src, dst, task });

    expect(sshRecvStub.calledWith(src, dst, opt)).to.be.true;
    expect(task.preparedTime).to.be.undefined;
    expect(loggerDebugStub.notCalled).to.be.true;
  });

  it("should throw error if direction is invalid", async ()=>{
    getSshStub.returns({
      send: sshSendStub,
      recv: sshRecvStub
    });

    const hostinfo = { name: "invalidHost" };
    const task = {
      projectRootDir: "/projX",
      remotehostID: "hostX"
    };
    const direction = "unknown";
    const src = [];
    const dst = "";
    const opt = null;

    await register(hostinfo, task, direction, src, dst, opt);

    const sbsOpts = SBSStub.args[0][0];

    let thrownError;
    try {
      await sbsOpts.exec({ direction, src, dst, task });
    } catch (err) {
      thrownError = err;
    }
    expect(thrownError).to.be.instanceOf(Error);
    expect(thrownError.message).to.equal("invalid direction");
    expect(thrownError.direction).to.equal("unknown");
  });

  it("should use default values if hostinfo fields are not set", async ()=>{
    getSshStub.returns({ send: sshSendStub, recv: sshRecvStub });
    getDateStringStub.returns("dateMock");

    const hostinfo = {
      name: "defaultPortHost"
    };
    const task = {
      projectRootDir: "/default",
      remotehostID: "defHost"
    };
    await register(hostinfo, task, "send", ["fileA"], "/dest", []);

    const sbsOpts = SBSStub.args[0][0];
    expect(sbsOpts.maxConcurrent).to.equal(1);
    expect(sbsOpts.name).to.include("transfer-");
    expect(sbsOpts.name).to.include("@defaultPortHost:22");
  });
});

describe("#removeTransferrers", ()=>{
  let transferrersMap;

  beforeEach(()=>{
    transferrersMap = new Map();
    sinon.stub(_internal, "transferrers").value(transferrersMap);
  });
  afterEach(()=>{
    sinon.restore();
  });

  it("should remove all keys that start with the given projectRootDir", ()=>{
    transferrersMap.set("/path/to/projectA-fileX", { dummy: "data1" });
    transferrersMap.set("/path/to/projectA-fileY", { dummy: "data2" });
    transferrersMap.set("/path/to/otherProject-fileZ", { dummy: "data3" });

    removeTransferrers("/path/to/projectA");

    expect(transferrersMap.has("/path/to/projectA-fileX")).to.be.false;
    expect(transferrersMap.has("/path/to/projectA-fileY")).to.be.false;
    expect(transferrersMap.has("/path/to/otherProject-fileZ")).to.be.true;
    expect(transferrersMap.size).to.equal(1);
  });

  it("should do nothing if there are no keys starting with the given projectRootDir", ()=>{
    transferrersMap.set("/path/to/unrelated1", { dummy: "data1" });
    transferrersMap.set("/foo/bar", { dummy: "data2" });

    removeTransferrers("/path/to/projectB");

    expect(transferrersMap.has("/path/to/unrelated1")).to.be.true;
    expect(transferrersMap.has("/foo/bar")).to.be.true;
    expect(transferrersMap.size).to.equal(2);
  });
});
