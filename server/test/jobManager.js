/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";

//setup test framework
const chai = require("chai");
const expect = chai.expect;
chai.use(require("sinon-chai"));
const rewire = require("rewire");

//testee
const jobManager = rewire("../app/core/jobManager");
const getFirstCapture = jobManager.__get__("getFirstCapture");

describe("UT for jobManager class", ()=>{
  describe("#getFirstCapture", ()=>{
    it("should return null if regexp does not match", ()=>{
      expect(getFirstCapture("hoge", "q")).to.be.null;
    });
    it("should return null if capture failed", ()=>{
      expect(getFirstCapture("hoge", "e(\\d)")).to.be.null;
    });
    it("should return null if regexp does not have capture", ()=>{
      expect(getFirstCapture("hoge", "e")).to.be.null;
    });
    it("should return captured string ", ()=>{
      expect(getFirstCapture("hoge", "h(o)ge")).to.equal("o");
    });
    it("should return first captured string ", ()=>{
      expect(getFirstCapture("hoge", "h(o)g(e)")).to.equal("o");
    });
  });
});
