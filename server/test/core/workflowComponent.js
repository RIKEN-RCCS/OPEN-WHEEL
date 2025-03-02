/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";

//setup test framework
const { expect } = require("chai");

//testee
const { isLocalComponent } = require("../../app/core/workflowComponent");
const { getComponentDefaultName } = require("../../app/core/workflowComponent");

describe("UT for workflowComponents class", ()=>{
  describe("#isLocalComponent", ()=>{
    it("should return true if component.host is undefined", ()=>{
      const component = {};
      const result = isLocalComponent(component);
      expect(result).to.be.true;
    });
    it("should return true if component.host is 'localhost'", ()=>{
      const component = { host: "localhost" };
      const result = isLocalComponent(component);
      expect(result).to.be.true;
    });
    it("should return false if component.host is not 'localhost'", ()=>{
      const component = { host: "remotehost" };
      const result = isLocalComponent(component);
      expect(result).to.be.false;
    });
  });
  describe("#getComponentDefaultName", ()=>{
    it("should return 'sjTask' for 'stepjobTask' type", ()=>{
      const result = getComponentDefaultName("stepjobTask");
      expect(result).to.equal("sjTask");
    });
    it("should return 'bjTask' for 'bulkjobTask' type", ()=>{
      const result = getComponentDefaultName("bulkjobTask");
      expect(result).to.equal("bjTask");
    });
    it("should return the type itself if not 'stepjobTask' or 'bulkjobTask'", ()=>{
      const result = getComponentDefaultName("task");
      expect(result).to.equal("task");
    });
    it("should return the type itself for unknown types", ()=>{
      const result = getComponentDefaultName("unknownType");
      expect(result).to.equal("unknownType");
    });
  });
});
