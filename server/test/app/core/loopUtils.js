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
const { forTripCount, loopInitialize } = require("../../../app/core/loopUtils.js");

describe("UT for loopInitialize()", ()=>{
  let component;

  beforeEach(()=>{
    component = {
      name: "dummy",
      env: {},
      type: "dummy"
    };
  });

  it("should be initialized component", ()=>{
    loopInitialize(component);
    expect(component).to.deep.equal({
      numFinished: 0,
      numFailed: 0,
      currentIndex: 0,
      name: "dummy",
      originalName: "dummy",
      env: {},
      type: "dummy",
      initialized: true
    });
  });

  it("currentIndex should be set when having indexList of array type", ()=>{
    component = {
      ...component,
      indexList: [1, 2]
    };
    loopInitialize(component);
    expect(component.currentIndex).to.be.equal(1);
  });

  it("currentIndex should be set when having start is not undefined", ()=>{
    component = {
      ...component,
      start: 1
    };
    loopInitialize(component);
    expect(component.currentIndex).to.be.equal(1);
  });

  it("indexList has priority over start when setting currentIndex", ()=>{
    component = {
      ...component,
      indexList: [1],
      start: 2
    };
    loopInitialize(component);
    expect(component.currentIndex).to.be.equal(1);
  });

  it("numTotal should be set when getTripCount is available", ()=>{
    component = {
      ...component,
      dummy: 1
    };
    loopInitialize(component, (component)=>{
      return component.dummy + 1;
    });
    expect(component.numTotal).to.be.equal(2);
  });

  it("env should be set when env is undefined", ()=>{
    delete component.env;
    loopInitialize(component);
    expect(component.env).to.deep.equal({});
  });

  it("WHEEL_FOR_START shoulde be set when start is not undefined", ()=>{
    component = {
      ...component,
      start: 1
    };
    loopInitialize(component);
    expect(component.env.WHEEL_FOR_START).to.be.equal(1);
  });

  it("WHEEL_FOR_END shoulde be set when end is not undefined", ()=>{
    component = {
      ...component,
      end: 1
    };
    loopInitialize(component);
    expect(component.env.WHEEL_FOR_END).to.be.equal(1);
  });

  it("WHEEL_FOR_STEP shoulde be set when step is not undefined", ()=>{
    component = {
      ...component,
      step: 1
    };
    loopInitialize(component);
    expect(component.env.WHEEL_FOR_STEP).to.be.equal(1);
  });

  it("WHEEL_LOOP_LEN shoulde be set when numTotal is not undefined", ()=>{
    component = {
      ...component,
      numTotal: 1
    };
    loopInitialize(component);
    expect(component.env.WHEEL_LOOP_LEN).to.be.equal(1);
  });

  it("WHEEL_FOREACH_LEN shoulde be set when type is foreach", ()=>{
    component = {
      ...component,
      type: "foreach",
      numTotal: 1
    };
    loopInitialize(component);
    expect(component.env.WHEEL_FOREACH_LEN).to.be.equal(1);
  });
});

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
