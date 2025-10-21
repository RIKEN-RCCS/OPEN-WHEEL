/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */

import { expect } from "chai";
import sinon from "sinon";
import {
  hasEntry,
  addSsh,
  getSsh,
  getSshHostinfo,
  getSshPW,
  getSshPH,
  removeSsh,
  askPassword,
  createSsh,
  _internal
} from "../../../app/core/sshManager.js";
describe("#hasEntry", ()=>{
  let dbMock;

  beforeEach(()=>{
    dbMock = new Map();
    sinon.stub(_internal, "db").value(dbMock);
  });
  afterEach(()=>{
    sinon.restore();
  });

  it("should return false if the projectRootDir is not in db", ()=>{
    const result = hasEntry("/path/to/projectA", "someID");
    expect(result).to.be.false;
  });

  it("should return false if db has the projectRootDir but does not have the id", ()=>{
    const projectDir = "/path/to/projectB";
    dbMock.set(projectDir, new Map());

    const result = hasEntry(projectDir, "missingID");
    expect(result).to.be.false;
  });

  it("should return true if db has the projectRootDir and the id", ()=>{
    const projectDir = "/path/to/projectC";
    const id = "existingID";

    const subMap = new Map();
    subMap.set(id, { ssh: "dummySshObject" });
    dbMock.set(projectDir, subMap);

    const result = hasEntry(projectDir, id);
    expect(result).to.be.true;
  });
});

describe("#addSsh", ()=>{
  let dbMock;

  beforeEach(()=>{
    dbMock = new Map();
    sinon.stub(_internal, "db").value(dbMock);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should create a new Map when the projectRootDir does not exist in db", ()=>{
    const projectRootDir = "/dummy/path";
    const hostinfo = { id: "host-123" };
    const ssh = { connect: ()=>{} };
    const pw = "dummyPw";
    const ph = "dummyPh";
    const isStorage = false;

    addSsh(projectRootDir, hostinfo, ssh, pw, ph, isStorage);

    expect(dbMock.has(projectRootDir)).to.be.true;
    const projectMap = dbMock.get(projectRootDir);
    expect(projectMap.get("host-123")).to.deep.equal({ ssh, hostinfo, pw, ph, isStorage });
  });

  it("should reuse existing Map when the projectRootDir already exists in db", ()=>{
    const projectRootDir = "/exists/path";
    const existingMap = new Map();
    dbMock.set(projectRootDir, existingMap);

    const hostinfo = { id: "host-999" };
    const ssh = { connect: ()=>{} };
    const pw = "secretPw";
    const ph = "secretPh";
    const isStorage = true;

    addSsh(projectRootDir, hostinfo, ssh, pw, ph, isStorage);

    expect(dbMock.get(projectRootDir).get("host-999")).to.deep.equal({ ssh, hostinfo, pw, ph, isStorage });
  });
});

describe("#getSsh", ()=>{
  let hasEntryStub;
  let dbMock;

  beforeEach(()=>{
    hasEntryStub = sinon.stub(_internal, "hasEntry");
    dbMock = new Map();
    sinon.stub(_internal, "db").value(dbMock);
  });
  afterEach(()=>{
    sinon.restore();
  });

  it("should throw an error if ssh instance is not registered for the project", ()=>{
    hasEntryStub.returns(false);
    const projectRootDir = "/mock/project/root";
    const hostID = "someHostID";

    try {
      getSsh(projectRootDir, hostID);
      throw new Error("Expected getSsh to throw an error");
    } catch (err) {
      expect(err).to.be.an("Error");
      expect(err.message).to.equal("ssh instance is not registerd for the project");
      expect(err.projectRootDir).to.equal(projectRootDir);
      expect(err.id).to.equal(hostID);
    }
  });

  it("should return ssh instance when entry exists in db", ()=>{
    hasEntryStub.returns(true);
    const projectRootDir = "/mock/project/root";
    const hostID = "existingHost";
    const sshInstanceMock = {};
    const hostMap = new Map();
    hostMap.set(hostID, { ssh: sshInstanceMock });
    dbMock.set(projectRootDir, hostMap);

    const result = getSsh(projectRootDir, hostID);
    expect(result).to.equal(sshInstanceMock);
  });
});

