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
//eslint-disable-next-line no-unused-vars
import { promisify } from "util";
//eslint-disable-next-line no-unused-vars
import * as glob from "glob";

//testee

//testee
import {
  isSameRemoteHost,
  recursiveGetHosts,
  getHosts,
  _internal
} from "../../../app/core/componentHostOperations.js";

describe("#isSameRemoteHost", ()=>{
  let readComponentJsonByIDMock;
  let remoteHostMock;

  beforeEach(()=>{
    readComponentJsonByIDMock = sinon.stub(_internal, "readComponentJsonByID");
    remoteHostMock = {
      query: sinon.stub()
    };
    sinon.stub(_internal, "remoteHost").value(remoteHostMock);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return null if src and dst are the same", async ()=>{
    const result = await isSameRemoteHost("/project/root", "componentA", "componentA");
    expect(result).to.be.null;
  });

  it("should return false if either component is local", async ()=>{
    readComponentJsonByIDMock
      .withArgs("/project/root", "componentA").resolves({ host: "localhost" })
      .withArgs("/project/root", "componentB")
      .resolves({ host: "host1" });

    const result = await isSameRemoteHost("/project/root", "componentA", "componentB");
    expect(result).to.be.false;
  });

  it("should return true if both components have the same host name", async ()=>{
    readComponentJsonByIDMock
      .withArgs("/project/root", "componentA").resolves({ host: "host1" })
      .withArgs("/project/root", "componentB")
      .resolves({ host: "host1" });

    const result = await isSameRemoteHost("/project/root", "componentA", "componentB");
    expect(result).to.be.true;
  });

  it("should return true if both components have matching remote host info", async ()=>{
    readComponentJsonByIDMock
      .withArgs("/project/root", "componentA").resolves({ host: "host1" })
      .withArgs("/project/root", "componentB")
      .resolves({ host: "host2" });
    remoteHostMock.query
      .withArgs("name", "host1").returns({ host: "sharedHost", port: 22 })
      .withArgs("name", "host2")
      .returns({ host: "sharedHost", port: 22 });

    const result = await isSameRemoteHost("/project/root", "componentA", "componentB");
    expect(result).to.be.true;
  });

  it("should return false if remote hosts do not match", async ()=>{
    readComponentJsonByIDMock
      .withArgs("/project/root", "componentA").resolves({ host: "host1" })
      .withArgs("/project/root", "componentB")
      .resolves({ host: "host2" });
    remoteHostMock.query
      .withArgs("name", "host1").returns({ host: "host1", port: 22, sharedHost: "host1", name: "host1" })
      .withArgs("name", "host2")
      .returns({ host: "host2", port: 22, sharedHost: "host2", name: "host2" });

    const result = await isSameRemoteHost("/project/root", "componentA", "componentB");
    expect(result).to.be.false;
  });

  it("should return true if dstHostInfo.sharedHost matches srcHostInfo.name", async ()=>{
    readComponentJsonByIDMock
      .withArgs("/project/root", "componentA").resolves({ host: "host1" })
      .withArgs("/project/root", "componentB")
      .resolves({ host: "host2" });
    remoteHostMock.query
      .withArgs("name", "host1").returns({ host: "host1", name: "host1" })
      .withArgs("name", "host2")
      .returns({ sharedHost: "host1" });

    const result = await isSameRemoteHost("/project/root", "componentA", "componentB");
    expect(result).to.be.true;
  });
});

