/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */

//setup test framework
import * as chai from "chai";
const expect = chai.expect;

//testee
import { createValidationError } from "../../../app/lib/validationError.js";

describe("createValidationError UT", ()=>{
  it("should return an object with a message property", ()=>{
    const err = createValidationError("something went wrong");
    expect(err.message).to.equal("something went wrong");
  });
  it("should default ignoreable to false", ()=>{
    const err = createValidationError("some error");
    expect(err.ignoreable).to.be.false;
  });
  it("should set ignoreable to false when explicitly specified", ()=>{
    const err = createValidationError("some error", { ignoreable: false });
    expect(err.ignoreable).to.be.false;
  });
  it("should set ignoreable to true when specified", ()=>{
    const err = createValidationError("some warning", { ignoreable: true });
    expect(err.ignoreable).to.be.true;
  });
  it("should return a plain object, not an Error instance", ()=>{
    const err = createValidationError("test");
    expect(err).to.not.be.instanceof(Error);
  });
  it("should survive JSON serialisation with message intact", ()=>{
    const err = createValidationError("test message", { ignoreable: true });
    const parsed = JSON.parse(JSON.stringify(err));
    expect(parsed.message).to.equal("test message");
    expect(parsed.ignoreable).to.be.true;
  });
  it("should handle empty message", ()=>{
    const err = createValidationError("");
    expect(err.message).to.equal("");
    expect(err.ignoreable).to.be.false;
  });
});