describe("#getSshHostinfo", ()=>{
  let hasEntryStub;
  let dbMock;

  beforeEach(()=>{
    hasEntryStub = sinon.stub(_internal, "hasEntry");
    dbMock = new Map();
    dbMock.set("mockProjectDir", new Map([
      ["mockHostID", { hostinfo: { host: "somehost" } }]
    ]));
    sinon.stub(_internal, "db").value(dbMock);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should throw an error if the hostinfo is not registered", ()=>{
    hasEntryStub.returns(false);

    try {
      getSshHostinfo("mockProjectDir", "unregisteredID");
      throw new Error("Expected getSshHostinfo to throw an error");
    } catch (err) {
      expect(err.message).to.equal("hostinfo is not registerd for the project");
      expect(err.projectRootDir).to.equal("mockProjectDir");
      expect(err.id).to.equal("unregisteredID");
    }
  });

  it("should return hostinfo object if the entry exists", ()=>{
    hasEntryStub.returns(true);

    const result = getSshHostinfo("mockProjectDir", "mockHostID");
    expect(result).to.deep.equal({ host: "somehost" });
  });
});

describe("#getSshPW", ()=>{
  let hasEntryStub;
  let dbMock;

  beforeEach(()=>{
    hasEntryStub = sinon.stub(_internal, "hasEntry");
    dbMock = new Map();
    sinon.stub(_internal, "db").value(dbMock);
  });
  afterEach(()=>{
    sinon.restore();
  });

  it("should throw an error if hostinfo is not registered for the project", ()=>{
    hasEntryStub.returns(false);

    expect(()=>{
      getSshPW("/path/to/project", "hostID");
    }).to.throw("hostinfo is not registerd for the project")
      .and.to.have.property("projectRootDir", "/path/to/project");

    expect(hasEntryStub.calledOnceWithExactly("/path/to/project", "hostID")).to.be.true;
  });

  it("should return the password (string) if hasEntry is true", ()=>{
    hasEntryStub.returns(true);
    dbMock.set("/path/to/project", new Map([
      ["hostID", { pw: "mySecretPassword" }]
    ]));

    const result = getSshPW("/path/to/project", "hostID");
    expect(result).to.equal("mySecretPassword");
  });

  it("should return the password (function) if pw is defined as a function", ()=>{
    hasEntryStub.returns(true);
    const pwFunc = ()=>{ return "secretFromFunction"; };
    dbMock.set("/path/to/project", new Map([
      ["hostID", { pw: pwFunc }]
    ]));

    const result = getSshPW("/path/to/project", "hostID");
    expect(result).to.be.a("function");
    expect(result()).to.equal("secretFromFunction");
  });
});

describe("#getSshPH", ()=>{
  let hasEntryStub;
  let dbStub;

  beforeEach(()=>{
    hasEntryStub = sinon.stub(_internal, "hasEntry");
    dbStub = new Map();
    sinon.stub(_internal, "db").value(dbStub);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should throw an error if hostinfo is not registered for the project", ()=>{
    const projectRootDir = "/dummy/project";
    const hostID = "unregisteredHost";
    hasEntryStub.returns(false);

    try {
      getSshPH(projectRootDir, hostID);
      expect.fail("Expected getSshPH to throw an error, but it did not");
    } catch (err) {
      expect(err).to.be.instanceOf(Error);
      expect(err.message).to.equal("hostinfo is not registerd for the project");
      expect(err.projectRootDir).to.equal(projectRootDir);
      expect(err.id).to.equal(hostID);
    }
    expect(hasEntryStub.calledOnceWithExactly(projectRootDir, hostID)).to.be.true;
  });

  it("should return the passphrase if hostinfo is registered for the project", ()=>{
    const projectRootDir = "/dummy/project";
    const hostID = "registeredHost";
    hasEntryStub.returns(true);
    const hostMap = new Map();
    hostMap.set(hostID, { ph: "mySecretPassphrase" });
    dbStub.set(projectRootDir, hostMap);

    const result = getSshPH(projectRootDir, hostID);
    expect(result).to.equal("mySecretPassphrase");
    expect(hasEntryStub.calledOnceWithExactly(projectRootDir, hostID)).to.be.true;
  });
});

