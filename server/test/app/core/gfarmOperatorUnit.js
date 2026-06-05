/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */

import { expect } from "chai";
import sinon from "sinon";
import os from "os";
import { getGfarmXattr, setGfarmXattr, _internal } from "../../../app/core/gfarmOperator.js";

//Use an existing directory so the logger can create its log file without errors
const PROJECT_ROOT = os.tmpdir();

/**
 * Build a mock SSH object simulating a logged-in session.
 * exec() calls the callback with a "jwt-agent running" message to satisfy checkJWTAgent.
 * @param {sinon.SinonStub} execAndGetOutputStub - pre-configured stub for execAndGetOutput
 * @returns {object} - mock SSH object
 */
function makeMockSsh(execAndGetOutputStub) {
  return {
    execAndGetOutput: execAndGetOutputStub,
    exec: sinon.stub().callsFake((_cmd, _timeout, cb)=>{
      if (cb) {
        cb("jwt-agent pid 1234 is running");
      }
      return Promise.resolve(0);
    })
  };
}

describe("#getGfarmXattr", ()=>{
  let execAndGetOutputStub;

  beforeEach(()=>{
    execAndGetOutputStub = sinon.stub();
    sinon.stub(_internal, "getSsh").resolves(makeMockSsh(execAndGetOutputStub));
    sinon.stub(_internal, "getSshHostinfo").returns({ JWTServerUser: "user", JWTServerURL: "https://dummy/" });
    sinon.stub(_internal, "getJWTServerPassphrase").returns("passphrase");
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should call gfxattr -g -x with gfarm:// URL and attribute name and return joined output", async ()=>{
    const xmlLine1 = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";
    const xmlLine2 = "<workflow><component type=\"task\" name=\"t\" id=\"id1\"/></workflow>";
    execAndGetOutputStub.resolves({ rt: 0, output: [xmlLine1, xmlLine2] });

    const result = await getGfarmXattr(PROJECT_ROOT, "hostID", "/gfarm/path/file.dat", "wheel.workflow");

    expect(execAndGetOutputStub.calledOnce).to.be.true;
    const [cmdline] = execAndGetOutputStub.firstCall.args;
    expect(cmdline).to.include("gfxattr -g -x");
    expect(cmdline).to.include("gfarm:///gfarm/path/file.dat");
    expect(cmdline).to.include("wheel.workflow");
    expect(result).to.equal(`${xmlLine1}\n${xmlLine2}`);
  });

  it("should prefix absolute path with gfarm:// in the command", async ()=>{
    execAndGetOutputStub.resolves({ rt: 0, output: ["<workflow/>"] });

    await getGfarmXattr(PROJECT_ROOT, "hostID", "/data/result.dat", "wheel.workflow");

    const [cmdline] = execAndGetOutputStub.firstCall.args;
    expect(cmdline).to.include("gfarm:///data/result.dat");
  });

  it("should throw when gfxattr command returns non-zero exit code", async ()=>{
    execAndGetOutputStub.resolves({ rt: 1, output: ["gfxattr: no such attribute\n"] });

    let threw = false;
    try {
      await getGfarmXattr(PROJECT_ROOT, "hostID", "/data/file.dat", "wheel.workflow");
    } catch {
      threw = true;
    }
    expect(threw).to.be.true;
  });
});

describe("#setGfarmXattr", ()=>{
  let execAndGetOutputStub;

  beforeEach(()=>{
    execAndGetOutputStub = sinon.stub();
    sinon.stub(_internal, "getSsh").resolves(makeMockSsh(execAndGetOutputStub));
    sinon.stub(_internal, "getSshHostinfo").returns({ JWTServerUser: "user", JWTServerURL: "https://dummy/" });
    sinon.stub(_internal, "getJWTServerPassphrase").returns("passphrase");
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should call gfxattr -s -x with base64-encoded XML and gfarm:// URL", async ()=>{
    execAndGetOutputStub.resolves({ rt: 0, output: [] });

    const xml = "<workflow><component type=\"task\" name=\"t\" id=\"id1\"/></workflow>";
    await setGfarmXattr(PROJECT_ROOT, "hostID", "/gfarm/path/file.dat", "wheel.workflow", xml);

    expect(execAndGetOutputStub.calledOnce).to.be.true;
    const [cmdline] = execAndGetOutputStub.firstCall.args;
    expect(cmdline).to.include("gfxattr -s -x");
    expect(cmdline).to.include("gfarm:///gfarm/path/file.dat");
    expect(cmdline).to.include("wheel.workflow");
    const base64Xml = Buffer.from(xml).toString("base64");
    expect(cmdline).to.include(base64Xml);
  });
});
