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
  checkRemoteStoragePathWritePermission,
  _internal
} from "../../../app/core/checkRemoteStoragePathWritePermission.js";

describe("#checkRemoteStoragePathWritePermission", ()=>{
  let remoteHostGetStub;
  let getSshMock;
  let sshExecMock;

  beforeEach(()=>{
    remoteHostGetStub = sinon.stub(_internal.remoteHost, "getID");
    sshExecMock = sinon.stub();
    getSshMock = sinon.stub(_internal, "getSsh").callsFake(()=>{
      return {
        exec: sshExecMock,
        canConnect: sinon.stub()
      };
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should resolve when the storage path has write permission", async ()=>{
    const projectRootDir = "/mock/project/root";
    const params = { host: "remoteHost1", storagePath: "/remote/path" };

    remoteHostGetStub.withArgs("name", "remoteHost1").returns("host123");
    sshExecMock.withArgs("test -w /remote/path").resolves(0);

    await expect(checkRemoteStoragePathWritePermission(projectRootDir, params)).to.be.fulfilled;
    expect(remoteHostGetStub.calledOnceWithExactly("name", "remoteHost1")).to.be.true;
    expect(getSshMock.calledOnceWithExactly(projectRootDir, "host123")).to.be.true;
    expect(sshExecMock.calledOnceWithExactly("test -w /remote/path")).to.be.true;
  });

  it("should throw an error when the storage path does not have write permission", async ()=>{
    const projectRootDir = "/mock/project/root";
    const params = { host: "remoteHost1", storagePath: "/remote/path" };

    remoteHostGetStub.withArgs("name", "remoteHost1").returns("host123");
    sshExecMock.withArgs("test -w /remote/path").resolves(1);

    await expect(checkRemoteStoragePathWritePermission(projectRootDir, params)).to.be.rejectedWith("bad permission");
  });

  it("should throw an error when SSH instance is not available", async ()=>{
    const projectRootDir = "/mock/project/root";
    const params = { host: "remoteHost1", storagePath: "/remote/path" };

    remoteHostGetStub.withArgs("name", "remoteHost1").returns("host123");
    getSshMock.throws(new Error("ssh instance is not registerd for the project"));

    await expect(checkRemoteStoragePathWritePermission(projectRootDir, params)).to.be.rejectedWith("ssh instance is not registerd for the project");
  });
});