describe("#recursiveGetHosts", ()=>{
  //eslint-disable-next-line @stylistic/max-statements-per-line
  let getChildrenMock; let hasChildMock;

  beforeEach(()=>{
    getChildrenMock = sinon.stub(_internal, "getChildren");
    hasChildMock = sinon.stub(_internal, "hasChild");
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should not add any hosts if there are no children", async ()=>{
    getChildrenMock.resolves([]);
    const hosts = [];
    const storageHosts = [];

    await recursiveGetHosts("mockProjectRoot", "rootID", hosts, storageHosts);

    expect(hosts).to.be.empty;
    expect(storageHosts).to.be.empty;
  });

  it("should add task component hosts correctly", async ()=>{
    getChildrenMock.resolves([{ ID: "comp1", type: "task", host: "remote1" }]);
    hasChildMock.returns(false);

    const hosts = [];
    const storageHosts = [];

    await recursiveGetHosts("mockProjectRoot", "rootID", hosts, storageHosts);

    expect(hosts).to.deep.equal([{ hostname: "remote1" }]);
    expect(storageHosts).to.be.empty;
  });

  it("should add storage component hosts correctly", async ()=>{
    getChildrenMock.resolves([{ ID: "comp2", type: "storage", host: "storage1" }]);
    hasChildMock.returns(false);

    const hosts = [];
    const storageHosts = [];

    await recursiveGetHosts("mockProjectRoot", "rootID", hosts, storageHosts);

    expect(hosts).to.be.empty;
    expect(storageHosts).to.deep.equal([{ hostname: "storage1", isStorage: true }]);
  });

  it("should skip disabled components", async ()=>{
    getChildrenMock.resolves([{ ID: "comp3", type: "task", host: "remote2", disable: true }]);
    hasChildMock.returns(false);

    const hosts = [];
    const storageHosts = [];

    await recursiveGetHosts("mockProjectRoot", "rootID", hosts, storageHosts);

    expect(hosts).to.be.empty;
    expect(storageHosts).to.be.empty;
  });

  it("should skip localhost components", async ()=>{
    getChildrenMock.resolves([{ ID: "comp4", type: "task", host: "localhost" }]);
    hasChildMock.returns(false);

    const hosts = [];
    const storageHosts = [];

    await recursiveGetHosts("mockProjectRoot", "rootID", hosts, storageHosts);

    expect(hosts).to.be.empty;
    expect(storageHosts).to.be.empty;
  });

  it("should recursively add child hosts", async ()=>{
    getChildrenMock.onFirstCall().resolves([{ ID: "comp5", type: "for", host: "remote3" }]);
    getChildrenMock.onSecondCall().resolves([{ ID: "comp6", type: "task", host: "remote4" }]);

    hasChildMock.withArgs({ ID: "comp5", type: "for", host: "remote3" }).returns(true);
    hasChildMock.withArgs({ ID: "comp6", type: "task", host: "remote4" }).returns(false);

    const hosts = [];
    const storageHosts = [];

    await recursiveGetHosts("mockProjectRoot", "rootID", hosts, storageHosts);

    expect(hosts).to.deep.equal([{ hostname: "remote4" }]);
    expect(storageHosts).to.be.empty;
  });
});

describe("#getHosts", ()=>{
  let recursiveGetHostsMock;

  beforeEach(()=>{
    recursiveGetHostsMock = sinon.stub(_internal, "recursiveGetHosts");
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should call recursiveGetHosts with correct arguments", async ()=>{
    const projectRootDir = "/mock/project";
    const rootID = "rootComponent";
    recursiveGetHostsMock.resolves();

    await getHosts(projectRootDir, rootID);

    expect(recursiveGetHostsMock.callCount).to.equal(1);
    expect(recursiveGetHostsMock.getCall(0).args).to.deep.equal([projectRootDir, rootID, [], [], []]);
  });

  it("should correctly classify task and storage hosts", async ()=>{
    recursiveGetHostsMock.resolves();
    const projectRootDir = "/mock/project";
    const rootID = "rootComponent";

    const taskHosts = [{ hostname: "task1" }, { hostname: "task2" }];
    const storageHosts = [{ hostname: "storage1", isStorage: true }];

    recursiveGetHostsMock.callsFake(async (_, __, hosts, storageHostsList)=>{
      hosts.push(...taskHosts);
      storageHostsList.push(...storageHosts);
    });

    const result = await getHosts(projectRootDir, rootID);

    expect(result).to.deep.include.members([...storageHosts, ...taskHosts]);
  });

  it("should return an empty array if no hosts are found", async ()=>{
    recursiveGetHostsMock.resolves();
    const projectRootDir = "/mock/project";
    const rootID = "rootComponent";

    const result = await getHosts(projectRootDir, rootID);

    expect(result).to.deep.equal([]);
  });
});
