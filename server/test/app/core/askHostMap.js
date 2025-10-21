/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */

//setup test framework
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
import sinon from "sinon";

import { isValidHostMap, askHostMap, _internal } from "../../../app/core/askHostMap.js";

describe("hostMapper UT", function () {
  //eslint-disable-next-line no-unused-vars
  let remoteHostStub;
  let emitAllStub;
  beforeEach(()=>{
    remoteHostStub = sinon.stub(_internal.remoteHost, "getAll").returns([{ name: "a" }, { name: "b" }, { name: "c" }]);
    emitAllStub = sinon.stub(_internal, "emitAll");
  });
  afterEach(()=>{
    sinon.restore();
  });

  describe("#isValidHostMap", ()=>{
    it("should return false if one of hostMap's key is not string", ()=>{
      expect(isValidHostMap({ 0: 1 }, [])).to.be.false;
    });
    it("should return false if one of hostMap's key is not included in hosts", ()=>{
      expect(isValidHostMap({ key: "hostname" }, [])).to.be.false;
    });
    it("should return false if one of hostMap's value is not included in remoteHost", ()=>{
      expect(isValidHostMap({ key: "hostname" }, [{ hostname: "key" }])).to.be.false;
    });
    it("sholud return true if all hostMap entry is valid", ()=>{
      expect(isValidHostMap({ foo: "a", bar: "b", baz: "b" }, [{ hostname: "foo" }, { hostname: "bar" }])).to.be.true;
    });
  });
  describe("#askHostMap", ()=>{
    const clientID = "dummyClientID";
    const hostMap = { foo: "a", bar: "b", baz: "b" };
    const hosts = [{ hostname: "foo" }, { hostname: "bar" }];
    beforeEach(()=>{
      emitAllStub.reset();
    });
    it("should resolve with hostMap", async ()=>{
      emitAllStub.callsArgWith(3, hostMap);
      expect(await askHostMap(clientID, hosts)).to.equal(hostMap);
      const firstCall = emitAllStub.getCall(0);
      expect(firstCall.args[0]).to.equal(clientID);
      expect(firstCall.args[1]).to.equal("askHostMap");
      expect(firstCall.args[2]).to.deep.equal(hosts);
    });
    it("should throw exception if cb called with null", ()=>{
      emitAllStub.callsArgWith(3, null);
      return expect(askHostMap(clientID, hosts)).to.rejectedWith("user canceled host map input");
    });
    it("should throw exception if cb called with invalid hostMap", ()=>{
      const invalidHostMap = { 0: 1 };
      emitAllStub.callsArgWith(3, invalidHostMap);
      return expect(askHostMap(clientID, hosts)).to.rejectedWith("invalid host map");
    });
  });
});