describe("#removeSsh", ()=>{
  let dbMock;

  beforeEach(()=>{
    dbMock = new Map();
    sinon.stub(_internal, "db").value(dbMock);
  });
  afterEach(()=>{
    sinon.restore();
  });

  it("should return immediately if db does not have projectRootDir", ()=>{
    removeSsh("notExistsDir");
    expect(dbMock.has("notExistsDir")).to.be.false;
  });

  it("should clear the map if it is empty and the projectRootDir is found", ()=>{
    const projectRootDir = "emptyDir";
    dbMock.set(projectRootDir, new Map());

    removeSsh(projectRootDir);

    expect(dbMock.get(projectRootDir).size).to.equal(0);
  });

  it("should disconnect all non-storage entries and clear db if no storage entries exist", ()=>{
    const projectRootDir = "noStorageDir";
    const disconnectMock = sinon.stub();
    const mapForDir = new Map();
    mapForDir.set("hostA", { isStorage: false, ssh: { disconnect: disconnectMock } });
    mapForDir.set("hostB", { isStorage: false, ssh: { disconnect: disconnectMock } });
    dbMock.set(projectRootDir, mapForDir);

    removeSsh(projectRootDir);

    expect(disconnectMock.callCount).to.equal(2);
    expect(dbMock.get(projectRootDir).size).to.equal(0);
  });

  it("should skip disconnect for storage entries and not clear the map if any storage is found", ()=>{
    const projectRootDir = "withStorageDir";
    const storageDisconnectMock = sinon.stub();
    const normalDisconnectMock = sinon.stub();
    const mapForDir = new Map();
    mapForDir.set("hostStorage", { isStorage: true, ssh: { disconnect: storageDisconnectMock } });
    mapForDir.set("hostNonStorage", { isStorage: false, ssh: { disconnect: normalDisconnectMock } });
    dbMock.set(projectRootDir, mapForDir);

    removeSsh(projectRootDir);

    expect(storageDisconnectMock.called).to.be.false;
    expect(normalDisconnectMock.calledOnce).to.be.true;
    expect(dbMock.get(projectRootDir).size).to.equal(2);
  });
});

describe("#askPassword", ()=>{
  let emitAllStub;

  beforeEach(()=>{
    emitAllStub = sinon.stub(_internal, "emitAll");
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should resolve with data if the user provides a non-null password", async ()=>{
    emitAllStub.callsFake((clientID, event, hostname, mode, JWTServerURL, callback)=>{
      callback("secretPW");
    });

    const result = await askPassword("dummyClientID", "Please enter your password");
    expect(result).to.equal("secretPW");
    expect(emitAllStub.calledOnce).to.be.true;
  });

  it("should reject with an error if the user cancels the password input (data === null)", async ()=>{
    emitAllStub.callsFake((clientID, event, hostname, mode, JWTServerURL, callback)=>{
      callback(null);
    });

    try {
      await askPassword("dummyClientID", "Please enter your password");
      expect.fail("Expected askPassword to reject, but it resolved");
    } catch (err) {
      expect(err).to.be.an("error");
      expect(err.message).to.equal("user canceled ssh password prompt");
      expect(err.reason).to.equal("CANCELED");
    }
    expect(emitAllStub.calledOnce).to.be.true;
  });
});

