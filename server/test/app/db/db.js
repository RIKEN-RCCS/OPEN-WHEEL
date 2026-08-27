/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";

//setup test framework
const chai = require("chai");
const expect = chai.expect;

//testee
const { _internal } = require("../../../app/db/db.js");
const { envIntOr } = _internal;

describe("UT for db.js config helpers", function () {
  describe("#envIntOr", ()=>{
    it("returns the fallback when the env var is undefined", ()=>{
      expect(envIntOr(undefined, 8089)).to.equal(8089);
    });
    it("returns the fallback for an empty-string env var", ()=>{
      expect(envIntOr("", 8089)).to.equal(8089);
    });
    it("returns the fallback for a whitespace-only env var", ()=>{
      expect(envIntOr("   ", 8089)).to.equal(8089);
    });
    it("returns the fallback for a non-numeric env var", ()=>{
      expect(envIntOr("not-a-number", 8089)).to.equal(8089);
    });
    it("returns the parsed integer for a numeric env var (env wins over config)", ()=>{
      expect(envIntOr("39999", 8089)).to.equal(39999);
    });
    it("honours a non-empty '0' instead of falling through to the fallback", ()=>{
      expect(envIntOr("0", 8089)).to.equal(0);
    });
    it("parses a leading integer like parseInt does", ()=>{
      expect(envIntOr("8080abc", 8089)).to.equal(8080);
    });
    it("tolerates surrounding whitespace around a number", ()=>{
      expect(envIntOr("  4000  ", 8089)).to.equal(4000);
    });
  });
});
