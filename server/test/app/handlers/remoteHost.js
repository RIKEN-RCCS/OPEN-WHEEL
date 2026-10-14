/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
//setup test framework
import * as chai from "chai";
const expect = chai.expect;
import sinon from "sinon";
import sinonChai from "sinon-chai";
chai.use(sinonChai);

//testee
import { validateHostSetting, onAddHost, onUpdateHost } from "../../../app/handlers/remoteHost.js";

//stubs
import { remoteHost } from "../../../app/db/db.js";
import { getLogger } from "../../../app/logSettings.js";
const logger = getLogger();

describe("remoteHost handler UT", ()=>{
  describe("#validateHostSetting", ()=>{
    const base = ()=>{
      return { name: "foo", host: "bar", user: "baz" };
    };

    describe("empty string for properties without default value", ()=>{
      for (const prop of ["port", "keyFile", "path", "jobScheduler", "prependCmd", "execInterval", "readyTimeout", "JWTServerUser"]) {
        it(`should remove ${prop} if it is empty string`, async ()=>{
          const host = { ...base(), [prop]: "" };
          expect(await validateHostSetting(host)).to.be.true;
          expect(host).not.to.have.property(prop);
        });
      }
    });
    describe("empty string for properties with default value", ()=>{
      it("should not remove them", async ()=>{
        const host = { ...base(), sharedHost: "", sharedPath: "", localSharedPath: "" };
        expect(await validateHostSetting(host)).to.be.true;
        expect(host).to.include({ sharedHost: "", sharedPath: "", localSharedPath: "" });
      });
    });
    describe("empty string for required properties", ()=>{
      for (const prop of ["name", "host", "user"]) {
        it(`should reject if ${prop} is empty string`, async ()=>{
          const host = { ...base(), [prop]: "" };
          expect(await validateHostSetting(host)).to.be.false;
        });
      }
    });
    describe("missing required properties", ()=>{
      for (const prop of ["name", "host", "user"]) {
        it(`should reject if ${prop} does not exist`, async ()=>{
          const host = base();
          delete host[prop];
          expect(await validateHostSetting(host)).to.be.false;
        });
        it(`should reject if ${prop} is null`, async ()=>{
          const host = { ...base(), [prop]: null };
          expect(await validateHostSetting(host)).to.be.false;
        });
      }
    });
    describe("multiple invalid required properties", ()=>{
      beforeEach(()=>{
        sinon.stub(logger, "warn");
      });
      afterEach(()=>{
        sinon.restore();
      });
      it("should report all of missing and empty required properties at once", async ()=>{
        const host = { name: "" };
        expect(await validateHostSetting(host)).to.be.false;
        expect(logger.warn).to.have.been.calledOnce;
        const message = logger.warn.args[0][0];
        expect(message).to.include("name");
        expect(message).to.include("host");
        expect(message).to.include("user");
      });
      it("should report only invalid properties", async ()=>{
        const host = { name: "foo", host: "", port: "" };
        expect(await validateHostSetting(host)).to.be.false;
        const message = logger.warn.args[0][0];
        expect(message).to.include("host");
        expect(message).to.include("user");
        expect(message).not.to.include("name");
      });
    });
    it("should remove null properties", async ()=>{
      const host = { ...base(), port: null };
      expect(await validateHostSetting(host)).to.be.true;
      expect(host).not.to.have.property("port");
    });
    it("should keep valid values untouched", async ()=>{
      const host = { ...base(), port: 2222, path: "/home/baz", keyFile: "/home/baz/.ssh/id_rsa" };
      expect(await validateHostSetting(host)).to.be.true;
      expect(host).to.include({ port: 2222, path: "/home/baz", keyFile: "/home/baz/.ssh/id_rsa" });
    });
    it("should coerce numeric string port to number", async ()=>{
      const host = { ...base(), port: "2222" };
      expect(await validateHostSetting(host)).to.be.true;
      expect(host.port).to.equal(2222);
    });
    it("should keep 0 as a valid number", async ()=>{
      const host = { ...base(), renewInterval: 0 };
      expect(await validateHostSetting(host)).to.be.true;
      expect(host.renewInterval).to.equal(0);
    });
  });

  describe("#onAddHost / #onUpdateHost", ()=>{
    const socket = { emit: sinon.stub() };
    const cb = sinon.stub();
    beforeEach(()=>{
      socket.emit.reset();
      cb.reset();
      sinon.stub(remoteHost, "unshift").resolves("newID");
      sinon.stub(remoteHost, "update").resolves();
      sinon.stub(remoteHost, "getAll").returns([]);
    });
    afterEach(()=>{
      sinon.restore();
    });
    it("onAddHost should store host without empty port", async ()=>{
      await onAddHost(socket, { name: "foo", host: "bar", user: "baz", port: "" }, cb);
      expect(remoteHost.unshift).to.have.been.calledOnce;
      expect(remoteHost.unshift.args[0][0]).not.to.have.property("port");
      expect(cb).to.have.been.calledOnceWithExactly("newID");
    });
    it("onAddHost should reject and not store host with empty required property", async ()=>{
      await onAddHost(socket, { name: "foo", host: "", user: "baz" }, cb);
      expect(remoteHost.unshift).not.to.have.been.called;
      expect(cb).to.have.been.calledOnceWithExactly(false);
    });
    it("onUpdateHost should store host without empty port", async ()=>{
      await onUpdateHost(socket, { id: "id", name: "foo", host: "bar", user: "baz", port: "" }, cb);
      expect(remoteHost.update).to.have.been.calledOnce;
      expect(remoteHost.update.args[0][0]).not.to.have.property("port");
      expect(cb).to.have.been.calledOnceWithExactly("id");
    });
    it("onUpdateHost should reject and not store host with empty required property", async ()=>{
      await onUpdateHost(socket, { id: "id", name: "", host: "bar", user: "baz" }, cb);
      expect(remoteHost.update).not.to.have.been.called;
      expect(cb).to.have.been.calledOnceWithExactly(false);
    });
  });
});