describe("#createSsh", ()=>{
  let hasEntryStub;
  let getSshStub;
  let addSshStub;
  let askPasswordStub;
  let SshClientWrapperStub;
  let canConnectStub;
  let originalWheelVerboseSsh;

  beforeEach(()=>{
    hasEntryStub = sinon.stub(_internal, "hasEntry");
    getSshStub = sinon.stub(_internal, "getSsh");
    addSshStub = sinon.stub(_internal, "addSsh");
    askPasswordStub = sinon.stub(_internal, "askPassword");
    canConnectStub = sinon.stub();
    SshClientWrapperStub = sinon.stub(_internal, "SshClientWrapper").callsFake(function () {
      return {
        canConnect: canConnectStub
      };
    });
    originalWheelVerboseSsh = process.env.WHEEL_VERBOSE_SSH;
    delete process.env.WHEEL_VERBOSE_SSH;
  });

  afterEach(()=>{
    sinon.restore();
    if (originalWheelVerboseSsh !== undefined) {
      process.env.WHEEL_VERBOSE_SSH = originalWheelVerboseSsh;
    } else {
      delete process.env.WHEEL_VERBOSE_SSH;
    }
  });

  it("should return an existing ssh instance if hasEntry is true", async ()=>{
    hasEntryStub.returns(true);
    const dummySshInstance = { dummy: "sshInstance" };
    getSshStub.returns(dummySshInstance);

    const projectRootDir = "/test/project";
    const hostinfo = { id: "host-abc" };
    const clientID = "clientXYZ";
    const remoteHostName = "remoteHostTest";

    const result = await createSsh(projectRootDir, remoteHostName, hostinfo, clientID, false);

    expect(hasEntryStub.calledOnceWithExactly(projectRootDir, "host-abc")).to.be.true;
    expect(getSshStub.calledOnceWithExactly(projectRootDir, "host-abc")).to.be.true;
    expect(result).to.deep.equal(dummySshInstance);
    expect(SshClientWrapperStub.notCalled).to.be.true;
    expect(addSshStub.notCalled).to.be.true;
  });

  it("should handle string password and skip askPassword", async ()=>{
    hasEntryStub.returns(false);
    const projectRootDir = "/test/project";
    const remoteHostName = "testHost";
    const hostinfo = {
      id: "host-xyz",
      password: "mySecretPassword"
    };
    const clientID = "cid-0001";
    canConnectStub.resolves(true);

    const sshInstance = await createSsh(projectRootDir, remoteHostName, hostinfo, clientID, false);

    expect(hasEntryStub.calledWithExactly(projectRootDir, "host-xyz")).to.be.true;
    expect(askPasswordStub.notCalled).to.be.true;
    expect(SshClientWrapperStub.calledOnce).to.be.true;
    expect(canConnectStub.calledOnce).to.be.true;
    expect(addSshStub.calledOnce).to.be.true;
    expect(sshInstance).to.be.ok;
  });

  it("should set hostinfo.password as an async function that calls askPassword if not a string", async ()=>{
    hasEntryStub.returns(false);
    const projectRootDir = "/test/project";
    const remoteHostName = "sampleHost";
    const hostinfo = {
      id: "host-pswdFunc"
    };
    const clientID = "client-pswdTest";
    canConnectStub.resolves(true);
    askPasswordStub.resolves("p@ssw0rd!");

    const result = await createSsh(projectRootDir, remoteHostName, hostinfo, clientID, false);

    expect(typeof hostinfo.password).to.equal("function");
    expect(addSshStub.calledOnce).to.be.true;
    expect(askPasswordStub.callCount).to.satisfy((count)=>{
      return count === 0 || count === 1;
    });
    expect(result).to.be.ok;
  });

  it("should set passphrase async function and call askPassword if needed", async ()=>{
    hasEntryStub.returns(false);
    canConnectStub.resolves(true);
    askPasswordStub.resolves("passphraseTest");

    const projectRootDir = "/test/project";
    const remoteHostName = "sampleHost2";
    const hostinfo = {
      id: "host-pp",
      password: "alreadyStringPassword"
    };
    const clientID = "client-pp";

    await createSsh(projectRootDir, remoteHostName, hostinfo, clientID, false);

    expect(typeof hostinfo.passphrase).to.equal("function");
    expect(addSshStub.calledOnce).to.be.true;
  });

  it("should set ControlPersist if renewInterval is provided", async ()=>{
    hasEntryStub.returns(false);
    canConnectStub.resolves(true);

    const hostinfo = {
      id: "renewTest",
      renewInterval: 10
    };
    await createSsh("/test/project", "renewHost", hostinfo, "cid999", false);

    expect(hostinfo).to.have.property("ControlPersist", 600);
    expect(addSshStub.calledOnce).to.be.true;
  });

  it("should set ConnectTimeout if readyTimeout is provided", async ()=>{
    hasEntryStub.returns(false);
    canConnectStub.resolves(true);

    const hostinfo = {
      id: "rtTest",
      readyTimeout: 25000
    };
    await createSsh("/test/proj", "rtHost", hostinfo, "cid-rt", false);

    expect(hostinfo).to.have.property("ConnectTimeout", 25);
    expect(addSshStub.calledOnce).to.be.true;
  });

  it("should set sshOpt=['-vvv'] if WHEEL_VERBOSE_SSH is truthy", async ()=>{
    process.env.WHEEL_VERBOSE_SSH = "true";
    hasEntryStub.returns(false);
    canConnectStub.resolves(true);

    const hostinfo = { id: "verboseTest" };
    await createSsh("/vProj", "vHost", hostinfo, "cl-v", false);

    expect(hostinfo).to.have.property("sshOpt");
    expect(hostinfo.sshOpt).to.deep.equal(["-vvv"]);
    expect(addSshStub.calledOnce).to.be.true;
  });

  it("should copy username to user and remove username if exist", async ()=>{
    hasEntryStub.returns(false);
    canConnectStub.resolves(true);

    const hostinfo = {
      id: "renameUser",
      username: "testUser"
    };
    await createSsh("/projUser", "hostUser", hostinfo, "cidUser", false);

    expect(hostinfo).to.not.have.property("username");
    expect(hostinfo).to.have.property("user", "testUser");
    expect(addSshStub.calledOnce).to.be.true;
  });

  it("should set rcfile to /etc/profile if not present", async ()=>{
    hasEntryStub.returns(false);
    canConnectStub.resolves(true);

    const hostinfo = { id: "rcTest" };
    await createSsh("/projRc", "hostRc", hostinfo, "cidRc", false);

    expect(hostinfo).to.have.property("rcfile", "/etc/profile");
    expect(addSshStub.calledOnce).to.be.true;
  });

  it("should addSsh only if ssh.canConnect succeeds", async ()=>{
    hasEntryStub.returns(false);

    canConnectStub.resolves(true);
    const hostinfoTrue = { id: "trueCase" };
    await createSsh("/testTrue", "trueHost", hostinfoTrue, "cidTrue", false);
    expect(addSshStub.calledOnce).to.be.true;

    addSshStub.resetHistory();
    canConnectStub.resolves(false);
    const hostinfoFalse = { id: "falseCase" };
    await createSsh("/testFalse", "falseHost", hostinfoFalse, "cidFalse", false);
    expect(addSshStub.notCalled).to.be.true;
  });

  it("should throw error with appended message if 'Control socket creation failed'", async ()=>{
    hasEntryStub.returns(false);

    const hostinfo = { id: "failCase" };
    const error = new Error("Control socket creation failed");
    canConnectStub.rejects(error);

    try {
      await createSsh("/failProj", "failHost", hostinfo, "cidFail", false);
      throw new Error("Expected createSsh to throw, but it did not");
    } catch (err) {
      expect(err.message).to.include("Control socket creation failed");
      expect(err.message).to.include("you can avoid this error by using SSH_CONTROL_PERSIST_DIR");
    }
  });

  it("should throw generic error if unknown error happens during canConnect", async ()=>{
    hasEntryStub.returns(false);

    const hostinfo = { id: "failUnknown" };
    canConnectStub.rejects(new Error("Some random error"));

    try {
      await createSsh("/unknownProj", "unknownHost", hostinfo, "cidUnknown", false);
      throw new Error("Expected error but none thrown");
    } catch (err) {
      expect(err.message).to.equal("ssh connection failed due to unknown reason");
    }
  });
});
