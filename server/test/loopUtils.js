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
const { forTripCount } = require("../app/core/loopUtils.js");

describe("UT for forTripCount()", ()=>{
  it("should be work with positive length in 1 increments", ()=>{
    expect(forTripCount({ start: 1, end: 3, step: 1 })).to.be.equal(3);
  });
  it("should be work with positive length and divisible step width", ()=>{
    expect(forTripCount({ start: 1, end: 3, step: 2 })).to.be.equal(2);
  });
  it("should be work with positive length and indivisible step width", ()=>{
    expect(forTripCount({ start: 1, end: 4, step: 2 })).to.be.equal(2);
  });
  it("should be work with negative length in 1 increments", ()=>{
    expect(forTripCount({ start: 3, end: 1, step: -1 })).to.be.equal(3);
  });
  it("should be work with negative length and divisible step width", ()=>{
    expect(forTripCount({ start: 3, end: 1, step: -2 })).to.be.equal(2);
  });
  it("should be work with negative length and indivisible step width", ()=>{
    expect(forTripCount({ start: 4, end: 1, step: -2 })).to.be.equal(2);
  });

  it("should be work with a combination of start and end across 0 in 1 increments", ()=>{
    expect(forTripCount({ start: -3, end: 2, step: 1 })).to.be.equal(6);
  });
  it("should be work with a combination of start and end across 0  and divisible step width", ()=>{
    expect(forTripCount({ start: -3, end: 2, step: 3 })).to.be.equal(2);
  });
  it("should be work with a combination of start and end across 0  and indivisible step width", ()=>{
    expect(forTripCount({ start: -3, end: 2, step: 4 })).to.be.equal(2);
  });
});
