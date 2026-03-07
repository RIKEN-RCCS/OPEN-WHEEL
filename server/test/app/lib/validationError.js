/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */

//setup test framework
import * as chai from "chai";
const expect = chai.expect;

//testee
import { ValidationError } from "../../../app/lib/validationError.js";

describe("ValidationError UT", ()=>{
  describe("constructor", ()=>{
    it("should set the message property", ()=>{
      const err = new ValidationError("something went wrong");
      expect(err.message).to.equal("something went wrong");
    });
    it("should default ignoreable to false", ()=>{
      const err = new ValidationError("some error");
      expect(err.ignoreable).to.be.false;
    });
    it("should set ignoreable to false when explicitly specified", ()=>{
      const err = new ValidationError("some error", { ignoreable: false });
      expect(err.ignoreable).to.be.false;
    });
    it("should set ignoreable to true when specified", ()=>{
      const err = new ValidationError("some warning", { ignoreable: true });
      expect(err.ignoreable).to.be.true;
    });
    it("should be an instance of Error", ()=>{
      const err = new ValidationError("test");
      expect(err).to.be.instanceof(Error);
    });
    it("should be an instance of ValidationError", ()=>{
      const err = new ValidationError("test");
      expect(err).to.be.instanceof(ValidationError);
    });
    it("should have name set to ValidationError", ()=>{
      const err = new ValidationError("test");
      expect(err.name).to.equal("ValidationError");
    });
    it("should handle empty message", ()=>{
      const err = new ValidationError("");
      expect(err.message).to.equal("");
      expect(err.ignoreable).to.be.false;
    });
  });
});
