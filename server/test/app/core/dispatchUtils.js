/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const { expect } = require("chai");
const { describe, it } = require("mocha");
const { isFinishedState } = require("../../../app/core/dispatchUtils");

describe("#isFinishedState", ()=>{
  it("should return true if the status is finished", ()=>{
    expect(isFinishedState("finished")).to.be.true;
  });

  it("should return true if the status is failed", ()=>{
    expect(isFinishedState("failed")).to.be.true;
  });

  it("should return true if the status is unknown", ()=>{
    expect(isFinishedState("unknown")).to.be.true;
  });

  it("should return false if the status is not finished, failed or unkown", ()=>{
    expect(isFinishedState("processing")).to.be.false;
  });

  it("judgement of the status should be case-sensitive", ()=>{
    expect(isFinishedState("Finished")).to.be.false;
  });

  it("should return false if the status is empty", ()=>{
    expect(isFinishedState("")).to.be.false;
  });

  it("should return false if the status is null", ()=>{
    expect(isFinishedState(null)).to.be.false;
  });

  it("should return false if the status is undefined", ()=>{
    expect(isFinishedState(undefined)).to.be.false;
  });
});
