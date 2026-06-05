"use strict";
const os = require("os");
const path = require("path");
const fs = require("fs-extra");

const chai = require("chai");
const expect = chai.expect;
const sinon = require("sinon");
chai.use(require("sinon-chai"));
const rewire = require("rewire");

describe("tryToConnect UT", ()=>{
  const originalHome = process.env.HOME;
  const originalWheelUseHttp = process.env.WHEEL_USE_HTTP;
  const originalWheelVerboseSsh = process.env.WHEEL_VERBOSE_SSH;
  let tempHome;
  let tryToConnect;
  let onTryToConnect;
  let SshClientWrapperMock;
  let canConnectMock;
  let disconnectMock;
  let askPasswordMock;
  let cb;

  before(async ()=>{
    tempHome = await fs.mkdtemp(path.join(os.tmpdir(), "wheel-try-connect-"));
    process.env.HOME = tempHome;
    process.env.WHEEL_USE_HTTP = "1";
    await fs.ensureDir(path.join(tempHome, ".wheel"));
    await Promise.all([
      fs.writeJson(path.join(tempHome, ".wheel", "remotehost.json"), []),
      fs.writeJson(path.join(tempHome, ".wheel", "projectList.json"), []),
      fs.writeJson(path.join(tempHome, ".wheel", "jobScriptTemplate.json"), [])
    ]);
  });

  beforeEach(()=>{
    cb = sinon.stub();
    canConnectMock = sinon.stub().resolves();
    disconnectMock = sinon.stub();
    askPasswordMock = sinon.stub();

    tryToConnect = rewire("../../../app/handlers/tryToConnect.js");
    SshClientWrapperMock = sinon.stub().callsFake((hostInfo)=>{
      return {
        hostInfo,
        canConnect: canConnectMock,
        disconnect: disconnectMock
      };
    });

    tryToConnect.__set__({
      SshClientWrapper: SshClientWrapperMock,
      askPassword: askPasswordMock,
      logger: {
        debug: sinon.stub(),
        info: sinon.stub(),
        error: sinon.stub()
      }
    });
    onTryToConnect = tryToConnect.__get__("onTryToConnect");
  });

  afterEach(()=>{
    sinon.restore();
    if (originalWheelVerboseSsh !== undefined) {
      process.env.WHEEL_VERBOSE_SSH = originalWheelVerboseSsh;
    } else {
      delete process.env.WHEEL_VERBOSE_SSH;
    }
  });

  after(async ()=>{
    if (originalHome !== undefined) {
      process.env.HOME = originalHome;
    } else {
      delete process.env.HOME;
    }
    if (originalWheelUseHttp !== undefined) {
      process.env.WHEEL_USE_HTTP = originalWheelUseHttp;
    } else {
      delete process.env.WHEEL_USE_HTTP;
    }
    await fs.remove(tempHome);
  });

  it("should set sshOpt when WHEEL_VERBOSE_SSH is truthy", async ()=>{
    process.env.WHEEL_VERBOSE_SSH = "true";
    const hostInfo = { name: "testHost", host: "localhost", port: 22, user: "test" };

    await onTryToConnect("client-1", hostInfo, cb);

    expect(hostInfo.sshOpt).to.deep.equal(["-vvv"]);
    expect(SshClientWrapperMock).to.have.been.calledOnceWithExactly(hostInfo);
    expect(cb).to.have.been.calledOnceWithExactly("success");
  });

  it("should not set sshOpt when WHEEL_VERBOSE_SSH is false-like", async ()=>{
    process.env.WHEEL_VERBOSE_SSH = "false";
    const hostInfo = { name: "testHost", host: "localhost", port: 22, user: "test" };

    await onTryToConnect("client-1", hostInfo, cb);

    expect(hostInfo).to.not.have.property("sshOpt");
    expect(SshClientWrapperMock).to.have.been.calledOnceWithExactly(hostInfo);
    expect(cb).to.have.been.calledOnceWithExactly("success");
  });
});
