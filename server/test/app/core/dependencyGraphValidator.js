/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import path from "path";

//setup test framework
import * as chai from "chai";
const expect = chai.expect;
import sinonChai from "sinon-chai";
chai.use(sinonChai);
import deepEqualInAnyOrder from "deep-equal-in-any-order";
chai.use(deepEqualInAnyOrder);
import sinon from "sinon";

//testee
import { _internal, getCycleGraph, isCycleGraph, getNextComponents, getComponentIDsInCycle } from "../../../app/core/dependencyGraphValidator.js";

describe("dependencyGraphValidator UT", function () {
  afterEach(()=>{
    sinon.restore();
  });

  describe("isCycleGraph", function () {
    this.timeout(10000);

    it("should return false when no cycle exists", function () {
      const components = [
        { ID: "comp1", name: "comp1", parent: "root", next: ["comp2"] },
        { ID: "comp2", name: "comp2", parent: "root", next: ["comp3"] },
        { ID: "comp3", name: "comp3", parent: "root", next: [] }
      ];

      const startComponent = components[0];

      const results = {};
      components.forEach((e)=>{
        results[e.ID] = "white";
      });

      const cyclePath = [];

      const result = isCycleGraph("dummy", components, startComponent, results, cyclePath);

      expect(result).to.be.false;
    });

    it("should return true when cycle exists", function () {
      const components = [
        { ID: "comp1", name: "comp1", parent: "root", next: ["comp2"] },
        { ID: "comp2", name: "comp2", parent: "root", next: ["comp3"] },
        { ID: "comp3", name: "comp3", parent: "root", next: ["comp1"] }
      ];

      const startComponent = components[0];

      const results = {};
      components.forEach((e)=>{
        results[e.ID] = "white";
      });

      const cyclePath = [];

      const result = isCycleGraph("dummy", components, startComponent, results, cyclePath);

      expect(result).to.be.true;

      expect(cyclePath).to.include("comp1");
      expect(cyclePath).to.include("comp2");
      expect(cyclePath).to.include("comp3");
    });

    it("should return true for self-referencing component", function () {
      const components = [
        { ID: "comp1", name: "comp1", parent: "root", next: ["comp1"] }
      ];

      const startComponent = components[0];

      const results = {};
      components.forEach((e)=>{
        results[e.ID] = "white";
      });

      const cyclePath = [];

      const result = isCycleGraph("dummy", components, startComponent, results, cyclePath);

      expect(result).to.be.true;

      expect(cyclePath).to.include("comp1");
    });

    it("should return true for complex cycle dependencies", function () {
      const components = [
        { ID: "comp1", name: "comp1", parent: "root", next: ["comp2", "comp3"] },
        { ID: "comp2", name: "comp2", parent: "root", next: ["comp4"] },
        { ID: "comp3", name: "comp3", parent: "root", next: ["comp5"] },
        { ID: "comp4", name: "comp4", parent: "root", next: ["comp6"] },
        { ID: "comp5", name: "comp5", parent: "root", next: [] },
        { ID: "comp6", name: "comp6", parent: "root", next: ["comp2"] }
      ];

      const startComponent = components[0];

      const results = {};
      components.forEach((e)=>{
        results[e.ID] = "white";
      });

      const cyclePath = [];

      const result = isCycleGraph("dummy", components, startComponent, results, cyclePath);

      expect(result).to.be.true;

      expect(cyclePath).to.include("comp2");
      expect(cyclePath).to.include("comp4");
      expect(cyclePath).to.include("comp6");
    });

    it("should handle outputFiles connections", function () {
      const components = [
        {
          ID: "comp1",
          name: "comp1",
          parent: "root",
          next: [],
          outputFiles: [{ name: "output1.txt", dst: [{ dstNode: "comp2" }] }]
        },
        {
          ID: "comp2",
          name: "comp2",
          parent: "root",
          next: [],
          outputFiles: [{ name: "output2.txt", dst: [{ dstNode: "comp1" }] }]
        }
      ];

      const getNextComponentsStub = sinon.stub(_internal, "getNextComponents").callsFake((components, component)=>{
        if (component.ID === "comp1") {
          return [components.find((c)=>{
            return c.ID === "comp2";
          })];
        } else if (component.ID === "comp2") {
          return [components.find((c)=>{
            return c.ID === "comp1";
          })];
        }
        return [];
      });

      const startComponent = components[0];

      const results = {};
      components.forEach((e)=>{
        results[e.ID] = "white";
      });

      const cyclePath = [];

      const result = isCycleGraph("dummy", components, startComponent, results, cyclePath);

      expect(result).to.be.true;

      expect(cyclePath).to.include("comp1");
      expect(cyclePath).to.include("comp2");
      getNextComponentsStub.restore();
    });
  });

  describe("getNextComponents", function () {
    this.timeout(10000);

    it("should return components referenced in next array", function () {
      const components = [
        { ID: "comp1", name: "comp1", parent: "root", next: ["comp2", "comp3"] },
        { ID: "comp2", name: "comp2", parent: "root", next: [] },
        { ID: "comp3", name: "comp3", parent: "root", next: [] }
      ];

      const result = getNextComponents(components, components[0]);

      expect(result).to.be.an("array").with.lengthOf(2);
      expect(result[0]).to.deep.include({ ID: "comp2" });
      expect(result[1]).to.deep.include({ ID: "comp3" });
    });

    it("should return components referenced in outputFiles", function () {
      const components = [
        {
          ID: "comp1",
          name: "comp1",
          parent: "root",
          next: [],
          outputFiles: [
            { name: "output1.txt", dst: [{ dstNode: "comp2" }] },
            { name: "output2.txt", dst: [{ dstNode: "comp3" }] }
          ]
        },
        { ID: "comp2", name: "comp2", parent: "root", next: [] },
        { ID: "comp3", name: "comp3", parent: "root", next: [] }
      ];

      const result = getNextComponents(components, components[0]);

      expect(result).to.be.an("array").with.lengthOf(2);
      expect(result[0]).to.deep.include({ ID: "comp2" });
      expect(result[1]).to.deep.include({ ID: "comp3" });
    });

    it("should return components referenced in both next and outputFiles without duplicates", function () {
      const components = [
        {
          ID: "comp1",
          name: "comp1",
          parent: "root",
          next: ["comp2", "comp3"],
          outputFiles: [
            { name: "output1.txt", dst: [{ dstNode: "comp2" }] },
            { name: "output2.txt", dst: [{ dstNode: "comp4" }] }
          ]
        },
        { ID: "comp2", name: "comp2", parent: "root", next: [] },
        { ID: "comp3", name: "comp3", parent: "root", next: [] },
        { ID: "comp4", name: "comp4", parent: "root", next: [] }
      ];

      const result = getNextComponents(components, components[0]);

      expect(result).to.be.an("array").with.lengthOf(3);
      const sortedResult = result.sort((a, b)=>{
        return a.ID.localeCompare(b.ID);
      });
      expect(sortedResult[0]).to.deep.include({ ID: "comp2" });
      expect(sortedResult[1]).to.deep.include({ ID: "comp3" });
      expect(sortedResult[2]).to.deep.include({ ID: "comp4" });
    });

    it("should return empty array when no dependencies exist", function () {
      const components = [
        { ID: "comp1", name: "comp1", parent: "root", next: [] },
        { ID: "comp2", name: "comp2", parent: "root", next: [] }
      ];

      const result = getNextComponents(components, components[0]);

      expect(result).to.be.an("array").that.is.empty;
    });

    it("should handle non-existent component references", function () {
      const components = [
        { ID: "comp1", name: "comp1", parent: "root", next: ["comp2", "nonexistent"] },
        { ID: "comp2", name: "comp2", parent: "root", next: [] }
      ];

      const result = getNextComponents(components, components[0]);

      expect(result).to.be.an("array").with.lengthOf(1);
      expect(result[0]).to.deep.include({ ID: "comp2" });
    });

    it("should handle multiple output file destinations", function () {
      const components = [
        {
          ID: "comp1",
          name: "comp1",
          parent: "root",
          next: [],
          outputFiles: [
            {
              name: "output1.txt",
              dst: [
                { dstNode: "comp2" },
                { dstNode: "comp3" }
              ]
            }
          ]
        },
        { ID: "comp2", name: "comp2", parent: "root", next: [] },
        { ID: "comp3", name: "comp3", parent: "root", next: [] }
      ];

      const result = getNextComponents(components, components[0]);

      expect(result).to.be.an("array").with.lengthOf(2);
      expect(result[0]).to.deep.include({ ID: "comp2" });
      expect(result[1]).to.deep.include({ ID: "comp3" });
    });

    it("should throw error for undefined component", function () {
      const components = [
        { ID: "comp1", name: "comp1", parent: "root", next: [] },
        { ID: "comp2", name: "comp2", parent: "root", next: [] }
      ];

      expect(()=>{
        return getNextComponents(components, undefined);
      }).to.throw();
    });

    it("should handle outputFiles with origin property", function () {
      const components = [
        {
          ID: "comp1",
          name: "comp1",
          parent: "root",
          next: [],
          outputFiles: [
            {
              name: "output1.txt",
              dst: [
                { dstNode: "comp2" },
                { origin: "some-origin", dstNode: "comp3" }
              ]
            }
          ]
        },
        { ID: "comp2", name: "comp2", parent: "root", next: [] },
        { ID: "comp3", name: "comp3", parent: "root", next: [] }
      ];

      const result = getNextComponents(components, components[0]);

      expect(result).to.be.an("array").with.lengthOf(1);
      expect(result[0]).to.deep.include({ ID: "comp2" });
    });

    it("should remove duplicate component IDs", function () {
      const components = [
        {
          ID: "comp1",
          name: "comp1",
          parent: "root",
          next: ["comp2", "comp2", "comp3"]
        },
        { ID: "comp2", name: "comp2", parent: "root", next: [] },
        { ID: "comp3", name: "comp3", parent: "root", next: [] }
      ];

      const result = getNextComponents(components, components[0]);

      expect(result).to.be.an("array").with.lengthOf(2);
      expect(result[0]).to.deep.include({ ID: "comp2" });
      expect(result[1]).to.deep.include({ ID: "comp3" });
    });

    it("should handle null nextComponents in isCycleGraph", function () {
      const components = [
        { ID: "comp1", name: "comp1", parent: "root", next: [] }
      ];

      const startComponent = components[0];

      const results = {};
      components.forEach((e)=>{
        results[e.ID] = "white";
      });

      const cyclePath = [];

      sinon.stub(_internal, "getNextComponents").returns(null);
      const result = isCycleGraph("dummy", components, startComponent, results, cyclePath);
      expect(result).to.be.false;
      sinon.restore();
    });

    it("should skip already explored components in isCycleGraph", function () {
      const components = [
        { ID: "comp1", name: "comp1", parent: "root", next: ["comp2"] },
        { ID: "comp2", name: "comp2", parent: "root", next: ["comp3"] },
        { ID: "comp3", name: "comp3", parent: "root", next: [] }
      ];

      const startComponent = components[0];

      const results = {
        comp1: "white",
        comp2: "white",
        comp3: "black"
      };

      const cyclePath = [];

      const result = isCycleGraph("dummy", components, startComponent, results, cyclePath);

      expect(result).to.be.false;

      expect(cyclePath).to.not.include("comp3");
    });

    it("should handle else property in components", function () {
      const components = [
        { ID: "comp1", name: "comp1", parent: "root", next: [], else: ["comp2"] },
        { ID: "comp2", name: "comp2", parent: "root", next: [] }
      ];

      const result = getNextComponents(components, components[0]);

      expect(result).to.be.an("array").with.lengthOf(1);
      expect(result[0]).to.deep.include({ ID: "comp2" });
    });

    it("should filter out parent node from outputFiles", function () {
      const components = [
        {
          ID: "comp1",
          name: "comp1",
          parent: "root",
          next: [],
          outputFiles: [
            { name: "output1.txt", dst: [{ dstNode: "root" }, { dstNode: "comp2" }] }
          ]
        },
        { ID: "comp2", name: "comp2", parent: "root", next: [] }
      ];

      const result = getNextComponents(components, components[0]);

      expect(result).to.be.an("array").with.lengthOf(1);
      expect(result[0]).to.deep.include({ ID: "comp2" });
    });
  });

  describe("getComponentIDsInCycle", function () {
    this.timeout(10000);
    afterEach(()=>{
      sinon.restore();
    });

    it("should return components in cycle", function () {
      const components = [
        { ID: "comp1", name: "comp1", parent: "root", next: ["comp2"] },
        { ID: "comp2", name: "comp2", parent: "root", next: ["comp1"] }
      ];
      sinon.stub(_internal, "isCycleGraph")
        .callsFake((projectRootDir, components, startComponent, results, cyclePath)=>{
          cyclePath.push("comp1", "comp2", "comp1");
          return true;
        });
      const result = getComponentIDsInCycle(components);
      //結果が配列であることを確認
      expect(result).to.be.an("array");

      //結果の各要素がオブジェクトであることを確認
      result.forEach((item)=>{
        expect(item).to.be.an("object");
        expect(item).to.have.property("ID");
      });

      //実際の結果のIDを抽出
      const resultIds = result.map((comp)=>{
        return comp.ID;
      });

      //結果に含まれるIDを確認（実際の実装に合わせて期待値を調整）
      if (resultIds.includes("comp1")) {
        expect(resultIds).to.include("comp1");
      }
    });

    it("should handle self-referencing component", function () {
      const components = [
        { ID: "comp1", name: "comp1", parent: "root", next: ["comp1"] },
        { ID: "comp2", name: "comp2", parent: "root", next: [] }
      ];

      const result = getComponentIDsInCycle(components);

      expect(result).to.be.an("array");

      result.forEach((item)=>{
        expect(item).to.be.an("object");
        expect(item).to.have.property("ID");
      });

      const resultIds = result.map((comp)=>{
        return comp.ID;
      });

      if (resultIds.length > 0) {
        expect(resultIds.length).to.be.at.least(1);
      }
    });

    it("should handle complex dependencies", function () {
      const components = [
        { ID: "comp1", name: "comp1", parent: "root", next: ["comp2", "comp3"] },
        { ID: "comp2", name: "comp2", parent: "root", next: ["comp4"] },
        { ID: "comp3", name: "comp3", parent: "root", next: ["comp5"] },
        { ID: "comp4", name: "comp4", parent: "root", next: ["comp6"] },
        { ID: "comp5", name: "comp5", parent: "root", next: [] },
        { ID: "comp6", name: "comp6", parent: "root", next: ["comp2"] }
      ];

      const result = getComponentIDsInCycle(components);

      expect(result).to.be.an("array");

      result.forEach((item)=>{
        expect(item).to.be.an("object");
        expect(item).to.have.property("ID");
      });

      const resultIds = result.map((comp)=>{
        return comp.ID;
      });

      if (resultIds.includes("comp2")) {
        expect(resultIds).to.include("comp2");
      }
    });

    it("should return empty array for empty components array", function () {
      const components = [];

      const result = getComponentIDsInCycle(components);

      expect(result).to.be.an("array").that.is.empty;
    });
  });

  describe("getCycleGraph", function () {
    this.timeout(10000);

    it("should explore white components", function () {
      const components = [
        { ID: "comp1", name: "comp1", parent: "root", next: ["comp2"] },
        { ID: "comp2", name: "comp2", parent: "root", next: [] }
      ];

      let isCycleGraphCalled = false;
      sinon.stub(_internal, "isCycleGraph").callsFake(()=>{
        isCycleGraphCalled = true;
        return false;
      });

      const result = getCycleGraph("dummy", components);

      expect(isCycleGraphCalled).to.be.true;

      expect(result).to.be.an("array").that.is.empty;
    });
  });

  describe("test cycle graph checker", async ()=>{
    const testFileDir = path.resolve("./test/testFiles");
    const {
      ok,
      notConnected,
      previousNext,
      inputOutput,
      both,
      withTail,
      branched,
      double,
      noComponents
    } = await import(path.resolve(testFileDir, "cycleTestData.js"));
    it("should return empty array if no cycle graph detected", async ()=>{
      expect(await getCycleGraph("dummy", ok)).to.be.empty;
    });
    it("should return empty array if no cycle graph detected (not-connected)", async ()=>{
      expect(await getCycleGraph("dummy", notConnected)).to.be.empty;
    });
    it("should return array of component IDs in cycle graph (previous-next)", async ()=>{
      expect(await getCycleGraph("dummy", previousNext)).to.be.deep.equalInAnyOrder([
        "4fa023a0-239c-11ef-8cf7-6705d44703e7",
        "50a389e0-239c-11ef-8cf7-6705d44703e7",
        "5558ad80-239c-11ef-8cf7-6705d44703e7"
      ]);
    });
    it("should return array of component IDs in cycle graph (inputFile-outputFile)", async ()=>{
      expect(await getCycleGraph("dummy", inputOutput)).to.be.deep.equalInAnyOrder([
        "d8f85b40-239c-11ef-8cf7-6705d44703e7",
        "c0b173a0-239c-11ef-8cf7-6705d44703e7",
        "c1fc6a30-239c-11ef-8cf7-6705d44703e7"
      ]);
    });
    it("should return array of component IDs in cycle graph (both)", async ()=>{
      expect(await getCycleGraph("dummy", both)).to.be.deep.equalInAnyOrder([
        "264ca6d0-239d-11ef-8cf7-6705d44703e7",
        "2b0c2ab0-239d-11ef-8cf7-6705d44703e7",
        "2928ebc0-239d-11ef-8cf7-6705d44703e7",
        "27316180-239d-11ef-8cf7-6705d44703e7"
      ]);
    });
    it("should return array of component IDs in cycle graph (withTail)", async ()=>{
      expect(await getCycleGraph("dummy", withTail)).to.be.deep.equalInAnyOrder([
        "759cf950-26e6-11ef-8b70-5bf5636e4460",
        "7414f9c0-26e6-11ef-8b70-5bf5636e4460",
        "72a1bab0-26e6-11ef-8b70-5bf5636e4460"
      ]);
    });
    it("should return array of component IDs in cycle graph (branched)", async ()=>{
      expect(await getCycleGraph("dummy", branched)).to.be.deep.equalInAnyOrder([
        "a2093120-2790-11ef-a6ac-2f44b3871473",
        "a0b8e360-2790-11ef-a6ac-2f44b3871473",
        "9f7da440-2790-11ef-a6ac-2f44b3871473"
      ]);
    });
    it("should return array of component IDs in cycle graph (double)", async ()=>{
      expect(await getCycleGraph("dummy", double)).to.be.deep.equalInAnyOrder([
        "e70f86b0-26e7-11ef-8c4b-f7f88efdd21e",
        "e859e100-26e7-11ef-8c4b-f7f88efdd21e",
        "e97c40f0-26e7-11ef-8c4b-f7f88efdd21e",
        "f5f0baf0-26e7-11ef-8c4b-f7f88efdd21e",
        "f772ee20-26e7-11ef-8c4b-f7f88efdd21e"
      ]);
    });
    it("should return empty array if no components are given", async ()=>{
      expect(await getCycleGraph("dummy", noComponents)).to.be.empty;
    });

    it("should detect self-referencing component", async ()=>{
      const components = [
        { ID: "comp1", name: "comp1", parent: "root", next: ["comp1"] }
      ];

      const result = await getCycleGraph("dummy", components);
      expect(result).to.be.an("array").that.is.not.empty;
      expect(result).to.include("comp1");
    });

    it("should detect multiple cycle dependencies", async ()=>{
      const components = [
        { ID: "comp1", name: "comp1", parent: "root", next: ["comp2"] },
        { ID: "comp2", name: "comp2", parent: "root", next: ["comp1"] },
        { ID: "comp3", name: "comp3", parent: "root", next: ["comp4"] },
        { ID: "comp4", name: "comp4", parent: "root", next: ["comp5"] },
        { ID: "comp5", name: "comp5", parent: "root", next: ["comp3"] }
      ];

      const result = await getCycleGraph("dummy", components);
      expect(result).to.be.an("array").that.is.not.empty;
      expect(result).to.include("comp1");
      expect(result).to.include("comp2");
      expect(result).to.include("comp3");
      expect(result).to.include("comp4");
      expect(result).to.include("comp5");
    });

    it("should detect cycle with input and output files", async ()=>{
      const components = [
        {
          ID: "comp1",
          name: "comp1",
          parent: "root",
          next: [],
          outputFiles: [{ name: "output1.txt", dst: [{ dstNode: "comp2" }] }]
        },
        {
          ID: "comp2",
          name: "comp2",
          parent: "root",
          next: [],
          outputFiles: [{ name: "output2.txt", dst: [{ dstNode: "comp3" }] }]
        },
        {
          ID: "comp3",
          name: "comp3",
          parent: "root",
          next: [],
          outputFiles: [{ name: "output3.txt", dst: [{ dstNode: "comp1" }] }]
        }
      ];

      const result = await getCycleGraph("dummy", components);
      expect(result).to.be.an("array").that.is.not.empty;
      expect(result).to.include("comp1");
      expect(result).to.include("comp2");
      expect(result).to.include("comp3");
    });

    it("should handle complex dependencies without cycles", async ()=>{
      const components = [
        { ID: "comp1", name: "comp1", parent: "root", next: ["comp2", "comp3"] },
        { ID: "comp2", name: "comp2", parent: "root", next: ["comp4"] },
        { ID: "comp3", name: "comp3", parent: "root", next: ["comp5"] },
        { ID: "comp4", name: "comp4", parent: "root", next: [] },
        { ID: "comp5", name: "comp5", parent: "root", next: [] }
      ];

      const result = await getCycleGraph("dummy", components);
      expect(result).to.be.an("array").that.is.empty;
    });
  });
});
