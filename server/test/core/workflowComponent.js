/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";

//setup test framework
const { expect } = require("chai");
const sinon = require("sinon");
const rewire = require("rewire");
const rewWorkflowComponent = rewire("../../app/core/workflowComponent.js");

//testee
const { isLocalComponent } = require("../../app/core/workflowComponent");
const { getComponentDefaultName } = require("../../app/core/workflowComponent");
const { removeDuplicatedComponent } = require("../../app/core/workflowComponent");
const isInitialComponent = rewWorkflowComponent.__get__("isInitialComponent");
const isBehindIfComponent = rewWorkflowComponent.__get__("isBehindIfComponent");
const { hasChild } = require("../../app/core/workflowComponent");
const { componentFactory } = require("../../app/core/workflowComponent");

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
  describe("#removeDuplicatedComponent", ()=>{
    it("should return the same array if no duplicates", ()=>{
      const components = [
        { ID: "1", name: "Component 1" },
        { ID: "2", name: "Component 2" },
        { ID: "3", name: "Component 3" }
      ];
      const result = removeDuplicatedComponent(components);
      expect(result).to.deep.equal(components);
    });
    it("should remove duplicates based on ID", ()=>{
      const components = [
        { ID: "1", name: "Component 1" },
        { ID: "2", name: "Component 2" },
        { ID: "1", name: "Component 1 - duplicate" },
        { ID: "3", name: "Component 3" },
        { ID: "2", name: "Component 2 - duplicate" }
      ];
      const expected = [
        { ID: "1", name: "Component 1" },
        { ID: "2", name: "Component 2" },
        { ID: "3", name: "Component 3" }
      ];
      const result = removeDuplicatedComponent(components);
      expect(result).to.deep.equal(expected);
    });
    it("should return an empty array if input is empty", ()=>{
      const components = [];
      const result = removeDuplicatedComponent(components);
      expect(result).to.deep.equal([]);
    });
    it("should keep the first occurrence of each ID", ()=>{
      const components = [
        { ID: "1", name: "First Component 1" },
        { ID: "1", name: "Second Component 1" },
        { ID: "2", name: "Component 2" },
        { ID: "2", name: "Duplicate Component 2" }
      ];
      const expected = [
        { ID: "1", name: "First Component 1" },
        { ID: "2", name: "Component 2" }
      ];
      const result = removeDuplicatedComponent(components);
      expect(result).to.deep.equal(expected);
    });
    it("should not modify the original array", ()=>{
      const components = [
        { ID: "1", name: "Component 1" },
        { ID: "2", name: "Component 2" },
        { ID: "1", name: "Duplicate Component 1" }
      ];
      const clonedComponents = JSON.parse(JSON.stringify(components));
      removeDuplicatedComponent(components);
      expect(components).to.deep.equal(clonedComponents);
    });
  });
  describe("#isInitialComponent", ()=>{
    let isBehindIfComponentStub;
    beforeEach(()=>{
      isBehindIfComponentStub = sinon.stub();
      rewWorkflowComponent.__set__("isBehindIfComponent", isBehindIfComponentStub);
    });
    afterEach(()=>{
      sinon.restore();
    });
    it("should return false if the component is behind an 'if' component", async ()=>{
      const component = { type: "task" };
      isBehindIfComponentStub.resolves(true);
      const result = await isInitialComponent("/project/root", component);
      expect(result).to.be.false;
    });
    it("should return true if the component is a viewer", async ()=>{
      const component = { type: "viewer" };
      isBehindIfComponentStub.resolves(false);
      const result = await isInitialComponent("/project/root", component);
      expect(result).to.be.true;
    });
    it("should return false if the component has previous components", async ()=>{
      const component = {
        type: "task",
        previous: ["prev1", "prev2"]
      };
      isBehindIfComponentStub.resolves(false);
      const result = await isInitialComponent("/project/root", component);
      expect(result).to.be.false;
    });
    it("should return true if the component is a storage with output files", async ()=>{
      const component = {
        type: "storage",
        outputFiles: [
          { dst: ["file1"] },
          { dst: [] }
        ]
      };
      isBehindIfComponentStub.resolves(false);
      const result = await isInitialComponent("/project/root", component);
      expect(result).to.be.true;
    });
    it("should return false if the component is a storage without output files", async ()=>{
      const component = {
        type: "storage",
        outputFiles: [
          { dst: [] }
        ]
      };
      isBehindIfComponentStub.resolves(false);
      const result = await isInitialComponent("/project/root", component);
      expect(result).to.be.false;
    });
    it("should return true if the component is a source with output destinations", async ()=>{
      const component = {
        type: "source",
        outputFiles: [
          { dst: ["dest1"] }
        ]
      };
      isBehindIfComponentStub.resolves(false);
      const result = await isInitialComponent("/project/root", component);
      expect(result).to.be.true;
    });
    it("should return false if the component is a source without output destinations", async ()=>{
      const component = {
        type: "source",
        outputFiles: [
          { dst: [] }
        ]
      };
      isBehindIfComponentStub.resolves(false);
      const result = await isInitialComponent("/project/root", component);
      expect(result).to.be.false;
    });
    it("should return true if the component has no previous components and is not behind an 'if'", async ()=>{
      const component = {
        type: "task",
        previous: []
      };
      isBehindIfComponentStub.resolves(false);
      const result = await isInitialComponent("/project/root", component);
      expect(result).to.be.true;
    });
  });
  describe("#isBehindIfComponent", ()=>{
    let readComponentJsonByIDStub;

    beforeEach(()=>{
      readComponentJsonByIDStub = sinon.stub();
      rewWorkflowComponent.__set__("readComponentJsonByID", readComponentJsonByIDStub);
    });

    afterEach(()=>{
      sinon.restore();
    });

    it("should return false if the component has no previous or connected input files", async ()=>{
      const component = {
        previous: [],
        inputFiles: []
      };
      const result = await isBehindIfComponent("/project/root", component);
      expect(result).to.be.false;
    });
    it("should return true if a previous component is an 'if' component", async ()=>{
      const component = {
        previous: ["prev1"],
        inputFiles: []
      };
      readComponentJsonByIDStub.withArgs("/project/root", "prev1").resolves({ type: "if" });
      const result = await isBehindIfComponent("/project/root", component);
      expect(result).to.be.true;
    });
    it("should return true if a connected input file's source is an 'if' component", async ()=>{
      const component = {
        previous: [],
        inputFiles: [
          { src: [{ srcNode: "ifComponent" }] }
        ]
      };
      readComponentJsonByIDStub.withArgs("/project/root", "ifComponent").resolves({ type: "if" });
      const result = await isBehindIfComponent("/project/root", component);
      expect(result).to.be.true;
    });
    it("should return false if no previous or input source components are 'if' components", async ()=>{
      const component = {
        previous: ["prev1"],
        inputFiles: [
          { src: [{ srcNode: "src1" }] }
        ]
      };
      readComponentJsonByIDStub.withArgs("/project/root", "prev1").resolves({ type: "task" });
      readComponentJsonByIDStub.withArgs("/project/root", "src1").resolves({ type: "task" });
      const result = await isBehindIfComponent("/project/root", component);
      expect(result).to.be.false;
    });
    it("should handle circular dependencies gracefully", async ()=>{
      const component = {
        previous: ["prev1"],
        inputFiles: []
      };
      readComponentJsonByIDStub.withArgs("/project/root", "prev1").resolves({ type: "task", previous: ["prev2"] });
      readComponentJsonByIDStub.withArgs("/project/root", "prev2").resolves({ type: "task", previous: ["prev1"] });

      const result = await isBehindIfComponent("/project/root", component);
      expect(result).to.be.false;
    });
  });
  describe("#hasChild", ()=>{
    it("should return true for 'workflow' component", ()=>{
      const component = { type: "workflow" };
      const result = hasChild(component);
      expect(result).to.be.true;
    });
    it("should return true for 'parameterStudy' component", ()=>{
      const component = { type: "parameterStudy" };
      const result = hasChild(component);
      expect(result).to.be.true;
    });
    it("should return true for 'for' component", ()=>{
      const component = { type: "for" };
      const result = hasChild(component);
      expect(result).to.be.true;
    });
    it("should return true for 'while' component", ()=>{
      const component = { type: "while" };
      const result = hasChild(component);
      expect(result).to.be.true;
    });
    it("should return true for 'foreach' component", ()=>{
      const component = { type: "foreach" };
      const result = hasChild(component);
      expect(result).to.be.true;
    });
    it("should return true for 'stepjob' component", ()=>{
      const component = { type: "stepjob" };
      const result = hasChild(component);
      expect(result).to.be.true;
    });
    it("should return false for 'task' component", ()=>{
      const component = { type: "task" };
      const result = hasChild(component);
      expect(result).to.be.false;
    });
    it("should return false for unknown component type", ()=>{
      const component = { type: "unknownType" };
      const result = hasChild(component);
      expect(result).to.be.false;
    });
    it("should return false if type is missing", ()=>{
      const component = {};
      const result = hasChild(component);
      expect(result).to.be.false;
    });
  });
  describe("#componentFactory", ()=>{
    it("should create a Task component", ()=>{
      const component = componentFactory("task", { x: 0, y: 0 });
      expect(component).to.not.be.null;
      expect(component.type).to.equal("task");
    });
    it("should create a Workflow component", ()=>{
      const component = componentFactory("workflow", { x: 0, y: 0 });
      expect(component).to.not.be.null;
      expect(component.type).to.equal("workflow");
    });
    it("should create a ParameterStudy component", ()=>{
      const component = componentFactory("PS", { x: 0, y: 0 });
      expect(component).to.not.be.null;
      expect(component.type).to.equal("parameterStudy");
    });
    it("should create an If component", ()=>{
      const component = componentFactory("if", { x: 0, y: 0 });
      expect(component).to.not.be.null;
      expect(component.type).to.equal("if");
    });
    it("should create a For component", ()=>{
      const component = componentFactory("for", { x: 0, y: 0 });
      expect(component).to.not.be.null;
      expect(component.type).to.equal("for");
    });
    it("should create a While component", ()=>{
      const component = componentFactory("while", { x: 0, y: 0 });
      expect(component).to.not.be.null;
      expect(component.type).to.equal("while");
    });
    it("should create a Foreach component", ()=>{
      const component = componentFactory("foreach", { x: 0, y: 0 });
      expect(component).to.not.be.null;
      expect(component.type).to.equal("foreach");
    });
    it("should create a Storage component", ()=>{
      const component = componentFactory("storage", { x: 0, y: 0 });
      expect(component).to.not.be.null;
      expect(component.type).to.equal("storage");
    });
    it("should create a Source component", ()=>{
      const component = componentFactory("source", { x: 0, y: 0 });
      expect(component).to.not.be.null;
      expect(component.type).to.equal("source");
    });
    it("should create a Viewer component", ()=>{
      const component = componentFactory("viewer", { x: 0, y: 0 });
      expect(component).to.not.be.null;
      expect(component.type).to.equal("viewer");
    });
    it("should return null for unknown component type", ()=>{
      const component = componentFactory("unknownType", { x: 0, y: 0 });
      expect(component).to.be.null;
    });
  });
});
